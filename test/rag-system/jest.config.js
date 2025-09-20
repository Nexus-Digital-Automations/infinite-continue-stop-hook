/**
 * Jest Configuration for RAG System Tests
 *
 * Specialized configuration for testing the RAG-based lessons and error
 * database system with appropriate timeouts and test environment setup.
 *
 * @author Testing Agent
 * @version 1.0.0
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/test/rag-system/**/*.test.js'
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test/rag-system/setup/test-setup.js'
  ],

  // Module paths
  moduleFileExtensions: ['js', 'json'],

  // Coverage settings
  collectCoverage: true,
  collectCoverageFrom: [
    'lib/api-modules/rag/**/*.js',
    'lib/rag/**/*.js',
    '!**/node_modules/**',
    '!**/test/**'
  ],
  coverageDirectory: '<rootDir>/test/rag-system/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Test timeout settings
  testTimeout: 30000, // 30 seconds default

  // Performance test timeout
  globals: {
    'performance-test-timeout': 300000 // 5 minutes for performance tests
  },

  // Test categorization
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['**/test/rag-system/unit/**/*.test.js'],
      testTimeout: 10000
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['**/test/rag-system/integration/**/*.test.js'],
      testTimeout: 60000
    },
    {
      displayName: 'Performance Tests',
      testMatch: ['**/test/rag-system/performance/**/*.test.js'],
      testTimeout: 300000,
      maxConcurrency: 1 // Run performance tests sequentially
    },
    {
      displayName: 'Data Integrity Tests',
      testMatch: ['**/test/rag-system/data-integrity/**/*.test.js'],
      testTimeout: 120000
    }
  ],

  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/test/rag-system/reports',
        filename: 'rag-test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'RAG System Test Report'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test/rag-system/reports',
        outputName: 'rag-test-results.xml',
        suiteName: 'RAG System Tests'
      }
    ]
  ],

  // Performance monitoring
  verbose: true,
  detectOpenHandles: true,
  detectLeaks: true,

  // Module name mapping (for when RAG modules are implemented)
  moduleNameMapping: {
    '^@rag/(.*)$': '<rootDir>/lib/api-modules/rag/$1',
    '^@test-utils/(.*)$': '<rootDir>/test/rag-system/utils/$1'
  }
};