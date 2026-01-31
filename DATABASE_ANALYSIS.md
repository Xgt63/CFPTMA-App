# 📊 ANALYSE COMPLÈTE DE LA BASE DE DONNÉES

**Date d'analyse:** 29 Janvier 2026  
**Projet:** CFPT - Système de gestion des évaluations  
**Version:** 2.2.1

---

## 📋 Table des matières

1. [Architecture globale](#architecture-globale)
2. [Diagramme relationnel](#diagramme-relationnel)
3. [Schéma détaillé des tables](#schéma-détaillé-des-tables)
4. [Données actuelles](#données-actuelles)
5. [Mécanismes de sécurité](#mécanismes-de-sécurité)
6. [Performance et optimisations](#performance-et-optimisations)
7. [Gestion des données](#gestion-des-données)
8. [Problèmes potentiels et recommandations](#problèmes-potentiels-et-recommandations)

---

## 🏗️ Architecture globale

### Système de base de données

Le projet utilise une **architecture hybride** avec deux modes:

| Mode | Technologie | Utilisation |
|------|-------------|------------|
| **Primaire** | SQLite 3 (better-sqlite3) | Production, persistance locale |
| **Fallback** | Base de données en mémoire (Memory-DB) | Mode secours, développement |

#### Fichier principal
- **Chemin:** `electron/database.js` (934 lignes)
- **Type:** Service singleton
- **Framework:** Node.js + Electron
- **Persistance:** SQLite avec mode WAL (Write-Ahead Logging)

---

## 📐 Diagramme relationnel

```
┌─────────────────────────────────────────────────────────────────┐
│                     BASE DE DONNÉES CFPT                         │
└─────────────────────────────────────────────────────────────────┘

                            ┌──────────┐
                            │  USERS   │
                            └──────────┘
                                  │
                                  │ (1:N)
                                  ↓
                            ┌─────────────┐
                            │ AUDIT_LOGS  │
                            └─────────────┘

    ┌──────────┐                                    ┌─────────────┐
    │  STAFF   │◄─────────────────────────────────►│ EVALUATIONS │
    └──────────┘  (1:N)                 (N:1)      └─────────────┘


    ┌─────────┐
    │ THEMES  │  (Données de référence)
    └─────────┘

    ┌────────────────┐
    │  APP_CONFIG    │  (Configuration unique)
    └────────────────┘
```

---

## 📊 Schéma détaillé des tables

### 1️⃣ TABLE: `users` (Gestion des utilisateurs)

**Rôle:** Authentification et autorisation

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTO | Identifiant unique |
| `firstName` | TEXT | NOT NULL | Prénom |
| `lastName` | TEXT | NOT NULL | Nom de famille |
| `email` | TEXT | UNIQUE NOT NULL | Email unique |
| `password` | TEXT | NOT NULL | Mot de passe (non hashé ⚠️) |
| `role` | TEXT | DEFAULT 'admin' | Rôle: admin, user, evaluator |
| `createdAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Date création |
| `updatedAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Dernière modification |

**Utilisateur par défaut:**
- Email: `admin@cfpt-ivato.mg`
- Mot de passe: `admin123` (en clair)
- Rôle: `admin`

**Chiffrement:** ❌ Aucun - **PROBLÈME SÉCURITÉ**

---

### 2️⃣ TABLE: `staff` (Personnel/Employés)

**Rôle:** Gestion du personnel à évaluer

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTO | Identifiant unique |
| `matricule` | TEXT | UNIQUE | Numéro de matricule |
| `firstName` | TEXT | NOT NULL | Prénom |
| `lastName` | TEXT | NOT NULL | Nom |
| `position` | TEXT | | Poste/Fonction |
| `email` | TEXT | UNIQUE | Email |
| `phone` | TEXT | | Téléphone |
| `establishment` | TEXT | | Établissement/Lieu |
| `formationYear` | TEXT | | Année de formation |
| `createdAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Création |
| `updatedAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Modification |

**Données actuelles (2 enregistrements):**

```json
[
  {
    "id": 1,
    "matricule": "MAT001",
    "firstName": "Jean",
    "lastName": "Dupont",
    "position": "Manager",
    "email": "jean.dupont@entreprise.com",
    "phone": "0123456789",
    "establishment": "Siège",
    "formationYear": "2024",
    "createdAt": "2025-10-11T11:42:27.663Z"
  },
  {
    "id": 2,
    "matricule": "MAT002",
    "firstName": "Marie",
    "lastName": "Martin",
    "position": "Technicienne",
    "email": "marie.martin@entreprise.com",
    "phone": "0123456790",
    "establishment": "Siège",
    "formationYear": "2024",
    "createdAt": "2025-10-11T11:42:27.664Z"
  }
]
```

---

### 3️⃣ TABLE: `themes` (Thèmes de formation)

**Rôle:** Référentiel des formations disponibles

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTO | Identifiant unique |
| `name` | TEXT | NOT NULL | Nom du thème |
| `description` | TEXT | | Description détaillée |
| `createdAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Création |
| `updatedAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Modification |

**Thèmes par défaut (3 enregistrements):**

```json
[
  {
    "id": 1,
    "name": "Leadership Management",
    "description": "Formation sur les techniques de leadership et de management",
    "createdAt": "2025-10-11T11:42:27.665Z"
  },
  {
    "id": 2,
    "name": "Communication Efficace",
    "description": "Améliorer ses compétences en communication",
    "createdAt": "2025-10-11T11:42:27.665Z"
  },
  {
    "id": 3,
    "name": "Sécurité au Travail",
    "description": "Formation sur les règles de sécurité",
    "createdAt": "2025-10-11T11:42:27.665Z"
  }
]
```

---

### 4️⃣ TABLE: `evaluations` (Évaluations complètes)

**Rôle:** Stockage des évaluations de formation

**Champs de base:**

| Catégorie | Colonnes | Type |
|-----------|----------|------|
| **Identifiants** | `id`, `staffId`, `firstName`, `lastName` | INTEGER, TEXT |
| **Infos personnelles** | `gender`, `phone`, `email`, `position`, `establishment` | TEXT |
| **Formation** | `fillDate`, `formationTheme`, `trainingCenter`, `trainers`, `startDate`, `endDate` | TEXT |
| **Détails** | `objectives`, `modules`, `expectedResults` | TEXT |
| **Statut** | `status`, `evaluationType`, `initialEvaluationId`, `completedAt` | TEXT, INTEGER |

**Domaines d'évaluation (notation 0-5):**

#### 📚 Contenu et pédagogie (8 champs)
```
- skillsAcquisition          → Acquisition de compétences
- personalDevelopment        → Développement personnel
- courseClarity              → Clarté du cours
- theoryPractice            → Équilibre théorie/pratique
- syllabusAdequacy          → Adéquation du programme
- practicalCases            → Cas pratiques
- objectivesAchieved        → Objectifs atteints
- adaptedKnowledge          → Connaissances adaptées
```

#### 🎓 Méthodes et supports (3 champs)
```
- pedagogicalSupport        → Support pédagogique
- techniquesUsed            → Techniques utilisées
- presentation              → Présentation
```

#### 📍 Organisation et logistique (4 champs)
```
- logisticsConditions       → Conditions logistiques
- rhythm                    → Rythme de formation
- punctuality               → Ponctualité
- punctualityAssiduity      → Assiduité
```

#### 🤝 Comportement et collaboration (8 champs)
```
- teamworkSense             → Esprit d'équipe
- motivationEnthusiasm      → Motivation et enthousiasme
- communicationSociable     → Communication sociable
- communicationGeneral      → Communication générale
- aptitudeChangeIdeas       → Aptitude au changement
- curiosity                 → Curiosité
- initiativeSpirit          → Esprit d'initiative
- responsibilitySense       → Sens des responsabilités
```

#### 🧠 Compétences cognitives (5 champs)
```
- criticalAnalysis          → Analyse critique
- workExecution             → Exécution du travail
- directivesComprehension   → Compréhension des directives
- workQuality               → Qualité du travail
- subjectMastery            → Maîtrise du sujet
```

#### 💬 Observations et suivi (9 champs)
```
- observedChanges           → Changements observés (JSON)
- improvementSuggestions    → Suggestions d'amélioration
- postFormationActions      → Actions post-formation
- actionsSatisfaction       → Satisfaction des actions
- recommendationScore       → Score de recommandation
- needsAdditionalTraining   → Besoin de formation supplémentaire
- additionalTrainingDetails → Détails de la formation supplémentaire
- requestedTrainings        → Formations demandées (JSON)
- noAdditionalTrainingReason→ Raison pas de formation supplémentaire
- justificationObservations → Observations justificatives
```

#### 📈 Suivi 6 mois (28 champs `fu_*`)
```
Notation des 14 aspects sur une période de 6 mois:
- Comportement général + commentaire
- Intégration d'équipe + commentaire
- Motivation et ténacité + commentaire
- Communication + commentaire
- Curiosité + commentaire
- Initiative et créativité + commentaire
- Connaissances adaptées + commentaire
- Analyse critique + commentaire
- Maîtrise technique + commentaire
- Respect de la hiérarchie + commentaire
- Qualité du travail + commentaire
- Efficacité + commentaire
- Productivité + commentaire
- Respect des valeurs + commentaire
- Engagement + commentaire
- Total sur 60 + Code appréciation + Label appréciation
- Conclusion du personnel
- Conclusion du directeur
- Date du suivi
```

**Total:** 143 colonnes (très complexe)

---

### 5️⃣ TABLE: `app_config` (Configuration unique)

**Rôle:** Paramètres globaux de l'application

| Colonne | Type | Contraintes | Default | Description |
|---------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY CHECK(id=1) | 1 | Clé unique |
| `usePrinter` | BOOLEAN | | 0 | Utiliser imprimante |
| `invoiceDisplay` | TEXT | | 'screen' | Affichage: screen/printer |
| `userMode` | TEXT | | 'single' | Mode: single/multi-user |
| `multiRegister` | BOOLEAN | | 0 | Enregistrement multiple |
| `auditLogging` | BOOLEAN | | 1 | Logging d'audit activé |
| `setupCompleted` | BOOLEAN | | 0 | Configuration complétée |
| `companyName` | TEXT | | 'CFPT Ivato' | Nom de l'entreprise |
| `companyAddress` | TEXT | | '' | Adresse |
| `companyPhone` | TEXT | | '' | Téléphone |
| `companyEmail` | TEXT | | '' | Email |
| `createdAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | | Création |
| `updatedAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | | Modification |

---

### 6️⃣ TABLE: `audit_logs` (Logs d'audit)

**Rôle:** Suivi des modifications pour la conformité

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTO | Identifiant unique |
| `userId` | INTEGER | FK→users(id) ON DELETE SET NULL | Utilisateur qui a fait l'action |
| `userName` | TEXT | | Nom de l'utilisateur |
| `action` | TEXT | NOT NULL | Type d'action (CREATE, UPDATE, DELETE) |
| `tableName` | TEXT | | Nom de la table affectée |
| `recordId` | INTEGER | | ID de l'enregistrement |
| `oldValue` | TEXT | | Ancienne valeur (JSON) |
| `newValue` | TEXT | | Nouvelle valeur (JSON) |
| `ipAddress` | TEXT | | Adresse IP |
| `userAgent` | TEXT | | Agent utilisateur |
| `timestamp` | TEXT | DEFAULT CURRENT_TIMESTAMP | Horodatage |

**Conservation:** Logs conservés 90 jours par défaut

---

## 📈 Données actuelles

### Statistiques globales

| Entité | Nombre | Statut |
|--------|--------|--------|
| **Users** | 1 | Utilisateur admin par défaut |
| **Staff** | 2 | Jean Dupont, Marie Martin |
| **Themes** | 3 | Leadership, Communication, Sécurité |
| **Evaluations** | ? | À vérifier |
| **Audit Logs** | ? | Selon config |

### Intégrité référentielle

- ✅ **Staff** → **Evaluations**: Clé étrangère (CASCADE DELETE)
- ✅ **Users** → **Audit Logs**: Clé étrangère (SET NULL)
- ✅ Pas de références orphelines documentées

---

## 🔒 Mécanismes de sécurité

### 1. Pragmas SQLite

```sql
PRAGMA journal_mode = WAL              -- Write-Ahead Logging
PRAGMA synchronous = NORMAL             -- Synchronisation standard
PRAGMA cache_size = 10000               -- Cache optimisé
PRAGMA foreign_keys = ON                -- Clés étrangères activées
```

**Avantages:**
- 🟢 WAL améliore la performance en lecture
- 🟢 Clés étrangères garantissent l'intégrité
- 🟢 Cache optimisé pour ~10k entrées

### 2. Checkpoint WAL

Après certaines opérations critiques (notamment suppression), le code force:
```javascript
db.pragma('wal_checkpoint(FULL)')
```

**Impact:** Données persistées immédiatement sur disque

### 3. Logs d'audit

Chaque action est enregistrée avec:
- Utilisateur (ID + nom)
- Type d'action (CREATE, UPDATE, DELETE)
- Valeurs anciennes/nouvelles (JSON)
- Métadonnées (IP, UserAgent, timestamp)

### ⚠️ PROBLÈMES DE SÉCURITÉ IDENTIFIÉS

| Problème | Sévérité | Description |
|----------|----------|-------------|
| **Mots de passe en clair** | 🔴 CRITIQUE | Aucun hashage (admin123) |
| **Pas de chiffrement BD** | 🔴 CRITIQUE | Données sensibles lisibles |
| **SQL Injection possible** | 🟠 HAUTE | Utilisation de `db.exec()` |
| **Mode multi-user non sécurisé** | 🟠 HAUTE | Pas de contrôle d'accès granulaire |

---

## ⚡ Performance et optimisations

### Taille estimée de la base

```
Staff (2 enregistrements):           ~500 bytes
Themes (3 enregistrements):          ~1 KB
Users (1 enregistrement):            ~200 bytes
Evaluations (variable):              ~100-200 KB par 100 évals
Audit Logs (conservés 90j):          ~50-100 KB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total estimé (sans évals):           ~2-3 MB
```

### Optimisations appliquées

✅ **Cache:** 10 000 pages (40 MB approx)  
✅ **WAL Mode:** Lectures parallèles possibles  
✅ **Transactions:** Support des opérations groupées  
❌ **Indexes:** Aucun index documenté (à considérer)

### Recommandations performance

```sql
-- Créer des index pour les requêtes fréquentes
CREATE INDEX idx_staff_matricule ON staff(matricule);
CREATE INDEX idx_evaluations_staffId ON evaluations(staffId);
CREATE INDEX idx_evaluations_created ON evaluations(createdAt DESC);
CREATE INDEX idx_audit_logs_userId ON audit_logs(userId);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
```

---

## 💾 Gestion des données

### Backup et Restore

**Fichiers de secours:**
- `electron/database.js.backup` - Sauvegarde du code
- `electron/database.js.old` - Version antérieure

**Données JSON exportées:**
- `data/staff.json` - Données du personnel
- `data/themes.json` - Référentiel des formations

### Imports/Exports

**Méthode:** Conversion JSON bidirectionnelle

```javascript
// Export tous les types
const exported = await db.exportData('all')
// Formats: 'all', 'staff', 'evaluations', 'themes'

// Import avec validation
const imported = await db.importData(jsonString)
// Retourne le nombre d'enregistrements importés
```

### Mode Fallback (En mémoire)

Si SQLite n'est pas disponible:
1. Détection automatique du module `better-sqlite3`
2. Basculement vers `MemoryDatabaseService`
3. Les données persistent en fichiers JSON dans `data/`

**Avantage:** L'app continue de fonctionner même sans SQLite

---

## 🐛 Problèmes potentiels et recommandations

### 1. Sécurité des mots de passe

**Problème:** Stockage en clair
```javascript
// ❌ ACTUEL
password TEXT NOT NULL  // "admin123" en clair

// ✅ RECOMMANDÉ
// Utiliser bcrypt ou argon2
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 10);
```

### 2. Champs mal utilisés

**Problème:** `observedChanges` et `requestedTrainings` sont JSON dans TEXT
```javascript
// ✅ MIEUX: Utiliser des tables séparées
CREATE TABLE evaluation_observations (
  id INTEGER PRIMARY KEY,
  evaluationId INTEGER REFERENCES evaluations(id),
  description TEXT,
  FOREIGN KEY (evaluationId) REFERENCES evaluations(id) ON DELETE CASCADE
);
```

### 3. Manque d'indexes

**Impact:** Requêtes lentes sur tables grandes

```sql
CREATE INDEX idx_evaluations_status ON evaluations(status);
CREATE INDEX idx_evaluations_date ON evaluations(fillDate DESC);
```

### 4. Pas de versioning BD

**Recommandation:** Ajouter un système de migrations
```javascript
PRAGMA user_version = 1;  // Tracker la version du schéma
```

### 5. Limitations du fallback mémoire

- ❌ Pas de persistance automatique
- ❌ Données perdues au redémarrage
- ⚠️ Pas adéquat pour production

### 6. WAL Checkpoint non optimisé

**Actuel:** Checkpoint FULL après chaque suppression
```javascript
db.pragma('wal_checkpoint(FULL)')  // Coûteux
```

**Recommandé:** Utiliser une stratégie intelligente
```javascript
db.pragma('wal_checkpoint(PASSIVE)')  // Non-bloquant
// Ou faire checkpoint périodiquement au lieu d'à chaque fois
```

---

## 📋 Plan d'amélioration recommandé

### 🔴 URGENT (Sécurité)
- [ ] Implémenter le hashage des mots de passe (bcrypt)
- [ ] Ajouter la validation des entrées (prévention SQL injection)
- [ ] Implémenter le chiffrement des données sensibles

### 🟠 IMPORTANT (Performance & Stabilité)
- [ ] Ajouter les indexes manquants
- [ ] Mettre en place les migrations BD
- [ ] Optimiser les checkpoints WAL
- [ ] Ajouter une limite à la taille des logs d'audit

### 🟡 RECOMMANDÉ (Qualité)
- [ ] Décomposer la table evaluations (trop de colonnes)
- [ ] Normaliser les données (éviter JSON dans TEXT)
- [ ] Ajouter les timestamps de modification partout
- [ ] Documenter les rôles utilisateur

---

## 📊 Schéma normalisé recommandé

```
users (5 cols)
├─ roles (RBAC)
├─ user_sessions (authentification)
└─ audit_logs

staff (10 cols)
├─ evaluations (30 cols - core)
│  ├─ evaluation_scores (ratings 1-5)
│  ├─ evaluation_6months_followup (ratings)
│  └─ evaluation_comments (texts)
├─ training_requests (foreign key)
└─ training_history

themes (3 cols)
trainers (référentiel)
app_config (1 row)
```

---

## ✅ Conclusion

**État général:** 🟠 **BON, mais avec problèmes de sécurité**

### Points forts:
✅ Architecture bien structurée  
✅ Mode fallback robuste  
✅ Audit logging complet  
✅ Pragmas optimisés  

### Points faibles:
❌ Sécurité critique (mots de passe en clair)  
❌ Schéma non normalisé (143 colonnes)  
❌ Pas d'indexes  
❌ Checkpoint WAL inefficace  

### Actions immédiates requises:
1. Implémenter le hashage des mots de passe
2. Ajouter les indexes principaux
3. Réorganiser la table evaluations
4. Tester l'intégrité référentielle

---

**Fin de l'analyse**
