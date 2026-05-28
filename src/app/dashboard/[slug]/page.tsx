import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusinessBySlug } from "@/lib/supabase/cached";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function DashboardOverview({ params }: Props) {
  await connection();
  // eslint-disable-next-line react-hooks/purity -- intentional time-based query in dynamic RSC
  const now = Date.now();
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();
  const supabase = await createSupabaseServerClient();

  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: monthRows },
    { count: weekCount },
    { count: totalCount },
    { data: recent },
  ] = await Promise.all([
    supabase
      .from("feedback")
      .select("rating, redirected_to_google")
      .eq("business_id", business.id)
      .gte("created_at", monthAgo),
    supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("created_at", weekAgo),
    supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("feedback")
      .select("id, rating, comment, customer_name, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const ratings = monthRows ?? [];
  const avg =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
      : 0;
  const positive = ratings.filter((r) => r.rating >= 4).length;
  const conversion =
    ratings.length > 0 ? Math.round((positive / ratings.length) * 100) : 0;
  const sentToGoogle = ratings.filter((r) => r.redirected_to_google).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-zinc-500">Your last 30 days at a glance.</p>
      </div>

      <SubscriptionCard
        status={business.subscription_status}
        plan={business.plan}
        monthlyAmount={business.monthly_amount}
        currency={business.currency}
        trialEndsAt={business.trial_ends_at}
        startedAt={business.subscription_started_at}
        endsAt={business.subscription_ends_at}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Avg rating (30d)" value={avg > 0 ? avg.toFixed(1) : "—"} suffix="★" />
        <Stat label="Submissions this week" value={weekCount ?? 0} />
        <Stat label="Total submissions" value={totalCount ?? 0} />
        <Stat label="Sent to Google (30d)" value={sentToGoogle} suffix={`/${ratings.length}`} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-1 text-sm font-medium text-zinc-600">Conversion to Google</div>
        <div className="text-3xl font-bold">{conversion}%</div>
        <p className="mt-1 text-xs text-zinc-500">
          Share of your 30-day feedback that was 4★ or higher.
        </p>
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Latest submissions</h2>
          <Link
            href={`/dashboard/${business.slug}/submissions`}
            className="text-sm text-amber-600 hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {recent && recent.length > 0 ? (
            <ul className="divide-y divide-zinc-100">
              {recent.map((r) => (
                <li key={r.id} className="flex items-start gap-4 p-4">
                  <Stars rating={r.rating} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{r.customer_name}</div>
                    {r.comment && (
                      <p className="mt-0.5 truncate text-sm text-zinc-600">{r.comment}</p>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-sm text-zinc-500">
              No submissions yet. Print your QR code and put it at your counter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">
        {value}
        {suffix && (
          <span className="ml-0.5 text-base font-medium text-zinc-400">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function SubscriptionCard({
  status,
  plan,
  monthlyAmount,
  currency,
  trialEndsAt,
  startedAt,
  endsAt,
}: {
  status: string;
  plan: string;
  monthlyAmount: number | null;
  currency: string | null;
  trialEndsAt: string;
  startedAt: string | null;
  endsAt: string | null;
}) {
  const isTrial = status === "trial";
  const isActive = status === "active";
  const isPaused = status === "paused" || status === "cancelled";

  const targetDate = isTrial ? trialEndsAt : endsAt;
  const daysLeft = targetDate
    ? Math.ceil(
        (new Date(targetDate).getTime() - Date.now()) / (24 * 3600 * 1000),
      )
    : null;

  const cardCls = isPaused
    ? "border-red-200 bg-red-50"
    : isTrial && daysLeft !== null && daysLeft <= 3
      ? "border-amber-300 bg-amber-50"
      : "border-zinc-200 bg-white";

  return (
    <div className={`rounded-xl border p-5 ${cardCls}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Subscription
            </span>
            <StatusBadge status={status} />
          </div>
          <div className="mt-1 text-lg font-semibold">
            {plan === "local_pkr" ? "Local plan" : "International plan"}
            {monthlyAmount && currency && (
              <span className="ml-2 text-sm font-normal text-zinc-500">
                {currency} {Number(monthlyAmount).toLocaleString()} / mo
              </span>
            )}
          </div>
        </div>
        {daysLeft !== null && (
          <div className="text-right">
            <div className="text-2xl font-bold">{Math.max(0, daysLeft)}</div>
            <div className="text-xs text-zinc-500">
              {isTrial ? "days left in trial" : "days until renewal"}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {isActive && startedAt && (
          <div>
            <div className="text-xs text-zinc-500">Started</div>
            <div className="font-medium">
              {new Date(startedAt).toLocaleDateString()}
            </div>
          </div>
        )}
        {(isTrial || (isActive && endsAt)) && (
          <div>
            <div className="text-xs text-zinc-500">
              {isTrial ? "Trial ends" : "Renews on"}
            </div>
            <div className="font-medium">
              {new Date(isTrial ? trialEndsAt : endsAt!).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {isPaused && (
        <p className="mt-3 text-sm text-red-700">
          Your account is {status}. Submissions to your QR will not be saved. Contact
          support to reactivate.
        </p>
      )}
      {isTrial && daysLeft !== null && daysLeft <= 5 && (
        <p className="mt-3 text-sm text-amber-800">
          Your trial ends soon. Contact us to keep your service running.
        </p>
      )}
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
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex shrink-0 text-amber-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "" : "text-zinc-200"}>
          ★
        </span>
      ))}
    </div>
  );
}
