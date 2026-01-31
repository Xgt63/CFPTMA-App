const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // Créer la fenêtre principale avec paramètres simplifiés
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    show: false
  });

  // Charger l'application
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Mode développement - Chargement de http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    // Ouvrir les DevTools automatiquement
    mainWindow.webContents.openDevTools();
  } else {
    console.log('📦 Mode production - Chargement depuis dist/');
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Afficher la fenêtre quand elle est prête
  mainWindow.once('ready-to-show', () => {
    console.log('✅ Fenêtre prête - Affichage');
    mainWindow.show();
    mainWindow.focus();
  });

  // Gérer la fermeture
  mainWindow.on('closed', () => {
    console.log('🔒 Fenêtre fermée');
    mainWindow = null;
  });

  // Créer un menu simple
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Quitter',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Développement',
      submenu: [
        {
          label: 'Ouvrir DevTools',
          accelerator: 'F12',
          click: () => mainWindow.webContents.openDevTools()
        },
        {
          label: 'Recharger',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload()
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Log des événements de navigation
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('📄 Page chargée:', mainWindow.webContents.getURL());
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Échec du chargement:', errorCode, errorDescription);
  });
}

// Démarrage de l'application
app.whenReady().then(() => {
  console.log('🚀 Application Electron démarrée en mode TEST');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('👋 Fermeture de toutes les fenêtres');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Logging pour debug
app.on('ready', () => {
  console.log('✅ App ready event fired');
});

process.on('uncaughtException', (error) => {
  console.error('💥 Erreur non gérée:', error);
});