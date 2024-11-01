import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface IntegrationCardProps {
  name: string;
  description: string;
  status: 'connected' | 'disconnected';
  logo: string;
}

export default function IntegrationCard({ name, description, status, logo }: IntegrationCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <img src={logo} alt={name} className="w-12 h-12 rounded-lg" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center">
          {status === 'connected' ? (
            <span className="flex items-center text-sm text-green-600">
              <CheckCircle2 className="h-5 w-5 mr-1" />
              Connected
            </span>
          ) : (
            <span className="flex items-center text-sm text-gray-500">
              <XCircle className="h-5 w-5 mr-1" />
              Not Connected
            </span>
          )}
        </div>
      </div>
      <div className="mt-4">
        <button className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
          status === 'connected'
            ? 'text-red-600 bg-red-50 hover:bg-red-100'
            : 'text-white bg-indigo-600 hover:bg-indigo-700'
        }`}>
          {status === 'connected' ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </div>
  );
}