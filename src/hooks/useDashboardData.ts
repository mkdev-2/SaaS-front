import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { DashboardStats } from '../types/dashboard';

const POLLING_INTERVAL = 30000; // 30 seconds
const MIN_POLLING_INTERVAL = 5000; // 5 seconds minimum between polls

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
  
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);
  const pollTimeoutRef = useRef<NodeJS.Timeout>();

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
  }, []);

  useEffect(() => {
    isMounted.current = true;
    
    // Initial fetch
    fetchDashboardData(true);

    // Set up polling
    const poll = () => {
      if (!isMounted.current) return;
      
      fetchDashboardData();
      pollTimeoutRef.current = setTimeout(poll, POLLING_INTERVAL);
    };

    pollTimeoutRef.current = setTimeout(poll, POLLING_INTERVAL);

    return () => {
      isMounted.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [fetchDashboardData]);

  const refresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  return { 
    data, 
    loading, 
    error, 
    refresh, 
    wsConnected: false // Always false since we're not using WebSocket
  };
}