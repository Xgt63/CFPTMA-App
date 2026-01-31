/**
 * 🛡️ Service de Validation et Migration de Base de Données
 * Garantit l'intégrité et la cohérence des données
 */

import { DatabaseService } from './database';

// Schémas de validation
export interface StaffSchema {
  id: number;
  matricule: string;
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  phone: string;
  establishment: string;
  formationYear: string;
  createdAt: string;
}

export interface EvaluationSchema {
  id: number;
  staffId?: number;
  firstName: string;
  lastName: string;
  formationTheme: string;
  fillDate: string;
  // Scores (1-5)
  skillsAcquisition: number;
  personalDevelopment: number;
  courseClarity: number;
  theoryPractice: number;
  syllabusAdequacy: number;
  practicalCases: number;
  objectivesAchieved: number;
  adaptedKnowledge: number;
  pedagogicalSupport: number;
  techniquesUsed: number;
  presentation: number;
  logisticsConditions: number;
  rhythm: number;
  punctuality: number;
  punctualityAssiduity: number;
  teamworkSense: number;
  motivationEnthusiasm: number;
  communicationSociable: number;
  communicationGeneral: number;
  aptitudeChangeIdeas: number;
  curiosity: number;
  initiativeSpirit: number;
  responsibilitySense: number;
  criticalAnalysis: number;
  workExecution: number;
  directivesComprehension: number;
  workQuality: number;
  subjectMastery: number;
  recommendationScore: number;
  justifications?: string;
  createdAt: string;
}

export interface ThemeSchema {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

export class DatabaseValidator {
  // Validation d'un membre du personnel
  static validateStaff(staff: any): { isValid: boolean; errors: string[]; cleaned?: StaffSchema } {
    const errors: string[] = [];
    
    if (!staff) {
      errors.push('Données manquantes');
      return { isValid: false, errors };
    }

    // Validation des champs obligatoires
    if (!staff.firstName || typeof staff.firstName !== 'string' || staff.firstName.trim().length === 0) {
      errors.push('Prénom requis et doit être une chaîne non vide');
    }
    if (!staff.lastName || typeof staff.lastName !== 'string' || staff.lastName.trim().length === 0) {
      errors.push('Nom requis et doit être une chaîne non vide');
    }
    if (!staff.email || typeof staff.email !== 'string' || !this.validateEmail(staff.email)) {
      errors.push('Email requis et doit avoir un format valide');
    }
    if (!staff.position || typeof staff.position !== 'string' || staff.position.trim().length === 0) {
      errors.push('Poste requis');
    }

    // Validation des champs optionnels avec valeurs par défaut
    const cleaned: StaffSchema = {
      id: staff.id || Date.now(),
      matricule: staff.matricule || `MAT${Date.now()}`,
      firstName: staff.firstName?.trim() || '',
      lastName: staff.lastName?.trim() || '',
      position: staff.position?.trim() || '',
      email: staff.email?.trim().toLowerCase() || '',
      phone: staff.phone?.trim() || '',
      establishment: staff.establishment?.trim() || 'Non spécifié',
      formationYear: staff.formationYear || new Date().getFullYear().toString(),
      createdAt: staff.createdAt || new Date().toISOString()
    };

    return { isValid: errors.length === 0, errors, cleaned };
  }

  // Validation d'une évaluation
  static validateEvaluation(evaluation: any): { isValid: boolean; errors: string[]; cleaned?: Partial<EvaluationSchema> } {
    const errors: string[] = [];
    
    if (!evaluation) {
      errors.push('Données d\'évaluation manquantes');
      return { isValid: false, errors };
    }

    // Validation des champs obligatoires
    if (!evaluation.firstName || typeof evaluation.firstName !== 'string') {
      errors.push('Prénom requis pour l\'évaluation');
    }
    if (!evaluation.lastName || typeof evaluation.lastName !== 'string') {
      errors.push('Nom requis pour l\'évaluation');
    }
    if (!evaluation.formationTheme || typeof evaluation.formationTheme !== 'string') {
      errors.push('Thème de formation requis');
    }

    // Validation des scores (1-5)
    const scoreFields = [
      'skillsAcquisition', 'personalDevelopment', 'courseClarity', 'theoryPractice',
      'syllabusAdequacy', 'practicalCases', 'objectivesAchieved', 'adaptedKnowledge',
      'pedagogicalSupport', 'techniquesUsed', 'presentation', 'logisticsConditions',
      'rhythm', 'punctuality', 'punctualityAssiduity', 'teamworkSense',
      'motivationEnthusiasm', 'communicationSociable', 'communicationGeneral',
      'aptitudeChangeIdeas', 'curiosity', 'initiativeSpirit', 'responsibilitySense',
      'criticalAnalysis', 'workExecution', 'directivesComprehension', 'workQuality',
      'subjectMastery', 'recommendationScore'
    ];

    const cleaned: Partial<EvaluationSchema> = {
      id: evaluation.id || Date.now(),
      staffId: evaluation.staffId,
      firstName: evaluation.firstName?.trim(),
      lastName: evaluation.lastName?.trim(),
      formationTheme: evaluation.formationTheme?.trim(),
      fillDate: evaluation.fillDate || new Date().toISOString().split('T')[0],
      justifications: evaluation.justifications?.trim() || '',
      createdAt: evaluation.createdAt || new Date().toISOString()
    };

    // Valider et nettoyer les scores
    scoreFields.forEach(field => {
      const score = evaluation[field];
      if (score !== undefined) {
        const numScore = Number(score);
        if (isNaN(numScore) || numScore < 1 || numScore > 5) {
          errors.push(`${field} doit être un nombre entre 1 et 5`);
          (cleaned as any)[field] = 3; // Valeur par défaut
        } else {
          (cleaned as any)[field] = Math.round(numScore);
        }
      } else {
        (cleaned as any)[field] = 3; // Valeur par défaut si manquant
      }
    });

    return { isValid: errors.length === 0, errors, cleaned };
  }

