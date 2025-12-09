
-- Add unique constraint to prevent duplicate ratings from same rater to same employee in same period
ALTER TABLE public.employee_ratings
ADD CONSTRAINT unique_rater_employee_period UNIQUE (rater_id, rated_employee_id, rating_period);
