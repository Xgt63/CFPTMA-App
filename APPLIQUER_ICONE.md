# 🎨 Guide d'application de l'icône CFPT

## Problème
L'icône par défaut d'Electron apparaît au lieu de l'icône CFPT personnalisée.

## ⚠️ IMPORTANT
**L'icône n'est PAS appliquée en mode développement (`npm run electron-dev`)**. 
L'icône personnalisée n'apparaît QUE dans l'application compilée (fichier .exe).

---

## ✅ Solution : Compiler l'application

### Étape 1 : Build complet
```bash
npm run dist-win
```

Cette commande :
1. Génère les icônes
2. Compile l'application React
3. Crée l'exécutable Windows avec l'icône CFPT

### Étape 2 : Localiser l'exécutable
Après compilation, allez dans :
```
dist-electron-final-02\win-unpacked\
```

Vous y trouverez : `CFTP - Système de gestion des évaluations.exe`

### Étape 3 : Lancer l'application compilée
Double-cliquez sur le `.exe` → **L'icône CFPT sera visible** !

---

## 🔍 Vérification de l'icône

### Dans la barre des tâches Windows
- Clic droit sur l'icône
- L'icône CFPT devrait être affichée

### Dans l'explorateur Windows
- Allez dans le dossier `dist-electron-final-02\win-unpacked\`
- L'icône du fichier `.exe` devrait être CFPT

### Dans Alt+Tab
- Appuyez sur Alt+Tab
- L'icône CFPT devrait apparaître

---

## 🎨 Personnaliser l'icône

Si vous voulez une **nouvelle icône** :

### 1. Remplacer l'icône actuelle
```bash
# Copiez votre nouveau fichier icon.ico dans :
assets\icon.ico
build\icon.ico
```

**Format requis :**
- Format : `.ico` (Windows Icon)
- Tailles recommandées : 16x16, 32x32, 48x48, 256x256 pixels
- Fond transparent si possible

### 2. Recompiler
```bash
npm run dist-win
```

---

## 🛠️ Commandes utiles

### Build rapide (sans installateur)
```bash
npm run dist-win
```

### Build avec installateur NSIS
```bash
npm run build-electron
```

### Nettoyer les builds précédents
```bash
# Supprimer le dossier de build
Remove-Item -Recurse -Force "dist-electron-final-02"

# Rebuild propre
npm run dist-win
```

---

## 📝 Configuration actuelle

L'icône est configurée dans `package.json` :

```json
"build": {
  "win": {
    "icon": "assets/icon.ico"
  },
  "nsis": {
    "installerIcon": "assets/icon.ico",
    "uninstallerIcon": "assets/icon.ico"
  }
}
```

---

## ❌ Pourquoi l'icône n'apparaît pas en développement ?

En mode développement (`npm run electron-dev`), Electron utilise :
- Le processus Node.js pour lancer l'application
- L'icône par défaut d'Electron
- **C'est normal et attendu**

L'icône personnalisée n'est appliquée QUE lors de la compilation finale.

---

## ✅ Test rapide

1. **Compiler l'application :**
   ```bash
   npm run dist-win
   ```

2. **Aller dans le dossier :**
   ```
   dist-electron-final-02\win-unpacked\
   ```

3. **Lancer l'exécutable :**
   Double-clic sur `CFTP - Système de gestion des évaluations.exe`

4. **Vérifier l'icône :**
   - Regardez la barre des tâches
   - Appuyez sur Alt+Tab
   - L'icône CFPT devrait être visible

---

## 🚀 Résumé

| Mode | Icône affichée |
|------|----------------|
| `npm run electron-dev` | ❌ Icône Electron par défaut |
| `npm run dist-win` + `.exe` | ✅ Icône CFPT personnalisée |

**Pour voir l'icône CFPT, vous DEVEZ compiler l'application !**
