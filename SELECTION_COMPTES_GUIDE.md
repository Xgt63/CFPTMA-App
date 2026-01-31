# Guide de Sélection Rapide des Comptes

## 📝 Vue d'ensemble

La page de connexion affiche maintenant la liste des comptes utilisateurs déjà inscrits, permettant une connexion rapide en un clic.

---

## ✨ Fonctionnalités

### 1. **Liste des comptes enregistrés** (Maximum 5)

Sur la page de login, vous verrez automatiquement :
- Les 5 derniers comptes utilisés
- Nom complet et email de chaque utilisateur
- Avatar avec initiales colorées
- Interface élégante et interactive

### 2. **Connexion rapide**

Pour se connecter rapidement :
1. **Cliquez sur un compte** dans la liste
2. Le compte est sélectionné automatiquement
3. **Entrez uniquement le mot de passe**
4. Cliquez sur "Se connecter"

### 3. **Suppression sécurisée**

Pour supprimer un compte de la liste :
1. **Survolez le compte** avec la souris
2. Un **bouton de suppression** (poubelle) apparaît à droite
3. **Cliquez sur le bouton**
4. Un modal de confirmation s'ouvre
5. **Entrez le mot de passe** du compte à supprimer
6. Cliquez sur "Supprimer"

⚠️ **Sécurité** : La suppression nécessite obligatoirement le mot de passe du compte pour être validée.

---

## 🎯 Interface Utilisateur

### Page de connexion initiale

```
┌─────────────────────────────────────┐
│  Logo CFPT                          │
│  Nom de l'application               │
│                                     │
│  📋 Comptes enregistrés             │
│  ┌───────────────────────────────┐ │
│  │ 👤 Jean Dupont               🗑│ │
│  │    jean.dupont@email.com      │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │ 👤 Marie Martin              🗑│ │
│  │    marie.martin@email.com     │ │
│  └───────────────────────────────┘ │
│                                     │
│  Cliquez sur un compte              │
│                                     │
│  ───────────────────────────────── │
│                                     │
│  🔐 Connexion                       │
│  Email: [____________]              │
│  Mot de passe: [____________]       │
│  [Se connecter]                     │
└─────────────────────────────────────┘
```

### Après sélection d'un compte

```
┌─────────────────────────────────────┐
│  🔐 Connexion                       │
│  Bienvenue Jean                     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 👤 Jean Dupont              ✕ │ │
│  │    jean.dupont@email.com      │ │
│  └───────────────────────────────┘ │
│                                     │
│  Mot de passe: [____________]       │
│  [Se connecter]                     │
└─────────────────────────────────────┘
```

### Modal de suppression

```
┌─────────────────────────────────────┐
│        🗑️ Supprimer le compte       │
│                                     │
│  Confirmez la suppression de :      │
│  ┌───────────────────────────────┐ │
│  │ Jean Dupont                   │ │
│  │ jean.dupont@email.com         │ │
│  └───────────────────────────────┘ │
│                                     │
│  Mot de passe de confirmation:      │
│  [____________]                     │
│                                     │
│  Entrez le mot de passe de ce       │
│  compte pour confirmer              │
│                                     │
│  [Annuler]  [Supprimer]            │
└─────────────────────────────────────┘
```

---

## 🔒 Sécurité

### Protection par mot de passe

La suppression d'un compte de la liste nécessite **obligatoirement** :
- ✅ Le mot de passe du compte à supprimer
- ✅ Validation en temps réel via l'authentification
- ✅ Aucune suppression possible sans mot de passe correct

### Ce qui est supprimé

Quand vous supprimez un compte de la liste :
- ❌ Le compte est retiré de la liste de sélection rapide
- ✅ Les données du compte restent intactes dans l'application
- ✅ L'utilisateur peut toujours se connecter en saisissant son email

**Important** : Cette fonctionnalité supprime uniquement l'entrée de la liste de sélection rapide, pas le compte utilisateur lui-même.

---

## 💾 Stockage

### LocalStorage

Les comptes sont sauvegardés localement :
- **Clé** : `cfpt_saved_accounts`
- **Format** : JSON
- **Données stockées** :
  - Email
  - Prénom et nom
  - Date de dernière connexion

### Limites

- **Maximum** : 5 comptes affichés
- Les comptes les plus récents sont prioritaires
- Stockage local uniquement (par ordinateur)

---

## 🚀 Flux de fonctionnement

### Ajout automatique d'un compte

