import { z } from "zod";
import {
  createServerSupabaseClient,
  getAuthenticatedUser,
  getUserProfile,
} from "@/lib/db/client";
import { writeAuditLog } from "@/lib/db/queries";
import {
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  hasPermission,
} from "@/lib/auth/roles";
import type { UserRole } from "@/types";

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();

  let user;
  try {
    user = await getAuthenticatedUser(supabase);
  } catch {
    return unauthorizedResponse();
  }

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, industry, stage, description, employee_count, revenue_range")
    .order("name");

  return Response.json({ companies: companies ?? [] });
}

const CreateCompanySchema = z.object({
  name: z.string().min(1).max(255),
  industry: z.string().max(100).optional(),
  stage: z
    .enum(["pre_revenue", "early_stage", "growth", "scale", "mature"])
    .optional(),
  website: z.string().url().optional(),
  description: z.string().max(2000).optional(),
  employee_count: z.number().int().positive().optional(),
  revenue_range: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  let user;
  try {
    user = await getAuthenticatedUser(supabase);
  } catch {
    return unauthorizedResponse();
  }

  const profile = await getUserProfile(supabase, user.id);

  if (!hasPermission(profile.role as UserRole, "company:admin")) {
    return forbiddenResponse("Only administrators can create company workspaces");
  }

  let body;
  try {
    body = CreateCompanySchema.parse(await request.json());
  } catch (err) {
    return badRequestResponse(err instanceof Error ? err.message : "Invalid request");
  }

  const { data: company, error } = await supabase
    .from("companies")
    .insert({ ...body, org_id: profile.org_id })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  void writeAuditLog(supabase, {
    orgId: profile.org_id,
    companyId: company!.id,
    userId: user.id,
    action: "create_company",
    resourceType: "company",
    resourceId: company!.id,
    metadata: { name: body.name },
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
  });

  return Response.json({ company }, { status: 201 });
}
