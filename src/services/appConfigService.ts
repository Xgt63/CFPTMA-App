/**
 * Service de gestion de la configuration de l'application
 * Permet de personnaliser les libellés affichés dans le logiciel
 */

export interface AppLabels {
  // Nom de l'application
  appName: string;
  appShortName: string;
  
  // Sections principales
  dashboard: string;
  staff: string;
  evaluation: string;
  statistics: string;
  settings: string;
  
  // Libellés personnel
  staffMember: string;
  staffMembers: string;
  addStaff: string;
  editStaff: string;
  deleteStaff: string;
  
  // Libellés évaluation
  evaluationForm: string;
  evaluations: string;
  newEvaluation: string;
  
  // Libellés généraux
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  search: string;
  filter: string;
  export: string;
  import: string;
  
  // Champs personnalisables
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  establishment: string;
  formationYear: string;
  matricule: string;
}

export const defaultLabels: AppLabels = {
  // Nom de l'application
  appName: 'Centre de Formation Professionnelle et Technique d\'Ivato',
  appShortName: 'CFPT Ivato',
  
  // Sections principales
  dashboard: 'Tableau de Bord',
  staff: 'Personnel',
  evaluation: 'Évaluation',
  statistics: 'Statistiques',
  settings: 'Paramètres',
  
  // Libellés personnel
  staffMember: 'Membre du personnel',
  staffMembers: 'Membres du personnel',
  addStaff: 'Ajouter un membre',
  editStaff: 'Modifier le membre',
  deleteStaff: 'Supprimer le membre',
  
  // Libellés évaluation
  evaluationForm: 'Formulaire d\'évaluation',
  evaluations: 'Évaluations',
  newEvaluation: 'Nouvelle évaluation',
  
  // Libellés généraux
  save: 'Enregistrer',
  cancel: 'Annuler',
  edit: 'Modifier',
  delete: 'Supprimer',
  search: 'Rechercher',
  filter: 'Filtrer',
  export: 'Exporter',
  import: 'Importer',
  
  // Champs personnalisables
  firstName: 'Prénom',
  lastName: 'Nom',
  email: 'Email',
  phone: 'Téléphone',
  position: 'Poste',
  establishment: 'Établissement',
  formationYear: 'Année de formation',
  matricule: 'Matricule',
};

const STORAGE_KEY = 'cfpt_app_labels';

export class AppConfigService {
  /**
   * Récupérer les libellés personnalisés
   */
  static getLabels(): AppLabels {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Fusionner avec les valeurs par défaut pour les nouveaux champs
        return { ...defaultLabels, ...parsed };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des libellés:', error);
    }
    return defaultLabels;
  }

  /**
   * Sauvegarder les libellés personnalisés
   */
  static saveLabels(labels: Partial<AppLabels>): void {
    try {
      const currentLabels = this.getLabels();
      const updatedLabels = { ...currentLabels, ...labels };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLabels));
      
      // Émettre un événement pour notifier les composants du changement
      window.dispatchEvent(new CustomEvent('app-labels-updated', { detail: updatedLabels }));
      
      console.log('Libellés sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des libellés:', error);
      throw error;
    }
  }

  /**
   * Réinitialiser les libellés aux valeurs par défaut
   */
  static resetLabels(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('app-labels-updated', { detail: defaultLabels }));
      console.log('Libellés réinitialisés aux valeurs par défaut');
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des libellés:', error);
      throw error;
    }
  }

  /**
   * Obtenir un libellé spécifique
   */
  static getLabel(key: keyof AppLabels): string {
    const labels = this.getLabels();
    return labels[key] || defaultLabels[key] || key;
  }

  /**
   * Exporter les libellés personnalisés
   */
  static exportLabels(): string {
    const labels = this.getLabels();
    return JSON.stringify(labels, null, 2);
  }

  /**
   * Importer des libellés personnalisés
   */
  static importLabels(jsonString: string): void {
    try {
      const labels = JSON.parse(jsonString);
      this.saveLabels(labels);
    } catch (error) {
      console.error('Erreur lors de l\'importation des libellés:', error);
      throw new Error('Format de fichier invalide');
    }
  }
}
