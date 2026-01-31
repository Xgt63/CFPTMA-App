// Script de correction rapide pour les données du personnel
// À exécuter dans la console du navigateur

console.log('🔧 Script de correction des données personnel...');

// Données de test valides
const testStaff = [
    {
        id: 1731319000001,
        matricule: 'MAT2024001',
        firstName: 'Marie',
        lastName: 'RAKOTO',
        position: 'Manager',
        email: 'marie.rakoto@cfpt-ivato.mg',
        phone: '034 12 345 67',
        establishment: 'Siège Social',
        formationYear: '2024',
        createdAt: new Date().toISOString()
    },
    {
        id: 1731319000002,
        matricule: 'MAT2024002',
        firstName: 'Pierre',
        lastName: 'ANDRIANTSOA',
        position: 'Formateur Senior',
        email: 'pierre.andriantsoa@cfpt-ivato.mg',
        phone: '034 23 456 78',
        establishment: 'Centre Ivato',
        formationYear: '2024',
        createdAt: new Date().toISOString()
    },
    {
        id: 1731319000003,
        matricule: 'MAT2024003',
        firstName: 'Sophie',
        lastName: 'RAZAFY',
        position: 'Coordinatrice Pédagogique',
        email: 'sophie.razafy@cfpt-ivato.mg',
        phone: '034 34 567 89',
        establishment: 'Centre Ivato',
        formationYear: '2024',
        createdAt: new Date().toISOString()
    },
    {
        id: 1731319000004,
        matricule: 'MAT2024004',
        firstName: 'Jean',
        lastName: 'RASOAVELOMANANA',
        position: 'Formateur',
        email: 'jean.rasoavelomanana@cfpt-ivato.mg',
        phone: '034 45 678 90',
        establishment: 'Centre Ivato',
        formationYear: '2024',
        createdAt: new Date().toISOString()
    },
    {
        id: 1731319000005,
        matricule: 'MAT2024005',
        firstName: 'Hery',
        lastName: 'RANDRIANAIVO',
        position: 'Assistant Administratif',
        email: 'hery.randrianaivo@cfpt-ivato.mg',
        phone: '034 56 789 01',
        establishment: 'Centre Ivato',
        formationYear: '2024',
        createdAt: new Date().toISOString()
    }
];

const themes = [
    {
        id: 1,
        name: 'Leadership Management',
        description: 'Formation sur les techniques de leadership et de management d\'équipe',
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        name: 'Communication Efficace',
        description: 'Améliorer ses compétences en communication interpersonnelle',
        createdAt: new Date().toISOString()
    },
    {
        id: 3,
        name: 'Gestion de Projet',
        description: 'Méthodologies et outils pour la gestion de projets',
        createdAt: new Date().toISOString()
    },
    {
        id: 4,
        name: 'Innovation & Créativité',
        description: 'Développer l\'innovation et la créativité en entreprise',
        createdAt: new Date().toISOString()
    }
];

// Fonction pour ajouter les données
function fixStaffData() {
    try {
        // Vérifier l'état actuel
        const currentStaff = localStorage.getItem('staff');
        const currentThemes = localStorage.getItem('themes');
        
        console.log('📊 État actuel:');
        console.log('Staff:', currentStaff ? JSON.parse(currentStaff).length : 0);
        console.log('Themes:', currentThemes ? JSON.parse(currentThemes).length : 0);
        
        // Ajouter les données
        localStorage.setItem('staff', JSON.stringify(testStaff));
        localStorage.setItem('themes', JSON.stringify(themes));
        
        console.log('✅ Données ajoutées:');
        console.log('Staff:', testStaff.length, 'membres');
        console.log('Themes:', themes.length, 'thèmes');
        
        // Déclencher la synchronisation si la fonction existe
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent('force-ui-refresh', { 
                detail: { timestamp: Date.now() } 
            });
            window.dispatchEvent(event);
        }
        
        return {
            success: true,
            staff: testStaff.length,
            themes: themes.length
        };
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout des données:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Fonction pour vérifier les données
function checkStaffData() {
    const staff = localStorage.getItem('staff');
    const themes = localStorage.getItem('themes');
    const evaluations = localStorage.getItem('evaluations');
    
    console.log('🔍 Vérification complète localStorage:');
    console.log('Staff:', staff ? `${JSON.parse(staff).length} membres` : 'Aucun');
    console.log('Themes:', themes ? `${JSON.parse(themes).length} thèmes` : 'Aucun');
    console.log('Evaluations:', evaluations ? `${JSON.parse(evaluations).length} évaluations` : 'Aucun');
    
    if (staff) {
        const staffData = JSON.parse(staff);
        console.log('👥 Premier membre:', staffData[0]);
        
        // Vérifier la validité
        const valid = staffData.filter(s => s && s.firstName && s.lastName && s.email);
        console.log('✅ Membres valides:', valid.length + '/' + staffData.length);
    }
    
    return {
        staff: staff ? JSON.parse(staff).length : 0,
        themes: themes ? JSON.parse(themes).length : 0,
        evaluations: evaluations ? JSON.parse(evaluations).length : 0
    };
}

// Fonction pour nettoyer et réparer
function repairStaffData() {
    try {
        const currentStaff = localStorage.getItem('staff');
        if (!currentStaff) {
            console.log('➕ Aucune donnée staff, ajout des données de test...');
            return fixStaffData();
        }
        
        const staff = JSON.parse(currentStaff);
        const repairedStaff = staff.filter(member => {
            if (!member) return false;
            
            // Réparer les champs manquants
            if (!member.id) member.id = Date.now() + Math.random();
            if (!member.matricule) member.matricule = `MAT${Date.now()}`;
            if (!member.createdAt) member.createdAt = new Date().toISOString();
            if (!member.formationYear) member.formationYear = '2024';
            
            return member.firstName && member.lastName && member.email;
        });
        
        localStorage.setItem('staff', JSON.stringify(repairedStaff));
        console.log(`🔧 Réparation terminée: ${repairedStaff.length}/${staff.length} membres conservés`);
        
        return {
            success: true,
            repaired: repairedStaff.length,
            removed: staff.length - repairedStaff.length
        };
        
    } catch (error) {
        console.error('❌ Erreur réparation:', error);
        return fixStaffData(); // Fallback
    }
}

// Auto-exécution si pas de données
const currentStatus = checkStaffData();
if (currentStatus.staff === 0) {
    console.log('🚀 Aucune donnée détectée, ajout automatique...');
    fixStaffData();
}

// Export des fonctions pour utilisation manuelle
if (typeof window !== 'undefined') {
    window.fixStaffData = fixStaffData;
    window.checkStaffData = checkStaffData;
    window.repairStaffData = repairStaffData;
    
    console.log('🛠️ Fonctions disponibles:');
    console.log('- fixStaffData() : Ajouter les données de test');
    console.log('- checkStaffData() : Vérifier l\'état des données');
    console.log('- repairStaffData() : Réparer les données existantes');
}