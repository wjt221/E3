"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/db/client";
import { cn, initials } from "@/lib/utils";
import type { UserRole } from "@/types";

interface SidebarProps {
  userProfile: {
    id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
  };
  companies: Array<{ id: string; name: string; industry: string | null; stage: string | null }>;
  currentCompanyId?: string;
}

const ROLE_META: Record<UserRole, { label: string; color: string }> = {
  super_admin:       { label: "Admin",             color: "badge-purple" },
  operating_partner: { label: "Op. Partner",       color: "badge-blue"  },
  ceo:               { label: "CEO",               color: "badge-blue"  },
  domain_specialist: { label: "Specialist",        color: "badge-amber" },
  board_member:      { label: "Board",             color: "badge-slate" },
};

const NAV = [
  {
    id: "chat",
    label: "AI Operating Partner",
    href: (id: string) => `/dashboard/${id}/chat`,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: "plan",
    label: "Execution Plan",
    href: (id: string) => `/dashboard/${id}/plan`,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "artifacts",
    label: "Artifacts",
    href: (id: string) => `/dashboard/${id}/artifacts`,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

export function Sidebar({ userProfile, companies, currentCompanyId }: SidebarProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [showCompanies, setShowCompanies] = useState(false);
  const [signingOut, setSigningOut]       = useState(false);

  const supabase      = createBrowserSupabaseClient();
  const currentCo     = companies.find((c) => c.id === currentCompanyId);
  const displayName   = userProfile.full_name ?? userProfile.email.split("@")[0] ?? "User";
  const roleMeta      = ROLE_META[userProfile.role];

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="flex flex-col w-[220px] border-r border-[rgb(30_41_70)] bg-[rgb(10_14_26)] shrink-0 overflow-hidden">

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[rgb(30_41_70)] shrink-0">
        <div className="relative w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shrink-0 shadow-glow-sm">
          <span className="text-white font-bold text-sm">E3</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-100 leading-tight">E3</p>
          <p className="text-[10px] text-slate-600 leading-tight truncate">AI Operating Partner</p>
        </div>
      </div>

      {/* ── Company selector ── */}
      <div className="px-2 pt-3 pb-2 border-b border-[rgb(30_41_70)]">
        <button
          onClick={() => setShowCompanies(!showCompanies)}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors duration-100 text-left",
            showCompanies
              ? "bg-[rgb(20_28_52)]"
              : "hover:bg-[rgb(20_28_52)]"
          )}
        >
          {/* Company avatar */}
          <div className="w-6 h-6 rounded bg-[rgb(20_28_52)] border border-[rgb(44_58_95)] flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-slate-300">
              {currentCo?.name.charAt(0).toUpperCase() ?? "·"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate leading-tight">
              {currentCo?.name ?? "Select company"}
            </p>
            {currentCo?.industry && (
              <p className="text-[10px] text-slate-600 truncate leading-tight mt-0.5">
                {currentCo.industry}
              </p>
            )}
          </div>
          <svg
            className={cn("w-3 h-3 text-slate-600 shrink-0 transition-transform duration-200", showCompanies && "rotate-180")}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {showCompanies && companies.length > 0 && (
          <div className="mt-1 space-y-0.5 animate-slide-up">
            {companies.map((co) => (
              <Link
                key={co.id}
                href={`/dashboard/${co.id}/chat`}
                onClick={() => setShowCompanies(false)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors duration-100",
                  co.id === currentCompanyId
                    ? "bg-blue-900/20 text-blue-300"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[rgb(20_28_52)]"
                )}
              >
                <div className="w-4 h-4 rounded bg-[rgb(28_38_68)] flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-semibold">{co.name.charAt(0)}</span>
                </div>
                <span className="truncate">{co.name}</span>
                {co.id === currentCompanyId && (
                  <svg className="w-3 h-3 ml-auto shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {currentCompanyId &&
          NAV.map((item) => {
            const href     = item.href(currentCompanyId);
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={item.id}
                href={href}
                className={cn("nav-item", isActive && "nav-item-active")}
              >
                <span className={cn("shrink-0", isActive ? "text-blue-400" : "text-slate-600")}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
      </nav>

      {/* ── Divider ── */}
      <div className="mx-3 border-t border-[rgb(30_41_70)]" />

      {/* ── User profile ── */}
      <div className="px-2 py-3 shrink-0">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600/40 to-blue-900/40 border border-blue-800/40 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-blue-300">
              {initials(displayName)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate leading-tight">
              {displayName}
            </p>
            <span className={cn("text-[10px] inline-block mt-0.5", roleMeta.color)}>
              {roleMeta.label}
            </span>
          </div>
        </div>

        <button
          onClick={signOut}
          disabled={signingOut}
          className="w-full flex items-center gap-2 px-2 py-1.5 mt-0.5 rounded-lg text-xs
                     text-slate-600 hover:text-slate-400 hover:bg-[rgb(20_28_52)]
                     transition-colors duration-100"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
