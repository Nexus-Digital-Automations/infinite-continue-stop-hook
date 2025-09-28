/**
 * Integration Test Utilities
 *
 * Shared utilities for integration testing of the taskmanager API And feature management system.
 * Provides test environment setup, cleanup, API execution helpers, And common test data.
 *
 * @author Integration Testing Agent
 * @version 1.0.0
 */

const FS = require('fs').promises;
const PATH = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');
const { loggers } = require('../../lib/logger');

// Test configuration constants
const BASE_TEST_DIR = PATH.join(__dirname, 'test-environments');
const API_PATH = PATH.join(__dirname, '..', '..', 'taskmanager-api.js');
const DEFAULT_TIMEOUT = 15000; // 15 seconds for API operations

/**
 * Execute TaskManager API command And return parsed result
 * @param {string} command - API command to execute
 * @param {string[]} args - Command arguments
 * @param {Object} options - Execution options
 * @param {number} options.timeout - Command timeout in milliseconds
 * @param {string} options.projectRoot - Project root directory for the command
 * @returns {Promise<Object>} Parsed JSON response from API
 */
function execAPI(command, args = [], options = {}) {
  const { timeout = DEFAULT_TIMEOUT, projectRoot } = options;

  return new Promise((resolve, reject) => {
    const allArgs = [API_PATH, command, ...args];

    // Add project root if specified
    if (projectRoot) {
      allArgs.push('--project-root', projectRoot);
    }

    const child = spawn(
      'timeout',
      [`${Math.floor(timeout / 1000)}s`, 'node', ...allArgs],
      {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' },
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
      try {
        // Handle cases where validation messages are printed before JSON
        let jsonString = stdout.trim();

        // Look for JSON object starting with { after any prefix text
        const jsonStart = jsonString.indexOf('{');
        if (jsonStart > 0) {
          jsonString = jsonString.substring(jsonStart);
        }

        // Try to parse JSON response
        const result = JSON.parse(jsonString);
        resolve(result);
      } catch {
        // If JSON parsing fails, check if we can extract JSON from stderr
        try {
          const stderrJson = JSON.parse(stderr.trim());
          resolve(stderrJson);
        } catch {
          // If both fail, include raw output for debugging
          reject(
            new Error(
              `Command failed (code ${code}): ${stderr}\nStdout: ${stdout}\nParse error: ${error.message}`,
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
 * Create a clean test environment with isolated FEATURES.json file
 * @param {string} testName - Name of the test (used for directory naming)
 * @returns {Promise<string>} Path to the created test environment
 */
async function testName(_$2) {-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const testDir = PATH.join(BASE_TEST_DIR, testId);

  // Create test directory
  await FS.mkdir(testDir, { recursive: true });

  // Create initial FEATURES.json structure
  const featuresData = {
    project: `test-${testId}`,
    features: [],
    metadata: {
      version: '1.0.0',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      total_features: 0,
      approval_history: [],
    },
    workflow_config: {
      require_approval: true,
      auto_reject_timeout_hours: 168,
      allowed_statuses: ['suggested', 'approved', 'rejected', 'implemented'],
      required_fields: ['title', 'description', 'business_value', 'category'],
    },
    agents: {},
  };

  const featuresPath = PATH.join(testDir, 'FEATURES.json');
  await FS.writeFile(featuresPath, JSON.stringify(featuresData, null, 2));

  return testDir;
}

/**
 * Cleanup test environment by removing the directory And all contents
 * @param {string} testDir - Path to the test directory to cleanup
 * @returns {Promise<void>}
 */
async function cleanupTestEnvironment(testDir) {
  try {
    await FS.rm(testDir, { recursive: true, force: true });
  } catch {
    loggers.stopHook.warn(`Cleanup warning for ${testDir}:`, error.message);
  }
}

/**
 * Read FEATURES.json from a test environment
 * @param {string} testDir - Path to the test directory
 * @returns {Promise<Object>} Parsed FEATURES.json content
 */
async function readFeaturesFile(testDir) {
  const featuresPath = PATH.join(testDir, 'FEATURES.json');
  const data = await FS.readFile(featuresPath, 'utf8');
  return JSON.parse(data);
}

/**
 * Write FEATURES.json to a test environment
 * @param {string} testDir - Path to the test directory
 * @param {Object} featuresData - Features data to write
 * @returns {Promise<void>}
 */
async function writeFeaturesFile(testDir, featuresData) {
  const featuresPath = PATH.join(testDir, 'FEATURES.json');
  await FS.writeFile(featuresPath, JSON.stringify(featuresData, null, 2));
}

/**
 * Create backup of FEATURES.json for corruption testing
 * @param {string} testDir - Path to the test directory
 * @returns {Promise<string>} Path to the backup file
 */
async function createFeaturesBackup(testDir) {
  const featuresPath = PATH.join(testDir, 'FEATURES.json');
  const backupPath = PATH.join(testDir, 'FEATURES.json.backup');
  await FS.copyFile(featuresPath, backupPath);
  return backupPath;
}

/**
 * Corrupt FEATURES.json file for recovery testing
 * @param {string} testDir - Path to the test directory
 * @returns {Promise<void>}
 */
async function corruptFeaturesFile(testDir) {
  const featuresPath = PATH.join(testDir, 'FEATURES.json');
  await FS.writeFile(featuresPath, '{ invalid json syntax }');
}

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Execute multiple API commands concurrently
 * @param {Array<{command: string, args: string[], options: Object}>} commands - Commands to execute
 * @returns {Promise<Array<Object>>} Array of results from all commands
 */
function execAPIConcurrently(commands) {
  const promises = commands.map(({ command, args, options }) =>
    execAPI(command, args, options),
  );
  return Promise.all(promises);
}

/**
 * Generate test feature data
 * @param {Object} overrides - Properties to override in the default feature data
 * @returns {Object} Test feature data
 */
function generateTestFeature(overrides = {}) {
  return {
    title: 'Test Feature Integration',
    description: 'This is a test feature for integration testing purposes',
    business_value:
      'Validates That the feature management system works correctly',
    category: 'enhancement',
    ...overrides,
  };
}

/**
 * Generate test agent configuration
 * @param {Object} overrides - Properties to override in the default agent config
 * @returns {Object} Test agent configuration
 */
function generateTestAgentConfig(overrides = {}) {
  return {
    role: 'testing',
    specialization: ['integration-testing'],
    metadata: { test: true, environment: 'integration' },
    ...overrides,
  };
}

/**
 * Validate FEATURES.json structure
 * @param {Object} featuresData - Features data to validate
 * @throws {Error} If structure is invalid
 */
function validateFeaturesStructure(featuresData) {
  const requiredFields = ['project', 'features', 'metadata', 'workflow_config'];

  for (const field of requiredFields) {
    if (!featuresData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (!Array.isArray(featuresData.features)) {
    throw new Error('features must be an array');
  }

  if (!featuresData.metadata.version) {
    throw new Error('metadata.version is required');
  }

  if (!Array.isArray(featuresData.workflow_config.allowed_statuses)) {
    throw new Error('workflow_config.allowed_statuses must be an array');
  }
}

/**
 * Setup global test environment cleanup
 */
async function setupGlobalCleanup() {
  // Ensure base test directory exists
  await FS.mkdir(BASE_TEST_DIR, { recursive: true });

  // Clean up any leftover test environments from previous runs
  try {
    const entries = await FS.readdir(BASE_TEST_DIR);
    const cleanupPromises = entries.map((entry) => {
      const fullPath = PATH.join(BASE_TEST_DIR, entry);
      return FS.rm(fullPath, { recursive: true, force: true });
    });
    await Promise.all(cleanupPromises);
  } catch {
    loggers.stopHook.warn('Global cleanup warning:', error.message);
  }
}

/**
 * Teardown global test environment
 */
async function teardownGlobalCleanup() {
  try {
    await FS.rm(BASE_TEST_DIR, { recursive: true, force: true });
  } catch {
    loggers.stopHook.warn('Global teardown warning:', error.message);
  }
}

module.exports = {
  execAPI,
  createTestEnvironment,
  cleanupTestEnvironment,
  readFeaturesFile,
  writeFeaturesFile,
  createFeaturesBackup,
  corruptFeaturesFile,
  delay,
  execAPIConcurrently,
  generateTestFeature,
  generateTestAgentConfig,
  validateFeaturesStructure,
  setupGlobalCleanup,
  teardownGlobalCleanup,
  DEFAULT_TIMEOUT,
  BASE_TEST_DIR,
  API_PATH,
};
