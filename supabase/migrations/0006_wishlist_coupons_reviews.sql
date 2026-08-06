-- Wishlist, coupons and reviews.

-- ---------------------------------------------------------------- wishlist

create table public.wishlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index on public.wishlists (user_id);

alter table public.wishlists enable row level security;

create policy "users read own wishlist"
  on public.wishlists for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "users add to own wishlist"
  on public.wishlists for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users remove from own wishlist"
  on public.wishlists for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, delete on public.wishlists to authenticated;

-- ---------------------------------------------------------------- coupons
--
-- No RLS policies granting client access: coupons are validated and applied
-- entirely server-side in /api/checkout using the service-role key, the same
-- way price is never trusted from the browser. A client cannot list codes,
-- guess at discounts, or apply one without the checkout route agreeing.

create table public.coupons (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  description       text not null default '',
  discount_type     text not null check (discount_type in ('percent', 'flat')),
  -- Percent: 1-100. Flat: paise.
  discount_value    int  not null check (discount_value > 0),
  min_subtotal_paise int not null default 0 check (min_subtotal_paise >= 0),
  -- Caps a percent discount so "50% off" cannot exceed a sane rupee amount.
  max_discount_paise int check (max_discount_paise is null or max_discount_paise > 0),
  starts_at         timestamptz,
  expires_at        timestamptz,
  max_redemptions   int check (max_redemptions is null or max_redemptions > 0),
  times_redeemed    int not null default 0,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

alter table public.coupons enable row level security;
revoke all on public.coupons from anon, authenticated;

-- Track what a paid order actually got, so past orders survive a coupon
-- being edited or deactivated later.
alter table public.orders
  add column if not exists coupon_code    text not null default '',
  add column if not exists discount_paise int  not null default 0 check (discount_paise >= 0);

-- ---------------------------------------------------------------- reviews
--
-- A review requires proof of purchase: it must reference a real order_item
-- on a delivered order that belongs to the reviewer. This is enforced in the
-- INSERT policy itself, not just in application code, so it holds even if a
-- future code change forgets to check.

create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  rating        int  not null check (rating between 1 and 5),
  title         text not null default '',
  body          text not null default '',
  created_at    timestamptz not null default now(),
  unique (order_item_id)
);

create index on public.reviews (product_id);

alter table public.reviews enable row level security;

create policy "reviews are publicly readable"
  on public.reviews for select to anon, authenticated
  using (true);

create policy "users review their own delivered purchases"
  on public.reviews for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = reviews.order_item_id
        and oi.product_id = reviews.product_id
        and o.user_id = (select auth.uid())
        and o.status = 'delivered'
    )
  );

grant select on public.reviews to anon, authenticated;
grant insert on public.reviews to authenticated;

-- ---------------------------------------------------------------- redemption
--
-- Mirrors reserve_order_stock(): a single guarded UPDATE so two concurrent
-- checkouts cannot both slip in under a coupon's max_redemptions.

create function public.redeem_coupon(p_code text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated int;
begin
  update public.coupons
     set times_redeemed = times_redeemed + 1
   where code = upper(p_code)
     and (max_redemptions is null or times_redeemed < max_redemptions);

  get diagnostics updated = row_count;

  if updated = 0 then
    raise exception 'coupon % not found or exhausted', p_code
      using errcode = 'check_violation';
  end if;
end;
$$;

revoke execute on function public.redeem_coupon(text) from public, anon, authenticated;
