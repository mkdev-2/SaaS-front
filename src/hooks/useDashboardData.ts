import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import socketService from '../lib/socket';
import { ApiResponse } from '../types/api';
import { DashboardStats } from '../types/dashboard';

const POLLING_INTERVAL = 30000; // 30 seconds

// Default empty state
const defaultStats: DashboardStats = {
  totalIntegrations: 0,
  activeWorkflows: 0,
  apiCalls: 0,
  totalUsers: 0,
  recentWorkflows: [],
  integrationHealth: []
};

export function useDashboardData() {
  const [data, setData] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  
  // Use refs to track the mounted state and last fetch time
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);
  const pollTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchDashboardData = async (force = false) => {
    // Prevent multiple fetches within 5 seconds unless forced
    const now = Date.now();
    if (!force && now - lastFetchTime.current < 5000) {
      return;
    }

    try {
      setLoading(true);
      const { data: response } = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      
      if (!isMounted.current) return;

      if (response.status === 'success' && response.data) {
        setData(prevData => ({
          ...prevData,
          ...response.data
        }));
        setError(null);
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        lastFetchTime.current = Date.now();
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    // Initial fetch
    fetchDashboardData(true);

    // Set up WebSocket connection
    socketService.connect();

    // Subscribe to dashboard updates
    const unsubscribeUpdates = socketService.onDashboardUpdate((newData) => {
      if (isMounted.current) {
        setData(prevData => ({
          ...prevData,
          ...newData
        }));
      }
    });

    // Subscribe to connection status
    const unsubscribeConnection = socketService.onConnectionChange((status) => {
      if (isMounted.current) {
        setWsConnected(status);
      }
    });

    // Setup polling only when WebSocket is not connected
    const setupPolling = () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }

      if (!wsConnected && isMounted.current) {
        pollTimeoutRef.current = setTimeout(() => {
          if (isMounted.current && !wsConnected) {
            fetchDashboardData();
          }
          setupPolling();
        }, POLLING_INTERVAL);
      }
    };

    // Watch for WebSocket connection changes
    const pollingSub = socketService.onConnectionChange((connected) => {
      if (connected) {
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
        }
      } else {
        setupPolling();
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribeUpdates();
      unsubscribeConnection();
      pollingSub();
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  const refresh = () => {
    fetchDashboardData(true);
  };

  return { data, loading, error, refresh, wsConnected };
}