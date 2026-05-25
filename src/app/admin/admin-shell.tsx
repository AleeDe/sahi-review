"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: "▦" },
  { href: "/admin/tenants", label: "Tenants", icon: "▢" },
  { href: "/admin/users", label: "Users", icon: "☺" },
  { href: "/admin/payments", label: "Payments", icon: "₨" },
  { href: "/admin/invite", label: "Invite tenant", icon: "+" },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-1">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden">
        <Link href="/admin" className="flex items-center gap-1.5 text-amber-500">
          <span className="text-lg">★</span>
          <span className="font-semibold text-zinc-900">Sahi Review</span>
          <span className="ml-1 rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Admin
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
            <DrawerNav pathname={pathname} onNavigate={() => setOpen(false)} />
            <div className="mt-auto pt-4 border-t border-zinc-100">
              <p className="px-3 text-xs text-zinc-500 truncate">{email}</p>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="mt-2 w-full rounded-lg px-3 py-3 text-left text-sm text-zinc-600 hover:bg-zinc-100"
                >
                  Sign out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="relative hidden w-60 shrink-0 border-r border-zinc-200 bg-zinc-50 md:flex md:flex-col">
        <Link href="/admin" className="flex items-center gap-1.5 px-6 py-5 text-amber-500">
          <span className="text-lg">★</span>
          <span className="font-semibold text-zinc-900">Sahi Review</span>
          <span className="ml-1 rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Admin
          </span>
        </Link>
        <nav className="flex-1 space-y-0.5 px-3 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-zinc-700 hover:bg-zinc-200/60",
                isActive(pathname, item.href) && "bg-zinc-200 font-medium text-zinc-900",
              )}
            >
              <span className="w-4 text-center text-zinc-400">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-zinc-200">
          <p className="px-2 text-xs text-zinc-500 truncate">{email}</p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="mt-2 w-full rounded-lg px-2 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-200/60"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 px-4 pt-20 pb-10 md:px-8 md:pt-8 md:pb-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
          🔒 Customer feedback content is private to each business.
        </div>
        {children}
      </main>
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

function DrawerNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <nav className="mt-6 flex-1 space-y-1 text-sm">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-3 text-zinc-700 hover:bg-zinc-100",
            isActive(pathname, item.href) && "bg-zinc-100 font-medium text-zinc-900",
          )}
        >
          <span className="w-4 text-center text-zinc-400">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
