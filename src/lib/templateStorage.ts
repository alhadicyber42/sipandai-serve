/**
 * Template Storage - Supabase Database
 * Storage solution for letter templates using Supabase
 */

import { supabase } from "@/integrations/supabase/client";
import { LetterTemplate, CreateTemplateInput, UpdateTemplateInput, LetterCategory } from "@/types/leave-certificate";

/**
 * Get all templates from database
 */
export const getAllTemplates = async (): Promise<LetterTemplate[]> => {
    const { data, error } = await supabase
        .from("letter_templates")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error reading templates from database:", error);
        return [];
    }

    return (data || []).map(mapDbToTemplate);
};

/**
 * Get templates by work unit ID and optional category
 * @deprecated Use getTemplatesByCreator instead for user-specific templates
 */
export const getTemplatesByWorkUnit = async (workUnitId: number, category?: LetterCategory): Promise<LetterTemplate[]> => {
    let query = supabase
        .from("letter_templates")
        .select("*")
        .eq("work_unit_id", workUnitId);

    if (category) {
        query = query.eq("category", category);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
        console.error("Error reading templates:", error);
        return [];
    }

    return (data || []).map(mapDbToTemplate);
};

/**
 * Get templates created by a specific user (for their own use)
 * This ensures admins only see templates they uploaded themselves
 */
export const getTemplatesByCreator = async (userId: string, category?: LetterCategory): Promise<LetterTemplate[]> => {
    let query = supabase
        .from("letter_templates")
        .select("*")
        .eq("created_by", userId);

    if (category) {
        query = query.eq("category", category);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
        console.error("Error reading templates by creator:", error);
        return [];
    }

    return (data || []).map(mapDbToTemplate);
};

/**
 * Get template by ID
 */
export const getTemplateById = async (id: string): Promise<LetterTemplate | null> => {
    const { data, error } = await supabase
        .from("letter_templates")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error || !data) {
        console.error("Error reading template:", error);
        return null;
    }

    return mapDbToTemplate(data);
};

/**
 * Get default template for a work unit and category
 */
export const getDefaultTemplate = async (workUnitId: number, category: LetterCategory = 'cuti'): Promise<LetterTemplate | null> => {
    // First try to find a default template
    const { data: defaultData } = await supabase
        .from("letter_templates")
        .select("*")
        .eq("work_unit_id", workUnitId)
        .eq("category", category)
        .eq("is_default", true)
        .maybeSingle();

    if (defaultData) {
        return mapDbToTemplate(defaultData);
    }

    // Fallback to first available template
    const { data: firstData } = await supabase
        .from("letter_templates")
        .select("*")
        .eq("work_unit_id", workUnitId)
        .eq("category", category)
        .limit(1)
        .maybeSingle();

    return firstData ? mapDbToTemplate(firstData) : null;
};

/**
 * Create a new template
 */
export const createTemplate = async (
    input: CreateTemplateInput,
    userId: string
): Promise<LetterTemplate | null> => {
    // If this is set as default, unset other defaults for this work unit AND category
    if (input.is_default) {
        await supabase
            .from("letter_templates")
            .update({ is_default: false })
            .eq("work_unit_id", input.work_unit_id)
            .eq("category", input.category);
    }

    const { data, error } = await supabase
        .from("letter_templates")
        .insert({
            work_unit_id: input.work_unit_id,
            template_name: input.template_name,
            category: input.category,
            template_content: input.template_content || null,
            file_content: input.file_content || null,
            file_name: input.file_name || null,
            is_default: input.is_default || false,
            created_by: userId
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating template:", error);
        return null;
    }

    return mapDbToTemplate(data);
};

/**
 * Update an existing template
 */
export const updateTemplate = async (
    id: string,
    input: UpdateTemplateInput
): Promise<LetterTemplate | null> => {
    // Get current template to check work_unit_id and category
    const { data: currentTemplate } = await supabase
        .from("letter_templates")
        .select("work_unit_id, category")
        .eq("id", id)
        .single();

    if (!currentTemplate) {
        return null;
    }

    // If setting as default, unset other defaults for this work unit AND category
    if (input.is_default) {
        const targetCategory = input.category || currentTemplate.category;
        await supabase
            .from("letter_templates")
            .update({ is_default: false })
            .eq("work_unit_id", currentTemplate.work_unit_id)
            .eq("category", targetCategory)
            .neq("id", id);
    }

    const updateData: Record<string, any> = {};
    if (input.template_name !== undefined) updateData.template_name = input.template_name;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.template_content !== undefined) updateData.template_content = input.template_content;
    if (input.file_content !== undefined) updateData.file_content = input.file_content;
    if (input.file_name !== undefined) updateData.file_name = input.file_name;
    if (input.is_default !== undefined) updateData.is_default = input.is_default;

    const { data, error } = await supabase
        .from("letter_templates")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating template:", error);
        return null;
    }

    return mapDbToTemplate(data);
};

/**
 * Delete a template
 */
export const deleteTemplate = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from("letter_templates")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting template:", error);
        return false;
    }

    return true;
};

/**
 * Set a template as default for its work unit and category
 */
export const setDefaultTemplate = async (id: string): Promise<boolean> => {
    // Get template to find work_unit_id and category
    const { data: template } = await supabase
        .from("letter_templates")
        .select("work_unit_id, category")
        .eq("id", id)
        .single();

    if (!template) return false;

    // Unset all defaults for this work unit AND category
    await supabase
        .from("letter_templates")
        .update({ is_default: false })
        .eq("work_unit_id", template.work_unit_id)
        .eq("category", template.category);

    // Set this one as default
    const { error } = await supabase
        .from("letter_templates")
        .update({ is_default: true })
        .eq("id", id);

    if (error) {
        console.error("Error setting default template:", error);
        return false;
    }

    return true;
};

/**
 * Initialize default templates for a work unit if none exist
 * This is a no-op now - templates are created manually
 */
export const initializeDefaultTemplate = async (
    workUnitId: number,
    workUnitName: string,
    userId: string
): Promise<LetterTemplate | null> => {
    // Check if any template exists for this work unit
    const existing = await getTemplatesByWorkUnit(workUnitId, 'cuti');
    
    if (existing.length > 0) {
        return existing[0];
    }

    // Don't auto-create templates anymore - let users create them manually
    return null;
};

/**
 * Map database row to LetterTemplate type
 */
const mapDbToTemplate = (row: any): LetterTemplate => ({
    id: row.id,
    work_unit_id: row.work_unit_id,
    template_name: row.template_name,
    category: row.category as LetterCategory,
    template_content: row.template_content,
    file_content: row.file_content,
    file_name: row.file_name,
    is_default: row.is_default,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at
});
