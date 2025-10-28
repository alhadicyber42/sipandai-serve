-- Fix infinite recursion in user_roles RLS policies
-- The issue: policies were checking user_roles table within the policy itself

-- 1. Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin pusat can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin pusat can manage all roles" ON public.user_roles;

-- 2. Create a security definer function that checks role from PROFILES table (not user_roles)
-- This breaks the recursion by looking at a different table
CREATE OR REPLACE FUNCTION public.is_admin_pusat()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin_pusat'
  )
$$;

-- 3. Create new policies using the safe function
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admin pusat can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin_pusat());

CREATE POLICY "Admin pusat can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin_pusat());

CREATE POLICY "Admin pusat can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin_pusat());

CREATE POLICY "Admin pusat can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin_pusat());

-- 4. Ensure all existing users have entries in user_roles table
-- Migrate from profiles.role to user_roles if not exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;