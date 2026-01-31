/**
 * 🔄 Service de Gestion des Données Migrées
 * Interface entre les données migrées et l'application React
 */

import { Staff, Evaluation, Theme } from '../types';

interface MigratedData {
  staff: Staff[];
  evaluations: Evaluation[];
  themes: Theme[];
  migrationDate?: string;
}

export class MigrationService {
  
  /**
   * 🔍 Vérifie si des données migrées sont disponibles
   */
  static hasMigratedData(): boolean {
    try {
      // Vérifier si Electron API est disponible
      if (window.electronAPI?.readFile) {
        return true; // On vérifiera les fichiers via Electron
      }
      
      // Fallback: vérifier localStorage
      const staff = localStorage.getItem('staff');
      const evaluations = localStorage.getItem('evaluations');
      const themes = localStorage.getItem('themes');
      
      return !!(staff || evaluations || themes);
    } catch (error) {
      console.warn('Erreur lors de la vérification des données migrées:', error);
      return false;
    }
  }
  
  /**
   * 📊 Charge les données migrées
   */
  static async loadMigratedData(): Promise<MigratedData> {
    console.log('📊 Chargement des données migrées...');
    
    const migratedData: MigratedData = {
      staff: [],
      evaluations: [],
      themes: []
    };
    
    try {
      // Méthode 1: Via Electron (données fichiers)
      if (window.electronAPI?.readFile) {
        console.log('🔌 Utilisation de l\'API Electron pour charger les données');
        
        try {
          // Chemin probable des données migrées
          const userHome = require('os').homedir();
          const dataPath = `${userHome}/AppData/Roaming/Centre de Formation Professionnelle et Technique d'Ivato`;
          
          // Charger staff
          const staffResult = await window.electronAPI.readFile(`${dataPath}/staff.json`);
          if (staffResult.success) {
            migratedData.staff = JSON.parse(staffResult.data);
            console.log(`✅ ${migratedData.staff.length} membres du personnel chargés`);
          }
          
          // Charger evaluations
          const evalResult = await window.electronAPI.readFile(`${dataPath}/evaluations.json`);
          if (evalResult.success) {
            migratedData.evaluations = JSON.parse(evalResult.data);
            console.log(`✅ ${migratedData.evaluations.length} évaluations chargées`);
          }
          
          // Charger themes
          const themeResult = await window.electronAPI.readFile(`${dataPath}/themes.json`);
          if (themeResult.success) {
            migratedData.themes = JSON.parse(themeResult.data);
            console.log(`✅ ${migratedData.themes.length} thèmes chargés`);
          }
          
          // Charger info de migration
          const migrationResult = await window.electronAPI.readFile(`${dataPath}/migration.json`);
          if (migrationResult.success) {
            const migrationInfo = JSON.parse(migrationResult.data);
            migratedData.migrationDate = migrationInfo.migrationDate;
            console.log(`📅 Migration effectuée le: ${migratedData.migrationDate}`);
          }
          
        } catch (electronError) {
          console.warn('⚠️ Erreur Electron API, fallback vers localStorage:', electronError);
        }
      }
      
      // Méthode 2: Fallback localStorage
      if (migratedData.staff.length === 0) {
        console.log('🗃️ Fallback vers localStorage');
        
        const staff = localStorage.getItem('staff');
        if (staff) {
          migratedData.staff = JSON.parse(staff);
          console.log(`✅ ${migratedData.staff.length} membres chargés depuis localStorage`);
        }
        
        const evaluations = localStorage.getItem('evaluations');
        if (evaluations) {
          migratedData.evaluations = JSON.parse(evaluations);
          console.log(`✅ ${migratedData.evaluations.length} évaluations chargées depuis localStorage`);
        }
        
        const themes = localStorage.getItem('themes');
        if (themes) {
          migratedData.themes = JSON.parse(themes);
          console.log(`✅ ${migratedData.themes.length} thèmes chargés depuis localStorage`);
        }
      }
      
      // Si aucune donnée, initialiser avec les données par défaut
      if (migratedData.staff.length === 0 && migratedData.themes.length === 0) {
        migratedData.themes = this.getDefaultThemes();
        console.log('🎯 Données par défaut initialisées');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données migrées:', error);
    }
    
    console.log('📈 Résumé des données chargées:', {
      staff: migratedData.staff.length,
      evaluations: migratedData.evaluations.length,
      themes: migratedData.themes.length
    });
    
    return migratedData;
  }
  
  /**
   * 💾 Sauvegarde les données dans localStorage et fichiers
   */
  static async saveMigratedData(data: Partial<MigratedData>): Promise<boolean> {
    try {
      // Sauvegarder en localStorage
      if (data.staff) {
        localStorage.setItem('staff', JSON.stringify(data.staff));
      }
      if (data.evaluations) {
        localStorage.setItem('evaluations', JSON.stringify(data.evaluations));
      }
      if (data.themes) {
        localStorage.setItem('themes', JSON.stringify(data.themes));
      }
      
      // Si API Electron disponible, sauvegarder aussi en fichiers
      if (window.electronAPI?.writeFile) {
        try {
          const userHome = require('os').homedir();
          const dataPath = `${userHome}/AppData/Roaming/Centre de Formation Professionnelle et Technique d'Ivato`;
          
          if (data.staff) {
            await window.electronAPI.writeFile(`${dataPath}/staff.json`, JSON.stringify(data.staff, null, 2));
          }
          if (data.evaluations) {
            await window.electronAPI.writeFile(`${dataPath}/evaluations.json`, JSON.stringify(data.evaluations, null, 2));
          }
          if (data.themes) {
            await window.electronAPI.writeFile(`${dataPath}/themes.json`, JSON.stringify(data.themes, null, 2));
          }
        } catch (fileError) {
          console.warn('⚠️ Impossible de sauvegarder en fichiers:', fileError);
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      return false;
    }
  }
  
  /**
   * 🎯 Thèmes par défaut
   */
  private static getDefaultThemes(): Theme[] {
    return [
      {
        id: '1',
        name: 'Leadership Management',
        description: 'Formation sur les techniques de leadership et de management d\'équipe'
      },
      {
        id: '2',
        name: 'Communication Efficace',
        description: 'Améliorer ses compétences en communication interpersonnelle'
      },
      {
        id: '3',
        name: 'Sécurité au Travail',
        description: 'Formation sur les règles de sécurité au travail'
      },
      {
        id: '4',
        name: 'Qualité et Amélioration Continue',
        description: 'Concepts et outils d\'amélioration de la qualité'
      },
      {
        id: '5',
        name: 'Gestion de Projet',
        description: 'Méthodologies et outils de gestion de projets'
      },
      {
        id: '6',
        name: 'Innovation & Créativité',
        description: 'Développer l\'innovation et la créativité en entreprise'
      }
    ];
  }
  
  /**
   * 🔄 Synchroniser les données entre localStorage et SQLite (Electron)
   * Cette méthode garantit que les données sont cohérentes entre les deux sources
   */
  static async syncData(): Promise<void> {
    try {
      console.log('🔄 Début de la synchronisation bidirectionnelle...');
      
      // Vérifier si on est en mode Electron
      const isElectron = !!(window && window.electronAPI);
      
      if (isElectron) {
        console.log('⚡ Mode Electron détecté - Synchronisation SQLite ↔ localStorage');
        
        // 1. Récupérer les données de SQLite (source de vérité en Electron)
        const sqliteStaff = await window.electronAPI!.getStaff?.() || [];
        const sqliteEvaluations = await window.electronAPI!.getEvaluations?.() || [];
        const sqliteThemes = await window.electronAPI!.getThemes?.() || [];
        
        console.log('📊 Données SQLite:', {
          staff: sqliteStaff.length,
          evaluations: sqliteEvaluations.length,
          themes: sqliteThemes.length
        });
        
        // 2. Récupérer les données de localStorage
        const localStaff = JSON.parse(localStorage.getItem('staff') || '[]');
        const localEvaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
        const localThemes = JSON.parse(localStorage.getItem('themes') || '[]');
        
        console.log('💾 Données localStorage:', {
          staff: localStaff.length,
          evaluations: localEvaluations.length,
          themes: localThemes.length
        });
        
        // 3. SQLite est TOUJOURS la source de vérité en mode Electron
        // Ne JAMAIS migrer localStorage → SQLite (évite les données obsolètes)
        // Seulement vérifier si c'est la première utilisation (SQLite vide ET localStorage a des données)
        
        const isFirstLaunch = sqliteStaff.length === 0 && sqliteEvaluations.length === 0 && sqliteThemes.length === 0;
        const hasLocalData = localStaff.length > 0 || localEvaluations.length > 0 || localThemes.length > 0;
        
        if (isFirstLaunch && hasLocalData) {
          console.log('🚀 Premier lancement détecté - Migration unique localStorage → SQLite');
          
          if (localStaff.length > 0) {
            console.log('📤 Migration localStorage → SQLite pour le personnel');
            for (const member of localStaff) {
              try {
                await window.electronAPI!.createStaff?.(member);
              } catch (error) {
                console.warn('Erreur migration membre:', member.id, error);
              }
            }
          }
          
          if (localEvaluations.length > 0) {
            console.log('📤 Migration localStorage → SQLite pour les évaluations');
            for (const evaluation of localEvaluations) {
              try {
                await window.electronAPI!.createEvaluation?.(evaluation);
              } catch (error) {
                console.warn('Erreur migration évaluation:', evaluation.id, error);
              }
            }
          }
          
          if (localThemes.length > 0) {
            console.log('📤 Migration localStorage → SQLite pour les thèmes');
            for (const theme of localThemes) {
              try {
                await window.electronAPI!.createTheme?.(theme);
              } catch (error) {
                console.warn('Erreur migration thème:', theme.id, error);
              }
            }
          }
        } else {
          console.log('✅ SQLite est la source de vérité - Pas de migration localStorage');
        }
        
        // 4. TOUJOURS synchroniser localStorage DEPUIS SQLite (jamais l'inverse)
        const finalStaff = await window.electronAPI!.getStaff?.() || [];
        const finalEvaluations = await window.electronAPI!.getEvaluations?.() || [];
        const finalThemes = await window.electronAPI!.getThemes?.() || [];
        
        localStorage.setItem('staff', JSON.stringify(finalStaff));
        localStorage.setItem('evaluations', JSON.stringify(finalEvaluations));
        localStorage.setItem('themes', JSON.stringify(finalThemes));
        
        console.log('✅ Synchronisation Electron terminée');
        console.log('📊 Résultat final:', {
          staff: finalStaff.length,
          evaluations: finalEvaluations.length,
          themes: finalThemes.length
        });
        
      } else {
        console.log('🌐 Mode Web détecté - localStorage uniquement');
        const migratedData = await this.loadMigratedData();
        await this.saveMigratedData(migratedData);
      }
      
      console.log('🔄 Synchronisation complète terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
    }
  }
  
  /**
   * 📊 Statistiques des données migrées
   */
  static async getDataStats(): Promise<{ [key: string]: number }> {
    try {
      const data = await this.loadMigratedData();
      return {
        staff: data.staff.length,
        evaluations: data.evaluations.length,
        themes: data.themes.length,
        staffWithEvaluations: data.staff.filter(s => 
          data.evaluations.some(e => 
            e.staffId === s.id || 
            (e.firstName === s.firstName && e.lastName === s.lastName)
          )
        ).length
      };
    } catch (error) {
      console.error('❌ Erreur lors du calcul des statistiques:', error);
      return { staff: 0, evaluations: 0, themes: 0, staffWithEvaluations: 0 };
    }
  }
}