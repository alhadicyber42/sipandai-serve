-- Add user_pimpinan to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user_pimpinan';

-- Add column to employee_ratings to track if rating is from pimpinan (for weight calculation)
ALTER TABLE public.employee_ratings 
ADD COLUMN IF NOT EXISTS is_pimpinan_rating boolean DEFAULT false;