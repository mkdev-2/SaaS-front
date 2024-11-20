import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../lib/socket';
import { DateRange } from '../types/dashboard';
import { getDefaultDateRange } from '../utils/dateUtils';

interface DashboardStats {
  currentStats: {
    totalLeads: number;
    totalVendas: number;
    valorTotal: string;
    ticketMedio: string;
    taxaConversao: string;
    vendedores: Record<string, {
      name: string;
      totalLeads: number;
      activeLeads: number;
      proposals: number;
      sales: number;
      valorVendas: string;
      taxaConversao: string;
      taxaPropostas: string;
      valorMedioVenda: string;
    }>;
    leads: Array<{
      id: number;
      nome: string;
      valor: string;
      status: string;
      statusCor: string;
      vendedor: string;
      created_at: string;
    }>;
  };
  comparisonStats: any | null;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardStats | null>(null);
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
      
      if (update.status === 'success' && update.data) {
        setData(update.data);
        setError(null);
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
    setDateRange(newRange);
    socketService.updateSubscription({ dateRange: newRange });
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