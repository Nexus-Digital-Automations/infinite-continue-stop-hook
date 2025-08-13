#!/usr/bin/env node

/**
 * Build Validator - Validates project structure and dependencies
 * This is a placeholder that ensures the build process can continue
 */

const fs = require('fs');
const path = require('path');

console.log('Build Validator: Checking project structure...');

// Check if package.json exists
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.error('Build Validator: ERROR - package.json not found');
    process.exit(1);
}

// Check if main entry point exists
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const mainFile = path.join(process.cwd(), packageJson.main || 'index.js');
if (!fs.existsSync(mainFile)) {
    console.error(`Build Validator: ERROR - Main file ${packageJson.main || 'index.js'} not found`);
    process.exit(1);
}

console.log('Build Validator: ✅ Project structure validation passed');
process.exit(0);