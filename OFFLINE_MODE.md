# 🔒 CFP Manager - Mode 100% Offline

## Vue d'ensemble

CFP Manager est conçu pour fonctionner **entièrement hors ligne**, sans aucune connexion internet requise. Toutes vos données restent sur votre machine locale pour une confidentialité maximale.

## 🎯 Caractéristiques Offline

### ✅ Ce qui fonctionne sans internet

- **Toutes les fonctionnalités** de l'application
- Gestion complète du personnel
- Création et modification d'évaluations
- Consultation des statistiques
- Export de données (Excel, JSON)
- Import de données
- Configuration et paramètres
- Sauvegarde automatique

### ❌ Ce qui nécessite une connexion

- **RIEN !** L'application est 100% autonome

## 💾 Stockage des Données

### Localisation des fichiers

Toutes les données sont stockées localement dans :

**Windows:**
```
C:\Users\[VotreNom]\AppData\Roaming\CFP Manager\cfp-data.json
```

**macOS:**
```
~/Library/Application Support/CFP Manager/cfp-data.json
```

**Linux:**
```
~/.config/CFP Manager/cfp-data.json
```

### Structure des données

Le fichier `cfp-data.json` contient toutes vos données :

```json
{
  "users": [...],
  "staff": [...],
  "formation_themes": [...],
  "evaluations": [...]
}
```

### Sauvegarde automatique

- Les données sont sauvegardées **automatiquement** après chaque modification
- Double sauvegarde : fichier JSON + localStorage (fallback)
- Aucune synchronisation cloud
- Aucun envoi de données externe

## 🔐 Sécurité et Confidentialité

### Garanties

1. **Données locales uniquement**
   - Aucune connexion à un serveur distant
   - Aucun envoi de télémétrie
   - Aucun tracking

2. **Confidentialité totale**
   - Vos données ne quittent jamais votre machine
   - Pas de collecte d'informations
   - Contrôle total sur vos fichiers

3. **Pas de dépendances externes**
   - Pas d'API tierces
   - Pas de services cloud
   - Pas de mise à jour automatique en ligne

### Recommandations

✅ **Faites des sauvegardes régulières**
- Utilisez la fonction Export dans les Paramètres
- Sauvegardez le fichier `cfp-data.json` manuellement
- Stockez les sauvegardes sur un support externe

✅ **Protégez vos données**
- Utilisez un mot de passe fort
- Fermez l'application après utilisation
- Chiffrez votre disque dur si possible

## 📤 Export et Sauvegarde

### Export des données

L'application permet d'exporter vos données dans plusieurs formats :

1. **Format JSON** (recommandé pour les sauvegardes)
   - Export complet de toutes les données
   - Importable dans une nouvelle installation
   - Facile à archiver

2. **Format Excel** (pour l'analyse)
   - Export du personnel
   - Export des évaluations
   - Export des statistiques

### Procédure de sauvegarde

1. Ouvrir l'application
2. Aller dans **Paramètres**
3. Section **Sauvegarde et restauration**
4. Cliquer sur **Exporter toutes les données**
5. Choisir l'emplacement de sauvegarde
6. Conserver le fichier en lieu sûr

### Restauration des données

1. Ouvrir l'application
2. Aller dans **Paramètres**
3. Section **Restauration des données**
4. Cliquer sur **Importer**
5. Sélectionner votre fichier de sauvegarde
6. Les données seront restaurées

## 🚀 Installation sur une machine sans internet

### Étapes d'installation

1. **Télécharger l'installateur** sur une machine connectée
2. **Transférer l'installateur** sur une clé USB
3. **Installer** sur la machine cible (sans internet)
4. **Lancer l'application** - elle fonctionnera immédiatement

### Transfert de données entre machines

Si vous devez transférer vos données vers une autre machine :

1. **Sur la machine source** :
   - Exporter les données (JSON)
   - Copier le fichier sur clé USB

2. **Sur la machine cible** :
   - Installer l'application
   - Importer le fichier de données

## 🛠️ Architecture Technique

### Système de stockage

```
Electron Application
    ↓
DataManager (Node.js)
    ↓
cfp-data.json (Fichier local)
    ↓
Filesystem (Disque dur)
```

### Fallback système

En cas de problème avec le fichier JSON :
1. L'application utilise localStorage du navigateur
2. Les données sont toujours préservées
3. Synchronisation automatique lors de la récupération

## ❓ Questions Fréquentes

### L'application envoie-t-elle des données en ligne ?

**Non.** Aucune donnée n'est jamais envoyée sur internet. Tout reste local.

### Puis-je utiliser l'application sans jamais me connecter à internet ?

**Oui.** L'application est conçue pour fonctionner 100% hors ligne.

### Mes données sont-elles synchronisées avec le cloud ?

**Non.** Il n'y a aucune synchronisation cloud. Toutes les données restent sur votre machine.

### Comment puis-je partager mes données avec d'autres utilisateurs ?

Utilisez la fonction Export/Import pour transférer manuellement les fichiers de données.

### Que se passe-t-il si je perds le fichier cfp-data.json ?

Si vous n'avez pas de sauvegarde, les données sont perdues. C'est pourquoi nous recommandons des exports réguliers.

### L'application vérifie-t-elle les mises à jour automatiquement ?

**Non.** Aucune vérification automatique de mise à jour. Vous gardez le contrôle total.

## 📞 Support

Pour toute question sur le fonctionnement offline :
- Consultez ce document
- Vérifiez le fichier `MANUEL_UTILISATEUR.md`
- Contactez : support@cfp.com

---

**CFP Manager - Confidentialité et autonomie garanties** 🔒
