/**
 * Comprehensive TaskManager API Test Suite
 *
 * Tests all TaskManager API endpoints including:
 * - Task creation, claiming, completion, deletion
 * - Agent lifecycle management (init, reinitialize, status)
 * - Task operations (list, move, reorder)
 * - Feature management (suggest, approve, reject)
 * - Status updates and agent management
 * - Error handling and edge cases
 * - Multi-agent coordination
 * - Task dependency system
 * - Research workflow integration
 *
 * This comprehensive test validates that the simplified TaskManager system
 * works correctly across all supported operations and handles edge cases
 * gracefully.
 */

const _fs = require('fs');
const _path = require('path');
const { spawn } = require('child_process');

// Test configuration
const TEST_PROJECT_DIR = path.join(__dirname, 'test-api-project');
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
function execAPI(_command, args = [], timeout = TIMEOUT) {
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
        const _jsonStart = jsonString.indexOf('{');
        if (jsonStart > 0) {
          jsonString = jsonString.substring(jsonStart);
        }

        // Try to parse JSON response
        const _result = JSON.parse(jsonString);
        resolve(result);
      } catch (parseError) {
        // If JSON parsing fails, check if we can extract JSON from stderr
        try {
          const _stderrJson = JSON.parse(stderr.trim());
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
 * Create a clean test TODO.json file with basic structure
 */
function createTestTodoFile() {
  const todoData = {
    project: 'test-taskmanager-api',
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

describe('TaskManager API Comprehensive Test Suite', () => {
  let testAgentId = null;
  let testTaskId = null;
  let testFeatureId = null;

  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  // ========================================
  // DISCOVERY AND DOCUMENTATION TESTS
  // ========================================

  describe('API Discovery', () => {
    test('should return comprehensive guide', async () => {
      const _result = await execAPI('guide');

      expect(result.success).toBe(true);
      expect(result.taskManager).toBeDefined();
      expect(result.taskClassification).toBeDefined();
      expect(result.coreCommands).toBeDefined();
      expect(result.workflows).toBeDefined();
      expect(result.examples).toBeDefined();

      // Verify task classification structure
      const _taskTypes = result.taskClassification.types;
      expect(taskTypes).toHaveLength(4);
      expect(taskTypes.map((t) => t.value)).toEqual([
        'error',
        'feature',
        'subtask',
        'test',
      ]);

      // Verify priority order
      expect(result.taskClassification.priorityRules['1_error']).toBeDefined();
      expect(result.taskClassification.priorityRules['4_test']).toBeDefined();
    });

    test('should list all available methods', async () => {
      const _result = await execAPI('methods');

      expect(result.success).toBe(true);
      expect(result.taskManagerMethods).toBeDefined();
      expect(result.apiMethods).toBeDefined();
      expect(result.examples).toBeDefined();

      // Verify method counts are reasonable
      expect(result.taskManagerMethods.count).toBeGreaterThan(50);
      expect(result.apiMethods.count).toBeGreaterThan(10);

      // Verify key methods are included
      expect(result.taskManagerMethods.methods).toContain('createTask');
      expect(result.taskManagerMethods.methods).toContain('claimTask');
      expect(result.taskManagerMethods.methods).toContain('readTodo');
      expect(result.taskManagerMethods.methods).toContain('writeTodo');
    });
  });

  // ========================================
  // AGENT LIFECYCLE TESTS
  // ========================================

  describe('Agent Lifecycle Management', () => {
    test('should initialize agent with default configuration', async () => {
      const _result = await execAPI('init');

      expect(result.success).toBe(true);
      expect(result.agentId).toBeDefined();
      expect(result.config.role).toBe('development');
      expect(result.config.sessionId).toMatch(/^session_\d+$/);
      expect(result.config.specialization).toEqual([]);

      testAgentId = result.agentId;
    });

    test('should initialize agent with custom configuration', async () => {
      const _config = {
        role: 'testing',
        specialization: ['unit-tests', 'integration-tests'],
        metadata: { environment: 'ci' },
      };

      const _result = await execAPI('init', [JSON.stringify(config)]);

      expect(result.success).toBe(true);
      expect(result.agentId).toBeDefined();
      expect(result.config.role).toBe('testing');
      expect(result.config.specialization).toEqual([
        'unit-tests',
        'integration-tests',
      ]);
      expect(result.config.metadata).toEqual({ environment: 'ci' });

      testAgentId = result.agentId;
    });

    test('should get agent status after initialization', async () => {
      // First initialize an agent
      const _initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      // Get agent status
      const _result = await execAPI('status', [testAgentId]);

      expect(result.success).toBe(true);
      expect(result.agent).toBeDefined();
      expect(result.agent.role).toBe('development');
      expect(result.agent.status).toBe('active');
      expect(result.tasks).toEqual([]);
      expect(result.taskCount).toBe(0);
    });

    test('should reinitialize agent with updated configuration', async () => {
      // First initialize an agent
      const _initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      // Reinitialize with updated config
      const _updateConfig = {
        metadata: { updated: true, timestamp: new Date().toISOString() },
      };

      const _result = await execAPI('reinitialize', [
        testAgentId,
        JSON.stringify(updateConfig),
      ]);

      expect(result.success).toBe(true);
      expect(result.agentId).toBe(testAgentId);
      expect(result.agent.metadata.updated).toBe(true);
      expect(result.renewed).toBe(true);
    });

    test('should handle agent status request without agent initialization', async () => {
      const _result = await execAPI('status');

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'No agent ID provided and no agent initialized',
      );
    });
  });

  // ========================================
  // TASK CREATION TESTS
  // ========================================

  describe('Task Creation', () => {
    beforeEach(async () => {
      // Initialize agent for task operations
      const _initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should create error task with highest priority', async () => {
      const _taskData = {
        title: 'Fix critical ESLint violations',
        description: 'Resolve linting errors in authentication module',
        task_type: 'error',
        priority: 'critical',
        category: 'linter-error',
      };

      const _result = await execAPI('create', [JSON.stringify(taskData)]);

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.taskId).toMatch(/^error_\d+_\w+$/);
      expect(result.task.title).toBe(taskData.title);
      expect(result.task.task_type).toBe('error');

      testTaskId = result.taskId;
    });

    test('should create feature task', async () => {
      const _taskData = {
        title: 'Add user authentication system',
        description: 'Implement OAuth 2.0 authentication with JWT tokens',
        task_type: 'feature',
        priority: 'high',
        category: 'authentication',
      };

      const _result = await execAPI('create', [JSON.stringify(taskData)]);

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.taskId).toMatch(/^feature_\d+_\w+$/);
      expect(result.task.title).toBe(taskData.title);
      expect(result.task.task_type).toBe('feature');
    });

    test('should create subtask', async () => {
      const _taskData = {
        title: 'Implement login form component',
        description: 'Create React component for user login form',
        task_type: 'subtask',
        priority: 'medium',
        category: 'ui-component',
      };

      const _result = await execAPI('create', [JSON.stringify(taskData)]);

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.taskId).toMatch(/^subtask_\d+_\w+$/);
      expect(result.task.title).toBe(taskData.title);
      expect(result.task.task_type).toBe('subtask');
    });

    test('should create test task', async () => {
      const _taskData = {
        title: 'Add unit tests for UserService',
        description: 'Comprehensive unit test coverage for user management',
        task_type: 'test',
        priority: 'medium',
        category: 'test-coverage',
      };

      const _result = await execAPI('create', [JSON.stringify(taskData)]);

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.taskId).toMatch(/^test_\d+_\w+$/);
      expect(result.task.title).toBe(taskData.title);
      expect(result.task.task_type).toBe('test');
    });

    test('should reject task creation without required task_type', async () => {
      const _taskData = {
        title: 'Task without task_type',
        description: 'This should fail validation',
        priority: 'medium',
      };

      const _result = await execAPI('create', [JSON.stringify(taskData)]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('task_type');
    });

    test('should create error task with absolute priority', async () => {
      const _taskData = {
        title: 'Critical system failure',
        description:
          'System is completely broken and needs immediate attention',
        task_type: 'error',
        category: 'system-error',
      };

      const _result = await execAPI('create-error', [JSON.stringify(taskData)]);

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.task.is_error_task).toBe(true);
      expect(result.task.priority).toBe('critical');
      expect(result.message).toContain('absolute priority');
    });
  });

  // ========================================
  // TASK CLAIMING TESTS
  // ========================================

  describe('Task Claiming', () => {
    beforeEach(async () => {
      // Initialize agent for task operations
      const _initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      // Create a test task
      const _taskData = {
        title: 'Test task for claiming',
        description: 'Task to test claiming functionality',
        task_type: 'feature',
        priority: 'medium',
      };
      const _createResult = await execAPI('create', [JSON.stringify(taskData)]);
      testTaskId = createResult.taskId;
    });

    test('should claim available task successfully', async () => {
      const _result = await execAPI('claim', [testTaskId, testAgentId]);

      expect(result.success).toBe(true);
      expect(result.task).toBeDefined();
      expect(result.task.id).toBe(testTaskId);
      expect(result.task.status).toBe('in_progress');
      expect(result.task.assigned_agent).toBe(testAgentId);
    });

    test('should prevent claiming already claimed task', async () => {
      // First claim
      await execAPI('claim', [testTaskId, testAgentId]);

      // Initialize another agent
      const _secondInitResult = await execAPI('init');
      const _secondAgentId = secondInitResult.agentId;

      // Try to claim the same task
      const _result = await execAPI('claim', [testTaskId, secondAgentId]);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('not available for claiming');
    });

    test('should handle claiming with dependency validation', async () => {
      // Create dependency task
      const _depTaskData = {
        title: 'Dependency task',
        description: 'Task that must be completed first',
        task_type: 'feature',
        priority: 'high',
      };
      const _depResult = await execAPI('create', [JSON.stringify(depTaskData)]);
      const _depTaskId = depResult.taskId;

      // Create task with dependency
      const _taskData = {
        title: 'Task with dependency',
        description: 'Task that depends on another task',
        task_type: 'feature',
        dependencies: [depTaskId],
      };
      const _createResult = await execAPI('create', [JSON.stringify(taskData)]);
      const _mainTaskId = createResult.taskId;

      // Try to claim task with incomplete dependency
      const _result = await execAPI('claim', [mainTaskId, testAgentId]);

      expect(result.success).toBe(false);
      expect(result.blockedByDependencies).toBe(true);
      expect(result.dependencyInstructions).toBeDefined();
      expect(result.nextDependency.id).toBe(depTaskId);
    });

    test('should get current task for agent', async () => {
      // Claim a task
      await execAPI('claim', [testTaskId, testAgentId]);

      // Get current task
      const _result = await execAPI('current', [testAgentId]);

      expect(result.success).toBe(true);
      expect(result.task).toBeDefined();
      expect(result.task.id).toBe(testTaskId);
      expect(result.hasTask).toBe(true);
    });
  });

  // ========================================
  // TASK COMPLETION TESTS
  // ========================================

  describe('Task Completion', () => {
    beforeEach(async () => {
      // Initialize agent and create/claim a task
      const _initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      const _taskData = {
        title: 'Test completion task',
        description: 'Task to test completion functionality',
        task_type: 'feature',
        priority: 'medium',
      };
      const _createResult = await execAPI('create', [JSON.stringify(taskData)]);
      testTaskId = createResult.taskId;

      // Claim the task
      await execAPI('claim', [testTaskId, testAgentId]);
    });

    test('should complete task successfully', async () => {
      const _completionData = {
        notes: 'Task completed successfully with all requirements met',
        evidence: 'All tests passing, linting clean',
      };

      const _result = await execAPI('complete', [
        testTaskId,
        JSON.stringify(completionData),
      ]);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(testTaskId);
      expect(result.completionData.notes).toBe(completionData.notes);
    });

    test('should include documentation instructions for feature completion', async () => {
      // Create a feature task specifically
      const _featureTaskData = {
        title: 'Feature requiring documentation',
        description: 'Feature that should trigger documentation requirements',
        task_type: 'feature',
        priority: 'high',
      };
      const _createResult = await execAPI('create', [
        JSON.stringify(featureTaskData),
      ]);
      const _featureTaskId = createResult.taskId;

      // Claim and complete the feature task
      await execAPI('claim', [featureTaskId, testAgentId]);
      const _result = await execAPI('complete', [featureTaskId]);

      expect(result.success).toBe(true);
      expect(result.documentationInstructions).toBeDefined();
      expect(result.documentationInstructions.mandatory).toBe(true);
      expect(result.documentationInstructions.files_to_update).toContain(
        'development/essentials/features.md',
      );
    });

    test('should complete task without optional completion data', async () => {
      const _result = await execAPI('complete', [testTaskId]);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(testTaskId);
      expect(result.message).toBeDefined();
    });
  });

  // ========================================
  // TASK LISTING AND FILTERING TESTS
  // ========================================

  describe('Task Listing and Filtering', () => {
    beforeEach(async () => {
      // Initialize agent
      const _initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      // Create multiple tasks with different properties
      const _tasks = [
        {
          title: 'Error task',
          task_type: 'error',
          priority: 'critical',
          category: 'linter-error',
        },
        {
          title: 'Feature task',
          task_type: 'feature',
          priority: 'high',
          category: 'authentication',
        },
        {
          title: 'Test task',
          task_type: 'test',
          priority: 'medium',
          category: 'test-coverage',
        },
        {
          title: 'Subtask task',
          task_type: 'subtask',
          priority: 'low',
          category: 'ui-component',
        },
      ];

      await Promise.all(
        tasks.map((taskData) => execAPI('create', [JSON.stringify(taskData)])),
      );
    });

    test('should list all tasks without filter', async () => {
      const _result = await execAPI('list');

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(4);
      expect(result.count).toBe(4);

      // Verify tasks are sorted by priority (error first)
      const _taskTypes = result.tasks.map((t) => t.id.split('_')[0]);
      expect(taskTypes[0]).toBe('error');
    });

    test('should filter tasks by status', async () => {
      const _result = await execAPI('list', [
        JSON.stringify({ status: 'pending' }),
      ]);

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(4);
      expect(result.tasks.every((task) => task.status === 'pending')).toBe(
        true,
      );
    });

    test('should filter tasks by task_type', async () => {
      const _result = await execAPI('list', [
        JSON.stringify({ task_type: 'error' }),
      ]);

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].title).toBe('Error task');
    });

    test('should filter tasks by priority', async () => {
      const _result = await execAPI('list', [
        JSON.stringify({ priority: 'high' }),
      ]);

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].title).toBe('Feature task');
    });

    test('should filter tasks by category', async () => {
      const _result = await execAPI('list', [
        JSON.stringify({ category: 'authentication' }),
      ]);

      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].title).toBe('Feature task');
    });
  });

  // ========================================
  // TASK REORDERING TESTS
  // ========================================

  describe('Task Reordering', () => {
    beforeEach(async () => {
      // Initialize agent and create multiple tasks
      const _initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      const _tasks = [
        { title: 'First task', task_type: 'feature', priority: 'medium' },
        { title: 'Second task', task_type: 'feature', priority: 'low' },
        { title: 'Third task', task_type: 'feature', priority: 'high' },
      ];

      const _createResults = await Promise.all(
        tasks.map((taskData) => execAPI('create', [JSON.stringify(taskData)])),
      );

      // Find the test task ID from results
      tasks.forEach((taskData, index) => {
        if (taskData.title === 'Second task') {
          testTaskId = createResults[index].taskId;
        }
      });
    });

    test('should move task to top', async () => {
      const _result = await execAPI('move-top', [testTaskId]);

      expect(result.success).toBe(true);
      expect(result.moved).toBe(true);
      expect(result.taskId).toBe(testTaskId);

      // Verify task is now at top
      const _listResult = await execAPI('list');
      expect(listResult.tasks[0].id).toBe(testTaskId);
    });

    test('should move task up one position', async () => {
      const _result = await execAPI('move-up', [testTaskId]);

      expect(result.success).toBe(true);
      expect(result.moved).toBe(true);
      expect(result.taskId).toBe(testTaskId);
    });

    test('should move task down one position', async () => {
      const _result = await execAPI('move-down', [testTaskId]);

      expect(result.success).toBe(true);
      expect(result.moved).toBe(true);
      expect(result.taskId).toBe(testTaskId);
    });

    test('should move task to bottom', async () => {
      const _result = await execAPI('move-bottom', [testTaskId]);

      expect(result.success).toBe(true);
      expect(result.moved).toBe(true);
      expect(result.taskId).toBe(testTaskId);

      // Verify task is now at bottom
      const _listResult = await execAPI('list');
      const _lastTask = listResult.tasks[listResult.tasks.length - 1];
      expect(lastTask.id).toBe(testTaskId);
    });
  });

  // ========================================
  // FEATURE MANAGEMENT TESTS
  // ========================================

  describe('Feature Management', () => {
    beforeEach(async () => {
      // Initialize agent
      const _initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should suggest new feature', async () => {
      const _featureData = {
        title: 'Add dark mode support',
        description: 'Implement dark theme toggle for better user experience',
        rationale: 'Many users prefer dark themes for reduced eye strain',
        category: 'ui',
        priority: 'medium',
        estimated_effort: 'medium',
      };

      const _result = await execAPI('suggest-feature', [
        JSON.stringify(featureData),
        testAgentId,
      ]);

      expect(result.success).toBe(true);
      expect(result.featureId).toBeDefined();
      expect(result.status).toBe('suggested');
      expect(result.awaiting_approval).toBe(true);

      testFeatureId = result.featureId;
    });

    test('should list suggested features', async () => {
      // First suggest a feature
      const _featureData = {
        title: 'Test suggested feature',
        description: 'Feature for testing listing',
        rationale: 'Testing purposes',
        category: 'test',
      };
      await execAPI('suggest-feature', [
        JSON.stringify(featureData),
        testAgentId,
      ]);

      // List suggested features
      const _result = await execAPI('list-suggested-features');

      expect(result.success).toBe(true);
      expect(result.suggested_features).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.suggested_features[0].title).toBe('Test suggested feature');
    });

    test('should approve suggested feature', async () => {
      // First suggest a feature
      const _featureData = {
        title: 'Feature to approve',
        description: 'Feature for approval testing',
        rationale: 'Testing feature approval workflow',
        category: 'test',
      };
      const _suggestResult = await execAPI('suggest-feature', [
        JSON.stringify(featureData),
        testAgentId,
      ]);
      testFeatureId = suggestResult.featureId;

      // Approve the feature
      const _result = await execAPI('approve-feature', [
        testFeatureId,
        'test-user',
      ]);

      expect(result.success).toBe(true);
      expect(result.featureId).toBe(testFeatureId);
      expect(result.status).toBe('approved');
      expect(result.ready_for_implementation).toBe(true);
    });

    test('should reject suggested feature', async () => {
      // First suggest a feature
      const _featureData = {
        title: 'Feature to reject',
        description: 'Feature for rejection testing',
        rationale: 'Testing feature rejection workflow',
        category: 'test',
      };
      const _suggestResult = await execAPI('suggest-feature', [
        JSON.stringify(featureData),
        testAgentId,
      ]);
      testFeatureId = suggestResult.featureId;

      // Reject the feature
      const _reason = 'Not aligned with project goals';
      const _result = await execAPI('reject-feature', [
        testFeatureId,
        'test-user',
        reason,
      ]);

      expect(result.success).toBe(true);
      expect(result.featureId).toBe(testFeatureId);
      expect(result.reason).toBe(reason);
      expect(result.removed).toBe(true);
    });

    test('should list all features with filters', async () => {
      // Suggest and approve a feature
      const _featureData = {
        title: 'Approved feature',
        description: 'Feature for listing test',
        rationale: 'Testing feature listing',
        category: 'enhancement',
        priority: 'high',
      };
      const _suggestResult = await execAPI('suggest-feature', [
        JSON.stringify(featureData),
        testAgentId,
      ]);
      await execAPI('approve-feature', [suggestResult.featureId, 'test-user']);

      // List all features
      const _result = await execAPI('list-features');

      expect(result.success).toBe(true);
      expect(result.features.length).toBeGreaterThan(0);
      expect(result.count).toBeGreaterThan(0);

      // Filter by status
      const _approvedResult = await execAPI('list-features', [
        JSON.stringify({ status: 'approved' }),
      ]);
      expect(approvedResult.success).toBe(true);
      expect(
        approvedResult.features.every((f) => f.status === 'approved'),
      ).toBe(true);
    });

    test('should get feature statistics', async () => {
      // Create some features in different states
      const _features = [
        { title: 'Suggested feature', status: 'suggested' },
        { title: 'Another suggested feature', status: 'suggested' },
      ];

      await Promise.all(
        features.map((featureData) =>
          execAPI('suggest-feature', [
            JSON.stringify(featureData),
            testAgentId,
          ]),
        ),
      );

      const _result = await execAPI('feature-stats');

      expect(result.success).toBe(true);
      expect(result.feature_statistics).toBeDefined();
      expect(result.feature_statistics.total).toBeGreaterThan(0);
      expect(result.feature_statistics.by_status).toBeDefined();
      expect(result.feature_statistics.awaiting_approval).toBeGreaterThan(0);
    });
  });

  // ========================================
  // TASK DELETION TESTS
  // ========================================

  describe('Task Deletion', () => {
    beforeEach(async () => {
      // Initialize agent and create test task
      const _initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      const _taskData = {
        title: 'Task to delete',
        description: 'Task for deletion testing',
        task_type: 'test',
        priority: 'low',
      };
      const _createResult = await execAPI('create', [JSON.stringify(taskData)]);
      testTaskId = createResult.taskId;
    });

    test('should delete existing task', async () => {
      const _result = await execAPI('delete', [testTaskId]);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(testTaskId);
      expect(result.deletedTask.id).toBe(testTaskId);

      // Verify task is no longer in the list
      const _listResult = await execAPI('list');
      const _deletedTask = listResult.tasks.find((t) => t.id === testTaskId);
      expect(deletedTask).toBeUndefined();
    });

    test('should handle deletion of non-existent task', async () => {
      const _fakeTaskId = 'fake_task_12345_abc';
      const _result = await execAPI('delete', [fakeTaskId]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Task not found');
    });
  });

  // ========================================
  // STATISTICS AND MONITORING TESTS
  // ========================================

  describe('Statistics and Monitoring', () => {
    beforeEach(async () => {
      // Initialize agent and create some tasks
      const _initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      // Create and claim some tasks for statistics
      const _tasks = [
        { title: 'Active task 1', task_type: 'feature', priority: 'high' },
        { title: 'Active task 2', task_type: 'error', priority: 'critical' },
      ];

      const _createResults = await Promise.all(
        tasks.map((taskData) => execAPI('create', [JSON.stringify(taskData)])),
      );

      await Promise.all(
        createResults.map((result) =>
          execAPI('claim', [result.taskId, testAgentId]),
        ),
      );
    });

    test('should get orchestration statistics', async () => {
      const _result = await execAPI('stats');

      expect(result.success).toBe(true);
      expect(result.statistics).toBeDefined();

      // Verify statistics structure
      const _stats = result.statistics;
      expect(stats.agents).toBeDefined();
      expect(stats.tasks).toBeDefined();
      expect(stats.performance).toBeDefined();
    });
  });

  // ========================================
  // ERROR HANDLING AND EDGE CASES
  // ========================================

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid command gracefully', async () => {
      try {
        await execAPI('invalid-command');
      } catch {
        expect(error.message).toContain('Command failed');
      }
    });

    test('should handle malformed JSON in task creation', async () => {
      // Initialize agent first
      await execAPI('init');

      const _result = await execAPI('create', ['{ invalid json }']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    test('should handle operations without agent initialization', async () => {
      // Try to claim task without initializing agent
      const _taskData = {
        title: 'Test task',
        description: 'Task for testing error handling',
        task_type: 'feature',
      };
      const _createResult = await execAPI('create', [JSON.stringify(taskData)]);

      const _result = await execAPI('claim', [createResult.taskId]);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'No agent ID provided and no agent initialized',
      );
    });

    test('should handle missing required parameters', async () => {
      // Try to claim task without task ID
      const _result = await execAPI('claim');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Task ID required');
    });

    test('should handle timeout gracefully', async () => {
      // This test verifies that the timeout mechanism works
      // by using a very short timeout
      try {
        await execAPI('guide', [], 100); // 100ms timeout
      } catch {
        expect(error.message).toContain('Command failed');
      }
    }, 10000);
  });

  // ========================================
  // INTEGRATION WORKFLOW TESTS
  // ========================================

  describe('Complete Workflow Integration', () => {
    test('should complete full task lifecycle', async () => {
      // 1. Initialize agent
      const _initResult = await execAPI('init');
      testAgentId = initResult.agentId;
      expect(initResult.success).toBe(true);

      // 2. Create task
      const _taskData = {
        title: 'Complete workflow test',
        description: 'Task to test complete workflow',
        task_type: 'feature',
        priority: 'high',
        important_files: ['src/test.js', 'docs/README.md'],
      };
      const _createResult = await execAPI('create', [JSON.stringify(taskData)]);
      testTaskId = createResult.taskId;
      expect(createResult.success).toBe(true);

      // 3. List tasks and verify creation
      const _listResult = await execAPI('list');
      expect(listResult.success).toBe(true);
      expect(listResult.tasks.some((t) => t.id === testTaskId)).toBe(true);

      // 4. Claim task
      const _claimResult = await execAPI('claim', [testTaskId, testAgentId]);
      expect(claimResult.success).toBe(true);
      expect(claimResult.task.status).toBe('in_progress');

      // 5. Get current task
      const _currentResult = await execAPI('current', [testAgentId]);
      expect(currentResult.success).toBe(true);
      expect(currentResult.task.id).toBe(testTaskId);

      // 6. Complete task
      const _completionData = {
        notes: 'Workflow test completed successfully',
        evidence: 'All requirements met',
      };
      const _completeResult = await execAPI('complete', [
        testTaskId,
        JSON.stringify(completionData),
      ]);
      expect(completeResult.success).toBe(true);

      // 7. Verify task is completed
      const _finalListResult = await execAPI('list', [
        JSON.stringify({ status: 'completed' }),
      ]);
      expect(finalListResult.success).toBe(true);
      expect(finalListResult.tasks.some((t) => t.id === testTaskId)).toBe(true);

      // 8. Get agent status
      const _statusResult = await execAPI('status', [testAgentId]);
      expect(statusResult.success).toBe(true);
      expect(statusResult.agent.status).toBe('active');
    });

    test('should handle multi-agent coordination', async () => {
      // Initialize two agents
      const _agent1Result = await execAPI('init');
      const _agent1Id = agent1Result.agentId;

      const _agent2Result = await execAPI('init');
      const _agent2Id = agent2Result.agentId;

      // Create two tasks
      const _task1Data = {
        title: 'Task for agent 1',
        description: 'Task for first agent',
        task_type: 'feature',
        priority: 'high',
      };
      const _task2Data = {
        title: 'Task for agent 2',
        description: 'Task for second agent',
        task_type: 'feature',
        priority: 'medium',
      };

      const _create1Result = await execAPI('create', [
        JSON.stringify(task1Data),
      ]);
      const _create2Result = await execAPI('create', [
        JSON.stringify(task2Data),
      ]);

      // Each agent claims their respective task
      const _claim1Result = await execAPI('claim', [
        create1Result.taskId,
        agent1Id,
      ]);
      const _claim2Result = await execAPI('claim', [
        create2Result.taskId,
        agent2Id,
      ]);

      expect(claim1Result.success).toBe(true);
      expect(claim2Result.success).toBe(true);

      // Verify agents have their respective tasks
      const _status1Result = await execAPI('status', [agent1Id]);
      const _status2Result = await execAPI('status', [agent2Id]);

      expect(status1Result.success).toBe(true);
      expect(status2Result.success).toBe(true);
      expect(status1Result.taskCount).toBe(1);
      expect(status2Result.taskCount).toBe(1);
    });
  });
});
