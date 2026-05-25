"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = { mode: "signin" | "signup"; redirect?: string };

export function AuthForm({ mode, redirect }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });
        if (error) {
          setError(error.message);
          return;
        }
        // If email confirmation is enabled, session is null and user must confirm.
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setInfo("Check your inbox to confirm your email, then sign in.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
          return;
        }
      }
      router.push(redirect ?? "/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="block h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="block h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          placeholder={mode === "signup" ? "At least 8 characters" : ""}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && (
        <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {info}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="h-11 w-full rounded-lg bg-zinc-900 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending
          ? mode === "signup"
            ? "Creating account…"
            : "Signing in…"
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </button>
    </form>
  );
}
