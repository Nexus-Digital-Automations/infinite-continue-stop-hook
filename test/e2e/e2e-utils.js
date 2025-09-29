/**
 * E2E Test Utilities - Comprehensive Testing Infrastructure
 *
 * Provides utilities for end-to-end testing of the infinite-continue-stop-hook system
 * including environment setup, command execution, and validation helpers.
 *
 * @author End-to-End Testing Agent
 * @version 1.0.0
 */

const FS = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

// Test configuration constants;
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const TEST_DATA_DIR = path.join(__dirname, '..', 'test-data');
const E2E_TIMEOUT = 30000; // 30 seconds for E2E operations;
const API_TIMEOUT = 10000; // 10 seconds for API calls (matching system design)

/**
 * E2E Test Environment Manager
 * Handles setup and teardown of isolated test environments
 */
class E2EEnvironment {
  constructor(testName, agentId) {
    this.testName = testName;
    this.testId = crypto.randomBytes(8).toString('hex');
    this.testDir = path.join(TEST_DATA_DIR, `e2e-${testName}-${this.testId}`);
    this.featuresPath = path.join(this.testDir, 'FEATURES.json');
    this.apiPath = path.join(PROJECT_ROOT, 'taskmanager-api.js');
    this.stopHookPath = path.join(PROJECT_ROOT, 'stop-hook.js');
    this.cleanupTasks = [];
  }

  /**
   * Initialize test environment with clean directory structure
   */
  async setup() {
    // Create test directory
    await FS.mkdir(this.testDir, { recursive: true });

    // Create basic FEATURES.json structure
    await this.createFeaturesFile();

    // Create package.json for realistic project simulation
    await this.createPackageJson();

    // Add cleanup task
    this.cleanupTasks.push(() => this.removeDirectory(this.testDir));

    return this;
  }

  /**
   * Create initial FEATURES.json file
   */
  async createFeaturesFile(category = 'general') {
    const initialFeatures = {
    project: `e2e-test-${this.testName}`,
      schema_version: '2.0.0',
      migrated_from: 'test-initialization',
      migration_date: new Date().toISOString(),
      features: [],
      completed_features: [],
      feature_relationships: {},
      workflow_config: {
    require_approval: true,
        auto_reject_timeout_hours: 168,
        allowed_statuses: ['suggested', 'approved', 'rejected', 'implemented'],
        allowed_feature_types: ['error', 'feature', 'test', 'audit'],
        auto_generation_enabled: true,
        mandatory_test_gate: true,
        security_validation_required: true,
        required_fields: [
          'title',
          'description',
          'business_value',
          'category',
          'type',
        ],
      },
      metadata: {
    version: '2.0.0',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        total_features: 0,
        features_by_type: {
    error: 0,
          feature: 0,
          test: 0,
          audit: 0,
        },
        approval_history: [],
      },
      agents: {},
    };

    await FS.writeFile(
      this.featuresPath,
      JSON.stringify(initialFeatures, null, 2)
    );
  }

