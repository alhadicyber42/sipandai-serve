-- Create function to check if user is pimpinan
CREATE OR REPLACE FUNCTION public.is_user_pimpinan()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'user_pimpinan'
  )
$$;

-- Update current_user_role function to include user_pimpinan priority
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role
      WHEN 'admin_pusat' THEN 1
      WHEN 'admin_unit' THEN 2
      WHEN 'user_pimpinan' THEN 3
      WHEN 'user_unit' THEN 4
    END
  LIMIT 1
$$;

-- Update get_user_role function to include user_pimpinan
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin_pusat' THEN 1
      WHEN 'admin_unit' THEN 2
      WHEN 'user_pimpinan' THEN 3
      WHEN 'user_unit' THEN 4
    END
  LIMIT 1
$$;