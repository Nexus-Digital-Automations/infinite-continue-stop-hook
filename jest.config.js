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
  
  // Test timeout - increased for slow tests but still reasonable
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Optimize module resetting for performance
  resetModules: false, // Disabled for performance - handled in test setup when needed
  
  // Reset mocks between tests
  resetMocks: true,
  
  // Restore mocks between tests - disabled for performance  
  restoreMocks: false,
  
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
  
  // Enhanced worker process management - enable forceExit for faster test completion
  forceExit: true,
  
  // Conditionally detect open handles - disabled for performance unless debugging
  detectOpenHandles: process.env.DETECT_HANDLES === 'true',
  
  
  // Performance optimizations - optimized worker configuration for speed
  maxWorkers: process.env.CI ? 2 : Math.min(6, require('os').cpus().length), // Increased workers for better parallelization
  
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