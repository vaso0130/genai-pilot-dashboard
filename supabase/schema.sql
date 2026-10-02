-- 生成式 AI 公務應用試辦｜共用資料庫
-- 在 Supabase SQL Editor 執行一次即可。

begin;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

revoke all on table public.app_admins from anon, authenticated;
grant select on table public.app_admins to authenticated;

drop policy if exists "admin can see own membership" on public.app_admins;
create policy "admin can see own membership"
on public.app_admins
for select
to authenticated
using (user_id = auth.uid());

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins where user_id = auth.uid()
  );
$$;

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

create table if not exists public.project_state (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.project_state (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

alter table public.project_state enable row level security;

revoke all on table public.project_state from anon, authenticated;
grant select on table public.project_state to anon, authenticated;

drop policy if exists "everyone can read published state" on public.project_state;
create policy "everyone can read published state"
on public.project_state
for select
to anon, authenticated
using (true);

-- 正式發布只能走這個 RPC；用 expected_version 防止多人同時編輯互相覆蓋。
create or replace function public.publish_project_state(
  expected_version bigint,
  new_data jsonb
)
returns public.project_state
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.project_state;
  result_row public.project_state;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not public.is_app_admin() then
    raise exception 'admin permission required' using errcode = '42501';
  end if;

  select * into current_row
  from public.project_state
  where id = 1
  for update;

  if current_row.version <> expected_version then
    raise exception 'version conflict: expected %, current %', expected_version, current_row.version
      using errcode = '40001';
  end if;

  update public.project_state
  set data = new_data,
      version = version + 1,
      updated_at = now(),
      updated_by = auth.uid()
  where id = 1
  returning * into result_row;

  return result_row;
end;
$$;

revoke all on function public.publish_project_state(bigint, jsonb) from public;
grant execute on function public.publish_project_state(bigint, jsonb) to authenticated;

-- Realtime：若已加入 publication，忽略重複加入錯誤。
do $$
begin
  alter publication supabase_realtime add table public.project_state;
exception
  when duplicate_object then null;
end $$;

commit;

-- ===== 建立第一位管理者 =====
-- 1. 先從網站使用「管理者登入」寄送 Magic Link 並完成登入。
-- 2. 到 Supabase Dashboard > Authentication > Users 確認該帳號已建立。
-- 3. 將下面 YOUR_ADMIN_EMAIL 換成你的登入信箱，只需執行一次：
--
-- insert into public.app_admins (user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
-- on conflict (user_id) do nothing;
--
-- 後續若要增加其他管理者，同樣執行一次即可。
