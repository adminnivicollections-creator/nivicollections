-- Store settings, product SKU/barcode, review moderation, order status
-- history. Four unrelated features bundled into one migration because they
-- were requested together and none depends on the others.

-- ---------------------------------------------------------------- settings

create table public.store_settings (
  id                        boolean primary key default true check (id),
  legal_name                text not null default '',
  support_email             text not null default '',
  support_phone             text not null default '',
  address                   text not null default '',
  gstin                     text,
  return_window_days        int not null default 7 check (return_window_days > 0),
  free_shipping_above_paise int not null default 150000 check (free_shipping_above_paise >= 0),
  flat_shipping_paise       int not null default 9900 check (flat_shipping_paise >= 0),
  updated_at                timestamptz not null default now()
);

-- Seeded with the real values already in lib/config.ts, so turning this on
-- does not silently blank out the legal pages.
insert into public.store_settings (
  id, legal_name, support_email, support_phone, address,
  return_window_days, free_shipping_above_paise, flat_shipping_paise
) values (
  true, 'Nivi Collections', 'hello@nivicollections.com', '+91 93939 79892',
  'Street 5, Boduppal, Chengicherla, Secunderabad, Telangana 500092',
  7, 150000, 9900
);

alter table public.store_settings enable row level security;

create policy "store settings are publicly readable"
  on public.store_settings for select to anon, authenticated
  using (true);

grant select on public.store_settings to anon, authenticated;
-- No write grant: only the admin panel, via the service role, changes this.

create trigger store_settings_touch_updated_at
  before update on public.store_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- SKU

alter table public.products
  add column if not exists sku     text,
  add column if not exists barcode text;

create unique index if not exists products_sku_key
  on public.products (sku) where sku is not null and sku != '';

-- ---------------------------------------------------------------- reviews

alter table public.reviews
  add column if not exists status      text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  add column if not exists admin_reply text;

-- Replaces the old "anyone can read every review" policy: only approved
-- reviews are public. A reviewer can still see their own pending review.
drop policy if exists "reviews are publicly readable" on public.reviews;

create policy "approved reviews are publicly readable"
  on public.reviews for select to anon, authenticated
  using (status = 'approved');

create policy "users read their own pending reviews too"
  on public.reviews for select to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------- order history

create table public.order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     public.order_status not null,
  created_at timestamptz not null default now()
);

create index on public.order_status_history (order_id, created_at);

alter table public.order_status_history enable row level security;

create policy "users read their own order history"
  on public.order_status_history for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_status_history.order_id and o.user_id = (select auth.uid())
  ));

grant select on public.order_status_history to authenticated;
-- Written only by the trigger below (as the table owner), never directly by
-- any client role.

create function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status)
    values (new.id, new.status);
  end if;
  return new;
end;
$$;

-- This SECURITY DEFINER function only ever inserts a status the row itself
-- already has, using values already validated by the orders table's own
-- constraints — it cannot be steered into writing anything else, which is
-- what makes SECURITY DEFINER safe to use here.
create trigger orders_log_status_change
  after insert or update of status on public.orders
  for each row execute function public.log_order_status_change();
