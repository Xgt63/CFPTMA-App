-- =====================================================
-- 📊 ANALYSIS COMPLETE DE LA BASE DE DONNEES
-- Système de gestion des évaluations CFPT
-- =====================================================

-- ==================== SCHEMA COMPLET ====================

-- TABLE 1: USERS (Authentification)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,                    -- ⚠️ PROBLÈME: En clair
  role TEXT DEFAULT 'admin',                 -- admin, user, evaluator
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 2: STAFF (Employés/Personnel)
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matricule TEXT UNIQUE,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  position TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  establishment TEXT,
  formationYear TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 3: THEMES (Formations)
CREATE TABLE IF NOT EXISTS themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 4: APP_CONFIG (Configuration unique)
CREATE TABLE IF NOT EXISTS app_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  usePrinter BOOLEAN DEFAULT 0,
  invoiceDisplay TEXT DEFAULT 'screen',      -- screen|printer
  userMode TEXT DEFAULT 'single',            -- single|multi
  multiRegister BOOLEAN DEFAULT 0,
  auditLogging BOOLEAN DEFAULT 1,
  setupCompleted BOOLEAN DEFAULT 0,
  companyName TEXT DEFAULT 'CFPT Ivato',
  companyAddress TEXT,
  companyPhone TEXT,
  companyEmail TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 5: AUDIT_LOGS (Logs d'audit - traçabilité)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,                            -- Qui a fait l'action
  userName TEXT,
  action TEXT NOT NULL,                      -- CREATE|UPDATE|DELETE
  tableName TEXT,                            -- Quelle table
  recordId INTEGER,                          -- ID de la ligne
  oldValue TEXT,                             -- Ancienne valeur (JSON)
  newValue TEXT,                             -- Nouvelle valeur (JSON)
  ipAddress TEXT,
  userAgent TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- TABLE 6: EVALUATIONS (Évaluations - Très complexe: 143 colonnes!)
CREATE TABLE IF NOT EXISTS evaluations (
  -- Identifiants et références
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staffId INTEGER,                           -- Référence au personnel
  firstName TEXT,
  lastName TEXT,
  
  -- Informations personnelles
  gender TEXT,
  phone TEXT,
  email TEXT,
  position TEXT,
  establishment TEXT,
  
  -- Informations de formation
  fillDate TEXT,
  formationTheme TEXT,
  trainingCenter TEXT,
  trainers TEXT,
  startDate TEXT,
  endDate TEXT,
  objectives TEXT,
  modules TEXT,
  expectedResults TEXT,
  
  -- Statut d'évaluation
  status TEXT DEFAULT 'completed',           -- completed|pending
  evaluationType TEXT DEFAULT 'initial',     -- initial|followup
  initialEvaluationId INTEGER,
  completedAt TEXT,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- ===== CONTENU ET PÉDAGOGIE (8) =====
  skillsAcquisition INTEGER,                 -- Acquisition de compétences (1-5)
  personalDevelopment INTEGER,               -- Développement personnel
  courseClarity INTEGER,                     -- Clarté du cours
  theoryPractice INTEGER,                    -- Équilibre théorie/pratique
  syllabusAdequacy INTEGER,                  -- Adéquation du programme
  practicalCases INTEGER,                    -- Cas pratiques
  objectivesAchieved INTEGER,                -- Objectifs atteints
  adaptedKnowledge INTEGER,                  -- Connaissances adaptées
  
  -- ===== MÉTHODES ET SUPPORTS (3) =====
  pedagogicalSupport INTEGER,                -- Support pédagogique
  techniquesUsed INTEGER,                    -- Techniques utilisées
  presentation INTEGER,                     -- Présentation
  
  -- ===== ORGANISATION ET LOGISTIQUE (4) =====
  logisticsConditions INTEGER,               -- Conditions logistiques
  rhythm INTEGER,                            -- Rythme
  punctuality INTEGER,                       -- Ponctualité
  punctualityAssiduity INTEGER,              -- Assiduité
  
  -- ===== COMPORTEMENT ET COLLABORATION (8) =====
  teamworkSense INTEGER,                     -- Esprit d'équipe
  motivationEnthusiasm INTEGER,              -- Motivation
  communicationSociable INTEGER,             -- Communication sociable
  communicationGeneral INTEGER,              -- Communication générale
  aptitudeChangeIdeas INTEGER,               -- Aptitude au changement
  curiosity INTEGER,                         -- Curiosité
  initiativeSpirit INTEGER,                  -- Esprit d'initiative
  responsibilitySense INTEGER,               -- Sens des responsabilités
  
  -- ===== COMPÉTENCES COGNITIVES (5) =====
  criticalAnalysis INTEGER,                  -- Analyse critique
  workExecution INTEGER,                     -- Exécution du travail
  directivesComprehension INTEGER,           -- Compréhension directives
  workQuality INTEGER,                       -- Qualité du travail
  subjectMastery INTEGER,                    -- Maîtrise du sujet
  
  -- ===== OBSERVATIONS ET RECOMMANDATIONS (10) =====
  observedChanges TEXT,                      -- JSON: changements observés
  improvementSuggestions TEXT,               -- Suggestions
  postFormationActions TEXT,                 -- Actions post-formation
  actionsSatisfaction TEXT,                  -- Satisfaction
  recommendationScore INTEGER,               -- Score de recommandation
  needsAdditionalTraining TEXT,              -- Besoin formation supplémentaire
  additionalTrainingDetails TEXT,            -- Détails
  requestedTrainings TEXT,                   -- JSON: formations demandées
  noAdditionalTrainingReason TEXT,           -- Raison (pas de formation)
  justificationObservations TEXT,            -- Observations justificatives
  
  -- ===== SUIVI 6 MOIS (28) - Champs 'fu_' =====
  fu_behaviorGeneral INTEGER,                -- Score général comportement
  fu_behaviorGeneralComment TEXT,
  fu_teamIntegration INTEGER,
  fu_teamIntegrationComment TEXT,
  fu_motivationTenacity INTEGER,
  fu_motivationTenacityComment TEXT,
  fu_communication INTEGER,
  fu_communicationComment TEXT,
  fu_curiosity INTEGER,
  fu_curiosityComment TEXT,
  fu_initiativeCreativity INTEGER,
  fu_initiativeCreativityComment TEXT,
  fu_adaptedKnowledge INTEGER,
  fu_adaptedKnowledgeComment TEXT,
  fu_criticalAnalysis INTEGER,
  fu_criticalAnalysisComment TEXT,
  fu_technicalMastery INTEGER,
  fu_technicalMasteryComment TEXT,
  fu_hierarchyRespect INTEGER,
  fu_hierarchyRespectComment TEXT,
  fu_workQuality INTEGER,
  fu_workQualityComment TEXT,
  fu_efficiency INTEGER,
  fu_efficiencyComment TEXT,
  fu_productivity INTEGER,
  fu_productivityComment TEXT,
  fu_valuesRespect INTEGER,
  fu_valuesRespectComment TEXT,
  fu_commitment INTEGER,
  fu_commitmentComment TEXT,
  fu_total60 INTEGER,                        -- Total sur 60
  fu_appreciationCode INTEGER,               -- Code appréciation
  fu_appreciationLabel TEXT,                 -- Label appréciation
  fu_conclusionStaff TEXT,                   -- Conclusion personnel
  fu_conclusionDirector TEXT,                -- Conclusion directeur
  fu_date TEXT,                              -- Date du suivi
  
  -- Métadonnées
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staffId) REFERENCES staff(id) ON DELETE CASCADE
);

