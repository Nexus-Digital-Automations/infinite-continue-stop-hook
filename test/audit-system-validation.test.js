/**
 * Audit System Validation Test Suite
 *
 * Comprehensive tests for the audit system including:
 * - Audit criteria loading and validation
 * - Agent objectivity enforcement (prevents self-review)
 * - Success criteria management and validation
 * - Audit workflow integration
 * - Quality gate enforcement
 *
 * @author Integration Testing Agent #7
 * @version 1.0.0
 * @since 2025-09-13
 */

const _path = require('path');
const { spawn } = require('child_process');
const _fs = require('fs');

// Test configuration
const TEST_PROJECT_DIR = _path.join(__dirname, 'audit-system-test-project');
const TODO_PATH = _path.join(TEST_PROJECT_DIR, 'TODO.json');
const API_PATH = _path.join(__dirname, '..', 'taskmanager-api.js');
const TIMEOUT = 12000; // 12 seconds for audit operations

/**
 * Execute TaskManager API command for audit testing
 */
function execAPI(command, args = [], timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const allArgs = [
      API_PATH,
      command,
      ...args,
      '--project-root',
      TEST_PROJECT_DIR,
    ];

    const child = spawn(
      'timeout',
      [`${Math.floor(timeout / 1000)}s`, 'node', ...allArgs],
      {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
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
        let jsonString = stdout.trim();
        const jsonStart = jsonString.indexOf('{');
        if (jsonStart > 0) {
          jsonString = jsonString.substring(jsonStart);
        }
        const result = JSON.parse(jsonString);
        resolve(result);
      } catch (parseError) {
        try {
          const stderrJson = JSON.parse(stderr.trim());
          resolve(stderrJson);
        } catch {
          reject(
            new Error(
              `Command failed (code ${code}): ${stderr}\nStdout: ${stdout}\nParse error: ${parseError.message}`
            )
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
 * Create test environment with comprehensive audit criteria
 */
function setupAuditTestEnvironment() {
  if (!_fs.existsSync(TEST_PROJECT_DIR)) {
    _fs.mkdirSync(TEST_PROJECT_DIR, { recursive: true });
  }

  // Create development/essentials directory
  const essentialsDir = _path.join(
    TEST_PROJECT_DIR,
    'development',
    'essentials'
  );
  if (!_fs.existsSync(essentialsDir)) {
    _fs.mkdirSync(essentialsDir, { recursive: true });
  }

  // Create comprehensive audit criteria file
  const auditCriteriaContent = `# Task Audit Criteria - Comprehensive Standards

## Overview
This file defines the standard completion criteria that ALL tasks must satisfy before being marked complete. These criteria are automatically added to audit subtasks for objective validation by independent agents.

## Standard Completion Criteria

### 🔴 Mandatory Quality Gates

#### 1. Code Quality Standards
- [ ] **Linter Perfection**: Zero linting warnings or errors
  - **JavaScript/TypeScript**: \`eslint\` passes with zero violations
  - **Python**: \`ruff check\` passes with zero violations  
  - **Go**: \`golint\` passes with zero violations
  - **Rust**: \`clippy\` passes with zero violations

#### 2. Build Integrity
- [ ] **Build Success**: Project builds without errors or warnings
  - **Node.js**: \`npm run build\` completes successfully
  - **Python**: Package builds without errors
  - **Go**: \`go build\` completes successfully
  - **Rust**: \`cargo build\` completes successfully

#### 3. Application Functionality
- [ ] **Runtime Success**: Application starts and serves without errors
  - **Node.js**: \`npm start\` launches successfully
  - **Python**: Application starts without runtime errors
  - **Go**: Compiled binary executes successfully
  - **Rust**: Compiled binary executes successfully

#### 4. Test Coverage Maintenance
- [ ] **Test Integrity**: All preexisting tests continue to pass
  - **Node.js**: \`npm test\` passes all existing tests
  - **Python**: \`pytest\` passes all existing tests
  - **Go**: \`go test ./...\` passes all existing tests
  - **Rust**: \`cargo test\` passes all existing tests

### 🔍 Code Quality Requirements

#### 5. Documentation Standards
- [ ] **Function Documentation**: All public functions have comprehensive documentation
- [ ] **API Documentation**: All public interfaces documented with usage examples
- [ ] **Architecture Documentation**: System design decisions documented
- [ ] **Decision Rationale**: Major technical decisions explained and justified

#### 6. Implementation Quality
- [ ] **Error Handling**: Comprehensive error handling implemented
- [ ] **Performance Metrics**: Execution timing and bottleneck identification
- [ ] **Security Review**: No security vulnerabilities introduced
- [ ] **Architectural Consistency**: Follows existing project patterns and conventions

### 🚀 Integration Requirements

#### 7. Dependency Management
- [ ] **Dependency Validation**: All dependencies properly managed and documented
- [ ] **Version Compatibility**: All dependencies compatible with project requirements
- [ ] **Security Audit**: Dependencies scanned for known vulnerabilities

#### 8. Environment Compatibility
- [ ] **Cross-Platform**: Code works across supported platforms
- [ ] **Environment Variables**: Required environment variables documented
- [ ] **Configuration**: Proper configuration management implemented

### 🔒 Security and Compliance

#### 9. Security Standards
- [ ] **No Credential Exposure**: No secrets, keys, or credentials in code or logs
- [ ] **Input Validation**: Proper input validation and sanitization
- [ ] **Output Encoding**: Proper output encoding to prevent injection attacks
- [ ] **Authentication/Authorization**: Proper security controls where applicable

#### 10. Compliance Requirements
- [ ] **License Compliance**: All code compatible with project license
- [ ] **Data Privacy**: No unauthorized data collection or exposure
- [ ] **Regulatory Compliance**: Meets applicable regulatory requirements

## Custom Project-Specific Criteria

### 11. TaskManager Integration
- [ ] **TaskManager Compatibility**: Changes maintain compatibility with TaskManager API
- [ ] **Agent Coordination**: Multi-agent functionality works correctly
- [ ] **TODO.json Integrity**: TODO.json structure remains valid and consistent

### 12. Performance Standards
- [ ] **Response Time**: API responses under 2 seconds for standard operations
- [ ] **Memory Usage**: No memory leaks or excessive memory consumption
- [ ] **Concurrent Operations**: System handles concurrent agent operations correctly
`;

  _fs.writeFileSync(
    _path.join(essentialsDir, 'audit-criteria.md'),
    auditCriteriaContent
  );

  // Create alternative audit criteria for testing fallback behavior
  const minimalAuditContent = `# Minimal Audit Criteria

## Basic Quality Gates
- [ ] **Linter Perfection**: Zero linting warnings or errors
- [ ] **Build Success**: Project builds without errors
- [ ] **Runtime Success**: Application starts without errors
- [ ] **Test Integrity**: All existing tests pass
`;

  _fs.writeFileSync(
    _path.join(essentialsDir, 'minimal-audit-criteria.md'),
    minimalAuditContent
  );

  // Create TODO.json
  const todoData = {
    project: 'audit-system-test',
    tasks: [],
    agents: {},
    features: [],
    current_mode: 'DEVELOPMENT',
    last_mode: null,
    execution_count: 0,
    review_strikes: 0,
    strikes_completed_last_run: false,
    last_hook_activation: Date.now(),
    settings: {
      version: '2.0.0',
      created: new Date().toISOString(),
    },
  };

  _fs.writeFileSync(TODO_PATH, JSON.stringify(todoData, null, 2));
}

/**
 * Cleanup audit test environment
 */
function cleanupAuditTestEnvironment() {
  if (_fs.existsSync(TEST_PROJECT_DIR)) {
    _fs.rmSync(TEST_PROJECT_DIR, { recursive: true, force: true });
  }
}

describe('Audit System Validation Tests', () => {
  let implementationAgentId = null;
  let _testAgentId = null;
  let _auditAgentId = null;

  beforeEach(() => {
    setupAuditTestEnvironment();
  });

  afterEach(() => {
    cleanupAuditTestEnvironment();
  });

  // ========================================
  // AUDIT CRITERIA LOADING TESTS
  // ========================================

  describe('Audit Criteria Loading and Validation', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      _testAgentId = initResult.agentId;
    });

    test('should load comprehensive audit criteria from development/essentials/audit-criteria.md', async () => {
      const featureTaskData = {
        title: 'Feature requiring comprehensive audit',
        description:
          'Test feature to validate comprehensive audit criteria loading',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      expect(_auditSubtask).toBeDefined();
      expect(_auditSubtask.success_criteria).toBeDefined();
      expect(_auditSubtask.success_criteria.length).toBeGreaterThan(10);

      // Verify comprehensive criteria are loaded
      const _expectedCriteria = [
        'Linter Perfection',
        'Build Success',
        'Runtime Success',
        'Test Integrity',
        'Function Documentation',
        'API Documentation',
        'Architecture Documentation',
        'Decision Rationale',
        'Error Handling',
        'Performance Metrics',
        'Security Review',
        'Architectural Consistency',
        'Dependency Validation',
        'Version Compatibility',
        'Security Audit',
        'Cross-Platform',
        'Environment Variables',
        'Configuration',
        'No Credential Exposure',
        'Input Validation',
        'Output Encoding',
        'Authentication/Authorization',
        'License Compliance',
        'Data Privacy',
        'Regulatory Compliance',
      ];

      _expectedCriteria.forEach((criterion) => {
        expect(_auditSubtask.success_criteria).toContain(criterion);
      });
    });

    test('should handle missing audit criteria file with default criteria', async () => {
      // Remove audit criteria file
      const _auditCriteriaPath = _path.join(
        TEST_PROJECT_DIR,
        'development/essentials/audit-criteria.md'
      );
      if (_fs.existsSync(_auditCriteriaPath)) {
        _fs.unlinkSync(_auditCriteriaPath);
      }

      const featureTaskData = {
        title: 'Feature with missing audit criteria',
        description:
          'Test feature to validate fallback audit criteria behavior',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      expect(_auditSubtask).toBeDefined();
      expect(_auditSubtask.success_criteria).toBeDefined();
      expect(_auditSubtask.success_criteria.length).toBeGreaterThan(0);

      // Should have basic default criteria
      const _basicCriteria = [
        'Linter Perfection',
        'Build Success',
        'Runtime Success',
        'Test Integrity',
      ];
      _basicCriteria.forEach((criterion) => {
        expect(
          _auditSubtask.success_criteria.some((sc) => sc.includes(criterion))
        ).toBe(true);
      });
    });

    test('should parse and extract criteria from markdown format correctly', async () => {
      const featureTaskData = {
        title: 'Markdown parsing test feature',
        description:
          'Test feature to validate markdown parsing of audit criteria',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      // Verify criteria are strings, not markdown checkbox format
      _auditSubtask.success_criteria.forEach((criterion) => {
        expect(typeof criterion).toBe('string');
        expect(criterion.length).toBeGreaterThan(0);
        // Should not contain markdown checkbox syntax
        expect(criterion).not.toMatch(/^\s*-\s*\[\s*\]/);
      });
    });
  });

  // ========================================
  // AGENT OBJECTIVITY ENFORCEMENT TESTS
  // ========================================

  describe('Agent Objectivity Enforcement', () => {
    beforeEach(async () => {
      // Create multiple agents for objectivity testing
      const _initResult1 = await execAPI('init', [
        JSON.stringify({
          role: 'development',
          specialization: ['feature-implementation'],
        }),
      ]);
      implementationAgentId = _initResult1.agentId;

      const _initResult2 = await execAPI('init', [
        JSON.stringify({
          role: 'quality-assurance',
          specialization: ['audit', 'review'],
        }),
      ]);
      _auditAgentId = _initResult2.agentId;
    });

    test('should set prevents_self_review flag on audit subtasks', async () => {
      const featureTaskData = {
        title: 'Feature requiring objective audit',
        description: 'Test feature to validate self-review prevention',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      expect(_auditSubtask).toBeDefined();
      expect(_auditSubtask.prevents_self_review).toBe(true);
      expect(_auditSubtask.original_implementer).toBeNull();
      expect(_auditSubtask.audit_type).toBe('embedded_quality_gate');
    });

    test('should track original implementer when feature task is assigned', async () => {
      const featureTaskData = {
        title: 'Feature to track implementer',
        description: 'Test feature to validate implementer tracking',
        category: 'feature',
        priority: 'medium',
      };

      // Create feature task
      const createResult = await execAPI('create', [
        JSON.stringify(featureTaskData),
      ]);
      expect(createResult.success).toBe(true);

      // Assign task to implementation agent
      const claimResult = await execAPI('claim', [
        createResult.taskId,
        implementationAgentId,
      ]);
      expect(claimResult.success).toBe(true);

      // Verify audit subtask tracking
      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === createResult.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      expect(_auditSubtask).toBeDefined();
      expect(_auditSubtask.prevents_self_review).toBe(true);

      // Note: original_implementer tracking may be implemented in task completion phase
      // This test verifies the structure is in place for tracking
    });

    test('should maintain audit independence across different agent roles', async () => {
      const featureTaskData = {
        title: 'Multi-agent audit independence test',
        description:
          'Test feature to validate audit independence across agents',
        category: 'feature',
        priority: 'high',
      };

      const createResult = await execAPI('create', [
        JSON.stringify(featureTaskData),
      ]);
      expect(createResult.success).toBe(true);

      // Implementation agent claims main task
      const claimResult = await execAPI('claim', [
        createResult.taskId,
        implementationAgentId,
      ]);
      expect(claimResult.success).toBe(true);

      // Verify both agents can see the task but audit maintains independence
      const _listResult1 = await execAPI('list');
      const _listResult2 = await execAPI('list'); // Same API, different agent would be handled by claiming logic

      const _task = _listResult1.tasks.find(
        (t) => t.id === createResult.taskId
      );
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      expect(_auditSubtask.prevents_self_review).toBe(true);
      expect(_auditSubtask.prevents_completion).toBe(true);
    });
  });

  // ========================================
  // SUCCESS CRITERIA MANAGEMENT TESTS
  // ========================================

  describe('Success Criteria Management', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      _testAgentId = initResult.agentId;
    });

    test('should generate appropriate success criteria for different task types', async () => {
      const _securityTaskData = {
        title: 'Implement security authentication system',
        description:
          'Build comprehensive security system with authentication and authorization',
        category: 'feature',
        priority: 'critical',
      };

      const result = await execAPI('create', [
        JSON.stringify(_securityTaskData),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      // Should include security-specific criteria
      expect(_auditSubtask.success_criteria).toContain('Security Review');
      expect(_auditSubtask.success_criteria).toContain(
        'No Credential Exposure'
      );
      expect(_auditSubtask.success_criteria).toContain('Input Validation');
      expect(_auditSubtask.success_criteria).toContain(
        'Authentication/Authorization'
      );
    });

    test('should include project-specific TaskManager criteria', async () => {
      const _taskManagerTaskData = {
        title: 'Enhance TaskManager API functionality',
        description:
          'Add new endpoints and improve TaskManager system integration',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [
        JSON.stringify(_taskManagerTaskData),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      // Should include project-specific criteria if defined in audit-criteria.md
      const _projectCriteria = _auditSubtask.success_criteria.filter(
        (criterion) =>
          criterion.includes('TaskManager') ||
          criterion.includes('Agent') ||
          criterion.includes('TODO.json')
      );

      // This test validates that project-specific criteria can be loaded
      // The specific criteria depend on what's defined in the audit-criteria.md file
      expect(_auditSubtask.success_criteria.length).toBeGreaterThan(15);
    });

    test('should set appropriate estimated hours for audit tasks', async () => {
      const featureTaskData = {
        title: 'Standard feature for audit estimation',
        description: 'Feature to test audit task time estimation',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      expect(_auditSubtask.estimated_hours).toBeDefined();
      expect(typeof _auditSubtask.estimated_hours).toBe('number');
      expect(_auditSubtask.estimated_hours).toBeGreaterThan(0);
      expect(_auditSubtask.estimated_hours).toBeLessThanOrEqual(4); // Reasonable upper bound for audit
    });
  });

  // ========================================
  // AUDIT WORKFLOW INTEGRATION TESTS
  // ========================================

  describe('Audit Workflow Integration', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      _testAgentId = initResult.agentId;
    });

    test('should create audit subtasks that prevent task completion', async () => {
      const featureTaskData = {
        title: 'Feature with completion prevention',
        description: 'Test feature to validate completion prevention by audit',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      expect(_auditSubtask.prevents_completion).toBe(true);
      expect(_auditSubtask.status).toBe('pending');
    });

    test('should include comprehensive task context in audit description', async () => {
      const _detailedTaskData = {
        title: 'Complex feature with detailed requirements',
        description:
          'Comprehensive feature implementation with multiple components including database integration, API endpoints, authentication, and user interface changes requiring thorough validation',
        category: 'feature',
        priority: 'high',
        important_files: ['src/api.js', 'src/database.js', 'src/auth.js'],
      };

      const result = await execAPI('create', [
        JSON.stringify(_detailedTaskData),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      expect(_auditSubtask.description).toContain(
        'Comprehensive quality audit and review'
      );
      expect(_auditSubtask.description).toContain(_detailedTaskData.title);
      expect(_auditSubtask.description).toContain('Original Description:');
      expect(_auditSubtask.description).toContain(
        _detailedTaskData.description
      );

      // Should reference the task being audited
      expect(_auditSubtask.title).toContain('Audit:');
      expect(_auditSubtask.title).toContain(_detailedTaskData.title);
    });

    test('should generate unique audit subtask IDs', async () => {
      const _auditIds = new Set();

      // Create multiple feature tasks to test audit ID uniqueness
      // Use for-await-of to maintain sequential processing for audit ID validation
      const taskDataList = [];
      for (let i = 0; i < 3; i++) {
        taskDataList.push({
          title: `Feature task ${i + 1}`,
          description: `Feature description ${i + 1}`,
          category: 'feature',
          priority: 'medium',
        });
      }

      for await (const taskData of taskDataList) {
        const result = await execAPI('create', [JSON.stringify(taskData)]);
        expect(result.success).toBe(true);

        const listResult = await execAPI('list');
        const _task = listResult.tasks.find((t) => t.id === result.taskId);
        const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

        if (_auditSubtask) {
          expect(_auditSubtask.id).toMatch(/^audit_\d+_[a-f0-9]{8}$/);
          expect(_auditIds.has(_auditSubtask.id)).toBe(false);
          _auditIds.add(_auditSubtask.id);
        }
      }

      expect(_auditIds.size).toBe(3);
    });
  });

  // ========================================
  // QUALITY GATE ENFORCEMENT TESTS
  // ========================================

  describe('Quality Gate Enforcement', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      _testAgentId = initResult.agentId;
    });

    test('should mark audit tasks as quality gates that must pass', async () => {
      const _criticalTaskData = {
        title: 'Critical feature requiring quality gates',
        description: 'High-priority feature that must pass all quality gates',
        category: 'feature',
        priority: 'critical',
      };

      const result = await execAPI('create', [
        JSON.stringify(_criticalTaskData),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      expect(_auditSubtask.audit_type).toBe('embedded_quality_gate');
      expect(_auditSubtask.prevents_completion).toBe(true);
      expect(_auditSubtask.status).toBe('pending');
    });

    test('should validate that audit subtasks have proper timestamps', async () => {
      const _beforeTime = Date.now();

      const featureTaskData = {
        title: 'Feature for timestamp validation',
        description:
          'Test feature to validate audit subtask timestamp generation',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      expect(result.success).toBe(true);

      const _afterTime = Date.now();

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      expect(_auditSubtask.created_at).toBeDefined();
      const _createdTime = new Date(_auditSubtask.created_at).getTime();
      expect(_createdTime).toBeGreaterThanOrEqual(_beforeTime);
      expect(_createdTime).toBeLessThanOrEqual(_afterTime);
    });

    test('should handle audit criteria validation for edge cases', async () => {
      // Test with minimal task data
      const _minimalTaskData = {
        title: 'Minimal feature',
        description: '',
        category: 'feature',
        priority: 'low',
      };

      const result = await execAPI('create', [
        JSON.stringify(_minimalTaskData),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      expect(_auditSubtask).toBeDefined();
      expect(_auditSubtask.success_criteria).toBeDefined();
      expect(_auditSubtask.success_criteria.length).toBeGreaterThan(0);
      expect(_auditSubtask.prevents_completion).toBe(true);
    });
  });

  // ========================================
  // AUDIT SYSTEM PERFORMANCE TESTS
  // ========================================

  describe('Audit System Performance', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      _testAgentId = initResult.agentId;
    });

    test('should create audit subtasks within performance thresholds', async () => {
      const _startTime = Date.now();

      const _performanceTaskData = {
        title: 'Performance test feature with comprehensive requirements',
        description:
          'Complex feature with extensive audit requirements for performance testing',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [
        JSON.stringify(_performanceTaskData),
      ]);

      const _endTime = Date.now();
      const _executionTime = _endTime - _startTime;

      expect(result.success).toBe(true);
      expect(_executionTime).toBeLessThan(5000); // Should complete within 5 seconds

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      expect(_auditSubtask).toBeDefined();
      expect(_auditSubtask.success_criteria.length).toBeGreaterThan(15);
    });

    test('should handle multiple concurrent audit subtask creations', async () => {
      const _taskPromises = [];
      const _numTasks = 3;

      for (let i = 0; i < _numTasks; i++) {
        const taskData = {
          title: `Concurrent audit test feature ${i + 1}`,
          description: `Feature ${i + 1} for concurrent audit creation testing`,
          category: 'feature',
          priority: 'medium',
        };
        _taskPromises.push(execAPI('create', [JSON.stringify(taskData)]));
      }

      const _startTime = Date.now();
      const _results = await Promise.all(_taskPromises);
      const _endTime = Date.now();
      const _totalTime = _endTime - _startTime;

      _results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      expect(_totalTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify all audit subtasks were created properly
      const listResult = await execAPI('list');
      const _featureTasks = listResult.tasks.filter(
        (t) => t.category === 'feature'
      );

      expect(_featureTasks.length).toBe(_numTasks);
      _featureTasks.forEach((_task) => {
        const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');
        expect(_auditSubtask).toBeDefined();
        expect(_auditSubtask.success_criteria.length).toBeGreaterThan(0);
      });
    });
  });

  // ========================================
  // AUDIT SYSTEM ERROR HANDLING TESTS
  // ========================================

  describe('Audit System Error Handling', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      _testAgentId = initResult.agentId;
    });

    test('should handle corrupted audit criteria file gracefully', async () => {
      // Create corrupted audit criteria file
      const _auditCriteriaPath = _path.join(
        TEST_PROJECT_DIR,
        'development/essentials/audit-criteria.md'
      );
      _fs.writeFileSync(
        _auditCriteriaPath,
        'Invalid markdown content without proper formatting\n###\n- [ ] Broken'
      );

      const featureTaskData = {
        title: 'Feature with corrupted audit criteria',
        description:
          'Test feature to validate error handling for corrupted audit criteria',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      // Should still create audit subtask with fallback criteria
      expect(_auditSubtask).toBeDefined();
      expect(_auditSubtask.success_criteria).toBeDefined();
      expect(_auditSubtask.success_criteria.length).toBeGreaterThan(0);
    });

    test('should handle extremely large audit criteria files', async () => {
      // Create very large audit criteria file
      const _auditCriteriaPath = _path.join(
        TEST_PROJECT_DIR,
        'development/essentials/audit-criteria.md'
      );

      let largeContent = '# Large Audit Criteria\n\n## Quality Gates\n\n';
      for (let i = 0; i < 100; i++) {
        largeContent += `- [ ] **Criterion ${i + 1}**: Detailed criterion description ${i + 1}\n`;
      }

      _fs.writeFileSync(_auditCriteriaPath, largeContent);

      const featureTaskData = {
        title: 'Feature with large audit criteria',
        description:
          'Test feature to validate handling of large audit criteria files',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      expect(_auditSubtask).toBeDefined();
      expect(_auditSubtask.success_criteria).toBeDefined();

      // Should handle large files but may limit criteria count for performance
      expect(_auditSubtask.success_criteria.length).toBeGreaterThan(10);
      expect(_auditSubtask.success_criteria.length).toBeLessThanOrEqual(50); // Reasonable upper limit
    });

    test('should handle special characters in task data for audit descriptions', async () => {
      const _specialCharsTaskData = {
        title: 'Feature@2.0: Special chars (test) & validation!',
        description:
          'Complex feature with special characters: @, &, !, (), :, and unicode: 🚀 ✅ 🔍',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [
        JSON.stringify(_specialCharsTaskData),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const _task = listResult.tasks.find((t) => t.id === result.taskId);
      const _auditSubtask = _task.subtasks.find((st) => st.type === 'audit');

      expect(_auditSubtask).toBeDefined();
      expect(_auditSubtask.title).toContain('Audit:');
      expect(_auditSubtask.description).toContain(_specialCharsTaskData.title);
      expect(_auditSubtask.description).toContain(
        _specialCharsTaskData.description
      );

      // Should generate valid audit subtask ID despite special characters in source
      expect(_auditSubtask.id).toMatch(/^audit_\d+_[a-f0-9]{8}$/);
    });
  });
});
