import React from 'react';
import { Link, useLocation } from 'wouter';
import { CreditCard, Briefcase, BarChart2, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveTab } from './Layout';

type SidebarProps = {
  sidebarOpen: boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, activeTab, setActiveTab }) => {
  const [location, navigate] = useLocation();

  const handleTabChange = (tab: ActiveTab, path: string) => {
    setActiveTab(tab);
    navigate(path);
  };

  return (
    <aside
      className={cn(
        "fixed lg:static inset-y-0 left-0 w-64 transition-transform duration-300 transform lg:translate-x-0 bg-white border-r border-gray-200 z-20 pt-14",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <nav className="mt-5 px-2">
        <button
          onClick={() => handleTabChange('payments', '/payments')}
          className={cn(
            "group flex items-center px-3 py-2 text-base font-medium rounded-md w-full mb-1",
            activeTab === 'payments'
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <CreditCard
            className={cn(
              "mr-3 flex-shrink-0 h-6 w-6",
              activeTab === 'payments'
                ? "text-blue-500"
                : "text-gray-400 group-hover:text-gray-500"
            )}
          />
          Pagamenti
        </button>

        <button
          onClick={() => handleTabChange('accounts', '/accounts')}
          className={cn(
            "group flex items-center px-3 py-2 text-base font-medium rounded-md w-full mb-1",
            activeTab === 'accounts'
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={cn(
              "mr-3 flex-shrink-0 h-6 w-6",
              activeTab === 'accounts'
                ? "text-blue-500"
                : "text-gray-400 group-hover:text-gray-500"
            )}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
          Conti
        </button>

        <button
          onClick={() => handleTabChange('cost-centers', '/cost-centers')}
          className={cn(
            "group flex items-center px-3 py-2 text-base font-medium rounded-md w-full mb-1",
            activeTab === 'cost-centers'
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <Briefcase
            className={cn(
              "mr-3 flex-shrink-0 h-6 w-6",
              activeTab === 'cost-centers'
                ? "text-blue-500"
                : "text-gray-400 group-hover:text-gray-500"
            )}
          />
          Centri di Costo
        </button>

        <button
          onClick={() => handleTabChange('reports', '/reports')}
          className={cn(
            "group flex items-center px-3 py-2 text-base font-medium rounded-md w-full mb-1",
            activeTab === 'reports'
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <BarChart2
            className={cn(
              "mr-3 flex-shrink-0 h-6 w-6",
              activeTab === 'reports'
                ? "text-blue-500"
                : "text-gray-400 group-hover:text-gray-500"
            )}
          />
          Report
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
