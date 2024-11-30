import axios from 'axios';
import useAuthStore from '../store/authStore';
import { ApiResponse } from '../types/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://saas-backend-production-8b94.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 30000, // Timeout de 30 segundos
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Padronizar resposta, caso necessário
    if (!response.data.status) {
      response.data = {
        status: 'success',
        data: response.data,
      };
    }
    return response;
  },
  async (error) => {
    console.error('[Response Error]', error);

    // Erro de rede
    if (!error.response) {
      return Promise.reject({
        ...error,
        response: {
          data: {
            status: 'error',
            message: 'Erro de conexão. Verifique sua internet.',
            code: 'NETWORK_ERROR',
          },
        },
      });
    }

    // Sessão expirada (401)
    if (error.response.status === 401) {
      if (!error.config?.url?.includes('/kommo/')) {
        localStorage.removeItem('auth_token');
        useAuthStore.getState().logout(false);
      }

      return Promise.reject({
        ...error,
        response: {
          data: {
            status: 'error',
            message: 'Sessão expirada. Por favor, faça login novamente.',
            code: 'AUTH_ERROR',
          },
        },
      });
    }

    // Excesso de requisições (429)
    if (error.response.status === 429) {
      return Promise.reject({
        ...error,
        response: {
          data: {
            status: 'error',
            message: 'Muitas requisições. Tente novamente em alguns minutos.',
            code: 'RATE_LIMIT_ERROR',
          },
        },
      });
    }

    // Erro de validação (400)
    if (error.response.status === 400 && error.response.data.errors) {
      const errors = Array.isArray(error.response.data.errors)
        ? error.response.data.errors
        : [{ message: 'Erro de validação' }];

      return Promise.reject({
        ...error,
        response: {
          data: {
            status: 'error',
            message: 'Erro de validação',
            code: 'VALIDATION_ERROR',
            errors,
          },
        },
      });
    }

    // Outros erros
    return Promise.reject({
      ...error,
      response: {
        data: {
          status: 'error',
          message: error.response.data?.message || 'Ocorreu um erro inesperado',
          code: error.response.data?.code || 'UNKNOWN_ERROR',
          errors: error.response.data?.errors,
        },
      },
    });
  }
);

export default api;
