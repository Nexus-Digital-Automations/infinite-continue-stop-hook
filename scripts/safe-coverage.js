#!/usr/bin/env node

/**
 * Safe Coverage Collection Script
 * 
 * This script provides coverage collection without causing JSON contamination
 * during Jest exit process by using c8 (V8 coverage) instead of Istanbul.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.cwd();
const coverageDir = path.join(projectRoot, 'coverage');

console.log('🔍 Safe Coverage Collection Starting...');
console.log('=====================================');

try {
    // Clean up any previous coverage data
    if (fs.existsSync(coverageDir)) {
        fs.rmSync(coverageDir, { recursive: true, force: true });
        console.log('✅ Cleaned previous coverage data');
    }

    // Check if c8 is available
    let c8Available = false;
    try {
        execSync('npx c8 --version', { stdio: 'pipe' });
        c8Available = true;
        console.log('✅ c8 coverage tool available');
    } catch {
        console.log('⚠️  c8 not available, trying nyc...');
    }

    let coverageCommand;
    
    if (c8Available) {
        // Use c8 (V8 native coverage) - safer than Istanbul
        coverageCommand = `npx c8 --reporter=html --reporter=text --reporter=json-summary ` +
                         `--include="lib/**/*.js" --exclude="lib/**/*.test.js" --exclude="lib/**/*.spec.js" ` +
                         `node --max-old-space-size=4096 ./node_modules/.bin/jest --config jest.no-coverage.config.js`;
    } else {
        // Fallback to controlled Jest coverage with environment protection
        process.env.COVERAGE_SAFE_MODE = 'true';
        coverageCommand = `ENABLE_COVERAGE=true node --max-old-space-size=4096 ./node_modules/.bin/jest --coverage --config jest.no-coverage.config.js`;
    }

    console.log('🧪 Running tests with coverage collection...');
    
    // Run contamination fix before coverage
    execSync('npm run fix-contamination', { stdio: 'inherit' });
    
    // Execute coverage collection
    execSync(coverageCommand, { 
        stdio: 'inherit', 
        cwd: projectRoot,
        env: { ...process.env, NODE_ENV: 'test' }
    });
    
    // Run contamination fix after coverage
    execSync('npm run fix-contamination', { stdio: 'inherit' });
    
    console.log('✅ Coverage collection completed successfully!');
    
    // Display coverage summary if available
    const summaryPath = path.join(coverageDir, 'coverage-summary.json');
    if (fs.existsSync(summaryPath)) {
        try {
            const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
            const total = summary.total;
            
            console.log('\n📊 Coverage Summary:');
            console.log('==================');
            console.log(`Lines:      ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})`);
            console.log(`Branches:   ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`);
            console.log(`Functions:  ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`);
            console.log(`Statements: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`);
        } catch {
            console.log('⚠️  Could not parse coverage summary');
        }
    }
    
    const htmlReport = path.join(coverageDir, 'lcov-report', 'index.html');
    if (fs.existsSync(htmlReport)) {
        console.log(`\n🌐 HTML Coverage Report: file://${htmlReport}`);
    }

} catch (error) {
    console.error('❌ Coverage collection failed:', error.message);
    
    // Always run contamination fix on error
    try {
        execSync('npm run fix-contamination', { stdio: 'inherit' });
    } catch (fixError) {
        console.error('❌ Contamination fix also failed:', fixError.message);
    }
    
    process.exit(1);
}

console.log('\n✅ Safe coverage collection completed!');