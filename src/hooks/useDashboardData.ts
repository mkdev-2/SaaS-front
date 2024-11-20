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
      
      if (update.status === 'success') {
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
    };

    socketService.connect();
    socketService.updateSubscription({ 
      dateRange,
      detailed: true 
    });

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
    setDateRange(newRange);
    socketService.updateSubscription({ 
      dateRange: newRange,
      detailed: true 
    });
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
