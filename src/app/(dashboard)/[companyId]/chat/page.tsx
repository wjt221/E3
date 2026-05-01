import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/client";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ArtifactPanel } from "@/components/artifacts/ArtifactPanel";
import type { Artifact, UserRole } from "@/types";

interface Props {
  params: { companyId: string };
  searchParams: { conversation?: string };
}

export default async function ChatPage({ params, searchParams }: Props) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch company + user profile in parallel
  const [{ data: company }, { data: profile }, { data: artifacts }, { data: conversations }] =
    await Promise.all([
      supabase
        .from("companies")
        .select("id, name, industry, stage, description")
        .eq("id", params.companyId)
        .single(),
      supabase
        .from("user_profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single(),
      supabase
        .from("artifacts")
        .select("id, type, title, version, created_at, updated_at")
        .eq("company_id", params.companyId)
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("conversations")
        .select("id, title, mode, updated_at")
        .eq("company_id", params.companyId)
        .order("updated_at", { ascending: false })
        .limit(30),
    ]);

  // Fetch messages for current conversation if any
  let initialMessages: Array<{ id: string; role: string; content: string; mode: string | null; sources: unknown; created_at: string }> = [];
  const conversationId = searchParams.conversation;

  if (conversationId) {
    const { data: messages } = await supabase
      .from("messages")
      .select("id, role, content, mode, sources, created_at")
      .eq("conversation_id", conversationId)
      .eq("company_id", params.companyId)
      .order("created_at", { ascending: true });

    initialMessages = messages ?? [];
  }

  return (
    <div className="flex h-full">
      {/* Main chat area */}
      <div className="flex-1 min-w-0">
        <ChatInterface
          companyId={params.companyId}
          companyName={company?.name ?? "Company"}
          userId={user.id}
          userRole={(profile?.role ?? "ceo") as UserRole}
          initialConversationId={conversationId ?? null}
          initialMessages={initialMessages as Parameters<typeof ChatInterface>[0]["initialMessages"]}
          conversations={(conversations ?? []) as Parameters<typeof ChatInterface>[0]["conversations"]}
        />
      </div>

      {/* Artifact panel */}
      <div className="hidden lg:block w-96 border-l border-slate-800/60 overflow-y-auto">
        <ArtifactPanel
          companyId={params.companyId}
          artifacts={(artifacts ?? []) as Artifact[]}
        />
      </div>
    </div>
  );
}
