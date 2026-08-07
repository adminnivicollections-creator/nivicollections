-- Real refunds: admin-initiated, calls Razorpay's refund API, and records
-- what actually happened. Previously "refunded" was just a status an admin
-- could click on an order with no money moving anywhere.

create table public.refunds (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  razorpay_refund_id text not null unique,
  amount_paise      int not null check (amount_paise > 0),
  reason            text not null default '',
  created_at        timestamptz not null default now()
);

create index on public.refunds (order_id);

alter table public.refunds enable row level security;

-- Customers can see refunds on their own orders; nobody writes here directly
-- — only the admin refund action, via the service role, after Razorpay has
-- confirmed the money actually moved.
create policy "users read own order refunds"
  on public.refunds for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = refunds.order_id and o.user_id = (select auth.uid())
  ));

grant select on public.refunds to authenticated;
