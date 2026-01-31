import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Database, Clock, CheckCircle, AlertCircle, XCircle, Play, Pause, Trash2, RefreshCw, Zap, Activity } from 'lucide-react';

interface QueueOperation {
  id: string;
  type: 'create' | 'read' | 'update' | 'delete';
  table: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  data?: any;
}

interface DatabaseQueueIndicatorProps {
  className?: string;
}

// Simulateur de queue de base de données
class MockDatabaseQueue {
  private static instance: MockDatabaseQueue;
  private operations: QueueOperation[] = [];
  private isProcessing = false;
  private listeners: Set<() => void> = new Set();
  private processInterval?: NodeJS.Timeout;

  static getInstance(): MockDatabaseQueue {
    if (!MockDatabaseQueue.instance) {
      MockDatabaseQueue.instance = new MockDatabaseQueue();
    }
    return MockDatabaseQueue.instance;
  }

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(callback => callback());
  }

  addOperation(operation: Omit<QueueOperation, 'id' | 'createdAt' | 'status'>): string {
    const id = Math.random().toString(36).substr(2, 9);
    const newOperation: QueueOperation = {
      ...operation,
      id,
      createdAt: new Date(),
      status: 'pending'
    };
    
    this.operations.push(newOperation);
    this.operations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    this.notify();
    this.processNext();
    return id;
  }

  private async processNext() {
    if (this.isProcessing) return;
    
    const pendingOp = this.operations.find(op => op.status === 'pending');
    if (!pendingOp) return;

    this.isProcessing = true;
    pendingOp.status = 'processing';
    pendingOp.startedAt = new Date();
    this.notify();

    try {
      // Simuler le traitement
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
      
      // Simuler un échec parfois
      if (Math.random() < 0.1) {
        throw new Error('Erreur de base de données simulée');
      }

      pendingOp.status = 'completed';
      pendingOp.completedAt = new Date();
    } catch (error) {
      pendingOp.status = 'failed';
      pendingOp.error = error instanceof Error ? error.message : 'Erreur inconnue';
      pendingOp.completedAt = new Date();
    }

    this.isProcessing = false;
    this.notify();
    
    // Traiter la prochaine opération après un délai
    setTimeout(() => this.processNext(), 100);
  }

  getOperations(): QueueOperation[] {
    return [...this.operations];
  }

  clearCompleted() {
    this.operations = this.operations.filter(op => op.status === 'pending' || op.status === 'processing');
    this.notify();
  }

  clearAll() {
    this.operations = [];
    this.notify();
  }

  getStats() {
    const total = this.operations.length;
    const pending = this.operations.filter(op => op.status === 'pending').length;
    const processing = this.operations.filter(op => op.status === 'processing').length;
    const completed = this.operations.filter(op => op.status === 'completed').length;
    const failed = this.operations.filter(op => op.status === 'failed').length;
    
    return { total, pending, processing, completed, failed };
  }

  // Ajouter quelques opérations de test
  addTestOperations() {
    const testOps = [
      { type: 'create' as const, table: 'personnel', priority: 'high' as const, data: { name: 'Test User' } },
      { type: 'read' as const, table: 'evaluations', priority: 'medium' as const, data: { query: 'all' } },
      { type: 'update' as const, table: 'personnel', priority: 'low' as const, data: { id: 1, name: 'Updated' } },
      { type: 'delete' as const, table: 'themes', priority: 'medium' as const, data: { id: 5 } }
    ];

    testOps.forEach(op => this.addOperation(op));
  }
}

