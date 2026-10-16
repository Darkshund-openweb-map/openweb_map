-- Shared login throttle and immediate session revocation for serverless instances.
create table public.admin_login_limits (
  client_key text primary key,
  attempts integer not null check (attempts > 0),
  window_started_at timestamptz not null
);

create table public.admin_revoked_sessions (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null
);

alter table public.admin_login_limits enable row level security;
alter table public.admin_revoked_sessions enable row level security;

revoke all on public.admin_login_limits, public.admin_revoked_sessions
  from public, anon, authenticated;
grant select, insert, update on public.admin_revoked_sessions to service_role;

create function public.admin_consume_login_attempt(p_client_key text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_key text;
  current_attempts integer;
  allowed boolean := true;
begin
  if p_client_key !~ '^client:[0-9a-f]{64}$' then
    raise exception 'Invalid login key';
  end if;

  foreach current_key in array array['global', p_client_key] loop
    insert into public.admin_login_limits (client_key, attempts, window_started_at)
    values (current_key, 1, now())
    on conflict (client_key) do update
    set attempts = case
        when public.admin_login_limits.window_started_at <= now() - interval '15 minutes'
          then 1
        else public.admin_login_limits.attempts + 1
      end,
      window_started_at = case
        when public.admin_login_limits.window_started_at <= now() - interval '15 minutes'
          then now()
        else public.admin_login_limits.window_started_at
      end
    returning attempts into current_attempts;

    if current_attempts > case when current_key = 'global' then 100 else 10 end then
      allowed := false;
    end if;
  end loop;
  return allowed;
end;
$$;

revoke all on function public.admin_consume_login_attempt(text)
  from public, anon, authenticated;
grant select, insert, update on public.admin_login_limits to service_role;
grant execute on function public.admin_consume_login_attempt(text) to service_role;
