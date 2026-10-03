-- Public readers retain SELECT; only the server's secret key can write.
revoke insert, update, delete on public.platforms from anon, authenticated;
grant select, insert, update, delete on public.platforms to service_role;
grant select on public.island to service_role;
grant select, delete on public.incidents, public.incidents_data_types,
  public.platform_connections to service_role;
grant usage on schema public to service_role;

do $$
declare platform_sequence text;
begin
  platform_sequence := pg_get_serial_sequence('public.platforms', 'id');
  if platform_sequence is not null then
    execute format('grant usage, select on sequence %s to service_role', platform_sequence);
  end if;
end;
$$;

create or replace function public.admin_delete_platform(p_platform_id bigint)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.platforms where id = p_platform_id) then
    return false;
  end if;

  delete from public.incidents_data_types
  where incident_id in (
    select id from public.incidents where platform_id = p_platform_id
  );
  delete from public.platform_connections
  where source_platform_id = p_platform_id or target_platform_id = p_platform_id;
  delete from public.incidents where platform_id = p_platform_id;
  delete from public.platforms where id = p_platform_id;
  return true;
end;
$$;

revoke all on function public.admin_delete_platform(bigint) from public, anon, authenticated;
grant execute on function public.admin_delete_platform(bigint) to service_role;
