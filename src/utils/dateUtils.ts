import { DateRange } from '../types/dashboard';

export const getDefaultDateRange = (): DateRange => {
  const now = new Date();
  
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

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

export const ensureDateObjects = (dateRange: DateRange | null | undefined): DateRange => {
  if (!dateRange) return getDefaultDateRange();

  try {
    const start = dateRange.start instanceof Date ? dateRange.start : new Date(dateRange.start);
    const end = dateRange.end instanceof Date ? dateRange.end : new Date(dateRange.end);
    const compareStart = dateRange.compareStart instanceof Date ? dateRange.compareStart : new Date(dateRange.compareStart);
    const compareEnd = dateRange.compareEnd instanceof Date ? dateRange.compareEnd : new Date(dateRange.compareEnd);

    if (
      isNaN(start.getTime()) || 
      isNaN(end.getTime()) || 
      isNaN(compareStart.getTime()) || 
      isNaN(compareEnd.getTime())
    ) {
      console.warn('Invalid date detected, using default range');
      return getDefaultDateRange();
    }

    return {
      start,
      end,
      compareStart,
      compareEnd,
      comparison: Boolean(dateRange.comparison)
    };
  } catch (error) {
    console.error('Error parsing dates:', error);
    return getDefaultDateRange();
  }
};

export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};