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
      dailyStats: Record<string, {
        total: number;
        sources: Record<string, any>;
        leads: Array<{
          id: number;
          name: string;
          contacts: any[];
          tags: any[];
          created_at: number;
        }>;
      }>;
      vendorStats: Record<string, {
        active: number;
        total: number;
        leads: any[];
      }>;
      personaStats: Record<string, {
        count: number;
        leads: any[];
      }>;
      purchaseStats: Array<{
        id: number;
        customer: string;
        products: any[];
        total: number;
        purchaseDate: string;
        tags: any[];
      }>;
      periodStats: {
        day: PeriodStats;
        week: PeriodStats;
        fortnight: PeriodStats;
      };
    } | null;
  };
  recentRules: any[];
}

interface PeriodStats {
  totalLeads: number;
  purchases: number;
  byVendor: Record<string, number>;
  byPersona: Record<string, number>;
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
      const { data: response } = await api.get<ApiResponse<DashboardData>>('/dashboard/stats');
      
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
      console.error('Dashboard fetch error:', err);

      // Implement retry logic
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        setTimeout(() => {
          fetchDashboardData(true);
        }, 2000 * retryCount.current); // Exponential backoff
        return;
      }

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