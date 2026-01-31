export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin';
  createdAt: string;
}

export interface Staff {
  id: string;
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

export interface Formation {
  id: string;
  theme: string;
  startDate: string;
  endDate: string;
  objectives: string;
  modules: string;
  expectedResults: string;
  createdAt: string;
}

export interface Evaluation {
  id: string;
  staffId: string;
  fillDate: string;
  firstName: string;
  lastName: string;
  gender: 'Homme' | 'Femme' | string;
  phone: string;
  email: string;
  position: string;
  establishment: string;
  formationTheme: string;
  trainingCenter?: string;
  trainers?: string;
  startDate: string;
  endDate: string;
  objectives: string;
  modules: string;
  expectedResults: string;
  
  // Statut et typage
  status?: 'draft' | 'incomplete' | 'completed';
  evaluationType?: 'initial' | 'followUp';
  initialEvaluationId?: string | null;
  completedAt?: string | null;
  updatedAt?: string;
  
  // 🎯 Contenu et pédagogie (0-5) — Évaluation initiale
  skillsAcquisition: number;
  personalDevelopment: number;
  courseClarity: number;
  theoryPractice: number;
  syllabusAdequacy: number;
  practicalCases: number;
  objectivesAchieved: number;
  adaptedKnowledge: number;
  
  // 📚 Méthodes et supports (0-5) — Évaluation initiale
  pedagogicalSupport: number;
  techniquesUsed: number;
  presentation: number;
  
  // 🕐 Organisation et logistique (0-5) — Évaluation initiale
  logisticsConditions: number;
  rhythm: number;
  punctuality: number;
  punctualityAssiduity: number;
  
  // 👥 Comportement et collaboration (0-5) — Évaluation initiale
  teamworkSense: number;
  motivationEnthusiasm: number;
  communicationSociable: number;
  communicationGeneral: number;
  aptitudeChangeIdeas: number;
  curiosity: number;
  initiativeSpirit: number;
  responsibilitySense: number;
  
  // 🧠 Compétences cognitives et productivité (0-5) — Évaluation initiale
  criticalAnalysis: number;
  workExecution: number;
  directivesComprehension: number;
  workQuality: number;
  subjectMastery: number;
  
  // Impact de la formation — Évaluation initiale
  observedChanges: string[];
  improvementSuggestions: string;
  postFormationActions: string;
  actionsSatisfaction: string;
  recommendationScore: number;
  
  // Besoins futurs — Évaluation initiale
  needsAdditionalTraining: boolean | string;
  additionalTrainingDetails?: string;
  requestedTrainings?: string[];
  noAdditionalTrainingReason?: string;
  
  // ✅ Justification et observations — Évaluation initiale
  justificationObservations: string;

  // === Champs spécifiques Suivi 6 mois ===
  fu_behaviorGeneral?: number; fu_behaviorGeneralComment?: string;
  fu_teamIntegration?: number; fu_teamIntegrationComment?: string;
  fu_motivationTenacity?: number; fu_motivationTenacityComment?: string;
  fu_communication?: number; fu_communicationComment?: string;
  fu_curiosity?: number; fu_curiosityComment?: string;
  fu_initiativeCreativity?: number; fu_initiativeCreativityComment?: string;
  fu_adaptedKnowledge?: number; fu_adaptedKnowledgeComment?: string;
  fu_criticalAnalysis?: number; fu_criticalAnalysisComment?: string;
  fu_technicalMastery?: number; fu_technicalMasteryComment?: string;
  fu_hierarchyRespect?: number; fu_hierarchyRespectComment?: string;
  fu_workQuality?: number; fu_workQualityComment?: string;
  fu_efficiency?: number; fu_efficiencyComment?: string;
  fu_productivity?: number; fu_productivityComment?: string;
  fu_valuesRespect?: number; fu_valuesRespectComment?: string;
  fu_commitment?: number; fu_commitmentComment?: string;
  fu_total60?: number;
  fu_appreciationCode?: 1|2|3|4|5;
  fu_appreciationLabel?: string;
  fu_conclusionStaff?: string;
  fu_conclusionDirector?: string;
  fu_date?: string; // date effective du suivi
  
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  updateProfile?: (profileData: { firstName: string; lastName: string; email: string }) => void;
}

export interface FormationTheme {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}