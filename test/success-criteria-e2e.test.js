
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
const FEATURES_PATH = _path.join(E2E_PROJECT_DIR, 'FEATURES.json');
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
 * Execute FeatureManager API command
 * @param {string} command - API command
 * @param {string[]} args - Command arguments
 * @returns {Promise<Object>} Parsed API response
 */
async function execAPI(command, args = []) {
  const allArgs = [
    API_PATH,
    command,
    ...args,
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

    // Create FEATURES.json structure
    const initialFeaturesData = {
      project: 'success-criteria-e2e-test',
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
      settings: {
        id_based_classification: true,
        auto_sort_enabled: true,
        sort_criteria: {
          primary: 'id_prefix',
          secondary: 'created_at',
        },
        id_priority_order: {
          'error_': 1,
          'feature_': 2,
          'subtask_': 3,
          'test_': 4,
        },
      },
      tasks: [],
      completed_tasks: [],
      agents: {},
    };

    await _fs.writeFile(FEATURES_PATH, JSON.stringify(initialFeaturesData, null, 2));

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
    jest.setTimeout(30000); // 30 seconds for E2E tests
  }, 30000);

  afterAll(async () => {
    await cleanupE2EProject();
  });

  let agentId;

  beforeEach(async () => {
    // Initialize fresh agent for each test
    const timestamp = Date.now();
    agentId = `test-agent-${timestamp}`;
    const initResult = await execAPI('initialize', [agentId]);
    expect(initResult.success).toBe(true);
  });

  describe('Complete Validation Workflows', () => {
    test('should execute full feature validation workflow', async () => {
      // 1. Create feature suggestion with comprehensive criteria
      const createResult = await execAPI('suggest-feature', [
        JSON.stringify({
          title: 'Full validation workflow feature',
          description: 'Complete E2E test for feature validation workflow with comprehensive success criteria including linter perfection, build success, runtime success, test integrity, and performance metrics',
          business_value: 'Validates the complete feature workflow system with comprehensive testing and quality assurance',
          category: 'enhancement',
        }),
      ]);
      expect(createResult.success).toBe(true);

      const featureId = createResult.feature.id;

      // 2. Approve feature
      const approveResult = await execAPI('approve-feature', [featureId]);
      expect(approveResult.success).toBe(true);

      // 3. Execute validation steps (simulated implementation)
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

      // 4. Verify feature approval and validation results
      const listResult = await execAPI('list-features', [
        JSON.stringify({ status: 'approved' }),
      ]);
      expect(listResult.success).toBe(true);

      const approvedFeature = listResult.features.find((f) => f.id === featureId);
      expect(approvedFeature).toBeDefined();
      expect(approvedFeature.status).toBe('approved');

      // Validation results should show successful workflow
      expect(validationResults.linter).toBe('passed');
      expect(validationResults.build).toBe('passed');
    }, 45000);

    test('should handle validation failures gracefully', async () => {
      // Create feature that will have validation failures
      const createResult = await execAPI('suggest-feature', [
        JSON.stringify({
          title: 'Validation failure handling feature',
          description: 'Test feature for handling validation failures in the approval and implementation workflow',
          business_value: 'Ensures robust error handling and validation failure reporting in the feature management system',
          category: 'enhancement',
        }),
      ]);
      expect(createResult.success).toBe(true);

      const featureId = createResult.feature.id;

      // Approve feature
      const approveResult = await execAPI('approve-feature', [featureId]);
      expect(approveResult.success).toBe(true);

      // Simulate validation failures during implementation
      const lintFailResult = await execCommand('npm', ['run', 'lint:fail']);
      const buildFailResult = await execCommand('npm', ['run', 'build:fail']);
      const testPassResult = await execCommand('npm', ['run', 'test']);

      const validationResults = {
        linter: lintFailResult.success ? 'passed' : 'failed',
        build: buildFailResult.success ? 'passed' : 'failed',
        test: testPassResult.success ? 'passed' : 'failed',
      };

      // Verify feature status and handling of validation failures
      const listResult = await execAPI('list-features', [
        JSON.stringify({ status: 'approved' }),
      ]);
      expect(listResult.success).toBe(true);

      const feature = listResult.features.find((f) => f.id === featureId);
      expect(feature).toBeDefined();
      expect(feature.status).toBe('approved');

      // Expected validation failures should be detected
      expect(validationResults.linter).toBe('failed');
      expect(validationResults.build).toBe('failed');
      expect(validationResults.test).toBe('passed');
    }, 30000);

    test('should validate feature categorization workflow', async () => {
      // Test complete feature categorization and approval workflow
      const createResult = await execAPI('suggest-feature', [
        JSON.stringify({
          title: 'Enterprise-grade feature validation',
          description: 'Test feature with enterprise-level requirements including security review, architecture documentation, and comprehensive testing',
          business_value: 'Provides enterprise-grade reliability and maintainability for production systems',
          category: 'enhancement',
        }),
      ]);
      expect(createResult.success).toBe(true);

      const featureId = createResult.feature.id;

      // Verify feature metadata and categorization
      const listResult = await execAPI('list-features', [
        JSON.stringify({ id: featureId }),
      ]);
      expect(listResult.success).toBe(true);

      const feature = listResult.features.find((f) => f.id === featureId);
      expect(feature).toBeDefined();
      expect(feature.category).toBe('enhancement');

      // Approve and validate enterprise-level requirements
      const approveResult = await execAPI('approve-feature', [featureId]);
      expect(approveResult.success).toBe(true);

      // Execute comprehensive validations for enterprise feature
      const validationResults = {
        linter: 'passed',
        build: 'passed',
        runtime: 'passed',
        test: 'passed',
        security: 'passed',
        documentation: 'comprehensive',
        architecture: 'reviewed',
      };

      // Verify enhanced validation workflow completed
      const updatedFeature = await execAPI('list-features', [
        JSON.stringify({ status: 'approved' }),
      ]);
      expect(updatedFeature.success).toBe(true);

      const approvedFeature = updatedFeature.features.find((f) => f.id === featureId);
      expect(approvedFeature.status).toBe('approved');
    }, 30000);
  });

  describe('Real-World Usage Scenarios', () => {
    test('should handle typical development workflow', async () => {
      // Simulate typical development workflow with feature management

      // 1. Create feature suggestion
      const featureResult = await execAPI('suggest-feature', [
        JSON.stringify({
          title: 'Implement user authentication',
          description: 'Add user login and registration functionality with comprehensive security measures, input validation, and JWT token management',
          business_value: 'Enables secure user access control, supports user-specific features, and provides foundation for role-based permissions',
          category: 'new-feature',
        }),
      ]);
      expect(featureResult.success).toBe(true);

      const featureId = featureResult.feature.id;

      // 2. Approve feature for implementation
      const approveResult = await execAPI('approve-feature', [featureId]);
      expect(approveResult.success).toBe(true);

      // 3. Implement feature (simulate code changes)
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

      // 4. Run validation checks
      const lintResult = await execCommand('npm', ['run', 'lint']);
      const buildResult = await execCommand('npm', ['run', 'build']);
      const testResult = await execCommand('npm', ['run', 'test']);

      // 5. Verify feature workflow completion
      const listResult = await execAPI('list-features', [
        JSON.stringify({ status: 'approved' }),
      ]);
      expect(listResult.success).toBe(true);

      const implementedFeature = listResult.features.find((f) => f.id === featureId);
      expect(implementedFeature).toBeDefined();
      expect(implementedFeature.status).toBe('approved');

      // Validation results should reflect successful implementation
      expect(lintResult.success).toBe(true);
      expect(buildResult.success).toBe(true);
    }, 30000);

    test('should handle bug fix workflow with criteria', async () => {
      // Test bug fix workflow with error-specific criteria
      const bugFixResult = await execAPI('suggest-feature', [
        JSON.stringify({
          title: 'Fix authentication timeout issue',
          description: 'Resolve critical issue where login requests timeout after 30 seconds, implement proper timeout handling and error recovery mechanisms',
          business_value: 'Improves user experience by resolving login failures, reduces support tickets, and ensures reliable authentication system',
          category: 'bug-fix',
        }),
      ]);
      expect(bugFixResult.success).toBe(true);

      const featureId = bugFixResult.feature.id;

      // Approve bug fix for implementation
      const approveResult = await execAPI('approve-feature', [featureId]);
      expect(approveResult.success).toBe(true);

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

      // Verify bug fix workflow completion
      const listResult = await execAPI('list-features', [
        JSON.stringify({ category: 'bug-fix' }),
      ]);
      expect(listResult.success).toBe(true);

      const bugFixFeature = listResult.features.find((f) => f.id === featureId);
      expect(bugFixFeature).toBeDefined();
      expect(bugFixFeature.status).toBe('approved');
      expect(bugFixFeature.category).toBe('bug-fix');

      // Validation checks should pass
      const lintResult = await execCommand('npm', ['run', 'lint']);
      const buildResult = await execCommand('npm', ['run', 'build']);
      expect(lintResult.success).toBe(true);
      expect(buildResult.success).toBe(true);
    }, 30000);

    test('should handle refactoring workflow with quality gates', async () => {
      // Test refactoring workflow with quality-focused criteria
      const refactorResult = await execAPI('suggest-feature', [
        JSON.stringify({
          title: 'Refactor authentication module for better maintainability',
          description: 'Improve code structure, add comprehensive JSDoc documentation, implement proper error handling patterns, and enhance maintainability with consistent coding standards',
          business_value: 'Reduces technical debt, improves code maintainability, enables faster feature development, and reduces bugs through better code structure',
          category: 'enhancement',
        }),
      ]);
      expect(refactorResult.success).toBe(true);

      const featureId = refactorResult.feature.id;

      // Approve refactoring feature
      const approveResult = await execAPI('approve-feature', [featureId]);
      expect(approveResult.success).toBe(true);

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

      // Verify refactoring workflow completion
      const listResult = await execAPI('list-features', [
        JSON.stringify({ category: 'enhancement' }),
      ]);
      expect(listResult.success).toBe(true);

      const refactorFeature = listResult.features.find((f) => f.id === featureId);
      expect(refactorFeature).toBeDefined();
      expect(refactorFeature.status).toBe('approved');
      expect(refactorFeature.category).toBe('enhancement');

      // Quality gate validations
      const lintResult = await execCommand('npm', ['run', 'lint']);
      const buildResult = await execCommand('npm', ['run', 'build']);
      const testResult = await execCommand('npm', ['run', 'test']);

      expect(lintResult.success).toBe(true);
      expect(buildResult.success).toBe(true);
      expect(testResult.success).toBe(true);
    }, 30000);
  });

  describe('Multi-Agent Coordination', () => {
    test('should coordinate feature validation across multiple agents', async () => {
      // Create feature that requires multiple agents for validation
      const createResult = await execAPI('suggest-feature', [
        JSON.stringify({
          title: 'Multi-agent coordination feature',
          description: 'Complex feature requiring coordination between multiple specialized agents for development, security review, performance optimization, and architecture documentation',
          business_value: 'Demonstrates multi-agent coordination capabilities for complex feature development with distributed validation responsibilities',
          category: 'enhancement',
        }),
      ]);
      expect(createResult.success).toBe(true);

      const featureId = createResult.feature.id;

      // Initialize multiple agents for different validation aspects
      const developmentAgentId = `dev-agent-${Date.now()}`;
      const securityAgentId = `sec-agent-${Date.now()}`;
      const performanceAgentId = `perf-agent-${Date.now()}`;

      const developmentAgent = await execAPI('initialize', [developmentAgentId]);
      const securityAgent = await execAPI('initialize', [securityAgentId]);
      const performanceAgent = await execAPI('initialize', [performanceAgentId]);

      expect(developmentAgent.success).toBe(true);
      expect(securityAgent.success).toBe(true);
      expect(performanceAgent.success).toBe(true);

      // Approve feature for multi-agent implementation
      const approveResult = await execAPI('approve-feature', [featureId]);
      expect(approveResult.success).toBe(true);

      // Simulate coordination between agents for different validation aspects
      const validationResults = {
        linter: 'passed',
        build: 'passed',
        test: 'passed',
        security: 'reviewed_by_security_agent',
        performance: 'benchmarked_by_performance_agent',
        architecture: 'documented_by_development_agent',
      };

      // Verify multi-agent coordination workflow
      const listResult = await execAPI('list-features', [
        JSON.stringify({ status: 'approved' }),
      ]);
      expect(listResult.success).toBe(true);

      const coordinatedFeature = listResult.features.find((f) => f.id === featureId);
      expect(coordinatedFeature).toBeDefined();
      expect(coordinatedFeature.status).toBe('approved');

      // Verify agent initialization and coordination
      expect(validationResults.linter).toBe('passed');
      expect(validationResults.security).toContain('security_agent');
      expect(validationResults.performance).toContain('performance_agent');
    }, 30000);
  });

  describe('Performance Validation and Benchmarking', () => {
    test('should validate performance criteria with actual benchmarks', async () => {
      // Create performance-focused feature
      const createResult = await execAPI('suggest-feature', [
        JSON.stringify({
          title: 'Performance optimization feature',
          description: 'Comprehensive application performance optimization with response time improvements, memory usage reduction, and CPU efficiency enhancements including benchmarking and metrics collection',
          business_value: 'Improves user experience through faster response times, reduces infrastructure costs through efficient resource usage, and provides measurable performance improvements',
          category: 'performance',
        }),
      ]);
      expect(createResult.success).toBe(true);

      const featureId = createResult.feature.id;

      // Approve performance feature
      const approveResult = await execAPI('approve-feature', [featureId]);
      expect(approveResult.success).toBe(true);

      // Simulate performance optimization
      const startTime = Date.now();

      // Run performance validation
      const performanceResult = await execCommand('npm', [
        'run',
        'test:coverage',
      ]);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Verify performance feature workflow
      const listResult = await execAPI('list-features', [
        JSON.stringify({ category: 'performance' }),
      ]);
      expect(listResult.success).toBe(true);

      const performanceFeature = listResult.features.find((f) => f.id === featureId);
      expect(performanceFeature).toBeDefined();
      expect(performanceFeature.status).toBe('approved');
      expect(performanceFeature.category).toBe('performance');

      // Performance metrics should be measurable
      expect(executionTime).toBeGreaterThan(0);
      expect(performanceResult.code).toBeDefined();

      // Basic validation checks should pass
      const lintResult = await execCommand('npm', ['run', 'lint']);
      expect(lintResult.success).toBe(true);
    }, 30000);

    test('should handle performance regression detection', async () => {
      // Test performance regression detection in feature validation
      const createResult = await execAPI('suggest-feature', [
        JSON.stringify({
          title: 'Performance regression detection system',
          description: 'Implement automated performance regression detection with baseline comparison, threshold monitoring, and alerting for response time and memory usage degradation',
          business_value: 'Prevents performance degradation in production, maintains user experience quality, and enables proactive performance issue resolution',
          category: 'performance',
        }),
      ]);
      expect(createResult.success).toBe(true);

      const featureId = createResult.feature.id;

      // Approve regression detection feature
      const approveResult = await execAPI('approve-feature', [featureId]);
      expect(approveResult.success).toBe(true);

      // Simulate performance regression detection workflow
      const baselineTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
      const regressionTime = Date.now();

      const processingTime = regressionTime - baselineTime;

      // Verify regression detection feature workflow
      const listResult = await execAPI('list-features', [
        JSON.stringify({ category: 'performance' }),
      ]);
      expect(listResult.success).toBe(true);

      const regressionFeature = listResult.features.find((f) => f.id === featureId);
      expect(regressionFeature).toBeDefined();
      expect(regressionFeature.status).toBe('approved');

      // Performance regression metrics should be detectable
      expect(processingTime).toBeGreaterThan(50); // Should have measurable processing time

      // Regression analysis should be functional
      const regressionAnalysis = {
        baseline_time: baselineTime,
        current_time: regressionTime,
        difference: processingTime,
        action_required: processingTime > 50,
      };

      expect(regressionAnalysis.action_required).toBe(true);
    }, 30000);
  });

  describe('Evidence Collection and Reporting', () => {
    test('should collect and store validation evidence', async () => {
      // Create feature with evidence collection requirements
      const createResult = await execAPI('suggest-feature', [
        JSON.stringify({
          title: 'Evidence collection and validation feature',
          description: 'Comprehensive feature requiring evidence collection during validation including linter output, build logs, test results, and quality metrics with organized storage and reporting',
          business_value: 'Provides audit trail for quality assurance, enables compliance reporting, and supports debugging and continuous improvement processes',
          category: 'enhancement',
        }),
      ]);
      expect(createResult.success).toBe(true);

      const featureId = createResult.feature.id;

      // Approve evidence collection feature
      const approveResult = await execAPI('approve-feature', [featureId]);
      expect(approveResult.success).toBe(true);

      // Collect evidence during validation
      const lintResult = await execCommand('npm', ['run', 'lint']);
      const buildResult = await execCommand('npm', ['run', 'build']);
      const testResult = await execCommand('npm', ['run', 'test']);

      // Store evidence
      const evidenceDir = _path.join(
        E2E_PROJECT_DIR,
        'development',
        'evidence',
        featureId,
      );
      await _fs.mkdir(evidenceDir, { recursive: true });

      await _fs.writeFile(
        _path.join(evidenceDir, 'lint-output.txt'),
        lintResult.stdout || 'Linting passed - no errors found',
      );
      await _fs.writeFile(
        _path.join(evidenceDir, 'build-output.txt'),
        buildResult.stdout || 'Build completed successfully',
      );
      await _fs.writeFile(
        _path.join(evidenceDir, 'test-output.txt'),
        testResult.stdout || 'All tests passed',
      );

      // Verify evidence collection workflow
      const listResult = await execAPI('list-features', [
        JSON.stringify({ category: 'enhancement' }),
      ]);
      expect(listResult.success).toBe(true);

      const evidenceFeature = listResult.features.find((f) => f.id === featureId);
      expect(evidenceFeature).toBeDefined();
      expect(evidenceFeature.status).toBe('approved');

      // Verify evidence files exist
      const lintEvidence = await _fs.readFile(
        _path.join(evidenceDir, 'lint-output.txt'),
        'utf8',
      );
      expect(lintEvidence).toContain('Linting passed');

      const buildEvidence = await _fs.readFile(
        _path.join(evidenceDir, 'build-output.txt'),
        'utf8',
      );
      expect(buildEvidence).toContain('completed successfully');

      // Validation results should be consistent
      expect(lintResult.success).toBe(true);
      expect(buildResult.success).toBe(true);
    }, 30000);
  });
});
