import axios, { AxiosError } from 'axios';
import { ApiResponse } from '../types/api';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: 'https://saas-backend-production-8b94.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 second timeout
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Ensure response data follows ApiResponse format
    if (!response.data.status) {
      response.data = {
        status: 'success',
        data: response.data,
      };
    }
    return response;
  },
  async (error: AxiosError<ApiResponse<any>>) => {
    const status = error.response?.status;
    const errorResponse = error.response?.data;
    
    // Handle network errors
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

    // Handle authentication errors
    if (status === 401) {
      // Only logout if it's not a Kommo API error
      if (!error.config?.url?.includes('/kommo/')) {
        localStorage.removeItem('auth_token');
        useAuthStore.getState().logout(false); // Pass false to prevent API call
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

    // Handle rate limiting
    if (status === 429) {
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

    // Handle validation errors
    if (status === 400 && errorResponse?.errors) {
      const errors = Array.isArray(errorResponse.errors) 
        ? errorResponse.errors 
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

    // Transform error response to match our ApiResponse format
    if (errorResponse) {
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: {
            status: 'error',
            message: errorResponse.message || 'An unexpected error occurred',
            code: errorResponse.code || 'UNKNOWN_ERROR',
            errors: errorResponse.errors,
          },
        },
      });
    }
    
    // Handle all other errors
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