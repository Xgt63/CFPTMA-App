 import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UIHealthMonitor, AuthDebugger, DatabaseQueueIndicator } from '../components/debug';
import { 
  Bug, 
  Activity, 
  Shield, 
  Database, 
  AlertTriangle, 
  Zap, 
  RefreshCw,
  Settings,
  Eye,
  EyeOff 
} from 'lucide-react';

type DebugTool = 'ui-health' | 'auth' | 'database-queue' | 'all';

export const DebugTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<DebugTool>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tools = [
    {
      id: 'ui-health' as const,
      name: 'Santé UI',
      icon: <Activity className="w-5 h-5" />,
      description: 'Surveillance des performances de l\'interface utilisateur',
      color: 'blue'
    },
    {
      id: 'auth' as const,
      name: 'Authentification',
      icon: <Shield className="w-5 h-5" />,
      description: 'Débogage du système d\'authentification',
      color: 'purple'
    },
    {
      id: 'database-queue' as const,
      name: 'Queue DB',
      icon: <Database className="w-5 h-5" />,
      description: 'Monitoring de la queue de base de données',
      color: 'indigo'
    },
    {
      id: 'all' as const,
      name: 'Tous les outils',
      icon: <Settings className="w-5 h-5" />,
      description: 'Afficher tous les outils de debug',
      color: 'gray'
    }
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300',
      purple: isActive ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-300',
      indigo: isActive ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300',
      gray: isActive ? 'border-gray-500 bg-gray-50 text-gray-700' : 'border-gray-200 hover:border-gray-300'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const forceAppRepaint = () => {
    // Force un repaint global de l'application
    document.body.style.transform = 'scale(1.00001)';
    setTimeout(() => {
      document.body.style.transform = '';
    }, 10);
    
    // Force le garbage collection si disponible
    if ('gc' in window) {
      (window as any).gc();
    }
  };

  const clearAllStorageData = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les données du localStorage ? Cela vous déconnectera.')) {
      localStorage.clear();
      sessionStorage.clear();
      alert('Toutes les données ont été effacées. Rechargez la page.');
    }
  };

  const exportDebugInfo = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage },
      performance: {
        memory: 'memory' in performance ? (performance as any).memory : 'Non disponible',
        timing: performance.timing,
        navigation: performance.navigation
      },
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight
      },
      window: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      }
    };

    const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-info-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout 
      title="Outils de Débogage" 
      subtitle="Surveillance et débogage de l'application"
    >
      <div className="space-y-6">
        {/* Header avec warning */}
        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/50 to-yellow-50/50">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h3 className="text-lg font-semibold text-orange-800">Mode Développement</h3>
          </div>
          <p className="text-orange-700 mb-4">
            Ces outils de débogage sont destinés au développement uniquement. 
            Ils ne doivent pas être accessibles en production.
          </p>
          
          {/* Actions globales */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={forceAppRepaint}>
              <Zap className="w-4 h-4 mr-2" />
              Force Repaint Global
            </Button>
            <Button size="sm" variant="secondary" onClick={exportDebugInfo}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Exporter Info Debug
            </Button>
            <Button size="sm" variant="danger" onClick={clearAllStorageData}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Vider Stockage
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
              {isCollapsed ? 'Afficher' : 'Masquer'} Outils
            </Button>
          </div>
        </Card>

        {!isCollapsed && (
          <>
            {/* Sélecteur d'outils */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sélectionner un outil</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
                      getColorClasses(tool.color, activeTool === tool.id)
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      {tool.icon}
                      <h4 className="font-medium">{tool.name}</h4>
                    </div>
                    <p className="text-sm opacity-80">{tool.description}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Outils de debug */}
            {(activeTool === 'ui-health' || activeTool === 'all') && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Activity className="w-6 h-6 text-blue-500" />
                  <h3 className="text-xl font-semibold text-gray-900">Monitoring de la Santé UI</h3>
                </div>
                <UIHealthMonitor />
              </div>
            )}

            {(activeTool === 'auth' || activeTool === 'all') && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-purple-500" />
                  <h3 className="text-xl font-semibold text-gray-900">Débogueur d'Authentification</h3>
                </div>
                <AuthDebugger />
              </div>
            )}

            {(activeTool === 'database-queue' || activeTool === 'all') && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Database className="w-6 h-6 text-indigo-500" />
                  <h3 className="text-xl font-semibold text-gray-900">Indicateur Queue Base de Données</h3>
                </div>
                <DatabaseQueueIndicator />
              </div>
            )}

            {/* Informations système */}
            <Card className="border-l-4 border-l-green-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Système</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong className="text-gray-700">User Agent:</strong>
                  <div className="text-gray-600 break-all text-xs mt-1">
                    {navigator.userAgent}
                  </div>
                </div>
                <div>
                  <strong className="text-gray-700">Résolution:</strong>
                  <div className="text-gray-600">
                    {screen.width}x{screen.height} (disponible: {screen.availWidth}x{screen.availHeight})
                  </div>
                </div>
                <div>
                  <strong className="text-gray-700">Fenêtre:</strong>
                  <div className="text-gray-600">
                    {window.innerWidth}x{window.innerHeight} (ratio: {window.devicePixelRatio})
                  </div>
                </div>
                <div>
                  <strong className="text-gray-700">Mémoire JS:</strong>
                  <div className="text-gray-600">
                    {'memory' in performance 
                      ? `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB utilisés`
                      : 'Non disponible'
                    }
                  </div>
                </div>
                <div>
                  <strong className="text-gray-700">Stockage:</strong>
                  <div className="text-gray-600">
                    localStorage: {Object.keys(localStorage).length} clés<br />
                    sessionStorage: {Object.keys(sessionStorage).length} clés
                  </div>
                </div>
                <div>
                  <strong className="text-gray-700">Connexion:</strong>
                  <div className="text-gray-600">
                    {'connection' in navigator 
                      ? `${(navigator as any).connection?.effectiveType || 'Inconnue'}`
                      : 'Non disponible'
                    }
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {isCollapsed && (
          <Card className="text-center py-8">
            <Bug className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Outils masqués</h3>
            <p className="text-gray-600">Cliquez sur "Afficher Outils" pour accéder aux outils de debug.</p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default DebugTools;
