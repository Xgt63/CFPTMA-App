/**
 * 📊 Service d'Importation Excel Intelligent
 * Analyse automatiquement le format d'export existant et importe les données
 * Compatible avec les 3 feuilles standard : Personnel, Évaluations, Thèmes Formation
 */

import * as XLSX from 'xlsx';
import { Staff, Evaluation, Theme } from '../types';

export interface ImportResult {
  success: boolean;
  data: {
    staff: Staff[];
    evaluations: Evaluation[];
    themes: Theme[];
  };
  errors: string[];
  warnings: string[];
  summary: {
    staffImported: number;
    evaluationsImported: number;
    themesImported: number;
    duplicatesIgnored: number;
    sheetsProcessed: number;
    unrecognizedSheets: string[];
  };
}

// Mappeurs pour détecter les colonnes par nom (insensible à la casse et variations)
interface ColumnMapper {
  [key: string]: string[];
}

// Mappeur pour les colonnes du personnel
const STAFF_COLUMN_MAPPER: ColumnMapper = {
  id: ['id', 'ID', 'identifiant', 'staff_id'],
  matricule: ['matricule', 'Matricule', 'number', 'num', 'employee_number'],
  firstName: ['prénom', 'prenom', 'firstname', 'first_name', 'first name', 'nom de famille'],
  lastName: ['nom', 'lastname', 'last_name', 'last name', 'surname', 'family_name'],
  position: ['poste', 'position', 'job', 'title', 'fonction', 'role'],
  email: ['email', 'e-mail', 'mail', 'adresse email', 'courriel'],
  phone: ['téléphone', 'telephone', 'phone', 'tel', 'mobile', 'contact'],
  establishment: ['établissement', 'etablissement', 'establishment', 'company', 'organisation', 'site'],
  formationYear: ['année formation', 'annee formation', 'formation year', 'year', 'année', 'annee'],
  createdAt: ['date de création', 'date creation', 'created at', 'created_at', 'date']
};

// Mappeur pour les colonnes des thèmes
const THEMES_COLUMN_MAPPER: ColumnMapper = {
  id: ['id', 'ID', 'identifiant', 'theme_id'],
  name: ['nom', 'name', 'title', 'intitulé', 'intitule', 'thème', 'theme'],
  description: ['description', 'desc', 'details', 'détails', 'detils', 'contenu'],
  createdAt: ['date de création', 'date creation', 'created at', 'created_at', 'date']
};

