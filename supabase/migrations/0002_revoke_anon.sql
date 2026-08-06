-- Defence in depth for customer data.
--
-- Supabase's default privileges on the public schema hand `anon` SELECT on
-- every new table. RLS already returns zero rows there (the policies are
-- `TO authenticated` with an ownership predicate), but a single mistaken
-- policy would then expose every order and address to the public key.
-- Revoking the grant means the table is unreachable for anon regardless of
-- what any future policy says.

revoke all on public.orders      from anon;
revoke all on public.order_items from anon;
revoke all on public.profiles    from anon;
revoke all on public.addresses   from anon;

-- Same reasoning for writes on the catalog: only the service-role key,
-- used server-side after an admin check, may change it.
revoke insert, update, delete on public.categories       from anon, authenticated;
revoke insert, update, delete on public.products         from anon, authenticated;
revoke insert, update, delete on public.product_images   from anon, authenticated;
revoke insert, update, delete on public.product_variants from anon, authenticated;
revoke insert, update, delete on public.orders           from anon, authenticated;
revoke insert, update, delete on public.order_items      from anon, authenticated;

-- Stop the same default privileges applying to tables added later.
alter default privileges in schema public revoke all on tables from anon;
