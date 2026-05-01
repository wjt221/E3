import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { AuthenticationError } from "./client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component — handled by middleware
        }
      },
    },
  });
}

export function createServiceSupabaseClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations");
  }
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getAuthenticatedUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthenticationError("Not authenticated");
  }

  return user;
}

export async function getUserProfile(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new AuthenticationError("User profile not found");
  }

  return data;
}

export async function verifyCompanyAccess(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  companyId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("company_id, role")
    .eq("id", userId)
    .single();

  if (!profile) return false;

  if (profile.role === "super_admin") {
    const { data: company } = await supabase
      .from("companies")
      .select("org_id")
      .eq("id", companyId)
      .single();

    const { data: orgProfile } = await supabase
      .from("user_profiles")
      .select("org_id")
      .eq("id", userId)
      .single();

    return company?.org_id === orgProfile?.org_id;
  }

  if (profile.company_id === companyId) return true;

  const { data: access } = await supabase
    .from("user_company_access")
    .select("id")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .single();

  return !!access;
}

export { AuthenticationError, AuthorizationError } from "./client";
