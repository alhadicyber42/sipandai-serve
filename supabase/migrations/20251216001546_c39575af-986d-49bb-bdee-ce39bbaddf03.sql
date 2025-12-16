-- Drop the existing check constraint
ALTER TABLE public.leave_deferrals DROP CONSTRAINT leave_deferrals_status_check;

-- Add new check constraint with additional status values
ALTER TABLE public.leave_deferrals ADD CONSTRAINT leave_deferrals_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'rejected'::text, 'used'::text, 'expired'::text]));