export const DatabaseQueueIndicator: React.FC<DatabaseQueueIndicatorProps> = ({ className = '' }) => {
  const [operations, setOperations] = useState<QueueOperation[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, completed: 0, failed: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);

  const queue = MockDatabaseQueue.getInstance();

  const refreshData = useCallback(() => {
    setOperations(queue.getOperations());
    setStats(queue.getStats());
  }, [queue]);

  const addTestOperations = useCallback(() => {
    queue.addTestOperations();
  }, [queue]);

  const clearCompleted = useCallback(() => {
    queue.clearCompleted();
  }, [queue]);

  const clearAll = useCallback(() => {
    if (confirm('Êtes-vous sûr de vouloir vider toute la queue ?')) {
      queue.clearAll();
    }
  }, [queue]);

  const forceRepaint = useCallback(() => {
    // Force un repaint
    document.body.style.transform = 'scale(1.0001)';
    setTimeout(() => {
      document.body.style.transform = '';
    }, 10);
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    refreshData();
    const unsubscribe = queue.subscribe(refreshData);
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(refreshData, 1000);
    }

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [queue, refreshData, autoRefresh]);

  const getStatusColor = (status: QueueOperation['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'processing': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: QueueOperation['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing': return <Activity className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: QueueOperation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverallStatus = () => {
    if (stats.processing > 0) return { color: 'text-blue-600', label: 'En cours' };
    if (stats.pending > 0) return { color: 'text-yellow-600', label: 'En attente' };
    if (stats.failed > 0) return { color: 'text-red-600', label: 'Erreurs' };
    return { color: 'text-green-600', label: 'Inactif' };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Card */}
      <Card className="border-l-4 border-l-indigo-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-indigo-500" />
            <h3 className="text-lg font-semibold text-gray-900">Queue Base de Données</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className={`w-5 h-5 ${stats.processing > 0 ? 'animate-spin text-blue-500' : 'text-gray-400'}`} />
            <span className={`font-bold text-lg ${overallStatus.color}`}>
              {overallStatus.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <Database className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600 font-medium">TOTAL</span>
            </div>
            <div className="mt-1">
              <div className="text-lg font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">Opérations</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-600 font-medium">ATTENTE</span>
            </div>
            <div className="mt-1">
              <div className="text-lg font-bold text-gray-900">{stats.pending}</div>
              <div className="text-xs text-gray-500">En attente</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <Activity className={`w-4 h-4 text-blue-500 ${stats.processing > 0 ? 'animate-spin' : ''}`} />
              <span className="text-xs text-blue-600 font-medium">COURS</span>
            </div>
            <div className="mt-1">
              <div className="text-lg font-bold text-gray-900">{stats.processing}</div>
              <div className="text-xs text-gray-500">En cours</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600 font-medium">OK</span>
            </div>
            <div className="mt-1">
              <div className="text-lg font-bold text-gray-900">{stats.completed}</div>
              <div className="text-xs text-gray-500">Terminées</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600 font-medium">ERREUR</span>
            </div>
            <div className="mt-1">
              <div className="text-lg font-bold text-gray-900">{stats.failed}</div>
              <div className="text-xs text-gray-500">Échecs</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={addTestOperations}>
            Ajouter Tests
          </Button>
          <Button size="sm" variant="secondary" onClick={forceRepaint}>
            <Zap className="w-4 h-4 mr-1" />
            Force Repaint
          </Button>
          <Button size="sm" variant="secondary" onClick={clearCompleted}>
            Nettoyer Terminées
          </Button>
          <Button size="sm" variant="danger" onClick={clearAll}>
            <Trash2 className="w-4 h-4 mr-1" />
            Vider Queue
          </Button>
          <Button
            size="sm"
            variant={autoRefresh ? 'secondary' : 'ghost'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            Auto-refresh
          </Button>
        </div>
      </Card>

      {/* Operations List */}
      {operations.length > 0 && (
        <Card className="border-l-4 border-l-purple-500">
          <h4 className="font-semibold text-gray-900 mb-3">Opérations de la Queue</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {operations.slice().reverse().map((operation) => (
              <div key={operation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(operation.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {operation.type.toUpperCase()} {operation.table}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(operation.priority)}`}>
                        {operation.priority}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Créée: {operation.createdAt.toLocaleTimeString()}
                      {operation.startedAt && (
                        <> • Démarrée: {operation.startedAt.toLocaleTimeString()}</>
                      )}
                      {operation.completedAt && (
                        <> • Terminée: {operation.completedAt.toLocaleTimeString()}</>
                      )}
                    </div>
                    {operation.error && (
                      <div className="text-xs text-red-600 mt-1 font-medium">
                        Erreur: {operation.error}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${getStatusColor(operation.status)}`}>
                    {operation.status}
                  </span>
                  {operation.startedAt && operation.completedAt && (
                    <div className="text-xs text-gray-500">
                      {Math.round((operation.completedAt.getTime() - operation.startedAt.getTime()))}ms
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {operations.length === 0 && (
        <Card className="border-l-4 border-l-gray-300">
          <div className="text-center py-8">
            <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Queue vide</h3>
            <p className="text-gray-600 mb-4">Aucune opération de base de données en cours.</p>
            <Button onClick={addTestOperations}>
              Ajouter des opérations de test
            </Button>
          </div>
        </Card>
      )}

      <div className="text-xs text-gray-500 text-center">
        Auto-refresh: {autoRefresh ? 'Activé' : 'Désactivé'} • 
        Dernière mise à jour: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};