import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Users, Box, Zap } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    {
      title: 'Total Integrations',
      value: '24',
      change: '+12%',
      positive: true,
      icon: Zap
    },
    {
      title: 'Active Workflows',
      value: '156',
      change: '+8%',
      positive: true,
      icon: Box
    },
    {
      title: 'API Calls',
      value: '45.2k',
      change: '+23%',
      positive: true,
      icon: Activity
    },
    {
      title: 'Total Users',
      value: '2,345',
      change: '-3%',
      positive: false,
      icon: Users
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <stat.icon className="h-6 w-6 text-indigo-600" />
              </div>
              <span className={`flex items-center text-sm ${
                stat.positive ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
                {stat.positive ? (
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 ml-1" />
                )}
              </span>
            </div>
            <h3 className="text-2xl font-bold mt-4">{stat.value}</h3>
            <p className="text-gray-600 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Workflows</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Box className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium">CRM Data Sync</p>
                    <p className="text-sm text-gray-500">Last run 2 hours ago</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Active</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Integration Health</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Activity className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium">Kommo CRM</p>
                    <p className="text-sm text-gray-500">99.9% uptime</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Healthy</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}