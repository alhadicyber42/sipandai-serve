import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { LEAVE_LABELS } from "@/lib/constants";

export interface EmployeeSearchResult {
    id: string;
    name: string;
    nip: string;
    work_unit_id: number;
}

// Extended profile data for template mapping
export interface ProfileData {
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
    work_unit_id?: number | null;
    work_units?: { name: string; code: string } | null;
}

export interface ApprovedSubmission {
    id: string;
    service_type: string;
    status: string;
    created_at: string;
    user_id: string;
    work_unit_id: number;
    title?: string;
    description?: string;
    // Leave specific
    leave_details?: any[];
    // Profile data - extended
    profiles?: ProfileData;
    // Work unit data
    work_units?: { name: string; code: string } | null;
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
    target_work_unit_id?: number;
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
    // First, get services with approved status
    // Use explicit foreign key reference to avoid ambiguity (services has work_unit_id AND target_work_unit_id)
    let query = supabase
        .from('services')
        .select(`
            *,
            leave_details(*),
            work_units!services_work_unit_id_fkey(name, code)
        `)
        .eq('service_type', serviceType as any)
        .eq('status', 'approved_final');

    if (userId) {
        query = query.eq('user_id', userId);
    }

    const { data: servicesData, error: servicesError } = await query.order('created_at', { ascending: false });

    if (servicesError) {
        console.error('Error fetching approved submissions:', servicesError);
        return [];
    }

    if (!servicesData || servicesData.length === 0) {
        return [];
    }

    // Get unique user IDs from services
    const userIds = [...new Set(servicesData.map(s => s.user_id))];
    
