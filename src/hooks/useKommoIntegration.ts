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

interface InitiateOAuthData {
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
        const isConnected = !!response.data.access_token;
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

  const initiateOAuth = async (data: InitiateOAuthData) => {
    if (!user) {
      throw new Error('You must be logged in to connect');
    }

    const redirectUri = `${window.location.origin}/integrations/kommo/callback`;

    try {
      // Save initial configuration
      const { data: configResponse } = await api.post<ApiResponse<void>>('/integrations/kommo/config', {
        accountDomain: data.accountDomain,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        redirectUri
      });

      if (configResponse.status !== 'success') {
        throw new Error(configResponse.message || 'Failed to save configuration');
      }

      // Verify credentials and get access token
      const { data: verifyResponse } = await api.post<ApiResponse<{ accessToken: string }>>('/integrations/kommo/verify', {
        accountDomain: data.accountDomain,
        clientId: data.clientId,
        clientSecret: data.clientSecret
      });

      if (verifyResponse.status !== 'success' || !verifyResponse.data?.accessToken) {
        throw new Error('Failed to verify credentials');
      }

      // Update configuration with access token
      const { data: updateResponse } = await api.put<ApiResponse<KommoConfig>>('/integrations/kommo/config', {
        accessToken: verifyResponse.data.accessToken
      });

      if (updateResponse.status === 'success' && updateResponse.data) {
        updateState({
          config: updateResponse.data,
          isConnected: true,
          error: null
        });

        await loadLeads();
        return true;
      }

      throw new Error('Failed to update configuration');
    } catch (err: any) {
      console.error('Connection error:', err.response?.data);
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors
          .map((error: any) => `${error.field}: ${error.message}`)
          .join(', ');
        throw new Error(`Validation error: ${errorMessages}`);
      }
      throw new Error(err.response?.data?.message || 'Failed to connect to Kommo');
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
      } else {
        throw new Error(response.message || 'Failed to disconnect');
      }
    } catch (err: any) {
      console.error('Error disconnecting:', err);
      updateState({
        error: err.response?.data?.message || 'Failed to disconnect'
      });
      throw err;
    }
  };

  // Load config on mount and when user changes
  useEffect(() => {
    if (user) {
      loadConfig();
    } else {
      updateState(initialState);
    }
  }, [user]);

  // Refresh leads periodically when connected
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(loadLeads, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [state.isConnected]);

  return {
    ...state,
    initiateOAuth,
    disconnect,
    refresh: loadLeads,
  };
}