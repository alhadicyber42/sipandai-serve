import { z } from "zod";

// ==========================================
// HELPER VALIDATIONS
// ==========================================

/**
 * Validasi NIP (18 digit) atau NIK (16 digit)
 */
export const nipNikValidation = z.string()
  .optional()
  .refine((val) => {
    if (!val || val.trim() === "") return true;
    const cleaned = val.replace(/\s/g, "");
    return /^\d{16}$/.test(cleaned) || /^\d{18}$/.test(cleaned);
  }, {
    message: "NIP harus 18 digit atau NIK harus 16 digit (hanya angka)",
  });

/**
 * Validasi nomor telepon Indonesia
 */
export const phoneValidation = z.string()
  .optional()
  .refine((val) => {
    if (!val || val.trim() === "") return true;
    const cleaned = val.replace(/[\s\-]/g, "");
    return /^(08|\+62|62)\d{8,12}$/.test(cleaned);
  }, {
    message: "Format nomor telepon tidak valid (contoh: 08123456789)",
  });

/**
 * Validasi email
 */
export const emailValidation = z.string()
  .min(1, "Email diperlukan")
  .email("Format email tidak valid")
  .max(255, "Email maksimal 255 karakter");

/**
 * Validasi password yang kuat
 */
export const strongPasswordValidation = z.string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password maksimal 72 karakter")
  .regex(/[a-z]/, "Password harus mengandung huruf kecil")
  .regex(/[A-Z]/, "Password harus mengandung huruf besar")
  .regex(/[0-9]/, "Password harus mengandung angka");

/**
 * Validasi URL
 */
export const urlValidation = z.string()
  .url("URL tidak valid")
  .max(2048, "URL maksimal 2048 karakter");

/**
 * Validasi URL optional
 */
