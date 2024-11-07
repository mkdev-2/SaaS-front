import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useKommoIntegration } from '../../../hooks/useKommoIntegration';
import KommoLeadsList from './KommoLeadsList';
import KommoConnectionStatus from './KommoConnectionStatus';
import KommoButton from './KommoButton';

// Configuração do Kommo - apenas informações não sensíveis
const KOMMO_CONFIG = {
  accountDomain: 'vendaspersonalprime.kommo.com',
  clientId: '6fc1e2d2-0e1d-4549-8efd-1b0b37d0bbb3',
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
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {authError && <p className="text-red-500">{authError}</p>}
      {isConnected ? (
        <>
          <KommoConnectionStatus status="Conectado ao Kommo" />
          <KommoLeadsList leads={leads} />
          <button onClick={refresh} className="bg-blue-500 text-white py-2 px-4 rounded mt-4">
            Atualizar Leads
          </button>
          <button onClick={handleDisconnect} className="bg-red-500 text-white py-2 px-4 rounded mt-4">
            Desconectar
          </button>
        </>
      ) : (
        <>
          <KommoConnectionStatus status="Não conectado" />
          <KommoButton onClick={handleKommoAuth}>Conectar ao Kommo</KommoButton>
        </>
      )}
    </div>
  );
}
