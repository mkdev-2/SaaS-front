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
          error: null
        });

        if (isConnected) {
          await loadLeads();
        }
      } else {
        // No configuration found - this is not an error state
        updateState({
          isConnected: false,
          config: null,
          error: null
        });
      }
    } catch (err: any) {
      console.error('Error loading Kommo config:', err);
      // Only set error if it's not a 404 (no config found)
      if (err.response?.status !== 404) {
        updateState({
          isConnected: false,
          config: null,
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
      if (err.response?.status === 401) {
        // Token expired or invalid - mark as disconnected
        updateState({
          isConnected: false,
          error: 'Session expired. Please reconnect to Kommo.'
        });
      } else {
        updateState({
          error: err.response?.data?.message || 'Failed to load leads'
        });
      }
    }
  };

  const initiateOAuth = async (data: InitiateOAuthData) => {
    if (!user) {
      throw new Error('You must be logged in to connect');
    }

    try {
      updateState({ isLoading: true, error: null });

      // First, validate and save the configuration
      const { data: configResponse } = await api.post<ApiResponse<KommoConfig>>('/integrations/kommo/config', {
        accountDomain: data.accountDomain,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        redirectUri: `${window.location.origin}/integrations/kommo/callback`
      });

      if (configResponse.status !== 'success' || !configResponse.data) {
        throw new Error(configResponse.message || 'Failed to save configuration');
      }

      // Then verify credentials and get access token
      const { data: authResponse } = await api.post<ApiResponse<KommoConfig>>('/integrations/kommo/auth', {
        accountDomain: data.accountDomain,
        clientId: data.clientId,
        clientSecret: data.clientSecret
      });

      if (authResponse.status === 'success' && authResponse.data) {
        updateState({
          config: authResponse.data,
          isConnected: true,
          error: null
        });

        await loadLeads();
        return true;
      }

      throw new Error(authResponse.message || 'Failed to authenticate with Kommo');
    } catch (err: any) {
      console.error('Connection error:', err);
      
      // Handle validation errors
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors
          .map((error: any) => `${error.field}: ${error.message}`)
          .join(', ');
        throw new Error(`Validation error: ${errorMessages}`);
      }

      // Handle authentication errors
      if (err.response?.status === 401) {
        throw new Error('Invalid credentials');
      }

      // Handle other errors
      throw new Error(err.response?.data?.message || 'Failed to connect to Kommo');
    } finally {
      updateState({ isLoading: false });
    }
  };

  const disconnect = async () => {
    if (!user) return;

    try {
      updateState({ isLoading: true, error: null });

      const { data: response } = await api.delete<ApiResponse<void>>('/integrations/kommo/config');
      
      if (response.status === 'success') {
        updateState({
          isConnected: false,
          config: null,
          leads: [],
          error: null
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
    } finally {
      updateState({ isLoading: false });
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