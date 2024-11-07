import axios from 'axios';
import { ApiResponse } from '../types/api';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: 'https://saas-backend-production-8b94.up.railway.app/api/integrations',
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
            message: 'Network error. Please check your connection.',
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
            message: 'Session expired. Please login again.',
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
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_ERROR',
          },
        },
      });
    }

    if (error.response?.status === 400 && error.response?.data?.errors) {
      const errors = Array.isArray(error.response.data.errors) 
        ? error.response.data.errors 
        : [{ message: 'Validation failed' }];

      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: {
            status: 'error',
            message: 'Validation error',
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
            message: error.response.data.message || 'An unexpected error occurred',
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
          message: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
        },
      },
    });
  }
);

export default api;