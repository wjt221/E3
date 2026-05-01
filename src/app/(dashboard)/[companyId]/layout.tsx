import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/db/server";
import { verifyCompanyAccess } from "@/lib/db/server";

interface Props {
  children: React.ReactNode;
  params: { companyId: string };
}

export default async function CompanyLayout({ children, params }: Props) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Tenant isolation: verify this user can access this company
  const canAccess = await verifyCompanyAccess(supabase, user.id, params.companyId);
  if (!canAccess) {
    notFound();
  }

  return <>{children}</>;
}
