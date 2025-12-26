/**
 * Holiday Utilities
 * Functions to check holidays and calculate working days for leave calculations
 */

import { supabase } from "@/integrations/supabase/client";
import { isWeekend, eachDayOfInterval, format } from "date-fns";

export interface Holiday {
  id: string;
  date: string;
  name: string;
  description?: string;
  is_recurring: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Check if a specific date is a weekend (Saturday or Sunday)
 */
export const isWeekendDay = (date: Date): boolean => {
  return isWeekend(date);
};

/**
 * Fetch all holidays for a given year
 */
export const getHolidaysForYear = async (year: number): Promise<Holiday[]> => {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } = await supabase
    .from("holidays")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching holidays:", error);
    return [];
  }

  return (data as Holiday[]) || [];
};

/**
 * Fetch holidays within a date range
 */
export const getHolidaysInRange = async (startDate: Date, endDate: Date): Promise<Holiday[]> => {
  const { data, error } = await supabase
    .from("holidays")
    .select("*")
    .gte("date", format(startDate, "yyyy-MM-dd"))
    .lte("date", format(endDate, "yyyy-MM-dd"))
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching holidays:", error);
    return [];
  }

  return (data as Holiday[]) || [];
};

/**
 * Check if a specific date is a holiday (national holiday from database)
 */
export const isHoliday = async (date: Date): Promise<boolean> => {
  const dateStr = format(date, "yyyy-MM-dd");
  
  const { data, error } = await supabase
    .from("holidays")
    .select("id")
    .eq("date", dateStr)
    .maybeSingle();

  if (error) {
    console.error("Error checking holiday:", error);
    return false;
  }

  return data !== null;
};

/**
 * Check if a date is a non-working day (weekend OR national holiday)
 */
export const isNonWorkingDay = async (date: Date): Promise<boolean> => {
  // Check if weekend first (no DB call needed)
  if (isWeekendDay(date)) {
    return true;
  }

  // Check if national holiday
  return await isHoliday(date);
};

/**
 * Calculate the number of working days between two dates (inclusive)
 * Excludes weekends and national holidays
 */
export const calculateWorkingDays = async (startDate: Date, endDate: Date): Promise<number> => {
  // Get all days in the range
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Fetch holidays for this range once
  const holidays = await getHolidaysInRange(startDate, endDate);
  const holidayDates = new Set(holidays.map(h => h.date));

  // Count working days
  let workingDays = 0;
  
  for (const day of allDays) {
    const dateStr = format(day, "yyyy-MM-dd");
    
    // Skip weekends
    if (isWeekendDay(day)) {
      continue;
    }
    
    // Skip holidays
    if (holidayDates.has(dateStr)) {
      continue;
    }
    
    workingDays++;
  }

  return workingDays;
};

/**
 * Get detailed breakdown of days in a date range
 */
export const getDaysBreakdown = async (startDate: Date, endDate: Date): Promise<{
  totalDays: number;
  workingDays: number;
  weekendDays: number;
  holidayDays: number;
  holidays: Holiday[];
}> => {
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  const holidays = await getHolidaysInRange(startDate, endDate);
  const holidayDates = new Set(holidays.map(h => h.date));

  let weekendDays = 0;
  let holidayDays = 0;
  let workingDays = 0;

  for (const day of allDays) {
    const dateStr = format(day, "yyyy-MM-dd");
    
    if (isWeekendDay(day)) {
      weekendDays++;
      // Don't count weekends as holiday days even if they're also holidays
      continue;
    }
    
    if (holidayDates.has(dateStr)) {
      holidayDays++;
      continue;
    }
    
    workingDays++;
  }

  return {
    totalDays: allDays.length,
    workingDays,
    weekendDays,
    holidayDays,
    holidays: holidays.filter(h => !isWeekendDay(new Date(h.date)))
  };
};

/**
 * Create a new holiday
 */
export const createHoliday = async (
  date: Date,
  name: string,
  description: string | null,
  isRecurring: boolean,
  createdBy: string
): Promise<{ data: Holiday | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from("holidays")
    .insert({
      date: format(date, "yyyy-MM-dd"),
      name,
      description,
      is_recurring: isRecurring,
      created_by: createdBy
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as Holiday, error: null };
};

/**
 * Update a holiday
 */
export const updateHoliday = async (
  id: string,
  updates: Partial<Pick<Holiday, 'date' | 'name' | 'description' | 'is_recurring'>>
): Promise<{ data: Holiday | null; error: Error | null }> => {
  const updateData: any = { ...updates };
  if (updates.date) {
    updateData.date = typeof updates.date === 'string' 
      ? updates.date 
      : format(updates.date as unknown as Date, "yyyy-MM-dd");
  }

  const { data, error } = await supabase
    .from("holidays")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as Holiday, error: null };
};

/**
 * Delete a holiday
 */
export const deleteHoliday = async (id: string): Promise<{ error: Error | null }> => {
  const { error } = await supabase
    .from("holidays")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
};
