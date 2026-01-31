# Test de la Fonctionnalité de Sélection de Comptes

## 🧪 Guide de Test

### Méthode 1 : Créer des comptes via l'inscription

1. **Accédez à la page d'inscription** (lien sur la page de login)
2. **Créez plusieurs comptes** :
   - Compte 1 : Jean Dupont / jean.dupont@test.com / password123
   - Compte 2 : Marie Martin / marie.martin@test.com / password123
   - Compte 3 : Pierre Durand / pierre.durand@test.com / password123

3. **Connectez-vous avec chaque compte**
4. **Déconnectez-vous**
5. **Retournez sur la page de login** → La liste des comptes doit apparaître

---

### Méthode 2 : Utiliser le compte admin par défaut

1. **Ouvrez la page de login**
2. **Connectez-vous avec** :
   - Email : `admin@cfpt-ivato.mg`
   - Mot de passe : `admin123`
3. **Déconnectez-vous**
4. **Retournez sur la page de login** → Le compte admin doit apparaître dans la liste

---

### Méthode 3 : Ajouter manuellement des comptes de test via la console

1. **Ouvrez la console du navigateur** (F12)
2. **Collez ce script** pour ajouter des comptes de test :

```javascript
// Créer des utilisateurs de test
const testUsers = [
  {
    id: '101',
    email: 'jean.dupont@cfpt.mg',
    password: 'btoa:' + btoa('password123' + 'CFP_SALT_2024'),
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: '102',
    email: 'marie.martin@cfpt.mg',
    password: 'btoa:' + btoa('password123' + 'CFP_SALT_2024'),
    firstName: 'Marie',
    lastName: 'Martin',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: '103',
    email: 'pierre.durand@cfpt.mg',
    password: 'btoa:' + btoa('password123' + 'CFP_SALT_2024'),
    firstName: 'Pierre',
    lastName: 'Durand',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: '104',
    email: 'sophie.bernard@cfpt.mg',
    password: 'btoa:' + btoa('password123' + 'CFP_SALT_2024'),
    firstName: 'Sophie',
    lastName: 'Bernard',
    role: 'admin',
    createdAt: new Date().toISOString()
  }
];

// Récupérer les utilisateurs existants
const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');

// Ajouter les utilisateurs de test
const allUsers = [...existingUsers, ...testUsers];
localStorage.setItem('users', JSON.stringify(allUsers));

console.log('✅ Utilisateurs de test créés:', testUsers.length);
console.log('📊 Total utilisateurs:', allUsers.length);
```

3. **Rafraîchissez la page** (F5)
4. **Connectez-vous avec un des comptes** :
   - Email : `jean.dupont@cfpt.mg`
   - Mot de passe : `password123`
5. **Déconnectez-vous**
6. **La liste doit maintenant apparaître !**

---

### Méthode 4 : Ajouter directement à la liste de sélection

Si vous voulez voir la liste immédiatement sans connexion :

```javascript
// Ajouter directement des comptes dans la liste de sélection
const savedAccounts = [
  {
    email: 'jean.dupont@cfpt.mg',
    firstName: 'Jean',
    lastName: 'Dupont',
    lastLogin: new Date().toISOString()
  },
  {
    email: 'marie.martin@cfpt.mg',
    firstName: 'Marie',
    lastName: 'Martin',
    lastLogin: new Date().toISOString()
  },
  {
    email: 'pierre.durand@cfpt.mg',
    firstName: 'Pierre',
    lastName: 'Durand',
    lastLogin: new Date().toISOString()
  }
];

localStorage.setItem('cfpt_saved_accounts', JSON.stringify(savedAccounts));
console.log('✅ Liste de comptes créée');

// Rafraîchir la page
location.reload();
```

---

## ✅ Tests à Effectuer

### Test 1 : Affichage de la liste
- [ ] Les comptes s'affichent sur la page de login
- [ ] Maximum 5 comptes affichés
- [ ] Avatar avec initiales visible
- [ ] Nom complet et email affichés

### Test 2 : Sélection d'un compte
- [ ] Clic sur un compte fonctionne
- [ ] Le compte est sélectionné (badge bleu)
- [ ] Le champ email disparaît
- [ ] Seul le mot de passe est demandé
- [ ] Message "Bienvenue [Prénom]" affiché

