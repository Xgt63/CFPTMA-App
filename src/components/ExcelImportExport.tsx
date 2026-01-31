import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { ExcelService } from '../services/excelService';
import { DatabaseService } from '../services/database';
import { Download, Upload, FileText, CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';

interface ImportResult {
  success: number;
  errors: string[];
  skipped: number;
}

interface ExcelImportExportProps {
  onClose?: () => void;
}

export const ExcelImportExport: React.FC<ExcelImportExportProps> = ({ onClose }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportTemplate = () => {
    try {
      ExcelService.generateTemplate();
    } catch (error) {
      console.error('Erreur lors de l\'export du modèle:', error);
      alert('Erreur lors de la génération du modèle Excel');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImportFile(file);
    }
  };

  const handleImportFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    setImportErrors([]);

    try {
      // Parser le fichier Excel
      const evaluationsData = await ExcelService.parseExcelFile(file);
      
      let successCount = 0;
      let skippedCount = 0;
      const allErrors: string[] = [];

      // Traiter chaque évaluation
      for (let i = 0; i < evaluationsData.length; i++) {
        const data = evaluationsData[i];
        
        try {
          // Valider les données
          const validationErrors = ExcelService.validateEvaluationData(data);
          
          if (validationErrors.length > 0) {
            allErrors.push(`Ligne ${i + 2}: ${validationErrors.join(', ')}`);
            skippedCount++;
            continue;
          }

          // Convertir au format de l'application
          const appData = ExcelService.convertToAppFormat(data);
          
          // Vérifier si l'utilisateur existe déjà ou le créer
          let staffMemberId: number | undefined;
          
          if (appData.email) {
            const existingStaff = await DatabaseService.getStaff();
            const safeExistingStaff = Array.isArray(existingStaff) ? existingStaff : [];
            const existingMember = safeExistingStaff.find((s: any) => s?.email === appData.email);
            
            if (existingMember) {
              staffMemberId = existingMember.id;
            } else {
              // Créer un nouveau membre du personnel
              const newMember = {
                matricule: appData.matricule || `MAT${Date.now()}${i}`,
                firstName: appData.firstName,
                lastName: appData.lastName,
                position: appData.position || '',
                email: appData.email,
                phone: appData.phone || '',
                establishment: appData.establishment || '',
                gender: appData.gender || '',
                formationYear: new Date().getFullYear().toString()
              };
              
              const result = await DatabaseService.createStaff(newMember);
              staffMemberId = result.id || result.lastInsertRowid;
            }
          }

          // Créer l'évaluation
          const evaluationData = {
            staffId: staffMemberId,
            status: 'completed',
            ...appData,
            fillDate: appData.fillDate || new Date().toISOString().split('T')[0]
          };

          await DatabaseService.createEvaluation(evaluationData);
          successCount++;
          
        } catch (error) {
          console.error(`Erreur ligne ${i + 2}:`, error);
          allErrors.push(`Ligne ${i + 2}: Erreur lors de l'import - ${error}`);
          skippedCount++;
        }
      }

      setImportResult({
        success: successCount,
        errors: allErrors,
        skipped: skippedCount
      });

      if (successCount > 0) {
        // Rafraîchir la page pour voir les nouvelles données
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }

    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      setImportErrors([`Erreur lors de la lecture du fichier: ${error}`]);
    } finally {
      setIsImporting(false);
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Section 1: Télécharger le modèle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Download className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">1. Télécharger le modèle</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Commencez par télécharger le modèle Excel. Il contient seulement les champs essentiels pour une saisie rapide.
          </p>
          <Button
            onClick={handleExportTemplate}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger le modèle simplifié
          </Button>
        </div>
      </div>

      {/* Section 2: Remplir et importer */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-green-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Upload className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">2. Remplir et importer</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-600 mb-2">Après avoir rempli le fichier Excel, importez-le ici :</p>
            <div className="flex items-center text-sm text-gray-500 space-x-4">
              <span>• Une ligne = une personne évaluée</span>
              <span>• Notes de 0 à 5</span>
              <span>• Dates AAAA-MM-JJ</span>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            onClick={triggerFileSelect}
            disabled={isImporting}
            className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importation...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Sélectionner le fichier Excel
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Résultats */}
      {importResult && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              {importResult.success > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
              )}
              <h2 className="text-lg font-semibold text-gray-900">Résultats de l'import</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{importResult.success}</div>
                <div className="text-sm text-green-600">Importées</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{importResult.skipped}</div>
                <div className="text-sm text-yellow-600">Ignorées</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{importResult.errors.length}</div>
                <div className="text-sm text-red-600">Erreurs</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-800 mb-2">Erreurs détectées :</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importResult.success > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  ✅ {importResult.success} évaluation(s) importée(s) avec succès !
                </p>
                <p className="text-green-700 text-sm mt-1">La page se rafraîchira automatiquement.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Erreurs générales */}
      {importErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center mb-2">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="font-medium text-red-800">Problème d'import</h3>
          </div>
          {importErrors.map((error, index) => (
            <div key={index} className="text-red-700 text-sm">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Aide rapide */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center mb-3">
          <FileText className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="font-medium text-gray-900">Modèle simplifié</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <strong>Champs obligatoires :</strong>
            <ul className="mt-1 space-y-1">
              <li>• Prénom et Nom</li>
              <li>• Email</li>
              <li>• Nom de la formation</li>
            </ul>
          </div>
          <div>
            <strong>Notes (0 à 5) :</strong>
            <ul className="mt-1 space-y-1">
              <li>• Satisfaction globale</li>
              <li>• Qualité du contenu</li>
              <li>• Qualité du formateur</li>
              <li>• Recommandation</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bouton Revenir */}
      {onClose && (
        <div className="flex justify-center pt-6 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl font-medium transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Revenir
          </Button>
        </div>
      )}
    </div>
  );
};