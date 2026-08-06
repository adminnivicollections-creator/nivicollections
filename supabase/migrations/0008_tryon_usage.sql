-- Daily usage cap for AI try-on, which costs real money per call (unlike
-- every other feature so far). Mirrors reserve_order_stock() and
-- redeem_coupon(): a single guarded upsert, callable only by the service
-- role, so a burst of concurrent requests cannot slip past the cap.

create table public.tryon_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default current_date,
  count   int  not null default 0,
  primary key (user_id, day)
);

alter table public.tryon_usage enable row level security;
revoke all on public.tryon_usage from anon, authenticated;

create function public.increment_tryon_usage(p_user_id uuid, p_max int)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_count int;
begin
  insert into public.tryon_usage (user_id, day, count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, day) do update
    set count = tryon_usage.count + 1
    where tryon_usage.count < p_max
  returning count into new_count;

  if new_count is null then
    raise exception 'daily try-on limit reached' using errcode = 'check_violation';
  end if;

  return new_count;
end;
$$;

revoke execute on function public.increment_tryon_usage(uuid, int) from public, anon, authenticated;
