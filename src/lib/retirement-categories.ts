export interface DocumentRequirement {
  name: string;
  note?: string;
}

export interface RetirementCategory {
  id: string;
  name: string;
  documents: DocumentRequirement[];
}

export const RETIREMENT_CATEGORIES: RetirementCategory[] = [
  {
    id: "pensiun_reguler",
    name: "Pensiun Reguler",
    documents: [
      { name: "Surat Permohonan Pensiun dari Ybs" },
      { name: "Foto Pegawai" },
      { name: "KTP" },
      { name: "NPWP" },
      { name: "Daftar Susunan Keluarga" },
      { name: "Kartu Pegawai" },
      { name: "Surat Nikah" },
      { name: "Akte Kelahiran Anak", note: "Apabila masih ada anak yang menjadi tanggungan" },
      { name: "SK CPNS" },
      { name: "SK PNS" },
      { name: "SK Kenaikan Pangkat Terakhir" },
      { name: "SK Jabatan Terakhir" },
      { name: "Kenaikan Gaji Berkala Terakhir" },
      { name: "SKP 2 Tahun Terakhir" },
      { name: "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat", note: "Dalam 1 tahun terakhir" },
      { name: "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana" },
      { name: "Data Perorangan Calon Penerimaan Pensiun (DPCPP)" },
      { name: "Buku Tabungan", note: "Lembar yang terdapat nomor rekening" },
      { name: "Karis/Karsu" },
      { name: "Surat Keterangan Kematian", note: "Bila ada" },
      { name: "Surat Keterangan Anak masih sekolah/kuliah", note: "Bila terdapat anak yang masih menjadi tanggungan" }
    ]
  },
  {
    id: "pensiun_janda_duda",
    name: "Pensiun Janda/Duda (PNS Meninggal)",
    documents: [
      { name: "Surat Permohonan Pensiun dari Janda/Duda Ybs" },
      { name: "Foto Janda/Duda Ybs" },
      { name: "KTP Janda/Duda" },
      { name: "NPWP Janda/Duda" },
      { name: "Daftar Susunan Keluarga" },
      { name: "Kartu Pegawai" },
      { name: "Surat Nikah" },
      { name: "Akte Kelahiran Anak", note: "Apabila masih ada anak yang menjadi tanggungan" },
      { name: "SK CPNS" },
      { name: "SK PNS" },
      { name: "SK Kenaikan Pangkat Terakhir" },
      { name: "SK Jabatan Terakhir" },
      { name: "Kenaikan Gaji Berkala Terakhir" },
      { name: "SKP 2 Tahun Terakhir" },
      { name: "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat", note: "Dalam 1 tahun terakhir" },
      { name: "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana" },
      { name: "Data perorangan Calon Penerimaan Pensiun (DPCPP)" },
      { name: "Buku Tabungan Janda/Duda", note: "Lembar yang terdapat nomor rekening" },
      { name: "Surat Keterangan Kematian Ybs" },
      { name: "Surat Keterangan Janda/Duda dari Kelurahan" },
      { name: "Karis/Karsu" },
      { name: "Surat Keterangan Anak masih sekolah/kuliah", note: "Bila terdapat anak yang masih menjadi tanggungan" }
    ]
  },
  {
    id: "pensiun_anak",
    name: "Pensiun Anak (PNS dan pasangan meninggal dunia)",
    documents: [
      { name: "Surat Permohonan Pensiun dari Anak Ybs" },
      { name: "Foto Anak Ybs" },
      { name: "KTP Anak" },
      { name: "Daftar Susunan Keluarga" },
      { name: "Kartu Pegawai" },
      { name: "Akte Kelahiran Anak" },
      { name: "SK CPNS" },
      { name: "SK PNS" },
      { name: "SK Kenaikan Pangkat Terakhir" },
      { name: "Kenaikan Gaji Berkala Terakhir" },
      { name: "SKP 2 Tahun Terakhir" },
      { name: "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat", note: "Dalam 1 tahun terakhir" },
      { name: "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana" },
      { name: "Data perorangan Calon Penerimaan Pensiun (DPCPP)" },
      { name: "Buku Tabungan Anak", note: "Lembar yang terdapat nomor rekening" },
      { name: "Surat Keterangan Kematian Ybs" },
      { name: "Surat Keterangan Kematian Pasangan YBS" }
    ]
  },
  {
    id: "pns_meninggal_tanpa_ahli_waris",
    name: "PNS Meninggal Tanpa Ahli Waris",
    documents: [
      { name: "Surat Kematian" },
      { name: "SK CPNS" },
      { name: "SK PNS" },
      { name: "SK Kenaikan Pangkat Terakhir" },
      { name: "SK Jabatan Terakhir" }
    ]
  },
  {
    id: "pns_meninggal_belum_menikah",
    name: "PNS Meninggal Status Belum Menikah",
    documents: [
      { name: "Surat Permohonan Pensiun dari Ortu Ybs" },
      { name: "Foto Ortu Ybs" },
      { name: "KTP Ortu Ybs" },
      { name: "Daftar Susunan Keluarga" },
      { name: "SK CPNS" },
      { name: "SK PNS" },
      { name: "SK Kenaikan Pangkat Terakhir" },
      { name: "SK Jabatan Terakhir" },
      { name: "Data perorangan Calon Penerimaan Pensiun (DPCPP)" },
      { name: "Buku Tabungan Ortu", note: "Lembar yang terdapat nomor rekening" },
      { name: "Surat Keterangan Kematian Ybs" }
    ]
  },
  {
    id: "pensiun_dini",
    name: "Pensiun Dini",
    documents: [
      { name: "Surat Permohonan Pensiun dari Ybs" },
      { name: "Foto Pegawai" },
      { name: "KTP" },
      { name: "NPWP" },
      { name: "Daftar Susunan Keluarga" },
      { name: "Kartu Pegawai" },
      { name: "Surat Nikah", note: "Bila ada" },
      { name: "Akte Kelahiran Anak", note: "Apabila masih ada anak yang menjadi tanggungan" },
      { name: "SK CPNS" },
      { name: "SK PNS" },
      { name: "SK Kenaikan Pangkat Terakhir" },
      { name: "SK Jabatan Terakhir" },
      { name: "Kenaikan Gaji Berkala Terakhir" },
      { name: "SKP 2 Tahun Terakhir" },
      { name: "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat", note: "Dalam 1 tahun terakhir" },
      { name: "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana" },
      { name: "Data perorangan Calon Penerimaan Pensiun (DPCPP)" }
    ]
  },
  {
    id: "pensiun_anumerta",
    name: "Pensiun Anumerta",
    documents: [
      { name: "Berita Acara", note: "Kejadian yang mengakibatkan ybs meninggal dunia" },
      { name: "Visum et repertum" },
      { name: "Surat Tugas Ybs" },
      { name: "Surat Keterangan", note: "Yang menyatakan ybs meninggal karena dinas" },
      { name: "Laporan Dari Pimpinan Unit Kerja", note: "Yang menyatakan bahwa ybs meninggal karna dinas" },
      { name: "Kenaikan Pangkat Anumerta Sementara" },
      { name: "SK CPNS" },
      { name: "SK PNS" },
      { name: "SK Kenaikan Pangkat Terakhir" },
      { name: "SK Jabatan Terakhir" },
      { name: "Kenaikan Gaji Berkala Terakhir" },
      { name: "Surat Nikah", note: "Bila ada" },
      { name: "Akte Kelahiran Anak", note: "Apabila masih ada anak yang menjadi tanggungan" },
      { name: "Foto Janda/Duda Ybs" },
      { name: "Buku Tabungan Janda/Duda", note: "Lembar yang terdapat nomor rekening" },
      { name: "Surat Keterangan Kematian Ybs" },
      { name: "Karis/Karsu" },
      { name: "Surat Keterangan Anak masih sekolah/kuliah", note: "Bila terdapat anak yang masih menjadi tanggungan" }
    ]
  },
  {
    id: "masa_pra_pensiun",
    name: "Masa Pra Pensiun",
    documents: [
      { name: "Surat Permohonan Pensiun dari Ybs" },
      { name: "Foto Pegawai" },
      { name: "KTP" },
      { name: "NPWP" },
      { name: "Daftar Susunan Keluarga" },
      { name: "Kartu Pegawai" },
      { name: "Surat Nikah" },
      { name: "Akte Kelahiran Anak", note: "Apabila masih ada anak yang menjadi tanggungan" },
      { name: "SK CPNS" },
      { name: "SK PNS" },
      { name: "SK Kenaikan Pangkat Terakhir" },
      { name: "SK Jabatan Terakhir" },
      { name: "Kenaikan Gaji Berkala Terakhir" },
      { name: "SKP 2 Tahun Terakhir" },
      { name: "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat", note: "Dalam 1 tahun terakhir" },
      { name: "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana" }
    ]
  }
];
