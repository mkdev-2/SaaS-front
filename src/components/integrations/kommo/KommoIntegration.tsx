import React, { useState } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useKommoIntegration } from '../../../hooks/useKommoIntegration';

interface KommoFormData {
  clientId: string;
  clientSecret: string;
  accountDomain: string;
}

export default function KommoIntegration() {
  const {
    isConnected,
    isLoading,
    error,
    leads,
    config,
    saveConfig,
    disconnect,
    refresh
  } = useKommoIntegration();

  const [formData, setFormData] = useState<KommoFormData>({
    clientId: config?.client_id || '',
    clientSecret: config?.client_secret || '',
    accountDomain: config?.account_domain || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      await saveConfig(formData);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        // Handle validation errors
        const errors = err.response.data.errors.map((e: any) => e.message).join(', ');
        setFormError(`Validation error: ${errors}`);
      } else {
        setFormError(err.message || 'Failed to save configuration');
      }
    } finally {
      setIsSaving(false);
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
        {isConnected && (
          <span className="flex items-center text-sm text-green-600">
            <CheckCircle2 className="h-5 w-5 mr-1" />
            Connected
          </span>
        )}
      </div>

      {(error || formError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          {error || formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="accountDomain" className="block text-sm font-medium text-gray-700 mb-1">
            Account Domain
          </label>
          <input
            type="text"
            id="accountDomain"
            name="accountDomain"
            value={formData.accountDomain}
            onChange={handleChange}
            placeholder="vendaspersonalprime.kommo.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
            Client ID
          </label>
          <input
            type="text"
            id="clientId"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            placeholder="6fc1e2d2-0e1d-4549-8efd-1b0b37d0bbb3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-1">
            Client Secret
          </label>
          <input
            type="password"
            id="clientSecret"
            name="clientSecret"
            value={formData.clientSecret}
            onChange={handleChange}
            placeholder="Enter your client secret"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </button>

          {isConnected && (
            <button
              type="button"
              onClick={disconnect}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Disconnect
            </button>
          )}
        </div>
      </form>

      {isConnected && leads.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <span className="text-sm font-medium text-gray-900">Recent Leads</span>
            <button
              onClick={refresh}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="mt-4 space-y-3">
            {leads.slice(0, 5).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{lead.name}</p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(lead.created_at * 1000).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ${lead.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}