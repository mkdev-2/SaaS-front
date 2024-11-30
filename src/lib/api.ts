import axios from 'axios';
import useAuthStore from '../store/authStore';
import { ApiResponse } from '../types/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://saas-backend-production-8b94.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
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
  (response) => response,
  async (error) => {
    console.error('[Response Error]', error);

    if (!error.response) {
      // Erro de conexão
      return Promise.reject(new Error('Erro de conexão com o servidor.'));
    }

    if (error.response.status === 401) {
      // Sessão expirada
      localStorage.removeItem('accessToken');
      useAuthStore.getState().logout(false);
      return Promise.reject(new Error('Sessão expirada. Faça login novamente.'));
    }

    // Retornar mensagem padrão para outros erros
    return Promise.reject(
      new Error(error.response.data?.message || 'Erro desconhecido.')
    );
  }
);

export default api;
