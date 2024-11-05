import { useState, useEffect } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { KommoConfig, KommoLead } from '../lib/kommo';

interface KommoState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  leads: KommoLead[];
  config: KommoConfig | null;
}

interface SaveConfigData {
  clientId: string;
  clientSecret: string;
  accountDomain: string;
}

const initialState: KommoState = {
  isConnected: false,
  isLoading: true,
  error: null,
  leads: [],
  config: null,
};

export function useKommoIntegration() {
  const [state, setState] = useState<KommoState>(initialState);

  const updateState = (newState: Partial<KommoState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const loadConfig = async () => {
    try {
      updateState({ isLoading: true, error: null });
      
      const { data: response } = await api.get<ApiResponse<KommoConfig>>('/integrations/kommo/config');
      
      if (response.status === 'success') {
        const isConnected = !!response.data?.access_token;
        updateState({
          config: response.data || null,
          isConnected,
        });

        if (isConnected) {
          await loadLeads();
        }
      } else {
        throw new Error(response.message || 'Failed to load configuration');
      }
    } catch (err: any) {
      console.error('Error loading Kommo config:', err);
      updateState({
        error: err.response?.data?.message || 'Failed to load configuration'
      });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const loadLeads = async () => {
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
        error: err.response?.data?.message || 'Failed to load leads'
      });
    }
  };

  const saveConfig = async (data: SaveConfigData) => {
    try {
      // Convert camelCase to snake_case for the API
      const apiData = {
        client_id: data.clientId,
        client_secret: data.clientSecret,
        account_domain: data.accountDomain
      };

      const { data: response } = await api.post<ApiResponse<KommoConfig>>('/integrations/kommo/config', apiData);
      
      if (response.status === 'success' && response.data) {
        updateState({
          config: response.data,
          isConnected: true,
          error: null,
        });
        await loadLeads();
      } else {
        throw new Error(response.message || 'Failed to save configuration');
      }
    } catch (err: any) {
      console.error('Error saving config:', err);
      throw err;
    }
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
        error: err.response?.data?.message || 'Failed to disconnect'
      });
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return {
    ...state,
    saveConfig,
    disconnect,
    refresh: loadLeads,
  };
}