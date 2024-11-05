import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { DashboardStats } from '../types/dashboard';
import socketService from '../lib/socket';
import useAuthStore from '../store/authStore';

const POLLING_INTERVAL = 30000; // 30 seconds
const MIN_POLLING_INTERVAL = 5000; // 5 seconds minimum between polls

const fallbackStats: DashboardStats = {
  totalIntegrations: 0,
  activeWorkflows: 0,
  apiCalls: 0,
  totalUsers: 0,
  recentWorkflows: [],
  integrationHealth: []
};

export function useDashboardData() {
  const { isAuthenticated, user } = useAuthStore();
  const [data, setData] = useState<DashboardStats>(fallbackStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);
  const pollTimeoutRef = useRef<NodeJS.Timeout>();
  const initialFetchDone = useRef(false);

  const fetchDashboardData = useCallback(async (force = false) => {
    // Only fetch if authenticated and we have a user
    if (!isAuthenticated || !user) {
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
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to connect to the server');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        lastFetchTime.current = Date.now();
        initialFetchDone.current = true;
      }
    }
  }, [isAuthenticated, user]);

  // Handle socket connection and polling
  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketService.disconnect();
      return;
    }

    // Initial fetch and socket connection
    if (!initialFetchDone.current) {
      fetchDashboardData(true);
      socketService.connect();
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
      lastFetchTime.current = Date.now();
    });

    // Set up polling as fallback when socket is disconnected
    const setupPolling = () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }

      if (!isConnected && initialFetchDone.current) {
        pollTimeoutRef.current = setInterval(() => {
          if (isMounted.current && !isConnected) {
            fetchDashboardData();
          }
        }, POLLING_INTERVAL);
      }
    };

    setupPolling();

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      unsubscribeConnection();
      unsubscribeUpdates();
    };
  }, [fetchDashboardData, isConnected, isAuthenticated, user]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      socketService.disconnect();
    };
  }, []);

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