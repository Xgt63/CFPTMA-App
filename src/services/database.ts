// Service pour interagir avec la base de données locale via Electron
declare global {
  interface Window {
    electronAPI?: {
      // Window controls
      minimize?: () => Promise<void>;
      maximize?: () => Promise<void>;
      unmaximize?: () => Promise<void>;
      isMaximized?: () => Promise<boolean>;
      close?: () => Promise<void>;
      // Database operations
      getUsers: () => Promise<any[]>;
      createUser: (userData: any) => Promise<any>;
      updateUser: (id: number, userData: any) => Promise<any>;
      deleteUser: (id: number) => Promise<any>;
      getStaff: () => Promise<any[]>;
      createStaff: (staffData: any) => Promise<any>;
      updateStaff: (id: number, staffData: any) => Promise<any>;
      deleteStaff: (id: number) => Promise<any>;
      getThemes: () => Promise<any[]>;
      createTheme: (themeData: any) => Promise<any>;
      updateTheme: (id: number, themeData: any) => Promise<any>;
      deleteTheme: (id: number) => Promise<any>;
      createEvaluation: (evaluationData: any) => Promise<any>;
      getEvaluations: () => Promise<any[]>;
      updateEvaluation: (id: number, evaluationData: any) => Promise<any>;
      deleteEvaluation: (id: number) => Promise<any>;
      getEvaluationStats: () => Promise<any[]>;
      exportData: (type: string) => Promise<string>;
      importData: (data: string) => Promise<boolean>;
    };
  }
}

type StaffTraining = { id: number; staffId: number; themeId: number; status: string; assignedDate: string; createdAt?: string; updatedAt?: string };

// Instance du Worker pour les opérations localStorage
let storageWorker: Worker | null = null;

// Fonction pour forcer le repaint de l'interface (solution de dernier recours)
const forceRepaint = () => {
  try {
    console.log('DatabaseService: Force repaint de l\'interface');
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
    
    // Force aussi un repaint des éléments input
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input: any) => {
      if (input.style) {
        input.style.transform = 'translateZ(0)';
        setTimeout(() => {
          input.style.transform = '';
        }, 1);
      }
    });
  } catch (error) {
    console.error('Erreur force repaint:', error);
  }
};

// Initialiser le Web Worker
const initStorageWorker = () => {
  if (!storageWorker && typeof Worker !== 'undefined') {
    try {
      storageWorker = new Worker('/workers/storageWorker.js');
      storageWorker.onmessage = (e) => {
        console.log('Worker response:', e.data);
      };
      storageWorker.onerror = (error) => {
        console.error('Worker error:', error);
        storageWorker = null;
      };
      console.log('Storage Worker initialisé');
    } catch (error) {
      console.error('Erreur initialisation Worker:', error);
      storageWorker = null;
    }
  }
};

// Fonction utilitaire pour les opérations Worker avec timeout
const workerOperation = (action: string, dataType: string, data?: any, id?: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!storageWorker) {
      reject(new Error('Worker non disponible'));
      return;
    }
    
    const timeout = setTimeout(() => {
      reject(new Error('Timeout Worker'));
    }, 5000);
    
    const handleResponse = (e: MessageEvent) => {
      clearTimeout(timeout);
      storageWorker?.removeEventListener('message', handleResponse);
      
      if (e.data.success) {
        resolve(e.data.data);
      } else {
        reject(new Error(e.data.error || 'Erreur Worker'));
      }
    };
    
    storageWorker.addEventListener('message', handleResponse);
    storageWorker.postMessage({ action, dataType, data, id });
  });
};

export class DatabaseService {
  private static isElectron = () => {
    return typeof window !== 'undefined' && window.electronAPI;
  };
  
  // Initialiser le service
  static initialize() {
    initStorageWorker();
  }

  // Événements de synchronisation pour mettre à jour l'UI en temps réel
  private static listeners: { [key: string]: (() => void)[] } = {};
  private static globalSyncCallbacks: (() => void)[] = [];

  static addEventListener(event: string, callback: () => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    console.log(`DatabaseService: Écouteur ajouté pour '${event}', total:`, this.listeners[event].length);
  }

