import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-zinc-500">
          This business isn&apos;t set up on Sahi Review yet — or the link is wrong.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
