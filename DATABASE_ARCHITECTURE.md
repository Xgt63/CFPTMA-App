# 🗄️ Architecture de la Base de Données - CFPT Ivato

## 📋 Vue d'ensemble

Ce document décrit l'architecture de stockage des données du système de gestion des évaluations du CFPT Ivato. L'application utilise **deux systèmes de stockage** selon le contexte d'exécution :

- **Mode Electron (Desktop)** : SQLite via `better-sqlite3`
- **Mode Web (Développement)** : localStorage (navigateur)

---

## 🏗️ Architecture Générale

```
┌─────────────────────────────────────────────────┐
│         Application React (Frontend)            │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │   src/services/database.ts               │   │
│  │   (Service principal de données)         │   │
│  └──────────────┬──────────────────────────┘   │
│                 │                                │
└─────────────────┼────────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼─────┐     ┌────▼─────┐
    │ Electron │     │   Web    │
    │  Mode    │     │   Mode   │
    └────┬─────┘     └────┬─────┘
         │                │
    ┌────▼─────┐     ┌────▼─────┐
    │  SQLite  │     │localStorage│
    │(better-  │     │ (Browser) │
    │ sqlite3) │     │           │
    └──────────┘     └───────────┘
```

---

## 🔧 Mode Electron (Production)

### Source de données : SQLite

**Fichier** : `electron/database.js`

**Emplacement de la base de données** :
```
%APPDATA%/Employee Evaluation System/evaluation_system.db
```

### Tables SQLite

