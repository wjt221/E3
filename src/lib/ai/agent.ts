import Anthropic from "@anthropic-ai/sdk";
import type { AgentMode, SourceReference, ArtifactType } from "@/types";
import {
  buildSystemPrompt,
  buildCompanyContextString,
  buildRetrievedContextString,
  detectMode,
} from "./prompts";
import { AGENT_TOOLS } from "./tools";
import type {
  CreateArtifactInput,
  ExtractActionItemsInput,
  AddRiskInput,
  UpdateCompanyProfileInput,
} from "./tools";

// =============================================================================
// E3 AI Operating Partner — Core Agent
// =============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8192;

export interface AgentInput {
  userMessage: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  companyId: string;
  userId: string;
  currentMode: AgentMode;
  companyContext: {
    company: {
      name: string;
      industry: string | null;
      stage: string | null;
      description: string | null;
      employee_count: number | null;
      revenue_range: string | null;
    } | null;
    latestProfile: { content: unknown; version: number } | null;
  };
  retrievedChunks: Array<{
    content: string;
    metadata: unknown;
    similarity?: number;
    document_id?: string;
  }>;
}

export interface AgentOutput {
  textContent: string;
  mode: AgentMode;
  sources: SourceReference[];
  toolCalls: ToolCallResult[];
  conversationId?: string;
}

export interface ToolCallResult {
  toolName: string;
  toolInput: unknown;
  result: ToolExecutionResult;
}

export interface ToolExecutionResult {
  type: "artifact" | "action_items" | "risks" | "company_update" | "clarification" | "error";
  data: unknown;
  artifactId?: string;
}

// Server-Sent Event helpers
export function encodeSSE(event: string, data: unknown): string {
  return `data: ${JSON.stringify({ event, data })}\n\n`;
}

// =============================================================================
// STREAMING AGENT
// Returns a ReadableStream of SSE events
// =============================================================================

export async function runStreamingAgent(
  input: AgentInput,
  onToolCall: (toolName: string, toolInput: unknown) => Promise<ToolExecutionResult>
): Promise<ReadableStream<Uint8Array>> {
  const detectedMode = detectMode(input.userMessage, input.currentMode);
  const companyContextStr = buildCompanyContextString(
    input.companyContext.company,
    input.companyContext.latestProfile as Parameters<typeof buildCompanyContextString>[1]
  );
  const retrievedContextStr = buildRetrievedContextString(input.retrievedChunks);
  const systemPrompt = buildSystemPrompt(detectedMode, companyContextStr, retrievedContextStr);

  const messages: Anthropic.MessageParam[] = [
    ...input.conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: input.userMessage },
  ];

  const sources: SourceReference[] = input.retrievedChunks
    .filter((c): c is typeof c & { document_id: string } => !!c.document_id)
    .map((chunk, i) => {
      const meta = chunk.metadata as Record<string, unknown>;
      return {
        document_id: chunk.document_id,
        document_name: (meta?.document_name as string) ?? `Document ${i + 1}`,
        chunk_index: (meta?.chunk_index as number) ?? 0,
        relevance_score: chunk.similarity ?? 0,
      };
    });

  const encoder = new TextEncoder();
  const toolCallResults: ToolCallResult[] = [];
  let fullTextContent = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Emit mode detection
        controller.enqueue(
          encoder.encode(encodeSSE("mode_detected", { mode: detectedMode }))
        );

        // Emit sources
        if (sources.length > 0) {
          controller.enqueue(encoder.encode(encodeSSE("sources", { sources })));
        }

        let continueLoop = true;
        let currentMessages = [...messages];

        while (continueLoop) {
          // Stream from Claude
          const response = await anthropic.messages.create({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: systemPrompt,
            messages: currentMessages,
            tools: AGENT_TOOLS,
            stream: true,
          });

          let accumulatedText = "";
          let stopReason: string | null = null;
          const toolUseBlocks: Anthropic.ToolUseBlock[] = [];

          for await (const event of response) {
            if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                accumulatedText += event.delta.text;
                fullTextContent += event.delta.text;
                controller.enqueue(
                  encoder.encode(encodeSSE("text_delta", { text: event.delta.text }))
                );
              }
            } else if (event.type === "message_delta") {
              stopReason = event.delta.stop_reason ?? null;
            } else if (event.type === "content_block_stop") {
              // No-op
            } else if (event.type === "message_start") {
              // No-op
            }
          }

          // Collect non-streaming response for tool use
          // We need the full message to get tool_use blocks
          if (stopReason === "tool_use") {
            const fullResponse = await anthropic.messages.create({
              model: MODEL,
              max_tokens: MAX_TOKENS,
              system: systemPrompt,
              messages: currentMessages,
              tools: AGENT_TOOLS,
            });

            for (const block of fullResponse.content) {
              if (block.type === "tool_use") {
                toolUseBlocks.push(block);
              } else if (block.type === "text" && block.text) {
                // Text may have come via streaming already
              }
            }

            if (toolUseBlocks.length === 0) {
              continueLoop = false;
              continue;
            }

            // Execute tools
            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const toolBlock of toolUseBlocks) {
              controller.enqueue(
                encoder.encode(
                  encodeSSE("tool_start", {
                    tool_name: toolBlock.name,
                    tool_id: toolBlock.id,
                  })
                )
              );

              try {
                const result = await onToolCall(
                  toolBlock.name,
                  toolBlock.input
                );

                toolCallResults.push({
                  toolName: toolBlock.name,
                  toolInput: toolBlock.input,
                  result,
                });

                // Notify client of tool completion
                controller.enqueue(
                  encoder.encode(
                    encodeSSE("tool_complete", {
                      tool_name: toolBlock.name,
                      tool_id: toolBlock.id,
                      result,
                    })
                  )
                );

                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolBlock.id,
                  content: JSON.stringify(result),
                });
              } catch (err) {
                const errMsg = err instanceof Error ? err.message : "Tool execution failed";
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolBlock.id,
                  content: `Error: ${errMsg}`,
                  is_error: true,
                });
              }
            }

            // Continue conversation with tool results
            currentMessages = [
              ...currentMessages,
              {
                role: "assistant" as const,
                content: fullResponse.content,
              },
              {
                role: "user" as const,
                content: toolResults,
              },
            ];
          } else {
            // end_turn or other stop
            continueLoop = false;
          }
        }

        // Emit done
        controller.enqueue(
          encoder.encode(
            encodeSSE("done", {
              mode: detectedMode,
              sources,
              tool_calls: toolCallResults,
              text_length: fullTextContent.length,
            })
          )
        );

        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Agent error";
        console.error("[Agent] Error:", message);
        controller.enqueue(
          encoder.encode(encodeSSE("error", { message, code: "AGENT_ERROR" }))
        );
        controller.close();
      }
    },
  });

  return stream;
}

