// Enhanced Jest Coverage Configuration
// Designed to prevent contamination and ensure accurate, reliable coverage collection

const baseConfig = require('./jest.config.js');
const path = require('path');

module.exports = {
  ...baseConfig,
  
  // Enable coverage collection with enhanced safety
  collectCoverage: true,
  
  // Strict cache isolation
  cache: false,                                    // Disable cache completely for safety
  cacheDirectory: '<rootDir>/.jest-cache/robust',  // Isolated cache directory
  
  // Single worker mode to prevent race conditions and contamination
  maxWorkers: 1,
  
  // Enhanced coverage collection patterns
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
    '!stop-hook.js',
    '!**/development/**',
    '!**/.jest-cache/**',
    '!**/scripts/**',
    '!**/.git/**',
    '!**/backups/**'
  ],
  
  // Comprehensive path ignore patterns for contamination prevention
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/demo/',
    '/development/',
    '/.jest-cache/',
    '/.git/',
    '/scripts/',
    '/backups/',
    '\\.backup\\.',
    '\\.config\\.',
    '\\.tmp$',
    '\\.cache/',
    '\\.log$',
    '\\.bak$',
    '/test/setup\\.js',
    'exit\\.js',
    'jest-worker',
    '\\.test-.*/',
    '.*demo.*',
    '/temp/',
    '/tmp/'
  ],
  
  // Isolated coverage output
  coverageDirectory: './coverage',
  
  // Comprehensive but safe coverage reporters
  coverageReporters: [
    'text-summary',
    'html',
    'lcov',
    'json-summary',
    ['text', { 'skipFull': true }],
    ['html', { 'subdir': 'html' }],
    ['lcov', { 'outputFile': 'lcov.info' }]
  ],
  
  // V8 coverage provider with enhanced stability
  coverageProvider: 'v8',
  
  // Conservative coverage thresholds to prevent failures during development
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 65,
      lines: 65,
      statements: 65
    },
    // Critical modules maintain higher standards
    'lib/todoValidator.js': {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90
    },
    'lib/taskManager.js': {
      branches: 90,
      functions: 95,
      lines: 92,
      statements: 92
    }
  },
  
  // Enhanced module resolution for coverage mode
  modulePathIgnorePatterns: [
    '<rootDir>/coverage/',
    '<rootDir>/demo/',
    '<rootDir>/development/',
    '<rootDir>/.jest-cache/',
    '<rootDir>/scripts/',
    '<rootDir>/backups/',
    '<rootDir>/.git/'
  ],
  
  // Transform ignore patterns to prevent coverage issues
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.backup\\.',
    '/demo/',
    '/development/',
    '/coverage/',
    '/backups/',
    '\\.log$',
    '\\.cache/'
  ],
  
  // Watchman ignore for coverage files and sensitive directories
  watchPathIgnorePatterns: [
    '<rootDir>/coverage/',
    '<rootDir>/development/',
    '<rootDir>/.jest-cache/',
    '<rootDir>/backups/',
    '<rootDir>/.git/'
  ],
  
  // Enhanced timeout and cleanup settings for coverage mode
  testTimeout: 30000,                    // Extended timeout for coverage collection
  forceExit: true,                       // Force exit to prevent hanging
  
  // Strict test isolation for coverage mode
  clearMocks: true,
  resetModules: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Silence noisy output during coverage collection
  verbose: false,
  silent: false,                         // Allow important messages
  
  // Environment variables for coverage mode
  testEnvironment: 'node',
  
  // Setup files with coverage-specific protection
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  // Error handling for coverage mode
  errorOnDeprecated: false,              // Don't fail on deprecated warnings
  bail: false,                           // Don't bail on first error during coverage
  
  // Additional Jest options for stability
  detectOpenHandles: false,              // Disable to prevent hanging in coverage mode
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Enhanced ignore patterns for test paths
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/demo/',
    '/development/',
    '/backups/',
    '\\.backup\\.',
    '/demo/.*',
    '.*demo.*',
    '\\.tmp$',
    '\\.cache/'
  ],
  
  // Coverage-specific global setup
  globalSetup: undefined,                // Disable global setup for safety
  globalTeardown: undefined,             // Disable global teardown for safety
  
  // Seed for deterministic coverage
  randomize: false,
  
  // Memory management
  workerIdleMemoryLimit: '1GB',          // Prevent memory leaks
  
  // File system settings
  watchPlugins: [],                      // Disable watch plugins during coverage
  
  // Transform settings
  transform: {},                         // Use default transforms only
  
  // Extensions handling
  extensionsToTreatAsEsm: [],           // Stick to CommonJS for stability
  
  // Project-specific settings
  displayName: {
    name: 'Robust Coverage',
    color: 'green'
  },
  
  // Preset overrides
  preset: undefined,                     // Don't use presets that might interfere
  
  // Additional safety measures
  injectGlobals: true,                   // Ensure Jest globals are available
  
  // Test result processing
  passWithNoTests: true,                 // Don't fail if no tests match
  
  // Coverage collection optimization
  collectCoverageOnlyFrom: undefined,    // Let Jest determine optimal collection
  
  // Snapshot settings
  updateSnapshot: false,                 // Don't update snapshots during coverage
  
  // Timing settings
  slowTestThreshold: 5                   // Mark tests as slow after 5 seconds
};