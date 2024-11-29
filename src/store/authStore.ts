import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { ApiResponse, AuthData } from '../types/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ROOT' | 'CLIENT';
  company?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: (callApi?: boolean) => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  company?: string;
}

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: async (email, password) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/auth/login`, // URL corrigida
        { email, password }
      );

      const { token, user } = response.data;

      set({ user, token }); // Atualiza o estado global

      return token; // Retorna o token para ser salvo no localStorage
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to log in');
    }
  },
  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('accessToken');
  },
}));

export default useAuthStore;