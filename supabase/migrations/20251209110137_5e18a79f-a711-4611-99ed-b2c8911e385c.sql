-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a new PERMISSIVE policy for users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());