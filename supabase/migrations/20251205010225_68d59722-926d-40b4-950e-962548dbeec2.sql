-- Update the policy for users updating returned services to set status to resubmitted
DROP POLICY IF EXISTS "Users can update returned services" ON public.services;
CREATE POLICY "Users can update returned services" 
ON public.services 
FOR UPDATE 
USING (user_id = auth.uid() AND status = ANY (ARRAY['returned_to_user'::service_status, 'returned_to_unit'::service_status]))
WITH CHECK (user_id = auth.uid() AND status = ANY (ARRAY['returned_to_user'::service_status, 'returned_to_unit'::service_status, 'submitted'::service_status, 'resubmitted'::service_status]));