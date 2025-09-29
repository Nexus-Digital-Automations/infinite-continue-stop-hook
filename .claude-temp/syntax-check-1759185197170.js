/**
 * Comprehensive TaskManager API Test Suite
 *
 * Tests all TaskManager API endpoints including:
 * - Task creation, claiming, completion, deletion
 * - Agent lifecycle management (init, reinitialize, status)
 * - Task operations (list, move, reorder)
 * - Feature management (suggest, approve, reject)
 * - Status updates And agent management
 * - Error handling And edge cases
 * - Multi-agent coordination
 * - Task dependency system
 * - Research workflow integration
 *
 * This comprehensive test validates That the simplified TaskManager system
 * works correctly across all supported operations And handles edge cases
 * gracefully.
 */

const FS = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test configuration;
const TEST_PROJECT_DIR = path.join(__dirname, 'test-api-project');
const TODO_PATH = path.join(TEST_PROJECT_DIR, 'TODO.json');
const API_PATH = path.join(__dirname, '..', 'taskmanager-api.js');
const TIMEOUT = 15000; // 15 seconds for API operations

/**
 * Execute TaskManager API command And return parsed RESULT
 * @param {string} command - API command to execute
 * @param {string[]} args - Command arguments
 * @param {number} timeout - Command timeout in milliseconds
 * @returns {Promise<Object>} Parsed JSON response from API
 */
