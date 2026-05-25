"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setTenantStatus,
  extendTrial,
  recordPayment,
  updateTenantPlan,
} from "../../actions";

type Tenant = {
  id: string;
  status: string;
  plan: string;
  trialEndsAt: string;
  monthlyAmount: number | null;
  currency: "PKR" | "USD" | null;
};

export function TenantActions({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const [open, setOpen] = useState<null | "payment" | "plan">(null);

  function refresh() {
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-5 py-3">
        <h2 className="text-sm font-semibold">Actions</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
        <StatusActions tenant={tenant} onDone={refresh} />
        <TrialActions tenant={tenant} onDone={refresh} />
        <button
          type="button"
          onClick={() => setOpen("payment")}
          className="h-12 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Record payment
        </button>
        <button
          type="button"
          onClick={() => setOpen("plan")}
          className="h-12 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold hover:bg-zinc-50"
        >
          Change plan
        </button>
      </div>

      {open === "payment" && (
        <RecordPaymentModal tenant={tenant} onClose={() => setOpen(null)} onDone={refresh} />
      )}
      {open === "plan" && (
        <ChangePlanModal tenant={tenant} onClose={() => setOpen(null)} onDone={refresh} />
      )}
    </section>
  );
}

function StatusActions({
  tenant,
  onDone,
}: {
  tenant: Tenant;
  onDone: () => void;
}) {
  const [isPending, start] = useTransition();
  function change(next: "active" | "paused" | "cancelled") {
    start(async () => {
      await setTenantStatus(tenant.id, next);
      onDone();
    });
  }
  const active = ["active", "trial"].includes(tenant.status);
  return (
    <div className="flex flex-wrap gap-2">
      {active ? (
        <button
          type="button"
          onClick={() => change("paused")}
          disabled={isPending}
          className="h-12 flex-1 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold hover:bg-zinc-50 disabled:opacity-60"
        >
          Pause
        </button>
      ) : (
        <button
          type="button"
          onClick={() => change("active")}
          disabled={isPending}
          className="h-12 flex-1 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          Activate
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          if (confirm("Cancel this tenant? They can be reactivated later.")) change("cancelled");
        }}
        disabled={isPending || tenant.status === "cancelled"}
        className="h-12 flex-1 rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
      >
        Cancel
      </button>
    </div>
  );
}

function TrialActions({ tenant, onDone }: { tenant: Tenant; onDone: () => void }) {
  const [isPending, start] = useTransition();
  function extend(days: number) {
    start(async () => {
      await extendTrial(tenant.id, days);
      onDone();
    });
  }
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => extend(7)}
        disabled={isPending}
        className="h-12 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold hover:bg-zinc-50 disabled:opacity-60"
      >
        +7 days
      </button>
      <button
        type="button"
        onClick={() => extend(30)}
        disabled={isPending}
        className="h-12 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold hover:bg-zinc-50 disabled:opacity-60"
      >
        +30 days
      </button>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RecordPaymentModal({
  tenant,
  onClose,
  onDone,
}: {
  tenant: Tenant;
  onClose: () => void;
  onDone: () => void;
}) {
  type Method = "bank_transfer" | "jazzcash" | "easypaisa" | "stripe" | "cash" | "other";
  const [amount, setAmount] = useState(tenant.monthlyAmount?.toString() ?? "");
  const [currency, setCurrency] = useState<"PKR" | "USD">(tenant.currency ?? "PKR");
  const [method, setMethod] = useState<Method>("bank_transfer");
  const [reference, setReference] = useState("");
  const [periodStart, setPeriodStart] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [periodEnd, setPeriodEnd] = useState(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await recordPayment({
        business_id: tenant.id,
        amount: parseFloat(amount),
        currency,
        method,
        reference: reference || null,
        period_start: periodStart,
        period_end: periodEnd,
        notes: notes || null,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed");
        return;
      }
      onDone();
      onClose();
    });
  }

  return (
    <Modal title="Record payment" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount">
            <input
              aria-label="Amount"
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Currency">
            <select
              aria-label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "PKR" | "USD")}
              className="input"
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
            </select>
          </Field>
        </div>
        <Field label="Method">
          <select
            aria-label="Payment method"
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
            className="input"
          >
            <option value="bank_transfer">Bank transfer</option>
            <option value="jazzcash">JazzCash</option>
            <option value="easypaisa">Easypaisa</option>
            <option value="stripe">Stripe</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Reference (optional)">
          <input
            aria-label="Reference"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="input"
            placeholder="Txn ID or note"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Period start">
            <input
              aria-label="Period start"
              type="date"
              required
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Period end">
            <input
              aria-label="Period end"
              type="date"
              required
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <Field label="Notes (optional)">
          <textarea
            aria-label="Notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-zinc-300 text-sm font-semibold hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="h-11 flex-1 rounded-lg bg-zinc-900 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save payment"}
          </button>
        </div>

        <style jsx>{`
          .input {
            display: block;
            height: 2.75rem;
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid rgb(212, 212, 216);
            background: white;
            padding: 0 0.75rem;
            font-size: 0.875rem;
          }
          .input:focus {
            border-color: rgb(251, 191, 36);
            outline: none;
            box-shadow: 0 0 0 2px rgb(254, 243, 199);
          }
          textarea.input {
            height: auto;
            padding-top: 0.625rem;
            padding-bottom: 0.625rem;
          }
        `}</style>
      </form>
    </Modal>
  );
}

function ChangePlanModal({
  tenant,
  onClose,
  onDone,
}: {
  tenant: Tenant;
  onClose: () => void;
  onDone: () => void;
}) {
  type Plan = "local_pkr" | "international_usd";
  const [plan, setPlan] = useState<Plan>(tenant.plan as Plan);
  const [monthlyAmount, setMonthlyAmount] = useState(
    tenant.monthlyAmount?.toString() ?? "",
  );
  const [currency, setCurrency] = useState<"PKR" | "USD">(tenant.currency ?? "PKR");
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await updateTenantPlan(tenant.id, {
        plan,
        monthly_amount: parseFloat(monthlyAmount),
        currency,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed");
        return;
      }
      onDone();
      onClose();
    });
  }

  return (
    <Modal title="Change plan" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Plan">
          <select
            aria-label="Plan"
            value={plan}
            onChange={(e) => {
              const p = e.target.value as Plan;
              setPlan(p);
              if (p === "local_pkr") {
                setCurrency("PKR");
                setMonthlyAmount("1500");
              } else {
                setCurrency("USD");
                setMonthlyAmount("99");
              }
            }}
            className="input"
          >
            <option value="local_pkr">Local (PKR)</option>
            <option value="international_usd">International (USD)</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Monthly amount">
            <input
              aria-label="Monthly amount"
              type="number"
              step="0.01"
              required
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Currency">
            <select
              aria-label="Plan currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "PKR" | "USD")}
              className="input"
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
            </select>
          </Field>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-zinc-300 text-sm font-semibold hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="h-11 flex-1 rounded-lg bg-zinc-900 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>

        <style jsx>{`
          .input {
            display: block;
            height: 2.75rem;
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid rgb(212, 212, 216);
            background: white;
            padding: 0 0.75rem;
            font-size: 0.875rem;
          }
        `}</style>
      </form>
    </Modal>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
