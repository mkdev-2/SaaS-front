import { io, Socket } from 'socket.io-client';
import { DashboardData, DateRange } from '../types/dashboard';
import { getDefaultDateRange } from '../utils/dateUtils';

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
  private minUpdateInterval = 5000;
  private subscriptionParams: SubscriptionParams = {
    detailed: true,
    dateRange: getDefaultDateRange()
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

      this.socket = io(baseUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        query: this.getQueryParams()
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Socket initialization error:', error);
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
    }
  }

  private getQueryParams(): Record<string, string> {
    const params: Record<string, string> = {
      detailed: String(this.subscriptionParams.detailed)
    };

    if (this.subscriptionParams.dateRange) {
      const { start, end, compareStart, compareEnd, comparison } = this.subscriptionParams.dateRange;
      params.startDate = start.toISOString();
      params.endDate = end.toISOString();
      
      if (comparison) {
        params.compareStartDate = compareStart.toISOString();
        params.compareEndDate = compareEnd.toISOString();
      }
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
      if (data.status === 'success' && data.data) {
        const now = Date.now();
        if (now - this.lastDataTimestamp < this.minUpdateInterval) {
          return;
        }

        if (this.hasDataChanged(data.data)) {
          this.lastData = this.deepClone(data.data);
          this.lastDataTimestamp = now;
          this.initialDataLoaded = true;
          this.dashboardCallbacks.forEach(callback => callback({
            status: 'success',
            data: this.lastData
          }));
        }
      } else {
        console.error('Invalid dashboard update:', data);
        this.dashboardCallbacks.forEach(callback => callback({
          status: 'error',
          message: data.message || 'Failed to update dashboard data'
        }));
      }
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
    });
  }

  private emitSubscription() {
    if (this.socket?.connected) {
      const dateRange = this.subscriptionParams.dateRange || getDefaultDateRange();
      this.socket.emit('subscribe:dashboard', {
        ...this.subscriptionParams,
        dateRange: {
          ...dateRange,
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
          compareStart: dateRange.compareStart.toISOString(),
          compareEnd: dateRange.compareEnd.toISOString()
        }
      });
    }
  }

  private hasDataChanged(newData: DashboardData): boolean {
    if (!this.lastData) return true;

    const fieldsToCompare = [
      'teamPerformance.vendorStats',
      'teamPerformance.goals',
      'teamPerformance.history'
    ];

    return fieldsToCompare.some(field => {
      const newValue = this.getNestedValue(newData, field);
      const oldValue = this.getNestedValue(this.lastData, field);
      return JSON.stringify(newValue) !== JSON.stringify(oldValue);
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  private deepClone<T>(obj: T): T {
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

  updateSubscription(params: SubscriptionParams) {
    this.subscriptionParams = {
      ...this.subscriptionParams,
      ...params,
      dateRange: params.dateRange || getDefaultDateRange()
    };

    if (this.socket?.connected) {
      this.emitSubscription();
      this.requestData();
    }
  }

  onDashboardUpdate(callback: DashboardCallback) {
    this.dashboardCallbacks.add(callback);
    if (this.lastData && this.initialDataLoaded) {
      callback({
        status: 'success',
        data: this.lastData
      });
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
    const now = Date.now();
    if (this.socket?.connected && now - this.lastDataTimestamp >= this.minUpdateInterval) {
      const dateRange = this.subscriptionParams.dateRange || getDefaultDateRange();
      this.socket.emit('dashboard:request', {
        dateRange: {
          ...dateRange,
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
          compareStart: dateRange.compareStart.toISOString(),
          compareEnd: dateRange.compareEnd.toISOString()
        }
      });
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