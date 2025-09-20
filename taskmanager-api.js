#!/usr/bin/env node
/**
 * TaskManager Node.js API Wrapper - Refactored Modular Version
 *
 * === OVERVIEW ===
 * Universal command-line interface for the TaskManager system that provides
 * comprehensive task management capabilities for any project. This API acts as
 * a centralized gateway to all TaskManager functionality including agent
 * management, task operations, dependency handling, and orchestration.
 *
 * === KEY FEATURES ===
 * • Universal project support - works with any codebase containing TODO.json
 * • Agent lifecycle management - initialization, heartbeat renewal, status tracking
 * • Task operations - create, claim, complete, list, filter, reorder
 * • Dependency system - automatic dependency detection and guidance
 * • Research workflow integration - intelligent research task suggestions
 * • Multi-agent orchestration - coordinates multiple concurrent agents
 * • Performance optimized - 10-second timeouts, lazy loading, caching
 * • Error recovery - robust error handling with detailed feedback
 * • Modular architecture - functionality split into focused modules
 *
 * === REFACTORED ARCHITECTURE ===
 * Main Coordinator (this file) delegates to specialized modules:
 * • TaskOperations - Create, claim, complete, fail, delete, list tasks
 * • AgentManagement - Initialize, status, reinitialize, list agents
 * • TaskOrdering - Move tasks up/down/top/bottom priority
 * • ValidationUtils - All validation logic
 * • GuideManager - API guides and documentation
 * • WebSocketManager - Real-time communication
 * • StatisticsManager - Analytics and reporting
 *
 * @author TaskManager System
 * @version 2.0.0
 * @since 2024-01-01
 *
 * Usage: node taskmanager-api.js <command> [args...] [--project-root /path/to/project]
 */

const _path = require('path');

// Parse project root from --project-root flag or use current directory
const args = process.argv.slice(2);
const projectRootIndex = args.indexOf('--project-root');
const PROJECT_ROOT =
  projectRootIndex !== -1 && projectRootIndex + 1 < args.length
    ? args[projectRootIndex + 1]
    : process.cwd();
const TODO_PATH = _path.join(PROJECT_ROOT, 'TODO.json');

// Remove --project-root and its value from args for command parsing
if (projectRootIndex !== -1) {
  args.splice(projectRootIndex, 2);
}

// Absolute path to the infinite-continue-stop-hook directory (where TaskManager system lives)
const TASKMANAGER_ROOT = __dirname;

// Import TaskManager modules using absolute paths
let TaskManager, AgentManager, MultiAgentOrchestrator;

// Import modular API components
let _cliInterface;

// Import our new modular components
let TaskOperations, AgentManagement, TaskOrdering, ValidationUtils, RAGOperations;

try {
  // Import TaskManager modules using absolute paths
  TaskManager = require(_path.join(TASKMANAGER_ROOT, 'lib', 'taskManager.js'));
  AgentManager = require(_path.join(TASKMANAGER_ROOT, 'lib', 'agentManager.js'));
  MultiAgentOrchestrator = require(
    _path.join(TASKMANAGER_ROOT, 'lib', 'multiAgentOrchestrator.js'),
  );

  // Import modular API components
  cliInterface = require(
    _path.join(TASKMANAGER_ROOT, 'lib', 'api-modules', 'cli', 'cliInterface.js'),
  );

  // Import our refactored modules
  TaskOperations = require(
    _path.join(
      TASKMANAGER_ROOT,
      'lib',
      'api-modules',
      'core',
      'taskOperations.js',
    ),
  );
  AgentManagement = require(
    _path.join(
      TASKMANAGER_ROOT,
      'lib',
      'api-modules',
      'core',
      'agentManagement.js',
    ),
  );
  TaskOrdering = require(
    _path.join(
      TASKMANAGER_ROOT,
      'lib',
      'api-modules',
      'core',
      'taskOrdering.js',
    ),
  );
  ValidationUtils = require(
    _path.join(
      TASKMANAGER_ROOT,
      'lib',
      'api-modules',
      'core',
      'validationUtils.js',
    ),
  );
  RAGOperations = require(
    _path.join(
      TASKMANAGER_ROOT,
      'lib',
      'api-modules',
      'rag',
      'ragOperations.js',
    ),
  );
} catch (error) {
  const loadError = new Error(
    `Failed to load TaskManager modules: ${error.message}`,
  );
  loadError.originalError = error;
  throw loadError;
}

