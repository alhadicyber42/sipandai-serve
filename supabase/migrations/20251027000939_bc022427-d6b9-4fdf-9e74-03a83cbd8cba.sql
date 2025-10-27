-- Fix recursive RLS on profiles by using security definer helper functions

-- 1) Helper functions that bypass RLS on profiles to read current user's role and work unit
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.current_user_work_unit()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select p.work_unit_id
  from public.profiles p
  where p.id = auth.uid();
$$;

-- 2) Replace recursive policies on profiles
 drop policy if exists "Admin pusat can update any profile" on public.profiles;
 drop policy if exists "Admin pusat can view all profiles" on public.profiles;
 drop policy if exists "Admin unit can view profiles in their unit" on public.profiles;

-- Recreate using helper functions (no self-select in policy)
create policy "Admin pusat can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.current_user_role() = 'admin_pusat');

create policy "Admin unit can view profiles in their unit"
  on public.profiles
  for select
  to authenticated
  using (
    public.current_user_role() = 'admin_unit' and profiles.work_unit_id = public.current_user_work_unit()
  );

create policy "Admin pusat can update any profile"
  on public.profiles
  for update
  to authenticated
  using (public.current_user_role() = 'admin_pusat');