import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  LogOut,
  GraduationCap,
  FileText,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CFPTLogo } from '../ui/CFPTLogo';
import { useAppConfig } from '../../contexts/AppConfigContext';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Personnel', href: '/staff', icon: Users },
  { name: 'Évaluation', href: '/evaluation', icon: GraduationCap },
  { name: 'Statistiques', href: '/statistics', icon: BarChart3 },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const { labels } = useAppConfig();

  return (
    <div className="h-full w-72 bg-gradient-to-b from-[#0011ef] via-blue-700 to-blue-800 flex flex-col shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-blue-600/30">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-2 bg-white/10 rounded-2xl">
            <CFPTLogo size="xl" color="white" />
          </div>
          <div className="flex-1">
            <h1 className="text-white text-base font-bold tracking-tight leading-tight">{labels.appName}</h1>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 mt-3">
          <p className="text-blue-100 text-xs font-medium text-center italic">
            "Excellence • Formation • Service"
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-8 space-y-3">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex items-center px-6 py-4 rounded-xl text-base font-semibold transition-all duration-300 hover:bg-blue-600/50 hover:transform hover:translate-x-2 ${
                isActive
                  ? 'bg-white text-[#0011ef] shadow-xl transform translate-x-2'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <item.icon className="mr-4 h-6 w-6" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* User info & logout */}
      <div className="p-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-white to-gray-100 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-[#0011ef] text-base font-bold">
              {user?.firstName[0]}{user?.lastName[0]}
            </span>
          </div>
          <div className="ml-4">
            <p className="text-white text-base font-semibold">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-blue-200 text-sm font-medium">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center w-full px-6 py-3 text-base text-blue-100 hover:text-white hover:bg-blue-600/50 rounded-xl transition-all duration-300 font-semibold hover:transform hover:translate-x-1"
        >
          <LogOut className="mr-4 h-5 w-5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
};