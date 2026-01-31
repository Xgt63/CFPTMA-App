const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const MemoryDatabaseService = require('./memory-database');

// Essayer de charger better-sqlite3, utiliser le fallback si échec
let Database = null;
try {
  Database = require('better-sqlite3');
  console.log('✅ better-sqlite3 chargé avec succès');
} catch (error) {
  console.warn('⚠️ better-sqlite3 non disponible:', error.message);
  console.log('🔄 Utilisation du mode mémoire comme fallback');
}

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.isInitialized = false;
    this.useMemoryFallback = !Database; // Si SQLite n'est pas disponible
    this.memoryDb = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      if (this.useMemoryFallback) {
        console.log('📝 Initialisation en mode mémoire (SQLite indisponible)');
        this.memoryDb = new MemoryDatabaseService();
        await this.memoryDb.initialize();
        this.isInitialized = true;
        console.log('✅ Base de données en mémoire initialisée');
        return;
      }

      // Mode SQLite normal
      const userDataPath = app.getPath('userData');
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }

      this.dbPath = path.join(userDataPath, 'evaluation_system.db');
      console.log('Initialisation de la base de données SQLite:', this.dbPath);

      this.db = new Database(this.dbPath, { 
        verbose: console.log,
        fileMustExist: false 
      });

      // Activer les clés étrangères et les optimisations
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 10000');
      this.db.pragma('foreign_keys = ON');

      await this.createTables();
      this.isInitialized = true;
      console.log('✅ Base de données SQLite initialisée avec succès');
    } catch (error) {
      console.error('❌ Erreur initialisation base de données:', error);
      // Basculer vers le mode mémoire en cas d'erreur
      console.log('🔄 Tentative de basculement vers le mode mémoire...');
      this.useMemoryFallback = true;
      this.memoryDb = new MemoryDatabaseService();
      await this.memoryDb.initialize();
      this.isInitialized = true;
      console.log('✅ Base de données en mémoire activée après erreur SQLite');
    }
  }

  async createTables() {
    const tables = [
      // Table des utilisateurs
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Table du personnel
      `CREATE TABLE IF NOT EXISTS staff (
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
      )`,

      // Table des thèmes de formation
      `CREATE TABLE IF NOT EXISTS themes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Table de configuration de l'application
      `CREATE TABLE IF NOT EXISTS app_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        usePrinter BOOLEAN DEFAULT 0,
        invoiceDisplay TEXT DEFAULT 'screen',
        userMode TEXT DEFAULT 'single',
        multiRegister BOOLEAN DEFAULT 0,
        auditLogging BOOLEAN DEFAULT 1,
        setupCompleted BOOLEAN DEFAULT 0,
        companyName TEXT DEFAULT 'CFPT Ivato',
        companyAddress TEXT,
        companyPhone TEXT,
        companyEmail TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Table de logs d'audit
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        userName TEXT,
        action TEXT NOT NULL,
        tableName TEXT,
        recordId INTEGER,
        oldValue TEXT,
        newValue TEXT,
        ipAddress TEXT,
        userAgent TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
      )`,

      // Table des évaluations - inclut TOUS les champs nécessaires
      `CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staffId INTEGER,
        firstName TEXT,
        lastName TEXT,
        gender TEXT,
        phone TEXT,
        email TEXT,
        position TEXT,
        establishment TEXT,
        fillDate TEXT,
        formationTheme TEXT,
        trainingCenter TEXT,
        trainers TEXT,
        startDate TEXT,
        endDate TEXT,
        objectives TEXT,
        modules TEXT,
        expectedResults TEXT,
        status TEXT DEFAULT 'completed',
        evaluationType TEXT DEFAULT 'initial',
        initialEvaluationId INTEGER,
        completedAt TEXT,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        
        -- Contenu et pédagogie
        skillsAcquisition INTEGER,
        personalDevelopment INTEGER,
        courseClarity INTEGER,
        theoryPractice INTEGER,
        syllabusAdequacy INTEGER,
        practicalCases INTEGER,
        objectivesAchieved INTEGER,
        adaptedKnowledge INTEGER,
        
        -- Méthodes et supports
        pedagogicalSupport INTEGER,
        techniquesUsed INTEGER,
        presentation INTEGER,
        
        -- Organisation et logistique
        logisticsConditions INTEGER,
        rhythm INTEGER,
        punctuality INTEGER,
        punctualityAssiduity INTEGER,
        
        -- Comportement et collaboration
        teamworkSense INTEGER,
        motivationEnthusiasm INTEGER,
        communicationSociable INTEGER,
        communicationGeneral INTEGER,
        aptitudeChangeIdeas INTEGER,
        curiosity INTEGER,
        initiativeSpirit INTEGER,
        responsibilitySense INTEGER,
        
        -- Compétences cognitives
        criticalAnalysis INTEGER,
        workExecution INTEGER,
        directivesComprehension INTEGER,
        workQuality INTEGER,
        subjectMastery INTEGER,
        
        -- Impact et observations
        observedChanges TEXT,
        improvementSuggestions TEXT,
        postFormationActions TEXT,
        actionsSatisfaction TEXT,
        recommendationScore INTEGER,
        needsAdditionalTraining TEXT,
        additionalTrainingDetails TEXT,
        requestedTrainings TEXT,
        noAdditionalTrainingReason TEXT,
        justificationObservations TEXT,
        
        -- Champs suivi 6 mois
        fu_behaviorGeneral INTEGER,
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
        fu_total60 INTEGER,
        fu_appreciationCode INTEGER,
        fu_appreciationLabel TEXT,
        fu_conclusionStaff TEXT,
        fu_conclusionDirector TEXT,
        fu_date TEXT,
        
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staffId) REFERENCES staff(id) ON DELETE CASCADE
      )`
    ];

    // Créer les tables une par une
    for (const table of tables) {
      try {
        this.db.exec(table);
      } catch (error) {
        console.error('Erreur création table:', error);
      }
    }

    // Vérifier si un utilisateur admin existe, sinon en créer un
    try {
      const adminCount = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin').count;
      if (adminCount === 0) {
        // Mot de passe 'admin123' en clair pour simplicité
        const insertAdmin = this.db.prepare('INSERT INTO users (firstName, lastName, email, password, role) VALUES (?, ?, ?, ?, ?)');
        insertAdmin.run('Admin', 'CFPT', 'admin@cfpt-ivato.mg', 'admin123', 'admin');
        console.log('✅ Utilisateur admin par défaut créé');
      }
    } catch (error) {
      console.error('Erreur création admin:', error);
    }

    // Insérer des thèmes par défaut s'ils n'existent pas
    try {
      const themeCount = this.db.prepare('SELECT COUNT(*) as count FROM themes').get().count;
      if (themeCount === 0) {
        const defaultThemes = [
          { name: 'Leadership Management', description: 'Formation sur les techniques de leadership et de management d\'équipe' },
          { name: 'Communication Efficace', description: 'Améliorer ses compétences en communication interpersonnelle' },
          { name: 'Gestion de Projet', description: 'Méthodologies et outils pour la gestion de projets' },
          { name: 'Innovation & Créativité', description: 'Développer l\'innovation et la créativité en entreprise' }
        ];

        const insertTheme = this.db.prepare('INSERT INTO themes (name, description) VALUES (?, ?)');
        const insertMany = this.db.transaction((themes) => {
          for (const theme of themes) {
            insertTheme.run(theme.name, theme.description);
          }
        });

        insertMany(defaultThemes);
        console.log('✅ Thèmes par défaut créés');
      }
    } catch (error) {
      console.error('Erreur création thèmes:', error);
    }
  }

  // ==================== USERS ====================
  
  async getUsers() {
    if (this.useMemoryFallback) return this.memoryDb.getUsers();
    try {
      const stmt = this.db.prepare('SELECT * FROM users ORDER BY createdAt DESC');
      return stmt.all();
    } catch (error) {
      console.error('Erreur getUsers:', error);
      return [];
    }
  }

  async createUser(userData) {
    if (this.useMemoryFallback) return this.memoryDb.createUser(userData);
    try {
      const stmt = this.db.prepare(`
        INSERT INTO users (firstName, lastName, email, password, role) 
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.password,
        userData.role || 'admin'
      );
      return { id: result.lastInsertRowid, ...userData };
    } catch (error) {
      console.error('Erreur createUser:', error);
      throw error;
    }
  }

  async updateUser(id, userData) {
    if (this.useMemoryFallback) return this.memoryDb.updateUser(id, userData);
    try {
      const stmt = this.db.prepare(`
        UPDATE users 
        SET firstName = ?, lastName = ?, email = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(userData.firstName, userData.lastName, userData.email, id);
      return { id, ...userData };
    } catch (error) {
      console.error('Erreur updateUser:', error);
      throw error;
    }
  }

  async deleteUser(id) {
    if (this.useMemoryFallback) return this.memoryDb.deleteUser(id);
    try {
      const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
      stmt.run(id);
      return { success: true };
    } catch (error) {
      console.error('Erreur deleteUser:', error);
      throw error;
    }
  }

  // ==================== STAFF ====================
  
  async getStaff() {
    if (this.useMemoryFallback) return this.memoryDb.getStaff();
    try {
      const stmt = this.db.prepare('SELECT * FROM staff ORDER BY createdAt DESC');
      return stmt.all();
    } catch (error) {
      console.error('Erreur getStaff:', error);
      return [];
    }
  }

  async createStaff(staffData) {
    if (this.useMemoryFallback) return this.memoryDb.createStaff(staffData);
    try {
      const stmt = this.db.prepare(`
        INSERT INTO staff (matricule, firstName, lastName, position, email, phone, establishment, formationYear) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        staffData.matricule,
        staffData.firstName,
        staffData.lastName,
        staffData.position,
        staffData.email,
        staffData.phone,
        staffData.establishment,
        staffData.formationYear
      );
      return { id: result.lastInsertRowid, ...staffData };
    } catch (error) {
      console.error('Erreur createStaff:', error);
      throw error;
    }
  }

  async updateStaff(id, staffData) {
    if (this.useMemoryFallback) return this.memoryDb.updateStaff(id, staffData);
    try {
      const stmt = this.db.prepare(`
        UPDATE staff 
        SET matricule = ?, firstName = ?, lastName = ?, position = ?, 
            email = ?, phone = ?, establishment = ?, formationYear = ?,
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(
        staffData.matricule,
        staffData.firstName,
        staffData.lastName,
        staffData.position,
        staffData.email,
        staffData.phone,
        staffData.establishment,
        staffData.formationYear,
        id
      );
      return { id, ...staffData };
    } catch (error) {
      console.error('Erreur updateStaff:', error);
      throw error;
    }
  }

  async deleteStaff(id) {
    if (this.useMemoryFallback) return this.memoryDb.deleteStaff(id);
    try {
      const stmt = this.db.prepare('DELETE FROM staff WHERE id = ?');
      stmt.run(id);
      return { success: true };
    } catch (error) {
      console.error('Erreur deleteStaff:', error);
      throw error;
    }
  }

  // ==================== THEMES ====================
  
  async getThemes() {
    if (this.useMemoryFallback) return this.memoryDb.getThemes();
    try {
      const stmt = this.db.prepare('SELECT * FROM themes ORDER BY createdAt DESC');
      return stmt.all();
    } catch (error) {
      console.error('Erreur getThemes:', error);
      return [];
    }
  }

  async createTheme(themeData) {
    if (this.useMemoryFallback) return this.memoryDb.createTheme(themeData);
    try {
      const stmt = this.db.prepare(`
        INSERT INTO themes (name, description) 
        VALUES (?, ?)
      `);
      const result = stmt.run(themeData.name, themeData.description || '');
      return { id: result.lastInsertRowid, ...themeData };
    } catch (error) {
      console.error('Erreur createTheme:', error);
      throw error;
    }
  }

  async updateTheme(id, themeData) {
    if (this.useMemoryFallback) return this.memoryDb.updateTheme(id, themeData);
    try {
      const stmt = this.db.prepare(`
        UPDATE themes 
        SET name = ?, description = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(themeData.name, themeData.description || '', id);
      return { id, ...themeData };
    } catch (error) {
      console.error('Erreur updateTheme:', error);
      throw error;
    }
  }

  async deleteTheme(id) {
    if (this.useMemoryFallback) return this.memoryDb.deleteTheme(id);
    try {
      console.log('🗑️ Suppression du thème ID:', id, 'dans SQLite');
      const stmt = this.db.prepare('DELETE FROM themes WHERE id = ?');
      const info = stmt.run(id);
      console.log('📊 Résultat suppression SQLite:', info.changes, 'ligne(s) supprimée(s)');
      
      // CRITIQUE: Forcer un checkpoint WAL pour persister immédiatement
      // En mode WAL, les modifications restent dans le fichier -wal jusqu'au checkpoint
      this.db.pragma('wal_checkpoint(FULL)');
      console.log('✅ Checkpoint WAL effectué - Données persistées sur disque');
      
      return { success: info.changes > 0, changes: info.changes };
    } catch (error) {
      console.error('Erreur deleteTheme:', error);
      throw error;
    }
  }

  // ==================== EVALUATIONS ====================
  
  async getEvaluations() {
    if (this.useMemoryFallback) return this.memoryDb.getEvaluations();
    try {
      const stmt = this.db.prepare('SELECT * FROM evaluations ORDER BY createdAt DESC');
      const evaluations = stmt.all();
      
      // Parser les champs JSON
      return evaluations.map(evaluation => ({
        ...evaluation,
        observedChanges: evaluation.observedChanges ? JSON.parse(evaluation.observedChanges) : [],
        requestedTrainings: evaluation.requestedTrainings ? JSON.parse(evaluation.requestedTrainings) : []
      }));
    } catch (error) {
      console.error('Erreur getEvaluations:', error);
      return [];
    }
  }

  async createEvaluation(evaluationData) {
    if (this.useMemoryFallback) return this.memoryDb.createEvaluation(evaluationData);
    try {
      // Préparer les données pour l'insertion
      const columns = Object.keys(evaluationData).filter(key => key !== 'id');
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(key => {
        // Convertir les tableaux en JSON
        if (Array.isArray(evaluationData[key])) {
          return JSON.stringify(evaluationData[key]);
        }
        return evaluationData[key];
      });

      const stmt = this.db.prepare(`
        INSERT INTO evaluations (${columns.join(', ')}) 
        VALUES (${placeholders})
      `);
      const result = stmt.run(...values);
      return { id: result.lastInsertRowid, ...evaluationData };
    } catch (error) {
      console.error('Erreur createEvaluation:', error);
      throw error;
    }
  }

  async updateEvaluation(id, evaluationData) {
    if (this.useMemoryFallback) return this.memoryDb.updateEvaluation(id, evaluationData);
    try {
      const columns = Object.keys(evaluationData).filter(key => key !== 'id');
      const setClause = columns.map(key => `${key} = ?`).join(', ');
      const values = columns.map(key => {
        if (Array.isArray(evaluationData[key])) {
          return JSON.stringify(evaluationData[key]);
        }
        return evaluationData[key];
      });
      values.push(id);

      const stmt = this.db.prepare(`
        UPDATE evaluations 
        SET ${setClause}, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(...values);
      return { id, ...evaluationData };
    } catch (error) {
      console.error('Erreur updateEvaluation:', error);
      throw error;
    }
  }

  async deleteEvaluation(id) {
    if (this.useMemoryFallback) return this.memoryDb.deleteEvaluation(id);
    try {
      const stmt = this.db.prepare('DELETE FROM evaluations WHERE id = ?');
      stmt.run(id);
      return { success: true };
    } catch (error) {
      console.error('Erreur deleteEvaluation:', error);
      throw error;
    }
  }

  async getEvaluationStats() {
    if (this.useMemoryFallback) return this.memoryDb.getEvaluationStats();
    try {
      const evaluations = await this.getEvaluations();
      // Calculs statistiques basiques
      return evaluations.map(evaluation => ({
        ...evaluation,
        averageScore: this.calculateAverageScore(evaluation)
      }));
    } catch (error) {
      console.error('Erreur getEvaluationStats:', error);
      return [];
    }
  }

  calculateAverageScore(evaluation) {
    const scores = [
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
      evaluation.subjectMastery
    ].filter(score => score != null && score > 0);

    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }

  async exportData(type) {
    if (this.useMemoryFallback) return this.memoryDb.exportData(type);
    try {
      let data = {};
      if (type === 'all' || type === 'staff') {
        data.staff = await this.getStaff();
      }
      if (type === 'all' || type === 'evaluations') {
        data.evaluations = await this.getEvaluations();
      }
      if (type === 'all' || type === 'themes') {
        data.themes = await this.getThemes();
      }
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Erreur exportData:', error);
      throw error;
    }
  }

  async importData(jsonData) {
    if (this.useMemoryFallback) return this.memoryDb.importData(jsonData);
    try {
      const data = JSON.parse(jsonData);
      let imported = 0;

      if (data.staff && Array.isArray(data.staff)) {
        for (const item of data.staff) {
          try {
            await this.createStaff(item);
            imported++;
          } catch (e) {
            console.error('Erreur import staff item:', e);
          }
        }
      }

      if (data.evaluations && Array.isArray(data.evaluations)) {
        for (const item of data.evaluations) {
          try {
            await this.createEvaluation(item);
            imported++;
          } catch (e) {
            console.error('Erreur import evaluation item:', e);
          }
        }
      }

      if (data.themes && Array.isArray(data.themes)) {
        for (const item of data.themes) {
          try {
            await this.createTheme(item);
            imported++;
          } catch (e) {
            console.error('Erreur import theme item:', e);
          }
        }
      }

      return imported;
    } catch (error) {
      console.error('Erreur importData:', error);
      throw error;
    }
  }

  // ==================== APP CONFIG ====================
  
  async getAppConfig() {
    if (this.useMemoryFallback) return this.getDefaultConfig();
    try {
      const stmt = this.db.prepare('SELECT * FROM app_config WHERE id = 1');
      const config = stmt.get();
      
      if (!config) {
        // Créer une configuration par défaut
        return await this.initializeAppConfig();
      }
      
      return config;
    } catch (error) {
      console.error('Erreur getAppConfig:', error);
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      id: 1,
      usePrinter: false,
      invoiceDisplay: 'screen',
      userMode: 'single',
      multiRegister: false,
      auditLogging: true,
      setupCompleted: false,
      companyName: 'CFPT Ivato',
      companyAddress: '',
      companyPhone: '',
      companyEmail: ''
    };
  }

  async initializeAppConfig() {
    if (this.useMemoryFallback) return this.getDefaultConfig();
    try {
      const defaults = this.getDefaultConfig();
      const stmt = this.db.prepare(`
        INSERT INTO app_config (id, usePrinter, invoiceDisplay, userMode, multiRegister, auditLogging, setupCompleted, companyName)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        defaults.usePrinter ? 1 : 0,
        defaults.invoiceDisplay,
        defaults.userMode,
        defaults.multiRegister ? 1 : 0,
        defaults.auditLogging ? 1 : 0,
        defaults.setupCompleted ? 1 : 0,
        defaults.companyName
      );
      console.log('✅ Configuration par défaut initialisée');
      return defaults;
    } catch (error) {
      console.error('Erreur initializeAppConfig:', error);
      return this.getDefaultConfig();
    }
  }

  async updateAppConfig(configData) {
    if (this.useMemoryFallback) return configData;
    try {
      const columns = Object.keys(configData).filter(key => key !== 'id' && key !== 'createdAt');
      const setClause = columns.map(key => `${key} = ?`).join(', ');
      const values = columns.map(key => {
        if (typeof configData[key] === 'boolean') {
          return configData[key] ? 1 : 0;
        }
        return configData[key];
      });

      const stmt = this.db.prepare(`
        UPDATE app_config 
        SET ${setClause}, updatedAt = CURRENT_TIMESTAMP
        WHERE id = 1
      `);
      stmt.run(...values);
      
      console.log('✅ Configuration mise à jour');
      return await this.getAppConfig();
    } catch (error) {
      console.error('Erreur updateAppConfig:', error);
      throw error;
    }
  }

  // ==================== AUDIT LOGS ====================
  
  async createAuditLog(logData) {
    if (this.useMemoryFallback) return logData;
    
    // Vérifier si l'audit logging est activé
    try {
      const config = await this.getAppConfig();
      if (!config.auditLogging) {
        return null; // Audit désactivé
      }
    } catch (e) {
      // Continuer même si erreur de config
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO audit_logs (userId, userName, action, tableName, recordId, oldValue, newValue, ipAddress, userAgent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        logData.userId || null,
        logData.userName || 'Système',
        logData.action,
        logData.tableName || null,
        logData.recordId || null,
        logData.oldValue ? JSON.stringify(logData.oldValue) : null,
        logData.newValue ? JSON.stringify(logData.newValue) : null,
        logData.ipAddress || null,
        logData.userAgent || null
      );
      return { id: result.lastInsertRowid, ...logData };
    } catch (error) {
      console.error('Erreur createAuditLog:', error);
      // Ne pas bloquer l'opération principale si le log échoue
      return null;
    }
  }

  async getAuditLogs(filters = {}) {
    if (this.useMemoryFallback) return [];
    try {
      let query = 'SELECT * FROM audit_logs';
      const conditions = [];
      const values = [];

      if (filters.userId) {
        conditions.push('userId = ?');
        values.push(filters.userId);
      }
      if (filters.tableName) {
        conditions.push('tableName = ?');
        values.push(filters.tableName);
      }
      if (filters.action) {
        conditions.push('action = ?');
        values.push(filters.action);
      }
      if (filters.startDate) {
        conditions.push('timestamp >= ?');
        values.push(filters.startDate);
      }
      if (filters.endDate) {
        conditions.push('timestamp <= ?');
        values.push(filters.endDate);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY timestamp DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        values.push(filters.limit);
      }

      const stmt = this.db.prepare(query);
      const logs = stmt.all(...values);
      
      // Parser les JSON
      return logs.map(log => ({
        ...log,
        oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
        newValue: log.newValue ? JSON.parse(log.newValue) : null
      }));
    } catch (error) {
      console.error('Erreur getAuditLogs:', error);
      return [];
    }
  }

  async deleteOldAuditLogs(daysToKeep = 90) {
    if (this.useMemoryFallback) return { deleted: 0 };
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffDateStr = cutoffDate.toISOString();

      const stmt = this.db.prepare('DELETE FROM audit_logs WHERE timestamp < ?');
      const result = stmt.run(cutoffDateStr);
      
      console.log(`🧹 Supprimé ${result.changes} logs d'audit de plus de ${daysToKeep} jours`);
      return { deleted: result.changes };
    } catch (error) {
      console.error('Erreur deleteOldAuditLogs:', error);
      throw error;
    }
  }

  close() {
    if (this.useMemoryFallback) {
      if (this.memoryDb) this.memoryDb.close();
    } else if (this.db) {
      // Force WAL checkpoint pour sauvegarder toutes les données avant de fermer
      try {
        console.log('Sauvegarde finale des données (WAL checkpoint)...');
        this.db.pragma('wal_checkpoint(FULL)');
        console.log('Données sauvegardées avec succès');
      } catch (error) {
        console.error('Erreur lors du checkpoint WAL:', error);
      }
      this.db.close();
    }
  }
}

// Instance singleton
const databaseService = new DatabaseService();

module.exports = databaseService;
