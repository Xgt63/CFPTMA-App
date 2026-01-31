import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DatabaseValidator } from '../services/databaseValidator';
import { loadTestData, clearTestData } from '../utils/testData';
import { DatabaseService } from '../services/database';
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Wrench, 
  RefreshCw, 
  Trash2, 
  Users, 
  BarChart3,
  Settings 
} from 'lucide-react';

interface DiagnosticResult {
  localStorage: {
    staff: { count: number; valid: number; issues: string[] };
    evaluations: { count: number; valid: number; issues: string[] };
    themes: { count: number; valid: number; issues: string[] };
  };
  electron: {
    available: boolean;
    working: boolean;
  };
  recommendations: string[];
}

export const DatabaseDiagnostic: React.FC = () => {
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [migrationReport, setMigrationReport] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      console.log('🔍 Lancement du diagnostic...');
      const result = await DatabaseValidator.diagnoseDatabase();
      setDiagnostic(result);
      setLastUpdate(new Date());
      console.log('📋 Diagnostic terminé:', result);
    } catch (error) {
      console.error('❌ Erreur diagnostic:', error);
      alert('Erreur lors du diagnostic: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const runMigration = async () => {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir migrer et nettoyer la base de données ? Cette action ne peut pas être annulée.')) {
      return;
    }

    setIsRunning(true);
    try {
      console.log('🔧 Lancement de la migration...');
      const result = await DatabaseValidator.migrateAndCleanDatabase();
      setMigrationReport(result.report);
      
      if (result.success) {
        alert('✅ Migration réussie ! Consultez le rapport pour les détails.');
        // Relancer le diagnostic
        setTimeout(() => runDiagnostic(), 1000);
      } else {
        alert('❌ Erreurs lors de la migration. Consultez le rapport pour les détails.');
      }
    } catch (error) {
      console.error('❌ Erreur migration:', error);
      alert('Erreur lors de la migration: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const loadSampleData = async () => {
    if (!confirm('Voulez-vous charger des données de test ? Cela ajoutera du personnel et des évaluations fictifs.')) {
      return;
    }

    setIsRunning(true);
    try {
      const result = await loadTestData();
      if (result.success) {
        alert(`✅ Données de test chargées!\n👥 ${result.staff} employés\n📊 ${result.evaluations} évaluations`);
        setTimeout(() => runDiagnostic(), 1000);
      } else {
        alert('❌ Erreur lors du chargement: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Erreur chargement données test:', error);
      alert('Erreur lors du chargement des données de test: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const clearAllData = async () => {
    if (!confirm('⚠️ ATTENTION: Cela supprimera TOUTES les données de l\'application. Êtes-vous absolument sûr ?')) {
      return;
    }

    if (!confirm('🚨 DERNIÈRE CHANCE: Toutes les données seront perdues définitivement. Continuer ?')) {
      return;
    }

    setIsRunning(true);
    try {
      await clearTestData();
      alert('🧹 Toutes les données ont été supprimées');
      setTimeout(() => runDiagnostic(), 1000);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const forceRefresh = () => {
    DatabaseService.forceSyncAll();
    alert('🔄 Synchronisation forcée déclenchée');
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const getStatusIcon = (valid: number, total: number) => {
    if (total === 0) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    if (valid === total) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = (valid: number, total: number) => {
    if (total === 0) return 'border-yellow-200 bg-yellow-50';
    if (valid === total) return 'border-green-200 bg-green-50';
    return 'border-red-200 bg-red-50';
  };

  return (
    <Layout 
      title="Diagnostic de Base de Données" 
      subtitle="Outil de diagnostic et réparation"
    >
      <div className="space-y-6">
        {/* Actions principales */}
        <Card>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={runDiagnostic} 
              disabled={isRunning}
              className="flex items-center"
            >
              <Database className={`mr-2 h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Diagnostic...' : 'Lancer Diagnostic'}
            </Button>

            <Button 
              onClick={runMigration} 
              disabled={isRunning || !diagnostic}
              variant="secondary"
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              <Wrench className="mr-2 h-4 w-4" />
              Réparer & Migrer
            </Button>

            <Button 
              onClick={loadSampleData} 
              disabled={isRunning}
              variant="secondary"
              className="flex items-center text-green-600 hover:text-green-700"
            >
              <Users className="mr-2 h-4 w-4" />
              Données Test
            </Button>

            <Button 
              onClick={forceRefresh} 
              disabled={isRunning}
              variant="secondary"
              className="flex items-center text-purple-600 hover:text-purple-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Forcée
            </Button>

            <Button 
              onClick={clearAllData} 
              disabled={isRunning}
              variant="secondary"
              className="flex items-center text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Vider Tout
            </Button>
          </div>

          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-4">
              Dernier diagnostic: {lastUpdate.toLocaleString('fr-FR')}
            </p>
          )}
        </Card>

        {/* État du système */}
        {diagnostic && (
          <Card title="État du Système">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Electron Status */}
              <div className={`p-4 rounded-lg border-2 ${diagnostic.electron.available ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <h4 className="font-medium">API Electron</h4>
                      <p className="text-sm text-gray-600">
                        {diagnostic.electron.available ? 
                          (diagnostic.electron.working ? 'Disponible et fonctionnelle' : 'Disponible mais erreur') :
                          'Mode développement web'
                        }
                      </p>
                    </div>
                  </div>
                  {diagnostic.electron.available ? 
                    (diagnostic.electron.working ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> : 
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) :
                    <XCircle className="h-5 w-5 text-gray-500" />
                  }
                </div>
              </div>

              {/* localStorage Status */}
              <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-purple-500 mr-3" />
                    <div>
                      <h4 className="font-medium">localStorage</h4>
                      <p className="text-sm text-gray-600">
                        Stockage local du navigateur
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* État des données */}
        {diagnostic && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Personnel */}
            <Card title="👥 Personnel">
              <div className={`p-4 rounded-lg border-2 ${getStatusColor(diagnostic.localStorage.staff.valid, diagnostic.localStorage.staff.count)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-2xl font-bold">{diagnostic.localStorage.staff.count}</p>
                    <p className="text-sm text-gray-600">Total membres</p>
                  </div>
                  {getStatusIcon(diagnostic.localStorage.staff.valid, diagnostic.localStorage.staff.count)}
                </div>
                <div className="text-sm">
                  <p className="text-green-600">✅ Valides: {diagnostic.localStorage.staff.valid}</p>
                  <p className="text-red-600">❌ Invalides: {diagnostic.localStorage.staff.count - diagnostic.localStorage.staff.valid}</p>
                </div>
                {diagnostic.localStorage.staff.issues.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium">Voir les problèmes ({diagnostic.localStorage.staff.issues.length})</summary>
                    <div className="mt-2 text-xs bg-white p-2 rounded max-h-32 overflow-y-auto">
                      {diagnostic.localStorage.staff.issues.map((issue, i) => (
                        <div key={i} className="text-red-600">• {issue}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </Card>

            {/* Évaluations */}
            <Card title="📊 Évaluations">
              <div className={`p-4 rounded-lg border-2 ${getStatusColor(diagnostic.localStorage.evaluations.valid, diagnostic.localStorage.evaluations.count)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-2xl font-bold">{diagnostic.localStorage.evaluations.count}</p>
                    <p className="text-sm text-gray-600">Total évaluations</p>
                  </div>
                  {getStatusIcon(diagnostic.localStorage.evaluations.valid, diagnostic.localStorage.evaluations.count)}
                </div>
                <div className="text-sm">
                  <p className="text-green-600">✅ Valides: {diagnostic.localStorage.evaluations.valid}</p>
                  <p className="text-red-600">❌ Invalides: {diagnostic.localStorage.evaluations.count - diagnostic.localStorage.evaluations.valid}</p>
                </div>
                {diagnostic.localStorage.evaluations.issues.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium">Voir les problèmes ({diagnostic.localStorage.evaluations.issues.length})</summary>
                    <div className="mt-2 text-xs bg-white p-2 rounded max-h-32 overflow-y-auto">
                      {diagnostic.localStorage.evaluations.issues.map((issue, i) => (
                        <div key={i} className="text-red-600">• {issue}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </Card>

            {/* Thèmes */}
            <Card title="🎯 Thèmes">
              <div className={`p-4 rounded-lg border-2 ${getStatusColor(diagnostic.localStorage.themes.valid, diagnostic.localStorage.themes.count)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-2xl font-bold">{diagnostic.localStorage.themes.count}</p>
                    <p className="text-sm text-gray-600">Total thèmes</p>
                  </div>
                  {getStatusIcon(diagnostic.localStorage.themes.valid, diagnostic.localStorage.themes.count)}
                </div>
                <div className="text-sm">
                  <p className="text-green-600">✅ Valides: {diagnostic.localStorage.themes.valid}</p>
                  <p className="text-red-600">❌ Invalides: {diagnostic.localStorage.themes.count - diagnostic.localStorage.themes.valid}</p>
                </div>
                {diagnostic.localStorage.themes.issues.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium">Voir les problèmes ({diagnostic.localStorage.themes.issues.length})</summary>
                    <div className="mt-2 text-xs bg-white p-2 rounded max-h-32 overflow-y-auto">
                      {diagnostic.localStorage.themes.issues.map((issue, i) => (
                        <div key={i} className="text-red-600">• {issue}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Recommandations */}
        {diagnostic && diagnostic.recommendations.length > 0 && (
          <Card title="💡 Recommandations">
            <div className="space-y-2">
              {diagnostic.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Rapport de migration */}
        {migrationReport && (
          <Card title="📋 Rapport de Migration">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <h5 className="font-medium text-blue-800">Personnel</h5>
                  <p className="text-sm">Total: {migrationReport.staff.total}</p>
                  <p className="text-sm text-green-600">Valides: {migrationReport.staff.valid}</p>
                  <p className="text-sm text-red-600">Invalides: {migrationReport.staff.invalid}</p>
                  <p className="text-sm text-yellow-600">Doublons: {migrationReport.staff.duplicates}</p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <h5 className="font-medium text-green-800">Évaluations</h5>
                  <p className="text-sm">Total: {migrationReport.evaluations.total}</p>
                  <p className="text-sm text-green-600">Valides: {migrationReport.evaluations.valid}</p>
                  <p className="text-sm text-red-600">Invalides: {migrationReport.evaluations.invalid}</p>
                  <p className="text-sm text-orange-600">Orphelines: {migrationReport.evaluations.orphaned}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <h5 className="font-medium text-purple-800">Thèmes</h5>
                  <p className="text-sm">Total: {migrationReport.themes.total}</p>
                  <p className="text-sm text-green-600">Valides: {migrationReport.themes.valid}</p>
                  <p className="text-sm text-red-600">Invalides: {migrationReport.themes.invalid}</p>
                </div>
              </div>

              {migrationReport.errors.length > 0 && (
                <details>
                  <summary className="cursor-pointer font-medium">Erreurs détaillées ({migrationReport.errors.length})</summary>
                  <div className="mt-2 bg-red-50 p-3 rounded max-h-64 overflow-y-auto">
                    {migrationReport.errors.map((error: string, i: number) => (
                      <div key={i} className="text-sm text-red-700">• {error}</div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </Card>
        )}

        {/* Instructions d'utilisation */}
        <Card title="📖 Instructions">
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>🔍 Lancer Diagnostic:</strong> Analyse l'état actuel de la base de données</p>
            <p><strong>🔧 Réparer & Migrer:</strong> Nettoie et corrige toutes les données invalides</p>
            <p><strong>👥 Données Test:</strong> Charge des données d'exemple pour tester l'application</p>
            <p><strong>🔄 Sync Forcée:</strong> Force la synchronisation de toutes les pages</p>
            <p><strong>🗑️ Vider Tout:</strong> Supprime toutes les données (⚠️ irréversible)</p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};