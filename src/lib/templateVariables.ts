/**
 * Template Variables Configuration
 * Defines all available variables for letter templates
 * Supports indexed variables like {Nama}, {Nama_1}, {Nama_2} etc.
 */

import { TemplateVariable } from "@/types/leave-certificate";

// Variable categories
export type VariableCategory = "pegawai" | "cuti" | "kenaikan_pangkat" | "pensiun" | "mutasi" | "unit" | "tanggal" | "custom";

// Extended variable definition with more metadata
export interface ExtendedTemplateVariable {
    key: string;
    label: string;
    description: string;
    example: string;
    category: VariableCategory;
    serviceTypes?: string[]; // Which service types this variable applies to
    isIndexed?: boolean; // Whether this variable supports indexing (_1, _2, etc.)
}

// All available template variables
export const TEMPLATE_VARIABLES: ExtendedTemplateVariable[] = [
    // ============ DATA PEGAWAI ============
    {
        key: "nama_pegawai",
        label: "Nama Pegawai",
        description: "Nama lengkap pegawai",
        example: "Ahmad Suryadi, S.Kom",
        category: "pegawai",
        isIndexed: true
    },
    {
        key: "nip_pegawai",
        label: "NIP Pegawai",
        description: "Nomor Induk Pegawai",
        example: "198501012010011001",
        category: "pegawai",
        isIndexed: true
    },
    {
        key: "nip",
        label: "NIP",
        description: "Nomor Induk Pegawai (alias)",
        example: "198501012010011001",
        category: "pegawai",
        isIndexed: true
    },
    {
        key: "jabatan_pegawai",
        label: "Jabatan Pegawai",
        description: "Jabatan pegawai saat ini",
        example: "Kepala Seksi Pelatihan",
        category: "pegawai",
        isIndexed: true
    },
    {
        key: "jabatan",
        label: "Jabatan",
        description: "Jabatan pegawai (alias)",
        example: "Kepala Seksi Pelatihan",
        category: "pegawai",
        isIndexed: true
    },
    {
        key: "pangkat",
        label: "Pangkat/Golongan",
        description: "Pangkat dan golongan pegawai",
        example: "Penata Muda Tk.I / III/b",
        category: "pegawai",
        isIndexed: true
    },
    {
        key: "pangkat_golongan",
        label: "Pangkat Golongan",
        description: "Pangkat dan golongan pegawai (alias)",
        example: "Penata Muda Tk.I / III/b",
        category: "pegawai",
        isIndexed: true
    },
    {
        key: "email",
        label: "Email",
        description: "Alamat email pegawai",
        example: "ahmad.suryadi@example.com",
        category: "pegawai",
        isIndexed: true
    },
    {
        key: "phone",
        label: "Nomor Telepon",
        description: "Nomor telepon pegawai",
        example: "081234567890",
        category: "pegawai",
        isIndexed: true
    },
    {
        key: "tmt_pns",
        label: "TMT PNS",
        description: "Terhitung Mulai Tanggal sebagai PNS",
        example: "01 Maret 2010",
        category: "pegawai"
    },
    {
        key: "tmt_pensiun",
        label: "TMT Pensiun",
        description: "Terhitung Mulai Tanggal Pensiun",
        example: "01 Januari 2040",
        category: "pegawai"
    },

    // ============ DATA CUTI ============
    {
        key: "jenis_cuti",
        label: "Jenis Cuti",
        description: "Jenis cuti yang diajukan",
        example: "Cuti Tahunan",
        category: "cuti",
        serviceTypes: ["cuti"]
    },
    {
        key: "tanggal_mulai",
        label: "Tanggal Mulai Cuti",
        description: "Tanggal mulai cuti",
        example: "01 Desember 2025",
        category: "cuti",
        serviceTypes: ["cuti"]
    },
    {
        key: "tanggal_selesai",
        label: "Tanggal Selesai Cuti",
        description: "Tanggal selesai cuti",
        example: "05 Desember 2025",
        category: "cuti",
        serviceTypes: ["cuti"]
    },
    {
        key: "total_hari",
        label: "Total Hari Cuti",
        description: "Total hari cuti yang diambil",
        example: "5",
        category: "cuti",
        serviceTypes: ["cuti"]
    },
    {
        key: "alasan_cuti",
        label: "Alasan Cuti",
        description: "Alasan pengajuan cuti",
        example: "Keperluan keluarga",
        category: "cuti",
        serviceTypes: ["cuti"]
    },
    {
        key: "pegawai_pengganti",
        label: "Pegawai Pengganti",
        description: "Nama pegawai yang menggantikan selama cuti",
        example: "Budi Santoso, S.T.",
        category: "cuti",
        serviceTypes: ["cuti"]
    },
    {
        key: "kontak_darurat",
        label: "Kontak Darurat",
        description: "Nomor kontak yang dapat dihubungi selama cuti",
        example: "081234567890",
        category: "cuti",
        serviceTypes: ["cuti"]
    },

    // ============ DATA KENAIKAN PANGKAT ============
    {
        key: "jabatan_lama",
        label: "Jabatan Lama",
        description: "Jabatan sebelum kenaikan pangkat",
        example: "Staf Pelaksana",
        category: "kenaikan_pangkat",
        serviceTypes: ["kenaikan_pangkat"]
    },
    {
        key: "jabatan_baru",
        label: "Jabatan Baru",
        description: "Jabatan setelah kenaikan pangkat",
        example: "Kepala Seksi",
        category: "kenaikan_pangkat",
        serviceTypes: ["kenaikan_pangkat"]
    },
    {
        key: "pangkat_lama",
        label: "Pangkat Lama",
        description: "Pangkat/golongan sebelum kenaikan",
        example: "Penata Muda / III/a",
        category: "kenaikan_pangkat",
        serviceTypes: ["kenaikan_pangkat"]
    },
    {
        key: "pangkat_baru",
        label: "Pangkat Baru",
        description: "Pangkat/golongan setelah kenaikan",
        example: "Penata Muda Tk.I / III/b",
        category: "kenaikan_pangkat",
        serviceTypes: ["kenaikan_pangkat"]
    },
    {
        key: "tanggal_sk",
        label: "Tanggal SK",
        description: "Tanggal Surat Keputusan",
        example: "01 April 2025",
        category: "kenaikan_pangkat",
        serviceTypes: ["kenaikan_pangkat"]
    },

    // ============ DATA PENSIUN ============
    {
        key: "tanggal_pensiun",
        label: "Tanggal Pensiun",
        description: "Tanggal efektif pensiun",
        example: "01 Januari 2026",
        category: "pensiun",
        serviceTypes: ["pensiun"]
    },
    {
        key: "jenis_pensiun",
        label: "Jenis Pensiun",
        description: "Jenis pensiun (BUP, APS, dll)",
        example: "Batas Usia Pensiun",
        category: "pensiun",
        serviceTypes: ["pensiun"]
    },
    {
        key: "masa_kerja",
        label: "Masa Kerja",
        description: "Total masa kerja dalam tahun",
        example: "30",
        category: "pensiun",
        serviceTypes: ["pensiun"]
    },

    // ============ DATA MUTASI ============
    {
        key: "unit_asal",
        label: "Unit Asal",
        description: "Unit kerja asal sebelum mutasi",
        example: "BBPVP Bekasi",
        category: "mutasi",
        serviceTypes: ["mutasi"]
    },
    {
        key: "unit_tujuan",
        label: "Unit Tujuan",
        description: "Unit kerja tujuan mutasi",
        example: "BBPVP Bandung",
        category: "mutasi",
        serviceTypes: ["mutasi"]
    },
    {
        key: "tanggal_mutasi",
        label: "Tanggal Mutasi",
        description: "Tanggal efektif mutasi",
        example: "01 Juli 2025",
        category: "mutasi",
        serviceTypes: ["mutasi"]
    },
    {
        key: "alasan_mutasi",
        label: "Alasan Mutasi",
        description: "Alasan atau keterangan mutasi",
        example: "Kebutuhan organisasi",
        category: "mutasi",
        serviceTypes: ["mutasi"]
    },

    // ============ DATA UNIT KERJA ============
    {
        key: "unit_kerja",
        label: "Unit Kerja",
        description: "Nama unit kerja pegawai",
        example: "BBPVP Bekasi",
        category: "unit"
    },
    {
        key: "kode_unit",
        label: "Kode Unit",
        description: "Kode unit kerja",
        example: "BBPVP-BEKASI",
        category: "unit"
    },
    {
        key: "alamat_unit",
        label: "Alamat Unit",
        description: "Alamat lengkap unit kerja",
        example: "Jl. Inspeksi Kalimalang, Bekasi",
        category: "unit"
    },
    {
        key: "kepala_unit",
        label: "Kepala Unit",
        description: "Nama kepala unit kerja",
        example: "Dr. Bambang Suryadi, M.Si",
        category: "unit"
    },
    {
        key: "nip_kepala_unit",
        label: "NIP Kepala Unit",
        description: "NIP kepala unit kerja",
        example: "196501011990011001",
        category: "unit"
    },

    // ============ DATA TANGGAL ============
    {
        key: "tanggal_surat",
        label: "Tanggal Surat",
        description: "Tanggal pembuatan surat",
        example: "15 Desember 2025",
        category: "tanggal"
    },
    {
        key: "tahun",
        label: "Tahun",
        description: "Tahun saat ini",
        example: "2025",
        category: "tanggal"
    },
    {
        key: "bulan",
        label: "Bulan",
        description: "Bulan saat ini (dalam bahasa Indonesia)",
        example: "Desember",
        category: "tanggal"
    },
    {
        key: "hari",
        label: "Hari",
        description: "Hari saat ini (dalam bahasa Indonesia)",
        example: "Senin",
        category: "tanggal"
    },
    {
        key: "tanggal",
        label: "Tanggal",
        description: "Tanggal saat ini (angka)",
        example: "15",
        category: "tanggal"
    },

    // ============ DATA CUSTOM ============
    {
        key: "nomor_surat",
        label: "Nomor Surat",
        description: "Nomor surat (diisi manual)",
        example: "B-123/PL.01/2025",
        category: "custom"
    },
    {
        key: "perihal",
        label: "Perihal",
        description: "Perihal surat",
        example: "Surat Keterangan Cuti",
        category: "custom"
    },
    {
        key: "lampiran",
        label: "Lampiran",
        description: "Jumlah lampiran",
        example: "1 (satu) berkas",
        category: "custom"
    },
    {
        key: "tembusan",
        label: "Tembusan",
        description: "Daftar tembusan",
        example: "Kepala Bagian Kepegawaian",
        category: "custom",
        isIndexed: true
    },

    // ============ DATA ATASAN/PIMPINAN ============
    {
        key: "nama_atasan",
        label: "Nama Atasan",
        description: "Nama pimpinan yang menandatangani surat",
        example: "Dr. Bambang Suryadi, M.Si",
        category: "custom"
    },
    {
        key: "nip_atasan",
        label: "NIP Atasan",
        description: "NIP pimpinan yang menandatangani surat",
        example: "196501011990011001",
        category: "custom"
    },
    {
        key: "jabatan_atasan",
        label: "Jabatan Atasan",
        description: "Jabatan pimpinan yang menandatangani surat",
        example: "Kepala BBPVP Bekasi",
        category: "custom"
    },
    {
        key: "pangkat_atasan",
        label: "Pangkat Atasan",
        description: "Pangkat dan golongan pimpinan",
        example: "Pembina Utama Muda / IV/c",
        category: "custom"
    }
];

