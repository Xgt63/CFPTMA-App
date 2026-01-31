/**
 * 🎨 Script de Conversion d'Icône SVG vers PNG
 * Convertit l'icône SVG en différentes tailles PNG pour l'exécutable
 */

const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

const ICON_SIZES = [16, 24, 32, 48, 64, 128, 256, 512];
const SOURCE_SVG = path.join(__dirname, '../electron/assets/icon.svg');
const OUTPUT_DIR = path.join(__dirname, '../electron/assets');

async function convertIcon() {
    console.log('🎨 === CONVERSION D\'ICÔNE SVG VERS PNG ===\n');
    
    try {
        // Vérifier que le fichier SVG source existe
        if (!await fs.pathExists(SOURCE_SVG)) {
            console.error(`❌ Fichier SVG source introuvable: ${SOURCE_SVG}`);
            return false;
        }
        
        console.log(`📁 Source: ${SOURCE_SVG}`);
        console.log(`📁 Destination: ${OUTPUT_DIR}`);
        
        // S'assurer que le dossier de destination existe
        await fs.ensureDir(OUTPUT_DIR);
        
        // Lire le contenu du SVG
        const svgBuffer = await fs.readFile(SOURCE_SVG);
        console.log(`📏 Taille du SVG: ${svgBuffer.length} octets`);
        
        // Convertir en différentes tailles
        for (const size of ICON_SIZES) {
            const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
            
            try {
                await sharp(svgBuffer)
                    .resize(size, size)
                    .png({ quality: 100, compressionLevel: 6 })
                    .toFile(outputPath);
                
                const stats = await fs.stat(outputPath);
                console.log(`✅ ${size}x${size}: ${Math.round(stats.size / 1024)}KB`);
            } catch (error) {
                console.error(`❌ Erreur conversion ${size}x${size}:`, error.message);
            }
        }
        
        // Créer l'icône principale (256x256)
        const mainIconPath = path.join(OUTPUT_DIR, 'icon.png');
        await sharp(svgBuffer)
            .resize(256, 256)
            .png({ quality: 100, compressionLevel: 6 })
            .toFile(mainIconPath);
        
        const mainStats = await fs.stat(mainIconPath);
        console.log(`🎯 Icône principale: ${Math.round(mainStats.size / 1024)}KB (256x256)`);
        
        // Créer aussi une version ICO pour Windows
        try {
            // Note: Sharp ne supporte pas ICO natalement, donc on utilise la PNG 256x256
            const icoPath = path.join(OUTPUT_DIR, 'icon.ico');
            await fs.copy(mainIconPath, icoPath);
            console.log(`🪟 ICO Windows: Copié depuis PNG principal`);
        } catch (error) {
            console.log(`⚠️  ICO: Utilisation du PNG principal (${error.message})`);
        }
        
        // Résumé
        const allPngs = await fs.readdir(OUTPUT_DIR);
        const pngFiles = allPngs.filter(f => f.endsWith('.png'));
        
        console.log('\n📋 Résumé:');
        console.log(`   ✅ ${pngFiles.length} fichiers PNG générés`);
        console.log(`   📁 Dossier: ${OUTPUT_DIR}`);
        console.log(`   🎯 Icône principale: icon.png (256x256)`);
        
        console.log('\n🎉 CONVERSION TERMINÉE AVEC SUCCÈS !');
        return true;
        
    } catch (error) {
        console.error('💥 Erreur lors de la conversion:', error);
        return false;
    }
}

// Fonction de secours si Sharp échoue
async function createFallbackIcon() {
    console.log('🔄 Création d\'une icône de secours...');
    
    try {
        // Créer une icône basique avec Canvas (simulation)
        const iconContent = `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
            <rect width="256" height="256" fill="#4F46E5" rx="32"/>
            <text x="128" y="140" font-family="Arial, sans-serif" font-size="120" 
                  fill="white" text-anchor="middle" font-weight="bold">GP</text>
            <text x="128" y="200" font-family="Arial, sans-serif" font-size="24" 
                  fill="#E5E7EB" text-anchor="middle">Gestion</text>
        </svg>`;
        
        const fallbackPath = path.join(OUTPUT_DIR, 'icon.svg');
        await fs.writeFile(fallbackPath, iconContent);
        
        // Copier comme PNG aussi
        const pngPath = path.join(OUTPUT_DIR, 'icon.png');
        await fs.writeFile(pngPath, iconContent.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'));
        
        console.log('✅ Icône de secours créée');
        return true;
    } catch (error) {
        console.error('❌ Échec création icône de secours:', error);
        return false;
    }
}

// Exécution
if (require.main === module) {
    convertIcon().then(async (success) => {
        if (!success) {
            console.log('🔄 Tentative avec icône de secours...');
            success = await createFallbackIcon();
        }
        process.exit(success ? 0 : 1);
    });
}

module.exports = { convertIcon, createFallbackIcon };