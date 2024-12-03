import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://saas-backend-production-8b94.up.railway.app',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => {
  const newToken = response.headers['x-new-token'];
  if (newToken) {
    localStorage.setItem('accessToken', newToken);
  }
  return response;
});

export default api;
