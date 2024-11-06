import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface KommoConnectionStatusProps {
  isConnected: boolean;
  config: any;
  error: string | null;
}

export default function KommoConnectionStatus({ isConnected, config, error }: KommoConnectionStatusProps) {
  const getStatusColor = () => {
    if (error) return 'text-red-600';
    if (isConnected) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = () => {
    if (error) return <XCircle className="h-5 w-5 mr-1" />;
    if (isConnected) return <CheckCircle2 className="h-5 w-5 mr-1" />;
    return <AlertTriangle className="h-5 w-5 mr-1" />;
  };

  const getStatusText = () => {
    if (error) return 'Connection Error';
    if (isConnected) return 'Connected';
    return 'Not Connected';
  };

  return (
    <div className="mb-4">
      <div className={`flex items-center ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      {config && (
        <div className="mt-2 text-xs text-gray-500">
          <p>Account: {config.accountDomain}</p>
          <p>Last connected: {new Date(config.connectedAt).toLocaleString()}</p>
        </div>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}