-- ==================== INDEXES RECOMMANDÉS ====================

-- Performance pour les recherches fréquentes
CREATE INDEX idx_staff_matricule ON staff(matricule);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_evaluations_staffId ON evaluations(staffId);
CREATE INDEX idx_evaluations_status ON evaluations(status);
CREATE INDEX idx_evaluations_date ON evaluations(createdAt DESC);
CREATE INDEX idx_audit_logs_userId ON audit_logs(userId);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_users_email ON users(email);

-- ==================== PRAGMAS D'OPTIMISATION ====================

PRAGMA journal_mode = WAL;                   -- Write-Ahead Logging (performance)
PRAGMA synchronous = NORMAL;                -- Sync équilibrée
PRAGMA cache_size = 10000;                  -- Cache: ~40MB
PRAGMA foreign_keys = ON;                   -- Intégrité référentielle
PRAGMA temp_store = MEMORY;                 -- Tables temp en mémoire

-- ==================== DONNÉES PAR DÉFAUT ====================

-- Utilisateur admin par défaut
INSERT OR IGNORE INTO users (firstName, lastName, email, password, role) 
VALUES ('Admin', 'CFPT', 'admin@cfpt-ivato.mg', 'admin123', 'admin');

-- Configuration par défaut
INSERT OR IGNORE INTO app_config (id, companyName) 
VALUES (1, 'CFPT Ivato');

