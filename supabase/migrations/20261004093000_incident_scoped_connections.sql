alter table public.platform_connections
  add column if not exists incident_id bigint;

alter table public.platform_connections
  drop constraint if exists platform_connections_incident_id_fkey,
  add constraint platform_connections_incident_id_fkey
    foreign key (incident_id) references public.incidents(id) on delete cascade;

create index if not exists idx_platform_connections_incident_id
  on public.platform_connections(incident_id);

comment on column public.platform_connections.incident_id is
  '이 연결 관계가 속한 사건. NULL은 아직 사건에 배정되지 않은 기존 관계';
create or replace function public.admin_save_incident(
  p_platform_id bigint,
  p_incident_id bigint,
  p_incident jsonb,
  p_data_types jsonb,
  p_connections jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id bigint;
  item jsonb;
  row_id bigint;
  kept_type_ids bigint[] := '{}';
  kept_connection_ids bigint[] := '{}';
begin
  if not exists (select 1 from public.platforms where id = p_platform_id) then
    raise exception 'Platform not found';
  end if;
  if jsonb_typeof(p_incident) <> 'object' or jsonb_typeof(p_data_types) <> 'array'
    or (p_connections is not null and jsonb_typeof(p_connections) <> 'array') then
    raise exception 'Invalid incident input';
  end if;

  if p_incident_id is null then
    insert into public.incidents
      (platform_id, title, source_url, summary, risk_level, status, published_at)
    values
      (p_platform_id, trim(p_incident->>'title'),
       nullif(trim(p_incident->>'source_url'), ''),
       nullif(trim(p_incident->>'summary'), ''),
       nullif(trim(p_incident->>'risk_level'), ''),
       coalesce(nullif(trim(p_incident->>'status'), ''), '검토중'),
       nullif(p_incident->>'published_at', '')::timestamptz)
    returning id into saved_id;
  else
    update public.incidents
    set title = trim(p_incident->>'title'),
        source_url = nullif(trim(p_incident->>'source_url'), ''),
        summary = nullif(trim(p_incident->>'summary'), ''),
        risk_level = nullif(trim(p_incident->>'risk_level'), ''),
        status = coalesce(nullif(trim(p_incident->>'status'), ''), '검토중'),
        published_at = nullif(p_incident->>'published_at', '')::timestamptz
    where id = p_incident_id and platform_id = p_platform_id
    returning id into saved_id;
    if saved_id is null then raise exception 'Incident not found on platform'; end if;
  end if;

  for item in select value from jsonb_array_elements(p_data_types) loop
    row_id := nullif(item->>'id', '')::bigint;
    if row_id is null then
      insert into public.incidents_data_types (incident_id, name, category, description)
      values (saved_id, trim(item->>'name'), nullif(trim(item->>'category'), ''),
              nullif(trim(item->>'description'), ''))
      returning id into row_id;
    else
      update public.incidents_data_types
      set name = trim(item->>'name'), category = nullif(trim(item->>'category'), ''),
          description = nullif(trim(item->>'description'), '')
      where id = row_id and incident_id = saved_id;
      if not found then raise exception 'Data type does not belong to incident'; end if;
    end if;
    kept_type_ids := array_append(kept_type_ids, row_id);
  end loop;
  delete from public.incidents_data_types
  where incident_id = saved_id and not (id = any(kept_type_ids));

  -- Connections belong to this incident. NULL leaves them alone.
  if p_connections is not null then
    for item in select value from jsonb_array_elements(p_connections) loop
      row_id := nullif(item->>'id', '')::bigint;
      if (item->>'target_platform_id')::bigint = p_platform_id then
        raise exception 'A platform cannot connect to itself';
      end if;
      if row_id is null then
        insert into public.platform_connections
          (incident_id, source_platform_id, target_platform_id, connection_type, description,
           verification_status, confidence, evidence_count, first_seen, last_seen, verified_at)
        values
          (saved_id, p_platform_id, (item->>'target_platform_id')::bigint,
           trim(item->>'connection_type'), nullif(trim(item->>'description'), ''),
           coalesce(nullif(trim(item->>'verification_status'), ''), 'candidate'),
           coalesce(nullif(trim(item->>'confidence'), ''), '미평가'),
           coalesce(nullif(item->>'evidence_count', '')::integer, 0),
           nullif(item->>'first_seen', '')::timestamptz,
           nullif(item->>'last_seen', '')::timestamptz,
           case when item->>'verification_status' = 'verified' then now() else null end)
        returning id into row_id;
      else
        update public.platform_connections
        set target_platform_id = (item->>'target_platform_id')::bigint,
            connection_type = trim(item->>'connection_type'),
            description = nullif(trim(item->>'description'), ''),
            verification_status = coalesce(
              nullif(trim(item->>'verification_status'), ''), 'candidate'
            ),
            confidence = coalesce(nullif(trim(item->>'confidence'), ''), '미평가'),
            evidence_count = coalesce(nullif(item->>'evidence_count', '')::integer, 0),
            first_seen = nullif(item->>'first_seen', '')::timestamptz,
            last_seen = nullif(item->>'last_seen', '')::timestamptz,
            verified_at = case
              when item->>'verification_status' = 'verified' then coalesce(verified_at, now())
              else null
            end
        where id = row_id and source_platform_id = p_platform_id and incident_id = saved_id;
        if not found then raise exception 'Connection does not belong to incident'; end if;
      end if;
      kept_connection_ids := array_append(kept_connection_ids, row_id);
    end loop;
    delete from public.platform_connections
    where source_platform_id = p_platform_id and incident_id = saved_id
      and not (id = any(kept_connection_ids));
  end if;

  update public.platforms
  set incidents_count = (select count(*) from public.incidents where platform_id = p_platform_id)
  where id = p_platform_id;
  return saved_id;
end;
$$;

revoke all on function public.admin_save_incident(bigint, bigint, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.admin_save_incident(bigint, bigint, jsonb, jsonb, jsonb)
  to service_role;
