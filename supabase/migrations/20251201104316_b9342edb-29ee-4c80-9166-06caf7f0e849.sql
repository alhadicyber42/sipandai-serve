-- Create employee_ratings table for Employee of the Month feature
CREATE TABLE IF NOT EXISTS public.employee_ratings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rater_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rated_employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating_period text NOT NULL, -- Format: YYYY-MM
    reason text NOT NULL,
    detailed_ratings jsonb NOT NULL DEFAULT '{}'::jsonb,
    criteria_totals jsonb NOT NULL DEFAULT '{}'::jsonb,
    total_points integer NOT NULL DEFAULT 0,
    max_possible_points integer NOT NULL DEFAULT 125,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(rater_id, rated_employee_id, rating_period)
);

-- Enable RLS on employee_ratings
ALTER TABLE public.employee_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_ratings
CREATE POLICY "Users can view all ratings" ON public.employee_ratings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert ratings" ON public.employee_ratings
    FOR INSERT WITH CHECK (rater_id = auth.uid());

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    work_unit_id bigint REFERENCES public.work_units(id) ON DELETE CASCADE, -- NULL = all units
    is_pinned boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS policies for announcements
CREATE POLICY "Everyone can view announcements for their unit or all units" ON public.announcements
    FOR SELECT USING (
        work_unit_id IS NULL OR 
        work_unit_id = current_user_work_unit() OR
        current_user_role() = 'admin_pusat'::user_role
    );

CREATE POLICY "Admin pusat can insert any announcement" ON public.announcements
    FOR INSERT WITH CHECK (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Admin unit can insert announcements for their unit" ON public.announcements
    FOR INSERT WITH CHECK (
        current_user_role() = 'admin_unit'::user_role AND
        work_unit_id = current_user_work_unit()
    );

CREATE POLICY "Admin pusat can update any announcement" ON public.announcements
    FOR UPDATE USING (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Admin unit can update their own announcements" ON public.announcements
    FOR UPDATE USING (
        current_user_role() = 'admin_unit'::user_role AND
        author_id = auth.uid()
    );

CREATE POLICY "Admin pusat can delete any announcement" ON public.announcements
    FOR DELETE USING (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Admin unit can delete their own announcements" ON public.announcements
    FOR DELETE USING (
        current_user_role() = 'admin_unit'::user_role AND
        author_id = auth.uid()
    );

-- Create trigger for updating updated_at on announcements
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();