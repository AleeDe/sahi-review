import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FeedbackForm } from "./feedback-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function ReviewPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, google_place_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!business) notFound();

  return (
    <main className="flex flex-1 flex-col items-center px-5 py-8">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
          <p className="mt-2 text-sm text-zinc-500">How was your visit?</p>
        </header>
        <FeedbackForm slug={business.slug} placeId={business.google_place_id} />
        <p className="mt-12 text-center text-xs text-zinc-400">
          Powered by <span className="font-medium text-zinc-500">Sahi Review</span>
        </p>
      </div>
    </main>
  );
}
