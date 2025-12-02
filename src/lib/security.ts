/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Sanitize text input to prevent XSS
 * Escapes HTML special characters
 */
export function sanitizeText(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Validate and sanitize URL to prevent XSS and open redirect attacks
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http, https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    // Prevent javascript: and data: URLs
    if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate file MIME type against allowed types
 */
export function validateMimeType(
  file: File,
  allowedTypes: string[]
): boolean {
  // Check file.type first (can be spoofed)
  const typeMatch = allowedTypes.some(
    (type) => file.type === type || file.type.startsWith(type.split('/')[0] + '/')
  );

  if (!typeMatch) {
    return false;
  }

  // Additional validation: check file extension as secondary check
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = allowedTypes
    .map((type) => {
      if (type === 'application/pdf') return 'pdf';
      if (type.startsWith('image/')) {
        const imgType = type.split('/')[1];
        return imgType === 'jpeg' ? 'jpg' : imgType;
      }
      return null;
    })
    .filter(Boolean);

  if (extension && allowedExtensions.includes(extension)) {
    return true;
  }

  return typeMatch;
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}

/**
 * Validate file name to prevent path traversal and other attacks
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators and dangerous characters
  return fileName
    .replace(/[\/\\?%*:|"<>]/g, '_')
    .replace(/\.\./g, '_')
    .substring(0, 255); // Limit length
}

/**
 * Rate limiting helper (client-side, should be backed by server-side)
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Obfuscate sensitive error messages in production
 */
export function sanitizeError(error: any, isDevelopment: boolean = false): string {
  if (isDevelopment || process.env.NODE_ENV === 'development') {
    return error?.message || String(error);
  }

  // Generic error messages for production
  if (error?.message?.includes('password') || error?.message?.includes('auth')) {
    return 'Email atau password tidak valid';
  }

  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return 'Terjadi masalah koneksi. Silakan coba lagi.';
  }

  if (error?.message?.includes('permission') || error?.message?.includes('unauthorized')) {
    return 'Anda tidak memiliki izin untuk melakukan tindakan ini';
  }

  return 'Terjadi kesalahan. Silakan coba lagi atau hubungi administrator.';
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password minimal 8 karakter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung huruf besar');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung huruf kecil');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password harus mengandung angka');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password harus mengandung karakter khusus');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

