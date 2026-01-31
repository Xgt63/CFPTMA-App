# 🚀 Guide d'Installation - CFP Manager

## 📋 Prérequis Système

### Configuration Minimale
- **Système d'exploitation** : Windows 10 (64-bit) ou supérieur
- **Processeur** : Intel Core i3 ou équivalent AMD
- **Mémoire RAM** : 4 GB minimum (8 GB recommandé)
- **Espace disque** : 500 MB libres
- **Résolution écran** : 1024x768 minimum (1920x1080 recommandé)

### Configuration Recommandée
- **Système d'exploitation** : Windows 11 (64-bit)
- **Processeur** : Intel Core i5 ou équivalent AMD
- **Mémoire RAM** : 8 GB ou plus
- **Espace disque** : 1 GB libres
- **Résolution écran** : 1920x1080 ou supérieur

---

## 📦 Installation Standard

### Étape 1 : Téléchargement
1. Téléchargez le fichier `CFP-Manager-Setup.exe`
2. Vérifiez l'intégrité du fichier (taille : ~150 MB)
3. Placez le fichier dans un dossier temporaire

### Étape 2 : Exécution de l'Installateur
1. **Clic droit** sur `CFP-Manager-Setup.exe`
2. Sélectionnez **"Exécuter en tant qu'administrateur"**
3. Si Windows Defender s'affiche, cliquez sur **"Plus d'infos"** puis **"Exécuter quand même"**

