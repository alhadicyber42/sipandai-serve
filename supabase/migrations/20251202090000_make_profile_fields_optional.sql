-- Make profile fields optional
ALTER TABLE public.profiles ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN nip DROP NOT NULL;

-- Update handle_new_user function to handle optional fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, work_unit_id, nip, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''), -- Default to empty string for name if missing, or maybe NULL? Let's keep empty string for name as it's usually required for display. But user said optional.
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user_unit'),
    CASE 
      WHEN (NEW.raw_user_meta_data->>'work_unit_id') IS NULL OR (NEW.raw_user_meta_data->>'work_unit_id') = '0' OR (NEW.raw_user_meta_data->>'work_unit_id') = '' THEN NULL
      ELSE (NEW.raw_user_meta_data->>'work_unit_id')::bigint
    END,
    NULLIF(NEW.raw_user_meta_data->>'nip', ''), -- Convert empty string to NULL to avoid unique constraint violation
    NULLIF(NEW.raw_user_meta_data->>'phone', '') -- Convert empty string to NULL
  );
  RETURN NEW;
END;
$$;
