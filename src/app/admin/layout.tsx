import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminShell } from "./admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");
  const role = user.app_metadata?.role as string | undefined;
  if (role !== "admin") redirect("/dashboard");

  return <AdminShell email={user.email ?? ""}>{children}</AdminShell>;
}
