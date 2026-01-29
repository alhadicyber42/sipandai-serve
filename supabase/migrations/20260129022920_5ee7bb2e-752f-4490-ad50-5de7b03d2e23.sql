-- SECURITY FIX: Prevent privilege escalation via user metadata
-- The handle_new_user_role function was accepting role from user metadata
-- which could allow attackers to escalate to admin_pusat

-- Fix handle_new_user_role to ALWAYS insert as user_unit, ignoring metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY: Always insert as user_unit, ignore any role from metadata
  -- Only admin_pusat can assign higher roles through secure admin UI
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user_unit')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Also fix handle_new_user function if it exists to not trust metadata role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with user_unit role, ignoring any metadata role
  INSERT INTO public.profiles (id, name, nip, role, work_unit_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'nip', ''),
    'user_unit', -- SECURITY: Always use user_unit, ignore metadata role
    (NEW.raw_user_meta_data->>'work_unit_id')::bigint
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    nip = COALESCE(EXCLUDED.nip, profiles.nip);
  RETURN NEW;
END;
$$;