/**
 * Refactored TaskManagerAPI - Slim coordinator class
 *
 * This class now acts as a facade that delegates to specialized modules
 * while maintaining the exact same API surface for backward compatibility.
 */
class TaskManagerAPI {
  constructor() {
    // Core TaskManager for TODO.json operations and task management
    this.taskManager = new TaskManager(TODO_PATH, {
      enableMultiAgent: true, // Enable multi-agent coordination features
      enableAutoFix: false, // Disable auto-fix for better performance
      validateOnRead: false, // Disable validation for better performance
    });

    // Agent management for registration, heartbeat, and lifecycle
    this.agentManager = new AgentManager(TODO_PATH);

    // WebSocket server for real-time communication
    this.webSocketServer = null;
    this.httpServer = null;
    this.webSocketClients = new Set();
    this.isWebSocketRunning = false;

    // Multi-agent orchestration for concurrent operations
    this.orchestrator = new MultiAgentOrchestrator(TODO_PATH);

    // Session state - current agent ID (null until agent is initialized)
    this.agentId = null;

    // Performance configuration - 10 second timeout for all operations
    this.timeout = 10000;

    // Guide caching system for performance optimization
    this._cachedGuide = null;
    this._guideCacheTime = 0;
    this._guideCacheDuration = 60000; // 1 minute cache duration
    this._guideGenerationInProgress = false;

    // Initialize specialized modules with dependencies
    this._initializeModules();
  }

  /**
   * Initialize specialized modules with required dependencies
   */
  _initializeModules() {
    const dependencies = {
      taskManager: this.taskManager,
      agentManager: this.agentManager,
      withTimeout: this.withTimeout.bind(this),
      getGuideForError: this._getGuideForError.bind(this),
      getFallbackGuide: this._getFallbackGuide.bind(this),
      validateScopeRestrictions: ValidationUtils.validateScopeRestrictions,
      validateCompletionData: ValidationUtils.validateCompletionData,
      validateFailureData: ValidationUtils.validateFailureData,
      validateTaskEvidence: ValidationUtils.validateTaskEvidence,
      validateAgentScope: this._validateAgentScope.bind(this),
      broadcastTaskCompletion: this._broadcastTaskCompletion.bind(this),
      broadcastTaskFailed: this._broadcastTaskFailed.bind(this),
      // Subtasks and Success Criteria validation methods
      validateSubtaskData: ValidationUtils.validateSubtaskData,
      validateSuccessCriteria: ValidationUtils.validateSuccessCriteria,
      validateSubtaskUpdateData: ValidationUtils.validateSubtaskUpdateData,
      // Specialized broadcasting for subtasks and success criteria
      broadcastSubtaskUpdate: this._broadcastSubtaskUpdate.bind(this),
      broadcastCriteriaUpdate: this._broadcastCriteriaUpdate.bind(this),
    };

    // Initialize module instances
    this.taskOperations = new TaskOperations(dependencies);
    this.agentManagement = new AgentManagement(dependencies);
    this.taskOrdering = new TaskOrdering(dependencies);
    this.ragOperations = new RAGOperations(dependencies);
  }

  /**
   * Wrap any async operation with a timeout to prevent hanging operations
   */
  withTimeout(promise, timeoutMs = this.timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  }

  // =================== DELEGATED METHODS ===================
  // All methods now delegate to specialized modules

