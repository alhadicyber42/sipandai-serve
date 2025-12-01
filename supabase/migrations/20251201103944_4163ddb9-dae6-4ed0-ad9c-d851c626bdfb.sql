-- Fix leave_deferrals table structure
ALTER TABLE public.leave_deferrals 
RENAME COLUMN year TO deferral_year;

ALTER TABLE public.leave_deferrals 
ADD COLUMN IF NOT EXISTS approval_document text,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Add missing columns to profiles for retirement tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS retirement_date date,
ADD COLUMN IF NOT EXISTS retirement_reminder_sent_at timestamp with time zone;

-- Drop old unique constraint and create new one with deferral_year
ALTER TABLE public.leave_deferrals 
DROP CONSTRAINT IF EXISTS leave_deferrals_user_id_year_key;

ALTER TABLE public.leave_deferrals 
ADD CONSTRAINT leave_deferrals_user_id_deferral_year_key UNIQUE(user_id, deferral_year);

-- Create retirement_reminders table
CREATE TABLE IF NOT EXISTS public.retirement_reminders (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_type text NOT NULL CHECK (reminder_type IN ('email', 'whatsapp', 'manual')),
    status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
    sent_at timestamp with time zone NOT NULL DEFAULT now(),
    message text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on retirement_reminders
ALTER TABLE public.retirement_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for retirement_reminders
CREATE POLICY "Users can view their own retirement reminders" ON public.retirement_reminders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin pusat can view all retirement reminders" ON public.retirement_reminders
    FOR SELECT USING (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Admin pusat can insert retirement reminders" ON public.retirement_reminders
    FOR INSERT WITH CHECK (current_user_role() = 'admin_pusat'::user_role);

CREATE POLICY "Admin unit can insert retirement reminders for their unit" ON public.retirement_reminders
    FOR INSERT WITH CHECK (
        current_user_role() = 'admin_unit'::user_role AND
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = retirement_reminders.user_id 
            AND p.work_unit_id = current_user_work_unit()
        )
    );

CREATE POLICY "Admin unit can view retirement reminders for their unit" ON public.retirement_reminders
    FOR SELECT USING (
        current_user_role() = 'admin_unit'::user_role AND
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = retirement_reminders.user_id 
            AND p.work_unit_id = current_user_work_unit()
        )
    );