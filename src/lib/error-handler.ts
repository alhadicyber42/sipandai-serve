/**
 * Centralized error handling utility
 * Provides safe error messages to users while logging full details for debugging
 */

// Error code to safe message mapping
const ERROR_MESSAGES: Record<string, string> = {
  // PostgreSQL error codes
  '23505': 'Data sudah ada dalam sistem',
  '23503': 'Data terkait tidak ditemukan',
  '23502': 'Data wajib tidak boleh kosong',
  '23514': 'Data tidak memenuhi ketentuan',
  '42501': 'Anda tidak memiliki akses untuk operasi ini',
  '42P01': 'Operasi tidak dapat diproses',
  '22P02': 'Format data tidak valid',
  
  // Supabase/PostgREST error codes
  'PGRST': 'Operasi tidak diizinkan',
  'PGRST301': 'Data tidak ditemukan',
  'PGRST204': 'Tidak ada data yang dikembalikan',
  
  // Supabase Auth errors
  'invalid_credentials': 'Email atau password salah',
  'email_exists': 'Email sudah terdaftar',
  'weak_password': 'Password terlalu lemah',
  'user_not_found': 'Pengguna tidak ditemukan',
  'invalid_email': 'Format email tidak valid',
  'email_not_confirmed': 'Email belum dikonfirmasi',
  'signup_disabled': 'Pendaftaran tidak tersedia',
  'too_many_requests': 'Terlalu banyak percobaan, coba lagi nanti',
  
  // Storage errors
  'storage_error': 'Gagal mengakses penyimpanan file',
  'file_too_large': 'Ukuran file terlalu besar',
  'invalid_file_type': 'Tipe file tidak didukung',
};

// Error patterns to match against
const ERROR_PATTERNS: Array<{ pattern: RegExp | string; message: string }> = [
  { pattern: 'row-level security', message: 'Anda tidak memiliki izin untuk data ini' },
  { pattern: 'violates row-level', message: 'Akses ditolak' },
  { pattern: 'foreign key constraint', message: 'Data terkait tidak ditemukan' },
  { pattern: 'unique constraint', message: 'Data sudah ada dalam sistem' },
  { pattern: 'not null constraint', message: 'Data wajib tidak boleh kosong' },
  { pattern: 'JWT expired', message: 'Sesi Anda telah berakhir, silakan login kembali' },
  { pattern: 'invalid JWT', message: 'Sesi tidak valid, silakan login kembali' },
  { pattern: 'network', message: 'Koneksi bermasalah, periksa internet Anda' },
  { pattern: 'timeout', message: 'Koneksi timeout, coba lagi' },
  { pattern: 'Failed to fetch', message: 'Tidak dapat terhubung ke server' },
  { pattern: 'NetworkError', message: 'Koneksi jaringan bermasalah' },
];

interface DatabaseError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  name?: string;
}

/**
 * Get a safe, user-friendly error message from any error
 * Logs full error details to console for debugging
 */
export function getSafeErrorMessage(error: unknown, fallback: string = 'Terjadi kesalahan'): string {
  // Log full error for debugging (only in development)
  if (typeof error === 'object' && error !== null) {
    console.error('Error details:', {
      message: (error as DatabaseError).message,
      code: (error as DatabaseError).code,
      details: (error as DatabaseError).details,
      hint: (error as DatabaseError).hint,
      name: (error as DatabaseError).name,
    });
  } else {
    console.error('Error:', error);
  }

  // Handle null/undefined
  if (!error) {
    return fallback;
  }

  // Extract error details
  const errorObj = error as DatabaseError;
  const errorMessage = errorObj.message || (typeof error === 'string' ? error : '');
  const errorCode = errorObj.code || '';

  // Check for exact code match
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }

  // Check for pattern matches in error message
  const lowerMessage = errorMessage.toLowerCase();
  for (const { pattern, message } of ERROR_PATTERNS) {
    if (typeof pattern === 'string') {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        return message;
      }
    } else if (pattern.test(lowerMessage)) {
      return message;
    }
  }

  // Check if error message contains any known error code
  for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
    if (lowerMessage.includes(code.toLowerCase())) {
      return message;
    }
  }

  // Return fallback for unknown errors
  return fallback;
}

/**
 * Get categorized error type for styling/icons
 */
export type ErrorCategory = 'permission' | 'validation' | 'network' | 'auth' | 'unknown';

export function getErrorCategory(error: unknown): ErrorCategory {
  if (!error) return 'unknown';

  const errorObj = error as DatabaseError;
  const errorMessage = errorObj.message || (typeof error === 'string' ? error : '');
  const errorCode = errorObj.code || '';
  const lowerMessage = errorMessage.toLowerCase();

  // Permission errors
  if (
    errorCode === '42501' ||
    lowerMessage.includes('row-level security') ||
    lowerMessage.includes('permission') ||
    lowerMessage.includes('access denied')
  ) {
    return 'permission';
  }

  // Validation errors
  if (
    ['23505', '23503', '23502', '23514', '22P02'].includes(errorCode) ||
    lowerMessage.includes('constraint') ||
    lowerMessage.includes('validation')
  ) {
    return 'validation';
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection')
  ) {
    return 'network';
  }

  // Auth errors
  if (
    lowerMessage.includes('jwt') ||
    lowerMessage.includes('auth') ||
    lowerMessage.includes('login') ||
    lowerMessage.includes('credential') ||
    lowerMessage.includes('session')
  ) {
    return 'auth';
  }

  return 'unknown';
}

/**
 * Check if error is a network/connection error
 */
export function isNetworkError(error: unknown): boolean {
  return getErrorCategory(error) === 'network';
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  return getErrorCategory(error) === 'auth';
}

/**
 * Check if error indicates user should retry
 */
export function isRetryableError(error: unknown): boolean {
  const category = getErrorCategory(error);
  return category === 'network';
}
