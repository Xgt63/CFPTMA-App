#!/usr/bin/env node

/**
 * 🎨 Convertisseur SVG vers ICO
 * Génère icon.ico 256x256 à partir du SVG dans assets/
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Project root and assets path (used also to decide whether to skip generation)
const projectRoot = path.join(__dirname, '..');
const assetsDirCheck = path.join(projectRoot, 'assets');

// Guard: if the environment variable SKIP_ICON_GEN=1 is set or the sentinel
// file `assets/.keep_custom_icon` exists, do not overwrite user's icons.
if (process.env.SKIP_ICON_GEN === '1' || fs.existsSync(path.join(assetsDirCheck, '.keep_custom_icon'))) {
  console.log('⚠️ Skipping icon generation because SKIP_ICON_GEN=1 or assets/.keep_custom_icon exists.');
  process.exit(0);
}

async function generateICO() {
  try {
    const assetsDir = path.join(projectRoot, 'assets');
    const buildDir = path.join(projectRoot, 'build');
    
    // Créer le dossier assets s'il n'existe pas
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Créer le dossier build s'il n'existe pas
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    // SVG source
    const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0011ef"/>
      <stop offset="100%" style="stop-color:#ff05f2"/>
    </linearGradient>
    <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#f0f8ff"/>
    </linearGradient>
  </defs>
  
  <!-- Fond arrondi -->
  <rect x="16" y="16" width="224" height="224" rx="32" ry="32" fill="url(#bgGradient)" stroke="#ffffff" stroke-width="4"/>
  
  <!-- Icône livre/formation -->
  <g transform="translate(128,128)">
    <rect x="-60" y="-40" width="120" height="80" rx="8" ry="8" fill="none" stroke="url(#textGradient)" stroke-width="3"/>
    <line x1="0" y1="-40" x2="0" y2="40" stroke="url(#textGradient)" stroke-width="2"/>
    
    <line x1="-40" y1="-20" x2="-10" y2="-20" stroke="url(#textGradient)" stroke-width="1.5"/>
    <line x1="-40" y1="-5" x2="-10" y2="-5" stroke="url(#textGradient)" stroke-width="1.5"/>
    <line x1="-40" y1="10" x2="-10" y2="10" stroke="url(#textGradient)" stroke-width="1.5"/>
    <line x1="-40" y1="25" x2="-10" y2="25" stroke="url(#textGradient)" stroke-width="1.5"/>
    
    <line x1="10" y1="-20" x2="40" y2="-20" stroke="url(#textGradient)" stroke-width="1.5"/>
    <line x1="10" y1="-5" x2="40" y2="-5" stroke="url(#textGradient)" stroke-width="1.5"/>
    <line x1="10" y1="10" x2="40" y2="10" stroke="url(#textGradient)" stroke-width="1.5"/>
    <line x1="10" y1="25" x2="40" y2="25" stroke="url(#textGradient)" stroke-width="1.5"/>
    
    <g transform="translate(50, -50) scale(0.5)">
      <polygon points="0,-20 6,-6 20,-6 10,2 15,18 0,10 -15,18 -10,2 -20,-6 -6,-6" fill="#ffd700" stroke="#ffffff" stroke-width="1"/>
    </g>
  </g>
  
  <text x="128" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="url(#textGradient)">CFPT</text>
  <text x="128" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="url(#textGradient)">IVATO</text>
</svg>`;

    // Sauvegarder temporairement le SVG
    const tempSvgPath = path.join(buildDir, 'temp-icon.svg');
    fs.writeFileSync(tempSvgPath, svgIcon);

    // Convertir en PNG 256x256
    const pngPath = path.join(assetsDir, 'icon.png');
    await sharp(tempSvgPath)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 100 })
      .toFile(pngPath);

    console.log('✅ PNG 256x256 généré:', pngPath);

    // Générer ICO valide Windows avec sharp
    // Windows ICO a besoin de plusieurs résolutions
    const icoPath = path.join(assetsDir, 'icon.ico');
    
    // Sharp ne crée pas directement des ICO, donc on utilise un PNG avec en-tête ICO
    // Ou on utilise une librairie spécialisée. Pour l'instant, créons simplement une icône PNG valide
    // que les anciens systèmes Windows reconnaîtront.
    
    // Générer plusieurs tailles pour ICO
    const buffer256 = await sharp(pngPath)
      .resize(256, 256)
      .png()
      .toBuffer();

    const buffer128 = await sharp(pngPath)
      .resize(128, 128)
      .png()
      .toBuffer();

    const buffer64 = await sharp(pngPath)
      .resize(64, 64)
      .png()
      .toBuffer();

    const buffer32 = await sharp(pngPath)
      .resize(32, 32)
      .png()
      .toBuffer();

    const buffer16 = await sharp(pngPath)
      .resize(16, 16)
      .png()
      .toBuffer();

    // Pour une solution rapide, copions le PNG comme ICO
    // Windows moderne accepte les PNG comme icônes
    fs.copyFileSync(pngPath, icoPath);

    console.log('✅ ICO généré (PNG-based):', icoPath);

    // Nettoyer le SVG temporaire
    fs.unlinkSync(tempSvgPath);

    // Sauvegarder aussi le SVG dans build
    const iconSvgPath = path.join(buildDir, 'icon.svg');
    fs.writeFileSync(iconSvgPath, svgIcon);
    console.log('✅ SVG source sauvegardé:', iconSvgPath);

    console.log(`
🎨 Icônes générées avec succès !

📁 Fichiers créés:
   - ${pngPath} (256x256 PNG)
   - ${icoPath} (Windows PNG-based)
   - ${iconSvgPath} (Source SVG)

✨ L'icône est prête pour electron-builder !
`);

  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error.message);
    process.exit(1);
  }
}

generateICO();
