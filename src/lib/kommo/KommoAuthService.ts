import { AxiosInstance } from 'axios';
import { KommoConfig } from './types';
import { TokenManager } from './TokenManager';
import { logger } from '../logger';

export class KommoAuthService {
  private tokenManager: TokenManager;

  constructor(
    private client: AxiosInstance,
    private config: KommoConfig
  ) {
    this.tokenManager = new TokenManager(client, {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      accessToken: config.accessToken,
      refreshToken: config.refreshToken
    });
  }

  async refreshToken() {
    try {
      return await this.tokenManager.refreshToken();
    } catch (error) {
      throw error;
    }
  }

  async revokeToken() {
    await this.tokenManager.revokeToken();
  }

  async handleTokenError(error: any, retryRequest: () => Promise<any>) {
    return this.tokenManager.handleTokenError(error, retryRequest);
  }
}