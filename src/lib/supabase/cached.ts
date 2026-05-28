import { cache } from "react";
import { createSupabaseServerClient } from "./server";

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const getBusinessBySlug = cache(async (slug: string) => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, owner_user_id, google_place_id, subscription_status, plan, monthly_amount, currency, trial_ends_at, subscription_started_at, subscription_ends_at",
    )
    .eq("slug", slug)
    .maybeSingle();
  return data;
});
