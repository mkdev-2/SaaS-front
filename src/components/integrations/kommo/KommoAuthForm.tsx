import React from 'react';
import { ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface KommoAuthFormProps {
  formData: {
    accountDomain: string;
    clientId: string;
    clientSecret: string;
  };
  error: string | null;
  isSaving: boolean;
  isConnected: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getAuthUrl: () => string;
}

export default function KommoAuthForm({
  formData,
  error,
  isSaving,
  isConnected,
  onSubmit,
  onChange,
  getAuthUrl
}: KommoAuthFormProps) {
  if (isConnected) return null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label htmlFor="accountDomain" className="block text-sm font-medium text-gray-700 mb-1">
          Account Domain
        </label>
        <input
          type="text"
          id="accountDomain"
          name="accountDomain"
          value={formData.accountDomain}
          onChange={onChange}
          placeholder="your-account.kommo.com"
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
          onChange={onChange}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
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
          onChange={onChange}
          placeholder="Enter your client secret"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <>
            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
            Connecting...
          </>
        ) : (
          <>
            <ExternalLink className="h-4 w-4 mr-2" />
            Connect with Kommo
          </>
        )}
      </button>
    </form>
  );
}