// Mappeur pour les colonnes des évaluations (format complet)
const EVALUATION_COLUMN_MAPPER: ColumnMapper = {
  id: ['id', 'ID', 'identifiant', 'evaluation_id'],
  staffId: ['staff id', 'staff_id', 'id personnel', 'employee_id'],
  firstName: ['prénom', 'prenom', 'firstname', 'first_name', 'first name'],
  lastName: ['nom', 'lastname', 'last_name', 'last name', 'surname'],
  fillDate: ['date évaluation', 'date evaluation', 'fill date', 'date', 'evaluation_date'],
  formationTheme: ['thème formation', 'theme formation', 'formation theme', 'theme', 'formation'],
  
  // Scores de compétences - section formation
  skillsAcquisition: ['acquisition compétences', 'acquisition competences', 'skills acquisition'],
  personalDevelopment: ['développement personnel', 'developpement personnel', 'personal development'],
  courseClarity: ['clarté cours', 'clarte cours', 'course clarity'],
  theoryPractice: ['théorie/pratique', 'theorie pratique', 'theory practice'],
  syllabusAdequacy: ['adéquation programme', 'adequation programme', 'syllabus adequacy'],
  practicalCases: ['cas pratiques', 'practical cases'],
  objectivesAchieved: ['objectifs atteints', 'objectives achieved'],
  adaptedKnowledge: ['connaissances adaptées', 'connaissances adaptees', 'adapted knowledge'],
  
  // Scores formateur
  pedagogicalSupport: ['support pédagogique', 'support pedagogique', 'pedagogical support'],
  techniquesUsed: ['techniques utilisées', 'techniques utilisees', 'techniques used'],
  presentation: ['présentation', 'presentation'],
  
  // Conditions
  logisticsConditions: ['conditions logistiques', 'logistics conditions'],
  rhythm: ['rythme', 'rhythm'],
  punctuality: ['ponctualité', 'punctualite', 'punctuality'],
  
  // Comportement
  punctualityAssiduity: ['assiduité', 'assiduity', 'attendance'],
  teamworkSense: ['esprit équipe', 'esprit equipe', 'teamwork sense'],
  motivationEnthusiasm: ['motivation', 'enthusiasm'],
  communicationSociable: ['communication sociable', 'sociable communication'],
  communicationGeneral: ['communication générale', 'communication generale', 'general communication'],
  aptitudeChangeIdeas: ['aptitude échanges', 'aptitude echanges', 'aptitude exchanges'],
  curiosity: ['curiosité', 'curiosite', 'curiosity'],
  initiativeSpirit: ['initiative', 'initiative spirit'],
  responsibilitySense: ['responsabilité', 'responsabilite', 'responsibility'],
  
  // Performance
  criticalAnalysis: ['analyse critique', 'critical analysis'],
  workExecution: ['exécution travail', 'execution travail', 'work execution'],
  directivesComprehension: ['compréhension directives', 'comprehension directives', 'directives comprehension'],
  workQuality: ['qualité travail', 'qualite travail', 'work quality'],
  subjectMastery: ['maîtrise sujet', 'maitrise sujet', 'subject mastery'],
  
  // Recommandation
  recommendationScore: ['score recommandation', 'recommendation score', 'recommandation'],
  justificationObservations: ['justifications', 'observations', 'comments', 'commentaires'],
  
  // Statut de l'évaluation (nouveau)
  status: ['statut', 'status', 'state', 'état', 'etat', 'completion'],
  
  createdAt: ['date de création', 'date creation', 'created at', 'created_at']
};

export class ExcelImportService {
  
  /**
   * 📝 Fonction utilitaire pour détecter le type de feuille par son nom
   */
  private static detectSheetType(sheetName: string): 'staff' | 'evaluations' | 'themes' | 'unknown' {
    const name = sheetName.toLowerCase().trim();
    
    // Détection pour le personnel
    if (name.includes('personnel') || name.includes('staff') || name.includes('employé') || 
        name.includes('membre') || name.includes('team')) {
      return 'staff';
    }
    
    // Détection pour les évaluations
    if (name.includes('évaluation') || name.includes('evaluation') || name.includes('assessment') || 
        name.includes('score') || name.includes('note')) {
      return 'evaluations';
    }
    
    // Détection pour les thèmes
    if (name.includes('thème') || name.includes('theme') || name.includes('formation') || 
        name.includes('cours') || name.includes('sujet')) {
      return 'themes';
    }
    
    return 'unknown';
  }
  
  /**
   * 🔍 Fonction pour mapper les colonnes selon les noms de headers
   */
  private static mapColumns(headers: string[], mapper: ColumnMapper): { [key: string]: number } {
    const columnMap: { [key: string]: number } = {};
    
    // Normaliser les headers (minuscules, sans accents, espaces)
    const normalizedHeaders = headers.map(header => 
      this.normalizeString(header?.toString() || '')
    );
    
    // Pour chaque champ dans le mapper
    for (const [fieldName, possibleNames] of Object.entries(mapper)) {
      // Chercher une correspondance dans les headers
      for (let i = 0; i < normalizedHeaders.length; i++) {
        const normalizedHeader = normalizedHeaders[i];
        
        // Vérifier si ce header correspond à l'un des noms possibles
        const match = possibleNames.some(possibleName => {
          const normalizedPossibleName = this.normalizeString(possibleName);
          return normalizedHeader.includes(normalizedPossibleName) || 
                 normalizedPossibleName.includes(normalizedHeader);
        });
        
        if (match) {
          columnMap[fieldName] = i;
          break;
        }
      }
    }
    
    return columnMap;
  }
  