// =============================================================================
// TOOL HANDLERS
// Called by the API route, which has access to the DB client
// =============================================================================

export async function buildToolHandler(
  companyId: string,
  userId: string,
  conversationId: string,
  db: {
    upsertArtifact: (params: {
      companyId: string;
      type: ArtifactType;
      title: string;
      content: unknown;
      createdBy: string;
      sourceMessageId?: string;
    }) => Promise<{ id: string }>;
    createActionItems: (
      companyId: string,
      items: Array<{
        title: string;
        owner?: string;
        dueDate?: string;
        priority?: string;
        notes?: string;
        sourceMessageId?: string;
      }>
    ) => Promise<unknown>;
    createRisks: (
      companyId: string,
      risks: AddRiskInput["risks"]
    ) => Promise<unknown>;
    updateCompany: (
      companyId: string,
      updates: UpdateCompanyProfileInput["updates"]
    ) => Promise<unknown>;
  }
): Promise<(toolName: string, toolInput: unknown) => Promise<ToolExecutionResult>> {
  return async (toolName: string, toolInput: unknown): Promise<ToolExecutionResult> => {
    switch (toolName) {
      case "create_artifact": {
        const input = toolInput as CreateArtifactInput;
        const artifact = await db.upsertArtifact({
          companyId,
          type: input.type as ArtifactType,
          title: input.title,
          content: { ...input.content, type: input.type },
          createdBy: userId,
        });
        return {
          type: "artifact",
          data: { artifact_id: artifact.id, type: input.type, title: input.title },
          artifactId: artifact.id,
        };
      }

      case "extract_action_items": {
        const input = toolInput as ExtractActionItemsInput;
        const items = input.items.map((item) => ({
          title: item.title,
          owner: item.owner,
          dueDate: item.due_date ?? undefined,
          priority: item.priority,
          notes: item.notes,
        }));
        await db.createActionItems(companyId, items);
        return {
          type: "action_items",
          data: { count: items.length, items },
        };
      }

      case "add_risk": {
        const input = toolInput as AddRiskInput;
        await db.createRisks(companyId, input.risks);
        return {
          type: "risks",
          data: { count: input.risks.length },
        };
      }

      case "update_company_profile": {
        const input = toolInput as UpdateCompanyProfileInput;
        await db.updateCompany(companyId, input.updates);
        return {
          type: "company_update",
          data: { updated_fields: Object.keys(input.updates) },
        };
      }

      case "ask_clarifying_question": {
        return {
          type: "clarification",
          data: toolInput,
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  };
}

// =============================================================================
// EMBEDDING (for RAG)
// =============================================================================

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const voyageApiKey = process.env.VOYAGE_API_KEY;

  if (!voyageApiKey) {
    return null; // Fall back to FTS
  }

  try {
    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${voyageApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "voyage-3-lite",
        input: text.slice(0, 4000), // Voyage context limit
      }),
    });

    if (!response.ok) {
      console.error("Voyage API error:", response.statusText);
      return null;
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
    };
    return data.data[0]?.embedding ?? null;
  } catch (err) {
    console.error("Embedding generation failed:", err);
    return null;
  }
}

// =============================================================================
// DOCUMENT CHUNKING
// =============================================================================

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const cleanText = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  if (cleanText.length <= CHUNK_SIZE) {
    return [cleanText];
  }

  // Split by paragraphs first
  const paragraphs = cleanText.split(/\n\n+/);
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > CHUNK_SIZE && currentChunk) {
      chunks.push(currentChunk.trim());
      // Overlap: keep the last bit of the previous chunk
      const words = currentChunk.split(" ");
      const overlapWords = words.slice(-Math.floor(CHUNK_OVERLAP / 5));
      currentChunk = overlapWords.join(" ") + " " + paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
