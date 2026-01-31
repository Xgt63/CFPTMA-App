#!/usr/bin/env node

/**
 * 🔍 VÉRIFICATION DE PERSISTANCE DES DONNÉES
 * 
 * Exécuter après avoir compilé le .exe pour diagnostiquer le problème
 * 
 * Usage: node verify-persistence.js
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class PersistenceChecker {
  constructor() {
    this.results = {
      passing: [],
      failing: [],
      warnings: []
    };
  }

  log(message, type = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    console.log(`${icons[type]} ${message}`);
  }

  check1_DataManagerExists() {
    this.log('\n=== CHECK 1: DataManager initialisé ===', 'info');
    
    try {
      // Vérifier que DataManager existe dans main.cjs
      const mainCjs = fs.readFileSync(path.join(__dirname, 'electron/main.cjs'), 'utf8');
      
      if (mainCjs.includes('class DataManager')) {
        this.log('DataManager class trouvée', 'success');
        this.results.passing.push('DataManager class exists');
      } else {
        this.log('DataManager class NOT trouvée', 'error');
        this.results.failing.push('DataManager class missing');
      }
    } catch (error) {
      this.log(`Erreur lecture main.cjs: ${error.message}`, 'error');
      this.results.failing.push('Cannot read main.cjs');
    }
  }

  check2_SaveDataMethod() {
    this.log('\n=== CHECK 2: Méthode saveData() ===', 'info');
    
    try {
      const mainCjs = fs.readFileSync(path.join(__dirname, 'electron/main.cjs'), 'utf8');
      
      if (mainCjs.includes('saveData()')) {
        this.log('saveData() method found', 'success');
        this.results.passing.push('saveData() method exists');
      } else {
        this.log('saveData() method NOT found', 'error');
        this.results.failing.push('saveData() method missing');
      }
    } catch (error) {
      this.log(`Erreur: ${error.message}`, 'error');
    }
  }

  check3_WindowAllClosedHandler() {
    this.log('\n=== CHECK 3: Gestionnaire window-all-closed ===', 'info');
    
    try {
      const mainCjs = fs.readFileSync(path.join(__dirname, 'electron/main.cjs'), 'utf8');
      
      if (!mainCjs.includes("app.on('window-all-closed'")) {
        this.log('window-all-closed handler NOT found', 'error');
        this.results.failing.push('window-all-closed handler missing');
        return;
      }
      
      this.log('window-all-closed handler found', 'success');
      
      // Vérifier s'il sauvegarde les données
      const closedHandler = mainCjs.match(/app\.on\('window-all-closed',[\s\S]*?\n\}\);/);
      
      if (closedHandler && closedHandler[0].includes('dataManager.saveData()')) {
        this.log('✓ dataManager.saveData() appelé à la fermeture', 'success');
        this.results.passing.push('dataManager.saveData() in window-all-closed');
      } else {
        this.log('✗ dataManager.saveData() NOT appelé à la fermeture', 'error');
        this.results.failing.push('dataManager.saveData() not called at close');
      }
      
      // Vérifier checkpoint SQLite
      if (closedHandler && closedHandler[0].includes('wal_checkpoint')) {
        this.log('✓ SQLite WAL checkpoint appelé', 'success');
        this.results.passing.push('WAL checkpoint in window-all-closed');
      } else {
        this.log('⚠️ SQLite WAL checkpoint NOT appelé (pas critique si JSON)', 'warning');
        this.results.warnings.push('No WAL checkpoint');
      }
    } catch (error) {
      this.log(`Erreur: ${error.message}`, 'error');
    }
  }

  check4_DataFilePath() {
    this.log('\n=== CHECK 4: Chemin du fichier de données ===', 'info');
    
    try {
      const mainCjs = fs.readFileSync(path.join(__dirname, 'electron/main.cjs'), 'utf8');
      
      if (mainCjs.includes('cfp-data.json')) {
        this.log('Fichier: cfp-data.json trouvé', 'success');
        this.results.passing.push('Data file path correct');
      } else {
        this.log('Nom du fichier de données n\'est pas cfp-data.json', 'warning');
        this.results.warnings.push('Data file path unclear');
      }
      
      if (mainCjs.includes("app.getPath('userData')")) {
        this.log("✓ app.getPath('userData') utilisé", 'success');
        this.results.passing.push('userData path used');
      } else {
        this.log("✗ app.getPath('userData') NOT utilisé", 'error');
        this.results.failing.push('userData path not used');
      }
    } catch (error) {
      this.log(`Erreur: ${error.message}`, 'error');
    }
  }

  check5_IPCHandlers() {
    this.log('\n=== CHECK 5: Handlers IPC ===', 'info');
    
    try {
      const mainCjs = fs.readFileSync(path.join(__dirname, 'electron/main.cjs'), 'utf8');
      
      // Compter les handlers
      const handlers = mainCjs.match(/ipcMain\.handle\(/g);
      const count = handlers ? handlers.length : 0;
      
      this.log(`${count} ipcMain.handle() trouvés`, 'info');
      
      // Vérifier le pattern
      if (mainCjs.includes('databaseService ? databaseService') && mainCjs.includes(': dataManager')) {
        this.log('⚠️ Pattern ternaire détecté (databaseService vs dataManager)', 'warning');
        this.results.warnings.push('Ternary pattern in handlers - could be issue');
      } else if (!mainCjs.includes('return dataManager.')) {
        this.log('⚠️ Pas de return dataManager détecté', 'warning');
        this.results.warnings.push('No dataManager calls found');
      } else {
        this.log('✓ Handlers utilisent dataManager', 'success');
        this.results.passing.push('Handlers use dataManager');
      }
    } catch (error) {
      this.log(`Erreur: ${error.message}`, 'error');
    }
  }

  check6_FileSystem() {
    this.log('\n=== CHECK 6: Permissions filesystem ===', 'info');
    
    try {
      // On ne peut pas vérifier la vraie lecture sans app.getPath
      this.log('⚠️ Vérification filesystem complète possible seulement en runtime', 'warning');
      this.results.warnings.push('Full FS check requires runtime');
      
      // Mais vérifier que fs est importé
      const mainCjs = fs.readFileSync(path.join(__dirname, 'electron/main.cjs'), 'utf8');
      
      if (mainCjs.includes("const fs = require('fs')")) {
        this.log('✓ Module fs importé', 'success');
        this.results.passing.push('fs module imported');
      } else {
        this.log('✗ Module fs NOT importé', 'error');
        this.results.failing.push('fs module not imported');
      }
    } catch (error) {
      this.log(`Erreur: ${error.message}`, 'error');
    }
  }

  check7_ErrorHandling() {
    this.log('\n=== CHECK 7: Gestion des erreurs ===', 'info');
    
    try {
      const mainCjs = fs.readFileSync(path.join(__dirname, 'electron/main.cjs'), 'utf8');
      
      let tryCatchCount = 0;
      let matches = mainCjs.match(/try\s*{/g);
      if (matches) tryCatchCount = matches.length;
      
      this.log(`${tryCatchCount} blocs try-catch trouvés`, 'info');
      
      if (tryCatchCount > 5) {
        this.log('✓ Bonne gestion des erreurs', 'success');
        this.results.passing.push('Error handling present');
      } else {
        this.log('⚠️ Peu de gestion d\'erreurs', 'warning');
        this.results.warnings.push('Limited error handling');
      }
    } catch (error) {
      this.log(`Erreur: ${error.message}`, 'error');
    }
  }

  generateReport() {
    console.log('\n\n' + '='.repeat(60));
    console.log('📋 RAPPORT D\'ANALYSE');
    console.log('='.repeat(60));
    
    console.log('\n✅ POINTS POSITIFS:');
    if (this.results.passing.length === 0) {
      console.log('  Aucun test réussi ❌');
    } else {
      this.results.passing.forEach(item => {
        console.log(`  ✓ ${item}`);
      });
    }
    
    if (this.results.failing.length > 0) {
      console.log('\n❌ PROBLÈMES TROUVÉS:');
      this.results.failing.forEach(item => {
        console.log(`  ✗ ${item}`);
      });
    }
    
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️ AVERTISSEMENTS:');
      this.results.warnings.forEach(item => {
        console.log(`  ⚠ ${item}`);
      });
    }
    
    // Score
    const total = this.results.passing.length + this.results.failing.length;
    const score = total > 0 ? Math.round((this.results.passing.length / total) * 100) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 SCORE: ${score}% (${this.results.passing.length}/${total})`);
    
    if (score >= 80) {
      console.log('Status: 🟢 TRÈS BON');
    } else if (score >= 60) {
      console.log('Status: 🟡 BON (mais des améliorations recommandées)');
    } else {
      console.log('Status: 🔴 PROBLÉMATIQUE (corrections nécessaires)');
    }
    
    console.log('='.repeat(60) + '\n');
    
    // Recommandations
    if (this.results.failing.includes('dataManager.saveData() not called at close')) {
      console.log('\n🔧 CORRECTION URGENTE:');
      console.log('   Ajouter dataManager.saveData() dans le handler window-all-closed');
      console.log('   Fichier: EXEMPLE_COMPLET_CORRECTION.js → Section 1\n');
    }
    
    if (this.results.warnings.includes('Ternary pattern in handlers - could be issue')) {
      console.log('\n🔧 CORRECTION RECOMMANDÉE:');
      console.log('   Remplacer le pattern ternaire par un appel direct à dataManager');
      console.log('   Fichier: EXEMPLE_COMPLET_CORRECTION.js → Section 3\n');
    }
  }

  run() {
    console.log('\n🔍 VÉRIFICATION DE PERSISTANCE DES DONNÉES\n');
    
    this.check1_DataManagerExists();
    this.check2_SaveDataMethod();
    this.check3_WindowAllClosedHandler();
    this.check4_DataFilePath();
    this.check5_IPCHandlers();
    this.check6_FileSystem();
    this.check7_ErrorHandling();
    
    this.generateReport();
  }
}

// Exécuter
if (require.main === module) {
  const checker = new PersistenceChecker();
  checker.run();
}

module.exports = PersistenceChecker;
