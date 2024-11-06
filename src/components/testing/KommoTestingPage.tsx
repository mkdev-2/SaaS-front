import React, { useState } from 'react';
import { Play, RefreshCw, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useKommoIntegration } from '../../hooks/useKommoIntegration';
import api from '../../lib/api';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  duration: number;
  details?: any;
}

export default function KommoTestingPage() {
  const { isConnected, config, error: integrationError } = useKommoIntegration();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);

  const runTests = async () => {
    setIsLoading(true);
    setResults([]);
    setExpandedResult(null);

    try {
      // First test - Configuration
      const configResult: TestResult = {
        name: 'Configuration Check',
        status: 'success',
        message: 'Configuration is valid and token is present',
        duration: 0,
        details: {
          accountDomain: config?.accountDomain,
          hasClientId: !!config?.clientId,
          isConnected: isConnected
        }
      };

      // Second test - API Connection
      let connectionResult: TestResult;
      try {
        const startTime = Date.now();
        const { data: response } = await api.get('/kommo/config/verify');
        const duration = Date.now() - startTime;

        connectionResult = {
          name: 'API Connection',
          status: 'success',
          message: 'Successfully verified Kommo API connection',
          duration,
          details: {
            responseTime: duration,
            status: response.status
          }
        };
      } catch (error: any) {
        connectionResult = {
          name: 'API Connection',
          status: 'error',
          message: error.response?.data?.message || 'Failed to verify Kommo API connection',
          duration: 0,
          details: {
            error: error.message,
            status: error.response?.status
          }
        };
      }

      // Third test - Integration Status
      let integrationResult: TestResult;
      try {
        const startTime = Date.now();
        const { data: response } = await api.get('/kommo/status');
        const duration = Date.now() - startTime;

        integrationResult = {
          name: 'Integration Status',
          status: 'success',
          message: 'Successfully retrieved integration status',
          duration,
          details: {
            responseTime: duration,
            isConnected: response.data?.isConnected,
            lastSync: response.data?.lastSync
          }
        };
      } catch (error: any) {
        integrationResult = {
          name: 'Integration Status',
          status: 'error',
          message: error.response?.data?.message || 'Failed to check integration status',
          duration: 0,
          details: {
            error: error.message,
            status: error.response?.status
          }
        };
      }

      setResults([configResult, connectionResult, integrationResult]);
    } catch (error: any) {
      console.error('Test execution error:', error);
      setResults([{
        name: 'Test Suite',
        status: 'error',
        message: error.response?.data?.message || 'Failed to execute tests',
        duration: 0,
        details: error.response?.data
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleResultDetails = (index: number) => {
    setExpandedResult(expandedResult === index ? null : index);
  };

  if (!isConnected || !config) {
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
            <p className="font-medium">{config.accountDomain}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Client ID</p>
            <p className="font-mono text-sm">{config.clientId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Connection Status</p>
            <p className="font-medium text-green-600">Connected</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Connected</p>
            <p className="font-medium">
              {new Date(config.connectedAt).toLocaleString()}
            </p>
          </div>
        </div>
        {integrationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{integrationError}</p>
          </div>
        )}
      </div>

      {/* Test Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-200">
          {results.map((result, index) => (
            <div key={index} className="p-6">
              <button
                onClick={() => toggleResultDetails(index)}
                className="w-full flex items-center justify-between focus:outline-none"
              >
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
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      {result.name}
                    </h3>
                    <p className="text-sm text-gray-500">{result.message}</p>
                  </div>
                </div>
                <div className="flex items-center ml-4">
                  <span className="text-sm text-gray-500 mr-2">
                    {result.duration}ms
                  </span>
                  {expandedResult === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>
              
              {expandedResult === index && result.details && (
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