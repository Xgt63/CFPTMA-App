import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Type, RotateCcw, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppConfigService } from '../services/appConfigService';

export const CustomizationTab: React.FC = () => {
  const [appName, setAppName] = useState<string>(AppConfigService.getLabel('appName'));
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const handleLabelsUpdate = (event: CustomEvent) => {
      setAppName(event.detail.appName);
      setHasChanges(false);
    };

    window.addEventListener('app-labels-updated', handleLabelsUpdate as EventListener);
    return () => {
      window.removeEventListener('app-labels-updated', handleLabelsUpdate as EventListener);
    };
  }, []);

  const handleNameChange = (value: string) => {
    setAppName(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    try {
      AppConfigService.saveLabels({ appName });
      setMessage({ text: 'Nom de l\'application sauvegardé avec succès !', type: 'success' });
      setHasChanges(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: 'Erreur lors de la sauvegarde', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser le nom de l\'application à la valeur par défaut ?')) {
      try {
        AppConfigService.resetLabels();
        setAppName(AppConfigService.getLabel('appName'));
        setMessage({ text: 'Nom réinitialisé aux valeurs par défaut !', type: 'success' });
        setHasChanges(false);
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } catch (error) {
        setMessage({ text: 'Erreur lors de la réinitialisation', type: 'error' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    }
  };


  return (
    <div className="space-y-6">
      {/* En-tête et actions */}
      <Card className="bg-gradient-to-r from-white/95 to-purple-50/80 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <Type className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Nom de l'Application</h3>
              <p className="text-sm text-gray-600">Personnalisez le nom affiché dans l'application</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              className="flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
            
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>

        {/* Message de notification */}
        {message.text && (
          <div
            className={`flex items-center space-x-2 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {hasChanges && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 mt-4">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Vous avez des modifications non sauvegardées
            </span>
          </div>
        )}
      </Card>

      {/* Champ de personnalisation du nom */}
      <Card title="Nom de l'Application">
        <div className="max-w-2xl">
          <Input
            label="Nom de l'application"
            value={appName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Entrez le nom de votre application"
            className="text-lg"
          />
          <p className="mt-2 text-sm text-gray-500">
            Ce nom sera affiché dans la barre de titre, les en-têtes et la sidebar de l'application.
          </p>
        </div>
      </Card>

      {/* Aide */}
      <Card className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 border-l-4 border-l-blue-500">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Aide et conseils</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Modifiez le nom de l'application selon vos besoins</li>
              <li>Cliquez sur "Sauvegarder" pour appliquer les changements</li>
              <li>Les modifications apparaissent immédiatement dans toute l'application</li>
              <li>Cliquez sur "Réinitialiser" pour revenir au nom par défaut</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
