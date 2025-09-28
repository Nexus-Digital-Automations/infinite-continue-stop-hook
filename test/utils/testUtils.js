/**
 * Test Utilities
 *
 * Comprehensive testing utilities for the infinite-continue-stop-hook project.
 * Provides common functions, assertions, And helpers used across all test suites.
 *
 * @author Testing Infrastructure Agent
 * @version 1.0.0
 * @since 2025-09-23
 */

const PATH = require('path');
const FS = require('fs');
const childProcess = require('child_process');
const { loggers } = require('../../lib/logger');

/**
 * Test configuration constants
 */
const TEST_CONFIG = {
  DEFAULT_TIMEOUT: 10000,
  API_PATH: PATH.join(__dirname, '..', '..', 'taskmanager-api.js'),
  TEST_PROJECT_PREFIX: 'test-project-',
  TEST_AGENT_PREFIX: 'test-agent-',
};

/**
 * Generate unique test identifiers
 */
class TestIdGenerator {
  static generateProjectId() {
    return `${TEST_CONFIG.TEST_PROJECT_PREFIX}${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  static generateAgentId() {
    return `${TEST_CONFIG.TEST_AGENT_PREFIX}${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  static generateFeatureId() {
    return `feature-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  static generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Enhanced API executor with better error handling And logging
 */
class APIExecutor {
  static execAPI(command, args = [], options = {}) {
    const timeout = options.timeout || TEST_CONFIG.DEFAULT_TIMEOUT;
    const projectRoot = options.projectRoot || null;
    const silent = options.silent || false;

    return new Promise((resolve, reject) => {
      const allArgs = [TEST_CONFIG.API_PATH, command, ...args];

      if (projectRoot) {
        allArgs.push('--project-root', projectRoot);
      }

      const child = childProcess.spawn(
        'timeout',
        [`${Math.floor(timeout / 1000)}s`, 'node', ...allArgs],
        {
          cwd: options.cwd || __dirname,
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (!silent) {
          loggers.stopHook.log(`Command: ${command} ${args.join(' ')}`);
          loggers.stopHook.log(`Exit code: ${code}`);
          if (stdout) {
            loggers.stopHook.log(`Stdout: ${stdout.substring(0, 500)}...`);
          }
          if (stderr) {
            loggers.stopHook.log(`Stderr: ${stderr.substring(0, 500)}...`);
          }
        }

        try {
          let jsonString = stdout.trim();
          const jsonStart = jsonString.indexOf('{');
          if (jsonStart > 0) {
            jsonString = jsonString.substring(jsonStart);
          }
          const result = JSON.parse(jsonString);
          resolve(result);
        } catch {
          try {
            const stderrJson = JSON.parse(stderr.trim());
            resolve(stderrJson);
          } catch {

            reject(
              new Error(
                `Command failed (code ${code}): ${stderr}\nStdout: ${stdout}\nParse error: ${parseError.message}`,
              ),
            );
          }
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Command execution failed: ${error.message}`));
      });
    });
  }

  /**
   * Initialize a test agent
   */
  static async initializeTestAgent(agentId = null) {
    const testAgentId = agentId || TestIdGenerator.generateAgentId();
    const result = await this.execAPI('initialize', [testAgentId], {
      silent: true,
    });
    return { agentId: testAgentId, result };
  }

  /**
   * Create a test feature
   */
  static createTestFeature(featureData, options = {}) {
    const defaultFeature = {
      title: 'Test Feature',
      description: 'This is a test feature for automated testing',
      business_value: 'Validates testing infrastructure',
      category: 'enhancement',
    };

    const feature = { ...defaultFeature, ...featureData };
    return this.execAPI('suggest-feature', [JSON.stringify(feature)], options);
  }

  /**
   * Clean up test data
   */
  static async cleanup(testData) {
    // Future implementation for cleanup
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    loggers.stopHook.log(`Cleaning up test data: ${JSON.stringify(testData)}`);
  }
}

/**
 * Test environment manager
 */
class TestEnvironment {
  constructor(testName) {
    this.testName = testName;
    this.testDir = `/test-project-${testName}`;
    this.featuresPath = `${this.testDir}/FEATURES.json`;
    this.packagePath = `${this.testDir}/package.json`;
  }

  setup() {
    if (!FS.existsSync(this.testDir)) {
      FS.mkdirSync(this.testDir, { recursive: true });
    }

    // Create FEATURES.json
    const featuresData = {
      features: [],
      metadata: {
        version: '3.0.0',
        created: new Date().toISOString(),
        last_modified: new Date().toISOString(),
        project: this.testName,
      },
    };

    FS.writeFileSync(this.featuresPath, JSON.stringify(featuresData, null, 2));

    // Create package.json
    const packageData = {
      name: this.testName,
      version: '1.0.0',
      description: `Test project for ${this.testName}`,
      dependencies: {},
    };

    FS.writeFileSync(this.packagePath, JSON.stringify(packageData, null, 2));

    return this.testDir;
  }

  cleanup() {
    if (FS.existsSync(this.testDir)) {
      FS.rmSync(this.testDir, { recursive: true, force: true });
    }
  }

