import { create } from 'zustand';
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

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
    }
  },

  register: async (data: RegisterData) => {
    try {
      const response = await api.post('/auth/register', data);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  },
}));

// Initialize auth state from token
const initializeAuth = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const response = await api.get('/auth/me');
      useAuthStore.setState({ user: response.data, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('token');
      useAuthStore.setState({ user: null, isAuthenticated: false });
    }
  }
};

initializeAuth();

export default useAuthStore;