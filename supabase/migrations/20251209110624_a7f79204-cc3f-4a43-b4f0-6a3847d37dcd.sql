-- Drop the unique constraint on nip column
-- This is needed because:
-- 1. Non-ASN users may not have NIP and can leave it empty
-- 2. Multiple users with empty NIP would violate the unique constraint
-- 3. Non-ASN users may use NIK which is not guaranteed to be unique in this context

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_nip_key;