#### 1. **users** - Utilisateurs du système
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
)
```

#### 2. **staff** - Personnel évalué
```sql
CREATE TABLE staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matricule TEXT UNIQUE,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  position TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  establishment TEXT,
  formationYear TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
)
```

#### 3. **themes** - Thèmes de formation
```sql
CREATE TABLE themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
)
```

#### 4. **evaluations** - Évaluations complètes
```sql
CREATE TABLE evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staffId INTEGER,
  firstName TEXT,
  lastName TEXT,
  gender TEXT,
  phone TEXT,
  email TEXT,
  position TEXT,
  establishment TEXT,
  fillDate TEXT,
  formationTheme TEXT,
  trainingCenter TEXT,
  trainers TEXT,
  startDate TEXT,
  endDate TEXT,
  status TEXT DEFAULT 'completed',
  evaluationType TEXT DEFAULT 'initial',
  initialEvaluationId INTEGER,
  completedAt TEXT,
  
  -- Critères d'évaluation initiale (27 champs)
  skillsAcquisition INTEGER,
  personalDevelopment INTEGER,
  courseClarity INTEGER,
  theoryPractice INTEGER,
  syllabusAdequacy INTEGER,
  practicalCases INTEGER,
  objectivesAchieved INTEGER,
  adaptedKnowledge INTEGER,
  pedagogicalSupport INTEGER,
  techniquesUsed INTEGER,
  presentation INTEGER,
  logisticsConditions INTEGER,
  rhythm INTEGER,
  punctuality INTEGER,
  punctualityAssiduity INTEGER,
  teamworkSense INTEGER,
  motivationEnthusiasm INTEGER,
  communicationSociable INTEGER,
  communicationGeneral INTEGER,
  aptitudeChangeIdeas INTEGER,
  curiosity INTEGER,
  initiativeSpirit INTEGER,
  responsibilitySense INTEGER,
  criticalAnalysis INTEGER,
  workExecution INTEGER,
  directivesComprehension INTEGER,
  workQuality INTEGER,
  subjectMastery INTEGER,
  
  -- Observations et suggestions
  observedChanges TEXT,
  improvementSuggestions TEXT,
  postFormationActions TEXT,
  actionsSatisfaction TEXT,
  recommendationScore INTEGER,
  needsAdditionalTraining TEXT,
  additionalTrainingDetails TEXT,
  requestedTrainings TEXT,
  noAdditionalTrainingReason TEXT,
  justificationObservations TEXT,
  
  -- Champs suivi 6 mois (30 champs)
  fu_behaviorGeneral INTEGER,
  fu_behaviorGeneralComment TEXT,
  fu_teamIntegration INTEGER,
  fu_teamIntegrationComment TEXT,
  fu_motivationTenacity INTEGER,
  fu_motivationTenacityComment TEXT,
  fu_communication INTEGER,
  fu_communicationComment TEXT,
  fu_curiosity INTEGER,
  fu_curiosityComment TEXT,
  fu_initiativeCreativity INTEGER,
  fu_initiativeCreativityComment TEXT,
  fu_adaptedKnowledge INTEGER,
  fu_adaptedKnowledgeComment TEXT,
  fu_criticalAnalysis INTEGER,
  fu_criticalAnalysisComment TEXT,
  fu_technicalMastery INTEGER,
  fu_technicalMasteryComment TEXT,
  fu_hierarchyRespect INTEGER,
  fu_hierarchyRespectComment TEXT,
  fu_workQuality INTEGER,
  fu_workQualityComment TEXT,
  fu_efficiency INTEGER,
  fu_efficiencyComment TEXT,
  fu_productivity INTEGER,
  fu_productivityComment TEXT,
  fu_valuesRespect INTEGER,
  fu_valuesRespectComment TEXT,
  fu_commitment INTEGER,
  fu_commitmentComment TEXT,
  fu_total60 INTEGER,
  fu_appreciationCode INTEGER,
  fu_appreciationLabel TEXT,
  fu_conclusionStaff TEXT,
  fu_conclusionDirector TEXT,
  fu_date TEXT,
  
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (staffId) REFERENCES staff(id) ON DELETE CASCADE
)
```

### Configuration SQLite

**Fichier** : `electron/database.js`

```javascript
// Optimisations activées
db.pragma('journal_mode = WAL');      // Write-Ahead Logging
db.pragma('synchronous = NORMAL');     // Équilibre performance/sécurité
db.pragma('cache_size = 10000');       // Cache de 10 000 pages
db.pragma('foreign_keys = ON');        // Contraintes d'intégrité
```

---

## 🌐 Mode Web (Développement)

### Source de données : localStorage

**Fichier** : `src/services/database.ts`

**Clés localStorage** :
- `users` - Utilisateurs (JSON array)
- `staff` - Personnel (JSON array)
- `themes` - Thèmes de formation (JSON array)
- `evaluations` - Évaluations (JSON array)
- `staff_trainings` - Formations assignées (JSON array)

### Limites localStorage
- **Capacité** : ~5-10 MB selon le navigateur
- **Persistance** : Peut être effacée par l'utilisateur
- **Performance** : Synchrone, peut ralentir l'interface si gros volume

---

## 🔄 Système de Migration et Synchronisation

### Service de Migration

**Fichier** : `src/services/migrationService.ts`

#### Fonctionnalités

1. **Détection automatique du mode** :
   ```typescript
   const isElectron = !!(window && window.electronAPI);
   ```

2. **Synchronisation bidirectionnelle** :
   - **localStorage → SQLite** : Au premier lancement Electron
   - **SQLite → localStorage** : À chaque opération pour le cache

3. **Priorité des données** :
   - En mode Electron : **SQLite est la source de vérité**
   - En mode Web : **localStorage est la seule source**

### Flux de synchronisation

```
┌─────────────────────────────────────────┐
│  Démarrage de l'application Electron    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  MigrationService.syncData()            │
│  - Vérifier mode (Electron/Web)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Si SQLite vide ET localStorage plein   │
│  → Migration localStorage → SQLite      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Synchroniser SQLite → localStorage     │
│  (pour cache et accès rapide)           │
└─────────────────────────────────────────┘
```

---

## 📦 Service Principal de Données

**Fichier** : `src/services/database.ts`

### Méthodes principales

#### Détection du mode
```typescript
private static isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
}
```

#### Fallback automatique
```typescript
private static async executeWithFallback(
  electronMethod: () => Promise<any>,
  fallbackMethod: () => any,
  successMessage: string,
  syncKey?: string
)
```

**Logique** :
1. Tenter l'opération via Electron API
2. Si échec, utiliser localStorage
3. Synchroniser les deux sources
4. Émettre des événements de mise à jour

#### Événements de synchronisation

```typescript
// Écouter les changements
DatabaseService.addEventListener('staff-updated', callback);
DatabaseService.addEventListener('evaluations-updated', callback);

