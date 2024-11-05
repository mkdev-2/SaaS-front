import axios, { AxiosError } from 'axios';
import useAuthStore from '../store/authStore';

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
    if (token && config.headers) {
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
  async (error: AxiosError) => {
    const originalRequest: any = error.config;
    
    // Handle specific auth errors
    if (error.response?.data) {
      const errorCode = error.response.data.code;
      
      // Handle invalid token
      if (errorCode === 'AUTH_INVALID_TOKEN' && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh the token
          const response = await api.post('/auth/refresh');
          const { access_token } = response.data;
          
          if (!access_token) {
            throw new Error('No token received');
          }

          // Update token in localStorage
          localStorage.setItem('auth_token', access_token);
          
          // Update Authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          
          return axios(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear auth but don't redirect
          localStorage.removeItem('auth_token');
          useAuthStore.getState().logout();
          return Promise.reject(refreshError);
        }
      }
      
      // Handle no token
      if (errorCode === 'AUTH_NO_TOKEN') {
        localStorage.removeItem('auth_token');
        useAuthStore.getState().logout();
      }
    }

    // Pass the error through to be handled by components
    return Promise.reject(error);
  }
);

export default api;