export const optionalUrlValidation = z.string()
  .optional()
  .refine((val) => {
    if (!val || val.trim() === "") return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, {
    message: "URL tidak valid",
  });

/**
 * Validasi nama lengkap
 */
export const nameValidation = z.string()
  .min(1, "Nama diperlukan")
  .min(3, "Nama minimal 3 karakter")
  .max(100, "Nama maksimal 100 karakter")
  .regex(/^[a-zA-Z\s'.,-]+$/, "Nama hanya boleh mengandung huruf dan karakter umum");

/**
 * Validasi teks bebas dengan batasan panjang
 */
export const createTextValidation = (minLength = 0, maxLength = 500, fieldName = "Field") => 
  z.string()
    .min(minLength, minLength > 0 ? `${fieldName} minimal ${minLength} karakter` : undefined)
    .max(maxLength, `${fieldName} maksimal ${maxLength} karakter`);

/**
 * Validasi tanggal
 */
export const dateValidation = z.string()
  .optional()
  .refine((val) => {
    if (!val || val.trim() === "") return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, {
    message: "Format tanggal tidak valid",
  });

/**
 * Validasi tanggal wajib
 */
export const requiredDateValidation = z.string()
  .min(1, "Tanggal diperlukan")
  .refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, {
    message: "Format tanggal tidak valid",
  });

// ==========================================
// PROFILE SCHEMAS
// ==========================================

export const profilePersonalInfoSchema = z.object({
  name: nameValidation,
  nip: nipNikValidation,
  phone: phoneValidation,
  tempat_lahir: createTextValidation(0, 100, "Tempat lahir").optional(),
  tanggal_lahir: dateValidation,
  alamat_lengkap: createTextValidation(0, 500, "Alamat").optional(),
  jenis_kelamin: z.enum(["Laki-laki", "Perempuan"]).optional().nullable(),
  agama: z.string().max(50, "Agama maksimal 50 karakter").optional().nullable(),
  status_perkawinan: z.string().max(50, "Status perkawinan maksimal 50 karakter").optional().nullable(),
  pendidikan_terakhir: z.string().max(100, "Pendidikan terakhir maksimal 100 karakter").optional().nullable(),
});

export const profileEmploymentInfoSchema = z.object({
  work_unit_id: z.number().optional().nullable(),
  jabatan: createTextValidation(0, 100, "Jabatan").optional().nullable(),
  pangkat_golongan: z.string().max(100).optional().nullable(),
  tmt_pns: dateValidation,
  tmt_pensiun: dateValidation,
  kriteria_asn: z.enum(["ASN", "Non ASN"]).optional().nullable(),
  masa_kerja_tahun: z.number().min(0).max(50).optional().nullable(),
  masa_kerja_bulan: z.number().min(0).max(11).optional().nullable(),
});

export const employmentHistoryItemSchema = z.object({
  nama_jabatan: createTextValidation(1, 100, "Nama jabatan"),
  unit_kerja: createTextValidation(0, 100, "Unit kerja").optional(),
  tmt_jabatan: dateValidation,
  tmt_selesai: dateValidation.optional(),
});

export const mutationHistoryItemSchema = z.object({
  unit_asal: createTextValidation(0, 100, "Unit asal").optional(),
  unit_tujuan: createTextValidation(0, 100, "Unit tujuan").optional(),
  alasan_mutasi: createTextValidation(0, 200, "Alasan mutasi").optional(),
  tmt_mutasi: dateValidation,
});

export const educationHistoryItemSchema = z.object({
  jenjang: z.string().max(50).optional(),
  institusi: createTextValidation(0, 200, "Institusi").optional(),
  jurusan: createTextValidation(0, 100, "Jurusan").optional(),
  tahun_lulus: z.string().max(10).optional(),
});

export const diklatHistoryItemSchema = z.object({
  nama_diklat: createTextValidation(0, 200, "Nama diklat").optional(),
  penyelenggara: createTextValidation(0, 200, "Penyelenggara").optional(),
  tahun: z.string().max(10).optional(),
  durasi: z.string().max(50).optional(),
});

export const kompetensiHistoryItemSchema = z.object({
  nama_uji: createTextValidation(0, 200, "Nama uji kompetensi").optional(),
  penyelenggara: createTextValidation(0, 200, "Penyelenggara").optional(),
  hasil: z.string().max(100).optional(),
  tahun: z.string().max(10).optional(),
});

export const profileSchema = profilePersonalInfoSchema.merge(profileEmploymentInfoSchema).extend({
  riwayat_jabatan: z.array(employmentHistoryItemSchema).optional(),
  riwayat_mutasi: z.array(mutationHistoryItemSchema).optional(),
  riwayat_pendidikan: z.array(educationHistoryItemSchema).optional(),
  riwayat_diklat: z.array(diklatHistoryItemSchema).optional(),
  riwayat_uji_kompetensi: z.array(kompetensiHistoryItemSchema).optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// ==========================================
// SERVICE FORM SCHEMAS
// ==========================================

/**
 * Schema untuk form cuti
 */
export const leaveFormSchema = z.object({
  leave_type: z.enum([
    "tahunan",
    "sakit",
    "melahirkan",
    "alasan_penting",
    "besar",
    "bersama",
    "di_luar_tanggungan_negara"
  ], {
    required_error: "Pilih jenis cuti",
  }),
  reason: createTextValidation(5, 500, "Alasan cuti"),
  leave_quota_year: z.string().min(1, "Pilih tahun kuota"),
  address_during_leave: createTextValidation(0, 500, "Alamat selama cuti").optional(),
  form_date: dateValidation.optional(),
  substitute_employee: createTextValidation(0, 100, "Pegawai pengganti").optional(),
  emergency_contact: phoneValidation.optional(),
});

export type LeaveFormValues = z.infer<typeof leaveFormSchema>;

/**
 * Schema untuk form mutasi
 */
export const transferFormSchema = z.object({
  target_unit_id: z.string().min(1, "Pilih unit kerja tujuan"),
  target_formation_id: z.string().min(1, "Pilih formasi jabatan tujuan"),
  category: z.string().min(1, "Pilih kategori mutasi"),
});

export type TransferFormValues = z.infer<typeof transferFormSchema>;

/**
 * Schema untuk form pensiun
 */
export const retirementFormSchema = z.object({
  category: z.string().min(1, "Pilih kategori pensiun"),
});

export type RetirementFormValues = z.infer<typeof retirementFormSchema>;

/**
 * Schema untuk form kenaikan pangkat
 */
export const promotionFormSchema = z.object({
  category: z.string().min(1, "Pilih kategori kenaikan pangkat"),
  month: z.string().min(1, "Pilih bulan pengajuan"),
  year: z.string().min(1, "Pilih tahun pengajuan"),
  description: createTextValidation(0, 1000, "Keterangan tambahan").optional(),
});

export type PromotionFormValues = z.infer<typeof promotionFormSchema>;

/**
 * Schema untuk form penangguhan cuti
 */
export const deferralFormSchema = z.object({
  deferral_year: z.string().min(1, "Pilih tahun"),
  days_deferred: z.string()
    .min(1, "Masukkan jumlah hari")
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 1 && num <= 12;
    }, {
      message: "Jumlah hari harus antara 1-12",
    }),
  approval_document: urlValidation,
  reason: z.string().min(1, "Pilih alasan penangguhan"),
});

export type DeferralFormValues = z.infer<typeof deferralFormSchema>;

// ==========================================
// CONSULTATION SCHEMAS
// ==========================================

export const consultationFormSchema = z.object({
  subject: createTextValidation(5, 200, "Subjek"),
  description: createTextValidation(20, 2000, "Deskripsi konsultasi"),
  category: z.enum(["kepegawaian", "administrasi", "teknis", "lainnya"], {
    required_error: "Pilih kategori",
  }),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export type ConsultationFormValues = z.infer<typeof consultationFormSchema>;

// ==========================================
// ADMIN FORM SCHEMAS
// ==========================================

export const announcementFormSchema = z.object({
  title: createTextValidation(3, 200, "Judul pengumuman"),
  content: createTextValidation(10, 5000, "Isi pengumuman"),
  is_pinned: z.boolean().optional(),
});

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

export const faqFormSchema = z.object({
  question: createTextValidation(10, 500, "Pertanyaan"),
  answer: createTextValidation(10, 2000, "Jawaban"),
  category: z.string().min(1, "Pilih kategori"),
  keywords: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

export type FaqFormValues = z.infer<typeof faqFormSchema>;

export const holidayFormSchema = z.object({
  name: createTextValidation(3, 100, "Nama hari libur"),
  date: requiredDateValidation,
  description: createTextValidation(0, 500, "Deskripsi").optional(),
  is_recurring: z.boolean().optional(),
});

export type HolidayFormValues = z.infer<typeof holidayFormSchema>;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Sanitize input string to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

/**
 * Check if URL is from allowed domains (for document links)
 */
export function isAllowedDocumentUrl(url: string): boolean {
  const allowedDomains = [
    "drive.google.com",
    "docs.google.com",
    "dropbox.com",
    "onedrive.live.com",
    "1drv.ms",
    "sharepoint.com",
    "box.com",
    "icloud.com",
    "github.com",
    "gitlab.com",
  ];

  try {
    const parsedUrl = new URL(url);
    return allowedDomains.some(domain => parsedUrl.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

/**
 * Validate document URL with additional security checks
 */
export const secureDocumentUrlValidation = z.string()
  .url("URL tidak valid")
  .max(2048, "URL maksimal 2048 karakter")
  .refine((url) => url.startsWith("https://"), {
    message: "URL harus menggunakan HTTPS",
  });

/**
 * Format validation error messages for display
 */
export function formatValidationErrors(errors: z.ZodError): string[] {
  return errors.errors.map(err => {
    const path = err.path.join(".");
    return path ? `${path}: ${err.message}` : err.message;
  });
}
