/**
 * Input mask utilities for formatted fields
 */

/**
 * Format NIP (Nomor Induk Pegawai)
 * Format: 19XXXXXXXXXXXXXX (18 digits)
 */
export function formatNIP(value: string): string {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Limit to 18 digits
    const limited = digits.slice(0, 18);

    // Add spaces for readability: 19 XXXX XXXX XXXX XXX
    if (limited.length <= 2) return limited;
    if (limited.length <= 6) return `${limited.slice(0, 2)} ${limited.slice(2)}`;
    if (limited.length <= 10) return `${limited.slice(0, 2)} ${limited.slice(2, 6)} ${limited.slice(6)}`;
    if (limited.length <= 14) return `${limited.slice(0, 2)} ${limited.slice(2, 6)} ${limited.slice(6, 10)} ${limited.slice(10)}`;
    return `${limited.slice(0, 2)} ${limited.slice(2, 6)} ${limited.slice(6, 10)} ${limited.slice(10, 14)} ${limited.slice(14)}`;
}

/**
 * Format phone number
 * Format: 08XX-XXXX-XXXX or +62-XXX-XXXX-XXXX
 */
export function formatPhoneNumber(value: string): string {
    // Remove all non-digits and +
    const cleaned = value.replace(/[^\d+]/g, "");

    // Handle international format
    if (cleaned.startsWith("+62")) {
        const digits = cleaned.slice(3);
        if (digits.length <= 3) return `+62-${digits}`;
        if (digits.length <= 7) return `+62-${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `+62-${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    }

    // Handle local format
    const digits = cleaned.replace(/\D/g, "");
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
}

/**
 * Format date (DD/MM/YYYY)
 */
export function formatDate(value: string): string {
    const digits = value.replace(/\D/g, "");

    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

/**
 * Format currency (IDR)
 */
export function formatCurrency(value: string | number): string {
    const num = typeof value === "string" ? parseFloat(value.replace(/\D/g, "")) : value;

    if (isNaN(num)) return "Rp 0";

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
}

/**
 * Parse formatted currency back to number
 */
export function parseCurrency(value: string): number {
    const num = parseFloat(value.replace(/\D/g, ""));
    return isNaN(num) ? 0 : num;
}

/**
 * Format percentage
 */
export function formatPercentage(value: string | number): string {
    const num = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(num)) return "0%";

    return `${num.toFixed(2)}%`;
}

/**
 * Validate NIP
 */
export function validateNIP(nip: string): boolean {
    const digits = nip.replace(/\D/g, "");
    return digits.length === 18 && digits.startsWith("19");
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone: string): boolean {
    const digits = phone.replace(/\D/g, "");

    // Indonesian phone numbers: 10-13 digits, starts with 08 or +62
    if (phone.startsWith("+62")) {
        return digits.length >= 11 && digits.length <= 14;
    }

    return digits.length >= 10 && digits.length <= 13 && digits.startsWith("08");
}

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate date (DD/MM/YYYY)
 */
export function validateDate(date: string): boolean {
    const parts = date.split("/");
    if (parts.length !== 3) return false;

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > 2100) return false;

    // Check valid date
    const dateObj = new Date(year, month - 1, day);
    return dateObj.getDate() === day && dateObj.getMonth() === month - 1 && dateObj.getFullYear() === year;
}
