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

  // Coverage settings - Comprehensive coverage reporting
  collectCoverage: true,
  collectCoverageFrom: [
    // Main source files
    "*.js",
    "lib/**/*.js",
    "development/essentials/*.js",
    // Exclude test files, node_modules, and build artifacts
    "!test/**",
    "!coverage/**",
    "!node_modules/**",
    "!.node-modules-backup/**",
    "!jest.config.js",
    "!eslint.config.js",
    "!development/performance-analysis/**",
    "!development/reports/**",
    "!development/docs/**",
    "!development/temp-scripts/**",
    "!**/node_modules/**"
  ],
  coverageDirectory: "coverage",
  coverageReporters: [
    "text",           // Console output
    "text-summary",   // Brief console summary
    "html",           // Interactive HTML report
    "json",           // JSON data for CI/CD
    "json-summary",   // Summary JSON
    "lcov",           // LCOV format for external tools
    "clover"          // Clover XML format
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Specific thresholds for critical modules
    "./taskmanager-api.js": {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    },
    "./lib/": {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },

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

  // Test results and coverage processors
  reporters: [
    "default",
    ["jest-html-reporters", {
      publicPath: "./coverage/html-report",
      filename: "jest-report.html",
      expand: true,
      hideIcon: false,
      pageTitle: "TaskManager Test Coverage Report",
      includeFailureMsg: true,
      includeSuiteFailure: true
    }],
    ["jest-junit", {
      outputDirectory: "./coverage",
      outputName: "junit.xml",
      classNameTemplate: "{classname}",
      titleTemplate: "{title}",
      ancestorSeparator: " › ",
      usePathForSuiteName: true
    }]
  ],
};
