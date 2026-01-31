/**
 * CORRECTIONS À APPLIQUER - electron/main.cjs
 * 
 * Problème: Les données ajoutées au .exe ne sont pas persistées
 * Cause: Double système (SQLite+JSON) non synchronisé + pas de sauvegarde complète
 * Solution: Unifier sur DataManager avec sauvegarde complète
 */

// ============================================================
// CORRECTION 1: Remplacer le gestionnaire de fermeture
// ============================================================

// AVANT (INCORRECT - ligne 652-658):
/*
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Sauvegarder les données avant de quitter
    if (dataManager) {
      dataManager.saveData();
    }
    app.quit();
  }
});
*/

// APRÈS (CORRECT):
app.on('window-all-closed', () => {
  console.log('🛑 === FERMETURE DE L\'APPLICATION ===');
  
  if (process.platform !== 'darwin') {
    // ✓ Sauvegarder TOUS les systèmes de données
    try {
      // 1. Sauvegarder DataManager (JSON)
      if (dataManager) {
        console.log('💾 Sauvegarde DataManager (JSON)...');
        dataManager.saveData();
        console.log('✅ DataManager sauvegardé');
      }
      
      // 2. Flush/Checkpoint DatabaseService (SQLite)
      if (databaseService && databaseService.db) {
        try {
          console.log('💾 Checkpoint SQLite WAL...');
          databaseService.db.pragma('wal_checkpoint(FULL)');
          console.log('✅ SQLite WAL checkpointed');
          
          databaseService.close();
          console.log('✅ SQLite fermé');
        } catch (e) {
          console.error('⚠️ Erreur checkpoint SQLite:', e.message);
        }
      }
      
      console.log('✅ Tous les systèmes de données fermés avec succès');
    } catch (error) {
      console.error('❌ Erreur critique à la fermeture:', error);
    }
    
    app.quit();
  }
});


// ============================================================
// CORRECTION 2: Ajouter auto-save périodique (optionnel mais recommandé)
// ============================================================

// À ajouter dans app.whenReady().then(() => { ... })
// Après createWindow();

// Auto-save toutes les 5 minutes
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000;  // 5 minutes

setInterval(() => {
  if (dataManager && !mainWindow?.isDestroyed?.()) {
    console.log('🔄 Auto-save des données...');
    dataManager.saveData();
    console.log('✅ Auto-save effectué');
  }
}, AUTO_SAVE_INTERVAL);

// Auto-save au changement de focus (quitter la fenêtre)
app.on('window-blur', () => {
  console.log('🔄 Window blur - Auto-save...');
  if (dataManager) {
    dataManager.saveData();
  }
});

// Auto-save au changement d'état de la fenêtre
if (mainWindow) {
  mainWindow.on('close', () => {
    console.log('🔄 Window close - Final save...');
    if (dataManager) {
      dataManager.saveData();
    }
  });
}


// ============================================================
// CORRECTION 3: Améliorer l'initialisation des données
// ============================================================

// Dans DataManager.initializeData(), ajouter:

initializeData() {
  try {
    // ... code existant ...
    
    // AJOUT: Vérifier et créer le dossier s'il n'existe pas
    if (!fs.existsSync(this.userDataPath)) {
      fs.mkdirSync(this.userDataPath, { recursive: true });
      console.log('✓ Dossier userData créé:', this.userDataPath);
    }

    // AJOUT: Vérifier les permissions
    try {
      fs.accessSync(this.userDataPath, fs.constants.R_OK | fs.constants.W_OK);
      console.log('✓ Dossier userData accessible en lecture/écriture');
    } catch (err) {
      console.error('⚠️ ALERTE: Pas de droits d\'écriture sur:', this.userDataPath);
      console.error('Les données ne pourront pas être sauvegardées!');
    }

    // ... reste du code ...
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des données:', error);
  }
}


// ============================================================
// CORRECTION 4: Remplacer tous les ipcMain.handle
// ============================================================

// Pattern: Tous les handlers qui font ceci:
/*
ipcMain.handle('db-get-staff', () => {
  return databaseService ? databaseService.getStaff() : dataManager.getStaff();
});
*/

// Doivent être changés en:
/*
ipcMain.handle('db-get-staff', () => {
  return dataManager.getStaff();
});
*/

