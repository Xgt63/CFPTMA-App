import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Printer, FileText, Users, Database, Shield, Building2 } from 'lucide-react';
import { CFPTLogo } from '../components/ui/CFPTLogo';

interface SetupConfig {
  usePrinter: boolean;
  invoiceDisplay: 'screen' | 'print' | 'both';
  userMode: 'single' | 'multi';
  multiRegister: boolean;
  auditLogging: boolean;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
}

export const SetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [config, setConfig] = useState<SetupConfig>({
    usePrinter: false,
    invoiceDisplay: 'screen',
    userMode: 'single',
    multiRegister: false,
    auditLogging: true,
    companyName: 'CFPT Ivato',
    companyAddress: '',
    companyPhone: '',
    companyEmail: ''
  });

  const handleCheckboxChange = (field: keyof SetupConfig, value: boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: keyof SetupConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: keyof SetupConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Sauvegarder la configuration via Electron API
      if (window.electronAPI) {
        await window.electronAPI.updateAppConfig({
          ...config,
          setupCompleted: true
        });
        console.log('✅ Configuration initiale sauvegardée');
      } else {
        // Mode web : sauvegarder dans localStorage
        localStorage.setItem('app_config', JSON.stringify({
          ...config,
          setupCompleted: true
        }));
      }

      // Créer un log d'audit
      if (window.electronAPI && config.auditLogging) {
        await window.electronAPI.createAuditLog({
          action: 'SETUP_COMPLETED',
          tableName: 'app_config',
          newValue: config
        });
      }

      // Rediriger vers le dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur sauvegarde configuration:', error);
      alert('Erreur lors de la sauvegarde de la configuration. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0011ef] to-blue-600 p-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <CFPTLogo className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">
            Bienvenue sur le Système de Gestion des Évaluations
          </h1>
          <p className="text-center text-blue-100">
            Configuration initiale - Personnalisez votre expérience
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-gray-100 px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 3 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step <= currentStep
                      ? 'bg-[#0011ef] text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step < currentStep ? <Check className="w-6 h-6" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-[#0011ef]' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Fonctionnalités</span>
            <span>Préférences</span>
            <span>Informations</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step 1: Fonctionnalités */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Database className="w-6 h-6 mr-2 text-[#0011ef]" />
                Fonctionnalités du système
              </h2>

              {/* Imprimante */}
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition-colors">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.usePrinter}
                    onChange={(e) => handleCheckboxChange('usePrinter', e.target.checked)}
                    className="mt-1 w-5 h-5 text-[#0011ef] rounded focus:ring-2 focus:ring-[#0011ef]"
                  />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center">
                      <Printer className="w-5 h-5 text-gray-600 mr-2" />
                      <span className="font-semibold text-gray-800">Utiliser une imprimante</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Activer les fonctionnalités d'impression pour les rapports et documents
                    </p>
                  </div>
                </label>
              </div>

              {/* Multi-utilisateur */}
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition-colors">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.userMode === 'multi'}
                    onChange={(e) => handleSelectChange('userMode', e.target.checked ? 'multi' : 'single')}
                    className="mt-1 w-5 h-5 text-[#0011ef] rounded focus:ring-2 focus:ring-[#0011ef]"
                  />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-gray-600 mr-2" />
                      <span className="font-semibold text-gray-800">Mode multi-utilisateurs</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Permettre à plusieurs utilisateurs de travailler simultanément
                    </p>
                  </div>
                </label>
              </div>

              {/* Multi-caisse */}
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition-colors">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.multiRegister}
                    onChange={(e) => handleCheckboxChange('multiRegister', e.target.checked)}
                    className="mt-1 w-5 h-5 text-[#0011ef] rounded focus:ring-2 focus:ring-[#0011ef]"
                  />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center">
                      <Database className="w-5 h-5 text-gray-600 mr-2" />
                      <span className="font-semibold text-gray-800">Support multi-caisse</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Gérer plusieurs caisses ou points d'enregistrement
                    </p>
                  </div>
                </label>
              </div>

              {/* Audit Logging */}
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition-colors">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.auditLogging}
                    onChange={(e) => handleCheckboxChange('auditLogging', e.target.checked)}
                    className="mt-1 w-5 h-5 text-[#0011ef] rounded focus:ring-2 focus:ring-[#0011ef]"
                  />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 text-gray-600 mr-2" />
                      <span className="font-semibold text-gray-800">Logs d'audit (Recommandé)</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Tracer toutes les actions des utilisateurs pour la sécurité et la conformité
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Préférences */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-[#0011ef]" />
                Préférences d'affichage
              </h2>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-gray-700 font-medium">Affichage des factures et documents</span>
                  <select
                    value={config.invoiceDisplay}
                    onChange={(e) => handleSelectChange('invoiceDisplay', e.target.value)}
                    className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                  >
                    <option value="screen">Afficher à l'écran uniquement</option>
                    <option value="print">Imprimer directement</option>
                    <option value="both">Afficher à l'écran puis imprimer</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Choisissez comment les documents doivent être présentés
                  </p>
                </label>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Modifiable ultérieurement
                      </h3>
                      <div className="mt-1 text-sm text-blue-700">
                        Toutes ces options pourront être modifiées dans les Paramètres de l'application
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Informations */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Building2 className="w-6 h-6 mr-2 text-[#0011ef]" />
                Informations de l'établissement
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Nom de l'établissement
                  </label>
                  <input
                    type="text"
                    value={config.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                    placeholder="CFPT Ivato"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={config.companyAddress}
                    onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                    placeholder="Adresse de l'établissement"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={config.companyPhone}
                    onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                    placeholder="+261 XX XX XXX XX"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={config.companyEmail}
                    onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                    placeholder="contact@cfpt-ivato.mg"
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Configuration terminée
                      </h3>
                      <div className="mt-1 text-sm text-green-700">
                        Cliquez sur "Terminer" pour sauvegarder et commencer à utiliser l'application
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-gray-50 px-8 py-4 flex justify-between items-center border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            Précédent
          </button>

          <div className="text-sm text-gray-600">
            Étape {currentStep} sur 3
          </div>

          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-[#0011ef] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Terminer
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
