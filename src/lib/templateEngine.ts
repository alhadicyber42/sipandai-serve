/**
 * Template Engine
 * Handles variable replacement in leave certificate templates
 */

import { TemplateData } from "@/types/leave-certificate";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { LEAVE_LABELS } from "@/lib/constants";

/**
 * Replace template variables with actual data
 * @param template - Template string with {{variable}} placeholders
 * @param data - Data object containing values for variables
 * @returns Processed template with variables replaced
 */
export const replaceVariables = (template: string, data: Partial<TemplateData>): string => {
    let result = template;

    // Replace each variable in the template
    Object.entries(data).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const replacement = value !== undefined && value !== null ? String(value) : `[${key}]`;
        result = result.replace(regex, replacement);
    });

    // Replace any remaining unreplaced variables with placeholder
    result = result.replace(/{{(\w+)}}/g, '[$1]');

    return result;
};

/**
 * Extract template data from service and leave details
 * @param service - Service object
 * @param leaveDetails - Leave details object
 * @param profile - User profile object
 * @param workUnit - Work unit object
 * @returns Template data object
 */
export const extractTemplateData = (
    service: any,
    leaveDetails: any,
    profile: any,
    workUnit: any
): TemplateData => {
    const now = new Date();

    // Format dates in Indonesian
    const formatIndonesianDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return format(date, "d MMMM yyyy", { locale: localeId });
        } catch {
            return dateString;
        }
    };

    // Get leave type label
    const leaveTypeLabel = leaveDetails?.leave_type
        ? LEAVE_LABELS[leaveDetails.leave_type as keyof typeof LEAVE_LABELS] || leaveDetails.leave_type
        : '';

    return {
        // Employee Data
        nama_pegawai: profile?.name || '',
        nip: profile?.nip || '',
        jabatan: profile?.jabatan || '-',
        pangkat: profile?.pangkat || '-',

        // Leave Data
        jenis_cuti: leaveTypeLabel,
        tanggal_mulai: leaveDetails?.start_date ? formatIndonesianDate(leaveDetails.start_date) : '',
        tanggal_selesai: leaveDetails?.end_date ? formatIndonesianDate(leaveDetails.end_date) : '',
        total_hari: leaveDetails?.total_days || 0,
        alasan_cuti: leaveDetails?.reason || '',
        pegawai_pengganti: leaveDetails?.substitute_employee || '-',
        kontak_darurat: leaveDetails?.emergency_contact || '-',

        // Unit Data
        unit_kerja: workUnit?.name || '',
        kode_unit: workUnit?.code || '',

        // Date Data
        tanggal_surat: format(now, "d MMMM yyyy", { locale: localeId }),
        tahun: format(now, "yyyy"),
        bulan: format(now, "MMMM", { locale: localeId })
    };
};

/**
 * Generate sample data for template preview
 * @returns Sample template data
 */
export const getSampleTemplateData = (): TemplateData => {
    const now = new Date();

    return {
        nama_pegawai: "Ahmad Suryadi, S.Kom",
        nip: "198501012010011001",
        jabatan: "Kepala Seksi Pelatihan",
        pangkat: "Penata Muda Tk.I / III/b",

        jenis_cuti: "Cuti Tahunan",
        tanggal_mulai: "1 Desember 2025",
        tanggal_selesai: "5 Desember 2025",
        total_hari: 5,
        alasan_cuti: "Keperluan keluarga",
        pegawai_pengganti: "Budi Santoso, S.T.",
        kontak_darurat: "081234567890",

        unit_kerja: "BBPVP Bekasi",
        kode_unit: "BBPVP-BEKASI",

        tanggal_surat: format(now, "d MMMM yyyy", { locale: localeId }),
        tahun: format(now, "yyyy"),
        bulan: format(now, "MMMM", { locale: localeId })
    };
};

/**
 * Validate template content for required variables
 * @param template - Template string to validate
 * @returns Object with validation result and missing variables
 */
export const validateTemplate = (template: string): {
    isValid: boolean;
    missingRequired: string[];
    warnings: string[];
} => {
    const requiredVariables = ['nama_pegawai', 'nip', 'jenis_cuti', 'tanggal_mulai', 'tanggal_selesai'];
    const recommendedVariables = ['unit_kerja', 'total_hari', 'tanggal_surat'];

    const missingRequired = requiredVariables.filter(v => !template.includes(`{{${v}}}`));
    const missingRecommended = recommendedVariables.filter(v => !template.includes(`{{${v}}}`));

    return {
        isValid: missingRequired.length === 0,
        missingRequired,
        warnings: missingRecommended.map(v => `Variabel yang direkomendasikan '${v}' tidak ditemukan`)
    };
};
