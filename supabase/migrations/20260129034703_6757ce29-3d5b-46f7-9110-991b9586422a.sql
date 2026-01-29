-- =====================================================
-- FIX: Restrict profiles table data exposure
-- Creates a limited view for rating feature while
-- protecting sensitive personal data
-- =====================================================

-- 1. Create a secure view with only necessary fields for rating
-- Using security_invoker=on so the view respects RLS of the base table
CREATE OR REPLACE VIEW public.employee_rating_view
WITH (security_invoker=on) AS
SELECT 
  id,
  name,
  work_unit_id,
  jabatan,
  avatar_url,
  kriteria_asn,
  nip,
  role
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.employee_rating_view TO authenticated;

-- 2. Drop the overly permissive policy that exposes all data
DROP POLICY IF EXISTS "All users can view all profiles for rating" ON public.profiles;

-- 3. Create a new restrictive policy - users can only view limited fields via the view
-- Users can view their own full profile
CREATE POLICY "Users can view own full profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Note: The existing policies for admin_unit and admin_pusat remain in place
-- as they have proper role-based restrictions