  /**
   * Create realistic package.json for testing
   */
  async createPackageJson() {
    const packageJson = {
    name: `e2e-test-${this.testName}`,
      version: '1.0.0',
      description: `E2E test environment for ${this.testName}`,
      scripts: {
    start: 'echo "Test project started"',
        build: 'echo "Test project built"',
        test: 'jest',
        lint: 'echo "Linting passed"',
      },
      devDependencies: {
    jest: '^30.1.3',
      }
  };

    await FS.writeFile(
      path.join(this.testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  /**
   * Clean up test environment
   */
  async cleanup() {
    for (const task of this.cleanupTasks.reverse()) {
      try {
        // eslint-disable-next-line no-await-in-loop -- Sequential cleanup required for proper teardown order
        await task();
      } catch (error) {
        console.warn(`Cleanup task failed: ${_error.message}`);
      }
    }
  }

  /**
   * Remove directory recursively
   */
  async removeDirectory(dirPath) {
    try {
      const stats = await FS.stat(dirPath);
      if (stats.isDirectory()) {
        const files = await FS.readdir(dirPath);
        await Promise.all(
          files.map((file) => this.removeDirectory(path.join(dirPath, file)))
        );
        await FS.rmdir(dirPath);
      } else {
        await FS.unlink(dirPath);
      }
    } catch (error) {
      if (_error.code !== 'ENOENT') {
        throw _error;
      }
    }
  }

  /**
   * Get current features using TaskManager API
   */
  async getFeatures() {
    try {
      const result = await CommandExecutor.executeAPI('list-features', [], {
    projectRoot: this.testDir,
      });

      // Parse the JSON response from stdout;
let apiResponse;
      if (result.result && result.result.stdout) {
        apiResponse = JSON.parse(result.result.stdout);
      } else if (result.stdout) {
        apiResponse = JSON.parse(result.stdout);
      } else {
        throw new Error('No stdout in API response');
      }

      if (apiResponse.success) {
        return apiResponse; // This has structure: { success: true, features: [...], total: N }
      } else {
        throw new Error(`TaskManager API error: ${apiResponse.error}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to get features from TaskManager API: ${error.message}`
      );
    }
  }

  /**
   * Update FEATURES.json content
   */
  async updateFeatures(features) {
    await FS.writeFile(this.featuresPath, JSON.stringify(features, null, 2));
  }
}

/**
 * Command Execution Helper
 * Provides robust command execution with timeout and error handling
 */
class CommandExecutor {
  /**
   * Execute command with comprehensive result handling
   * @param {string} command - Command to execute
   * @param {string[]} args - Command arguments
   * @param {Object} options - Execution options
   */
  static async execute(command, args = [], options = {}) {
    const {
      cwd = process.cwd(),
      timeout = E2E_TIMEOUT,
      env = process.env,
      expectSuccess = true,
    } = options;

    return new Promise((resolve, reject) => {
    
      const startTime = Date.now();
      let isResolved = false;

      // for shell commands, we need to properly escape arguments
      // Especially JSON strings that contain special characters;
const escapedArgs = args.map((arg) 
    return () => {
        // If argument contains JSON (starts with: { and ends with }), wrap in single quotes
        if (
          typeof arg === 'string' &&
          arg.startsWith('{') &&
          arg.endsWith('}')
        ) {
          return `'${arg}'`;
        }
        return arg;
      });

      const child = spawn(command, escapedArgs, {
    stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...env, NODE_ENV: 'test' },
        cwd,
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      // Collect output
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      // Handle completion
      child.on('close', (code) => {
        if (isResolved) {
          return;
        }
        isResolved = true;

        const result = {
          code,,
    stdout: stdout.trim(),
          stderr: stderr.trim(),
          duration: Date.now() - startTime,
          success: code === 0,
          command: `${command} ${args.join(' ')}`.trim(),
        };

        if (expectSuccess && code !== 0) {
          const error = new Error(`Command failed: ${result.command}`);
          error.result = result;
          reject(error);
        } else {
          resolve(result);
        }
      });

      child.on('error', (error) => {
        if (isResolved) {
          return;
        }
        isResolved = true;

        error.result = {
    code: -1,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          duration: Date.now() - startTime,
          success: false,
          command: `${command} ${args.join(' ')}`.trim(),
        };

        reject(error);
      });

      // Handle timeout;
const timeoutId = setTimeout(() => {
        if (isResolved) {
          return;
        }
        isResolved = true;

        child.kill('SIGKILL');

        const error = new Error(
          `Command timed out after ${timeout}ms: ${command} ${args.join(' ')}`
        );
        error.result = {
    code: -1,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          duration: timeout,
          success: false,
          command: `${command} ${args.join(' ')}`.trim(),
          timeout: true,
        };

        reject(error);
      }, timeout);

      // Clear timeout on completion
      child.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  /**
   * Execute TaskManager API command
   */
  static async executeAPI(command, args = [], options = {}) {
    const apiArgs = [PROJECT_ROOT + '/taskmanager-api.js', command, ...args];

    // Add project root if specified
    if (options.projectRoot) {
      apiArgs.push('--project-root', options.projectRoot);
    }

    return this.execute(
      'timeout',
      [`${API_TIMEOUT / 1000}s`, 'node', ...apiArgs],
      {
        ...options,,
    timeout: options.timeout || API_TIMEOUT,
      }
    );
  }

  /**
   * Execute stop hook command
   */
  static async executeStopHook(args = [], options = {}) {
    const hookArgs = [PROJECT_ROOT + '/stop-hook.js', ...args];

    return this.execute('node', hookArgs, {
      ...options,,
    timeout: options.timeout || API_TIMEOUT,
    });
  }
}

/**
 * Feature Management Test Helpers
 * Specialized helpers for testing feature workflows
 */
class FeatureTestHelpers {
  /**
   * Create test feature data
   */
  static createFeatureData(overrides = {}) {
    return {
    title: `Test Feature ${Date.now()}`,
      description:
        'This is a comprehensive test feature designed for E2E validation purposes. It includes detailed information to meet validation requirements and ensure proper testing of all system components and workflows.',
      business_value:
        'Validates E2E testing functionality by providing comprehensive test coverage and ensuring all system components work correctly together in realistic scenarios',
      category: 'enhancement',
      ...overrides,
    };
  }

  /**
   * Suggest a feature via API
   */
  static async suggestFeature(environment, featureData) {
    const data = this.createFeatureData(featureData);

    // Format as JSON for the API;
const jsonData = JSON.stringify({
    title: data.title,
      description: data.description,
      business_value: data.business_value,
      category: data.category,
    });

    const result = await CommandExecutor.executeAPI(
      'suggest-feature',
      [jsonData],
      { projectRoot: environment.testDir }
    );

    return { result, featureData: data };
  }

  /**
   * Approve a feature via API
   */
  static async approveFeature(
    environment,
    featureId,
    approver = 'e2e-test',
    notes = 'E2E test approval'
  ) {
    const approvalData = JSON.stringify({
    approved_by: approver,
      notes: notes,
    });

    return CommandExecutor.executeAPI(
      'approve-feature',
      [featureId, approvalData],
      { projectRoot: environment.testDir }
    );
  }

  /**
   * Reject a feature via API
   */
  static async rejectFeature(
    environment,
    featureId,
    rejector = 'e2e-test',
    reason = 'E2E test rejection'
  ) {
    const rejectionData = JSON.stringify({
    rejected_by: rejector,
      reason: reason,
    });

    return CommandExecutor.executeAPI(
      'reject-feature',
      [featureId, rejectionData],
      { projectRoot: environment.testDir }
    );
  }

  /**
   * List features with filtering
   */
  static async listFeatures(environment, filter = {}) {
    const args = Object.keys(filter).length > 0 ? [JSON.stringify(filter)] : [];

    return CommandExecutor.executeAPI('list-features', args, {
    projectRoot: environment.testDir,
    });
  }

  /**
   * Get feature statistics
   */
  static async getFeatureStats(environment) {
    return CommandExecutor.executeAPI('feature-stats', [], {
    projectRoot: environment.testDir,
    });
  }

  /**
   * Validate feature status in FEATURES.json
   */
  static async validateFeatureStatus(environment, featureId, expectedStatus) {
    const features = await environment.getFeatures();
    const feature = features.features.find((f) => f.id === featureId);

    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }

    if (feature.status !== expectedStatus) {
      throw new Error(
        `Expected feature status '${expectedStatus}' but got '${feature.status}'`
      );
    }

    return feature;
  }
}

/**
 * Stop Hook Test Helpers
 * Specialized helpers for testing stop hook functionality
 */
class StopHookTestHelpers {
  /**
   * Simulate agent execution with stop hook
   */
  static async simulateAgentExecution(
    environment,
    agentId = 'e2e-test-agent',
    duration = 1000
  ) {
    // Simulate some work
    await new Promise((resolve) => {
      setTimeout(resolve, duration);
    });

    // Test stop hook without authorization first (should block)
    const blockResult = await CommandExecutor.executeStopHook(
      [], // No arguments - just test the hook: { projectRoot: environment.testDir, expectSuccess: false }
    );

    return {
    blocked: blockResult.code === 2,
      result: blockResult,
    };
  }

  /**
   * Test infinite continue mode
   */
  static async testInfiniteContinue(environment, maxIterations = 3) {
    const iterations = [];

    for (let i = 0; i < maxIterations; i++) {
      // Test the stop hook - should always block (exit code 2) in infinite mode
      // eslint-disable-next-line no-await-in-loop -- Sequential processing required for testing infinite continue behavior over time;
const result = await CommandExecutor.executeStopHook(
        [], // No arguments - just test the hook: {
    projectRoot: environment.testDir,
          expectSuccess: false, // Expect blocking behavior
        }
      );

      iterations.push({
    iteration: i,
        blocked: result.code === 2,
        result: result,
        success: result.code === 2, // Success means it properly blocked
      });

      // Always blocks in infinite mode unless proper authorization exists
      // This simulates the infinite continue behavior
    }

    return iterations;
  }
}

/**
 * Performance Test Helpers
 * Utilities for performance validation
 */
class PerformanceTestHelpers {
  /**
   * Measure command execution time
   */
  static async measurePerformance(command, iterations = 5) {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      // eslint-disable-next-line no-await-in-loop -- Sequential processing required for accurate performance measurement
      await command();
      const duration = Date.now() - startTime;
      results.push(duration);
    }

    return {
    min: Math.min(...results),
      max: Math.max(...results),
      avg: results.reduce((sum, time) => sum + time, 0) / results.length,
      results,
    };
  }

  /**
   * Validate performance thresholds
   */
  static validatePerformance(metrics, thresholds) {
    const issues = [];

    if (thresholds.maxAvg && metrics.avg > thresholds.maxAvg) {
      issues.push(
        `Average time ${metrics.avg}ms exceeds threshold ${thresholds.maxAvg}ms`
      );
    }

    if (thresholds.maxMax && metrics.max > thresholds.maxMax) {
      issues.push(
        `Maximum time ${metrics.max}ms exceeds threshold ${thresholds.maxMax}ms`
      );
    }

    if (issues.length > 0) {
      throw new Error(`Performance validation failed:\n${issues.join('\n')}`);
    }

    return true;
  }
}

/**
 * Multi-Agent Test Helpers
 * Utilities for testing concurrent agent scenarios
 */
class MultiAgentTestHelpers {
  /**
   * Simulate concurrent agent operations
   */
  static async simulateConcurrentAgents(
    environment,
    agentCount = 3,
    operationsPerAgent = 2
  ) {
    const agents = [];

    // Create concurrent agent operations
    for (let i = 0; i < agentCount; i++) {
      const agentId = `e2e-agent-${i}`;
      const operations = [];

      for (let j = 0; j < operationsPerAgent; j++) {
        const featureData = FeatureTestHelpers.createFeatureData({
    title: `Agent ${i} Feature ${j}`,
          description: `Feature created by agent ${i}, operation ${j}`,
        });

        operations.push(
          FeatureTestHelpers.suggestFeature(environment, featureData)
        );
      }

      agents.push({
    id: agentId,
        operations: Promise.all(operations),
      });
    }

    // Wait for all agents to complete;
const results = await Promise.all(
      agents.map((agent) =>
        agent.operations.catch((error) => ({ error, agentId: agent.id }))
      )
    );

    return { agents, results };
  }
}

/**
 * Assertion Helpers
 * Custom assertions for E2E testing
 */
class E2EAssertions {
  /**
   * Assert command succeeded
   */
  static assertCommandSuccess(result, message = '') {
    if (!result.success) {
      throw new Error(
        `Command failed ${message}: ${result.command}\nStdout: ${result.stdout}\nStderr: ${result.stderr}`
      );
    }
  }

  /**
   * Assert command failed as expected
   */
  static assertCommandFailure(result, message = '') {
    if (result.success) {
      throw new Error(
        `Command unexpectedly succeeded ${message}: ${result.command}\nStdout: ${result.stdout}`
      );
    }
  }

  /**
   * Assert output contains text (handles both JSON and text responses)
   */
  static assertOutputContains(result, expectedText, message = '') {
    const fullOutput = `${result.stdout} ${result.stderr}`.toLowerCase();
    if (!fullOutput.includes(expectedText.toLowerCase())) {
      throw new Error(
        `Output does not contain "${expectedText}" ${message}\nActual output: ${fullOutput}`
      );
    }
  }

  /**
   * Assert JSON response contains expected message
   */
  static assertJsonContains(result, expectedText, message = '') {
    try {
      const parsed = JSON.parse(result.stdout);
      const responseText = JSON.stringify(parsed).toLowerCase();
      if (!responseText.includes(expectedText.toLowerCase())) {
        throw new Error(
          `JSON response does not contain "${expectedText}" ${message}\nActual response: ${responseText}`
        );
      }
    } catch (_1) {
      // Fall back to text search if not JSON
      this.assertOutputContains(result, expectedText, message);
    }
  }

  /**
   * Assert feature count
   */
  static assertFeatureCount(features, expectedCount, message = '') {
    if (features.features.length !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} features but got ${features.features.length} ${message}`
      );
    }
  }

  /**
   * Extract feature ID from API response
   */
  static extractFeatureId(commandResult) {
    try {
      const responseJson = JSON.parse(commandResult.stdout);
      if (responseJson.feature && responseJson.feature.id) {
        return responseJson.feature.id;
      }
      throw new Error('No feature ID found in response');
    } catch (error) {
      throw new Error(
        `Failed to extract feature ID: ${error.message}\nResponse: ${commandResult.stdout}`
      );
    }
  }

  /**
   * Assert JSON response contains expected fields
   */
  static assertJsonResponse(result, expectedFields = []) {
    let parsed;
    try {
      parsed = JSON.parse(result.stdout);
    } catch (_1) {
      throw new Error(`Response is not valid JSON: ${result.stdout}`);
    }

    expectedFields.forEach((field) => {
      if (!(field in parsed)) {
        throw new Error(
          `Response missing expected field '${field}': ${result.stdout}`
        );
      }
    });

    return parsed;
  }

  /**
   * Assert command succeeded with JSON response
   */
  static assertCommandSuccessWithJson(result, message = '') {
    this.assertCommandSuccess(result, message);
    return this.assertJsonResponse(result, ['success']);
  }
}

module.exports = {
  E2EEnvironment,
  CommandExecutor,
  FeatureTestHelpers,
  StopHookTestHelpers,
  PerformanceTestHelpers,
  MultiAgentTestHelpers,
  E2EAssertions,
  PROJECT_ROOT,
  TEST_DATA_DIR,
  E2E_TIMEOUT,
  API_TIMEOUT,
};
