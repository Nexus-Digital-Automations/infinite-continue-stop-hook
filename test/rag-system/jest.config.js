/**
 * Jest Configuration for RAG System Testing
 *
 * === OVERVIEW ===
 * Comprehensive testing configuration for the RAG (Retrieval-Augmented Generation)
 * system with specialized settings for different test types including unit tests,
 * integration tests, performance benchmarks, And data integrity validation.
 *
 * === TEST CATEGORIES ===
 * • Unit Tests: Individual component testing with mocks
 * • Integration Tests: End-to-end RAG system functionality
 * • Performance Tests: Benchmarking And optimization validation
 * • Data Integrity Tests: Vector database consistency And accuracy
 *
 * @author RAG Implementation Agent
 * @version 1.0.0
 * @since 2025-09-19
 */

module.exports = {
  // Test environment configuration
  testEnvironment: 'node',
  rootDir: '../../',
  testMatch: [
    '<rootDir>/test/rag-system/**/*.test.js',
    '<rootDir>/test/rag-system/**/*.spec.js',
  ],

  // Module path mapping
  moduleNameMapper: {
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@rag/(.*)$': '<rootDir>/lib/rag/$1',
    '^@test-utils/(.*)$': '<rootDir>/test/rag-system/utils/$1',
  },

  // Setup And teardown - removed to fix path resolution issues

  // Test timeout for ML operations
  testTimeout: 60000, // 60 seconds for embedding generation

  // Coverage configuration
  collectCoverage: false, // Enable via --coverage flag
  coverageDirectory: '<rootDir>/test/rag-system/coverage',
  collectCoverageFrom: [
    'lib/rag/**/*.js',
    'lib/api-modules/rag/**/*.js',
    '!lib/rag/**/*.test.js',
    '!lib/rag/**/*.spec.js',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './lib/rag/': {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Test categorization
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/test/rag-system/unit/**/*.test.js'],
      testEnvironment: 'node',
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/test/rag-system/integration/**/*.test.js'],
      testEnvironment: 'node',
      testTimeout: 120000, // 2 minutes for integration tests
    },
    {
      displayName: 'Performance Tests',
      testMatch: ['<rootDir>/test/rag-system/performance/**/*.test.js'],
      testEnvironment: 'node',
      testTimeout: 300000, // 5 minutes for performance tests
      maxWorkers: 1, // Run performance tests sequentially
    },
    {
      displayName: 'Data Integrity Tests',
      testMatch: ['<rootDir>/test/rag-system/data-integrity/**/*.test.js'],
      testEnvironment: 'node',
      testTimeout: 180000, // 3 minutes for data integrity tests
    },
  ],

  // Reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './test/rag-system/reports',
        filename: 'rag-test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'RAG System Test Report',
      },
    ],
    [
      'jest-junit',
      {
        outputDirectory: './test/rag-system/reports',
        outputName: 'rag-test-results.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],

  // Performance And resource management
  maxWorkers: '50%',
  cache: true,
  cacheDirectory: '<rootDir>/test/rag-system/.jest-cache',

  // Transform configuration - using default Jest transformation
  transformIgnorePatterns: [
    'node_modules/(?!(@xenova/transformers|faiss-node)/)',
  ],

  // Test result processing
  verbose: true,
  silent: false,
  errorOnDeprecated: true,

  // Watch mode configuration - removed plugins to prevent dependency issues

  // Custom test environment variables
  testEnvironmentOptions: {
    RAG_TEST_MODE: 'true',
    RAG_EMBEDDING_CACHE_SIZE: '100',
    RAG_TEST_TIMEOUT: '60000',
  },
};
