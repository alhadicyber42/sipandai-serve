# Security Documentation - SIPANDAI

## Overview
Dokumen ini menjelaskan implementasi keamanan yang telah diterapkan pada aplikasi SIPANDAI untuk memastikan standar keamanan profesional dan kelas atas.

## Security Measures Implemented

### 1. Content Security Policy (CSP)
- **Location**: `index.html`
- **Implementation**: Meta tag dengan CSP yang membatasi sumber daya yang dapat dimuat
- **Protection**: Mencegah XSS attacks, data injection, dan unauthorized resource loading
- **Policy**: 
  - `default-src 'self'`: Hanya izinkan resource dari domain sendiri
  - `script-src`: Membatasi eksekusi JavaScript
  - `style-src 'unsafe-inline'`: Diperlukan untuk Tailwind CSS
  - `connect-src`: Membatasi koneksi API ke Supabase saja

### 2. Security Headers
- **X-Content-Type-Options: nosniff**: Mencegah MIME type sniffing
- **X-Frame-Options: DENY**: Mencegah clickjacking attacks
- **X-XSS-Protection: 1; mode=block**: Mengaktifkan XSS filter browser
- **Referrer-Policy: strict-origin-when-cross-origin**: Mengontrol informasi referrer
- **Permissions-Policy**: Menonaktifkan fitur yang tidak diperlukan (geolocation, microphone, camera)

### 3. Input Validation & Sanitization
- **Location**: `src/lib/security.ts`
- **Functions**:
  - `sanitizeHtml()`: Menghapus HTML tags berbahaya
  - `sanitizeText()`: Escape HTML special characters
  - `sanitizeUrl()`: Validasi dan sanitasi URL
  - `sanitizeFileName()`: Mencegah path traversal attacks
  - `validateEmail()`: Validasi format email
  - `validatePasswordStrength()`: Validasi kekuatan password

### 4. XSS Protection
- **TemplatePreview.tsx**: 
  - Mengganti `document.write` dengan metode yang lebih aman
  - Sanitasi konten sebelum ditampilkan
  - Menambahkan CSP pada print window
- **chart.tsx**: 
  - Sanitasi CSS values sebelum menggunakan `dangerouslySetInnerHTML`
  - Validasi color values untuk mencegah CSS injection

### 5. File Upload Security
- **Location**: `src/components/forms/FileUpload.tsx`
- **Validations**:
  - MIME type validation (whitelist approach)
  - File extension validation
  - File size limits (5MB default)
  - File name sanitization (mencegah path traversal)
  - Empty file detection
- **Allowed Types**: PDF, JPEG, PNG, WebP only

### 6. Authentication Security
- **Location**: `src/contexts/AuthContext.tsx`
- **Measures**:
  - Email sanitization dan validation
  - Password strength validation
  - Generic error messages (mencegah user enumeration)
  - Input length limits
  - Input sanitization sebelum dikirim ke backend

### 7. Error Handling
- **Location**: `src/lib/security.ts` - `sanitizeError()`
- **Implementation**:
  - Error messages berbeda untuk development vs production
  - Tidak expose sensitive information (database errors, stack traces)
  - Generic error messages untuk user
  - Detailed errors hanya di development mode

### 8. Database Security (Backend)
- **Row Level Security (RLS)**: Semua tabel memiliki RLS policies
- **Role-based Access Control**: User roles dikelola di tabel terpisah
- **Security Definer Functions**: Helper functions untuk check roles
- **Storage Policies**: File uploads dibatasi berdasarkan user dan role

### 9. API Security
- **Supabase Client**: 
  - Menggunakan environment variables untuk credentials
  - Auto token refresh
  - Session persistence dengan localStorage (secure)
- **Input Validation**: Semua input divalidasi sebelum dikirim ke API
- **Type Safety**: TypeScript untuk mencegah type-related vulnerabilities

### 10. Rate Limiting (Client-side)
- **Location**: `src/lib/security.ts` - `RateLimiter` class
- **Purpose**: Mencegah brute force attacks (harus didukung server-side)
- **Default**: 5 attempts per 15 minutes

## Security Best Practices

### Development
1. **Never commit secrets**: Environment variables tidak di-commit
2. **Use TypeScript**: Type safety mencegah banyak bugs
3. **Validate all inputs**: Client-side dan server-side validation
4. **Sanitize outputs**: Semua user-generated content di-sanitize
5. **Error handling**: Jangan expose sensitive info

### Production
1. **HTTPS only**: Semua komunikasi harus melalui HTTPS
2. **Environment variables**: Semua secrets di environment variables
3. **Regular updates**: Update dependencies secara berkala
4. **Monitoring**: Monitor error logs untuk suspicious activities
5. **Backup**: Regular database backups

## Security Checklist

### ✅ Implemented
- [x] Content Security Policy (CSP)
- [x] Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- [x] Input validation & sanitization
- [x] XSS protection
- [x] File upload security
- [x] Authentication security
- [x] Error handling (no sensitive info exposure)
- [x] Database RLS policies
- [x] Role-based access control
- [x] Type safety (TypeScript)

### ⚠️ Recommended (Server-side)
- [ ] Server-side rate limiting
- [ ] CSRF tokens
- [ ] Session management improvements
- [ ] Audit logging
- [ ] Intrusion detection
- [ ] Regular security audits
- [ ] Penetration testing

## Known Limitations

1. **Client-side rate limiting**: Hanya efektif untuk user yang kooperatif. Server-side rate limiting diperlukan.
2. **CSP 'unsafe-inline'**: Diperlukan untuk Tailwind CSS. Consider using nonce-based CSP.
3. **LocalStorage**: Session tokens disimpan di localStorage. Consider httpOnly cookies untuk production.

## Reporting Security Issues

Jika Anda menemukan vulnerability keamanan, silakan:
1. Jangan buat public issue
2. Hubungi administrator sistem
3. Berikan detail lengkap tentang vulnerability
4. Tunggu konfirmasi sebelum mempublikasikan

## References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)

