#!/usr/bin/env node

/**
 * Features.md to features.json Migration Utility
 * 
 * === OVERVIEW ===
 * This utility converts the existing features.md file to the new features.json
 * format for the Feature-Task Integration System. It preserves all feature
 * information while adding structured data for programmatic access.
 * 
 * === KEY FEATURES ===
 * • Automatic parsing of features.md sections
 * • Feature status mapping from markdown sections to JSON status
 * • Category extraction from feature descriptions  
 * • Unique ID generation for all features
 * • Metadata creation with timestamps and statistics
 * • Backup creation of original features.md
 * 
 * === USAGE ===
 * node migrate-features.js [--dry-run] [--backup] [--project-root /path/to/project]
 * 
 * === MIGRATION MAPPING ===
 * • "✅ Implemented Features" → status: "implemented"
 * • "🚧 Features In Progress" → status: "in_progress"  
 * • "📋 Planned Features" → status: "planned"
 * • "❓ Potential Features Awaiting User Verification" → status: "proposed"
 * 
 * @author TaskManager System
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FeatureMigrator {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
        this.featuresMdPath = path.join(projectRoot, 'development', 'essentials', 'features.md');
        this.featuresJsonPath = path.join(projectRoot, 'features.json');
        this.backupPath = path.join(projectRoot, 'backups', `features.md.backup.${Date.now()}`);
        
        // Status mapping from markdown sections to JSON status
        this.statusMapping = {
            'implemented features': 'implemented',
            'features in progress': 'in_progress', 
            'planned features': 'planned',
            'potential features awaiting user verification': 'proposed'
        };
        
        // Category mapping from feature content
        this.categoryMapping = {
            'task management': 'core_task_management',
            'logging': 'enhanced_logging',
            'hook': 'hook_system',
            'agent': 'advanced_task_management',
            'dependency': 'advanced_task_management',
            'multi-agent': 'advanced_task_management',
            'api': 'development_infrastructure',
            'testing': 'development_infrastructure',
            'performance': 'integration_enhancements',
            'security': 'integration_enhancements',
            'infrastructure': 'development_infrastructure'
        };
    }

    /**
     * Run the migration process
     * @param {Object} options - Migration options
     */
    async migrate(options = {}) {
        const { dryRun = false, backup = true } = options;
        
        try {
            console.log('🚀 Starting features.md to features.json migration...\n');
            
            // Check if features.md exists
            if (!fs.existsSync(this.featuresMdPath)) {
                throw new Error(`Features.md not found at ${this.featuresMdPath}`);
            }
            
            // Read and parse features.md
            console.log('📖 Reading features.md...');
            const featuresText = fs.readFileSync(this.featuresMdPath, 'utf8');
            const parsedFeatures = this.parseFeaturesMd(featuresText);
            
            console.log(`✅ Parsed ${parsedFeatures.length} features from features.md\n`);
            
            // Convert to JSON format
            console.log('🔄 Converting to features.json format...');
            const featuresJson = this.convertToJsonFormat(parsedFeatures);
            
            // Display preview
            this.displayMigrationPreview(featuresJson);
            
            if (dryRun) {
                console.log('\n🔍 DRY RUN MODE - No files will be modified');
                return featuresJson;
            }
            
            // Create backup if requested
            if (backup) {
                console.log('💾 Creating backup of features.md...');
                this.createBackup();
            }
            
            // Write features.json
            console.log('💿 Writing features.json...');
            this.writeFeatureJson(featuresJson);
            
            console.log('\n🎉 Migration completed successfully!');
            console.log(`📁 Features.json created: ${this.featuresJsonPath}`);
            if (backup) {
                console.log(`📁 Backup created: ${this.backupPath}`);
            }
            
            return featuresJson;
            
        } catch (error) {
            console.error('❌ Migration failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Parse features.md content into structured data
     * @param {string} content - Features.md content
     * @returns {Array} Parsed features array
     */
    parseFeaturesMd(content) {
        const features = [];
        const sections = this.splitIntoSections(content);
        
        for (const section of sections) {
            const sectionFeatures = this.parseFeaturesFromSection(section);
            features.push(...sectionFeatures);
        }
        
        return features;
    }
    
    /**
     * Split features.md into sections based on headers
     * @param {string} content - Features.md content
     * @returns {Array} Array of sections with their headers and content
     */
    splitIntoSections(content) {
        const sections = [];
        const lines = content.split('\n');
        let currentSection = null;
        
        for (const line of lines) {
            // Check for section headers (## or ###)
            if (line.match(/^##\s+/)) {
                // Save previous section
                if (currentSection) {
                    sections.push(currentSection);
                }
                
                // Start new section
                currentSection = {
                    header: line.replace(/^##\s+/, '').trim(),
                    content: []
                };
            } else if (currentSection) {
                currentSection.content.push(line);
            }
        }
        
        // Add last section
        if (currentSection) {
            sections.push(currentSection);
        }
        
        return sections;
    }
    
    /**
     * Parse features from a section
     * @param {Object} section - Section object with header and content
     * @returns {Array} Array of parsed features
     */
    parseFeaturesFromSection(section) {
        const features = [];
        const status = this.getStatusFromHeader(section.header);
        
        if (!status) {
            return features; // Skip non-feature sections
        }
        
        const content = section.content.join('\n');
        const featureBlocks = this.extractFeatureBlocks(content);
        
        for (const block of featureBlocks) {
            const feature = this.parseFeatureBlock(block, status);
            if (feature) {
                features.push(feature);
            }
        }
        
        return features;
    }
    
    /**
     * Get status from section header
     * @param {string} header - Section header text
     * @returns {string|null} Status or null if not a feature section
     */
    getStatusFromHeader(header) {
        const normalizedHeader = header.toLowerCase().replace(/[^\w\s]/g, '').trim();
        
        for (const [key, status] of Object.entries(this.statusMapping)) {
            if (normalizedHeader.includes(key)) {
                return status;
            }
        }
        
        return null;
    }
    
    /**
     * Extract individual feature blocks from section content
     * @param {string} content - Section content
     * @returns {Array} Array of feature block strings
     */
    extractFeatureBlocks(content) {
        const blocks = [];
        const lines = content.split('\n');
        let currentBlock = [];
        
        for (const line of lines) {
            // Check if line starts a new feature (#### header)
            if (line.match(/^####\s+/)) {
                // Save previous block
                if (currentBlock.length > 0) {
                    blocks.push(currentBlock.join('\n').trim());
                }
                
                // Start new block
                currentBlock = [line];
            } else if (currentBlock.length > 0) {
                currentBlock.push(line);
            }
        }
        
        // Add last block
        if (currentBlock.length > 0) {
            blocks.push(currentBlock.join('\n').trim());
        }
        
        return blocks.filter(block => block.length > 0);
    }
    
    /**
     * Parse a single feature block
     * @param {string} block - Feature block text
     * @param {string} status - Feature status
     * @returns {Object|null} Parsed feature object or null
     */
    parseFeatureBlock(block, status) {
        const lines = block.split('\n');
        
        // Extract title from first line (#### Title)
        const titleMatch = lines[0].match(/^####\s+(.+)$/);
        if (!titleMatch) {
            return null;
        }
        
        const title = titleMatch[1].trim();
        
        // Extract description (everything after title)
        let description = '';
        let effort = 'medium';
        let priority = 'medium';
        const dependencies = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('**Description**:')) {
                description = line.replace('**Description**:', '').trim();
            } else if (line.startsWith('**Implementation Effort**:')) {
                effort = line.replace('**Implementation Effort**:', '').trim().toLowerCase();
            } else if (line.startsWith('**Dependencies**:')) {
                const depText = line.replace('**Dependencies**:', '').trim();
                if (depText && depText !== 'None') {
                    dependencies.push(...depText.split(',').map(d => d.trim()));
                }
            } else if (line && !line.startsWith('**') && !description) {
                // Use first non-empty, non-meta line as description if no explicit description
                description = line;
            }
        }
        
        // If no description found, use title as description
        if (!description) {
            description = `Implementation of ${title}`;
        }
        
        return {
            title,
            description,
            status,
            category: this.extractCategory(title, description),
            priority,
            effort,
            dependencies,
            rawText: block
        };
    }
    
    /**
     * Extract category from title and description
     * @param {string} title - Feature title
     * @param {string} description - Feature description
     * @returns {string} Category name
     */
    extractCategory(title, description) {
        const text = `${title} ${description}`.toLowerCase();
        
        for (const [keyword, category] of Object.entries(this.categoryMapping)) {
            if (text.includes(keyword)) {
                return category;
            }
        }
        
        return 'uncategorized';
    }
    
    /**
     * Convert parsed features to JSON format
     * @param {Array} parsedFeatures - Array of parsed features
     * @returns {Object} Features JSON object
     */
    convertToJsonFormat(parsedFeatures) {
        const featuresJson = {
            version: '1.0.0',
            project: path.basename(this.projectRoot),
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            migration: {
                migrated_from: 'features.md',
                migration_date: new Date().toISOString(),
                total_features_migrated: parsedFeatures.length
            },
            features: {},
            categories: {
                core_task_management: 'Core Task Management',
                development_infrastructure: 'Development Infrastructure', 
                hook_system: 'Hook System',
                enhanced_logging: 'Enhanced Logging',
                advanced_task_management: 'Advanced Task Management',
                integration_enhancements: 'Integration Enhancements',
                uncategorized: 'Uncategorized'
            },
            metadata: {
                total_features: 0,
                by_status: {
                    proposed: 0,
                    approved: 0,
                    planned: 0,
                    in_progress: 0,
                    implemented: 0
                },
                by_category: {}
            }
        };
        
        // Convert each feature
        for (const parsedFeature of parsedFeatures) {
            const featureId = this.generateFeatureId(parsedFeature.title);
            const feature = {
                id: featureId,
                title: parsedFeature.title,
                description: parsedFeature.description,
                status: parsedFeature.status,
                category: parsedFeature.category,
                priority: parsedFeature.priority,
                effort: parsedFeature.effort,
                created_at: new Date().toISOString(),
                created_by: 'migration_system',
                approved_at: parsedFeature.status !== 'proposed' ? new Date().toISOString() : null,
                approved_by: parsedFeature.status !== 'proposed' ? 'system_migration' : null,
                implementation_tasks: [],
                dependencies: parsedFeature.dependencies,
                metadata: {
                    last_updated: new Date().toISOString(),
                    status_history: [{
                        status: parsedFeature.status,
                        timestamp: new Date().toISOString(),
                        changed_by: 'migration_system',
                        reason: `Migrated from features.md with status: ${parsedFeature.status}`
                    }],
                    user_notes: null,
                    original_markdown: parsedFeature.rawText
                }
            };
            
            featuresJson.features[featureId] = feature;
        }
        
        // Update metadata
        this.updateMetadata(featuresJson);
        
        return featuresJson;
    }
    
    /**
     * Generate unique feature ID
     * @param {string} title - Feature title
     * @returns {string} Unique feature ID
     */
    generateFeatureId(title) {
        const timestamp = Date.now();
        const hash = crypto.createHash('md5').update(title).digest('hex').substring(0, 8);
        return `feature_${timestamp}_${hash}`;
    }
    
    /**
     * Update metadata counters
     * @param {Object} featuresJson - Features JSON object
     */
    updateMetadata(featuresJson) {
        const features = featuresJson.features || {};
        
        // Reset counters
        featuresJson.metadata.total_features = Object.keys(features).length;
        featuresJson.metadata.by_status = {
            proposed: 0,
            approved: 0,
            planned: 0,
            in_progress: 0,
            implemented: 0
        };
        featuresJson.metadata.by_category = {};
        
        // Count features by status and category
        for (const feature of Object.values(features)) {
            featuresJson.metadata.by_status[feature.status]++;
            
            if (feature.category) {
                featuresJson.metadata.by_category[feature.category] = 
                    (featuresJson.metadata.by_category[feature.category] || 0) + 1;
            }
        }
    }
    
    /**
     * Create backup of features.md
     */
    createBackup() {
        // Ensure backup directory exists
        const backupDir = path.dirname(this.backupPath);
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        fs.copyFileSync(this.featuresMdPath, this.backupPath);
    }
    
    /**
     * Write features JSON to file
     * @param {Object} featuresJson - Features JSON object
     */
    writeFeatureJson(featuresJson) {
        const jsonContent = JSON.stringify(featuresJson, null, 2);
        fs.writeFileSync(this.featuresJsonPath, jsonContent);
    }
    
    /**
     * Display migration preview
     * @param {Object} featuresJson - Features JSON object
     */
    displayMigrationPreview(featuresJson) {
        console.log('📋 Migration Preview:');
        console.log(`   Total Features: ${featuresJson.metadata.total_features}`);
        console.log('   Status Breakdown:');
        
        for (const [status, count] of Object.entries(featuresJson.metadata.by_status)) {
            console.log(`     ${status}: ${count}`);
        }
        
        console.log('   Category Breakdown:');
        for (const [category, count] of Object.entries(featuresJson.metadata.by_category)) {
            console.log(`     ${category}: ${count}`);
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    
    // Parse command line options
    const options = {
        dryRun: args.includes('--dry-run'),
        backup: !args.includes('--no-backup')
    };
    
    // Parse project root
    let projectRoot = process.cwd();
    const projectRootIndex = args.indexOf('--project-root');
    if (projectRootIndex !== -1 && args[projectRootIndex + 1]) {
        projectRoot = path.resolve(args[projectRootIndex + 1]);
    }
    
    try {
        const migrator = new FeatureMigrator(projectRoot);
        await migrator.migrate(options);
        
        console.log('\n✅ Migration completed successfully!');
        console.log('\n📖 Next Steps:');
        console.log('1. Review the generated features.json file');
        console.log('2. Test feature management commands:');
        console.log('   node taskmanager-api.js feature-list');
        console.log('   node taskmanager-api.js feature-stats');
        console.log('3. Start using the Feature-Task Integration System!');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Export for programmatic use
module.exports = FeatureMigrator;

// Run CLI if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal migration error:', error.message);
        process.exit(1);
    });
}