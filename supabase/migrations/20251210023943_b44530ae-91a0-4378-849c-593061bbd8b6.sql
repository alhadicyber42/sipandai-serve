-- Create table for designated Employee of the Month / Year winners
CREATE TABLE public.designated_winners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    winner_type TEXT NOT NULL CHECK (winner_type IN ('monthly', 'yearly')),
    employee_category TEXT NOT NULL CHECK (employee_category IN ('ASN', 'Non ASN')),
    period TEXT NOT NULL, -- Format: YYYY-MM for monthly, YYYY for yearly
    final_points INTEGER NOT NULL DEFAULT 0,
    designated_by UUID NOT NULL,
    designated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (winner_type, employee_category, period)
);

-- Enable RLS
ALTER TABLE public.designated_winners ENABLE ROW LEVEL SECURITY;

-- Admin pusat can manage all designated winners
CREATE POLICY "Admin pusat can insert designated winners"
ON public.designated_winners
FOR INSERT
WITH CHECK (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Admin pusat can update designated winners"
ON public.designated_winners
FOR UPDATE
USING (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Admin pusat can delete designated winners"
ON public.designated_winners
FOR DELETE
USING (current_user_role() = 'admin_pusat'::user_role);

-- Everyone can view designated winners (for leaderboard display)
CREATE POLICY "Everyone can view designated winners"
ON public.designated_winners
FOR SELECT
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_designated_winners_updated_at
BEFORE UPDATE ON public.designated_winners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();