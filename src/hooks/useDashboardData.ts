import { useState, useEffect } from 'react';
import api from '../lib/api';
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

  const fetchDashboardData = async () => {
    try {
      const { data: response } = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      if (response.status === 'success' && response.data) {
        setData({
          ...defaultStats,
          ...response.data
        });
        setError(null);
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchDashboardData();

    // Set up WebSocket connection with retry logic
    const connectWebSocket = () => {
      const ws = new WebSocket(import.meta.env.VITE_WS_URL || 'wss://saas-backend-production-8b94.up.railway.app/ws');
      
      ws.onopen = () => {
        setWsConnected(true);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          if (update.type === 'DASHBOARD_UPDATE' && update.data) {
            setData(prevData => ({
              ...prevData,
              ...update.data
            }));
          }
        } catch (err) {
          console.error('WebSocket message error:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Retry connection after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        ws.close();
      };

      return ws;
    };

    const ws = connectWebSocket();

    // Fallback polling for reliability
    const pollInterval = setInterval(fetchDashboardData, POLLING_INTERVAL);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      clearInterval(pollInterval);
    };
  }, []);

  const refresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  return { data, loading, error, refresh, wsConnected };
}