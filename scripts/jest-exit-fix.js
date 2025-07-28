#!/usr/bin/env node

/**
 * Jest Exit Fix Script
 * 
 * This script addresses the critical exit.js contamination issue that occurs during Jest's exit process.
 * It ensures that the exit.js file is restored immediately after any Jest run.
 */

const fs = require('fs');
const { spawn } = require('child_process');

// Import restoration utilities
const { ORIGINAL_EXIT_JS_CONTENT, EXIT_JS_PATH } = require('./restore-exit-js');

/**
 * Force restoration of exit.js file with original content
 */
function forceRestoreExitJs() {
    try {
        // Ensure the file exists and write original content
        fs.writeFileSync(EXIT_JS_PATH, ORIGINAL_EXIT_JS_CONTENT, 'utf8');
        console.log('✅ Exit.js file restored to original state');
        return true;
    } catch (error) {
        console.error('❌ Failed to restore exit.js:', error.message);
        return false;
    }
}

/**
 * Run Jest with automatic cleanup
 */
function runJestWithCleanup(args = []) {
    return new Promise((resolve) => {
        console.log('🚀 Starting Jest with automatic exit.js protection...');
        
        // Force restore before starting
        forceRestoreExitJs();
        
        const jestProcess = spawn('npx', ['jest', ...args], {
            stdio: 'inherit',
            env: process.env
        });
        
        jestProcess.on('exit', (code) => {
            console.log(`\n🔧 Jest completed with code ${code}, restoring exit.js...`);
            
            // Force restore after Jest exits
            forceRestoreExitJs();
            
            // Double-check restoration worked
            global.setTimeout(() => {
                try {
                    const content = fs.readFileSync(EXIT_JS_PATH, 'utf8');
                    if (content === ORIGINAL_EXIT_JS_CONTENT) {
                        console.log('✅ Exit.js verification: File is clean');
                        resolve(code);
                    } else {
                        console.log('⚠️ Exit.js verification: File may be contaminated, forcing restoration...');
                        forceRestoreExitJs();
                        resolve(code);
                    }
                } catch (error) {
                    console.error('❌ Exit.js verification failed:', error.message);
                    resolve(code);
                }
            }, 100);
        });
        
        jestProcess.on('error', (error) => {
            console.error('❌ Jest process error:', error.message);
            forceRestoreExitJs();
            resolve(1);
        });
        
        // Handle process termination signals
        process.on('SIGINT', () => {
            console.log('\n🛑 Received SIGINT, cleaning up...');
            jestProcess.kill();
            forceRestoreExitJs();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.log('\n🛑 Received SIGTERM, cleaning up...');
            jestProcess.kill();
            forceRestoreExitJs();
            process.exit(0);
        });
    });
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);
    
    console.log('🔍 Jest Exit Fix Script');
    console.log('=======================');
    
    const exitCode = await runJestWithCleanup(args);
    process.exit(exitCode);
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        forceRestoreExitJs();
        process.exit(1);
    });
}

module.exports = {
    runJestWithCleanup,
    forceRestoreExitJs
};