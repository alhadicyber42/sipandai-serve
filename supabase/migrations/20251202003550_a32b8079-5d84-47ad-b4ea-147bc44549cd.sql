-- Allow all authenticated users to view all profiles for Employee of the Month rating
CREATE POLICY "All users can view all profiles for rating"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Drop the restrictive policy that only allows users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;