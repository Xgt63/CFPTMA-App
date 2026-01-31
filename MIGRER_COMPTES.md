# Migration des comptes existants

## Problème
Les comptes créés avant l'ajout de la fonctionnalité de sélection rapide ne sont pas dans la liste `cfpt_saved_accounts`.

## Solution 1 : Script de migration automatique

Collez ce script dans la console (F12) :

```javascript
// Script de migration - transfère tous les comptes existants vers la liste
const users = JSON.parse(localStorage.getItem('users') || '[]');
const savedAccounts = users.map(u => ({
  email: u.email,
  firstName: u.firstName || 'Utilisateur',
  lastName: u.lastName || 'Inconnu',
  lastLogin: u.createdAt
}));

if (savedAccounts.length > 0) {
  localStorage.setItem('cfpt_saved_accounts', JSON.stringify(savedAccounts.slice(0, 5)));
  console.log('✅ Migration réussie! Comptes migrés:', savedAccounts.length);
  console.log('Comptes:', savedAccounts);
  location.reload();
} else {
  console.log('⚠️ Aucun compte à migrer');
}
```

## Solution 2 : Reconnexion

Reconnectez-vous simplement avec chaque compte :
1. Entrez l'email et le mot de passe
2. Connectez-vous
3. Le compte sera automatiquement ajouté à la liste
4. Déconnectez-vous
5. Répétez pour l'autre compte

## Vérification

Après la migration ou reconnexion, vérifiez :

```javascript
const saved = JSON.parse(localStorage.getItem('cfpt_saved_accounts') || '[]');
console.log('Comptes sauvegardés:', saved.length);
saved.forEach((acc, i) => {
  console.log(`${i+1}. ${acc.firstName} ${acc.lastName} (${acc.email})`);
});
```

## Test rapide

Ajoutez 3 comptes de test instantanément :

```javascript
const testAccounts = [
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
    email: 'paul.bernard@cfpt.mg',
    firstName: 'Paul',
    lastName: 'Bernard',
    lastLogin: new Date().toISOString()
  }
];

localStorage.setItem('cfpt_saved_accounts', JSON.stringify(testAccounts));
console.log('✅ 3 comptes de test ajoutés');
location.reload();
```
