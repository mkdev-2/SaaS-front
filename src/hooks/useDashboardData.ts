import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../lib/socket';
import { DashboardData, DateRange } from '../types/dashboard';

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

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  const dataRef = useRef(data);
  const isMounted = useRef(true);
  const initialLoadRef = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const handleConnectionChange = (status: boolean) => {
      if (!isMounted.current) return;
      setIsConnected(status);
      if (status) {
        setError(null);
        socketService.requestData();
      }
    };

    const handleDashboardUpdate = (update: any) => {
      if (!isMounted.current) return;
      
      if (update.status === 'success' && update.data) {
        setData(update.data);
        setError(null);
        initialLoadRef.current = true;
      } else {
        setError(update.message || 'Failed to update dashboard data');
      }
      setLoading(false);
    };

    socketService.connect();
    socketService.updateSubscription({ dateRange });

    const unsubscribeConnection = socketService.onConnectionChange(handleConnectionChange);
    const unsubscribeDashboard = socketService.onDashboardUpdate(handleDashboardUpdate);

    return () => {
      isMounted.current = false;
      unsubscribeConnection();
      unsubscribeDashboard();
    };
  }, [dateRange]);

  const refresh = useCallback(() => {
    socketService.requestData();
  }, []);

  const handleDateRangeChange = useCallback((newRange: DateRange) => {
    try {
      // Ensure all dates are valid
      const validatedRange = {
        start: new Date(newRange.start),
        end: new Date(newRange.end),
        compareStart: new Date(newRange.compareStart),
        compareEnd: new Date(newRange.compareEnd),
        comparison: newRange.comparison
      };

      // Validate that all dates are valid
      if (
        isNaN(validatedRange.start.getTime()) ||
        isNaN(validatedRange.end.getTime()) ||
        isNaN(validatedRange.compareStart.getTime()) ||
        isNaN(validatedRange.compareEnd.getTime())
      ) {
        throw new Error('Invalid date format');
      }

      // Ensure start date is at beginning of day and end date is at end of day
      validatedRange.start.setHours(0, 0, 0, 0);
      validatedRange.end.setHours(23, 59, 59, 999);
      validatedRange.compareStart.setHours(0, 0, 0, 0);
      validatedRange.compareEnd.setHours(23, 59, 59, 999);

      setDateRange(validatedRange);
      socketService.updateSubscription({ dateRange: validatedRange });
    } catch (err) {
      console.error('Error validating date range:', err);
      // Reset to default range if there's an error
      const defaultRange = getDefaultDateRange();
      setDateRange(defaultRange);
      socketService.updateSubscription({ dateRange: defaultRange });
    }
  }, []);

  return {
    data: data || dataRef.current,
    loading,
    error,
    isConnected,
    dateRange,
    setDateRange: handleDateRangeChange,
    refresh
  };
}