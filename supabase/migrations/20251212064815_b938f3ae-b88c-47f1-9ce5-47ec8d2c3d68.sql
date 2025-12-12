-- Create table for Employee of the Month settings
CREATE TABLE public.eom_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period text NOT NULL, -- format: YYYY-MM for monthly
  rating_start_date date NOT NULL,
  rating_end_date date NOT NULL,
  evaluation_start_date date NOT NULL,
  evaluation_end_date date NOT NULL,
  verification_start_date date NOT NULL,
  verification_end_date date NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(period)
);

-- Create table for work units that can participate in EoM
CREATE TABLE public.eom_participating_units (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_unit_id bigint NOT NULL REFERENCES public.work_units(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(work_unit_id)
);

-- Enable RLS
ALTER TABLE public.eom_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eom_participating_units ENABLE ROW LEVEL SECURITY;

-- RLS policies for eom_settings
CREATE POLICY "Admin pusat can manage eom settings"
ON public.eom_settings
FOR ALL
USING (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Everyone can view eom settings"
ON public.eom_settings
FOR SELECT
USING (true);

-- RLS policies for eom_participating_units
CREATE POLICY "Admin pusat can manage participating units"
ON public.eom_participating_units
FOR ALL
USING (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Everyone can view participating units"
ON public.eom_participating_units
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_eom_settings_updated_at
BEFORE UPDATE ON public.eom_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_eom_participating_units_updated_at
BEFORE UPDATE ON public.eom_participating_units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();