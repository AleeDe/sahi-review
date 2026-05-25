-- Seed a demo business so /r/demo works out of the box
insert into businesses (name, slug, google_place_id, subscription_status)
values ('Demo Salon', 'demo', 'ChIJN1t_tDeuEmsRUsoyG83frY4', 'active')
on conflict (slug) do nothing;
