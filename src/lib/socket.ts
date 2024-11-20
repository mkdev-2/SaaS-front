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

    // Handle the current data structure from backend
    const currentStats = rawData.data?.currentStats || {};
    const vendorStats = currentStats.vendedores || {};

    return {
      projectCount: 0,
      recentProjects: [],
      automationRules: [],
      kommoConfig: {
        accountDomain: rawData.data?.kommo?.accountDomain || '',
        connectedAt: rawData.data?.kommo?.connectedAt || '',
        isConnected: rawData.data?.kommo?.isConnected || false
      },
      isKommoConnected: rawData.data?.kommo?.isConnected || false,
      teamPerformance: {
        vendorStats: Object.entries(vendorStats).reduce((acc: any, [name, data]: [string, any]) => {
          acc[name] = {
            totalLeads: data.totalLeads || 0,
            activeLeads: data.activeLeads || 0,
            proposals: data.proposals || 0,
            sales: data.sales || 0,
            revenue: data.valorVendas || 'R$ 0,00',
            averageTicket: data.valorMedioVenda || 'R$ 0,00',
            conversionRate: data.taxaConversao || '0%',
            proposalRate: data.taxaPropostas || '0%'
          };
          return acc;
        }, {}),
        history: [],
        goals: {
          monthly: { leads: 0, sales: 0, revenue: 0 },
          completion: { leads: '0%', sales: '0%', revenue: '0%' }
        }
      },
      kommoAnalytics: {
        stats: {
          totalLeads: currentStats.totalLeads || 0,
          vendas: currentStats.totalVendas || 0,
          valorVendas: this.parseCurrency(currentStats.valorTotal),
          ticketMedio: this.parseCurrency(currentStats.ticketMedio),
          taxaConversao: this.parsePercentage(currentStats.taxaConversao)
        },
        comparisonStats: rawData.data?.comparisonStats,
        leads: (currentStats.leads || []).map((lead: any) => ({
          id: lead.id,
          name: lead.nome,
          status: lead.status,
          statusColor: lead.statusCor,
          tipo: 'novo',
          vendedor: lead.vendedor,
          value: lead.valor,
          created_at: lead.created_at
        })),
        vendorStats: vendorStats,
        personaStats: {},
        sourceStats: {}
      }
    };
  }

  private parseCurrency(value: string): number {
    if (!value) return 0;
    return parseFloat(value.replace('R$ ', '').replace('.', '').replace(',', '.')) || 0;
  }

  private parsePercentage(value: string): number {
    if (!value) return 0;
    return parseFloat(value.replace('%', '')) || 0;
  }

  private getDateParams(dateRange: DateRange = getDefaultDateRange()) {
    return {
      date: dateRange.start.toISOString().split('T')[0],
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      compareStartDate: dateRange.comparison ? dateRange.compareStart.toISOString() : undefined,
      compareEndDate: dateRange.comparison ? dateRange.compareEnd.toISOString() : undefined,
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
      if (data.status === 'success') {
        const now = Date.now();
        if (now - this.lastDataTimestamp < this.minUpdateInterval) {
          return;
        }

        const transformedData = this.transformData(data);
        
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
      'kommoAnalytics.stats',
      'kommoAnalytics.leads',
      'kommoAnalytics.vendorStats',
      'kommoAnalytics.personaStats',
      'kommoAnalytics.sourceStats',
      'teamPerformance.vendorStats',
      'teamPerformance.history',
      'teamPerformance.goals'
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