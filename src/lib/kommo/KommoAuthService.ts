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
      logger.info('Iniciando renovação do token');

      if (!this.config.refreshToken) {
        throw new Error('Refresh token não disponível');
      }

      if (!this.config.clientId || !this.config.clientSecret) {
        throw new Error('Credenciais de cliente inválidas');
      }

      const response = await this.client.post(
        `/oauth2/access_token`,
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: this.config.refreshToken,
          redirect_uri: this.config.redirectUri
        }
      );

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
      logger.error('Erro na renovação do token:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });

      // Tratamento específico para diferentes tipos de erro
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
  }

  async revokeToken() {
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
      // Não propaga o erro pois a revogação é uma operação de limpeza
    }
  }
}