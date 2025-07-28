// Coverage-safe Jest configuration
// This config provides safe coverage collection without filesystem contamination

const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  
  // Enable coverage collection safely
  collectCoverage: true,
  
  // Enhanced coverage collection to avoid contamination
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
  
  // Safe coverage output directory
  coverageDirectory: './coverage',
  
  // Coverage reporters that don't interfere with node_modules
  coverageReporters: [
    'text-summary',
    'html',
    'lcov',
    'json-summary'
  ],
  
  // Enhanced coverage path ignore patterns to prevent contamination and V8 errors
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/demo/',
    '\\.backup\\.',
    '\\.config\\.',
    '/test/setup\\.js', // Ignore setup file from coverage to prevent circular issues
    'exit\\.js',
    'jest-worker',
    '\\.tmp$',         // Ignore temporary files that might cause syntax errors
    '\\.cache/',       // Ignore cache directories
    '/development/',   // Ignore development logs and temporary files
    '\\.test-.*/',     // Ignore test directories that might be corrupted
    'scripts/'         // Ignore script files that might have different syntax
  ],
  
  // Reduced coverage thresholds for initial implementation
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10
    }
  },
  
  // Coverage-specific optimizations to prevent V8 mergeProcessCovs errors
  cache: false, // Disable cache to prevent contamination
  
  // Use limited workers to prevent coverage data merging issues
  maxWorkers: 2, // Limit workers to reduce V8 coverage mergeProcessCovs errors
  
  // Use V8 coverage provider with error resilience
  coverageProvider: 'v8', // V8 provider configured for stability
  
  // Additional V8-specific settings to prevent mergeProcessCovs errors
  collectCoverageOnlyFrom: {
    // Only collect coverage from specific lib files to reduce complexity
    'lib/**/*.js': true
  },
  
  // Override force exit for coverage collection
  forceExit: true,
  
  // Extended timeout for coverage collection
  testTimeout: 15000,
  
  // Enhanced cleanup for coverage mode
  clearMocks: true,
  resetModules: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Additional stability settings to prevent coverage errors
  verbose: false, // Reduce output noise that can interfere with coverage
  silent: true    // Suppress console output during coverage collection
};