import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { UserRow } from "./user-row";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const admin = createSupabaseAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name, avatar_url, phone, created_at")
    .order("created_at", { ascending: false });

  const { data: usersList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const roleById = new Map<string, string>();
  const lastSignInById = new Map<string, string | null>();
  for (const u of usersList?.users ?? []) {
    const role = (u.app_metadata?.role as string | undefined) ?? "business_owner";
    roleById.set(u.id, role);
    lastSignInById.set(u.id, u.last_sign_in_at ?? null);
  }

  const { data: tenantsRaw } = await admin
    .from("businesses")
    .select("owner_user_id, name");
  const tenantByOwner = new Map<string, string>();
  for (const b of tenantsRaw ?? []) {
    if (b.owner_user_id) tenantByOwner.set(b.owner_user_id, b.name);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-zinc-500">
          {profiles?.length ?? 0} user{(profiles?.length ?? 0) === 1 ? "" : "s"}
        </p>
      </div>

      <ul className="space-y-3 md:hidden">
        {(profiles ?? []).map((p) => (
          <UserRow
            key={p.id}
            mobile
            user={{
              id: p.id,
              email: p.email,
              full_name: p.full_name,
              avatar_url: p.avatar_url,
              role: roleById.get(p.id) ?? "business_owner",
              business: tenantByOwner.get(p.id) ?? null,
              last_sign_in_at: lastSignInById.get(p.id) ?? null,
            }}
          />
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white md:block">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Last sign-in</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(profiles ?? []).map((p) => (
              <UserRow
                key={p.id}
                user={{
                  id: p.id,
                  email: p.email,
                  full_name: p.full_name,
                  avatar_url: p.avatar_url,
                  role: roleById.get(p.id) ?? "business_owner",
                  business: tenantByOwner.get(p.id) ?? null,
                  last_sign_in_at: lastSignInById.get(p.id) ?? null,
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
