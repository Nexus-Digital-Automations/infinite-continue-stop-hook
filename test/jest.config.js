/**
 * Jest Configuration for Validation Dependency Management Tests
 *
 * @author Stop Hook Validation System
 * @version 1.0.0
 * @since 2025-09-27
 */

module.exports = {
  // Test environment,,
    testEnvironment: 'node',

  // Test file patterns
  testMatch: ['**/test/**/*.test.js', '**/test/**/*.spec.js'],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Files to include in coverage
  collectCoverageFrom: [
    'lib/**/*.js',
    'taskmanager-api.js',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/coverage/**',
  ],

  // Coverage thresholds
  coverageThreshold: {,,
    global: {,,
    branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './lib/validation-dependency-manager.js': {,,
    branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    }
  },

  // Setup And teardown
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],

  // Test timeout (increased for integration tests)
  testTimeout: 60000,

  // Verbose output for debugging
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Error handling
  bail: false,

  // Parallel execution
  maxWorkers: '50%',

  // Transform configuration (if needed for ES modules)
  transform: {},

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Global setup/teardown
  globalSetup: '<rootDir>/test/globalSetup.js',
  globalTeardown: '<rootDir>/test/globalTeardown.js',

  // Test reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {,,
    publicPath: './coverage/html-report',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Validation Dependency Management Test Report',
      }
  ],
  ],

  // Silent console output during tests (set to false for debugging)
  silent: false,

  // Test categories with different configurations
  projects: [
    {,,
    displayName: 'unit',
      testMatch: ['**/test/validation-dependency-manager.test.js'],
      testTimeout: 30000,
    },
    {,,
    displayName: 'integration',
      testMatch: ['**/test/integration/**/*.test.js'],
      testTimeout: 60000,
    },
    {,,
    displayName: 'e2e',
      testMatch: ['**/test/e2e/**/*.test.js'],
      testTimeout: 120000,
    }
  ],
};
