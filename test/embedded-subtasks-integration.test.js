/**
 * Comprehensive Integration Test Suite for Embedded Subtasks System
 *
 * Tests all aspects of the embedded subtasks system including:
 * - Unit tests for embedded subtasks generation
 * - Integration tests for research and audit workflows
 * - API endpoint tests for subtasks operations
 * - Performance tests for embedded queries
 * - Security and validation tests
 *
 * This test suite validates the complete embedded subtasks functionality
 * including research task automation, audit system validation, and
 * multi-agent coordination for quality gates.
 *
 * @author Integration Testing Agent #7
 * @version 1.0.0
 * @since 2025-09-13
 */

const _fs = require('fs');
const _path = require('path');
const { spawn } = require('child_process');

// Test configuration
const TEST_PROJECT_DIR = _path.join(
  __dirname,
  'embedded-subtasks-test-project'
);
const TODO_PATH = _path.join(TEST_PROJECT_DIR, 'TODO.json');
const API_PATH = _path.join(__dirname, '..', 'taskmanager-api.js');
const TIMEOUT = 15000; // 15 seconds for API operations

/**
 * Execute TaskManager API command and return parsed result
 * @param {string} command - API command to execute
 * @param {string[]} args - Command arguments
 * @param {number} timeout - Command timeout in milliseconds
 * @returns {Promise<Object>} Parsed JSON response from API
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
      } catch (parseError) {
        // If JSON parsing fails, check if we can extract JSON from stderr
        try {
          const stderrJson = JSON.parse(stderr.trim());
          resolve(stderrJson);
        } catch {
          // If both fail, include raw output for debugging
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
 * Create a clean test TODO.json file with embedded subtasks support
 */
