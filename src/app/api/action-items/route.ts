import { z } from "zod";
import {
  createServerSupabaseClient,
  getAuthenticatedUser,
  verifyCompanyAccess,
} from "@/lib/db/client";
import { listActionItems } from "@/lib/db/queries";
import {
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
} from "@/lib/auth/roles";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("company_id");
  const status = searchParams.get("status") ?? undefined;

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

  const items = await listActionItems(supabase, companyId, status);
  return Response.json({ action_items: items });
}

const UpdateActionItemSchema = z.object({
  status: z.enum(["open", "in_progress", "done", "blocked"]).optional(),
  notes: z.string().max(2000).optional(),
  due_date: z.string().optional(),
});

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const companyId = searchParams.get("company_id");

  if (!id || !companyId) return badRequestResponse("id and company_id required");

  const supabase = createServerSupabaseClient();

  let user;
  try {
    user = await getAuthenticatedUser(supabase);
  } catch {
    return unauthorizedResponse();
  }

  const canAccess = await verifyCompanyAccess(supabase, user.id, companyId);
  if (!canAccess) return forbiddenResponse();

  let updates;
  try {
    updates = UpdateActionItemSchema.parse(await request.json());
  } catch (err) {
    return badRequestResponse(err instanceof Error ? err.message : "Invalid request");
  }

  // Tenant isolation: verify item belongs to this company before updating
  const { data: item, error } = await supabase
    .from("action_items")
    .update(updates)
    .eq("id", id)
    .eq("company_id", companyId) // tenant isolation
    .select()
    .single();

  if (error) return badRequestResponse(error.message);

  return Response.json({ action_item: item });
}
