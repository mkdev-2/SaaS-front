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

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleDashboardUpdate = useCallback((update: any) => {
    if (!isMounted.current) return;
    
    if (update.status === 'success' && update.data) {
      const now = Date.now();
      // Prevent updates too close together (within 1 second)
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

  // Setup socket connection and subscriptions
  useEffect(() => {
    socketService.connect();
    
    // Update subscription with current date range
    socketService.updateSubscription({ dateRange });

    // Setup event listeners
    const unsubscribeConnection = socketService.onConnectionChange(handleConnectionChange);
    const unsubscribeDashboard = socketService.onDashboardUpdate(handleDashboardUpdate);

    // Request initial data
    socketService.requestData();

    return () => {
      unsubscribeConnection();
      unsubscribeDashboard();
    };
  }, [dateRange, handleConnectionChange, handleDashboardUpdate]);

  const refresh = useCallback(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current >= 1000) {
      lastUpdateRef.current = now;
      socketService.requestData();
    }
  }, []);

  const handleDateRangeChange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
    setLoading(true);
    
    // Update subscription and request new data
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