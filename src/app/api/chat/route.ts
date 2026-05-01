import { z } from "zod";
import {
  createServerSupabaseClient,
  getAuthenticatedUser,
  getUserProfile,
  verifyCompanyAccess,
} from "@/lib/db/server";
import {
  getOrCreateConversation,
  getConversationMessages,
  saveMessage,
  retrieveRelevantChunks,
  getCompanyContext,
  writeAuditLog,
  createActionItems,
  upsertArtifact,
} from "@/lib/db/queries";
import {
  runStreamingAgent,
  buildToolHandler,
  generateEmbedding,
} from "@/lib/ai/agent";
import {
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
} from "@/lib/auth/roles";
import type { AgentMode, ArtifactType } from "@/types";
import type { AddRiskInput, UpdateCompanyProfileInput } from "@/lib/ai/tools";

const ChatRequestSchema = z.object({
  company_id: z.string().uuid(),
  conversation_id: z.string().uuid().nullable(),
  message: z.string().min(1).max(32000),
  mode: z
    .enum(["learn", "diagnose", "plan", "cadence", "board_prep", "specialists", "playbook"])
    .optional()
    .default("learn"),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  // 1. Authenticate
  let user;
  try {
    user = await getAuthenticatedUser(supabase);
  } catch {
    return unauthorizedResponse();
  }

  // 2. Parse and validate request
  let body;
  try {
    body = ChatRequestSchema.parse(await request.json());
  } catch (err) {
    return badRequestResponse(
      err instanceof Error ? err.message : "Invalid request"
    );
  }

  // 3. Verify company access — tenant isolation enforcement
  const canAccess = await verifyCompanyAccess(supabase, user.id, body.company_id);
  if (!canAccess) {
    return forbiddenResponse("You do not have access to this company workspace.");
  }

  // 4. Get user profile for role/org info
  let profile;
  try {
    profile = await getUserProfile(supabase, user.id);
  } catch {
    return unauthorizedResponse("User profile not found");
  }

  // 5. Get or create conversation
  const conversation = await getOrCreateConversation(
    supabase,
    body.company_id,
    user.id,
    body.conversation_id,
    body.mode as AgentMode
  );

  // 6. Fetch conversation history (last 20 messages for context window)
  const historyRows = await getConversationMessages(
    supabase,
    conversation.id,
    body.company_id
  );

  const conversationHistory = historyRows
    .slice(-20)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // 7. Save the user message
  const userMessage = await saveMessage(supabase, {
    conversationId: conversation.id,
    companyId: body.company_id,
    role: "user",
    content: body.message,
    mode: body.mode as AgentMode,
  });

  // 8. Generate embedding + retrieve relevant context
  const queryEmbedding = await generateEmbedding(body.message);
  const chunks = await retrieveRelevantChunks(
    supabase,
    body.company_id,
    body.message,
    queryEmbedding
  );

  // 9. Get company context
  const companyContext = await getCompanyContext(supabase, body.company_id);

  // 10. Build tool handler (database operations bound to this company/user)
  const toolHandler = await buildToolHandler(
    body.company_id,
    user.id,
    conversation.id,
    {
      upsertArtifact: async (params) => {
        const artifact = await upsertArtifact(supabase, params);
        await writeAuditLog(supabase, {
          orgId: profile.org_id,
          companyId: body.company_id,
          userId: user.id,
          action: "create_artifact",
          resourceType: "artifact",
          resourceId: artifact.id,
          metadata: { type: params.type, title: params.title },
          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        });
        return artifact;
      },
      createActionItems: async (companyId, items) => {
        return createActionItems(supabase, companyId, items);
      },
      createRisks: async (companyId, risks) => {
        const rows = (risks as AddRiskInput["risks"]).map((r) => ({
          company_id: companyId,
          category: r.category,
          description: r.description,
          likelihood: r.likelihood,
          impact: r.impact,
          owner: r.owner ?? null,
          mitigation: r.mitigation ?? null,
        }));
        const { error } = await supabase.from("risks").insert(rows);
        if (error) throw new Error(error.message);
        return rows;
      },
      updateCompany: async (companyId, updates) => {
        const { error } = await supabase
          .from("companies")
          .update(updates as UpdateCompanyProfileInput["updates"])
          .eq("id", companyId);
        if (error) throw new Error(error.message);
      },
    }
  );

  // 11. Run streaming agent
  let agentStream;
  try {
    agentStream = await runStreamingAgent(
      {
        userMessage: body.message,
        conversationHistory,
        companyId: body.company_id,
        userId: user.id,
        currentMode: (conversation.mode as AgentMode) ?? "learn",
        companyContext,
        retrievedChunks: chunks.map((c) => ({
          content: c.content,
          metadata: c.metadata,
          similarity: c.similarity,
          document_id: undefined,
        })),
      },
      toolHandler
    );
  } catch (err) {
    console.error("[Chat API] Agent error:", err);
    return Response.json({ error: "Agent failed to start" }, { status: 500 });
  }

  // 12. Audit log
  void writeAuditLog(supabase, {
    orgId: profile.org_id,
    companyId: body.company_id,
    userId: user.id,
    action: "chat_message",
    resourceType: "conversation",
    resourceId: conversation.id,
    metadata: {
      message_id: userMessage.id,
      mode: body.mode,
      rag_chunks: chunks.length,
    },
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
  });

  // 13. Stream response — save assistant message in background via transform stream
  let fullAssistantText = "";
  let assistantSources: unknown[] = [];

  const transform = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);

      // Accumulate text for saving to DB
      try {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split("\n\n").filter(Boolean);
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const json = JSON.parse(line.slice(6)) as { event: string; data: unknown };
            if (json.event === "text_delta") {
              const data = json.data as { text: string };
              fullAssistantText += data.text;
            }
            if (json.event === "sources") {
              const data = json.data as { sources: unknown[] };
              assistantSources = data.sources;
            }
          }
        }
      } catch {
        // parse errors in transform are non-fatal
      }
    },
    flush() {
      // Save assistant message when stream completes
      void saveMessage(supabase, {
        conversationId: conversation.id,
        companyId: body.company_id,
        role: "assistant",
        content: fullAssistantText,
        sources: assistantSources as import("@/types").SourceReference[],
        mode: body.mode as AgentMode,
      }).catch((err) => {
        console.error("[Chat API] Failed to save assistant message:", err);
      });
    },
  });

  return new Response(agentStream.pipeThrough(transform), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Conversation-Id": conversation.id,
    },
  });
}
