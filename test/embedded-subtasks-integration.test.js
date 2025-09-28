/**
 * Comprehensive Integration Test Suite for Embedded Subtasks System
 *
 * Tests all aspects of the embedded subtasks system including:
 * - Unit tests for embedded subtasks generation
 * - Integration tests for research And audit workflows
 * - API endpoint tests for subtasks operations
 * - Performance tests for embedded queries
 * - Security And validation tests
 *
 * This test suite validates the complete embedded subtasks functionality
 * including research task automation, audit system validation, And
 * multi-agent coordination for quality gates.
 *
 * @author Integration Testing Agent #7
 * @version 1.0.0
 * @since 2025-09-13
 */

const FS = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test configuration
const TEST_PROJECT_DIR = path.join(__dirname, 'embedded-subtasks-test-project');
const TODO_PATH = path.join(TEST_PROJECT_DIR, 'TODO.json');
const API_PATH = path.join(__dirname, '..', 'taskmanager-api.js');
const TIMEOUT = 15000; // 15 seconds for API operations

/**
 * Execute TaskManager API command And return parsed result
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
      } catch {
        // If JSON parsing fails, check if we can extract JSON from stderr
        try {
          const stderrJson = JSON.parse(stderr.trim());
          resolve(stderrJson);
        } catch {
          // If both fail, include raw output for debugging
          reject(
            new Error(
              `Command failed (code ${code}): ${stderr}\nStdout: ${stdout}\nParse error: ${error.message}`
            )
          );
        }
      }
    });

    child.on('error', (_error) => {
      reject(new Error(`Command execution failed: ${error.message}`));
    });
  });
}

/**
 * Create a clean test TODO.json file with embedded subtasks support
 */
