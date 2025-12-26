-- Create holidays table for managing national holidays
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Everyone can view holidays
CREATE POLICY "Everyone can view holidays"
ON public.holidays
FOR SELECT
USING (true);

-- Only admin_pusat can manage holidays
CREATE POLICY "Admin pusat can insert holidays"
ON public.holidays
FOR INSERT
WITH CHECK (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Admin pusat can update holidays"
ON public.holidays
FOR UPDATE
USING (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Admin pusat can delete holidays"
ON public.holidays
FOR DELETE
USING (current_user_role() = 'admin_pusat'::user_role);

-- Create trigger for updated_at
CREATE TRIGGER update_holidays_updated_at
BEFORE UPDATE ON public.holidays
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster date lookups
CREATE INDEX idx_holidays_date ON public.holidays(date);
CREATE INDEX idx_holidays_date_year ON public.holidays(EXTRACT(YEAR FROM date));