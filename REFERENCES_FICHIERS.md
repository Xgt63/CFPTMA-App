# 🔗 Références - Fichiers du Projet à Consulter

## 📂 Structure du Projet (Fichiers Concernés)

```
project/
├── electron/
│   ├── main.cjs                    ← ⚠️ À MODIFIER (3 sections)
│   ├── database.js                 ← À vérifier (SQLite, peut rester)
│   ├── preload.js                  ← Peut rester inchangé
│   └── memory-database.js          ← Fallback, peut rester
│
├── src/
│   ├── components/                 ← Pas d'impact
│   ├── pages/                      ← Pas d'impact
│   └── services/                   ← À vérifier (appels API)
│
├── data/                           ← Où sont stockées les données JSON
│   ├── cfp-data.json              ← Fichier créé après fix
│   ├── staff.json                 ← Données export
│   └── themes.json                ← Données export
│
└── package.json                    ← Peut rester inchangé
```

---

## 📝 Fichier Principal à Modifier: electron/main.cjs

### Localisation des sections à remplacer:

**SECTION 1: Gestionnaire window-all-closed**
```
Ligne: ~652-658
Chercher: app.on('window-all-closed'
Remplacer par: Code de EXEMPLE_COMPLET_CORRECTION.js → Section 1
```

**SECTION 2: Auto-save (à AJOUTER)**
```
Ligne: Après createWindow() mais avant app.on('activate')
Ajouter le code de: EXEMPLE_COMPLET_CORRECTION.js → Section 2
```

**SECTION 3: Tous les ipcMain.handle**
```
Lignes: ~663-765
Chercher: ipcMain.handle('db-*', ...)
Remplacer tous par: Code de EXEMPLE_COMPLET_CORRECTION.js → Section 3
```

---

## 🔍 Autres Fichiers à Vérifier (Pas de modification nécessaire)

### electron/database.js (SQLite)
- **Statut:** Peut rester (pas utilisé après le fix)
- **Raison:** Après unification sur DataManager, SQLite devient facultatif
- **Action:** Aucune (ou supprimer si simplification souhaitée)

### electron/preload.js
- **Statut:** Aucune modification nécessaire
- **Raison:** L'interface IPC reste la même
- **Remarque:** Les canaux IPC (db-create-staff, etc) sont les mêmes

### electron/memory-database.js
- **Statut:** Aucune modification nécessaire
- **Raison:** C'est un fallback si SQLite échoue
- **Remarque:** Peut rester comme secours

### src/services/authService.ts (ou équivalent)
- **Statut:** À vérifier (pas de modification critique)
- **Raison:** Les appels API restent identiques
- **Action:** Si erreurs, vérifier que les handlers IPC existent

### src/components/* & src/pages/*
- **Statut:** Aucune modification nécessaire
- **Raison:** Les appels à electronAPI restent identiques
- **Remarque:** Aucun changement dans la logique métier

### package.json
- **Statut:** Aucune modification nécessaire
- **Raison:** Les dépendances ne changent pas
- **Dépendances importantes:**
  - electron (principal)
  - better-sqlite3 (optionnel après fix)

---

## 🎯 Ordre de Vérification

### 1️⃣ Fichier Central: electron/main.cjs
```javascript
// Points clés à vérifier:

1. DataManager class existe?
   ✓ class DataManager { ... }

2. DataManager.saveData() fonctionne?
   ✓ fs.writeFileSync(this.dataFilePath, ...)

3. app.on('window-all-closed') sauvegarde?
   ❌ AVANT: Seulement dataManager.saveData()
   ✓ APRÈS: dataManager.saveData() + databaseService.close()

4. ipcMain.handle utilisent dataManager?
   ❌ AVANT: databaseService ? ... : dataManager
   ✓ APRÈS: return dataManager...
```

### 2️⃣ Point de Sauvegarde: data/cfp-data.json
```
Créé à: C:\Users\<USER>\AppData\Local\<NomApp>\cfp-data.json
Contient: { users: [], staff: [], formation_themes: [], ... }
Mis à jour: À chaque création/modification de données
Sauvegardé à: Fermeture de l'app
```

### 3️⃣ Vérification Post-Implémentation
```
Exécuter: node verify-persistence.js
Chercher: Tous les checks = ✅ (vert)
Score minimum: 80%
```

---

## 💾 Détail des Données Sauvegardées

### DataManager.data (JSON)
```javascript
{
  users: [
    {
      id: 1,
      firstName: "Admin",
      lastName: "CFP",
      email: "admin@cfp.com",
      role: "admin",
      createdAt: "2025-..."
    }
  ],
  staff: [
    {
      id: 1,
      matricule: "MAT001",
      firstName: "Jean",
      lastName: "Dupont",
      // ... 8 champs
    }
  ],
  formation_themes: [
    {
      id: 1,
      name: "Leadership",
      description: "...",
      createdAt: "..."
    }
  ],
  evaluations: [
    {
      id: 1,
      staffId: 1,
      // ... 140+ champs!
    }
  ],
  staff_trainings: [
    {
      id: 1,
      staffId: 1,
      themeId: 1,
      status: "active",
      // ...
    }
  ]
}
```

