/**
 * Template Storage (LocalStorage Mock)
 * Temporary storage solution for templates before backend implementation
 */

import { LetterTemplate, CreateTemplateInput, UpdateTemplateInput, LetterCategory } from "@/types/leave-certificate";
import { DEFAULT_TEMPLATE_CONTENT } from "./templateVariables";

const STORAGE_KEY = "leave_certificate_templates";

/**
 * Get all templates from localStorage
 */
export const getAllTemplates = (): LetterTemplate[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error reading templates from localStorage:", error);
        return [];
    }
};

/**
 * Get templates by work unit ID and optional category
 */
export const getTemplatesByWorkUnit = (workUnitId: number, category?: LetterCategory): LetterTemplate[] => {
    const templates = getAllTemplates();
    return templates.filter(t => {
        const matchUnit = t.work_unit_id === workUnitId;
        const matchCategory = category ? t.category === category : true;
        return matchUnit && matchCategory;
    });
};

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): LetterTemplate | null => {
    const templates = getAllTemplates();
    return templates.find(t => t.id === id) || null;
};

/**
 * Get default template for a work unit and category
 */
export const getDefaultTemplate = (workUnitId: number, category: LetterCategory = 'cuti'): LetterTemplate | null => {
    const templates = getTemplatesByWorkUnit(workUnitId, category);
    return templates.find(t => t.is_default) || templates[0] || null;
};

/**
 * Create a new template
 */
export const createTemplate = (
    input: CreateTemplateInput,
    userId: string
): LetterTemplate => {
    const templates = getAllTemplates();

    const newTemplate: LetterTemplate = {
        id: crypto.randomUUID(),
        work_unit_id: input.work_unit_id,
        template_name: input.template_name,
        category: input.category,
        template_content: input.template_content,
        file_content: input.file_content,
        file_name: input.file_name,
        is_default: input.is_default || false,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    // If this is set as default, unset other defaults for this work unit AND category
    if (newTemplate.is_default) {
        templates.forEach(t => {
            if (t.work_unit_id === newTemplate.work_unit_id && t.category === newTemplate.category) {
                t.is_default = false;
            }
        });
    }

    templates.push(newTemplate);
    saveTemplates(templates);

    return newTemplate;
};

/**
 * Update an existing template
 */
export const updateTemplate = (
    id: string,
    input: UpdateTemplateInput
): LetterTemplate | null => {
    const templates = getAllTemplates();
    const index = templates.findIndex(t => t.id === id);

    if (index === -1) return null;

    const template = templates[index];

    // Update fields
    if (input.template_name !== undefined) {
        template.template_name = input.template_name;
    }
    if (input.category !== undefined) {
        template.category = input.category;
    }
    if (input.template_content !== undefined) {
        template.template_content = input.template_content;
    }
    if (input.file_content !== undefined) {
        template.file_content = input.file_content;
    }
    if (input.file_name !== undefined) {
        template.file_name = input.file_name;
    }
    if (input.is_default !== undefined) {
        template.is_default = input.is_default;

        // If setting as default, unset other defaults for this work unit AND category
        if (input.is_default) {
            templates.forEach(t => {
                if (t.work_unit_id === template.work_unit_id &&
                    t.category === template.category &&
                    t.id !== id) {
                    t.is_default = false;
                }
            });
        }
    }

    template.updated_at = new Date().toISOString();
    templates[index] = template;

    saveTemplates(templates);
    return template;
};

/**
 * Delete a template
 */
export const deleteTemplate = (id: string): boolean => {
    const templates = getAllTemplates();
    const filtered = templates.filter(t => t.id !== id);

    if (filtered.length === templates.length) {
        return false; // Template not found
    }

    saveTemplates(filtered);
    return true;
};

/**
 * Set a template as default for its work unit and category
 */
export const setDefaultTemplate = (id: string): boolean => {
    const templates = getAllTemplates();
    const template = templates.find(t => t.id === id);

    if (!template) return false;

    // Unset all defaults for this work unit AND category
    templates.forEach(t => {
        if (t.work_unit_id === template.work_unit_id && t.category === template.category) {
            t.is_default = t.id === id;
            t.updated_at = new Date().toISOString();
        }
    });

    saveTemplates(templates);
    return true;
};

/**
 * Initialize default templates for a work unit if none exist
 */
export const initializeDefaultTemplate = (
    workUnitId: number,
    workUnitName: string,
    userId: string
): LetterTemplate => {
    // Check if default 'cuti' template exists
    const existing = getTemplatesByWorkUnit(workUnitId, 'cuti');

    if (existing.length > 0) {
        return existing[0];
    }

    return createTemplate({
        work_unit_id: workUnitId,
        template_name: `Template Default - ${workUnitName}`,
        category: 'cuti',
        template_content: DEFAULT_TEMPLATE_CONTENT, // Fallback
        is_default: true
    }, userId);
};

/**
 * Save templates to localStorage
 */
const saveTemplates = (templates: LetterTemplate[]): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
        console.error("Error saving templates to localStorage:", error);
    }
};

/**
 * Clear all templates (for testing/debugging)
 */
export const clearAllTemplates = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};
