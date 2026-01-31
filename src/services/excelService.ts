import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { DatabaseService } from './database';

// Interface simplifiée avec seulement les champs essentiels
interface SimpleEvaluationData {
  // Informations de base (obligatoires)
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  
  // Formation (obligatoires)
  formationTheme: string;
  startDate: string;
  endDate: string;
  
  // Évaluation générale (0-5)
  globalSatisfaction: number;
  contentQuality: number;
  trainerQuality: number;
  organizationQuality: number;
  
  // Recommandation et besoins
  recommendToColleague: number; // 0-5
  additionalTrainingNeeds?: string;
  generalComments?: string;
}

// En-têtes simplifiés pour le modèle Excel
const SIMPLE_HEADERS: { [key in keyof SimpleEvaluationData]: string } = {
  // Informations personnelles
  firstName: 'Prénom',
  lastName: 'Nom',
  email: 'Email',
  phone: 'Téléphone',
  position: 'Poste/Fonction',
  
  // Formation
  formationTheme: 'Nom de la formation',
  startDate: 'Date début (AAAA-MM-JJ)',
  endDate: 'Date fin (AAAA-MM-JJ)',
  
  // Évaluations (notes de 0 à 5)
  globalSatisfaction: 'Satisfaction globale (0-5)',
  contentQuality: 'Qualité du contenu (0-5)',
  trainerQuality: 'Qualité du formateur (0-5)',
  organizationQuality: 'Organisation (0-5)',
  
  // Recommandation et besoins
  recommendToColleague: 'Recommandation (0-5)',
  additionalTrainingNeeds: 'Besoins futurs',
  generalComments: 'Commentaires généraux'
};

const SIMPLE_INSTRUCTIONS = [
  'INSTRUCTIONS SIMPLES:',
  '1. Remplissez une ligne par personne évaluée',
  '2. Les notes vont de 0 à 5 (0=Très mauvais, 5=Excellent)',
  '3. Dates au format AAAA-MM-JJ (ex: 2024-12-15)',
  '4. Champs obligatoires: Prénom, Nom, Email, Formation',
  '5. Sauvegardez le fichier avant de l\'importer',
  '',
  'EXEMPLE:',
  'Jean | Dupont | jean.dupont@email.com | Formation Excel | 4 | 5 | 4 | 3'
];

