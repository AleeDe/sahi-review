-- Allow an authenticated user to create their own business during onboarding.
-- One business per owner is enforced application-side (onboarding action checks).
create policy biz_owner_insert on businesses for insert to authenticated
  with check (owner_user_id = auth.uid());
