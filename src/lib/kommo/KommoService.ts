import axios, { AxiosInstance } from 'axios';
import { KommoConfig, KommoLead, KommoAnalytics, DiagnosticResults, KommoStatus } from './types';
import { KommoAuthService } from './KommoAuthService';
import { KommoLeadService } from './KommoLeadService';
import { KommoAnalyticsService } from './KommoAnalyticsService';
import { logger } from '../logger';

export class KommoService {
  private client: AxiosInstance;
  private config: KommoConfig;
  private authService: KommoAuthService;
  private leadService: KommoLeadService;
  private analyticsService: KommoAnalyticsService;

  constructor(config: KommoConfig) {
    this.config = config;
    this.client = this.createClient();
    this.authService = new KommoAuthService(this.client, config);
    this.leadService = new KommoLeadService(this.client);
    this.analyticsService = new KommoAnalyticsService(this.client);
  }

  private createClient(): AxiosInstance {
    const client = axios.create({
      baseURL: `https://${this.config.accountDomain}/api/v4`,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401 && this.config.refreshToken) {
          try {
            const newTokens = await this.authService.refreshToken();
            this.updateConfig(newTokens);
            error.config.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
            return client(error.config);
          } catch (refreshError) {
            logger.error('Token refresh failed:', refreshError);
            throw error;
          }
        }
        throw error;
      }
    );

    return client;
  }

  private updateConfig(tokens: { accessToken: string; refreshToken?: string; expiresAt?: Date }) {
    this.config = { ...this.config, ...tokens };
    this.client.defaults.headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  async getStatus(): Promise<KommoStatus> {
    try {
      const response = await this.client.get('/account');
      return {
        isConnected: true,
        status: 'active',
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Status check failed:', error);
      return {
        isConnected: false,
        status: 'error',
        error: error.message
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const diagnostics = await this.runDiagnostics();
      return diagnostics.connection?.success || false;
    } catch (error) {
      logger.error('Connection test failed:', error);
      return false;
    }
  }

  async getTodayLeads(): Promise<KommoLead[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.leadService.getLeads({
      filter: {
        created_at: {
          from: Math.floor(today.getTime() / 1000)
        }
      }
    });
  }

  async runDiagnostics(): Promise<DiagnosticResults> {
    const startTime = Date.now();
    const results: DiagnosticResults = {
      timestamp: new Date().toISOString(),
      duration: 0,
      config: this.getDiagnosticConfig(),
      connection: null,
      account: null,
      leads: null,
      customFields: null,
      tags: null,
      error: null
    };

    try {
      // Test basic connection
      results.connection = await this.testBasicConnection();
      if (!results.connection.success) {
        throw new Error('Basic connection test failed');
      }

      // Run parallel tests
      const [accountInfo, leadsInfo, customFieldsInfo, tagsInfo] = await Promise.all([
        this.testAccountAccess(),
        this.testLeadsAccess(),
        this.testCustomFieldsAccess(),
        this.testTagsAccess()
      ]);

      results.account = accountInfo;
      results.leads = leadsInfo;
      results.customFields = customFieldsInfo;
      results.tags = tagsInfo;

    } catch (error) {
      results.error = {
        message: error.message,
        code: error.code,
        details: error.response?.data
      };
    } finally {
      results.duration = Date.now() - startTime;
    }

    return results;
  }

  private getDiagnosticConfig() {
    return {
      hasAccessToken: !!this.config.accessToken,
      hasRefreshToken: !!this.config.refreshToken,
      tokenExpired: this.config.expiresAt ? new Date(this.config.expiresAt) < new Date() : true,
      accountDomain: this.config.accountDomain,
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret || '[MISSING]'
    };
  }

  private async testBasicConnection() {
    try {
      const response = await this.client.get('/account');
      return {
        success: true,
        statusCode: response.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: error.response?.status,
        details: error.response?.data,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async testAccountAccess() {
    try {
      const response = await this.client.get('/account');
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async testLeadsAccess() {
    try {
      const response = await this.client.get('/leads', {
        params: { limit: 1 }
      });
      return {
        success: true,
        count: response.data._embedded?.leads?.length || 0,
        sample: response.data._embedded?.leads?.[0] ? '[DATA PRESENT]' : '[NO LEADS]',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async testCustomFieldsAccess() {
    try {
      const response = await this.client.get('/leads/custom_fields');
      return {
        success: true,
        count: response.data._embedded?.custom_fields?.length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async testTagsAccess() {
    try {
      const response = await this.client.get('/leads/tags');
      return {
        success: true,
        count: response.data._embedded?.tags?.length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getAnalytics(startDate: Date, endDate: Date): Promise<KommoAnalytics> {
    return this.analyticsService.getAnalytics(startDate, endDate);
  }

  async getLeads(params?: any): Promise<KommoLead[]> {
    return this.leadService.getLeads(params);
  }
}