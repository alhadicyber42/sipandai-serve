export interface DocumentRequirement {
  name: string;
  note?: string;
}

export interface PromotionCategory {
  id: string;
  name: string;
  documents: DocumentRequirement[];
}

export const PROMOTION_CATEGORIES: PromotionCategory[] = [
  {
    id: "reguler_pelaksana",
    name: "Kenaikan Pangkat Reguler (Jabatan Pelaksana)",
    documents: [
      {
        name: "SKP 2 tahun terakhir",
        note: "Nilai minimal 'Baik'; Nilai 'Sangat Baik' perlu dilampirkan bukti inovasi; Wajib ada lembar 'Dokumen Evaluasi Kinerja Pegawai'"
      },
      { name: "SK Jabatan terakhir" },
      { name: "SK Pangkat terakhir" },
      { name: "Kartu Pegawai" },
      { name: "Ijazah + Transkrip nilai terakhir" },
      { name: "Nota dinas" }
    ]
  },
  {
    id: "fungsional",
    name: "Kenaikan Pangkat Jabatan Fungsional",
    documents: [
      {
        name: "PAK tahun 2022 hingga saat ini",
        note: "Wajib 3 lembar di setiap tahun"
      },
      {
        name: "SKP 2 tahun terakhir",
        note: "Nilai minimal 'Baik'; Nilai 'Sangat Baik' perlu dilampirkan bukti inovasi; Wajib ada lembar 'Dokumen Evaluasi Kinerja Pegawai'"
      },
      {
        name: "SK Jabatan terakhir",
        note: "Wajib disertai sertifikat uji kompetensi bagi pegawai yang naik jenjang"
      },
      { name: "SK Pangkat terakhir" },
      { name: "Kartu Pegawai" },
      { name: "Ijazah + transkrip nilai terakhir" },
      { name: "Nota dinas" }
    ]
  },
  {
    id: "struktural",
    name: "Kenaikan Pangkat Jabatan Struktural",
    documents: [
      {
        name: "SKP 2 tahun terakhir",
        note: "Nilai minimal 'Baik'; Nilai 'Sangat Baik' perlu dilampirkan bukti inovasi; Wajib ada lembar 'Dokumen Evaluasi Kinerja Pegawai'"
      },
      { name: "SK Jabatan terakhir" },
      { name: "SK Pangkat terakhir" },
      { name: "Kartu Pegawai" },
      { name: "Ijazah + Transkrip Nilai terakhir" },
      { name: "Surat Pernyataan Pelantikan" },
      { name: "Surat Pernyataan Melaksanakan Tugas" },
      { name: "Surat Pernyataan Menduduki Jabatan" },
      {
        name: "Diklat PIM III",
        note: "Khusus untuk Pejabat Struktural Eselon III yang pendidikan terakhirnya S1 dan pangkat terakhirnya III/d"
      },
      { name: "Nota dinas" }
    ]
  },
  {
    id: "pertama_kali",
    name: "Kenaikan Pangkat Pertama Kali",
    documents: [
      { name: "SK CPNS" },
      { name: "SK PNS" },
      {
        name: "SKP 2 tahun terakhir",
        note: "Nilai minimal 'Baik'; Nilai 'Sangat Baik' perlu dilampirkan bukti inovasi; Wajib ada lembar 'Dokumen Evaluasi Kinerja Pegawai'"
      },
      {
        name: "PAK tahun 2022 hingga saat ini",
        note: "Khusus untuk jabatan fungsional; Wajib 3 lembar di setiap tahun"
      },
      {
        name: "SK Jabatan",
        note: "Khusus untuk jabatan fungsional"
      },
      {
        name: "Berita Acara Pengambilan Sumpah Jabatan PNS",
        note: "Khusus untuk jabatan fungsional"
      },
      { name: "SK Pangkat terakhir" },
      { name: "Kartu Pegawai" },
      { name: "Ijazah + Transkrip Nilai terakhir" },
      { name: "Nota dinas" }
    ]
  },
  {
    id: "penyesuaian_ijazah",
    name: "Kenaikan Pangkat Penyesuaian Ijazah",
    documents: [
      { name: "Surat Tanda Lulus Ujian Penyesuaian Kenaikan Pangkat" },
      {
        name: "Ijazah + Transkrip Nilai terakhir yang telah dilegalisir"
      },
      { name: "Uraian Tugas" },
      {
        name: "SKP 2 tahun terakhir",
        note: "Nilai minimal 'Baik'; Nilai 'Sangat Baik' perlu dilampirkan bukti inovasi; Wajib ada lembar 'Dokumen Evaluasi Kinerja Pegawai'"
      },
      { name: "SK Jabatan terakhir" },
      { name: "SK Pangkat terakhir" },
      { name: "Kartu Pegawai" },
      { name: "Nota dinas" }
    ]
  },
  {
    id: "golongan_2d_3a",
    name: "Kenaikan Pangkat Golongan II/d ke III/a",
    documents: [
      { name: "Surat Tanda Lulus Ujian Dinas" },
      {
        name: "SKP 2 tahun terakhir",
        note: "Nilai minimal 'Baik'; Nilai 'Sangat Baik' perlu dilampirkan bukti inovasi; Wajib ada lembar 'Dokumen Evaluasi Kinerja Pegawai'"
      },
      { name: "SK Jabatan terakhir" },
      { name: "SK Pangkat terakhir" },
      { name: "Ijazah + Transkrip nilai terakhir" },
      { name: "Kartu Pegawai" },
      { name: "Nota dinas" }
    ]
  }
];

export const MONTHS = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" }
];

export const YEARS = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() + i;
  return { value: year.toString(), label: year.toString() };
});
