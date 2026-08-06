-- Singleton row for site-wide settings that need to change without a code
-- deploy. `id boolean primary key default true check (id)` is the standard
-- Postgres idiom for "this table may only ever hold one row" — a second
-- insert collides on the primary key.

create table public.homepage_settings (
  id              boolean primary key default true check (id),
  -- Null means "use the bundled default image in the repo."
  hero_image_path text,
  updated_at      timestamptz not null default now()
);

insert into public.homepage_settings (id) values (true);

alter table public.homepage_settings enable row level security;

create policy "homepage settings are publicly readable"
  on public.homepage_settings for select to anon, authenticated
  using (true);

grant select on public.homepage_settings to anon, authenticated;
-- No insert/update/delete grant: only the admin panel, via the service
-- role, ever changes this.

create trigger homepage_settings_touch_updated_at
  before update on public.homepage_settings
  for each row execute function public.touch_updated_at();
