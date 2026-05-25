import Link from "next/link";
import { connection } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  await connection();
  // eslint-disable-next-line react-hooks/purity -- intentional fresh time
  const now = new Date();
  const admin = createSupabaseAdminClient();

  const [
    { data: tenants },
    { count: totalSubmissions },
    { data: payments30 },
  ] = await Promise.all([
    admin
      .from("businesses")
      .select("id, name, slug, subscription_status, plan, monthly_amount, currency, trial_ends_at, created_at"),
    admin.from("feedback").select("id", { count: "exact", head: true }),
    admin
      .from("payments")
      .select("amount, currency, created_at")
      .gte("created_at", new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()),
  ]);

  const list = tenants ?? [];
  const active = list.filter((t) => ["trial", "active"].includes(t.subscription_status));
  const paying = list.filter((t) => t.subscription_status === "active");
  const trials = list.filter((t) => t.subscription_status === "trial");

  // Trials expiring in next 7 days
  const in7Days = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const expiringSoon = trials.filter((t) => new Date(t.trial_ends_at) <= in7Days);

  // Naive MRR estimate from active paying tenants by plan
  let mrrPKR = 0;
  let mrrUSD = 0;
  for (const t of paying) {
    if (t.currency === "PKR") mrrPKR += Number(t.monthly_amount ?? 0);
    else if (t.currency === "USD") mrrUSD += Number(t.monthly_amount ?? 0);
  }

  let rev30PKR = 0;
  let rev30USD = 0;
  for (const p of payments30 ?? []) {
    if (p.currency === "PKR") rev30PKR += Number(p.amount);
    else rev30USD += Number(p.amount);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-zinc-500">Snapshot of your business right now.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active tenants" value={active.length} suffix={`/${list.length}`} />
        <Stat label="Paying" value={paying.length} />
        <Stat label="In trial" value={trials.length} highlight={expiringSoon.length > 0} />
        <Stat label="Total submissions" value={totalSubmissions ?? 0} />
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card title="Estimated MRR" subtitle="From active paying tenants">
          <div className="space-y-1">
            <div className="text-2xl font-bold">PKR {mrrPKR.toLocaleString()}</div>
            <div className="text-lg text-zinc-600">${mrrUSD.toLocaleString()}</div>
          </div>
        </Card>
        <Card title="Revenue (last 30 days)" subtitle="From recorded payments">
          <div className="space-y-1">
            <div className="text-2xl font-bold">PKR {rev30PKR.toLocaleString()}</div>
            <div className="text-lg text-zinc-600">${rev30USD.toLocaleString()}</div>
          </div>
        </Card>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 md:px-5">
          <h2 className="text-sm font-semibold">Trials expiring in 7 days</h2>
          <Link href="/admin/tenants" className="text-xs text-amber-600 hover:underline">
            All tenants →
          </Link>
        </div>
        {expiringSoon.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            Nothing in the next 7 days. 🎉
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {expiringSoon.map((t) => {
              const days = Math.max(
                0,
                Math.ceil(
                  (new Date(t.trial_ends_at).getTime() - now.getTime()) / (24 * 3600 * 1000),
                ),
              );
              return (
                <li key={t.id}>
                  <Link
                    href={`/admin/tenants/${t.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50 md:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{t.name}</div>
                      <div className="text-xs text-zinc-500 truncate">/r/{t.slug}</div>
                    </div>
                    <span
                      className={
                        days <= 2
                          ? "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                          : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                      }
                    >
                      {days === 0 ? "today" : `${days}d`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-xl border bg-white p-4 " +
        (highlight ? "border-amber-300 ring-2 ring-amber-100" : "border-zinc-200")
      }
    >
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <div className="text-2xl font-bold">{value}</div>
        {suffix && <div className="text-sm text-zinc-400">{suffix}</div>}
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="text-sm font-medium text-zinc-700">{title}</div>
      {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
      <div className="mt-3">{children}</div>
    </div>
  );
}
