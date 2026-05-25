"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  google_place_id: z.string().trim().max(200).nullable(),
  threshold_rating: z.number().int().min(3).max(5),
});

type UpdateResult = { ok: true } | { ok: false; error: string };

export async function updateSettings(
  slug: string,
  input: z.input<typeof settingsSchema>,
): Promise<UpdateResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: business } = await supabase
    .from("businesses")
    .select("id, owner_user_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!business) return { ok: false, error: "Business not found" };

  const isAdmin = user.app_metadata?.role === "admin";
  if (business.owner_user_id !== user.id && !isAdmin) {
    return { ok: false, error: "Forbidden" };
  }

  const { error: bizErr } = await supabase
    .from("businesses")
    .update({
      name: parsed.data.name,
      google_place_id: parsed.data.google_place_id,
    })
    .eq("id", business.id);
  if (bizErr) return { ok: false, error: bizErr.message };

  const { error: setErr } = await supabase
    .from("business_settings")
    .update({ threshold_rating: parsed.data.threshold_rating })
    .eq("business_id", business.id);
  if (setErr) return { ok: false, error: setErr.message };

  revalidatePath(`/dashboard/${slug}`, "layout");
  return { ok: true };
}
