/**
 * Letter Template Types
 * Types and interfaces for managing generic letter templates
 */

export type LetterCategory = 'cuti' | 'kenaikan_pangkat' | 'pensiun' | 'mutasi' | 'lainnya';

// Variable categories - extended version
export type VariableCategory = "pegawai" | "cuti" | "kenaikan_pangkat" | "pensiun" | "mutasi" | "unit" | "tanggal" | "custom";

// Legacy category mapping for backward compatibility
export type LegacyVariableCategory = 'employee' | 'leave' | 'unit' | 'date';

export interface LetterTemplate {
    id: string;
    work_unit_id: number;
    template_name: string;
    category: LetterCategory;
    template_content?: string; // Legacy text content
    file_content?: string; // Base64 encoded DOCX content
    file_name?: string; // Original filename
    is_default: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

// Legacy TemplateVariable for backward compatibility
export interface TemplateVariable {
    key: string;
    label: string;
    description: string;
    example: string;
    category: LegacyVariableCategory;
}

// Extended template variable with more features
export interface ExtendedTemplateVariable {
    key: string;
    label: string;
    description: string;
    example: string;
    category: VariableCategory;
    serviceTypes?: string[]; // Which service types this variable applies to
    isIndexed?: boolean; // Whether this variable supports indexing (_1, _2, etc.)
}

export interface TemplateData {
    // Employee Data
    nama_pegawai: string;
    nip: string;
    jabatan?: string;
    pangkat?: string;

    // Leave Data
    jenis_cuti: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    total_hari: number;
    alasan_cuti: string;
    pegawai_pengganti?: string;
    kontak_darurat?: string;

    // Unit Data
    unit_kerja: string;
    kode_unit?: string;

    // Date Data
    tanggal_surat: string;
    tahun: string;
    bulan: string;
}

export interface CreateTemplateInput {
    work_unit_id: number;
    template_name: string;
    category: LetterCategory;
    template_content?: string;
    file_content?: string;
    file_name?: string;
    is_default?: boolean;
}

export interface UpdateTemplateInput {
    template_name?: string;
    category?: LetterCategory;
    template_content?: string;
    file_content?: string;
    file_name?: string;
    is_default?: boolean;
}

// Alias for backward compatibility during refactoring
export type LeaveCertificateTemplate = LetterTemplate;
