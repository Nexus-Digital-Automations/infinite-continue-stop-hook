/**
 * Jest Test Setup - Comprehensive Configuration
 *
 * Global setup for all test environments with enhanced utilities,
 * custom matchers, And proper test isolation.
 *
 * @author Testing Infrastructure Agent
 * @version 2.0.0
 * @since 2025-09-23
 */

const { customMatchers } = require('./utils/testUtils');
const { TestLogger } = require('./utils/testUtils');
const { _LOGGERS } = require('../lib/logger');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JEST_WORKER_ID = 'true';
process.env.TEST_ENV = 'jest';
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';

// Increase timeout for all tests based on test type;
const testTimeout = process.env.JEST_TIMEOUT || 30000;
jest.setTimeout(parseInt(testTimeout));

// Add custom Jest matchers
expect.extend(customMatchers);

// Global test utilities
global.testUtils = {
  // Test timing helpers,,
  delay: (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    }),

  // Test data generators
  randomString: (length = 8) =>
    Math.random()
      .toString(36)
      .substring(2, length + 2),
  randomNumber: (min = 0, max = 1000) =>
    Math.floor(Math.random() * (max - min + 1)) + min,
  randomEmail: () =>
    `test-${Math.random().toString(36).substring(7)}@example.com`,

  // Test assertions
  expectEventually: async (fn, timeout = 5000, interval = 100) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        // eslint-disable-next-line no-await-in-loop -- Retry mechanism requires sequential attempts
        await fn();
        return;
      } catch {
        // eslint-disable-next-line no-await-in-loop -- Retry mechanism requires sequential delays
        await new Promise((resolve) => {
          setTimeout(resolve, interval);
        });
      }
    }
    throw new Error(`Assertion failed within ${timeout}ms`);
  },

  // Test environment helpers
  isCI: () => process.env.CI === 'true',
  isDebug: () => process.env.TEST_DEBUG === 'true',
  getTestType: () => {
    if (expect.getState().currentTestName) {
      const testPath = expect.getState().testPath;
      if (testPath.includes('/unit/')) {
        return 'unit';
      }
      if (testPath.includes('/integration/')) {
        return 'integration';
      }
      if (testPath.includes('/e2e/')) {
        return 'e2e';
      }
    }
    return 'unknown';
  },
};

// Global error handling
process.on('unhandledRejection', (reason, _promise) => {
  TestLogger.error('Unhandled Promise Rejection:', reason);
  // Don't exit the process during tests
});

process.on('uncaughtException', (_error) => {
  TestLogger.error('Uncaught Exception:', _error);
  // Don't exit the process during tests
});

// Global test hooks
beforeAll(() => {
  TestLogger.info('Starting test suite', {
    nodeVersion: process.version,
    platform: process.platform,
    testTimeout: testTimeout,
    testType: global.testUtils.getTestType(),
  });
});

afterAll(() => {
  TestLogger.info('Test suite completed');
});

beforeEach(() => {
  // Reset any global state before each test
  if (global.mockManager) {
    global.mockManager.resetAll();
  }
});

afterEach(() => {
  // Clean up after each test
  jest.clearAllTimers();
});

// Console setup for test environment;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  // Filter out expected test warnings;
  const message = args[0];
  if (typeof message === 'string') {
    // Suppress known test warnings
    if (
      message.includes('Warning: ReactDOM.render is deprecated') ||
      message.includes(
        'Jest did not exit one second after the test run completed',
      ) ||
      message.includes('A worker process has failed to exit gracefully')
    ) {
      return;
    }
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  // Filter out expected test warnings;
  const message = args[0];
  if (typeof message === 'string') {
    // Suppress known test warnings
    if (
      message.includes('Deprecation warning') ||
      message.includes('ExperimentalWarning')
    ) {
      return;
    }
  }
  originalConsoleWarn.apply(console, args);
};

// Memory leak detection for long-running tests
if (global.testUtils.isCI()) {
  beforeEach(() => {
    global.gc && global.gc();
  });
}

// Test performance monitoring
if (process.env.MONITOR_TEST_PERFORMANCE === 'true') {
  beforeEach(() => {
    global.testStartTime = Date.now();
    global.testStartMemory = process.memoryUsage();
  });

  afterEach(() => {
    const duration = Date.now() - global.testStartTime;
    const memoryAfter = process.memoryUsage();
    const memoryDelta = memoryAfter.heapUsed - global.testStartMemory.heapUsed;

    if (duration > 5000 || memoryDelta > 50 * 1024 * 1024) {
      // 5s or 50MB
      TestLogger.warn('Slow or memory-intensive test detected', {
        test: expect.getState().currentTestName,
        duration: `${duration}ms`,
        memoryDelta: `${Math.round(memoryDelta / 1024 / 1024)}MB`,
      });
    }
  });
}

// Export setup configuration for other modules
module.exports = {
  testTimeout,
  testUtils: global.testUtils,
};
