
-- Add RLS policy to allow users to view basic profile info for EOM rating purposes
-- This allows users to see other profiles (name, nip, avatar, jabatan, kriteria_asn) needed for rating

CREATE POLICY "Users can view basic profiles for EOM rating"
ON public.profiles
FOR SELECT
USING (
  role = 'user_unit'::user_role
  OR role = 'user_pimpinan'::user_role
);
