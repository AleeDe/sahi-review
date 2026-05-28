-- Align businesses.slug check constraint with app validation (src/lib/validation.ts).
-- Previous regex rejected 2-character slugs (e.g. "or") because the middle
-- character class required {1,38}. App allows {0,38}.

alter table businesses drop constraint if exists businesses_slug_check;

alter table businesses
  add constraint businesses_slug_check
  check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$');