// Forcer une synchronisation
DatabaseService.forceSyncAll();
```

---

## 🔐 Sécurité et Intégrité

### Contraintes SQLite

1. **Clés étrangères activées** : `PRAGMA foreign_keys = ON`
2. **Suppression en cascade** : Supprimer un membre → Supprimer ses évaluations
3. **Emails uniques** : Contraintes UNIQUE sur `staff.email` et `users.email`

### Validation des données

**Fichier** : `src/services/database.ts`

```typescript
// Validation du personnel
private static validateStaffMember(data: any): any {
  const required = ['firstName', 'lastName', 'email', 'position'];
  const missing = required.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Champs obligatoires manquants: ${missing.join(', ')}`);
  }
  // Normalisation...
}

// Validation des évaluations
private static validateEvaluation(data: any): any {
  const required = ['staffId', 'formationTheme'];
  // Validation et normalisation...
}
```

---

## 📊 Statistiques et Métriques

### Cohérence des données

```typescript
DatabaseService.verifyDataConsistency()
```

**Vérifications** :
- ✅ Membres du personnel avec données valides
- ✅ Pas d'emails en double
- ✅ Évaluations liées à des membres existants
- ✅ Pas de brouillons obsolètes (>90 jours)

---

## 🚀 Optimisations de Performance

### Cache intelligent

```typescript
private static cache = new Map();
private static cacheTimeout = 30000; // 30 secondes
```

### Opérations asynchrones

Toutes les opérations de base de données sont **asynchrones** :
```typescript
async getStaff()
async createStaff(data)
async updateStaff(id, data)
async deleteStaff(id)
```

### Batch operations

Pour les imports Excel, les données sont traitées par lots pour éviter de bloquer l'interface.

---

## 🛠️ Développement et Débogage

### Logs de débogage

Tous les services utilisent `console.log()` avec des emojis pour faciliter le débogage :

```
🔍 DatabaseService.getStaff - Début récupération staff...
📋 DatabaseService.getStaff - Données récupérées: 10 membres
✅ Synchronisation Electron terminée
```

### Mode développement

En mode développement (Vite), l'application utilise **uniquement localStorage** car Electron n'est pas disponible.

---

## 📝 Notes importantes

### ⚠️ Supabase n'est PAS utilisé

Bien que le package `@supabase/supabase-js` ait été installé à un moment, **il a été retiré** car l'application n'utilise pas de base de données cloud.

**Configuration actuelle** :
- ❌ ~~Supabase~~
- ✅ SQLite (Electron)
- ✅ localStorage (Web)

### Migration des données utilisateur

Le fichier `main.js` (Electron) contient une fonction `performDataMigrationIfNeeded()` qui :
1. Recherche les anciennes installations
2. Migre automatiquement les données au premier démarrage
3. Crée un fichier `migration.json` pour éviter les duplications

---

## 🔗 Références

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `electron/database.js` | Service SQLite (backend Electron) |
| `src/services/database.ts` | Service principal (frontend) |
| `src/services/migrationService.ts` | Migration et synchronisation |
| `src/services/electronService.ts` | Interface Electron API |
| `main.js` | Configuration Electron et migration initiale |

### Dépendances

- **better-sqlite3** : SQLite synchrone pour Node.js
- **exceljs** : Import/Export Excel sécurisé

---

## ✅ Bonnes pratiques

1. **Toujours utiliser le service `database.ts`** pour accéder aux données
2. **Ne jamais accéder directement à localStorage** en dehors du service
3. **Écouter les événements de synchronisation** pour mettre à jour l'UI
4. **Valider les données** avant insertion
5. **Utiliser les méthodes asynchrones** pour éviter de bloquer l'interface

---

**Date de documentation** : 22 décembre 2025  
**Version de l'application** : 2.2.1  
**Auteur** : CFPT Ivato - Équipe de développement
