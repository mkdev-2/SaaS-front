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
        updateState({
          isConnected: false,
          config: null,
          error: null
        });
      }
    } catch (err: any) {
      console.error('Error loading Kommo config:', err);
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

      // Get OAuth URL from backend
      const { data: response } = await api.post<ApiResponse<{ authUrl: string }>>('/integrations/kommo/oauth/init', {
        accountDomain: data.accountDomain,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        redirectUri: `${window.location.origin}/integrations/kommo/callback`
      });

      if (response.status === 'success' && response.data?.authUrl) {
        // Open OAuth popup
        const width = 600;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          response.data.authUrl,
          'Kommo OAuth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        // Poll for popup closure and OAuth completion
        return new Promise<void>((resolve, reject) => {
          const checkInterval = setInterval(async () => {
            if (popup.closed) {
              clearInterval(checkInterval);
              
              try {
                // Check if connection was successful
                const { data: statusResponse } = await api.get<ApiResponse<KommoConfig>>('/integrations/kommo/config');
                
                if (statusResponse.status === 'success' && statusResponse.data?.access_token) {
                  updateState({
                    config: statusResponse.data,
                    isConnected: true,
                    error: null
                  });
                  resolve();
                } else {
                  reject(new Error('OAuth connection failed'));
                }
              } catch (err) {
                reject(err);
              }
            }
          }, 500);

          // Timeout after 5 minutes
          setTimeout(() => {
            clearInterval(checkInterval);
            popup.close();
            reject(new Error('OAuth connection timed out'));
          }, 5 * 60 * 1000);
        });
      }

      throw new Error(response.message || 'Failed to initiate OAuth connection');
    } catch (err: any) {
      console.error('OAuth error:', err);
      
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors
          .map((error: any) => `${error.field}: ${error.message}`)
          .join(', ');
        throw new Error(`Validation error: ${errorMessages}`);
      }

      throw new Error(err.message || 'Failed to connect to Kommo');
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

  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(loadLeads, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [state.isConnected]);

  return {
    ...state,
    initiateOAuth,
    disconnect,
    refresh: loadLeads,
  };
}