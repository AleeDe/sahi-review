import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/lib/supabase/cached";
import { QrDownload } from "./qr-download";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function QrPage({ params }: Props) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${appUrl}/r/${business.slug}`;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your QR code</h1>
        <p className="text-sm text-zinc-500">
          Print this and put it at your counter. When customers scan, they land on your
          feedback form.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 text-sm text-zinc-500">Links to:</div>
        <code className="block break-all rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
          {url}
        </code>
      </div>

      <QrDownload url={url} businessName={business.name} />
    </div>
  );
}
