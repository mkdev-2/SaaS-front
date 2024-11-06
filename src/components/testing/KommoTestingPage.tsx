import React, { useState } from 'react';
import { Play, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useKommoIntegration } from '../../hooks/useKommoIntegration';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  duration: number;
  details?: any;
}

export default function KommoTestingPage() {
  const { isConnected, config } = useKommoIntegration();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      // Test basic connection
      const startTime = Date.now();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/integrations/kommo/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      if (data.diagnostics) {
        const testResults: TestResult[] = [
          {
            name: 'Connection Test',
            status: data.diagnostics.connection?.success ? 'success' : 'error',
            message: data.diagnostics.connection?.success ? 
              'Successfully connected to Kommo API' : 
              'Failed to connect to Kommo API',
            duration,
            details: data.diagnostics.connection
          },
          {
            name: 'Account Access',
            status: data.diagnostics.account?.success ? 'success' : 'error',
            message: data.diagnostics.account?.success ?
              'Successfully accessed account information' :
              'Failed to access account information',
            duration,
            details: data.diagnostics.account
          },
          {
            name: 'Leads Access',
            status: data.diagnostics.leads?.success ? 'success' : 'error',
            message: data.diagnostics.leads?.success ?
              `Successfully accessed leads (${data.diagnostics.leads.count} leads found)` :
              'Failed to access leads',
            duration,
            details: data.diagnostics.leads
          },
          {
            name: 'Custom Fields',
            status: data.diagnostics.customFields?.success ? 'success' : 'error',
            message: data.diagnostics.customFields?.success ?
              `Successfully accessed custom fields (${data.diagnostics.customFields.count} fields found)` :
              'Failed to access custom fields',
            duration,
            details: data.diagnostics.customFields
          },
          {
            name: 'Tags',
            status: data.diagnostics.tags?.success ? 'success' : 'error',
            message: data.diagnostics.tags?.success ?
              `Successfully accessed tags (${data.diagnostics.tags.count} tags found)` :
              'Failed to access tags',
            duration,
            details: data.diagnostics.tags
          }
        ];

        setResults(testResults);
      }
    } catch (error) {
      console.error('Test execution error:', error);
      setResults([{
        name: 'Connection Test',
        status: 'error',
        message: 'Failed to execute tests',
        duration: 0,
        details: error
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Not Connected
              </h3>
              <p className="mt-2 text-sm text-yellow-700">
                Please connect to Kommo CRM before running tests.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kommo Connection Tests</h1>
          <p className="text-gray-500">Test your Kommo CRM integration endpoints</p>
        </div>
        <button
          onClick={runTests}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="-ml-1 mr-2 h-5 w-5" />
              Run Tests
            </>
          )}
        </button>
      </div>

      {/* Configuration Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Account Domain</p>
            <p className="font-medium">{config?.account_domain}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Client ID</p>
            <p className="font-mono text-sm">{config?.client_id}</p>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-200">
          {results.map((result, index) => (
            <div key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {result.status === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                  )}
                  {result.status === 'error' && (
                    <XCircle className="h-5 w-5 text-red-500 mr-3" />
                  )}
                  {result.status === 'warning' && (
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {result.name}
                    </h3>
                    <p className="text-sm text-gray-500">{result.message}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {result.duration}ms
                </span>
              </div>
              {result.details && (
                <div className="mt-4">
                  <pre className="text-xs bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}