import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useKommoIntegration } from '../../../hooks/useKommoIntegration';
import KommoLeadsList from './KommoLeadsList';
import KommoConnectionStatus from './KommoConnectionStatus';
import KommoButton from './KommoButton';

// Configuração do Kommo - deve corresponder exatamente ao registrado no Kommo
const KOMMO_CONFIG = {
  accountDomain: 'vendaspersonalprime.kommo.com',
  clientId: '6fc1e2d2-0e1d-4549-8efd-1b0b37d0bbb3',
  clientSecret: 'O4QcVGEURJVwaCwXIa9ZAxAgpelDtgBnrWObukW6SBlTjYKkSCNJklmhVH5tpTVh',
  redirectUri: 'https://saas-backend-production-8b94.up.railway.app/api/integrations/kommo/callback'
};

export default function KommoIntegration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    isConnected,
    isLoading,
    error,
    leads,
    config,
    initiateOAuth,
    disconnect,
    refresh
  } = useKommoIntegration();

  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (code) {
      initiateOAuth({
        ...KOMMO_CONFIG,
        code
      }).catch(err => {
        console.error('Erro de callback OAuth:', err);
        setAuthError(err.message || 'Falha ao completar a autenticação');
      });
    } else if (error) {
      setAuthError(`Falha na autenticação: ${error}`);
    }
  }, [searchParams, initiateOAuth]);

  const handleKommoAuth = async () => {
    try {
      setAuthError(null);

      // Salvar configuração inicial antes do redirecionamento
      await initiateOAuth(KOMMO_CONFIG);

      // Criar formulário para requisição POST
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `https://${KOMMO_CONFIG.accountDomain}/oauth2/authorize`;

      // Adicionar parâmetros OAuth necessários
      const params = {
        client_id: KOMMO_CONFIG.clientId,
        redirect_uri: KOMMO_CONFIG.redirectUri,
        response_type: 'code',
        state: 'initial_auth',
        mode: 'post_message'
      };

      // Adicionar inputs ocultos para cada parâmetro
      Object.entries(params).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      // Enviar o formulário
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (err: any) {
      console.error('Erro OAuth:', err);
      setAuthError(err.message || 'Falha ao iniciar autenticação');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      navigate('/integrations');
    } catch (err: any) {
      console.error('Erro ao desconectar:', err);
      setAuthError(err.message || 'Falha ao desconectar do Kommo');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-[#0077FF] rounded-lg flex items-center justify-center">
            <svg 
              viewBox="0 0 24 24" 
              className="h-6 w-6 text-white"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17Z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Kommo CRM</h3>
            <p className="text-sm text-gray-500">Conecte sua conta do Kommo CRM</p>
          </div>
        </div>
      </div>

      <KommoConnectionStatus
        isConnected={isConnected}
        config={config}
        error={authError || error}
      />

      {!isConnected && (
        <KommoButton 
          onClick={handleKommoAuth}
          disabled={isLoading}
          isLoading={isLoading}
        />
      )}

      {isConnected && (
        <button
          onClick={handleDisconnect}
          className="mt-4 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Desconectar
        </button>
      )}

      {isConnected && leads?.length > 0 && (
        <KommoLeadsList leads={leads} onRefresh={refresh} />
      )}
    </div>
  );
}