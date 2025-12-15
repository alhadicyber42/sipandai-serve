-- Drop existing restrictive policies on leave_deferrals
DROP POLICY IF EXISTS "Admin pusat can insert leave deferrals" ON public.leave_deferrals;
DROP POLICY IF EXISTS "Admin pusat can update leave deferrals" ON public.leave_deferrals;
DROP POLICY IF EXISTS "Admin pusat can view all leave deferrals" ON public.leave_deferrals;
DROP POLICY IF EXISTS "Users can view their own leave deferrals" ON public.leave_deferrals;

-- Create new policies

-- 1. Users can INSERT their own deferral requests
CREATE POLICY "Users can insert their own leave deferrals"
ON public.leave_deferrals
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 2. Users can view their own deferrals
CREATE POLICY "Users can view their own leave deferrals"
ON public.leave_deferrals
FOR SELECT
USING (user_id = auth.uid());

-- 3. Admin unit can view deferrals for users in their work unit
CREATE POLICY "Admin unit can view leave deferrals for their unit"
ON public.leave_deferrals
FOR SELECT
USING (
  (current_user_role() = 'admin_unit') AND 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = leave_deferrals.user_id 
    AND p.work_unit_id = current_user_work_unit()
  )
);

-- 4. Admin unit can update deferrals for users in their work unit
CREATE POLICY "Admin unit can update leave deferrals for their unit"
ON public.leave_deferrals
FOR UPDATE
USING (
  (current_user_role() = 'admin_unit') AND 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = leave_deferrals.user_id 
    AND p.work_unit_id = current_user_work_unit()
  )
);

-- 5. Admin pusat can view all deferrals
CREATE POLICY "Admin pusat can view all leave deferrals"
ON public.leave_deferrals
FOR SELECT
USING (current_user_role() = 'admin_pusat');

-- 6. Admin pusat can update all deferrals
CREATE POLICY "Admin pusat can update all leave deferrals"
ON public.leave_deferrals
FOR UPDATE
USING (current_user_role() = 'admin_pusat');

-- 7. Admin pusat can insert deferrals (for manual entry if needed)
CREATE POLICY "Admin pusat can insert leave deferrals"
ON public.leave_deferrals
FOR INSERT
WITH CHECK (current_user_role() = 'admin_pusat');