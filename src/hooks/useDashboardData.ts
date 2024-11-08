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
          price: number;
          created_at: number;
        }>;
      }>;
      vendorStats?: Record<string, number>;
      personaStats?: Record<string, number>;
    } | null;
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
  const pollTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCount = useRef(0);
  const maxRetries = 3;

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
        retryCount.current = 0; // Reset retry count on success
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      if (!isMounted.current) return;

      // Implement retry logic
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        setTimeout(() => {
          fetchDashboardData(true);
        }, 2000 * retryCount.current); // Exponential backoff
        return;
      }

      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to connect to the server');
      setData(null);
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
        // Fetch fresh data when socket connects
        fetchDashboardData(true);
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

    // Polling fallback if socket is not connected
    const startPolling = () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }

      pollTimeoutRef.current = setTimeout(() => {
        if (isMounted.current && !isConnected) {
          fetchDashboardData();
          startPolling();
        }
      }, 30000);
    };

    if (!isConnected) {
      startPolling();
    }

    return () => {
      isMounted.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      unsubscribeConnection();
      unsubscribeUpdates();
      socketService.disconnect();
    };
  }, [fetchDashboardData, isConnected, isAuthenticated, user]);

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