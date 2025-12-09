-- Add new columns to profiles table
-- Personal info additions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tempat_lahir text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tanggal_lahir date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alamat_lengkap text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS riwayat_pendidikan jsonb DEFAULT '[]'::jsonb;

-- Employment data additions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS riwayat_diklat jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS riwayat_uji_kompetensi jsonb DEFAULT '[]'::jsonb;