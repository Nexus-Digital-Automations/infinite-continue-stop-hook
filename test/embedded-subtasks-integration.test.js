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

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test configuration
const TEST_PROJECT_DIR = path.join(__dirname, 'embedded-subtasks-test-project');
const TODO_PATH = path.join(TEST_PROJECT_DIR, 'TODO.json');
const API_PATH = path.join(__dirname, '..', 'taskmanager-api.js');
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
      } catch (parseError) {
        // If JSON parsing fails, check if we can extract JSON from stderr
        try {
          const stderrJson = JSON.parse(stderr.trim());
          resolve(stderrJson);
        } catch {
          // If both fail, include raw output for debugging
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
 * Create a clean test TODO.json file with embedded subtasks support
 */
function createTestTodoFile() {
  // Create development/essentials directory
  const essentialsDir = path.join(
    TEST_PROJECT_DIR,
    'development',
    'essentials',
  );
  if (!fs.existsSync(essentialsDir)) {
    fs.mkdirSync(essentialsDir, { recursive: true });
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

  fs.writeFileSync(
    path.join(essentialsDir, 'audit-criteria.md'),
    auditCriteriaContent,
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

  fs.writeFileSync(TODO_PATH, JSON.stringify(todoData, null, 2));
  return todoData;
}

/**
 * Setup test environment before each test
 */
function setupTestEnvironment() {
  // Create test project directory
  if (!fs.existsSync(TEST_PROJECT_DIR)) {
    fs.mkdirSync(TEST_PROJECT_DIR, { recursive: true });
  }

  // Create clean TODO.json
  createTestTodoFile();
}

/**
 * Cleanup test environment after each test
 */
function cleanupTestEnvironment() {
  // Remove test project directory and all contents
  if (fs.existsSync(TEST_PROJECT_DIR)) {
    fs.rmSync(TEST_PROJECT_DIR, { recursive: true, force: true });
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
      const createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId,
      );

      expect(createdTask).toBeDefined();
      expect(createdTask.subtasks).toBeDefined();
      expect(createdTask.subtasks.length).toBeGreaterThan(0);

      // Verify research subtask was created
      const researchSubtask = createdTask.subtasks.find(
        (st) => st.type === 'research',
      );
      expect(researchSubtask).toBeDefined();
      expect(researchSubtask.id).toMatch(/^research_\d+_\w+$/);
      expect(researchSubtask.title).toContain('Research:');
      expect(researchSubtask.prevents_implementation).toBe(true);
      expect(researchSubtask.research_locations).toBeDefined();
      expect(researchSubtask.research_locations.length).toBeGreaterThan(0);

      // Verify audit subtask was created
      const auditSubtask = createdTask.subtasks.find(
        (st) => st.type === 'audit',
      );
      expect(auditSubtask).toBeDefined();
      expect(auditSubtask.id).toMatch(/^audit_\d+_\w+$/);
      expect(auditSubtask.title).toContain('Audit:');
      expect(auditSubtask.prevents_completion).toBe(true);
      expect(auditSubtask.prevents_self_review).toBe(true);
      expect(auditSubtask.success_criteria).toBeDefined();
      expect(auditSubtask.success_criteria.length).toBeGreaterThan(0);
    });

    test('should generate only audit subtasks for simple feature tasks', async () => {
      const simpleTaskData = {
        title: 'Update button color scheme',
        description:
          'Change primary button colors to match new brand guidelines',
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(simpleTaskData)]);

      expect(result.success).toBe(true);
      testFeatureTaskId = result.taskId;

      // List tasks to verify subtasks were generated
      const listResult = await execAPI('list');
      const createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId,
      );

      expect(createdTask).toBeDefined();
      expect(createdTask.subtasks).toBeDefined();
      expect(createdTask.subtasks.length).toBe(1); // Only audit subtask

      // Verify no research subtask was created
      const researchSubtask = createdTask.subtasks.find(
        (st) => st.type === 'research',
      );
      expect(researchSubtask).toBeUndefined();

      // Verify audit subtask was created
      const auditSubtask = createdTask.subtasks.find(
        (st) => st.type === 'audit',
      );
      expect(auditSubtask).toBeDefined();
      expect(auditSubtask.prevents_completion).toBe(true);
    });

    test('should not generate subtasks for non-feature task categories', async () => {
      const errorTaskData = {
        title: 'Fix critical ESLint violations',
        description: 'Resolve linting errors in authentication module',
        category: 'error',
        priority: 'critical',
      };

      const result = await execAPI('create', [JSON.stringify(errorTaskData)]);

      expect(result.success).toBe(true);
      testTaskId = result.taskId;

      // List tasks to verify no subtasks were generated
      const listResult = await execAPI('list');
      const createdTask = listResult.tasks.find((t) => t.id === testTaskId);

      expect(createdTask).toBeDefined();
      expect(createdTask.subtasks).toBeDefined();
      expect(createdTask.subtasks.length).toBe(0);
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
      const createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId,
      );

      expect(createdTask).toBeDefined();
      expect(createdTask.subtasks).toBeDefined();
      expect(createdTask.subtasks.length).toBe(0);
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
      const databaseTaskData = {
        title: 'Design database schema for user management',
        description:
          'Create tables and relationships for user authentication and profiles',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [
        JSON.stringify(databaseTaskData),
      ]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId,
      );
      const researchSubtask = createdTask.subtasks.find(
        (st) => st.type === 'research',
      );

      expect(researchSubtask).toBeDefined();
      expect(researchSubtask.research_locations).toBeDefined();

      // Verify codebase research location
      const codebaseLocation = researchSubtask.research_locations.find(
        (loc) => loc.type === 'codebase',
      );
      expect(codebaseLocation).toBeDefined();
      expect(codebaseLocation.paths).toContain('/models');
      expect(codebaseLocation.paths).toContain('/database');

      // Verify internet research location
      const internetLocation = researchSubtask.research_locations.find(
        (loc) => loc.type === 'internet',
      );
      expect(internetLocation).toBeDefined();
      expect(internetLocation.keywords).toContain('database');
      expect(internetLocation.keywords).toContain('schema');

      // Verify documentation research location
      const docsLocation = researchSubtask.research_locations.find(
        (loc) => loc.type === 'documentation',
      );
      expect(docsLocation).toBeDefined();
      expect(docsLocation.sources).toContain('README.md');
    });

    test('should include comprehensive deliverables in research subtasks', async () => {
      const apiTaskData = {
        title: 'Implement REST API endpoints',
        description:
          'Create comprehensive API with authentication and validation',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [JSON.stringify(apiTaskData)]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId,
      );
      const researchSubtask = createdTask.subtasks.find(
        (st) => st.type === 'research',
      );

      expect(researchSubtask.deliverables).toBeDefined();
      expect(researchSubtask.deliverables).toContain(
        'Technical analysis report',
      );
      expect(researchSubtask.deliverables).toContain(
        'Implementation recommendations',
      );
      expect(researchSubtask.deliverables).toContain('Risk assessment');
      expect(researchSubtask.deliverables).toContain(
        'Alternative approaches evaluation',
      );
    });

    test('should set prevents_implementation flag on research subtasks', async () => {
      const complexTaskData = {
        title: 'Implement microservices architecture',
        description: 'Refactor monolith into distributed microservices',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [JSON.stringify(complexTaskData)]);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId,
      );
      const researchSubtask = createdTask.subtasks.find(
        (st) => st.type === 'research',
      );

      expect(researchSubtask.prevents_implementation).toBe(true);
      expect(researchSubtask.status).toBe('pending');
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
      const createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId,
      );
      const auditSubtask = createdTask.subtasks.find(
        (st) => st.type === 'audit',
      );

      expect(auditSubtask).toBeDefined();
      expect(auditSubtask.success_criteria).toBeDefined();
      expect(auditSubtask.success_criteria.length).toBeGreaterThan(0);

      // Verify that standard criteria are loaded
      expect(auditSubtask.success_criteria).toContain('Linter Perfection');
      expect(auditSubtask.success_criteria).toContain('Build Success');
      expect(auditSubtask.success_criteria).toContain('Runtime Success');
      expect(auditSubtask.success_criteria).toContain('Test Integrity');
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
      const createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId,
      );
      const auditSubtask = createdTask.subtasks.find(
        (st) => st.type === 'audit',
      );

      expect(auditSubtask.prevents_completion).toBe(true);
      expect(auditSubtask.prevents_self_review).toBe(true);
      expect(auditSubtask.audit_type).toBe('embedded_quality_gate');
      expect(auditSubtask.original_implementer).toBeNull();
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
      const createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId,
      );
      const auditSubtask = createdTask.subtasks.find(
        (st) => st.type === 'audit',
      );

      expect(auditSubtask.description).toContain(
        'Comprehensive quality audit and review',
      );
      expect(auditSubtask.description).toContain(featureTaskData.title);
      expect(auditSubtask.description).toContain('Original Description:');
      expect(auditSubtask.description).toContain(featureTaskData.description);
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

      const featureTask = result.tasks.find((t) => t.id === testFeatureTaskId);
      expect(featureTask).toBeDefined();
      expect(featureTask.subtasks).toBeDefined();
      expect(featureTask.subtasks.length).toBeGreaterThan(0);

      // Verify subtasks have proper structure
      featureTask.subtasks.forEach((subtask) => {
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
      const taskStats = result.statistics.tasks;
      expect(taskStats.total).toBeGreaterThan(0);
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
      const startTime = Date.now();

      const featureTaskData = {
        title: 'Performance test feature with complex requirements',
        description:
          'Complex feature implementation with database, API, and security requirements',
        category: 'feature',
        priority: 'high',
      };

      const result = await execAPI('create', [JSON.stringify(featureTaskData)]);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds

      testFeatureTaskId = result.taskId;
    });

    test('should handle multiple concurrent task creations efficiently', async () => {
      const taskPromises = [];
      const numTasks = 5;

      for (let i = 0; i < numTasks; i++) {
        const taskData = {
          title: `Concurrent test feature ${i + 1}`,
          description: `Feature ${i + 1} for concurrent creation testing`,
          category: 'feature',
          priority: 'medium',
        };
        taskPromises.push(execAPI('create', [JSON.stringify(taskData)]));
      }

      const startTime = Date.now();
      const results = await Promise.all(taskPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.taskId).toBeDefined();
      });

      // Should complete all tasks within reasonable time
      expect(totalTime).toBeLessThan(15000); // 15 seconds for 5 concurrent tasks
    });

    test('should efficiently query tasks with complex subtask structures', async () => {
      // Create several feature tasks with embedded subtasks
      for (let i = 0; i < 3; i++) {
        const taskData = {
          title: `Query performance test feature ${i + 1}`,
          description: 'Feature with complex subtask structure for query testing',
          category: 'feature',
          priority: 'medium',
        };
        await execAPI('create', [JSON.stringify(taskData)]);
      }

      const startTime = Date.now();
      const result = await execAPI('list');
      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(result.tasks.length).toBeGreaterThanOrEqual(3);
      expect(queryTime).toBeLessThan(3000); // Should query within 3 seconds

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
      const auditCriteriaPath = path.join(
        TEST_PROJECT_DIR,
        'development/essentials/audit-criteria.md',
      );
      if (fs.existsSync(auditCriteriaPath)) {
        fs.unlinkSync(auditCriteriaPath);
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
      const createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId,
      );

      expect(createdTask).toBeDefined();
      expect(createdTask.subtasks).toBeDefined();

      const auditSubtask = createdTask.subtasks.find(
        (st) => st.type === 'audit',
      );
      expect(auditSubtask).toBeDefined();
      expect(auditSubtask.success_criteria).toBeDefined();
    });

    test('should handle malformed embedded subtasks data', async () => {
      const taskDataWithInvalidSubtasks = {
        title: 'Task with malformed subtasks',
        description: 'Test task with invalid subtasks structure',
        category: 'feature',
        priority: 'medium',
        subtasks: 'invalid_subtasks_data', // Should be an array
      };

      const result = await execAPI('create', [
        JSON.stringify(taskDataWithInvalidSubtasks),
      ]);

      // Should either succeed with corrected data or fail gracefully
      if (result.success) {
        testFeatureTaskId = result.taskId;

        const listResult = await execAPI('list');
        const createdTask = listResult.tasks.find(
          (t) => t.id === testFeatureTaskId,
        );

        expect(createdTask.subtasks).toBeDefined();
        expect(Array.isArray(createdTask.subtasks)).toBe(true);
      } else {
        expect(result.error).toBeDefined();
        expect(result.error).toContain('subtasks');
      }
    });

    test('should handle extremely long task titles and descriptions', async () => {
      const longTitle = 'A'.repeat(1000); // 1000 character title
      const longDescription = 'B'.repeat(5000); // 5000 character description

      const taskData = {
        title: longTitle,
        description: longDescription,
        category: 'feature',
        priority: 'medium',
      };

      const result = await execAPI('create', [JSON.stringify(taskData)]);

      expect(result.success).toBe(true);
      testFeatureTaskId = result.taskId;

      const listResult = await execAPI('list');
      const createdTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId,
      );

      expect(createdTask).toBeDefined();
      expect(createdTask.subtasks).toBeDefined();

      // Embedded subtasks should handle long parent task data
      const auditSubtask = createdTask.subtasks.find(
        (st) => st.type === 'audit',
      );
      expect(auditSubtask).toBeDefined();
      expect(auditSubtask.title.length).toBeLessThan(longTitle.length + 50); // Should be truncated or managed
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
      const featureTask = listResult.tasks.find(
        (t) => t.id === testFeatureTaskId,
      );

      expect(featureTask).toBeDefined();
      expect(featureTask.subtasks.length).toBeGreaterThan(0);

      const researchSubtask = featureTask.subtasks.find(
        (st) => st.type === 'research',
      );
      const auditSubtask = featureTask.subtasks.find(
        (st) => st.type === 'audit',
      );

      expect(researchSubtask).toBeDefined();
      expect(auditSubtask).toBeDefined();

      // 4. Verify research subtask prevents implementation
      expect(researchSubtask.prevents_implementation).toBe(true);
      expect(researchSubtask.status).toBe('pending');

      // 5. Verify audit subtask prevents completion
      expect(auditSubtask.prevents_completion).toBe(true);
      expect(auditSubtask.prevents_self_review).toBe(true);
      expect(auditSubtask.status).toBe('pending');

      // 6. Verify task filtering and statistics include subtask information
      const statsResult = await execAPI('stats');
      expect(statsResult.success).toBe(true);
      expect(statsResult.statistics.tasks.total).toBeGreaterThan(0);

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
      const implementationAgent = (
        await execAPI('init', [
          JSON.stringify({
            role: 'development',
            specialization: ['feature-implementation'],
          }),
        ])
      ).agentId;

      const researchAgent = (
        await execAPI('init', [
          JSON.stringify({
            role: 'research',
            specialization: ['technical-analysis'],
          }),
        ])
      ).agentId;

      const auditAgent = (
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
      for (const agentId of [implementationAgent, researchAgent, auditAgent]) {
        const statusResult = await execAPI('status', [agentId]);
        expect(statusResult.success).toBe(true);

        const listResult = await execAPI('list');
        const task = listResult.tasks.find((t) => t.id === testFeatureTaskId);
        expect(task).toBeDefined();
        expect(task.subtasks).toBeDefined();
      }

      // Implementation agent claims main task
      const claimResult = await execAPI('claim', [
        testFeatureTaskId,
        implementationAgent,
      ]);
      expect(claimResult.success).toBe(true);

      // Verify task assignment and multi-agent coordination
      const finalStatusResult = await execAPI('status', [implementationAgent]);
      expect(finalStatusResult.success).toBe(true);
      expect(finalStatusResult.taskCount).toBe(1);
    });
  });
});
