#!/usr/bin/env node

/**
 * Post-Test Validation Script
 * 
 * This script runs after tests to ensure all critical Node.js files are clean
 * and provides comprehensive validation of the test environment integrity.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Import the exit.js restoration utilities
const { restoreExitJs, EXIT_JS_PATH } = require('./restore-exit-js');

// Critical files that need protection
const CRITICAL_FILES = [
    {
        path: EXIT_JS_PATH,
        name: 'exit.js',
        type: 'node_module',
        restorer: restoreExitJs
    },
    {
        path: path.join(__dirname, '..', 'node_modules', 'jest-worker', 'build', 'index.js'),
        name: 'jest-worker/index.js',
        type: 'node_module',
        restorer: null // Add restorer if needed
    }
];

// Expected patterns that should NOT be in JavaScript files
const CONTAMINATION_PATTERNS = [
    '"project"',
    '"tasks"',
    '"execution_count"',
    '"last_hook_activation"',
    'test-project',
    '{"project":',
    '"current_mode"'
];

/**
 * Check if a file contains contamination patterns
 */
function checkFileContamination(filePath, fileName) {
    try {
        if (!fs.existsSync(filePath)) {
            return { clean: true, reason: 'File does not exist' };
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const foundPatterns = CONTAMINATION_PATTERNS.filter(pattern => content.includes(pattern));
        
        if (foundPatterns.length > 0) {
            return {
                clean: false,
                contaminated: true,
                patterns: foundPatterns,
                content: content.substring(0, 300),
                reason: `Found contamination patterns: ${foundPatterns.join(', ')}`
            };
        }
        
        // Check for JSON structure in JS files
        if (fileName.endsWith('.js') && content.trim().startsWith('{')) {
            return {
                clean: false,
                contaminated: true,
                patterns: ['JSON_STRUCTURE'],
                content: content.substring(0, 300),
                reason: 'JavaScript file starts with JSON structure'
            };
        }
        
        return { clean: true, reason: 'File is clean' };
        
    } catch (error) {
        return {
            clean: false,
            contaminated: false,
            error: error.message,
            reason: `Error reading file: ${error.message}`
        };
    }
}

/**
 * Validate all critical files
 */
function validateCriticalFiles() {
    console.log('🔍 Post-Test Critical File Validation');
    console.log('=====================================');
    
    let allClean = true;
    let restoredCount = 0;
    
    for (const file of CRITICAL_FILES) {
        console.log(`\n📁 Checking: ${file.name}`);
        console.log(`   Path: ${file.path}`);
        
        const result = checkFileContamination(file.path, file.name);
        
        if (result.clean) {
            console.log(`   ✅ Status: ${result.reason}`);
        } else if (result.contaminated) {
            console.log(`   🚨 CONTAMINATED: ${result.reason}`);
            console.log(`   📝 Content preview: ${result.content}...`);
            
            // Attempt restoration if restorer is available
            if (file.restorer) {
                console.log(`   🔧 Attempting restoration...`);
                try {
                    if (file.restorer(file.path)) {
                        console.log(`   ✅ Successfully restored`);
                        restoredCount++;
                    } else {
                        console.log(`   ❌ Restoration failed`);
                        allClean = false;
                    }
                } catch (error) {
                    console.log(`   ❌ Restoration error: ${error.message}`);
                    allClean = false;
                }
            } else {
                console.log(`   ⚠️  No restorer available for this file`);
                allClean = false;
            }
        } else {
            console.log(`   ❌ Error: ${result.reason}`);
            allClean = false;
        }
    }
    
    return { allClean, restoredCount };
}

/**
 * Run a quick test to verify restoration worked
 */
async function runVerificationTest() {
    console.log('\n🧪 Running verification test...');
    
    return new Promise((resolve) => {
        const testProcess = spawn('node', ['-e', 'console.log("Node.js verification successful")'], {
            stdio: 'pipe',
            env: process.env
        });
        
        let output = '';
        let error = '';
        
        testProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        testProcess.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        // Timeout after 5 seconds
        const timeoutId = global.setTimeout(() => {
            testProcess.kill();
            console.log('   ⏰ Verification test timed out');
            resolve(false);
        }, 5000);
        
        testProcess.on('close', (code) => {
            global.clearTimeout(timeoutId);
            if (code === 0 && output.includes('verification successful')) {
                console.log('   ✅ Node.js verification passed');
                resolve(true);
            } else {
                console.log('   ❌ Node.js verification failed');
                if (error) console.log(`   📝 Error: ${error}`);
                resolve(false);
            }
        });
    });
}

/**
 * Generate summary report
 */
function generateSummaryReport(validationResult, verificationPassed) {
    console.log('\n📊 POST-TEST VALIDATION SUMMARY');
    console.log('================================');
    
    if (validationResult.allClean && verificationPassed) {
        console.log('🎉 ALL SYSTEMS CLEAN - Test environment is healthy');
        console.log(`   - All critical files validated`);
        console.log(`   - ${validationResult.restoredCount} files restored`);
        console.log(`   - Node.js verification passed`);
        return true;
    } else {
        console.log('🔥 ISSUES DETECTED - Action required');
        if (!validationResult.allClean) {
            console.log('   ❌ Critical file contamination detected');
        }
        if (!verificationPassed) {
            console.log('   ❌ Node.js verification failed');
        }
        console.log(`   - ${validationResult.restoredCount} files restored`);
        return false;
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        // Validate all critical files
        const validationResult = validateCriticalFiles();
        
        // Run verification test
        const verificationPassed = await runVerificationTest();
        
        // Generate summary
        const success = generateSummaryReport(validationResult, verificationPassed);
        
        // Exit with appropriate code
        process.exit(success ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Post-test validation failed:', error.message);
        process.exit(1);
    }
}

// Run the script if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = {
    validateCriticalFiles,
    checkFileContamination,
    runVerificationTest
};