  static removeEventListener(event: string, callback: () => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      console.log(`DatabaseService: Écouteur supprimé pour '${event}', restant:`, this.listeners[event].length);
    }
  }

  // Ajouter un callback global qui sera appelé à chaque changement
  static addGlobalSyncCallback(callback: () => void) {
    this.globalSyncCallbacks.push(callback);
    console.log('DatabaseService: Callback global ajouté, total:', this.globalSyncCallbacks.length);
  }

  static removeGlobalSyncCallback(callback: () => void) {
    this.globalSyncCallbacks = this.globalSyncCallbacks.filter(cb => cb !== callback);
    console.log('DatabaseService: Callback global supprimé, restant:', this.globalSyncCallbacks.length);
  }

  private static emit(event: string) {
    console.log(`DatabaseService: Émission événement '${event}'`);
    
    // Émettre l'événement spécifique
    if (this.listeners[event]) {
      console.log(`DatabaseService: Appel de ${this.listeners[event].length} écouteurs pour '${event}'`);
      this.listeners[event].forEach((callback, index) => {
        try {
          callback();
        } catch (error) {
          console.error(`DatabaseService: Erreur dans écouteur ${index} pour '${event}':`, error);
        }
      });
    }
    
    // Appeler tous les callbacks globaux
    console.log(`DatabaseService: Appel de ${this.globalSyncCallbacks.length} callbacks globaux`);
    this.globalSyncCallbacks.forEach((callback, index) => {
      try {
        setTimeout(() => callback(), 0); // Exécuter de manière asynchrone
      } catch (error) {
        console.error(`DatabaseService: Erreur dans callback global ${index}:`, error);
      }
    });
  }

  // Forcer une synchronisation globale
  static forceSyncAll() {
    console.log('DatabaseService: FORCE SYNC ALL - Déclenchement de tous les callbacks');
    this.emit('force-sync');
    this.emit('data-updated');
    this.emit('staff-updated');
    this.emit('evaluations-updated');
    this.emit('themes-updated');
  }

  // Helper pour synchroniser localStorage avec Electron
  private static async syncWithLocalStorage(key: string, data: any[]) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`Données synchronisées avec localStorage pour ${key}:`, data.length, 'éléments');
    } catch (error) {
      console.error(`Erreur synchronisation localStorage ${key}:`, error);
    }
  }

  // Helper pour les opérations avec fallback automatique et gestion améliorée
  private static async executeWithFallback(
    electronMethod: () => Promise<any>,
    fallbackMethod: () => any,
    successMessage: string,
    syncKey?: string
  ) {
    let result: any;
    let usedElectron = false;
    
    try {
      if (this.isElectron()) {
        console.log(`🔄 Tentative Electron: ${successMessage}`);
        result = await electronMethod();
        usedElectron = true;
        console.log(`✅ Succès Electron: ${successMessage}`, result);
        
        // Synchroniser avec localStorage si nécessaire
        if (syncKey) {
          try {
            const data = await window.electronAPI![`get${syncKey.charAt(0).toUpperCase() + syncKey.slice(1)}` as keyof typeof window.electronAPI]() as any[];
            await this.syncWithLocalStorage(syncKey, data);
          } catch (syncError) {
            console.warn(`⚠️ Erreur synchronisation ${syncKey}:`, syncError);
          }
        }
      } else {
        console.log(`🌐 Mode web: ${successMessage}`);
        result = await this.executeWithWorker(fallbackMethod, syncKey);
      }
    } catch (error) {
      console.error(`❌ Erreur ${usedElectron ? 'Electron' : 'Web'} pour ${successMessage}, fallback:`, error);
      result = await this.executeWithWorker(fallbackMethod, syncKey);
    }
    
    // Émettre événements et forcer repaint après chaque opération
    setTimeout(() => {
      this.emit('data-updated');
      if (syncKey) {
        this.emit(`${syncKey}-updated`);
      }
      
      // Force repaint si nécessaire (solution de dernier recours)
      if (document.querySelectorAll('input:disabled, textarea:disabled, select:disabled').length > 0) {
        console.log('🔄 Champs figés détectés, force repaint...');
        forceRepaint();
      }
    }, 10);
    
    return result;
  }
  
  // Helper pour exécuter les opérations avec le Worker
  private static async executeWithWorker(operation: () => any, syncKey?: string) {
    try {
      if (storageWorker && syncKey) {
        // Essayer d'utiliser le Worker pour les opérations localStorage
        console.log(`🤖 Tentative Worker pour ${syncKey}`);
        const result = operation();
        
        // Forcer une synchronisation via le Worker
        setTimeout(async () => {
          try {
            await workerOperation('RELOAD', syncKey);
          } catch (workerError) {
            console.warn('Erreur sync Worker:', workerError);
          }
        }, 50);
        
        return result;
      } else {
        // Fallback direct
        console.log(`💾 Fallback localStorage direct`);
        return operation();
      }
    } catch (error) {
      console.error('Erreur executeWithWorker:', error);
      return operation();
    }
  }

  // Helper pour récupérer les données avec fallback
  private static async getDataWithFallback(electronMethod: () => Promise<any[]>, localStorageKey: string, defaultData: any[] = []): Promise<any[]> {
    try {
      if (this.isElectron()) {
        console.log(`Récupération Electron pour ${localStorageKey}`);
        try {
          const electronData = await electronMethod();
          console.log(`Données Electron récupérées pour ${localStorageKey}:`, electronData?.length || 0, 'éléments');
          
          if (electronData && Array.isArray(electronData)) {
            // Synchroniser avec localStorage
            await this.syncWithLocalStorage(localStorageKey, electronData);
            return electronData;
          }
        } catch (electronError) {
          console.error(`Erreur Electron pour ${localStorageKey}:`, electronError);
        }
      }
      
      // Fallback vers localStorage
      console.log(`Fallback localStorage pour ${localStorageKey}`);
      try {
        const localStorageData = localStorage.getItem(localStorageKey);
        if (localStorageData) {
          const localData = JSON.parse(localStorageData);
          console.log(`Données localStorage récupérées pour ${localStorageKey}:`, localData?.length || 0, 'éléments');
          return Array.isArray(localData) ? localData : defaultData;
        }
      } catch (parseError) {
        console.error(`Erreur parsing localStorage ${localStorageKey}:`, parseError);
      }
      
      // Dernier fallback
      console.log(`Utilisation des données par défaut pour ${localStorageKey}`);
      return defaultData;
    } catch (error) {
      console.error(`Erreur critique récupération données ${localStorageKey}:`, error);
      return defaultData;
    }
  }

  // Users
  static async getUsers(): Promise<any[]> {
    return await this.getDataWithFallback(
      () => window.electronAPI!.getUsers(),
      'users',
      []
    );
  }

  static async createUser(userData: any): Promise<any> {
    // Validation des données utilisateur
    if (!userData?.email || !userData?.firstName || !userData?.lastName) {
      throw new Error('Les champs email, firstName et lastName sont obligatoires');
    }
    
    const result = await this.executeWithFallback(
      () => window.electronAPI!.createUser(userData),
      () => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        // Vérifier si l'email existe déjà
        const existingUser = users.find((u: any) => u.email === userData.email);
        if (existingUser) {
          throw new Error('Un utilisateur avec cet email existe déjà');
        }
        const newUser = { ...userData, id: Date.now(), createdAt: new Date().toISOString() };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        return newUser;
      },
      'createUser',
      'users'
    );
    
    // Émettre l'événement de synchronisation
    this.emit('users-updated');
    this.emit('data-updated');
    
    return result;
  }

  static async updateUser(id: number, userData: any) {
    return await this.executeWithFallback(
      () => window.electronAPI!.updateUser(id, userData),
      () => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const index = users.findIndex((u: any) => u.id === id);
        if (index !== -1) {
          users[index] = { ...users[index], ...userData };
          localStorage.setItem('users', JSON.stringify(users));
        }
        return users[index];
      },
      'updateUser',
      'users'
    );
  }

  static async deleteUser(id: number) {
    return await this.executeWithFallback(
      () => window.electronAPI!.deleteUser(id),
      () => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const filtered = users.filter((u: any) => u.id !== id);
        localStorage.setItem('users', JSON.stringify(filtered));
        return { success: true };
      },
      'deleteUser',
      'users'
    );
  }

  // Schémas de validation pour optimiser la structure des données
  private static validateStaffMember(data: any): any {
    const required = ['firstName', 'lastName', 'email', 'position'];
    const missing = required.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Champs obligatoires manquants: ${missing.join(', ')}`);
    }
    
    // Normaliser les données
    return {
      id: data.id || Date.now(),
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      email: data.email?.toLowerCase().trim(),
      phone: data.phone?.trim() || '',
      position: data.position?.trim(),
      establishment: data.establishment?.trim() || '',
      formationYear: data.formationYear || new Date().getFullYear().toString(),
      matricule: data.matricule?.trim() || '',
      gender: data.gender || '',
      status: data.status || 'active',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        source: data.metadata?.source || 'manual',
        version: '2.0',
        lastSync: new Date().toISOString()
      }
    };
  }
  
  private static validateEvaluation(data: any): any {
    const required = ['staffId', 'formationTheme'];
    const missing = required.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Champs obligatoires manquants: ${missing.join(', ')}`);
    }
    // Normaliser le type d'évaluation
    const evaluationType = (data.evaluationType === 'followUp') ? 'followUp' : 'initial';
    const initialEvaluationId = evaluationType === 'followUp' ? (data.initialEvaluationId || null) : null;
    
    return {
      id: data.id || Date.now(),
      staffId: parseInt(data.staffId),
      status: data.status || 'draft',
      evaluationType,
      initialEvaluationId,
      formationTheme: data.formationTheme?.trim(),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: data.completedAt || null,
      ...data,
      metadata: {
        source: data.metadata?.source || 'manual',
        version: '2.1',
        lastSync: new Date().toISOString()
      }
    };
  }
  
  // Optimisation des performances avec cache intelligent
  private static cache = new Map();
  private static cacheTimeout = 30000; // 30 secondes
  
  private static getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📦 Cache hit pour ${key}`);
      return cached.data;
    }
    return null;
  }
  
  private static setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  private static clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Staff avec structure optimisée
  static async getStaff() {
    console.log('🔍 DatabaseService.getStaff - Début récupération staff...');
    
    // Vérifier le cache d'abord
    const cached = this.getCachedData('staff');
    if (cached) {
      return cached;
    }
    
    const staffData = await this.getDataWithFallback(
      () => window.electronAPI!.getStaff(),
      'staff',
      []
    );
    
    console.log('📋 DatabaseService.getStaff - Données récupérées:', staffData?.length || 0, 'membres');
    
    // Validation et nettoyage des données avec structure optimisée
    const validStaff = Array.isArray(staffData) ? 
      staffData.filter(member => member && member.id && member.firstName && member.lastName) : [];
    
    if (validStaff.length !== staffData?.length) {
      console.warn('⚠️ DatabaseService.getStaff - Données invalides filtrées:', staffData?.length - validStaff.length);
    }
    
    return validStaff;
  }

  static async createStaff(staffData: any) {
    console.log('DatabaseService.createStaff - Création:', staffData);
    
    // Vérifier si un membre avec cet email existe déjà
    if (staffData.email) {
      const existingStaff = await this.getStaff();
      const duplicate = existingStaff.find((s: any) => 
        s?.email === staffData.email
      );
      if (duplicate) {
        console.log('Membre déjà existant avec cet email:', duplicate);
        return duplicate;
      }
    }
    
    const result = await this.executeWithFallback(
      () => window.electronAPI!.createStaff(staffData),
      () => {
        const staff = JSON.parse(localStorage.getItem('staff') || '[]');
        // Vérification de sécurité locale aussi
        const localDuplicate = staff.find((s: any) => s?.email === staffData.email);
        if (localDuplicate) {
          console.log('Fallback - Membre déjà existant localement:', localDuplicate);
          return localDuplicate;
        }
        const newStaff = { ...staffData, id: Date.now(), createdAt: new Date().toISOString() };
        staff.push(newStaff);
        localStorage.setItem('staff', JSON.stringify(staff));
        console.log('Fallback - Nouveau membre créé:', newStaff);
        return newStaff;
      },
      'createStaff',
      'staff'
    );
    
    // Émettre les événements de synchronisation
    this.emit('staff-updated');
    this.emit('data-updated');
    
    // Hook d'action utilisateur
    this.onUserAction('createStaff', staffData);
    
    console.log('DatabaseService.createStaff - Résultat:', result);
    return result;
  }

  static async updateStaff(id: number, staffData: any) {
    console.log('DatabaseService.updateStaff - Mise à jour ID:', id, 'Données:', staffData);
    const result = await this.executeWithFallback(
      () => window.electronAPI!.updateStaff(id, staffData),
      () => {
        const staff = JSON.parse(localStorage.getItem('staff') || '[]');
        const index = staff.findIndex((s: any) => s.id === id);
        if (index !== -1) {
          staff[index] = { ...staff[index], ...staffData };
          localStorage.setItem('staff', JSON.stringify(staff));
          console.log('Fallback - Membre mis à jour:', staff[index]);
          return staff[index];
        }
        console.log('Fallback - Membre non trouvé pour ID:', id);
        return null;
      },
      'updateStaff',
      'staff'
    );
    
    // Émettre les événements de synchronisation
    this.emit('staff-updated');
    this.emit('data-updated');
    
    console.log('DatabaseService.updateStaff - Résultat:', result);
    return result;
  }

  static async deleteStaff(id: number) {
    console.log('DatabaseService.deleteStaff - Suppression ID:', id);
    
    // D'abord, récupérer les infos du membre à supprimer pour identifier les évaluations
    const staffList = await this.getStaff();
    const memberToDelete = staffList.find((s: any) => s.id === id);
    
    const result = await this.executeWithFallback(
      () => window.electronAPI!.deleteStaff(id),
      () => {
        const staff = JSON.parse(localStorage.getItem('staff') || '[]');
        const initialLength = staff.length;
        const filtered = staff.filter((s: any) => s.id !== id);
        localStorage.setItem('staff', JSON.stringify(filtered));
        const deleted = initialLength - filtered.length;
        console.log('Fallback - Membres supprimés:', deleted);
        return { success: deleted > 0, changes: deleted };
      },
      'deleteStaff',
      'staff'
    );
    
    // Supprimer aussi les évaluations associées à ce membre
    if (memberToDelete && result.success) {
      console.log('DatabaseService.deleteStaff - Suppression des évaluations pour:', memberToDelete.firstName, memberToDelete.lastName);
      
      try {
        const evaluations = await this.getEvaluations();
        const memberEvaluations = evaluations.filter((evaluation: any) => 
          evaluation.staffId === id || 
          (evaluation.firstName === memberToDelete.firstName && evaluation.lastName === memberToDelete.lastName)
        );
        
        console.log('DatabaseService.deleteStaff - Trouvé', memberEvaluations.length, 'évaluations à supprimer');
        
        // Supprimer chaque évaluation (sans émettre d'événements pour éviter les boucles)
        for (const evaluation of memberEvaluations) {
          if (this.isElectron()) {
            try {
              await window.electronAPI!.deleteEvaluation(evaluation.id);
            } catch (error) {
              console.error('Erreur suppression évaluation Electron:', error);
            }
          }
          
          // Fallback localStorage
          const localEvaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
          const filteredEvaluations = localEvaluations.filter((e: any) => e.id !== evaluation.id);
          localStorage.setItem('evaluations', JSON.stringify(filteredEvaluations));
        }
        
        // Émettre l'événement de mise à jour des évaluations
        this.emit('evaluations-updated');
        
      } catch (error) {
        console.error('DatabaseService.deleteStaff - Erreur suppression évaluations:', error);
      }
    }
    
    // Émettre TOUS les événements de synchronisation après suppression
    this.emit('staff-updated');
    this.emit('evaluations-updated');
    this.emit('data-updated');
    
    // Forcer une synchronisation globale pour s'assurer que TOUTES les pages se mettent à jour
    setTimeout(() => {
      this.forceSyncAll();
    }, 100);
    
    console.log('DatabaseService.deleteStaff - Résultat avec sync complet:', result);
    return result;
  }

  // Formation Themes
  static async getThemes() {
    const defaultThemes = [
      { id: 1, name: 'Leadership Management', description: 'Formation sur les techniques de leadership et de management d\'équipe', createdAt: new Date().toISOString() },
      { id: 2, name: 'Communication Efficace', description: 'Améliorer ses compétences en communication interpersonnelle', createdAt: new Date().toISOString() },
      { id: 3, name: 'Gestion de Projet', description: 'Méthodologies et outils pour la gestion de projets', createdAt: new Date().toISOString() },
      { id: 4, name: 'Innovation & Créativité', description: 'Développer l\'innovation et la créativité en entreprise', createdAt: new Date().toISOString() }
    ];

    // Si l'API Electron n'expose pas getThemes (ex: mock dev), passer directement au fallback sans log d'erreur
    if (!this.isElectron() || !window.electronAPI || typeof window.electronAPI.getThemes !== 'function') {
      try {
        const ls = localStorage.getItem('themes');
        const parsed = ls ? JSON.parse(ls) : [];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
      // Initialiser avec les thèmes par défaut
      localStorage.setItem('themes', JSON.stringify(defaultThemes));
      return defaultThemes;
    }

    const themes = await this.getDataWithFallback(
      () => window.electronAPI!.getThemes(),
      'themes',
      defaultThemes
    );

    // Si pas de thèmes, initialiser avec les thèmes par défaut
    if (!themes || themes.length === 0) {
      localStorage.setItem('themes', JSON.stringify(defaultThemes));
      if (this.isElectron() && window.electronAPI && typeof window.electronAPI.createTheme === 'function') {
        for (const theme of defaultThemes) {
          try {
            await window.electronAPI.createTheme({ name: theme.name, description: theme.description });
          } catch {}
        }
      }
      return defaultThemes;
    }

    return themes;
  }

  static async createTheme(themeData: any) {
    const result = await this.executeWithFallback(
      () => window.electronAPI!.createTheme(themeData),
      () => {
        const themes = JSON.parse(localStorage.getItem('themes') || '[]');
        const newTheme = { 
          ...themeData, 
          id: themes.length > 0 ? Math.max(...themes.map((t: any) => t.id)) + 1 : 1, 
          createdAt: new Date().toISOString() 
        };
        themes.push(newTheme);
        localStorage.setItem('themes', JSON.stringify(themes));
        return newTheme;
      },
      'createTheme',
      'themes'
    );
    
    // Émettre les événements de synchronisation
    this.emit('themes-updated');
    this.emit('data-updated');
    
    // Hook d'action utilisateur
    this.onUserAction('createTheme', themeData);
    
    return result;
  }

  static async updateTheme(id: any, themeData: any) {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const result = await this.executeWithFallback(
      () => window.electronAPI!.updateTheme(numericId, themeData),
      () => {
        const themes = JSON.parse(localStorage.getItem('themes') || '[]');
        const index = themes.findIndex((t: any) => t.id.toString() === id.toString());
        if (index !== -1) {
          themes[index] = { ...themes[index], ...themeData };
          localStorage.setItem('themes', JSON.stringify(themes));
        }
        return themes[index];
      },
      'updateTheme',
      'themes'
    );
    
    // Émettre les événements de synchronisation
    this.emit('themes-updated');
    this.emit('data-updated');
    
    return result;
  }

  static async deleteTheme(id: any) {
    console.log('DatabaseService.deleteTheme - Suppression ID:', id, 'Type:', typeof id);
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    
    let result: any;
    
    try {
      if (this.isElectron()) {
        console.log('🔄 Suppression Electron pour thème ID:', numericId);
        
        // Supprimer via Electron
        result = await window.electronAPI!.deleteTheme(numericId);
        console.log('✅ Suppression Electron réussie:', result);
        
        // IMPORTANT: Synchroniser localStorage avec SQLite après suppression
        // Forcer une mise à jour complète pour éviter les données obsolètes
        try {
          const updatedThemes = await window.electronAPI!.getThemes();
          console.log('📥 Récupération thèmes après suppression:', updatedThemes.length, 'thèmes');
          
          // Vider d'abord localStorage pour éviter les conflits
          localStorage.removeItem('themes');
          console.log('🧹 localStorage vidé');
          
          // Réécrire avec les données à jour depuis SQLite
          localStorage.setItem('themes', JSON.stringify(updatedThemes));
          console.log('💾 localStorage synchronisé avec SQLite:', updatedThemes.length, 'thèmes');
        } catch (syncError) {
          console.error('⚠️ Erreur synchronisation localStorage après suppression:', syncError);
        }
      } else {
        console.log('🌐 Suppression localStorage pour thème ID:', id);
        const themes = JSON.parse(localStorage.getItem('themes') || '[]');
        const filtered = themes.filter((t: any) => t.id.toString() !== id.toString());
        localStorage.setItem('themes', JSON.stringify(filtered));
        result = { success: true, changes: themes.length - filtered.length };
        console.log('✅ Suppression localStorage réussie:', result);
      }
    } catch (error) {
      console.error('❌ Erreur suppression thème:', error);
      throw error;
    }
    
    // Émettre les événements de synchronisation
    this.emit('themes-updated');
    this.emit('data-updated');
    
    console.log('DatabaseService.deleteTheme - Terminé avec succès');
    return result;
  }

  // Staff trainings
  static async getStaffTrainings(): Promise<StaffTraining[]> {
    return await this.getDataWithFallback(
      () => window.electronAPI!.getStaffTrainings(),
      'staff_trainings',
      []
    );
  }

  static async getTrainingsByStaff(staffId: number): Promise<StaffTraining[]> {
    if (this.isElectron()) {
      try {
        const rows = await window.electronAPI!.getTrainingsByStaff(staffId);
        return Array.isArray(rows) ? rows : [];
      } catch (e) {
        console.warn('getTrainingsByStaff Electron error, fallback localStorage');
      }
    }
    const all = JSON.parse(localStorage.getItem('staff_trainings') || '[]');
    return all.filter((t: any) => Number(t.staffId) === Number(staffId));
  }

  static async createStaffTraining(training: Omit<StaffTraining,'id'>): Promise<StaffTraining> {
    const normalized = {
      ...training,
      staffId: Number(training.staffId),
      themeId: Number(training.themeId),
      status: training.status || 'active',
      assignedDate: training.assignedDate || new Date().toISOString()
    };
    const result = await this.executeWithFallback(
      () => window.electronAPI!.createStaffTraining(normalized),
      () => {
        const arr = JSON.parse(localStorage.getItem('staff_trainings') || '[]');
        const newRow = { ...normalized, id: Date.now(), createdAt: new Date().toISOString() };
        arr.push(newRow);
        localStorage.setItem('staff_trainings', JSON.stringify(arr));
        return newRow;
      },
      'createStaffTraining',
      'staff_trainings'
    );
    this.emit('data-updated');
    return result;
  }

  static async updateStaffTraining(id: number, patch: Partial<StaffTraining>) {
    const result = await this.executeWithFallback(
      () => window.electronAPI!.updateStaffTraining(id, patch),
      () => {
        const arr = JSON.parse(localStorage.getItem('staff_trainings') || '[]');
        const idx = arr.findIndex((t: any) => Number(t.id) === Number(id));
        if (idx !== -1) {
          arr[idx] = { ...arr[idx], ...patch, updatedAt: new Date().toISOString() };
          localStorage.setItem('staff_trainings', JSON.stringify(arr));
          return { changes: 1 };
        }
        return { changes: 0 };
      },
      'updateStaffTraining',
      'staff_trainings'
    );
    this.emit('data-updated');
    return result;
  }

  static async deleteStaffTraining(id: number) {
    const result = await this.executeWithFallback(
      () => window.electronAPI!.deleteStaffTraining(id),
      () => {
        const arr = JSON.parse(localStorage.getItem('staff_trainings') || '[]');
        const filtered = arr.filter((t: any) => Number(t.id) !== Number(id));
        localStorage.setItem('staff_trainings', JSON.stringify(filtered));
        return { changes: 1 };
      },
      'deleteStaffTraining',
      'staff_trainings'
    );
    this.emit('data-updated');
    return result;
  }

  // Evaluations
  private static updateLastSaved() {
    try {
      const now = new Date();
      localStorage.setItem('lastSavedAt', now.toISOString());
      window.dispatchEvent(new CustomEvent('save-status-updated', { detail: { at: now.toISOString() } }));
    } catch {}
  }

  static async createEvaluation(evaluationData: any) {
    // Ajouter le statut et le type par défaut si non spécifiés
    if (!evaluationData.status) {
      evaluationData.status = 'completed'; // Par défaut : complète
    }
    if (!evaluationData.evaluationType) {
      evaluationData.evaluationType = 'initial';
    }
    
    const normalized = this.validateEvaluation(evaluationData);
    
    const result = await this.executeWithFallback(
      () => window.electronAPI!.createEvaluation(normalized),
      () => {
        const evaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
        const newEvaluation = { 
          ...normalized, 
          id: Date.now(), 
          createdAt: new Date().toISOString(),
          status: normalized.status || 'completed'
        };
        evaluations.push(newEvaluation);
        localStorage.setItem('evaluations', JSON.stringify(evaluations));
        return newEvaluation;
      },
      'createEvaluation',
      'evaluations'
    );
    
    // Émettre les événements de synchronisation
    this.emit('evaluations-updated');
    this.emit('staff-updated'); // Car les évaluations affectent les stats du staff
    this.emit('data-updated');
    
    this.updateLastSaved();

    // Hook d'action utilisateur
    this.onUserAction('createEvaluation', evaluationData);
    
    return result;
  }

  // Créer ou mettre à jour une évaluation en brouillon
  static async saveEvaluationDraft(evaluationData: any) {
    console.log('DatabaseService.saveEvaluationDraft - Sauvegarde brouillon:', evaluationData);
    this.updateLastSaved();
    
    // Toujours sauvegarder en tant que brouillon, sans écraser d'autres entrées
    const draftData = {
      ...evaluationData,
      status: 'draft',
      evaluationType: evaluationData.evaluationType || 'initial',
      lastUpdated: new Date().toISOString(),
      // draftKey unique pour éviter tout écrasement
      draftKey: evaluationData.draftKey || this.generateDraftKeyUnique(),
      // Clé de regroupement (personne + thème + type) pour l'UI
      draftGroupKey: this.generateDraftGroupKey(evaluationData)
    };

    // Si un ID est fourni et correspond à un brouillon existant, on met à jour CE brouillon
    try {
      if (draftData.id) {
        const existing = (await this.getEvaluationsByStatus('draft')).find((d: any) => d.id === draftData.id);
        if (existing) {
          console.log('Mise à jour du brouillon par ID:', draftData.id);
          return await this.updateEvaluation(draftData.id, draftData);
        }
      }
    } catch (e) {
      console.warn('saveEvaluationDraft: vérification d\'existence échouée, création forcée', e);
    }

    // Sinon créer un NOUVEAU brouillon
    console.log('Création d\'un nouveau brouillon:', draftData.draftKey, 'groupe:', draftData.draftGroupKey);
    return await this.createEvaluation(draftData);
  }

  // Génère une clé UNIQUE pour un brouillon (identifiant de l'instance)
  private static generateDraftKeyUnique(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // Génère une clé de GROUPEMENT (personne + thème + type) pour organiser dans l'UI
  private static generateDraftGroupKey(evaluationData: any): string {
    const personKey = (evaluationData.email || `${evaluationData.firstName}_${evaluationData.lastName}` || '').toLowerCase();
    const themeKey = (evaluationData.formationTheme || 'formation_generale').toLowerCase();
    const typeKey = (evaluationData.evaluationType || 'initial').toLowerCase();
    const linkKey = evaluationData.initialEvaluationId ? `_${evaluationData.initialEvaluationId}` : '';
    return `${personKey}__${themeKey}__${typeKey}${linkKey}`.replace(/\s+/g, '_');
  }

  // Trouver un brouillon existant pour la même personne et le même thème (déprécié - conservé pour compatibilité)
  private static async findExistingDraft(_evaluationData: any): Promise<any | null> {
    // Laisser toujours créer de nouveaux brouillons pour éviter l'écrasement
    return null;
  }

  // Finaliser une évaluation (passer de draft/incomplete à completed)
  static async completeEvaluation(evaluationId: number, finalData: any) {
    console.log('DatabaseService.completeEvaluation - Finalisation:', evaluationId, finalData);
    
    const completedData = {
      ...finalData,
      status: 'completed',
      completedAt: new Date().toISOString()
    };
    
    return await this.updateEvaluation(evaluationId, completedData);
  }

  // Récupérer les évaluations par statut
  static async getEvaluationsByStatus(status?: 'draft' | 'incomplete' | 'completed') {
    const allEvaluations = await this.getEvaluations();
    
    if (!status) {
      return allEvaluations;
    }
    
    return allEvaluations.filter((evaluation: any) => 
      evaluation.status === status
    );
  }

  // Récupérer les brouillons d'évaluations pour un membre spécifique
  static async getStaffEvaluationDrafts(staffId: number) {
    const drafts = await this.getEvaluationsByStatus('draft');
    return drafts.filter((evaluation: any) => 
      evaluation.staffId === staffId
    );
  }

  // Récupérer tous les brouillons groupés par personne
  static async getAllDraftsByPerson() {
    const drafts = await this.getEvaluationsByStatus('draft');
    const draftsByPerson: { [key: string]: any[] } = {};
    
    drafts.forEach((draft: any) => {
      const personKey = draft.email || `${draft.firstName}_${draft.lastName}`;
      if (!draftsByPerson[personKey]) {
        draftsByPerson[personKey] = [];
      }
      draftsByPerson[personKey].push(draft);
    });
    
    return draftsByPerson;
  }

  // Récupérer les brouillons par email/nom avec détails
  static async getPersonDrafts(personIdentifier: string) {
    const allDrafts = await this.getAllDraftsByPerson();
    const drafts = allDrafts[personIdentifier] || [];
    
    return drafts.map((draft: any) => ({
      ...draft,
      draftKey: draft.draftKey || this.generateDraftKey(draft),
      formationTitle: draft.formationTheme || 'Formation non spécifiée',
      lastModified: draft.lastUpdated || draft.createdAt,
      personName: `${draft.firstName} ${draft.lastName}`
    }));
  }

  // Supprimer un brouillon spécifique
  static async deleteDraft(draftId: number) {
    console.log('Suppression du brouillon:', draftId);
    return await this.deleteEvaluation(draftId);
  }

  // Restaurer un brouillon (le dupliquer pour permettre de continuer)
  static async restoreDraft(draftId: number) {
    try {
      const evaluations = await this.getEvaluations();
      const draft = evaluations.find((e: any) => e.id === draftId && e.status === 'draft');
      
      if (!draft) {
        throw new Error('Brouillon introuvable');
      }
      
      // Créer une copie du brouillon avec un nouvel ID et timestamp
      const restoredDraft = {
        ...draft,
        id: undefined, // Sera généré automatiquement
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        draftKey: `${draft.draftKey}_restored_${Date.now()}`
      };
      
      const result = await this.createEvaluation(restoredDraft);
      console.log('Brouillon restauré:', result);
      return result;
    } catch (error) {
      console.error('Erreur lors de la restauration du brouillon:', error);
      throw error;
    }
  }

  // Obtenir toutes les sauvegardes avec détails enrichis
  static async getAllDraftsWithDetails() {
    const drafts = await this.getEvaluationsByStatus('draft');
    
    return drafts.map((draft: any) => ({
      ...draft,
      draftKey: draft.draftKey || this.generateDraftKey(draft),
      formationTitle: draft.formationTheme || 'Formation non spécifiée',
      lastModified: draft.lastUpdated || draft.createdAt,
      personName: `${draft.firstName} ${draft.lastName}`,
      personEmail: draft.email,
      createdDate: draft.createdAt,
      modifiedDate: draft.lastUpdated,
      version: this.generateVersionFromDate(draft.createdAt, draft.lastUpdated)
    })).sort((a: any, b: any) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  }

  // Générer un numéro de version basé sur les dates
  private static generateVersionFromDate(createdAt: string, lastUpdated?: string): string {
    const created = new Date(createdAt);
    const modified = lastUpdated ? new Date(lastUpdated) : created;
    
    if (created.getTime() === modified.getTime()) {
      return 'v1.0';
    }
    
    const hoursDiff = Math.ceil((modified.getTime() - created.getTime()) / (1000 * 60 * 60));
    const major = Math.floor(hoursDiff / 24) + 1;
    const minor = hoursDiff % 24;
    
    return `v${major}.${minor}`;
  }

  // Obtenir les évaluations terminées avec statistiques
  // Obtenir les évaluations initiales terminées par membre (la plus récente)
  static async getLatestInitialEvaluationByStaff() {
    const completed = await this.getEvaluationsByStatus('completed');
    const initialCompleted = completed.filter((e: any) => (e.evaluationType || 'initial') === 'initial');
    const byStaff = new Map<number, any>();
    initialCompleted.forEach((e: any) => {
      const key = Number(e.staffId);
      const prev = byStaff.get(key);
      const date = new Date(e.completedAt || e.updatedAt || e.createdAt).getTime();
      const prevDate = prev ? new Date(prev.completedAt || prev.updatedAt || prev.createdAt).getTime() : -1;
      if (!prev || date > prevDate) byStaff.set(key, e);
    });
    return Array.from(byStaff.entries()).map(([staffId, evaluation]) => ({ staffId, evaluation }));
  }

  // Candidats au suivi (avec date d'échéance à +6 mois)
  static async getFollowUpCandidates(months: number = 6) {
    const staff = await this.getStaff();
    const latestInitialByStaff = await this.getLatestInitialEvaluationByStaff();
    const msPerMonth = 30 * 24 * 60 * 60 * 1000;

    return latestInitialByStaff.map(({ staffId, evaluation }) => {
      const member = staff.find((s: any) => Number(s.id) === Number(staffId));
      const lastDate = new Date(evaluation.completedAt || evaluation.updatedAt || evaluation.createdAt);
      const dueDate = new Date(lastDate.getTime() + months * msPerMonth);
      const isDue = Date.now() >= dueDate.getTime();
      return {
        staff: member,
        lastInitialEvaluation: evaluation,
        lastCompletedAt: lastDate.toISOString(),
        nextFollowUpDueAt: dueDate.toISOString(),
        isDue
      };
    }).sort((a: any, b: any) => new Date(a.nextFollowUpDueAt).getTime() - new Date(b.nextFollowUpDueAt).getTime());
  }

  // Comparatif initial vs suivi par membre
  static async getInitialFollowUpComparisons(staffId?: number) {
    const evals = await this.getEvaluations();
    const grouped = new Map<number, { initial: any[]; followUps: any[] }>();
    evals.forEach((e: any) => {
      const key = Number(e.staffId);
      if (!grouped.has(key)) grouped.set(key, { initial: [], followUps: [] });
      if ((e.evaluationType || 'initial') === 'followUp') grouped.get(key)!.followUps.push(e);
      else grouped.get(key)!.initial.push(e);
    });
    const selectKeys = staffId ? [Number(staffId)] : Array.from(grouped.keys());
    return selectKeys.map(k => {
      const g = grouped.get(k)!;
      const latestInitial = g.initial.sort((a,b)=>new Date(b.completedAt||b.updatedAt||b.createdAt).getTime()-new Date(a.completedAt||a.updatedAt||a.createdAt).getTime())[0];
      const latestFollowUp = g.followUps.sort((a,b)=>new Date(b.fu_date||b.completedAt||b.updatedAt||b.createdAt).getTime()-new Date(a.fu_date||a.completedAt||a.updatedAt||a.createdAt).getTime())[0];
      return { staffId: k, initial: latestInitial, followUp: latestFollowUp };
    });
  }

  static async getCompletedEvaluationsWithStats() {
    const completed = await this.getEvaluationsByStatus('completed');
    const staff = await this.getStaff();
    
    return completed.map((evaluation: any) => {
      const staffMember = staff.find((s: any) => s.id === evaluation.staffId);
      
      // Calculer les moyennes
      const contentAvg = this.calculateSectionAverage(evaluation, [
        'skillsAcquisition', 'personalDevelopment', 'courseClarity', 'theoryPractice',
        'syllabusAdequacy', 'practicalCases', 'objectivesAchieved', 'adaptedKnowledge'
      ]);
      
      const methodsAvg = this.calculateSectionAverage(evaluation, [
        'pedagogicalSupport', 'techniquesUsed', 'presentation'
      ]);
      
      const organizationAvg = this.calculateSectionAverage(evaluation, [
        'logisticsConditions', 'rhythm', 'punctuality', 'punctualityAssiduity'
      ]);
      
      const behaviorAvg = this.calculateSectionAverage(evaluation, [
        'teamworkSense', 'motivationEnthusiasm', 'communicationSociable', 'communicationGeneral',
        'aptitudeChangeIdeas', 'curiosity', 'initiativeSpirit', 'responsibilitySense'
      ]);
      
      const cognitiveAvg = this.calculateSectionAverage(evaluation, [
        'criticalAnalysis', 'workExecution', 'directivesComprehension', 'workQuality', 'subjectMastery'
      ]);
      
      const overallAverage = Number(((contentAvg + methodsAvg + organizationAvg + behaviorAvg + cognitiveAvg) / 5).toFixed(1));
      
      return {
        ...evaluation,
        staffMember,
        personName: `${evaluation.firstName} ${evaluation.lastName}`,
        formationTitle: evaluation.formationTheme || 'Formation non spécifiée',
        completedDate: evaluation.completedAt || evaluation.createdAt,
        stats: {
          contentAverage: contentAvg,
          methodsAverage: methodsAvg,
          organizationAverage: organizationAvg,
          behaviorAverage: behaviorAvg,
          cognitiveAverage: cognitiveAvg,
          overallAverage: overallAverage
        },
        hasObservations: !!(evaluation.improvementSuggestions || evaluation.justificationObservations),
        recommendationLevel: this.getRecommendationLevel(evaluation.recommendationScore || 0)
      };
    }).sort((a: any, b: any) => 
      new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
    );
  }

  // Calculer la moyenne d'une section
  private static calculateSectionAverage(evaluation: any, fields: string[]): number {
    const values = fields.map(field => evaluation[field] as number).filter(val => !isNaN(val) && val > 0);
    if (values.length === 0) return 0;
    return Number((values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1));
  }

  // Obtenir le niveau de recommandation
  private static getRecommendationLevel(score: number): { level: string; color: string; label: string } {
    if (score >= 9) return { level: 'excellent', color: 'green', label: 'Excellente' };
    if (score >= 7) return { level: 'good', color: 'blue', label: 'Bonne' };
    if (score >= 5) return { level: 'average', color: 'orange', label: 'Moyenne' };
    if (score >= 3) return { level: 'below', color: 'red', label: 'Faible' };
    return { level: 'poor', color: 'gray', label: 'Non évaluée' };
  }

  // Vérifier la cohérence de la base de données
  static async verifyDataConsistency(): Promise<{
    isConsistent: boolean;
    issues: string[];
    stats: { staff: number; evaluations: number; drafts: number };
  }> {
    try {
      console.log('\u{1F50D} Vérification de la cohérence des données...');
      
      const issues: string[] = [];
      const [staff, evaluations, drafts] = await Promise.all([
        this.getStaff(),
        this.getEvaluations(),
        this.getEvaluationsByStatus('draft')
      ]);

      // Vérifier les données du staff
      const invalidStaff = staff.filter(member => !member || !member.id || !member.firstName || !member.lastName);
      if (invalidStaff.length > 0) {
        issues.push(`${invalidStaff.length} membre(s) du personnel avec des données invalides`);
      }

      // Vérifier les doublons de staff
      const staffEmails = staff.filter(s => s?.email).map(s => s.email);
      const duplicateEmails = staffEmails.filter((email, index) => staffEmails.indexOf(email) !== index);
      if (duplicateEmails.length > 0) {
        issues.push(`${duplicateEmails.length} email(s) en double dans le personnel`);
      }

      // Vérifier les évaluations orphelines
      const orphanedEvaluations = evaluations.filter(evaluation => {
        if (!evaluation?.staffId) return false;
        return !staff.find(member => member?.id === evaluation.staffId);
      });
      if (orphanedEvaluations.length > 0) {
        issues.push(`${orphanedEvaluations.length} évaluation(s) sans membre du personnel correspondant`);
      }

      // Vérifier les brouillons obsoletes
      const oldDrafts = drafts.filter(draft => {
        if (!draft?.lastModified) return false;
        const daysSinceModified = Math.floor(
          (Date.now() - new Date(draft.lastModified).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceModified > 90;
      });
      if (oldDrafts.length > 0) {
        issues.push(`${oldDrafts.length} brouillon(s) très ancien(s) (>90 jours)`);
      }

      const stats = {
        staff: staff.length,
        evaluations: evaluations.length,
        drafts: drafts.length
      };

      const isConsistent = issues.length === 0;
      
      if (isConsistent) {
        console.log('\u2705 Base de données cohérente');
      } else {
        console.warn('\u26A0\uFE0F Problèmes de cohérence détectés:', issues);
      }

      return { isConsistent, issues, stats };
    } catch (error) {
      console.error('\u274C Erreur lors de la vérification de cohérence:', error);
      return {
        isConsistent: false,
        issues: ['Erreur lors de la vérification de cohérence'],
        stats: { staff: 0, evaluations: 0, drafts: 0 }
      };
    }
  }

  // Synchronisation automatique Excel supprimée

  // Hook pour actions utilisateur simplifié (sans export automatique)
  static async onUserAction(actionType: string, data?: any): Promise<void> {
    try {
      console.log(`👍 Action utilisateur: ${actionType}`);
      
      // Différer la vérification pour éviter de bloquer l'interface
      setTimeout(async () => {
        try {
          // Vérifier uniquement la cohérence
          const consistency = await this.verifyDataConsistency();
          
          if (!consistency.isConsistent) {
            console.warn('⚠️ Incohérences détectées après action utilisateur:', consistency.issues);
            
            // Émettre un événement pour notifier l'interface
            this.emit('data-inconsistency', { issues: consistency.issues, actionType });
          }
        } catch (error) {
          console.error('Erreur lors des vérifications post-action:', error);
        }
      }, 1000); // Délai de 1 seconde
    } catch (error) {
      console.error('Erreur dans onUserAction:', error);
    }
  }

  // Synchroniser les données avant l'export
  private static async syncDataBeforeExport() {
    try {
      console.log('\u{1F504} Synchronisation des données avant export...');
      
      // Forcer le rechargement de toutes les données
      const [staff, evaluations, themes] = await Promise.all([
        this.getStaff(),
        this.getEvaluations(),
        this.getThemes()
      ]);
      
      console.log(`\u2705 Données synchronisées - Staff: ${staff.length}, Evaluations: ${evaluations.length}, Themes: ${themes.length}`);
      
      // Vérifier la cohérence des données
      const completedEvaluations = evaluations.filter((e: any) => e.status === 'completed');
      const draftEvaluations = evaluations.filter((e: any) => e.status === 'draft');
      
      console.log(`\u{1F4CA} Répartition - Terminées: ${completedEvaluations.length}, Brouillons: ${draftEvaluations.length}`);
      
      return {
        staff,
        evaluations,
        themes,
        completedEvaluations,
        draftEvaluations
      };
    } catch (error) {
      console.error('\u26A0\uFE0F Erreur lors de la synchronisation des données:', error);
      throw new Error('Impossible de synchroniser les données pour l\'export');
    }
  }

  static async getEvaluations() {
    const data = await this.getDataWithFallback(
      () => window.electronAPI!.getEvaluations(),
      'evaluations',
      []
    );
    // Normaliser le type et dates
    return (Array.isArray(data) ? data : []).map((e: any) => ({
      evaluationType: e.evaluationType || 'initial',
      completedAt: e.completedAt || (e.status === 'completed' ? (e.updatedAt || e.createdAt) : null),
      ...e,
    }));
  }

  static async updateEvaluation(id: number, evaluationData: any) {
    const result = await this.executeWithFallback(
      () => window.electronAPI!.updateEvaluation(id, evaluationData),
      () => {
        const evaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
        const index = evaluations.findIndex((e: any) => e.id === id);
        if (index !== -1) {
          evaluations[index] = { ...evaluations[index], ...evaluationData };
          localStorage.setItem('evaluations', JSON.stringify(evaluations));
        }
        return evaluations[index];
      },
      'updateEvaluation',
      'evaluations'
    );
    
    // Émettre les événements de synchronisation
    this.emit('evaluations-updated');
    this.emit('staff-updated');
    this.emit('data-updated');

    this.updateLastSaved();
    
    return result;
  }

  static async deleteEvaluation(id: number) {
    const result = await this.executeWithFallback(
      () => window.electronAPI!.deleteEvaluation(id),
      () => {
        const evaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
        const filtered = evaluations.filter((evaluation: any) => evaluation.id !== id);
        localStorage.setItem('evaluations', JSON.stringify(filtered));
        return { success: true };
      },
      'deleteEvaluation',
      'evaluations'
    );
    
    // Émettre les événements de synchronisation
    this.emit('evaluations-updated');
    this.emit('staff-updated');
    this.emit('data-updated');
    
    return result;
  }

  static async getEvaluationStats() {
    if (this.isElectron()) {
      try {
        const stats = await window.electronAPI!.getEvaluationStats();
        console.log('Stats Electron récupérées:', stats);
        return stats;
      } catch (error) {
        console.error('Erreur Electron getEvaluationStats, fallback localStorage:', error);
      }
    }
    
    // Fallback pour le développement web - calcul basique des stats
    const evaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
    if (evaluations.length === 0) return [];
    
    const stats = evaluations.reduce((acc: any, evaluation: any) => {
      if (!acc[evaluation.formationTheme]) {
        acc[evaluation.formationTheme] = {
          formationTheme: evaluation.formationTheme,
          totalEvaluations: 0,
          avgObjectiveAchievement: 0,
          avgRelevanceToRole: 0,
          avgExpectationsMet: 0,
          avgSkillsDevelopment: 0,
          avgRecommendationScore: 0,
          themeCount: 0
        };
      }
      
      const theme = acc[evaluation.formationTheme];
      theme.totalEvaluations++;
      theme.avgObjectiveAchievement += evaluation.objectiveAchievement || 0;
      theme.avgRelevanceToRole += evaluation.relevanceToRole || 0;
      theme.avgExpectationsMet += evaluation.expectationsMet || 0;
      theme.avgSkillsDevelopment += evaluation.skillsDevelopment || 0;
      theme.avgRecommendationScore += evaluation.recommendationScore || 0;
      theme.themeCount++;
      
      return acc;
    }, {});
    
    // Calculer les moyennes
    Object.values(stats).forEach((statistic: any) => {
      statistic.avgObjectiveAchievement /= statistic.themeCount;
      statistic.avgRelevanceToRole /= statistic.themeCount;
      statistic.avgExpectationsMet /= statistic.themeCount;
      statistic.avgSkillsDevelopment /= statistic.themeCount;
      statistic.avgRecommendationScore /= statistic.themeCount;
    });
    
    console.log('Stats localStorage calculées:', Object.values(stats));
    return Object.values(stats);
  }

  // Export Excel automatique avec synchronisation
  static async exportToExcel(type: 'all' | 'staff' | 'evaluations' | 'themes' = 'all') {
    try {
      console.log(`\u{1F4CA} Début de l'export Excel pour le type: ${type}`);
      
      // Vérifier et synchroniser les données avant l'export
      await this.syncDataBeforeExport();
      
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      
      // Configuration du workbook
      workbook.creator = 'CFPT Ivato - Employee Evaluation System';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      if (type === 'all' || type === 'staff') {
        const staffData = await this.getStaff();
        const staffSheet = workbook.addWorksheet('Personnel');
        
        // Headers pour le personnel avec style
        const headers = ['ID', 'Matricule', 'Prénom', 'Nom', 'Poste', 'Email', 'Téléphone', 'Établissement', 'Année Formation', 'Date de création'];
        const headerRow = staffSheet.addRow(headers);
        
        // Style des headers
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: 'FFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0011EF' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        
        // Données du personnel
        staffData.forEach(member => {
          staffSheet.addRow([
            member.id,
            member.matricule,
            member.firstName,
            member.lastName,
            member.position,
            member.email,
            member.phone,
            member.establishment,
            member.formationYear,
            member.createdAt
          ]);
        });
        
        // Style des headers
        staffSheet.getRow(1).font = { bold: true };
        staffSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0011ef' } };
        staffSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      }
      
      if (type === 'all' || type === 'evaluations') {
        const evaluationsData = await this.getEvaluations();
        // Feuille Évaluations (initiales)
        const evalSheet = workbook.addWorksheet('Évaluations');
        
        // Headers pour les évaluations
        evalSheet.addRow([
          'ID', 'Staff ID', 'Prénom', 'Nom', 'Date évaluation', 'Thème formation', 'Statut',
          'Acquisition compétences', 'Développement personnel', 'Clarté cours', 'Théorie/Pratique',
          'Adéquation programme', 'Cas pratiques', 'Objectifs atteints', 'Connaissances adaptées',
          'Support pédagogique', 'Techniques utilisées', 'Présentation',
          'Conditions logistiques', 'Rythme', 'Ponctualié', 'Assiduité',
          'Esprit équipe', 'Motivation', 'Communication sociable', 'Communication générale',
          'Aptitude échanges', 'Curiosité', 'Initiative', 'Responsabilité',
          'Analyse critique', 'Exécution travail', 'Compréhension directives', 'Qualité travail', 'Maîtrise sujet',
          'Score recommandation', 'Justifications', 'Date de création'
        ]);
        
        // Données des évaluations initiales
        evaluationsData.filter(e => (e.evaluationType || 'initial') === 'initial').forEach(evaluation => {
          evalSheet.addRow([
            evaluation.id,
            evaluation.staffId,
            evaluation.firstName,
            evaluation.lastName,
            evaluation.fillDate,
            evaluation.formationTheme,
            evaluation.status || 'completed',
            evaluation.skillsAcquisition,
            evaluation.personalDevelopment,
            evaluation.courseClarity,
            evaluation.theoryPractice,
            evaluation.syllabusAdequacy,
            evaluation.practicalCases,
            evaluation.objectivesAchieved,
            evaluation.adaptedKnowledge,
            evaluation.pedagogicalSupport,
            evaluation.techniquesUsed,
            evaluation.presentation,
            evaluation.logisticsConditions,
            evaluation.rhythm,
            evaluation.punctuality,
            evaluation.punctualityAssiduity,
            evaluation.teamworkSense,
            evaluation.motivationEnthusiasm,
            evaluation.communicationSociable,
            evaluation.communicationGeneral,
            evaluation.aptitudeChangeIdeas,
            evaluation.curiosity,
            evaluation.initiativeSpirit,
            evaluation.responsibilitySense,
            evaluation.criticalAnalysis,
            evaluation.workExecution,
            evaluation.directivesComprehension,
            evaluation.workQuality,
            evaluation.subjectMastery,
            evaluation.recommendationScore,
            evaluation.justificationObservations,
            evaluation.createdAt
          ]);
        });
        
        // Style des headers
        evalSheet.getRow(1).font = { bold: true };
        evalSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0011ef' } };
        evalSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

        // Feuille Suivi 6 mois
        const followUps = evaluationsData.filter(e => (e.evaluationType || 'initial') === 'followUp');
        if (followUps.length > 0) {
          const fuSheet = workbook.addWorksheet('Suivi 6 mois');
          fuSheet.addRow([
            'ID', 'Staff ID', 'Prénom', 'Nom', 'Date suivi', 'InitialEvaluationId', 'Total/60', 'Appréciation (code)', 'Appréciation (libellé)',
            'Comportement', 'Comportement (commentaire)',
            "Intégration", "Intégration (commentaire)",
            'Motivation', 'Motivation (commentaire)',
            'Communication', 'Communication (commentaire)',
            'Curiosité', 'Curiosité (commentaire)',
            'Initiative/Créativité', 'Initiative/Créativité (commentaire)',
            'Connaissances adaptées', 'Connaissances adaptées (commentaire)',
            'Esprit critique', 'Esprit critique (commentaire)',
            'Maîtrise technique', 'Maîtrise technique (commentaire)',
            'Respect hiérarchie', 'Respect hiérarchie (commentaire)',
            'Qualité du travail', 'Qualité (commentaire)',
            'Efficacité', 'Efficacité (commentaire)',
            'Productivité', 'Productivité (commentaire)',
            'Respect des valeurs', 'Respect des valeurs (commentaire)',
            'Engagement', 'Engagement (commentaire)',
            'Conclusion personnel', 'Conclusion directeur'
          ]);

          followUps.forEach(e => {
            fuSheet.addRow([
              e.id,
              e.staffId,
              e.firstName,
              e.lastName,
              e.fu_date || e.fillDate,
              e.initialEvaluationId || '',
              e.fu_total60 || '',
              e.fu_appreciationCode || '',
              e.fu_appreciationLabel || '',
              e.fu_behaviorGeneral || '', e.fu_behaviorGeneralComment || '',
              e.fu_teamIntegration || '', e.fu_teamIntegrationComment || '',
              e.fu_motivationTenacity || '', e.fu_motivationTenacityComment || '',
              e.fu_communication || '', e.fu_communicationComment || '',
              e.fu_curiosity || '', e.fu_curiosityComment || '',
              e.fu_initiativeCreativity || '', e.fu_initiativeCreativityComment || '',
              e.fu_adaptedKnowledge || '', e.fu_adaptedKnowledgeComment || '',
              e.fu_criticalAnalysis || '', e.fu_criticalAnalysisComment || '',
              e.fu_technicalMastery || '', e.fu_technicalMasteryComment || '',
              e.fu_hierarchyRespect || '', e.fu_hierarchyRespectComment || '',
              e.fu_workQuality || '', e.fu_workQualityComment || '',
              e.fu_efficiency || '', e.fu_efficiencyComment || '',
              e.fu_productivity || '', e.fu_productivityComment || '',
              e.fu_valuesRespect || '', e.fu_valuesRespectComment || '',
              e.fu_commitment || '', e.fu_commitmentComment || '',
              e.fu_conclusionStaff || '',
              e.fu_conclusionDirector || ''
            ]);
          });

          fuSheet.getRow(1).font = { bold: true };
          fuSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0011ef' } };
          fuSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
        }
      }
      
      if (type === 'all' || type === 'themes') {
        const themesData = await this.getThemes();
        const themesSheet = workbook.addWorksheet('Thèmes Formation');
        
        // Headers pour les thèmes
        themesSheet.addRow(['ID', 'Nom', 'Description', 'Date de création']);
        
        // Données des thèmes
        themesData.forEach(theme => {
          themesSheet.addRow([
            theme.id,
            theme.name,
            theme.description,
            theme.createdAt
          ]);
        });
        
        // Style des headers
        themesSheet.getRow(1).font = { bold: true };
        themesSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0011ef' } };
        themesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      }
      
      // Générer le fichier
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Télécharger le fichier
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CFP-Manager-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('Export Excel terminé avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      throw error;
    }
  }

  static async importFromExcel(file: File, type: 'staff' | 'evaluations' | 'themes') {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      let imported = 0;
      
      if (type === 'staff') {
        const worksheet = workbook.getWorksheet('Personnel') || workbook.getWorksheet(1);
        if (worksheet) {
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            
            const staffData = {
              matricule: row.getCell(2).value,
              firstName: row.getCell(3).value,
              lastName: row.getCell(4).value,
              position: row.getCell(5).value,
              email: row.getCell(6).value,
              phone: row.getCell(7).value,
              establishment: row.getCell(8).value,
              formationYear: row.getCell(9).value
            };
            
            if (staffData.firstName && staffData.lastName && staffData.email) {
              this.createStaff(staffData);
              imported++;
            }
          });
        }
      }
      
      // Import Suivi 6 mois si présent
      if (type === 'evaluations') {
        const fuSheet = workbook.getWorksheet('Suivi 6 mois');
        if (fuSheet) {
          fuSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const data: any = {
              evaluationType: 'followUp',
              staffId: row.getCell(2).value,
              firstName: row.getCell(3).value,
              lastName: row.getCell(4).value,
              fu_date: row.getCell(5).value,
              initialEvaluationId: row.getCell(6).value,
              fu_total60: row.getCell(7).value,
              fu_appreciationCode: row.getCell(8).value,
              fu_appreciationLabel: row.getCell(9).value,
            };
            // mapping des critères par paires (valeur, commentaire)
            const mapPairs = (
              startCol: number,
              keys: Array<{ val: string; com: string }>
            ) => {
              keys.forEach((k, idx) => {
                const base = startCol + idx * 2;
                (data as any)[k.val] = row.getCell(base).value;
                (data as any)[k.com] = row.getCell(base + 1).value;
              });
            };
            mapPairs(10, [
              { val: 'fu_behaviorGeneral', com: 'fu_behaviorGeneralComment' },
              { val: 'fu_teamIntegration', com: 'fu_teamIntegrationComment' },
              { val: 'fu_motivationTenacity', com: 'fu_motivationTenacityComment' },
              { val: 'fu_communication', com: 'fu_communicationComment' },
              { val: 'fu_curiosity', com: 'fu_curiosityComment' },
              { val: 'fu_initiativeCreativity', com: 'fu_initiativeCreativityComment' },
              { val: 'fu_adaptedKnowledge', com: 'fu_adaptedKnowledgeComment' },
              { val: 'fu_criticalAnalysis', com: 'fu_criticalAnalysisComment' },
              { val: 'fu_technicalMastery', com: 'fu_technicalMasteryComment' },
              { val: 'fu_hierarchyRespect', com: 'fu_hierarchyRespectComment' },
              { val: 'fu_workQuality', com: 'fu_workQualityComment' },
              { val: 'fu_efficiency', com: 'fu_efficiencyComment' },
              { val: 'fu_productivity', com: 'fu_productivityComment' },
              { val: 'fu_valuesRespect', com: 'fu_valuesRespectComment' },
              { val: 'fu_commitment', com: 'fu_commitmentComment' },
            ]);
            const tailBase = 10 + (15 * 2);
            data.fu_conclusionStaff = row.getCell(tailBase).value;
            data.fu_conclusionDirector = row.getCell(tailBase + 1).value;

            // créer l’évaluation suivi
            this.createEvaluation({ ...data, status: 'completed' });
            imported++;
          });
        }
      }
      
      console.log(`Import Excel terminé: ${imported} enregistrements importés`);
      return imported;
    } catch (error) {
      console.error('Erreur lors de l\'import Excel:', error);
      throw error;
    }
  }

  // Utilitaire pour nettoyer les doublons
  static async removeDuplicateStaff() {
    try {
      console.log('Nettoyage des doublons de personnel...');
      const staff = await this.getStaff();
      
      if (!Array.isArray(staff) || staff.length === 0) {
        console.log('Aucun personnel à nettoyer');
        return { duplicatesRemoved: 0, remainingStaff: 0 };
      }
      
      // Identifier les doublons par email
      const emailMap = new Map<string, any[]>();
      staff.forEach(member => {
        if (member?.email) {
          if (!emailMap.has(member.email)) {
            emailMap.set(member.email, []);
          }
          emailMap.get(member.email)!.push(member);
        }
      });
      
      let duplicatesRemoved = 0;
      
      // Supprimer les doublons (garder le plus récent)
      for (const [email, duplicates] of emailMap.entries()) {
        if (duplicates.length > 1) {
          console.log(`Doublons trouvés pour ${email}:`, duplicates.length);
          
          // Trier par date de création (le plus récent en premier)
          duplicates.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });
          
          // Supprimer tous sauf le plus récent
          for (let i = 1; i < duplicates.length; i++) {
            try {
              await this.deleteStaff(duplicates[i].id);
              duplicatesRemoved++;
              console.log(`Doublon supprimé: ${duplicates[i].firstName} ${duplicates[i].lastName} (ID: ${duplicates[i].id})`);
            } catch (error) {
              console.error(`Erreur suppression doublon ID ${duplicates[i].id}:`, error);
            }
          }
        }
      }
      
      const finalStaff = await this.getStaff();
      console.log(`Nettoyage terminé: ${duplicatesRemoved} doublons supprimés, ${finalStaff.length} membres restants`);
      
      return { duplicatesRemoved, remainingStaff: finalStaff.length };
    } catch (error) {
      console.error('Erreur lors du nettoyage des doublons:', error);
      throw error;
    }
  }

  // Export/Import des données
  static async exportData(type: 'all' | 'staff' | 'evaluations' | 'themes' = 'all') {
    if (this.isElectron()) {
      try {
        const exportedData = await window.electronAPI!.exportData(type);
        console.log('Export Electron réussi pour:', type);
        return exportedData;
      } catch (error) {
        console.error('Erreur Electron exportData, fallback localStorage:', error);
      }
    }
    
    // Fallback pour le développement web
    const data: any = {};
    
    if (type === 'all' || type === 'staff') {
      data.staff = JSON.parse(localStorage.getItem('staff') || '[]');
    }
    if (type === 'all' || type === 'evaluations') {
      data.evaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
    }
    if (type === 'all' || type === 'themes') {
      data.themes = JSON.parse(localStorage.getItem('themes') || '[]');
    }
    
    console.log('Export localStorage pour:', type, data);
    return JSON.stringify(data, null, 2);
  }

  static async importData(jsonData: string) {
    return await this.executeWithFallback(
      async () => {
        const result = await window.electronAPI!.importData(jsonData);
        // Synchroniser avec localStorage après import
        if (result) {
          const data = JSON.parse(jsonData);
          if (data.staff) localStorage.setItem('staff', JSON.stringify(data.staff));
          if (data.evaluations) localStorage.setItem('evaluations', JSON.stringify(data.evaluations));
          if (data.themes) localStorage.setItem('themes', JSON.stringify(data.themes));
        }
        return result;
      },
      () => {
        try {
          const data = JSON.parse(jsonData);
          if (data.staff) localStorage.setItem('staff', JSON.stringify(data.staff));
          if (data.evaluations) localStorage.setItem('evaluations', JSON.stringify(data.evaluations));
          if (data.themes) localStorage.setItem('themes', JSON.stringify(data.themes));
          return true;
        } catch (error) {
          console.error('Erreur lors de l\'import:', error);
          return false;
        }
      },
      'importData'
    );
  }

  // Effacer toutes les données (pour la restauration de sauvegarde)
  static async clearAllData(): Promise<boolean> {
    try {
      console.log('🗑️ DatabaseService.clearAllData - Suppression de toutes les données...');
      
      // Obtenir toutes les données pour suppression séquentielle
      const [staff, evaluations, themes] = await Promise.all([
        this.getStaff(),
        this.getEvaluations(), 
        this.getThemes()
      ]);
      
      let deletedCount = 0;
      
      // Supprimer toutes les évaluations
      for (const evaluation of evaluations) {
        try {
          await this.deleteEvaluation(evaluation.id);
          deletedCount++;
        } catch (error) {
          console.warn(`Erreur suppression évaluation ${evaluation.id}:`, error);
        }
      }
      
      // Supprimer tous les thèmes
      for (const theme of themes) {
        try {
          await this.deleteTheme(theme.id);
          deletedCount++;
        } catch (error) {
          console.warn(`Erreur suppression thème ${theme.id}:`, error);
        }
      }
      
      // Supprimer tout le personnel
      for (const member of staff) {
        try {
          await this.deleteStaff(member.id);
          deletedCount++;
        } catch (error) {
          console.warn(`Erreur suppression staff ${member.id}:`, error);
        }
      }
      
      // Nettoyer le localStorage en cas de fallback
      localStorage.removeItem('staff');
      localStorage.removeItem('evaluations');
      localStorage.removeItem('themes');
      
      // Nettoyer le cache
      this.clearCache();
      
      // Émettre les événements de synchronisation
      this.emit('data-cleared');
      this.emit('data-updated');
      this.emit('staff-updated');
      this.emit('evaluations-updated');
      this.emit('themes-updated');
      
      console.log(`✅ DatabaseService.clearAllData - ${deletedCount} éléments supprimés`);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de toutes les données:', error);
      return false;
    }
  }
}
