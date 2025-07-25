module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'lib/**/*.js',
    'setup-infinite-hook.js',
    'stop-hook.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/demo/**',
    '!**/*.config.js',
    '!**/*.backup.*'
  ],
  
  // Coverage thresholds for quality assessment
  // Set to 0 for initial setup - can be increased later
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
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
  
  // Verbose output for better debugging
  verbose: true,
  
  // Setup files
  setupFilesAfterEnv: [],
  
  // Transform settings
  transform: {},
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '\\.backup\\.'
  ]
};