import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusinessBySlug } from "@/lib/supabase/cached";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ rating?: string; days?: string }>;
};

export default async function Submissions({ params, searchParams }: Props) {
  await connection();
  const { slug } = await params;
  const { rating, days } = await searchParams;
  const ratingFilter = rating ? parseInt(rating, 10) : null;
  const daysFilter = days ? parseInt(days, 10) : null;

  const business = await getBusinessBySlug(slug);
  if (!business) notFound();
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("feedback")
    .select("id, rating, comment, customer_name, redirected_to_google, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const base = `/dashboard/${slug}/submissions`;

  if (ratingFilter) query = query.eq("rating", ratingFilter);
  if (daysFilter) {
    // eslint-disable-next-line react-hooks/purity -- intentional time-based query in dynamic RSC
    const now = Date.now();
    const since = new Date(now - daysFilter * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", since);
  }

  const { data: rows } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submissions</h1>
        <p className="text-sm text-zinc-500">
          {rows?.length ?? 0} result{(rows?.length ?? 0) === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-500">Rating:</span>
        <FilterChip href={base} label="All" active={!ratingFilter} />
        {[5, 4, 3, 2, 1].map((n) => (
          <FilterChip
            key={n}
            href={`${base}?rating=${n}${daysFilter ? `&days=${daysFilter}` : ""}`}
            label={`${n}★`}
            active={ratingFilter === n}
          />
        ))}
        <span className="ml-4 text-xs font-medium text-zinc-500">Range:</span>
        <FilterChip
          href={ratingFilter ? `${base}?rating=${ratingFilter}` : base}
          label="All time"
          active={!daysFilter}
        />
        {[7, 30, 90].map((d) => (
          <FilterChip
            key={d}
            href={`${base}?days=${d}${ratingFilter ? `&rating=${ratingFilter}` : ""}`}
            label={`${d}d`}
            active={daysFilter === d}
          />
        ))}
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {(rows ?? []).map((r) => (
          <li key={r.id} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{r.customer_name}</div>
                <div className="text-xs text-zinc-500">
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              <span
                className={
                  r.rating >= 4
                    ? "text-amber-500"
                    : r.rating === 3
                      ? "text-zinc-500"
                      : "text-red-500"
                }
              >
                {"★".repeat(r.rating)}
                <span className="text-zinc-200">{"★".repeat(5 - r.rating)}</span>
              </span>
            </div>
            {r.comment && (
              <p className="mt-2 text-sm text-zinc-700">{r.comment}</p>
            )}
            <div className="mt-2">
              {r.redirected_to_google ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  sent to Google
                </span>
              ) : (
                <span className="text-xs text-zinc-400">private feedback</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white md:block">
        {rows && rows.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3">Google</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.rating >= 4
                          ? "text-amber-500"
                          : r.rating === 3
                            ? "text-zinc-500"
                            : "text-red-500"
                      }
                    >
                      {"★".repeat(r.rating)}
                      <span className="text-zinc-200">{"★".repeat(5 - r.rating)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{r.customer_name}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {r.comment || <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.redirected_to_google ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        sent
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">private</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-sm text-zinc-500">
            No submissions match these filters.
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
