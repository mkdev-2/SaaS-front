import { create } from 'zustand';
import axios from 'axios';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: async (email, password) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/auth/login`,
        { email, password }
      );

      const { token, user } = response.data;

      // Atualizar o estado global
      set({ user, token });

      // Salvar o token no localStorage
      localStorage.setItem('accessToken', token);

      return token; // Retorna o token para uso adicional, se necessário
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
