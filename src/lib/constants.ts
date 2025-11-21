export const WORK_UNITS = [
  { id: 1, name: "Setditjen Binalavotas", code: "SETDITJEN" },
  { id: 2, name: "Direktorat Bina Stankomproglat", code: "STANKOM" },
  { id: 3, name: "Direktorat Bina Lemlatvok", code: "LEMLATVOK" },
  { id: 4, name: "Direktorat Bina Lavogan", code: "LAVOGAN" },
  { id: 5, name: "Direktorat Bina Intala", code: "INTALA" },
  { id: 6, name: "Direktorat Bina Peningkatan Produktivitas", code: "PRODUKTIVITAS" },
  { id: 7, name: "Set. BNSP", code: "BNSP" },
  { id: 8, name: "BBPVP Bekasi", code: "BBPVP-BEKASI" },
  { id: 9, name: "BBPVP Bandung", code: "BBPVP-BANDUNG" },
  { id: 10, name: "BBPVP Serang", code: "BBPVP-SERANG" },
  { id: 11, name: "BBPVP Medan", code: "BBPVP-MEDAN" },
  { id: 12, name: "BBPVP Semarang", code: "BBPVP-SEMARANG" },
  { id: 13, name: "BBPVP Makassar", code: "BBPVP-MAKASSAR" },
  { id: 14, name: "BPVP Surakarta", code: "BPVP-SURAKARTA" },
  { id: 15, name: "BPVP Ambon", code: "BPVP-AMBON" },
  { id: 16, name: "BPVP Ternate", code: "BPVP-TERNATE" },
  { id: 17, name: "BPVP Banda Aceh", code: "BPVP-ACEH" },
  { id: 18, name: "BPVP Sorong", code: "BPVP-SORONG" },
  { id: 19, name: "BPVP Kendari", code: "BPVP-KENDARI" },
  { id: 20, name: "BPVP Samarinda", code: "BPVP-SAMARINDA" },
  { id: 21, name: "BPVP Padang", code: "BPVP-PADANG" },
  { id: 22, name: "BPVP Bandung Barat", code: "BPVP-BANDUNG-BARAT" },
  { id: 23, name: "BPVP Lotim", code: "BPVP-LOTIM" },
  { id: 24, name: "BPVP Bantaeng", code: "BPVP-BANTAENG" },
  { id: 25, name: "BPVP Banyuwangi", code: "BPVP-BANYUWANGI" },
  { id: 26, name: "BPVP Sidoarjo", code: "BPVP-SIDOARJO" },
  { id: 27, name: "BPVP Pangkep", code: "BPVP-PANGKEP" },
  { id: 28, name: "BPVP Belitung", code: "BPVP-BELITUNG" },
];

export const SERVICE_TYPES = {
  KENAIKAN_PANGKAT: "kenaikan_pangkat",
  MUTASI: "mutasi",
  PENSIUN: "pensiun",
  CUTI: "cuti",
  KONSULTASI: "konsultasi",
} as const;

export const SERVICE_LABELS = {
  kenaikan_pangkat: "Kenaikan Pangkat",
  mutasi: "Mutasi Pegawai",
  pensiun: "Pensiun Pegawai",
  cuti: "Cuti Pegawai",
  konsultasi: "Konsultasi",
};

export const SERVICE_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW_UNIT: "under_review_unit",
  RETURNED_TO_USER: "returned_to_user",
  APPROVED_BY_UNIT: "approved_by_unit",
  UNDER_REVIEW_CENTRAL: "under_review_central",
  RETURNED_TO_UNIT: "returned_to_unit",
  APPROVED_FINAL: "approved_final",
  REJECTED: "rejected",
} as const;

export const CONSULTATION_STATUS = {
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  RESPONDED: "responded",
  ESCALATED: "escalated",
  ESCALATED_RESPONDED: "escalated_responded",
  FOLLOW_UP_REQUESTED: "follow_up_requested",
  RESOLVED: "resolved",
  CLOSED: "closed",
} as const;

