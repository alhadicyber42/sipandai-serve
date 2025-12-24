/**
 * Batch Template Helpers
 * Helper functions for generating batch documents with indexed variables
 */

import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ApprovedSubmission, AtasanData, mapSubmissionToTemplateData } from "./submissionData";

// Number to Indonesian text mapping (1-100)
const numberWords: Record<number, string> = {
    0: "nol",
    1: "satu",
    2: "dua",
    3: "tiga",
    4: "empat",
    5: "lima",
    6: "enam",
    7: "tujuh",
    8: "delapan",
    9: "sembilan",
    10: "sepuluh",
    11: "sebelas",
};

/**
 * Convert number to Indonesian text
 * Supports numbers 0-100
 */
export function numberToIndonesianText(num: number): string {
    if (num < 0) return "minus " + numberToIndonesianText(Math.abs(num));
    if (num <= 11) return numberWords[num];
    if (num < 20) return numberWords[num - 10] + " belas";
    if (num < 100) {
        const tens = Math.floor(num / 10);
        const ones = num % 10;
        if (ones === 0) return numberWords[tens] + " puluh";
        return numberWords[tens] + " puluh " + numberWords[ones];
    }
    if (num === 100) return "seratus";
    return String(num); // Fallback for numbers > 100
}

/**
 * Format date range as "DD s.d. DD Bulan YYYY" or "DD Bulan s.d. DD Bulan YYYY"
 * @param startDate - Start date string
 * @param endDate - End date string
 */
export function formatDateRange(startDate: string | null, endDate: string | null): string {
    if (!startDate || !endDate) return "-";
    
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const startDay = format(start, "d", { locale: localeId });
        const endDay = format(end, "d", { locale: localeId });
        const startMonth = format(start, "MMMM", { locale: localeId });
        const endMonth = format(end, "MMMM", { locale: localeId });
        const startYear = format(start, "yyyy");
        const endYear = format(end, "yyyy");
        
        // Same month and year
        if (startMonth === endMonth && startYear === endYear) {
            return `${startDay} s.d. ${endDay} ${endMonth} ${endYear}`;
        }
        // Same year, different month
        if (startYear === endYear) {
            return `${startDay} ${startMonth} s.d. ${endDay} ${endMonth} ${endYear}`;
        }
        // Different year
        return `${startDay} ${startMonth} ${startYear} s.d. ${endDay} ${endMonth} ${endYear}`;
    } catch {
        return "-";
    }
}

/**
 * Format leave duration as "selama X (text) hari kerja"
 * @param totalDays - Number of days
 */
export function formatLeaveDuration(totalDays: number | null | undefined): string {
    if (!totalDays || totalDays <= 0) return "-";
    const text = numberToIndonesianText(totalDays);
    return `selama ${totalDays} (${text}) hari kerja`;
}

/**
 * Calculate days between two dates
 */
export function calculateDaysBetween(startDate: string | null, endDate: string | null): number {
    if (!startDate || !endDate) return 0;
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Add 1 because both start and end dates are inclusive
        return differenceInDays(end, start) + 1;
    } catch {
        return 0;
    }
}

/**
 * Map a single submission to indexed template variables
 * Creates variables like {nama_pegawai_1}, {lama_cuti_1}, {tanggal_cuti_1}, etc.
 * @param submission - The approved submission
 * @param serviceType - The service type (cuti, kenaikan_pangkat, etc.)
 * @param index - The 1-based index for the variable suffix
 * @param atasanData - Optional atasan/pimpinan data
 */
export function mapSubmissionToIndexedData(
    submission: ApprovedSubmission,
    serviceType: string,
    index: number,
    atasanData?: AtasanData
): Record<string, string> {
    // Get base data from existing mapping
    const baseData = mapSubmissionToTemplateData(submission, serviceType, atasanData);
    
    // Create indexed version of all variables
    const indexedData: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(baseData)) {
        indexedData[`${key}_${index}`] = value;
    }
    
    // Add special formatted variables for leave
    if (serviceType === 'cuti') {
        const leaveDetail = submission.leave_details?.[0];
        if (leaveDetail) {
            // {lama_cuti_X} = "selama X (text) hari kerja"
            indexedData[`lama_cuti_${index}`] = formatLeaveDuration(leaveDetail.total_days);
            
            // {tanggal_cuti_X} = "DD s.d. DD Bulan YYYY"
            indexedData[`tanggal_cuti_${index}`] = formatDateRange(
                leaveDetail.start_date,
                leaveDetail.end_date
            );
            
            // Also add individual start/end dates for flexibility
            indexedData[`tanggal_mulai_cuti_${index}`] = leaveDetail.start_date 
                ? format(new Date(leaveDetail.start_date), "d MMMM yyyy", { locale: localeId })
                : "-";
            indexedData[`tanggal_selesai_cuti_${index}`] = leaveDetail.end_date
                ? format(new Date(leaveDetail.end_date), "d MMMM yyyy", { locale: localeId })
                : "-";
            
            // New fields for batch templates
            indexedData[`jatah_cuti_tahun_${index}`] = leaveDetail.leave_quota_year 
                ? String(leaveDetail.leave_quota_year) 
                : "-";
            indexedData[`alamat_selama_cuti_${index}`] = leaveDetail.address_during_leave || "-";
            indexedData[`tanggal_formulir_pengajuan_${index}`] = leaveDetail.form_date
                ? format(new Date(leaveDetail.form_date), "d MMMM yyyy", { locale: localeId })
                : "-";
        } else {
            indexedData[`lama_cuti_${index}`] = "-";
            indexedData[`tanggal_cuti_${index}`] = "-";
            indexedData[`tanggal_mulai_cuti_${index}`] = "-";
            indexedData[`tanggal_selesai_cuti_${index}`] = "-";
            indexedData[`jatah_cuti_tahun_${index}`] = "-";
            indexedData[`alamat_selama_cuti_${index}`] = "-";
            indexedData[`tanggal_formulir_pengajuan_${index}`] = "-";
        }
    }
    
    return indexedData;
}

