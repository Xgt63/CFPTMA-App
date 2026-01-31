/**
 * 📦 Script Post-Pack 
 * Optimise l'application après packaging mais avant la création de l'installateur
 */

const fs = require('fs-extra');
const path = require('path');

module.exports = async function afterPack(context) {
    console.log('📦 Post-packaging en cours...');
    
    const { electronPlatformName, appOutDir } = context;
    
    try {
        // 1. Optimiser les ressources
        console.log('🔧 Optimisation des ressources...');
        
        // Supprimer les fichiers inutiles du build
        const unnecessaryFiles = [
            'LICENSES.chromium.html',
            'version',
            'chrome_100_percent.pak',
            'chrome_200_percent.pak'
        ];
        
        for (const file of unnecessaryFiles) {
            const filePath = path.join(appOutDir, file);
            if (await fs.pathExists(filePath)) {
                await fs.remove(filePath);
                console.log(`   ✓ Supprimé: ${file}`);
            }
        }
        
        // 2. Optimiser les locales (garder seulement français et anglais)
        const localesDir = path.join(appOutDir, 'locales');
        if (await fs.pathExists(localesDir)) {
            const locales = await fs.readdir(localesDir);
            const keepLocales = ['fr.pak', 'en-US.pak', 'en-GB.pak'];
            
            for (const locale of locales) {
                if (!keepLocales.includes(locale)) {
                    await fs.remove(path.join(localesDir, locale));
                    console.log(`   ✓ Locale supprimée: ${locale}`);
                }
            }
        }
        
        // 3. Vérifier que les fichiers essentiels sont présents
        const essentialFiles = [
            'Gestion du Personnel.exe',
            'resources/app.asar'
        ];
        
        console.log('✅ Vérification des fichiers essentiels:');
        for (const file of essentialFiles) {
            const filePath = path.join(appOutDir, file);
            const exists = await fs.pathExists(filePath);
            console.log(`   ${exists ? '✓' : '❌'} ${file}`);
            
            if (!exists) {
                throw new Error(`Fichier essentiel manquant: ${file}`);
            }
        }
        
        // 4. Calculer et afficher la taille finale
        const calculateDirSize = async (dirPath) => {
            let totalSize = 0;
            const files = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const file of files) {
                const filePath = path.join(dirPath, file.name);
                if (file.isDirectory()) {
                    totalSize += await calculateDirSize(filePath);
                } else {
                    const stats = await fs.stat(filePath);
                    totalSize += stats.size;
                }
            }
            return totalSize;
        };
        
        const totalSize = await calculateDirSize(appOutDir);
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        
        console.log(`📊 Taille finale de l'application: ${sizeInMB} MB`);
        
        // 5. Créer un manifest des fichiers
        const createManifest = async (dir, basePath = '') => {
            const manifest = {};
            const files = await fs.readdir(dir, { withFileTypes: true });
            
            for (const file of files) {
                const filePath = path.join(dir, file.name);
                const relativePath = path.join(basePath, file.name);
                
                if (file.isDirectory()) {
                    manifest[relativePath] = await createManifest(filePath, relativePath);
                } else {
                    const stats = await fs.stat(filePath);
                    manifest[relativePath] = {
                        size: stats.size,
                        modified: stats.mtime.toISOString()
                    };
                }
            }
            return manifest;
        };
        
        const manifest = await createManifest(appOutDir);
        await fs.writeFile(
            path.join(appOutDir, 'app-manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        console.log('✅ Post-packaging terminé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors du post-packaging:', error);
        throw error;
    }
};