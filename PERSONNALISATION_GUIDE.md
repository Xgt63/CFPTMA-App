# Guide de Personnalisation - CFPT Ivato

## 📋 Vue d'ensemble

Ce guide décrit la nouvelle fonctionnalité de personnalisation des libellés dans l'application CFPT Ivato.

---

## ✨ Nouvelle Fonctionnalité : Personnalisation des Libellés

### Description

Vous pouvez maintenant personnaliser tous les textes affichés dans l'application, incluant :
- Le nom de l'application
- Les noms des sections
- Les libellés des boutons
- Les noms des champs de formulaire
- Et bien plus encore !

### Accès

1. Ouvrez l'application
2. Allez dans **Paramètres**
3. Cliquez sur l'onglet **Personnalisation**

---

## 🎨 Sections Personnalisables

### 1. Nom de l'Application
- **Nom complet** : Nom affiché dans les en-têtes (par défaut : "Centre de Formation Professionnelle et Technique d'Ivato")
- **Nom court** : Nom affiché dans la sidebar (par défaut : "CFPT Ivato")

### 2. Sections Principales
- Tableau de Bord
- Personnel
- Évaluation
- Statistiques
- Paramètres

### 3. Gestion du Personnel
- Membre (singulier)
- Membres (pluriel)
- Boutons : Ajouter, Modifier, Supprimer

### 4. Évaluations
- Formulaire d'évaluation
- Évaluations (pluriel)
- Nouvelle évaluation

### 5. Actions Générales
- Enregistrer, Annuler, Modifier, Supprimer
- Rechercher, Filtrer
- Exporter, Importer

### 6. Champs de Formulaire
- Prénom, Nom, Email, Téléphone
- Poste, Établissement
- Année de formation, Matricule

---

## 💾 Fonctionnalités

### Sauvegarder
1. Modifiez les libellés souhaités
2. Cliquez sur **Sauvegarder**
3. Les changements sont appliqués immédiatement dans toute l'application

### Exporter
1. Cliquez sur **Exporter**
2. Un fichier JSON est téléchargé avec votre personnalisation
3. Conservez ce fichier pour réutilisation future

### Importer
1. Cliquez sur **Importer**
2. Sélectionnez un fichier JSON de personnalisation précédemment exporté
3. Vos libellés sont restaurés instantanément

### Réinitialiser
1. Cliquez sur **Réinitialiser**
2. Confirmez l'action
3. Tous les libellés reviennent aux valeurs par défaut

---

## 🔧 Fichiers Techniques Ajoutés

### Services
- `src/services/appConfigService.ts` : Service de gestion des libellés

### Contextes
- `src/contexts/AppConfigContext.tsx` : Contexte React pour les libellés

### Composants
- `src/components/CustomizationTab.tsx` : Interface de personnalisation

### Stockage
- Les libellés personnalisés sont sauvegardés dans `localStorage` sous la clé `cfpt_app_labels`

---

## 🐛 Corrections de la Base de Données

### Problèmes Corrigés

1. **Méthodes manquantes** : L'ancien fichier `database.js` faisait référence à des méthodes `_sqlite_*` qui n'existaient pas
2. **Schéma incomplet** : La table `evaluations` ne contenait pas tous les champs nécessaires
3. **Gestion d'erreurs** : Amélioration du fallback vers le mode mémoire en cas d'erreur SQLite

### Changements Principaux

#### Table `evaluations` enrichie
- Ajout de tous les champs manquants (gender, trainingCenter, trainers, etc.)
- Ajout de tous les champs de suivi à 6 mois (fu_*)
- Ajout du champ `status` et `evaluationType`

#### Table `staff`
- Correction du type de `formationYear` : INTEGER → TEXT (pour supporter "2023-2024")

#### Implémentations complètes
- Toutes les méthodes CRUD pour Users, Staff, Themes, Evaluations
- Méthodes d'export/import de données
- Calcul des statistiques d'évaluation

#### Robustesse
- Basculement automatique vers le mode mémoire si SQLite échoue
- Création automatique d'un utilisateur admin par défaut
- Gestion d'erreurs améliorée avec logs détaillés

---

## 📊 Structure de la Base de Données

### Tables

1. **users**
   - id, firstName, lastName, email, password, role
   - createdAt, updatedAt

2. **staff**
   - id, matricule, firstName, lastName, position
   - email, phone, establishment, formationYear
   - createdAt, updatedAt

3. **themes**
   - id, name, description
   - createdAt, updatedAt

4. **evaluations**
   - Informations personnelles (firstName, lastName, gender, etc.)
   - Informations formation (formationTheme, startDate, endDate, etc.)
   - 28 critères d'évaluation (skillsAcquisition, teamworkSense, etc.)
   - Impact et observations
   - Champs de suivi à 6 mois (15 critères fu_*)
   - Métadonnées (status, evaluationType, createdAt, updatedAt)

---

## 🚀 Utilisation en Code

### Hook useAppConfig

```typescript
import { useAppConfig } from '../contexts/AppConfigContext';

function MyComponent() {
  const { labels, updateLabels, resetLabels, getLabel } = useAppConfig();
  
  // Utiliser un libellé
  const staffLabel = labels.staff;
  
  // Obtenir un libellé spécifique
  const saveLabel = getLabel('save');
  
  return <div>{saveLabel}</div>;
}
```

### Service AppConfigService

```typescript
import { AppConfigService } from '../services/appConfigService';

// Obtenir tous les libellés
const labels = AppConfigService.getLabels();

// Obtenir un libellé spécifique
const label = AppConfigService.getLabel('dashboard');

// Sauvegarder des libellés
AppConfigService.saveLabels({ dashboard: 'Mon Tableau' });

// Réinitialiser
AppConfigService.resetLabels();

// Exporter
const json = AppConfigService.exportLabels();

// Importer
AppConfigService.importLabels(jsonString);
```

---

## 📝 Notes Importantes

### Compatibilité
- Les changements sont rétrocompatibles
- L'ancienne base de données a été sauvegardée dans `database.js.old`
- Les données existantes sont préservées

### Performance
- Les libellés sont chargés une seule fois au démarrage
- Les changements se propagent automatiquement via les événements
- Aucun impact sur les performances de l'application

### Sécurité
- Les libellés sont stockés localement
- Aucune donnée n'est envoyée vers l'extérieur
- Les fichiers exportés sont en JSON lisible

---

## 🔍 Dépannage

### Les changements ne s'appliquent pas
1. Vérifiez que vous avez cliqué sur "Sauvegarder"
2. Actualisez la page (F5)
3. Redémarrez l'application si nécessaire

### Erreur lors de l'import
- Assurez-vous que le fichier JSON est valide
- Vérifiez que le fichier provient bien d'un export de l'application

### Libellés affichés en anglais ou codes
- Réinitialisez les libellés aux valeurs par défaut
- Contactez le support si le problème persiste

---

## 📞 Support

Pour toute question ou problème :
- Email : support@cfpt-ivato.mg
- Documentation : Consultez ce fichier

---

*Version 2.3.0 - Novembre 2024*  
*© 2024 CFPT Ivato - Tous droits réservés*
