import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { socketService } from '../lib/socket';
import useAuthStore from '../store/authStore';
import { DashboardData, TeamPerformanceData } from '../types/dashboard';

const DEFAULT_TEAM_PERFORMANCE: TeamPerformanceData = {
  vendorStats: {},
  history: [],
  goals: {
    monthly: {
      leads: 0,
      sales: 0,
      revenue: 0
    },
    completion: {
      leads: '0%',
      sales: '0%',
      revenue: '0%'
    }
  }
};

const DEFAULT_DATA: DashboardData = {
  projectCount: 0,
  recentProjects: [],
  automationRules: [],
  kommoConfig: null,
  isKommoConnected: false,
  teamPerformance: DEFAULT_TEAM_PERFORMANCE
};

interface EndpointError {
  endpoint: string;
  message: string;
  code?: string;
  status?: number;
}

export function useDashboardData() {
  const { isAuthenticated, user } = useAuthStore();
  const [data, setData] = useState<DashboardData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endpointErrors, setEndpointErrors] = useState<EndpointError[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);
  const dataRef = useRef<DashboardData>(DEFAULT_DATA);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(false);

  const fetchEndpoint = async (endpoint: string) => {
    try {
      // Add timestamp to URL to prevent caching
      const timestamp = Date.now();
      const url = `/dashboard/${endpoint}${endpoint.includes('?') ? '&' : '?'}_t=${timestamp}`;
      
      const { data: response } = await api.get<ApiResponse<any>>(url);
      
      if (response.status === 'success' && response.data) {
        setEndpointErrors(prev => prev.filter(e => e.endpoint !== endpoint));
        return response.data;
      }

      const errorMessage = response.message || `Failed to fetch ${endpoint} data`;
      setEndpointErrors(prev => [
        ...prev.filter(e => e.endpoint !== endpoint),
        { endpoint, message: errorMessage }
      ]);
      
      return null;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      setEndpointErrors(prev => [
        ...prev.filter(e => e.endpoint !== endpoint),
        { endpoint, message, status: err.response?.status }
      ]);
      return null;
    }
  };

  const transformData = useCallback((responseData: any): DashboardData => {
    if (!responseData) {
      return dataRef.current;
    }

    const teamData = responseData.team || responseData.data;
    if (!teamData) {
      return dataRef.current;
    }

    const teamPerformance = {
      vendorStats: teamData.vendorStats || {},
      history: teamData.history || [],
      goals: teamData.goals || DEFAULT_TEAM_PERFORMANCE.goals
    };

    return {
      ...dataRef.current,
      teamPerformance
    };
  }, []);

  const fetchDashboardData = useCallback(async (force = false) => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      setError('Authentication required');
      return;
    }

    const now = Date.now();
    if (!force && !initialLoadRef.current && now - lastFetchTime.current < 5000) {
      return;
    }

    try {
      setLoading(true);
      
      const teamData = await fetchEndpoint('team');
      
      if (!isMounted.current) return;

      if (teamData) {
        const transformedData = transformData({ data: teamData });
        if (Object.keys(transformedData.teamPerformance?.vendorStats || {}).length > 0) {
          dataRef.current = transformedData;
          setData(transformedData);
          setError(null);
          initialLoadRef.current = true;
        }
      } else {
        if (!initialLoadRef.current) {
          setError('Failed to fetch initial dashboard data');
        }
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          if (isMounted.current) {
            fetchDashboardData(true);
          }
        }, 30000);
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
  }, [isAuthenticated, user, transformData]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketService.disconnect();
      setData(DEFAULT_DATA);
      dataRef.current = DEFAULT_DATA;
      initialLoadRef.current = false;
      setLoading(false);
      return;
    }

    // Fetch initial data immediately
    fetchDashboardData(true);

    // Setup socket connection after initial fetch
    socketService.connect();

    const unsubscribeConnection = socketService.onConnectionChange((status) => {
      if (!isMounted.current) return;
      setIsConnected(status);
      if (status) {
        setError(null);
        // Only request socket data if we already have initial data
        if (initialLoadRef.current) {
          socketService.requestData();
        }
      }
      setLoading(false);
    });

    const unsubscribeUpdates = socketService.onDashboardUpdate((socketData) => {
      if (!isMounted.current) return;
      
      if (socketData.status === 'success' && socketData.data) {
        const transformedData = transformData(socketData);
        // Only update if we have meaningful data
        if (Object.keys(transformedData.teamPerformance?.vendorStats || {}).length > 0) {
          dataRef.current = transformedData;
          setData(transformedData);
          setError(null);
          lastFetchTime.current = Date.now();
          initialLoadRef.current = true;
        }
      }
    });

    return () => {
      isMounted.current = false;
      initialLoadRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      unsubscribeConnection();
      unsubscribeUpdates();
      socketService.disconnect();
    };
  }, [fetchDashboardData, isAuthenticated, user, transformData]);

  const refresh = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    initialLoadRef.current = false;
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  return {
    data: data || dataRef.current,
    loading,
    error,
    endpointErrors,
    refresh,
    isConnected
  };
}