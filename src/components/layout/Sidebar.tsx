"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/db/client";
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

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  super_admin: "bg-purple-900/30 text-purple-300 border-purple-800/40",
  operating_partner: "bg-blue-900/30 text-blue-300 border-blue-800/40",
  ceo: "bg-e3-900/30 text-e3-300 border-e3-800/40",
  domain_specialist: "bg-amber-900/30 text-amber-300 border-amber-800/40",
  board_member: "bg-slate-800/60 text-slate-300 border-slate-700/40",
};

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  operating_partner: "Operating Partner",
  ceo: "CEO",
  domain_specialist: "Specialist",
  board_member: "Board Member",
};

export function Sidebar({ userProfile, companies, currentCompanyId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  const supabase = createBrowserSupabaseClient();

  const currentCompany = companies.find((c) => c.id === currentCompanyId);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  const navItems = currentCompanyId
    ? [
        {
          href: `/dashboard/${currentCompanyId}/chat`,
          label: "AI Operating Partner",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          ),
        },
        {
          href: `/dashboard/${currentCompanyId}/artifacts`,
          label: "Artifacts",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          href: `/dashboard/${currentCompanyId}/plan`,
          label: "Execution Plan",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
        },
      ]
    : [];

  return (
    <div className="flex flex-col w-64 border-r border-slate-800/60 bg-slate-950/80 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800/60">
        <div className="w-8 h-8 rounded-lg bg-e3-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">E3</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-100 truncate">E3</p>
          <p className="text-xs text-slate-500 truncate">AI Operating Partner</p>
        </div>
      </div>

      {/* Company selector */}
      <div className="px-3 py-3 border-b border-slate-800/40">
        <button
          onClick={() => setCompanyOpen(!companyOpen)}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left"
        >
          <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-slate-300">
              {currentCompany?.name.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {currentCompany?.name ?? "Select company"}
            </p>
            {currentCompany?.industry && (
              <p className="text-xs text-slate-500 truncate">{currentCompany.industry}</p>
            )}
          </div>
          <svg
            className={`w-3.5 h-3.5 text-slate-500 transition-transform ${companyOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {companyOpen && companies.length > 1 && (
          <div className="mt-1 space-y-0.5 animate-fade-in">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/dashboard/${company.id}/chat`}
                onClick={() => setCompanyOpen(false)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                  company.id === currentCompanyId
                    ? "bg-e3-900/30 text-e3-300"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center shrink-0">
                  <span className="text-xs">{company.name.charAt(0)}</span>
                </div>
                <span className="truncate">{company.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? "sidebar-item-active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-slate-800/60">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-slate-300">
              {(userProfile.full_name ?? userProfile.email).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">
              {userProfile.full_name ?? userProfile.email}
            </p>
            <span
              className={`inline-block text-[10px] px-1.5 py-0.5 rounded border mt-0.5 ${
                ROLE_BADGE_COLORS[userProfile.role]
              }`}
            >
              {ROLE_LABELS[userProfile.role]}
            </span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full mt-1 flex items-center gap-2 px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );
}
