import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Users, Box, Zap, RefreshCw } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';

export default function Dashboard() {
  const { data, loading, error, refresh } = useDashboardData();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const calculateChange = (current: number, previous: number): string => {
    const percentage = ((current - previous) / previous) * 100;
    return percentage.toFixed(1) + '%';
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button
            onClick={refresh}
            className="ml-4 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeleton for stats
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="Total Integrations"
              value={formatNumber(data?.totalIntegrations || 0)}
              change={calculateChange(data?.totalIntegrations || 0, (data?.totalIntegrations || 0) - 2)}
              icon={Zap}
            />
            <StatCard
              title="Active Workflows"
              value={formatNumber(data?.activeWorkflows || 0)}
              change={calculateChange(data?.activeWorkflows || 0, (data?.activeWorkflows || 0) - 5)}
              icon={Box}
            />
            <StatCard
              title="API Calls"
              value={formatNumber(data?.apiCalls || 0)}
              change={calculateChange(data?.apiCalls || 0, (data?.apiCalls || 0) - 1000)}
              icon={Activity}
            />
            <StatCard
              title="Total Users"
              value={formatNumber(data?.totalUsers || 0)}
              change={calculateChange(data?.totalUsers || 0, (data?.totalUsers || 0) - 1)}
              icon={Users}
            />
          </>
        )}
      </div>

      {/* Workflows and Health Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Workflows */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Workflows</h2>
            <button
              onClick={refresh}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              // Loading skeleton for workflows
              [...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : (
              data?.recentWorkflows.map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Box className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium">{workflow.name}</p>
                      <p className="text-sm text-gray-500">Last run: {workflow.lastRun}</p>
                    </div>
                  </div>
                  <StatusBadge status={workflow.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Integration Health */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Integration Health</h2>
            <button
              onClick={refresh}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              // Loading skeleton for health status
              [...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : (
              data?.integrationHealth.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-gray-500">{integration.uptime}% uptime</p>
                    </div>
                  </div>
                  <HealthBadge status={integration.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
}

function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
  const isPositive = !change.startsWith('-');
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Icon className="h-6 w-6 text-indigo-600" />
        </div>
        <span className={`flex items-center text-sm ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {change}
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4 ml-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 ml-1" />
          )}
        </span>
      </div>
      <h3 className="text-2xl font-bold mt-4">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${colors[status as keyof typeof colors]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function HealthBadge({ status }: { status: string }) {
  const colors = {
    healthy: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${colors[status as keyof typeof colors]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}