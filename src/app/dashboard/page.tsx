import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// /dashboard → redirect to /dashboard/[slug] (or /onboarding if no business)
export default async function DashboardIndex() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { data: business } = await supabase
    .from("businesses")
    .select("slug")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!business) redirect("/onboarding");
  redirect(`/dashboard/${business.slug}`);
}