// Category labels in Indonesian
export const VARIABLE_CATEGORIES: Record<VariableCategory, string> = {
    pegawai: "Data Pegawai",
    cuti: "Data Cuti",
    kenaikan_pangkat: "Data Kenaikan Pangkat",
    pensiun: "Data Pensiun",
    mutasi: "Data Mutasi",
    unit: "Data Unit Kerja",
    tanggal: "Data Tanggal",
    custom: "Data Kustom"
};

// Category colors for UI
export const VARIABLE_CATEGORY_COLORS: Record<VariableCategory, string> = {
    pegawai: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    cuti: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    kenaikan_pangkat: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    pensiun: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    mutasi: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    unit: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    tanggal: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    custom: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

/**
 * Get variables filtered by category
 */
export const getVariablesByCategory = (category: VariableCategory): ExtendedTemplateVariable[] => {
    return TEMPLATE_VARIABLES.filter(v => v.category === category);
};

/**
 * Get variables filtered by service type
 */
export const getVariablesByServiceType = (serviceType: string): ExtendedTemplateVariable[] => {
    return TEMPLATE_VARIABLES.filter(v => 
        !v.serviceTypes || v.serviceTypes.length === 0 || v.serviceTypes.includes(serviceType)
    );
};

/**
 * Get a variable by its key
 */
export const getVariableByKey = (key: string): ExtendedTemplateVariable | undefined => {
    // Handle indexed variables (e.g., nama_pegawai_1 -> nama_pegawai)
    const baseKey = key.replace(/_\d+$/, '');
    return TEMPLATE_VARIABLES.find(v => v.key === baseKey || v.key === key);
};

/**
 * Format variable for template use
 * @param key - Variable key
 * @param index - Optional index for numbered variables
 * @returns Formatted variable string like {key} or {key_1}
 */
export const formatVariable = (key: string, index?: number): string => {
    if (index !== undefined && index > 0) {
        return `{${key}_${index}}`;
    }
    return `{${key}}`;
};

/**
 * Parse variables from template content
 * Supports both {variable} and {{variable}} syntax
 * Also supports indexed variables like {variable_1}, {variable_2}
 */
export const parseTemplateVariables = (content: string): string[] => {
    const regex = /\{?\{([a-zA-Z_][a-zA-Z0-9_]*(?:_\d+)?)\}\}?/g;
    const matches = content.matchAll(regex);
    const variables = new Set<string>();
    
    for (const match of matches) {
        variables.add(match[1]);
    }
    
    return Array.from(variables);
};

/**
 * Get base variable key from indexed variable
 * e.g., "nama_pegawai_1" -> "nama_pegawai"
 */
export const getBaseVariableKey = (key: string): string => {
    return key.replace(/_\d+$/, '');
};

/**
 * Check if a variable key is indexed
 */
export const isIndexedVariable = (key: string): boolean => {
    return /_\d+$/.test(key);
};

/**
 * Get the index from an indexed variable key
 * e.g., "nama_pegawai_2" -> 2
 */
export const getVariableIndex = (key: string): number | null => {
    const match = key.match(/_(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
};

/**
 * Generate indexed variable keys
 * @param baseKey - Base variable key
 * @param count - Number of indexed variables to generate
 */
export const generateIndexedVariables = (baseKey: string, count: number): string[] => {
    const variables: string[] = [baseKey]; // Base variable without index
    for (let i = 1; i <= count; i++) {
        variables.push(`${baseKey}_${i}`);
    }
    return variables;
};

/**
 * Default template content for leave certificates
 */
export const DEFAULT_TEMPLATE_CONTENT = `SURAT KETERANGAN CUTI

Nomor: {nomor_surat}

Yang bertanda tangan di bawah ini, Kepala {unit_kerja}, menerangkan bahwa:

Nama              : {nama_pegawai}
NIP               : {nip}
Jabatan           : {jabatan}
Pangkat/Golongan  : {pangkat}
Unit Kerja        : {unit_kerja}

Telah diberikan izin {jenis_cuti} terhitung mulai tanggal {tanggal_mulai} sampai dengan {tanggal_selesai} ({total_hari} hari kerja).

Selama yang bersangkutan menjalankan cuti, tugas dan tanggung jawabnya akan dilaksanakan oleh {pegawai_pengganti}.

Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.

{unit_kerja}, {tanggal_surat}
Kepala {unit_kerja},



{kepala_unit}
NIP. {nip_kepala_unit}`;
