"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens.",
    }),
  google_place_id: z.string().trim().max(200).nullable(),
});

type Result = { ok: true } | { ok: false; error: string };

export async function createBusiness(
  input: z.input<typeof schema>,
): Promise<Result> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (existing) return { ok: false, error: "You already have a business." };

  const { error } = await supabase.from("businesses").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    google_place_id: parsed.data.google_place_id,
    owner_user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That slug is already taken." };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
