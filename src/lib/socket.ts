import { io, Socket } from 'socket.io-client';
import { DashboardData } from '../types/dashboard';

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
  private lastDataTimestamp: number = 0;
  private minUpdateInterval = 5000; // Minimum time between updates in milliseconds
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
      this.requestData();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
      this.handleReconnect();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
      this.handleReconnect();
    });

    this.socket.on('dashboard:update', (data: any) => {
      const now = Date.now();
      if (now - this.lastDataTimestamp < this.minUpdateInterval) {
        return; // Ignore updates that come too quickly
      }

      if (data.status === 'success' && data.data) {
        // Deep compare relevant data to prevent unnecessary updates
        const hasChanged = this.hasDataChanged(data.data, this.lastData);
        
        if (hasChanged || !this.initialDataLoaded) {
          this.lastData = this.deepClone(data.data);
          this.lastDataTimestamp = now;
          this.initialDataLoaded = true;
          this.dashboardCallbacks.forEach(callback => callback(data));
        }
      } else {
        console.error('Invalid dashboard update:', data);
      }
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
    });
  }

  private hasDataChanged(newData: any, oldData: any): boolean {
    if (!oldData) return true;
    
    // Compare specific fields that matter for updates
    const fieldsToCompare = [
      'teamPerformance',
      'kommoAnalytics.periodStats',
      'kommoAnalytics.dailyStats'
    ];

    return fieldsToCompare.some(field => {
      const newValue = this.getNestedValue(newData, field);
      const oldValue = this.getNestedValue(oldData, field);
      return JSON.stringify(newValue) !== JSON.stringify(oldValue);
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  private deepClone(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  private handleReconnect() {
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
      this.requestData();
    }
  }

  onDashboardUpdate(callback: DashboardCallback) {
    this.dashboardCallbacks.add(callback);
    if (this.lastData && this.initialDataLoaded) {
      callback({ status: 'success', data: this.lastData });
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

  requestData() {
    if (this.socket?.connected) {
      const now = Date.now();
      if (now - this.lastDataTimestamp >= this.minUpdateInterval) {
        this.socket.emit('dashboard:request');
      }
    }
  }

  disconnect() {
    this.isConnecting = false;
    this.initialDataLoaded = false;
    this.lastData = null;
    this.lastDataTimestamp = 0;
    
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