-- Drop existing restrictive policies for job_formations
DROP POLICY IF EXISTS "Admin pusat can delete job formations" ON public.job_formations;
DROP POLICY IF EXISTS "Admin pusat can insert job formations" ON public.job_formations;
DROP POLICY IF EXISTS "Admin pusat can update job formations" ON public.job_formations;

-- Create new policies that allow both admin_pusat and admin_unit (for their own unit)

-- Admin pusat can insert job formations for any unit
CREATE POLICY "Admin pusat can insert job formations" 
ON public.job_formations 
FOR INSERT 
WITH CHECK (current_user_role() = 'admin_pusat'::user_role);

-- Admin unit can insert job formations for their own unit
CREATE POLICY "Admin unit can insert job formations for their unit" 
ON public.job_formations 
FOR INSERT 
WITH CHECK (
  current_user_role() = 'admin_unit'::user_role 
  AND work_unit_id = current_user_work_unit()
);

-- Admin pusat can update job formations for any unit
CREATE POLICY "Admin pusat can update job formations" 
ON public.job_formations 
FOR UPDATE 
USING (current_user_role() = 'admin_pusat'::user_role);

-- Admin unit can update job formations for their own unit
CREATE POLICY "Admin unit can update job formations for their unit" 
ON public.job_formations 
FOR UPDATE 
USING (
  current_user_role() = 'admin_unit'::user_role 
  AND work_unit_id = current_user_work_unit()
);

-- Admin pusat can delete job formations for any unit
CREATE POLICY "Admin pusat can delete job formations" 
ON public.job_formations 
FOR DELETE 
USING (current_user_role() = 'admin_pusat'::user_role);

-- Admin unit can delete job formations for their own unit
CREATE POLICY "Admin unit can delete job formations for their unit" 
ON public.job_formations 
FOR DELETE 
USING (
  current_user_role() = 'admin_unit'::user_role 
  AND work_unit_id = current_user_work_unit()
);

-- Add columns to services table for transfer target
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS target_work_unit_id bigint REFERENCES public.work_units(id);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS target_job_formation_id uuid REFERENCES public.job_formations(id);