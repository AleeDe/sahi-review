import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const admin = createSupabaseAdminClient();
  const { data: payments } = await admin
    .from("payments")
    .select("id, business_id, amount, currency, method, reference, period_start, period_end, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const businessIds = Array.from(new Set((payments ?? []).map((p) => p.business_id)));
  const nameById = new Map<string, string>();
  if (businessIds.length > 0) {
    const { data: bizs } = await admin
      .from("businesses")
      .select("id, name")
      .in("id", businessIds);
    for (const b of bizs ?? []) nameById.set(b.id, b.name);
  }

  let totalPKR = 0;
  let totalUSD = 0;
  for (const p of payments ?? []) {
    if (p.currency === "PKR") totalPKR += Number(p.amount);
    else totalUSD += Number(p.amount);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="text-sm text-zinc-500">
          {payments?.length ?? 0} payment{(payments?.length ?? 0) === 1 ? "" : "s"} ·
          PKR {totalPKR.toLocaleString()} · ${totalUSD.toLocaleString()}
        </p>
      </div>

      {!payments || payments.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
          No payments recorded. Open a tenant and use <em>Record payment</em>.
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {payments.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/tenants/${p.business_id}`}
                      className="font-semibold hover:underline truncate"
                    >
                      {nameById.get(p.business_id) ?? "—"}
                    </Link>
                    <div className="text-xs text-zinc-500">
                      {p.method.replace("_", " ")} ·{" "}
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {p.currency} {Number(p.amount).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  Period: {new Date(p.period_start).toLocaleDateString()} →{" "}
                  {new Date(p.period_end).toLocaleDateString()}
                </div>
                {p.reference && (
                  <div className="mt-1 text-xs text-zinc-500">Ref: {p.reference}</div>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/tenants/${p.business_id}`}
                        className="font-medium hover:underline"
                      >
                        {nameById.get(p.business_id) ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {p.currency} {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">{p.method.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {new Date(p.period_start).toLocaleDateString()} →{" "}
                      {new Date(p.period_end).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {p.reference || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
