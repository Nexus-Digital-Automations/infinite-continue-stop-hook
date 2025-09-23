/**
 * Jest Configuration for Comprehensive Testing Infrastructure
 *
 * Enhanced configuration supporting multiple test environments, module mapping,
 * comprehensive coverage reporting, and advanced testing features.
 *
 * @author Testing Infrastructure Agent
 * @version 2.0.0
 * @since 2025-09-23
 */

module.exports = {
  // Test environment - Node.js for API and server-side testing
  testEnvironment: "node",

  // Alternative environments for different test types
  projects: [
    {
      displayName: "unit",
      testEnvironment: "node",
      testMatch: ["<rootDir>/test/unit/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/test/setup.js"]
    },
    {
      displayName: "integration",
      testEnvironment: "node",
      testMatch: ["<rootDir>/test/integration/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
      testTimeout: 45000
    },
    {
      displayName: "e2e",
      testEnvironment: "node",
      testMatch: ["<rootDir>/test/e2e/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
      testTimeout: 60000
    }
  ],

  // Test file patterns - comprehensive matching
  testMatch: [
    "**/test/**/*.test.js",
    "**/test/**/*.spec.js",
    "**/__tests__/**/*.js",
    "**/?(*.)+(spec|test).js"
  ],

  // Test timeout - variable by test type
  testTimeout: 30000,

  // Setup files - global configuration and utilities
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],

  // Module path mapping for easier imports
  moduleNameMapper: {
    "^@test/(.*)$": "<rootDir>/test/$1",
    "^@utils/(.*)$": "<rootDir>/test/utils/$1",
    "^@mocks/(.*)$": "<rootDir>/test/mocks/$1",
    "^@fixtures/(.*)$": "<rootDir>/test/fixtures/$1",
    "^@lib/(.*)$": "<rootDir>/lib/$1",
    "^@root/(.*)$": "<rootDir>/$1"
  },

  // Transform configuration for different file types
  transform: {
    "^.+\\.js$": ["babel-jest", { presets: ["@babel/preset-env"] }]
  },

  // Module file extensions
  moduleFileExtensions: ["js", "json", "node"],

  // Module directories
  moduleDirectories: ["node_modules", "<rootDir>", "<rootDir>/test"],

  // Coverage settings - Enhanced coverage reporting
  collectCoverage: false, // Enable selectively via CLI or environment
  collectCoverageFrom: [
    // Main source files
    "*.js",
    "lib/**/*.js",
    "development/essentials/*.js",
    "scripts/**/*.js",
    // Exclude test files, node_modules, and build artifacts
    "!test/**",
    "!coverage/**",
    "!node_modules/**",
    "!.node-modules-backup/**",
    "!jest.config.js",
    "!eslint.config.js",
    "!babel.config.js",
    "!development/performance-analysis/**",
    "!development/reports/**",
    "!development/docs/**",
    "!development/temp-scripts/**",
    "!development/backups/**",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/build/**",
    "!**/*.config.js",
    "!**/*.min.js"
  ],

  // Coverage providers and processors
  coverageProvider: "v8", // Faster and more accurate than babel

  // Enhanced coverage path ignoring
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/coverage/",
    "/test/",
    "/backups/",
    "/temp/",
    "/.cache/",
    "jest.config.js",
    "babel.config.js",
    "eslint.config.js"
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

  // Mock and test isolation settings
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,
  resetModules: false,

  // Test execution settings
  verbose: true,
  detectOpenHandles: false,
  forceExit: true,
  maxWorkers: "50%", // Use half of available CPU cores

  // Error handling
  errorOnDeprecated: true,
  bail: false, // Continue running tests after failures

  // Performance and optimization
  cache: true,
  cacheDirectory: "<rootDir>/.jest-cache",

  // Test result processing
  passWithNoTests: true,

  // Watch mode configuration
  watchPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/coverage/",
    "<rootDir>/backups/",
    "<rootDir>/.cache/"
  ],

  // Global test configuration
  globals: {
    "TEST_ENV": "jest",
    "NODE_ENV": "test"
  },

  // Test result processors and notifications
  notify: false,
  notifyMode: "failure-change",

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
