import { io, Socket } from 'socket.io-client';
import { DashboardData } from '../types/dashboard';
import useAuthStore from '../store/authStore';

type DashboardCallback = (data: any) => void;
type ConnectionCallback = (status: boolean) => void;

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private dashboardCallbacks: Set<DashboardCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private initialDataLoaded = false;
  private subscriptionParams = {
    detailed: true,
    period: 15
  };
  private lastData: any = null;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect() {
    if (this.isConnecting || this.socket?.connected) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.notifyConnectionStatus(false);
      return;
    }

    this.isConnecting = true;

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');

      this.socket = io(baseUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        query: this.subscriptionParams
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Socket initialization error:', error);
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.notifyConnectionStatus(true);
      this.socket?.emit('subscribe:dashboard', this.subscriptionParams);
      this.socket?.emit('dashboard:request');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnecting = false;
      
      if (error.message.includes('authentication')) {
        useAuthStore.getState().logout();
      } else {
        this.handleReconnect();
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnecting = false;
      this.notifyConnectionStatus(false);

      if (reason === 'io server disconnect') {
        useAuthStore.getState().logout();
      } else {
        this.handleReconnect();
      }
    });

    this.socket.on('dashboard:update', (data: any) => {
      if (data.status === 'success' && data.data) {
        this.lastData = data;
        this.initialDataLoaded = true;
        this.dashboardCallbacks.forEach(callback => callback(data));
      } else {
        console.error('Invalid dashboard update:', data);
      }
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
      this.isConnecting = false;
      if (error.message.includes('authentication')) {
        useAuthStore.getState().logout();
      }
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
        if (!this.socket?.connected && !this.isConnecting) {
          this.connect();
        }
      }, delay);
    }
  }

  updateSubscription(params: { detailed?: boolean; period?: number }) {
    this.subscriptionParams = {
      ...this.subscriptionParams,
      ...params
    };

    if (this.socket?.connected) {
      this.socket.emit('subscribe:dashboard', this.subscriptionParams);
      this.socket.emit('dashboard:request');
    }
  }

  onDashboardUpdate(callback: DashboardCallback) {
    this.dashboardCallbacks.add(callback);
    if (this.lastData && this.initialDataLoaded) {
      callback(this.lastData);
    }
    return () => this.dashboardCallbacks.delete(callback);
  }

  onConnectionChange(callback: ConnectionCallback) {
    this.connectionCallbacks.add(callback);
    callback(!!this.socket?.connected);
    return () => this.connectionCallbacks.delete(callback);
  }

  private notifyConnectionStatus(status: boolean) {
    this.connectionCallbacks.forEach(callback => callback(status));
  }

  disconnect() {
    this.isConnecting = false;
    this.lastData = null;
    this.initialDataLoaded = false;
    
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

  requestData() {
    if (this.socket?.connected) {
      this.socket.emit('dashboard:request');
    }
  }
}

export const socketService = SocketService.getInstance();
export default socketService;