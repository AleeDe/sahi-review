"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteTenant } from "../actions";

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState<"local_pkr" | "international_usd">("local_pkr");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await inviteTenant({ email, name, slug, plan });
      if (res.ok) {
        setMsg({ type: "ok", text: "Invite sent and business created." });
        setEmail("");
        setName("");
        setSlug("");
        router.refresh();
      } else {
        setMsg({ type: "err", text: res.error ?? "Failed." });
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <Field label="Owner email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </Field>
      <Field label="Business name">
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slug) {
              setSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, "")
                  .replace(/\s+/g, "-")
                  .slice(0, 40),
              );
            }
          }}
          required
          maxLength={120}
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </Field>
      <Field label="Slug">
        <div className="flex items-center rounded-lg border border-zinc-300 bg-zinc-50 px-3">
          <span className="text-sm text-zinc-500">/r/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            maxLength={40}
            className="h-11 flex-1 bg-transparent px-1 text-sm"
          />
        </div>
      </Field>
      <Field label="Plan">
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value as typeof plan)}
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm"
        >
          <option value="local_pkr">Local (PKR)</option>
          <option value="international_usd">International (USD)</option>
        </select>
      </Field>
      {msg && (
        <p className={msg.type === "ok" ? "text-sm text-green-700" : "text-sm text-red-600"}>
          {msg.text}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="h-11 w-full rounded-lg bg-zinc-900 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Send invite + create business"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
