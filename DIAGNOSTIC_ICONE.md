# 🔍 Diagnostic de l'icône CFPT

## ⚡ Test rapide (30 secondes)

Ouvrez PowerShell dans ce dossier et tapez :

```powershell
.\test-icone.ps1
```

Choisissez l'option **1** pour lancer l'application compilée avec l'icône CFPT.

---

## 🎯 Comprendre le problème

### ❌ Icône par défaut d'Electron affichée

**CAUSES POSSIBLES :**

1. **Vous êtes en mode développement** (`npm run electron-dev`)
   - ✅ **Solution :** C'est NORMAL ! L'icône personnalisée n'apparaît que dans l'application compilée
   - 🚀 **Action :** Compilez avec `npm run dist-win` et lancez le `.exe`

2. **Vous n'avez pas recompilé après avoir ajouté/modifié l'icône**
   - ✅ **Solution :** Recompilez l'application
   - 🚀 **Action :** `npm run dist-win`

3. **Le cache Windows affiche l'ancienne icône**
   - ✅ **Solution :** Vider le cache des icônes Windows
   - 🚀 **Action :** Voir section "Vider le cache" ci-dessous

4. **L'icône .ico est invalide ou corrompue**
   - ✅ **Solution :** Remplacer par une nouvelle icône valide
   - 🚀 **Action :** Voir section "Créer une nouvelle icône"

---

## 🛠️ Solutions détaillées

### Solution 1 : Lancer l'application compilée

```powershell
# Lancer l'exécutable
Start-Process "dist-electron-final-02\win-unpacked\CFTP - Système de gestion des évaluations.exe"
```

L'icône CFPT devrait apparaître dans :
- ✅ La barre des tâches
- ✅ Alt+Tab
- ✅ Le gestionnaire des tâches
- ✅ L'explorateur de fichiers (sur le .exe)

### Solution 2 : Recompiler l'application

```powershell
# Build complet
npm run dist-win

# Ou avec nettoyage préalable
Remove-Item -Recurse -Force "dist-electron-final-02"
npm run dist-win
```

### Solution 3 : Vider le cache des icônes Windows

Si l'ancienne icône persiste :

```powershell
# Méthode 1 : Script automatique
ie4uinit.exe -show

# Méthode 2 : Redémarrer l'explorateur
taskkill /f /im explorer.exe
Start-Process explorer.exe

# Méthode 3 : Supprimer le cache manuellement
Remove-Item "$env:LOCALAPPDATA\IconCache.db" -Force
Remove-Item "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache*" -Force
```

Puis **redémarrez l'ordinateur**.

### Solution 4 : Vérifier l'icône .ico

```powershell
# Voir la taille du fichier
Get-Item "assets\icon.ico" | Select-Object Name, Length, LastWriteTime
```

**L'icône doit :**
- ✅ Être au format `.ico` (Windows Icon)
- ✅ Contenir plusieurs résolutions (16x16, 32x32, 48x48, 256x256)
- ✅ Faire entre 2 Ko et 500 Ko environ
- ✅ Ne pas être corrompue

---

## 🎨 Créer une nouvelle icône personnalisée

### Méthode 1 : Utiliser un outil en ligne

1. Allez sur https://www.icoconverter.com/
2. Uploadez une image PNG/JPG (minimum 256x256 pixels)
3. Téléchargez le fichier `.ico`
4. Remplacez `assets\icon.ico` par le nouveau fichier
5. Recompilez : `npm run dist-win`

### Méthode 2 : Avec ImageMagick (si installé)

```powershell
# Convertir une image PNG en ICO avec plusieurs résolutions
magick convert logo.png -resize 256x256 -define icon:auto-resize="256,128,96,64,48,32,16" assets\icon.ico
```

### Méthode 3 : Avec GIMP (gratuit)

1. Ouvrez votre image dans GIMP
2. Redimensionnez à 256x256 : `Image > Échelle et taille de l'image`
3. Exportez : `Fichier > Exporter sous...`
4. Choisissez le format `.ico`
5. Cochez toutes les résolutions
6. Enregistrez dans `assets\icon.ico`

---

## 📊 État actuel

```powershell
# Vérifier les fichiers d'icône
Get-Item "assets\icon.ico", "build\icon.ico" -ErrorAction SilentlyContinue | Select-Object Name, Length

# Vérifier l'exécutable
Get-Item "dist-electron-final-02\win-unpacked\CFTP - Système de gestion des évaluations.exe" -ErrorAction SilentlyContinue | Select-Object Name, LastWriteTime
```

---

## 🔬 Debug avancé

Si rien ne fonctionne, activez les logs détaillés :

```powershell
# Lancer avec logs
$env:ELECTRON_ENABLE_LOGGING=1
npm run electron-dev
```

Vérifiez dans la console les messages :
- `🎨 Icône CFPT trouvée: [chemin]`
- `🎨 Icône CFPT appliquée à la fenêtre`
- `🎨 Icône overlay appliquée à la barre des tâches`

Si vous voyez `⚠️ Aucune icône CFPT trouvée`, l'icône n'est pas au bon endroit.

---

## 📞 Checklist finale

- [ ] L'icône `assets\icon.ico` existe et n'est pas corrompue
- [ ] J'ai recompilé l'application avec `npm run dist-win`
- [ ] J'ai lancé l'exécutable depuis `dist-electron-final-02\win-unpacked\`
- [ ] J'ai vidé le cache des icônes Windows
- [ ] J'ai redémarré l'application
- [ ] J'ai vérifié dans Alt+Tab, pas seulement dans la barre des tâches

**Si toutes les cases sont cochées et l'icône n'apparaît toujours pas**, l'icône `.ico` est probablement invalide. Créez-en une nouvelle avec les méthodes ci-dessus.

---

## ✅ Résumé

| Situation | Icône affichée | Solution |
|-----------|----------------|----------|
| Mode développement (`npm run electron-dev`) | ❌ Icône Electron | Normal - compilez l'app |
| Application compilée (`.exe`) | ❌ Icône Electron | Recompilez + videz cache |
| Application compilée (`.exe`) | ✅ Icône CFPT | 🎉 Tout fonctionne ! |
