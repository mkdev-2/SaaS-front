import { useState, useEffect } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { KommoConfig, KommoLead } from '../lib/kommo';
import useAuthStore from '../store/authStore';

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
  const { user } = useAuthStore();

  const updateState = (newState: Partial<KommoState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const loadConfig = async () => {
    if (!user) {
      updateState({ isLoading: false });
      return;
    }

    try {
      updateState({ isLoading: true, error: null });
      
      const { data: response } = await api.get<ApiResponse<KommoConfig>>('/integrations/kommo/config');
      
      if (response.status === 'success' && response.data) {
        const isConnected = !!response.data.account_domain && 
                          !!response.data.client_id && 
                          !!response.data.client_secret;
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
    if (!state.isConnected) return;

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
    if (!user) {
      throw new Error('You must be logged in to save configuration');
    }

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
    if (!user) return;

    try {
      const { data: response } = await api.delete<ApiResponse<void>>('/integrations/kommo/config');
      
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
    if (user) {
      loadConfig();
    } else {
      updateState(initialState);
    }
  }, [user]);

  return {
    ...state,
    saveConfig,
    disconnect,
    refresh: loadLeads,
  };
}