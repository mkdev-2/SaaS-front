import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { DashboardStats } from '../types/dashboard';

const POLLING_INTERVAL = 30000; // 30 seconds
const MIN_POLLING_INTERVAL = 5000; // 5 seconds minimum between polls

// Fallback data for development and error cases
const fallbackStats: DashboardStats = {
  totalIntegrations: 1, // At least Kommo integration
  activeWorkflows: 0,
  apiCalls: 0,
  totalUsers: 1, // Current user
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
        setData(response.data);
        setError(null);
      } else {
        // If the API returns an error, keep the current data but show the error
        setError(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      
      // On error, keep the current data but show the error message
      setError(err.response?.data?.message || 'Failed to connect to the server');
      
      // If we have no data at all, use fallback data
      setData(prev => {
        if (Object.keys(prev).length === 0) {
          return fallbackStats;
        }
        return prev;
      });
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
    refresh
  };
}