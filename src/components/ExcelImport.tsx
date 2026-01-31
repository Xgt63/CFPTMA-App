/**
 * 📊 Composant d'Importation Excel
 * Interface utilisateur pour importer les données de l'ancienne application
 */

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Users, BookOpen, Target, ArrowLeft, X } from 'lucide-react';
import { ExcelImportService, ImportResult } from '../services/excelImportService';

interface ExcelImportProps {
  onImportComplete?: (result: ImportResult) => void;
  onClose?: () => void;
}

export const ExcelImport: React.FC<ExcelImportProps> = ({ onImportComplete, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => 
      file.name.toLowerCase().endsWith('.xlsx') || 
      file.name.toLowerCase().endsWith('.xls')
    );
    
    if (excelFile) {
      handleFileImport(excelFile);
    } else {
      alert('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  };

  const handleFileImport = async (file: File) => {
    setIsImporting(true);
    setImportResult(null);

    try {
      console.log('📂 Importation du fichier:', file.name);
      const result = await ExcelImportService.importExcelFile(file);
      
      setImportResult(result);
      setShowPreview(true);
      
      if (result.success) {
        console.log('✅ Importation réussie:', result.summary);
      } else {
        console.warn('⚠️ Importation avec erreurs:', result.errors);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'importation:', error);
      setImportResult({
        success: false,
        data: { staff: [], evaluations: [], themes: [] },
        errors: [`Erreur lors de l'importation: ${error.message}`],
        summary: { staffImported: 0, evaluationsImported: 0, themesImported: 0, duplicatesIgnored: 0 }
      });
      setShowPreview(true);
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult) return;

    try {
      const saved = await ExcelImportService.saveImportedData(importResult);
      if (saved) {
        if (onImportComplete) {
          onImportComplete(importResult);
        }
        alert('✅ Données importées et sauvegardées avec succès !');
        if (onClose) {
          onClose();
        }
      } else {
        alert('❌ Erreur lors de la sauvegarde des données');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde des données');
    }
  };

  const downloadTemplate = () => {
    // Créer un template Excel pour aider l'utilisateur
    const templateData = {
      Personnel: [
        ['Prénom', 'Nom', 'Email', 'Poste', 'Département', 'Téléphone', 'Matricule'],
        ['Jean', 'Dupont', 'jean.dupont@company.com', 'Manager', 'IT', '0123456789', 'MAT001'],
        ['Marie', 'Martin', 'marie.martin@company.com', 'Développeur', 'IT', '0123456790', 'MAT002']
      ],
      Evaluations: [
        ['Prénom', 'Nom', 'Formation', 'Date', 'Note Communication', 'Note Leadership', 'Note Technique', 'Commentaires'],
        ['Jean', 'Dupont', 'Formation Leadership', '2024-01-15', '4', '5', '3', 'Très bon participant'],
        ['Marie', 'Martin', 'Formation Technique', '2024-01-20', '5', '4', '5', 'Excellente maîtrise technique']
      ],
      Themes: [
        ['Nom', 'Description'],
        ['Leadership Management', 'Formation sur les techniques de leadership'],
        ['Communication Efficace', 'Améliorer ses compétences en communication'],
        ['Sécurité au Travail', 'Formation sur les règles de sécurité']
      ]
    };

    // Note: Pour une vraie implémentation, vous pourriez utiliser une bibliothèque comme xlsx pour générer le fichier
    console.log('📋 Template de données:', templateData);
    alert('📋 Template disponible dans la console (F12). Dans une version production, ceci téléchargerait un fichier Excel template.');
  };

  return (
    <div className="modal-overlay bg-gradient-to-br from-blue-900/95 via-indigo-900/95 to-purple-900/95 backdrop-blur-sm">
      <div className="modal-content">
        <div className="bg-transparent backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl w-full overflow-y-auto max-h-[90vh]">
          {/* Titre centré */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <FileSpreadsheet className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Importation Excel
            </h2>
            <p className="text-blue-200">Importez vos données facilement</p>
          </div>

          {/* Contenu principal avec fond blanc */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 mx-4">
            {!showPreview ? (
              // Zone d'upload avec design moderne
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-700 mb-6 text-lg">
                    Importez les données de votre ancienne application Excel
                  </p>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200 rounded-xl transition-all duration-200 shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span className="font-medium">Télécharger un template Excel</span>
                </button>
              </div>

              {/* Zone de drop moderne */}
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  isDragging
                    ? 'border-blue-400 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 scale-105 shadow-lg'
                    : 'border-gray-300/60 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-indigo-50/30'
                } backdrop-blur-sm`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={`transition-all duration-300 ${
                  isDragging ? 'scale-110' : 'scale-100'
                }`}>
                  <Upload className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                  <p className="text-xl font-bold text-gray-700 mb-3">
                    Glissez-déposez votre fichier Excel ici
                  </p>
                  <p className="text-gray-500 mb-6 text-lg">ou</p>
                  <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    <FileSpreadsheet className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Choisir un fichier</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-4">
                    Formats supportés: .xlsx, .xls (Max: 10MB)
                  </p>
                </div>
              </div>

              {/* Instructions modernes */}
              <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-blue-800 mb-4 text-lg flex items-center">
                  📋 Format attendu
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <strong className="text-blue-700">Personnel</strong>
                    </div>
                    <p className="text-sm text-blue-600">Prénom, Nom, Email, Poste, Département</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-green-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <BookOpen className="h-4 w-4 text-green-600" />
                      <strong className="text-green-700">Évaluations</strong>
                    </div>
                    <p className="text-sm text-green-600">Prénom, Nom, Formation, Date, Notes (1-5)</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <strong className="text-purple-700">Thèmes</strong>
                    </div>
                    <p className="text-sm text-purple-600">Nom, Description</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-100/50 rounded-xl">
                  <p className="text-sm text-blue-700 font-medium">
                    ✨ L'outil détecte automatiquement le type de données dans chaque feuille
                  </p>
                </div>
              </div>


              {/* Chargement moderne */}
              {isImporting && (
                <div className="text-center py-12">
                  <div className="relative">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 shadow-lg"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileSpreadsheet className="h-5 w-5 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-gray-700 mt-4 font-medium text-lg">Importation en cours...</p>
                  <p className="text-gray-500 mt-1 text-sm">Analyse des données Excel en cours</p>
                </div>
              )}
            </div>
          ) : (
            // Prévisualisation des résultats avec design moderne
            <div className="space-y-6">
              {/* Statut moderne */}
              <div className={`rounded-2xl p-6 shadow-lg backdrop-blur-sm ${
                importResult?.success 
                  ? 'bg-gradient-to-r from-green-50/90 to-emerald-50/90 border border-green-200/60' 
                  : 'bg-gradient-to-r from-red-50/90 to-rose-50/90 border border-red-200/60'
              }`}>
                <div className="flex items-center justify-center">
                  <div className={`p-3 rounded-full shadow-lg mr-4 ${
                    importResult?.success ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {importResult?.success ? (
                      <CheckCircle className="h-6 w-6 text-white" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div className="text-center">
                    <span className={`font-bold text-xl ${
                      importResult?.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {importResult?.success ? 'Importation réussie ! ✨' : 'Importation avec erreurs ⚠️'}
                    </span>
                    <p className={`text-sm mt-1 ${
                      importResult?.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {importResult?.success 
                        ? 'Toutes vos données ont été importées avec succès'
                        : 'Certaines données n’ont pas pu être importées'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Résumé moderne avec cartes améliorées */}
              {importResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/60 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-blue-800">
                          {importResult.summary.staffImported}
                        </p>
                      </div>
                    </div>
                    <p className="text-blue-700 font-semibold">Membres du personnel</p>
                    <p className="text-blue-600 text-sm">Importés avec succès</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50/80 to-green-100/60 backdrop-blur-sm border border-green-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-green-800">
                          {importResult.summary.evaluationsImported}
                        </p>
                      </div>
                    </div>
                    <p className="text-green-700 font-semibold">Évaluations</p>
                    <p className="text-green-600 text-sm">Importées avec succès</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50/80 to-purple-100/60 backdrop-blur-sm border border-purple-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-purple-800">
                          {importResult.summary.themesImported}
                        </p>
                      </div>
                    </div>
                    <p className="text-purple-700 font-semibold">Thèmes de formation</p>
                    <p className="text-purple-600 text-sm">Importés avec succès</p>
                  </div>
                </div>
              )}

              {/* Doublons ignorés avec design moderne */}
              {importResult && importResult.summary.duplicatesIgnored > 0 && (
                <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 backdrop-blur-sm border border-amber-200/60 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-amber-500 rounded-lg mr-3">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-amber-800 font-medium">
                      📄 <strong>{importResult.summary.duplicatesIgnored}</strong> doublons détectés et ignorés
                    </p>
                  </div>
                </div>
              )}

              {/* Erreurs avec design moderne */}
              {importResult && importResult.errors.length > 0 && (
                <div className="bg-gradient-to-r from-red-50/80 to-rose-50/80 backdrop-blur-sm border border-red-200/60 rounded-2xl p-6 shadow-sm">
                  <h4 className="font-bold text-red-800 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Erreurs détectées :
                  </h4>
                  <ul className="text-sm text-red-700 space-y-2 max-h-40 overflow-y-auto bg-white/50 rounded-xl p-4">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions modernes avec boutons centrés */}
              <div className="flex flex-col items-center gap-4 pt-6 border-t border-gray-200/50">
                {importResult?.success && (
                  <button
                    onClick={handleConfirmImport}
                    className="flex items-center justify-center space-x-2 px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Confirmer l'importation</span>
                  </button>
                )}
                
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl transition-all duration-200 font-medium shadow-sm border border-gray-300/50"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Importer un autre fichier</span>
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Retour</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Bouton Retour centré */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', marginBottom: '20px' }}>
            <button
              style={{
                backgroundColor: '#4B4BFF',
                color: '#fff',
                borderRadius: '8px',
                padding: '10px 20px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '16px'
              }}
              onClick={onClose}
            >
              ← Retour
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
