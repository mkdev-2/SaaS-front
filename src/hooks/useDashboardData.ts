import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../lib/socket';
import { DateRange } from '../types/dashboard';
import { getDefaultDateRange } from '../utils/dateUtils';

const DEFAULT_DATA = {
  currentStats: {
    totalLeads: 0,
    totalVendas: 0,
    valorTotal: "R$ 0,00",
    ticketMedio: "R$ 0,00",
    taxaConversao: "0%",
    vendedores: {},
    leads: []
  },
  comparisonStats: null,
  kommo: {
    isConnected: false,
    accountDomain: "",
    connectedAt: ""
  }
};

export function useDashboardData() {
  const [data, setData] = useState<any>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  const dataRef = useRef(data);
  const isMounted = useRef(true);
  const lastUpdateRef = useRef<number>(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const handleDashboardUpdate = useCallback((update: any) => {
    if (!isMounted.current) return;
    
    if (update.status === 'success') {
      const now = Date.now();
      // Prevent updates too close together (within 1 second)
      if (now - lastUpdateRef.current < 1000) {
        return;
      }
      lastUpdateRef.current = now;

      // Merge with default data to ensure all properties exist
      setData({
        ...DEFAULT_DATA,
        ...update.data
      });
      setError(null);
    } else {
      setError(update.message || 'Failed to update dashboard data');
      setData(DEFAULT_DATA);
    }
    setLoading(false);
  }, []);

  const handleConnectionChange = useCallback((status: boolean) => {
    if (!isMounted.current) return;
    setIsConnected(status);
    if (status) {
      setError(null);
      // Delay the initial data request slightly to ensure connection is stable
      updateTimeoutRef.current = setTimeout(() => {
        socketService.requestData();
      }, 100);
    }
  }, []);

  // Setup socket connection and subscriptions
  useEffect(() => {
    socketService.connect();
    
    // Update subscription with current date range
    socketService.updateSubscription({ 
      dateRange,
      detailed: true 
    });

    // Setup event listeners
    const unsubscribeConnection = socketService.onConnectionChange(handleConnectionChange);
    const unsubscribeDashboard = socketService.onDashboardUpdate(handleDashboardUpdate);

    // Request initial data
    socketService.requestData();

    // Cleanup subscriptions
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      unsubscribeConnection();
      unsubscribeDashboard();
    };
  }, [dateRange, handleConnectionChange, handleDashboardUpdate]);

  const refresh = useCallback(() => {
    const now = Date.now();
    // Prevent manual refresh too close to last update
    if (now - lastUpdateRef.current >= 1000) {
      lastUpdateRef.current = now;
      socketService.requestData();
    }
  }, []);

  const handleDateRangeChange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
    setLoading(true); // Show loading state while fetching new data
    
    // Update subscription and request new data
    socketService.updateSubscription({ 
      dateRange: newRange,
      detailed: true 
    });
    
    // Immediate data request
    socketService.requestData();
  }, []);

  return {
    data: data || DEFAULT_DATA,
    loading,
    error,
    isConnected,
    dateRange,
    setDateRange: handleDateRangeChange,
    refresh
  };
}