import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function SettingsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, google_place_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!business) notFound();
  const { data: settings } = await supabase
    .from("business_settings")
    .select("threshold_rating")
    .eq("business_id", business.id)
    .maybeSingle();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500">Edit your business details.</p>
      </div>
      <SettingsForm
        business={business}
        thresholdRating={settings?.threshold_rating ?? 4}
      />
    </div>
  );
}
