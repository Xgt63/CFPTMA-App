// Service de base de données en mémoire avec persistance JSON
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class MemoryDatabaseService {
  constructor() {
    // Chemin du fichier de persistance
    const userDataPath = app.getPath('userData');
    this.dbFilePath = path.join(userDataPath, 'memory_database.json');
    
    // Données par défaut
    const defaultData = {
      users: [
        { 
          id: 1, 
          firstName: 'Admin', 
          lastName: 'CFPT', 
          email: 'admin@cfpt-ivato.mg', 
          password: 'admin123', 
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      staff: [
        {
          id: 1,
          matricule: 'CFP001',
          firstName: 'Jean',
          lastName: 'Rakoto',
          position: 'Formateur Senior',
          email: 'jean.rakoto@cfpt-ivato.mg',
          phone: '034 12 345 67',
          establishment: 'CFPT Ivato',
          formationYear: 2023,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          matricule: 'CFP002',
          firstName: 'Marie',
          lastName: 'Andriamanalina',
          position: 'Formatrice',
          email: 'marie.andriamanalina@cfpt-ivato.mg',
          phone: '033 98 765 43',
          establishment: 'CFPT Ivato',
          formationYear: 2022,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      themes: [
        {
          id: 1,
          name: 'Leadership Management',
          description: 'Formation sur les techniques de leadership et de management d\'équipe',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Communication Efficace',
          description: 'Améliorer ses compétences en communication interpersonnelle',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Gestion de Projet',
          description: 'Méthodologies et outils pour la gestion de projets',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      evaluations: [
        {
          id: 1,
          staffId: 1,
          firstName: 'Jean',
          lastName: 'Rakoto',
          fillDate: new Date().toISOString().split('T')[0],
          formationTheme: 'Leadership Management',
          skillsAcquisition: 4,
          personalDevelopment: 5,
          courseClarity: 4,
          theoryPractice: 4,
          syllabusAdequacy: 5,
          practicalCases: 4,
          objectivesAchieved: 4,
          adaptedKnowledge: 5,
          pedagogicalSupport: 4,
          techniquesUsed: 4,
          presentation: 5,
          logisticsConditions: 4,
          rhythm: 4,
          punctuality: 5,
          punctualityAssiduity: 5,
          teamworkSense: 5,
          motivationEnthusiasm: 5,
          communicationSociable: 4,
          communicationGeneral: 4,
          aptitudeChangeIdeas: 4,
          curiosity: 5,
          initiativeSpirit: 4,
          responsibilitySense: 5,
          criticalAnalysis: 4,
          workExecution: 5,
          directivesComprehension: 4,
          workQuality: 5,
          subjectMastery: 4,
          recommendationScore: 4,
          justificationObservations: 'Excellent formateur avec beaucoup d\'expérience',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };
    
    // Charger les données depuis le fichier s'il existe
    this.loadFromFile(defaultData);
    
    this.nextIds = {
      users: 2,
      staff: 3,
      themes: 4,
      evaluations: 2
    };
  }
  
  loadFromFile(defaultData) {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        console.log('💾 Chargement des données depuis:', this.dbFilePath);
        const fileContent = fs.readFileSync(this.dbFilePath, 'utf8');
        const savedData = JSON.parse(fileContent);
        this.data = savedData.data || defaultData;
        this.nextIds = savedData.nextIds || this.nextIds;
        console.log('✅ Données chargées avec succès');
      } else {
        console.log('🆕 Fichier de données non trouvé, utilisation des données par défaut');
        this.data = defaultData;
        this.saveToFile(); // Créer le fichier initial
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      this.data = defaultData;
    }
  }
  
  saveToFile() {
    try {
      const dataToSave = {
        data: this.data,
        nextIds: this.nextIds,
        lastSaved: new Date().toISOString()
      };
      fs.writeFileSync(this.dbFilePath, JSON.stringify(dataToSave, null, 2), 'utf8');
      console.log('💾 Données sauvegardées:', this.dbFilePath);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des données:', error);
    }
  }

  async initialize() {
    console.log('📝 Base de données en mémoire avec persistance JSON initialisée');
    return Promise.resolve();
  }

  close() {
    console.log('💾 Sauvegarde finale avant fermeture...');
    this.saveToFile();
    console.log('📝 Base de données en mémoire fermée');
  }

  // Users
  async getUsers() {
    return [...this.data.users];
  }

  async createUser(userData) {
    const newUser = {
      id: this.nextIds.users++,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.saveToFile();
    return newUser;
  }

  async updateUser(id, userData) {
    const index = this.data.users.findIndex(u => u.id === parseInt(id));
    if (index === -1) throw new Error('Utilisateur non trouvé');
    
    this.data.users[index] = {
      ...this.data.users[index],
      ...userData,
      updatedAt: new Date().toISOString()
    };
    this.saveToFile();
    return this.data.users[index];
  }

  async deleteUser(id) {
    const index = this.data.users.findIndex(u => u.id === parseInt(id));
    if (index === -1) throw new Error('Utilisateur non trouvé');
    
    this.data.users.splice(index, 1);
    this.saveToFile();
    return { success: true };
  }

  // Staff
  async getStaff() {
    return [...this.data.staff];
  }

  async createStaff(staffData) {
    const newStaff = {
      id: this.nextIds.staff++,
      ...staffData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.staff.push(newStaff);
    this.saveToFile();
    return newStaff;
  }

  async updateStaff(id, staffData) {
    const index = this.data.staff.findIndex(s => s.id === parseInt(id));
    if (index === -1) throw new Error('Personnel non trouvé');
    
    this.data.staff[index] = {
      ...this.data.staff[index],
      ...staffData,
      updatedAt: new Date().toISOString()
    };
    this.saveToFile();
    return this.data.staff[index];
  }

  async deleteStaff(id) {
    const index = this.data.staff.findIndex(s => s.id === parseInt(id));
    if (index === -1) throw new Error('Personnel non trouvé');
    
    this.data.staff.splice(index, 1);
    // Supprimer aussi les évaluations associées
    this.data.evaluations = this.data.evaluations.filter(e => e.staffId !== parseInt(id));
    this.saveToFile();
    return { success: true };
  }

  // Themes
  async getThemes() {
    return [...this.data.themes];
  }

  async createTheme(themeData) {
    const newTheme = {
      id: this.nextIds.themes++,
      ...themeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.themes.push(newTheme);
    this.saveToFile();
    return newTheme;
  }

  async updateTheme(id, themeData) {
    const index = this.data.themes.findIndex(t => t.id === parseInt(id));
    if (index === -1) throw new Error('Thème non trouvé');
    
    this.data.themes[index] = {
      ...this.data.themes[index],
      ...themeData,
      updatedAt: new Date().toISOString()
    };
    this.saveToFile();
    return this.data.themes[index];
  }

  async deleteTheme(id) {
    console.log('🗑️ Suppression du thème ID:', id);
    const index = this.data.themes.findIndex(t => t.id === parseInt(id));
    if (index === -1) throw new Error('Thème non trouvé');
    
    this.data.themes.splice(index, 1);
    console.log('✅ Thème supprimé, sauvegarde des données...');
    this.saveToFile();
    console.log('💾 Données sauvegardées');
    return { success: true };
  }

  // Evaluations
  async getEvaluations() {
    return [...this.data.evaluations];
  }

  async createEvaluation(evaluationData) {
    const newEvaluation = {
      id: this.nextIds.evaluations++,
      ...evaluationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.evaluations.push(newEvaluation);
    this.saveToFile();
    return newEvaluation;
  }

  async updateEvaluation(id, evaluationData) {
    const index = this.data.evaluations.findIndex(e => e.id === parseInt(id));
    if (index === -1) throw new Error('Évaluation non trouvée');
    
    this.data.evaluations[index] = {
      ...this.data.evaluations[index],
      ...evaluationData,
      updatedAt: new Date().toISOString()
    };
    this.saveToFile();
    return this.data.evaluations[index];
  }

  async deleteEvaluation(id) {
    const index = this.data.evaluations.findIndex(e => e.id === parseInt(id));
    if (index === -1) throw new Error('Évaluation non trouvée');
    
    this.data.evaluations.splice(index, 1);
    this.saveToFile();
    return { success: true };
  }

  async getEvaluationStats() {
    return {
      totalEvaluations: this.data.evaluations.length,
      averageScore: this.data.evaluations.length > 0 
        ? this.data.evaluations.reduce((sum, e) => sum + e.recommendationScore, 0) / this.data.evaluations.length 
        : 0,
      byTheme: this.data.themes.map(theme => ({
        theme: theme.name,
        count: this.data.evaluations.filter(e => e.formationTheme === theme.name).length
      }))
    };
  }

  async exportData(type = 'all') {
    if (type === 'all') {
      return { ...this.data };
    }
    return this.data[type] || [];
  }

  async importData(jsonData) {
    if (jsonData.users) this.data.users = jsonData.users;
    if (jsonData.staff) this.data.staff = jsonData.staff;
    if (jsonData.themes) this.data.themes = jsonData.themes;
    if (jsonData.evaluations) this.data.evaluations = jsonData.evaluations;
    
    // Recalculer les nextIds
    this.nextIds.users = Math.max(...this.data.users.map(u => u.id), 0) + 1;
    this.nextIds.staff = Math.max(...this.data.staff.map(s => s.id), 0) + 1;
    this.nextIds.themes = Math.max(...this.data.themes.map(t => t.id), 0) + 1;
    this.nextIds.evaluations = Math.max(...this.data.evaluations.map(e => e.id), 0) + 1;
    
    this.saveToFile();
    return { success: true };
  }
}

module.exports = MemoryDatabaseService;