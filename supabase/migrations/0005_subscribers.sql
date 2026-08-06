-- Launch mailing list.

create table if not exists public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  source     text not null default 'coming_soon',
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

-- No client role touches this table. Signups go through a server action with
-- the service-role key, so nobody can scrape the list through the Data API.
revoke all on public.subscribers from anon, authenticated;
