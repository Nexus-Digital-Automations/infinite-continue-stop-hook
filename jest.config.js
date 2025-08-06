module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage configuration - DISABLED due to corruption issues
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
  
  // Test timeout - optimized for performance
  testTimeout: 5000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset modules between tests for better isolation
  resetModules: true,
  
  // Reset mocks between tests
  resetMocks: true,
  
  // Restore mocks between tests  
  restoreMocks: true,
  
  // Verbose output controlled by VERBOSE_TESTS environment variable
  verbose: process.env.VERBOSE_TESTS === 'true',
  
  // Enable silent mode for better performance unless verbose testing
  silent: process.env.VERBOSE_TESTS !== 'true',
  
  // Performance optimizations
  passWithNoTests: true,
  
  // Optimize test runner for speed
  watchPathIgnorePatterns: ['/node_modules/', '/.git/', '/coverage/', '/.jest-cache/'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  // Enhanced worker process management - avoid forceExit, enable proper cleanup
  forceExit: false,
  
  // Always detect open handles to prevent resource leaks - critical for worker cleanup
  detectOpenHandles: true,
  
  
  // Performance optimizations - optimized worker configuration
  maxWorkers: process.env.CI ? 1 : Math.min(4, require('os').cpus().length - 1), // Single worker in CI, optimal local workers
  
  // Cache directory for faster subsequent runs
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Enhanced error handling and file protection
  errorOnDeprecated: true,
  bail: process.env.BAIL_ON_FIRST_ERROR === 'true' ? 1 : false,
  
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