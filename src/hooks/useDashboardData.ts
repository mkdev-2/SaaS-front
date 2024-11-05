import { useState, useEffect } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { DashboardStats } from '../types/dashboard';

const POLLING_INTERVAL = 30000; // 30 seconds

export function useDashboardData() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const { data: response } = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      if (response.status === 'success' && response.data) {
        setData(response.data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchDashboardData();

    // Set up WebSocket connection
    const ws = new WebSocket(import.meta.env.VITE_WS_URL || 'wss://saas-backend-production-8b94.up.railway.app/ws');
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      if (update.type === 'DASHBOARD_UPDATE') {
        setData(prevData => ({
          ...prevData,
          ...update.data
        }));
      }
    };

    // Fallback polling for reliability
    const pollInterval = setInterval(fetchDashboardData, POLLING_INTERVAL);

    return () => {
      ws.close();
      clearInterval(pollInterval);
    };
  }, []);

  const refresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  return { data, loading, error, refresh };
}