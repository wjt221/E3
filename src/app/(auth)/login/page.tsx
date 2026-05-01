"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/db/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        shouldCreateUser: false, // Invite-only: users must exist
      },
    });

    if (error) {
      setError(
        error.message === "User not found"
          ? "This email is not registered. E3 is invite-only. Contact your operating partner."
          : error.message
      );
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="glass-card p-8 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-e3-900/30 border border-e3-700/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-e3-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-100 mb-2">Check your email</h2>
        <p className="text-slate-400 text-sm">
          We sent a secure sign-in link to{" "}
          <span className="text-slate-200">{email}</span>.<br />
          The link expires in 1 hour.
        </p>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          className="mt-6 text-sm text-e3-400 hover:text-e3-300 transition-colors"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 animate-fade-in">
      <h1 className="text-xl font-semibold text-slate-100 mb-1">Sign in</h1>
      <p className="text-slate-400 text-sm mb-6">
        E3 is invite-only. Enter your registered email to receive a sign-in link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ceo@yourcompany.com"
            required
            className="input-base"
            autoComplete="email"
            autoFocus
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-800/40 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="btn-primary w-full justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending link...
            </>
          ) : (
            "Send sign-in link"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-600">
        Protected by Supabase Auth · E3 Confidential
      </p>
    </div>
  );
}