  // Validation d'un thème
  static validateTheme(theme: any): { isValid: boolean; errors: string[]; cleaned?: ThemeSchema } {
    const errors: string[] = [];
    
    if (!theme) {
      errors.push('Données de thème manquantes');
      return { isValid: false, errors };
    }

    if (!theme.name || typeof theme.name !== 'string' || theme.name.trim().length === 0) {
      errors.push('Nom du thème requis');
    }

    const cleaned: ThemeSchema = {
      id: theme.id || Date.now(),
      name: theme.name?.trim() || '',
      description: theme.description?.trim() || '',
      createdAt: theme.createdAt || new Date().toISOString()
    };

    return { isValid: errors.length === 0, errors, cleaned };
  }

  // Validation d'email
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Migration et nettoyage de toutes les données
  static async migrateAndCleanDatabase(): Promise<{ success: boolean; report: any }> {
    console.log('🔧 Début de la migration et nettoyage de la base de données...');
    
    const report = {
      staff: { total: 0, valid: 0, invalid: 0, duplicates: 0 },
      evaluations: { total: 0, valid: 0, invalid: 0, orphaned: 0 },
      themes: { total: 0, valid: 0, invalid: 0 },
      errors: [] as string[]
    };

    try {
      // 1. Migration du personnel
      console.log('👥 Migration du personnel...');
      const rawStaff = JSON.parse(localStorage.getItem('staff') || '[]');
      report.staff.total = rawStaff.length;
      
      const validStaff: StaffSchema[] = [];
      const staffEmails = new Set<string>();
      
      for (const member of rawStaff) {
        const validation = this.validateStaff(member);
        if (validation.isValid && validation.cleaned) {
          // Vérifier les doublons par email
          if (staffEmails.has(validation.cleaned.email)) {
            report.staff.duplicates++;
            report.errors.push(`Doublon ignoré: ${validation.cleaned.email}`);
          } else {
            staffEmails.add(validation.cleaned.email);
            validStaff.push(validation.cleaned);
            report.staff.valid++;
          }
        } else {
          report.staff.invalid++;
          report.errors.push(`Personnel invalide: ${validation.errors.join(', ')}`);
        }
      }
      
      // Sauvegarder le personnel nettoyé
      localStorage.setItem('staff', JSON.stringify(validStaff));
      console.log(`✅ Personnel migré: ${report.staff.valid}/${report.staff.total}`);

      // 2. Migration des évaluations
      console.log('📊 Migration des évaluations...');
      const rawEvaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
      report.evaluations.total = rawEvaluations.length;
      
      const validEvaluations: Partial<EvaluationSchema>[] = [];
      
      for (const evaluation of rawEvaluations) {
        const validation = this.validateEvaluation(evaluation);
        if (validation.isValid && validation.cleaned) {
          // Vérifier si le personnel associé existe
          const associatedStaff = validStaff.find(s => 
            (evaluation.staffId && s.id === evaluation.staffId) ||
            (s.firstName === validation.cleaned!.firstName && s.lastName === validation.cleaned!.lastName)
          );
          
          if (associatedStaff || (!evaluation.staffId)) {
            // Lier l'évaluation au personnel si possible
            if (associatedStaff && !validation.cleaned.staffId) {
              validation.cleaned.staffId = associatedStaff.id;
            }
            validEvaluations.push(validation.cleaned);
            report.evaluations.valid++;
          } else {
            report.evaluations.orphaned++;
            report.errors.push(`Évaluation orpheline: ${validation.cleaned.firstName} ${validation.cleaned.lastName}`);
          }
        } else {
          report.evaluations.invalid++;
          report.errors.push(`Évaluation invalide: ${validation.errors.join(', ')}`);
        }
      }
      
      // Sauvegarder les évaluations nettoyées
      localStorage.setItem('evaluations', JSON.stringify(validEvaluations));
      console.log(`✅ Évaluations migrées: ${report.evaluations.valid}/${report.evaluations.total}`);

      // 3. Migration des thèmes
      console.log('🎯 Migration des thèmes...');
      const rawThemes = JSON.parse(localStorage.getItem('themes') || '[]');
      report.themes.total = rawThemes.length;
      
      const validThemes: ThemeSchema[] = [];
      const themeNames = new Set<string>();
      
      for (const theme of rawThemes) {
        const validation = this.validateTheme(theme);
        if (validation.isValid && validation.cleaned) {
          // Vérifier les doublons par nom
          if (themeNames.has(validation.cleaned.name.toLowerCase())) {
            report.errors.push(`Thème doublon ignoré: ${validation.cleaned.name}`);
          } else {
            themeNames.add(validation.cleaned.name.toLowerCase());
            validThemes.push(validation.cleaned);
            report.themes.valid++;
          }
        } else {
          report.themes.invalid++;
          report.errors.push(`Thème invalide: ${validation.errors.join(', ')}`);
        }
      }
      
      // Ajouter les thèmes par défaut s'ils n'existent pas
      const defaultThemes = [
        { name: 'Leadership Management', description: 'Formation sur les techniques de leadership et de management d\'équipe' },
        { name: 'Communication Efficace', description: 'Améliorer ses compétences en communication interpersonnelle' },
        { name: 'Gestion de Projet', description: 'Méthodologies et outils pour la gestion de projets' },
        { name: 'Innovation & Créativité', description: 'Développer l\'innovation et la créativité en entreprise' }
      ];
      
      defaultThemes.forEach(defaultTheme => {
        if (!themeNames.has(defaultTheme.name.toLowerCase())) {
          const newTheme: ThemeSchema = {
            id: Date.now() + Math.random(),
            name: defaultTheme.name,
            description: defaultTheme.description,
            createdAt: new Date().toISOString()
          };
          validThemes.push(newTheme);
          themeNames.add(defaultTheme.name.toLowerCase());
          report.themes.valid++;
        }
      });
      
      // Sauvegarder les thèmes nettoyés
      localStorage.setItem('themes', JSON.stringify(validThemes));
      console.log(`✅ Thèmes migrés: ${report.themes.valid}/${report.themes.total}`);

      // 4. Forcer la synchronisation
      DatabaseService.forceSyncAll();

      console.log('✅ Migration terminée avec succès!');
      return { success: true, report };

    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      report.errors.push(`Erreur système: ${error.message}`);
      return { success: false, report };
    }
  }

