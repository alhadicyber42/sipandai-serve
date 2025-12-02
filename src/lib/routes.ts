/**
 * Route Constants and Type-Safe Navigation
 * Centralized route definitions untuk type safety dan maintainability
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  PRIVACY: '/privacy',
  AUTH: '/auth',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  
  // Services
  SERVICES: {
    KENAIKAN_PANGKAT: '/layanan/kenaikan-pangkat',
    MUTASI: '/layanan/mutasi',
    PENSIUN: '/layanan/pensiun',
    CUTI: '/layanan/cuti',
  },
  
  // Proposals (aliases)
  PROPOSALS: {
    KENAIKAN_PANGKAT: '/usulan/kenaikan-pangkat',
    MUTASI: '/usulan/mutasi',
    PENSIUN: '/usulan/pensiun',
    CUTI: '/usulan/cuti',
    DISETUJUI: '/usulan/disetujui',
  },
  
  // Consultations
  CONSULTATIONS: {
    NEW: '/konsultasi/baru',
    HISTORY: '/konsultasi/riwayat',
    UNIT_HISTORY: '/konsultasi/riwayat-unit',
    ESCALATED: '/konsultasi/tereskalasi',
    ALL: '/konsultasi/semua',
    INBOX: '/konsultasi/masuk',
    DETAIL: (id: string) => `/konsultasi/${id}`,
  },
  
  // Admin routes
  ADMIN: {
    KELOLA_ADMIN: '/admin/kelola-admin',
    KELOLA_UNIT: '/admin/kelola-unit',
    DAFTAR_PEGAWAI: '/admin/daftar-pegawai',
    FORMASI_JABATAN: '/admin/formasi-jabatan',
    REMINDER_PENSIUN: '/admin/reminder-pensiun',
    EMPLOYEE_RATINGS: '/admin/employee-ratings',
    EMPLOYEE_PROFILE: (employeeId: string) => `/admin/employee/${employeeId}`,
    PENANGGUHAN_CUTI: '/admin/penangguhan-cuti',
    BUAT_SURAT: '/admin/buat-surat',
  },
  
  // Employee features
  EMPLOYEE: {
    OF_THE_MONTH: '/employee-of-the-month',
    RATE: (employeeId: string) => `/employee-of-the-month/rate/${employeeId}`,
  },
  
  // Announcements
  ANNOUNCEMENTS: '/pengumuman',
} as const;

/**
 * Type-safe route parameters
 */
export type RouteParams = {
  consultationId: string;
  employeeId: string;
};

/**
 * Helper function untuk build routes dengan parameters
 */
export function buildRoute(
  route: string | ((...args: any[]) => string),
  ...args: any[]
): string {
  if (typeof route === 'function') {
    return route(...args);
  }
  return route;
}

/**
 * Check if route requires authentication
 */
export function requiresAuth(route: string): boolean {
  const publicRoutes = [
    ROUTES.HOME,
    ROUTES.PRIVACY,
    ROUTES.AUTH,
  ];
  
  return !publicRoutes.includes(route as any);
}

/**
 * Check if route requires specific role
 */
export function requiresRole(route: string): 'admin_pusat' | 'admin_unit' | 'user_unit' | null {
  const adminPusatRoutes = [
    ROUTES.ADMIN.KELOLA_ADMIN,
    ROUTES.ADMIN.KELOLA_UNIT,
    ROUTES.ADMIN.DAFTAR_PEGAWAI,
    ROUTES.ADMIN.FORMASI_JABATAN,
    ROUTES.ADMIN.REMINDER_PENSIUN,
    ROUTES.ADMIN.EMPLOYEE_RATINGS,
    ROUTES.ADMIN.PENANGGUHAN_CUTI,
    ROUTES.ADMIN.BUAT_SURAT,
    ROUTES.CONSULTATIONS.ESCALATED,
    ROUTES.CONSULTATIONS.ALL,
  ];
  
  const adminUnitRoutes = [
    ROUTES.CONSULTATIONS.INBOX,
    ROUTES.CONSULTATIONS.UNIT_HISTORY,
    ROUTES.PROPOSALS.DISETUJUI,
  ];
  
  if (adminPusatRoutes.some(r => route.startsWith(r))) {
    return 'admin_pusat';
  }
  
  if (adminUnitRoutes.some(r => route.startsWith(r))) {
    return 'admin_unit';
  }
  
  return null;
}