  /**
   * 📝 Normaliser une chaîne pour la comparaison (minuscules, sans accents, espaces)
   */
  private static normalizeString(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * 📊 Détecter le type de contenu d'une feuille en analysant ses headers
   */
  private static detectContentType(headers: string[]): 'staff' | 'evaluations' | 'themes' | 'unknown' {
    if (!headers || headers.length === 0) return 'unknown';
    
    const normalizedHeaders = headers.map(h => this.normalizeString(h?.toString() || ''));
    
    // Compter les correspondances pour chaque type
    let staffMatches = 0;
    let evaluationMatches = 0;
    let themeMatches = 0;
    
    // Vérifier les correspondances avec chaque mapper
    Object.values(STAFF_COLUMN_MAPPER).flat().forEach(possibleName => {
      if (normalizedHeaders.some(h => h.includes(this.normalizeString(possibleName)))) {
        staffMatches++;
      }
    });
    
    Object.values(EVALUATION_COLUMN_MAPPER).flat().forEach(possibleName => {
      if (normalizedHeaders.some(h => h.includes(this.normalizeString(possibleName)))) {
        evaluationMatches++;
      }
    });
    
    Object.values(THEMES_COLUMN_MAPPER).flat().forEach(possibleName => {
      if (normalizedHeaders.some(h => h.includes(this.normalizeString(possibleName)))) {
        themeMatches++;
      }
    });
    
    // Retourner le type avec le plus de correspondances
    if (staffMatches >= evaluationMatches && staffMatches >= themeMatches && staffMatches > 0) {
      return 'staff';
    } else if (evaluationMatches >= themeMatches && evaluationMatches > 0) {
      return 'evaluations';
    } else if (themeMatches > 0) {
      return 'themes';
    }
    
    return 'unknown';
  }
  
  /**
   * 📚 Importer un fichier Excel avec les données de l'ancienne application
   */
  static async importExcelFile(file: File): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      data: {
        staff: [],
        evaluations: [],
        themes: []
      },
      errors: [],
      warnings: [],
      summary: {
        staffImported: 0,
        evaluationsImported: 0,
        themesImported: 0,
        duplicatesIgnored: 0,
        sheetsProcessed: 0,
        unrecognizedSheets: []
      }
    };

    try {
      console.log('📊 Début de l\'importation Excel intelligente...');
      
      // Lire le fichier Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      console.log('📋 Feuilles trouvées:', workbook.SheetNames);
      
      // Traiter chaque feuille avec détection intelligente
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        console.log(`📄 Analyse de la feuille: ${sheetName}`);
        result.summary.sheetsProcessed++;
        
        if (!jsonData || jsonData.length < 2) {
          result.warnings.push(`Feuille '${sheetName}' vide ou sans données`);
          continue;
        }
        
        const headers = jsonData[0] as string[];
        if (!headers || headers.length === 0) {
          result.warnings.push(`Feuille '${sheetName}' sans en-têtes`);
          continue;
        }
        
        // Détection intelligente du type de feuille
        const sheetTypeByName = this.detectSheetType(sheetName);
        const contentType = this.detectContentType(headers);
        
        // Priorité au contenu si détecté, sinon utiliser le nom
        const finalType = contentType !== 'unknown' ? contentType : sheetTypeByName;
        
        console.log(`🔍 Feuille '${sheetName}' détectée comme: ${finalType} (nom: ${sheetTypeByName}, contenu: ${contentType})`);
        
        // Importer selon le type détecté
        switch (finalType) {
          case 'staff':
            await this.importStaffDataIntelligent(jsonData, result, sheetName);
            break;
          case 'evaluations':
            await this.importEvaluationDataIntelligent(jsonData, result, sheetName);
            break;
          case 'themes':
            await this.importThemeDataIntelligent(jsonData, result, sheetName);
            break;
          default:
            result.summary.unrecognizedSheets.push(sheetName);
            result.warnings.push(`Feuille '${sheetName}' non reconnue - contenu ignoré`);
            console.log(`⚠️ Feuille non reconnue: ${sheetName}`);
            break;
        }
      }
      
      // Générer le rapport final
      await this.generateImportReport(result);
      
      result.success = result.errors.length === 0 || (
        result.summary.staffImported > 0 || 
        result.summary.evaluationsImported > 0 || 
        result.summary.themesImported > 0
      );
      
