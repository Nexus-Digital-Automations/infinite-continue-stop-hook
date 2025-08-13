// Minimal Jest configuration for testing without setup dependencies
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverage: false,
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  verbose: true,
  passWithNoTests: true,
  forceExit: false,
  detectOpenHandles: false,
  maxWorkers: 1,
  transform: {},
  moduleFileExtensions: ['js', 'json'],
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