  // Task Operations (delegate to TaskOperations module)
  async listTasks(filter = {}) {
    return this.taskOperations.listTasks(filter);
  }

  async createTask(taskData) {
    return this.taskOperations.createTask(taskData);
  }

  async createErrorTask(taskData) {
    return this.taskOperations.createErrorTask(taskData);
  }

  async claimTask(taskId, agentId, priority = 'normal') {
    return this.taskOperations.claimTask(taskId, agentId, priority);
  }

  async completeTask(taskId, completionData = {}) {
    return this.taskOperations.completeTask(taskId, completionData);
  }

  async failTask(taskId, failureData = {}) {
    return this.taskOperations.failTask(taskId, failureData);
  }

  async deleteTask(taskId) {
    return this.taskOperations.deleteTask(taskId);
  }

  async updateTaskProgress(taskId, updateData) {
    return this.taskOperations.updateTaskProgress(taskId, updateData);
  }

  // Subtasks Management (delegate to TaskOperations module)
  async createSubtask(taskId, subtaskType, subtaskData = {}) {
    // Merge type into subtaskData for the TaskOperations method
    const completeSubtaskData = { ...subtaskData, type: subtaskType };
    return this.taskOperations.createSubtask(taskId, completeSubtaskData);
  }

  async listSubtasks(taskId, filter = {}) {
    return this.taskOperations.getSubtasks(taskId, filter);
  }

  async updateSubtask(taskId, subtaskId, updateData) {
    // TaskOperations.updateSubtask only needs subtaskId since it finds the parent task
    return this.taskOperations.updateSubtask(subtaskId, updateData);
  }

  async deleteSubtask(taskId, subtaskId) {
    // TaskOperations.deleteSubtask only needs subtaskId since it finds the parent task
    return this.taskOperations.deleteSubtask(subtaskId);
  }

  // Success Criteria Management (delegate to TaskOperations module)
  async addSuccessCriteria(targetType, targetId, criteriaData) {
    if (targetType === 'task') {
      return this.taskOperations.addSuccessCriteria(
        targetId,
        criteriaData.criteria || criteriaData,
        criteriaData.options || {},
      );
    } else if (targetType === 'project') {
      // For project-wide criteria, use the templates system
      return this.taskOperations.getProjectWideTemplates();
    } else {
      throw new Error('Invalid target type. Must be "task" or "project"');
    }
  }

  async getSuccessCriteria(targetType, targetId) {
    if (targetType === 'task') {
      return this.taskOperations.getSuccessCriteria(targetId);
    } else if (targetType === 'project') {
      return this.taskOperations.getProjectWideTemplates();
    } else {
      throw new Error('Invalid target type. Must be "task" or "project"');
    }
  }

  async updateSuccessCriteria(targetType, targetId, updateData) {
    if (targetType === 'task') {
      return this.taskOperations.updateSuccessCriteria(
        targetId,
        updateData.criteria || updateData,
      );
    } else {
      throw new Error(
        'Project-wide criteria cannot be updated directly. Use task-specific criteria or templates.',
      );
    }
  }

  async deleteSuccessCriterion(taskId, criterionText) {
    return this.taskOperations.deleteSuccessCriterion(taskId, criterionText);
  }

  async getProjectWideTemplates() {
    return this.taskOperations.getProjectWideTemplates();
  }

  async applyProjectTemplate(taskId, templateName, replace = false) {
    return this.taskOperations.applyProjectTemplate(
      taskId,
      templateName,
      replace,
    );
  }

  async setProjectCriteria(criteriaData) {
    return this.withTimeout(
      this.taskOperations.setProjectCriteria(criteriaData),
      10000,
    );
  }

  async validateCriteria(taskId, validationType = 'full', evidence = {}) {
    return this.withTimeout(
      this.taskOperations.validateCriteria(taskId, validationType, evidence),
      10000,
    );
  }

  async getCriteriaReport(taskId) {
    return this.withTimeout(
      this.taskOperations.getCriteriaReport(taskId),
      10000,
    );
  }

