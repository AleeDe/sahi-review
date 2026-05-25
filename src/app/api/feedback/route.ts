import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { feedbackSchema } from "@/lib/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sha256Hex } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { slug, rating, customer_name, customer_phone, comment, hp } = parsed.data;

  // Honeypot trip → silently succeed but drop
  if (hp) {
    return NextResponse.json({ ok: true, redirect: "private" });
  }

  const supabase = createSupabaseAdminClient();

  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("id, subscription_status")
    .eq("slug", slug)
    .maybeSingle();

  if (bizErr || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  if (!["trial", "active"].includes(business.subscription_status)) {
    return NextResponse.json({ error: "Business not active" }, { status: 403 });
  }

  const { data: settings } = await supabase
    .from("business_settings")
    .select("threshold_rating")
    .eq("business_id", business.id)
    .maybeSingle();
  const threshold = settings?.threshold_rating ?? 4;

  // IP hash for abuse tracking (no raw IP stored)
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "0.0.0.0";
  const ipHashHex = await sha256Hex(ip + ":" + slug);
  // Convert hex string to bytea-compatible buffer for Postgres
  const ipHashBytes = Buffer.from(ipHashHex, "hex");

  // Simple rate limit: max 5 submissions / 10 min from same (ip, business)
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("ip_hash", ipHashBytes.toString("hex"))
    .gte("created_at", tenMinAgo);

  if ((recentCount ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Too many submissions. Try again later." },
      { status: 429 },
    );
  }

  const redirectToGoogle = rating >= threshold;

  let phoneHash: string | null = null;
  if (customer_phone && customer_phone.trim()) {
    phoneHash = await sha256Hex(customer_phone + ":" + business.id);
  }

  const { error: insErr } = await supabase.from("feedback").insert({
    business_id: business.id,
    rating,
    comment: comment || null,
    customer_name,
    customer_phone_hash: phoneHash,
    redirected_to_google: redirectToGoogle,
    ip_hash: ipHashBytes.toString("hex"),
  });

  if (insErr) {
    return NextResponse.json({ error: "Could not save feedback" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    redirect: redirectToGoogle ? "google" : "private",
  });
}
