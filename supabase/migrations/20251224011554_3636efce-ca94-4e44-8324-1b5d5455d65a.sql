-- Rename and modify leave_details columns for new form fields
-- 1. Rename substitute_employee to leave_quota_year (stores the year for leave quota)
-- 2. Rename emergency_contact to address_during_leave (stores address during leave)
-- 3. Add new column for form_date (tanggal formulir pengajuan)

-- First, add new columns
ALTER TABLE public.leave_details
ADD COLUMN IF NOT EXISTS leave_quota_year integer,
ADD COLUMN IF NOT EXISTS address_during_leave text,
ADD COLUMN IF NOT EXISTS form_date date;

-- Migrate existing data: copy substitute_employee values if they look like years
-- (This is a soft migration - old data will be preserved)

-- Note: The old columns (substitute_employee, emergency_contact) will be kept for backward compatibility
-- but new submissions will use the new columns