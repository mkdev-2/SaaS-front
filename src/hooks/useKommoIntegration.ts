import { useState, useEffect } from 'react';
import api from '../lib/api';
import socketService from '../lib/socket';
import { ApiResponse } from '../types/api';
import { KommoConfig, KommoLead } from '../lib/kommo';

interface KommoState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  leads: KommoLead[];
  config: KommoConfig | null;
  needsConfiguration: boolean;
  isRealTimeEnabled: boolean;
}

const initialState: KommoState = {
  isConnected: false,
  isLoading: true,
  error: null,
  leads: [],
  config: null,
  needsConfiguration: false,
  isRealTimeEnabled: false,
};

export function useKommoIntegration() {
  const [state, setState] = useState<KommoState>(initialState);

  const updateState = (newState: Partial<KommoState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const loadConfig = async () => {
    try {
      updateState({ isLoading: true, error: null, needsConfiguration: false });
      
      const { data: response } = await api.get<ApiResponse<KommoConfig>>('/integrations/kommo/config');
      
      if (response.status === 'success' && response.data) {
        const isConnected = !!response.data.access_token;
        updateState({
          config: response.data,
          isConnected,
          needsConfiguration: false,
        });

        if (isConnected) {
          await loadLeads();
          setupRealTimeUpdates();
        }
      } else {
        updateState({
          isConnected: false,
          config: null,
          needsConfiguration: true,
        });
      }
    } catch (err: any) {
      console.error('Error loading Kommo config:', err);
      if (err.response?.status === 404) {
        updateState({
          needsConfiguration: true,
          error: 'Integration not configured. Please contact your administrator.',
        });
      } else {
        updateState({
          error: 'Failed to load integration configuration',
        });
      }
    } finally {
      updateState({ isLoading: false });
    }
  };

  const loadLeads = async () => {
    if (!state.config?.access_token) return;

    try {
      const { data: response } = await api.get<ApiResponse<KommoLead[]>>('/integrations/kommo/leads');
      
      if (response.status === 'success' && response.data) {
        updateState({ leads: response.data, error: null });
      } else {
        throw new Error(response.message || 'Failed to load leads');
      }
    } catch (err: any) {
      console.error('Error loading leads:', err);
      updateState({
        error: err.response?.status === 404
          ? 'Leads endpoint not available. Please check your integration setup.'
          : 'Failed to load leads'
      });
    }
  };

  const setupRealTimeUpdates = () => {
    socketService.connect();

    // Subscribe to Kommo-specific updates
    const unsubscribeLeads = socketService.on('kommo:leads:update', (newLeads: KommoLead[]) => {
      updateState({ leads: newLeads });
    });

    // Subscribe to connection status
    const unsubscribeConnection = socketService.onConnectionChange((status) => {
      updateState({ isRealTimeEnabled: status });
    });

    return () => {
      unsubscribeLeads();
      unsubscribeConnection();
    };
  };

  const disconnect = async () => {
    try {
      const { data: response } = await api.post<ApiResponse<void>>('/integrations/kommo/disconnect');
      
      if (response.status === 'success') {
        updateState({
          isConnected: false,
          config: null,
          leads: [],
          error: null,
        });
      } else {
        throw new Error(response.message || 'Failed to disconnect');
      }
    } catch (err: any) {
      console.error('Error disconnecting:', err);
      updateState({
        error: 'Failed to disconnect from Kommo'
      });
    }
  };

  const connect = async () => {
    // Open OAuth popup
    const width = 600;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    
    const popup = window.open(
      'https://www.kommo.com/oauth',
      'Kommo Auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      updateState({ error: 'Popup blocked. Please allow popups and try again.' });
      return;
    }

    // Handle OAuth callback
    window.addEventListener('message', async (event) => {
      if (event.data.type === 'KOMMO_AUTH_CODE') {
        try {
          const { data: response } = await api.post<ApiResponse<KommoConfig>>('/integrations/kommo/oauth', {
            code: event.data.code
          });

          if (response.status === 'success' && response.data) {
            updateState({
              config: response.data,
              isConnected: true,
              error: null,
            });
            await loadLeads();
            setupRealTimeUpdates();
          } else {
            throw new Error(response.message || 'Failed to connect');
          }
        } catch (err: any) {
          console.error('OAuth error:', err);
          updateState({
            error: 'Failed to connect to Kommo'
          });
        }
      }
    });
  };

  useEffect(() => {
    loadConfig();
    return () => {
      socketService.disconnect();
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    refresh: loadLeads,
  };
}