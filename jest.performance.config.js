// Performance-optimized Jest configuration for fast test execution
// Based on jest.config.js but with aggressive performance optimizations

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage completely disabled for maximum speed
  collectCoverage: false,
  
  // Performance-optimized timeout
  testTimeout: 15000,
  
  // Minimal mock configuration for speed
  clearMocks: true,
  resetModules: false, // Disabled for performance
  resetMocks: false,   // Disabled for performance
  restoreMocks: false, // Disabled for performance
  
  // Silent mode for clean output and better performance
  verbose: false,
  silent: true,
  
  // Performance optimizations
  passWithNoTests: true,
  
  // Maximum parallelization for speed
  maxWorkers: '100%', // Use all available CPU cores
  
  // Aggressive caching
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Minimize worker overhead
  forceExit: true,
  detectOpenHandles: false,
  
  // Optimized error handling
  errorOnDeprecated: false,
  bail: false, // Don't stop on first failure for parallel efficiency
  
  // Minimal transform configuration
  transform: {},
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Optimized ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/demo/',
    '\\.backup\\.',
    '/demo/.*',
    '.*demo.*'
  ],
  
  // Watch optimizations
  watchPathIgnorePatterns: ['/node_modules/', '/.git/', '/coverage/', '/.jest-cache/'],
  
  // Setup files - keep minimal setup for essential protection
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  // Environment variables for performance mode
  globals: {
    'process.env': {
      NODE_ENV: 'test',
      PERFORMANCE_MODE: 'true',
      ENABLE_REALTIME_WATCH: 'false',
      ENABLE_DEEP_ANALYSIS: 'false',
      ENABLE_PROACTIVE_SCAN: 'false',
      DETECT_HANDLES: 'false'
    }
  }
};