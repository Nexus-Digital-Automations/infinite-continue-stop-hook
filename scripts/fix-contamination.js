#!/usr/bin/env node

/**
 * Fix Contamination Script - Cleans up test contamination issues
 * This is a placeholder that ensures test scripts can run
 */

const fs = require('fs');
const path = require('path');

console.log('Fix Contamination: Cleaning up test environment...');

// Clean up any temporary test files that might interfere with subsequent tests
const tempFiles = [
    'test-contamination.json',
    'test-fallback.lock',
    '.test-temp-files'
];

let cleanedFiles = 0;
tempFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            cleanedFiles++;
            console.log(`Fix Contamination: Cleaned up ${file}`);
        } catch (error) {
            console.warn(`Fix Contamination: Warning - Could not clean ${file}: ${error.message}`);
        }
    }
});

// Clean up any jest cache if it exists
const jestCacheDir = path.join(process.cwd(), 'node_modules', '.cache', 'jest');
if (fs.existsSync(jestCacheDir)) {
    try {
        fs.rmSync(jestCacheDir, { recursive: true, force: true });
        console.log('Fix Contamination: Cleaned up Jest cache');
        cleanedFiles++;
    } catch (error) {
        console.warn(`Fix Contamination: Warning - Could not clean Jest cache: ${error.message}`);
    }
}

console.log(`Fix Contamination: ✅ Environment cleanup completed (${cleanedFiles} items cleaned)`);
process.exit(0);