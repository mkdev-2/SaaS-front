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
  private connectionTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect() {
    if (this.socket?.connected || this.isConnecting) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    this.isConnecting = true;

    try {
      this.socket = io('https://saas-backend-production-8b94.up.railway.app', {
        auth: {
          token
        },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        forceNew: true,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Socket connection error:', error);
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.notifyConnectionStatus(true);
      
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      this.socket?.emit('subscribe:dashboard');
    });

    this.socket.on('dashboard:update', (data: DashboardStats) => {
      this.dashboardCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
      this.handleReconnect();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
    });

    this.connectionTimeout = setTimeout(() => {
      if (!this.socket?.connected) {
        console.log('Connection timeout, falling back to polling');
        this.isConnecting = false;
        this.notifyConnectionStatus(false);
      }
    }, 5000);
  }

  private handleReconnect() {
    this.reconnectAttempts++;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.disconnect();
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
    this.isConnecting = false;
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
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