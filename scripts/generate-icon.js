/**
 * 🎨 Générateur d'icône pour CFPT Ivato
 * Crée une icône simple avec les couleurs de l'application
 */

const fs = require('fs');
const path = require('path');

// Créer le dossier build s'il n'existe pas
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

// Générer un SVG avec les couleurs de l'application
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <!-- Fond avec dégradé -->
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
    <!-- Livre ouvert -->
    <rect x="-60" y="-40" width="120" height="80" rx="8" ry="8" fill="none" stroke="url(#textGradient)" stroke-width="3"/>
    <line x1="0" y1="-40" x2="0" y2="40" stroke="url(#textGradient)" stroke-width="2"/>
    
    <!-- Pages/lignes -->
    <line x1="-40" y1="-20" x2="-10" y2="-20" stroke="url(#textGradient)" stroke-width="1.5"/>
    <line x1="-40" y1="-5" x2="-10" y2="-5" stroke="url(#textGradient)" stroke-width="1.5"/>
    <line x1="-40" y1="10" x2="-10" y2="10" stroke="url(#textGradient)" stroke-width="1.5"/>
    <line x1="-40" y1="25" x2="-10" y2="25" stroke="url(#textGradient)" stroke-width="1.5"/>
    
    <line x1="10" y1="-20" x2="40" y2="-20" stroke="url(#textGradient)" stroke-width="1.5"/>
    <line x1="10" y1="-5" x2="40" y2="-5" stroke="url(#textGradient)" stroke-width="1.5"/>
    <line x1="10" y1="10" x2="40" y2="10" stroke="url(#textGradient)" stroke-width="1.5"/>
    <line x1="10" y1="25" x2="40" y2="25" stroke="url(#textGradient)" stroke-width="1.5"/>
    
    <!-- Étoile d'évaluation -->
    <g transform="translate(50, -50) scale(0.5)">
      <polygon points="0,-20 6,-6 20,-6 10,2 15,18 0,10 -15,18 -10,2 -20,-6 -6,-6" 
               fill="#ffd700" stroke="#ffffff" stroke-width="1"/>
    </g>
  </g>
  
  <!-- Texte CFPT -->
  <text x="128" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="url(#textGradient)">CFPT</text>
  <text x="128" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="url(#textGradient)">IVATO</text>
</svg>`;

// Sauvegarder l'icône SVG
const iconPath = path.join(buildDir, 'icon.svg');
fs.writeFileSync(iconPath, svgIcon);

console.log('✅ Icône SVG générée:', iconPath);

// Créer également un favicon.ico simple (version texte)
const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="28" height="28" rx="4" ry="4" fill="#0011ef"/>
  <text x="16" y="20" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="white">C</text>
  <circle cx="24" cy="8" r="3" fill="#ffd700"/>
</svg>`;

const faviconPath = path.join(buildDir, 'favicon.svg');
fs.writeFileSync(faviconPath, faviconSvg);

console.log('✅ Favicon SVG généré:', faviconPath);

// Instructions pour l'utilisateur
console.log(`
🎨 Icônes générées avec succès !

📁 Fichiers créés:
   - ${iconPath}
   - ${faviconPath}

📝 Pour utiliser ces icônes:
   1. Copiez icon.svg vers public/ pour le web
   2. Utilisez un outil comme "svg2png" pour convertir en ICO/PNG si nécessaire
   3. Les icônes sont configurées dans package.json

⚡ Couleurs utilisées:
   - Bleu: #0011ef
   - Rose: #ff05f2  
   - Or: #ffd700
   - Blanc: #ffffff
`);