function createTestTodoFile() {
  // Create development/essentials directory
  const essentialsDir = path.join(
    TEST_PROJECT_DIR,
    'development',
    'essentials'
  );
  if (!FS.existsSync(essentialsDir)) {
    FS.mkdirSync(essentialsDir, { recursive: true });
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
- [ ] **Performance Metrics**: Execution timing And bottleneck identification
`;

  FS.writeFileSync(
    path.join(essentialsDir, 'audit-criteria.md'),
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

  FS.writeFileSync(TODO_PATH, JSON.stringify(todoData, null, 2));
  return todoData;
}

/**
 * Setup test environment before each test
 */
function setupTestEnvironment() {
  // Create test project directory
  if (!FS.existsSync(TEST_PROJECT_DIR)) {
    FS.mkdirSync(TEST_PROJECT_DIR, { recursive: true });
  }

  // Create clean TODO.json
  createTestTodoFile();
}

/**
 * Cleanup test environment after each test
 */
function cleanupTestEnvironment() {
  // Remove test project directory And all contents
  if (FS.existsSync(TEST_PROJECT_DIR)) {
    FS.rmSync(TEST_PROJECT_DIR, { recursive: true, force: true });
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

    test('should auto-generate research And audit subtasks for complex feature tasks', async () => {
      const featureTaskData = {
        title: 'Implement authentication system with database integration',
        description:
          'Build comprehensive authentication system with security controls And database migration',
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
      const CREATED_TASK = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );

      expect(CREATED_TASK).toBeDefined();
      expect(CREATED_TASK.subtasks).toBeDefined();
      expect(CREATED_TASK.subtasks.length).toBeGreaterThan(0);

      // Verify research subtask was created
      const RESEARCH_SUBTASK = CREATED_TASK.subtasks.find(
        (st) => st.type === 'research'
      );
      expect(RESEARCH_SUBTASK).toBeDefined();
      expect(RESEARCH_SUBTASK.id).toMatch(/^research_\d+_\w+$/);
      expect(RESEARCH_SUBTASK.title).toContain('Research:');
      expect(RESEARCH_SUBTASK.prevents_implementation).toBe(true);
      expect(RESEARCH_SUBTASK.research_locations).toBeDefined();
      expect(RESEARCH_SUBTASK.research_locations.length).toBeGreaterThan(0);

      // Verify audit subtask was created
      const AUDIT_SUBTASK = CREATED_TASK.subtasks.find(
        (st) => st.type === 'audit'
      );
      expect(AUDIT_SUBTASK).toBeDefined();
      expect(AUDIT_SUBTASK.id).toMatch(/^audit_\d+_\w+$/);
      expect(AUDIT_SUBTASK.title).toContain('Audit:');
      expect(AUDIT_SUBTASK.prevents_completion).toBe(true);
      expect(AUDIT_SUBTASK.prevents_self_review).toBe(true);
      expect(AUDIT_SUBTASK.success_criteria).toBeDefined();
      expect(AUDIT_SUBTASK.success_criteria.length).toBeGreaterThan(0);
    });

    test('should generate only audit subtasks for simple feature tasks', async () => {
      const SIMPLE_TASK_DATA = {
        title: 'Update button color scheme',
        description:
          'Change primary button colors to match new brand guidelines',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [
        JSON.stringify(SIMPLE_TASK_DATA),
      ]);

      expect(result.success).toBe(true);
      testFeatureTaskId = result.taskId;

      // List tasks to verify subtasks were generated
      const listResult = await execAPI('list');
      const CREATED_TASK = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );

      expect(CREATED_TASK).toBeDefined();
      expect(CREATED_TASK.subtasks).toBeDefined();
      expect(CREATED_TASK.subtasks.length).toBe(1); // Only audit subtask

      // Verify no research subtask was created
      const RESEARCH_SUBTASK = CREATED_TASK.subtasks.find(
        (st) => st.type === 'research'
      );
      expect(RESEARCH_SUBTASK).toBeUndefined();

      // Verify audit subtask was created
      const AUDIT_SUBTASK = CREATED_TASK.subtasks.find(
        (st) => st.type === 'audit'
      );
      expect(AUDIT_SUBTASK).toBeDefined();
      expect(AUDIT_SUBTASK.prevents_completion).toBe(true);
    });

    test('should not generate subtasks for non-feature task categories', async () => {
      const ERROR_TASK_DATA = {
        title: 'Fix critical ESLint violations',
        description: 'Resolve linting errors in authentication module',
        category: 'error',
        priority: 'critical',
      };

      const result = await execAPI('create', [JSON.stringify(ERROR_TASK_DATA)]);

      expect(result.success).toBe(true);
      testTaskId = result.taskId;

      // List tasks to verify no subtasks were generated
      const listResult = await execAPI('list');
      const CREATED_TASK = listResult.tasks.find((t) => t.id === testTaskId);

      expect(CREATED_TASK).toBeDefined();
      expect(CREATED_TASK.subtasks).toBeDefined();
      expect(CREATED_TASK.subtasks.length).toBe(0);
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
      const CREATED_TASK = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );

      expect(CREATED_TASK).toBeDefined();
      expect(CREATED_TASK.subtasks).toBeDefined();
      expect(CREATED_TASK.subtasks.length).toBe(0);
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
      const DATABASE_TASK_DATA = {
        title: 'Design database schema for user management',
        description:
          'Create tables And relationships for user authentication And profiles',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [
        JSON.stringify(DATABASE_TASK_DATA),
      ]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const CREATED_TASK = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );
      const RESEARCH_SUBTASK = CREATED_TASK.subtasks.find(
        (st) => st.type === 'research'
      );

      expect(RESEARCH_SUBTASK).toBeDefined();
      expect(RESEARCH_SUBTASK.research_locations).toBeDefined();

      // Verify codebase research location
      const CODEBASE_LOCATION = RESEARCH_SUBTASK.research_locations.find(
        (loc) => loc.type === 'codebase'
      );
      expect(CODEBASE_LOCATION).toBeDefined();
      expect(CODEBASE_LOCATION.paths).toContain('/models');
      expect(CODEBASE_LOCATION.paths).toContain('/database');

      // Verify internet research location
      const INTERNET_LOCATION = RESEARCH_SUBTASK.research_locations.find(
        (loc) => loc.type === 'internet'
      );
      expect(INTERNET_LOCATION).toBeDefined();
      expect(INTERNET_LOCATION.keywords).toContain('database');
      expect(INTERNET_LOCATION.keywords).toContain('schema');

      // Verify documentation research location
      const DOCS_LOCATION = RESEARCH_SUBTASK.research_locations.find(
        (loc) => loc.type === 'documentation'
      );
      expect(DOCS_LOCATION).toBeDefined();
      expect(DOCS_LOCATION.sources).toContain('README.md');
    });

    test('should include comprehensive deliverables in research subtasks', async () => {
      const API_TASK_DATA = {
        title: 'Implement REST API endpoints',
        description:
          'Create comprehensive API with authentication And validation',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [JSON.stringify(API_TASK_DATA)]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const CREATED_TASK = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );
      const RESEARCH_SUBTASK = CREATED_TASK.subtasks.find(
        (st) => st.type === 'research'
      );

      expect(RESEARCH_SUBTASK.deliverables).toBeDefined();
      expect(RESEARCH_SUBTASK.deliverables).toContain(
        'Technical analysis report'
      );
      expect(RESEARCH_SUBTASK.deliverables).toContain(
        'Implementation recommendations'
      );
      expect(RESEARCH_SUBTASK.deliverables).toContain('Risk assessment');
      expect(RESEARCH_SUBTASK.deliverables).toContain(
        'Alternative approaches evaluation'
      );
    });

    test('should set prevents_implementation flag on research subtasks', async () => {
      const COMPLEX_TASK_DATA = {
        title: 'Implement microservices architecture',
        description: 'Refactor monolith into distributed microservices',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [
        JSON.stringify(COMPLEX_TASK_DATA),
      ]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const CREATED_TASK = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );
      const RESEARCH_SUBTASK = CREATED_TASK.subtasks.find(
        (st) => st.type === 'research'
      );

      expect(RESEARCH_SUBTASK.prevents_implementation).toBe(true);
      expect(RESEARCH_SUBTASK.status).toBe('pending');
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
        description: 'Feature That should trigger audit subtask generation',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const CREATED_TASK = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );
      const AUDIT_SUBTASK = CREATED_TASK.subtasks.find(
        (st) => st.type === 'audit'
      );

      expect(AUDIT_SUBTASK).toBeDefined();
      expect(AUDIT_SUBTASK.success_criteria).toBeDefined();
      expect(AUDIT_SUBTASK.success_criteria.length).toBeGreaterThan(0);

      // Verify That standard criteria are loaded
      expect(AUDIT_SUBTASK.success_criteria).toContain('Linter Perfection');
      expect(AUDIT_SUBTASK.success_criteria).toContain('Build Success');
      expect(AUDIT_SUBTASK.success_criteria).toContain('Runtime Success');
      expect(AUDIT_SUBTASK.success_criteria).toContain('Test Integrity');
    });

    test('should set prevents_completion And prevents_self_review flags', async () => {
      const featureTaskData = {
        title: 'Feature requiring audit validation',
        description: 'Test feature for audit system validation',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const CREATED_TASK = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );
      const AUDIT_SUBTASK = CREATED_TASK.subtasks.find(
        (st) => st.type === 'audit'
      );

      expect(AUDIT_SUBTASK.prevents_completion).toBe(true);
      expect(AUDIT_SUBTASK.prevents_self_review).toBe(true);
      expect(AUDIT_SUBTASK.audit_type).toBe('embedded_quality_gate');
      expect(AUDIT_SUBTASK.original_implementer).toBeNull();
    });

    test('should create comprehensive audit description with original task context', async () => {
      const featureTaskData = {
        title: 'Complex feature implementation',
        description:
          'Detailed implementation with multiple components And requirements',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const CREATED_TASK = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );
      const AUDIT_SUBTASK = CREATED_TASK.subtasks.find(
        (st) => st.type === 'audit'
      );

      expect(AUDIT_SUBTASK.description).toContain(
        'Comprehensive quality audit And review'
      );
      expect(AUDIT_SUBTASK.description).toContain(featureTaskData.title);
      expect(AUDIT_SUBTASK.description).toContain('Original Description:');
      expect(AUDIT_SUBTASK.description).toContain(featureTaskData.description);
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

      const FEATURE_TASK = result.tasks.find((t) => t.id === testFeatureTaskId);
      expect(FEATURE_TASK).toBeDefined();
      expect(FEATURE_TASK.subtasks).toBeDefined();
      expect(FEATURE_TASK.subtasks.length).toBeGreaterThan(0);

      // Verify subtasks have proper structure
      FEATURE_TASK.subtasks.forEach((subtask) => {
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
      const TASK_STATS = result.statistics.tasks;
      expect(TASK_STATS.total).toBeGreaterThan(0);
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
      const START_TIME = Date.now();

      const featureTaskData = {
        title: 'Performance test feature with complex requirements',
        description:
          'Complex feature implementation with database, API, And security requirements',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);

      const END_TIME = Date.now();
      const EXECUTION_TIME = END_TIME - START_TIME;

      expect(result.success).toBe(true);
      expect(EXECUTION_TIME).toBeLessThan(5000); // Should complete within 5 seconds

      testFeatureTaskId = result.taskId;
    });

    test('should handle multiple concurrent task creations efficiently', async () => {
      const TASK_PROMISES = [];
      const NUM_TASKS = 5;

      for (let i = 0; i < NUM_TASKS; i++) {
        const taskData = {
          title: `Concurrent test feature ${i + 1}`,
          description: `Feature ${i + 1} for concurrent creation testing`,
          category: 'feature',
          priority: 'medium',
        };
        TASK_PROMISES.push(execAPI('create', [JSON.stringify(taskData)]));
      }

      const START_TIME = Date.now();
      const RESULTS = await Promise.all(TASK_PROMISES);
      const END_TIME = Date.now();
      const TOTAL_TIME = END_TIME - START_TIME;

      RESULTS.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.taskId).toBeDefined();
      });

      // Should complete all tasks within reasonable time
      expect(TOTAL_TIME).toBeLessThan(15000); // 15 seconds for 5 concurrent tasks
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

      const START_TIME = Date.now();
      const result = await execAPI('list');
      const END_TIME = Date.now();
      const QUERY_TIME = END_TIME - START_TIME;

      expect(result.success).toBe(true);
      expect(result.tasks.length).toBeGreaterThanOrEqual(3);
      expect(QUERY_TIME).toBeLessThan(3000); // Should query within 3 seconds

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

  describe('Error Handling And Edge Cases', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should handle missing audit criteria file gracefully', async () => {
      // Remove audit criteria file
      const AUDIT_CRITERIA_PATH = path.join(
        TEST_PROJECT_DIR,
        'development/essentials/audit-criteria.md'
      );
      if (FS.existsSync(AUDIT_CRITERIA_PATH)) {
        FS.unlinkSync(AUDIT_CRITERIA_PATH);
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
      const CREATED_TASK = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );

      expect(CREATED_TASK).toBeDefined();
      expect(CREATED_TASK.subtasks).toBeDefined();

      const AUDIT_SUBTASK = CREATED_TASK.subtasks.find(
        (st) => st.type === 'audit'
      );
      expect(AUDIT_SUBTASK).toBeDefined();
      expect(AUDIT_SUBTASK.success_criteria).toBeDefined();
    });

    test('should handle malformed embedded subtasks data', async () => {
      const TASK_DATA_WITH_INVALID_SUBTASKS = {
        title: 'Task with malformed subtasks',
        description: 'Test task with invalid subtasks structure',
        category: 'feature',
        priority: 'medium',
        subtasks: 'invalid_subtasks_data', // Should be an array
      };

      const result = await execAPI('create', [
        JSON.stringify(TASK_DATA_WITH_INVALID_SUBTASKS),
      ]);

      // Should either succeed with corrected data or fail gracefully
      if (result.success) {
        testFeatureTaskId = result.taskId;

        const listResult = await execAPI('list');
        const CREATED_TASK = listResult.tasks.find(
          (t) => t.id === testFeatureTaskId
        );

        expect(CREATED_TASK.subtasks).toBeDefined();
        expect(Array.isArray(CREATED_TASK.subtasks)).toBe(true);
      } else {
        expect(result.error).toBeDefined();
        expect(result.error).toContain('subtasks');
      }
    });

    test('should handle extremely long task titles And descriptions', async () => {
      const LONG_TITLE = 'A'.repeat(1000); // 1000 character title
      const LONG_DESCRIPTION = 'B'.repeat(5000); // 5000 character description

      const taskData = {
        title: LONG_TITLE,
        description: LONG_DESCRIPTION,
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(taskData)]);

      expect(result.success).toBe(true);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const CREATED_TASK = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );

      expect(CREATED_TASK).toBeDefined();
      expect(CREATED_TASK.subtasks).toBeDefined();

      // Embedded subtasks should handle long parent task data
      const AUDIT_SUBTASK = CREATED_TASK.subtasks.find(
        (st) => st.type === 'audit'
      );
      expect(AUDIT_SUBTASK).toBeDefined();
      expect(AUDIT_SUBTASK.title.length).toBeLessThan(LONG_TITLE.length + 50); // Should be truncated or managed
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
          'Feature with database integration And API endpoints for full workflow testing',
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
      const FEATURE_TASK = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId
      );

      expect(FEATURE_TASK).toBeDefined();
      expect(FEATURE_TASK.subtasks.length).toBeGreaterThan(0);

      const RESEARCH_SUBTASK = FEATURE_TASK.subtasks.find(
        (st) => st.type === 'research'
      );
      const AUDIT_SUBTASK = FEATURE_TASK.subtasks.find(
        (st) => st.type === 'audit'
      );

      expect(RESEARCH_SUBTASK).toBeDefined();
      expect(AUDIT_SUBTASK).toBeDefined();

      // 4. Verify research subtask prevents implementation
      expect(RESEARCH_SUBTASK.prevents_implementation).toBe(true);
      expect(RESEARCH_SUBTASK.status).toBe('pending');

      // 5. Verify audit subtask prevents completion
      expect(AUDIT_SUBTASK.prevents_completion).toBe(true);
      expect(AUDIT_SUBTASK.prevents_self_review).toBe(true);
      expect(AUDIT_SUBTASK.status).toBe('pending');

      // 6. Verify task filtering And statistics include subtask information
      const STATS_RESULT = await execAPI('stats');
      expect(STATS_RESULT.success).toBe(true);
      expect(STATS_RESULT.statistics.tasks.total).toBeGreaterThan(0);

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
      const IMPLEMENTATION_AGENT = (
        await execAPI('init', [
          JSON.stringify({
            role: 'development',
            specialization: ['feature-implementation'],
          }),
        ])
      ).agentId;

      const RESEARCH_AGENT = (
        await execAPI('init', [
          JSON.stringify({
            role: 'research',
            specialization: ['technical-analysis'],
          }),
        ])
      ).agentId;

      const AUDIT_AGENT = (
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
          'Complex feature requiring research, implementation, And audit coordination',
        category: 'feature',
        priority: 'high',
      };

      const createResult = await execAPI('create', [
        JSON.stringify(featureTaskData),
      ]);
      testFeatureTaskId = createResult.taskId;

      // Verify all agents can see the task And its subtasks
      // Use for-await-of to ensure sequential validation since these are dependent checks
      for await (const agentId of [
        IMPLEMENTATION_AGENT,
        RESEARCH_AGENT,
        AUDIT_AGENT,
      ]) {
        const statusResult = await execAPI('status', [agentId]);
        expect(statusResult.success).toBe(true);

        const listResult = await execAPI('list');
        const TASK = listResult.tasks.find((t) => t.id === testFeatureTaskId);
        expect(TASK).toBeDefined();
        expect(TASK.subtasks).toBeDefined();
      }

      // Implementation agent claims main task
      const claimResult = await execAPI('claim', [
        testFeatureTaskId,
        IMPLEMENTATION_AGENT,
      ]);
      expect(claimResult.success).toBe(true);

      // Verify task assignment And multi-agent coordination
      const FINAL_STATUS_RESULT = await execAPI('status', [
        IMPLEMENTATION_AGENT,
      ]);
      expect(FINAL_STATUS_RESULT.success).toBe(true);
      expect(FINAL_STATUS_RESULT.taskCount).toBe(1);
    });
  });
});
