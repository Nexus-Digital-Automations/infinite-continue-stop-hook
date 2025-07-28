module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage configuration - TEMPORARILY DISABLED due to JSON corruption bug
  collectCoverage: false,
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/**/*.test.js',
    '!lib/**/*.spec.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/demo/**',
    '!**/*.config.js',
    '!**/*.backup.*',
    '!**/test/**',
    '!setup-infinite-hook.js',
    '!stop-hook.js'
  ],
  
  // Explicitly ignore demo directories in all contexts
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/demo/',
    '\\.backup\\.',
    '\\.config\\.'
  ],
  
  // Coverage thresholds for quality assessment
  // Realistic thresholds based on current codebase maturity
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 75,
      statements: 75
    },
    // Specific thresholds for core modules
    'lib/taskManager.js': {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    },
    'lib/todoValidator.js': {
      branches: 75,
      functions: 80,
      lines: 85,
      statements: 85
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset modules between tests for better isolation
  resetModules: true,
  
  // Reset mocks between tests
  resetMocks: true,
  
  // Restore mocks between tests  
  restoreMocks: true,
  
  // Verbose output for better debugging
  verbose: true,
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  // Force exit to prevent hanging tests
  forceExit: true,
  
  // Detect open handles to prevent memory leaks
  detectOpenHandles: true,
  
  // Transform settings
  transform: {},
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/demo/',
    '\\.backup\\.',
    '/demo/.*',
    '.*demo.*'
  ]
};