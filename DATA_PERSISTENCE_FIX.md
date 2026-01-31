📌 DIAGNOSTIC: Données perdues après fermeture de l'application

====================================================================
PROBLÈME IDENTIFIÉ
====================================================================

Lorsque l'utilisateur ajoute des données dans l'application desktop (.exe),
puis ferme la fenêtre, toutes les données ajoutées sont perdues.

====================================================================
CAUSES PRINCIPALES IDENTIFIÉES
====================================================================

🔴 PROBLÈME 1: Double système de base de données (CONFLIT)
─────────────────────────────────────────────────────────────────
Votre application utilise DEUX systèmes de stockage:
1. DatabaseService (SQLite) - electron/database.js
2. DataManager (JSON en fichier) - electron/main.cjs

CONFLIT: Parfois SQLite est utilisé, parfois JSON, et les deux
ne sont PAS synchronisés!

Code actuel (electron/main.cjs):
```javascript
ipcMain.handle('db-create-staff', (event, staffData) => {
  console.log('IPC: db-create-staff appelé avec:', staffData);
  // Utilise databaseService si disponible, sinon DataManager
  return databaseService ? databaseService.createStaff(staffData) 
                        : dataManager.createStaff(staffData);
});
```

CONSÉQUENCE:
- Les données ajoutées vont dans SQLite OU dans JSON
- Les deux n'ont jamais les mêmes données
- À la fermeture, l'autre système est vide


🔴 PROBLÈME 2: Sauvegarde à la fermeture INCOMPLÈTE
─────────────────────────────────────────────────────────────────
electron/main.cjs (ligne 652-658):
```javascript
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (dataManager) {
      dataManager.saveData();  // ⚠️ Sauvegarde SEULEMENT DataManager
    }
    app.quit();
  }
});
```

PROBLÈME:
- Seul DataManager est sauvegardé à la fermeture
- DatabaseService (SQLite) n'est PAS flush/checkpoint
- Si SQLite était utilisé, les données sont perdues


🔴 PROBLÈME 3: Pas de flush/checkpoint SQLite
─────────────────────────────────────────────────────────────────
DatabaseService utilise SQLite avec WAL mode:
```javascript
this.db.pragma('journal_mode = WAL');  // electron/database.js
```

CONSÉQUENCE:
- Les données restent dans le fichier -wal (pas persistées sur disque)
- Besoin d'un checkpoint avant fermeture
- Actuellement aucun checkpoint à la fermeture


🔴 PROBLÈME 4: Path userData dépend du contexte Electron
─────────────────────────────────────────────────────────────────
electron/main.cjs (ligne 14):
```javascript
this.userDataPath = app.getPath('userData');
```

EN PRODUCTION (.exe):
- Windows: C:\Users\<USERNAME>\AppData\Local\<NomApp>\
- Les données sont sauvegardées là-bas

RISQUE:
- Si le chemin est temporaire ou incorrect lors du .exe
- Les fichiers ne sont jamais retrouvés au redémarrage
- Cela peut arriver avec electron-builder


====================================================================
CAUSES PROBABLES DE VOTRE PROBLÈME
====================================================================

Au ordre de probabilité:

1. 🔴 TRÈS PROBABLE: SQLite vs JSON non synchronisé
   → Données ajoutées dans SQLite
   → Données perdues parce que JSON n'était pas sauvegardé
   → Les données ne persistent pas entre redémarrage

2. 🔴 PROBABLE: Chemin userData incorrect dans le .exe
   → Les fichiers JSON sont sauvegardés au mauvais endroit
   → Ou dans un dossier temporaire qui est supprimé

3. 🟠 POSSIBLE: Pas de checkpoint SQLite à la fermeture
   → Les données restent en mémoire/WAL
   → Jamais écrites sur disque

4. 🟡 MOINS PROBABLE: Permissions disque insuffisantes
   → Le .exe n'a pas les droits d'écrire dans userData


====================================================================
SOLUTION RECOMMANDÉE (3 niveaux)
====================================================================

NIVEAU 1: DIAGNOSTIC IMMÉDIAT (5 minutes)
──────────────────────────────────────────
1. Ouvrir l'application
2. Ajouter 3 données (personnel)
3. Ouvrir le menu: "Données" → "Ouvrir dossier de données"
4. Vérifier:
   ✓ Un fichier cfp-data.json existe-t-il?
   ✓ Contient-il les 3 données ajoutées?
   ✓ Date de modification = maintenant?

Si NON:
→ Le fichier n'est PAS sauvegardé
→ C'est le problème principal!

Si OUI:
→ Les données SONT sauvegardées
→ Mais l'app ne les recharge pas au démarrage
→ Problème de lecture (vérifier DataManager.initializeData())


NIVEAU 2: FIX RAPIDE (Recommandé)
──────────────────────────────────────────
Forcer l'utilisation de DataManager UNIQUEMENT (abandon SQLite en production):

electron/main.cjs - Modifier tous les ipcMain.handle():
```javascript
// AVANT (conflit):
ipcMain.handle('db-create-staff', (event, staffData) => {
  return databaseService ? databaseService.createStaff(staffData) 
                        : dataManager.createStaff(staffData);
});

// APRÈS (fiable):
ipcMain.handle('db-create-staff', (event, staffData) => {
  return dataManager.createStaff(staffData);  // ✓ Toujours JSON
});
```

+ Ajouter checkpoint à la fermeture:
```javascript
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Sauvegarder DataManager
    if (dataManager) {
      dataManager.saveData();
    }
    // Sauvegarder DatabaseService si SQLite actif
    if (databaseService) {
      try {
        databaseService.close();  // Force save + close
      } catch (e) {}
    }
    app.quit();
  }
});
```


