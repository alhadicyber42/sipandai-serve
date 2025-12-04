-- Drop existing restrictive UPDATE policies for services
DROP POLICY IF EXISTS "Users can update their own draft services" ON public.services;
DROP POLICY IF EXISTS "Users can update returned services" ON public.services;
DROP POLICY IF EXISTS "Admin pusat can update any service" ON public.services;
DROP POLICY IF EXISTS "Admin unit can update services in their unit" ON public.services;

-- Recreate UPDATE policies as PERMISSIVE (default)
CREATE POLICY "Users can update their own draft services" 
ON public.services 
FOR UPDATE 
USING (user_id = auth.uid() AND status = 'draft'::service_status);

CREATE POLICY "Users can update returned services" 
ON public.services 
FOR UPDATE 
USING (user_id = auth.uid() AND status = ANY (ARRAY['returned_to_user'::service_status, 'returned_to_unit'::service_status]));

CREATE POLICY "Admin unit can update services in their unit" 
ON public.services 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin_unit'::user_role 
  AND profiles.work_unit_id = services.work_unit_id
));

CREATE POLICY "Admin pusat can update any service" 
ON public.services 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin_pusat'::user_role
));