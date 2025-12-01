-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS jabatan text,
ADD COLUMN IF NOT EXISTS pangkat_golongan text,
ADD COLUMN IF NOT EXISTS alamat text,
ADD COLUMN IF NOT EXISTS tempat_lahir text,
ADD COLUMN IF NOT EXISTS tanggal_lahir date,
ADD COLUMN IF NOT EXISTS jenis_kelamin text,
ADD COLUMN IF NOT EXISTS agama text,
ADD COLUMN IF NOT EXISTS status_perkawinan text,
ADD COLUMN IF NOT EXISTS pendidikan_terakhir text,
ADD COLUMN IF NOT EXISTS tmt_pns date,
ADD COLUMN IF NOT EXISTS tmt_pensiun date,
ADD COLUMN IF NOT EXISTS masa_kerja_tahun integer,
ADD COLUMN IF NOT EXISTS masa_kerja_bulan integer,
ADD COLUMN IF NOT EXISTS nomor_hp text,
ADD COLUMN IF NOT EXISTS nomor_wa text,
ADD COLUMN IF NOT EXISTS email_alternatif text,
ADD COLUMN IF NOT EXISTS alamat_lengkap text,
ADD COLUMN IF NOT EXISTS riwayat_jabatan jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS riwayat_mutasi jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '{}'::jsonb;

-- Create leave_deferrals table for tracking carried over leave days
CREATE TABLE IF NOT EXISTS public.leave_deferrals (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year integer NOT NULL,
    days_deferred integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    notes text,
    UNIQUE(user_id, year)
);

-- Enable RLS on leave_deferrals
ALTER TABLE public.leave_deferrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for leave_deferrals
CREATE POLICY "Users can view their own leave deferrals" ON public.leave_deferrals
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin pusat can view all leave deferrals" ON public.leave_deferrals
    FOR SELECT USING (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Admin pusat can insert leave deferrals" ON public.leave_deferrals
    FOR INSERT WITH CHECK (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Admin pusat can update leave deferrals" ON public.leave_deferrals
    FOR UPDATE USING (current_user_role() = 'admin_pusat'::user_role);

-- Create job_formations table for managing job positions/quotas
CREATE TABLE IF NOT EXISTS public.job_formations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    work_unit_id bigint NOT NULL REFERENCES public.work_units(id) ON DELETE CASCADE,
    position_name text NOT NULL,
    quota integer NOT NULL DEFAULT 1,
    filled integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    description text,
    UNIQUE(work_unit_id, position_name)
);

-- Enable RLS on job_formations
ALTER TABLE public.job_formations ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_formations
CREATE POLICY "Everyone can view job formations" ON public.job_formations
    FOR SELECT USING (true);

CREATE POLICY "Admin pusat can insert job formations" ON public.job_formations
    FOR INSERT WITH CHECK (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Admin pusat can update job formations" ON public.job_formations
    FOR UPDATE USING (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Admin pusat can delete job formations" ON public.job_formations
    FOR DELETE USING (current_user_role() = 'admin_pusat'::user_role);

-- Create trigger for updating updated_at on leave_deferrals
CREATE TRIGGER update_leave_deferrals_updated_at
    BEFORE UPDATE ON public.leave_deferrals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating updated_at on job_formations
CREATE TRIGGER update_job_formations_updated_at
    BEFORE UPDATE ON public.job_formations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();