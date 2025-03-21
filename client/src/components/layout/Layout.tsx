import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

type LayoutProps = {
  children: React.ReactNode;
};

export type ActiveTab = 'payments' | 'accounts' | 'cost-centers' | 'reports';

export const useActiveTab = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('payments');
  return { activeTab, setActiveTab };
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const { activeTab, setActiveTab } = useActiveTab();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex pt-14 flex-1">
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
        
        <main className="flex-1 overflow-y-auto pb-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
