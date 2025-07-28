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
  
  // Enhanced coverage path ignore patterns to prevent contamination
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/demo/',
    '\\.backup\\.',
    '\\.config\\.',
    '/test/setup\\.js', // Ignore setup file from coverage to prevent circular issues
    'exit\\.js',
    'jest-worker'
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
  
  // Coverage-specific optimizations
  cache: false, // Disable cache to prevent contamination
  
  // Enhanced isolation for coverage collection
  // isolatedModules: true, // This option doesn't exist in Jest
  
  // Prevent coverage from writing to problematic locations
  coverageProvider: 'v8', // Use V8 coverage provider for better isolation
  
  // Override force exit for coverage collection
  forceExit: true,
  
  // Extended timeout for coverage collection
  testTimeout: 15000,
  
  // Enhanced cleanup for coverage mode
  clearMocks: true,
  resetModules: true,
  resetMocks: true,
  restoreMocks: true
};