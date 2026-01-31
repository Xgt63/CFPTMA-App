// Service de base de données non-bloquant pour éviter le figement de l'interface
import { DatabaseService } from './database';

// Interface pour gérer les opérations en queue
interface DatabaseOperation {
  id: string;
  type: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  priority: number;
}

class NonBlockingDatabaseService {
  private operationQueue: DatabaseOperation[] = [];
  private isProcessing = false;
  private operationCounter = 0;

  // Fonction utilitaire pour forcer un repaint de l'interface
  private forceRepaint = () => {
    try {
      console.log('💫 NonBlockingDB: Force repaint déclenché');
      
      // Méthode 1: Forcer le reflow du document
      const body = document.body;
      const originalDisplay = body.style.display;
      body.style.display = 'none';
      body.offsetHeight; // Forcer le reflow
      body.style.display = originalDisplay;
      
      // Méthode 2: Forcer le repaint des éléments de formulaire
      const formElements = document.querySelectorAll('input, textarea, select, button');
      formElements.forEach((element: any) => {
        if (element.style) {
          const originalTransform = element.style.transform;
          element.style.transform = 'translateZ(0)';
          element.style.transform = originalTransform;
        }
      });
      
      // Méthode 3: Déclencher un événement personnalisé pour React
      const event = new CustomEvent('force-ui-refresh', { 
        detail: { timestamp: Date.now() } 
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Erreur lors du force repaint:', error);
    }
  };

  // Débloquer les éléments figés
  private unfreezeElements = () => {
    console.log('🔓 NonBlockingDB: Déblocage des éléments figés');
    
    try {
      // Réactiver tous les éléments disabled non-intentionnellement
      const disabledElements = document.querySelectorAll('[disabled]:not([data-permanently-disabled])');
      disabledElements.forEach((element: any) => {
        if (element && element.removeAttribute) {
          element.removeAttribute('disabled');
          if (element.hasOwnProperty('disabled')) {
            element.disabled = false;
          }
        }
      });
      
      // Réactiver les champs readonly non-intentionnels
      const readonlyElements = document.querySelectorAll('[readonly]:not([data-permanently-readonly])');
      readonlyElements.forEach((element: any) => {
        if (element && element.removeAttribute) {
          element.removeAttribute('readonly');
          if (element.hasOwnProperty('readOnly')) {
            element.readOnly = false;
          }
        }
      });
      
      // Forcer le focus sur le premier input visible
      setTimeout(() => {
        const firstInput = document.querySelector('input:not([disabled]):not([readonly]):not([type="hidden"])') as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
          firstInput.blur(); // Réveiller React
        }
      }, 50);
      
    } catch (error) {
      console.error('Erreur lors du déblocage des éléments:', error);
    }
  };

  // Ajouter une opération à la queue avec priorité
  private enqueueOperation<T>(
    type: string,
    operation: () => Promise<T>,
    priority: number = 1
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const operationId = `${type}_${++this.operationCounter}_${Date.now()}`;
      
      const dbOperation: DatabaseOperation = {
        id: operationId,
        type,
        execute: operation,
        resolve,
        reject,
        priority
      };

      console.log(`📥 NonBlockingDB: Ajout opération en queue: ${operationId}`);
      
      // Insérer selon la priorité
      let insertIndex = this.operationQueue.length;
      for (let i = 0; i < this.operationQueue.length; i++) {
        if (this.operationQueue[i].priority < priority) {
          insertIndex = i;
          break;
        }
      }
      
      this.operationQueue.splice(insertIndex, 0, dbOperation);
      this.processQueue();
    });
  }

  // Traiter la queue d'opérations
  private async processQueue() {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`⚡ NonBlockingDB: Traitement de la queue (${this.operationQueue.length} opération(s))`);

    while (this.operationQueue.length > 0) {
      const operation = this.operationQueue.shift()!;
      
      try {
        console.log(`🔄 NonBlockingDB: Exécution de ${operation.id}`);
        
        // Exécuter l'opération de manière asynchrone
        const result = await this.executeOperationSafely(operation);
        operation.resolve(result);
        
        console.log(`✅ NonBlockingDB: ${operation.id} terminée avec succès`);
        
        // Forcer un repaint après chaque opération critique
        if (['UPDATE', 'DELETE', 'CREATE'].some(op => operation.type.includes(op))) {
          setTimeout(() => {
            this.forceRepaint();
            this.unfreezeElements();
          }, 10);
        }
        
        // Pause courte pour éviter de bloquer l'UI
        await this.sleep(5);
        
      } catch (error) {
        console.error(`❌ NonBlockingDB: Erreur dans ${operation.id}:`, error);
        operation.reject(error);
        
        // En cas d'erreur, tenter de débloquer l'interface
        setTimeout(() => {
          this.forceRepaint();
          this.unfreezeElements();
        }, 50);
      }
    }

    this.isProcessing = false;
    console.log('🏁 NonBlockingDB: Queue vidée');
  }

  // Exécuter une opération de manière sécurisée
  private async executeOperationSafely(operation: DatabaseOperation): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout: ${operation.id} a pris trop de temps`));
      }, 10000); // 10 secondes max par opération

      try {
        const result = await operation.execute();
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  // Fonction d'attente non-bloquante
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // === MÉTHODES PUBLIQUES WRAPPÉES ===

  async getStaff(): Promise<any[]> {
    return this.enqueueOperation('GET_STAFF', () => DatabaseService.getStaff(), 3);
  }

  async createStaff(staffData: any): Promise<any> {
    return this.enqueueOperation('CREATE_STAFF', () => DatabaseService.createStaff(staffData), 2);
  }

  async updateStaff(id: number, staffData: any): Promise<any> {
    return this.enqueueOperation('UPDATE_STAFF', () => DatabaseService.updateStaff(id, staffData), 2);
  }

  async deleteStaff(id: number): Promise<any> {
    return this.enqueueOperation('DELETE_STAFF', () => DatabaseService.deleteStaff(id), 1);
  }

  async getEvaluations(): Promise<any[]> {
    return this.enqueueOperation('GET_EVALUATIONS', () => DatabaseService.getEvaluations(), 3);
  }

  async createEvaluation(evaluationData: any): Promise<any> {
    return this.enqueueOperation('CREATE_EVALUATION', () => DatabaseService.createEvaluation(evaluationData), 2);
  }

  async updateEvaluation(id: number, evaluationData: any): Promise<any> {
    return this.enqueueOperation('UPDATE_EVALUATION', () => DatabaseService.updateEvaluation(id, evaluationData), 2);
  }

  async deleteEvaluation(id: number): Promise<any> {
    return this.enqueueOperation('DELETE_EVALUATION', () => DatabaseService.deleteEvaluation(id), 1);
  }

  async getThemes(): Promise<any[]> {
    return this.enqueueOperation('GET_THEMES', () => DatabaseService.getThemes(), 3);
  }

  async createTheme(themeData: any): Promise<any> {
    return this.enqueueOperation('CREATE_THEME', () => DatabaseService.createTheme(themeData), 2);
  }

  async updateTheme(id: any, themeData: any): Promise<any> {
    return this.enqueueOperation('UPDATE_THEME', () => DatabaseService.updateTheme(id, themeData), 2);
  }

  async deleteTheme(id: any): Promise<any> {
    return this.enqueueOperation('DELETE_THEME', () => DatabaseService.deleteTheme(id), 1);
  }

  async getUsers(): Promise<any[]> {
    return this.enqueueOperation('GET_USERS', () => DatabaseService.getUsers(), 3);
  }

  async createUser(userData: any): Promise<any> {
    return this.enqueueOperation('CREATE_USER', () => DatabaseService.createUser(userData), 2);
  }

  async updateUser(id: number, userData: any): Promise<any> {
    return this.enqueueOperation('UPDATE_USER', () => DatabaseService.updateUser(id, userData), 2);
  }

  async deleteUser(id: number): Promise<any> {
    return this.enqueueOperation('DELETE_USER', () => DatabaseService.deleteUser(id), 1);
  }

  async removeDuplicateStaff(): Promise<any> {
    return this.enqueueOperation('REMOVE_DUPLICATES', () => DatabaseService.removeDuplicateStaff(), 1);
  }

  async getEvaluationStats(): Promise<any[]> {
    return this.enqueueOperation('GET_STATS', () => DatabaseService.getEvaluationStats(), 3);
  }

  // Export Excel automatique supprimé

  // Méthodes utilitaires
  async forceUIRefresh(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.forceRepaint();
        this.unfreezeElements();
        resolve();
      }, 10);
    });
  }

  // Vider la queue en cas d'urgence
  clearQueue(): void {
    console.log('🚨 NonBlockingDB: Vidage forcé de la queue');
    this.operationQueue.forEach(op => {
      op.reject(new Error('Opération annulée - queue vidée'));
    });
    this.operationQueue = [];
    this.isProcessing = false;
  }

  // Obtenir l'état de la queue
  getQueueStatus() {
    return {
      queueLength: this.operationQueue.length,
      isProcessing: this.isProcessing,
      operations: this.operationQueue.map(op => ({
        id: op.id,
        type: op.type,
        priority: op.priority
      }))
    };
  }

  // Méthodes de DatabaseService passthrough
  static addEventListener = DatabaseService.addEventListener.bind(DatabaseService);
  static removeEventListener = DatabaseService.removeEventListener.bind(DatabaseService);
  static forceSyncAll = DatabaseService.forceSyncAll.bind(DatabaseService);
  static initialize = DatabaseService.initialize.bind(DatabaseService);
}

// Export d'une instance singleton
export const NonBlockingDB = new NonBlockingDatabaseService();
export default NonBlockingDB;