**Fichier:** `cfp-data.json`  
**Emplacement:** `C:\Users\<USER>\AppData\Local\<NomApp>\cfp-data.json`  
**Taille:** ~1-50 MB selon les données  
**Format:** JSON lisible (indentation 2 espaces)

---

## 🔐 Points Critiques du Code

### ⚠️ TERNAIRE DANGEREUSE (À REMPLACER)
```javascript
// ❌ PROBLÉMATIQUE - Choisit aléatoirement SQLite ou JSON
return databaseService ? databaseService.getStaff() : dataManager.getStaff();

// ✓ CORRECT - Toujours JSON
return dataManager.getStaff();
```

Occurrences à remplacer: ~20 handlers

### 🔴 MANQUE À LA FERMETURE (À AJOUTER)
```javascript
// ❌ INCOMPLET - Seul JSON sauvegardé
if (dataManager) {
  dataManager.saveData();
}

// ✓ COMPLET - JSON + SQLite sauvegardés
if (dataManager) {
  dataManager.saveData();
}
if (databaseService && databaseService.db) {
  databaseService.db.pragma('wal_checkpoint(FULL)');
  databaseService.close();
}
```

### 📍 CHEMIN CRITIQUE
```javascript
// DOIT utiliser app.getPath('userData')
this.userDataPath = app.getPath('userData');
this.dataFilePath = path.join(this.userDataPath, 'cfp-data.json');

// ✓ CORRECT: Les données se trouvent à:
// C:\Users\<USER>\AppData\Local\<NomApp>\cfp-data.json

// ❌ INCORRECT: Chemins relatifs ou temp
// C:\temp\data.json     ← Peut être supprimé
// ./data/data.json      ← Relatif au .exe, changeant
```

---

## 🧪 Étapes de Vérification

### Avant modification:
```bash
# 1. Vérifier que main.cjs est trouvé
ls -la electron/main.cjs

# 2. Compter les handlers
grep -c "ipcMain.handle" electron/main.cjs
# Devrait afficher: ~20

# 3. Chercher les ternaires
grep -c "databaseService ?" electron/main.cjs
# Devrait afficher: ~20 (à remplacer)
```

### Après modification:
```bash
# 1. Vérifier qu'il n'y a plus de ternaires
grep "databaseService ?" electron/main.cjs
# Ne devrait rien afficher (ou seulement dans commentaires)

# 2. Vérifier que saveData est appelée
grep "saveData()" electron/main.cjs
# Devrait afficher: 2+ occurrences (dans handler + fermeture)

# 3. Compiler et tester
npm run build
```

---

## 🎯 Checklist de Modification

- [ ] Ouvrir electron/main.cjs
- [ ] Lire et comprendre la classe DataManager
- [ ] Copier Section 1 de EXEMPLE_COMPLET_CORRECTION.js
- [ ] Trouver app.on('window-all-closed') ligne ~652
- [ ] Remplacer complètement le handler (5-10 lignes)
- [ ] Sauvegarder et fermer le fichier
- [ ] Rouvrir electron/main.cjs
- [ ] Copier tous les ipcMain.handle de Section 3
- [ ] Trouver la première occurrence ligne ~663
- [ ] Remplacer TOUS les handlers (section 663-765, ~20 handlers)
- [ ] Ajouter Section 2 (auto-save) après createWindow()
- [ ] Vérifier la syntaxe (pas d'erreurs visibles)
- [ ] Sauvegarder et compiler
- [ ] npm run build
- [ ] Tester avec le .exe

---

## 📊 Comparaison Avant/Après

### AVANT (Problématique)

**electron/main.cjs:**
```
❌ app.on('window-all-closed') sauvegarde SEULEMENT JSON
❌ ipcMain.handle utilisent des ternaires
❌ SQLite jamais flush
❌ Données perdues aléatoirement
```

**Résultat:**
- User ajoute données
- Vont dans SQLite OU JSON
- Fermeture → seul JSON sauvegardé
- Données dans SQLite = perdues

### APRÈS (Corrigé)

**electron/main.cjs:**
```
✓ app.on('window-all-closed') sauvegarde JSON + SQLite
✓ ipcMain.handle utilisent dataManager directement
✓ SQLite flush au fermeture
✓ Toutes les données persistées
```

**Résultat:**
- User ajoute données
- Vont TOUJOURS dans JSON
- Fermeture → JSON + SQLite sauvegardés
- Données persistent ✓

---

## 🔗 Ressources Référencées

### Fichiers du Projet:
- `electron/main.cjs` - Fichier principal à modifier
- `electron/database.js` - DatabaseService (SQLite)
- `electron/preload.js` - API Electron exposée
- `data/cfp-data.json` - Fichier de données sauvegardé

### Fichiers de Référence Créés:
- `EXEMPLE_COMPLET_CORRECTION.js` - Code à copier-coller
- `DATA_PERSISTENCE_FIX.md` - Diagnostic complet
- `verify-persistence.js` - Script de vérification

### Documentation Electron:
- app.getPath('userData')
- ipcMain.handle()
- app.on('window-all-closed')
- BrowserWindow.close()

---

**Fin des références**
