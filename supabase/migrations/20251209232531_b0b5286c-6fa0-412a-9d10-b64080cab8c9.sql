-- Create FAQ table for AI knowledge base
CREATE TABLE public.faqs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    work_unit_id INTEGER REFERENCES public.work_units(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Create index for better search performance
CREATE INDEX idx_faqs_category ON public.faqs(category);
CREATE INDEX idx_faqs_keywords ON public.faqs USING GIN(keywords);
CREATE INDEX idx_faqs_question ON public.faqs USING GIN(to_tsvector('indonesian', question));
CREATE INDEX idx_faqs_answer ON public.faqs USING GIN(to_tsvector('indonesian', answer));

-- RLS Policies
-- Everyone can read active FAQs
CREATE POLICY "Anyone can read active FAQs"
ON public.faqs
FOR SELECT
USING (is_active = true);

-- Admin pusat can manage all FAQs
CREATE POLICY "Admin pusat can manage all FAQs"
ON public.faqs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin_pusat'
    )
);

-- Admin unit can manage FAQs for their unit
CREATE POLICY "Admin unit can manage their unit FAQs"
ON public.faqs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin_unit'
        AND profiles.work_unit_id = faqs.work_unit_id
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();