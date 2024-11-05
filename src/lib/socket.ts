import { io, Socket } from 'socket.io-client';
import { DashboardStats } from '../types/dashboard';

type DashboardCallback = (data: DashboardStats) => void;
type ConnectionCallback = (status: boolean) => void;

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private dashboardCallbacks: Set<DashboardCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No auth token found, skipping socket connection');
      this.notifyConnectionStatus(false);
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');

    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      this.notifyConnectionStatus(true);
      this.socket?.emit('subscribe:dashboard');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.notifyConnectionStatus(false);
      this.handleReconnect();
    });

    this.socket.on('dashboard:update', (data: DashboardStats) => {
      this.dashboardCallbacks.forEach(callback => callback(data));
    });
  }

  private handleReconnect() {
    this.notifyConnectionStatus(false);

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 5000);

      this.reconnectTimer = setTimeout(() => {
        if (!this.socket?.connected) {
          this.connect();
        }
      }, delay);
    }
  }

  onDashboardUpdate(callback: DashboardCallback) {
    this.dashboardCallbacks.add(callback);
    return () => this.dashboardCallbacks.delete(callback);
  }

  onConnectionChange(callback: ConnectionCallback) {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  private notifyConnectionStatus(status: boolean) {
    this.connectionCallbacks.forEach(callback => callback(status));
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }

    this.dashboardCallbacks.clear();
    this.connectionCallbacks.clear();
    this.reconnectAttempts = 0;
    this.notifyConnectionStatus(false);
  }
}

export const socketService = SocketService.getInstance();
export default socketService;