import React from 'react';
import { Bell, Settings, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { cn } from '../lib/utils';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30">
      <div className="max-w-full mx-auto px-4 lg:px-6">
        <div className="flex justify-between h-16">
          {/* Logo/Brand - Ajustado para considerar o menu móvel */}
          <div className="flex items-center">
            <div className="flex items-center ml-0 lg:ml-4">
              <span className="text-2xl font-bold text-indigo-600 ml-12 lg:ml-0">Integro</span>
            </div>
          </div>
          
          {/* Right side items */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 hidden sm:block">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 hidden sm:block">
              <Settings className="h-5 w-5" />
            </button>
            
            {/* User menu */}
            <div className="flex items-center">
              <button className="flex items-center space-x-2 p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <User className="h-5 w-5" />
                <span className="hidden md:block text-sm font-medium">
                  {user?.name || 'User'}
                </span>
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}