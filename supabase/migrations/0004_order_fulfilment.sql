-- Fulfilment fields. Everything an order needs once payment has cleared.

alter table public.orders
  add column if not exists tracking_number text not null default '',
  add column if not exists carrier         text not null default '',
  -- Free-text note for the shop owner. Never shown to the customer.
  add column if not exists admin_note      text not null default '',
  add column if not exists shipped_at      timestamptz,
  add column if not exists delivered_at    timestamptz;

-- Orders whose payment never completed. A nightly clean-up can cancel these;
-- the index keeps that scan cheap as the table grows.
create index if not exists orders_pending_created_idx
  on public.orders (created_at)
  where status = 'pending_payment';
