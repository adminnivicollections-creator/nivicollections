-- Cart lives entirely in localStorage until checkout is submitted, so the
-- earliest point an abandoned purchase becomes server-visible is a
-- pending_payment order — the customer already gave their email and address,
-- just never paid. Two nullable timestamps track which reminder emails have
-- gone out, so the daily cron job never sends either one twice.

alter table public.orders
  add column if not exists abandoned_email_1_sent_at timestamptz,
  add column if not exists abandoned_email_2_sent_at timestamptz;

-- The cron job scans for pending_payment orders past each threshold that
-- haven't been emailed yet — this makes that scan an index lookup instead
-- of a sequential scan as the orders table grows.
create index if not exists orders_pending_abandoned_idx
  on public.orders (created_at)
  where status = 'pending_payment';
