const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Génère une icône .ico multi-résolution pour Windows
 * Utilise sharp pour créer toutes les tailles nécessaires
 */
async function generateIcon() {
  console.log('🎨 Génération de l\'icône multi-résolution...');
  
  // Chemin de l'image source (utilisez votre logo CFPT)
  const sourceLogo = path.join(__dirname, '..', 'Logo CFPT.svg');
  const outputDir = path.join(__dirname, '..');
  
  // Vérifier si le logo source existe
  if (!fs.existsSync(sourceLogo)) {
    console.error('❌ Fichier source introuvable:', sourceLogo);
    console.log('💡 Placez votre "Logo CFPT.svg" ou "Logo CFPT.png" à la racine du projet');
    process.exit(1);
  }
  
  console.log('📁 Logo source trouvé:', sourceLogo);
  
  // Résolutions nécessaires pour Windows
  const sizes = [16, 32, 48, 64, 128, 256];
  
  try {
    // Créer toutes les résolutions PNG d'abord
    const tempFiles = [];
    
    for (const size of sizes) {
      const tempFile = path.join(outputDir, `temp_${size}.png`);
      
      await sharp(sourceLogo)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(tempFile);
      
      tempFiles.push(tempFile);
      console.log(`✅ Créé: ${size}x${size}`);
    }
    
    // Note: sharp ne peut pas créer de .ico directement
    // On utilise la plus grande taille comme fallback
    console.log('\n⚠️ Note: Conversion .ico automatique non disponible avec sharp');
    console.log('📌 Options:');
    console.log('   1. Utilisez https://www.icoconverter.com/');
    console.log('   2. Uploadez temp_256.png');
    console.log('   3. Cochez toutes les résolutions');
    console.log('   4. Téléchargez et remplacez assets/icon.ico\n');
    
    // Copier la plus grande version en PNG comme backup
    await sharp(sourceLogo)
      .resize(256, 256)
      .png()
      .toFile(path.join(outputDir, 'assets', 'icon-256.png'));
    
    await sharp(sourceLogo)
      .resize(256, 256)
      .png()
      .toFile(path.join(outputDir, 'build', 'icon-256.png'));
    
    console.log('✅ Fichiers PNG générés dans assets/ et build/');
    console.log('📝 Utilisez temp_256.png pour créer le .ico en ligne');
    
    // Nettoyer les fichiers temporaires après 60 secondes
    setTimeout(() => {
      tempFiles.forEach(file => {
        try {
          if (fs.existsSync(file)) fs.unlinkSync(file);
        } catch (err) {}
      });
      console.log('🧹 Fichiers temporaires nettoyés');
    }, 60000);
    
  } catch (error) {
    console.error('❌ Erreur génération icône:', error);
    process.exit(1);
  }
}

// Fonction alternative : utiliser un package ico
async function generateIconWithIcoPackage() {
  console.log('🔄 Tentative avec le package ico...');
  
  try {
    // Essayer d'importer le package ico
    const ico = require('ico');
    const sourceLogo = path.join(__dirname, '..', 'Logo CFPT.svg');
    const outputIcon = path.join(__dirname, '..', 'assets', 'icon.ico');
    
    // Créer les buffers PNG pour chaque taille
    const sizes = [16, 32, 48, 64, 128, 256];
    const buffers = [];
    
    for (const size of sizes) {
      const buffer = await sharp(sourceLogo)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      buffers.push(buffer);
    }
    
    // Créer le fichier .ico
    const icoBuffer = await ico.encode(buffers);
    fs.writeFileSync(outputIcon, icoBuffer);
    fs.writeFileSync(path.join(__dirname, '..', 'build', 'icon.ico'), icoBuffer);
    
    console.log('✅ Icône .ico générée avec succès!');
    console.log('📁 Emplacement:', outputIcon);
    
    const stats = fs.statSync(outputIcon);
    console.log(`📊 Taille: ${stats.size} octets (${(stats.size / 1024).toFixed(2)} KB)`);
    
  } catch (error) {
    console.warn('⚠️ Package ico non disponible, utiliser la méthode manuelle');
    console.log('💡 Installez avec: npm install --save-dev ico');
    await generateIcon();
  }
}

// Exécuter
console.log('🚀 Démarrage de la génération d\'icône CFPT...\n');
generateIconWithIcoPackage().catch(err => {
  console.error('Erreur finale:', err);
  process.exit(1);
});
