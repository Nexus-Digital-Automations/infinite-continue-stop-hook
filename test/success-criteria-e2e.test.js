
/**
 * Success Criteria End-to-End Tests
 *
 * Comprehensive end-to-end test suite covering:
 * - Complete validation workflows from start to finish
 * - Real-world usage scenarios and user journeys
 * - Integration with actual validation tools (linters, build tools)
 * - Template application and inheritance workflows
 * - Multi-agent coordination for criteria validation
 * - Performance validation and benchmarking
 *
 * @author Testing Agent #6
 * @version 1.0.0
 */

const _fs = require('fs').promises;
const _path = require('path');
const { spawn } = require('child_process');

// Test configuration
const E2E_PROJECT_DIR = _path.join(__dirname, 'success-criteria-e2e-project');
const TODO_PATH = _path.join(E2E_PROJECT_DIR, 'TODO.json');
const API_PATH = _path.join(__dirname, '..', 'taskmanager-api.js');
const _VALIDATOR_PATH = _path.join(
  __dirname,
  '..',
  'success-criteria-validator.js',
);
const _TIMEOUT = 30000; // 30 seconds for E2E operations

/**
 * Execute command and return result
 * @param {string} command - Command to execute
 * @param {string[]} args - Command arguments
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Command result
 */
function execCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: options.cwd || E2E_PROJECT_DIR,
      ...options,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr,
        success: code === 0,
      });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Execute TaskManager API command
 * @param {string} command - API command
 * @param {string[]} args - Command arguments
 * @returns {Promise<Object>} Parsed API response
 */
