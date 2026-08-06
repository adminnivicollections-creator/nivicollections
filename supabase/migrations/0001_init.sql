-- Nivi Collections: initial schema
--
-- Money is stored as integer paise (₹1 = 100). Never floats.
--
-- Access model:
--   * Catalog (categories/products/variants/images) is world-readable when active.
--   * Orders/addresses/profiles are readable only by their owner.
--   * ALL writes and all admin reads go through server-side code using the
--     service-role key, after an explicit admin check. That is why there are no
--     admin RLS policies here: the Data API never needs to grant admin access.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- catalog

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  position    int  not null default 0,
  image_path  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.products (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  description    text not null default '',
  category_id    uuid not null references public.categories(id) on delete restrict,
  price_paise    int  not null check (price_paise >= 0),
  -- Optional "was" price for showing a markdown. Must exceed the live price.
  compare_at_paise int check (compare_at_paise is null or compare_at_paise > price_paise),
  ready_to_ship  boolean not null default false,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index on public.products (category_id);
create index on public.products (active, created_at desc);

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  -- Path inside the `product-images` storage bucket, not a full URL.
  storage_path text not null,
  alt         text not null default '',
  position    int  not null default 0
);

create index on public.product_images (product_id, position);

-- Stock lives per size, not per product.
create table public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  size        text not null,
  stock       int  not null default 0 check (stock >= 0),
  position    int  not null default 0,
  unique (product_id, size)
);

create index on public.product_variants (product_id);

-- ---------------------------------------------------------------- customers

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null default '',
  phone      text not null default '',
  -- Checked server-side with the service-role client. Never read from a JWT:
  -- user_metadata is user-editable and unsafe for authorization.
  role       text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table public.addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  full_name  text not null,
  phone      text not null,
  line1      text not null,
  line2      text not null default '',
  city       text not null,
  state      text not null,
  pincode    text not null,
  country    text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.addresses (user_id);

-- New signups get a profile row automatically.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

-- Not callable by anon/authenticated: it is a trigger function on auth.users
-- and takes no arguments a client could supply.
revoke execute on function public.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- orders

create type public.order_status as enum (
  'pending_payment', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'
);

create sequence public.order_number_seq start with 1001;

create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text not null unique default 'NV-' || nextval('public.order_number_seq'),
  -- Null for guest checkout. Orders are still looked up by email + order number.
  user_id       uuid references auth.users(id) on delete set null,
  email         text not null,
  phone         text not null,
  shipping_address jsonb not null,
  subtotal_paise int not null check (subtotal_paise >= 0),
  shipping_paise int not null default 0 check (shipping_paise >= 0),
  total_paise    int not null check (total_paise >= 0),
  status        public.order_status not null default 'pending_payment',
  razorpay_order_id   text unique,
  razorpay_payment_id text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on public.orders (user_id, created_at desc);
create index on public.orders (status, created_at desc);

-- Line items snapshot name/size/price so past orders survive catalog edits.
create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  variant_id      uuid references public.product_variants(id) on delete set null,
  product_name    text not null,
  product_slug    text not null,
  size            text not null,
  unit_price_paise int not null check (unit_price_paise >= 0),
  qty             int not null check (qty > 0)
);

create index on public.order_items (order_id);

-- ---------------------------------------------------------------- RLS

alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.product_variants enable row level security;
alter table public.profiles         enable row level security;
alter table public.addresses        enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;

-- Catalog: anyone may read the active rows. No client may write.
create policy "categories are publicly readable"
  on public.categories for select to anon, authenticated using (active);

create policy "products are publicly readable"
  on public.products for select to anon, authenticated using (active);

create policy "product images are publicly readable"
  on public.product_images for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.active
  ));

create policy "product variants are publicly readable"
  on public.product_variants for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_variants.product_id and p.active
  ));

-- Profiles: a signed-in user sees and edits only their own row, and may not
-- change their own role (WITH CHECK pins it to the existing value).
create policy "users read own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "users update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and role = (select p.role from public.profiles p where p.id = (select auth.uid()))
  );

-- Addresses: full ownership.
create policy "users read own addresses"
  on public.addresses for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "users insert own addresses"
  on public.addresses for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users update own addresses"
  on public.addresses for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "users delete own addresses"
  on public.addresses for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Orders: readable by the signed-in owner only. Guest orders (user_id null)
-- are never exposed through the Data API; they are fetched server-side after
-- verifying the order number against the email that placed it.
create policy "users read own orders"
  on public.orders for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "users read own order items"
  on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------- grants
--
-- Supabase is phasing out auto-exposing public tables to the Data API, so the
-- read access the policies above describe is granted explicitly. No client role
-- gets INSERT/UPDATE/DELETE on the catalog or orders: those go through the
-- service-role key in server code.

grant usage on schema public to anon, authenticated;

grant select on public.categories       to anon, authenticated;
grant select on public.products         to anon, authenticated;
grant select on public.product_images   to anon, authenticated;
grant select on public.product_variants to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select on public.orders      to authenticated;
grant select on public.order_items to authenticated;

-- ---------------------------------------------------------------- storage

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Product photos are public to read; uploads happen server-side with the
-- service-role key, so no insert/update/delete policy is granted to clients.
create policy "product images are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

-- ---------------------------------------------------------------- updated_at

create function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();
