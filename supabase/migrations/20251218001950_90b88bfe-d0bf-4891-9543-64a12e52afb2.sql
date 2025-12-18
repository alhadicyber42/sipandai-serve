-- Drop existing policies on letter_templates
DROP POLICY IF EXISTS "Admin pusat can manage all templates" ON public.letter_templates;
DROP POLICY IF EXISTS "Admin unit can delete templates for their unit" ON public.letter_templates;
DROP POLICY IF EXISTS "Admin unit can insert templates for their unit" ON public.letter_templates;
DROP POLICY IF EXISTS "Admin unit can update templates for their unit" ON public.letter_templates;
DROP POLICY IF EXISTS "Admin unit can view templates for their unit" ON public.letter_templates;

-- Create new policies that restrict access to only templates created by the user

-- SELECT: Users can only view templates they created
CREATE POLICY "Users can view their own templates"
ON public.letter_templates
FOR SELECT
USING (created_by = auth.uid());

-- INSERT: Users can insert templates (and it will automatically be their own)
CREATE POLICY "Users can insert their own templates"
ON public.letter_templates
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- UPDATE: Users can only update templates they created
CREATE POLICY "Users can update their own templates"
ON public.letter_templates
FOR UPDATE
USING (created_by = auth.uid());

-- DELETE: Users can only delete templates they created
CREATE POLICY "Users can delete their own templates"
ON public.letter_templates
FOR DELETE
USING (created_by = auth.uid());