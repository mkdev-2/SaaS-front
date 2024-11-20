import { DateRange } from '../types/dashboard';

export const getDefaultDateRange = (): DateRange => {
  // Always use current date/time when called
  const now = new Date();
  
  // Start of today
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  
  // End of today
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  // Previous day for comparison
  const compareEnd = new Date(start);
  const compareStart = new Date(start);
  compareStart.setDate(compareStart.getDate() - 1);
  compareStart.setHours(0, 0, 0, 0);
  compareEnd.setHours(23, 59, 59, 999);

  return {
    start,
    end,
    compareStart,
    compareEnd,
    comparison: false
  };
};

export const formatDateForAPI = (date: Date): string => {
  return date.toISOString();
};

export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};