/**
 * 🧹 Script Post-Build
 * Nettoie et optimise après la génération de l'exécutable
 */

const fs = require('fs-extra');
const path = require('path');

module.exports = async function afterBuild(context) {
    console.log('🧹 Post-traitement après génération...');
    
    const { outDir, electronPlatformName } = context;
    
    try {
        // 1. Afficher les informations de build
        console.log(`📦 Plateforme: ${electronPlatformName}`);
        console.log(`📁 Répertoire de sortie: ${outDir}`);
        
        // 2. Lister les fichiers générés
        const files = await fs.readdir(outDir);
        console.log('📋 Fichiers générés:');
        
        for (const file of files) {
            const filePath = path.join(outDir, file);
            const stats = await fs.stat(filePath);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`   - ${file} (${sizeInMB} MB)`);
        }
        
        // 3. Créer un fichier d'information
        const buildInfo = {
            buildDate: new Date().toISOString(),
            platform: electronPlatformName,
            version: context.packager.appInfo.version,
            files: files.map(file => ({
                name: file,
                path: path.join(outDir, file)
            }))
        };
        
        await fs.writeFile(
            path.join(outDir, 'build-info.json'),
            JSON.stringify(buildInfo, null, 2)
        );
        
        // 4. Créer un README pour l'utilisateur
        const userReadme = `# Gestion du Personnel

## Installation
1. Exécutez le fichier d'installation (.exe) en tant qu'administrateur
2. Suivez les instructions de l'assistant d'installation
3. Lancez l'application depuis le Bureau ou le Menu Démarrer

## Utilisation
- L'application stocke ses données localement
- Aucune connexion Internet requise
- Les données sont sauvegardées automatiquement

## Support
Pour toute question ou problème, consultez la documentation interne.

Généré le: ${new Date().toLocaleDateString('fr-FR')}
Version: ${context.packager.appInfo.version}
`;
        
        await fs.writeFile(path.join(outDir, 'README.txt'), userReadme);
        
        console.log('✅ Post-traitement terminé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors du post-traitement:', error);
        throw error;
    }
};