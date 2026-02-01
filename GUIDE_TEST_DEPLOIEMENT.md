# 🚀 Guide de Test et Déploiement - Correction Écran Blanc

## 📋 Checklist de Déploiement

### **Phase 1: Préparation**
- [ ] Vérifier que tous les changements sont enregistrés
- [ ] Nettoyer les caches
- [ ] Vérifier que `npm install` est à jour

```bash
cd c:\Users\mada-\Documents\app
npm install
```

### **Phase 2: Build Vite**
- [ ] Construire l'application Vite (frontend)
- [ ] Vérifier que `dist/index.html` existe
- [ ] Vérifier que les assets sont présents

```bash
npm run build
ls -la dist/
```

**Résultat attendu:**
```
dist/
  ├── index.html         ✅ Doit exister
  ├── assets/            ✅ Dossier d'assets
  │   ├── index-*.js
  │   ├── index-*.css
  │   └── ...
  └── ...
```

### **Phase 3: Test en Mode Développement**
- [ ] Lancer le mode développement complet
- [ ] Vérifier que l'interface s'affiche
- [ ] Tester les fonctionnalités principales

```bash
npm run electron-dev
```

**Checklist de test:**
- [ ] La fenêtre s'ouvre sans erreur
- [ ] La page de connexion s'affiche
- [ ] Les styles CSS sont appliqués
- [ ] Les images s'affichent
- [ ] Les logs console ne montrent pas d'erreurs critiques

### **Phase 4: Test en Mode Production (avant .exe)**
- [ ] Construire avec Electron
- [ ] Tester l'exe en mode "unpacked"

```bash
npm run electron
```

**Checklist de test:**
- [ ] La fenêtre s'ouvre (pas de démarrage Vite dev)
- [ ] L'interface s'affiche complètement
- [ ] Pas d'écran blanc ou gris
- [ ] Les logs montrent `✅ Page chargée avec succès!`

### **Phase 5: Génération de l'Exe**
- [ ] Générer l'installer Windows
- [ ] Vérifier que la taille est raisonnable

```bash
npm run dist-win
```

**Résultat attendu:**
```
dist-electron/
  └── CFPT - Système de gestion des évaluations Setup 2.2.1.exe  (~100-150 MB)
```

### **Phase 6: Test de l'Exe**
**Avant installation:**
- [ ] Exécuter l'exe depuis son emplacement
- [ ] Vérifier l'écran d'installation

**Après installation:**
- [ ] Lancer l'application depuis le bureau ou le menu Démarrer
- [ ] Vérifier que l'interface s'affiche
- [ ] Tester les principales fonctionnalités

**En cas d'écran blanc:**
1. Appuyer sur F12 pour ouvrir DevTools
2. Consulter les logs (onglet Console)
3. Vérifier les logs du système dans:
   - `%APPDATA%\CFPT - Système de gestion des évaluations\`
   - Ou `%LOCALAPPDATA%\CFPT - Système de gestion des évaluations\`

---

## 🔍 Diagnostic en cas de Problème

### **Problème: Écran blanc**

**Étape 1: Vérifier les logs**
```bash
# Sur Windows
$logPath = "$env:APPDATA\CFPT - Système de gestion des évaluations"
Get-ChildItem $logPath -Recurse -Filter "*.log"
```

**Étape 2: Activer DevTools (F12)**
- Ouvrir DevTools avec F12
- Consulter l'onglet Console
- Chercher les erreurs en rouge

**Étape 3: Vérifier les chemins**
Dans la console (DevTools > Console):
```javascript
console.log('__dirname:', process.env.__dirname);
console.log('resourcesPath:', process.resourcesPath);
```

**Étape 4: Vérifier les fichiers packagés**
Extraire l'exe et vérifier:
1. Naviguer vers `C:\Program Files\CFPT - Système de gestion des évaluations`
2. Vérifier qu'un dossier `resources` existe
3. Vérifier que `dist/index.html` est présent

### **Problème: Styles CSS non appliqués**

1. Vérifier dans DevTools que les fichiers CSS sont chargés (onglet Network)
2. Vérifier la CSP (Content Security Policy) dans les headers
3. Vérifier que les chemins sont relatifs (pas absolus)

```javascript
// ✅ BON - Chemins relatifs
<link href="./assets/index-*.css">
<script src="./assets/index-*.js"></script>

// ❌ MAUVAIS - Chemins absolus
<link href="/assets/index-*.css">
<script src="/assets/index-*.js"></script>
```

### **Problème: Images non chargées**

1. Vérifier que `assets/**/*` est inclus dans [electron-builder.config.js](electron-builder.config.js#L17)
2. Vérifier les chemins des images en HTML
3. Chercher les erreurs dans DevTools > Network

---

## 📊 Fichiers de Configuration Clés

| Fichier | Rôle | Vérification |
|---------|------|-------------|
| [vite.config.mjs](vite.config.mjs) | Config Vite | `base: './'` pour chemins relatifs |
| [electron-builder.config.js](electron-builder.config.js) | Config packaging | Inclut `dist/**/*`, `assets/**/*`, `package.json` |
| [main.js](main.js#L216-L269) | Chargement HTML | 5 chemins de fallback testés |
| [package.json](package.json#L10-L15) | Scripts npm | Scripts `build`, `dist-win`, `electron` |

---

## 🎯 Commandes Rapides

```bash
# Développement complet (Vite + Electron)
npm run electron-dev

# Build pour production
npm run build

# Test en production (sans Vite dev server)
npm run electron

# Générer l'exe Windows
npm run dist-win

# Nettoyer et rebuild complet
rm -rf dist dist-electron node_modules && npm install && npm run build && npm run dist-win
```

---

## ✅ Validation Finale

Avant de déployer en production, vérifier:

- [ ] L'interface s'affiche sans écran blanc
- [ ] Les logs montrent `✅ [SUCCESS] Page chargée`
- [ ] Les styles CSS sont appliqués
- [ ] Les images s'affichent
- [ ] La navigation fonctionne
- [ ] Les données se chargent correctement
- [ ] Aucune erreur en rouge dans DevTools
- [ ] L'icône CFPT s'affiche correctement

---

## 📞 Support

Si le problème persiste:

1. Consulter [DIAGNOSTIC_ECRAN_BLANC.md](DIAGNOSTIC_ECRAN_BLANC.md)
2. Consulter [SOLUTION_ECRAN_BLANC.md](SOLUTION_ECRAN_BLANC.md)
3. Vérifier les changements récents dans [main.js](main.js) et [electron-builder.config.js](electron-builder.config.js)
4. Vérifier les logs système de l'application

---

**Date de création**: 1er Février 2026  
**Version**: 2.2.1  
**Status**: ✅ Prêt pour test
