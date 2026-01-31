import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfigService, AppLabels, defaultLabels } from '../services/appConfigService';

interface AppConfigContextType {
  labels: AppLabels;
  updateLabels: (labels: Partial<AppLabels>) => void;
  resetLabels: () => void;
  getLabel: (key: keyof AppLabels) => string;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export const AppConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [labels, setLabels] = useState<AppLabels>(defaultLabels);

  useEffect(() => {
    // Charger les libellés au montage
    const loadedLabels = AppConfigService.getLabels();
    setLabels(loadedLabels);

    // Écouter les changements de libellés
    const handleLabelsUpdate = (event: CustomEvent) => {
      setLabels(event.detail);
    };

    window.addEventListener('app-labels-updated', handleLabelsUpdate as EventListener);

    return () => {
      window.removeEventListener('app-labels-updated', handleLabelsUpdate as EventListener);
    };
  }, []);

  const updateLabels = (newLabels: Partial<AppLabels>) => {
    AppConfigService.saveLabels(newLabels);
    setLabels(prev => ({ ...prev, ...newLabels }));
  };

  const resetLabels = () => {
    AppConfigService.resetLabels();
    setLabels(defaultLabels);
  };

  const getLabel = (key: keyof AppLabels): string => {
    return labels[key] || defaultLabels[key] || key;
  };

  return (
    <AppConfigContext.Provider value={{ labels, updateLabels, resetLabels, getLabel }}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = (): AppConfigContextType => {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
};
