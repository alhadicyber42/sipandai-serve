-- Create table for admin unit secondary evaluation
CREATE TABLE public.admin_unit_evaluations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rated_employee_id UUID NOT NULL,
    evaluator_id UUID NOT NULL,
    rating_period TEXT NOT NULL,
    work_unit_id BIGINT NOT NULL,
    
    -- Evaluation criteria
    has_disciplinary_action BOOLEAN NOT NULL DEFAULT false,
    disciplinary_action_note TEXT,
    
    has_poor_attendance BOOLEAN NOT NULL DEFAULT false,
    attendance_note TEXT,
    
    has_poor_performance BOOLEAN NOT NULL DEFAULT false,
    performance_note TEXT,
    
    has_contribution BOOLEAN NOT NULL DEFAULT false,
    contribution_description TEXT,
    
    -- Score adjustments
    original_total_points INTEGER NOT NULL DEFAULT 0,
    disciplinary_penalty INTEGER NOT NULL DEFAULT 0,
    attendance_penalty INTEGER NOT NULL DEFAULT 0,
    performance_penalty INTEGER NOT NULL DEFAULT 0,
    contribution_bonus INTEGER NOT NULL DEFAULT 0,
    final_total_points INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Unique constraint: one evaluation per employee per period per unit
    UNIQUE(rated_employee_id, rating_period, work_unit_id)
);

-- Enable Row Level Security
ALTER TABLE public.admin_unit_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin unit can insert evaluations for their unit" 
ON public.admin_unit_evaluations 
FOR INSERT 
WITH CHECK (
    current_user_role() = 'admin_unit'::user_role 
    AND work_unit_id = current_user_work_unit()
);

CREATE POLICY "Admin unit can update evaluations for their unit" 
ON public.admin_unit_evaluations 
FOR UPDATE 
USING (
    current_user_role() = 'admin_unit'::user_role 
    AND work_unit_id = current_user_work_unit()
);

CREATE POLICY "Admin unit can view evaluations for their unit" 
ON public.admin_unit_evaluations 
FOR SELECT 
USING (
    current_user_role() = 'admin_unit'::user_role 
    AND work_unit_id = current_user_work_unit()
);

CREATE POLICY "Admin pusat can view all evaluations" 
ON public.admin_unit_evaluations 
FOR SELECT 
USING (current_user_role() = 'admin_pusat'::user_role);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_unit_evaluations_updated_at
BEFORE UPDATE ON public.admin_unit_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();