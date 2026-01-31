const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let dataManager;
let databaseService;

// Gestionnaire de données unifié
class DataManager {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.dataFilePath = path.join(this.userDataPath, 'cfp-data.json');
    this.data = {
      users: [],
      staff: [],
      formation_themes: [],
      evaluations: [],
      staff_trainings: []
    };
    this.initializeData();
  }

  initializeData() {
    try {
      // Créer le dossier userData s'il n'existe pas
      if (!fs.existsSync(this.userDataPath)) {
        fs.mkdirSync(this.userDataPath, { recursive: true });
        console.log('Dossier userData créé:', this.userDataPath);
      }

      // Charger les données existantes ou créer le fichier
      if (fs.existsSync(this.dataFilePath)) {
        const fileContent = fs.readFileSync(this.dataFilePath, 'utf8');
        this.data = JSON.parse(fileContent);
        console.log('Données chargées depuis:', this.dataFilePath);
      } else {
        // Créer les données par défaut
        this.data = {
          users: [{
            id: 1,
            email: 'admin@cfp.com',
            firstName: 'Admin',
            lastName: 'CFP',
            role: 'admin',
            securityQuestions: '[]',
            createdAt: new Date().toISOString()
          }],
          staff: [],
          formation_themes: [
            {
              id: 1,
              name: 'Leadership Management',
              description: 'Formation sur les techniques de leadership et de management d\'équipe',
              createdAt: new Date().toISOString()
            },
            {
              id: 2,
              name: 'Communication Efficace',
              description: 'Améliorer ses compétences en communication interpersonnelle',
              createdAt: new Date().toISOString()
            },
            {
              id: 3,
              name: 'Gestion de Projet',
              description: 'Méthodologies et outils pour la gestion de projets',
              createdAt: new Date().toISOString()
            },
            {
              id: 4,
              name: 'Innovation & Créativité',
              description: 'Développer l\'innovation et la créativité en entreprise',
              createdAt: new Date().toISOString()
            }
          ],
          evaluations: []
        };
        this.saveData();
        console.log('Données par défaut créées');
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des données:', error);
      // Données de fallback en cas d'erreur
      this.data = {
        users: [{
          id: 1,
          email: 'admin@cfp.com',
          firstName: 'Admin',
          lastName: 'CFP',
          role: 'admin',
          securityQuestions: '[]',
          createdAt: new Date().toISOString()
        }],
        staff: [],
        formation_themes: [],
        evaluations: []
      };
    }
  }

  saveData() {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(this.data, null, 2));
      console.log('Données sauvegardées dans:', this.dataFilePath);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return false;
    }
  }

  getNextId(table) {
    const items = this.data[table] || [];
    return items.length > 0 ? Math.max(...items.map(item => item.id || 0)) + 1 : 1;
  }

  // Users
  getUsers() {
    return this.data.users || [];
  }

  createUser(userData) {
    const newUser = {
      ...userData,
      id: this.getNextId('users'),
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.saveData();
    return { lastInsertRowid: newUser.id, changes: 1 };
  }

  updateUser(id, userData) {
    const index = this.data.users.findIndex(u => u.id === parseInt(id));
    if (index !== -1) {
      this.data.users[index] = { ...this.data.users[index], ...userData };
      this.saveData();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  deleteUser(id) {
    const initialLength = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== parseInt(id));
    const changes = initialLength - this.data.users.length;
    if (changes > 0) this.saveData();
    return { changes };
  }

  // Staff
  getStaff() {
    return this.data.staff || [];
  }

  createStaff(staffData) {
    const newStaff = {
      ...staffData,
      id: this.getNextId('staff'),
      createdAt: new Date().toISOString()
    };
    this.data.staff.push(newStaff);
    this.saveData();
    return { lastInsertRowid: newStaff.id, changes: 1 };
  }

  updateStaff(id, staffData) {
    const index = this.data.staff.findIndex(s => s.id === parseInt(id));
    if (index !== -1) {
      this.data.staff[index] = { ...this.data.staff[index], ...staffData };
      this.saveData();
      console.log('Staff mis à jour:', this.data.staff[index]);
      return { changes: 1 };
    }
    console.log('Staff non trouvé pour mise à jour, ID:', id);
    return { changes: 0 };
  }

  deleteStaff(id) {
    const initialLength = this.data.staff.length;
    this.data.staff = this.data.staff.filter(s => s.id !== parseInt(id));
    const changes = initialLength - this.data.staff.length;
    if (changes > 0) {
      this.saveData();
      console.log('Staff supprimé, ID:', id, 'Changements:', changes);
    } else {
      console.log('Aucun staff trouvé pour suppression, ID:', id);
    }
    return { changes };
  }

  // Formation Themes
  getThemes() {
    return this.data.formation_themes || [];
  }

  createTheme(themeData) {
    const newTheme = {
      ...themeData,
      id: this.getNextId('formation_themes'),
      createdAt: new Date().toISOString()
    };
    this.data.formation_themes.push(newTheme);
    this.saveData();
    return newTheme;
  }

  updateTheme(id, themeData) {
    const index = this.data.formation_themes.findIndex(t => t.id === parseInt(id));
    if (index !== -1) {
      this.data.formation_themes[index] = { ...this.data.formation_themes[index], ...themeData };
      this.saveData();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  deleteTheme(id) {
    const initialLength = this.data.formation_themes.length;
    this.data.formation_themes = this.data.formation_themes.filter(t => t.id !== parseInt(id));
    const changes = initialLength - this.data.formation_themes.length;
    if (changes > 0) this.saveData();
    return { changes };
  }

  // Evaluations
  getEvaluations() {
    return this.data.evaluations || [];
  }

  createEvaluation(evaluationData) {
    const newEvaluation = {
      ...evaluationData,
      id: this.getNextId('evaluations'),
      createdAt: new Date().toISOString()
    };
    this.data.evaluations.push(newEvaluation);
    this.saveData();
    return { lastInsertRowid: newEvaluation.id, changes: 1 };
  }

  updateEvaluation(id, evaluationData) {
    const index = this.data.evaluations.findIndex(e => e.id === parseInt(id));
    if (index !== -1) {
      this.data.evaluations[index] = { ...this.data.evaluations[index], ...evaluationData };
      this.saveData();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  deleteEvaluation(id) {
    const initialLength = this.data.evaluations.length;
    this.data.evaluations = this.data.evaluations.filter(e => e.id !== parseInt(id));
    const changes = initialLength - this.data.evaluations.length;
    if (changes > 0) this.saveData();
    return { changes };
  }

  getEvaluationStats() {
    const evaluations = this.data.evaluations || [];
    if (evaluations.length === 0) return [];

    const stats = {};
    
    evaluations.forEach(evaluation => {
      const theme = evaluation.formationTheme;
      if (!stats[theme]) {
        stats[theme] = {
          formationTheme: theme,
          totalEvaluations: 0,
          avgObjectiveAchievement: 0,
          avgRelevanceToRole: 0,
          avgExpectationsMet: 0,
          avgSkillsDevelopment: 0,
          avgRecommendationScore: 0,
          themeCount: 0
        };
      }
      
      const themeStats = stats[theme];
      themeStats.totalEvaluations++;
      themeStats.avgObjectiveAchievement += evaluation.objectiveAchievement || 0;
      themeStats.avgRelevanceToRole += evaluation.relevanceToRole || 0;
      themeStats.avgExpectationsMet += evaluation.expectationsMet || 0;
      themeStats.avgSkillsDevelopment += evaluation.skillsDevelopment || 0;
      themeStats.avgRecommendationScore += evaluation.recommendationScore || 0;
      themeStats.themeCount++;
    });
    
    // Calculer les moyennes
    Object.values(stats).forEach(statistic => {
      statistic.avgObjectiveAchievement /= statistic.themeCount;
      statistic.avgRelevanceToRole /= statistic.themeCount;
      statistic.avgExpectationsMet /= statistic.themeCount;
      statistic.avgSkillsDevelopment /= statistic.themeCount;
      statistic.avgRecommendationScore /= statistic.themeCount;
    });
    
    return Object.values(stats);
  }

  // Staff Trainings (liaison staff <-> theme)
  getStaffTrainings() {
    return this.data.staff_trainings || [];
  }

  getTrainingsByStaff(staffId) {
    return (this.data.staff_trainings || []).filter(t => Number(t.staffId) === Number(staffId));
  }

  createStaffTraining(trainingData) {
    const newTraining = {
      id: this.getNextId('staff_trainings'),
      staffId: Number(trainingData.staffId),
      themeId: Number(trainingData.themeId),
      status: trainingData.status || 'active',
      assignedDate: trainingData.assignedDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.staff_trainings.push(newTraining);
    this.saveData();
    return newTraining;
  }

  updateStaffTraining(id, trainingData) {
    const idx = (this.data.staff_trainings || []).findIndex(t => Number(t.id) === Number(id));
    if (idx !== -1) {
      this.data.staff_trainings[idx] = { ...this.data.staff_trainings[idx], ...trainingData, updatedAt: new Date().toISOString() };
      this.saveData();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  deleteStaffTraining(id) {
    const before = (this.data.staff_trainings || []).length;
    this.data.staff_trainings = (this.data.staff_trainings || []).filter(t => Number(t.id) !== Number(id));
    const changes = before - this.data.staff_trainings.length;
    if (changes > 0) this.saveData();
    return { changes };
  }

  exportData(type = 'all') {
    const exportData = {};
    
    if (type === 'all' || type === 'staff') {
      exportData.staff = this.data.staff;
    }
    if (type === 'all' || type === 'evaluations') {
      exportData.evaluations = this.data.evaluations;
    }
    if (type === 'all' || type === 'themes') {
      exportData.themes = this.data.formation_themes;
    }
    if (type === 'all' || type === 'users') {
      exportData.users = this.data.users;
    }
    if (type === 'all' || type === 'trainings') {
      exportData.staff_trainings = this.data.staff_trainings || [];
    }
    
    exportData.metadata = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      type: type
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  importData(jsonData) {
    try {
      const importedData = JSON.parse(jsonData);
      
      if (importedData.staff) {
        this.data.staff = importedData.staff;
      }
      if (importedData.evaluations) {
        this.data.evaluations = importedData.evaluations;
      }
      if (importedData.themes) {
        this.data.formation_themes = importedData.themes;
      }
      if (importedData.users) {
        this.data.users = importedData.users;
      }
      if (importedData.staff_trainings) {
        this.data.staff_trainings = importedData.staff_trainings;
      }
      
      this.saveData();
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      return false;
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      sandbox: false
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.ico')
  });

  // Créer un menu personnalisé
  const template = [
    {
      label: 'CFP Manager',
      submenu: [
        {
          label: 'À propos de CFP Manager',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'À propos',
              message: 'CFP Manager v1.0.0',
              detail: 'Application de gestion de formation et d\'évaluation\nCentre de Formation Catholique'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Actualiser',
          accelerator: 'F5',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Outils de développement',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: 'Ouvrir dossier de données',
          click: () => {
            const { shell } = require('electron');
            shell.openPath(dataManager.userDataPath);
          }
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Données',
      submenu: [
        {
          label: 'Exporter toutes les données',
          click: async () => {
            try {
              const { dialog } = require('electron');
              const result = await dialog.showSaveDialog(mainWindow, {
                title: 'Exporter les données',
                defaultPath: `cfp-export-${new Date().toISOString().split('T')[0]}.json`,
                filters: [
                  { name: 'Fichiers JSON', extensions: ['json'] }
                ]
              });
              
              if (!result.canceled) {
                const exportData = dataManager.exportData('all');
                fs.writeFileSync(result.filePath, exportData);
                
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'Export réussi',
                  message: 'Les données ont été exportées avec succès !'
                });
              }
            } catch (error) {
              console.error('Erreur export:', error);
            }
          }
        },
        {
          label: 'Sauvegarder la base de données',
          click: () => {
            const { dialog } = require('electron');
            const saved = dataManager.saveData();
            dialog.showMessageBox(mainWindow, {
              type: saved ? 'info' : 'error',
              title: saved ? 'Sauvegarde réussie' : 'Erreur de sauvegarde',
              message: saved 
                ? `Base de données sauvegardée dans :\n${dataManager.dataFilePath}`
                : 'Erreur lors de la sauvegarde des données'
            });
          }
        }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'Guide d\'utilisation',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Guide d\'utilisation',
              message: 'CFP Manager - Guide rapide',
              detail: '1. Gérez votre personnel dans l\'onglet "Personnel"\n2. Créez des évaluations dans "Évaluation"\n3. Consultez les statistiques dans "Statistiques"\n4. Configurez l\'application dans "Paramètres"'
            });
          }
        },
        {
          label: 'Raccourcis clavier',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Raccourcis clavier',
              message: 'Raccourcis disponibles',
              detail: 'F5 - Actualiser\nF12 - Outils de développement\nCtrl+Q - Quitter'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Support technique',
          click: () => {
            const { shell } = require('electron');
            shell.openExternal('mailto:support@cfp.com?subject=Support CFP Manager');
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Afficher la fenêtre une fois que la page est prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('Fenêtre affichée');
  });

  // Gérer les erreurs de chargement
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // Log de l'URL chargée pour diagnostic
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
    console.log('Current URL:', mainWindow.webContents.getURL());
  });

  // Configuration CSP durcie (suppression de 'unsafe-eval')
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const csp = "default-src 'self' data: blob:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' file:";
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // Essayer plusieurs chemins possibles pour l'application packagée
    const possiblePaths = [
      path.join(__dirname, '..', 'dist', 'index.html'),
      path.join(__dirname, 'dist', 'index.html'),
      path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
      path.join(process.resourcesPath, 'dist', 'index.html')
    ];
    
    let loaded = false;
    for (const indexPath of possiblePaths) {
      console.log('Trying to load from:', indexPath);
      if (fs.existsSync(indexPath)) {
        console.log('Found index.html at:', indexPath);
        mainWindow.loadFile(indexPath);
        loaded = true;
        break;
      }
    }
    
    if (!loaded) {
      console.error('Could not find index.html in any of the expected locations');
      const errorHtml = `
        <html>
          <head><title>CFP Manager - Erreur</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>CFP Manager</h1>
            <h2>Erreur de chargement</h2>
            <p>Les fichiers de l'application n'ont pas pu être trouvés.</p>
            <p>Chemins testés:</p>
            <ul style="text-align: left; display: inline-block;">
              ${possiblePaths.map(p => `<li>${p}</li>`).join('')}
            </ul>
            <p>Veuillez réinstaller l'application.</p>
          </body>
        </html>
      `;
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    }
  }
}

app.whenReady().then(async () => {
  // Initialiser DataManager (fallback JSON) et DatabaseService (SQLite)
  dataManager = new DataManager();
  console.log('DataManager initialisé');
  try {
    databaseService = require('./database');
    await databaseService.initialize();
    console.log('DatabaseService (SQLite) initialisé');
  } catch (e) {
    console.warn('SQLite non disponible, utilisation du mode JSON:', e?.message || e);
  }
  
  createWindow();

  // Auto-save des données toutes les 5 minutes
  const AUTO_SAVE_INTERVAL = 5 * 60 * 1000;
  const autosaveInterval = setInterval(() => {
    if (dataManager && mainWindow && !mainWindow.isDestroyed?.()) {
      console.log('🔄 [Auto-save] Sauvegarde périodique...');
      const result = dataManager.saveData();
      if (!result) {
        console.warn('⚠️ [Auto-save] Erreur lors de la sauvegarde');
      }
    }
  }, AUTO_SAVE_INTERVAL);

  // Nettoyer l'interval à la fermeture
  app.on('quit', () => {
    if (autosaveInterval) {
      clearInterval(autosaveInterval);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('🛑 === FERMETURE DE L\'APPLICATION ===');
  
  if (process.platform !== 'darwin') {
    try {
      // 1️⃣ Sauvegarder DataManager (JSON)
      if (dataManager) {
        console.log('💾 Sauvegarde des données (JSON)...');
        const saveResult = dataManager.saveData();
        if (saveResult) {
          console.log('✅ Données JSON sauvegardées avec succès');
          console.log(`   Fichier: ${dataManager.dataFilePath}`);
        } else {
          console.error('❌ Erreur lors de la sauvegarde JSON');
        }
      }
      
      // 2️⃣ Flush SQLite (si utilisé)
      if (databaseService && databaseService.db) {
        try {
          console.log('💾 Sauvegarde de la base SQLite...');
          databaseService.db.pragma('wal_checkpoint(FULL)');
          console.log('✅ SQLite WAL checkpointed');
          databaseService.close();
          console.log('✅ Base SQLite fermée');
        } catch (e) {
          console.error('⚠️ Erreur checkpoint SQLite:', e.message);
        }
      }
      
      console.log('✅ === FERMETURE COMPLÈTE ===\n');
    } catch (error) {
      console.error('❌ ERREUR CRITIQUE À LA FERMETURE:', error);
    }
    
    app.quit();
  }
});

// IPC Handlers pour la base de données
ipcMain.handle('db-get-users', async () => {
  console.log('IPC: db-get-users appelé');
  try {
    return dataManager.getUsers();
  } catch (error) {
    console.error('Erreur getUsers:', error);
    return [];
  }
});

ipcMain.handle('db-create-user', async (_event, userData) => {
  console.log('IPC: db-create-user appelé avec:', userData);
  try {
    const result = dataManager.createUser(userData);
    console.log('User créé avec succès');
    return result;
  } catch (error) {
    console.error('Erreur createUser:', error);
    throw error;
  }
});

ipcMain.handle('db-update-user', (event, id, userData) => {
  console.log('IPC: db-update-user appelé avec:', { id, userData });
  try {
    return dataManager.updateUser(id, userData);
  } catch (error) {
    console.error('Erreur updateUser:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-user', (event, id) => {
  console.log('IPC: db-delete-user appelé avec ID:', id);
  try {
    return dataManager.deleteUser(id);
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    throw error;
  }
});

ipcMain.handle('db-get-staff', () => {
  console.log('IPC: db-get-staff appelé');
  try {
    return dataManager.getStaff();
  } catch (error) {
    console.error('Erreur getStaff:', error);
    return [];
  }
});

ipcMain.handle('db-create-staff', (event, staffData) => {
  console.log('IPC: db-create-staff appelé avec:', staffData);
  try {
    const result = dataManager.createStaff(staffData);
    console.log('Staff créé avec succès');
    return result;
  } catch (error) {
    console.error('Erreur createStaff:', error);
    throw error;
  }
});

ipcMain.handle('db-update-staff', (event, id, staffData) => {
  console.log('IPC: db-update-staff appelé avec:', { id, staffData });
  try {
    return dataManager.updateStaff(id, staffData);
  } catch (error) {
    console.error('Erreur updateStaff:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-staff', (event, id) => {
  console.log('IPC: db-delete-staff appelé avec ID:', id);
  try {
    return dataManager.deleteStaff(id);
  } catch (error) {
    console.error('Erreur deleteStaff:', error);
    throw error;
  }
});

ipcMain.handle('db-get-themes', () => {
  console.log('IPC: db-get-themes appelé');
  try {
    return dataManager.getThemes();
  } catch (error) {
    console.error('Erreur getThemes:', error);
    return [];
  }
});

ipcMain.handle('db-create-theme', (event, themeData) => {
  console.log('IPC: db-create-theme appelé avec:', themeData);
  try {
    return dataManager.createTheme(themeData);
  } catch (error) {
    console.error('Erreur createTheme:', error);
    throw error;
  }
});

ipcMain.handle('db-update-theme', (event, id, themeData) => {
  console.log('IPC: db-update-theme appelé avec:', { id, themeData });
  try {
    return dataManager.updateTheme(id, themeData);
  } catch (error) {
    console.error('Erreur updateTheme:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-theme', (event, id) => {
  console.log('IPC: db-delete-theme appelé avec ID:', id);
  try {
    return dataManager.deleteTheme(id);
  } catch (error) {
    console.error('Erreur deleteTheme:', error);
    throw error;
  }
});

ipcMain.handle('db-create-evaluation', (event, evaluationData) => {
  console.log('IPC: db-create-evaluation appelé');
  try {
    return dataManager.createEvaluation(evaluationData);
  } catch (error) {
    console.error('Erreur createEvaluation:', error);
    throw error;
  }
});

ipcMain.handle('db-get-evaluations', () => {
  console.log('IPC: db-get-evaluations appelé');
  try {
    return dataManager.getEvaluations();
  } catch (error) {
    console.error('Erreur getEvaluations:', error);
    return [];
  }
});

ipcMain.handle('db-update-evaluation', (event, id, evaluationData) => {
  console.log('IPC: db-update-evaluation appelé');
  try {
    return dataManager.updateEvaluation(id, evaluationData);
  } catch (error) {
    console.error('Erreur updateEvaluation:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-evaluation', (event, id) => {
  console.log('IPC: db-delete-evaluation appelé avec ID:', id);
  try {
    return dataManager.deleteEvaluation(id);
  } catch (error) {
    console.error('Erreur deleteEvaluation:', error);
    throw error;
  }
});

ipcMain.handle('db-get-evaluation-stats', () => {
  console.log('IPC: db-get-evaluation-stats appelé');
  try {
    return dataManager.getEvaluationStats();
  } catch (error) {
    console.error('Erreur getEvaluationStats:', error);
    return [];
  }
});

ipcMain.handle('db-export-data', (event, type) => {
  console.log('IPC: db-export-data appelé pour type:', type);
  try {
    return dataManager.exportData(type);
  } catch (error) {
    console.error('Erreur exportData:', error);
    throw error;
  }
});

ipcMain.handle('db-import-data', (event, jsonData) => {
  console.log('IPC: db-import-data appelé');
  try {
    return dataManager.importData(jsonData);
  } catch (error) {
    console.error('Erreur importData:', error);
    throw error;
  }
});

// Staff trainings
ipcMain.handle('db-get-staff-trainings', () => {
  console.log('IPC: db-get-staff-trainings appelé');
  return dataManager.getStaffTrainings();
});

ipcMain.handle('db-get-trainings-by-staff', (event, staffId) => {
  console.log('IPC: db-get-trainings-by-staff appelé pour', staffId);
  return dataManager.getTrainingsByStaff(staffId);
});

ipcMain.handle('db-create-staff-training', (event, trainingData) => {
  console.log('IPC: db-create-staff-training appelé avec:', trainingData);
  return dataManager.createStaffTraining(trainingData);
});

ipcMain.handle('db-update-staff-training', (event, id, trainingData) => {
  console.log('IPC: db-update-staff-training appelé:', id, trainingData);
  return dataManager.updateStaffTraining(id, trainingData);
});

ipcMain.handle('db-delete-staff-training', (event, id) => {
  console.log('IPC: db-delete-staff-training appelé:', id);
  return dataManager.deleteStaffTraining(id);
});

// Contrôles de fenêtre
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    mainWindow.maximize();
  }
});

ipcMain.handle('window-unmaximize', () => {
  if (mainWindow) {
    mainWindow.unmaximize();
  }
});

ipcMain.handle('window-is-maximized', () => {
  if (mainWindow) {
    return mainWindow.isMaximized();
  }
  return false;
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});