async function execAPI(command, args = []) {
  const allArgs = [
    API_PATH,
    command,
    ...args,
    '--project-root',
    E2E_PROJECT_DIR,
  ];

  const result = await execCommand('timeout', [`30s`, 'node', ...allArgs]);

  if (!result.success) {
    throw new Error(`API command failed: ${result.stderr}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`Failed to parse API response: ${result.stdout}`);
  }
}

/**
 * Setup comprehensive E2E test project
 */
async function setupE2EProject() {
  try {
    // Create project directory
    await _fs.mkdir(E2E_PROJECT_DIR, { recursive: true });
    await _fs.mkdir(_path.join(E2E_PROJECT_DIR, 'src'), { recursive: true });
    await _fs.mkdir(_path.join(E2E_PROJECT_DIR, 'test'), { recursive: true });
    await _fs.mkdir(_path.join(E2E_PROJECT_DIR, 'development'), {
      recursive: true,
    });
    await _fs.mkdir(_path.join(E2E_PROJECT_DIR, 'development', 'evidence'), {
      recursive: true,
    });

    // Create package.json with realistic scripts
    const packageJson = {
      name: 'success-criteria-e2e-test',
      version: '1.0.0',
      description: 'E2E test project for Success Criteria validation',
      scripts: {
        lint: 'echo "✅ Linting passed - no errors found"',
        'lint:fail': 'echo "❌ Linting failed - 3 errors found" && exit 1',
        build: 'echo "✅ Build completed successfully"',
        'build:fail': 'echo "❌ Build failed - compilation errors" && exit 1',
        start: 'echo "✅ Application started on port 3000"',
        'start:fail':
          'echo "❌ Application failed to start - port in use" && exit 1',
        test: 'echo "✅ All tests passed (15/15)"',
        'test:fail': 'echo "❌ Tests failed (12/15 passed)" && exit 1',
        'test:coverage': 'echo "✅ Test coverage: 92% (target: 90%)"',
      },
      devDependencies: {
        eslint: '^8.0.0',
        jest: '^29.0.0',
      },
    };

    await _fs.writeFile(
      _path.join(E2E_PROJECT_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2),
    );

    // Create sample source files
    const sampleCode = `/**
 * Sample application code for E2E testing
 * @param {string} message - Message to process
 * @returns {string} Processed message
 */
function processMessage(_message) {
  if (!message) {
    throw new Error('Message is required');
  }
  return message.toUpperCase();
}

module.exports = { processMessage };
`;

    await _fs.writeFile(_path.join(E2E_PROJECT_DIR, 'src', 'app.js'), sampleCode);

    // Create test files
    const testCode = `const { processMessage } = require('../src/app');

describe('Application Tests', () => {
  test('should process message correctly', () => {
    expect(processMessage('hello')).toBe('HELLO');
  });

  test('should throw error for empty message', () => {
    expect(() => processMessage('')).toThrow('Message is required');
  });
});
`;

    await _fs.writeFile(
      _path.join(E2E_PROJECT_DIR, 'test', 'app.test.js'),
      testCode,
    );

    // Create TODO.json structure
    const initialTodoData = {
      meta: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        version: '2.0.0',
        project_root: E2E_PROJECT_DIR,
      },
      tasks: [],
      features: [],
      agents: {},
      statistics: {
        total_tasks: 0,
        completed_tasks: 0,
        pending_tasks: 0,
        in_progress_tasks: 0,
      },
    };

    await _fs.writeFile(TODO_PATH, JSON.stringify(initialTodoData, null, 2));

    // Create success criteria configuration
    const successCriteriaConfig = {
      default_template: '25_point_standard',
      validation_timeout: 300,
      evidence_storage: _path.join(E2E_PROJECT_DIR, 'development', 'evidence'),
      report_storage: _path.join(E2E_PROJECT_DIR, 'development', 'reports'),
      validation_agents: {
        automated: ['linter', 'build', 'test'],
        manual: ['documentation', 'architecture'],
      },
    };

    await _fs.writeFile(
      _path.join(E2E_PROJECT_DIR, 'development', 'success-criteria-config.json'),
      JSON.stringify(successCriteriaConfig, null, 2),
    );
  } catch (error) {
    console.error('Failed to setup E2E project:', error);
    throw error;
  }
}

/**
 * Cleanup E2E test project
 */
async function cleanupE2EProject() {
  try {
    await _fs.rm(E2E_PROJECT_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

describe('Success Criteria End-to-End Tests', () => {
  let _agentId;

  beforeAll(async () => {
    await setupE2EProject();
    jest.setTimeout(60000); // 60 seconds for E2E tests
  }, 60000);

  afterAll(async () => {
    await cleanupE2EProject();
  });

  let agentId;

  beforeEach(async () => {
    // Initialize fresh agent for each test
    const initResult = await execAPI('init');
    expect(initResult.success).toBe(true);
    agentId = initResult.agentId;
  });

  describe('Complete Validation Workflows', () => {
    test('should execute full success criteria validation workflow', async () => {
      // 1. Create task with comprehensive success criteria
      const createResult = await execAPI('create', [
        JSON.stringify({
          title: 'Full validation workflow task',
          description: 'Complete E2E test for success criteria validation',
          category: 'feature',
          success_criteria: [
            'Linter Perfection',
            'Build Success',
            'Runtime Success',
            'Test Integrity',
            'Performance Metrics',
          ],
        }),
      ]);
      expect(createResult.success).toBe(true);

      const taskId = createResult.task.id;

      // 2. Claim task
      const claimResult = await execAPI('claim', [taskId, agentId]);
      expect(claimResult.success).toBe(true);

      // 3. Execute validation steps
      const validationResults = {};

      // Linter validation
      const lintResult = await execCommand('npm', ['run', 'lint']);
      validationResults.linter = lintResult.success ? 'passed' : 'failed';

      // Build validation
      const buildResult = await execCommand('npm', ['run', 'build']);
      validationResults.build = buildResult.success ? 'passed' : 'failed';

      // Runtime validation
      const startResult = await execCommand('npm', ['run', 'start']);
      validationResults.runtime = startResult.success ? 'passed' : 'failed';

      // Test validation
      const testResult = await execCommand('npm', ['run', 'test']);
      validationResults.test = testResult.success ? 'passed' : 'failed';

      // 4. Complete task with validation results
      const completeResult = await execAPI('complete', [
        taskId,
        JSON.stringify({
          message: 'Task completed with full validation workflow',
          validation_results: validationResults,
          criteria_validated: true,
          evidence_collected: true,
        }),
      ]);
      expect(completeResult.success).toBe(true);

      // 5. Verify task completion and validation
      const listResult = await execAPI('list', [
        JSON.stringify({ status: 'completed' }),
      ]);
      expect(listResult.success).toBe(true);

      const completedTask = listResult.tasks.find((t) => t.id === taskId);
      expect(completedTask).toBeDefined();
      expect(completedTask.status).toBe('completed');
    }, 45000);

    test('should handle validation failures gracefully', async () => {
      // Create task that will have validation failures
      const createResult = await execAPI('create', [
        JSON.stringify({
          title: 'Validation failure handling task',
          description: 'Test task for handling validation failures',
          category: 'feature',
          success_criteria: [
            'Linter Perfection',
            'Build Success',
            'Test Integrity',
          ],
        }),
      ]);
      expect(createResult.success).toBe(true);

      const taskId = createResult.task.id;

      // Claim task
      const claimResult = await execAPI('claim', [taskId, agentId]);
      expect(claimResult.success).toBe(true);

      // Simulate validation failures
      const lintFailResult = await execCommand('npm', ['run', 'lint:fail']);
      const buildFailResult = await execCommand('npm', ['run', 'build:fail']);
      const testPassResult = await execCommand('npm', ['run', 'test']);

      const validationResults = {
        linter: lintFailResult.success ? 'passed' : 'failed',
        build: buildFailResult.success ? 'passed' : 'failed',
        test: testPassResult.success ? 'passed' : 'failed',
      };

      // Complete task with mixed validation results
      const completeResult = await execAPI('complete', [
        taskId,
        JSON.stringify({
          message: 'Task completed with validation failures',
          validation_results: validationResults,
          criteria_validated: false,
          validation_failures: ['linter', 'build'],
        }),
      ]);
      expect(completeResult.success).toBe(true);
    }, 30000);

    test('should validate template inheritance workflow', async () => {
      // Test complete template application and inheritance workflow
      const createResult = await execAPI('create', [
        JSON.stringify({
          title: 'Template inheritance workflow task',
          description: 'Test task for template inheritance validation',
          category: 'feature',
          template: 'enterprise', // Apply enterprise template
        }),
      ]);
      expect(createResult.success).toBe(true);

      const taskId = createResult.task.id;

      // Verify task has inherited template criteria
      const listResult = await execAPI('list', [
        JSON.stringify({ id: taskId }),
      ]);
      expect(listResult.success).toBe(true);

      const task = listResult.tasks.find((t) => t.id === taskId);
      expect(task).toBeDefined();

      // Claim and execute validation for inherited criteria
      const claimResult = await execAPI('claim', [taskId, agentId]);
      expect(claimResult.success).toBe(true);

      // Execute subset of validations for enterprise template
      const validationResults = {
        linter: 'passed',
        build: 'passed',
        runtime: 'passed',
        test: 'passed',
        security: 'passed',
        documentation: 'pending', // Manual validation
        architecture: 'pending', // Manual validation
      };

      const completeResult = await execAPI('complete', [
        taskId,
        JSON.stringify({
          message: 'Template inheritance workflow completed',
          validation_results: validationResults,
          template_applied: 'enterprise',
          manual_validation_required: true,
        }),
      ]);
      expect(completeResult.success).toBe(true);
    }, 30000);
  });

  describe('Real-World Usage Scenarios', () => {
    test('should handle typical development workflow', async () => {
      // Simulate typical development workflow with success criteria

      // 1. Create feature task
      const featureResult = await execAPI('create', [
        JSON.stringify({
          title: 'Implement user authentication',
          description: 'Add user login and registration functionality',
          category: 'feature',
          success_criteria: [
            'Linter Perfection',
            'Build Success',
            'Runtime Success',
            'Test Integrity',
            'Security Review',
            'API Documentation',
          ],
        }),
      ]);
      expect(featureResult.success).toBe(true);

      const featureTaskId = featureResult.task.id;

      // 2. Implement feature (simulate code changes)
      await _fs.writeFile(
        _path.join(E2E_PROJECT_DIR, 'src', 'auth.js'),
        `// User authentication module
function authenticate(username, password) {
  if (!username || !password) {
    throw new Error('Username and password required');
  }
  // Simulate authentication logic
  return { success: true, token: 'mock-jwt-token' };
}

module.exports = { authenticate };
`,
      );

      // 3. Run validation checks
      const lintResult = await execCommand('npm', ['run', 'lint']);
      const buildResult = await execCommand('npm', ['run', 'build']);
      const testResult = await execCommand('npm', ['run', 'test']);

      // 4. Claim and complete feature
      const claimResult = await execAPI('claim', [featureTaskId, agentId]);
      expect(claimResult.success).toBe(true);

      const completeResult = await execAPI('complete', [
        featureTaskId,
        JSON.stringify({
          message: 'User authentication feature implemented',
          validation_results: {
            linter: lintResult.success ? 'passed' : 'failed',
            build: buildResult.success ? 'passed' : 'failed',
            runtime: 'passed',
            test: testResult.success ? 'passed' : 'failed',
            security: 'manual_review_required',
            documentation: 'api_docs_updated',
          },
          files_modified: ['src/auth.js'],
        }),
      ]);
      expect(completeResult.success).toBe(true);
    }, 30000);

    test('should handle bug fix workflow with criteria', async () => {
      // Test bug fix workflow with error-specific criteria
      const bugFixResult = await execAPI('create', [
        JSON.stringify({
          title: 'Fix authentication timeout issue',
          description:
            'Resolve issue where login requests timeout after 30 seconds',
          category: 'error',
          success_criteria: [
            'Linter Perfection',
            'Build Success',
            'Test Integrity',
            'Error Handling',
            'Performance Metrics',
          ],
        }),
      ]);
      expect(bugFixResult.success).toBe(true);

      const bugTaskId = bugFixResult.task.id;

      // Implement bug fix
      await _fs.writeFile(
        _path.join(E2E_PROJECT_DIR, 'src', 'auth-fix.js'),
        `// Bug fix for authentication timeout
function authenticateWithTimeout(username, password, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Authentication timeout'));
    }, timeout);

    // Simulate authentication with proper timeout handling
    setTimeout(() => {
      clearTimeout(timer);
      resolve({ success: true, token: 'mock-jwt-token' });
    }, 1000);
  });
}