### Test 3 : Connexion avec compte sélectionné
- [ ] Saisie du mot de passe fonctionne
- [ ] Connexion réussie
- [ ] Redirection vers le dashboard

### Test 4 : Changement de compte
- [ ] Bouton X visible sur le compte sélectionné
- [ ] Clic sur X désélectionne le compte
- [ ] Retour à la vue liste + formulaire complet

### Test 5 : Suppression d'un compte
- [ ] Survol d'un compte fait apparaître l'icône poubelle
- [ ] Clic sur la poubelle ouvre le modal
- [ ] Modal affiche les bonnes informations
- [ ] Champ mot de passe requis
- [ ] Mot de passe incorrect → message d'erreur
- [ ] Mot de passe correct → suppression réussie
- [ ] Le compte disparaît de la liste

### Test 6 : Persistance
- [ ] Déconnexion → reconnexion : liste toujours là
- [ ] Fermeture navigateur → réouverture : liste toujours là
- [ ] Rafraîchissement page (F5) : liste toujours là

---

## 🐛 Dépannage

### La liste ne s'affiche pas

**Vérification 1** : Y a-t-il des comptes dans localStorage ?
```javascript
console.log('Comptes sauvegardés:', localStorage.getItem('cfpt_saved_accounts'));
```

**Vérification 2** : Y a-t-il des utilisateurs enregistrés ?
```javascript
console.log('Utilisateurs:', localStorage.getItem('users'));
```

**Solution** : Utiliser la méthode 3 ou 4 ci-dessus pour créer des comptes de test.

### Les comptes ne se sauvegardent pas après connexion

**Vérification** : Regarder les logs dans la console
```javascript
// Logs attendus :
// 🔐 Login: Tentative de connexion pour: xxx
// ✅ Login: Connexion réussie
// 📂 User dans localStorage: {...}
// ✅ Sauvegarde du compte: xxx
```

**Solution** : Vérifier que l'utilisateur a bien un firstName et lastName.

### Le bouton de suppression n'apparaît pas

**Cause** : Le bouton n'apparaît qu'au survol (hover)
**Solution** : Passer la souris sur un compte pour voir le bouton 🗑️

---

## 📊 Résultats Attendus

### Page de login avec comptes

```
╔═══════════════════════════════════════╗
║  Logo CFPT Ivato                      ║
║                                       ║
║  📋 Comptes enregistrés               ║
║  ┌─────────────────────────────────┐ ║
║  │ 👤 Jean Dupont              [🗑] │ ║
║  │    jean.dupont@cfpt.mg          │ ║
║  └─────────────────────────────────┘ ║
║  ┌─────────────────────────────────┐ ║
║  │ 👤 Marie Martin             [🗑] │ ║
║  │    marie.martin@cfpt.mg         │ ║
║  └─────────────────────────────────┘ ║
║                                       ║
║  🔐 Connexion                         ║
║  Email: [_____________]               ║
║  Mot de passe: [_____________]        ║
║  [Se connecter]                       ║
╚═══════════════════════════════════════╝
```

---

## 🔍 Console Logs

Si tout fonctionne, vous devriez voir dans la console :

```
🔐 Login: Tentative de connexion pour: jean.dupont@cfpt.mg
🔐 AuthProvider.login: Tentative de connexion pour: jean.dupont@cfpt.mg
🔍 AuthProvider.login: Recherche parmi X utilisateur(s) enregistré(s)
👤 AuthProvider.login: Utilisateur trouvé: jean.dupont@cfpt.mg
✅ AuthProvider.login: Connexion réussie pour: jean.dupont@cfpt.mg
✅ Login: Connexion réussie
📂 User dans localStorage: {"id":"101","email":"jean.dupont@cfpt.mg",...}
✅ Sauvegarde du compte: jean.dupont@cfpt.mg
```

---

## 📞 Support

Si le problème persiste :
1. Vérifiez la console pour les erreurs
2. Nettoyez le localStorage : `localStorage.clear()` puis F5
3. Recommencez avec la méthode 3 pour créer des comptes de test

---

*Document de test - Version 2.3.0*
