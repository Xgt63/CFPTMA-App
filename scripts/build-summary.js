/**
 * 📋 Script de Résumé de Build
 * Affiche les informations finales après génération de l'exécutable
 */

const fs = require('fs-extra');
const path = require('path');

async function showBuildSummary() {
    console.log('🎉 === RÉSUMÉ DE LA GÉNÉRATION D\'EXÉCUTABLE ===\n');
    
    try {
        const distDir = path.join(__dirname, '../dist-electron');
        
        if (!await fs.pathExists(distDir)) {
            console.error('❌ Répertoire dist-electron non trouvé');
            return false;
        }
        
        // Trouver les fichiers exécutables
        const files = await fs.readdir(distDir);
        const setupFiles = files.filter(f => f.endsWith('.exe') && f.includes('Setup'));
        
        // Trier par date de modification pour trouver le plus récent
        const setupFilesWithStats = [];
        for (const file of setupFiles) {
            const filePath = path.join(distDir, file);
            const stats = await fs.stat(filePath);
            setupFilesWithStats.push({ name: file, stats });
        }
        
        // Trier par date de création décroissante
        setupFilesWithStats.sort((a, b) => b.stats.birthtime - a.stats.birthtime);
        const latestSetup = setupFilesWithStats[0]?.name;
        
        if (latestSetup) {
            const setupPath = path.join(distDir, latestSetup);
            const stats = await fs.stat(setupPath);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            
            console.log('✅ EXÉCUTABLE WINDOWS GÉNÉRÉ AVEC SUCCÈS !');
            console.log('');
            console.log('📦 Informations du fichier:');
            console.log(`   📄 Nom: ${latestSetup}`);
            console.log(`   📁 Chemin: ${setupPath}`);
            console.log(`   📊 Taille: ${sizeInMB} MB`);
            console.log(`   📅 Créé le: ${stats.birthtime.toLocaleString('fr-FR')}`);
            
            // Vérifier l'application décompressée
            const unpackedDir = path.join(distDir, 'win-unpacked');
            if (await fs.pathExists(unpackedDir)) {
                const unpackedFiles = await fs.readdir(unpackedDir);
                const appExe = unpackedFiles.find(f => f.endsWith('.exe'));
                if (appExe) {
                    const appPath = path.join(unpackedDir, appExe);
                    const appStats = await fs.stat(appPath);
                    const appSizeInMB = (appStats.size / (1024 * 1024)).toFixed(2);
                    
                    console.log('');
                    console.log('🗂️ Version décompressée (pour test direct):');
                    console.log(`   📄 Application: ${appExe}`);
                    console.log(`   📁 Chemin: ${appPath}`);
                    console.log(`   📊 Taille: ${appSizeInMB} MB`);
                }
            }
            
            console.log('');
            console.log('📋 Instructions d\'utilisation:');
            console.log('   1️⃣ Pour installer: Exécutez le fichier Setup');
            console.log('   2️⃣ Pour tester directement: Utilisez l\'exe dans win-unpacked');
            console.log('   3️⃣ L\'application stocke ses données localement');
            console.log('   4️⃣ Aucune connexion Internet requise');
            
            console.log('');
            console.log('🔧 Fonctionnalités incluses:');
            console.log('   ✅ Gestion du personnel');
            console.log('   ✅ Évaluations des formations');
            console.log('   ✅ Visualisations graphiques');
            console.log('   ✅ Export Excel');
            console.log('   ✅ Interface moderne et intuitive');
            console.log('   ✅ Données persistantes (localStorage)');
            
            return true;
        } else {
            console.error('❌ Aucun fichier d\'installation trouvé');
            return false;
        }
        
    } catch (error) {
        console.error('💥 Erreur lors du résumé:', error.message);
        return false;
    }
}

// Exécution
if (require.main === module) {
    showBuildSummary().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { showBuildSummary };