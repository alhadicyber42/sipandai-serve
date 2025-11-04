export interface DocumentRequirement {
  name: string;
  note?: string;
}

export interface TransferCategory {
  id: string;
  name: string;
  description: string;
  documents: DocumentRequirement[];
}

const COMMON_TRANSFER_DOCUMENTS: DocumentRequirement[] = [
  {
    name: "Surat Pernyataan Lolos Butuh dari PPK Instansi Asal (Asli)",
  },
  {
    name: "Surat Keterangan Tidak Sedang Menjalani Hukuman Disiplin (Asli)",
  },
  {
    name: "Surat Keterangan Tidak Sedang Menjalani Tugas Belajar/Ikatan Dinas (Asli)",
  },
  {
    name: "Surat Keterangan Tidak Mempunyai Hutang Piutang dengan Pihak Bank (Asli)",
  },
  {
    name: "Surat Pernyataan Bebas Temuan yang Diterbitkan oleh ITJEN (Asli)",
    note: "Form dapat diunduh pada link https://bit.ly/FormulirBebasTemuan-ITJEN",
  },
  {
    name: "ANJAB dan ABK yang ditandatangani oleh PPK Instansi Asal (Bila Pindah Antar Kementerian)",
  },
  {
    name: "SK CPNS (Fotokopi legalisir)",
  },
  {
    name: "SK PNS (Fotokopi legalisir)",
  },
  {
    name: "SK Pangkat Terakhir (Fotokopi legalisir)",
  },
  {
    name: "SK Jabatan Terakhir (Fotokopi legalisir)",
  },
  {
    name: "KARPEG (Fotokopi legalisir)",
  },
  {
    name: "Ijazah dan Transkrip Nilai Universitas (Fotokopi legalisir)",
  },
  {
    name: "SKP 2 tahun terakhir (Fotokopi legalisir)",
  },
  {
    name: "Surat permohonan mutasi dari ybs",
  },
  {
    name: "Daftar Riwayat Hidup (DRH) sesuai Keputusan Kepala BKN Nomor 11 Tahun 2002",
  },
];

export const TRANSFER_CATEGORIES: TransferCategory[] = [
  {
    id: "dalam_unit_eselon_1",
    name: "Mutasi Dalam Unit Kerja Eselon 1",
    description: "Perpindahan pegawai dalam lingkup unit kerja Eselon 1 yang sama",
    documents: COMMON_TRANSFER_DOCUMENTS,
  },
  {
    id: "antar_unit_eselon_1",
    name: "Mutasi Keluar Antar Unit Eselon 1",
    description: "Perpindahan pegawai antar unit kerja Eselon 1 yang berbeda",
    documents: COMMON_TRANSFER_DOCUMENTS,
  },
  {
    id: "antar_kementerian",
    name: "Mutasi Keluar Antar Kementerian/Lembaga",
    description: "Perpindahan pegawai antar Kementerian atau Lembaga yang berbeda",
    documents: COMMON_TRANSFER_DOCUMENTS,
  },
];
