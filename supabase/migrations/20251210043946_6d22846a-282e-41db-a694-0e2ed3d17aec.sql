-- Add evidence link columns for each evaluation criteria in admin_pusat_evaluations table
ALTER TABLE public.admin_pusat_evaluations 
ADD COLUMN disciplinary_evidence_link text DEFAULT NULL,
ADD COLUMN attendance_evidence_link text DEFAULT NULL,
ADD COLUMN performance_evidence_link text DEFAULT NULL,
ADD COLUMN contribution_evidence_link text DEFAULT NULL;