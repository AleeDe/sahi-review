"use client";

import { useState, useTransition } from "react";
import { updateSettings } from "./actions";

type Props = {
  business: { id: string; name: string; slug: string; google_place_id: string | null };
  thresholdRating: number;
};

export function SettingsForm({ business, thresholdRating }: Props) {
  const [name, setName] = useState(business.name);
  const [placeId, setPlaceId] = useState(business.google_place_id ?? "");
  const [threshold, setThreshold] = useState(thresholdRating);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const result = await updateSettings(business.slug, {
        name,
        google_place_id: placeId || null,
        threshold_rating: threshold,
      });
      setMsg(
        result.ok
          ? { type: "ok", text: "Saved." }
          : { type: "err", text: result.error ?? "Could not save." },
      );
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6"
    >
      <Field label="Business name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          maxLength={120}
          required
        />
      </Field>

      <Field label="Your slug (URL)">
        <div className="flex items-center rounded-lg border border-zinc-300 bg-zinc-50 px-3">
          <span className="text-sm text-zinc-500">/r/</span>
          <input
            type="text"
            value={business.slug}
            disabled
            className="h-11 flex-1 bg-transparent px-1 text-sm text-zinc-700"
            aria-label="Slug (read only)"
          />
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Slug is permanent. Contact support to change.
        </p>
      </Field>

      <Field label="Google Place ID">
        <input
          type="text"
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 font-mono text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          placeholder="ChIJ…"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Find yours at{" "}
          <a
            href="https://developers.google.com/maps/documentation/places/web-service/place-id"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:underline"
          >
            Google&apos;s Place ID finder
          </a>
          .
        </p>
      </Field>

      <Field label="Google redirect threshold">
        <div className="flex items-center gap-3">
          <select
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
            aria-label="Google redirect threshold"
          >
            {[3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}★ and above
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">
            Ratings at or above this go to Google; below go private.
          </p>
        </div>
      </Field>

      {msg && (
        <p
          className={
            msg.type === "ok" ? "text-sm text-green-700" : "text-sm text-red-600"
          }
        >
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
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
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
