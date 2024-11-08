import { AxiosInstance } from 'axios';
import { logger } from '../logger';

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface TokenConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
}

export class TokenManager {
  private isRefreshing = false;
  private refreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(
    private client: AxiosInstance,
    private config: TokenConfig
  ) {}

  async refreshToken(): Promise<TokenResponse> {
    try {
      logger.info('Iniciando renovação do token');

      this.validateConfig();

      const response = await this.client.post('/oauth2/access_token', {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken,
        redirect_uri: this.config.redirectUri
      });

      if (!response.data?.access_token) {
        throw new Error('Resposta inválida do servidor de autenticação');
      }

      logger.info('Token renovado com sucesso');

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: response.data.expires_in ? 
          new Date(Date.now() + response.data.expires_in * 1000) : 
          undefined
      };
    } catch (error: any) {
      this.handleRefreshError(error);
      throw error;
    }
  }

  async revokeToken(): Promise<void> {
    try {
      if (!this.config.accessToken) {
        return;
      }

      await this.client.post('/oauth2/revoke', {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        token: this.config.accessToken
      });

      logger.info('Token revogado com sucesso');
    } catch (error) {
      logger.error('Erro ao revogar token:', error);
    }
  }

  async handleTokenError(error: any, retryRequest: () => Promise<any>): Promise<any> {
    if (error.response?.status !== 401 || !this.config.refreshToken) {
      throw error;
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      try {
        const tokens = await this.refreshToken();
        this.processQueue(null, tokens.accessToken);
        return retryRequest();
      } catch (refreshError) {
        this.processQueue(refreshError, null);
        throw refreshError;
      } finally {
        this.isRefreshing = false;
      }
    }

    return new Promise((resolve, reject) => {
      this.refreshQueue.push({
        resolve: (token: string) => resolve(retryRequest()),
        reject
      });
    });
  }

  private validateConfig() {
    if (!this.config.refreshToken) {
      throw new Error('Refresh token não disponível');
    }

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Credenciais de cliente inválidas');
    }
  }

  private handleRefreshError(error: any) {
    logger.error('Erro na renovação do token:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response?.status === 401) {
      throw new Error('Token de atualização expirado ou inválido. É necessário reconectar.');
    }

    if (error.response?.status === 400) {
      const detail = error.response.data?.detail;
      const hint = error.response.data?.hint;
      throw new Error(`Falha na renovação do token: ${detail}${hint ? ` (${hint})` : ''}`);
    }

    throw new Error('Falha na renovação do token. Por favor, tente reconectar.');
  }

  private processQueue(error: any, token: string | null) {
    this.refreshQueue.forEach(promise => {
      if (error) {
        promise.reject(error);
      } else if (token) {
        promise.resolve(token);
      }
    });
    this.refreshQueue = [];
  }
}