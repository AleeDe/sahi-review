"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export function QrDownload({
  url,
  businessName,
}: {
  url: string;
  businessName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 320,
      margin: 2,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    });
    QRCode.toDataURL(url, { width: 1024, margin: 2 }).then(setDataUrl);
  }, [url]);

  const filename = `sahi-review-${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex flex-col items-center">
        <canvas ref={canvasRef} className="rounded-lg border border-zinc-100" />
        <a
          href={dataUrl}
          download={filename}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Download PNG (high-res)
        </a>
        <p className="mt-3 text-xs text-zinc-500">
          Tip: print at A6 size on matte cardstock, laminate, and stick to the front desk.
        </p>
      </div>
    </div>
  );
}
