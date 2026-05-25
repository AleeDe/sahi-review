"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { suffix: "", label: "Overview", icon: "▦" },
  { suffix: "/submissions", label: "Submissions", icon: "✉" },
  { suffix: "/qr", label: "QR Code", icon: "▣" },
  { suffix: "/settings", label: "Settings", icon: "⚙" },
];

export function DashboardShell({
  slug,
  businessName,
  isAdmin,
  trialBanner,
  children,
}: {
  slug: string;
  businessName: string;
  isAdmin: boolean;
  trialBanner: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const base = `/dashboard/${slug}`;

  return (
    <div className="flex min-h-screen flex-1">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden">
        <Link href={base} className="flex items-center gap-1.5 text-amber-500">
          <span className="text-lg">★</span>
          <span className="font-semibold text-zinc-900 truncate max-w-[180px]">
            {businessName}
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-zinc-100"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-500">
                <span className="text-lg">★</span>
                <span className="font-semibold text-zinc-900">Sahi Review</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>
            <div className="mt-1 text-xs text-zinc-500">{businessName}</div>
            <nav className="mt-6 flex-1 space-y-1 text-sm">
              {SECTIONS.map((s) => {
                const href = base + s.suffix;
                return (
                  <Link
                    key={s.suffix}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-zinc-700 hover:bg-zinc-100",
                      isSectionActive(pathname, href, s.suffix) &&
                        "bg-zinc-100 font-medium text-zinc-900",
                    )}
                  >
                    <span className="w-4 text-center text-zinc-400">{s.icon}</span>
                    <span>{s.label}</span>
                  </Link>
                );
              })}
              {isAdmin && (
                <>
                  <div className="mt-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    Admin
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-zinc-700 hover:bg-zinc-100"
                  >
                    <span className="w-4 text-center text-zinc-400">▢</span>
                    <span>Tenants</span>
                  </Link>
                </>
              )}
            </nav>
            <form action="/auth/signout" method="post" className="border-t border-zinc-100 pt-3">
              <button
                type="submit"
                className="w-full rounded-lg px-3 py-3 text-left text-sm text-zinc-600 hover:bg-zinc-100"
              >
                Sign out
              </button>
            </form>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="relative hidden w-60 shrink-0 border-r border-zinc-200 bg-zinc-50 md:flex md:flex-col">
        <Link href={base} className="flex items-center gap-1.5 px-6 py-5 text-amber-500">
          <span className="text-lg">★</span>
          <span className="font-semibold text-zinc-900">Sahi Review</span>
        </Link>
        <div className="px-6 text-xs text-zinc-500 truncate">{businessName}</div>

        <nav className="mt-6 flex-1 space-y-0.5 px-3 text-sm">
          {SECTIONS.map((s) => {
            const href = base + s.suffix;
            return (
              <Link
                key={s.suffix}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-zinc-200/60",
                  isSectionActive(pathname, href, s.suffix) &&
                    "bg-zinc-200 font-medium text-zinc-900",
                )}
              >
                <span className="w-4 text-center text-zinc-400">{s.icon}</span>
                <span>{s.label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <>
              <div className="mt-4 px-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Admin
              </div>
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-zinc-200/60"
              >
                <span className="w-4 text-center text-zinc-400">▢</span>
                <span>Tenants</span>
              </Link>
            </>
          )}
        </nav>

        <form action="/auth/signout" method="post" className="border-t border-zinc-200 p-4">
          <button
            type="submit"
            className="w-full rounded-lg px-2 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-200/60"
          >
            Sign out
          </button>
        </form>
      </aside>

      <main className="flex-1 px-4 pt-20 pb-10 md:px-8 md:pt-8 md:pb-10">
        {trialBanner}
        {children}
      </main>
    </div>
  );
}

function isSectionActive(pathname: string, href: string, suffix: string) {
  if (suffix === "") return pathname === href;
  return pathname.startsWith(href);
}