NIVEAU 3: FIX COMPLET (Recommandé pour production)
──────────────────────────────────────────────────────────────────
Utiliser UNIQUEMENT SQLite (meilleur que JSON pour les données):

1. Supprimer la classe DataManager complètement
2. Utiliser UNIQUEMENT databaseService partout
3. Ajouter checkpoint WAL à la fermeture:

```javascript
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (databaseService && databaseService.db) {
      try {
        databaseService.db.pragma('wal_checkpoint(FULL)');
        databaseService.close();
      } catch (e) {
        console.error('Erreur checkpoint:', e);
      }
    }
    app.quit();
  }
});
```

4. Ajouter backup automatique:
```javascript
// Tous les 5 minutes
setInterval(() => {
  if (dataManager) {
    dataManager.saveData();
    console.log('Auto-save effectué');
  }
}, 5 * 60 * 1000);
```


====================================================================
IMPLÉMENTATION RAPIDE DE LA SOLUTION
====================================================================

Option A: FIX MINIMAL (10 minutes) - RECOMMANDÉ
───────────────────────────────────────────────

Fichier: electron/main.cjs

ÉTAPE 1: Remplacer le event 'window-all-closed':
```javascript
app.on('window-all-closed', () => {
  console.log('=== FERMETURE DE L\'APPLICATION ===');
  
  if (process.platform !== 'darwin') {
    // Sauvegarder TOUS les systèmes
    if (dataManager) {
      console.log('Sauvegarde DataManager...');
      dataManager.saveData();
    }
    if (databaseService && databaseService.db) {
      try {
        console.log('Checkpoint SQLite WAL...');
        databaseService.db.pragma('wal_checkpoint(FULL)');
        databaseService.close();
      } catch (e) {
        console.error('Erreur checkpoint:', e);
      }
    }
    
    console.log('✓ Toutes les données sauvegardées');
    app.quit();
  }
});
```

ÉTAPE 2: Modifier TOUS les ipcMain.handle pour utiliser DataManager:
Remplacer:
```javascript
ipcMain.handle('db-get-staff', () => {
  return databaseService ? databaseService.getStaff() : dataManager.getStaff();
});
```

Par:
```javascript
ipcMain.handle('db-get-staff', () => {
  return dataManager.getStaff();
});
```

Faire ça pour tous les handlers (15-20 handlers)


Option B: FIX COMPLET (30 minutes) - MEILLEUR
──────────────────────────────────────────────

Remplacer COMPLÈTEMENT DataManager par DatabaseService:
- Supprimer la classe DataManager
- Utiliser UNIQUEMENT databaseService
- Ajouter migrations/backups
- Meilleur pour les données volumineuses


====================================================================
TESTS APRÈS FIX
====================================================================

1. Compiler le .exe à nouveau:
   npm run build

2. Installer le nouveau .exe

3. Ajouter 5 données personnelles

4. Fermer l'application (bouton X ou Ctrl+Q)

5. Attendre 2 secondes

6. Rouvrir l'application

7. Vérifier que les 5 données sont toujours là ✓


====================================================================
VÉRIFICATION DU CHEMIN userData
====================================================================

Ajouter ce code dans createWindow() pour voir le chemin exact:

```javascript
console.log('User data path:', dataManager.userDataPath);
console.log('Data file path:', dataManager.dataFilePath);

// Afficher aussi dans la console du menu
{
  label: 'Debug Info',
  click: () => {
    const { dialog } = require('electron');
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Chemin des données',
      message: `Données sauvegardées dans:\n${dataManager.dataFilePath}`
    });
  }
}
```

Puis vérifier que le chemin est correct:
- Windows: C:\\Users\\VotreUser\\AppData\\Local\\<NomApp>\\
- NOT: C:\\Users\\VotreUser\\AppData\\Local\\Temp\\


====================================================================
RÉCUPÉRATION DES DONNÉES PERDUES
====================================================================

Si vous avez déjà perdu des données:

1. Chercher le fichier cfp-data.json:
   - C:\\Users\\<USER>\\AppData\\Local\\CFPT-Ivato\\  (Windows)
   - ~/.config/CFPT-Ivato/  (Linux)
   - ~/Library/Application Support/CFPT-Ivato/  (Mac)

2. Ou dans les fichiers récents Windows:
   - Win+R → %APPDATA%
   - Chercher CFPT ou CFP

3. Ou chercher avec everything.exe (Windows):
   - Chercher: cfp-data.json
   - Chercher: *.db (fichiers SQLite)

4. Les données pourraient aussi être dans:
   - C:\\Users\\<USER>\\AppData\\Local\\Temp\\ (si app temp)
   - Répertoire d'installation du .exe


====================================================================
RÉSUMÉ
====================================================================

🔴 PROBLÈME: Double système (SQLite + JSON) non synchronisé

✅ SOLUTION: Utiliser UNIQUEMENT DataManager (JSON) avec sauvegarde complète à la fermeture

⏱️ TEMPS: 10-15 minutes pour le fix minimal

📋 ACTIONS:
1. Modifier electron/main.cjs (window-all-closed event)
2. Remplacer tous les ipcMain.handle pour utiliser DataManager
3. Recompiler le .exe
4. Tester avec 5 données ajoutées

⚠️ IMPORTANT: Testez le .exe créé, pas l'application en dev!


====================================================================
Besoin d'aide? Contactez-moi pour l'implémentation exacte.
