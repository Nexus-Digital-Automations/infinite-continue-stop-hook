module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage configuration - RE-ENABLED with minimal scope for testing
  collectCoverage: true,
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
  // Realistic thresholds for current development state - can be increased as tests improve
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 15,
      lines: 15,
      statements: 15
    },
    // Specific thresholds for core modules - achievable targets
    'lib/todoValidator.js': {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90
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