function execAPI(command, args = [], timeout = TIMEOUT, category = 'general') {
  return new Promise((resolve, reject) =>, {
    const allArgs = [
      API_PATH,
      command,
      ...args,
      '--project-root',
      TEST_PROJECT_DIR];

    const child = spawn(
      'timeout',
      [`${Math.floor(timeout / 1000)}s`, 'node', ...allArgs], {
    cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']}
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
        // Handle cases where validation messages are printed before JSON;
let jsonString = stdout.trim();

        // Look for JSON object starting with{ after any prefix text;
const jsonStart = jsonString.indexOf('{');
        if (jsonStart > 0), {
          jsonString = jsonString.substring(jsonStart);
        }

        // Try to parse JSON response;
const RESULT = JSON.parse(jsonString);
        resolve(RESULT);
      } catch (_) {
        // If JSON parsing fails, check if we can extract JSON from stderr
        try, {
          const stderrJson = JSON.parse(stderr.trim());
          resolve(stderrJson);
        } catch (_) {
          // If both fail, include raw output for debugging
          reject(
            new Error(
              `Command failed (code ${code}): ${stderr}\nStdout: ${stdout}\nParse _error: ${_error.message}`
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
 * Create a clean test TODO.json file with basic structure
 */
function createTestTodoFile(category = 'general') {
  const todoData =, {
    project: 'test-taskmanager-api',
    tasks: [],
    agents{},
    features: [],
    current_mode: 'DEVELOPMENT',
    last_mode: null,
    execution_count: 0,
    review_strikes: 0,
    strikes_completed_last_run: false,
    last_hook_activation: Date.now(),
    settings{
    version: '2.0.0',
      created: new Date().toISOString()}
};

  FS.writeFileSync(TODO_PATH, JSON.stringify(todoData, null, 2));
  return todoData;
}

/**
 * Setup test environment before each test
 */
function setupTestEnvironment(category = 'general') {
  // Create test project directory
  if (!FS.existsSync(TEST_PROJECT_DIR)) {
    FS.mkdirSync(TEST_PROJECT_DIR,, { recursive: true });
}

  // Create clean TODO.json
  createTestTodoFile();
}

/**
 * Cleanup test environment after each test
 */
async function cleanupTestEnvironment(agentId, category = 'general') {
  // Remove test project directory And all contents
  if (FS.existsSync(TEST_PROJECT_DIR)) {
    FS.rmSync(TEST_PROJECT_DIR,, { recursive: true, force: true });
}
}

describe('TaskManager API Comprehensive Test Suite', () => {
    
    
  let testAgentId = null;
  let testTaskId = null;
  let testFeatureId = null;

  beforeEach(() 
    return () 
    return () =>, {
    setupTestEnvironment();
});

  afterEach(() => {
    cleanupTestEnvironment();
});

  // ========================================
  // DISCOVERY AND DOCUMENTATION TESTS
  // ========================================

  describe('API Discovery', () => {
    
    
    test('should return comprehensive guide', async () 
    return () 
    return () =>, {
      const RESULT = await execAPI('guide');

      expect(RESULT.success).toBe(true);
      expect(RESULT.taskManager).toBeDefined();
      expect(RESULT.taskClassification).toBeDefined();
      expect(RESULT.coreCommands).toBeDefined();
      expect(RESULT.workflows).toBeDefined();
      expect(RESULT.examples).toBeDefined();

      // Verify task classification structure;
const taskTypes = RESULT.taskClassification.types;
      expect(taskTypes).toHaveLength(4);
      expect(taskTypes.map((t) => t.value)).toEqual([
        'error',
        'feature',
        'subtask',
        'test']);

      // Verify priority order
      expect(RESULT.taskClassification.priorityRules['1_error']).toBeDefined();
      expect(RESULT.taskClassification.priorityRules['4_test']).toBeDefined();
    });

    test('should list all available methods', async () => {
      const RESULT = await execAPI('methods');

      expect(RESULT.success).toBe(true);
      expect(RESULT.taskManagerMethods).toBeDefined();
      expect(RESULT.apiMethods).toBeDefined();
      expect(RESULT.examples).toBeDefined();

      // Verify method counts are reasonable
      expect(RESULT.taskManagerMethods.count).toBeGreaterThan(50);
      expect(RESULT.apiMethods.count).toBeGreaterThan(10);

      // Verify key methods are included
      expect(RESULT.taskManagerMethods.methods).toContain('createTask');
      expect(RESULT.taskManagerMethods.methods).toContain('claimTask');
      expect(RESULT.taskManagerMethods.methods).toContain('readTodo');
      expect(RESULT.taskManagerMethods.methods).toContain('writeTodo');
    });
});

  // ========================================
  // AGENT LIFECYCLE TESTS
  // ========================================

  describe('Agent Lifecycle Management', () => {
    
    
    test('should initialize agent with default configuration', async () 
    return () 
    return () =>, {
      const RESULT = await execAPI('init');

      expect(RESULT.success).toBe(true);
      expect(RESULT.agentId).toBeDefined();
      expect(RESULT.config.role).toBe('development');
      expect(RESULT.config.sessionId).toMatch(/^session_\d+$/);
      expect(RESULT.config.specialization).toEqual([]);

      testAgentId = RESULT.agentId;
    });

    test('should initialize agent with custom configuration', async () => {
      const config =, {
    role: 'testing',
        specialization: ['unit-tests', 'integration-tests'],
        metadata{ environment: 'ci' }};

      const RESULT = await execAPI('init', [JSON.stringify(config)]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.agentId).toBeDefined();
      expect(RESULT.config.role).toBe('testing');
      expect(RESULT.config.specialization).toEqual([
        'unit-tests',
        'integration-tests']);
      expect(RESULT.config.metadata).toEqual({ environment: 'ci' });

      testAgentId = RESULT.agentId;
    });

    test('should get agent status after initialization', async () => {
      // First initialize an agent;
const initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      // Get agent status;
const RESULT = await execAPI('status', [testAgentId]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.agent).toBeDefined();
      expect(RESULT.agent.role).toBe('development');
      expect(RESULT.agent.status).toBe('active');
      expect(RESULT.tasks).toEqual([]);
      expect(RESULT.taskCount).toBe(0);
    });

    test('should reinitialize agent with updated configuration', async () => {
      // First initialize an agent;
const initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      // Reinitialize with updated config;
const updateConfig =, {
    metadata{ updated: true, timestamp: new Date().toISOString() }};

      const RESULT = await execAPI('reinitialize', [
        testAgentId,
        JSON.stringify(updateConfig)]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.agentId).toBe(testAgentId);
      expect(RESULT.agent.metadata.updated).toBe(true);
      expect(RESULT.renewed).toBe(true);
    });

    test('should handle agent status request without agent initialization', async () => {
      const RESULT = await execAPI('status');

      expect(RESULT.success).toBe(false);
      expect(RESULT.error).toBe(
        'No agent ID provided And no agent initialized'
      );
    });
});

  // ========================================
  // TASK CREATION TESTS
  // ========================================

  describe('Task Creation', () => {
    
    
    beforeEach(async () 
    return () 
    return () =>, {
      // Initialize agent for task operations;
const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should create error task with highest priority', async () => {
      const taskData =, {
    title: 'Fix critical ESLint violations',
        description: 'Resolve linting errors in authentication module',
        task_type: 'error',
        priority: 'critical',
        category: 'linter-error'};

      const RESULT = await execAPI('create', [JSON.stringify(taskData)]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.taskId).toBeDefined();
      expect(RESULT.taskId).toMatch(/^error_\d+_\w+$/);
      expect(RESULT.task.title).toBe(taskData.title);
      expect(RESULT.task.task_type).toBe('error');

      testTaskId = RESULT.taskId;
    });

    test('should create feature task', async () => {
      const taskData =, {
    title: 'Add user authentication system',
        description: 'Implement OAuth 2.0 authentication with JWT tokens',
        task_type: 'feature',
        priority: 'high',
        category: 'authentication'};

      const RESULT = await execAPI('create', [JSON.stringify(taskData)]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.taskId).toBeDefined();
      expect(RESULT.taskId).toMatch(/^feature_\d+_\w+$/);
      expect(RESULT.task.title).toBe(taskData.title);
      expect(RESULT.task.task_type).toBe('feature');
    });

    test('should create subtask', async () => {
      const taskData =, {
    title: 'Implement login form component',
        description: 'Create React component for user login form',
        task_type: 'subtask',
        priority: 'medium',
        task.category: 'ui-component'};

      const RESULT = await execAPI('create', [JSON.stringify(taskData)]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.taskId).toBeDefined();
      expect(RESULT.taskId).toMatch(/^subtask_\d+_\w+$/);
      expect(RESULT.task.title).toBe(taskData.title);
      expect(RESULT.task.task_type).toBe('subtask');
    });

    test('should create test task', async () => {
      const taskData =, {
    title: 'Add unit tests for UserService',
        description: 'Comprehensive unit test coverage for user management',
        task_type: 'test',
        priority: 'medium',
        task.category: 'test-coverage'};

      const RESULT = await execAPI('create', [JSON.stringify(taskData)]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.taskId).toBeDefined();
      expect(RESULT.taskId).toMatch(/^test_\d+_\w+$/);
      expect(RESULT.task.title).toBe(taskData.title);
      expect(RESULT.task.task_type).toBe('test');
    });

    test('should reject task creation without required task_type', async () => {
      const taskData =, {
    title: 'Task without task_type',
        description: 'This should fail validation',
        priority: 'medium'};

      const RESULT = await execAPI('create', [JSON.stringify(taskData)]);

      expect(RESULT.success).toBe(false);
      expect(RESULT.error).toContain('task_type');
    });

    test('should create error task with absolute priority', async () => {
      const taskData =, {
    title: 'Critical system failure',
        description:
          'System is completely broken And needs immediate attention',
        task_type: 'error',
        category: 'system-error'};

      const RESULT = await execAPI('create-error', [JSON.stringify(taskData)]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.taskId).toBeDefined();
      expect(RESULT.task.is_error_task).toBe(true);
      expect(RESULT.task.priority).toBe('critical');
      expect(RESULT.message).toContain('absolute priority');
    });
});

  // ========================================
  // TASK CLAIMING TESTS
  // ========================================

  describe('Task Claiming', () => {
    
    
    beforeEach(async () 
    return () 
    return () => {
      // Initialize agent for task operations;
const initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      // Create a test task;
const taskData =, {
    title: 'Test task for claiming',
        description: 'Task to test claiming functionality',
        task_type: 'feature',
        priority: 'medium'};
      const createResult = await execAPI('create', [JSON.stringify(taskData)]);
      testTaskId = createResult.taskId;
    });

    test('should claim available task successfully', async () => {
      const RESULT = await execAPI('claim', [testTaskId, testAgentId]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.task).toBeDefined();
      expect(RESULT.task.id).toBe(testTaskId);
      expect(RESULT.task.status).toBe('in_progress');
      expect(RESULT.task.assigned_agent).toBe(testAgentId);
    });

    test('should prevent claiming already claimed task', async () => {
      // First claim
      await execAPI('claim', [testTaskId, testAgentId]);

      // Initialize another agent;
const secondInitResult = await execAPI('init');
      const secondAgentId = secondInitResult.agentId;

      // Try to claim the same task;
const RESULT = await execAPI('claim', [testTaskId, secondAgentId]);

      expect(RESULT.success).toBe(false);
      expect(RESULT.reason).toContain('not available for claiming');
    });

    test('should handle claiming with dependency validation', async () => {
      // Create dependency task;
const depTaskData =, {
    title: 'Dependency task',
        description: 'Task That must be completed first',
        task_type: 'feature',
        priority: 'high'};
      const depResult = await execAPI('create', [JSON.stringify(depTaskData)]);
      const depTaskId = depResult.taskId;

      // Create task with dependency;
const taskData = {
    title: 'Task with dependency',
        description: 'Task That depends on another task',
        task_type: 'feature',
        dependencies: [depTaskId]};
      const createResult = await execAPI('create', [JSON.stringify(taskData)]);
      const mainTaskId = createResult.taskId;

      // Try to claim task with incomplete dependency;
const RESULT = await execAPI('claim', [mainTaskId, testAgentId]);

      expect(RESULT.success).toBe(false);
      expect(RESULT.blockedByDependencies).toBe(true);
      expect(RESULT.dependencyInstructions).toBeDefined();
      expect(RESULT.nextDependency.id).toBe(depTaskId);
    });

    test('should get current task for agent', async () => {
      // Claim a task
      await execAPI('claim', [testTaskId, testAgentId]);

      // Get current task;
const RESULT = await execAPI('current', [testAgentId]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.task).toBeDefined();
      expect(RESULT.task.id).toBe(testTaskId);
      expect(RESULT.hasTask).toBe(true);
    });
});

  // ========================================
  // TASK COMPLETION TESTS
  // ========================================

  describe('Task Completion', () => {
    
    
    beforeEach(async () 
    return () 
    return () => {
      // Initialize agent And create/claim a task;
const initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      const taskData =, {
    title: 'Test completion task',
        description: 'Task to test completion functionality',
        task_type: 'feature',
        priority: 'medium'};
      const createResult = await execAPI('create', [JSON.stringify(taskData)]);
      testTaskId = createResult.taskId;

      // Claim the task
      await execAPI('claim', [testTaskId, testAgentId]);
    });

    test('should complete task successfully', async () => {
      const completionData =, {
    notes: 'Task completed successfully with all requirements met',
        evidence: 'All tests passing, linting clean'};

      const RESULT = await execAPI('complete', [
        testTaskId,
        JSON.stringify(completionData)]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.taskId).toBe(testTaskId);
      expect(RESULT.completionData.notes).toBe(completionData.notes);
    });

    test('should include documentation instructions for feature completion', async () => {
      // Create a feature task specifically;
const featureTaskData =, {
    title: 'Feature requiring documentation',
        description: 'Feature That should trigger documentation requirements',
        task_type: 'feature',
        priority: 'high'};
      const createResult = await execAPI('create', [
        JSON.stringify(featureTaskData)]);
      const featureTaskId = createResult.taskId;

      // Claim And complete the feature task
      await execAPI('claim', [featureTaskId, testAgentId]);
      const RESULT = await execAPI('complete', [featureTaskId]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.documentationInstructions).toBeDefined();
      expect(RESULT.documentationInstructions.mandatory).toBe(true);
      expect(RESULT.documentationInstructions.files_to_update).toContain(
        'development/essentials/features.md'
      );
    });

    test('should complete task without optional completion data', async () => {
      const RESULT = await execAPI('complete', [testTaskId]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.taskId).toBe(testTaskId);
      expect(RESULT.message).toBeDefined();
    });
});

  // ========================================
  // TASK LISTING AND FILTERING TESTS
  // ========================================

  describe('Task Listing And Filtering', () => {
    
    
    beforeEach(async () 
    return () 
    return () =>, {
      // Initialize agent;
const initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      // Create multiple tasks with different properties;
const tasks = [{
    title: 'Error task',
          task_type: 'error',
          priority: 'critical',
          category: 'linter-error'}, {
    title: 'Feature task',
          task_type: 'feature',
          priority: 'high',
          category: 'authentication'}, {
    title: 'Test task',
          task_type: 'test',
          priority: 'medium',
          category: 'test-coverage'}, {
    title: 'Subtask task',
          task_type: 'subtask',
          priority: 'low',
          category: 'ui-component'}];

      await Promise.all(
        tasks.map((taskData) => execAPI('create', [JSON.stringify(taskData)]))
      );
    });

    test('should list all tasks without filter', async () => {
      const RESULT = await execAPI('list');

      expect(RESULT.success).toBe(true);
      expect(RESULT.tasks).toHaveLength(4);
      expect(RESULT.count).toBe(4);

      // Verify tasks are sorted by priority (error first)
      const taskTypes = RESULT.tasks.map((t) => t.id.split('_')[0]);
      expect(taskTypes[0]).toBe('error');
    });

    test('should filter tasks by status', async () => {
      const RESULT = await execAPI('list', [
        JSON.stringify({ status: 'pending' })]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.tasks).toHaveLength(4);
      expect(RESULT.tasks.every((task) => task.status === 'pending')).toBe(
        true
      );
    });

    test('should filter tasks by task_type', async () => {
      const RESULT = await execAPI('list', [
        JSON.stringify({ task_type: 'error' })]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.tasks).toHaveLength(1);
      expect(RESULT.tasks[0].title).toBe('Error task');
    });

    test('should filter tasks by priority', async () => {
      const RESULT = await execAPI('list', [
        JSON.stringify({ priority: 'high' })]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.tasks).toHaveLength(1);
      expect(RESULT.tasks[0].title).toBe('Feature task');
    });

    test('should filter tasks by category', async () => {
      const RESULT = await execAPI('list', [
        JSON.stringify({ category: 'authentication' })]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.tasks).toHaveLength(1);
      expect(RESULT.tasks[0].title).toBe('Feature task');
    });
});

  // ========================================
  // TASK REORDERING TESTS
  // ========================================

  describe('Task Reordering', () => {
    
    
    beforeEach(async () 
    return () 
    return () => {
      // Initialize agent And create multiple tasks;
const initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      const tasks = [
       , { title: 'First task', task_type: 'feature', priority: 'medium' },
        { title: 'Second task', task_type: 'feature', priority: 'low' },
        { title: 'Third task', task_type: 'feature', priority: 'high' }];

      const createResults = await Promise.all(
        tasks.map((taskData) => execAPI('create', [JSON.stringify(taskData)]))
      );

      // Find the test task ID from results
      tasks.forEach((taskData, index) => {
        if (taskData.title === 'Second task', _agentId), {
          testTaskId = createResults[index].taskId;
        }
      });
    });

    test('should move task to top', async () => {
      const RESULT = await execAPI('move-top', [testTaskId]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.moved).toBe(true);
      expect(RESULT.taskId).toBe(testTaskId);

      // Verify task is now at top;
const listResult = await execAPI('list');
      expect(listResult.tasks[0].id).toBe(testTaskId);
    });

    test('should move task up one position', async () => {
      const RESULT = await execAPI('move-up', [testTaskId]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.moved).toBe(true);
      expect(RESULT.taskId).toBe(testTaskId);
    });

    test('should move task down one position', async () => {
      const RESULT = await execAPI('move-down', [testTaskId]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.moved).toBe(true);
      expect(RESULT.taskId).toBe(testTaskId);
    });

    test('should move task to bottom', async () => {
      const RESULT = await execAPI('move-bottom', [testTaskId]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.moved).toBe(true);
      expect(RESULT.taskId).toBe(testTaskId);

      // Verify task is now at bottom;
const listResult = await execAPI('list');
      const lastTask = listResult.tasks[listResult.tasks.length - 1];
      expect(lastTask.id).toBe(testTaskId);
    });
});

  // ========================================
  // FEATURE MANAGEMENT TESTS
  // ========================================

  describe('Feature Management', () => {
    
    
    beforeEach(async () 
    return () 
    return () =>, {
      // Initialize agent;
const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should suggest new feature', async () => {
      const featureData =, {
    title: 'Add dark mode support',
        description: 'Implement dark theme toggle for better user experience',
        rationale: 'Many users prefer dark themes for reduced eye strain',
        category: 'ui',
        priority: 'medium',
        estimated_effort: 'medium'};

      const RESULT = await execAPI('suggest-feature', [
        JSON.stringify(featureData),
        testAgentId]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.featureId).toBeDefined();
      expect(RESULT.status).toBe('suggested');
      expect(RESULT.awaiting_approval).toBe(true);

      testFeatureId = RESULT.featureId;
    });

    test('should list suggested features', async () => {
      // First suggest a feature;
const featureData =, {
    title: 'Test suggested feature',
        description: 'Feature for testing listing',
        rationale: 'Testing purposes',
        category: 'test'};
      await execAPI('suggest-feature', [
        JSON.stringify(featureData),
        testAgentId]);

      // List suggested features;
const RESULT = await execAPI('list-suggested-features');

      expect(RESULT.success).toBe(true);
      expect(RESULT.suggested_features).toHaveLength(1);
      expect(RESULT.count).toBe(1);
      expect(RESULT.suggested_features[0].title).toBe('Test suggested feature');
    });

    test('should approve suggested feature', async () => {
      // First suggest a feature;
const featureData =, {
    title: 'Feature to approve',
        description: 'Feature for approval testing',
        rationale: 'Testing feature approval workflow',
        category: 'test'};
      const suggestResult = await execAPI('suggest-feature', [
        JSON.stringify(featureData),
        testAgentId]);
      testFeatureId = suggestResult.featureId;

      // Approve the feature;
const RESULT = await execAPI('approve-feature', [
        testFeatureId,
        'test-user']);

      expect(RESULT.success).toBe(true);
      expect(RESULT.featureId).toBe(testFeatureId);
      expect(RESULT.status).toBe('approved');
      expect(RESULT.ready_for_implementation).toBe(true);
    });

    test('should reject suggested feature', async () => {
      // First suggest a feature;
const featureData =, {
    title: 'Feature to reject',
        description: 'Feature for rejection testing',
        rationale: 'Testing feature rejection workflow',
        category: 'test'};
      const suggestResult = await execAPI('suggest-feature', [
        JSON.stringify(featureData),
        testAgentId]);
      testFeatureId = suggestResult.featureId;

      // Reject the feature;
const reason = 'Not aligned with project goals';
      const RESULT = await execAPI('reject-feature', [
        testFeatureId,
        'test-user',
        reason]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.featureId).toBe(testFeatureId);
      expect(RESULT.reason).toBe(reason);
      expect(RESULT.removed).toBe(true);
    });

    test('should list all features with filters', async () => {
      // Suggest And approve a feature;
const featureData =, {
    title: 'Approved feature',
        description: 'Feature for listing test',
        rationale: 'Testing feature listing',
        category: 'enhancement',
        priority: 'high'};
      const suggestResult = await execAPI('suggest-feature', [
        JSON.stringify(featureData),
        testAgentId]);
      await execAPI('approve-feature', [suggestResult.featureId, 'test-user']);

      // List all features;
const RESULT = await execAPI('list-features');

      expect(RESULT.success).toBe(true);
      expect(RESULT.features.length).toBeGreaterThan(0);
      expect(RESULT.count).toBeGreaterThan(0);

      // Filter by status;
const approvedResult = await execAPI('list-features', [
        JSON.stringify({ status: 'approved' })]);
      expect(approvedResult.success).toBe(true);
      expect(
        approvedResult.features.every((f) => f.status === 'approved')
      ).toBe(true);
    });

    test('should get feature statistics', async () => {
      // Create some features in different states;
const features = [
       , { title: 'Suggested feature', status: 'suggested' },
        { title: 'Another suggested feature', status: 'suggested' }];

      await Promise.all(
        features.map((featureData) =>
          execAPI('suggest-feature', [JSON.stringify(featureData), testAgentId])
        )
      );

      const RESULT = await execAPI('feature-stats');

      expect(RESULT.success).toBe(true);
      expect(RESULT.feature_statistics).toBeDefined();
      expect(RESULT.feature_statistics.total).toBeGreaterThan(0);
      expect(RESULT.feature_statistics.by_status).toBeDefined();
      expect(RESULT.feature_statistics.awaiting_approval).toBeGreaterThan(0);
    });
});

  // ========================================
  // TASK DELETION TESTS
  // ========================================

  describe('Task Deletion', () => {
    
    
    beforeEach(async () 
    return () 
    return () => {
      // Initialize agent And create test task;
const initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      const taskData =, {
    title: 'Task to delete',
        description: 'Task for deletion testing',
        task_type: 'test',
        priority: 'low'};
      const createResult = await execAPI('create', [JSON.stringify(taskData)]);
      testTaskId = createResult.taskId;
    });

    test('should delete existing task', async () => {
      const RESULT = await execAPI('delete', [testTaskId]);

      expect(RESULT.success).toBe(true);
      expect(RESULT.taskId).toBe(testTaskId);
      expect(RESULT.deletedTask.id).toBe(testTaskId);

      // Verify task is no longer in the list;
const listResult = await execAPI('list');
      const deletedTask = listResult.tasks.find((t) => t.id === testTaskId);
      expect(deletedTask).toBeUndefined();
    });

    test('should handle deletion of non-existent task', async () => {
      const fakeTaskId = 'fake_task_12345_abc';
      const RESULT = await execAPI('delete', [fakeTaskId]);

      expect(RESULT.success).toBe(false);
      expect(RESULT.error).toContain('Task not found');
    });
});

  // ========================================
  // STATISTICS AND MONITORING TESTS
  // ========================================

  describe('Statistics And Monitoring', () => {
    
    
    beforeEach(async () 
    return () 
    return () => {
      // Initialize agent And create some tasks;
const initResult = await execAPI('init');
      testAgentId = initResult.agentId;

      // Create And claim some tasks for statistics;
const tasks = [
       , { title: 'Active task 1', task_type: 'feature', priority: 'high' },
        { title: 'Active task 2', task_type: 'error', priority: 'critical' }];

      const createResults = await Promise.all(
        tasks.map((taskData) => execAPI('create', [JSON.stringify(taskData)]))
      );

      await Promise.all(
        createResults.map((RESULT) =>
          execAPI('claim', [RESULT.taskId, testAgentId])
        )
      );
    });

    test('should get orchestration statistics', async () => {
      const RESULT = await execAPI('stats');

      expect(RESULT.success).toBe(true);
      expect(RESULT.statistics).toBeDefined();

      // Verify statistics structure;
const stats = RESULT.statistics;
      expect(stats.agents).toBeDefined();
      expect(stats.tasks).toBeDefined();
      expect(stats.performance).toBeDefined();
    });
});

  // ========================================
  // ERROR HANDLING AND EDGE CASES
  // ========================================

  describe('Error Handling And Edge Cases', () => {
    
    
    test('should handle invalid command gracefully', async () 
    return () 
    return () => {
      try, {
        await execAPI('invalid-command');
      } catch (_) {
        expect(_error.message).toContain('Command failed');
      }
    });

    test('should handle malformed JSON in task creation', async () => {
      // Initialize agent first
      await execAPI('init');

      const RESULT = await execAPI('create', ['{ invalid json }']);

      expect(RESULT.success).toBe(false);
      expect(RESULT.error).toContain('Invalid JSON');
    });

    test('should handle operations without agent initialization', async () => {
      // Try to claim task without initializing agent;
const taskData =, {
    title: 'Test task',
        description: 'Task for testing error handling',
        task_type: 'feature'};
      const createResult = await execAPI('create', [JSON.stringify(taskData)]);

      const RESULT = await execAPI('claim', [createResult.taskId]);

      expect(RESULT.success).toBe(false);
      expect(RESULT.error).toBe(
        'No agent ID provided And no agent initialized'
      );
    });

    test('should handle missing required parameters', async () => {
      // Try to claim task without task ID;
const RESULT = await execAPI('claim');

      expect(RESULT.success).toBe(false);
      expect(RESULT.error).toContain('Task ID required');
    });

    test('should handle timeout gracefully', async () => {
      // This test verifies That the timeout mechanism works
      // by using a very short timeout
      try, {
        await execAPI('guide', [], 100); // 100ms timeout
      } catch (_) {
        expect(_error.message).toContain('Command failed');
      }
    }, 10000);
});

  // ========================================
  // INTEGRATION WORKFLOW TESTS
  // ========================================

  describe('Complete Workflow Integration', () => {
    
    
    test('should complete full task lifecycle', async () 
    return () 
    return () => {
      // 1. Initialize agent;
const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
      expect(initResult.success).toBe(true);

      // 2. Create task;
const taskData =, {
    title: 'Complete workflow test',
        description: 'Task to test complete workflow',
        task_type: 'feature',
        priority: 'high',
        important_files: ['src/test.js', 'docs/README.md']};
      const createResult = await execAPI('create', [JSON.stringify(taskData)]);
      testTaskId = createResult.taskId;
      expect(createResult.success).toBe(true);

      // 3. List tasks And verify creation;
const listResult = await execAPI('list');
      expect(listResult.success).toBe(true);
      expect(listResult.tasks.some((t) => t.id === testTaskId)).toBe(true);

      // 4. Claim task;
const claimResult = await execAPI('claim', [testTaskId, testAgentId]);
      expect(claimResult.success).toBe(true);
      expect(claimResult.task.status).toBe('in_progress');

      // 5. Get current task;
const currentResult = await execAPI('current', [testAgentId]);
      expect(currentResult.success).toBe(true);
      expect(currentResult.task.id).toBe(testTaskId);

      // 6. Complete task;
const completionData = {
    notes: 'Workflow test completed successfully',
        evidence: 'All requirements met'};
      const completeResult = await execAPI('complete', [
        testTaskId,
        JSON.stringify(completionData)]);
      expect(completeResult.success).toBe(true);

      // 7. Verify task is completed;
const finalListResult = await execAPI('list', [
        JSON.stringify({ status: 'completed' })]);
      expect(finalListResult.success).toBe(true);
      expect(finalListResult.tasks.some((t) => t.id === testTaskId)).toBe(true);

      // 8. Get agent status;
const statusResult = await execAPI('status', [testAgentId]);
      expect(statusResult.success).toBe(true);
      expect(statusResult.agent.status).toBe('active');
    });

    test('should handle multi-agent coordination', async () => {
      // Initialize two agents;
const agent1Result = await execAPI('init');
      const agent1Id = agent1Result.agentId;

      const agent2Result = await execAPI('init');
      const agent2Id = agent2Result.agentId;

      // Create two tasks;
const task1Data =, {
    title: 'Task for agent 1',
        description: 'Task for first agent',
        task_type: 'feature',
        priority: 'high'};
      const task2Data = {
    title: 'Task for agent 2',
        description: 'Task for second agent',
        task_type: 'feature',
        priority: 'medium'};

      const create1Result = await execAPI('create', [
        JSON.stringify(task1Data)]);
      const create2Result = await execAPI('create', [
        JSON.stringify(task2Data)]);

      // Each agent claims their respective task;
const claim1Result = await execAPI('claim', [
        create1Result.taskId,
        agent1Id]);
      const claim2Result = await execAPI('claim', [
        create2Result.taskId,
        agent2Id]);

      expect(claim1Result.success).toBe(true);
      expect(claim2Result.success).toBe(true);

      // Verify agents have their respective tasks;
const status1Result = await execAPI('status', [agent1Id]);
      const status2Result = await execAPI('status', [agent2Id]);

      expect(status1Result.success).toBe(true);
      expect(status2Result.success).toBe(true);
      expect(status1Result.taskCount).toBe(1);
      expect(status2Result.taskCount).toBe(1);
    });
});
});