```
1. Utilisateur se connecte avec email + mot de passe
   ↓
2. Connexion réussie
   ↓
3. Le compte est automatiquement ajouté à la liste
   ↓
4. Mis à jour avec la date de dernière connexion
   ↓
5. Affiché sur la page de login lors de la prochaine visite
```

### Sélection d'un compte

```
1. Utilisateur clique sur un compte dans la liste
   ↓
2. Le compte est sélectionné
   ↓
3. L'email est pré-rempli automatiquement
   ↓
4. Seul le mot de passe est requis
   ↓
5. Connexion immédiate
```

### Suppression d'un compte

```
1. Utilisateur survole un compte
   ↓
2. Bouton de suppression apparaît
   ↓
3. Clic sur le bouton
   ↓
4. Modal de confirmation s'ouvre
   ↓
5. Saisie du mot de passe
   ↓
6. Vérification du mot de passe
   ↓
7a. Mot de passe correct → Suppression
7b. Mot de passe incorrect → Message d'erreur
```

---

## 🎨 Interactions UX

### États visuels

1. **Normal** : Carte grise avec bordure légère
2. **Hover** : Dégradé bleu, bordure colorée, ombre portée
3. **Sélectionné** : Badge bleu avec informations
4. **Bouton supprimer** : Apparaît uniquement au survol

### Animations

- Transition fluide au survol (300ms)
- Apparition progressive du bouton supprimer
- Modal avec effet de flou d'arrière-plan
- Feedback visuel sur toutes les interactions

---

## 💡 Cas d'usage

### Scénario 1 : Premier utilisateur
1. Pas de comptes enregistrés
2. Connexion classique (email + mot de passe)
3. Compte automatiquement ajouté à la liste

### Scénario 2 : Utilisateur régulier
1. Liste de comptes affichée
2. Clic sur son compte
3. Saisie rapide du mot de passe
4. Connexion immédiate

### Scénario 3 : Multi-utilisateurs (même ordinateur)
1. Jusqu'à 5 comptes affichés
2. Chaque utilisateur clique sur le sien
3. Connexion rapide et sécurisée

### Scénario 4 : Suppression d'un ancien compte
1. Survol du compte à supprimer
2. Clic sur l'icône poubelle
3. Confirmation avec mot de passe
4. Compte retiré de la liste

---

## ❓ FAQ

### Combien de comptes peuvent être affichés ?
Maximum 5 comptes. Les plus récents sont affichés en priorité.

### Que se passe-t-il avec le 6ème compte ?
Le compte le plus ancien est automatiquement retiré de la liste.

### La suppression efface-t-elle vraiment le compte ?
Non, elle retire uniquement le compte de la liste de sélection rapide. L'utilisateur peut toujours se connecter normalement.

### Peut-on supprimer un compte sans mot de passe ?
Non, le mot de passe est obligatoire pour des raisons de sécurité.

### Les comptes sont-ils partagés entre ordinateurs ?
Non, chaque ordinateur a sa propre liste locale.

### Que se passe-t-il en cas de changement de mot de passe ?
La liste reste valide. Utilisez simplement le nouveau mot de passe pour vous connecter.

---

## 🔧 Détails Techniques

### Fichiers modifiés

- **`src/pages/auth/Login.tsx`** : Interface complète de sélection et suppression

### Interface SavedAccount

```typescript
interface SavedAccount {
  email: string;
  firstName: string;
  lastName: string;
  lastLogin?: string;
}
```

### Fonctions principales

1. **`loadSavedAccounts()`** : Charge les comptes depuis localStorage
2. **`handleSelectAccount()`** : Sélectionne un compte
3. **`handleDeselectAccount()`** : Désélectionne le compte actuel
4. **`saveAccountToList()`** : Ajoute/met à jour un compte dans la liste
5. **`handleDeleteAccount()`** : Ouvre le modal de suppression
6. **`handleConfirmDelete()`** : Supprime après vérification du mot de passe

### Gestion du localStorage

```javascript
// Lecture
const saved = localStorage.getItem('cfpt_saved_accounts');
const accounts = JSON.parse(saved);

// Écriture
localStorage.setItem('cfpt_saved_accounts', JSON.stringify(accounts));
```

---

## 📞 Support

Pour toute question :
- Email : support@cfpt-ivato.mg
- Documentation technique : Consultez le code source

---

*Dernière mise à jour : Novembre 2024*  
*Version 2.3.0*
