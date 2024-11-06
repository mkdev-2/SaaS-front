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
      className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0077FF] hover:bg-[#0066DD] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077FF] disabled:opacity-50 transition-colors"
    >
      {isLoading ? (
        <RefreshCw className="animate-spin h-5 w-5" />
      ) : (
        <div className="flex items-center space-x-2">
          <img 
            src="https://www.google.com/s2/favicons?domain=kommo.com&sz=64"
            alt=""
            className="w-5 h-5"
          />
          <span>Connect with Kommo</span>
        </div>
      )}
    </button>
  );
}