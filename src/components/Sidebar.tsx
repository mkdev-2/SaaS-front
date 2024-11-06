import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, PieChart, Box, Zap, Settings, TestTube } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  
  const menuItems = [
    { icon: Layout, label: 'Dashboard', path: '/' },
    { icon: Zap, label: 'Integrations', path: '/integrations' },
    { icon: Box, label: 'Workflows', path: '/workflows' },
    { icon: TestTube, label: 'Connection Tests', path: '/tests' },
    { icon: PieChart, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  return (
    <div className="fixed left-0 top-16 h-full w-64 bg-gray-900 text-white">
      <div className="flex flex-col py-4">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center space-x-3 px-6 py-3 hover:bg-gray-800 transition-colors ${
                isActive ? 'bg-gray-800' : ''
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}