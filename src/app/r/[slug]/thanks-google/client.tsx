"use client";

import { useEffect, useState } from "react";

type Props = { comment: string; placeId: string };

export function ThanksGoogleClient({ comment, placeId }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!comment) return;
    navigator.clipboard
      ?.writeText(comment)
      .then(() => setCopied(true))
      .catch(() => {});
  }, [comment]);

  const googleUrl = placeId
    ? `https://search.google.com/local/writereview?placeid=${placeId}`
    : "https://www.google.com/maps";

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">Thank you! 🎉</h1>
        <p className="mt-2 text-zinc-600">
          One more step — share it on Google so others can find this business too.
        </p>

        {comment && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
              {copied ? "✓ Your comment is copied" : "Your comment"}
            </p>
            <p className="mt-1 text-sm text-amber-900">&ldquo;{comment}&rdquo;</p>
            <p className="mt-2 text-xs text-amber-700">
              {copied
                ? "Tap below, then paste it on Google."
                : "Copy this, then tap below."}
            </p>
          </div>
        )}

        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex h-16 w-full items-center justify-center gap-2 rounded-lg bg-amber-400 text-lg font-semibold text-white shadow-sm transition hover:bg-amber-500 active:scale-[0.99]"
        >
          ⭐ Post on Google
        </a>

        <p className="mt-4 text-xs text-zinc-400">
          Opens Google in a new tab.
        </p>
      </div>
    </main>
  );
}
