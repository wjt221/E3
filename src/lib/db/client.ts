import { createServerClient, createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

// Server-side client — uses session cookie, respects RLS
export function createServerSupabaseClient() {
  const cookieStore = cookies();
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

// Service role client — bypasses RLS, only for admin operations
// NEVER expose this to the client or return its data directly to users without re-authorization
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

// Browser client — for client components
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Helper: get authenticated user from server context, throws if unauthenticated
export async function getAuthenticatedUser(
  supabase: ReturnType<typeof createServerSupabaseClient>
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

// Helper: get user profile with role
export async function getUserProfile(
  supabase: ReturnType<typeof createServerSupabaseClient>,
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

// Helper: verify user has access to a specific company
export async function verifyCompanyAccess(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  companyId: string
): Promise<boolean> {
  // Check direct company assignment
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("company_id, role")
    .eq("id", userId)
    .single();

  if (!profile) return false;

  // super_admin has access to all companies in their org
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

  // Direct company assignment
  if (profile.company_id === companyId) return true;

  // Check explicit access grant
  const { data: access } = await supabase
    .from("user_company_access")
    .select("id")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .single();

  return !!access;
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}
