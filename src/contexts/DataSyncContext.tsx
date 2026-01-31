import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DatabaseService } from '../services/database';

interface DataSyncContextType {
  staff: any[];
  evaluations: any[];
  themes: any[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  forceRefresh: () => void;
  syncVersion: number;
}

const DataSyncContext = createContext<DataSyncContextType | null>(null);

export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};

export const DataSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncVersion, setSyncVersion] = useState(0);

  const refreshData = useCallback(async () => {
    console.log('DataSyncContext: Refresh des données globales...');
    setIsLoading(true);
    
    try {
      const [staffData, evaluationsData, themesData] = await Promise.all([
        DatabaseService.getStaff(),
        DatabaseService.getEvaluations(),
        DatabaseService.getThemes()
      ]);

      console.log('DataSyncContext: Données récupérées:', {
        staff: staffData?.length || 0,
        evaluations: evaluationsData?.length || 0,
        themes: themesData?.length || 0
      });

      const newStaff = Array.isArray(staffData) ? staffData : [];
      const newEvaluations = Array.isArray(evaluationsData) ? evaluationsData : [];
      const newThemes = Array.isArray(themesData) ? themesData : [];
      
      console.log('DataSyncContext: Mise à jour des states avec:', {
        staff: newStaff.length,
        evaluations: newEvaluations.length,
        themes: newThemes.length
      });

      setStaff(newStaff);
      setEvaluations(newEvaluations);
      setThemes(newThemes);
      
    } catch (error) {
      console.error('DataSyncContext: Erreur lors du refresh:', error);
      // Fallback vers localStorage
      try {
        const fallbackStaff = JSON.parse(localStorage.getItem('staff') || '[]');
        const fallbackEvaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
        const fallbackThemes = JSON.parse(localStorage.getItem('themes') || '[]');
        
        setStaff(fallbackStaff);
        setEvaluations(fallbackEvaluations);
        setThemes(fallbackThemes);
      } catch (fallbackError) {
        console.error('DataSyncContext: Erreur fallback:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forceRefresh = useCallback(() => {
    console.log('DataSyncContext: Force refresh déclenché');
    // Réinitialiser les données à vide d'abord pour forcer un re-rendu complet
    setStaff([]);
    setEvaluations([]);
    setThemes([]);
    // Incrémenter la version de sync
    setSyncVersion(prev => prev + 1);
    
    // Déclencher une synchronisation globale forcée
    DatabaseService.forceSyncAll();
    
    // Recharger les données après un délai pour être sûr que le state est vidé
    setTimeout(() => {
      refreshData();
    }, 100);
  }, [refreshData]);

  useEffect(() => {
    // Chargement initial
    refreshData();

    // Utiliser le système de callback global pour une synchronisation plus fiable
    const globalSyncCallback = () => {
      console.log('DataSyncContext: Callback global déclenché - Refresh des données');
      refreshData();
    };

    // Enregistrer le callback global
    DatabaseService.addGlobalSyncCallback(globalSyncCallback);

    // Nettoyage
    return () => {
      DatabaseService.removeGlobalSyncCallback(globalSyncCallback);
    };
  }, [refreshData]);

  const value: DataSyncContextType = {
    staff,
    evaluations,
    themes,
    isLoading,
    refreshData,
    forceRefresh,
    syncVersion
  };

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
};