import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../lib/socket';
import { DateRange } from '../types/dashboard';
import { getDefaultDateRange } from '../utils/dateUtils';

export function useDashboardData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  const dataRef = useRef(data);
  const isMounted = useRef(true);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleDashboardUpdate = useCallback((update: any) => {
    if (!isMounted.current) return;
    
    if (update.status === 'success' && update.data) {
      const now = Date.now();
      if (now - lastUpdateRef.current < 1000) {
        return;
      }
      lastUpdateRef.current = now;
      setData(update.data);
      setError(null);
    } else {
      setError(update.message || 'Failed to update dashboard data');
    }
    setLoading(false);
  }, []);

  const handleConnectionChange = useCallback((status: boolean) => {
    if (!isMounted.current) return;
    setIsConnected(status);
    if (status) {
      setError(null);
      socketService.requestData();
    }
  }, []);

  useEffect(() => {
    socketService.connect();
    socketService.updateSubscription({ dateRange });

    const unsubscribeConnection = socketService.onConnectionChange(handleConnectionChange);
    const unsubscribeDashboard = socketService.onDashboardUpdate(handleDashboardUpdate);

    socketService.requestData();

    return () => {
      unsubscribeConnection();
      unsubscribeDashboard();
    };
  }, [dateRange, handleConnectionChange, handleDashboardUpdate]);

  const refresh = useCallback(() => {
    if (Date.now() - lastUpdateRef.current >= 1000) {
      lastUpdateRef.current = Date.now();
      socketService.requestData();
    }
  }, []);

  const handleDateRangeChange = useCallback((newRange: DateRange) => {
    setLoading(true);
    setDateRange(newRange);
    socketService.updateSubscription({ dateRange: newRange });
    socketService.requestData();
  }, []);

  return {
    data,
    loading,
    error,
    isConnected,
    dateRange,
    setDateRange: handleDateRangeChange,
    refresh
  };
}