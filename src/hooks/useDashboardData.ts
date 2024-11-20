import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../lib/socket';
import { DashboardData, DateRange } from '../types/dashboard';

export const getDefaultDateRange = (): DateRange => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return {
    start,
    end,
    compareStart: new Date(start.getTime() - (end.getTime() - start.getTime())),
    compareEnd: new Date(start),
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
    const validatedRange = {
      ...newRange,
      start: new Date(newRange.start),
      end: new Date(newRange.end),
      compareStart: new Date(newRange.compareStart),
      compareEnd: new Date(newRange.compareEnd)
    };
    setDateRange(validatedRange);
    socketService.updateSubscription({ dateRange: validatedRange });
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