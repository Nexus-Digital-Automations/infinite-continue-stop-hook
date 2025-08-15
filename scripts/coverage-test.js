#!/usr/bin/env node

/**
 * Coverage Test - Minimal coverage collection test
 * Tests coverage collection in isolation without running full test suite
 */

const { spawn } = require('child_process');
const ContaminationResolver = require('../lib/contaminationResolver');

console.log('Coverage Test: Testing minimal coverage collection...');

async function runCoverageTest() {
    const resolver = new ContaminationResolver('.');
    
    try {
        // Enable coverage-safe mode
        process.env.COVERAGE_MODE = 'true';
        
        // Store original file contents before any coverage operation
        console.log('Coverage Test: Storing original file contents...');
        await resolver.storeOriginalContents();
        
        // Create a simple test file to measure coverage on
        const testContent = `
describe('Coverage Test', () => {
    test('simple test for coverage', () => {
        expect(1 + 1).toBe(2);
    });
});
`;
        
        const fs = require('fs');
        fs.writeFileSync('./test-coverage-only.test.js', testContent);
        
        // Run only coverage collection on a minimal test
        console.log('Coverage Test: Running minimal Jest coverage...');
        await runCommand('node', [
            '--max-old-space-size=4096',
            './node_modules/.bin/jest',
            '--config', 'jest.coverage.config.js',
            '--coverage',
            '--collectCoverageFrom=lib/taskManager.js',
            '--coverageReporters=text',
            '--testPathPattern=test-coverage-only.test.js',
            '--maxWorkers=1',
            '--forceExit',
            '--silent'
        ]);
        
        // Clean up test file
        fs.unlinkSync('./test-coverage-only.test.js');
        
        // Check for contamination after coverage
        console.log('Coverage Test: Checking for contamination...');
        const contaminated = await resolver.detectContamination();
        
        if (contaminated.length > 0) {
            console.log(`Coverage Test: 🚨 ${contaminated.length} files contaminated during coverage:`);
            contaminated.forEach(item => {
                console.log(`  - ${item.file}: ${item.content.substring(0, 50)}...`);
            });
            
            // Attempt restoration
            console.log('Coverage Test: Attempting restoration...');
            await resolver.restoreContaminatedFiles();
            
            return false;
        } else {
            console.log('Coverage Test: ✅ No contamination detected - coverage collection is clean');
            return true;
        }
        
    } catch (error) {
        console.error('Coverage Test: ❌ Test failed:', error.message);
        return false;
    } finally {
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

// Run the coverage test
runCoverageTest().then(success => {
    console.log(`Coverage Test: ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
}).catch((error) => {
    console.error('Coverage Test: Fatal error:', error.message);
    process.exit(1);
});