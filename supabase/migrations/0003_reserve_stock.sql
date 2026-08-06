-- Atomic stock reservation.
--
-- Two customers paying for the last saree at the same moment must not both
-- succeed. Doing this as read-then-write in application code has a race
-- between the read and the write; a single UPDATE with a `stock >= qty` guard
-- inside one statement does not, because Postgres locks each row as it updates.

create function public.reserve_order_stock(p_order_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item record;
  updated int;
begin
  -- Lock the order's items in a stable order to avoid deadlocking against a
  -- concurrent reservation that touches the same variants.
  for item in
    select variant_id, sum(qty) as qty
    from public.order_items
    where order_id = p_order_id and variant_id is not null
    group by variant_id
    order by variant_id
  loop
    update public.product_variants
       set stock = stock - item.qty
     where id = item.variant_id
       and stock >= item.qty;

    get diagnostics updated = row_count;

    if updated = 0 then
      raise exception 'insufficient stock for variant %', item.variant_id
        using errcode = 'check_violation';
    end if;
  end loop;
end;
$$;

-- Callable only by the service role: checkout runs server-side, and a client
-- must never be able to move stock on its own.
revoke execute on function public.reserve_order_stock(uuid) from public, anon, authenticated;
