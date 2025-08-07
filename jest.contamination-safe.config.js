// Jest configuration with enhanced contamination protection
const path = require('path');
const baseConfig = require('./jest.config.js');

module.exports = {
  // Use the standard Jest configuration as base
  ...baseConfig,
  
  // FORCE DISABLE coverage collection to prevent Istanbul contamination
  collectCoverage: false,
  
  // Override setup files to include contamination prevention
  setupFilesAfterEnv: [
    path.join(__dirname, 'test/setup.js'),
    path.join(__dirname, 'scripts/jest-setup-contamination-fix.js')
  ],
  
  // Global teardown DISABLED to prevent contamination during Jest exit
  // globalTeardown: path.join(__dirname, 'scripts/jest-teardown-contamination-fix.js'),
  
  // Force exit to prevent hanging
  forceExit: true,
  
  // Detect open handles to prevent contamination during exit
  detectOpenHandles: true,
  
  // Disable runner for now to avoid complexity
  // runner: path.join(__dirname, 'scripts/jest-safe-runner.js'),
};