-- Adds two more coupon types alongside percent/flat: buy_x_get_y (same
-- product only — for every buy_qty+get_qty units of one line item, get_qty
-- are free) and free_shipping (waives the shipping charge instead of, or
-- alongside, a subtotal discount).
--
-- discount_value only means something for percent/flat, so its not-null and
-- positive constraints move from unconditional to type-conditional here.

alter table public.coupons
  alter column discount_value drop not null;

alter table public.coupons
  drop constraint coupons_discount_value_check;

alter table public.coupons
  drop constraint coupons_discount_type_check;

alter table public.coupons
  add column buy_qty int check (buy_qty is null or buy_qty > 0),
  add column get_qty int check (get_qty is null or get_qty > 0);

alter table public.coupons
  add constraint coupons_discount_type_check
    check (discount_type in ('percent', 'flat', 'buy_x_get_y', 'free_shipping'));

alter table public.coupons
  add constraint coupons_discount_value_check
    check (
      (discount_type in ('percent', 'flat') and discount_value > 0)
      or (discount_type in ('buy_x_get_y', 'free_shipping'))
    );

alter table public.coupons
  add constraint coupons_buy_x_get_y_needs_qtys_check
    check (discount_type <> 'buy_x_get_y' or (buy_qty is not null and get_qty is not null));
