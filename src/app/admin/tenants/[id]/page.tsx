import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { TenantActions } from "./tenant-actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function TenantDetail({ params }: Props) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: business } = await admin
    .from("businesses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!business) notFound();

  let owner: { email: string; full_name: string | null } | null = null;
  if (business.owner_user_id) {
    const { data } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", business.owner_user_id)
      .maybeSingle();
    owner = data;
  }

  const { data: payments } = await admin
    .from("payments")
    .select("*")
    .eq("business_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: subCount } = await admin
    .from("admin_feedback_stats")
    .select("id", { count: "exact", head: true })
    .eq("business_id", id);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/tenants"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← All tenants
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{business.name}</h1>
        <div className="text-sm text-zinc-500">
          /r/{business.slug} · Created{" "}
          {new Date(business.created_at).toLocaleDateString()}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <InfoCard label="Status">
          <StatusBadge status={business.subscription_status} />
        </InfoCard>
        <InfoCard label="Plan">
          <div className="font-semibold">
            {business.plan === "local_pkr" ? "Local (PKR)" : "International (USD)"}
          </div>
          {business.monthly_amount && (
            <div className="text-sm text-zinc-500">
              {business.currency} {Number(business.monthly_amount).toLocaleString()} / mo
            </div>
          )}
        </InfoCard>
        <InfoCard label="Submissions">
          <div className="text-2xl font-bold">{subCount ?? 0}</div>
        </InfoCard>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <InfoCard label="Owner">
          {owner?.full_name && (
            <div className="font-semibold">{owner.full_name}</div>
          )}
          <div className="text-sm text-zinc-600">{owner?.email ?? "—"}</div>
        </InfoCard>
        <InfoCard label="Subscription started">
          <div className="font-semibold">
            {business.subscription_started_at
              ? new Date(business.subscription_started_at).toLocaleDateString()
              : "—"}
          </div>
          <div className="text-xs text-zinc-500">
            {business.subscription_started_at ? "First payment" : "Not yet started"}
          </div>
        </InfoCard>
        <InfoCard
          label={business.subscription_status === "trial" ? "Trial ends" : "Renews on"}
        >
          <div className="font-semibold">
            {business.subscription_status === "trial"
              ? new Date(business.trial_ends_at).toLocaleDateString()
              : business.subscription_ends_at
                ? new Date(business.subscription_ends_at).toLocaleDateString()
                : "—"}
          </div>
          {(business.subscription_status === "trial" ||
            business.subscription_ends_at) && (
            <div className="text-xs text-zinc-500">
              {Math.ceil(
                (new Date(
                  business.subscription_status === "trial"
                    ? business.trial_ends_at
                    : business.subscription_ends_at!,
                ).getTime() -
                  Date.now()) /
                  (24 * 3600 * 1000),
              )}{" "}
              days from now
            </div>
          )}
        </InfoCard>
      </section>

      <TenantActions
        tenant={{
          id: business.id,
          status: business.subscription_status,
          plan: business.plan,
          trialEndsAt: business.trial_ends_at,
          monthlyAmount: business.monthly_amount,
          currency: business.currency,
        }}
      />

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-3">
          <h2 className="text-sm font-semibold">Payment history</h2>
        </div>
        {payments && payments.length > 0 ? (
          <ul className="divide-y divide-zinc-100">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {p.currency} {Number(p.amount).toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {p.method.replace("_", " ")} ·{" "}
                    {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs text-zinc-500">
                  {new Date(p.period_start).toLocaleDateString()} →{" "}
                  {new Date(p.period_end).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-sm text-zinc-500">
            No payments recorded yet.
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
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
    <span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${cls}`}>
      {status}
    </span>
  );
}
