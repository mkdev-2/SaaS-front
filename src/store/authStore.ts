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
  refresh_token: string;
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
          localStorage.removeItem('refresh_token');
        }
      },

      login: async (email: string, password: string) => {
        try {
          const { data } = await api.post<AuthResponse>('/auth/login', {
            email,
            password,
          });

          if (!data.access_token || !data.refresh_token) {
            throw new Error('Invalid response from server');
          }

          localStorage.setItem('auth_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          set({ user: data.user, isAuthenticated: true });
        } catch (error: any) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          set({ user: null, isAuthenticated: false });

          if (error.response?.status === 401) {
            throw new Error('Invalid email or password');
          }
          throw new Error('Login failed. Please try again later.');
        }
      },

      register: async (data: RegisterData) => {
        try {
          const response = await api.post<AuthResponse>('/auth/register', data);
          
          if (!response.data.access_token || !response.data.refresh_token) {
            throw new Error('Invalid response from server');
          }

          localStorage.setItem('auth_token', response.data.access_token);
          localStorage.setItem('refresh_token', response.data.refresh_token);
          set({ user: response.data.user, isAuthenticated: true });
        } catch (error: any) {
          if (error.response?.status === 409) {
            throw new Error('Email already registered');
          }
          throw new Error('Registration failed. Please try again later.');
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
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

// Initialize auth state
const initializeAuth = async () => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    try {
      await useAuthStore.getState().checkAuth();
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }
};

initializeAuth();

export default useAuthStore;