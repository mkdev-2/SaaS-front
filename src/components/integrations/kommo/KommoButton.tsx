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
      className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0077FF] hover:bg-[#0066DD] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077FF] disabled:opacity-50 transition-colors"
    >
      {isLoading ? (
        <RefreshCw className="animate-spin h-5 w-5" />
      ) : (
        <div className="flex items-center space-x-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
              fill="currentColor"
            />
            <path
              d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z"
              fill="currentColor"
            />
          </svg>
          <span className="font-medium">Connect with Kommo</span>
        </div>
      )}
    </button>
  );
}