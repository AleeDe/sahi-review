"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBusiness } from "./actions";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function autoSlug(value: string) {
    setName(value);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(value));
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createBusiness({
        name,
        slug,
        google_place_id: placeId || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/dashboard/${slug}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Business name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => autoSlug(e.target.value)}
          required
          maxLength={120}
          autoFocus
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          placeholder="Joe's Salon"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">URL slug</label>
        <div className="flex items-center rounded-lg border border-zinc-300 bg-zinc-50 px-3">
          <span className="text-sm text-zinc-500">/r/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            required
            maxLength={40}
            className="h-11 flex-1 bg-transparent px-1 text-sm"
            placeholder="joes-salon"
          />
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Lowercase letters, numbers, hyphens. Permanent.
        </p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Google Place ID <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <input
          type="text"
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          maxLength={200}
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 font-mono text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          placeholder="ChIJ…"
        />
        <p className="mt-1 text-xs text-zinc-500">You can add this later in settings.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="h-11 w-full rounded-lg bg-zinc-900 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Create business"}
      </button>
    </form>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}
