/**
 * EXEMPLE COMPLET DE CORRECTION - electron/main.cjs
 * 
 * Remplacer les 3 sections clés de votre main.cjs par ce code
 */

// ============================================================
// SECTION 1: Améliorer le gestionnaire de fermeture (CRITICAL)
// ============================================================
// À REMPLACER ligne ~652-658

// NOUVEAU CODE COMPLET:

app.on('window-all-closed', () => {
  console.log('🛑 === APPLICATION EN FERMETURE ===');
  
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


// ============================================================
// SECTION 2: Ajouter auto-save périodique
// ============================================================
// À AJOUTER dans app.whenReady().then(async () => { ... })
// Après createWindow(); mais avant app.on('activate', ...)

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


// ============================================================
// SECTION 3: Remplacer TOUS les ipcMain.handle
// ============================================================
// À REMPLACER ligne ~663-765

// Pattern simple: Utiliser UNIQUEMENT dataManager

// UTILISATEURS
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
    console.log('User créé avec ID:', result.lastInsertRowid);
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

// PERSONNEL (STAFF)
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
    console.log('Staff créé:', result);
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

// THÈMES DE FORMATION
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

// ÉVALUATIONS
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

// EXPORT/IMPORT
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

// FORMATIONS DU PERSONNEL (STAFF TRAININGS)
ipcMain.handle('db-get-staff-trainings', () => {
  console.log('IPC: db-get-staff-trainings appelé');
  try {
    return dataManager.getStaffTrainings();
  } catch (error) {
    console.error('Erreur getStaffTrainings:', error);
    return [];
  }
});

ipcMain.handle('db-get-trainings-by-staff', (event, staffId) => {
  console.log('IPC: db-get-trainings-by-staff appelé pour', staffId);
  try {
    return dataManager.getTrainingsByStaff(staffId);
  } catch (error) {
    console.error('Erreur getTrainingsByStaff:', error);
    return [];
  }
});

ipcMain.handle('db-create-staff-training', (event, trainingData) => {
  console.log('IPC: db-create-staff-training appelé avec:', trainingData);
  try {
    return dataManager.createStaffTraining(trainingData);
  } catch (error) {
    console.error('Erreur createStaffTraining:', error);
    throw error;
  }
});

ipcMain.handle('db-update-staff-training', (event, id, trainingData) => {
  console.log('IPC: db-update-staff-training appelé:', id, trainingData);
  try {
    return dataManager.updateStaffTraining(id, trainingData);
  } catch (error) {
    console.error('Erreur updateStaffTraining:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-staff-training', (event, id) => {
  console.log('IPC: db-delete-staff-training appelé:', id);
  try {
    return dataManager.deleteStaffTraining(id);
  } catch (error) {
    console.error('Erreur deleteStaffTraining:', error);
    throw error;
  }
});


// ============================================================
// BONUS: Améliorer saveData() dans DataManager
// ============================================================

// Remplacer la méthode saveData() de la classe DataManager:

saveData() {
  try {
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(this.userDataPath)) {
      fs.mkdirSync(this.userDataPath, { recursive: true });
    }

    // Écrire les données
    fs.writeFileSync(this.dataFilePath, JSON.stringify(this.data, null, 2), 'utf8');
    
    // Log détaillé
    const stats = {
      users: this.data.users?.length || 0,
      staff: this.data.staff?.length || 0,
      themes: this.data.formation_themes?.length || 0,
      evaluations: this.data.evaluations?.length || 0,
      trainings: this.data.staff_trainings?.length || 0
    };
    
    console.log(`✅ Données sauvegardées (${new Date().toLocaleTimeString()})`);
    console.log(`   📁 ${this.dataFilePath}`);
    console.log(`   👥 Users: ${stats.users}`);
    console.log(`   👔 Staff: ${stats.staff}`);
    console.log(`   📚 Themes: ${stats.themes}`);
    console.log(`   📋 Evaluations: ${stats.evaluations}`);
    console.log(`   📖 Trainings: ${stats.trainings}`);
    
    return true;
  } catch (error) {
    console.error('❌ ERREUR SAUVEGARDE:', error.message);
    console.error('   📁 Chemin tentative:', this.dataFilePath);
    console.error('   💡 Vérifiez les permissions d\'écriture');
    return false;
  }
}


// ============================================================
// ÉTAPES D'IMPLÉMENTATION
// ============================================================

/*
1. COPIER ce fichier: EXEMPLE_COMPLET_CORRECTION.js

2. REMPLACER dans electron/main.cjs:
   - Lines 652-658: Gestionnaire 'window-all-closed' → Utiliser Section 1
   - Lines 627-650: Ajouter dans createWindow() → Utiliser Section 2
   - Lines 663-765: Tous les ipcMain.handle → Utiliser Section 3
   - DataManager.saveData() → Utiliser saveData() du BONUS

3. COMPILER:
   npm run build

4. TESTER:
   - Lancer le .exe
   - Ajouter 5 données (personnel)
   - Fermer l'application
   - Rouvrir et vérifier

5. VÉRIFIER:
   - Les données sont présentes ✓
   - Console affiche les logs de sauvegarde ✓
   - Fichier cfp-data.json a une date récente ✓
*/
