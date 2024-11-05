import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ROOT' | 'CLIENT';
  company?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  company?: string;
}

interface AuthResponse {
  access_token: string;
  user: User;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      checkAuth: async () => {
        try {
          const { data } = await api.get<User>('/auth/me');
          set({ user: data, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false });
          localStorage.removeItem('auth_token');
        }
      },

      login: async (email: string, password: string) => {
        try {
          const { data } = await api.post<AuthResponse>('/auth/login', {
            email,
            password,
          });

          if (!data.access_token) {
            throw new Error('Invalid response from server');
          }

          localStorage.setItem('auth_token', data.access_token);
          set({ user: data.user, isAuthenticated: true });
        } catch (error) {
          localStorage.removeItem('auth_token');
          set({ user: null, isAuthenticated: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        try {
          const response = await api.post<AuthResponse>('/auth/register', data);
          
          if (!response.data.access_token) {
            throw new Error('Invalid response from server');
          }

          localStorage.setItem('auth_token', response.data.access_token);
          set({ user: response.data.user, isAuthenticated: true });
        } catch (error) {
          localStorage.removeItem('auth_token');
          set({ user: null, isAuthenticated: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('auth_token');
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;