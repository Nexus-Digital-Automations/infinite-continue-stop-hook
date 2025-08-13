#!/usr/bin/env node

/**
 * Safe Coverage - Runs Jest with coverage in a contamination-safe environment
 * Ensures clean coverage collection without test interference
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Safe Coverage: Starting contamination-safe coverage collection...');

async function runSafeCoverage() {
    try {
        // Run contamination fix before coverage
        console.log('Safe Coverage: Running pre-coverage contamination fix...');
        await runCommand('node', ['scripts/fix-contamination.js']);
        
        // Run Jest with coverage
        console.log('Safe Coverage: Running Jest with coverage collection...');
        await runCommand('node', [
            '--max-old-space-size=4096',
            './node_modules/.bin/jest',
            '--config', 'jest.coverage.config.js',
            '--coverage',
            '--collectCoverageFrom=lib/**/*.js',
            '--coverageReporters=text,lcov,html'
        ]);
        
        // Run contamination fix after coverage
        console.log('Safe Coverage: Running post-coverage contamination fix...');
        await runCommand('node', ['scripts/fix-contamination.js']);
        
        console.log('Safe Coverage: ✅ Coverage collection completed successfully');
        
    } catch (error) {
        console.error('Safe Coverage: ❌ Coverage collection failed:', error.message);
        process.exit(1);
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