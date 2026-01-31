# 🔄 Guide de Migration - Gestion du Personnel

## 📋 À Propos de la Migration

Lors de la mise à jour vers la nouvelle version **"Centre de Formation Professionnelle et Technique d'Ivato"**, vos données des versions précédentes seront **automatiquement migrées** pour assurer la continuité.

---

## ✅ **Réponse à Votre Question**

**"Est-ce que quand je vais l'installer, si l'utilisateur a déjà installé la version précédente, est-ce que l'application va se mettre à jour en conservant toutes les données ?"**

### 🎯 **OUI ! Vos données seront conservées** grâce au système de migration automatique :

1. **🔍 Détection Automatique** : Au démarrage, l'application recherche automatiquement les données des anciennes versions
2. **📦 Migration Transparente** : Toutes les données trouvées sont migrées vers le nouveau format
3. **💾 Conservation Totale** : Aucune donnée n'est perdue dans le processus
4. **🔔 Notification** : L'utilisateur est informé du succès de la migration

---

## 🗂️ Versions Supportées pour Migration

Le système peut migrer les données depuis :

### Applications Desktop Précédentes :
- ✅ `Employee Evaluation System` (toutes versions)
- ✅ `CFP Manager` (toutes versions)
- ✅ `CFPT Ivato - Système d'Évaluation` (toutes versions)

### Données Web/LocalStorage :
- ✅ Navigateurs Chrome/Edge avec données localStorage
- ✅ Fichiers JSON exportés manuellement

### Formats de Données :
- ✅ Fichiers `.json` (personnel, évaluations, thèmes)
- ✅ Bases de données `.sqlite` / `.db`
- ✅ LocalStorage des navigateurs

---

## 🔄 Process de Migration Automatique

### 1. **Au Premier Démarrage** 
```
🔍 L'application recherche automatiquement :
   → AppData/Roaming/employee-evaluation-system/
   → AppData/Roaming/CFP Manager/
   → Documents/Gestion Personnel/
   → Et autres emplacements probables...
```

### 2. **Analyse des Données Trouvées**
```
📊 Pour chaque source trouvée :
   ✓ Validation du format
   ✓ Vérification de l'intégrité  
   ✓ Déduplication automatique
```

### 3. **Migration et Fusion**
```
🔄 Processus de migration :
   → Staff/Personnel fusionnés (sans doublons)
   → Évaluations liées correctement
   → Thèmes unifiés
   → Historique préservé
```

### 4. **Confirmation Utilisateur**
```
🔔 Message de confirmation :
   "Migration réussie !
   • X membres du personnel
   • Y évaluations  
   • Z thèmes de formation
   
   Toutes vos données sont conservées."
```

---

## 📁 Nouveaux Emplacements des Données

### Dossier Principal :
```
%USERPROFILE%/AppData/Roaming/Centre de Formation Professionnelle et Technique d'Ivato/
```

### Fichiers Créés :
- `staff.json` - Personnel migré
- `evaluations.json` - Évaluations migrées  
- `themes.json` - Thèmes de formation
- `migration.json` - Informations de migration

---

## 🛡️ Sécurité et Sauvegarde

### ✅ **Garanties :**
- **Aucune suppression** des données originales
- **Validation** avant migration
- **Rollback possible** vers les anciens fichiers
- **Double stockage** (localStorage + fichiers)

### 📋 **Vérifications Automatiques :**
- Intégrité des données
- Cohérence des liens staff-évaluations
- Format et structure
- Élimination des doublons

---

## 🚀 Installation et Première Utilisation

### Étapes :
1. **Télécharger** `Centre de Formation Professionnelle et Technique d'Ivato Setup 2.0.0.exe`
2. **Exécuter** le fichier d'installation
3. **Attendre** la détection automatique des données (quelques secondes)
4. **Confirmer** la migration si des données sont trouvées
5. **Utiliser** l'application avec toutes vos données conservées

---

## 🔧 Dépannage

### Si la Migration Échoue :
```bash
# Lancer la migration manuellement
npm run migrate-data

# Vérifier l'état de la base de données  
npm run verify-db

# Tester la migration complète
npm run test-migration
```

### Chemins de Données Manuels :
Si vous avez stocké vos données dans un dossier personnalisé, copiez les fichiers JSON vers :
```
%USERPROFILE%/Documents/Gestion Personnel/
```

### Récupération d'Urgence :
Les anciennes données restent intactes dans leurs emplacements originaux jusqu'à confirmation de bon fonctionnement.

---

## 📊 Après Migration - Vérification

### Vérifiez que tout est bien migré :
1. **Personnel** : Tous les membres sont visibles
2. **Évaluations** : Historique des formations intact  
3. **Thèmes** : Toutes les catégories de formation
4. **Liens** : Évaluations correctement liées au personnel

### En cas de données manquantes :
1. Vérifiez les **logs de l'application** (F12 → Console)
2. Contactez le support avec les détails de votre ancienne installation
3. Gardez vos anciens dossiers de données intacts

---

## ✨ **Résumé : Migration Sans Souci**

🎯 **Votre préoccupation est résolue** : 
- ✅ Installation de la nouvelle version **SANS PERTE DE DONNÉES**
- ✅ Migration **100% automatique** au premier démarrage
- ✅ Toutes les versions précédentes **supportées**
- ✅ Notification **claire** du succès de migration
- ✅ Double sécurité : **localStorage + fichiers**

**Vous pouvez installer en toute confiance !** 🚀

---

*Guide créé pour la version 2.0.0 - Centre de Formation Professionnelle et Technique d'Ivato*