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
  code?: string;
  method?: 'GET' | 'POST';
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
      
      const { data: response } = await api.get<ApiResponse<KommoConfig>>('/kommo/config');
      
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
      console.error('Error loading configuration:', err);
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
          redirectUri: `${window.location.origin}/kommo/callback`
        });

        if (response.status !== 'success') {
          throw new Error(response.message || 'Failed to exchange code for token');
        }

        await loadConfig();
        return;
      }

      // Initiate OAuth process with correct parameters
      const redirectUri = `${window.location.origin}/kommo/callback`;
      const { data: response } = await api.post<ApiResponse<{ authUrl: string }>>('/kommo/auth/init', {
        accountDomain: data.accountDomain,
        redirectUri,
        mode: 'popup'
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