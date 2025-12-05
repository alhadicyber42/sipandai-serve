-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can update returned services" ON public.services;

-- Create new permissive policy with proper WITH CHECK clause
-- USING: checks current row state (must be returned status and owned by user)
-- WITH CHECK: allows updating to submitted status (for resubmission)
CREATE POLICY "Users can update returned services" 
ON public.services 
FOR UPDATE 
USING ((user_id = auth.uid()) AND (status = ANY (ARRAY['returned_to_user'::service_status, 'returned_to_unit'::service_status])))
WITH CHECK ((user_id = auth.uid()) AND (status = ANY (ARRAY['returned_to_user'::service_status, 'returned_to_unit'::service_status, 'submitted'::service_status])));