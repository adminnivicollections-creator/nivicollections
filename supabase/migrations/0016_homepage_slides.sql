-- Replaces the single static hero photo (homepage_settings.hero_image_path)
-- with multiple slides that auto-rotate on the homepage, each optionally
-- linking to a collection or product. homepage_settings itself is left in
-- place rather than dropped — hero_image_path just goes unused — since
-- dropping a column is a one-way door and this table may hold other
-- site-wide settings again someday.

create table public.homepage_slides (
  id         uuid primary key default gen_random_uuid(),
  image_path text not null,
  -- Internal path only ("/collections/sarees"), not an arbitrary URL — this
  -- renders as a plain Link href with no validation beyond "starts with /",
  -- so there's no reason to allow it to point off-site.
  link_href  text,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index on public.homepage_slides (position);

alter table public.homepage_slides enable row level security;

-- A row existing is what makes it live — there's no separate "active" flag
-- to manage; removing a slide means deleting its row.
create policy "homepage slides are publicly readable"
  on public.homepage_slides for select to anon, authenticated
  using (true);

grant select on public.homepage_slides to anon, authenticated;
-- No write grant: only the admin panel, via the service role, changes this.
