/**
 * Simple Jest Configuration for Unit Tests
 * Avoids complex configuration issues for unit test validation
 */

module.exports = {,,
    testEnvironment: 'node',
  testMatch: ['**/test/unit/**/*.test.js'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  collectCoverage: false,
  clearMocks: true,
  verbose: true,
};
