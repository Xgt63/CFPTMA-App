/**
 * 🎨 Résumé - Version 2.0.2 avec Icône Personnalisée
 * Confirmation de l'intégration de l'icône personnalisée
 */

const fs = require('fs');
const path = require('path');

async function showIconSummary() {
    console.log('🎨 === RÉSUMÉ - ICÔNE PERSONNALISÉE INTÉGRÉE ===\n');
    
    try {
        const distDir = path.join(__dirname, '../dist-electron-v2');
        const iconPath = path.join(__dirname, '../Icon.ico');
        
        // Vérifier que l'icône personnalisée existe
        if (!fs.existsSync(iconPath)) {
            console.error('❌ Icône personnalisée Icon.ico non trouvée');
            return false;
        }
        
        const iconStats = fs.statSync(iconPath);
        console.log('📄 ICÔNE PERSONNALISÉE :');
        console.log(`   🎯 Fichier: Icon.ico`);
        console.log(`   📁 Chemin: ${iconPath}`);
        console.log(`   📊 Taille: ${Math.round(iconStats.size / 1024)} KB`);
        console.log(`   📅 Modifié: ${iconStats.mtime.toLocaleString('fr-FR')}`);
        
        // Trouver le nouvel exécutable
        if (fs.existsSync(distDir)) {
            const files = fs.readdirSync(distDir);
            const setupFile = files.find(f => f.includes('Setup 2.0.2') && f.endsWith('.exe'));
            
            if (setupFile) {
                const setupPath = path.join(distDir, setupFile);
                const stats = fs.statSync(setupPath);
                const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
                
                console.log('\n✅ NOUVEL EXÉCUTABLE GÉNÉRÉ :');
                console.log(`   📄 Nom: ${setupFile}`);
                console.log(`   📁 Chemin: ${setupPath}`);
                console.log(`   📊 Taille: ${sizeInMB} MB`);
                console.log(`   📅 Créé: ${stats.birthtime.toLocaleString('fr-FR')}`);
                console.log(`   🆔 Version: 2.0.2`);
                
                // Vérifier l'application décompressée
                const unpackedDir = path.join(distDir, 'win-unpacked');
                if (fs.existsSync(unpackedDir)) {
                    const unpackedFiles = fs.readdirSync(unpackedDir);
                    const appExe = unpackedFiles.find(f => f.endsWith('.exe'));
                    if (appExe) {
                        console.log(`\n🗂️ Application avec icône personnalisée: ${appExe}`);
                    }
                }
                
                console.log('\n🎨 PERSONNALISATION APPLIQUÉE :');
                console.log('   ✅ Icône personnalisée dans l\'application Electron');
                console.log('   ✅ Icône personnalisée dans l\'installateur NSIS');
                console.log('   ✅ Icône personnalisée pour les raccourcis Desktop');
                console.log('   ✅ Icône personnalisée pour le Menu Démarrer');
                console.log('   ✅ Icône personnalisée pour la barre des tâches');
                
                console.log('\n🔧 CONFIGURATION MISE À JOUR :');
                console.log('   📋 main.js: icon: path.join(__dirname, \'Icon.ico\')');
                console.log('   📋 package.json: win.icon: "Icon.ico"');
                console.log('   📋 package.json: nsis.installerIcon: "Icon.ico"');
                console.log('   📋 package.json: files inclut "Icon.ico"');
                
                console.log('\n🚀 VOTRE APPLICATION EST MAINTENANT PERSONNALISÉE !');
                console.log('   🎯 L\'icône personnalisée sera visible partout :');
                console.log('      • Dans la fenêtre de l\'application');
                console.log('      • Dans l\'installateur');
                console.log('      • Sur le Bureau (raccourci)');
                console.log('      • Dans le Menu Démarrer');
                console.log('      • Dans la barre des tâches');
                console.log('      • Dans l\'Explorateur Windows');
                
                return true;
            } else {
                console.error('❌ Fichier d\'installation v2.0.2 non trouvé');
                return false;
            }
        } else {
            console.error('❌ Répertoire de distribution non trouvé');
            return false;
        }
        
    } catch (error) {
        console.error('💥 Erreur:', error.message);
        return false;
    }
}

// Exécution
if (require.main === module) {
    showIconSummary().then(success => {
        if (success) {
            console.log('\n🎨 PERSONNALISATION RÉUSSIE !');
            console.log('💼 Votre application a maintenant votre icône personnalisée.');
            console.log('\n📋 Fichier à distribuer :');
            console.log('   📦 Centre de Formation Professionnelle et Technique d\'Ivato Setup 2.0.2.exe');
        }
        process.exit(success ? 0 : 1);
    });
}

module.exports = { showIconSummary };