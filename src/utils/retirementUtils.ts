/**
 * Utility functions for retirement date calculations and reminder management
 */

import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

/**
 * Calculate retirement date based on birth date
 * Assumes retirement age of 58 years
 */
export const calculateRetirementDate = (birthDate: Date): Date => {
    const retirementDate = new Date(birthDate);
    retirementDate.setFullYear(retirementDate.getFullYear() + 58);
    return retirementDate;
};

/**
 * Get the number of months until retirement
 */
export const getMonthsUntilRetirement = (retirementDate: Date): number => {
    const now = new Date();
    const diffTime = retirementDate.getTime() - now.getTime();
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
    return diffMonths;
};

/**
 * Get the number of days until retirement
 */
export const getDaysUntilRetirement = (retirementDate: Date): number => {
    const now = new Date();
    const diffTime = retirementDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

/**
 * Check if employee is approaching retirement (6-12 months away)
 */
export const isApproachingRetirement = (retirementDate: Date): boolean => {
    const months = getMonthsUntilRetirement(retirementDate);
    return months >= 6 && months <= 12;
};

/**
 * Format date to Indonesian locale
 */
export const formatDateIndonesian = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

/**
 * Generate WhatsApp message template for retirement reminder
 */
export const formatRetirementWhatsAppMessage = (employee: Profile, workUnitName: string): string => {
    if (!employee.tmt_pensiun) {
        return '';
    }

    const retirementDate = new Date(employee.tmt_pensiun);
    const formattedDate = formatDateIndonesian(retirementDate);
    const monthsUntil = getMonthsUntilRetirement(retirementDate);

    return `Yth. Bapak/Ibu ${employee.name},

Kami ingin mengingatkan bahwa masa pensiun Bapak/Ibu akan tiba pada tanggal *${formattedDate}* (sekitar ${monthsUntil} bulan lagi).

Untuk mempersiapkan proses pensiun, mohon untuk:
1. Melengkapi dokumen persyaratan pensiun
2. Menghubungi bagian kepegawaian untuk konsultasi
3. Mengajukan permohonan pensiun melalui SIPANDAI

Jika ada pertanyaan, silakan hubungi kami.

Terima kasih.

Hormat kami,
${workUnitName}`;
};

/**
 * Generate email subject for retirement reminder
 */
export const getRetirementEmailSubject = (employee: Profile): string => {
    if (!employee.tmt_pensiun) {
        return 'Pengingat Masa Pensiun';
    }

    const monthsUntil = getMonthsUntilRetirement(new Date(employee.tmt_pensiun));
    return `Pengingat: Masa Pensiun Anda ${monthsUntil} Bulan Lagi`;
};

/**
 * Generate email body for retirement reminder
 */
export const formatRetirementEmailBody = (employee: Profile, workUnitName: string): string => {
    if (!employee.tmt_pensiun) {
        return '';
    }

    const retirementDate = new Date(employee.tmt_pensiun);
    const formattedDate = formatDateIndonesian(retirementDate);
    const monthsUntil = getMonthsUntilRetirement(retirementDate);

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1e40af;">Pengingat Masa Pensiun</h2>
      
      <p>Yth. Bapak/Ibu <strong>${employee.name}</strong>,</p>
      
      <p>Melalui surat elektronik ini, kami ingin mengingatkan bahwa masa pensiun Bapak/Ibu akan tiba pada:</p>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>Tanggal Pensiun: ${formattedDate}</strong></p>
        <p style="margin: 5px 0 0 0; color: #64748b;">(Sekitar ${monthsUntil} bulan lagi)</p>
      </div>
      
      <h3 style="color: #1e40af;">Langkah Persiapan Pensiun:</h3>
      <ol style="line-height: 1.8;">
        <li>Melengkapi dokumen persyaratan pensiun</li>
        <li>Menghubungi bagian kepegawaian untuk konsultasi</li>
        <li>Mengajukan permohonan pensiun melalui sistem SIPANDAI</li>
        <li>Mempersiapkan dokumen administrasi yang diperlukan</li>
      </ol>
      
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>⚠️ Penting:</strong> Mohon segera memproses persiapan pensiun Anda untuk memastikan kelancaran proses administrasi.</p>
      </div>
      
      <p>Jika Bapak/Ibu memiliki pertanyaan atau memerlukan bantuan, silakan hubungi bagian kepegawaian.</p>
      
      <p style="margin-top: 30px;">Hormat kami,</p>
      <p><strong>${workUnitName}</strong></p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #64748b;">
        Email ini dikirim secara otomatis dari sistem SIPANDAI. Mohon tidak membalas email ini.
      </p>
    </div>
  `;
};

/**
 * Get status badge color based on months until retirement
 */
export const getRetirementStatusColor = (monthsUntil: number): string => {
    if (monthsUntil <= 6) {
        return 'destructive'; // Red - urgent
    } else if (monthsUntil <= 9) {
        return 'default'; // Yellow - warning
    } else {
        return 'secondary'; // Blue - info
    }
};

/**
 * Get status text based on months until retirement
 */
export const getRetirementStatusText = (monthsUntil: number): string => {
    if (monthsUntil <= 6) {
        return 'Segera Pensiun';
    } else if (monthsUntil <= 9) {
        return 'Mendekati Pensiun';
    } else {
        return 'Akan Pensiun';
    }
};
