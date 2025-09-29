/**
 * Jest Configuration For E2E Tests
 *
 * Simple configuration focused on E2E test execution
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.test.js'],
  testTimeout: 60000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: false,
  collectCoverage: false,
  maxWorkers: 1, // Run E2E tests sequentially to avoid conflicts

  // Mock problematic ES module dependencies
  moduleNameMapper: {
    '@xenova/transformers': '<rootDir>/../../test/mocks/transformers-mock.js',
  },
};
