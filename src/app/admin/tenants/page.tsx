import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

export default async function TenantsList({ searchParams }: Props) {
  const { status, q } = await searchParams;
  const admin = createSupabaseAdminClient();

  let query = admin
    .from("businesses")
    .select(
      "id, name, slug, subscription_status, plan, monthly_amount, currency, trial_ends_at, subscription_started_at, subscription_ends_at, created_at, owner_user_id",
    )
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("subscription_status", status);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data: tenants } = await query;
  const list = tenants ?? [];

  const ownerIds = Array.from(
    new Set(list.map((t) => t.owner_user_id).filter(Boolean)),
  ) as string[];
  const profileById = new Map<string, { email: string; full_name: string | null }>();
  if (ownerIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", ownerIds);
    for (const p of profiles ?? []) {
      profileById.set(p.id, { email: p.email, full_name: p.full_name });
    }
  }

  const { data: statsRaw } = await admin
    .from("admin_feedback_stats")
    .select("business_id");
  const submissionsByBiz = new Map<string, number>();
  for (const s of statsRaw ?? []) {
    submissionsByBiz.set(s.business_id, (submissionsByBiz.get(s.business_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-sm text-zinc-500">
            {list.length} business{list.length === 1 ? "" : "es"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip href="/admin/tenants" label="All" active={!status || status === "all"} />
        <FilterChip href="/admin/tenants?status=trial" label="Trial" active={status === "trial"} />
        <FilterChip href="/admin/tenants?status=active" label="Active" active={status === "active"} />
        <FilterChip href="/admin/tenants?status=paused" label="Paused" active={status === "paused"} />
        <FilterChip
          href="/admin/tenants?status=cancelled"
          label="Cancelled"
          active={status === "cancelled"}
        />
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {list.map((t) => {
          const owner = t.owner_user_id ? profileById.get(t.owner_user_id) : undefined;
          return (
            <li key={t.id}>
              <Link
                href={`/admin/tenants/${t.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{t.name}</div>
                    <div className="text-xs text-zinc-500 truncate">/r/{t.slug}</div>
                  </div>
                  <StatusBadge status={t.subscription_status} />
                </div>
                <div className="mt-3 space-y-1 text-xs text-zinc-600">
                  {owner?.full_name && (
                    <div className="truncate">
                      <span className="text-zinc-400">Owner:</span> {owner.full_name}
                    </div>
                  )}
                  <div className="truncate">
                    <span className="text-zinc-400">Email:</span> {owner?.email ?? "—"}
                  </div>
                  <SubscriptionLine
                    status={t.subscription_status}
                    trialEndsAt={t.trial_ends_at}
                    startedAt={t.subscription_started_at}
                    endsAt={t.subscription_ends_at}
                  />
                  <div>
                    <span className="text-zinc-400">Submissions:</span>{" "}
                    {submissionsByBiz.get(t.id) ?? 0}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white md:block">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Renews / Ends</th>
              <th className="px-4 py-3">Submissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list.map((t) => {
              const owner = t.owner_user_id ? profileById.get(t.owner_user_id) : undefined;
              return (
                <tr
                  key={t.id}
                  className="cursor-pointer hover:bg-zinc-50"
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/tenants/${t.id}`} className="block">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-zinc-500">/r/{t.slug}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {owner?.full_name && (
                      <div className="font-medium text-zinc-900">{owner.full_name}</div>
                    )}
                    <div className="text-xs text-zinc-500">{owner?.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {t.plan === "local_pkr" ? "PK" : "Intl"}
                    {t.monthly_amount && (
                      <div className="text-zinc-400">
                        {t.currency} {Number(t.monthly_amount).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.subscription_status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {t.subscription_started_at
                      ? new Date(t.subscription_started_at).toLocaleDateString()
                      : new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <EndsCell
                      status={t.subscription_status}
                      trialEndsAt={t.trial_ends_at}
                      endsAt={t.subscription_ends_at}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {submissionsByBiz.get(t.id) ?? 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="p-12 text-center text-sm text-zinc-500">
            No tenants match these filters.
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3 py-1.5 text-xs font-medium transition " +
        (active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300")
      }
    >
      {label}
    </Link>
  );
}

function SubscriptionLine({
  status,
  trialEndsAt,
  startedAt,
  endsAt,
}: {
  status: string;
  trialEndsAt: string;
  startedAt: string | null;
  endsAt: string | null;
}) {
  if (status === "trial") {
    return (
      <div>
        <span className="text-zinc-400">Trial ends:</span>{" "}
        {new Date(trialEndsAt).toLocaleDateString()}
      </div>
    );
  }
  if (status === "active" && endsAt) {
    return (
      <>
        {startedAt && (
          <div>
            <span className="text-zinc-400">Started:</span>{" "}
            {new Date(startedAt).toLocaleDateString()}
          </div>
        )}
        <div>
          <span className="text-zinc-400">Renews:</span>{" "}
          {new Date(endsAt).toLocaleDateString()}
        </div>
      </>
    );
  }
  return null;
}

function EndsCell({
  status,
  trialEndsAt,
  endsAt,
}: {
  status: string;
  trialEndsAt: string;
  endsAt: string | null;
}) {
  if (status === "trial") {
    return (
      <div>
        <div className="text-zinc-500">Trial ends</div>
        <div className="text-zinc-700">{new Date(trialEndsAt).toLocaleDateString()}</div>
      </div>
    );
  }
  if (status === "active" && endsAt) {
    return (
      <div>
        <div className="text-zinc-500">Renews</div>
        <div className="text-zinc-700">{new Date(endsAt).toLocaleDateString()}</div>
      </div>
    );
  }
  return <div className="text-zinc-400">—</div>;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    {
      trial: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      paused: "bg-zinc-200 text-zinc-700",
      cancelled: "bg-red-100 text-red-700",
    }[status] ?? "bg-zinc-100 text-zinc-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>
  );
}
