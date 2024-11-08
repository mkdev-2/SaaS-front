import { useState, useEffect } from 'react';
import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { KommoConfig, KommoLead, KommoStatus } from '../lib/kommo/types';
import useAuthStore from '../store/authStore';

interface KommoState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  leads: KommoLead[];
  config: KommoConfig | null;
  status: KommoStatus | null;
}

interface InitiateOAuthData {
  accountDomain: string;
  code?: string;
  state?: string;
  redirectUri: string;
}

const initialState: KommoState = {
  isConnected: false,
  isLoading: true,
  error: null,
  leads: [],
  config: null,
  status: null
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
      
      const [configResponse, statusResponse] = await Promise.all([
        api.get<ApiResponse<KommoConfig>>('/kommo/config'),
        api.get<ApiResponse<KommoStatus>>('/kommo/status')
      ]);
      
      if (configResponse.data.status === 'success' && configResponse.data.data) {
        const config = configResponse.data.data;
        const status = statusResponse.data.status === 'success' ? statusResponse.data.data : null;
        
        updateState({
          config,
          status,
          isConnected: config.isConnected && status?.isConnected,
          error: null
        });

        if (config.isConnected && status?.isConnected) {
          await loadLeads();
        }
      } else {
        updateState({
          isConnected: false,
          config: null,
          status: null,
          error: null
        });
      }
    } catch (err: any) {
      console.error('Error loading configuration:', err);
      updateState({
        isConnected: false,
        config: null,
        status: null,
        error: err.response?.status !== 404 ? (err.response?.data?.message || 'Failed to load configuration') : null
      });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const loadLeads = async () => {
    if (!state.isConnected) return;

    try {
      const { data: response } = await api.get<ApiResponse<KommoLead[]>>('/kommo/leads');
      
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

      // Handle OAuth code exchange
      if (data.code) {
        const { data: response } = await api.post<ApiResponse<void>>('/kommo/auth/callback', {
          code: data.code,
          accountDomain: data.accountDomain,
          state: data.state,
          redirectUri: data.redirectUri
        });

        if (response.status !== 'success') {
          throw new Error(response.message || 'Failed to exchange code for token');
        }

        await loadConfig();
        return;
      }

      // Initiate OAuth process
      const { data: response } = await api.post<ApiResponse<{ authUrl: string }>>('/kommo/auth/init', {
        accountDomain: data.accountDomain,
        redirectUri: data.redirectUri
      });

      if (response.status !== 'success' || !response.data?.authUrl) {
        throw new Error(response.message || 'Failed to initiate authentication');
      }

      return {
        authUrl: response.data.authUrl
      };
    } catch (err: any) {
      console.error('OAuth Error:', err);
      
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors
          .map((error: any) => error.message)
          .join(', ');
        throw new Error(`Validation error: ${errorMessages}`);
      }
      
      throw new Error(err.response?.data?.message || 'Failed to connect to Kommo');
    } finally {
      updateState({ isLoading: false });
    }
  };

  const disconnect = async () => {
    if (!user) return;

    try {
      updateState({ isLoading: true, error: null });

      const { data: response } = await api.delete<ApiResponse<void>>('/kommo/config');
      
      if (response.status === 'success') {
        updateState({
          isConnected: false,
          config: null,
          status: null,
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