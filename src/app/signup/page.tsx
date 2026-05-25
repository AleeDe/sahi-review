import Link from "next/link";
import { AuthForm } from "../(auth)/auth-form";
import { GoogleButton } from "../(auth)/google-button";

type Props = { searchParams: Promise<{ redirect?: string; error?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const { redirect, error } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 text-amber-500">
            <span className="text-xl">★</span>
            <span className="font-semibold">Sahi Review</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-500">Free 15-day trial — no card required.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {decodeURIComponent(error)}
          </div>
        )}

        <GoogleButton redirect={redirect} label="Sign up with Google" />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-200" />
          <span className="text-xs text-zinc-400">or</span>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <AuthForm mode="signup" redirect={redirect} />

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
            className="font-medium text-amber-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
