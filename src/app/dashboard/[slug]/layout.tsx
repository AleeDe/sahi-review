import { notFound, redirect } from "next/navigation";
import { getBusinessBySlug, getCurrentUser } from "@/lib/supabase/cached";
import { DashboardShell } from "../dashboard-shell";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export default async function DashboardSlugLayout({ params, children }: Props) {
  const { slug } = await params;
  const [user, business] = await Promise.all([
    getCurrentUser(),
    getBusinessBySlug(slug),
  ]);
  if (!user) redirect(`/login?redirect=/dashboard/${slug}`);
  if (!business) notFound();

  const isAdmin =
    (user.app_metadata?.role as string | undefined) === "admin";
  const isOwner = business.owner_user_id === user.id;
  if (!isOwner && !isAdmin) redirect("/dashboard");

  const trialBanner =
    business.subscription_status === "trial" ? (
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        You&apos;re on a free trial. Ends{" "}
        {new Date(business.trial_ends_at).toLocaleDateString()}.
      </div>
    ) : null;

  return (
    <DashboardShell
      slug={business.slug}
      businessName={business.name}
      isAdmin={isAdmin}
      trialBanner={trialBanner}
    >
      {children}
    </DashboardShell>
  );
}
