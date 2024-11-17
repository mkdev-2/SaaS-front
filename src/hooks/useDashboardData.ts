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
    // Keep existing data if available
    const existingData = dataRef.current || {
      projectCount: 0,
      recentProjects: [],
      automationRules: [],
      kommoConfig: null,
      isKommoConnected: false,
      kommoAnalytics: null
    };

    if (!responseData) {
      return existingData;
    }

    const {
      overview,
      team,
      marketing,
      quality,
      config
    } = responseData;

    // If no new overview data, keep existing analytics
    if (!overview && existingData.kommoAnalytics) {
      return existingData;
    }

    const transformedAnalytics = overview ? {
      periodStats: {
        day: {
          totalLeads: overview.periodStats?.day?.totalLeads || 0,
          vendas: overview.periodStats?.day?.vendas || 0,
          valorVendas: overview.periodStats?.day?.valorVendas || 'R$ 0,00',
          taxaConversao: overview.periodStats?.day?.taxaConversao || '0%'
        },
        week: {
          totalLeads: overview.periodStats?.week?.totalLeads || 0,
          vendas: overview.periodStats?.week?.vendas || 0,
          valorVendas: overview.periodStats?.week?.valorVendas || 'R$ 0,00',
          taxaConversao: overview.periodStats?.week?.taxaConversao || '0%'
        },
        fortnight: {
          totalLeads: overview.periodStats?.fortnight?.totalLeads || 0,
          vendas: overview.periodStats?.fortnight?.vendas || 0,
          valorVendas: overview.periodStats?.fortnight?.valorVendas || 'R$ 0,00',
          taxaConversao: overview.periodStats?.fortnight?.taxaConversao || '0%'
        }
      },
      dailyStats: overview.dailyStats || existingData.kommoAnalytics?.dailyStats || {},
      vendorStats: team?.vendorStats || existingData.kommoAnalytics?.vendorStats || {},
      personaStats: marketing?.personaStats || existingData.kommoAnalytics?.personaStats || {},
      funnelStages: overview.funnelStages || existingData.kommoAnalytics?.funnelStages || [],
      marketingMetrics: marketing?.metrics || existingData.kommoAnalytics?.marketingMetrics || {
        custoTotal: 0,
        custoPorLead: 0,
        roi: 0,
        leadsGerados: 0
      },
      serviceQuality: quality?.metrics || existingData.kommoAnalytics?.serviceQuality || {
        tempoMedioResposta: 0,
        taxaResposta: 0,
        nps: 0,
        tempoMedioConversao: 0
      }
    } : existingData.kommoAnalytics;

    return {
      projectCount: config?.projectCount || existingData.projectCount,
      recentProjects: config?.recentProjects || existingData.recentProjects,
      automationRules: config?.automationRules || existingData.automationRules,
      kommoConfig: config?.kommo || existingData.kommoConfig,
      isKommoConnected: config?.kommo?.isConnected || existingData.isKommoConnected,
      kommoAnalytics: transformedAnalytics
    };
  }, []);

  const fetchEndpoint = async (endpoint: string) => {
    try {
      const response = await api.get<ApiResponse<any>>(`/dashboard/${endpoint}`);
      return response.data?.data;
    } catch (err: any) {
      console.warn(`Failed to fetch ${endpoint} data:`, err);
      return null;
    }
  };

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
      
      const [overview, team, marketing, quality, config] = await Promise.all([
        fetchEndpoint('overview'),
        fetchEndpoint('team'),
        fetchEndpoint('marketing'),
        fetchEndpoint('quality'),
        fetchEndpoint('config')
      ]);
      
      if (!isMounted.current) return;

      // Only show error if all endpoints failed
      if (!overview && !team && !marketing && !quality && !config) {
        throw new Error('Failed to fetch dashboard data');
      }

      const combinedData = {
        overview,
        team,
        marketing,
        quality,
        config
      };

      const transformedData = transformData(combinedData);
      dataRef.current = transformedData;
      setData(transformedData);
      
      // Clear error if we got at least some data
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