  // Agent Management (delegate to AgentManagement module)
  async initAgent(config = {}) {
    const result = await this.agentManagement.initAgent(config);
    if (result.success) {
      this.agentId = result.agentId; // Store agent ID for session
    }
    return result;
  }

  async getCurrentTask(agentId) {
    return this.agentManagement.getCurrentTask(agentId);
  }

  async getAgentStatus(agentId) {
    return this.agentManagement.getAgentStatus(agentId);
  }

  async reinitializeAgent(agentId, config = {}) {
    return this.agentManagement.reinitializeAgent(agentId, config);
  }

  async smartReinitializeAgent(agentId, config = {}) {
    return this.agentManagement.smartReinitializeAgent(agentId, config);
  }

  async listAgents() {
    return this.agentManagement.listAgents();
  }

  // Task Ordering (delegate to TaskOrdering module)
  async moveTaskToTop(taskId) {
    return this.taskOrdering.moveTaskToTop(taskId);
  }

  async moveTaskUp(taskId) {
    return this.taskOrdering.moveTaskUp(taskId);
  }

  async moveTaskDown(taskId) {
    return this.taskOrdering.moveTaskDown(taskId);
  }

  async moveTaskToBottom(taskId) {
    return this.taskOrdering.moveTaskToBottom(taskId);
  }

  // RAG Operations (delegate to RAGOperations module)
  async storeLesson(lessonData) {
    return this.ragOperations.storeLesson(lessonData);
  }

  async storeError(errorData) {
    return this.ragOperations.storeError(errorData);
  }

  async searchLessons(query, options = {}) {
    return this.ragOperations.searchLessons(query, options);
  }

  async findSimilarErrors(errorDescription, options = {}) {
    return this.ragOperations.findSimilarErrors(errorDescription, options);
  }

  async getRelevantLessons(taskContext, options = {}) {
    return this.ragOperations.getRelevantLessons(taskContext, options);
  }

  async getRagAnalytics(options = {}) {
    return this.ragOperations.getAnalytics(options);
  }

  // =================== REMAINING METHODS ===================
  // Methods that haven't been extracted yet

  async getApiMethods() {
    // Get guide information for response
    let guide = null;
    try {
      guide = await this._getGuideForError('api-methods');
    } catch {
      // Continue without guide if it fails
    }

    return {
      success: true,
      message: 'TaskManager API Methods - All available operations',
      cliMapping: {
        init: 'initAgent',
        list: 'listTasks',
        create: 'createTask',
        claim: 'claimTask',
        complete: 'completeTask',
        delete: 'deleteTask',
      },
      guide: guide || this._getFallbackGuide('api-methods'),
    };
  }

