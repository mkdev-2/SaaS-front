import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

export default function KommoConnectionResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status');
  const message = searchParams.get('message');

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/integrations');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const isSuccess = status === 'success';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
          isSuccess ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          ) : (
            <XCircle className="w-8 h-8 text-red-600" />
          )}
        </div>

        <h2 className={`mt-6 text-2xl font-semibold ${
          isSuccess ? 'text-green-600' : 'text-red-600'
        }`}>
          {isSuccess ? 'Connection Successful' : 'Connection Failed'}
        </h2>

        <p className="mt-2 text-gray-600">
          {message || (isSuccess 
            ? 'Your Kommo CRM has been successfully connected.' 
            : 'There was an error connecting to Kommo CRM.')}
        </p>

        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-4">
            You will be redirected automatically in 5 seconds...
          </p>
          <button
            onClick={() => navigate('/integrations')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Integrations
          </button>
        </div>
      </div>
    </div>
  );
}