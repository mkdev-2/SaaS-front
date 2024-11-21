import { DateRange } from '../types/dashboard';

export const getDefaultDateRange = (): DateRange => {
  const now = new Date();
  
  // Start of today
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  
  // End of today
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  // Previous day for comparison
  const compareEnd = new Date(start);
  compareEnd.setDate(compareEnd.getDate() - 1);
  compareEnd.setHours(23, 59, 59, 999);
  
  const compareStart = new Date(compareEnd);
  compareStart.setHours(0, 0, 0, 0);

  return {
    start,
    end,
    compareStart,
    compareEnd,
    comparison: false
  };
};

export const ensureDateObjects = (dateRange: DateRange | null): DateRange => {
  if (!dateRange) return getDefaultDateRange();

  try {
    return {
      start: new Date(dateRange.start),
      end: new Date(dateRange.end),
      compareStart: new Date(dateRange.compareStart),
      compareEnd: new Date(dateRange.compareEnd),
      comparison: Boolean(dateRange.comparison)
    };
  } catch (error) {
    console.error('Error parsing dates:', error);
    return getDefaultDateRange();
  }
};

export const formatDateForAPI = (date: Date): string => {
  return date.toISOString();
};

export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};