const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const databaseService = require('./electron/database');

let mainWindow;

// 🎨 Fonction pour obtenir l'icône CFPT depuis assets/
function findIcon() {
  // Chemins à tester dans l'ordre de priorité
  const possiblePaths = [
    // Mode développement
    path.join(__dirname, 'assets', 'icon.ico'),
    path.join(__dirname, 'build', 'icon.ico'),
    // Mode production
    path.join(process.resourcesPath, 'assets', 'icon.ico'),
    path.join(process.resourcesPath, 'build', 'icon.ico'),
    // Fallback
    path.join(__dirname, '..', 'assets', 'icon.ico')
  ];
    
  for (const iconPath of possiblePaths) {
    try {
      if (fs.existsSync(iconPath)) {
        console.log(`🎨 Icône CFPT trouvée: ${iconPath}`);
        return iconPath;
      }
    } catch (error) {
      // Continuer avec le prochain chemin
    }
  }
  
  console.warn('⚠️ Aucune icône CFPT trouvée dans les chemins testés');
  console.warn('   Chemins testés:', possiblePaths);
  return null;
}

/**
 * 🔄 Migration automatique des données au démarrage (intégrée)
 */
async function performDataMigrationIfNeeded() {
  try {
    console.log('🔄 Vérification des données au démarrage...');
    
    const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Employee Evaluation System');
    const migrationFile = path.join(userDataPath, 'migration.json');
    
    // Vérifier si une migration a déjà été effectuée
    if (fs.existsSync(migrationFile)) {
      console.log('✅ Migration déjà effectuée, continuer normalement');
      return;
    }
    
    console.log('💾 Recherche des anciennes installations...');
    
    // Chemins possibles des anciennes installations
    const possiblePaths = [
      path.join(os.homedir(), 'AppData', 'Roaming', 'employee-evaluation-system'),
      path.join(os.homedir(), 'AppData', 'Roaming', 'CFP Manager'),
      path.join(os.homedir(), 'AppData', 'Roaming', 'Employee Evaluation System'),
      path.join(os.homedir(), 'AppData', 'Roaming', 'CFPT Ivato - Système d\'Evaluation'),
      path.join(os.homedir(), 'Documents', 'Gestion Personnel'),
      path.join(os.homedir(), 'Documents', 'Employee Evaluation')
    ];
    
    let foundData = {
      staff: [],
      evaluations: [],
      themes: []
    };
    
    let foundOldData = false;
    
    // Rechercher dans les chemins possibles
    for (const oldPath of possiblePaths) {
      if (fs.existsSync(oldPath)) {
        try {
          const files = fs.readdirSync(oldPath);
          
          // Chercher les fichiers JSON de données
          for (const file of files) {
            const filePath = path.join(oldPath, file);
            
            if (file.endsWith('.json')) {
              try {
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                
                if (file.includes('staff') || file.includes('personnel')) {
                  if (Array.isArray(data)) {
                    foundData.staff = [...foundData.staff, ...data];
                    foundOldData = true;
                  }
                } else if (file.includes('evaluation')) {
                  if (Array.isArray(data)) {
                    foundData.evaluations = [...foundData.evaluations, ...data];
                    foundOldData = true;
                  }
                } else if (file.includes('theme')) {
                  if (Array.isArray(data)) {
                    foundData.themes = [...foundData.themes, ...data];
                    foundOldData = true;
                  }
                }
              } catch (jsonError) {
                // Ignorer les fichiers JSON non valides
              }
            }
          }
        } catch (dirError) {
          // Ignorer les erreurs d'accès aux répertoires
        }
      }
    }
    
    if (foundOldData) {
      // Créer le répertoire de données s'il n'existe pas
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
      
      // Sauvegarder les données migrées
      if (foundData.staff.length > 0) {
        fs.writeFileSync(path.join(userDataPath, 'staff.json'), JSON.stringify(foundData.staff, null, 2));
      }
      if (foundData.evaluations.length > 0) {
        fs.writeFileSync(path.join(userDataPath, 'evaluations.json'), JSON.stringify(foundData.evaluations, null, 2));
      }
      if (foundData.themes.length > 0) {
        fs.writeFileSync(path.join(userDataPath, 'themes.json'), JSON.stringify(foundData.themes, null, 2));
      }
      
      // Créer le fichier de migration pour éviter les migrations futures
      const migrationInfo = {
        migrationDate: new Date().toISOString(),
        migratedData: {
          staff: foundData.staff.length,
          evaluations: foundData.evaluations.length,
          themes: foundData.themes.length
        }
      };
      fs.writeFileSync(migrationFile, JSON.stringify(migrationInfo, null, 2));
      
      console.log('✅ Migration terminée avec succès');
    } else {
      console.log('ℹ️ Aucune donnée d\'ancienne version trouvée - Installation propre');
      
      // Créer quand même le fichier de migration pour éviter les vérifications futures
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
      const migrationInfo = {
        migrationDate: new Date().toISOString(),
        migratedData: { staff: 0, evaluations: 0, themes: 0 }
      };
      fs.writeFileSync(migrationFile, JSON.stringify(migrationInfo, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    // Ne pas empêcher l'application de démarrer
  }
}

// 🛡️ Sentry (optionnel) et Auto-Update
try {
  if (process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/electron');
    Sentry.init({ dsn: process.env.SENTRY_DSN });
  }
} catch {}

const { autoUpdater } = (()=>{ try { return require('electron-updater'); } catch(e){ return { autoUpdater: { checkForUpdatesAndNotify: ()=>{} } }; } })();

// 🪟 Création de la fenêtre principale
async function createWindow() {
  // Effectuer la migration des données si nécessaire
  await performDataMigrationIfNeeded();
  
  // Définir l'AppUserModelID pour l'icône barre des tâches Windows
  try {
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.employee-evaluation-system');
    }
  } catch {}

  const icon = findIcon();

  // Create the browser window avec icône CFPT
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    icon: icon, // Icône CFPT directe
    frame: false, // Remove default frame
    titleBarStyle: 'hiddenInset', // Better for Windows
    resizable: true,
    maximizable: true,
    minimizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true, // Hardened for production (dev server still allowed via CSP)
      preload: path.join(__dirname, 'electron', 'preload.js'),
      sandbox: true
    },
    show: false, // Don't show until ready
    backgroundColor: '#f0f4f8' // Set background color
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    // DevTools désactivés par défaut - F12 pour ouvrir manuellement
  } else {
    // En mode production, chercher dist/index.html
    // Avec asarUnpack, les fichiers sont dans: __dirname/app/dist/index.html
    // Ou dans: process.resourcesPath/app/dist/index.html (dans l'asar)
    
    const possiblePaths = [
      // Mode production normal
      path.join(__dirname, 'dist', 'index.html'),
      // Depuis win-unpacked
      path.join(__dirname, '..', 'dist', 'index.html'),
      // Depuis resources avec asarUnpack
      path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
      // Fallback resources
      path.join(process.resourcesPath, 'dist', 'index.html')
    ];
    
    console.log('🔍 Mode Production - Recherche dist/index.html');
    console.log('   __dirname:', __dirname);
    console.log('   resourcesPath:', process.resourcesPath);
    
    let loaded = false;
    
    for (const indexPath of possiblePaths) {
      console.log(`📁 Essai: ${indexPath}`);
      try {
        if (fs.existsSync(indexPath)) {
          console.log(`✅ Trouvé! Chargement depuis: ${indexPath}`);
          mainWindow.loadFile(indexPath);
          loaded = true;
          break;
        }
      } catch (e) {
        console.error(`❌ Erreur: ${e.message}`);
      }
    }
    
    if (!loaded) {
      console.error('🔴 ERREUR CRITIQUE: index.html non trouvé!');
      
      // Afficher diagnostics
      try {
        const resourcesPath = process.resourcesPath;
        const resourcesContent = fs.readdirSync(resourcesPath);
        console.error('   Contenu de resourcesPath:', resourcesContent);
        
        if (resourcesContent.includes('app.asar')) {
          console.error('   ✓ app.asar trouvé');
        }
        if (resourcesContent.includes('app')) {
          const appContent = fs.readdirSync(path.join(resourcesPath, 'app'));
          console.error('   Contenu de resources/app:', appContent);
        }
      } catch (e) {
        console.error('   Impossible d\'inspecter resources:', e.message);
      }
      
      // Page d'erreur
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <title>Erreur - CFPT Manager</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
              h1 { color: #d32f2f; text-align: center; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
              code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
              ul { font-size: 14px; }
              .debug { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⚠️ Erreur de Chargement</h1>
              <p>L'interface n'a pas pu être chargée.</p>
              <p><strong>Chemins testés:</strong></p>
              <ul>
                ${possiblePaths.map(p => `<li><code>${p}</code></li>`).join('')}
              </ul>
              <div class="debug">
                <p><strong>Informations de diagnostic:</strong></p>
                <p>__dirname: <code>${__dirname}</code></p>
                <p>resourcesPath: <code>${process.resourcesPath}</code></p>
                <p>Appuyez sur <strong>F12</strong> pour voir les logs détaillés</p>
              </div>
            </div>
          </body>
        </html>
      `;
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    }
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    // Forcer l'icône sur Windows (multiples méthodes)
    if (icon && process.platform === 'win32') {
      try {
        mainWindow.setIcon(icon);
        console.log('🎨 Icône CFPT appliquée à la fenêtre');
        
        // Forcer aussi l'icône dans la barre des tâches (overlay icon)
        mainWindow.setOverlayIcon(icon, 'CFPT Ivato');
        console.log('🎨 Icône overlay appliquée à la barre des tâches');
      } catch (error) {
        console.warn('⚠️ Erreur application icône:', error.message);
      }
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 🔍 LISTENERS DE DEBUG POUR LE CHARGEMENT
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('🔴 [ERREUR] Échec du chargement de la page:', {
      errorCode,
      errorDescription,
      URL: mainWindow.webContents.getURL(),
      __dirname,
      resourcesPath: process.resourcesPath
    });
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ [SUCCESS] Page chargée avec succès!', {
      URL: mainWindow.webContents.getURL(),
      isDev: process.env.NODE_ENV === 'development'
    });
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('🔴 [CRASH] Le processus de contenu a crashé!');
    mainWindow.reload();
  });

  // Handle window maximize/unmaximize events
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized', false);
  });

  // Create application menu
  createMenu();

  // Auto-update en production
  try {
    if (process.env.NODE_ENV !== 'development') {
      autoUpdater.autoDownload = true;
      autoUpdater.checkForUpdatesAndNotify();
    }
  } catch {}
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Evaluation',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-evaluation');
          }
        },
        {
          label: 'Export Data',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-export-data');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('menu-navigate', 'dashboard');
          }
        },
        {
          label: 'Statistics',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('menu-navigate', 'statistics');
          }
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow.webContents.reloadIgnoringCache();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'À propos du Centre de Formation',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'À propos',
              message: 'Centre de Formation Professionnelle et Technique d\'Ivato',
              detail: 'Système de Gestion des Évaluations\n\nExcellence en formation professionnelle depuis 1985\n\nVersion: 2.0.3\nConstruit avec React, Vite, et Electron'
            });
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: 'About ' + app.getName(),
          role: 'about'
        },
        { type: 'separator' },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        { type: 'separator' },
        {
          label: 'Hide ' + app.getName(),
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for file operations
ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('write-file', async (event, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Window control handlers
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

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Handler pour focus de la fenêtre
ipcMain.on('focus-window', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    mainWindow.show();
  }
});

// =================================================================
// DATABASE IPC HANDLERS - Gestion asynchrone avec gestion d'erreur
// =================================================================

// Helper pour wrapper les opérations DB avec gestion d'erreur
const handleDbOperation = async (operation, operationName) => {
  try {
    // Vérifier si la base de données est disponible
    if (!global.databaseAvailable) {
      console.warn(`⚠️ ${operationName} - Base de données non disponible`);
      return { error: 'Base de données non disponible', data: [] };
    }
    
    console.log(`🔄 ${operationName} - Début`);
    const result = await operation();
    console.log(`✅ ${operationName} - Succès:`, result?.length ?? result?.id ?? 'OK');
    return result;
  } catch (error) {
    console.error(`❌ ${operationName} - Erreur:`, error.message);
    // Retourner une structure d'erreur plutôt que de throw
    return { error: error.message, data: [] };
  }
};

// Users handlers
ipcMain.handle('db-get-users', async () => {
  return handleDbOperation(() => databaseService.getUsers(), 'GET_USERS');
});

ipcMain.handle('db-create-user', async (event, userData) => {
  return handleDbOperation(
    async () => {
      const result = await databaseService.createUser(userData);
      setTimeout(() => {
        mainWindow?.webContents.send('data-updated', { type: 'users', action: 'create', data: result });
      }, 10);
      return result;
    },
    'CREATE_USER'
  );
});

ipcMain.handle('db-update-user', async (event, id, userData) => {
  return handleDbOperation(
    async () => {
      const result = await databaseService.updateUser(id, userData);
      setTimeout(() => {
        mainWindow?.webContents.send('data-updated', { type: 'users', action: 'update', data: result });
      }, 10);
      return result;
    },
    'UPDATE_USER'
  );
});

ipcMain.handle('db-delete-user', async (event, id) => {
  return handleDbOperation(
    async () => {
      const result = await databaseService.deleteUser(id);
      setTimeout(() => {
        mainWindow?.webContents.send('data-updated', { type: 'users', action: 'delete', data: { id } });
      }, 10);
      return result;
    },
    'DELETE_USER'
  );
});

// Staff handlers
ipcMain.handle('db-get-staff', async () => {
  return handleDbOperation(() => databaseService.getStaff(), 'GET_STAFF');
});

ipcMain.handle('db-create-staff', async (event, staffData) => {
  return handleDbOperation(
    async () => {
      const result = await databaseService.createStaff(staffData);
      setTimeout(() => {
        mainWindow?.webContents.send('data-updated', { type: 'staff', action: 'create', data: result });
      }, 10);
      return result;
    },
    'CREATE_STAFF'
  );
});

ipcMain.handle('db-update-staff', async (event, id, staffData) => {
  return handleDbOperation(
    async () => {
      const result = await databaseService.updateStaff(id, staffData);
      setTimeout(() => {
        mainWindow?.webContents.send('data-updated', { type: 'staff', action: 'update', data: result });
      }, 10);
      return result;
    },
    'UPDATE_STAFF'
  );
});

ipcMain.handle('db-delete-staff', async (event, id) => {
  return handleDbOperation(
    async () => {
      const result = await databaseService.deleteStaff(id);
      setTimeout(() => {
        mainWindow?.webContents.send('data-updated', { type: 'staff', action: 'delete', data: { id } });
      }, 10);
      return result;
    },
    'DELETE_STAFF'
  );
});

// Themes handlers
ipcMain.handle('db-get-themes', async () => {
  return handleDbOperation(() => databaseService.getThemes(), 'GET_THEMES');
});

// App Config handlers
ipcMain.handle('db-get-app-config', async () => {
  return handleDbOperation(() => databaseService.getAppConfig(), 'GET_APP_CONFIG');
});

ipcMain.handle('db-update-app-config', async (event, configData) => {
  return handleDbOperation(
    async () => {
      const result = await databaseService.updateAppConfig(configData);
      setTimeout(() => {
        mainWindow?.webContents.send('data-updated', { type: 'config', action: 'update', data: result });
      }, 10);
      return result;
    },
    'UPDATE_APP_CONFIG'
  );
});

// Audit Logs handlers
ipcMain.handle('db-create-audit-log', async (event, logData) => {
  return handleDbOperation(
    () => databaseService.createAuditLog(logData),
    'CREATE_AUDIT_LOG'
  );
});

ipcMain.handle('db-get-audit-logs', async (event, filters) => {
  return handleDbOperation(
    () => databaseService.getAuditLogs(filters || {}),
    'GET_AUDIT_LOGS'
  );
});

ipcMain.handle('db-delete-old-audit-logs', async (event, daysToKeep) => {
  return handleDbOperation(
    () => databaseService.deleteOldAuditLogs(daysToKeep || 90),
    'DELETE_OLD_AUDIT_LOGS'
  );
});

// Nouveaux canaux simples (compatibilité avec le renderer)
ipcMain.handle('getThemes', async () => {
  return handleDbOperation(() => databaseService.getThemes(), 'GET_THEMES');
});

ipcMain.handle('db-create-theme', async (event, themeData) => {
  return handleDbOperation(
    async () => {
      const result = await databaseService.createTheme(themeData);
      setTimeout(() => {
        mainWindow?.webContents.send('data-updated', { type: 'themes', action: 'create', data: result });
      }, 10);
      return result;
    },
    'CREATE_THEME'
  );
});

ipcMain.handle('db-update-theme', async (event, id, themeData) => {
  return handleDbOperation(
    async () => {
      const result = await databaseService.updateTheme(id, themeData);
      setTimeout(() => {
        mainWindow?.webContents.send('data-updated', { type: 'themes', action: 'update', data: result });
      }, 10);
      return result;
    },
    'UPDATE_THEME'
  );
});

ipcMain.handle('db-delete-theme', async (event, id) => {
  return handleDbOperation(
    async () => {
      const result = await databaseService.deleteTheme(id);
      setTimeout(() => {
        mainWindow?.webContents.send('data-updated', { type: 'themes', action: 'delete', data: { id } });
      }, 10);
      return result;
    },
    'DELETE_THEME'
  );
});

// Evaluations handlers
ipcMain.handle('db-get-evaluations', async () => {
  return handleDbOperation(() => databaseService.getEvaluations(), 'GET_EVALUATIONS');
});

// Nouveau canal simple (compatibilité avec le renderer)
ipcMain.handle('getEvaluations', async () => {
  return handleDbOperation(() => databaseService.getEvaluations(), 'GET_EVALUATIONS');
});

ipcMain.handle('db-create-evaluation', async (event, evaluationData) => {
  return handleDbOperation(
    async () => {
      const result = await databaseService.createEvaluation(evaluationData);
      setTimeout(() => {
        mainWindow?.webContents.send('data-updated', { type: 'evaluations', action: 'create', data: result });
      }, 10);
      return result;
    },
    'CREATE_EVALUATION'
  );
});

ipcMain.handle('db-update-evaluation', async (event, id, evaluationData) => {
  return handleDbOperation(
    async () => {
      const result = await databaseService.updateEvaluation(id, evaluationData);
      setTimeout(() => {
        mainWindow?.webContents.send('data-updated', { type: 'evaluations', action: 'update', data: result });
      }, 10);
      return result;
    },
    'UPDATE_EVALUATION'
  );
});

ipcMain.handle('db-delete-evaluation', async (event, id) => {
  return handleDbOperation(
    async () => {
      const result = await databaseService.deleteEvaluation(id);
      setTimeout(() => {
        mainWindow?.webContents.send('data-updated', { type: 'evaluations', action: 'delete', data: { id } });
      }, 10);
      return result;
    },
    'DELETE_EVALUATION'
  );
});

// Stats handlers
ipcMain.handle('db-get-evaluation-stats', async () => {
  return handleDbOperation(() => databaseService.getEvaluationStats(), 'GET_EVALUATION_STATS');
});

// Export/Import handlers
ipcMain.handle('db-export-data', async (event, type) => {
  return handleDbOperation(() => databaseService.exportData(type), 'EXPORT_DATA');
});

ipcMain.handle('db-import-data', async (event, jsonData) => {
  return handleDbOperation(
    async () => {
      const result = await databaseService.importData(jsonData);
      setTimeout(() => {
        mainWindow?.webContents.send('data-updated', { type: 'all', action: 'import', data: null });
      }, 50);
      return result;
    },
    'IMPORT_DATA'
  );
});

// ⚡ Lancement de l'app
app.whenReady().then(async () => {
  console.log('Application Electron démarrée');
  
  // Initialiser la base de données avec gestion d'erreur améliorée
  let databaseInitialized = false;
  try {
    await databaseService.initialize();
    console.log('✅ Base de données initialisée avec succès');
    databaseInitialized = true;
  } catch (error) {
    console.error('❌ Erreur initialisation base de données SQLite:', error.message);
    console.log('🔄 Tentative d\'activation du mode mémoire...');
    
    // Forcer le passage au mode mémoire
    try {
      databaseService.useMemoryFallback = true;
      databaseService.memoryDb = new (require('./electron/memory-database'))();
      await databaseService.memoryDb.initialize();
      databaseInitialized = true;
      console.log('✅ Mode mémoire activé avec succès');
    } catch (fallbackError) {
      console.error('❌ Échec du fallback mémoire:', fallbackError.message);
      console.log('⚠️ L\'application continuera sans base de données');
    }
  }
  
  // Stocker l'état de la DB pour usage ultérieur
  global.databaseAvailable = databaseInitialized;
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('Fermeture de l\'application Electron');
  
  // Fermer la base de données proprement si disponible
  if (global.databaseAvailable) {
    try {
      databaseService.close();
      console.log('✅ Base de données fermée proprement');
    } catch (error) {
      console.error('❌ Erreur fermeture base de données:', error);
    }
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    navigationEvent.preventDefault();
    shell.openExternal(navigationURL);
  });
});

// Auto-updater events (for future implementation)
app.on('ready', () => {
  console.log('Employee Evaluation System is ready!');
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // On certificate error we disable default behavior (stop loading the page)
  // and we then say "it is all fine - true" to the callback
  event.preventDefault();
  callback(true);
});