// Cela concerne ces handlers:
// - db-get-users → utiliser dataManager.getUsers()
// - db-create-user → utiliser dataManager.createUser()
// - db-update-user → utiliser dataManager.updateUser()
// - db-delete-user → utiliser dataManager.deleteUser()
// - db-get-staff → utiliser dataManager.getStaff()
// - db-create-staff → utiliser dataManager.createStaff()
// - db-update-staff → utiliser dataManager.updateStaff()
// - db-delete-staff → utiliser dataManager.deleteStaff()
// - db-get-themes → utiliser dataManager.getThemes()
// - db-create-theme → utiliser dataManager.createTheme()
// - db-update-theme → utiliser dataManager.updateTheme()
// - db-delete-theme → utiliser dataManager.deleteTheme()
// - db-create-evaluation → utiliser dataManager.createEvaluation()
// - db-get-evaluations → utiliser dataManager.getEvaluations()
// - db-update-evaluation → utiliser dataManager.updateEvaluation()
// - db-delete-evaluation → utiliser dataManager.deleteEvaluation()
// - db-get-evaluation-stats → utiliser dataManager.getEvaluationStats()
// - db-export-data → utiliser dataManager.exportData()
// - db-import-data → utiliser dataManager.importData()


// ============================================================
// CORRECTION 5: Ajouter des logs de diagnostic
// ============================================================

// À la fin de DataManager.saveData():
saveData() {
  try {
    fs.writeFileSync(this.dataFilePath, JSON.stringify(this.data, null, 2));
    console.log('✅ Données sauvegardées dans:', this.dataFilePath);
    console.log('   - Users:', this.data.users?.length || 0);
    console.log('   - Staff:', this.data.staff?.length || 0);
    console.log('   - Themes:', this.data.formation_themes?.length || 0);
    console.log('   - Evaluations:', this.data.evaluations?.length || 0);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
    console.error('   Chemin tentative:', this.dataFilePath);
    return false;
  }
}


// ============================================================
// VÉRIFICATION: Ajouter au menu pour tester
// ============================================================

// Dans le menu template, ajouter un sous-menu "Debug":
{
  label: 'Debug',
  submenu: [
    {
      label: 'Chemin des données',
      click: () => {
        const { dialog } = require('electron');
        const { shell } = require('electron');
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Informations de stockage',
          message: `Données sauvegardées dans:\n${dataManager.dataFilePath}`,
          buttons: ['OK', 'Ouvrir dossier']
        }).then(({ response }) => {
          if (response === 1) {
            shell.showItemInFolder(dataManager.dataFilePath);
          }
        });
      }
    },
    {
      label: 'Forcer sauvegarde maintenant',
      click: () => {
        const saved = dataManager.saveData();
        const { dialog } = require('electron');
        dialog.showMessageBox(mainWindow, {
          type: saved ? 'info' : 'error',
          title: saved ? 'Succès' : 'Erreur',
          message: saved 
            ? `Sauvegarde réussie!\n${Object.keys(dataManager.data).map(k => `${k}: ${Array.isArray(dataManager.data[k]) ? dataManager.data[k].length : '?'}`).join('\n')}`
            : 'Erreur lors de la sauvegarde'
        });
      }
    },
    {
      label: 'Afficher données brutes',
      click: () => {
        console.log('=== DONNÉES ACTUELLES ===');
        console.log(JSON.stringify(dataManager.data, null, 2));
      }
    }
  ]
}


// ============================================================
// RÉSUMÉ DES CHANGEMENTS
// ============================================================

/*
✅ CHANGEMENTS À FAIRE:

1. Remplacer window-all-closed handler (CRITIQUE)
   → Ajouter checkpoint SQLite + sauvegarde complète
   
2. Ajouter auto-save périodique (5 minutes)
   → Évite la perte de données en cas de crash
   
3. Modifier tous les ipcMain.handle
   → Utiliser UNIQUEMENT dataManager (pas de ternaire databaseService)
   
4. Ajouter logs de diagnostic
   → Pour voir ce qui est sauvegardé
   
5. Ajouter menu Debug
   → Pour vérifier le chemin et tester la sauvegarde


⏱️ TEMPS TOTAL: 15-20 minutes pour appliquer


📋 ORDRE DES MODIFICATIONS:

1. D'abord: window-all-closed (CRITIQUE)
2. Ensuite: Tous les ipcMain.handle
3. Puis: Auto-save
4. Enfin: Logs + menu debug


⚠️ APRÈS MODIFICATIONS:
→ Recompiler: npm run build
→ Tester avec le .exe (pas en dev!)
→ Ajouter 5 données
→ Fermer l'application
→ Rouvrir et vérifier
*/
