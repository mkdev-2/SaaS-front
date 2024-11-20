// src/hooks/useDashboardData.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../lib/socket';
import { DashboardData, DateRange } from '../types/dashboard';

function transformBackendData(data: any): DashboardData {
  const { projects, kommo } = data;

  // Transform analytics data
  const analytics = kommo?.analytics;
  const currentStats = {
    totalLeads: analytics?.periodStats?.day?.totalLeads || 0,
    vendas: analytics?.periodStats?.day?.purchases || 0,
    valorVendas: analytics?.periodStats?.day?.totalValue || 0,
    ticketMedio: analytics?.periodStats?.day?.purchases ? 
      analytics.periodStats.day.totalValue / analytics.periodStats.day.purchases : 0,
    taxaConversao: analytics?.periodStats?.day?.totalLeads ? 
      (analytics.periodStats.day.purchases / analytics.periodStats.day.totalLeads) * 100 : 0
  };

  // Transform leads data
  const leads = Object.entries(analytics?.dailyStats || {}).flatMap(([date, dayData]: [string, any]) => 
    (dayData.leads || []).map((lead: any) => ({
      id: lead.id,
      name: lead.name,
      status: lead.status,
      statusColor: lead.statusColor || '#666',
      tipo: lead.tipo || 'novo',
      vendedor: lead.vendedor || 'Não atribuído',
      value: typeof lead.value === 'number' ? 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value) : 
        lead.value || 'R$ 0,00',
      created_at: date
    }))
  );

  return {
    projectCount: projects?.total || 0,
    recentProjects: projects?.recent || [],
    automationRules: [],
    kommoConfig: kommo ? {
      accountDomain: kommo.accountDomain,
      connectedAt: kommo.connectedAt,
      isConnected: kommo.isConnected
    } : null,
    isKommoConnected: kommo?.isConnected || false,
    kommoAnalytics: {
      currentStats,
      leads
    }
  };
}

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
        const transformedData = transformBackendData(update.data);
        setData(transformedData);
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
    setDateRange(newRange);
    socketService.updateSubscription({ dateRange: newRange });
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
