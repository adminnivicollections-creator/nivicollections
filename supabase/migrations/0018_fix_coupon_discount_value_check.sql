-- 0017's coupons_discount_value_check had a NULL-handling bug: CHECK
-- constraints only reject an expression that evaluates to FALSE, not NULL —
-- and `discount_value > 0` where discount_value IS NULL evaluates to NULL,
-- not FALSE. So a percent/flat coupon created with no discount_value at all
-- passed the constraint silently. Verified against the live database: this
-- exact case was insertable before this fix.

alter table public.coupons
  drop constraint coupons_discount_value_check;

alter table public.coupons
  add constraint coupons_discount_value_check
    check (
      (discount_type in ('percent', 'flat')
        and discount_value is not null and discount_value > 0)
      or (discount_type in ('buy_x_get_y', 'free_shipping'))
    );
