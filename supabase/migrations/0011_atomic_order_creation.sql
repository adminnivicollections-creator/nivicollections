-- The order and its line items were two separate inserts from /api/checkout.
-- If the second failed (network blip, constraint violation) after the first
-- succeeded, the customer got an error but the database kept an "orders" row
-- with zero items — a ghost order with no way to know what was in it.
-- Wrapping both in one function makes them succeed or fail together, the
-- same pattern already used for reserve_order_stock and redeem_coupon.

create function public.create_order(
  p_user_id uuid,
  p_email text,
  p_phone text,
  p_shipping_address jsonb,
  p_subtotal_paise int,
  p_shipping_paise int,
  p_coupon_code text,
  p_discount_paise int,
  p_total_paise int,
  p_notes text,
  p_gift_wrap boolean,
  -- Array of {variant_id, product_id, product_name, product_slug, size, unit_price_paise, qty}
  p_items jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order_id     uuid;
  v_order_number text;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'an order needs at least one item' using errcode = 'check_violation';
  end if;

  insert into public.orders (
    user_id, email, phone, shipping_address, subtotal_paise, shipping_paise,
    coupon_code, discount_paise, total_paise, notes, gift_wrap, status
  ) values (
    p_user_id, p_email, p_phone, p_shipping_address, p_subtotal_paise, p_shipping_paise,
    p_coupon_code, p_discount_paise, p_total_paise, p_notes, p_gift_wrap, 'pending_payment'
  )
  returning id, order_number into v_order_id, v_order_number;

  insert into public.order_items (
    order_id, variant_id, product_id, product_name, product_slug, size, unit_price_paise, qty
  )
  select
    v_order_id,
    (item ->> 'variant_id')::uuid,
    (item ->> 'product_id')::uuid,
    item ->> 'product_name',
    item ->> 'product_slug',
    item ->> 'size',
    (item ->> 'unit_price_paise')::int,
    (item ->> 'qty')::int
  from jsonb_array_elements(p_items) as item;

  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number);
end;
$$;

-- Same rule as every other money-moving function: checkout runs server-side
-- with the service-role key, so a client must never be able to call this
-- directly and fabricate an order.
revoke execute on function public.create_order(
  uuid, text, text, jsonb, int, int, text, int, int, text, boolean, jsonb
) from public, anon, authenticated;
