-- Update the handle_new_user function to include email from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email,
    name, 
    role, 
    work_unit_id, 
    nip, 
    phone,
    jabatan,
    pangkat_golongan,
    tmt_pns,
    tmt_pensiun,
    kriteria_asn,
    riwayat_jabatan,
    riwayat_mutasi,
    documents
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user_unit'),
    COALESCE((NEW.raw_user_meta_data->>'work_unit_id')::bigint, NULL),
    COALESCE(NEW.raw_user_meta_data->>'nip', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'jabatan', NULL),
    COALESCE(NEW.raw_user_meta_data->>'pangkat_golongan', NULL),
    COALESCE((NEW.raw_user_meta_data->>'tmt_pns')::date, NULL),
    COALESCE((NEW.raw_user_meta_data->>'tmt_pensiun')::date, NULL),
    COALESCE(NEW.raw_user_meta_data->>'kriteria_asn', NULL),
    COALESCE((NEW.raw_user_meta_data->>'riwayat_jabatan')::jsonb, '[]'::jsonb),
    COALESCE((NEW.raw_user_meta_data->>'riwayat_mutasi')::jsonb, '[]'::jsonb),
    '{}'::jsonb
  );
  RETURN NEW;
END;
$function$;