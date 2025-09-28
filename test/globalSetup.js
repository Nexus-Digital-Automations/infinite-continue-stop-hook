/**
 * Jest Global Setup
 *
 * Global setup configuration that runs once before all tests.
 * Handles environment preparation, mock initialization, and test data setup.
 *
 * @author Testing Infrastructure Agent
 * @version 1.0.0
 * @since 2025-09-23
 */

const path = require('path');
const fs = require('fs');

/**
 * Global setup function - runs once before all tests
 */
module.exports = () => {
  console.log('🚀 Initializing Jest testing environment...');

  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'jest';
  process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';

  // Create test directories if they don't exist
  const testDirs = [
    'test/temp',
    'test/temp/projects',
    'test/temp/data',
    'coverage',
    '.jest-cache',
  ];

  testDirs.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test directory path validated from trusted test configuration
    if (!fs.existsSync(fullPath)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test directory path validated from trusted test configuration
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created test directory: ${dir}`);
    }
  });

  // Clean up any leftover test files from previous runs
  const tempDir = path.join(process.cwd(), 'test/temp');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Temp directory path validated from trusted test configuration
  if (fs.existsSync(tempDir)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Temp directory path validated from trusted test configuration
    const entries = fs.readdirSync(tempDir);
    for (const entry of entries) {
      const entryPath = path.join(tempDir, entry);
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Entry path constructed from validated temp directory
      const stat = fs.statSync(entryPath);

      // Remove files/directories older than 1 hour
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      if (stat.mtime.getTime() < oneHourAgo) {
        try {
          if (stat.isDirectory()) {
            fs.rmSync(entryPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(entryPath);
          }
          console.log(`🧹 Cleaned up old test file: ${entry}`);
        } catch (error) {
          console.warn(`⚠️  Could not clean up ${entry}:`, error.message);
        }
      }
    }
  }

  // Set up global test constants
  global.TEST_CONSTANTS = {
    PROJECT_ROOT: process.cwd(),
    TEST_ROOT: path.join(process.cwd(), 'test'),
    TEMP_DIR: path.join(process.cwd(), 'test/temp'),
    FIXTURES_DIR: path.join(process.cwd(), 'test/fixtures'),
    TIMEOUT: {
      UNIT: 5000,
      INTEGRATION: 15000,
      E2E: 30000,
      PERFORMANCE: 60000,
    },
  };

  // Performance monitoring setup
  if (process.env.MONITOR_TEST_PERFORMANCE === 'true') {
    console.log('📊 Performance monitoring enabled');
    global.testPerformanceData = {
      suites: [],
      slowTests: [],
      memoryUsage: [],
    };
  }

  // Memory management for CI environments
  if (process.env.CI === 'true') {
    console.log('🏗️  CI environment detected - enabling memory optimizations');

    // Lower memory thresholds for CI
    if (global.gc) {
      setInterval(() => {
        global.gc();
      }, 30000); // Run garbage collection every 30 seconds
    }

    // Set memory limits
    process.env.NODE_OPTIONS =
      (process.env.NODE_OPTIONS || '') + ' --max-old-space-size=2048';
  }

  // Test reporting setup
  console.log('📋 Test reporting configuration:');
  console.log(
    `   • Coverage: ${process.env.COVERAGE ? 'enabled' : 'disabled'}`
  );
  console.log(`   • Verbose: ${process.env.VERBOSE ? 'enabled' : 'disabled'}`);
  console.log(`   • Watch mode: ${process.env.WATCH ? 'enabled' : 'disabled'}`);
  console.log(`   • Max workers: ${process.env.MAX_WORKERS || 'auto'}`);

  // Network and external service mocking
  if (process.env.MOCK_EXTERNAL_SERVICES !== 'false') {
    console.log('🔧 External service mocking enabled');

    // Mock common external services
    process.env.DISABLE_EXTERNAL_REQUESTS = 'true';
    process.env.MOCK_API_RESPONSES = 'true';
  }

  // Test data initialization
  try {
    const sampleData = require('./fixtures/sampleData');
    console.log('✅ Test fixtures loaded successfully');

    // Validate sample data structure
    if (!sampleData.SAMPLE_FEATURES || !sampleData.SAMPLE_AGENTS) {
      throw new Error('Sample data structure is invalid');
    }

    global.SAMPLE_DATA = sampleData;
  } catch (error) {
    console.error('❌ Failed to load test fixtures:', error.message);
    throw new Error('Failed to load test fixtures');
  }

  // Database setup for integration tests
  if (process.env.TEST_DATABASE === 'true') {
    console.log('🗄️  Test database setup...');
    // This would initialize test database connections
    // For now, we'll just set up the environment
    process.env.DATABASE_URL =
      process.env.TEST_DATABASE_URL || 'sqlite::memory:';
  }

  // Feature flag setup for different test environments
  global.FEATURE_FLAGS = {
    ENABLE_MOCKS: process.env.ENABLE_MOCKS !== 'false',
    ENABLE_LOGGING: process.env.TEST_DEBUG === 'true',
    ENABLE_PERFORMANCE_MONITORING:
      process.env.MONITOR_TEST_PERFORMANCE === 'true',
    ENABLE_COVERAGE: process.env.COVERAGE === 'true',
    STRICT_MODE: process.env.STRICT_TEST_MODE === 'true',
  };

  // Test utilities global registration
  global.testUtils = {
    // These will be enhanced in setup.js
    createTempFile: (name, content) => {
      const filePath = path.join(global.TEST_CONSTANTS.TEMP_DIR, name);
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- File path constructed from validated temp directory
      fs.writeFileSync(filePath, content);
      return filePath;
    },

    createTempDir: (name) => {
      const dirPath = path.join(global.TEST_CONSTANTS.TEMP_DIR, name);
      fs.mkdirSync(dirPath, { recursive: true });
      return dirPath;
    },

    cleanupTemp: () => {
      const tempDir = global.TEST_CONSTANTS.TEMP_DIR;
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        fs.mkdirSync(tempDir, { recursive: true });
      }
    },
  };

  console.log('✅ Jest global setup completed successfully');
  console.log('📝 Test environment ready');
  console.log('');
};
