"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/db/client";

export default function LoginPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      setError(
        error.message.includes("not found") || error.message.includes("User")
          ? "This email isn't registered. E3 is invite-only — contact your operating partner."
          : error.message
      );
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <>
      {/* Background mesh */}
      <div
        className="fixed inset-0 bg-[rgb(10_14_26)]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-mesh-dark" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-48 bg-gradient-to-b from-blue-500/20 to-transparent" />
      </div>

      <div className="relative flex flex-col items-center justify-center min-h-screen p-6">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-10 animate-slide-up">
          <div className="relative mb-5">
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-2xl bg-blue-600/20 blur-xl scale-110" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-blue">
              <span className="text-white font-bold text-xl tracking-tight">E3</span>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-slate-100 tracking-tight">
            AI Operating Partner
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            by Lodestone Global
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm animate-scale-in" style={{ animationDelay: "80ms" }}>
          {sent ? (
            <SentState email={email} onReset={() => { setSent(false); setEmail(""); }} />
          ) : (
            <LoginForm
              email={email}
              setEmail={setEmail}
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        {/* Footer */}
        <p className="relative mt-10 text-xs text-slate-700 text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
          Invite-only · All data encrypted · Tenant-isolated
        </p>
      </div>
    </>
  );
}

function LoginForm({
  email, setEmail, loading, error, onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="card p-8 shadow-card-lg"
    >
      {/* Invite-only badge */}
      <div className="flex items-center gap-2 mb-6">
        <span className="badge-blue text-[10px] px-2 py-0.5 tracking-wide uppercase">
          Invite only
        </span>
      </div>

      <h2 className="text-xl font-semibold text-slate-100 mb-1 tracking-tight">
        Welcome back
      </h2>
      <p className="text-sm text-slate-500 mb-7">
        Enter your registered email to sign in.
      </p>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ceo@yourcompany.com"
            required
            autoFocus
            autoComplete="email"
            className="input text-sm"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg bg-red-950/30 border border-red-900/40 px-3.5 py-3 text-sm text-red-400 animate-slide-up">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="btn-primary w-full py-2.5 text-sm font-medium"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending link…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Continue with email
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="relative mt-7 mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[rgb(30_41_70)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[rgb(14_20_38)] px-3 text-xs text-slate-600">
            secured by
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
        <svg className="w-3.5 h-3.5 text-green-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Supabase Auth · Zero-knowledge · SOC 2
      </div>
    </form>
  );
}

function SentState({ email, onReset }: { email: string; onReset: () => void }) {
  return (
    <div className="card p-8 text-center shadow-card-lg animate-scale-in">
      <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-900/20 border border-blue-800/30 mb-5 mx-auto">
        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {/* Ping */}
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500">
          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
        </span>
      </div>

      <h2 className="text-lg font-semibold text-slate-100 mb-2 tracking-tight">
        Check your inbox
      </h2>
      <p className="text-sm text-slate-500 leading-relaxed mb-1">
        We sent a secure sign-in link to
      </p>
      <p className="text-sm font-medium text-slate-300 mb-6">
        {email}
      </p>

      <div className="rounded-lg bg-[rgb(20_28_52)] border border-[rgb(30_41_70)] px-4 py-3 text-xs text-slate-500 mb-6">
        The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
      </div>

      <button
        onClick={onReset}
        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        Use a different email →
      </button>
    </div>
  );
}
