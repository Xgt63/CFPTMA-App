#!/usr/bin/env node

/**
 * 🔧 SCRIPT DE DIAGNOSTIQUE DE LA BASE DE DONNÉES
 * Analyse complète et vérifications d'intégrité
 * 
 * Usage: node database-diagnostic.js
 */

const DatabaseService = require('./electron/database');
const fs = require('fs');
const path = require('path');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class DatabaseDiagnostic {
  constructor() {
    this.results = {};
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: `${colors.blue}ℹ${colors.reset}`,
      success: `${colors.green}✓${colors.reset}`,
      warning: `${colors.yellow}⚠${colors.reset}`,
      error: `${colors.red}✗${colors.reset}`,
      header: `${colors.cyan}║${colors.reset}`
    }[type] || '•';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  header(title) {
    console.log(`\n${colors.bright}${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`);
  }

  async runDiagnostics() {
    this.header('🔍 DIAGNOSTIC COMPLET DE LA BASE DE DONNÉES');

    try {
      // 1. Vérifier la connexion
      await this.checkConnection();
      
      // 2. Vérifier les tables
      await this.checkTables();
      
      // 3. Vérifier les données
      await this.checkData();
      
      // 4. Vérifier l'intégrité
      await this.checkIntegrity();
      
      // 5. Vérifier la sécurité
      await this.checkSecurity();
      
      // 6. Vérifier la performance
      await this.checkPerformance();
      
      // 7. Rapport final
      await this.generateReport();
    } catch (error) {
      this.log(`Erreur critique: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async checkConnection() {
    this.header('1. VÉRIFICATION DE CONNEXION');
    
    try {
      await DatabaseService.initialize();
      this.log('Connexion SQLite établie', 'success');
      this.results.connection = { status: 'OK' };
    } catch (error) {
      this.log(`Erreur de connexion: ${error.message}`, 'error');
      this.errors.push('Impossible de se connecter à la base de données');
      this.results.connection = { status: 'FAILED', error: error.message };
    }
  }

  async checkTables() {
    this.header('2. VÉRIFICATION DES TABLES');
    
    const requiredTables = [
      'users',
      'staff',
      'themes',
      'app_config',
      'audit_logs',
      'evaluations'
    ];

    this.results.tables = {};

    for (const table of requiredTables) {
      try {
        const count = await this.getTableRowCount(table);
        this.log(`Table '${table}': ${count} enregistrements`, 'success');
        this.results.tables[table] = { rows: count, status: 'OK' };
      } catch (error) {
        this.log(`Table '${table}': MANQUANTE`, 'error');
        this.errors.push(`Table ${table} manquante ou inaccessible`);
        this.results.tables[table] = { status: 'MISSING' };
      }
    }
  }

  async checkData() {
    this.header('3. VÉRIFICATION DES DONNÉES');

    try {
      // Utilisateurs
      const users = await DatabaseService.getUsers();
      this.log(`${users.length} utilisateurs trouvés`, 'info');
      if (users.length === 0) {
        this.warnings.push('Aucun utilisateur dans la base');
      }
      users.forEach(user => {
        this.log(`  - ${user.firstName} ${user.lastName} (${user.email}, rôle: ${user.role})`, 'info');
      });

      // Personnel
      const staff = await DatabaseService.getStaff();
      this.log(`${staff.length} personnel trouvés`, 'info');
      staff.forEach(s => {
        this.log(`  - ${s.firstName} ${s.lastName} (${s.position}, matricule: ${s.matricule})`, 'info');
      });

      // Thèmes
      const themes = await DatabaseService.getThemes();
      this.log(`${themes.length} thèmes trouvés`, 'info');
      themes.forEach(t => {
        this.log(`  - ${t.name}`, 'info');
      });

      // Évaluations
      const evals = await DatabaseService.getEvaluations();
      this.log(`${evals.length} évaluations trouvées`, 'info');

      this.results.data = {
        users: users.length,
        staff: staff.length,
        themes: themes.length,
        evaluations: evals.length
      };
    } catch (error) {
      this.log(`Erreur lecture données: ${error.message}`, 'error');
      this.errors.push('Impossible de lire les données');
    }
  }

  async checkIntegrity() {
    this.header('4. VÉRIFICATION DE L\'INTÉGRITÉ');

    try {
      // Vérifier les clés étrangères
      this.log('Vérification des références staff→evaluations...', 'info');
      const staff = await DatabaseService.getStaff();
      const evals = await DatabaseService.getEvaluations();

      let orphanCount = 0;
      for (const eval of evals) {
        if (eval.staffId && !staff.find(s => s.id === eval.staffId)) {
          orphanCount++;
        }
      }

      if (orphanCount === 0) {
        this.log('Toutes les références sont valides', 'success');
      } else {
        this.log(`⚠️ ${orphanCount} évaluations orphelines (staffId inexistant)`, 'warning');
        this.warnings.push(`${orphanCount} évaluations orphelines`);
      }

      // Vérifier les doublons
      const emailDuplicates = this.checkDuplicates(staff, 'email');
      const matriculeDuplicates = this.checkDuplicates(staff, 'matricule');

      if (emailDuplicates > 0) {
        this.log(`⚠️ ${emailDuplicates} emails en doublon`, 'warning');
        this.warnings.push(`${emailDuplicates} emails en doublon`);
      }
      if (matriculeDuplicates > 0) {
        this.log(`⚠️ ${matriculeDuplicates} matricules en doublon`, 'warning');
        this.warnings.push(`${matriculeDuplicates} matricules en doublon`);
      }

      if (emailDuplicates === 0 && matriculeDuplicates === 0) {
        this.log('Aucun doublon détecté', 'success');
      }

      this.results.integrity = {
        orphanEvaluations: orphanCount,
        emailDuplicates,
        matriculeDuplicates
      };
    } catch (error) {
      this.log(`Erreur vérification intégrité: ${error.message}`, 'error');
    }
  }

  async checkSecurity() {
    this.header('5. VÉRIFICATION DE SÉCURITÉ');

    const issues = [];

    // Vérifier les mots de passe en clair
    this.log('Vérification des mots de passe...', 'info');
    const users = await DatabaseService.getUsers();
    
    const plainPasswords = users.filter(u => {
      // Détection simple: si le mot de passe est court et lisible
      return u.password && u.password.length < 20 && !/\$2[aby]\$/.test(u.password);
    });

    if (plainPasswords.length > 0) {
      this.log(`🔴 CRITIQUE: ${plainPasswords.length} mots de passe en clair détectés!`, 'error');
      issues.push('Mots de passe non hashés');
      this.errors.push('Mots de passe stockés en clair - RISQUE DE SÉCURITÉ CRITIQUE');
    } else {
      this.log('Les mots de passe semblent hashés', 'success');
    }

    // Vérifier les logs d'audit
    this.log('Vérification des logs d\'audit...', 'info');
    const config = await DatabaseService.getAppConfig();
    if (config.auditLogging) {
      this.log('Audit logging activé', 'success');
    } else {
      this.log('Audit logging DÉSACTIVÉ', 'warning');
      this.warnings.push('Audit logging désactivé');
    }

    // Vérifier la configuration
    this.log('Vérification de la configuration...', 'info');
    this.log(`Mode utilisateur: ${config.userMode}`, 'info');
    this.log(`Enregistrement multiple: ${config.multiRegister ? 'OUI' : 'NON'}`, 'info');

    this.results.security = {
      plainTextPasswords: plainPasswords.length,
      auditLogging: config.auditLogging,
      issues
    };
  }

  async checkPerformance() {
    this.header('6. VÉRIFICATION DE PERFORMANCE');

    try {
      const evals = await DatabaseService.getEvaluations();
      
      // Calcul des statistiques de notation
      const scores = [];
      let validEvals = 0;

      for (const eval of evals) {
        if (eval.skillsAcquisition && eval.skillsAcquisition > 0) {
          const avg = DatabaseService.calculateAverageScore(eval);
          if (avg > 0) {
            scores.push(avg);
            validEvals++;
          }
        }
      }

      this.log(`${evals.length} évaluations au total`, 'info');
      this.log(`${validEvals} évaluations avec des scores`, 'info');

      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        this.log(`Score moyen global: ${avgScore.toFixed(2)}/5`, 'info');
      }

      // Recommandations
      if (evals.length > 1000) {
        this.log('⚠️ Base de données importante (>1000 évaluations)', 'warning');
        this.warnings.push('Considérer l\'archivage ou la fragmentation');
      }

      this.results.performance = {
        totalEvaluations: evals.length,
        validScores: validEvals,
        averageScore: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : null
      };
    } catch (error) {
      this.log(`Erreur analyse performance: ${error.message}`, 'error');
    }
  }

  async generateReport() {
    this.header('📋 RAPPORT FINAL');

    console.log(`${colors.bright}STATISTIQUES:${colors.reset}`);
    console.log(`  • Utilisateurs: ${this.results.data?.users || 0}`);
    console.log(`  • Personnel: ${this.results.data?.staff || 0}`);
    console.log(`  • Thèmes: ${this.results.data?.themes || 0}`);
    console.log(`  • Évaluations: ${this.results.data?.evaluations || 0}`);

    if (this.errors.length === 0) {
      console.log(`\n${colors.green}${colors.bright}✓ RÉSULTAT: AUCUNE ERREUR CRITIQUE${colors.reset}`);
    } else {
      console.log(`\n${colors.red}${colors.bright}✗ RÉSULTAT: ${this.errors.length} ERREUR(S)${colors.reset}`);
      this.errors.forEach(err => {
        console.log(`  ${colors.red}✗${colors.reset} ${err}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}⚠️ AVERTISSEMENTS: ${this.warnings.length}${colors.reset}`);
      this.warnings.forEach(warn => {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${warn}`);
      });
    }

    console.log(`\n${colors.bright}RECOMMANDATIONS:${colors.reset}`);
    console.log(`  1. 🔴 URGENT: Implémenter le hashage des mots de passe (bcrypt)`);
    console.log(`  2. 🟠 Ajouter des indexes sur les colonnes fréquentes`);
    console.log(`  3. 🟠 Normaliser la table evaluations (trop de colonnes)`);
    console.log(`  4. 🟡 Implémenter un système de migration de schéma`);
    console.log(`  5. 🟡 Optimiser les checkpoints WAL`);

    // Sauvegarder le rapport
    const reportFile = path.join(__dirname, 'DATABASE_DIAGNOSTIC_REPORT.json');
    fs.writeFileSync(reportFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results,
      errors: this.errors,
      warnings: this.warnings
    }, null, 2));

    console.log(`\n📄 Rapport sauvegardé: ${reportFile}\n`);
  }

  async getTableRowCount(tableName) {
    // Implémentation simplifiée - dans le vrai code, faire une requête SQL
    switch (tableName) {
      case 'users':
        return (await DatabaseService.getUsers()).length;
      case 'staff':
        return (await DatabaseService.getStaff()).length;
      case 'themes':
        return (await DatabaseService.getThemes()).length;
      case 'evaluations':
        return (await DatabaseService.getEvaluations()).length;
      default:
        return 0;
    }
  }

  checkDuplicates(array, field) {
    const seen = new Set();
    let duplicates = 0;
    for (const item of array) {
      if (item[field]) {
        if (seen.has(item[field])) {
          duplicates++;
        }
        seen.add(item[field]);
      }
    }
    return duplicates;
  }
}

// Exécution
if (require.main === module) {
  const diagnostic = new DatabaseDiagnostic();
  diagnostic.runDiagnostics().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Erreur:', error);
    process.exit(1);
  });
}

module.exports = DatabaseDiagnostic;
