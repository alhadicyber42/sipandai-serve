/**
 * Date Formatting Utilities
 * Centralized date formatting untuk consistency
 */

import { format, formatDistanceToNow, formatDistance, parseISO, isValid } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format date untuk display
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = 'dd MMMM yyyy'
): string {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '-';
    return format(dateObj, formatStr, { locale: id });
  } catch {
    return '-';
  }
}

/**
 * Format date dengan waktu
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  formatStr: string = 'dd MMMM yyyy, HH:mm'
): string {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '-';
    return format(dateObj, formatStr, { locale: id });
  } catch {
    return '-';
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '-';
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: id });
  } catch {
    return '-';
  }
}

/**
 * Format date range
 */
export function formatDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): string {
  if (!startDate || !endDate) return '-';
  
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    if (!isValid(start) || !isValid(end)) return '-';
    
    // If same month and year, show: "1-15 Januari 2024"
    if (format(start, 'MMMM yyyy') === format(end, 'MMMM yyyy')) {
      return `${format(start, 'd')}-${format(end, 'd MMMM yyyy', { locale: id })}`;
    }
    
    // If same year, show: "1 Januari - 15 Februari 2024"
    if (format(start, 'yyyy') === format(end, 'yyyy')) {
      return `${format(start, 'd MMMM', { locale: id })} - ${format(end, 'd MMMM yyyy', { locale: id })}`;
    }
    
    // Different years, show: "1 Januari 2023 - 15 Februari 2024"
    return `${format(start, 'd MMMM yyyy', { locale: id })} - ${format(end, 'd MMMM yyyy', { locale: id })}`;
  } catch {
    return '-';
  }
}

/**
 * Format untuk input date (YYYY-MM-DD)
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

/**
 * Format untuk display singkat (dd/MM/yyyy)
 */
export function formatDateShort(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd/MM/yyyy');
}

/**
 * Format untuk display panjang (dd MMMM yyyy)
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd MMMM yyyy');
}

/**
 * Calculate age from date
 */
export function calculateAge(birthDate: string | Date | null | undefined): number | null {
  if (!birthDate) return null;
  
  try {
    const birth = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
    if (!isValid(birth)) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    return null;
  }
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return false;
    return dateObj < new Date();
  } catch {
    return false;
  }
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return false;
    return dateObj > new Date();
  } catch {
    return false;
  }
}

