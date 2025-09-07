/**
 * Jest Configuration for TaskManager API Tests
 *
 * Configuration optimized for testing the TaskManager API endpoints
 * with proper timeout handling and test isolation.
 */

module.exports = {
  // Test environment
  testEnvironment: "node",

  // Test file patterns
  testMatch: ["**/test/**/*.test.js", "**/?(*.)+(spec|test).js"],

  // Test timeout - increased for API operations
  testTimeout: 30000,

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],

  // Coverage settings
  collectCoverage: false,

  // Module paths
  roots: ["<rootDir>"],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output for debugging
  verbose: true,

  // Detect open handles (for debugging hanging tests)
  detectOpenHandles: false,

  // Force exit after tests complete
  forceExit: true,

  // Test results processor
  reporters: ["default"],
};