  // Fonction de diagnostic complet
  static async diagnoseDatabase(): Promise<any> {
    console.log('🔍 Diagnostic de la base de données...');
    
    const diagnosis = {
      localStorage: {
        staff: { count: 0, valid: 0, issues: [] as string[] },
        evaluations: { count: 0, valid: 0, issues: [] as string[] },
        themes: { count: 0, valid: 0, issues: [] as string[] }
      },
      electron: {
        available: typeof window !== 'undefined' && window.electronAPI,
        working: false
      },
      recommendations: [] as string[]
    };

    // Diagnostic localStorage
    try {
      const staff = JSON.parse(localStorage.getItem('staff') || '[]');
      diagnosis.localStorage.staff.count = staff.length;
      
      staff.forEach((member: any, index: number) => {
        const validation = this.validateStaff(member);
        if (validation.isValid) {
          diagnosis.localStorage.staff.valid++;
        } else {
          diagnosis.localStorage.staff.issues.push(`#${index}: ${validation.errors.join(', ')}`);
        }
      });

      const evaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
      diagnosis.localStorage.evaluations.count = evaluations.length;
      
      evaluations.forEach((evaluation: any, index: number) => {
        const validation = this.validateEvaluation(evaluation);
        if (validation.isValid) {
          diagnosis.localStorage.evaluations.valid++;
        } else {
          diagnosis.localStorage.evaluations.issues.push(`#${index}: ${validation.errors.join(', ')}`);
        }
      });

      const themes = JSON.parse(localStorage.getItem('themes') || '[]');
      diagnosis.localStorage.themes.count = themes.length;
      
      themes.forEach((theme: any, index: number) => {
        const validation = this.validateTheme(theme);
        if (validation.isValid) {
          diagnosis.localStorage.themes.valid++;
        } else {
          diagnosis.localStorage.themes.issues.push(`#${index}: ${validation.errors.join(', ')}`);
        }
      });

    } catch (error) {
      diagnosis.localStorage.staff.issues.push(`Erreur lecture localStorage: ${error.message}`);
    }

    // Test Electron
    if (diagnosis.electron.available) {
      try {
        await window.electronAPI!.getStaff();
        diagnosis.electron.working = true;
      } catch (error) {
        diagnosis.recommendations.push('API Electron non fonctionnelle, utilisation du localStorage uniquement');
      }
    } else {
      diagnosis.recommendations.push('Mode développement web détecté');
    }

    // Générer des recommandations
    if (diagnosis.localStorage.staff.valid < diagnosis.localStorage.staff.count) {
      diagnosis.recommendations.push('Migration du personnel recommandée');
    }
    if (diagnosis.localStorage.evaluations.valid < diagnosis.localStorage.evaluations.count) {
      diagnosis.recommendations.push('Migration des évaluations recommandée');
    }
    if (diagnosis.localStorage.themes.count === 0) {
      diagnosis.recommendations.push('Initialisation des thèmes par défaut recommandée');
    }

    console.log('📋 Diagnostic terminé:', diagnosis);
    return diagnosis;
  }
}