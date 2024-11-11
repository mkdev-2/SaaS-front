import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { socketService } from '../lib/socket';
import useAuthStore from '../store/authStore';
import { DashboardData } from '../types/dashboard';

export function useDashboardData() {
  const { isAuthenticated, user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);
  const dataRef = useRef<DashboardData | null>(null);

  const transformData = useCallback((responseData: any): DashboardData => {
    if (!responseData?.kommo) {
      return {
        projectCount: 0,
        recentProjects: [],
        automationRules: [],
        kommoConfig: null,
        isKommoConnected: false,
        kommoAnalytics: null
      };
    }

    const { analytics, isConnected, accountDomain, connectedAt } = responseData.kommo;

    // Manter dados anteriores se não houver novos dados
    if (!analytics && dataRef.current?.kommoAnalytics) {
      return dataRef.current;
    }

    const transformedAnalytics = analytics ? {
      periodStats: {
        day: {
          totalLeads: analytics.periodStats.day.totalLeads,
          vendas: analytics.periodStats.day.purchases,
          valorVendas: `R$ ${analytics.periodStats.day.totalValue.toLocaleString('pt-BR')}`,
          taxaConversao: `${((analytics.periodStats.day.purchases / analytics.periodStats.day.totalLeads) * 100).toFixed(1)}%`
        },
        week: {
          totalLeads: analytics.periodStats.week.totalLeads,
          vendas: analytics.periodStats.week.purchases,
          valorVendas: `R$ ${analytics.periodStats.week.totalValue.toLocaleString('pt-BR')}`,
          taxaConversao: `${((analytics.periodStats.week.purchases / analytics.periodStats.week.totalLeads) * 100).toFixed(1)}%`
        },
        fortnight: {
          totalLeads: analytics.periodStats.fortnight.totalLeads,
          vendas: analytics.periodStats.fortnight.purchases,
          valorVendas: `R$ ${analytics.periodStats.fortnight.totalValue.toLocaleString('pt-BR')}`,
          taxaConversao: `${((analytics.periodStats.fortnight.purchases / analytics.periodStats.fortnight.totalLeads) * 100).toFixed(1)}%`
        }
      },
      dailyStats: responseData.dailyStats || {},
      vendorStats: responseData.vendorStats || {},
      personaStats: responseData.personaStats || {},
      funnelStages: responseData.funnelStages || [],
      marketingMetrics: responseData.marketingMetrics || {
        custoTotal: 0,
        custoPorLead: 0,
        roi: 0,
        leadsGerados: 0
      },
      serviceQuality: responseData.serviceQuality || {
        tempoMedioResposta: 0,
        taxaResposta: 0,
        nps: 0,
        tempoMedioConversao: 0
      }
    } : null;

    return {
      projectCount: responseData.projects?.total || 0,
      recentProjects: responseData.projects?.recent || [],
      automationRules: responseData.recentRules || [],
      kommoConfig: {
        accountDomain,
        connectedAt,
        isConnected
      },
      isKommoConnected: isConnected,
      kommoAnalytics: transformedAnalytics
    };
  }, []);

  const fetchDashboardData = useCallback(async (force = false) => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      setError('Authentication required');
      return;
    }

    const now = Date.now();
    if (!force && now - lastFetchTime.current < 5000) {
      return;
    }

    try {
      setLoading(true);
      const { data: response } = await api.get<ApiResponse<any>>('/api/dashboard/stats');
      
      if (!isMounted.current) return;

      if (response.status === 'success' && response.data) {
        const transformedData = transformData(response.data);
        dataRef.current = transformedData;
        setData(transformedData);
        setError(null);
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to connect to the server');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        lastFetchTime.current = Date.now();
      }
    }
  }, [isAuthenticated, user, transformData]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketService.disconnect();
      setData(null);
      dataRef.current = null;
      setLoading(false);
      return;
    }

    fetchDashboardData(true);
    socketService.connect();

    const unsubscribeConnection = socketService.onConnectionChange((status) => {
      if (!isMounted.current) return;
      setIsConnected(status);
      if (status) {
        setError(null);
        socketService.requestData();
      }
      setLoading(false);
    });

    const unsubscribeUpdates = socketService.onDashboardUpdate((socketData) => {
      if (!isMounted.current) return;
      
      if (socketData.status === 'success' && socketData.data) {
        const transformedData = transformData(socketData.data);
        dataRef.current = transformedData;
        setData(transformedData);
        setError(null);
        lastFetchTime.current = Date.now();
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribeConnection();
      unsubscribeUpdates();
      socketService.disconnect();
    };
  }, [fetchDashboardData, isAuthenticated, user, transformData]);

  const refresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  return {
    data: data || dataRef.current,
    loading,
    error,
    refresh,
    isConnected
  };
}