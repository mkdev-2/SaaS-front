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
  accountDomain: string;
  clientId: string;
  clientSecret: string;
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
      
      if (response.status === 'success' && response.data) {
        const isConnected = !!response.data?.access_token;
        updateState({
          config: response.data,
          isConnected,
        });

        if (isConnected) {
          await loadLeads();
        }
      }
    } catch (err: any) {
      console.error('Error loading Kommo config:', err);
      // Don't set error if it's a 404 (config not found)
      if (err.response?.status !== 404) {
        updateState({
          error: err.response?.data?.message || 'Failed to load configuration'
        });
      }
    } finally {
      updateState({ isLoading: false });
    }
  };

  const loadLeads = async () => {
    try {
      const { data: response } = await api.get<ApiResponse<KommoLead[]>>('/integrations/kommo/leads');
      
      if (response.status === 'success' && response.data) {
        updateState({ leads: response.data, error: null });
      }
    } catch (err: any) {
      console.error('Error loading leads:', err);
      updateState({
        error: err.response?.data?.message || 'Failed to load leads'
      });
    }
  };

  const saveConfig = async (data: SaveConfigData) => {
    if (!data.accountDomain || !data.clientId || !data.clientSecret) {
      throw new Error('All fields are required');
    }

    try {
      const { data: response } = await api.post<ApiResponse<KommoConfig>>('/integrations/kommo/config', {
        accountDomain: data.accountDomain,
        clientId: data.clientId,
        clientSecret: data.clientSecret
      });
      
      if (response.status === 'success' && response.data) {
        updateState({
          config: response.data,
          isConnected: true,
          error: null,
        });
        await loadLeads();
      }
    } catch (err: any) {
      console.error('Save config error:', err.response?.data);
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors
          .map((error: any) => `${error.field}: ${error.message}`)
          .join(', ');
        throw new Error(`Validation error: ${errorMessages}`);
      }
      throw new Error(err.response?.data?.message || 'Failed to save configuration');
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