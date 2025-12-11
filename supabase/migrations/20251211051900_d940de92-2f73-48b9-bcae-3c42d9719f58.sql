-- Add verification status columns to admin_pusat_evaluations table
ALTER TABLE public.admin_pusat_evaluations 
ADD COLUMN disciplinary_verified boolean NOT NULL DEFAULT false,
ADD COLUMN attendance_verified boolean NOT NULL DEFAULT false,
ADD COLUMN performance_verified boolean NOT NULL DEFAULT false,
ADD COLUMN contribution_verified boolean NOT NULL DEFAULT false,
ADD COLUMN disciplinary_verified_at timestamp with time zone,
ADD COLUMN attendance_verified_at timestamp with time zone,
ADD COLUMN performance_verified_at timestamp with time zone,
ADD COLUMN contribution_verified_at timestamp with time zone;