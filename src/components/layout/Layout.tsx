import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSearch?: (query: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ title, subtitle, children, onSearch }) => {

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      {/* Main content area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl"></div>
        </div>
        
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={title} subtitle={subtitle} onSearch={onSearch} />
          <main className="flex-1 overflow-auto p-6 pb-8 relative z-10">
            <div className="min-h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};