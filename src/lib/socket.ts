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

  private transformData(rawData: any): DashboardData {
    if (!rawData) return {} as DashboardData;

    const kommoData = rawData.kommo || {};
    const analytics = kommoData.analytics || {};
    const periodStats = analytics.periodStats || {};
    const dailyStats = analytics.dailyStats || {};

    return {
      projectCount: rawData.projects?.total || 0,
      recentProjects: rawData.projects?.recent || [],
      automationRules: [],
      kommoConfig: kommoData ? {
        accountDomain: kommoData.accountDomain,
        connectedAt: kommoData.connectedAt,
        isConnected: kommoData.isConnected
      } : null,
      isKommoConnected: kommoData.isConnected || false,
      kommoAnalytics: {
        currentStats: {
          totalLeads: periodStats.day?.totalLeads || 0,
          vendas: periodStats.day?.purchases || 0,
          valorVendas: periodStats.day?.totalValue || 0,
          ticketMedio: periodStats.day?.totalValue && periodStats.day?.purchases ? 
            periodStats.day.totalValue / periodStats.day.purchases : 0,
          taxaConversao: periodStats.day?.totalLeads ? 
            (periodStats.day.purchases / periodStats.day.totalLeads) * 100 : 0
        },
        comparisonStats: {
          totalLeads: periodStats.week?.totalLeads || 0,
          vendas: periodStats.week?.purchases || 0,
          valorVendas: periodStats.week?.totalValue || 0,
          ticketMedio: periodStats.week?.totalValue && periodStats.week?.purchases ? 
            periodStats.week.totalValue / periodStats.week.purchases : 0,
          taxaConversao: periodStats.week?.totalLeads ? 
            (periodStats.week.purchases / periodStats.week.totalLeads) * 100 : 0
        },
        leads: Object.entries(dailyStats).flatMap(([date, stats]: [string, any]) => 
          (stats.leads || []).map((lead: any) => ({
            id: lead.id,
            name: lead.name,
            status: lead.status,
            statusColor: lead.statusColor || '#718096',
            tipo: lead.tipo || 'novo',
            vendedor: lead.vendedor || 'Não atribuído',
            value: typeof lead.value === 'number' ? 
              lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 
              'R$ 0,00',
            created_at: date
          }))
        )
      }
    };
  }

  private getDateParams(dateRange: DateRange = getDefaultDateRange()) {
    return {
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      compareStartDate: dateRange.compareStart.toISOString(),
      compareEndDate: dateRange.compareEnd.toISOString(),
      comparison: dateRange.comparison
    };
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
      const dateParams = this.getDateParams(this.subscriptionParams.dateRange);

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

        const transformedData = this.transformData(data.data);
        
        if (this.hasDataChanged(transformedData)) {
          this.lastData = this.deepClone(transformedData);
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
      const dateParams = this.getDateParams(this.subscriptionParams.dateRange);
      this.socket.emit('subscribe:dashboard', {
        detailed: this.subscriptionParams.detailed,
        ...dateParams
      });
    }
  }

  private hasDataChanged(newData: DashboardData): boolean {
    if (!this.lastData) return true;

    const fieldsToCompare = [
      'kommoAnalytics.currentStats',
      'kommoAnalytics.leads'
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
      const dateParams = this.getDateParams(this.subscriptionParams.dateRange);
      this.socket.emit('dashboard:request', dateParams);
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