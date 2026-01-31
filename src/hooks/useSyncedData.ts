import { useState, useEffect } from 'react';
import NonBlockingDB from '../services/nonBlockingDatabase';
import { DatabaseService } from '../services/database';

/**
 * Hook personnalisé pour synchronisation robuste des données
 * Garantit que toutes les pages utilisant ce hook sont synchronisées
 */
export const useSyncedData = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncVersion, setSyncVersion] = useState(0);

  const refreshData = async (silent = false) => {
    console.log('🔄 useSyncedData: Début refresh des données...');
    
    if (!silent) {
      setIsLoading(true);
    }

    try {
      // Test direct localStorage d'abord
      console.log('📦 Test direct localStorage...');
      const directStaffData = localStorage.getItem('staff');
      const directEvaluationsData = localStorage.getItem('evaluations');
      const directThemesData = localStorage.getItem('themes');
      
      console.log('📦 localStorage direct:', {
        staff: directStaffData ? JSON.parse(directStaffData).length : 0,
        evaluations: directEvaluationsData ? JSON.parse(directEvaluationsData).length : 0,
        themes: directThemesData ? JSON.parse(directThemesData).length : 0
      });

      // Récupération via services
      const [staffData, evaluationsData, themesData, trainingsData] = await Promise.all([
        NonBlockingDB.getStaff().catch(err => {
          console.warn('⚠️ Erreur getStaff, fallback localStorage:', err);
          return directStaffData ? JSON.parse(directStaffData) : [];
        }),
        NonBlockingDB.getEvaluations().catch(err => {
          console.warn('⚠️ Erreur getEvaluations, fallback localStorage:', err);
          return directEvaluationsData ? JSON.parse(directEvaluationsData) : [];
        }),
        NonBlockingDB.getThemes().catch(err => {
          console.warn('⚠️ Erreur getThemes, fallback localStorage:', err);
          return directThemesData ? JSON.parse(directThemesData) : [];
        }),
        DatabaseService.getStaffTrainings().catch(err => {
          console.warn('⚠️ Erreur getStaffTrainings, fallback localStorage:', err);
          return JSON.parse(localStorage.getItem('staff_trainings') || '[]');
        })
      ]);

      const newStaff = Array.isArray(staffData) ? staffData.filter(s => s && s.firstName && s.lastName) : [];
      const newEvaluations = Array.isArray(evaluationsData) ? evaluationsData : [];
      const newThemes = Array.isArray(themesData) ? themesData : [];

      console.log('✅ useSyncedData: Données finales récupérées:', {
        staff: newStaff.length,
        evaluations: newEvaluations.length,
        themes: newThemes.length,
        trainings: (Array.isArray(trainingsData) ? trainingsData : []).length
      });
      
      // Log détaillé des données staff pour debug
      if (newStaff.length > 0) {
        console.log('👥 Premier membre staff:', newStaff[0]);
      }

      setStaff(newStaff);
      setEvaluations(newEvaluations);
      setThemes(newThemes);
      setTrainings(Array.isArray(trainingsData) ? trainingsData : []);
      
      // Incrémenter la version de sync pour forcer les re-rendus
      setSyncVersion(prev => prev + 1);

    } catch (error) {
      console.error('❌ useSyncedData: Erreur lors du refresh:', error);
      
      // Fallback de secours - lecture directe localStorage
      try {
        const fallbackStaff = JSON.parse(localStorage.getItem('staff') || '[]');
        const fallbackEvaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
        const fallbackThemes = JSON.parse(localStorage.getItem('themes') || '[]');
        
        console.log('🆘 Utilisation fallback localStorage:', {
          staff: fallbackStaff.length,
          evaluations: fallbackEvaluations.length,
          themes: fallbackThemes.length
        });
        
        setStaff(fallbackStaff);
        setEvaluations(fallbackEvaluations);
        setThemes(fallbackThemes);
        setSyncVersion(prev => prev + 1);
      } catch (fallbackError) {
        console.error('💥 Échec total fallback:', fallbackError);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const forceRefresh = () => {
    console.log('useSyncedData: Force refresh déclenché');
    // Vider d'abord les données pour forcer un re-rendu complet
    setStaff([]);
    setEvaluations([]);
    setThemes([]);
    
    // Déclencher une synchronisation globale
    DatabaseService.forceSyncAll();
    
    // Recharger après un délai
    setTimeout(() => {
      refreshData(false);
    }, 50);
  };

  useEffect(() => {
    // Chargement initial
    refreshData(false);

    // Enregistrer un callback global pour synchronisation
    const syncCallback = () => {
      console.log('useSyncedData: Callback de synchronisation global déclenché');
      refreshData(true); // Refresh silencieux
    };

    DatabaseService.addGlobalSyncCallback(syncCallback);

    // Nettoyage
    return () => {
      DatabaseService.removeGlobalSyncCallback(syncCallback);
    };
  }, []);

  return {
    staff,
    evaluations,
    themes,
    trainings,
    isLoading,
    syncVersion,
    refreshData,
    forceRefresh
  };
};