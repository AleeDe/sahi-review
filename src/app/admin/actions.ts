"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (user.app_metadata?.role !== "admin") return null;
  return user;
}

type Result = { ok: true } | { ok: false; error: string };

const statusSchema = z.enum(["trial", "active", "paused", "cancelled"]);

export async function setTenantStatus(
  tenantId: string,
  status: z.infer<typeof statusSchema>,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Forbidden" };
  if (!statusSchema.safeParse(status).success) {
    return { ok: false, error: "Invalid status" };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("businesses")
    .update({ subscription_status: status })
    .eq("id", tenantId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function extendTrial(
  tenantId: string,
  days: number,
): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "Forbidden" };
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    return { ok: false, error: "Invalid days" };
  }

  const admin = createSupabaseAdminClient();
  const { data: current } = await admin
    .from("businesses")
    .select("trial_ends_at")
    .eq("id", tenantId)
    .single();
  if (!current) return { ok: false, error: "Tenant not found" };

  const base = Math.max(
    Date.now(),
    new Date(current.trial_ends_at).getTime(),
  );
  const next = new Date(base + days * 24 * 3600 * 1000).toISOString();

  const { error } = await admin
    .from("businesses")
    .update({ trial_ends_at: next })
    .eq("id", tenantId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin", "layout");
  return { ok: true };
}

const paymentSchema = z.object({
  business_id: z.string().uuid(),
  amount: z.number().nonnegative(),
  currency: z.enum(["PKR", "USD"]),
  method: z.enum(["bank_transfer", "jazzcash", "easypaisa", "stripe", "cash", "other"]),
  reference: z.string().max(200).nullable(),
  period_start: z.string(),
  period_end: z.string(),
  notes: z.string().max(1000).nullable(),
});

export async function recordPayment(
  input: z.input<typeof paymentSchema>,
): Promise<Result> {
  const user = await requireAdmin();
  if (!user) return { ok: false, error: "Forbidden" };
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("payments").insert({
    ...parsed.data,
    recorded_by: user.id,
  });
  if (error) return { ok: false, error: error.message };

  // Mark tenant active if it was in trial/paused — they paid.
  await admin
    .from("businesses")
    .update({ subscription_status: "active" })
    .eq("id", parsed.data.business_id)
    .in("subscription_status", ["trial", "paused"]);

  revalidatePath("/admin", "layout");
  return { ok: true };
}

const planSchema = z.object({
  plan: z.enum(["local_pkr", "international_usd"]),
  monthly_amount: z.number().nonnegative(),
  currency: z.enum(["PKR", "USD"]),
});

export async function updateTenantPlan(
  tenantId: string,
  input: z.input<typeof planSchema>,
): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "Forbidden" };
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("businesses")
    .update(parsed.data)
    .eq("id", tenantId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setUserRole(
  userId: string,
  role: "admin" | "business_owner",
): Promise<Result> {
  const me = await requireAdmin();
  if (!me) return { ok: false, error: "Forbidden" };
  if (me.id === userId && role !== "admin") {
    return { ok: false, error: "You can't demote yourself." };
  }

  const admin = createSupabaseAdminClient();
  const { data: target } = await admin.auth.admin.getUserById(userId);
  if (!target.user) return { ok: false, error: "User not found" };

  const nextMeta = { ...target.user.app_metadata, role };
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: nextMeta,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin", "layout");
  return { ok: true };
}

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/),
  plan: z.enum(["local_pkr", "international_usd"]).default("local_pkr"),
});

export async function inviteTenant(
  input: z.input<typeof inviteSchema>,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Forbidden" };
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createSupabaseAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    { redirectTo: `${appUrl}/auth/callback` },
  );
  if (inviteErr || !invited.user) {
    return { ok: false, error: inviteErr?.message ?? "Could not invite user" };
  }

  const { error: bizErr } = await admin.from("businesses").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    plan: parsed.data.plan,
    owner_user_id: invited.user.id,
  });

  if (bizErr) {
    if (bizErr.code === "23505") return { ok: false, error: "Slug already taken." };
    return { ok: false, error: bizErr.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}
