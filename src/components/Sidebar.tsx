import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, PieChart, Box, Zap, Settings, TestTube, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const menuItems = [
    { icon: Layout, label: 'Dashboard', path: '/dashboard' },
    { icon: Zap, label: 'Integrations', path: '/integrations' },
    { icon: Box, label: 'Workflows', path: '/workflows' },
    { icon: TestTube, label: 'Connection Tests', path: '/tests' },
    { icon: PieChart, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Fecha o menu ao clicar fora em telas menores
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar && !sidebar.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fecha o menu ao mudar de rota em telas menores
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, [location.pathname]);

  return (
    <>
      {/* Botão do menu móvel */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-900 text-white"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay para telas menores */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" />
      )}

      {/* Sidebar */}
      <div
        id="sidebar"
        className={cn(
          "fixed left-0 top-0 h-full bg-gray-900 text-white z-40 transition-transform duration-300 ease-in-out",
          "w-64 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo/Título */}
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
          <span className="text-xl font-bold">Dashboard</span>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col py-4">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-6 py-3 hover:bg-gray-800 transition-colors",
                  isActive && "bg-gray-800"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}