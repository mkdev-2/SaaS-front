
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://saas-backend-production-8b94.up.railway.app',
});

export default api;
