import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface IntegrationCardProps {
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'coming_soon';
  logo: string;
}

export default function IntegrationCard({ name, description, status, logo }: IntegrationCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <img src={logo} alt={name} className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center">
          {status === 'connected' && (
            <span className="flex items-center text-sm text-green-600">
              <CheckCircle2 className="h-5 w-5 mr-1" />
              Connected
            </span>
          )}
          {status === 'disconnected' && (
            <span className="flex items-center text-sm text-gray-500">
              <XCircle className="h-5 w-5 mr-1" />
              Not Connected
            </span>
          )}
          {status === 'coming_soon' && (
            <span className="flex items-center text-sm text-blue-600">
              <Clock className="h-5 w-5 mr-1" />
              Coming Soon
            </span>
          )}
        </div>
      </div>
      <div className="mt-4">
        <button 
          className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
            status === 'coming_soon'
              ? 'bg-blue-50 text-blue-600 cursor-not-allowed'
              : status === 'connected'
              ? 'text-red-600 bg-red-50 hover:bg-red-100'
              : 'text-white bg-indigo-600 hover:bg-indigo-700'
          }`}
          disabled={status === 'coming_soon'}
        >
          {status === 'coming_soon' 
            ? 'Coming Soon' 
            : status === 'connected' 
            ? 'Disconnect' 
            : 'Connect'}
        </button>
      </div>
    </div>
  );
}