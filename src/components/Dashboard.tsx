import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Users, Box, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import useAuthStore from '../store/authStore';

export default function Dashboard() {
  const { data, loading, error, refresh } = useDashboardData();
  const { user } = useAuthStore();

  if (!user) {
    return null;
  }

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '0';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const calculateChange = (current: number | undefined, previous: number | undefined): string => {
    if (current === undefined || previous === undefined || previous === 0) return '0%';
    const percentage = ((current - previous) / previous) * 100;
    return percentage.toFixed(1) + '%';
  };

  const stats = [
    {
      title: "Total Integrations",
      value: data?.totalIntegrations ?? 0,
      previousValue: (data?.totalIntegrations ?? 0) - 2,
      icon: Zap
    },
    {
      title: "Active Workflows",
      value: data?.activeWorkflows ?? 0,
      previousValue: (data?.activeWorkflows ?? 0) - 5,
      icon: Box
    },
    {
      title: "API Calls",
      value: data?.apiCalls ?? 0,
      previousValue: (data?.apiCalls ?? 0) - 1000,
      icon: Activity
    },
    {
      title: "Total Users",
      value: data?.totalUsers ?? 0,
      previousValue: (data?.totalUsers ?? 0) - 1,
      icon: Users
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Dashboard Sync Status
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              {error}
            </p>
          </div>
          <button
            onClick={refresh}
            className="ml-3 bg-yellow-100 p-2 rounded-full text-yellow-600 hover:bg-yellow-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}

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
          stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={formatNumber(stat.value)}
              change={calculateChange(stat.value, stat.previousValue)}
              icon={stat.icon}
            />
          ))
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
            ) : data?.recentWorkflows?.length ? (
              data.recentWorkflows.map((workflow) => (
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                No workflows configured yet
              </div>
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
            ) : data?.integrationHealth?.length ? (
              data.integrationHealth.map((integration) => (
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                No active integrations
              </div>
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

function StatusBadge({ status }: { status: 'active' | 'failed' | 'completed' }) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function HealthBadge({ status }: { status: 'healthy' | 'warning' | 'error' }) {
  const colors = {
    healthy: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}