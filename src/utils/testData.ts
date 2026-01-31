/**
 * 🧪 Données de Test pour l'Application
 * Script pour peupler l'application avec des données réalistes 
 * afin de tester toutes les fonctionnalités IA
 */

import { DatabaseService } from '../services/database';

// Données de test réalistes
const TEST_STAFF = [
  {
    matricule: 'EMP001',
    firstName: 'Marie',
    lastName: 'Martin',
    position: 'Manager Commercial',
    email: 'marie.martin@entreprise.com',
    phone: '06.12.34.56.78',
    establishment: 'Siège Social Paris',
    formationYear: '2024',
    department: 'Commercial',
    gender: 'Femme',
    age: 32,
    hireDate: '2022-01-15'
  },
  {
    matricule: 'EMP002',
    firstName: 'Pierre',
    lastName: 'Dubois',
    position: 'Développeur Senior',
    email: 'pierre.dubois@entreprise.com',
    phone: '06.23.45.67.89',
    establishment: 'Centre R&D Lyon',
    formationYear: '2024',
    department: 'IT',
    gender: 'Homme',
    age: 28,
    hireDate: '2021-09-10'
  },
  {
    matricule: 'EMP003',
    firstName: 'Sophie',
    lastName: 'Leblanc',
    position: 'RH Responsable',
    email: 'sophie.leblanc@entreprise.com',
    phone: '06.34.56.78.90',
    establishment: 'Siège Social Paris',
    formationYear: '2024',
    department: 'RH',
    gender: 'Femme',
    age: 35,
    hireDate: '2020-03-22'
  },
  {
    matricule: 'EMP004',
    firstName: 'Thomas',
    lastName: 'Rousseau',
    position: 'Technicien Support',
    email: 'thomas.rousseau@entreprise.com',
    phone: '06.45.67.89.01',
    establishment: 'Agence Marseille',
    formationYear: '2024',
    department: 'Support',
    gender: 'Homme',
    age: 26,
    hireDate: '2023-06-01'
  },
  {
    matricule: 'EMP005',
    firstName: 'Julie',
    lastName: 'Moreau',
    position: 'Analyste Financier',
    email: 'julie.moreau@entreprise.com',
    phone: '06.56.78.90.12',
    establishment: 'Siège Social Paris',
    formationYear: '2024',
    department: 'Finance',
    gender: 'Femme',
    age: 29,
    hireDate: '2022-11-08'
  },
  {
    matricule: 'EMP006',
    firstName: 'Nicolas',
    lastName: 'Garcia',
    position: 'Chef de Projet',
    email: 'nicolas.garcia@entreprise.com',
    phone: '06.67.89.01.23',
    establishment: 'Centre R&D Lyon',
    formationYear: '2024',
    department: 'Projets',
    gender: 'Homme',
    age: 31,
    hireDate: '2021-05-14'
  }
];

