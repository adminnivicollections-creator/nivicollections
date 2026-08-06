-- Order notes/gift wrap, and product Q&A.

alter table public.orders
  add column if not exists notes     text    not null default '',
  add column if not exists gift_wrap boolean not null default false;

-- ---------------------------------------------------------------- product Q&A
--
-- Anyone signed in may ask, mirroring a real pre-sale question. Only the shop
-- owner answers — there is no client insert policy on answers at all, the
-- same pattern as products/orders: admin writes go through the service role
-- after requireAdmin(), never through a client-facing RLS grant.

create table public.product_questions (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  question   text not null check (char_length(question) between 3 and 500),
  created_at timestamptz not null default now()
);

create index on public.product_questions (product_id);

alter table public.product_questions enable row level security;

create policy "questions are publicly readable"
  on public.product_questions for select to anon, authenticated
  using (true);

create policy "signed-in users may ask"
  on public.product_questions for insert to authenticated
  with check ((select auth.uid()) = user_id);

grant select on public.product_questions to anon, authenticated;
grant insert on public.product_questions to authenticated;

create table public.product_answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null unique references public.product_questions(id) on delete cascade,
  answer      text not null check (char_length(answer) between 1 and 2000),
  created_at  timestamptz not null default now()
);

alter table public.product_answers enable row level security;

create policy "answers are publicly readable"
  on public.product_answers for select to anon, authenticated
  using (true);

grant select on public.product_answers to anon, authenticated;
-- No insert/update grant: only the service-role key (admin panel) writes here.
