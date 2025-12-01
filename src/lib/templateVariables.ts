/**
 * Template Variables Configuration
 * Defines all available variables for leave certificate templates
 */

import { TemplateVariable } from "@/types/leave-certificate";

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
    // Employee Data Variables
    {
        key: "nama_pegawai",
        label: "Nama Pegawai",
        description: "Nama lengkap pegawai yang mengajukan cuti",
        example: "Ahmad Suryadi, S.Kom",
        category: "employee"
    },
    {
        key: "nip",
        label: "NIP",
        description: "Nomor Induk Pegawai",
        example: "198501012010011001",
        category: "employee"
    },
    {
        key: "jabatan",
        label: "Jabatan",
        description: "Jabatan pegawai",
        example: "Kepala Seksi Pelatihan",
        category: "employee"
    },
    {
        key: "pangkat",
        label: "Pangkat/Golongan",
        description: "Pangkat dan golongan pegawai",
        example: "Penata Muda Tk.I / III/b",
        category: "employee"
    },

    // Leave Data Variables
    {
        key: "jenis_cuti",
        label: "Jenis Cuti",
        description: "Jenis cuti yang diajukan",
        example: "Cuti Tahunan",
        category: "leave"
    },
    {
        key: "tanggal_mulai",
        label: "Tanggal Mulai",
        description: "Tanggal mulai cuti",
        example: "1 Desember 2025",
        category: "leave"
    },
    {
        key: "tanggal_selesai",
        label: "Tanggal Selesai",
        description: "Tanggal selesai cuti",
        example: "5 Desember 2025",
        category: "leave"
    },
    {
        key: "total_hari",
        label: "Total Hari",
        description: "Total hari cuti",
        example: "5",
        category: "leave"
    },
    {
        key: "alasan_cuti",
        label: "Alasan Cuti",
        description: "Alasan pengajuan cuti",
        example: "Keperluan keluarga",
        category: "leave"
    },
    {
        key: "pegawai_pengganti",
        label: "Pegawai Pengganti",
        description: "Nama pegawai yang menggantikan selama cuti",
        example: "Budi Santoso, S.T.",
        category: "leave"
    },
    {
        key: "kontak_darurat",
        label: "Kontak Darurat",
        description: "Nomor kontak yang dapat dihubungi",
        example: "081234567890",
        category: "leave"
    },

    // Unit Data Variables
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

    // Date Variables
    {
        key: "tanggal_surat",
        label: "Tanggal Surat",
        description: "Tanggal pembuatan surat",
        example: "1 Desember 2025",
        category: "date"
    },
    {
        key: "tahun",
        label: "Tahun",
        description: "Tahun saat ini",
        example: "2025",
        category: "date"
    },
    {
        key: "bulan",
        label: "Bulan",
        description: "Bulan saat ini",
        example: "Desember",
        category: "date"
    }
];

export const VARIABLE_CATEGORIES = {
    employee: "Data Pegawai",
    leave: "Data Cuti",
    unit: "Data Unit Kerja",
    date: "Data Tanggal"
} as const;

export const getVariablesByCategory = (category: TemplateVariable['category']) => {
    return TEMPLATE_VARIABLES.filter(v => v.category === category);
};

export const getVariableByKey = (key: string) => {
    return TEMPLATE_VARIABLES.find(v => v.key === key);
};

export const DEFAULT_TEMPLATE_CONTENT = `SURAT KETERANGAN CUTI

Nomor: _______________

Yang bertanda tangan di bawah ini, Kepala {{unit_kerja}}, menerangkan bahwa:

Nama              : {{nama_pegawai}}
NIP               : {{nip}}
Jabatan           : {{jabatan}}
Pangkat/Golongan  : {{pangkat}}
Unit Kerja        : {{unit_kerja}}

Telah diberikan izin {{jenis_cuti}} terhitung mulai tanggal {{tanggal_mulai}} sampai dengan {{tanggal_selesai}} ({{total_hari}} hari kerja).

Selama yang bersangkutan menjalankan cuti, tugas dan tanggung jawabnya akan dilaksanakan oleh {{pegawai_pengganti}}.

Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.

{{unit_kerja}}, {{tanggal_surat}}
Kepala {{unit_kerja}},



_______________________
NIP.`;
