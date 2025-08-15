#!/usr/bin/env node

/**
 * Safe Coverage - Runs Jest with coverage in a contamination-safe environment
 * Ensures clean coverage collection without test interference
 */

const { spawn } = require('child_process');
const ContaminationResolver = require('../lib/contaminationResolver');

console.log('Safe Coverage: Starting contamination-safe coverage collection...');

async function runSafeCoverage() {
    const resolver = new ContaminationResolver('.');
    
    try {
        // Enable coverage-safe mode
        process.env.COVERAGE_MODE = 'true';
        
        // Pre-coverage cleanup and protection setup
        console.log('Safe Coverage: Setting up contamination protection...');
        await resolver.storeOriginalContents();
        
        // Run contamination fix before coverage
        console.log('Safe Coverage: Running pre-coverage contamination fix...');
        await runCommand('node', ['scripts/fix-contamination.js']);
        
        // Run Jest with coverage in isolated mode
        console.log('Safe Coverage: Running Jest with coverage collection...');
        await runCommand('node', [
            '--max-old-space-size=4096',
            './node_modules/.bin/jest',
            '--config', 'jest.coverage.config.js',
            '--coverage',
            '--collectCoverageFrom=lib/**/*.js',
            '--coverageReporters=text,lcov,html',
            '--maxWorkers=1',
            '--forceExit'
        ]);
        
        // Post-coverage restoration
        console.log('Safe Coverage: Running post-coverage contamination fix...');
        await resolver.restoreContaminatedFiles();
        
        console.log('Safe Coverage: ✅ Coverage collection completed successfully');
        
    } catch (error) {
        console.error('Safe Coverage: ❌ Coverage collection failed:', error.message);
        
        // Emergency cleanup on failure
        try {
            console.log('Safe Coverage: Running emergency cleanup...');
            await resolver.restoreContaminatedFiles();
        } catch (cleanupError) {
            console.error('Safe Coverage: Emergency cleanup failed:', cleanupError.message);
        }
        
        process.exit(1);
    } finally {
        // Clear coverage mode
        delete process.env.COVERAGE_MODE;
    }
}

function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: process.platform === 'win32'
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });
        
        child.on('error', (error) => {
            reject(error);
        });
    });
}

// Run the safe coverage process
runSafeCoverage().catch((error) => {
    console.error('Safe Coverage: Fatal error:', error.message);
    process.exit(1);
});