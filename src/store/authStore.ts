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
  logout: () => void;
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

      login: async (email: string, password: string) => {
        try {
          const { data } = await api.post<AuthResponse>('/auth/login', {
            email,
            password,
          });

          localStorage.setItem('auth_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          set({ user: data.user, isAuthenticated: true });
        } catch (error: any) {
          if (error.response?.status === 401) {
            throw new Error('Invalid credentials');
          }
          throw new Error('Login failed. Please try again.');
        }
      },

      register: async (data: RegisterData) => {
        try {
          const response = await api.post<AuthResponse>('/auth/register', data);
          
          localStorage.setItem('auth_token', response.data.access_token);
          localStorage.setItem('refresh_token', response.data.refresh_token);
          set({ user: response.data.user, isAuthenticated: true });
        } catch (error: any) {
          if (error.response?.status === 409) {
            throw new Error('User already exists');
          }
          throw new Error('Registration failed. Please try again.');
        }
      },

      logout: async () => {
        try {
          // Notify the server to invalidate the refresh token
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

// Initialize auth state from token
const initializeAuth = async () => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    try {
      const { data } = await api.get<User>('/auth/me');
      useAuthStore.setState({ user: data, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      useAuthStore.setState({ user: null, isAuthenticated: false });
    }
  }
};

initializeAuth();

export default useAuthStore;