-- Thèmes de formation par défaut
INSERT OR IGNORE INTO themes (name, description) VALUES 
('Leadership Management', 'Formation sur les techniques de leadership et de management'),
('Communication Efficace', 'Améliorer ses compétences en communication'),
('Gestion de Projet', 'Méthodologies et outils pour la gestion de projets'),
('Innovation & Créativité', 'Développer l\'innovation et la créativité en entreprise');

-- ==================== STATISTIQUES ====================

-- Nombre d'utilisateurs
SELECT COUNT(*) as total_users FROM users;

-- Nombre de personnel
SELECT COUNT(*) as total_staff FROM staff;

-- Nombre de thèmes
SELECT COUNT(*) as total_themes FROM themes;

-- Nombre d'évaluations
SELECT COUNT(*) as total_evaluations FROM evaluations;

-- Nombre de logs d'audit (90 derniers jours)
SELECT COUNT(*) as recent_audit_logs 
FROM audit_logs 
WHERE timestamp >= datetime('now', '-90 days');

-- ==================== REQUÊTES COMMUNES ====================

-- Évaluation par personnel
SELECT 
  s.firstName,
  s.lastName,
  s.position,
  COUNT(e.id) as eval_count,
  MAX(e.createdAt) as last_evaluation
FROM staff s
LEFT JOIN evaluations e ON s.id = e.staffId
GROUP BY s.id
ORDER BY last_evaluation DESC;

-- Score moyen par personne
SELECT 
  s.firstName,
  s.lastName,
  ROUND(AVG(
    (e.skillsAcquisition + e.personalDevelopment + e.courseClarity + 
     e.theoryPractice + e.syllabusAdequacy + e.practicalCases + 
     e.objectivesAchieved + e.adaptedKnowledge) / 8.0
  ), 2) as avg_pedagogic_score,
  COUNT(e.id) as total_evaluations
FROM staff s
LEFT JOIN evaluations e ON s.id = e.staffId AND e.status = 'completed'
GROUP BY s.id;

-- Audit trail pour un utilisateur
SELECT 
  timestamp,
  action,
  tableName,
  recordId,
  oldValue,
  newValue
FROM audit_logs
WHERE userName = 'Admin'
ORDER BY timestamp DESC
LIMIT 20;

-- Formations demandées (non traitées)
SELECT 
  s.firstName,
  s.lastName,
  e.requestedTrainings,
  e.completedAt
FROM staff s
JOIN evaluations e ON s.id = e.staffId
WHERE e.requestedTrainings IS NOT NULL 
AND e.requestedTrainings != '[]'
AND e.status = 'completed'
ORDER BY e.completedAt DESC;

-- ==================== TAILLE DE LA BASE ====================

-- Taille estimée des tables (SQLite)
SELECT 
  'staff' as table_name, COUNT(*) as row_count FROM staff
UNION ALL
SELECT 'themes' as table_name, COUNT(*) FROM themes
UNION ALL
SELECT 'evaluations' as table_name, COUNT(*) FROM evaluations
UNION ALL
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'audit_logs' as table_name, COUNT(*) FROM audit_logs;

-- ==================== MIGRATION RECOMMANDÉE ====================
-- Normaliser la table evaluations (trop de colonnes)

-- Tables normalisées:

-- evaluation_base: Infos principales
CREATE TABLE IF NOT EXISTS evaluation_base (
  id INTEGER PRIMARY KEY,
  staffId INTEGER NOT NULL,
  formationTheme TEXT,
  status TEXT DEFAULT 'completed',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staffId) REFERENCES staff(id) ON DELETE CASCADE
);

-- evaluation_ratings: Notations (1-5)
CREATE TABLE IF NOT EXISTS evaluation_ratings (
  id INTEGER PRIMARY KEY,
  evaluationId INTEGER NOT NULL,
  category TEXT NOT NULL,          -- pedagogic|logistics|behavior|cognitive
  score INTEGER CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  FOREIGN KEY (evaluationId) REFERENCES evaluation_base(id) ON DELETE CASCADE
);

-- evaluation_followup: Suivi 6 mois
CREATE TABLE IF NOT EXISTS evaluation_followup (
  id INTEGER PRIMARY KEY,
  evaluationId INTEGER NOT NULL UNIQUE,
  followupDate TEXT,
  total60 INTEGER,
  appreciationCode INTEGER,
  concludedAt TEXT,
  FOREIGN KEY (evaluationId) REFERENCES evaluation_base(id) ON DELETE CASCADE
);

-- ==================== FIN DE L'ANALYSE ====================
