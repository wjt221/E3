import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type {
  Artifact,
  ArtifactType,
  AgentMode,
  SourceReference,
} from "@/types";

type Supabase = SupabaseClient<Database>;

// =============================================================================
// CONVERSATIONS
// =============================================================================

export async function getOrCreateConversation(
  supabase: Supabase,
  companyId: string,
  userId: string,
  conversationId: string | null,
  mode: AgentMode
) {
  if (conversationId) {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("company_id", companyId) // tenant isolation double-check
      .single();

    if (!error && data) return data;
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({ company_id: companyId, user_id: userId, mode })
    .select()
    .single();

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return data;
}

export async function listConversations(
  supabase: Supabase,
  companyId: string,
  limit = 20
) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to list conversations: ${error.message}`);
  return data ?? [];
}

export async function getConversationMessages(
  supabase: Supabase,
  conversationId: string,
  companyId: string // always pass for tenant isolation
) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("company_id", companyId) // tenant isolation double-check
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to get messages: ${error.message}`);
  return data ?? [];
}

export async function saveMessage(
  supabase: Supabase,
  params: {
    conversationId: string;
    companyId: string;
    role: "user" | "assistant";
    content: string;
    sources?: SourceReference[];
    toolCalls?: unknown[];
    mode?: AgentMode;
  }
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      company_id: params.companyId,
      role: params.role,
      content: params.content,
      sources: (params.sources ?? []) as unknown as Database["public"]["Tables"]["messages"]["Insert"]["sources"],
      tool_calls: params.toolCalls
        ? (params.toolCalls as unknown as Database["public"]["Tables"]["messages"]["Insert"]["tool_calls"])
        : null,
      mode: params.mode ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save message: ${error.message}`);
  return data;
}

// =============================================================================
// ARTIFACTS
// =============================================================================

export async function listArtifacts(
  supabase: Supabase,
  companyId: string,
  type?: ArtifactType
) {
  let query = supabase
    .from("artifacts")
    .select("*")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list artifacts: ${error.message}`);
  return (data ?? []) as Artifact[];
}

export async function getArtifact(
  supabase: Supabase,
  artifactId: string,
  companyId: string
) {
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("id", artifactId)
    .eq("company_id", companyId) // tenant isolation double-check
    .single();

  if (error) throw new Error(`Artifact not found: ${error.message}`);
  return data as Artifact;
}

export async function upsertArtifact(
  supabase: Supabase,
  params: {
    companyId: string;
    type: ArtifactType;
    title: string;
    content: unknown;
    createdBy: string;
    sourceMessageId?: string;
  }
): Promise<Artifact> {
  // Find existing artifact of this type for this company to increment version
  const { data: existing } = await supabase
    .from("artifacts")
    .select("id, version")
    .eq("company_id", params.companyId)
    .eq("type", params.type)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const version = existing ? existing.version + 1 : 1;

  const { data, error } = await supabase
    .from("artifacts")
    .insert({
      company_id: params.companyId,
      type: params.type,
      title: params.title,
      content: params.content as Database["public"]["Tables"]["artifacts"]["Insert"]["content"],
      version,
      created_by: params.createdBy,
      source_message_id: params.sourceMessageId ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create artifact: ${error.message}`);
  return data as Artifact;
}

// =============================================================================
// ACTION ITEMS
// =============================================================================

export async function listActionItems(
  supabase: Supabase,
  companyId: string,
  status?: string
) {
  let query = supabase
    .from("action_items")
    .select("*")
    .eq("company_id", companyId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list action items: ${error.message}`);
  return data ?? [];
}

export async function createActionItems(
  supabase: Supabase,
  companyId: string,
  items: Array<{
    title: string;
    owner?: string;
    dueDate?: string;
    priority?: string;
    notes?: string;
    sourceMessageId?: string;
  }>
) {
  const rows = items.map((item) => ({
    company_id: companyId,
    title: item.title,
    owner: item.owner ?? null,
    due_date: item.dueDate ?? null,
    priority: item.priority ?? "medium",
    notes: item.notes ?? null,
    source_message_id: item.sourceMessageId ?? null,
  }));

  const { data, error } = await supabase
    .from("action_items")
    .insert(rows)
    .select();

  if (error) throw new Error(`Failed to create action items: ${error.message}`);
  return data ?? [];
}

// =============================================================================
// DOCUMENT RETRIEVAL (RAG)
// =============================================================================

export async function retrieveRelevantChunks(
  supabase: Supabase,
  companyId: string,
  queryText: string,
  queryEmbedding: number[] | null,
  limit = 8
): Promise<Array<{ content: string; metadata: unknown; similarity?: number }>> {
  if (queryEmbedding) {
    // Vector similarity search
    const { data, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_company_id: companyId,
      match_threshold: 0.65,
      match_count: limit,
    });

    if (!error && data && data.length > 0) {
      return data.map((chunk) => ({
        content: chunk.content,
        metadata: chunk.metadata,
        similarity: chunk.similarity,
      }));
    }
  }

  // Fallback: full-text search
  const { data, error } = await supabase.rpc("search_document_chunks_fts", {
    query_text: queryText,
    match_company_id: companyId,
    match_count: limit,
  });

  if (error) {
    console.error("FTS search failed:", error.message);
    return [];
  }

  return (data ?? []).map((chunk) => ({
    content: chunk.content,
    metadata: chunk.metadata,
    similarity: chunk.rank,
  }));
}

export async function getCompanyContext(
  supabase: Supabase,
  companyId: string
): Promise<{
  company: Database["public"]["Tables"]["companies"]["Row"] | null;
  latestProfile: Artifact | null;
}> {
  const [{ data: company }, profileResult] = await Promise.all([
    supabase.from("companies").select("*").eq("id", companyId).single(),
    supabase
      .from("artifacts")
      .select("*")
      .eq("company_id", companyId)
      .eq("type", "company_profile")
      .order("version", { ascending: false })
      .limit(1)
      .single(),
  ]);

  return {
    company: company ?? null,
    latestProfile: profileResult.data ? (profileResult.data as Artifact) : null,
  };
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

export async function writeAuditLog(
  supabase: Supabase,
  params: {
    orgId: string;
    companyId?: string;
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }
) {
  const { error } = await supabase.from("audit_logs").insert({
    org_id: params.orgId,
    company_id: params.companyId ?? null,
    user_id: params.userId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId ?? null,
    metadata: params.metadata ?? null,
    ip_address: params.ipAddress ?? null,
  });

  // Audit log failures should never crash the request — log and continue
  if (error) {
    console.error("Audit log write failed:", error.message);
  }
}
