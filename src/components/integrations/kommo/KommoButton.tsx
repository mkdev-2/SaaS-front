import React from 'react';
import { RefreshCw } from 'lucide-react';

interface KommoButtonProps {
  isLoading?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function KommoButton({ isLoading, onClick, disabled }: KommoButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077FF] disabled:opacity-50 transition-colors"
    >
      {isLoading ? (
        <RefreshCw className="animate-spin h-5 w-5 text-gray-500" />
      ) : (
        <img 
          src="https://www.kommo.com/static/assets/oauth/oauth-button.png"
          alt="Connect with Kommo"
          className="h-10"
          onError={(e) => {
            e.currentTarget.src = 'https://www.kommo.com/static/img/logo.svg';
          }}
        />
      )}
    </button>
  );
}