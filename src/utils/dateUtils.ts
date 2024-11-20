import { DateRange } from '../types/dashboard';

export const getDefaultDateRange = (): DateRange => {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  const compareEnd = new Date(start);
  const compareStart = new Date(start);
  compareStart.setDate(compareStart.getDate() - 1);

  return {
    start,
    end,
    compareStart,
    compareEnd,
    comparison: false
  };
};