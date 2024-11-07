import { useState, useEffect } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { KommoConfig, KommoLead } from '../lib/kommo/types';
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
  clientSecret?: string;
  redirectUri: string;
  code?: string;
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
      
      // Get Kommo configuration
      const { data: response } = await api.get<ApiResponse<KommoConfig>>('/integrations/kommo/config');
      
      if (response.status === 'success' && response.data) {
        updateState({
          config: response.data,
          isConnected: response.data.isConnected,
          error: null
        });

        if (response.data.isConnected) {
          await loadLeads();
        }
      } else {
        updateState({
          isConnected: false,
          config: null,
          error: null
        });
      }
    } catch (err: any) {
      console.error('Error loading Kommo config:', err);
      updateState({
        isConnected: false,
        config: null,
        error: err.response?.status !== 404 ? (err.response?.data?.message || 'Failed to load configuration') : null
      });
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

    try {
      updateState({ isLoading: true, error: null });

      // If we have a code, exchange it for a token
      if (data.code) {
        const { data: response } = await api.post<ApiResponse<void>>('/integrations/kommo/auth/callback', {
          code: data.code,
          accountDomain: data.accountDomain,
          clientId: data.clientId,
          redirectUri: data.redirectUri
        });

        if (response.status !== 'success') {
          throw new Error(response.message || 'Failed to exchange code for token');
        }

        await loadConfig();
        return;
      }

      // Otherwise, just save the initial config
      const { data: response } = await api.post<ApiResponse<void>>('/integrations/kommo/config', {
        accountDomain: data.accountDomain,
        clientId: data.clientId,
        redirectUri: data.redirectUri
      });

      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to save configuration');
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      throw err;
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

  useEffect(() => {
    if (user) {
      loadConfig();
    } else {
      updateState(initialState);
    }
  }, [user]);

  return {
    ...state,
    initiateOAuth,
    disconnect,
    refresh: loadConfig,
  };
}