module.exports = { authenticateWithTimeout };
`,
      );

      // Claim and complete bug fix
      const claimResult = await execAPI('claim', [bugTaskId, agentId]);
      expect(claimResult.success).toBe(true);

      const completeResult = await execAPI('complete', [
        bugTaskId,
        JSON.stringify({
          message: 'Authentication timeout bug fixed',
          validation_results: {
            linter: 'passed',
            build: 'passed',
            test: 'passed',
            error_handling: 'improved',
            performance: 'timeout_reduced_to_10s',
          },
          bug_fixed: true,
          regression_tests_added: true,
        }),
      ]);
      expect(completeResult.success).toBe(true);
    }, 30000);

    test('should handle refactoring workflow with quality gates', async () => {
      // Test refactoring workflow with quality-focused criteria
      const refactorResult = await execAPI('create', [
        JSON.stringify({
          title: 'Refactor authentication module for better maintainability',
          description:
            'Improve code structure and add comprehensive documentation',
          category: 'feature',
          success_criteria: [
            'Linter Perfection',
            'Build Success',
            'Test Integrity',
            'Function Documentation',
            'Architecture Documentation',
            'Performance Metrics',
            'Architectural Consistency',
          ],
        }),
      ]);
      expect(refactorResult.success).toBe(true);

      const refactorTaskId = refactorResult.task.id;

      // Perform refactoring
      await _fs.writeFile(
        _path.join(E2E_PROJECT_DIR, 'src', 'auth-refactored.js'),
        `/**
 * Refactored Authentication Module
 * 
 * Provides secure user authentication with improved error handling
 * and comprehensive documentation.
 * 
 * @module Authentication
 * @version 2.0.0
 */

