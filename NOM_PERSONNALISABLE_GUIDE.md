# Guide de Personnalisation du Nom de l'Application

## 📝 Vue d'ensemble

L'application CFPT Ivato permet maintenant de personnaliser le nom affiché partout dans l'interface de manière simple et dynamique.

---

## ✨ Fonctionnalité

### Un seul champ à modifier

Dans **Paramètres → Personnalisation**, vous trouverez un champ unique pour personnaliser le nom de votre application.

### Affichage dynamique et immédiat

Dès que vous modifiez et sauvegardez le nom, il apparaît **automatiquement et immédiatement** dans :

1. **Barre de titre de la fenêtre** (en haut de l'application Electron)
2. **Sidebar gauche** (logo et nom de l'application)
3. **En-têtes de page** (à côté du titre de chaque section)
4. **Page de connexion** (titre principal et barre de titre)

---

## 🚀 Comment l'utiliser

### Étape 1 : Accéder aux paramètres
1. Ouvrez l'application
2. Cliquez sur **Paramètres** dans le menu de gauche
3. Cliquez sur l'onglet **Personnalisation**

### Étape 2 : Modifier le nom
1. Dans le champ "Nom de l'application", entrez le nouveau nom souhaité
2. Exemple : "Mon Centre de Formation"
3. Cliquez sur le bouton **Sauvegarder**

### Étape 3 : Vérifier
Le nouveau nom apparaît **immédiatement** :
- ✅ Dans la barre de titre (en haut de la fenêtre)
- ✅ Dans la sidebar (à gauche)
- ✅ Dans tous les en-têtes
- ✅ Sur la page de connexion

---

## 🔄 Fonctionnalités disponibles

### Sauvegarder
- Cliquez sur **Sauvegarder** pour appliquer le nouveau nom
- Les changements sont **immédiat** et **persistants**
- Le nom est conservé même après redémarrage

### Réinitialiser
- Cliquez sur **Réinitialiser** pour revenir au nom par défaut
- Le nom par défaut est : "Centre de Formation Professionnelle et Technique d'Ivato"

---

## 💾 Stockage

Le nom personnalisé est sauvegardé localement dans le navigateur (localStorage) :
- **Clé** : `cfpt_app_labels`
- **Format** : JSON
- **Emplacement** : Local (aucune donnée envoyée à l'extérieur)

---

## 🔧 Détails Techniques

### Composants mis à jour

Les fichiers suivants ont été modifiés pour afficher le nom dynamiquement :

1. **`src/components/CustomizationTab.tsx`**
   - Interface simplifiée avec un seul champ
   - Suppression des options import/export
   - Gestion de la sauvegarde du nom

2. **`src/components/TitleBar.tsx`**
   - Affiche le nom dans la barre de titre Electron
   - Mise à jour automatique lors du changement

3. **`src/components/layout/Sidebar.tsx`**
   - Affiche le nom dans la sidebar gauche
   - Remplace le texte en dur par la valeur dynamique

4. **`src/components/layout/Header.tsx`**
   - Affiche le nom dans l'en-tête de chaque page
   - À côté du titre de la section

5. **`src/pages/auth/Login.tsx`**
   - Affiche le nom sur la page de connexion
   - Dans la barre de titre et le titre principal

### Services utilisés

- **`AppConfigService`** : Gestion du stockage et de la récupération du nom
- **`AppConfigContext`** : Partage du nom dans toute l'application via React Context

### Propagation des changements

Lorsque vous sauvegardez le nom :
1. Le service `AppConfigService.saveLabels()` sauvegarde dans localStorage
2. Un événement `app-labels-updated` est émis
3. Tous les composants écoutant cet événement se mettent à jour automatiquement
4. **Aucun rechargement de page nécessaire**

---

## 📊 Exemple de code

### Utilisation dans un composant

```typescript
import { useAppConfig } from '../contexts/AppConfigContext';

function MonComposant() {
  const { labels } = useAppConfig();
  
  return (
    <div>
      <h1>{labels.appName}</h1>
    </div>
  );
}
```

Le composant se mettra automatiquement à jour quand le nom change.

---

## ❓ FAQ

### Le nom ne change pas ?
- Vérifiez que vous avez cliqué sur "Sauvegarder"
- Si le problème persiste, actualisez la page (F5)

### Peut-on utiliser des emojis ?
- Oui ! Le champ accepte tout texte Unicode
- Exemple : "🎓 Mon Centre de Formation"

### Quelle est la longueur maximale ?
- Aucune limite technique
- Recommandation : 50-60 caractères maximum pour un bon affichage

### Le nom est-il partagé entre utilisateurs ?
- Non, le nom est stocké localement sur chaque ordinateur
- Chaque installation peut avoir son propre nom

### Que se passe-t-il si je désinstalle l'app ?
- Le nom personnalisé sera perdu
- À la réinstallation, le nom par défaut sera restauré

---

## 🎨 Personnalisation avancée

Si vous souhaitez modifier d'autres éléments de l'interface, vous pouvez :
- Éditer directement les fichiers dans `src/components/`
- Modifier les valeurs par défaut dans `src/services/appConfigService.ts`
- Ajouter d'autres champs personnalisables dans `CustomizationTab.tsx`

---

## 📞 Support

Pour toute question :
- Email : support@cfpt-ivato.mg
- Documentation technique : Consultez le code source

---

*Dernière mise à jour : Novembre 2024*  
*Version 2.3.0*
