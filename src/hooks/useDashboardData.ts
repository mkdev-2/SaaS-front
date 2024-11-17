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
    if (!responseData) {
      return {
        projectCount: 0,
        recentProjects: [],
        automationRules: [],
        kommoConfig: null,
        isKommoConnected: false,
        kommoAnalytics: null
      };
    }

    const {
      overview,
      team,
      marketing,
      quality,
      config
    } = responseData;

    // Manter dados anteriores se não houver novos dados
    if (!overview && dataRef.current?.kommoAnalytics) {
      return dataRef.current;
    }

    const transformedAnalytics = overview ? {
      periodStats: {
        day: {
          totalLeads: overview.periodStats.day.totalLeads,
          vendas: overview.periodStats.day.vendas,
          valorVendas: overview.periodStats.day.valorVendas,
          taxaConversao: overview.periodStats.day.taxaConversao
        },
        week: {
          totalLeads: overview.periodStats.week.totalLeads,
          vendas: overview.periodStats.week.vendas,
          valorVendas: overview.periodStats.week.valorVendas,
          taxaConversao: overview.periodStats.week.taxaConversao
        },
        fortnight: {
          totalLeads: overview.periodStats.fortnight.totalLeads,
          vendas: overview.periodStats.fortnight.vendas,
          valorVendas: overview.periodStats.fortnight.valorVendas,
          taxaConversao: overview.periodStats.fortnight.taxaConversao
        }
      },
      dailyStats: overview.dailyStats || {},
      vendorStats: team?.vendorStats || {},
      personaStats: marketing?.personaStats || {},
      funnelStages: overview.funnelStages || [],
      marketingMetrics: marketing?.metrics || {
        custoTotal: 0,
        custoPorLead: 0,
        roi: 0,
        leadsGerados: 0
      },
      serviceQuality: quality?.metrics || {
        tempoMedioResposta: 0,
        taxaResposta: 0,
        nps: 0,
        tempoMedioConversao: 0
      }
    } : null;

    return {
      projectCount: config?.projectCount || 0,
      recentProjects: config?.recentProjects || [],
      automationRules: config?.automationRules || [],
      kommoConfig: config?.kommo || null,
      isKommoConnected: config?.kommo?.isConnected || false,
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
      
      const [
        overviewResponse,
        teamResponse,
        marketingResponse,
        qualityResponse,
        configResponse
      ] = await Promise.all([
        api.get<ApiResponse<any>>('/dashboard/overview'),
        api.get<ApiResponse<any>>('/dashboard/team'),
        api.get<ApiResponse<any>>('/dashboard/marketing'),
        api.get<ApiResponse<any>>('/dashboard/quality'),
        api.get<ApiResponse<any>>('/dashboard/config')
      ]);
      
      if (!isMounted.current) return;

      const combinedData = {
        overview: overviewResponse.data?.data,
        team: teamResponse.data?.data,
        marketing: marketingResponse.data?.data,
        quality: qualityResponse.data?.data,
        config: configResponse.data?.data
      };

      const transformedData = transformData(combinedData);
      dataRef.current = transformedData;
      setData(transformedData);
      setError(null);
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