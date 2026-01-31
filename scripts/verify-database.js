/**
 * 🔍 Script de Vérification de la Base de Données
 * Lance la vérification et la migration depuis la console
 */

// Simulation de l'environnement localStorage pour Node.js
if (typeof localStorage === 'undefined') {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, '../data');
    
    // Créer le dossier data s'il n'existe pas
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
    }
    
    global.localStorage = {
        getItem: (key) => {
            try {
                const filePath = path.join(dataPath, `${key}.json`);
                if (fs.existsSync(filePath)) {
                    return fs.readFileSync(filePath, 'utf8');
                }
                return null;
            } catch (error) {
                console.error(`Erreur lecture ${key}:`, error.message);
                return null;
            }
        },
        setItem: (key, value) => {
            try {
                const filePath = path.join(dataPath, `${key}.json`);
                fs.writeFileSync(filePath, value);
            } catch (error) {
                console.error(`Erreur écriture ${key}:`, error.message);
            }
        },
        removeItem: (key) => {
            try {
                const filePath = path.join(dataPath, `${key}.json`);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.error(`Erreur suppression ${key}:`, error.message);
            }
        }
    };
}

async function verifyDatabase() {
    console.log('🔍 === VÉRIFICATION DE LA BASE DE DONNÉES ===\n');
    
    try {
        // Vérifier si les données existent
        const staff = JSON.parse(localStorage.getItem('staff') || '[]');
        const evaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
        const themes = JSON.parse(localStorage.getItem('themes') || '[]');
        
        console.log('📊 État actuel:');
        console.log(`   💼 Personnel: ${staff.length} membres`);
        console.log(`   📋 Évaluations: ${evaluations.length} évaluations`);
        console.log(`   🎯 Thèmes: ${themes.length} thèmes`);
        
        // Initialiser des données de test si vide
        if (staff.length === 0) {
            console.log('\n🔧 Initialisation de données de test...');
            
            const testStaff = [
                {
                    id: 1,
                    matricule: 'MAT001',
                    firstName: 'Jean',
                    lastName: 'Dupont',
                    position: 'Manager',
                    email: 'jean.dupont@entreprise.com',
                    phone: '0123456789',
                    establishment: 'Siège',
                    formationYear: '2024',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    matricule: 'MAT002',
                    firstName: 'Marie',
                    lastName: 'Martin',
                    position: 'Technicienne',
                    email: 'marie.martin@entreprise.com',
                    phone: '0123456790',
                    establishment: 'Siège',
                    formationYear: '2024',
                    createdAt: new Date().toISOString()
                }
            ];
            
            localStorage.setItem('staff', JSON.stringify(testStaff));
            console.log(`   ✅ ${testStaff.length} membres ajoutés`);
        }
        
        if (themes.length === 0) {
            const testThemes = [
                {
                    id: 1,
                    name: 'Leadership Management',
                    description: 'Formation sur les techniques de leadership et de management',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Communication Efficace',
                    description: 'Améliorer ses compétences en communication',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    name: 'Sécurité au Travail',
                    description: 'Formation sur les règles de sécurité',
                    createdAt: new Date().toISOString()
                }
            ];
            
            localStorage.setItem('themes', JSON.stringify(testThemes));
            console.log(`   ✅ ${testThemes.length} thèmes ajoutés`);
        }
        
        // Statistiques finales
        const finalStats = {
            staff: JSON.parse(localStorage.getItem('staff') || '[]').length,
            evaluations: JSON.parse(localStorage.getItem('evaluations') || '[]').length,
            themes: JSON.parse(localStorage.getItem('themes') || '[]').length
        };
        
        console.log('\n🎉 BASE DE DONNÉES PRÊTE !');  
        console.log('📈 Statistiques finales:');
        console.log(`   💼 Personnel: ${finalStats.staff} membres`);
        console.log(`   📊 Évaluations: ${finalStats.evaluations} évaluations`);
        console.log(`   🎯 Thèmes: ${finalStats.themes} thèmes`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
        return false;
    }
}

// Exécution directe
if (require.main === module) {
    verifyDatabase().then(success => {
        process.exit(success ? 0 : 1);
    });
}

// Export pour utilisation
module.exports = { verifyDatabase };
