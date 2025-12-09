
-- Allow all authenticated users to view admin_unit_evaluations for leaderboard display
CREATE POLICY "All users can view admin unit evaluations for leaderboard"
ON public.admin_unit_evaluations
FOR SELECT
USING (true);

-- Allow all authenticated users to view admin_pusat_evaluations for leaderboard display
CREATE POLICY "All users can view admin pusat evaluations for leaderboard"
ON public.admin_pusat_evaluations
FOR SELECT
USING (true);
