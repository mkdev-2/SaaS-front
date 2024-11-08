import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKommoIntegration } from '../../../hooks/useKommoIntegration';
import KommoLeadsList from './KommoLeadsList';
import KommoConnectionStatus from './KommoConnectionStatus';
import KommoButton from './KommoButton';

const KOMMO_DOMAIN = 'vendaspersonalprime.kommo.com';
const BACKEND_URL = 'https://saas-backend-production-8b94.up.railway.app';

export default function KommoIntegration() {
  const navigate = useNavigate();
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
  const [authWindow, setAuthWindow] = useState<Window | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'KOMMO_AUTH_CODE') {
        if (authWindow) {
          authWindow.close();
          setAuthWindow(null);
        }

        const code = event.data.code;
        const state = event.data.state;
        handleAuthCode(code, state);
      }

      if (event.data?.type === 'KOMMO_AUTH_ERROR') {
        if (authWindow) {
          authWindow.close();
          setAuthWindow(null);
        }

        setAuthError('Autenticação falhou: ' + event.data.error);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [authWindow]);

  const handleAuthCode = async (code: string, state: string) => {
    try {
      await initiateOAuth({
        accountDomain: KOMMO_DOMAIN,
        code,
        state,
        redirectUri: `${BACKEND_URL}/api/kommo/callback`
      });
      setAuthError(null);
    } catch (err: any) {
      console.error('Error processing authentication code:', err);
      setAuthError(err.message || 'Failed to complete authentication');
    }
  };

  const handleKommoAuth = async () => {
    try {
      setAuthError(null);

      const response = await initiateOAuth({
        accountDomain: KOMMO_DOMAIN,
        redirectUri: `${BACKEND_URL}/api/kommo/callback`
      });

      if (!response?.authUrl) {
        throw new Error('URL de autenticação não fornecida');
      }

      const width = 800;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const newAuthWindow = window.open(
        response.authUrl,
        'KommoAuth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,location=yes`
      );

      if (!newAuthWindow) {
        throw new Error('Não foi possível abrir a janela de autenticação. Por favor, permita pop-ups para este site.');
      }

      setAuthWindow(newAuthWindow);

      const checkWindow = setInterval(() => {
        if (newAuthWindow.closed) {
          clearInterval(checkWindow);
          setAuthWindow(null);
          refresh();
        }
      }, 500);

    } catch (err: any) {
      console.error('Erro ao iniciar a autenticação:', err);
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
          Disconnect
        </button>
      )}

      {isConnected && leads?.length > 0 && (
        <KommoLeadsList leads={leads} onRefresh={refresh} />
      )}
    </div>
  );
}