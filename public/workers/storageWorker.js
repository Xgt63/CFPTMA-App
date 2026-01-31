// Web Worker pour les opérations localStorage non-bloquantes
// Isole les opérations de stockage du thread principal pour éviter les figements d'interface

let localData = {
  users: [],
  staff: [],
  themes: [],
  evaluations: []
};

// Fonction pour charger les données initiales
function loadInitialData() {
  try {
    const users = localStorage.getItem('users');
    const staff = localStorage.getItem('staff');
    const themes = localStorage.getItem('themes');
    const evaluations = localStorage.getItem('evaluations');

    localData.users = users ? JSON.parse(users) : [];
    localData.staff = staff ? JSON.parse(staff) : [];
    localData.themes = themes ? JSON.parse(themes) : [];
    localData.evaluations = evaluations ? JSON.parse(evaluations) : [];

    console.log('Worker: Données initiales chargées');
  } catch (error) {
    console.error('Worker: Erreur chargement données initiales:', error);
  }
}

// Fonction pour sauvegarder les données avec debouncing
let saveTimeout = null;
function debouncedSave(dataType, data) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(dataType, JSON.stringify(data));
      console.log(`Worker: Données ${dataType} sauvegardées (${data.length} éléments)`);
    } catch (error) {
      console.error(`Worker: Erreur sauvegarde ${dataType}:`, error);
    }
  }, 100); // Debounce de 100ms
}

// Initialiser au démarrage du worker
loadInitialData();

// Gérer les messages du thread principal
self.onmessage = function(e) {
  const { action, dataType, data, id } = e.data;

  try {
    switch (action) {
      case 'GET':
        // Retourner les données demandées
        self.postMessage({
          action: 'GET_RESULT',
          dataType,
          data: localData[dataType] || [],
          success: true
        });
        break;

      case 'CREATE':
        // Ajouter un nouvel élément
        if (localData[dataType]) {
          const newItem = { ...data, id: Date.now(), createdAt: new Date().toISOString() };
          localData[dataType].push(newItem);
          debouncedSave(dataType, localData[dataType]);
          
          self.postMessage({
            action: 'CREATE_RESULT',
            dataType,
            data: newItem,
            success: true
          });
        }
        break;

      case 'UPDATE':
        // Mettre à jour un élément existant
        if (localData[dataType]) {
          const index = localData[dataType].findIndex(item => item.id === id);
          if (index !== -1) {
            localData[dataType][index] = { ...localData[dataType][index], ...data };
            debouncedSave(dataType, localData[dataType]);
            
            self.postMessage({
              action: 'UPDATE_RESULT',
              dataType,
              data: localData[dataType][index],
              success: true
            });
          } else {
            self.postMessage({
              action: 'UPDATE_RESULT',
              dataType,
              data: null,
              success: false,
              error: 'Élément non trouvé'
            });
          }
        }
        break;

      case 'DELETE':
        // Supprimer un élément
        if (localData[dataType]) {
          const initialLength = localData[dataType].length;
          localData[dataType] = localData[dataType].filter(item => item.id !== id);
          const deleted = initialLength - localData[dataType].length;
          
          if (deleted > 0) {
            debouncedSave(dataType, localData[dataType]);
            
            // Si on supprime un membre du staff, supprimer aussi ses évaluations
            if (dataType === 'staff' && localData.evaluations) {
              const staffMember = localData.staff.find(s => s.id === id);
              if (staffMember) {
                const initialEvalLength = localData.evaluations.length;
                localData.evaluations = localData.evaluations.filter(
                  evaluation => evaluation.staffId !== id && 
                  !(evaluation.firstName === staffMember.firstName && evaluation.lastName === staffMember.lastName)
                );
                const evalDeleted = initialEvalLength - localData.evaluations.length;
                
                if (evalDeleted > 0) {
                  debouncedSave('evaluations', localData.evaluations);
                }
              }
            }
          }
          
          self.postMessage({
            action: 'DELETE_RESULT',
            dataType,
            data: { success: deleted > 0, changes: deleted },
            success: deleted > 0
          });
        }
        break;

      case 'BULK_UPDATE':
        // Mise à jour en masse
        if (localData[dataType] && Array.isArray(data)) {
          localData[dataType] = data;
          debouncedSave(dataType, localData[dataType]);
          
          self.postMessage({
            action: 'BULK_UPDATE_RESULT',
            dataType,
            data: localData[dataType],
            success: true
          });
        }
        break;

      case 'CLEAR':
        // Vider toutes les données d'un type
        if (localData[dataType]) {
          localData[dataType] = [];
          debouncedSave(dataType, localData[dataType]);
          
          self.postMessage({
            action: 'CLEAR_RESULT',
            dataType,
            data: [],
            success: true
          });
        }
        break;

      case 'RELOAD':
        // Recharger les données depuis localStorage
        loadInitialData();
        self.postMessage({
          action: 'RELOAD_RESULT',
          data: localData,
          success: true
        });
        break;

      default:
        self.postMessage({
          action: 'ERROR',
          error: 'Action non reconnue: ' + action,
          success: false
        });
    }
  } catch (error) {
    console.error('Worker: Erreur traitement message:', error);
    self.postMessage({
      action: 'ERROR',
      error: error.message,
      success: false
    });
  }
};

// Fonction pour forcer une sauvegarde immédiate
function forceSave() {
  Object.keys(localData).forEach(dataType => {
    try {
      localStorage.setItem(dataType, JSON.stringify(localData[dataType]));
    } catch (error) {
      console.error(`Worker: Erreur force save ${dataType}:`, error);
    }
  });
}

// Sauvegarder périodiquement pour éviter les pertes de données
setInterval(forceSave, 30000); // Toutes les 30 secondes

console.log('Storage Worker initialisé et prêt');