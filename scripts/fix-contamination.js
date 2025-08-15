#!/usr/bin/env node

/**
 * Enhanced Fix Contamination Script
 * Comprehensive cleanup and protection system for test contamination issues
 * Now includes proactive protection setup and contamination resolver integration
 */

const fs = require('fs');
const path = require('path');
const ContaminationResolver = require('../lib/contaminationResolver');

console.log('🧹 Enhanced Fix Contamination: Setting up comprehensive protection...');

async function main() {
    let cleanedFiles = 0;
    
    try {
        // Initialize the enhanced contamination resolver
        const resolver = new ContaminationResolver(process.cwd());
        
        // Set up proactive protection immediately
        resolver.setupJestExitProtection();
        console.log('✅ Proactive protection system activated');
        
        // Store original file contents before any test operations
        await resolver.storeOriginalContents();
        console.log('✅ Original file contents stored for protection');
        
        // Create backups of clean files
        await resolver.createBackups();
        console.log('✅ Clean file backups created');
        
        // Clean up any temporary test files that might interfere with subsequent tests
        const tempFiles = [
            'test-contamination.json',
            'test-fallback.lock',
            '.test-temp-files',
            '.test-corruption-prevention' // New test directory
        ];

        tempFiles.forEach(file => {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                try {
                    const stats = fs.statSync(filePath);
                    if (stats.isDirectory()) {
                        fs.rmSync(filePath, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(filePath);
                    }
                    cleanedFiles++;
                    console.log(`🧹 Cleaned up ${file}`);
                } catch (error) {
                    console.warn(`⚠️ Warning - Could not clean ${file}: ${error.message}`);
                }
            }
        });

        // Enhanced JSON contamination detection and cleanup
        async function detectAndFixJSONContamination() {
            console.log('🔍 Scanning for JSON contamination...');
            
            // Detect contamination using the enhanced resolver
            const contaminated = await resolver.detectContamination();
            
            if (contaminated.length > 0) {
                console.log(`🚨 Found ${contaminated.length} contaminated files:`);
                contaminated.forEach(item => {
                    console.log(`   - ${item.file}: ${item.content.substring(0, 60)}...`);
                });
                
                // Restore contaminated files
                const result = await resolver.restoreContaminatedFiles();
                cleanedFiles += result.restored;
                console.log(`✅ Restored ${result.restored} contaminated files`);
            }
            
            // Additional check for suspicious JavaScript files containing JSON data
            const suspiciousFiles = ['test.js', 'index.js'];
            
            suspiciousFiles.forEach(file => {
                const filePath = path.join(process.cwd(), file);
                if (fs.existsSync(filePath)) {
                    try {
                        const content = fs.readFileSync(filePath, 'utf8').trim();
                        // Check if file starts with JSON-like pattern
                        if (content.startsWith('{"') || content.startsWith('[{')) {
                            console.log(`🚨 Detected JSON contamination in ${file}`);
                            fs.unlinkSync(filePath);
                            console.log(`🧹 Removed corrupted ${file}`);
                            cleanedFiles++;
                        }
                    } catch (error) {
                        console.warn(`⚠️ Warning - Could not check ${file}: ${error.message}`);
                    }
                }
            });
        }

        await detectAndFixJSONContamination();

        // Clean up any jest cache if it exists
        const jestCacheDir = path.join(process.cwd(), 'node_modules', '.cache', 'jest');
        if (fs.existsSync(jestCacheDir)) {
            try {
                fs.rmSync(jestCacheDir, { recursive: true, force: true });
                console.log('🧹 Cleaned up Jest cache');
                cleanedFiles++;
            } catch (error) {
                console.warn(`⚠️ Warning - Could not clean Jest cache: ${error.message}`);
            }
        }
        
        // Additional cleanup for common test artifacts
        const additionalCleanupPaths = [
            'coverage',
            '.nyc_output',
            'test-results.xml',
            'junit.xml'
        ];
        
        additionalCleanupPaths.forEach(artifactPath => {
            const fullPath = path.join(process.cwd(), artifactPath);
            if (fs.existsSync(fullPath)) {
                try {
                    const stats = fs.statSync(fullPath);
                    if (stats.isDirectory()) {
                        fs.rmSync(fullPath, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(fullPath);
                    }
                    console.log(`🧹 Cleaned up ${artifactPath}`);
                    cleanedFiles++;
                } catch {
                    // Silently ignore cleanup failures for optional artifacts
                }
            }
        });

        console.log(`\n✅ Enhanced environment cleanup completed:`);
        console.log(`   🛡️ Proactive protection: ACTIVE`);
        console.log(`   📦 Original contents: PROTECTED`);
        console.log(`   🧹 Items cleaned: ${cleanedFiles}`);
        console.log(`   🚧 Write blocking: ENABLED`);
        
        // Final verification
        const finalContamination = await resolver.detectContamination();
        if (finalContamination.length === 0) {
            console.log('   ✅ No contamination detected - system clean');
        } else {
            console.log(`   ⚠️ ${finalContamination.length} files still show contamination - may require manual intervention`);
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error during enhanced contamination cleanup:', error.message);
        console.error('   Stack:', error.stack);
        process.exit(1);
    }
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception during contamination cleanup:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled rejection during contamination cleanup:', reason);
    process.exit(1);
});

// Run the main function
main();