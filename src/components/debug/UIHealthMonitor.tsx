import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Activity, AlertTriangle, CheckCircle, RefreshCw, Zap, Clock, Eye } from 'lucide-react';

interface UIHealthMetrics {
  renderTime: number;
  memoryUsage: number;
  eventListeners: number;
  domNodes: number;
  freezeEvents: number;
  lastUpdate: Date;
  isResponsive: boolean;
  performanceScore: number;
}

interface UIHealthMonitorProps {
  className?: string;
}

export const UIHealthMonitor: React.FC<UIHealthMonitorProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<UIHealthMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    eventListeners: 0,
    domNodes: 0,
    freezeEvents: 0,
    lastUpdate: new Date(),
    isResponsive: true,
    performanceScore: 100
  });

  const [isMonitoring, setIsMonitoring] = useState(true);
  const [history, setHistory] = useState<UIHealthMetrics[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  const measurePerformance = useCallback(() => {
    const startTime = performance.now();
    
    // Simule une mesure de performance
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime;
      
      // Mesures de base
      const domNodes = document.querySelectorAll('*').length;
      const eventListeners = document.querySelectorAll('*').length * 0.1; // Estimation
      
      // Mesure de la mémoire si disponible
      let memoryUsage = 0;
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      }

      // Calcul du score de performance
      let performanceScore = 100;
      if (renderTime > 16) performanceScore -= 20; // 60fps threshold
      if (memoryUsage > 50) performanceScore -= 15;
      if (domNodes > 1000) performanceScore -= 10;
      if (eventListeners > 100) performanceScore -= 5;

      const newMetrics: UIHealthMetrics = {
        renderTime: Math.round(renderTime * 100) / 100,
        memoryUsage: Math.round(memoryUsage * 100) / 100,
        eventListeners: Math.round(eventListeners),
        domNodes,
        freezeEvents: metrics.freezeEvents + (renderTime > 100 ? 1 : 0),
        lastUpdate: new Date(),
        isResponsive: renderTime < 100,
        performanceScore: Math.max(0, performanceScore)
      };

      setMetrics(newMetrics);
      
      // Garder un historique des 10 dernières mesures
      setHistory(prev => [...prev.slice(-9), newMetrics]);

      // Générer des alertes si nécessaire
      const newAlerts: string[] = [];
      if (renderTime > 100) newAlerts.push(`Temps de rendu élevé: ${renderTime.toFixed(2)}ms`);
      if (memoryUsage > 100) newAlerts.push(`Usage mémoire élevé: ${memoryUsage.toFixed(2)}MB`);
      if (domNodes > 2000) newAlerts.push(`Trop de nœuds DOM: ${domNodes}`);
      
      if (newAlerts.length > 0) {
        setAlerts(prev => [...prev.slice(-4), ...newAlerts]);
      }
    });
  }, [metrics.freezeEvents]);

  const forceRepaint = useCallback(() => {
    // Force un repaint de l'interface
    document.body.style.display = 'none';
    document.body.offsetHeight; // Force reflow
    document.body.style.display = '';
    
    // Force le garbage collection si possible
    if ('gc' in window) {
      (window as any).gc();
    }
    
    measurePerformance();
  }, [measurePerformance]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      renderTime: 0,
      memoryUsage: 0,
      eventListeners: 0,
      domNodes: 0,
      freezeEvents: 0,
      lastUpdate: new Date(),
      isResponsive: true,
      performanceScore: 100
    });
    setHistory([]);
    setAlerts([]);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring) {
      interval = setInterval(measurePerformance, 2000); // Mesure toutes les 2 secondes
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, measurePerformance]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Card */}
      <Card className="border-l-4 border-l-blue-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Santé de l'Interface</h3>
          </div>
          <div className="flex items-center space-x-2">
            {getHealthIcon(metrics.performanceScore)}
            <span className={`font-bold text-lg ${getHealthColor(metrics.performanceScore)}`}>
              {metrics.performanceScore}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-600 font-medium">RENDU</span>
            </div>
            <div className="mt-1">
              <div className="text-lg font-bold text-gray-900">{metrics.renderTime}ms</div>
              <div className="text-xs text-gray-500">Temps de rendu</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600 font-medium">MÉMOIRE</span>
            </div>
            <div className="mt-1">
              <div className="text-lg font-bold text-gray-900">{metrics.memoryUsage}MB</div>
              <div className="text-xs text-gray-500">Usage mémoire</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <Eye className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-purple-600 font-medium">DOM</span>
            </div>
            <div className="mt-1">
              <div className="text-lg font-bold text-gray-900">{metrics.domNodes}</div>
              <div className="text-xs text-gray-500">Nœuds DOM</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-orange-600 font-medium">FREEZE</span>
            </div>
            <div className="mt-1">
              <div className="text-lg font-bold text-gray-900">{metrics.freezeEvents}</div>
              <div className="text-xs text-gray-500">Événements de gel</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={isMonitoring ? 'secondary' : 'primary'}
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? 'Pause' : 'Reprendre'} Monitoring
          </Button>
          <Button size="sm" variant="secondary" onClick={forceRepaint}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Force Repaint
          </Button>
          <Button size="sm" variant="ghost" onClick={resetMetrics}>
            Reset Métriques
          </Button>
        </div>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-orange-800">Alertes de Performance</h4>
            <Button size="sm" variant="ghost" onClick={clearAlerts}>
              Effacer
            </Button>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-center p-2 bg-orange-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                <span className="text-sm text-orange-800">{alert}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Performance History */}
      {history.length > 0 && (
        <Card className="border-l-4 border-l-indigo-500">
          <h4 className="font-semibold text-gray-900 mb-3">Historique de Performance</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {history.slice().reverse().map((metric, index) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                <span className="text-gray-600">
                  {metric.lastUpdate.toLocaleTimeString()}
                </span>
                <div className="flex space-x-4 text-xs">
                  <span className={`font-medium ${getHealthColor(metric.performanceScore)}`}>
                    {metric.performanceScore}%
                  </span>
                  <span className="text-gray-500">{metric.renderTime}ms</span>
                  <span className="text-gray-500">{metric.memoryUsage}MB</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="text-xs text-gray-500 text-center">
        Dernière mise à jour: {metrics.lastUpdate.toLocaleString()}
      </div>
    </div>
  );
};