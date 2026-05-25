import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
          <span>★</span> Sahi Review
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Turn happy customers into 5★ Google reviews.
        </h1>
        <p className="text-lg text-zinc-600">
          A QR code at your counter. Happy customers post on Google.
          Unhappy ones reach you privately — before they post a bad review.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Start free trial
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-zinc-300 px-6 text-sm font-medium hover:bg-zinc-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
