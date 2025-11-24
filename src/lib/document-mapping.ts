/**
 * Mapping between service document names and repository document IDs
 * This enables bidirectional sync between service forms and document repository
 */

export const SERVICE_DOCUMENT_MAPPING = {
    kenaikan_pangkat: {
        "SKP 2 tahun terakhir": "skp_2_tahun",
        "SK Jabatan terakhir": "sk_jabatan_terakhir",
        "SK Pangkat terakhir": "sk_pangkat_terakhir",
        "Kartu Pegawai": "karpeg",
        "Ijazah + Transkrip nilai terakhir": "ijazah_terakhir", // User can upload combined or separate
        "Ijazah + transkrip nilai terakhir": "ijazah_terakhir",
        "Nota dinas": "nota_dinas",
        "PAK tahun 2022 hingga saat ini": "pak",
        "SK CPNS": "sk_cpns",
        "SK PNS": "sk_pns",
        "Surat Tanda Lulus Ujian Penyesuaian Kenaikan Pangkat": "surat_lulus_ujian_penyesuaian",
        "Surat Tanda Lulus Ujian Dinas": "surat_lulus_ujian_dinas",
        "Uraian Tugas": "uraian_tugas",
        "Berita Acara Pengambilan Sumpah Jabatan PNS": "ba_sumpah_pns",
        "Surat Pernyataan Pelantikan": "surat_pernyataan_pelantikan",
        "Surat Pernyataan Melaksanakan Tugas": "surat_pernyataan_tugas",
        "Surat Pernyataan Menduduki Jabatan": "surat_pernyataan_jabatan",
        "Diklat PIM III": "diklat_pim_3",

        "Transkrip Nilai": "transkrip_nilai",
        "SK Jabatan": "sk_jabatan_terakhir",
        "Ijazah + Transkrip Nilai terakhir": "ijazah_terakhir",
        "Ijazah + Transkrip Nilai terakhir yang telah dilegalisir": "ijazah_terakhir",
    },
    mutasi: {
        "Surat Pernyataan Lolos Butuh dari PPK Instansi Asal (Asli)": "surat_lolos_butuh",
        "Surat Keterangan Tidak Sedang Menjalani Hukuman Disiplin (Asli)": "surat_tidak_hukuman",
        "Surat Keterangan Tidak Sedang Menjalani Tugas Belajar/Ikatan Dinas (Asli)": "surat_tidak_tugas_belajar",
        "Surat Keterangan Tidak Mempunyai Hutang Piutang dengan Pihak Bank (Asli)": "surat_tidak_hutang",
        "Surat Pernyataan Bebas Temuan yang Diterbitkan oleh ITJEN (Asli)": "surat_bebas_temuan",
        "ANJAB dan ABK yang ditandatangani oleh PPK Instansi Asal (Bila Pindah Antar Kementerian)": "anjab_abk",
        "SK CPNS (Fotokopi legalisir)": "sk_cpns",
        "SK PNS (Fotokopi legalisir)": "sk_pns",
        "SK Pangkat Terakhir (Fotokopi legalisir)": "sk_pangkat_terakhir",
        "SK Jabatan Terakhir (Fotokopi legalisir)": "sk_jabatan_terakhir",
        "KARPEG (Fotokopi legalisir)": "karpeg",
        "Ijazah dan Transkrip Nilai Universitas (Fotokopi legalisir)": "ijazah_terakhir",
        "SKP 2 tahun terakhir (Fotokopi legalisir)": "skp_2_tahun",
        "Surat permohonan mutasi dari ybs": "surat_permohonan_mutasi",
        "Daftar Riwayat Hidup (DRH) sesuai Keputusan Kepala BKN Nomor 11 Tahun 2002": "drh",
        "Transkrip Nilai": "transkrip_nilai",
        "Kartu Keluarga": "kk",
    },
    pensiun: {
        "Surat Permohonan Pensiun dari Ybs": "surat_permohonan_pensiun",
        "Surat Permohonan Pensiun dari Janda/Duda Ybs": "surat_permohonan_pensiun",
        "Surat Permohonan Pensiun dari Anak Ybs": "surat_permohonan_pensiun",
        "Surat Permohonan Pensiun dari Ortu Ybs": "surat_permohonan_pensiun",
        "Foto Pegawai": "pas_foto",
        "Foto Janda/Duda Ybs": "pas_foto",
        "Foto Anak Ybs": "pas_foto",
        "Foto Ortu Ybs": "pas_foto",
        "KTP": "ktp",
        "KTP Janda/Duda": "ktp",
        "KTP Anak": "ktp",
        "KTP Ortu Ybs": "ktp",
        "NPWP": "npwp",
        "NPWP Janda/Duda": "npwp",
        "Daftar Susunan Keluarga": "daftar_keluarga",
        "Kartu Pegawai": "karpeg",
        "Surat Nikah": "surat_nikah",
        "Akte Kelahiran Anak": "akte_kelahiran_anak",
        "SK CPNS": "sk_cpns",
        "SK PNS": "sk_pns",
        "SK Kenaikan Pangkat Terakhir": "sk_pangkat_terakhir",
        "SK Jabatan Terakhir": "sk_jabatan_terakhir",
        "Kenaikan Gaji Berkala Terakhir": "kgb_terakhir",
        "SKP 2 Tahun Terakhir": "skp_2_tahun",
        "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat": "surat_tidak_hukuman_disiplin",
        "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana": "surat_tidak_pidana",
        "Data Perorangan Calon Penerimaan Pensiun (DPCPP)": "dpcpp",
        "Data perorangan Calon Penerimaan Pensiun (DPCPP)": "dpcpp",
        "Buku Tabungan": "buku_tabungan",
        "Buku Tabungan Janda/Duda": "buku_tabungan",
        "Buku Tabungan Anak": "buku_tabungan",
        "Buku Tabungan Ortu": "buku_tabungan",
        "Karis/Karsu": "karis_karsu",
        "Surat Keterangan Kematian": "surat_kematian",
        "Surat Keterangan Kematian Ybs": "surat_kematian",
        "Surat Keterangan Kematian Pasangan YBS": "surat_kematian",
        "Surat Keterangan Anak masih sekolah/kuliah": "surat_anak_sekolah",
        "Surat Keterangan Janda/Duda dari Kelurahan": "surat_janda_duda",
        "Berita Acara": "berita_acara_kematian",
        "Visum et repertum": "visum",
        "Surat Tugas Ybs": "surat_tugas",
        "Surat Keterangan": "surat_kematian",
        "Laporan Dari Pimpinan Unit Kerja": "laporan_pimpinan",
        "Kenaikan Pangkat Anumerta Sementara": "kp_anumerta",
        "Surat Kematian": "surat_kematian",
        "Kartu Keluarga": "kk",
        "BPJS / KIS": "bpjs",
    },
} as const;

