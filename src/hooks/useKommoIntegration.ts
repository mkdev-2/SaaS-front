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
      updateState({
        isConnected: false,
        config: null,
        error: err.response?.status !== 404 ? (err.response?.data?.message || 'Falha ao carregar configuração') : null
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
      updateState({
        error: err.response?.data?.message || 'Falha ao carregar leads'
      });
    }
  };

  const initiateOAuth = async (data: InitiateOAuthData) => {
    if (!user) {
      throw new Error('Você precisa estar logado para conectar');
    }

    try {
      updateState({ isLoading: true, error: null });

      // Se temos um código, trocar por token
      if (data.code) {
        const { data: response } = await api.post<ApiResponse<void>>('/integrations/kommo/auth/callback', {
          code: data.code,
          accountDomain: data.accountDomain,
          clientId: data.clientId,
          redirectUri: data.redirectUri
        });

        if (response.status !== 'success') {
          throw new Error(response.message || 'Falha ao trocar código por token');
        }

        await loadConfig();
        return;
      }

      // Salvar configuração inicial
      const { data: response } = await api.post<ApiResponse<void>>('/integrations/kommo/config', {
        accountDomain: data.accountDomain,
        clientId: data.clientId,
        redirectUri: data.redirectUri
      });

      if (response.status !== 'success') {
        throw new Error(response.message || 'Falha ao salvar configuração');
      }

      return true;
    } catch (err: any) {
      console.error('Erro OAuth:', err);
      
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors
          .map((error: any) => error.message)
          .join(', ');
        throw new Error(`Erro de validação: ${errorMessages}`);
      }
      
      throw new Error(err.response?.data?.message || 'Falha ao conectar ao Kommo');
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
        throw new Error(response.message || 'Falha ao desconectar');
      }
    } catch (err: any) {
      console.error('Erro ao desconectar:', err);
      updateState({
        error: err.response?.data?.message || 'Falha ao desconectar'
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