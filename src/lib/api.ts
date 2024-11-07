import axios from 'axios';
import useAuthStore from '../store/authStore';
import { ApiResponse } from '../types/api';

const api = axios.create({
  baseURL: 'https://saas-backend-production-8b94.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 30000,
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
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (!response.data.status) {
      response.data = {
        status: 'success',
        data: response.data,
      };
    }
    return response;
  },
  async (error) => {
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

    if (error.response?.status === 401) {
      if (!error.config?.url?.includes('/kommo/')) {
        localStorage.removeItem('auth_token');
        useAuthStore.getState().logout(false);
      }
      
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: {
            status: 'error',
            message: 'Sessão expirada. Por favor, faça login novamente.',
            code: 'AUTH_ERROR',
          },
        },
      });
    }

    if (error.response?.status === 429) {
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: {
            status: 'error',
            message: 'Muitas requisições. Tente novamente em alguns minutos.',
            code: 'RATE_LIMIT_ERROR',
          },
        },
      });
    }

    if (error.response?.status === 400 && error.response?.data?.errors) {
      const errors = Array.isArray(error.response.data.errors) 
        ? error.response.data.errors 
        : [{ message: 'Validação falhou' }];

      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: {
            status: 'error',
            message: 'Erro de validação',
            code: 'VALIDATION_ERROR',
            errors: errors,
          },
        },
      });
    }

    if (error.response?.data) {
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: {
            status: 'error',
            message: error.response.data.message || 'Ocorreu um erro inesperado',
            code: error.response.data.code || 'UNKNOWN_ERROR',
            errors: error.response.data.errors,
          },
        },
      });
    }

    return Promise.reject({
      ...error,
      response: {
        ...error.response,
        data: {
          status: 'error',
          message: 'Ocorreu um erro inesperado',
          code: 'UNKNOWN_ERROR',
        },
      },
    });
  }
);

export default api;