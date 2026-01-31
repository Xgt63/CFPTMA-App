import React, { useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Shield, User, Lock, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthDebuggerProps {
  className?: string;
}

interface SessionInfo {
  token: string | null;
  user: any;
  isAuthenticated: boolean;
  expiresAt: string | null;
  createdAt: string | null;
  lastActivity: string | null;
}

export const AuthDebugger: React.FC<AuthDebuggerProps> = ({ className = '' }) => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [showTokens, setShowTokens] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [authLogs, setAuthLogs] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSessionInfo = useCallback(() => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      const sessionData = localStorage.getItem('sessionData');
      
      let parsedUser = null;
      let parsedSession = null;
      
      try {
        if (userData) parsedUser = JSON.parse(userData);
        if (sessionData) parsedSession = JSON.parse(sessionData);
      } catch (e) {
        console.error('Erreur parsing des données de session:', e);
      }

      const info: SessionInfo = {
        token,
        user: parsedUser,
        isAuthenticated,
        expiresAt: parsedSession?.expiresAt || null,
        createdAt: parsedSession?.createdAt || parsedUser?.createdAt || null,
        lastActivity: parsedSession?.lastActivity || new Date().toISOString()
      };

      setSessionInfo(info);
      
      const logEntry = `[${new Date().toLocaleTimeString()}] Session refreshed - Auth: ${isAuthenticated}, User: ${parsedUser?.firstName || 'N/A'}`;
      setAuthLogs(prev => [...prev.slice(-9), logEntry]);
      
    } catch (error) {
      console.error('Erreur lors du refresh:', error);
      const errorLog = `[${new Date().toLocaleTimeString()}] Erreur refresh: ${error}`;
      setAuthLogs(prev => [...prev.slice(-9), errorLog]);
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  const clearAuthData = useCallback(() => {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les données d\'authentification ?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionData');
      localStorage.removeItem('lastActivity');
      
      const logEntry = `[${new Date().toLocaleTimeString()}] Données d'authentification effacées`;
      setAuthLogs(prev => [...prev.slice(-9), logEntry]);
      
      refreshSessionInfo();
    }
  }, [refreshSessionInfo]);

  const simulateLogin = useCallback(() => {
    if (login) {
      login('admin', 'admin123');
      const logEntry = `[${new Date().toLocaleTimeString()}] Login simulé (admin/admin123)`;
      setAuthLogs(prev => [...prev.slice(-9), logEntry]);
      
      setTimeout(refreshSessionInfo, 100);
    }
  }, [login, refreshSessionInfo]);

  const simulateLogout = useCallback(() => {
    if (logout) {
      logout();
      const logEntry = `[${new Date().toLocaleTimeString()}] Logout simulé`;
      setAuthLogs(prev => [...prev.slice(-9), logEntry]);
      
      setTimeout(refreshSessionInfo, 100);
    }
  }, [logout, refreshSessionInfo]);

  const clearLogs = useCallback(() => {
    setAuthLogs([]);
  }, []);

  // Refresh automatique au montage
  React.useEffect(() => {
    refreshSessionInfo();
  }, [refreshSessionInfo]);

  const getStatusColor = (isAuth: boolean) => {
    return isAuth ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (isAuth: boolean) => {
    return isAuth ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Card */}
      <Card className="border-l-4 border-l-purple-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">Débogueur d'Authentification</h3>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(isAuthenticated)}
            <span className={`font-bold text-lg ${getStatusColor(isAuthenticated)}`}>
              {isAuthenticated ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <User className="w-5 h-5 text-purple-500" />
              <span className="text-xs text-purple-600 font-medium">UTILISATEUR</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-900">
                {user ? `${user.firstName} ${user.lastName}` : 'Non connecté'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.email || 'Aucun email'}
              </div>
              <div className="text-xs text-gray-400">
                ID: {user?.id || 'N/A'}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Lock className="w-5 h-5 text-indigo-500" />
              <span className="text-xs text-indigo-600 font-medium">SESSION</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-900">
                Token: {sessionInfo?.token ? 'Présent' : 'Absent'}
              </div>
              <div className="text-xs text-gray-500">
                Créé: {sessionInfo?.createdAt ? new Date(sessionInfo.createdAt).toLocaleString() : 'N/A'}
              </div>
              <div className="text-xs text-gray-400">
                Activité: {sessionInfo?.lastActivity ? new Date(sessionInfo.lastActivity).toLocaleTimeString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Token Display */}
        {sessionInfo?.token && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Token d'authentification</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowTokens(!showTokens)}
              >
                {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <div className="text-xs font-mono text-gray-600 break-all">
              {showTokens ? sessionInfo.token : '•'.repeat(20) + sessionInfo.token.slice(-10)}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={refreshSessionInfo}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          {!isAuthenticated ? (
            <Button size="sm" variant="primary" onClick={simulateLogin}>
              Simuler Connexion
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={simulateLogout}>
              Simuler Déconnexion
            </Button>
          )}
          
          <Button size="sm" variant="danger" onClick={clearAuthData}>
            <Trash2 className="w-4 h-4 mr-1" />
            Effacer Données
          </Button>
        </div>
      </Card>

      {/* Session Details */}
      {sessionInfo && (
        <Card className="border-l-4 border-l-blue-500">
          <h4 className="font-semibold text-gray-900 mb-3">Détails de la Session</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">État d'authentification:</span>
              <span className={`font-medium ${getStatusColor(sessionInfo.isAuthenticated)}`}>
                {sessionInfo.isAuthenticated ? 'Authentifié' : 'Non authentifié'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Token présent:</span>
              <span className={`font-medium ${sessionInfo.token ? 'text-green-600' : 'text-red-600'}`}>
                {sessionInfo.token ? 'Oui' : 'Non'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Données utilisateur:</span>
              <span className={`font-medium ${sessionInfo.user ? 'text-green-600' : 'text-red-600'}`}>
                {sessionInfo.user ? 'Présentes' : 'Absentes'}
              </span>
            </div>
            
            {sessionInfo.expiresAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Expire le:</span>
                <span className="font-medium text-gray-900">
                  {new Date(sessionInfo.expiresAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Auth Logs */}
      {authLogs.length > 0 && (
        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Journal d'Authentification</h4>
            <Button size="sm" variant="ghost" onClick={clearLogs}>
              Effacer
            </Button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {authLogs.slice().reverse().map((log, index) => (
              <div key={index} className="text-sm font-mono text-gray-600 p-2 bg-gray-50 rounded">
                {log}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="text-xs text-gray-500 text-center">
        Dernière actualisation: {sessionInfo ? new Date().toLocaleString() : 'Jamais'}
      </div>
    </div>
  );
};