export class ExcelService {
  /**
   * Génère et télécharge un modèle Excel simplifié
   */
  static async generateTemplate(): Promise<void> {
    // Récupérer des données dynamiques
    let postesDyn: string[] = [];
    let themesDyn: string[] = [];
    try {
      const staffList = await DatabaseService.getStaff();
      if (Array.isArray(staffList)) {
        postesDyn = Array.from(new Set(
          staffList
            .map((s: any) => (s?.position || '').toString().trim())
            .filter((v: string) => !!v)
        )).sort();
      }
    } catch {}
    try {
      const themes = await DatabaseService.getThemes();
      if (Array.isArray(themes)) {
        themesDyn = Array.from(new Set(
          themes
            .map((t: any) => (t?.name || '').toString().trim())
            .filter((v: string) => !!v)
        )).sort();
      }
    } catch {}
    if (postesDyn.length === 0) {
      postesDyn = ['Manager', 'Formateur', 'Coordinatrice', 'Assistant'];
    }

    // Workbook ExcelJS pour un rendu et des validations avancées
    const wb = new ExcelJS.Workbook();
    wb.creator = 'CFPT Ivato';
    wb.created = new Date();

    // 1) Feuille Instructions
    const wsInfo = wb.addWorksheet('Instructions', { views: [{ showGridLines: false }] });
    wsInfo.columns = [{ width: 120 }];
    const addInfo = (text: string, style: Partial<ExcelJS.Font> & { colorHex?: string } = {}) => {
      const row = wsInfo.addRow([text]);
      row.height = 20;
      row.getCell(1).font = {
        name: 'Calibri',
        size: 12,
        color: style.colorHex ? { argb: style.colorHex.replace('#', '') } : undefined,
        bold: !!style.bold,
      } as ExcelJS.Font;
      row.getCell(1).alignment = { vertical: 'middle', wrapText: true };
    };
    const title = wsInfo.addRow(['Modèle Excel — Évaluations de formation']);
    title.height = 28;
    title.getCell(1).font = { name: 'Calibri', size: 16, bold: true, color: { argb: '0011EF' } };
    wsInfo.addRow(['']);
    addInfo('1) Ouvrez l’onglet « Évaluations » et remplissez une ligne par personne évaluée.');
    addInfo('2) Les champs en bleu sont obligatoires.');
    addInfo('3) Les notes doivent être comprises entre 0 et 5 (décimales autorisées).');
    addInfo('4) Utilisez les listes déroulantes pour Genre et Poste.');
    addInfo('5) Les dates doivent être au format AAAA-MM-JJ.');
    addInfo('6) En cas de besoin, consultez l’onglet « Référentiels » pour les listes.');

    wsInfo.getColumn(1).alignment = { wrapText: true };

    // 2) Feuille Référentiels (listes pour validations)
    const wsRef = wb.addWorksheet('Référentiels');
    wsRef.columns = [
      { header: 'Genres', key: 'genres', width: 18 },
      { header: 'Postes', key: 'postes', width: 24 },
      { header: 'Notes (0-5)', key: 'notes', width: 14 },
      { header: 'Thèmes formation', key: 'themes', width: 40 },
    ];
    const genres = ['Homme', 'Femme'];
    const postes = postesDyn;
    const notes = ['0', '1', '2', '3', '4', '5'];
    const themesList = themesDyn;

    const maxLen = Math.max(genres.length, postes.length, notes.length, themesList.length);
    for (let i = 0; i < maxLen; i++) {
      wsRef.addRow([
        genres[i] ?? null,
        postes[i] ?? null,
        notes[i] ?? null,
        themesList[i] ?? null,
      ]);
    }

    // Style header référentiels
    wsRef.getRow(1).font = { bold: true };
    wsRef.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } };

    // 3) Feuille Évaluations
    const ws = wb.addWorksheet('Évaluations');

    // Groupes (ligne 1)
    const headersGroups = [
      { title: 'Informations personnelles', from: 1, to: 8, color: 'E3F2FD' },
      { title: 'Détails formation', from: 9, to: 13, color: 'E8F5E9' },
      { title: 'Notes (0-5)', from: 14, to: 18, color: 'FFF8E1' },
      { title: 'Commentaires', from: 19, to: 20, color: 'F3E5F5' },
    ];
    ws.addRow(headersGroups.map(g => g.title));
    // Merge groups
    headersGroups.forEach(g => {
      ws.mergeCells(1, g.from, 1, g.to);
      const cell = ws.getCell(1, g.from);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: g.color } } as ExcelJS.FillPattern;
      cell.font = { bold: true };
    });

    // En-têtes (ligne 2)
    const headers = [
      // Base
      'Matricule', 'Prénom', 'Nom', 'Genre', 'Téléphone', 'Email', 'Poste/Fonction', 'Établissement', 'Année formation',
      // Formation
      'Nom de la formation', 'Centre de formation', 'Formateurs', 'Date début (AAAA-MM-JJ)', 'Date fin (AAAA-MM-JJ)', 'Objectifs', 'Modules', 'Résultats attendus',
      // Contenu et pédagogie (0-5)
      'Acquisition compétences (0-5)', 'Développement personnel (0-5)', 'Clarté du cours (0-5)', 'Théorie/Pratique (0-5)', 'Adéquation syllabus/besoins (0-5)', 'Cas pratiques (0-5)', 'Objectifs atteints (0-5)', 'Connaissances adaptées (0-5)',
      // Méthodes et supports (0-5)
      'Support pédagogique (0-5)', 'Techniques utilisées (0-5)', 'Présentation (0-5)',
      // Organisation et logistique (0-5)
      'Conditions logistiques (0-5)', 'Rythme (0-5)', 'Ponctualité (0-5)', 'Ponctualité & Assiduité (0-5)',
      // Évaluation Objectifs (0-5) + commentaires
      'Objectifs atteints (éval) (0-5)', 'Commentaire objectifs', 'Pertinence au poste (0-5)', 'Commentaire pertinence', 'Attentes satisfaites (0-5)', 'Commentaire attentes', 'Développement compétences (0-5)', 'Commentaire compétences',
      // Comportement et collaboration (0-5)
      'Travail en équipe (0-5)', 'Motivation/Enthousiasme (0-5)', 'Communication – sociable (0-5)', 'Communication (générale) (0-5)', 'Aptitude à changer les idées (0-5)', 'Curiosité (0-5)', 'Esprit d’initiative (0-5)', 'Sens de responsabilité (0-5)',
      // Cognitif (0-5)
      'Analyse critique (0-5)', 'Exécution du travail (0-5)', 'Compréhension directives (0-5)', 'Qualité du travail (0-5)', 'Maîtrise du sujet (0-5)',
      // Impact formation — cases à cocher (Oui/Non)
      'Changement: Compétences techniques', 'Changement: Communication équipe', 'Changement: Productivité', 'Changement: Leadership', 'Changement: Innovation', 'Changement: Gestion du temps',
      // Impact formation — champs libres
      'Suggestions amélioration', 'Actions post-formation', 'Satisfaction actions',
      // Recommandation
      'Recommandation (0-5)',
      // Besoins futurs
      'Besoin de formation supplémentaire (Oui/Non)', 'Détails besoin supplémentaire', 'Formation souhaitée 1', 'Formation souhaitée 2', 'Formation souhaitée 3', "Si 'Non', raison",
      // Justification globale
      'Justifications / Observations'
    ];
    ws.addRow(headers);

    // Styles en-têtes
    const headerRow = ws.getRow(2);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0011EF' } } as ExcelJS.FillPattern;
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 30;

    // Marquer les champs obligatoires (fond bleu plus soutenu + note)
    const requiredLabels = [
      'Prénom','Nom','Email','Poste/Fonction','Nom de la formation','Date début (AAAA-MM-JJ)','Date fin (AAAA-MM-JJ)'
    ];
    requiredLabels.forEach(label => {
      const idx = headers.indexOf(label) + 1;
      if (idx > 0) {
        const cell = headerRow.getCell(idx);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } } as ExcelJS.FillPattern;
        (cell as any).note = 'Champ obligatoire';
      }
    });

    // Colonnes
    ws.columns = [
      { width: 16 }, { width: 16 }, { width: 26 }, { width: 16 }, { width: 22 }, { width: 22 }, { width: 14 }, { width: 16 },
      { width: 28 }, { width: 24 }, { width: 24 }, { width: 18 }, { width: 18 },
      { width: 14 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 16 },
      { width: 28 }, { width: 32 },
    ];

    // Figer le haut + filtre
    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];
    ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: headers.length } };

    // Exemple (ligne 3)
    const example = [
      // Base
      'MAT001', 'Jean', 'Dupont', 'Homme', '0123456789', 'jean.dupont@email.com', 'Technicien', 'CFPT Ivato', '2024',
      // Formation
      'Excel Avancé', 'Centre A', 'Mme. Rakoto', '2024-03-10', '2024-03-12', 'Découvrir fonctions avancées', 'Fonctions, Tableaux croisés', 'Gagner en efficacité',
      // Contenu & pédagogie
      4, 5, 4, 3, 4, 4, 4, 4,
      // Méthodes
      4, 4, 4,
      // Organisation
      4, 3, 5, 5,
      // Évaluation objectifs + commentaires
      4, 'Objectifs globalement atteints', 4, 'Pertinent pour le poste', 4, 'Attentes satisfaites', 4, 'Compétences renforcées',
      // Comportement
      4, 5, 4, 4, 4, 4, 4, 4,
      // Cognitif
      4, 4, 4, 4, 4,
      // Impact (cases)
      'Oui', 'Oui', 'Oui', 'Non', 'Non', 'Oui',
      // Impact (libre)
      'Prévoir mentorat', 'Appliquer au quotidien', 'Satisfait',
      // Recommandation
      4,
      // Besoins futurs
      'Oui', 'Approfondir PowerQuery', 'Leadership', 'Gestion de projet', 'Communication', '',
      // Justification
      'Formation très utile au quotidien.'
    ];
    ws.addRow(example);
    ws.getRow(3).font = { color: { argb: '374151' } };

    // Alignements
    ws.columns.forEach((col, idx) => {
      const column = ws.getColumn(idx + 1);
      column.alignment = { vertical: 'middle', wrapText: idx >= 18 };
    });

    // Validations
    const rowFrom = 3; // à partir de la ligne d'exemple
    const rowTo = 1000; // plage large

    // Helper: trouver l'index de colonne par en-tête
    const colIndex = (label: string) => headers.indexOf(label) + 1;
    const toCol = (n: number) => {
      let s = '';
      while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
      return s;
    };

    // Genre
    ws.dataValidations.add(`${toCol(colIndex('Genre'))}${rowFrom}:${toCol(colIndex('Genre'))}${rowTo}`, {
      type: 'list', allowBlank: true,
      formulae: [`=Référentiels!$A$2:$A$${genres.length + 1}`]
    });

    // Poste
    ws.dataValidations.add(`${toCol(colIndex('Poste/Fonction'))}${rowFrom}:${toCol(colIndex('Poste/Fonction'))}${rowTo}`, {
      type: 'list', allowBlank: true,
      formulae: [`=Référentiels!$B$2:$B$${postes.length + 1}`]
    });

    // Année formation
    ws.dataValidations.add(`${toCol(colIndex('Année formation'))}${rowFrom}:${toCol(colIndex('Année formation'))}${rowTo}`, {
      type: 'whole', operator: 'between', allowBlank: true,
      formulae: [1900, 2100],
      showErrorMessage: true, error: 'Entrez une année entre 1900 et 2100'
    });

    // FormationTheme liste
    ws.dataValidations.add(`${toCol(colIndex('Nom de la formation'))}${rowFrom}:${toCol(colIndex('Nom de la formation'))}${rowTo}`, {
      type: 'list', allowBlank: true,
      formulae: [`=Référentiels!$D$2:$D$${themesList.length + 1}`]
    });

    // Dates
    ws.getColumn(colIndex('Date début (AAAA-MM-JJ)')).numFmt = 'yyyy-mm-dd';
    ws.getColumn(colIndex('Date fin (AAAA-MM-JJ)')).numFmt = 'yyyy-mm-dd';
    ws.dataValidations.add(`${toCol(colIndex('Date début (AAAA-MM-JJ)'))}${rowFrom}:${toCol(colIndex('Date début (AAAA-MM-JJ)'))}${rowTo}`, { type: 'date', allowBlank: true });
    ws.dataValidations.add(`${toCol(colIndex('Date fin (AAAA-MM-JJ)'))}${rowFrom}:${toCol(colIndex('Date fin (AAAA-MM-JJ)'))}${rowTo}`, { type: 'date', allowBlank: true });

    // Notes (nombreuses colonnes) — toutes entre 0 et 5
    const noteLabels = headers.filter(h => h.includes('(0-5)'));
    noteLabels.forEach(label => {
      const col = colIndex(label);
      ws.dataValidations.add(`${toCol(col)}${rowFrom}:${toCol(col)}${rowTo}`, {
        type: 'decimal', operator: 'between', allowBlank: true, formulae: [0, 5], showErrorMessage: true,
        error: 'La note doit être entre 0 et 5'
      });
    });

    // Cases à cocher (Oui/Non)
    ['Changement: Compétences techniques', 'Changement: Communication équipe', 'Changement: Productivité', 'Changement: Leadership', 'Changement: Innovation', 'Changement: Gestion du temps', 'Besoin de formation supplémentaire (Oui/Non)']
      .forEach(label => {
        const c = colIndex(label);
        if (c > 0) {
          ws.dataValidations.add(`${toCol(c)}${rowFrom}:${toCol(c)}${rowTo}`, {
            type: 'list', allowBlank: true, formulae: ['"Oui,Non"']
          });
        }
      });

    // Bordures légères des en-têtes
    for (let c = 1; c <= headers.length; c++) {
      const cell = ws.getCell(2, c);
      cell.border = {
        top: { style: 'thin', color: { argb: 'E5E7EB' } },
        left: { style: 'thin', color: { argb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
        right: { style: 'thin', color: { argb: 'E5E7EB' } },
      };
    }

    // Téléchargement
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Modele_Evaluations_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Parse un fichier Excel et retourne les données d'évaluation simplifiées
   */
  static async parseExcelFile(file: File): Promise<Partial<SimpleEvaluationData>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Lire la première feuille
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          
          // Convertir en JSON
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          
          if (jsonData.length < 2) {
            throw new Error('Le fichier Excel doit contenir au moins une ligne de données');
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          // Mapping simplifié des en-têtes
          const headerMap = new Map<string, string>();
          Object.entries(SIMPLE_HEADERS).forEach(([key, header]) => {
            const foundIndex = headers.findIndex(h => h && h.trim() === header.trim());
            if (foundIndex !== -1) {
              headerMap.set(header, key);
            }
          });

          // Parser les données
          const evaluations: Partial<SimpleEvaluationData>[] = [];
          
          for (const row of rows) {
            // Ignorer les lignes vides ou d'instructions
            if (!row || row.length === 0 || 
                (row[0] && row[0].toString().includes('INSTRUCTIONS'))) {
              continue;
            }

            const evaluation: any = {};
            let hasRequiredData = false;

            headers.forEach((header, index) => {
              if (header && headerMap.has(header) && row[index] !== undefined && row[index] !== '') {
                const fieldKey = headerMap.get(header)!;
                let value = row[index];

                // Traitement selon le type de champ
                if (['globalSatisfaction', 'contentQuality', 'trainerQuality', 'organizationQuality', 'recommendToColleague'].includes(fieldKey)) {
                  // Convertir en nombre pour les notes (0-5)
                  const numValue = parseFloat(value.toString());
                  evaluation[fieldKey] = isNaN(numValue) ? 0 : Math.max(0, Math.min(5, numValue));
                } else {
                  evaluation[fieldKey] = value.toString().trim();
                }
                
                // Vérifier si on a les données essentielles
                if (['firstName', 'lastName', 'email', 'formationTheme'].includes(fieldKey)) {
                  hasRequiredData = true;
                }
              }
            });

            if (hasRequiredData) {
              evaluations.push(evaluation);
            }
          }

          if (evaluations.length === 0) {
            throw new Error('Aucune donnée d\'évaluation valide trouvée dans le fichier');
          }

          resolve(evaluations);
        } catch (error) {
          reject(new Error(`Erreur lors de la lecture du fichier Excel: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Valide les données d'évaluation importées (version simplifiée)
   */
  static validateEvaluationData(data: Partial<SimpleEvaluationData>): string[] {
    const errors: string[] = [];

    // Champs obligatoires
    if (!data.firstName?.trim()) errors.push('Le prénom est obligatoire');
    if (!data.lastName?.trim()) errors.push('Le nom est obligatoire');
    if (!data.email?.trim()) errors.push('L\'email est obligatoire');
    if (!data.formationTheme?.trim()) errors.push('Le nom de la formation est obligatoire');

    // Validation email
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Format email invalide');
    }

    // Validation des notes (doivent être entre 0 et 5)
    const noteFields = ['globalSatisfaction', 'contentQuality', 'trainerQuality', 'organizationQuality', 'recommendToColleague'];
    noteFields.forEach(field => {
      const value = data[field as keyof SimpleEvaluationData] as number;
      if (value !== undefined && (value < 0 || value > 5)) {
        errors.push(`La note pour "${SIMPLE_HEADERS[field as keyof SimpleEvaluationData]}" doit être entre 0 et 5`);
      }
    });

    return errors;
  }

  /**
   * Convertit les données Excel simplifiées vers le format de l'application
   */
  static convertToAppFormat(excelData: Partial<SimpleEvaluationData>): any {
    return {
      // Informations de base
      firstName: excelData.firstName?.trim() || '',
      lastName: excelData.lastName?.trim() || '',
      email: excelData.email?.trim().toLowerCase() || '',
      phone: excelData.phone?.trim() || '',
      position: excelData.position?.trim() || '',
      
      // Formation
      formationTheme: excelData.formationTheme?.trim() || '',
      startDate: excelData.startDate || '',
      endDate: excelData.endDate || '',
      
      // Notes (déjà validées)
      globalSatisfaction: excelData.globalSatisfaction || 0,
      contentQuality: excelData.contentQuality || 0,
      trainerQuality: excelData.trainerQuality || 0,
      organizationQuality: excelData.organizationQuality || 0,
      recommendToColleague: excelData.recommendToColleague || 0,
      
      // Champs optionnels
      additionalTrainingNeeds: excelData.additionalTrainingNeeds?.trim() || '',
      generalComments: excelData.generalComments?.trim() || ''
    };
  }
}