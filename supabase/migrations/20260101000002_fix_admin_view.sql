-- Make admin_feedback_stats respect RLS instead of bypassing it.
-- Then grant access only to authenticated, and gate via a feedback SELECT policy for admins.

drop view if exists admin_feedback_stats;

create view admin_feedback_stats
  with (security_invoker = true) as
  select id, business_id, rating, redirected_to_google, created_at
  from feedback;

grant select on admin_feedback_stats to authenticated;

-- With security_invoker = true, the view now respects RLS on feedback.
-- Owners already have a policy. Admins need one to see all rows via the view.
-- (Admins also gain SELECT on feedback at the table level, including PII columns —
-- privacy is enforced at the application/UI layer by never rendering PII to admins.)
create policy fb_admin_read on feedback for select to authenticated using (is_admin());
