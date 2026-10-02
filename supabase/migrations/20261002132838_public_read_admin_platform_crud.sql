-- Public map reads. Platform writes require an explicitly enrolled Auth user.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

drop policy if exists "Read own admin membership" on public.admin_users;
create policy "Read own admin membership"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

alter table public.island enable row level security;
alter table public.platforms enable row level security;
alter table public.incidents enable row level security;
alter table public.incidents_data_types enable row level security;
alter table public.platform_connections enable row level security;
alter table public.official_org_list enable row level security;

-- Existing tables currently grant all four DML operations to both client roles.
revoke all on table public.island, public.platforms, public.incidents,
  public.incidents_data_types, public.platform_connections, public.official_org_list
  from anon, authenticated;

grant select on table public.island, public.platforms, public.incidents,
  public.incidents_data_types, public.platform_connections to anon, authenticated;
grant insert, update, delete on table public.platforms to authenticated;

drop policy if exists "Read islands" on public.island;
create policy "Read islands"
on public.island for select to anon, authenticated using (true);
drop policy if exists "Read platforms" on public.platforms;
create policy "Read platforms"
on public.platforms for select to anon, authenticated using (true);
drop policy if exists "Read incidents including pending review" on public.incidents;
create policy "Read incidents including pending review"
on public.incidents for select to anon, authenticated using (true);
drop policy if exists "Read incident data types" on public.incidents_data_types;
create policy "Read incident data types"
on public.incidents_data_types for select to anon, authenticated using (true);
drop policy if exists "Read platform connections" on public.platform_connections;
create policy "Read platform connections"
on public.platform_connections for select to anon, authenticated using (true);

drop policy if exists "Admins insert platforms" on public.platforms;
create policy "Admins insert platforms"
on public.platforms for insert to authenticated
with check (
  exists (select 1 from public.admin_users where user_id = (select auth.uid()))
);
drop policy if exists "Admins update platforms" on public.platforms;
create policy "Admins update platforms"
on public.platforms for update to authenticated
using (
  exists (select 1 from public.admin_users where user_id = (select auth.uid()))
)
with check (
  exists (select 1 from public.admin_users where user_id = (select auth.uid()))
);
drop policy if exists "Admins delete platforms" on public.platforms;
create policy "Admins delete platforms"
on public.platforms for delete to authenticated
using (
  exists (select 1 from public.admin_users where user_id = (select auth.uid()))
);
