"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type Props = { slug: string; placeId: string | null };

export function FeedbackForm({ slug, placeId }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!rating) {
      setError("Please tap a star to rate.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            rating,
            customer_name: name,
            customer_phone: phone,
            comment,
            hp: "",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong. Please try again.");
          return;
        }
        const params = new URLSearchParams();
        if (comment) params.set("c", comment);
        if (data.redirect === "google" && placeId) {
          params.set("pid", placeId);
          router.push(`/r/${slug}/thanks-google?${params.toString()}`);
        } else {
          router.push(`/r/${slug}/thanks-private`);
        }
      } catch {
        setError("Network error. Tap to retry.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {/* Honeypot — hidden from humans */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      {/* Stars */}
      <fieldset className="text-center">
        <legend className="sr-only">Rating</legend>
        <div
          className="flex justify-center gap-1.5"
          onMouseLeave={() => setHover(null)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hover ?? rating ?? 0) >= n;
            return (
              <button
                key={n}
                type="button"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                aria-pressed={rating === n}
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(n)}
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full text-4xl transition-all duration-150 select-none",
                  active ? "text-amber-400 scale-110" : "text-zinc-300",
                  "hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                )}
              >
                ★
              </button>
            );
          })}
        </div>
        {rating ? (
          <p className="mt-3 text-sm font-medium text-zinc-700">
            {["", "Very poor", "Not great", "Okay", "Good", "Excellent!"][rating]}
          </p>
        ) : (
          <p className="mt-3 text-sm text-zinc-400">Tap a star</p>
        )}
      </fieldset>

      {/* Identity + comment — progressive disclosure */}
      {rating !== null && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
              Your name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block h-12 w-full rounded-lg border border-zinc-300 bg-white px-4 text-base focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              placeholder="e.g. Ali"
              maxLength={120}
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
              Phone <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="block h-12 w-full rounded-lg border border-zinc-300 bg-white px-4 text-base focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              placeholder="03xx xxxxxxx"
              maxLength={20}
            />
          </div>

          <div>
            <label htmlFor="comment" className="mb-1.5 block text-sm font-medium">
              {rating >= 4 ? "What stood out?" : "What went wrong?"}{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <textarea
              id="comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              placeholder={
                rating >= 4 ? "Tell others what you loved…" : "Help the owner fix it…"
              }
              maxLength={1000}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex h-14 w-full items-center justify-center rounded-lg bg-zinc-900 text-base font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
          >
            {isPending ? "Sending…" : "Send feedback"}
          </button>
        </div>
      )}
    </form>
  );
}