// Fonction pour générer des évaluations réalistes avec des patterns intéressants pour l'IA
const generateEvaluations = (staffList: any[]) => {
  const themes = ['Leadership Management', 'Communication Efficace', 'Gestion de Projet', 'Innovation & Créativité'];
  const evaluations = [];

  staffList.forEach(person => {
    // Créer plusieurs évaluations par personne pour avoir un historique
    const numEvaluations = Math.floor(Math.random() * 4) + 2; // 2 à 5 évaluations par personne
    
    for (let i = 0; i < numEvaluations; i++) {
      const theme = themes[Math.floor(Math.random() * themes.length)];
      
      // Créer des patterns différents selon la personne pour tester l'IA
      let baseScore = 3; // Score de base
      let trend = 0; // Tendance d'évolution
      
      // Marie Martin - Excellente, stable
      if (person.firstName === 'Marie') {
        baseScore = 4.2;
        trend = 0.1;
      }
      // Pierre Dubois - Bon mais en légère baisse
      else if (person.firstName === 'Pierre') {
        baseScore = 3.8;
        trend = -0.1;
      }
      // Sophie Leblanc - Moyenne mais en forte amélioration
      else if (person.firstName === 'Sophie') {
        baseScore = 2.9;
        trend = 0.3;
      }
      // Thomas Rousseau - Faible, besoin d'aide
      else if (person.firstName === 'Thomas') {
        baseScore = 2.3;
        trend = -0.05;
      }
      // Julie Moreau - Très bonne, en amélioration
      else if (person.firstName === 'Julie') {
        baseScore = 4.0;
        trend = 0.2;
      }
      // Nicolas Garcia - Variable, parfois bon parfois moyen
      else if (person.firstName === 'Nicolas') {
        baseScore = 3.2;
        trend = Math.random() > 0.5 ? 0.3 : -0.2; // Volatil
      }

      // Appliquer la tendance selon l'ordre de l'évaluation
      const finalScore = Math.max(1, Math.min(5, baseScore + (trend * i)));
      
      // Générer les scores individuels autour du score final
      const variance = 0.3;
      const generateScore = () => {
        return Math.max(1, Math.min(5, finalScore + (Math.random() - 0.5) * variance));
      };

      const evaluation = {
        firstName: person.firstName,
        lastName: person.lastName,
        staffId: person.id,
        formationTheme: theme,
        fillDate: new Date(Date.now() - (numEvaluations - i) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Espacement mensuel
        
        // Contenu et Pédagogie
        skillsAcquisition: Math.round(generateScore()),
        personalDevelopment: Math.round(generateScore()),
        courseClarity: Math.round(generateScore()),
        theoryPractice: Math.round(generateScore()),
        syllabusAdequacy: Math.round(generateScore()),
        practicalCases: Math.round(generateScore()),
        objectivesAchieved: Math.round(generateScore()),
        adaptedKnowledge: Math.round(generateScore()),
        
        // Méthodes et Supports
        pedagogicalSupport: Math.round(generateScore()),
        techniquesUsed: Math.round(generateScore()),
        presentation: Math.round(generateScore()),
        
        // Organisation et Logistique
        logisticsConditions: Math.round(generateScore()),
        rhythm: Math.round(generateScore()),
        punctuality: Math.round(generateScore()),
        punctualityAssiduity: Math.round(generateScore()),
        
        // Comportement et Collaboration
        teamworkSense: Math.round(generateScore()),
        motivationEnthusiasm: Math.round(generateScore()),
        communicationSociable: Math.round(generateScore()),
        communicationGeneral: Math.round(generateScore()),
        aptitudeChangeIdeas: Math.round(generateScore()),
        curiosity: Math.round(generateScore()),
        initiativeSpirit: Math.round(generateScore()),
        responsibilitySense: Math.round(generateScore()),
        
        // Compétences Cognitives
        criticalAnalysis: Math.round(generateScore()),
        workExecution: Math.round(generateScore()),
        directivesComprehension: Math.round(generateScore()),
        workQuality: Math.round(generateScore()),
        subjectMastery: Math.round(generateScore()),
        
        // Recommandation
        recommendationScore: Math.round(finalScore),
        
        // Commentaires selon le niveau
        justifications: finalScore >= 4 ? 
          'Excellent travail, continue comme ça !' :
          finalScore >= 3 ? 
          'Bon niveau, quelques améliorations possibles.' :
          'Besoin d\'accompagnement et de formation supplémentaire.',

        department: person.department,
        gender: person.gender,
        age: person.age,
        hireDate: person.hireDate
      };

      evaluations.push(evaluation);
    }
  });

  return evaluations;
};

/**
 * 🚀 Fonction pour peupler l'application avec des données de test
 */
export const loadTestData = async () => {
  console.log('🧪 Chargement des données de test...');

  try {
    // 1. Charger le personnel
    console.log('👥 Ajout du personnel de test...');
    for (const member of TEST_STAFF) {
      try {
        await DatabaseService.createStaff(member);
        console.log(`✅ Ajouté: ${member.firstName} ${member.lastName}`);
      } catch (error) {
        console.warn(`⚠️ Membre déjà existant: ${member.firstName} ${member.lastName}`);
      }
    }

    // 2. Récupérer la liste du personnel pour avoir les IDs
    const staffList = await DatabaseService.getStaff();
    console.log(`📋 Personnel récupéré: ${staffList.length} membres`);

    // 3. Générer et charger les évaluations
    console.log('📊 Génération des évaluations de test...');
    const evaluations = generateEvaluations(staffList);
    
    for (const evaluation of evaluations) {
      try {
        await DatabaseService.createEvaluation(evaluation);
      } catch (error) {
        console.warn('⚠️ Évaluation déjà existante ou erreur:', error.message);
      }
    }

    console.log(`✅ Données de test chargées avec succès !`);
    console.log(`👥 ${staffList.length} employés`);
    console.log(`📊 ${evaluations.length} évaluations`);
    console.log(`🧠 L'IA va maintenant pouvoir analyser ces données !`);

    // Forcer la synchronisation
    DatabaseService.forceSyncAll();

    return {
      staff: staffList.length,
      evaluations: evaluations.length,
      success: true
    };

  } catch (error) {
    console.error('❌ Erreur lors du chargement des données de test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 🧹 Fonction pour nettoyer les données de test
 */
export const clearTestData = async () => {
  console.log('🧹 Suppression des données de test...');
  
  try {
    // Vider le localStorage
    localStorage.removeItem('staff');
    localStorage.removeItem('evaluations');
    localStorage.removeItem('themes');
    
    console.log('✅ Données de test supprimées');
    
    // Forcer la synchronisation
    DatabaseService.forceSyncAll();
    
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    return { success: false, error: error.message };
  }
};

// Export pour utilisation dans la console du navigateur
if (typeof window !== 'undefined') {
  (window as any).loadTestData = loadTestData;
  (window as any).clearTestData = clearTestData;
}