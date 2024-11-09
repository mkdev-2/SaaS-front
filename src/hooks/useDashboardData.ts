import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import socketService from '../lib/socket';
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

  const transformData = (responseData: any): DashboardData => {
    const kommoAnalytics = responseData.kommo?.analytics ? {
      periodStats: {
        day: {
          totalLeads: responseData.kommo.analytics.periodStats.day.totalLeads || 0,
          vendas: responseData.kommo.analytics.periodStats.day.totalVendas || 0,
          valorVendas: responseData.kommo.analytics.periodStats.day.valorTotalVendas || 'R$ 0,00',
          taxaConversao: responseData.kommo.analytics.periodStats.day.taxaConversao || '0%'
        },
        week: {
          totalLeads: responseData.kommo.analytics.periodStats.week.totalLeads || 0,
          vendas: responseData.kommo.analytics.periodStats.week.totalVendas || 0,
          valorVendas: responseData.kommo.analytics.periodStats.week.valorTotalVendas || 'R$ 0,00',
          taxaConversao: responseData.kommo.analytics.periodStats.week.taxaConversao || '0%'
        },
        fortnight: {
          totalLeads: responseData.kommo.analytics.periodStats.fortnight.totalLeads || 0,
          vendas: responseData.kommo.analytics.periodStats.fortnight.totalVendas || 0,
          valorVendas: responseData.kommo.analytics.periodStats.fortnight.valorTotalVendas || 'R$ 0,00',
          taxaConversao: responseData.kommo.analytics.periodStats.fortnight.taxaConversao || '0%'
        }
      },
      dailyStats: responseData.kommo.analytics.dailyStats || {},
      vendorStats: responseData.kommo.analytics.vendorStats || {},
      personaStats: responseData.kommo.analytics.personaStats || {}
    } : null;

    return {
      projectCount: responseData.projectCount || 0,
      recentProjects: responseData.recentProjects || [],
      automationRules: responseData.automationRules || [],
      kommoConfig: responseData.kommoConfig || null,
      isKommoConnected: responseData.isKommoConnected || false,
      kommoAnalytics
    };
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
      const { data: response } = await api.get<ApiResponse<any>>('/dashboard/stats', {
        params: {
          detailed: true,
          period: 15
        }
      });
      
      if (!isMounted.current) return;

      if (response.status === 'success' && response.data) {
        const transformedData = transformData(response.data);
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
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketService.disconnect();
      setData(null);
      setLoading(false);
      return;
    }

    // Initial fetch with detailed data
    fetchDashboardData(true);

    // Socket connection with detailed data subscription
    socketService.connect();
    socketService.updateSubscription({ detailed: true, period: 15 });

    const unsubscribeConnection = socketService.onConnectionChange((status) => {
      if (!isMounted.current) return;
      setIsConnected(status);
      if (status) {
        setError(null);
      }
      setLoading(false);
    });

    const unsubscribeUpdates = socketService.onDashboardUpdate((socketData) => {
      if (!isMounted.current) return;
      
      if (socketData.status === 'success' && socketData.data) {
        const transformedData = transformData(socketData.data);
        setData(prevData => ({
          ...prevData,
          ...transformedData
        }));
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
  }, [fetchDashboardData, isAuthenticated, user]);

  const refresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refresh,
    isConnected
  };
}