      console.log('✅ Importation intelligente terminée:', result.summary);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'importation:', error);
      result.errors.push(`Erreur générale: ${error.message}`);
    }
    
    return result;
  }
  
  /**
   * 👥 Importer les données du personnel avec mapping intelligent
   */
  private static async importStaffDataIntelligent(data: any[][], result: ImportResult, sheetName: string) {
    console.log(`👥 Importation intelligente du personnel depuis '${sheetName}'...`);
    
    if (data.length < 2) {
      result.errors.push(`Feuille '${sheetName}': Données personnel insuffisantes`);
      return;
    }
    
    const headers = data[0] as string[];
    const columnMap = this.mapColumns(headers, STAFF_COLUMN_MAPPER);
    
    console.log(`🗺️ Mapping des colonnes personnel:`, columnMap);
    
    // Vérifier les colonnes essentielles
    const requiredFields = ['firstName', 'lastName'];
    const missingFields = requiredFields.filter(field => columnMap[field] === undefined);
    
    if (missingFields.length > 0) {
      result.errors.push(`Feuille '${sheetName}': Colonnes manquantes pour le personnel: ${missingFields.join(', ')}`);
      return;
    }
    
    const existingStaff = JSON.parse(localStorage.getItem('staff') || '[]');
    const existingEmails = new Set(existingStaff.map((s: Staff) => s.email?.toLowerCase()));
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      try {
        const staffMember = this.parseStaffRowIntelligent(row, columnMap);
        if (staffMember) {
          // Vérifier les doublons par email
          if (staffMember.email && existingEmails.has(staffMember.email.toLowerCase())) {
            result.summary.duplicatesIgnored++;
            result.warnings.push(`Personnel ligne ${i + 1}: Email '${staffMember.email}' déjà existant, ignoré`);
            continue;
          }
          
          result.data.staff.push(staffMember);
          if (staffMember.email) {
            existingEmails.add(staffMember.email.toLowerCase());
          }
          result.summary.staffImported++;
        }
      } catch (error) {
        result.errors.push(`Feuille '${sheetName}' ligne ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`✅ Personnel importé: ${result.summary.staffImported} membres`);
  }
  
  /**
   * 👥 Parser une ligne de personnel avec mapping intelligent
   */
  private static parseStaffRowIntelligent(row: any[], columnMap: { [key: string]: number }): Staff | null {
    if (!row || row.length === 0) return null;
    
    const getValue = (field: string): string => {
      const colIndex = columnMap[field];
      if (colIndex === undefined || colIndex >= row.length) return '';
      return row[colIndex]?.toString()?.trim() || '';
    };
    
    const firstName = getValue('firstName');
    const lastName = getValue('lastName');
    
    if (!firstName || !lastName) {
      throw new Error(`Prénom et nom requis (trouvé: '${firstName}', '${lastName}')`);
    }
    
    return {
      id: parseInt(getValue('id')) || Date.now() + Math.floor(Math.random() * 1000),
      matricule: getValue('matricule') || `MAT${Date.now()}`,
      firstName,
      lastName,
      position: getValue('position') || '',
      email: getValue('email') || '',
      phone: getValue('phone') || '',
      establishment: getValue('establishment') || '',
      formationYear: getValue('formationYear') || new Date().getFullYear().toString(),
      createdAt: getValue('createdAt') || new Date().toISOString()
    };
  }
  
  /**
   * 📊 Importer les données d'évaluation avec mapping intelligent
   */
  private static async importEvaluationDataIntelligent(data: any[][], result: ImportResult, sheetName: string) {
    console.log(`📊 Importation intelligente des évaluations depuis '${sheetName}'...`);
    
    if (data.length < 2) {
      result.errors.push(`Feuille '${sheetName}': Données évaluation insuffisantes`);
      return;
    }
    
    const headers = data[0] as string[];
    const columnMap = this.mapColumns(headers, EVALUATION_COLUMN_MAPPER);
    
    console.log(`🗺️ Mapping des colonnes évaluations:`, Object.keys(columnMap).length, 'colonnes mappées');
    
    // Vérifier les colonnes essentielles
    const requiredFields = ['firstName', 'lastName', 'formationTheme'];
    const missingFields = requiredFields.filter(field => columnMap[field] === undefined);
    
    if (missingFields.length > 0) {
      result.warnings.push(`Feuille '${sheetName}': Colonnes manquantes pour les évaluations: ${missingFields.join(', ')} - Import partiel`);
    }
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      try {
        const evaluation = this.parseEvaluationRowIntelligent(row, columnMap);
        if (evaluation) {
          result.data.evaluations.push(evaluation);
          result.summary.evaluationsImported++;
        }
      } catch (error) {
        result.errors.push(`Feuille '${sheetName}' ligne ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`✅ Évaluations importées: ${result.summary.evaluationsImported} évaluations`);
  }
  
  /**
   * 📊 Parser une ligne d'évaluation avec mapping intelligent
   */
  private static parseEvaluationRowIntelligent(row: any[], columnMap: { [key: string]: number }): Evaluation | null {
    if (!row || row.length === 0) return null;
    
    const getValue = (field: string): any => {
      const colIndex = columnMap[field];
      if (colIndex === undefined || colIndex >= row.length) return '';
      return row[colIndex];
    };
    
    const getStringValue = (field: string): string => {
      return getValue(field)?.toString()?.trim() || '';
    };
    
    const getNumberValue = (field: string): number => {
      const value = getValue(field);
      const num = parseFloat(value?.toString() || '0');
      return isNaN(num) ? 0 : num;
    };
    
    const firstName = getStringValue('firstName');
    const lastName = getStringValue('lastName');
    const formationTheme = getStringValue('formationTheme');
    
    if (!firstName || !lastName) {
      throw new Error(`Prénom et nom requis pour l'évaluation (trouvé: '${firstName}', '${lastName}')`);
    }
    
    return {
      id: parseInt(getStringValue('id')) || Date.now() + Math.floor(Math.random() * 1000),
      staffId: parseInt(getStringValue('staffId')) || undefined,
      firstName,
      lastName,
      fillDate: getStringValue('fillDate') || new Date().toISOString().split('T')[0],
      formationTheme: formationTheme || 'Non spécifié',
      
      // Scores de compétences - section formation (1-5)
      skillsAcquisition: Math.min(5, Math.max(1, getNumberValue('skillsAcquisition') || 3)),
      personalDevelopment: Math.min(5, Math.max(1, getNumberValue('personalDevelopment') || 3)),
      courseClarity: Math.min(5, Math.max(1, getNumberValue('courseClarity') || 3)),
      theoryPractice: Math.min(5, Math.max(1, getNumberValue('theoryPractice') || 3)),
      syllabusAdequacy: Math.min(5, Math.max(1, getNumberValue('syllabusAdequacy') || 3)),
      practicalCases: Math.min(5, Math.max(1, getNumberValue('practicalCases') || 3)),
      objectivesAchieved: Math.min(5, Math.max(1, getNumberValue('objectivesAchieved') || 3)),
      adaptedKnowledge: Math.min(5, Math.max(1, getNumberValue('adaptedKnowledge') || 3)),
      
      // Scores formateur (1-5)
      pedagogicalSupport: Math.min(5, Math.max(1, getNumberValue('pedagogicalSupport') || 3)),
      techniquesUsed: Math.min(5, Math.max(1, getNumberValue('techniquesUsed') || 3)),
      presentation: Math.min(5, Math.max(1, getNumberValue('presentation') || 3)),
      
      // Conditions (1-5)
      logisticsConditions: Math.min(5, Math.max(1, getNumberValue('logisticsConditions') || 3)),
      rhythm: Math.min(5, Math.max(1, getNumberValue('rhythm') || 3)),
      punctuality: Math.min(5, Math.max(1, getNumberValue('punctuality') || 3)),
      
      // Comportement (1-5)
      punctualityAssiduity: Math.min(5, Math.max(1, getNumberValue('punctualityAssiduity') || 3)),
      teamworkSense: Math.min(5, Math.max(1, getNumberValue('teamworkSense') || 3)),
      motivationEnthusiasm: Math.min(5, Math.max(1, getNumberValue('motivationEnthusiasm') || 3)),
      communicationSociable: Math.min(5, Math.max(1, getNumberValue('communicationSociable') || 3)),
      communicationGeneral: Math.min(5, Math.max(1, getNumberValue('communicationGeneral') || 3)),
      aptitudeChangeIdeas: Math.min(5, Math.max(1, getNumberValue('aptitudeChangeIdeas') || 3)),
      curiosity: Math.min(5, Math.max(1, getNumberValue('curiosity') || 3)),
      initiativeSpirit: Math.min(5, Math.max(1, getNumberValue('initiativeSpirit') || 3)),
      responsibilitySense: Math.min(5, Math.max(1, getNumberValue('responsibilitySense') || 3)),
      
      // Performance (1-5)
      criticalAnalysis: Math.min(5, Math.max(1, getNumberValue('criticalAnalysis') || 3)),
      workExecution: Math.min(5, Math.max(1, getNumberValue('workExecution') || 3)),
      directivesComprehension: Math.min(5, Math.max(1, getNumberValue('directivesComprehension') || 3)),
      workQuality: Math.min(5, Math.max(1, getNumberValue('workQuality') || 3)),
      subjectMastery: Math.min(5, Math.max(1, getNumberValue('subjectMastery') || 3)),
      
      // Recommandation (1-5)
      recommendationScore: Math.min(5, Math.max(1, getNumberValue('recommendationScore') || 3)),
      justificationObservations: getStringValue('justificationObservations') || '',
      createdAt: getStringValue('createdAt') || new Date().toISOString()
    };
  }
  
  /**
   * 🎯 Importer les thèmes de formation avec mapping intelligent
   */
  private static async importThemeDataIntelligent(data: any[][], result: ImportResult, sheetName: string) {
    console.log(`🎯 Importation intelligente des thèmes depuis '${sheetName}'...`);
    
    if (data.length < 2) {
      result.errors.push(`Feuille '${sheetName}': Données thème insuffisantes`);
      return;
    }
    
    const headers = data[0] as string[];
    const columnMap = this.mapColumns(headers, THEMES_COLUMN_MAPPER);
    
    console.log(`🗺️ Mapping des colonnes thèmes:`, columnMap);
    
    // Vérifier les colonnes essentielles
    const requiredFields = ['name'];
    const missingFields = requiredFields.filter(field => columnMap[field] === undefined);
    
    if (missingFields.length > 0) {
      result.errors.push(`Feuille '${sheetName}': Colonnes manquantes pour les thèmes: ${missingFields.join(', ')}`);
      return;
    }
    
    const existingThemes = JSON.parse(localStorage.getItem('themes') || '[]');
    const existingThemeNames = new Set(existingThemes.map((t: Theme) => t.name.toLowerCase()));
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      try {
        const theme = this.parseThemeRowIntelligent(row, columnMap);
        if (theme && !existingThemeNames.has(theme.name.toLowerCase())) {
          result.data.themes.push(theme);
          existingThemeNames.add(theme.name.toLowerCase());
          result.summary.themesImported++;
        } else if (theme && existingThemeNames.has(theme.name.toLowerCase())) {
          result.summary.duplicatesIgnored++;
          result.warnings.push(`Thème ligne ${i + 1}: '${theme.name}' déjà existant, ignoré`);
        }
      } catch (error) {
        result.errors.push(`Feuille '${sheetName}' ligne ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`✅ Thèmes importés: ${result.summary.themesImported} thèmes`);
  }
  
  /**
   * 🎯 Parser une ligne de thème avec mapping intelligent
   */
  private static parseThemeRowIntelligent(row: any[], columnMap: { [key: string]: number }): Theme | null {
    if (!row || row.length === 0) return null;
    
    const getValue = (field: string): string => {
      const colIndex = columnMap[field];
      if (colIndex === undefined || colIndex >= row.length) return '';
      return row[colIndex]?.toString()?.trim() || '';
    };
    
    const name = getValue('name');
    if (!name) {
      throw new Error(`Nom du thème requis`);
    }
    
    return {
      id: parseInt(getValue('id')) || Date.now() + Math.floor(Math.random() * 1000),
      name,
      description: getValue('description') || '',
      createdAt: getValue('createdAt') || new Date().toISOString()
    };
  }
  
  /**
   * 📄 Générer le rapport d'importation
   */
  private static async generateImportReport(result: ImportResult) {
    console.log('📄 Génération du rapport d\'importation...');
    
    const totalImported = result.summary.staffImported + result.summary.evaluationsImported + result.summary.themesImported;
    
    if (totalImported === 0 && result.summary.sheetsProcessed > 0) {
      result.warnings.push('Aucune donnée n\'a pu être importée des feuilles trouvées');
    }
    
    if (result.summary.unrecognizedSheets.length > 0) {
      result.warnings.push(`Feuilles non reconnues: ${result.summary.unrecognizedSheets.join(', ')}`);
    }
    
    if (result.summary.duplicatesIgnored > 0) {
      result.warnings.push(`${result.summary.duplicatesIgnored} doublon(s) ignoré(s)`);
    }
    
    // Lier les évaluations au personnel si possible
    await this.linkEvaluationsToStaff(result);
    
    console.log('✅ Rapport d\'importation généré:');
    console.log(`  - Personnel: ${result.summary.staffImported}`);
    console.log(`  - Évaluations: ${result.summary.evaluationsImported}`);
    console.log(`  - Thèmes: ${result.summary.themesImported}`);
    console.log(`  - Doublons ignorés: ${result.summary.duplicatesIgnored}`);
    console.log(`  - Erreurs: ${result.errors.length}`);
    console.log(`  - Avertissements: ${result.warnings.length}`);
  }
  
  /**
   * 🔗 Lier les évaluations au personnel importé
   */
  private static async linkEvaluationsToStaff(result: ImportResult) {
    console.log('🔗 Liaison des évaluations au personnel...');
    
    let linkedCount = 0;
    
    for (const evaluation of result.data.evaluations) {
      if (!evaluation.staffId) {
        // Chercher le personnel correspondant par prénom/nom
        const matchingStaff = result.data.staff.find(staff => 
          staff.firstName.toLowerCase() === evaluation.firstName.toLowerCase() &&
          staff.lastName.toLowerCase() === evaluation.lastName.toLowerCase()
        );
        
        if (matchingStaff) {
          evaluation.staffId = matchingStaff.id;
          linkedCount++;
        }
      }
    }
    
    if (linkedCount > 0) {
      console.log(`✅ ${linkedCount} évaluation(s) liée(s) au personnel`);
    }
  }
  
  /**
   * 💾 Sauvegarder les données importées dans la base de données
   */
  static async saveImportedData(importResult: ImportResult): Promise<boolean> {
    try {
      console.log('💾 Sauvegarde des données importées...');
      
      let savedCount = 0;
      
      // Sauvegarder le personnel
      for (const staff of importResult.data.staff) {
        try {
          // Utiliser localStorage directement pour éviter les problèmes de service
          const existingStaff = JSON.parse(localStorage.getItem('staff') || '[]');
          const exists = existingStaff.find((s: Staff) => s.email === staff.email);
          if (!exists) {
            existingStaff.push(staff);
            localStorage.setItem('staff', JSON.stringify(existingStaff));
            savedCount++;
          }
        } catch (error) {
          console.error('Erreur sauvegarde personnel:', error);
        }
      }
      
      // Sauvegarder les thèmes
      for (const theme of importResult.data.themes) {
        try {
          const existingThemes = JSON.parse(localStorage.getItem('themes') || '[]');
          const exists = existingThemes.find((t: Theme) => t.name.toLowerCase() === theme.name.toLowerCase());
          if (!exists) {
            existingThemes.push(theme);
            localStorage.setItem('themes', JSON.stringify(existingThemes));
            savedCount++;
          }
        } catch (error) {
          console.error('Erreur sauvegarde thèmes:', error);
        }
      }
      
      // Sauvegarder les évaluations
      for (const evaluation of importResult.data.evaluations) {
        try {
          const existingEvaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
          existingEvaluations.push(evaluation);
          localStorage.setItem('evaluations', JSON.stringify(existingEvaluations));
          savedCount++;
        } catch (error) {
          console.error('Erreur sauvegarde évaluations:', error);
        }
      }
      
      console.log(`✅ Sauvegarde terminée: ${savedCount} éléments sauvegardés`);
      
      // Déclencher les événements de synchronisation
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      
      return savedCount > 0;
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      return false;
    }
  }
}
