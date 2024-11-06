import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKommoIntegration } from '../../../hooks/useKommoIntegration';
import KommoAuthForm from './KommoAuthForm';
import KommoLeadsList from './KommoLeadsList';
import KommoConnectionStatus from './KommoConnectionStatus';

interface KommoFormData {
  accountDomain: string;
  clientId: string;
  clientSecret: string;
}

const REDIRECT_URI = `${window.location.origin}/integrations/kommo/callback`;

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

  const [formData, setFormData] = useState<KommoFormData>({
    accountDomain: '',
    clientId: '',
    clientSecret: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setFormData(prev => ({
        ...prev,
        accountDomain: config.accountDomain || prev.accountDomain,
        clientId: config.clientId || prev.clientId
      }));
    }
  }, [config]);

  const getAuthUrl = () => {
    const params = new URLSearchParams({
      client_id: formData.clientId,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      state: 'test'
    });

    return `https://${formData.accountDomain}/oauth2/authorize?${params.toString()}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trim()
    }));
    setFormError(null);
  };

  const validateForm = () => {
    const { accountDomain, clientId, clientSecret } = formData;

    if (!accountDomain || !clientId || !clientSecret) {
      setFormError('All fields are required');
      return false;
    }

    if (!accountDomain.includes('.kommo.com')) {
      setFormError('Account domain must end with .kommo.com');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const authUrl = await initiateOAuth({
        accountDomain: formData.accountDomain,
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        redirectUri: REDIRECT_URI
      });

      if (authUrl) {
        window.location.href = authUrl;
      } else {
        window.location.href = getAuthUrl();
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      setFormError(err.message || 'Failed to connect to Kommo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      navigate('/integrations');
    } catch (err: any) {
      console.error('Disconnect error:', err);
      setFormError(err.message || 'Failed to disconnect from Kommo CRM');
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
          <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <img
              src="https://www.kommo.com/favicon.ico"
              alt="Kommo"
              className="h-6 w-6"
              onError={(e) => {
                e.currentTarget.src = 'https://www.google.com/s2/favicons?domain=kommo.com&sz=64';
              }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Kommo CRM</h3>
            <p className="text-sm text-gray-500">Connect your Kommo CRM account</p>
          </div>
        </div>
      </div>

      <KommoConnectionStatus
        isConnected={isConnected}
        config={config}
        error={error || formError}
      />

      <KommoAuthForm
        formData={formData}
        error={error || formError}
        isSaving={isSaving}
        onSubmit={handleSubmit}
        onChange={handleChange}
        getAuthUrl={getAuthUrl}
        isConnected={isConnected}
      />

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