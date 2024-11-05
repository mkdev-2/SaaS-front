import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { DashboardStats } from '../types/dashboard';
import socketService from '../lib/socket';

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
  const [data, setData] = useState<DashboardStats>(fallbackStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);
  const pollTimeoutRef = useRef<NodeJS.Timeout>();
  const initialFetchDone = useRef(false);

  const fetchDashboardData = useCallback(async (force = false) => {
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
        // Keep existing data if available
        setData(prev => Object.keys(prev).length === 0 ? fallbackStats : prev);
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('No authentication token provided');
      } else {
        setError(err.response?.data?.message || 'Failed to connect to the server');
      }
      
      // Keep existing data if available
      setData(prev => Object.keys(prev).length === 0 ? fallbackStats : prev);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        lastFetchTime.current = Date.now();
        initialFetchDone.current = true;
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    initialFetchDone.current = false;
    
    // Only initialize socket if we haven't done the initial fetch
    if (!initialFetchDone.current) {
      socketService.connect();
      
      // Initial fetch
      fetchDashboardData(true);
    }
    
    // Listen for WebSocket connection status
    const unsubscribeConnection = socketService.onConnectionChange((status) => {
      if (!isMounted.current) return;
      setIsConnected(status);
      if (status) {
        setError(null);
      }
    });

    // Listen for real-time updates
    const unsubscribeUpdates = socketService.onDashboardUpdate((newData) => {
      if (!isMounted.current) return;
      setData(newData);
      setError(null);
    });

    // Set up polling as fallback only if WebSocket is not connected
    const setupPolling = () => {
      if (!isConnected && initialFetchDone.current) {
        pollTimeoutRef.current = setTimeout(() => {
          if (isMounted.current && !isConnected) {
            fetchDashboardData();
            setupPolling();
          }
        }, POLLING_INTERVAL);
      }
    };

    if (!isConnected && initialFetchDone.current) {
      setupPolling();
    }

    return () => {
      isMounted.current = false;
      unsubscribeConnection();
      unsubscribeUpdates();
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [fetchDashboardData, isConnected]);

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