/**
 * Map multiple submissions to a single data object with indexed variables
 * Use this for batch templates that need multiple entries in one document
 * @param submissions - Array of approved submissions
 * @param serviceType - The service type
 * @param atasanData - Optional atasan/pimpinan data (used for all entries)
 */
export function mapBatchSubmissionsToTemplateData(
    submissions: ApprovedSubmission[],
    serviceType: string,
    atasanData?: AtasanData
): Record<string, string> {
    const now = new Date();
    
    // Start with common header data (non-indexed)
    const combinedData: Record<string, string> = {
        // Date info for the document header
        tanggal_surat: format(now, "d MMMM yyyy", { locale: localeId }),
        tahun: format(now, "yyyy"),
        bulan: format(now, "MMMM", { locale: localeId }),
        hari: format(now, "EEEE", { locale: localeId }),
        tanggal: format(now, "d"),
        
        // Atasan data (common for the whole document)
        nama_atasan: atasanData?.nama_atasan || "-",
        nip_atasan: atasanData?.nip_atasan || "-",
        jabatan_atasan: atasanData?.jabatan_atasan || "-",
        pangkat_atasan: atasanData?.pangkat_atasan || "-",
        
        // Batch info
        jumlah_data: String(submissions.length),
        jumlah_pegawai: String(submissions.length),
    };
    
    // Add indexed data for each submission (1-based index)
    submissions.forEach((submission, arrayIndex) => {
        const index = arrayIndex + 1; // 1-based index
        const indexedData = mapSubmissionToIndexedData(submission, serviceType, index, atasanData);
        Object.assign(combinedData, indexedData);
    });
    
    return combinedData;
}

/**
 * Profile data type for batch pegawai
 */
interface ProfileData {
    id: string;
    name: string;
    nip: string;
    jabatan?: string | null;
    pangkat_golongan?: string | null;
    email?: string | null;
    phone?: string | null;
    tmt_pns?: string | null;
    tmt_pensiun?: string | null;
    tempat_lahir?: string | null;
    tanggal_lahir?: string | null;
    jenis_kelamin?: string | null;
    alamat?: string | null;
    work_units?: { name: string; code?: string } | null;
}

/**
 * Map a single profile to indexed template variables
 * @param profile - The profile data
 * @param index - The 1-based index for the variable suffix
 */
function mapProfileToIndexedData(profile: ProfileData, index: number): Record<string, string> {
    const formatDateSafe = (dateString: string | null | undefined): string => {
        if (!dateString) return "-";
        try {
            return format(new Date(dateString), "d MMMM yyyy", { locale: localeId });
        } catch {
            return dateString || "-";
        }
    };
    
    return {
        [`nama_${index}`]: profile.name || "-",
        [`nama_pegawai_${index}`]: profile.name || "-",
        [`nip_pegawai_${index}`]: profile.nip || "-",
        [`nip_${index}`]: profile.nip || "-",
        [`jabatan_pegawai_${index}`]: profile.jabatan || "-",
        [`jabatan_${index}`]: profile.jabatan || "-",
        [`pangkat_golongan_${index}`]: profile.pangkat_golongan || "-",
        [`pangkat_${index}`]: profile.pangkat_golongan || "-",
        [`golongan_${index}`]: profile.pangkat_golongan || "-",
        [`email_${index}`]: profile.email || "-",
        [`phone_${index}`]: profile.phone || "-",
        [`nomor_telepon_${index}`]: profile.phone || "-",
        [`tempat_lahir_${index}`]: profile.tempat_lahir || "-",
        [`tanggal_lahir_${index}`]: formatDateSafe(profile.tanggal_lahir),
        [`jenis_kelamin_${index}`]: profile.jenis_kelamin || "-",
        [`alamat_${index}`]: profile.alamat || "-",
        [`tmt_pns_${index}`]: formatDateSafe(profile.tmt_pns),
        [`tmt_pensiun_${index}`]: formatDateSafe(profile.tmt_pensiun),
        [`unit_kerja_${index}`]: profile.work_units?.name || "-",
        [`kode_unit_${index}`]: profile.work_units?.code || "-",
    };
}

/**
 * Map multiple profiles to a single data object with indexed variables
 * Use this for batch templates with profile data
 */
export function mapBatchProfilesToTemplateData(
    profiles: ProfileData[],
    atasanData?: AtasanData
): Record<string, string> {
    const now = new Date();
    
    // Start with common header data (non-indexed)
    const combinedData: Record<string, string> = {
        tanggal_surat: format(now, "d MMMM yyyy", { locale: localeId }),
        tahun: format(now, "yyyy"),
        bulan: format(now, "MMMM", { locale: localeId }),
        hari: format(now, "EEEE", { locale: localeId }),
        tanggal: format(now, "d"),
        
        nama_atasan: atasanData?.nama_atasan || "-",
        nip_atasan: atasanData?.nip_atasan || "-",
        jabatan_atasan: atasanData?.jabatan_atasan || "-",
        pangkat_atasan: atasanData?.pangkat_atasan || "-",
        
        jumlah_data: String(profiles.length),
        jumlah_pegawai: String(profiles.length),
    };
    
    // Add indexed data for each profile (1-based index)
    profiles.forEach((profile, arrayIndex) => {
        const index = arrayIndex + 1;
        const indexedData = mapProfileToIndexedData(profile, index);
        Object.assign(combinedData, indexedData);
    });
    
    return combinedData;
}