export const USER_ROLES = {
  USER_UNIT: "user_unit",
  ADMIN_UNIT: "admin_unit",
  ADMIN_PUSAT: "admin_pusat",
} as const;

export const LEAVE_TYPES = {
  TAHUNAN: "tahunan",
  SAKIT: "sakit",
  MELAHIRKAN: "melahirkan",
  ALASAN_PENTING: "alasan_penting",
  BESAR: "besar",
  BERSAMA: "bersama",
  DI_LUAR_TANGGUNGAN: "di_luar_tanggungan_negara",
} as const;

export const LEAVE_LABELS = {
  tahunan: "Cuti Tahunan",
  sakit: "Cuti Sakit",
  melahirkan: "Cuti Melahirkan",
  alasan_penting: "Cuti Alasan Penting",
  besar: "Cuti Besar",
  bersama: "Cuti Bersama",
  di_luar_tanggungan_negara: "Cuti di Luar Tanggungan Negara",
};

export const STATUS_COLORS = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/10 text-primary",
  under_review_unit: "bg-warning/10 text-warning",
  returned_to_user: "bg-destructive/10 text-destructive",
  approved_by_unit: "bg-success/10 text-success",
  under_review_central: "bg-accent/10 text-accent",
  returned_to_unit: "bg-destructive/10 text-destructive",
  approved_final: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  under_review: "bg-warning/10 text-warning",
  responded: "bg-primary/10 text-primary",
  escalated: "bg-accent/10 text-accent",
  escalated_responded: "bg-accent text-accent-foreground",
  follow_up_requested: "bg-warning/10 text-warning",
  resolved: "bg-success text-success-foreground",
  closed: "bg-muted text-muted-foreground",
} as const;

export const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Diajukan",
  under_review_unit: "Ditinjau Unit",
  returned_to_user: "Dikembalikan",
  approved_by_unit: "Disetujui Unit",
  under_review_central: "Ditinjau Pusat",
  returned_to_unit: "Dikembalikan ke Unit",
  approved_final: "Disetujui",
  rejected: "Ditolak",
  under_review: "Sedang Ditinjau",
  responded: "Telah Direspons",
  escalated: "Diangkat ke Pusat",
  escalated_responded: "Direspons Pusat",
  follow_up_requested: "Perlu Tindak Lanjut",
  resolved: "Selesai",
  closed: "Ditutup",
};

