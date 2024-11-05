export interface DashboardStats {
    totalIntegrations: number;
    activeWorkflows: number;
    apiCalls: number;
    totalUsers: number;
    recentWorkflows: WorkflowStatus[];
    integrationHealth: IntegrationHealth[];
  }
  
  export interface WorkflowStatus {
    id: string;
    name: string;
    lastRun: string;
    status: 'active' | 'failed' | 'completed';
    type: string;
  }
  
  export interface IntegrationHealth {
    id: string;
    name: string;
    status: 'healthy' | 'warning' | 'error';
    uptime: number;
    lastCheck: string;
  }