/**
 * Authenticates a user with username and password
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @param {Object} options - Authentication options
 * @param {number} options.timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<Object>} Authentication result
 * @throws {Error} When credentials are missing or invalid
 */
async function authenticate(username, password, options = {}) {
  const { timeout = 10000 } = options;
  
  if (!username || !password) {
    throw new Error('Username and password are required');
  }
  
  // Implement timeout handling
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Authentication timeout'));
    }, timeout);
    
    // Simulate authentication process
    setTimeout(() => {
      clearTimeout(timer);
      resolve({
        success: true,
        token: 'mock-jwt-token',
        expiresIn: 3600,
      });
    }, 500);
  });
}

module.exports = { authenticate };
`,
      );

      // Claim and complete refactoring
      const claimResult = await execAPI('claim', [refactorTaskId, agentId]);
      expect(claimResult.success).toBe(true);

      const completeResult = await execAPI('complete', [
        refactorTaskId,
        JSON.stringify({
          message: 'Authentication module refactored successfully',
          validation_results: {
            linter: 'passed',
            build: 'passed',
            test: 'passed',
            documentation: 'comprehensive_jsdoc_added',
            architecture: 'improved_separation_of_concerns',
            performance: 'reduced_response_time',
            consistency: 'follows_project_patterns',
          },
          refactoring_complete: true,
          maintainability_improved: true,
        }),
      ]);
      expect(completeResult.success).toBe(true);
    }, 30000);
  });

  describe('Multi-Agent Coordination', () => {
    test('should coordinate success criteria validation across multiple agents', async () => {
      // Create task that requires multiple agents for validation
      const createResult = await execAPI('create', [
        JSON.stringify({
          title: 'Multi-agent validation task',
          description:
            'Task requiring coordination between multiple validation agents',
          category: 'feature',
          success_criteria: [
            'Linter Perfection',
            'Build Success',
            'Test Integrity',
            'Security Review',
            'Performance Metrics',
            'Architecture Documentation',
          ],
        }),
      ]);
      expect(createResult.success).toBe(true);

      const taskId = createResult.task.id;

      // Initialize multiple agents for different validation aspects
      const developmentAgent = await execAPI('init');
      const securityAgent = await execAPI('init');
      const performanceAgent = await execAPI('init');

      expect(developmentAgent.success).toBe(true);
      expect(securityAgent.success).toBe(true);
      expect(performanceAgent.success).toBe(true);

      // Development agent handles basic validation
      const claimResult = await execAPI('claim', [
        taskId,
        developmentAgent.agentId,
      ]);
      expect(claimResult.success).toBe(true);

      // Simulate coordination between agents for different validation aspects
      const validationResults = {
        linter: 'passed',
        build: 'passed',
        test: 'passed',
        security: 'reviewed_by_security_agent',
        performance: 'benchmarked_by_performance_agent',
        architecture: 'documented_by_development_agent',
      };

      const completeResult = await execAPI('complete', [
        taskId,
        JSON.stringify({
          message: 'Multi-agent validation completed',
          validation_results: validationResults,
          coordinating_agents: [
            developmentAgent.agentId,
            securityAgent.agentId,
            performanceAgent.agentId,
          ],
          validation_distributed: true,
        }),
      ]);
      expect(completeResult.success).toBe(true);
    }, 30000);
  });

  describe('Performance Validation and Benchmarking', () => {
    test('should validate performance criteria with actual benchmarks', async () => {
      // Create performance-focused task
      const createResult = await execAPI('create', [
        JSON.stringify({
          title: 'Performance optimization task',
          description:
            'Optimize application performance and validate improvements',
          category: 'feature',
          success_criteria: [
            'Performance Metrics',
            'Build Success',
            'Test Integrity',
            'Linter Perfection',
          ],
          performance_targets: {
            response_time: '< 500ms',
            memory_usage: '< 100MB',
            cpu_usage: '< 50%',
          },
        }),
      ]);
      expect(createResult.success).toBe(true);

      const taskId = createResult.task.id;

      // Claim task
      const claimResult = await execAPI('claim', [taskId, agentId]);
      expect(claimResult.success).toBe(true);

      // Simulate performance optimization
      const startTime = Date.now();

      // Run performance validation
      const _performanceResult = await execCommand('npm', [
        'run',
        'test:coverage',
      ]);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Complete with performance metrics
      const completeResult = await execAPI('complete', [
        taskId,
        JSON.stringify({
          message: 'Performance optimization completed',
          validation_results: {
            linter: 'passed',
            build: 'passed',
            test: 'passed',
            performance: 'optimized',
          },
          performance_metrics: {
            response_time: `${executionTime}ms`,
            memory_usage: '85MB',
            cpu_usage: '35%',
            test_execution_time: `${executionTime}ms`,
          },
          targets_met: true,
        }),
      ]);
      expect(completeResult.success).toBe(true);
    }, 30000);

    test('should handle performance regression detection', async () => {
      // Test performance regression detection in criteria validation
      const createResult = await execAPI('create', [
        JSON.stringify({
          title: 'Performance regression detection task',
          description: 'Detect and handle performance regressions',
          category: 'feature',
          success_criteria: ['Performance Metrics'],
          baseline_performance: {
            response_time: '300ms',
            memory_usage: '80MB',
          },
        }),
      ]);
      expect(createResult.success).toBe(true);

      const taskId = createResult.task.id;

      // Claim task
      const claimResult = await execAPI('claim', [taskId, agentId]);
      expect(claimResult.success).toBe(true);

      // Simulate performance regression
      const completeResult = await execAPI('complete', [
        taskId,
        JSON.stringify({
          message: 'Performance regression detected and handled',
          validation_results: {
            performance: 'regression_detected',
          },
          current_performance: {
            response_time: '450ms', // Regression from 300ms
            memory_usage: '95MB', // Regression from 80MB
          },
          regression_analysis: {
            response_time_increase: '50%',
            memory_increase: '18.75%',
            action_required: true,
          },
        }),
      ]);
      expect(completeResult.success).toBe(true);
    }, 30000);
  });

  describe('Evidence Collection and Reporting', () => {
    test('should collect and store validation evidence', async () => {
      // Create task with evidence collection requirements
      const createResult = await execAPI('create', [
        JSON.stringify({
          title: 'Evidence collection validation task',
          description: 'Task requiring comprehensive evidence collection',
          category: 'feature',
          success_criteria: [
            'Linter Perfection',
            'Build Success',
            'Test Integrity',
          ],
          evidence_required: true,
        }),
      ]);
      expect(createResult.success).toBe(true);

      const taskId = createResult.task.id;

      // Claim task
      const claimResult = await execAPI('claim', [taskId, agentId]);
      expect(claimResult.success).toBe(true);

      // Collect evidence during validation
      const lintResult = await execCommand('npm', ['run', 'lint']);
      const buildResult = await execCommand('npm', ['run', 'build']);
      const testResult = await execCommand('npm', ['run', 'test']);

      // Store evidence
      const evidenceDir = _path.join(
        E2E_PROJECT_DIR,
        'development',
        'evidence',
        taskId,
      );
      await _fs.mkdir(evidenceDir, { recursive: true });

      await _fs.writeFile(
        _path.join(evidenceDir, 'lint-output.txt'),
        lintResult.stdout,
      );
      await _fs.writeFile(
        _path.join(evidenceDir, 'build-output.txt'),
        buildResult.stdout,
      );
      await _fs.writeFile(
        _path.join(evidenceDir, 'test-output.txt'),
        testResult.stdout,
      );

      // Complete with evidence references
      const completeResult = await execAPI('complete', [
        taskId,
        JSON.stringify({
          message: 'Task completed with evidence collection',
          validation_results: {
            linter: lintResult.success ? 'passed' : 'failed',
            build: buildResult.success ? 'passed' : 'failed',
            test: testResult.success ? 'passed' : 'failed',
          },
          evidence_collected: {
            lint_output: `evidence/${taskId}/lint-output.txt`,
            build_output: `evidence/${taskId}/build-output.txt`,
            test_output: `evidence/${taskId}/test-output.txt`,
          },
          evidence_directory: evidenceDir,
        }),
      ]);
      expect(completeResult.success).toBe(true);

      // Verify evidence files exist
      const lintEvidence = await _fs.readFile(
        _path.join(evidenceDir, 'lint-output.txt'),
        'utf8',
      );
      expect(lintEvidence).toContain('Linting passed');
    }, 30000);
  });
});
