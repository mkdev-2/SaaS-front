import axios, { AxiosError } from 'axios';
import { ApiResponse } from '../types/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
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
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<any>>) => {
    const status = error.response?.status;
    const errorResponse = error.response?.data;
    
    if (status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
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
            code: errorResponse.code,
            errors: errorResponse.errors,
          },
        },
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;