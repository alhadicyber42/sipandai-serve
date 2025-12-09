-- Create admin_pusat_evaluations table for final evaluations
-- Admin pusat can adjust all criteria from admin_unit evaluations

CREATE TABLE public.admin_pusat_evaluations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rated_employee_id UUID NOT NULL,
    evaluator_id UUID NOT NULL,
    rating_period TEXT NOT NULL,
    
    -- Reference to admin_unit evaluation
    admin_unit_evaluation_id UUID REFERENCES public.admin_unit_evaluations(id),
    
    -- Original points from peers
    peer_total_points INTEGER NOT NULL DEFAULT 0,
    
    -- Admin unit evaluation points (if exists)
    admin_unit_final_points INTEGER DEFAULT NULL,
    
    -- Adjustments by admin pusat (can override admin_unit decisions)
    -- Disciplinary Action
    has_disciplinary_action BOOLEAN NOT NULL DEFAULT false,
    disciplinary_penalty INTEGER NOT NULL DEFAULT 0,
    disciplinary_action_note TEXT,
    
    -- Attendance
    has_poor_attendance BOOLEAN NOT NULL DEFAULT false,
    attendance_penalty INTEGER NOT NULL DEFAULT 0,
    attendance_note TEXT,
    
    -- Performance/E-Kinerja
    has_poor_performance BOOLEAN NOT NULL DEFAULT false,
    performance_penalty INTEGER NOT NULL DEFAULT 0,
    performance_note TEXT,
    
    -- Contribution
    has_contribution BOOLEAN NOT NULL DEFAULT false,
    contribution_bonus INTEGER NOT NULL DEFAULT 0,
    contribution_description TEXT,
    
    -- Additional adjustments by admin pusat
    additional_adjustment INTEGER NOT NULL DEFAULT 0,
    additional_adjustment_note TEXT,
    
    -- Final points after all adjustments
    final_total_points INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Unique constraint: one evaluation per employee per period
    UNIQUE (rated_employee_id, rating_period)
);

-- Enable Row Level Security
ALTER TABLE public.admin_pusat_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin pusat can do everything
CREATE POLICY "Admin pusat can view all final evaluations" 
ON public.admin_pusat_evaluations 
FOR SELECT 
USING (current_user_role() = 'admin_pusat');

CREATE POLICY "Admin pusat can insert final evaluations" 
ON public.admin_pusat_evaluations 
FOR INSERT 
WITH CHECK (current_user_role() = 'admin_pusat');

CREATE POLICY "Admin pusat can update final evaluations" 
ON public.admin_pusat_evaluations 
FOR UPDATE 
USING (current_user_role() = 'admin_pusat');

-- Admin unit can view final evaluations for their unit (read-only)
CREATE POLICY "Admin unit can view final evaluations for their unit" 
ON public.admin_pusat_evaluations 
FOR SELECT 
USING (
    current_user_role() = 'admin_unit' AND 
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = admin_pusat_evaluations.rated_employee_id 
        AND p.work_unit_id = current_user_work_unit()
    )
);

-- Users can view their own final evaluations
CREATE POLICY "Users can view their own final evaluations" 
ON public.admin_pusat_evaluations 
FOR SELECT 
USING (rated_employee_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_admin_pusat_evaluations_updated_at
    BEFORE UPDATE ON public.admin_pusat_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();