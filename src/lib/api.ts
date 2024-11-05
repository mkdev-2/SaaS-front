import axios, { AxiosError } from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

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
        if (isRefreshing) {
          // If refresh is in progress, queue the request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => axios(originalRequest))
            .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

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
          
          // Process queued requests
          processQueue();
          
          return axios(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear auth and redirect to login
          processQueue(refreshError);
          localStorage.removeItem('auth_token');
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      
      // Handle no token
      if (errorCode === 'AUTH_NO_TOKEN') {
        localStorage.removeItem('auth_token');
        useAuthStore.getState().logout();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    // Handle 401 errors not caught above
    if (error.response?.status === 401 && 
        !window.location.pathname.includes('/login') && 
        !window.location.pathname.includes('/register')) {
      localStorage.removeItem('auth_token');
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;