    // Fetch complete profiles for these users with work_units
    const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
            id, name, nip, jabatan, pangkat_golongan, email, phone, 
            tmt_pns, tmt_pensiun, tempat_lahir, tanggal_lahir, 
            jenis_kelamin, alamat, work_unit_id,
            work_units(name, code)
        `)
        .in('id', userIds);

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return servicesData as any[];
    }

    // Create a map for quick lookup
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

    // Combine services with profiles
    const result = servicesData.map(service => ({
        ...service,
        profiles: profilesMap.get(service.user_id) || null
    }));

    return result as any[];
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

    // First search profiles by name or NIP
    const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
            id, name, nip, jabatan, pangkat_golongan, email, phone, 
            tmt_pns, tmt_pensiun, tempat_lahir, tanggal_lahir, 
            jenis_kelamin, alamat, work_unit_id,
            work_units(name, code)
        `)
        .or(`name.ilike.%${searchTerm}%,nip.ilike.%${searchTerm}%`)
        .limit(50);

    if (profilesError || !profilesData || profilesData.length === 0) {
        return [];
    }

    const userIds = profilesData.map(p => p.id);
    
    // Fetch services for these users
    // Use explicit foreign key reference to avoid ambiguity
    const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
            *,
            leave_details(*),
            work_units!services_work_unit_id_fkey(name, code)
        `)
        .eq('service_type', serviceType as any)
        .eq('status', 'approved_final')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

    if (servicesError) {
        console.error('Error searching submissions:', servicesError);
        return [];
    }

    // Create a map for quick lookup
    const profilesMap = new Map(profilesData.map(p => [p.id, p]));

    // Combine services with profiles
    const result = (servicesData || []).map(service => ({
        ...service,
        profiles: profilesMap.get(service.user_id) || null
    }));

    return result as any[];
}

/**
 * Get leave type label in Indonesian
 */
function getLeaveTypeLabel(leaveType: string): string {
    return LEAVE_LABELS[leaveType as keyof typeof LEAVE_LABELS] || leaveType || '';
}

/**
 * Format date to Indonesian format
 */
function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    try {
        return format(new Date(dateString), 'dd MMMM yyyy', { locale: localeId });
    } catch {
        return dateString || '';
    }
}

/**
 * Safely get a string value, returning empty string instead of undefined
 */
function safeString(value: any, fallback: string = ''): string {
    if (value === null || value === undefined) return fallback;
    return String(value);
}

/**
 * Map submission data to template variables based on service type
 * This function maps ALL available data to template variables
 * IMPORTANT: All values must be strings, never undefined
 */
export function mapSubmissionToTemplateData(submission: ApprovedSubmission, serviceType: string): Record<string, string> {
    const profile = submission.profiles;
    const workUnit = profile?.work_units || submission.work_units;
    const now = new Date();

    // Base data - pegawai information (comprehensive)
    // All values guaranteed to be strings (empty string if null/undefined)
    const baseData: Record<string, string> = {
        // === DATA PEGAWAI ===
        nama_pegawai: safeString(profile?.name),
        nip_pegawai: safeString(profile?.nip),
        nip: safeString(profile?.nip),
        jabatan_pegawai: safeString(profile?.jabatan, '-'),
        jabatan: safeString(profile?.jabatan, '-'),
        pangkat: safeString(profile?.pangkat_golongan, '-'),
        pangkat_golongan: safeString(profile?.pangkat_golongan, '-'),
        email: safeString(profile?.email),
        phone: safeString(profile?.phone),
        nomor_telepon: safeString(profile?.phone),
        tempat_lahir: safeString(profile?.tempat_lahir),
        tanggal_lahir: formatDate(profile?.tanggal_lahir) || '-',
        jenis_kelamin: safeString(profile?.jenis_kelamin),
        alamat: safeString(profile?.alamat),
        tmt_pns: formatDate(profile?.tmt_pns) || '-',
        tmt_pensiun: formatDate(profile?.tmt_pensiun) || '-',
        
        // === DATA UNIT KERJA ===
        unit_kerja: safeString(workUnit?.name),
        kode_unit: safeString(workUnit?.code),
        
        // === DATA TANGGAL ===
        tanggal_surat: format(now, 'dd MMMM yyyy', { locale: localeId }),
        tahun: format(now, 'yyyy'),
        bulan: format(now, 'MMMM', { locale: localeId }),
        hari: format(now, 'EEEE', { locale: localeId }),
        tanggal: format(now, 'dd'),
        
        // === DATA USULAN (common) ===
        judul_usulan: safeString(submission.title),
        deskripsi_usulan: safeString(submission.description),
        tanggal_pengajuan: formatDate(submission.created_at) || '-',
    };

    // Service-specific data
    switch (serviceType) {
        case 'cuti':
            const leaveDetail = submission.leave_details?.[0];
            return {
                ...baseData,
                // === DATA CUTI ===
                jenis_cuti: leaveDetail ? getLeaveTypeLabel(leaveDetail.leave_type) : '-',
                tanggal_mulai: leaveDetail ? (formatDate(leaveDetail.start_date) || '-') : '-',
                tanggal_selesai: leaveDetail ? (formatDate(leaveDetail.end_date) || '-') : '-',
                total_hari: leaveDetail ? String(leaveDetail.total_days || 0) : '0',
                alasan_cuti: safeString(leaveDetail?.reason || submission.description, '-'),
                pegawai_pengganti: safeString(leaveDetail?.substitute_employee, '-'),
                kontak_darurat: safeString(leaveDetail?.emergency_contact, '-'),
            };

        case 'kenaikan_pangkat':
            return {
                ...baseData,
                // === DATA KENAIKAN PANGKAT ===
                jabatan_lama: safeString(submission.current_position || profile?.jabatan, '-'),
                jabatan_baru: safeString(submission.proposed_position, '-'),
                pangkat_lama: safeString(submission.current_rank || profile?.pangkat_golongan, '-'),
                pangkat_baru: safeString(submission.proposed_rank, '-'),
                tanggal_sk: formatDate(submission.effective_date) || '-',
            };

        case 'pensiun':
            return {
                ...baseData,
                // === DATA PENSIUN ===
                tanggal_pensiun: formatDate(submission.retirement_date || profile?.tmt_pensiun) || '-',
                jenis_pensiun: safeString(submission.retirement_type, '-'),
                masa_kerja: safeString(submission.years_of_service, '-'),
            };

        case 'mutasi':
            return {
                ...baseData,
                // === DATA MUTASI ===
                unit_asal: safeString(workUnit?.name || submission.current_unit, '-'),
                unit_tujuan: safeString(submission.target_unit, '-'),
                tanggal_mutasi: formatDate(submission.effective_date) || '-',
                alasan_mutasi: safeString(submission.description, '-'),
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
                const leaveLabel = getLeaveTypeLabel(leaveDetail.leave_type);
                return `${leaveLabel} - ${date} (${leaveDetail.total_days} hari)`;
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
