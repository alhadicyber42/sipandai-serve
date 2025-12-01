import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export interface EmployeeSearchResult {
    id: string;
    name: string;
    nip: string;
    work_unit_id: number;
}

export interface ApprovedSubmission {
    id: string;
    service_type: string;
    status: string;
    created_at: string;
    user_id: string;
    description?: string;
    // Leave specific
    leave_details?: any[];
    // Profile data
    profiles?: {
        id: string;
        name: string;
        nip: string;
    };
    // Other service type fields
    current_position?: string;
    proposed_position?: string;
    current_rank?: string;
    proposed_rank?: string;
    effective_date?: string;
    retirement_date?: string;
    retirement_type?: string;
    years_of_service?: number;
    current_unit?: string;
    target_unit?: string;
}

/**
 * Search employees by name or NIP
 */
export async function searchEmployees(searchTerm: string): Promise<EmployeeSearchResult[]> {
    if (!searchTerm || searchTerm.length < 2) {
        return [];
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, nip, work_unit_id')
        .or(`name.ilike.%${searchTerm}%,nip.ilike.%${searchTerm}%`)
        .eq('role', 'user_unit')
        .limit(10);

    if (error) {
        console.error('Error searching employees:', error);
        return [];
    }

    return (data || []) as EmployeeSearchResult[];
}

/**
 * Get approved submissions for a specific employee and service type
 */
export async function getApprovedSubmissions(
    serviceType: string,
    userId?: string
): Promise<ApprovedSubmission[]> {
    let query = supabase
        .from('services')
        .select(`
            *,
            profiles!inner(id, name, nip),
            leave_details(*)
        `)
        .eq('service_type', serviceType as any)
        .eq('status', 'approved_final');

    if (userId) {
        query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching approved submissions:', error);
        return [];
    }

    return (data || []) as any[];
}

/**
 * Search approved submissions by employee name or NIP
 */
export async function searchSubmissionsByEmployee(
    serviceType: string,
    searchTerm: string
): Promise<ApprovedSubmission[]> {
    if (!searchTerm || searchTerm.length < 2) {
        return [];
    }

    const { data, error } = await supabase
        .from('services')
        .select(`
            *,
            profiles!inner(id, name, nip),
            leave_details(*)
        `)
        .eq('service_type', serviceType as any)
        .eq('status', 'approved_final')
        .or(`profiles.name.ilike.%${searchTerm}%,profiles.nip.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error searching submissions:', error);
        return [];
    }

    return (data || []) as any[];
}

/**
 * Map submission data to template variables based on service type
 */
export function mapSubmissionToTemplateData(submission: any, serviceType: string): any {
    const baseData = {
        nama_pegawai: submission.profiles?.name || '',
        nip_pegawai: submission.profiles?.nip || '',
        jabatan_pegawai: submission.profiles?.jabatan || 'Staf',
        tanggal_surat: format(new Date(), 'dd MMMM yyyy', { locale: localeId }),
    };

    switch (serviceType) {
        case 'cuti':
            if (submission.leave_details && submission.leave_details.length > 0) {
                const leaveDetail = submission.leave_details[0];
                return {
                    ...baseData,
                    jenis_cuti: leaveDetail.leave_type || '',
                    tanggal_mulai: leaveDetail.start_date
                        ? format(new Date(leaveDetail.start_date), 'dd MMMM yyyy', { locale: localeId })
                        : '',
                    tanggal_selesai: leaveDetail.end_date
                        ? format(new Date(leaveDetail.end_date), 'dd MMMM yyyy', { locale: localeId })
                        : '',
                    total_hari: leaveDetail.total_days?.toString() || '0',
                    alasan_cuti: submission.description || '',
                };
            }
            return baseData;

        case 'kenaikan_pangkat':
            return {
                ...baseData,
                jabatan_lama: submission.current_position || '',
                jabatan_baru: submission.proposed_position || '',
                pangkat_lama: submission.current_rank || '',
                pangkat_baru: submission.proposed_rank || '',
                tanggal_sk: submission.effective_date
                    ? format(new Date(submission.effective_date), 'dd MMMM yyyy', { locale: localeId })
                    : '',
            };

        case 'pensiun':
            return {
                ...baseData,
                tanggal_pensiun: submission.retirement_date
                    ? format(new Date(submission.retirement_date), 'dd MMMM yyyy', { locale: localeId })
                    : '',
                jenis_pensiun: submission.retirement_type || '',
                masa_kerja: submission.years_of_service?.toString() || '',
            };

        case 'mutasi':
            return {
                ...baseData,
                unit_asal: submission.current_unit || '',
                unit_tujuan: submission.target_unit || '',
                tanggal_mutasi: submission.effective_date
                    ? format(new Date(submission.effective_date), 'dd MMMM yyyy', { locale: localeId })
                    : '',
                alasan_mutasi: submission.description || '',
            };

        default:
            return baseData;
    }
}

/**
 * Format submission for display in dropdown
 */
export function formatSubmissionLabel(submission: any, serviceType: string): string {
    const date = format(new Date(submission.created_at), 'dd MMM yyyy', { locale: localeId });

    switch (serviceType) {
        case 'cuti':
            if (submission.leave_details && submission.leave_details.length > 0) {
                const leaveDetail = submission.leave_details[0];
                return `${leaveDetail.leave_type} - ${date} (${leaveDetail.total_days} hari)`;
            }
            return `Cuti - ${date}`;

        case 'kenaikan_pangkat':
            return `${submission.proposed_position || 'Kenaikan Pangkat'} - ${date}`;

        case 'pensiun':
            return `${submission.retirement_type || 'Pensiun'} - ${date}`;

        case 'mutasi':
            return `Mutasi ke ${submission.target_unit || 'Unit Baru'} - ${date}`;

        default:
            return `Pengajuan - ${date}`;
    }
}
