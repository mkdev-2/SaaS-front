import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import socketService from '../lib/socket';
import useAuthStore from '../store/authStore';

export interface DashboardData {
  projects: {
    total: number;
    recent: any[];
  };
  kommo: {
    isConnected: boolean;
    accountDomain: string;
    connectedAt: string;
    automationRules: number;
    analytics: {
      periodStats: {
        day: { totalLeads: number; purchases: number };
        week: { totalLeads: number; purchases: number };
        fortnight: { totalLeads: number; purchases: number };
      };
      dailyStats?: Record<string, {
        total: number;
        leads: Array<{
          id: number;
          name: string;
          value: string;
          created_at: string;
        }>;
      }>;
      vendorStats?: Record<string, {
        totalLeads: number;
        activeLeads: number;
        totalPurchaseValue: string;
      }>;
      personaStats?: Record<string, {
        quantity: number;
        totalValue: string;
      }>;
    };
  };
  recentRules: any[];
}

export function useDashboardData() {
  const { isAuthenticated, user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);

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
      const { data: response } = await api.get<ApiResponse<DashboardData>>('/dashboard/stats');
      
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

    // Initial fetch
    fetchDashboardData(true);

    // Socket connection
    socketService.connect();

    const unsubscribeConnection = socketService.onConnectionChange((status) => {
      if (!isMounted.current) return;
      setIsConnected(status);
      if (status) {
        setError(null);
      }
    });

    const unsubscribeUpdates = socketService.onDashboardUpdate((newData) => {
      if (!isMounted.current) return;
      setData(prevData => ({
        ...prevData,
        ...newData
      }));
      setError(null);
      setLoading(false);
      lastFetchTime.current = Date.now();
    });

    return () => {
      isMounted.current = false;
      unsubscribeConnection();
      unsubscribeUpdates();
      socketService.disconnect();
    };
  }, [fetchDashboardData, isAuthenticated, user]);

  const refresh = useCallback(() => {
    if (Date.now() - lastFetchTime.current >= 5000) {
      fetchDashboardData(true);
    }
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refresh,
    isConnected
  };
}