-- Generic fixed-window rate limiter, same atomic-guarded-write pattern as
-- reserve_order_stock/increment_tryon_usage. Vercel functions are
-- stateless between invocations, so an in-memory counter wouldn't work —
-- this needs to live in the database to actually count across requests.

create table public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  count        int not null default 1,
  primary key (key, window_start)
);

create function public.check_rate_limit(
  p_key text,
  p_window_seconds int,
  p_max int
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_count  int;
begin
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update
    set count = rate_limits.count + 1
  returning count into v_count;

  -- Self-cleaning: every call also drops this key's old windows, so the
  -- table never needs a separate cron job to stay small.
  delete from public.rate_limits
   where key = p_key and window_start < v_window - interval '1 hour';

  return v_count <= p_max;
end;
$$;

-- Same rule as every other money/quota-adjacent function: only the
-- service role calls this, from server-side route handlers.
revoke execute on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
