import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function KommoCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (window.opener) {
      if (code) {
        window.opener.postMessage({ type: 'KOMMO_AUTH_CODE', code, state }, window.location.origin);
      } else if (error) {
        window.opener.postMessage({ type: 'KOMMO_AUTH_ERROR', error }, window.location.origin);
      }
      window.close();
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}