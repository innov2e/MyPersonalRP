import React from 'react';
import { Bell, Menu } from 'lucide-react';

type HeaderProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-lg font-semibold text-gray-800">Sistema di Gestione Pagamenti</span>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700">
            <Bell className="h-6 w-6" />
          </button>
          <div className="relative">
            <button className="flex items-center text-gray-700 hover:text-gray-900">
              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                AM
              </div>
              <span className="ml-2 hidden md:block">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
