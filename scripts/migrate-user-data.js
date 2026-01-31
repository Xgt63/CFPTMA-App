/**
 * 🔄 Script de Migration des Données Utilisateur
 * Migre automatiquement les données des anciennes versions vers la nouvelle
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Chemins possibles des anciennes installations
const POSSIBLE_OLD_PATHS = [
    // Chemins AppData pour les anciennes versions
    path.join(os.homedir(), 'AppData/Roaming/employee-evaluation-system'),
    path.join(os.homedir(), 'AppData/Roaming/cfp-manager'),
    path.join(os.homedir(), 'AppData/Roaming/Employee Evaluation System'),
    path.join(os.homedir(), 'AppData/Roaming/CFP Manager'),
    path.join(os.homedir(), 'AppData/Roaming/CFPT Ivato - Système d\'Évaluation'),
    
    // Chemins LocalStorage pour les versions web
    path.join(os.homedir(), 'AppData/Local/Google/Chrome/User Data/Default/Local Storage'),
    path.join(os.homedir(), 'AppData/Local/Microsoft/Edge/User Data/Default/Local Storage'),
    
    // Dossiers de données personnalisés
    path.join(os.homedir(), 'Documents/Gestion Personnel'),
    path.join(os.homedir(), 'Documents/Employee Evaluation'),
];

// Nouveau chemin de données
const NEW_DATA_PATH = path.join(os.homedir(), 'AppData/Roaming/Centre de Formation Professionnelle et Technique d\'Ivato');

class DataMigrator {
    
    /**
     * 🔍 Recherche les anciennes installations et données
     */
    static async findLegacyData() {
        console.log('🔍 Recherche des anciennes données...');
        const foundData = [];
        
        for (const oldPath of POSSIBLE_OLD_PATHS) {
            try {
                if (await fs.pathExists(oldPath)) {
                    // Chercher des fichiers de données
                    const files = await fs.readdir(oldPath);
                    
                    const dataFiles = files.filter(file => 
                        file.includes('staff') || 
                        file.includes('evaluation') || 
                        file.includes('personnel') || 
                        file.includes('theme') ||
                        file.endsWith('.json') ||
                        file.endsWith('.db') ||
                        file.endsWith('.sqlite')
                    );
                    
                    if (dataFiles.length > 0) {
                        foundData.push({
                            path: oldPath,
                            files: dataFiles,
                            type: this.detectDataType(oldPath, dataFiles)
                        });
                        console.log(`   ✅ Trouvé: ${oldPath} (${dataFiles.length} fichiers)`);
                    }
                }
            } catch (error) {
                // Ignorer les erreurs d'accès
            }
        }
        
        return foundData;
    }
    
    /**
     * 🏷️ Détecte le type de données trouvées
     */
    static detectDataType(path, files) {
        if (files.some(f => f.includes('staff') || f.includes('personnel'))) {
            return 'electron-app';
        }
        if (files.some(f => f.includes('evaluation'))) {
            return 'electron-app';
        }
        if (files.some(f => f.endsWith('.leveldb'))) {
            return 'browser-localstorage';
        }
        if (files.some(f => f.endsWith('.json'))) {
            return 'json-files';
        }
        if (files.some(f => f.endsWith('.db') || f.endsWith('.sqlite'))) {
            return 'database';
        }
        return 'unknown';
    }
    
    /**
     * 📊 Migrate les données JSON (format principal)
     */
    static async migrateJsonData(sourcePath) {
        console.log(`📊 Migration des données JSON depuis ${sourcePath}...`);
        
        const dataToMigrate = {
            staff: [],
            evaluations: [],
            themes: []
        };
        
        try {
            // Chercher les fichiers de données
            const files = await fs.readdir(sourcePath);
            
            for (const file of files) {
                const filePath = path.join(sourcePath, file);
                const stats = await fs.stat(filePath);
                
                if (stats.isFile() && file.endsWith('.json')) {
                    try {
                        const content = await fs.readFile(filePath, 'utf8');
                        const data = JSON.parse(content);
                        
                        // Identifier le type de données par le nom de fichier
                        if (file.includes('staff') || file.includes('personnel')) {
                            if (Array.isArray(data)) {
                                dataToMigrate.staff = [...dataToMigrate.staff, ...data];
                            } else if (data.staff) {
                                dataToMigrate.staff = [...dataToMigrate.staff, ...data.staff];
                            }
                        } else if (file.includes('evaluation')) {
                            if (Array.isArray(data)) {
                                dataToMigrate.evaluations = [...dataToMigrate.evaluations, ...data];
                            } else if (data.evaluations) {
                                dataToMigrate.evaluations = [...dataToMigrate.evaluations, ...data.evaluations];
                            }
                        } else if (file.includes('theme')) {
                            if (Array.isArray(data)) {
                                dataToMigrate.themes = [...dataToMigrate.themes, ...data];
                            } else if (data.themes) {
                                dataToMigrate.themes = [...dataToMigrate.themes, ...data.themes];
                            }
                        }
                    } catch (error) {
                        console.warn(`   ⚠️ Impossible de lire ${file}: ${error.message}`);
                    }
                }
            }
            
        } catch (error) {
            console.error(`❌ Erreur lors de la migration depuis ${sourcePath}:`, error.message);
        }
        
        return dataToMigrate;
    }
    
    /**
     * 🔄 Migration complète des données
     */
    static async performMigration() {
        console.log('🔄 === MIGRATION DES DONNÉES UTILISATEUR ===\n');
        
        try {
            // 1. Rechercher les anciennes données
            const legacyDataSources = await this.findLegacyData();
            
            if (legacyDataSources.length === 0) {
                console.log('ℹ️ Aucune donnée d\'ancienne version trouvée - Installation propre');
                return { success: true, migrated: false, data: null };
            }
            
            console.log(`\n📦 ${legacyDataSources.length} source(s) de données trouvée(s)`);
            
            // 2. Compiler toutes les données trouvées
            const migratedData = {
                staff: [],
                evaluations: [],
                themes: []
            };
            
            for (const source of legacyDataSources) {
                console.log(`\n🔄 Migration depuis: ${source.path}`);
                
                if (source.type === 'json-files' || source.type === 'electron-app') {
                    const sourceData = await this.migrateJsonData(source.path);
                    
                    // Fusionner les données en évitant les doublons
                    migratedData.staff = this.mergeDeduplicate(migratedData.staff, sourceData.staff, 'email');
                    migratedData.evaluations = this.mergeDeduplicate(migratedData.evaluations, sourceData.evaluations, 'id');
                    migratedData.themes = this.mergeDeduplicate(migratedData.themes, sourceData.themes, 'name');
                }
            }
            
            // 3. Créer le nouveau dossier de données si nécessaire
            await fs.ensureDir(NEW_DATA_PATH);
            
            // 4. Sauvegarder les données migrées
            if (migratedData.staff.length > 0) {
                await fs.writeFile(path.join(NEW_DATA_PATH, 'staff.json'), JSON.stringify(migratedData.staff, null, 2));
                console.log(`   ✅ ${migratedData.staff.length} membres du personnel migrés`);
            }
            
            if (migratedData.evaluations.length > 0) {
                await fs.writeFile(path.join(NEW_DATA_PATH, 'evaluations.json'), JSON.stringify(migratedData.evaluations, null, 2));
                console.log(`   ✅ ${migratedData.evaluations.length} évaluations migrées`);
            }
            
            if (migratedData.themes.length > 0) {
                await fs.writeFile(path.join(NEW_DATA_PATH, 'themes.json'), JSON.stringify(migratedData.themes, null, 2));
                console.log(`   ✅ ${migratedData.themes.length} thèmes migrés`);
            }
            
            // 5. Créer un fichier de migration pour éviter de refaire la migration
            const migrationInfo = {
                migrationDate: new Date().toISOString(),
                sourceCount: legacyDataSources.length,
                migratedData: {
                    staff: migratedData.staff.length,
                    evaluations: migratedData.evaluations.length,
                    themes: migratedData.themes.length
                }
            };
            
            await fs.writeFile(path.join(NEW_DATA_PATH, 'migration.json'), JSON.stringify(migrationInfo, null, 2));
            
            console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS !');
            console.log(`📊 Données migrées: ${migratedData.staff.length + migratedData.evaluations.length + migratedData.themes.length} éléments`);
            
            return { success: true, migrated: true, data: migratedData };
            
        } catch (error) {
            console.error('💥 Erreur lors de la migration:', error);
            return { success: false, migrated: false, error: error.message };
        }
    }
    
    /**
     * 🔗 Fusionne les données en éliminant les doublons
     */
    static mergeDeduplicate(target, source, keyField) {
        if (!source || !Array.isArray(source)) return target;
        
        const existingKeys = new Set(target.map(item => item[keyField]));
        const newItems = source.filter(item => item[keyField] && !existingKeys.has(item[keyField]));
        
        return [...target, ...newItems];
    }
    
    /**
     * ✅ Vérifier si une migration a déjà été effectuée
     */
    static async isMigrationDone() {
        const migrationFile = path.join(NEW_DATA_PATH, 'migration.json');
        return await fs.pathExists(migrationFile);
    }
}

// Exécution directe
if (require.main === module) {
    DataMigrator.performMigration().then(result => {
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = { DataMigrator };