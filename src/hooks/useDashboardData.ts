import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { socketService } from '../lib/socket';
import useAuthStore from '../store/authStore';
import { DashboardData } from '../types/dashboard';

const DEBUG = true;
function debugLog(label: string, data: any) {
  if (DEBUG) {
    console.log(`[Dashboard Debug] ${label}:`, data);
  }
}

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
    debugLog('Raw Response Data', responseData);

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
      metrics: {
        activeLeads: analytics.metrics?.activeLeads || 0,
        qualificationRate: analytics.metrics?.qualificationRate || 0,
        costPerLead: analytics.metrics?.costPerLead || 0,
        conversionTime: analytics.metrics?.conversionTime || 0,
        periodComparison: analytics.metrics?.periodComparison || {}
      },
      funnel: analytics.funnel || [],
      sources: analytics.sources || [],
      metadata: analytics.metadata || {
        period: 15,
        compareWith: 30,
        currentLeadsCount: 0,
        previousLeadsCount: 0,
        dateRanges: {
          current: {
            start: new Date().toISOString(),
            end: new Date().toISOString()
          },
          previous: {
            start: new Date().toISOString(),
            end: new Date().toISOString()
          }
        }
      },
      vendorPerformance: analytics.vendorPerformance || [],
      periodStats: {
        day: {
          totalLeads: analytics.periodStats?.day?.totalLeads || 0,
          vendas: analytics.periodStats?.day?.purchases || 0,
          valorVendas: `R$ ${analytics.periodStats?.day?.totalValue || 0}`,
          taxaConversao: `${((analytics.periodStats?.day?.purchases || 0) / (analytics.periodStats?.day?.totalLeads || 1) * 100).toFixed(1)}%`
        },
        week: {
          totalLeads: analytics.periodStats?.week?.totalLeads || 0,
          vendas: analytics.periodStats?.week?.purchases || 0,
          valorVendas: `R$ ${analytics.periodStats?.week?.totalValue || 0}`,
          taxaConversao: `${((analytics.periodStats?.week?.purchases || 0) / (analytics.periodStats?.week?.totalLeads || 1) * 100).toFixed(1)}%`
        },
        fortnight: {
          totalLeads: analytics.periodStats?.fortnight?.totalLeads || 0,
          vendas: analytics.periodStats?.fortnight?.purchases || 0,
          valorVendas: `R$ ${analytics.periodStats?.fortnight?.totalValue || 0}`,
          taxaConversao: `${((analytics.periodStats?.fortnight?.purchases || 0) / (analytics.periodStats?.fortnight?.totalLeads || 1) * 100).toFixed(1)}%`
        }
      }
    } : null;

    const result = {
      projectCount: responseData.projects?.total || 0,
      recentProjects: responseData.projects?.recent || [],
      automationRules: responseData.recentRules || [],
      kommoConfig: {
        accountDomain,
        connectedAt,
        isConnected
      },
      isKommoConnected: isConnected || false,
      kommoAnalytics: transformedAnalytics
    };

    debugLog('Transformed Data', result);
    return result;
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
      const { data: response } = await api.get<ApiResponse<any>>('/dashboard/stats');
      
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
      debugLog('Socket Update Received', socketData);
      
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