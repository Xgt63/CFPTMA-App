import { useState, useEffect, useCallback, useRef } from 'react';
import { DatabaseService } from '../services/database';

// Types pour les événements de données
type DataUpdateEvent = {
  type: 'staff' | 'evaluations' | 'themes' | 'users' | 'all';
  action: 'create' | 'update' | 'delete' | 'import';
  data?: any;
};

// Hook optimisé pour les données avec gestion d'état React améliorée
export const useOptimizedData = <T>(
  dataType: 'staff' | 'evaluations' | 'themes' | 'users',
  fetchFunction: () => Promise<T[]>
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Références pour éviter les re-renders inutiles
  const lastFetchTime = useRef<number>(0);
  const pendingUpdate = useRef<boolean>(false);
  const dataRef = useRef<T[]>([]);
  
  // Fonction de rafraîchissement des données avec debouncing
  const fetchData = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    
    // Éviter les rafraîchissements trop fréquents (sauf si forcé)
    if (!force && (now - lastFetchTime.current) < 100) {
      console.log(`useOptimizedData(${dataType}): Rafraîchissement ignoré (trop récent)`);
      return;
    }
    
    if (pendingUpdate.current && !force) {
      console.log(`useOptimizedData(${dataType}): Mise à jour déjà en cours`);
      return;
    }
    
    try {
      pendingUpdate.current = true;
      
      if (!force && data.length > 0) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log(`🔄 useOptimizedData(${dataType}): Récupération des données...`);
      const newData = await fetchFunction();
      
      // Vérifier si les données ont vraiment changé
      const hasChanged = JSON.stringify(dataRef.current) !== JSON.stringify(newData);
      
      if (hasChanged || force) {
        dataRef.current = newData;
        setData(newData);
        setError(null);
        console.log(`✅ useOptimizedData(${dataType}): Données mises à jour (${newData.length} éléments)`);
        
        // Forcer un re-render en utilisant une fonction de mise à jour
        setData(prevData => {
          if (JSON.stringify(prevData) !== JSON.stringify(newData)) {
            return [...newData];
          }
          return prevData;
        });
      } else {
        console.log(`⏭️ useOptimizedData(${dataType}): Aucun changement détecté`);
      }
      
      lastFetchTime.current = now;
    } catch (err) {
      console.error(`❌ useOptimizedData(${dataType}): Erreur:`, err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
      setRefreshing(false);
      pendingUpdate.current = false;
    }
  }, [dataType, fetchFunction, data.length]);
  
  // Fonction de rafraîchissement manuel
  const refresh = useCallback(() => {
    console.log(`🔄 useOptimizedData(${dataType}): Rafraîchissement manuel demandé`);
    fetchData(true);
  }, [fetchData, dataType]);
  
  // Fonction pour forcer une mise à jour immédiate de l'état
  const forceUpdate = useCallback(() => {
    console.log(`⚡ useOptimizedData(${dataType}): Force update`);
    setData(prevData => [...prevData]);
    
    // Force un repaint des composants
    setTimeout(() => {
      const event = new CustomEvent('force-ui-update', { detail: { dataType } });
      window.dispatchEvent(event);
    }, 10);
  }, [dataType]);
  
  // Écouter les événements de synchronisation de DatabaseService
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log(`📡 useOptimizedData(${dataType}): Événement de synchronisation reçu`);
      fetchData(false);
    };
    
    const handleSpecificUpdate = () => {
      console.log(`📡 useOptimizedData(${dataType}): Événement spécifique reçu`);
      fetchData(false);
    };
    
    const handleForceSync = () => {
      console.log(`🔥 useOptimizedData(${dataType}): Force sync reçu`);
      fetchData(true);
    };
    
    // Écouter les événements globaux et spécifiques
    DatabaseService.addEventListener('data-updated', handleDataUpdate);
    DatabaseService.addEventListener(`${dataType}-updated`, handleSpecificUpdate);
    DatabaseService.addEventListener('force-sync', handleForceSync);
    
    return () => {
      DatabaseService.removeEventListener('data-updated', handleDataUpdate);
      DatabaseService.removeEventListener(`${dataType}-updated`, handleSpecificUpdate);
      DatabaseService.removeEventListener('force-sync', handleForceSync);
    };
  }, [dataType, fetchData]);
  
  // Écouter les notifications Electron des mises à jour de données
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const handleElectronUpdate = (event: any, updateInfo: DataUpdateEvent) => {
        if (updateInfo.type === dataType || updateInfo.type === 'all') {
          console.log(`🖥️ useOptimizedData(${dataType}): Notification Electron reçue:`, updateInfo);
          
          // Attendre un petit délai pour que la DB soit mise à jour
          setTimeout(() => {
            fetchData(true);
          }, 20);
        }
      };
      
      // Écouter les notifications du processus principal Electron
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.on('data-updated', handleElectronUpdate);
      
      return () => {
        ipcRenderer.removeListener('data-updated', handleElectronUpdate);
      };
    }
  }, [dataType, fetchData]);
  
  // Écouter les événements de force UI update
  useEffect(() => {
    const handleForceUIUpdate = (event: CustomEvent) => {
      if (event.detail?.dataType === dataType) {
        console.log(`🎨 useOptimizedData(${dataType}): Force UI update`);
        forceUpdate();
      }
    };
    
    window.addEventListener('force-ui-update', handleForceUIUpdate as EventListener);
    
    return () => {
      window.removeEventListener('force-ui-update', handleForceUIUpdate as EventListener);
    };
  }, [dataType, forceUpdate]);
  
  // Charger les données initiales
  useEffect(() => {
    console.log(`🚀 useOptimizedData(${dataType}): Initialisation`);
    fetchData(true);
  }, [fetchData, dataType]);
  
  // Fonction utilitaire pour optimiser les mises à jour d'un élément spécifique
  const updateLocalItem = useCallback((id: number | string, updates: Partial<T>) => {
    console.log(`📝 useOptimizedData(${dataType}): Mise à jour locale ID:`, id);
    
    setData(prevData => {
      const newData = prevData.map(item => {
        if ((item as any).id === id) {
          return { ...item, ...updates };
        }
        return item;
      });
      
      dataRef.current = newData;
      return newData;
    });
    
    // Forcer un re-render après mise à jour locale
    setTimeout(forceUpdate, 10);
  }, [dataType, forceUpdate]);
  
  // Fonction utilitaire pour supprimer un élément localement
  const removeLocalItem = useCallback((id: number | string) => {
    console.log(`🗑️ useOptimizedData(${dataType}): Suppression locale ID:`, id);
    
    setData(prevData => {
      const newData = prevData.filter(item => (item as any).id !== id);
      dataRef.current = newData;
      return newData;
    });
    
    // Forcer un re-render après suppression locale
    setTimeout(forceUpdate, 10);
  }, [dataType, forceUpdate]);
  
  // Fonction utilitaire pour ajouter un élément localement
  const addLocalItem = useCallback((newItem: T) => {
    console.log(`➕ useOptimizedData(${dataType}): Ajout local:`, newItem);
    
    setData(prevData => {
      const newData = [newItem, ...prevData];
      dataRef.current = newData;
      return newData;
    });
    
    // Forcer un re-render après ajout local
    setTimeout(forceUpdate, 10);
  }, [dataType, forceUpdate]);
  
  return {
    data,
    loading,
    error,
    refreshing,
    refresh,
    forceUpdate,
    updateLocalItem,
    removeLocalItem,
    addLocalItem,
    // Informations de debug
    lastFetchTime: lastFetchTime.current,
    pendingUpdate: pendingUpdate.current
  };
};

// Hook spécialisé pour le personnel
export const useOptimizedStaff = () => {
  return useOptimizedData('staff', DatabaseService.getStaff);
};

// Hook spécialisé pour les évaluations
export const useOptimizedEvaluations = () => {
  return useOptimizedData('evaluations', DatabaseService.getEvaluations);
};

// Hook spécialisé pour les thèmes
export const useOptimizedThemes = () => {
  return useOptimizedData('themes', DatabaseService.getThemes);
};

// Hook spécialisé pour les utilisateurs
export const useOptimizedUsers = () => {
  return useOptimizedData('users', DatabaseService.getUsers);
};