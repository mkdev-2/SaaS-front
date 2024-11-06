export interface KommoConfig {
  accountDomain: string;
  clientId: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  isConnected: boolean;
  connectedAt: string;
  redirectUri: string;
}

export interface KommoLead {
  id: number;
  name: string;
  status_id: number;
  price: number;
  responsible_user_id: number;
  created_at: number;
  updated_at: number;
  closed_at: number;
  tags?: any[];
  custom_fields_values?: any[];
  catalog_elements?: any[];
}

export interface KommoAnalytics {
  dailyLeads: Record<string, number>;
  tags: {
    vendedor: Record<string, number>;
    persona: Record<string, number>;
    origem: Record<string, number>;
  };
  purchases: Array<{
    leadId: number;
    persona: string;
    products: Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
    paymentMethod: string;
    purchaseDate: string;
    totalAmount: number;
  }>;
}

export interface DiagnosticResults {
  timestamp: string;
  duration: number;
  config: {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    tokenExpired: boolean;
    accountDomain: string;
    clientId: string;
    clientSecret: string;
  };
  connection: {
    success: boolean;
    statusCode?: number;
    error?: string;
    details?: any;
    timestamp: string;
  } | null;
  account: {
    success: boolean;
    data?: any;
    error?: string;
    details?: any;
    timestamp: string;
  } | null;
  leads: {
    success: boolean;
    count?: number;
    error?: string;
    details?: any;
    timestamp: string;
  } | null;
  customFields: {
    success: boolean;
    count?: number;
    error?: string;
    details?: any;
    timestamp: string;
  } | null;
  tags: {
    success: boolean;
    count?: number;
    error?: string;
    details?: any;
    timestamp: string;
  } | null;
  error: {
    message: string;
    code?: string;
    details?: any;
  } | null;
}