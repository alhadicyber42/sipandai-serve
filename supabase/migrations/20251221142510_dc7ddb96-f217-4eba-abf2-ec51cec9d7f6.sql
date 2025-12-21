-- Add a policy for admin_unit to view approved_final services for letter generation
-- This ensures admin_unit can access approved submissions for generating letters

-- First, check if there's an issue with current policies
-- The current admin_pusat policy should work, but let's add explicit policies for letter generation

-- Add policy for admin_unit to view all approved_final services (for letter generation purposes)
CREATE POLICY "Admin unit can view approved final services for letters"
ON public.services
FOR SELECT
USING (
  status = 'approved_final'::service_status 
  AND current_user_role() = 'admin_unit'::user_role
);

-- Add policy for admin_pusat to view all approved_final services explicitly
CREATE POLICY "Admin pusat can view all approved final services"
ON public.services
FOR SELECT
USING (
  status = 'approved_final'::service_status 
  AND current_user_role() = 'admin_pusat'::user_role
);