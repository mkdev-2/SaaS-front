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

  const transformSocketData = (socketData: any): DashboardData => {
    const kommoData = socketData.data?.kommo;
    
    return {
      projectCount: socketData.data?.projects?.total || 0,
      recentProjects: socketData.data?.projects?.recent || [],
      automationRules: socketData.data?.recentRules || [],
      isKommoConnected: kommoData?.isConnected || false,
      kommoConfig: kommoData ? {
        id: 'socket',
        accountDomain: kommoData.accountDomain,
        clientId: '',
        createdAt: kommoData.connectedAt
      } : null,
      kommoAnalytics: kommoData?.analytics ? {
        periodStats: {
          day: kommoData.analytics.periodStats.day,
          week: kommoData.analytics.periodStats.week,
          fortnight: kommoData.analytics.periodStats.fortnight
        },
        dailyStats: kommoData.analytics.dailyStats || {},
        vendorStats: kommoData.analytics.vendorStats || {},
        personaStats: kommoData.analytics.personaStats || {}
      } : null
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
      const { data: response } = await api.get<ApiResponse<DashboardData>>('/dashboard/stats', {
        params: {
          detailed: true,
          period: 15
        }
      });
      
      if (!isMounted.current) return;

      if (response.status === 'success' && response.data) {
        setData(response.data);
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

    // Socket connection
    socketService.connect();

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
        const transformedData = transformSocketData(socketData);
        setData(prevData => ({
          ...prevData,
          ...transformedData,
          kommoAnalytics: {
            ...prevData?.kommoAnalytics,
            ...transformedData.kommoAnalytics
          }
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