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

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      checkAuth: async () => {
        try {
          const { data: response } = await api.get<ApiResponse<User>>('/auth/me');
          if (response.status === 'success' && response.data) {
            set({ user: response.data, isAuthenticated: true });
          } else {
            throw new Error(response.message || 'Authentication failed');
          }
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
          localStorage.removeItem('auth_token');
          throw error;
        }
      },

      login: async (email: string, password: string) => {
        try {
          const { data: response } = await api.post<ApiResponse<AuthData>>('/auth/login', {
            email,
            password,
          });

          if (response.status === 'success' && response.data) {
            const { token, user } = response.data;
            localStorage.setItem('auth_token', token);
            set({ user, token, isAuthenticated: true });
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
          }
          throw new Error('Failed to connect to the server');
        }
      },

      register: async (data: RegisterData) => {
        try {
          const { data: response } = await api.post<ApiResponse<AuthData>>('/auth/register', data);
          
          if (response.status === 'success' && response.data) {
            const { token, user } = response.data;
            localStorage.setItem('auth_token', token);
            set({ user, token, isAuthenticated: true });
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        } catch (error: any) {
          if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
          }
          throw new Error('Failed to connect to the server');
        }
      },

      logout: async (callApi = true) => {
        try {
          if (callApi) {
            const { data: response } = await api.post<ApiResponse<void>>('/auth/logout');
            if (response.status !== 'success') {
              console.error('Logout error:', response.message);
            }
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('auth_token');
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;