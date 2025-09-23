/**
 * E2E Test Utilities - Comprehensive Testing Infrastructure
 *
 * Provides utilities for end-to-end testing of the infinite-continue-stop-hook system
 * including environment setup, command execution, and validation helpers.
 *
 * @author End-to-End Testing Agent
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

// Test configuration constants
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const TEST_DATA_DIR = path.join(__dirname, '..', 'test-data');
const E2E_TIMEOUT = 60000; // 60 seconds for E2E operations
const API_TIMEOUT = 10000; // 10 seconds for API calls (matching system design)

/**
 * E2E Test Environment Manager
 * Handles setup and teardown of isolated test environments
 */
class E2EEnvironment {
  constructor(testName) {
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
    await fs.mkdir(this.testDir, { recursive: true });

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
  async createFeaturesFile() {
    const initialFeatures = {
      project: `e2e-test-${this.testName}`,
      features: [],
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        total_features: 0,
        approval_history: []
      },
      workflow_config: {
        require_approval: true,
        auto_reject_timeout_hours: 168,
        allowed_statuses: ['suggested', 'approved', 'rejected', 'implemented'],
        required_fields: ['title', 'description', 'business_value', 'category']
      }
    };

    await fs.writeFile(this.featuresPath, JSON.stringify(initialFeatures, null, 2));
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
        lint: 'echo "Linting passed"'
      },
      devDependencies: {
        jest: '^30.1.3'
      }
    };

    await fs.writeFile(
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
        await task();
      } catch (error) {
        console.warn(`Cleanup task failed: ${error.message}`);
      }
    }
  }

  /**
   * Remove directory recursively
   */
  async removeDirectory(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      if (stats.isDirectory()) {
        const files = await fs.readdir(dirPath);
        await Promise.all(
          files.map(file => this.removeDirectory(path.join(dirPath, file)))
        );
        await fs.rmdir(dirPath);
      } else {
        await fs.unlink(dirPath);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Get current FEATURES.json content
   */
  async getFeatures() {
    try {
      const content = await fs.readFile(this.featuresPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read FEATURES.json: ${error.message}`);
    }
  }

  /**
   * Update FEATURES.json content
   */
  async updateFeatures(features) {
    await fs.writeFile(this.featuresPath, JSON.stringify(features, null, 2));
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
      expectSuccess = true
    } = options;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let isResolved = false;

      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...env, NODE_ENV: 'test' },
        cwd,
        shell: true
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
        if (isResolved) return;
        isResolved = true;

        const result = {
          code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          duration: Date.now() - startTime,
          success: code === 0,
          command: `${command} ${args.join(' ')}`.trim()
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
        if (isResolved) return;
        isResolved = true;

        error.result = {
          code: -1,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          duration: Date.now() - startTime,
          success: false,
          command: `${command} ${args.join(' ')}`.trim()
        };

        reject(error);
      });

      // Handle timeout
      const timeoutId = setTimeout(() => {
        if (isResolved) return;
        isResolved = true;

        child.kill('SIGKILL');

        const error = new Error(`Command timed out after ${timeout}ms: ${command} ${args.join(' ')}`);
        error.result = {
          code: -1,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          duration: timeout,
          success: false,
          command: `${command} ${args.join(' ')}`.trim(),
          timeout: true
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
    const apiArgs = [
      PROJECT_ROOT + '/taskmanager-api.js',
      command,
      ...args,
      '--project-root',
      options.projectRoot || process.cwd()
    ];

    return this.execute('node', apiArgs, {
      ...options,
      timeout: options.timeout || API_TIMEOUT
    });
  }

  /**
   * Execute stop hook command
   */
  static async executeStopHook(args = [], options = {}) {
    const hookArgs = [PROJECT_ROOT + '/stop-hook.js', ...args];

    return this.execute('node', hookArgs, {
      ...options,
      timeout: options.timeout || API_TIMEOUT
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
      description: 'Test feature for E2E validation',
      business_value: 'Validates E2E testing functionality',
      category: 'enhancement',
      ...overrides
    };
  }

  /**
   * Suggest a feature via API
   */
  static async suggestFeature(environment, featureData) {
    const data = this.createFeatureData(featureData);

    const result = await CommandExecutor.executeAPI(
      'suggest-feature',
      [data.title, data.description, data.business_value, data.category],
      { projectRoot: environment.testDir }
    );

    return { result, featureData: data };
  }

  /**
   * Approve a feature via API
   */
  static async approveFeature(environment, featureId, approver = 'e2e-test', notes = 'E2E test approval') {
    return CommandExecutor.executeAPI(
      'approve-feature',
      [featureId, approver, notes],
      { projectRoot: environment.testDir }
    );
  }

  /**
   * Reject a feature via API
   */
  static async rejectFeature(environment, featureId, rejector = 'e2e-test', reason = 'E2E test rejection') {
    return CommandExecutor.executeAPI(
      'reject-feature',
      [featureId, rejector, reason],
      { projectRoot: environment.testDir }
    );
  }

  /**
   * Validate feature status in FEATURES.json
   */
  static async validateFeatureStatus(environment, featureId, expectedStatus) {
    const features = await environment.getFeatures();
    const feature = features.features.find(f => f.id === featureId);

    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }

    if (feature.status !== expectedStatus) {
      throw new Error(`Expected feature status '${expectedStatus}' but got '${feature.status}'`);
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
  static async simulateAgentExecution(environment, agentId = 'e2e-test-agent', duration = 1000) {
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, duration));

    // Test stop hook authorization
    return CommandExecutor.executeStopHook(
      ['authorize-stop', agentId, 'E2E test completion'],
      { projectRoot: environment.testDir }
    );
  }

  /**
   * Test infinite continue mode
   */
  static async testInfiniteContinue(environment, maxIterations = 3) {
    const iterations = [];

    for (let i = 0; i < maxIterations; i++) {
      const result = await CommandExecutor.executeStopHook(
        ['continue-iteration', `e2e-iteration-${i}`],
        {
          projectRoot: environment.testDir,
          expectSuccess: false // May fail when stop is authorized
        }
      );

      iterations.push(result);

      // Break if stop is authorized
      if (result.stdout.includes('STOP_AUTHORIZED')) {
        break;
      }
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
      await command();
      const duration = Date.now() - startTime;
      results.push(duration);
    }

    return {
      min: Math.min(...results),
      max: Math.max(...results),
      avg: results.reduce((sum, time) => sum + time, 0) / results.length,
      results
    };
  }

  /**
   * Validate performance thresholds
   */
  static validatePerformance(metrics, thresholds) {
    const issues = [];

    if (thresholds.maxAvg && metrics.avg > thresholds.maxAvg) {
      issues.push(`Average time ${metrics.avg}ms exceeds threshold ${thresholds.maxAvg}ms`);
    }

    if (thresholds.maxMax && metrics.max > thresholds.maxMax) {
      issues.push(`Maximum time ${metrics.max}ms exceeds threshold ${thresholds.maxMax}ms`);
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
  static async simulateConcurrentAgents(environment, agentCount = 3, operationsPerAgent = 2) {
    const agents = [];

    // Create concurrent agent operations
    for (let i = 0; i < agentCount; i++) {
      const agentId = `e2e-agent-${i}`;
      const operations = [];

      for (let j = 0; j < operationsPerAgent; j++) {
        const featureData = FeatureTestHelpers.createFeatureData({
          title: `Agent ${i} Feature ${j}`,
          description: `Feature created by agent ${i}, operation ${j}`
        });

        operations.push(
          FeatureTestHelpers.suggestFeature(environment, featureData)
        );
      }

      agents.push({
        id: agentId,
        operations: Promise.all(operations)
      });
    }

    // Wait for all agents to complete
    const results = await Promise.all(
      agents.map(agent => agent.operations.catch(error => ({ error, agentId: agent.id })))
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
      throw new Error(`Command failed ${message}: ${result.command}\nStdout: ${result.stdout}\nStderr: ${result.stderr}`);
    }
  }

  /**
   * Assert command failed as expected
   */
  static assertCommandFailure(result, message = '') {
    if (result.success) {
      throw new Error(`Command unexpectedly succeeded ${message}: ${result.command}\nStdout: ${result.stdout}`);
    }
  }

  /**
   * Assert output contains text
   */
  static assertOutputContains(result, expectedText, message = '') {
    const fullOutput = `${result.stdout} ${result.stderr}`.toLowerCase();
    if (!fullOutput.includes(expectedText.toLowerCase())) {
      throw new Error(`Output does not contain "${expectedText}" ${message}\nActual output: ${fullOutput}`);
    }
  }

  /**
   * Assert feature count
   */
  static assertFeatureCount(features, expectedCount, message = '') {
    if (features.features.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} features but got ${features.features.length} ${message}`);
    }
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
  API_TIMEOUT
};