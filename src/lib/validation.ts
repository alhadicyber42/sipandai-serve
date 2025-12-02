/**
 * Reusable Validation Schemas
 * Centralized validation schemas menggunakan Zod
 */

import { z } from 'zod';

// Common validation patterns
export const emailSchema = z.string().email('Email tidak valid').max(254, 'Email terlalu panjang');
export const nipSchema = z.string().min(1, 'NIP harus diisi').max(50, 'NIP terlalu panjang');
export const phoneSchema = z.string().regex(/^[0-9+\-\s()]+$/, 'Format nomor telepon tidak valid').max(20, 'Nomor telepon terlalu panjang').optional().or(z.literal(''));
export const urlSchema = z.string().url('URL tidak valid').max(2048, 'URL terlalu panjang');
export const nameSchema = z.string().min(1, 'Nama harus diisi').max(255, 'Nama terlalu panjang').trim();

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
  .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
  .regex(/[0-9]/, 'Password harus mengandung angka')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password harus mengandung karakter khusus');

// Date validation
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid (YYYY-MM-DD)');
export const dateOptionalSchema = dateSchema.optional().or(z.literal(''));

// Number validation
export const positiveIntegerSchema = z.number().int().positive('Harus bilangan positif');
export const nonNegativeIntegerSchema = z.number().int().min(0, 'Tidak boleh negatif');

// File validation
export const fileSizeSchema = (maxSizeMB: number) => 
  z.instanceof(File).refine(
    (file) => file.size <= maxSizeMB * 1024 * 1024,
    `Ukuran file maksimal ${maxSizeMB}MB`
  );

export const fileTypeSchema = (allowedTypes: string[]) =>
  z.instanceof(File).refine(
    (file) => allowedTypes.includes(file.type),
    `Tipe file tidak diizinkan. Hanya ${allowedTypes.join(', ')} yang diperbolehkan`
  );

// Service validation schemas
export const serviceTitleSchema = z.string().min(5, 'Judul minimal 5 karakter').max(500, 'Judul terlalu panjang');
export const serviceDescriptionSchema = z.string().max(5000, 'Deskripsi terlalu panjang').optional().or(z.literal(''));

// Consultation validation schemas
export const consultationSubjectSchema = z.string().min(5, 'Subjek minimal 5 karakter').max(500, 'Subjek terlalu panjang');
export const consultationDescriptionSchema = z.string().min(10, 'Deskripsi minimal 10 karakter').max(5000, 'Deskripsi terlalu panjang');

// Profile validation schemas
export const profileSchema = z.object({
  name: nameSchema,
  nip: nipSchema,
  phone: phoneSchema,
  work_unit_id: z.number().int().positive('Unit kerja harus dipilih').optional().nullable(),
});

// Registration validation schema
export const registrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  nip: nipSchema,
  phone: phoneSchema,
  work_unit_id: z.number().int().positive().optional().nullable(),
  jabatan: z.string().max(255).optional().nullable(),
  pangkat_golongan: z.string().max(100).optional().nullable(),
  tmt_pns: dateOptionalSchema,
  tmt_pensiun: dateOptionalSchema,
  kriteria_asn: z.string().max(50).optional().nullable(),
});

// Login validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password harus diisi'),
});

// Leave application validation
export const leaveApplicationSchema = z.object({
  leave_type: z.enum(['tahunan', 'sakit', 'melahirkan', 'alasan_penting', 'besar', 'bersama', 'di_luar_tanggungan_negara']),
  start_date: dateSchema,
  end_date: dateSchema,
  reason: z.string().min(10, 'Alasan minimal 10 karakter').max(1000, 'Alasan terlalu panjang'),
  substitute_employee: z.string().max(255).optional().or(z.literal('')),
  emergency_contact: z.string().max(255).optional().or(z.literal('')),
  document_links: z.array(urlSchema).optional().default([]),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  {
    message: 'Tanggal selesai harus setelah tanggal mulai',
    path: ['end_date'],
  }
);

// Export types
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type LeaveApplicationFormData = z.infer<typeof leaveApplicationSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;

