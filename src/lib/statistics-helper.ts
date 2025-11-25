import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from "date-fns";
import { id as localeId } from "date-fns/locale";

/**
 * Statistics and analytics helper functions
 */

/**
 * Generate chart data for last N days
 */
export const generateDailyTrend = (
  data: any[],
  days: number = 7,
  dateField: string = "created_at",
  valueField?: string
) => {
  const today = new Date();
  const startDate = subDays(today, days - 1);

  const daysArray = eachDayOfInterval({ start: startDate, end: today });

  return daysArray.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayData = data.filter((item) => {
      const itemDate = format(new Date(item[dateField]), "yyyy-MM-dd");
      return itemDate === dayStr;
    });

    return {
      name: format(day, "dd MMM", { locale: localeId }),
      date: dayStr,
      value: valueField ? dayData.reduce((sum, item) => sum + (item[valueField] || 0), 0) : dayData.length,
      count: dayData.length,
    };
  });
};

/**
 * Generate chart data for last N months
 */
export const generateMonthlyTrend = (
  data: any[],
  months: number = 6,
  dateField: string = "created_at",
  valueField?: string
) => {
  const today = new Date();
  const startDate = subMonths(today, months - 1);

  const monthsArray = eachMonthOfInterval({ start: startDate, end: today });

  return monthsArray.map((month) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    const monthData = data.filter((item) => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= start && itemDate <= end;
    });

    return {
      name: format(month, "MMM yyyy", { locale: localeId }),
      month: format(month, "yyyy-MM"),
      value: valueField ? monthData.reduce((sum, item) => sum + (item[valueField] || 0), 0) : monthData.length,
      count: monthData.length,
    };
  });
};

/**
 * Calculate status distribution
 */
export const calculateStatusDistribution = (
  data: any[],
  statusField: string = "status",
  statusLabels?: Record<string, string>
) => {
  const statusCounts: Record<string, number> = {};

  data.forEach((item) => {
    const status = item[statusField] || "unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([status, count]) => ({
    name: statusLabels?.[status] || status,
    value: count,
    status, // Keep original status for reference
  }));
};

/**
 * Calculate category distribution
 */
export const calculateCategoryDistribution = (
  data: any[],
  categoryField: string,
  categoryLabels?: Record<string, string>
) => {
  const categoryCounts: Record<string, number> = {};

  data.forEach((item) => {
    const category = item[categoryField] || "unknown";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  return Object.entries(categoryCounts)
    .map(([category, count]) => ({
      name: categoryLabels?.[category] || category,
      value: count,
      category, // Keep original category for reference
    }))
    .sort((a, b) => b.value - a.value); // Sort by count descending
};

/**
 * Calculate growth rate compared to previous period
 */
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Get statistics for current and previous period
 */
export const getPeriodicStatistics = (
  data: any[],
  dateField: string = "created_at",
  periodDays: number = 30
) => {
  const now = new Date();
  const periodStart = subDays(now, periodDays);
  const previousPeriodStart = subDays(periodStart, periodDays);

  const currentPeriodData = data.filter((item) => {
    const date = new Date(item[dateField]);
    return date >= periodStart && date <= now;
  });

  const previousPeriodData = data.filter((item) => {
    const date = new Date(item[dateField]);
    return date >= previousPeriodStart && date < periodStart;
  });

  const currentCount = currentPeriodData.length;
  const previousCount = previousPeriodData.length;
  const growthRate = calculateGrowthRate(currentCount, previousCount);

  return {
    current: currentCount,
    previous: previousCount,
    growthRate,
    isGrowth: growthRate >= 0,
    currentData: currentPeriodData,
    previousData: previousPeriodData,
  };
};

/**
 * Calculate average processing time (in days)
 */
export const calculateAverageProcessingTime = (
  data: any[],
  startDateField: string = "created_at",
  endDateField: string = "updated_at"
) => {
  if (data.length === 0) return 0;

  const totalDays = data.reduce((sum, item) => {
    const start = new Date(item[startDateField]);
    const end = item[endDateField] ? new Date(item[endDateField]) : new Date();
    const diffDays = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return sum + diffDays;
  }, 0);

  return Math.round(totalDays / data.length);
};

/**
 * Get top N items by count
 */
export const getTopItems = <T extends Record<string, any>>(
  data: T[],
  groupByField: string,
  topN: number = 5
) => {
  const counts: Record<string, number> = {};

  data.forEach((item) => {
    const key = item[groupByField] || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
};

/**
 * Calculate completion rate (approved / total)
 */
export const calculateCompletionRate = (
  data: any[],
  statusField: string = "status",
  completedStatuses: string[] = ["approved_final"]
): number => {
  if (data.length === 0) return 0;

  const completedCount = data.filter((item) =>
    completedStatuses.includes(item[statusField])
  ).length;

  return Math.round((completedCount / data.length) * 100);
};

/**
 * Compare two datasets by status
 */
export const compareByStatus = (
  dataA: any[],
  dataB: any[],
  statusField: string = "status",
  labelA: string = "A",
  labelB: string = "B"
) => {
  const statusesA = calculateStatusDistribution(dataA, statusField);
  const statusesB = calculateStatusDistribution(dataB, statusField);

  // Combine unique statuses
  const allStatuses = Array.from(
    new Set([...statusesA.map((s) => s.status), ...statusesB.map((s) => s.status)])
  );

  return allStatuses.map((status) => {
    const statusA = statusesA.find((s) => s.status === status);
    const statusB = statusesB.find((s) => s.status === status);

    return {
      name: statusA?.name || statusB?.name || status,
      [labelA]: statusA?.value || 0,
      [labelB]: statusB?.value || 0,
    };
  });
};

/**
 * Generate heatmap data for activity (day of week vs hour)
 */
export const generateActivityHeatmap = (
  data: any[],
  dateField: string = "created_at"
) => {
  const heatmapData: Record<string, Record<string, number>> = {};

  // Initialize structure
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  days.forEach((day) => {
    heatmapData[day] = {};
    for (let hour = 0; hour < 24; hour++) {
      heatmapData[day][hour] = 0;
    }
  });

  // Count activities
  data.forEach((item) => {
    const date = new Date(item[dateField]);
    const day = days[date.getDay()];
    const hour = date.getHours();
    heatmapData[day][hour]++;
  });

  return heatmapData;
};
