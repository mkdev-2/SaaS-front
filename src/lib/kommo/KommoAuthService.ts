import { AxiosInstance } from 'axios';
import { KommoConfig } from './types';
import { logger } from '../logger';

export class KommoAuthService {
  constructor(
    private client: AxiosInstance,
    private config: KommoConfig
  ) {}

  async refreshToken() {
    try {
      const response = await this.client.post(
        `/oauth2/access_token`,
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: this.config.refreshToken
        }
      );

      if (!response.data?.access_token) {
        throw new Error('Invalid refresh token response');
      }

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: response.data.expires_in ? 
          new Date(Date.now() + response.data.expires_in * 1000) : 
          undefined
      };
    } catch (error) {
      logger.error('Token refresh error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data
      });
      throw new Error('Failed to refresh token');
    }
  }
}