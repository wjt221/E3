import { z } from "zod";
import {
  createServerSupabaseClient,
  getAuthenticatedUser,
  getUserProfile,
  verifyCompanyAccess,
} from "@/lib/db/client";
import { listArtifacts, upsertArtifact, writeAuditLog } from "@/lib/db/queries";
import {
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  hasPermission,
} from "@/lib/auth/roles";
import type { UserRole, ArtifactType } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("company_id");
  const type = searchParams.get("type") as ArtifactType | null;

  if (!companyId) return badRequestResponse("company_id required");

  const supabase = createServerSupabaseClient();

  let user;
  try {
    user = await getAuthenticatedUser(supabase);
  } catch {
    return unauthorizedResponse();
  }

  const canAccess = await verifyCompanyAccess(supabase, user.id, companyId);
  if (!canAccess) return forbiddenResponse();

  const artifacts = await listArtifacts(supabase, companyId, type ?? undefined);

  return Response.json({ artifacts });
}

const CreateArtifactSchema = z.object({
  company_id: z.string().uuid(),
  type: z.enum([
    "company_profile",
    "value_creation_thesis",
    "strategic_priorities",
    "execution_plan",
    "kpi_tree",
    "risk_register",
    "board_update",
    "meeting_summary",
    "action_item_list",
    "specialist_recommendations",
    "playbook_entry",
  ]),
  title: z.string().min(1).max(255),
  content: z.record(z.unknown()),
  source_message_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  let user;
  try {
    user = await getAuthenticatedUser(supabase);
  } catch {
    return unauthorizedResponse();
  }

  let body;
  try {
    body = CreateArtifactSchema.parse(await request.json());
  } catch (err) {
    return badRequestResponse(err instanceof Error ? err.message : "Invalid request");
  }

  const canAccess = await verifyCompanyAccess(supabase, user.id, body.company_id);
  if (!canAccess) return forbiddenResponse();

  const profile = await getUserProfile(supabase, user.id);

  if (!hasPermission(profile.role as UserRole, "artifact:write")) {
    return forbiddenResponse("Your role does not allow creating artifacts");
  }

  const artifact = await upsertArtifact(supabase, {
    companyId: body.company_id,
    type: body.type as ArtifactType,
    title: body.title,
    content: body.content,
    createdBy: user.id,
    sourceMessageId: body.source_message_id,
  });

  void writeAuditLog(supabase, {
    orgId: profile.org_id,
    companyId: body.company_id,
    userId: user.id,
    action: "create_artifact",
    resourceType: "artifact",
    resourceId: artifact.id,
    metadata: { type: body.type, title: body.title },
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
  });

  return Response.json({ artifact }, { status: 201 });
}
