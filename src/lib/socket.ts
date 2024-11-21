import { io, Socket } from 'socket.io-client';
import { DashboardData, DateRange } from '../types/dashboard';
import { ensureDateObjects } from '../utils/dateUtils';

type DashboardCallback = (data: any) => void;
type ConnectionCallback = (status: boolean) => void;

interface SubscriptionParams {
  detailed?: boolean;
  dateRange?: DateRange;
}

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
  private lastData: any = null;
  private lastDataTimestamp = 0;
  private minUpdateInterval = 1000;
  private subscriptionParams: SubscriptionParams = {
    detailed: true,
    dateRange: ensureDateObjects(null)
  };

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect() {
    if (this.isConnecting || this.socket?.connected) return;

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
      const dateParams = this.getDateParams();

      this.socket = io(baseUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        query: {
          ...dateParams,
          detailed: String(this.subscriptionParams.detailed)
        }
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Socket initialization error:', error);
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
    }
  }

  private getDateParams(): Record<string, string> {
    const dateRange = ensureDateObjects(this.subscriptionParams.dateRange);
    
    const params: Record<string, string> = {
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString()
    };

    if (dateRange.comparison) {
      params.compareStartDate = dateRange.compareStart.toISOString();
      params.compareEndDate = dateRange.compareEnd.toISOString();
      params.comparison = 'true';
    }

    return params;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.notifyConnectionStatus(true);
      this.emitSubscription();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
      this.handleReconnect();
    });

    this.socket.on('dashboard:update', (data: any) => {
      if (data.status === 'success') {
        const now = Date.now();
        if (now - this.lastDataTimestamp < this.minUpdateInterval) {
          return;
        }

        this.lastData = data;
        this.lastDataTimestamp = now;
        this.initialDataLoaded = true;
        this.dashboardCallbacks.forEach(callback => callback(data));
      } else {
        console.error('Invalid dashboard update:', data);
        this.dashboardCallbacks.forEach(callback => callback({
          status: 'error',
          message: data.message || 'Failed to update dashboard data'
        }));
      }
    });
  }

  private emitSubscription() {
    if (this.socket?.connected) {
      const dateParams = this.getDateParams();
      this.socket.emit('subscribe:dashboard', {
        detailed: this.subscriptionParams.detailed,
        ...dateParams
      });
    }
  }

  updateSubscription(params: SubscriptionParams) {
    if (params.dateRange) {
      params.dateRange = ensureDateObjects(params.dateRange);
    }
    
    this.subscriptionParams = {
      ...this.subscriptionParams,
      ...params
    };

    if (this.socket?.connected) {
      this.emitSubscription();
    }
  }

  requestData() {
    if (this.socket?.connected) {
      const dateParams = this.getDateParams();
      this.socket.emit('dashboard:request', dateParams);
    }
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