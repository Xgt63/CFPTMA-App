// Script pour résoudre les problèmes d'authentification et d'accès aux pages
// Ce script doit être exécuté dans la console du navigateur ou via les DevTools d'Electron

console.log('🔧 Script de correction des problèmes d\'authentification CFPT');

// Fonction pour créer un utilisateur admin par défaut
function createDefaultAdmin() {
    console.log('👤 Création du compte administrateur par défaut...');
    
    // Créer l'utilisateur admin dans la base locale
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const adminExists = users.some(u => u.email === 'admin@cfp.com');
    
    if (!adminExists) {
        const adminUser = {
            id: 'admin-default-' + Date.now(),
            email: 'admin@cfp.com',
            password: 'btoa:' + btoa('admin123' + 'CFP_SALT_2024'),
            firstName: 'Administrateur',
            lastName: 'CFPT',
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        
        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
        console.log('✅ Compte admin créé:', adminUser.email);
    } else {
        console.log('ℹ️ Compte admin existe déjà');
    }
    
    return users.find(u => u.email === 'admin@cfp.com');
}

// Fonction pour connecter automatiquement l'admin
function loginAsAdmin() {
    console.log('🔐 Connexion automatique en tant qu\'administrateur...');
    
    const adminUser = {
        id: 'admin-auto',
        email: 'admin@cfp.com',
        firstName: 'Administrateur',
        lastName: 'CFPT',
        role: 'admin',
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('user', JSON.stringify(adminUser));
    console.log('✅ Connecté en tant que:', adminUser.email);
    
    return adminUser;
}

// Fonction pour créer des données d'exemple
function createSampleData() {
    console.log('📊 Création de données d\'exemple...');
    
    // Données d'exemple pour le personnel
    const sampleStaff = [
        {
            id: 'staff-1',
            matricule: 'CFPT001',
            firstName: 'Jean',
            lastName: 'Dupont',
            position: 'Formateur',
            email: 'jean.dupont@cfp.com',
            phone: '+261 32 00 000 01',
            establishment: 'Centre Principal',
            formationYear: '2024',
            createdAt: new Date().toISOString()
        },
        {
            id: 'staff-2',
            matricule: 'CFPT002',
            firstName: 'Marie',
            lastName: 'Martin',
            position: 'Coordinatrice',
            email: 'marie.martin@cfp.com',
            phone: '+261 32 00 000 02',
            establishment: 'Centre Principal',
            formationYear: '2024',
            createdAt: new Date().toISOString()
        }
    ];
    
    // Thèmes de formation d'exemple
    const sampleThemes = [
        {
            id: 'theme-1',
            name: 'Formation en Informatique',
            description: 'Bases de l\'informatique et bureautique',
            createdAt: new Date().toISOString()
        },
        {
            id: 'theme-2',
            name: 'Formation Pédagogique',
            description: 'Méthodes d\'enseignement et pédagogie',
            createdAt: new Date().toISOString()
        }
    ];
    
    localStorage.setItem('staff.json', JSON.stringify(sampleStaff));
    localStorage.setItem('themes.json', JSON.stringify(sampleThemes));
    localStorage.setItem('evaluations.json', JSON.stringify([]));
    
    console.log('✅ Données d\'exemple créées:', {
        staff: sampleStaff.length,
        themes: sampleThemes.length,
        evaluations: 0
    });
}

// Fonction pour diagnostiquer les problèmes
function diagnoseProblems() {
    console.log('🔍 Diagnostic des problèmes...');
    
    const diagnostics = {
        user: localStorage.getItem('user'),
        users: localStorage.getItem('users'),
        staff: localStorage.getItem('staff.json'),
        evaluations: localStorage.getItem('evaluations.json'),
        themes: localStorage.getItem('themes.json'),
        currentUrl: window.location.href
    };
    
    console.log('📋 État actuel:', {
        isLoggedIn: !!diagnostics.user,
        usersCount: diagnostics.users ? JSON.parse(diagnostics.users).length : 0,
        staffCount: diagnostics.staff ? JSON.parse(diagnostics.staff).length : 0,
        evaluationsCount: diagnostics.evaluations ? JSON.parse(diagnostics.evaluations).length : 0,
        themesCount: diagnostics.themes ? JSON.parse(diagnostics.themes).length : 0,
        currentUrl: diagnostics.currentUrl
    });
    
    return diagnostics;
}

// Fonction principale de correction
function fixAuthProblems() {
    console.log('🚀 Démarrage de la correction des problèmes d\'authentification...');
    
    const diagnostics = diagnoseProblems();
    
    // Créer le compte admin si nécessaire
    createDefaultAdmin();
    
    // Connecter automatiquement
    loginAsAdmin();
    
    // Créer des données d'exemple si nécessaire
    const hasData = diagnostics.staff && JSON.parse(diagnostics.staff).length > 0;
    if (!hasData) {
        createSampleData();
    }
    
    console.log('✅ Correction terminée! Vous pouvez maintenant:');
    console.log('  1. Accéder aux pages protégées');
    console.log('  2. Utiliser le compte admin@cfp.com / admin123');
    console.log('  3. Naviguer vers /dashboard, /staff, /statistics, etc.');
    
    // Rediriger vers le dashboard si on est sur la page de login
    if (window.location.hash.includes('/login') || window.location.hash === '') {
        console.log('🔄 Redirection vers le dashboard...');
        window.location.hash = '/dashboard';
    }
    
    return true;
}

// Fonction pour réinitialiser complètement
function resetEverything() {
    console.log('🔄 Réinitialisation complète...');
    localStorage.clear();
    console.log('✅ Toutes les données effacées. Rechargez la page.');
}

// Exposer les fonctions globalement pour utilisation manuelle
window.cfptFix = {
    fixAuthProblems,
    createDefaultAdmin,
    loginAsAdmin,
    createSampleData,
    diagnoseProblems,
    resetEverything
};

// Exécution automatique
console.log('🎯 Fonctions disponibles:');
console.log('  - cfptFix.fixAuthProblems() : Corriger tous les problèmes');
console.log('  - cfptFix.diagnoseProblems() : Diagnostiquer l\'état');
console.log('  - cfptFix.resetEverything() : Tout réinitialiser');

// Auto-correction si pas d'utilisateur connecté
const currentUser = localStorage.getItem('user');
if (!currentUser) {
    console.log('⚡ Auto-correction activée...');
    fixAuthProblems();
} else {
    console.log('ℹ️ Utilisateur déjà connecté. Utilisez cfptFix.diagnoseProblems() pour plus d\'infos.');
}