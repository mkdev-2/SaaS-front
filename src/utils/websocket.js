
import { io } from 'socket.io-client';

const socket = io(process.env.VITE_WS_URL || 'https://saas-backend-production-8b94.up.railway.app', {
  withCredentials: true,
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('kommo:connected', (data) => {
  console.log('Kommo connected:', data);
});

socket.on('kommo:disconnected', () => {
  console.warn('Kommo disconnected');
});

export default socket;
