import React from 'react';
import { Search } from 'lucide-react';
import { CFPTLogoGradient } from '../ui/CFPTLogo';
import { GlobalStatusBar } from '../GlobalStatusBar';
import { useAppConfig } from '../../contexts/AppConfigContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onSearch }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const { labels } = useAppConfig();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-white/30 px-8 py-6 shadow-xl relative z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-100">
            <CFPTLogoGradient size="xl" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0011ef] via-blue-600 to-[#ff05f2] bg-clip-text text-transparent tracking-tight">{title}</h1>
              <div className="h-8 w-px bg-gradient-to-b from-[#0011ef] to-[#ff05f2] opacity-50"></div>
              <span className="text-sm font-medium text-gray-600 leading-tight">{labels.appName}</span>
            </div>
            {subtitle && (
              <p className="text-base text-gray-700 mt-2 font-semibold">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex"><Search className="h-4 w-4 text-[#0011ef] mr-2" /><span className="text-slate-500 text-sm">Ctrl+K</span></div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#0011ef]" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Rechercher..."
              className="pl-10 pr-4 py-3 w-80 border border-white/30 rounded-2xl focus:ring-2 focus:ring-[#0011ef] focus:border-transparent transition-all duration-300 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl focus:shadow-2xl"
            />
          </div>
          <div className="hidden lg:block">
            <GlobalStatusBar />
          </div>
        </div>
      </div>
    </header>
  );
};