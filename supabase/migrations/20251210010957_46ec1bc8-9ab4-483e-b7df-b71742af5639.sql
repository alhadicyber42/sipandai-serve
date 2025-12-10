-- Create letter_templates table for storing document templates
CREATE TABLE public.letter_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    work_unit_id BIGINT NOT NULL REFERENCES public.work_units(id),
    template_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('cuti', 'kenaikan_pangkat', 'pensiun', 'mutasi', 'lainnya')),
    template_content TEXT,
    file_content TEXT, -- Base64 encoded .docx file
    file_name TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.letter_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admin pusat can manage all templates
CREATE POLICY "Admin pusat can manage all templates"
ON public.letter_templates
FOR ALL
USING (current_user_role() = 'admin_pusat'::user_role);

-- Admin unit can view templates for their unit
CREATE POLICY "Admin unit can view templates for their unit"
ON public.letter_templates
FOR SELECT
USING (
    current_user_role() = 'admin_unit'::user_role 
    AND work_unit_id = current_user_work_unit()
);

-- Admin unit can insert templates for their unit
CREATE POLICY "Admin unit can insert templates for their unit"
ON public.letter_templates
FOR INSERT
WITH CHECK (
    current_user_role() = 'admin_unit'::user_role 
    AND work_unit_id = current_user_work_unit()
);

-- Admin unit can update templates for their unit
CREATE POLICY "Admin unit can update templates for their unit"
ON public.letter_templates
FOR UPDATE
USING (
    current_user_role() = 'admin_unit'::user_role 
    AND work_unit_id = current_user_work_unit()
);

-- Admin unit can delete templates for their unit
CREATE POLICY "Admin unit can delete templates for their unit"
ON public.letter_templates
FOR DELETE
USING (
    current_user_role() = 'admin_unit'::user_role 
    AND work_unit_id = current_user_work_unit()
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_letter_templates_updated_at
BEFORE UPDATE ON public.letter_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_letter_templates_work_unit_category ON public.letter_templates(work_unit_id, category);