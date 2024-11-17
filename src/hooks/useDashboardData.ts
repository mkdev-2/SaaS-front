import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { socketService } from '../lib/socket';
import useAuthStore from '../store/authStore';
import { DashboardData } from '../types/dashboard';

const DEFAULT_PERIOD_STATS = {
  totalLeads: 0,
  vendas: 0,
  valorVendas: 'R$ 0,00',
  taxaConversao: '0%'
};

const DEFAULT_ANALYTICS = {
  periodStats: {
    day: DEFAULT_PERIOD_STATS,
    week: DEFAULT_PERIOD_STATS,
    fortnight: DEFAULT_PERIOD_STATS
  },
  dailyStats: {},
  vendorStats: {},
  personaStats: {},
  funnelStages: [],
  marketingMetrics: {
    custoTotal: 0,
    custoPorLead: 0,
    roi: 0,
    leadsGerados: 0
  },
  serviceQuality: {
    tempoMedioResposta: 0,
    taxaResposta: 0,
    nps: 0,
    tempoMedioConversao: 0
  }
};

const DEFAULT_DATA: DashboardData = {
  projectCount: 0,
  recentProjects: [],
  automationRules: [],
  kommoConfig: null,
  isKommoConnected: false,
  kommoAnalytics: DEFAULT_ANALYTICS
};

interface EndpointError {
  endpoint: string;
  message: string;
  code?: string;
  status?: number;
}

export function useDashboardData() {
  const { isAuthenticated, user } = useAuthStore();
  const [data, setData] = useState<DashboardData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endpointErrors, setEndpointErrors] = useState<EndpointError[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);
  const dataRef = useRef<DashboardData>(DEFAULT_DATA);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const transformPeriodStats = useCallback((stats: any) => ({
    totalLeads: stats?.totalLeads || 0,
    vendas: stats?.vendas || 0,
    valorVendas: stats?.valorVendas || 'R$ 0,00',
    taxaConversao: stats?.taxaConversao || '0%'
  }), []);

  const transformData = useCallback((responseData: any): DashboardData => {
    if (!responseData) {
      return dataRef.current;
    }

    const {
      overview,
      team,
      marketing,
      quality,
      config
    } = responseData;

    // Transform overview data with fallbacks
    const periodStats = overview?.periodStats || DEFAULT_ANALYTICS.periodStats;
    const transformedAnalytics = {
      periodStats: {
        day: transformPeriodStats(periodStats.day),
        week: transformPeriodStats(periodStats.week),
        fortnight: transformPeriodStats(periodStats.fortnight)
      },
      dailyStats: overview?.dailyStats || {},
      vendorStats: team?.vendorStats || {},
      personaStats: marketing?.personaStats || {},
      funnelStages: overview?.funnelStages || [],
      marketingMetrics: marketing?.metrics || DEFAULT_ANALYTICS.marketingMetrics,
      serviceQuality: quality?.metrics || DEFAULT_ANALYTICS.serviceQuality
    };

    // Transform vendor stats with strict type checking
    if (transformedAnalytics.vendorStats) {
      transformedAnalytics.vendorStats = Object.entries(transformedAnalytics.vendorStats)
        .reduce((acc: any, [key, value]: [string, any]) => {
          acc[key] = {
            totalAtendimentos: value?.totalAtendimentos || 0,
            propostas: value?.propostas || 0,
            vendas: value?.vendas || 0,
            valorVendas: value?.valorVendas || 'R$ 0,00',
            taxaConversao: value?.taxaConversao || '0%',
            taxaPropostas: value?.taxaPropostas || '0%'
          };
          return acc;
        }, {});
    }

    return {
      projectCount: config?.projectCount || 0,
      recentProjects: config?.recentProjects || [],
      automationRules: config?.automationRules || [],
      kommoConfig: config?.kommo || null,
      isKommoConnected: config?.kommo?.isConnected || false,
      kommoAnalytics: transformedAnalytics
    };
  }, [transformPeriodStats]);

  const fetchEndpoint = async (endpoint: string) => {
    try {
      const { data: response } = await api.get<ApiResponse<any>>(`/api/dashboard/${endpoint}`);
      
      if (response.status === 'success' && response.data) {
        // Clear any previous error for this endpoint
        setEndpointErrors(prev => prev.filter(e => e.endpoint !== endpoint));
        return response.data;
      }

      // Handle error response
      const errorMessage = response.message || `Failed to fetch ${endpoint} data`;
      setEndpointErrors(prev => [
        ...prev.filter(e => e.endpoint !== endpoint),
        { endpoint, message: errorMessage, code: response.code }
      ]);
      
      console.warn(`Invalid response from ${endpoint}:`, response);
      return null;
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || `Failed to fetch ${endpoint} data`;
      const code = err.response?.data?.code;

      setEndpointErrors(prev => [
        ...prev.filter(e => e.endpoint !== endpoint),
        { endpoint, message, code, status }
      ]);

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

      // Check if we got any data at all
      const hasAnyData = overview || team || marketing || quality || config;
      
      if (!hasAnyData) {
        setError('Failed to fetch dashboard data. Please try again later.');
        
        // Schedule retry after 30 seconds
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          if (isMounted.current) {
            fetchDashboardData(true);
          }
        }, 30000);
      } else {
        setError(null);
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
      setData(DEFAULT_DATA);
      dataRef.current = DEFAULT_DATA;
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
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      unsubscribeConnection();
      unsubscribeUpdates();
      socketService.disconnect();
    };
  }, [fetchDashboardData, isAuthenticated, user, transformData]);

  const refresh = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  return {
    data: data || dataRef.current,
    loading,
    error,
    endpointErrors,
    refresh,
    isConnected
  };
}