/**
 * Get repository document ID from service document name
 * @param serviceType - Type of service (kenaikan_pangkat, mutasi, pensiun)
 * @param docName - Document name as it appears in the service form
 * @returns Repository document ID or null if not found
 */
export function getRepositoryId(
    serviceType: keyof typeof SERVICE_DOCUMENT_MAPPING,
    docName: string
): string | null {
    return SERVICE_DOCUMENT_MAPPING[serviceType]?.[docName] || null;
}


/**
 * Get all repository IDs for a service type
 * @param serviceType - Type of service
 * @returns Array of repository document IDs used in this service
 */
export function getServiceRepositoryIds(
    serviceType: keyof typeof SERVICE_DOCUMENT_MAPPING
): string[] {
    const mapping = SERVICE_DOCUMENT_MAPPING[serviceType];
    if (!mapping) return [];
    return [...new Set(Object.values(mapping))];
}

/**
 * REVERSE MAPPING: Get all services that use a specific repository document
 * @param repositoryId - Repository document ID (e.g., "sk_cpns", "ijazah_terakhir")
 * @returns Array of service types that use this document
 */
export function getServicesUsingDocument(repositoryId: string): Array<{
    service: keyof typeof SERVICE_DOCUMENT_MAPPING;
    label: string;
    color: string;
}> {
    const services: Array<{ service: keyof typeof SERVICE_DOCUMENT_MAPPING; label: string; color: string }> = [];

    // Check each service type
    for (const [serviceType, mapping] of Object.entries(SERVICE_DOCUMENT_MAPPING)) {
        const docIds = Object.values(mapping) as string[];
        if (docIds.includes(repositoryId)) {
            // Map service type to display label and color
            if (serviceType === 'kenaikan_pangkat') {
                services.push({ service: 'kenaikan_pangkat', label: 'KP', color: 'green' });
            } else if (serviceType === 'mutasi') {
                services.push({ service: 'mutasi', label: 'Mutasi', color: 'teal' });
            } else if (serviceType === 'pensiun') {
                services.push({ service: 'pensiun', label: 'Pensiun', color: 'purple' });
            }
        }
    }

    return services;
}