function createTestTodoFile() {
  // Create development/essentials directory
  const essentialsDir = _path.join(
    TEST_PROJECT_DIR,
    'development',
    'essentials'
  );
  if (!_fs.existsSync(essentialsDir)) {
    _fs.mkdirSync(essentialsDir, { recursive: true });
  }

  // Create audit criteria file for testing
  const auditCriteriaContent = `# Task Audit Criteria - Test Standards

## Standard Completion Criteria

### 🔴 Mandatory Quality Gates

#### 1. Code Quality Standards
- [ ] **Linter Perfection**: Zero linting warnings or errors
- [ ] **Build Success**: Project builds without errors or warnings
- [ ] **Runtime Success**: Application starts without errors
- [ ] **Test Integrity**: All preexisting tests continue to pass

#### 2. Implementation Quality
- [ ] **Function Documentation**: All public functions have comprehensive documentation
- [ ] **API Documentation**: All public interfaces documented with usage examples
- [ ] **Error Handling**: Comprehensive error handling implemented
- [ ] **Performance Metrics**: Execution timing and bottleneck identification
`;

  _fs.writeFileSync(
    _path.join(essentialsDir, 'audit-criteria.md'),
    auditCriteriaContent
  );

  const todoData = {
    project: 'embedded-subtasks-test',
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
  return todoData;
}

/**
 * Setup test environment before each test
 */
function setupTestEnvironment() {
  // Create test project directory
  if (!_fs.existsSync(TEST_PROJECT_DIR)) {
    _fs.mkdirSync(TEST_PROJECT_DIR, { recursive: true });
  }

  // Create clean TODO.json
  createTestTodoFile();
}

/**
 * Cleanup test environment after each test
 */
function cleanupTestEnvironment() {
  // Remove test project directory and all contents
  if (_fs.existsSync(TEST_PROJECT_DIR)) {
    _fs.rmSync(TEST_PROJECT_DIR, { recursive: true, force: true });
  }
}

describe('Embedded Subtasks System - Comprehensive Integration Tests', () => {
  let testAgentId = null;
  let testTaskId = null;
  let testFeatureTaskId = null;

  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  // ========================================
  // EMBEDDED SUBTASKS GENERATION TESTS
  // ========================================

  describe('Embedded Subtasks Generation', () => {
    beforeEach(async () => {
      // Initialize agent for task operations
      const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should auto-generate research and audit subtasks for complex feature tasks', async () => {
      const featureTaskData = {
        title: 'Implement authentication system with database integration',
        description:
          'Build comprehensive authentication system with security controls and database migration',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.taskId).toMatch(/^feature_\d+_\w+$/);

      testFeatureTaskId = result.taskId;

      // List tasks to verify subtasks were generated
      const listResult = await execAPI('list');
      const _createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );

      expect(_createdTask).toBeDefined();
      expect(_createdTask.subtasks).toBeDefined();
      expect(_createdTask.subtasks.length).toBeGreaterThan(0);

      // Verify research subtask was created
      const _researchSubtask = _createdTask.subtasks.find(
        (st) => st.type === 'research'
      );
      expect(_researchSubtask).toBeDefined();
      expect(_researchSubtask.id).toMatch(/^research_\d+_\w+$/);
      expect(_researchSubtask.title).toContain('Research:');
      expect(_researchSubtask.prevents_implementation).toBe(true);
      expect(_researchSubtask.research_locations).toBeDefined();
      expect(_researchSubtask.research_locations.length).toBeGreaterThan(0);

      // Verify audit subtask was created
      const _auditSubtask = _createdTask.subtasks.find(
        (st) => st.type === 'audit'
      );
      expect(_auditSubtask).toBeDefined();
      expect(_auditSubtask.id).toMatch(/^audit_\d+_\w+$/);
      expect(_auditSubtask.title).toContain('Audit:');
      expect(_auditSubtask.prevents_completion).toBe(true);
      expect(_auditSubtask.prevents_self_review).toBe(true);
      expect(_auditSubtask.success_criteria).toBeDefined();
      expect(_auditSubtask.success_criteria.length).toBeGreaterThan(0);
    });

    test('should generate only audit subtasks for simple feature tasks', async () => {
      const _simpleTaskData = {
        title: 'Update button color scheme',
        description:
          'Change primary button colors to match new brand guidelines',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(_simpleTaskData)]);

      expect(result.success).toBe(true);
      testFeatureTaskId = result.taskId;

      // List tasks to verify subtasks were generated
      const listResult = await execAPI('list');
      const _createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );

      expect(_createdTask).toBeDefined();
      expect(_createdTask.subtasks).toBeDefined();
      expect(_createdTask.subtasks.length).toBe(1); // Only audit subtask

      // Verify no research subtask was created
      const _researchSubtask = _createdTask.subtasks.find(
        (st) => st.type === 'research'
      );
      expect(_researchSubtask).toBeUndefined();

      // Verify audit subtask was created
      const _auditSubtask = _createdTask.subtasks.find(
        (st) => st.type === 'audit'
      );
      expect(_auditSubtask).toBeDefined();
      expect(_auditSubtask.prevents_completion).toBe(true);
    });

    test('should not generate subtasks for non-feature task categories', async () => {
      const _errorTaskData = {
        title: 'Fix critical ESLint violations',
        description: 'Resolve linting errors in authentication module',
        category: 'error',
        priority: 'critical',
      };

      const result = await execAPI('create', [JSON.stringify(_errorTaskData)]);

      expect(result.success).toBe(true);
      testTaskId = result.taskId;

      // List tasks to verify no subtasks were generated
      const listResult = await execAPI('list');
      const _createdTask = listResult.tasks.find((t) => t.id === testTaskId);

      expect(_createdTask).toBeDefined();
      expect(_createdTask.subtasks).toBeDefined();
      expect(_createdTask.subtasks.length).toBe(0);
    });

    test('should respect skip_embedded_subtasks flag', async () => {
      const featureTaskData = {
        title: 'Implement complex API integration',
        description: 'Build integration with third-party API service',
        category: 'feature',
        priority: 'high',
        skip_embedded_subtasks: true,
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);

      expect(result.success).toBe(true);
      testFeatureTaskId = result.taskId;

      // List tasks to verify no subtasks were generated
      const listResult = await execAPI('list');
      const _createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );

      expect(_createdTask).toBeDefined();
      expect(_createdTask.subtasks).toBeDefined();
      expect(_createdTask.subtasks.length).toBe(0);
    });
  });

  // ========================================
  // RESEARCH SYSTEM INTEGRATION TESTS
  // ========================================

  describe('Research System Integration', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should generate appropriate research locations for different task types', async () => {
      const _databaseTaskData = {
        title: 'Design database schema for user management',
        description:
          'Create tables and relationships for user authentication and profiles',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [
        JSON.stringify(_databaseTaskData),
      ]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const _createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );
      const _researchSubtask = _createdTask.subtasks.find(
        (st) => st.type === 'research'
      );

      expect(_researchSubtask).toBeDefined();
      expect(_researchSubtask.research_locations).toBeDefined();

      // Verify codebase research location
      const _codebaseLocation = _researchSubtask.research_locations.find(
        (loc) => loc.type === 'codebase'
      );
      expect(_codebaseLocation).toBeDefined();
      expect(_codebaseLocation.paths).toContain('/models');
      expect(_codebaseLocation.paths).toContain('/database');

      // Verify internet research location
      const _internetLocation = _researchSubtask.research_locations.find(
        (loc) => loc.type === 'internet'
      );
      expect(_internetLocation).toBeDefined();
      expect(_internetLocation.keywords).toContain('database');
      expect(_internetLocation.keywords).toContain('schema');

      // Verify documentation research location
      const _docsLocation = _researchSubtask.research_locations.find(
        (loc) => loc.type === 'documentation'
      );
      expect(_docsLocation).toBeDefined();
      expect(_docsLocation.sources).toContain('README.md');
    });

    test('should include comprehensive deliverables in research subtasks', async () => {
      const _apiTaskData = {
        title: 'Implement REST API endpoints',
        description:
          'Create comprehensive API with authentication and validation',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [JSON.stringify(_apiTaskData)]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const _createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );
      const _researchSubtask = _createdTask.subtasks.find(
        (st) => st.type === 'research'
      );

      expect(_researchSubtask.deliverables).toBeDefined();
      expect(_researchSubtask.deliverables).toContain(
        'Technical analysis report'
      );
      expect(_researchSubtask.deliverables).toContain(
        'Implementation recommendations'
      );
      expect(_researchSubtask.deliverables).toContain('Risk assessment');
      expect(_researchSubtask.deliverables).toContain(
        'Alternative approaches evaluation'
      );
    });

    test('should set prevents_implementation flag on research subtasks', async () => {
      const _complexTaskData = {
        title: 'Implement microservices architecture',
        description: 'Refactor monolith into distributed microservices',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [
        JSON.stringify(_complexTaskData),
      ]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const _createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );
      const _researchSubtask = _createdTask.subtasks.find(
        (st) => st.type === 'research'
      );

      expect(_researchSubtask.prevents_implementation).toBe(true);
      expect(_researchSubtask.status).toBe('pending');
    });
  });

  // ========================================
  // AUDIT SYSTEM VALIDATION TESTS
  // ========================================

  describe('Audit System Validation', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should load audit criteria from development/essentials/audit-criteria.md', async () => {
      const featureTaskData = {
        title: 'Add new feature with audit validation',
        description: 'Feature that should trigger audit subtask generation',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const _createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );
      const _auditSubtask = _createdTask.subtasks.find(
        (st) => st.type === 'audit'
      );

      expect(_auditSubtask).toBeDefined();
      expect(_auditSubtask.success_criteria).toBeDefined();
      expect(_auditSubtask.success_criteria.length).toBeGreaterThan(0);

      // Verify that standard criteria are loaded
      expect(_auditSubtask.success_criteria).toContain('Linter Perfection');
      expect(_auditSubtask.success_criteria).toContain('Build Success');
      expect(_auditSubtask.success_criteria).toContain('Runtime Success');
      expect(_auditSubtask.success_criteria).toContain('Test Integrity');
    });

    test('should set prevents_completion and prevents_self_review flags', async () => {
      const featureTaskData = {
        title: 'Feature requiring audit validation',
        description: 'Test feature for audit system validation',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const _createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );
      const _auditSubtask = _createdTask.subtasks.find(
        (st) => st.type === 'audit'
      );

      expect(_auditSubtask.prevents_completion).toBe(true);
      expect(_auditSubtask.prevents_self_review).toBe(true);
      expect(_auditSubtask.audit_type).toBe('embedded_quality_gate');
      expect(_auditSubtask.original_implementer).toBeNull();
    });

    test('should create comprehensive audit description with original task context', async () => {
      const featureTaskData = {
        title: 'Complex feature implementation',
        description:
          'Detailed implementation with multiple components and requirements',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const _createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );
      const _auditSubtask = _createdTask.subtasks.find(
        (st) => st.type === 'audit'
      );

      expect(_auditSubtask.description).toContain(
        'Comprehensive quality audit and review'
      );
      expect(_auditSubtask.description).toContain(featureTaskData.title);
      expect(_auditSubtask.description).toContain('Original Description:');
      expect(_auditSubtask.description).toContain(featureTaskData.description);
    });
  });

  // ========================================
  // API ENDPOINT TESTS
  // ========================================

  describe('Embedded Subtasks API Endpoints', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      // Create a feature task with embedded subtasks
      const featureTaskData = {
        title: 'API endpoint test feature',
        description: 'Feature for testing embedded subtasks API endpoints',
        category: 'feature',
        priority: 'medium',
      };
      const createResult = await execAPI('create', [
        JSON.stringify(featureTaskData),
      ]);
      testFeatureTaskId = createResult.taskId;
    });

    test('should list tasks with embedded subtasks information', async () => {
      const result = await execAPI('list');

      expect(result.success).toBe(true);
      expect(result.tasks.length).toBeGreaterThan(0);

      const _featureTask = result.tasks.find((t) => t.id === testFeatureTaskId);
      expect(_featureTask).toBeDefined();
      expect(_featureTask.subtasks).toBeDefined();
      expect(_featureTask.subtasks.length).toBeGreaterThan(0);

      // Verify subtasks have proper structure
      _featureTask.subtasks.forEach((subtask) => {
        expect(subtask.id).toBeDefined();
        expect(subtask.type).toBeDefined();
        expect(subtask.title).toBeDefined();
        expect(subtask.status).toBeDefined();
        expect(subtask.created_at).toBeDefined();
      });
    });

    test('should filter tasks by subtask properties', async () => {
      // This would test advanced filtering once implemented
      const result = await execAPI('list', [
        JSON.stringify({ has_research_subtasks: true }),
      ]);

      expect(result.success).toBe(true);
      // Tasks with research subtasks should be returned
      if (result.tasks.length > 0) {
        result.tasks.forEach((task) => {
          const hasResearch =
            task.subtasks && task.subtasks.some((st) => st.type === 'research');
          expect(hasResearch).toBe(true);
        });
      }
    });

    test('should provide subtask status in task statistics', async () => {
      const result = await execAPI('stats');

      expect(result.success).toBe(true);
      expect(result.statistics).toBeDefined();
      expect(result.statistics.tasks).toBeDefined();

      // Should include information about embedded subtasks
      const _taskStats = result.statistics.tasks;
      expect(_taskStats.total).toBeGreaterThan(0);
    });
  });

  // ========================================
  // PERFORMANCE TESTS
  // ========================================

  describe('Embedded Subtasks Performance', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should create tasks with embedded subtasks within performance thresholds', async () => {
      const _startTime = Date.now();

      const featureTaskData = {
        title: 'Performance test feature with complex requirements',
        description:
          'Complex feature implementation with database, API, and security requirements',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);

      const _endTime = Date.now();
      const _executionTime = _endTime - _startTime;

      expect(result.success).toBe(true);
      expect(_executionTime).toBeLessThan(5000); // Should complete within 5 seconds

      testFeatureTaskId = result.taskId;
    });

    test('should handle multiple concurrent task creations efficiently', async () => {
      const _taskPromises = [];
      const _numTasks = 5;

      for (let i = 0; i < _numTasks; i++) {
        const taskData = {
          title: `Concurrent test feature ${i + 1}`,
          description: `Feature ${i + 1} for concurrent creation testing`,
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
        expect(result.taskId).toBeDefined();
      });

      // Should complete all tasks within reasonable time
      expect(_totalTime).toBeLessThan(15000); // 15 seconds for 5 concurrent tasks
    });

    test('should efficiently query tasks with complex subtask structures', async () => {
      // Create several feature tasks with embedded subtasks
      // Create tasks in parallel for better performance since order doesn't matter for this test
      const taskCreationPromises = [];
      for (let i = 0; i < 3; i++) {
        const taskData = {
          title: `Query performance test feature ${i + 1}`,
          description:
            'Feature with complex subtask structure for query testing',
          category: 'feature',
          priority: 'medium',
        };
        taskCreationPromises.push(
          execAPI('create', [JSON.stringify(taskData)])
        );
      }
      await Promise.all(taskCreationPromises);

      const _startTime = Date.now();
      const result = await execAPI('list');
      const _endTime = Date.now();
      const _queryTime = _endTime - _startTime;

      expect(result.success).toBe(true);
      expect(result.tasks.length).toBeGreaterThanOrEqual(3);
      expect(_queryTime).toBeLessThan(3000); // Should query within 3 seconds

      // Verify all tasks have their subtasks properly loaded
      result.tasks.forEach((task) => {
        if (task.category === 'feature') {
          expect(task.subtasks).toBeDefined();
        }
      });
    });
  });

  // ========================================
  // ERROR HANDLING AND EDGE CASES
  // ========================================

  describe('Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should handle missing audit criteria file gracefully', async () => {
      // Remove audit criteria file
      const _auditCriteriaPath = _path.join(
        TEST_PROJECT_DIR,
        'development/essentials/audit-criteria.md'
      );
      if (_fs.existsSync(_auditCriteriaPath)) {
        _fs.unlinkSync(_auditCriteriaPath);
      }

      const featureTaskData = {
        title: 'Feature without audit criteria file',
        description: 'Test fallback behavior when audit criteria is missing',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);

      expect(result.success).toBe(true);
      testFeatureTaskId = result.taskId;

      // Task should still be created with default audit criteria
      const listResult = await execAPI('list');
      const _createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );

      expect(_createdTask).toBeDefined();
      expect(_createdTask.subtasks).toBeDefined();

      const _auditSubtask = _createdTask.subtasks.find(
        (st) => st.type === 'audit'
      );
      expect(_auditSubtask).toBeDefined();
      expect(_auditSubtask.success_criteria).toBeDefined();
    });

    test('should handle malformed embedded subtasks data', async () => {
      const _taskDataWithInvalidSubtasks = {
        title: 'Task with malformed subtasks',
        description: 'Test task with invalid subtasks structure',
        category: 'feature',
        priority: 'medium',
        subtasks: 'invalid_subtasks_data', // Should be an array
      };

      const result = await execAPI('create', [
        JSON.stringify(_taskDataWithInvalidSubtasks),
      ]);

      // Should either succeed with corrected data or fail gracefully
      if (result.success) {
        testFeatureTaskId = result.taskId;

        const listResult = await execAPI('list');
        const _createdTask = listResult.tasks.find(
          (t) => t.id === testFeatureTaskId
        );

        expect(_createdTask.subtasks).toBeDefined();
        expect(Array.isArray(_createdTask.subtasks)).toBe(true);
      } else {
        expect(result.error).toBeDefined();
        expect(result.error).toContain('subtasks');
      }
    });

    test('should handle extremely long task titles and descriptions', async () => {
      const _longTitle = 'A'.repeat(1000); // 1000 character title
      const _longDescription = 'B'.repeat(5000); // 5000 character description

      const taskData = {
        title: _longTitle,
        description: _longDescription,
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(taskData)]);

      expect(result.success).toBe(true);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const _createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );

      expect(_createdTask).toBeDefined();
      expect(_createdTask.subtasks).toBeDefined();

      // Embedded subtasks should handle long parent task data
      const _auditSubtask = _createdTask.subtasks.find(
        (st) => st.type === 'audit'
      );
      expect(_auditSubtask).toBeDefined();
      expect(_auditSubtask.title.length).toBeLessThan(_longTitle.length + 50); // Should be truncated or managed
    });
  });

  // ========================================
  // INTEGRATION WORKFLOW TESTS
  // ========================================

  describe('Complete Embedded Subtasks Workflow', () => {
    test('should complete full embedded subtasks lifecycle', async () => {
      // 1. Initialize agent
      const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
      expect(initResult.success).toBe(true);

      // 2. Create feature task with embedded subtasks
      const featureTaskData = {
        title: 'Complete workflow test feature',
        description:
          'Feature with database integration and API endpoints for full workflow testing',
        category: 'feature',
        priority: 'high',
        important_files: ['src/api.js', 'src/database.js', 'docs/api.md'],
      };

      const createResult = await execAPI('create', [
        JSON.stringify(featureTaskData),
      ]);
      testFeatureTaskId = createResult.taskId;
      expect(createResult.success).toBe(true);

      // 3. Verify embedded subtasks were created
      const listResult = await execAPI('list');
      const _featureTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );

      expect(_featureTask).toBeDefined();
      expect(_featureTask.subtasks.length).toBeGreaterThan(0);

      const _researchSubtask = _featureTask.subtasks.find(
        (st) => st.type === 'research'
      );
      const _auditSubtask = _featureTask.subtasks.find(
        (st) => st.type === 'audit'
      );

      expect(_researchSubtask).toBeDefined();
      expect(_auditSubtask).toBeDefined();

      // 4. Verify research subtask prevents implementation
      expect(_researchSubtask.prevents_implementation).toBe(true);
      expect(_researchSubtask.status).toBe('pending');

      // 5. Verify audit subtask prevents completion
      expect(_auditSubtask.prevents_completion).toBe(true);
      expect(_auditSubtask.prevents_self_review).toBe(true);
      expect(_auditSubtask.status).toBe('pending');

      // 6. Verify task filtering and statistics include subtask information
      const _statsResult = await execAPI('stats');
      expect(_statsResult.success).toBe(true);
      expect(_statsResult.statistics.tasks.total).toBeGreaterThan(0);

      // 7. Claim the main feature task
      const claimResult = await execAPI('claim', [
        testFeatureTaskId,
        testAgentId,
      ]);
      expect(claimResult.success).toBe(true);
      expect(claimResult.task.status).toBe('in_progress');

      // 8. Verify current task shows embedded subtasks
      const currentResult = await execAPI('current', [testAgentId]);
      expect(currentResult.success).toBe(true);
      expect(currentResult.task.id).toBe(testFeatureTaskId);
      expect(currentResult.task.subtasks).toBeDefined();

      // 9. Verify agent status reflects task with embedded subtasks
      const statusResult = await execAPI('status', [testAgentId]);
      expect(statusResult.success).toBe(true);
      expect(statusResult.taskCount).toBe(1);
    });

    test('should handle multi-agent coordination for embedded subtasks', async () => {
      // Initialize multiple agents for different roles
      const _implementationAgent = (
        await execAPI('init', [
          JSON.stringify({
            role: 'development',
            specialization: ['feature-implementation'],
          }),
        ])
      ).agentId;

      const _researchAgent = (
        await execAPI('init', [
          JSON.stringify({
            role: 'research',
            specialization: ['technical-analysis'],
          }),
        ])
      ).agentId;

      const _auditAgent = (
        await execAPI('init', [
          JSON.stringify({
            role: 'quality-assurance',
            specialization: ['code-review'],
          }),
        ])
      ).agentId;

      // Create feature task with complex embedded subtasks
      const featureTaskData = {
        title: 'Multi-agent coordination test feature',
        description:
          'Complex feature requiring research, implementation, and audit coordination',
        category: 'feature',
        priority: 'high',
      };

      const createResult = await execAPI('create', [
        JSON.stringify(featureTaskData),
      ]);
      testFeatureTaskId = createResult.taskId;

      // Verify all agents can see the task and its subtasks
      // Use for-await-of to ensure sequential validation since these are dependent checks
      for await (const agentId of [
        _implementationAgent,
        _researchAgent,
        _auditAgent,
      ]) {
        const statusResult = await execAPI('status', [agentId]);
        expect(statusResult.success).toBe(true);

        const listResult = await execAPI('list');
        const _task = listResult.tasks.find((t) => t.id === testFeatureTaskId);
        expect(_task).toBeDefined();
        expect(_task.subtasks).toBeDefined();
      }

      // Implementation agent claims main task
      const claimResult = await execAPI('claim', [
        testFeatureTaskId,
        _implementationAgent,
      ]);
      expect(claimResult.success).toBe(true);

      // Verify task assignment and multi-agent coordination
      const _finalStatusResult = await execAPI('status', [
        _implementationAgent,
      ]);
      expect(_finalStatusResult.success).toBe(true);
      expect(_finalStatusResult.taskCount).toBe(1);
    });
  });
});