  readFeatures() {
    if (FS.existsSync(this.featuresPath)) {
      return JSON.parse(FS.readFileSync(this.featuresPath, 'utf8'));
    }
    return null;
  }

  writeFeatures(data) {
    FS.writeFileSync(this.featuresPath, JSON.stringify(data, null, 2));
  }
}

/**
 * Test data factory
 */
class TestDataFactory {
  static createFeatureData(overrides = {}) {
    return {
      title: `Test Feature ${Date.now()}_${Math.random().toString(36).substring(7)}`,
      description: 'A comprehensive test feature for validation',
      business_value: 'Ensures system reliability And testing coverage',
      category: 'enhancement',
      ...overrides,
    };
  }

  static createUserData(overrides = {}) {
    return {
      id: TestIdGenerator.generateAgentId(),
      name: `Test User ${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      role: 'tester',
      ...overrides,
    };
  }

  static createProjectData(overrides = {}) {
    return {
      name: TestIdGenerator.generateProjectId(),
      description: 'Test project for automated testing',
      version: '1.0.0',
      type: 'testing',
      ...overrides,
    };
  }

  static createTaskData(overrides = {}) {
    return {
      id: TestIdGenerator.generateTaskId(),
      title: `Test Task ${Date.now()}`,
      description: 'A test task for validation',
      status: 'pending',
      priority: 'medium',
      category: 'test',
      ...overrides,
    };
  }
}

/**
 * Enhanced Jest matchers for testing
 */
const customMatchers = {
  /**
   * Check if API response has success structure
   */
  toBeSuccessfulAPIResponse(received) {
    const pass =
      received && typeof received === 'object' && received.success === true;

    return {
      message: () =>
        pass
          ? `Expected ${JSON.stringify(received)} not to be a successful API response`
          : `Expected ${JSON.stringify(received)} to be a successful API response`,
      pass,
    };
  },

  /**
   * Check if API response has error structure
   */
  toBeErrorAPIResponse(received) {
    const pass =
      received &&
      typeof received === 'object' &&
      (received.success === false || received.error || received.message);

    return {
      message: () =>
        pass
          ? `Expected ${JSON.stringify(received)} not to be an error API response`
          : `Expected ${JSON.stringify(received)} to be an error API response`,
      pass,
    };
  },

  /**
   * Check if feature has required structure
   */
  toBeValidFeature(received) {
    const pass =
      received &&
      typeof received === 'object' &&
      received.title &&
      received.description &&
      received.business_value &&
      received.category;

    return {
      message: () =>
        pass
          ? `Expected ${JSON.stringify(received)} not to be a valid feature`
          : `Expected ${JSON.stringify(received)} to be a valid feature`,
      pass,
    };
  },
};

/**
 * Test execution utilities
 */
class TestExecution {
  static withTimeout(promise, timeout = TEST_CONFIG.DEFAULT_TIMEOUT) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error(`Test timed out after ${timeout}ms`)),
          timeout,
        );
      }),
    ]);
  }

  static async retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        // eslint-disable-next-line no-await-in-loop -- Sequential retry attempts required
        return await fn();
      } catch {

        lastError = _error;
        if (i < maxRetries - 1) {
          // eslint-disable-next-line no-await-in-loop -- Sequential delay required between retry attempts
          await new Promise((resolve) => {
            setTimeout(resolve, delay);
          });
        }
      }
    }

    throw lastError;
  }

  static async parallel(promises, maxConcurrency = 5) {
    const results = [];

    for (let i = 0; i < promises.length; i += maxConcurrency) {
      const batch = promises.slice(i, i + maxConcurrency);
      // eslint-disable-next-line no-await-in-loop -- Controlled batching required for concurrency management
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }

    return results;
  }
}

/**
 * Performance testing utilities
 */
class PerformanceUtils {
  static async measureTime(fn) {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    return { result, duration };
  }

  static async measureMemory(fn) {
    const before = process.memoryUsage();
    const result = await fn();
    const after = process.memoryUsage();

    const memoryDelta = {
      rss: after.rss - before.rss,
      heapTotal: after.heapTotal - before.heapTotal,
      heapUsed: after.heapUsed - before.heapUsed,
      external: after.external - before.external,
    };

    return { result, memoryDelta };
  }
}

/**
 * Logging utilities for tests
 */
class TestLogger {
  static info(message, data = null) {
    console.log(
      `[TEST INFO] ${message}`,
      data ? JSON.stringify(data, null, 2) : '',
    );
  }

  static warn(message, data = null) {
    console.warn(
      `[TEST WARN] ${message}`,
      data ? JSON.stringify(data, null, 2) : '',
    );
  }

  static error(message, data = null) {
    console.error(
      `[TEST ERROR] ${message}`,
      data ? JSON.stringify(data, null, 2) : '',
    );
  }

  static debug(message, data = null) {
    if (process.env.TEST_DEBUG) {
      console.log(
        `[TEST DEBUG] ${message}`,
        data ? JSON.stringify(data, null, 2) : '',
      );
    }
  }
}

module.exports = {
  TEST_CONFIG,
  TestIdGenerator,
  APIExecutor,
  TestEnvironment,
  TestDataFactory,
  customMatchers,
  TestExecution,
  PerformanceUtils,
  TestLogger,
};