  async getComprehensiveGuide() {
    try {
      return await this.withTimeout(
        (() => {
          return {
            success: true,
            taskManager: {
              version: '2.0.0',
              description:
                'Universal TaskManager API for agent-driven development workflows',
            },
            taskClassification: {
              required: true,
              parameter: 'category',
              description:
                'All tasks MUST include explicit category parameter during creation',
              types: [
                {
                  value: 'error',
                  name: 'Error Task',
                  priority: 1,
                  description:
                    'System errors, linter violations, build failures, runtime bugs - HIGHEST PRIORITY',
                  examples: [
                    'Fix ESLint violations',
                    'Resolve build compilation errors',
                    'Fix runtime exceptions',
                  ],
                  triggers: [
                    'linter errors',
                    'build failures',
                    'startup errors',
                    'runtime bugs',
                    'security vulnerabilities',
                  ],
                },
                {
                  value: 'feature',
                  name: 'Feature Task',
                  priority: 2,
                  description:
                    'New functionality, enhancements, refactoring, documentation - HIGH PRIORITY',
                  examples: [
                    'Add user authentication',
                    'Implement dark mode',
                    'Refactor API endpoints',
                  ],
                  triggers: [
                    'new features requested',
                    'enhancements needed',
                    'code refactoring',
                    'documentation updates',
                  ],
                },
                {
                  value: 'subtask',
                  name: 'Subtask',
                  priority: 3,
                  description:
                    'Implementation of specific subtasks for preexisting features from TODO.json features array - MEDIUM PRIORITY',
                  examples: [
                    'Implement login form for auth feature',
                    'Add validation to signup process',
                  ],
                  triggers: [
                    'implementing approved feature components',
                    'feature breakdown tasks',
                  ],
                },
                {
                  value: 'test',
                  name: 'Test Task',
                  priority: 4,
                  description:
                    'Test coverage, test creation, test setup, test performance - LOWEST PRIORITY (ONLY AFTER ERRORS/FEATURES COMPLETE)',
                  examples: [
                    'Add unit tests for UserService',
                    'Implement E2E tests for login flow',
                  ],
                  triggers: [
                    'test coverage gaps',
                    'test setup needs',
                    'test performance issues',
                  ],
                  restrictions:
                    'BLOCKED until all error and feature tasks are resolved',
                },
              ],
              priorityRules: {
                '1_error':
                  'Always executed first - highest priority - can interrupt other work',
                '2_feature': 'Executed after all errors resolved',
                '3_subtask': 'Executed after new features complete',
                '4_test':
                  'Only executed when errors, features, and subtasks are complete',
              },
            },
            coreCommands: {
              discovery: {
                guide: {
                  description: 'Get this comprehensive guide',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide',
                  output: 'Complete API documentation and usage information',
                },
                methods: {
                  description: 'List all available API methods',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" methods',
                  output: 'Available methods and usage examples',
                },
                status: {
                  description: 'Get agent status and current tasks',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" status [agentId]',
                  output: 'Agent state, assigned tasks, and system status',
                },
              },
              agentLifecycle: {
                init: {
                  description: 'Initialize agent with TaskManager system',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" init [config]',
                  required: 'Must be called before any task operations',
                  output: 'Agent ID and registration confirmation',
                },
                reinitialize: {
                  description:
                    'Agent reinitialization with explicit agent ID requirement',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize [agentId] [config]',
                  required_parameter:
                    'agentId - Agent ID to reinitialize (REQUIRED - must be provided explicitly)',
                  when: 'After task completion, before long operations, after idle periods, or when unsure of agent status',
                  output:
                    'Updated agent status and renewed registration with scenario detection',
                  features: [
                    'Requires explicit agent ID for security and clarity',
                    'Cleans up stale agents automatically',
                    'Provides clear scenario feedback',
                    'Works with single or multiple agents',
                  ],
                  scenarios: {
                    explicit_agent: 'reinitialize specific_agent_id (required)',
                    with_config: 'reinitialize agent_id \'{"role":"testing"}\'',
                  },
                  examples: [
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize development_session_123_general_abc',
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize development_session_123_general_abc \'{"role":"testing"}\'',
                  ],
                  requirement:
                    'Agent ID must be provided explicitly - use your agent ID from previous init command',
                },
              },
              taskOperations: {
                create: {
                  description: 'Create new task with explicit classification',
                  usage:
                    'node taskmanager-api.js create \'{"title":"Task name", "description":"Details", "category":"error|feature|subtask|test"}\'',
                  required_fields: ['title', 'description', 'category'],
                  optional_fields: [
                    'priority',
                    'dependencies',
                    'important_files',
                  ],
                  validation:
                    'category must be specified for proper task classification',
                },
                claim: {
                  description: 'Claim task for agent execution',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" claim <taskId> <agentId> [priority]',
                  required_parameters: ['taskId', 'agentId'],
                  optional_parameters: ['priority'],
                  output: 'Task assignment confirmation',
                  examples: [
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" claim task_123 agent_456',
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" claim error_789 development_session_123_agent high',
                  ],
                  notes:
                    "Agent ID is REQUIRED and must be provided explicitly. Use the agent ID returned from the 'init' command.",
                },
                complete: {
                  description:
                    'Mark task as completed with optional completion data',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete <taskId> [completionData]',
                  required: 'Only after full implementation and validation',
                  examples: [
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete task_123',
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete task_123 \'{"message": "Successfully implemented feature"}\'',
                    'node taskmanager-api.js complete error_456 \'{"fixed": true, "details": "Resolved linting errors in auth.js"}\'',
                    'node taskmanager-api.js complete feature_789 \'{"outcome": "Feature completed with full test coverage", "files_modified": ["src/auth.js", "tests/auth.test.js"]}\'',
                  ],
                  completionDataFormat: {
                    description: 'Optional JSON object with completion details',
                    commonFields: [
                      'message - Brief completion description',
                      'outcome - Detailed result explanation',
                      'files_modified - Array of files changed',
                      'details - Additional implementation notes',
                      'evidence - Proof of completion (test results, etc.)',
                      'fixed - Boolean for error tasks',
                      'tested - Boolean indicating if tests were run',
                    ],
                    validation: 'Must be valid JSON if provided',
                  },
                  errorHandling: {
                    invalidJson: 'Returns error with JSON parsing details',
                    missingTask: 'Returns error if taskId not found',
                    alreadyCompleted: 'Returns error if task already completed',
                  },
                },
                list: {
                  description: 'List tasks with optional filtering',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list [filter]',
                  examples: [
                    'node taskmanager-api.js list \'{"status":"pending"}\'',
                    'node taskmanager-api.js list \'{"category":"error"}\'',
                  ],
                },
              },
            },
            workflows: {
              taskCreationWorkflow: [
                "1. Call 'guide' endpoint to understand task classification",
                '2. Analyze request to determine appropriate category',
                '3. Create task with explicit category parameter',
                '4. System automatically assigns priority based on category',
                '5. Task added to appropriate priority queue',
              ],
              agentWorkflow: [
                "1. Initialize agent with 'init' command",
                '2. Check status and available tasks',
                '3. Claim highest priority available task',
                '4. Execute task implementation',
                '5. Complete task with evidence',
                '6. Reinitialize before next task',
              ],
              priorityEnforcement: [
                'ERROR tasks bypass all other ordering - executed immediately',
                'FEATURE tasks blocked until all errors resolved',
                'SUBTASK tasks blocked until all features complete',
                'TEST tasks blocked until errors, features, subtasks complete',
              ],
            },
            examples: {
              taskCreation: {
                errorTask:
                  'node taskmanager-api.js create \'{"title":"Fix ESLint violations in auth.js", "description":"Resolve linting errors", "category":"error"}\'',
                featureTask:
                  'node taskmanager-api.js create \'{"title":"Add dark mode toggle", "description":"Implement theme switching", "category":"feature"}\'',
                subtaskTask:
                  'node taskmanager-api.js create \'{"title":"Implement login form", "description":"Create login UI for auth feature", "category":"subtask"}\'',
                testTask:
                  'node taskmanager-api.js create \'{"title":"Add UserService tests", "description":"Unit test coverage", "category":"test"}\'',
              },
              commonWorkflows: {
                newAgent: [
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide',
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" init',
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" status',
                ],
                taskExecution: [
                  'node taskmanager-api.js list \'{"status":"pending"}\'',
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" claim <taskId> <agentId>',
                  '# ... implement task ...',
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete <taskId>',
                ],
              },
            },
            requirements: {
              mandatory: [
                'All task creation MUST include explicit category parameter',
                'Agent MUST call init before any task operations',
                'Agent MUST reinitialize after task completion',
                'Test tasks MUST NOT be created until errors/features complete',
              ],
              bestPractices: [
                'Use guide endpoint to understand system before starting',
                'Check status regularly to monitor system state',
                'Provide detailed task descriptions for better coordination',
                'Include important_files for tasks that modify specific files',
              ],
            },
            troubleshooting: {
              commonIssues: {
                completionErrors: {
                  problem: 'Task completion fails with JSON formatting errors',
                  cause: 'Invalid JSON format in completion data parameter',
                  solutions: [
                    'Ensure JSON is properly quoted: \'{"message": "Task completed"}\'',
                    'Use double quotes inside JSON, single quotes outside',
                    'Validate JSON format before passing to complete command',
                    'Use minimal completion: timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete taskId',
                  ],
                  examples: {
                    correct:
                      'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete task_123 \'{"message": "Success"}\'',
                    incorrect:
                      'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete task_123 {"message": "Success"}',
                  },
                },
                methodConfusion: {
                  problem: 'Confusion between CLI commands and API methods',
                  explanation:
                    "CLI command 'complete' maps to API method 'completeTask'",
                  solution:
                    'Use CLI commands in terminal, API methods are internal implementations',
                  reference:
                    'See cliMapping in methods output for complete mapping',
                },
                agentInitialization: {
                  problem: 'Agent ID is required errors',
                  explanation:
                    'All task operations require explicit agent ID parameter - no auto-detection available',
                  solutions: [
                    "FIRST TIME: Run 'timeout 10s node taskmanager-api.js init' and SAVE the returned agentId",
                    'EXISTING AGENT: Use your saved agent ID in all commands: claim <taskId> <agentId>',
                    "FOR REINITIALIZATION: Use 'timeout 10s node taskmanager-api.js reinitialize <savedAgentId>'",
                    "FOR STATUS: Use 'timeout 10s node taskmanager-api.js status <savedAgentId>'",
                    "IF LOST AGENT ID: Run 'init' again to create new agent (old agent will be cleaned up automatically)",
                  ],
                },
              },
            },
            taskConversion: {
              description:
                'Guidelines for converting existing tasks to proper category classification',
              legacyTaskHandling: {
                message: 'Converting tasks without category classification',
                steps: [
                  '1. Identify task purpose and complexity',
                  '2. Determine appropriate category (error/feature/subtask/test)',
                  '3. Delete legacy task if needed',
                  '4. Create new task with explicit category parameter',
                  '5. Verify task appears in correct priority position',
                ],
                categoryDetermination: {
                  error: 'System failures, linter violations, critical bugs',
                  feature: 'New functionality, enhancements, refactoring',
                  subtask: 'Components of larger features already approved',
                  test: 'Testing, coverage, test improvements',
                },
              },
              validationWorkflow: [
                '1. Check that all tasks have category parameter',
                '2. Verify priority order matches category rules',
                '3. Ensure error tasks can bypass feature ordering',
                '4. Verify task claiming follows priority rules',
              ],
            },
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: this._getFallbackGuide('general'),
      };
    }
  }

  async getStatistics() {
    try {
      const result = await this.withTimeout(
        (async () => {
          const tasks = await this.taskManager.listTasks({});
          const agents = await this.agentManager.listActiveAgents();

          return {
            success: true,
            statistics: {
              totalTasks: tasks.length,
              activeAgents: agents.length,
              tasksByStatus: this._groupTasksByStatus(tasks),
              tasksByCategory: this._groupTasksByCategory(tasks),
            },
          };
        })(),
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // =================== HELPER METHODS ===================

  _groupTasksByStatus(tasks) {
    const groups = {};
    tasks.forEach((task) => {
      const status = task.status || 'unknown';
      groups[status] = (groups[status] || 0) + 1;
    });
    return groups;
  }

  _groupTasksByCategory(tasks) {
    const groups = {};
    tasks.forEach((task) => {
      const category = task.category || 'unknown';
      groups[category] = (groups[category] || 0) + 1;
    });
    return groups;
  }

  async _getGuideForError(errorContext) {
    // Simple fallback guide
    return this._getFallbackGuide(errorContext);
  }

  _getFallbackGuide(context = 'general') {
    return {
      message: `TaskManager API Guide - ${context}`,
      helpText: 'For complete API usage guidance, run the guide command',
      commands: [
        'init - Initialize agent',
        'list - List tasks',
        'create - Create task',
        'claim - Claim task',
        'complete - Complete task',
      ],
    };
  }

  async _validateAgentScope(task, agentId) {
    return this.agentManagement.validateAgentScope(task, agentId);
  }

  _broadcastTaskCompletion(completionEvent) {
    // Placeholder for task completion broadcasting
    if (this.isWebSocketRunning) {
      this._broadcastToWebSocket('taskCompleted', completionEvent);
    }
  }

  _broadcastTaskFailed(failureEvent) {
    // Placeholder for task failure broadcasting
    if (this.isWebSocketRunning) {
      this._broadcastToWebSocket('taskFailed', failureEvent);
    }
  }

  _broadcastSubtaskUpdate(subtaskEvent) {
    // Placeholder for subtask update broadcasting
    if (this.isWebSocketRunning) {
      this._broadcastToWebSocket('subtaskUpdated', subtaskEvent);
    }
  }

  _broadcastCriteriaUpdate(criteriaEvent) {
    // Placeholder for success criteria update broadcasting
    if (this.isWebSocketRunning) {
      this._broadcastToWebSocket('criteriaUpdated', criteriaEvent);
    }
  }

  _broadcastToWebSocket(eventType, data) {
    // Simple WebSocket broadcasting
    const message = JSON.stringify({ type: eventType, data });
    this.webSocketClients.forEach((client) => {
      try {
        client.send(message);
      } catch {
        // Remove failed clients
        this.webSocketClients.delete(client);
      }
    });
  }

  async cleanup() {
    // Cleanup resources
    if (this.webSocketServer) {
      this.webSocketServer.close();
    }
    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// CLI interface
async function main() {
  // Use the already parsed args (with --project-root removed)
  const command = args[0];

  const api = new TaskManagerAPI();

  try {
    // Use the modular CLI interface instead of inline command parsing
    await cliInterface.executeCommand(api, args);
    return; // Early return to skip the rest of the switch logic
  } catch (error) {
    let _guide;
    let errorContext = 'general';

    // Determine error context for better guidance
    if (command) {
      if (['init', 'reinitialize', 'status', 'list-agents'].includes(command)) {
        errorContext = 'agent-lifecycle';
      } else if (
        ['create', 'list', 'claim', 'complete', 'delete'].includes(command)
      ) {
        errorContext = 'task-operations';
      } else if (
        ['move-top', 'move-up', 'move-down', 'move-bottom'].includes(command)
      ) {
        errorContext = 'task-ordering';
      }
    }

    // Try to get contextual guide for the error
    try {
      guide = await api._getGuideForError(errorContext);
    } catch {
      // If contextual guide fails, try fallback
      try {
        guide = api._getFallbackGuide(errorContext);
      } catch {
        // If everything fails, use basic guide
      }
    }

    const errorResponse = {
      success: false,
      error: error.message,
      command,
      errorContext,
      timestamp: new Date().toISOString(),
      guide: guide || {
        message:
          'For complete API usage guidance, run: timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide',
        helpText:
          'The guide provides comprehensive information about task classification, workflows, and all API capabilities',
      },
    };

    // eslint-disable-next-line no-console -- CLI API requires console output for error reporting
    console.error(JSON.stringify(errorResponse, null, 2));
    throw new Error('TaskManager API execution failed');
  } finally {
    await api.cleanup();
  }
}

// Export for programmatic use
module.exports = TaskManagerAPI;

// Run CLI if called directly (CommonJS equivalent)
if (require.main === module) {
  main().catch((error) => {
    // eslint-disable-next-line no-console -- CLI API requires console output for fatal error reporting
    console.error('Fatal error:', error.message);
    throw error;
  });
}
