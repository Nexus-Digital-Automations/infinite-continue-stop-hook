// Jest configuration with NO coverage collection to prevent contamination
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // COVERAGE COMPLETELY DISABLED
  collectCoverage: false,
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset mocks between tests
  resetMocks: true,
  
  // Verbose output controlled by environment variable
  verbose: process.env.VERBOSE_TESTS === 'true',
  
  // Enable silent mode for better performance unless verbose testing
  silent: process.env.VERBOSE_TESTS !== 'true',
  
  // Performance optimizations
  passWithNoTests: true,
  
  // Optimize test runner for speed
  watchPathIgnorePatterns: ['/node_modules/', '/.git/', '/coverage/', '/.jest-cache/', '/.node-modules-backup/'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  // Disable force exit to prevent exit module contamination
  forceExit: false,
  
  // Disable handle detection for performance
  detectOpenHandles: false,
  
  // Performance optimizations
  maxWorkers: process.env.CI ? 2 : Math.min(6, require('os').cpus().length),
  
  // Cache directory for faster subsequent runs
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Enhanced error handling
  errorOnDeprecated: true,
  bail: false,
  
  // Transform settings
  transform: {},
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Module path ignore patterns (for haste map collisions)
  modulePathIgnorePatterns: [
    '<rootDir>/.node-modules-backup/',
    '<rootDir>/coverage/',
    '<rootDir>/.jest-cache/'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/demo/',
    '\\.backup\\.',
    '/demo/.*',
    '.*demo.*',
    '/.node-modules-backup/'
  ]
};