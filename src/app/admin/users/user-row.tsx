"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "../actions";

type User = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  business: string | null;
  last_sign_in_at: string | null;
};

export function UserRow({ user, mobile = false }: { user: User; mobile?: boolean }) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [isPending, start] = useTransition();

  function toggleRole() {
    const next = role === "admin" ? "business_owner" : "admin";
    if (next === "admin" && !confirm(`Make ${user.email} an admin?`)) return;
    if (next === "business_owner" && !confirm(`Demote ${user.email}? They'll lose admin access.`))
      return;
    start(async () => {
      const res = await setUserRole(user.id, next);
      if (res.ok) {
        setRole(next);
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  }

  const initials = (user.full_name || user.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const avatar = user.avatar_url ? (
    <Image
      src={user.avatar_url}
      alt=""
      width={36}
      height={36}
      className="h-9 w-9 rounded-full object-cover"
      unoptimized
    />
  ) : (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600">
      {initials}
    </div>
  );

  if (mobile) {
    return (
      <li className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-start gap-3">
          {avatar}
          <div className="min-w-0 flex-1">
            {user.full_name && (
              <div className="font-medium truncate">{user.full_name}</div>
            )}
            <div className="text-xs text-zinc-500 truncate">{user.email}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RoleBadge role={role} />
              {user.business && (
                <span className="text-xs text-zinc-500">· {user.business}</span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleRole}
          disabled={isPending}
          className="mt-3 h-11 w-full rounded-lg border border-zinc-300 bg-white text-sm font-semibold hover:bg-zinc-50 disabled:opacity-60"
        >
          {isPending ? "…" : role === "admin" ? "Demote to owner" : "Promote to admin"}
        </button>
      </li>
    );
  }

  return (
    <tr className="hover:bg-zinc-50/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {avatar}
          <div className="min-w-0">
            {user.full_name && (
              <div className="font-medium truncate">{user.full_name}</div>
            )}
            <div className="text-xs text-zinc-500 truncate">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-zinc-600">{user.business ?? "—"}</td>
      <td className="px-4 py-3">
        <RoleBadge role={role} />
      </td>
      <td className="px-4 py-3 text-zinc-500">
        {user.last_sign_in_at
          ? new Date(user.last_sign_in_at).toLocaleDateString()
          : "—"}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={toggleRole}
          disabled={isPending}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 disabled:opacity-60"
        >
          {isPending ? "…" : role === "admin" ? "Demote" : "Promote"}
        </button>
      </td>
    </tr>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={
        "rounded-full px-2 py-0.5 text-xs font-medium " +
        (isAdmin ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-700")
      }
    >
      {isAdmin ? "Admin" : "Owner"}
    </span>
  );
}
