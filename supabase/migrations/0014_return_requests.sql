-- Customer-facing return requests. Previously the only way to start a return
-- was "email us" per the policy pages; this replaces that with a real flow
-- that admins can review, and which (once approved) feeds into the refund
-- action already built in migration 0012. Approving a return does not itself
-- move money — an admin still issues the refund deliberately, same as today.

create table public.return_requests (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  reason      text not null check (reason in ('defective', 'wrong_item', 'changed_mind', 'other')),
  description text not null default '',
  photo_paths text[] not null default '{}',
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index on public.return_requests (order_id);

-- One open request per order at a time — once an admin decides it, a new
-- request can be raised (e.g. a rejected claim revised with more detail),
-- but two pending requests for the same order would just be confusing.
create unique index return_requests_one_pending_per_order
  on public.return_requests (order_id) where status = 'pending';

alter table public.return_requests enable row level security;

-- Reads only — every write (create, approve, reject) goes through a server
-- action using the service role, after checking order ownership and
-- eligibility (delivered, within the return window) server-side. This
-- mirrors reviews/questions: RLS here is a read boundary, not a write path.
create policy "users read own return requests"
  on public.return_requests for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = return_requests.order_id and o.user_id = (select auth.uid())
  ));

grant select on public.return_requests to authenticated;

create trigger return_requests_touch_updated_at
  before update on public.return_requests
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- storage

-- Not public, unlike product-images: these are customer-submitted evidence
-- photos, not marketing photos. Admins view them via signed URLs generated
-- server-side; there is no public or client read/write policy at all.
insert into storage.buckets (id, name, public)
values ('return-photos', 'return-photos', false)
on conflict (id) do nothing;
