import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://saas-backend-production-8b94.up.railway.app',
});

// Adiciona o token ao cabeçalho de cada requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken'); // Certifique-se de que o token está salvo no LocalStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
