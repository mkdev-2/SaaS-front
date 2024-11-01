import React from 'react';
import { Menu, Bell, Settings, User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-50">
      <div className="max-w-full mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-4 flex items-center">
              <span className="text-2xl font-bold text-indigo-600">Integro</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Settings className="h-5 w-5" />
            </button>
            <button className="flex items-center space-x-2 p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <User className="h-5 w-5" />
              <span className="hidden md:block text-sm font-medium">John Doe</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}