export const REQUIRED_DOCUMENTS = [
  // Dokumen Dasar
  { id: "sk_cpns", label: "SK CPNS", allowMultiple: true },
  { id: "sk_pns", label: "SK PNS", allowMultiple: true },
  { id: "sk_pangkat_terakhir", label: "SK Pangkat Terakhir", allowMultiple: true },
  { id: "sk_jabatan_terakhir", label: "SK Jabatan Terakhir", allowMultiple: true },
  { id: "ijazah_terakhir", label: "Ijazah Terakhir", allowMultiple: true },
  { id: "transkrip_nilai", label: "Transkrip Nilai", allowMultiple: true },
  { id: "ktp", label: "KTP", allowMultiple: true },
  { id: "kk", label: "Kartu Keluarga", allowMultiple: true },
  { id: "npwp", label: "NPWP", allowMultiple: true },
  { id: "bpjs", label: "BPJS / KIS", allowMultiple: true },
  { id: "karpeg", label: "Kartu Pegawai (Karpeg)", allowMultiple: true },
  { id: "pas_foto", label: "Pas Foto Terbaru", allowMultiple: true },

  // Dokumen untuk Kenaikan Pangkat
  { id: "skp_2_tahun", label: "SKP 2 Tahun Terakhir", allowMultiple: true },
  { id: "pak", label: "PAK (Penetapan Angka Kredit)", allowMultiple: true },
  { id: "nota_dinas", label: "Nota Dinas", allowMultiple: true },
  { id: "surat_lulus_ujian_penyesuaian", label: "Surat Tanda Lulus Ujian Penyesuaian Kenaikan Pangkat", allowMultiple: true },
  { id: "surat_lulus_ujian_dinas", label: "Surat Tanda Lulus Ujian Dinas", allowMultiple: true },
  { id: "uraian_tugas", label: "Uraian Tugas", allowMultiple: true },
  { id: "sertifikat_uji_kompetensi", label: "Sertifikat Uji Kompetensi", allowMultiple: true },
  { id: "ba_sumpah_pns", label: "Berita Acara Pengambilan Sumpah Jabatan PNS", allowMultiple: true },
  { id: "surat_pernyataan_pelantikan", label: "Surat Pernyataan Pelantikan", allowMultiple: true },
  { id: "surat_pernyataan_tugas", label: "Surat Pernyataan Melaksanakan Tugas", allowMultiple: true },
  { id: "surat_pernyataan_jabatan", label: "Surat Pernyataan Menduduki Jabatan", allowMultiple: true },
  { id: "diklat_pim_3", label: "Diklat PIM III", allowMultiple: true },

  // Dokumen untuk Mutasi
  { id: "surat_lolos_butuh", label: "Surat Pernyataan Lolos Butuh dari PPK Instansi Asal", allowMultiple: true },
  { id: "surat_tidak_hukuman", label: "Surat Keterangan Tidak Sedang Menjalani Hukuman Disiplin", allowMultiple: true },
  { id: "surat_tidak_tugas_belajar", label: "Surat Keterangan Tidak Sedang Menjalani Tugas Belajar/Ikatan Dinas", allowMultiple: true },
  { id: "surat_tidak_hutang", label: "Surat Keterangan Tidak Mempunyai Hutang Piutang dengan Pihak Bank", allowMultiple: true },
  { id: "surat_bebas_temuan", label: "Surat Pernyataan Bebas Temuan ITJEN", allowMultiple: true },
  { id: "anjab_abk", label: "ANJAB dan ABK", allowMultiple: true },
  { id: "surat_permohonan_mutasi", label: "Surat Permohonan Mutasi", allowMultiple: true },
  { id: "drh", label: "Daftar Riwayat Hidup (DRH)", allowMultiple: true },

  // Dokumen untuk Pensiun
  { id: "surat_permohonan_pensiun", label: "Surat Permohonan Pensiun", allowMultiple: true },
  { id: "daftar_keluarga", label: "Daftar Susunan Keluarga", allowMultiple: true },
  { id: "surat_nikah", label: "Surat Nikah", allowMultiple: true },
  { id: "akte_kelahiran_anak", label: "Akte Kelahiran Anak", allowMultiple: true },
  { id: "kgb_terakhir", label: "Kenaikan Gaji Berkala Terakhir", allowMultiple: true },
  { id: "surat_tidak_hukuman_disiplin", label: "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat", allowMultiple: true },
  { id: "surat_tidak_pidana", label: "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana", allowMultiple: true },
  { id: "dpcpp", label: "Data Perorangan Calon Penerimaan Pensiun (DPCPP)", allowMultiple: true },
  { id: "buku_tabungan", label: "Buku Tabungan", allowMultiple: true },
  { id: "karis_karsu", label: "Karis/Karsu", allowMultiple: true },
  { id: "surat_kematian", label: "Surat Keterangan Kematian", allowMultiple: true },
  { id: "surat_anak_sekolah", label: "Surat Keterangan Anak Masih Sekolah/Kuliah", allowMultiple: true },
  { id: "surat_janda_duda", label: "Surat Keterangan Janda/Duda dari Kelurahan", allowMultiple: true },
  { id: "berita_acara_kematian", label: "Berita Acara (Kejadian Kematian)", allowMultiple: true },
  { id: "visum", label: "Visum et Repertum", allowMultiple: true },
  { id: "surat_tugas", label: "Surat Tugas", allowMultiple: true },
  { id: "laporan_pimpinan", label: "Laporan Dari Pimpinan Unit Kerja", allowMultiple: true },
  { id: "kp_anumerta", label: "Kenaikan Pangkat Anumerta Sementara", allowMultiple: true },
] as const;
