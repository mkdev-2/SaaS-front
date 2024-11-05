import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { DashboardStats } from '../types/dashboard';
import socketService from '../lib/socket';
import useAuthStore from '../store/authStore';

const POLLING_INTERVAL = 30000; // 30 seconds
const MIN_POLLING_INTERVAL = 5000; // 5 seconds minimum between polls

const fallbackStats: DashboardStats = {
  totalIntegrations: 1,
  activeWorkflows: 0,
  apiCalls: 0,
  totalUsers: 1,
  recentWorkflows: [],
  integrationHealth: [
    {
      id: 'kommo',
      name: 'Kommo CRM',
      status: 'healthy',
      uptime: 99.9,
      lastCheck: new Date().toISOString()
    }
  ]
};

export function useDashboardData() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [data, setData] = useState<DashboardStats>(fallbackStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);
  const pollTimeoutRef = useRef<NodeJS.Timeout>();
  const initialFetchDone = useRef(false);

  const fetchDashboardData = useCallback(async (force = false) => {
    if (!isAuthenticated) {
      setError('No authentication token provided');
      setLoading(false);
      return;
    }

    const now = Date.now();
    if (!force && now - lastFetchTime.current < MIN_POLLING_INTERVAL) {
      return;
    }

    try {
      setLoading(true);
      const { data: response } = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      
      if (!isMounted.current) return;

      if (response.status === 'success' && response.data) {
        setData(response.data);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch dashboard data');
        setData(prev => Object.keys(prev).length === 0 ? fallbackStats : prev);
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err.response?.data?.message || 'Failed to connect to the server');
      setData(prev => Object.keys(prev).length === 0 ? fallbackStats : prev);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        lastFetchTime.current = Date.now();
        initialFetchDone.current = true;
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    isMounted.current = true;
    initialFetchDone.current = false;

    if (isAuthenticated && !initialFetchDone.current) {
      socketService.connect();
      fetchDashboardData(true);
    }

    const unsubscribeConnection = socketService.onConnectionChange((status) => {
      if (!isMounted.current) return;
      setIsConnected(status);
      if (status) {
        setError(null);
      }
    });

    const unsubscribeUpdates = socketService.onDashboardUpdate((newData) => {
      if (!isMounted.current) return;
      setData(newData);
      setError(null);
    });

    const setupPolling = () => {
      if (!isConnected && initialFetchDone.current && isAuthenticated) {
        pollTimeoutRef.current = setTimeout(() => {
          if (isMounted.current && !isConnected) {
            fetchDashboardData();
            setupPolling();
          }
        }, POLLING_INTERVAL);
      }
    };

    if (!isConnected && initialFetchDone.current && isAuthenticated) {
      setupPolling();
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
  }, [fetchDashboardData, isConnected, isAuthenticated]);

  const refresh = useCallback(() => {
    if (Date.now() - lastFetchTime.current >= MIN_POLLING_INTERVAL) {
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