import {
  createServerSupabaseClient,
  getAuthenticatedUser,
  verifyCompanyAccess,
} from "@/lib/db/server";
import { getArtifact } from "@/lib/db/queries";
import {
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  notFoundResponse,
} from "@/lib/auth/roles";

interface Props {
  params: { id: string };
}

export async function GET(request: Request, { params }: Props) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("company_id");

  if (!companyId) return badRequestResponse("company_id required");

  const supabase = await createServerSupabaseClient();

  let user;
  try {
    user = await getAuthenticatedUser(supabase);
  } catch {
    return unauthorizedResponse();
  }

  const canAccess = await verifyCompanyAccess(supabase, user.id, companyId);
  if (!canAccess) return forbiddenResponse();

  try {
    const artifact = await getArtifact(supabase, params.id, companyId);
    return Response.json({ artifact });
  } catch {
    return notFoundResponse("Artifact not found");
  }
}