### Étape 3 : Assistant d'Installation
1. **Langue** : Sélectionnez Français
2. **Licence** : Acceptez les termes du contrat
3. **Dossier d'installation** : 
   - Par défaut : `C:\Program Files\CFP Manager\`
   - Ou choisissez un autre emplacement
4. **Raccourcis** :
   - ✅ Créer un raccourci sur le Bureau
   - ✅ Créer un raccourci dans le Menu Démarrer
5. **Installation** : Cliquez sur "Installer"

### Étape 4 : Finalisation
1. Attendez la fin de l'installation (2-3 minutes)
2. ✅ Cochez "Lancer CFP Manager" si souhaité
3. Cliquez sur **"Terminer"**

---

## 🔧 Installation Personnalisée

### Options Avancées
- **Installation silencieuse** : `CFP-Manager-Setup.exe /S`
- **Dossier personnalisé** : `CFP-Manager-Setup.exe /D=C:\MonDossier\CFP`
- **Sans raccourcis** : Décochez les options lors de l'installation

### Installation Réseau
Pour installer sur plusieurs postes :
1. Copiez l'installateur sur un partage réseau
2. Exécutez depuis chaque poste avec les droits administrateur
3. Utilisez un script batch pour l'automatisation

---

## 🚀 Premier Lancement

### Démarrage de l'Application
1. **Double-clic** sur l'icône du Bureau, ou
2. **Menu Démarrer** > CFP Manager, ou
3. **Recherche Windows** : Tapez "CFP Manager"

### Écran de Chargement
- Logo CFP Manager
- Barre de progression
- Initialisation de la base de données (première fois)

### Première Connexion
**Identifiants par défaut :**
- **Email** : `admin@cfp.com`
- **Mot de passe** : `admin123`

⚠️ **IMPORTANT** : Changez immédiatement le mot de passe !

---

## ⚙️ Configuration Initiale

### 1. Changement du Mot de Passe
1. Allez dans **Paramètres** > **Mot de Passe**
2. Saisissez l'ancien mot de passe : `admin123`
3. Créez un nouveau mot de passe sécurisé :
   - 8 caractères minimum
   - Majuscules et minuscules
   - Chiffres et caractères spéciaux
4. Confirmez et sauvegardez

### 2. Mise à Jour du Profil
1. Allez dans **Paramètres** > **Mon Profil**
2. Cliquez sur **"Modifier"**
3. Mettez à jour :
   - Prénom et Nom
   - Adresse email
4. Sauvegardez les modifications

### 3. Configuration des Thèmes
1. Allez dans **Paramètres** > **Thèmes de Formation**
2. Vérifiez les thèmes par défaut
3. Ajoutez vos propres thèmes si nécessaire
4. Modifiez les descriptions selon vos besoins

---

## 🗂️ Structure des Fichiers

### Dossier d'Installation
```
C:\Program Files\CFP Manager\
├── CFP Manager.exe          # Exécutable principal
├── resources\               # Ressources de l'application
├── locales\                # Fichiers de langue
├── swiftshader\            # Rendu graphique
└── version                 # Informations de version
```

### Dossier de Données Utilisateur
```
C:\Users\[Utilisateur]\AppData\Roaming\CFP Manager\
├── database.db            # Base de données SQLite
├── logs\                  # Fichiers de log
├── exports\               # Exports Excel
└── config.json           # Configuration utilisateur
```

---

## 🔍 Vérification de l'Installation

### Tests de Fonctionnement
1. **Connexion** : Testez la connexion avec les identifiants
2. **Navigation** : Parcourez tous les menus
3. **Ajout de données** : Créez un membre test
4. **Évaluation** : Remplissez une évaluation test
5. **Export** : Testez l'export Excel
6. **Statistiques** : Vérifiez l'affichage des graphiques

### Vérification des Permissions
- L'application peut écrire dans son dossier de données
- Les exports se téléchargent correctement
- La base de données se met à jour

---

## 🚨 Résolution de Problèmes

### Problème : Installation Bloquée
**Cause** : Antivirus ou permissions insuffisantes
**Solution** :
1. Désactivez temporairement l'antivirus
2. Exécutez en tant qu'administrateur
3. Ajoutez une exception dans l'antivirus

### Problème : Application ne Démarre Pas
**Cause** : Fichiers corrompus ou dépendances manquantes
**Solution** :
1. Redémarrez l'ordinateur
2. Réinstallez l'application
3. Vérifiez les mises à jour Windows

### Problème : Base de Données Inaccessible
**Cause** : Permissions de fichier ou corruption
**Solution** :
1. Vérifiez les permissions du dossier AppData
2. Supprimez `database.db` pour réinitialiser
3. Redémarrez l'application

### Problème : Champs Non Saisissables
**Cause** : Configuration de sécurité
**Solution** :
1. Redémarrez l'application
2. Vérifiez que l'application est au premier plan
3. Réinstallez si le problème persiste

---

## 🔄 Mise à Jour

### Processus de Mise à Jour
1. Téléchargez la nouvelle version
2. Fermez l'application actuelle
3. Exécutez le nouvel installateur
4. Vos données seront préservées automatiquement

### Sauvegarde Avant Mise à Jour
1. Allez dans **Paramètres** > **Export des Données**
2. Cliquez sur **"Export Complet"**
3. Sauvegardez le fichier Excel généré
4. Procédez à la mise à jour

---

## 🗑️ Désinstallation

### Désinstallation Standard
1. **Panneau de Configuration** > **Programmes et Fonctionnalités**
2. Sélectionnez **"CFP Manager"**
3. Cliquez sur **"Désinstaller"**
4. Suivez les instructions

### Désinstallation Complète
1. Désinstallez via le Panneau de Configuration
2. Supprimez le dossier : `C:\Users\[Utilisateur]\AppData\Roaming\CFP Manager\`
3. Supprimez les raccourcis restants
4. Videz la Corbeille

### Sauvegarde des Données
⚠️ **ATTENTION** : La désinstallation supprime toutes les données !
1. Exportez vos données avant désinstallation
2. Sauvegardez le fichier `database.db` si nécessaire
3. Conservez les exports Excel importants

---

## 📞 Support Installation

### Assistance Technique
- **Email** : support@cfp.com
- **Objet** : Installation CFP Manager
- **Informations à fournir** :
  - Version de Windows
  - Message d'erreur exact
  - Étape où le problème survient

### Ressources Utiles
- **Manuel Utilisateur** : `MANUEL_UTILISATEUR.md`
- **FAQ** : Questions fréquentes
- **Logs** : Fichiers dans `AppData\Roaming\CFP Manager\logs\`

---

## ✅ Checklist d'Installation

### Avant Installation
- [ ] Vérifier la configuration système
- [ ] Fermer les autres applications
- [ ] Disposer des droits administrateur
- [ ] Sauvegarder les données importantes

### Pendant Installation
- [ ] Exécuter en tant qu'administrateur
- [ ] Choisir le bon dossier d'installation
- [ ] Créer les raccourcis souhaités
- [ ] Attendre la fin complète de l'installation

### Après Installation
- [ ] Lancer l'application
- [ ] Tester la connexion
- [ ] Changer le mot de passe par défaut
- [ ] Configurer le profil utilisateur
- [ ] Effectuer les tests de fonctionnement
- [ ] Créer une première sauvegarde

---

## 🎉 Installation Terminée !

Félicitations ! **CFP Manager** est maintenant installé et prêt à l'emploi.

Consultez le **Manuel Utilisateur** pour apprendre à utiliser toutes les fonctionnalités de l'application.

---

*"Au service de l'excellence éducative chrétienne"* ✨