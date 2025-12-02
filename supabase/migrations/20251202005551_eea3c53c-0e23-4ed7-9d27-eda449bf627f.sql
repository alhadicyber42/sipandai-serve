-- Add kriteria_asn column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kriteria_asn text;

-- Add comment to describe the column
COMMENT ON COLUMN public.profiles.kriteria_asn IS 'Kriteria ASN pegawai: ASN atau Non ASN';