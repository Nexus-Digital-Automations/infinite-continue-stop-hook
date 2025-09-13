#!/usr/bin/env node
/**
 * TaskManager Node.js API Wrapper
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
 *
 * === ARCHITECTURE ===
 * The API is built on top of the TaskManager system components:
 * • TaskManager - Core task operations and TODO.json management
 * • AgentManager - Agent registration, heartbeat, and status tracking
 * • MultiAgentOrchestrator - Coordination of multiple concurrent agents
 * • DistributedLockManager - Prevents race conditions in multi-agent scenarios
 * • AutoFixer - Automatic error detection and resolution capabilities
 *
 * === USAGE PATTERNS ===
 * 1. Agent Initialization:
 *    timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" init --project-root /path/to/project
 *
 * 2. Task Operations:
 *    node taskmanager-api.js create '{"title": "Task", "category": "enhancement"}'
 *    node taskmanager-api.js list '{"status": "pending"}'
 *    timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" claim task_123 agent_456
 *
 * 3. Status and Monitoring:
 *    timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" status agent_456
 *    node taskmanager-api.js stats
 *
 * === INTEGRATION EXAMPLES ===
 * • CI/CD pipelines for automated task management
 * • Development workflows for task assignment and tracking
 * • Multi-agent AI systems for concurrent development work
 * • Project automation scripts for batch operations
 *
 * === ERROR HANDLING ===
 * All operations include comprehensive error handling with structured JSON responses.
 * Errors include context, suggestions, and recovery instructions where applicable.
 *
 * === PERFORMANCE CHARACTERISTICS ===
 * • 10-second timeout on all operations to prevent hanging
 * • Lazy loading of heavy components (AutoFixer, LockManager)
 * • Caching for frequently accessed data structures
 * • Optimized JSON parsing with validation skipping options
 *
 * @author TaskManager System
 * @version 2.0.0
 * @since 2024-01-01
 *
 * Usage: node taskmanager-api.js <command> [args...] [--project-root /path/to/project]
 */

const path = require('path');
const http = require('http');
const crypto = require('crypto');

// Parse project root from --project-root flag or use current directory
const args = process.argv.slice(2);
const projectRootIndex = args.indexOf('--project-root');
const PROJECT_ROOT =
  projectRootIndex !== -1 && projectRootIndex + 1 < args.length
    ? args[projectRootIndex + 1]
    : process.cwd();
const TODO_PATH = path.join(PROJECT_ROOT, 'TODO.json');

// Remove --project-root and its value from args for command parsing
if (projectRootIndex !== -1) {
  args.splice(projectRootIndex, 2);
}

// Absolute path to the infinite-continue-stop-hook directory (where TaskManager system lives)
const TASKMANAGER_ROOT = __dirname;

// Import TaskManager modules using absolute paths
let TaskManager, AgentManager, MultiAgentOrchestrator;

// Import modular API components
let cliInterface;

try {
  // Import TaskManager modules using absolute paths
  TaskManager = require(path.join(TASKMANAGER_ROOT, 'lib', 'taskManager.js'));
  AgentManager = require(path.join(TASKMANAGER_ROOT, 'lib', 'agentManager.js'));
  MultiAgentOrchestrator = require(
    path.join(TASKMANAGER_ROOT, 'lib', 'multiAgentOrchestrator.js'),
  );

  // Import modular API components
  cliInterface = require(
    path.join(TASKMANAGER_ROOT, 'lib', 'api-modules', 'cli', 'cliInterface.js'),
  );
} catch (error) {
  const loadError = new Error(
    `Failed to load TaskManager modules: ${error.message}`,
  );
  loadError.cause = error;
  throw loadError;
}

/**
 * TaskManagerAPI - Main API class for TaskManager system operations
 *
 * === CORE RESPONSIBILITIES ===
 * • Provides unified interface to TaskManager system components
 * • Manages agent lifecycle and session state
 * • Handles all task operations with proper error recovery
 * • Coordinates multi-agent workflows and orchestration
 * • Implements consistent timeout and performance optimization
 *
 * === DESIGN PRINCIPLES ===
 * • Fail-fast with detailed error information
 * • Consistent JSON response format for all operations
 * • Performance-first approach with configurable timeouts
 * • Lazy loading of expensive components
 * • Immutable operation patterns for thread safety
 *
 * === STATE MANAGEMENT ===
 * • Maintains current agent ID for session continuity
 * • Tracks TODO.json path for project binding
 * • Lazy-loads all heavy components on first use
 * • Implements timeout protection for all async operations
 *
 * === INTEGRATION PATTERNS ===
 * • CLI tool integration via command-line arguments
 * • Programmatic usage via module imports
 * • CI/CD pipeline integration for automated workflows
 * • Multi-agent orchestration for concurrent operations
 */
class TaskManagerAPI {
  /**
   * Initialize TaskManagerAPI instance with project-specific configuration
   *
   * === CONFIGURATION OPTIONS ===
   * • enableMultiAgent: true - Enables multi-agent coordination features
   * • enableAutoFix: false - Disabled for performance (can cause delays)
   * • validateOnRead: false - Disabled for performance (validation on-demand)
   *
   * === PERFORMANCE OPTIMIZATION ===
   * • 10-second timeout prevents hanging operations
   * • Lazy loading reduces initialization overhead
   * • Caching minimizes repeated file I/O operations
   * • Multi-agent support for concurrent processing
   *
   * === COMPONENT INITIALIZATION ===
   * • TaskManager: Core TODO.json operations and task management
   * • AgentManager: Agent registration, heartbeat, and lifecycle
   * • MultiAgentOrchestrator: Coordination of concurrent agents
   * • agentId: Session state for current agent (null until initialized)
   *
   * @constructor
   * @memberof TaskManagerAPI
   */
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

    // Feature management integrated into TODO.json feature-based system

    // Session state - current agent ID (null until agent is initialized)
    this.agentId = null;

    // Performance configuration - 10 second timeout for all operations
    // This prevents hanging operations and ensures responsive behavior
    this.timeout = 10000;

    // Guide caching system for performance optimization
    this._cachedGuide = null;
    this._guideCacheTime = 0;
    this._guideCacheDuration = 60000; // 1 minute cache duration
    this._guideGenerationInProgress = false;
  }

  /**
   * Wrap any async operation with a timeout to prevent hanging operations
   *
   * === PURPOSE ===
   * Ensures all TaskManager operations complete within reasonable time limits.
   * This is critical for maintaining responsive behavior in multi-agent systems
   * and preventing indefinite blocking in automation workflows.
   *
   * === TIMEOUT STRATEGY ===
   * • Default 10-second timeout for all operations
   * • Configurable per-operation timeout override
   * • Race condition between operation and timeout timer
   * • Clean error messaging with timeout duration
   *
   * === USE CASES ===
   * • File I/O operations that might hang on slow storage
   * • Network operations for remote TODO.json access
   * • Lock acquisition in multi-agent scenarios
   * • Complex validation and auto-fix operations
   *
   * @param {Promise} promise - The async operation to wrap with timeout protection
   * @param {number} timeoutMs - Timeout duration in milliseconds (default: 10000ms)
   * @returns {Promise} Promise that either resolves with operation result or rejects with timeout error
   * @throws {Error} Timeout error after specified duration
   *
   * @example
   * // Wrap a file operation with timeout
   * const result = await this.withTimeout(
   *   fs.promises.readFile(path),
   *   5000  // 5 second timeout for this specific operation
   * );
   *
   * @example
   * // Use default timeout for agent operations
   * const agent = await this.withTimeout(
   *   this.agentManager.registerAgent(config)
   * );
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

  /**
   * API Discovery and Documentation - Lists all available methods and usage patterns
   *
   * === PURPOSE ===
   * Provides comprehensive introspection into TaskManager API capabilities.
   * Essential for developers integrating with the system and for debugging
   * complex multi-agent workflows where method availability needs verification.
   *
   * === METHOD DISCOVERY ===
   * • TaskManager core methods - direct TODO.json operations
   * • API wrapper methods - high-level operations with error handling
   * • Usage examples and integration patterns
   * • Method counts for API completeness verification
   *
   * === RESPONSE STRUCTURE ===
   * • taskManagerMethods: Core TaskManager class methods
   * • apiMethods: TaskManagerAPI wrapper methods
   * • usage: Integration patterns and examples
   * • examples: Code samples for common operations
   *
   * @returns {Promise<Object>} API discovery information with method lists and usage examples
   * @throws {Error} If method introspection fails
   *
   * @example
   * // Get all available methods
   * const methods = await api.getApiMethods();
   * console.log(`API has ${methods.apiMethods.count} methods`);
   * console.log(methods.examples.api); // Usage examples
   */
  async getApiMethods() {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('general');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (() => {
          // Extract all public methods from TaskManager core class
          const taskManagerMethods = Object.getOwnPropertyNames(
            Object.getPrototypeOf(this.taskManager),
          )
            .filter((name) => name !== 'constructor' && !name.startsWith('_'))
            .sort();

          // Extract all public methods from TaskManagerAPI wrapper class
          const apiMethods = Object.getOwnPropertyNames(
            Object.getPrototypeOf(this),
          )
            .filter((name) => name !== 'constructor' && !name.startsWith('_'))
            .sort();

          // Map CLI commands to API methods for clarity
          const cliToApiMapping = {
            complete: 'completeTask',
            fail: 'failTask',
            create: 'createTask',
            'create-error': 'createErrorTask',
            claim: 'claimTask',
            list: 'listTasks',
            current: 'getCurrentTask',
            status: 'getAgentStatus',
            stats: 'getStatistics',
            init: 'initAgent',
            reinitialize: 'reinitializeAgent',
            delete: 'deleteTask',
            'move-top': 'moveTaskToTop',
            'move-up': 'moveTaskUp',
            'move-down': 'moveTaskDown',
            'move-bottom': 'moveTaskToBottom',
            methods: 'getApiMethods',
            guide: 'getComprehensiveGuide',
            'suggest-feature': 'suggestFeature',
            'approve-feature': 'approveFeature',
            'reject-feature': 'rejectFeature',
            'list-suggested-features': 'listSuggestedFeatures',
            'list-features': 'listFeatures',
            'feature-stats': 'getFeatureStats',
            'list-agents': 'listAgents',
            cleanup: 'cleanup',
          };

          return {
            success: true,
            taskManagerMethods: {
              count: taskManagerMethods.length,
              methods: taskManagerMethods,
              usage:
                "const tm = new TaskManager('./TODO.json'); tm.methodName()",
            },
            apiMethods: {
              count: apiMethods.length,
              methods: apiMethods,
              usage: 'node taskmanager-api.js methodName args',
              note: 'CLI commands may differ from API method names - see cliMapping',
            },
            cliMapping: {
              description: 'Mapping between CLI commands and API methods',
              mappings: cliToApiMapping,
              usage:
                'Use CLI commands in terminal, API methods are internal implementations',
            },
            examples: {
              taskManager:
                "tm.createTask({title: 'Test', category: 'enhancement'})",
              api: 'node taskmanager-api.js list \'{"status": "pending"}\'',
              completion:
                'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete taskId \'{"message": "Task completed successfully"}\'',
              completionMinimal:
                'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete taskId',
            },
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('general'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('general'),
      };
    }
  }

  /**
   * Get comprehensive TaskManager API guide for agents
   * Provides complete information about task classification, API usage, and workflows
   */
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
                    'Smart agent reinitialization with automatic agent discovery and scenario handling',
                  usage:
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize [agentId] [config]',
                  optional_parameter:
                    'agentId - Specific agent ID to reinitialize (auto-detected if not provided)',
                  when: 'After task completion, before long operations, after idle periods, or when unsure of agent status',
                  output:
                    'Updated agent status and renewed registration with scenario detection',
                  smart_features: [
                    'Auto-detects existing agents if no ID provided',
                    'Cleans up stale agents automatically',
                    'Falls back to init for fresh projects',
                    'Provides clear scenario feedback',
                    'Works with single or multiple agents',
                  ],
                  scenarios: {
                    explicit_agent: 'reinitialize specific_agent_id',
                    auto_detect:
                      'reinitialize (finds and uses best available agent)',
                    fresh_project:
                      'reinitialize (auto-initializes new agent if none found)',
                    with_config: 'reinitialize agent_id \'{"role":"testing"}\'',
                    simple:
                      'reinitialize (recommended - handles everything automatically)',
                  },
                  examples: [
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize',
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize development_session_123_general_abc',
                    'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize development_session_123_general_abc \'{"role":"testing"}\'',
                  ],
                  recommendation:
                    'Use "reinitialize" without parameters for best experience - it handles all scenarios intelligently',
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
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" claim <taskId> [agentId]',
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
              legacyTaskHandling:
                'Existing tasks without category should be analyzed and converted using TaskManager API',
              conversionWorkflow: [
                '1. List all pending tasks without proper category classification',
                '2. Analyze each task title and description to determine appropriate category',
                '3. Delete legacy tasks and recreate with proper category parameter',
                '4. Verify new tasks appear in correct priority order',
              ],
              classificationGuide: {
                'ERROR tasks': {
                  indicators: [
                    'fix',
                    'error',
                    'bug',
                    'broken',
                    'linter',
                    'build fail',
                    'compilation',
                    'syntax',
                  ],
                  examples: [
                    'Fix ESLint violations',
                    'Resolve build errors',
                    'Debug runtime exceptions',
                  ],
                  category: 'error',
                },
                'FEATURE tasks': {
                  indicators: [
                    'add',
                    'implement',
                    'create',
                    'build',
                    'develop',
                    'new functionality',
                  ],
                  examples: [
                    'Add user authentication',
                    'Implement dashboard',
                    'Create API endpoints',
                  ],
                  category: 'feature',
                },
                'SUBTASK tasks': {
                  indicators: [
                    'component of',
                    'part of',
                    'for feature',
                    'subtask',
                    'specific implementation',
                  ],
                  examples: [
                    'Create login form for auth feature',
                    'Add validation to user input',
                  ],
                  category: 'subtask',
                },
                'TEST tasks': {
                  indicators: [
                    'test',
                    'coverage',
                    'unit test',
                    'integration test',
                    'e2e',
                    'spec',
                  ],
                  examples: [
                    'Add unit tests',
                    'Increase test coverage',
                    'E2E testing',
                  ],
                  category: 'test',
                },
              },
              conversionCommands: {
                listLegacyTasks:
                  'node taskmanager-api.js list \'{"status":"pending"}\' | grep -v category',
                deleteTask:
                  'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" delete <taskId>',
                recreateTask:
                  'node taskmanager-api.js create \'{"title":"New Title", "description":"Description", "category":"error|feature|subtask|test"}\'',
              },
            },
            advancedWorkflows: {
              bulkTaskConversion: [
                '1. Export existing tasks to analyze: node taskmanager-api.js list \'{"status":"pending"}\'',
                '2. For each task without category, determine classification using conversionGuide',
                '3. Delete old task: node taskmanager-api.js delete <oldTaskId>',
                '4. Create new task with proper category: timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create <taskData>',
                '5. Verify priority ordering: node taskmanager-api.js list \'{"status":"pending"}\'',
              ],
              priorityValidation: [
                '1. List all pending tasks to verify ordering',
                '2. Ensure ERROR tasks appear first in list',
                '3. Ensure TEST tasks appear last in list',
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

  /**
   * Get cached comprehensive guide with performance optimization
   * @returns {Promise<Object>} Cached guide or fresh generation
   */
  async _getCachedGuide() {
    const now = Date.now();

    // Return cached guide if still valid
    if (
      this._cachedGuide &&
      now - this._guideCacheTime < this._guideCacheDuration
    ) {
      return this._cachedGuide;
    }

    // Prevent multiple concurrent guide generations
    if (this._guideGenerationInProgress) {
      // Wait for ongoing generation with timeout
      let attempts = 0;

      while (this._guideGenerationInProgress && attempts < 50) {
        // eslint-disable-next-line no-await-in-loop -- Safe: Fixed iteration count with timeout for cache synchronization
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
        attempts++;
      }
      // Return cached guide if available after waiting
      if (this._cachedGuide) {
        return this._cachedGuide;
      }
    }

    try {
      this._guideGenerationInProgress = true;
      const guideResult = await this.withTimeout(
        this.getComprehensiveGuide(),
        5000,
      );

      if (guideResult.success) {
        this._cachedGuide = guideResult;
        this._guideCacheTime = now;
      }

      return guideResult.success ? guideResult : null;
    } catch {
      return null;
    } finally {
      this._guideGenerationInProgress = false;
    }
  }

  /**
   * Get contextual guide information based on error type
   * @param {string} errorContext - Context of the error (agent-init, agent-reinit, etc.)
   * @returns {Promise<Object>} Contextual guide information
   */
  async _getGuideForError(errorContext) {
    try {
      const fullGuide = await this._getCachedGuide();
      if (!fullGuide) {
        return this._getFallbackGuide(errorContext);
      }

      // Return relevant sections based on error context
      switch (errorContext) {
        case 'agent-init':
          return {
            ...fullGuide,
            focus: 'Agent Initialization',
            quickStart: fullGuide.examples?.commonWorkflows?.newAgent || [
              'timeout 10s timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide',
              'timeout 10s timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" init',
              'timeout 10s timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" status',
            ],
            essential_commands: fullGuide.coreCommands?.agentLifecycle || {},
            initialization_help: {
              message: '🚨 AGENT INITIALIZATION GUIDANCE',
              workflows: {
                new_agent: {
                  description:
                    'Starting fresh - creates new agent registration',
                  steps: [
                    '1. Initialize agent: timeout 10s timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" init',
                    '2. SAVE THE AGENT ID from the response - you will need it for all future operations',
                    '3. Verify initialization: timeout 10s timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" status <agentId>',
                    '4. Begin task operations: timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list',
                  ],
                  critical_note:
                    'MUST save the agentId from init response for all future commands',
                },
                existing_agent: {
                  description:
                    'Refreshing existing agent - renews registration',
                  steps: [
                    '1. Use your saved agent ID from previous init',
                    '2. Reinitialize: timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize <agentId>',
                    '3. Verify renewal: timeout 10s timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" status <agentId>',
                    '4. Continue operations normally',
                  ],
                  requirement: 'Must have agent ID from previous init command',
                },
              },
              when_to_use: {
                init: 'First time, or when you have lost your agent ID',
                reinitialize:
                  'When you have an existing agent ID and want to refresh it',
              },
            },
          };

        case 'agent-reinit':
          return {
            ...fullGuide,
            focus: 'Agent Reinitialization',
            reinitialization_help: {
              message: '🔄 AGENT REINITIALIZATION GUIDANCE',
              when_required: [
                'After completing tasks',
                'Before long operations',
                'After idle periods',
                'When encountering "agent expired" errors',
              ],
              workflows: {
                existing_agent: {
                  description:
                    'For agents that already have an ID from previous init',
                  steps: [
                    '1. Use your existing agent ID from previous init command',
                    '2. Reinitialize: timeout 10s node taskmanager-api.js reinitialize <agentId>',
                    '3. Verify renewal: timeout 10s node taskmanager-api.js status <agentId>',
                    '4. Continue task operations normally',
                  ],
                  example:
                    'timeout 10s node taskmanager-api.js reinitialize development_session_123_general_abc',
                },
                fresh_start: {
                  description:
                    'For agents that need to start fresh or have lost their ID',
                  steps: [
                    '1. Initialize new agent: timeout 10s node taskmanager-api.js init',
                    '2. Save the returned agentId for future operations',
                    '3. Verify initialization: timeout 10s node taskmanager-api.js status <agentId>',
                    '4. Begin or resume task operations',
                  ],
                  note: 'Init creates a new agent registration - use this when you dont have an existing agent ID',
                },
                agent_id_recovery: {
                  description: 'How to find your agent ID if you forgot it',
                  methods: [
                    'Check the agentId from your last init command output',
                    'Look for "agentId": "..." in previous command responses',
                    'Agent IDs follow format: role_session_timestamp_index_type_hash',
                    'If completely lost, run init to create fresh agent',
                  ],
                  format_example:
                    'development_session_1757528760354_1_general_79360ca6',
                },
              },
              quick_reference: {
                'Have agent ID':
                  'timeout 10s node taskmanager-api.js reinitialize <agentId>',
                'Need new agent': 'timeout 10s node taskmanager-api.js init',
                'Check status':
                  'timeout 10s node taskmanager-api.js status <agentId>',
              },
            },
            essential_commands: fullGuide.coreCommands?.agentLifecycle || {},
          };

        case 'task-operations':
          return {
            ...fullGuide,
            focus: 'Task Operations',
            task_classification: fullGuide.taskClassification || {},
            workflows: fullGuide.workflows || {},
            task_help: {
              message: '📋 TASK OPERATIONS GUIDANCE',
              required_parameters:
                'All tasks MUST include explicit category parameter',
              valid_types: ['error', 'feature', 'subtask', 'test'],
              examples: fullGuide.examples?.taskCreation || {},
            },
            order_override: {
              message: '🔄 TASK ORDER OVERRIDE SYSTEM',
              description:
                'When task claiming fails due to order violations, agents can override',
              normal_flow:
                'Follow error tasks → feature order → subtask order (recommended for autonomous work)',
              override_method:
                'Use TaskManager.claimTask(taskId, agentId, priority, { allowOutOfOrder: true })',
              valid_reasons: [
                'USER REQUEST (always override)',
                'urgent fixes',
                'independent work',
                'research tasks',
                'debugging needs',
              ],
              user_authority:
                'CRITICAL: When user explicitly requests a specific task, ALWAYS override order - user intent takes absolute precedence',
              caution:
                'For autonomous work: Only override when justified - maintain workflow integrity',
              example:
                "await api.taskManager.claimTask('task_123', agentId, 'normal', { allowOutOfOrder: true })",
            },
          };

        default:
          return fullGuide;
      }
    } catch {
      return this._getFallbackGuide(errorContext);
    }
  }

  /**
   * Get fallback guide information when full guide generation fails
   * @param {string} context - Error context for fallback guidance
   * @returns {Object} Minimal fallback guide
   */
  _getFallbackGuide(context = 'general') {
    const baseGuide = {
      success: true,
      message:
        'For complete API usage guidance, run: timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide',
      helpText:
        'The guide provides comprehensive information about task classification, workflows, and all API capabilities',
      essential_commands: {
        guide:
          'timeout 10s timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide',
        init: 'timeout 10s timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" init',
        status:
          'timeout 10s timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" status',
        list: 'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list',
      },
    };

    // Add context-specific fallback guidance
    switch (context) {
      case 'agent-init':
        return {
          ...baseGuide,
          context: 'Agent Initialization Required',
          immediate_action:
            'Run: timeout 10s timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" init',
          next_steps: [
            'Initialize agent with init command',
            'Verify with status command',
            'Begin task operations',
          ],
        };

      case 'agent-reinit':
        return {
          ...baseGuide,
          context: 'Agent Reinitialization Required',
          reinitialization_help: {
            message: '🔄 AGENT REINITIALIZATION GUIDANCE',
            workflows: {
              existing_agent: {
                description:
                  'For agents that already have an ID from previous init',
                steps: [
                  '1. Use your existing agent ID from previous init command',
                  '2. Reinitialize: timeout 10s node taskmanager-api.js reinitialize <agentId>',
                  '3. Verify renewal: timeout 10s node taskmanager-api.js status <agentId>',
                  '4. Continue task operations normally',
                ],
                example:
                  'timeout 10s node taskmanager-api.js reinitialize development_session_123_general_abc',
              },
              fresh_start: {
                description:
                  'For agents that need to start fresh or have lost their ID',
                steps: [
                  '1. Initialize new agent: timeout 10s node taskmanager-api.js init',
                  '2. Save the returned agentId for future operations',
                  '3. Verify initialization: timeout 10s node taskmanager-api.js status <agentId>',
                  '4. Begin or resume task operations',
                ],
                note: 'Init creates a new agent registration - use this when you dont have an existing agent ID',
              },
            },
            quick_reference: {
              'Have agent ID':
                'timeout 10s node taskmanager-api.js reinitialize <agentId>',
              'Need new agent': 'timeout 10s node taskmanager-api.js init',
              'Check status':
                'timeout 10s node taskmanager-api.js status <agentId>',
            },
          },
        };

      case 'task-operations':
        return {
          ...baseGuide,
          context: 'Task Operations Help',
          immediate_action:
            'Ensure category parameter is included in task creation',
          categories: ['error', 'feature', 'subtask', 'test'],
          example:
            '{"title": "Task name", "description": "Details", "category": "error"}',
          order_override_help: {
            message:
              'For task order violations: use { allowOutOfOrder: true } option',
            method:
              'api.taskManager.claimTask(taskId, agentId, priority, { allowOutOfOrder: true })',
            user_requests:
              'CRITICAL: When user explicitly requests a specific task, ALWAYS override order - user intent takes precedence',
          },
        };

      default:
        return baseGuide;
    }
  }

  /**
   * Get contextual guide information based on operation type
   * @param {string} context - Operation context (e.g., 'phase-operations', 'task-operations')
   * @returns {Object} Contextual guide information
   */
  getContextualGuide(context = 'general') {
    // No need for fullGuide reference since we're building self-contained guides

    switch (context) {
      case 'phase-operations':
        return {
          success: true,
          context: 'Phase Operations',
          focus: 'Feature Phase Management (FEATURE-ONLY)',
          critical_requirement:
            '🚨 Phases are EXCLUSIVELY for FEATURE tasks - NOT for error, subtask, or test tasks',

          phase_system: {
            description:
              'Sequential phase tracking system for feature development lifecycle',
            numbering: 'Simple sequential: Phase 1, Phase 2, Phase 3, etc.',
            statuses: ['pending', 'in_progress', 'completed'],
            exclusive_to:
              'FEATURE tasks only - error/subtask/test tasks NEVER have phases',
          },

          commands: {
            'create-phase': {
              usage:
                'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create-phase <featureId> \'{"title": "Phase title", "description": "Details"}\'',
              description:
                'Create new phase for a feature with sequential numbering',
              example:
                'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create-phase feature_123 \'{"title": "Initial Planning", "description": "Requirements gathering and design"}\'',
              required: ['featureId', 'phaseData.title'],
            },
            'update-phase': {
              usage:
                'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" update-phase <featureId> <phaseNumber> \'{"status": "completed"}\'',
              description: 'Update phase status and details',
              example:
                'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" update-phase feature_123 1 \'{"status": "completed", "notes": "Planning completed"}\'',
              required: ['featureId', 'phaseNumber', 'updates'],
            },
            'progress-phase': {
              usage:
                'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" progress-phase <featureId> <currentPhaseNumber>',
              description: 'Complete current phase and progress to next phase',
              example:
                'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" progress-phase feature_123 1',
              required: ['featureId', 'currentPhaseNumber'],
            },
            'list-phases': {
              usage:
                'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list-phases <featureId>',
              description:
                'List all phases for a feature with completion statistics',
              example:
                'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list-phases feature_123',
              required: ['featureId'],
            },
            'current-phase': {
              usage:
                'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" current-phase <featureId>',
              description: 'Get current active phase for a feature',
              example:
                'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" current-phase feature_123',
              required: ['featureId'],
            },
            'phase-stats': {
              usage:
                'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" phase-stats <featureId>',
              description: 'Get detailed phase completion statistics',
              example:
                'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" phase-stats feature_123',
              required: ['featureId'],
            },
          },

          workflow: [
            '1. Identify feature requiring phase tracking',
            '2. Create initial phases: create-phase <featureId> \'{"title": "Phase 1 Title"}\'',
            '3. Add additional phases sequentially as needed',
            '4. Progress through phases: progress-phase <featureId> <currentNumber>',
            '5. Monitor progress: current-phase or phase-stats <featureId>',
          ],

          examples: {
            typical_workflow: [
              '# Create feature phases for development lifecycle',
              'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create-phase feature_456 \'{"title": "Planning & Design", "description": "Requirements and architecture"}\'',
              'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create-phase feature_456 \'{"title": "Core Implementation", "description": "Main functionality development"}\'',
              'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create-phase feature_456 \'{"title": "Testing & Validation", "description": "Comprehensive testing"}\'',
              '# Progress through phases',
              'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" progress-phase feature_456 1',
              'timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" current-phase feature_456',
            ],
          },

          restrictions: {
            exclusive_scope:
              'Phases are ONLY for feature objects in TODO.json features array',
            forbidden_for: [
              'error tasks',
              'subtask tasks',
              'test tasks',
              'tasks in TODO.json tasks array',
            ],
            validation:
              'System enforces feature-only phase creation and management',
          },
        };

      case 'task-operations':
      default:
        return this._getFallbackGuide(context);
    }
  }

  /**
   * Initialize and register a new agent in the TaskManager system
   *
   * === PURPOSE ===
   * Creates a new agent with unique ID and registers it in the multi-agent
   * coordination system. This is the mandatory first step before any agent
   * can claim tasks or participate in workflows.
   *
   * === AGENT LIFECYCLE ===
   * 1. Agent initialization (this method)
   * 2. Agent claims tasks via claimTask()
   * 3. Agent heartbeat renewal via reinitializeAgent()
   * 4. Agent cleanup via cleanup()
   *
   * === DEFAULT CONFIGURATION ===
   * • role: 'development' - Agent specialization role
   * • sessionId: timestamp-based unique session identifier
   * • specialization: [] - Array of specialized capabilities
   *
   * === MULTI-AGENT COORDINATION ===
   * • Registers agent in shared agent registry
   * • Enables task claiming and coordination
   * • Provides unique identity for conflict resolution
   * • Tracks agent activity and heartbeat
   *
   * @param {Object} config - Optional agent configuration overrides
   * @param {string} config.role - Agent role ('development', 'testing', 'research', etc.)
   * @param {string} config.sessionId - Unique session identifier
   * @param {Array} config.specialization - Array of specialized capabilities
   * @param {Object} config.metadata - Additional agent metadata
   * @returns {Promise<Object>} Success response with agent ID and configuration
   * @throws {Error} If agent registration fails
   *
   * @example
   * // Initialize with default configuration
   * const result = await api.initAgent();
   * console.log(`Agent ID: ${result.agentId}`);
   *
   * @example
   * // Initialize with custom configuration
   * const result = await api.initAgent({
   *   role: 'testing',
   *   specialization: ['unit-tests', 'integration-tests'],
   *   metadata: { environment: 'ci' }
   * });
   */
  async initAgent(config = {}) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('agent-init');
    } catch {
      // If guide fails, continue with initialization without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Default agent configuration for development workflows
          const defaultConfig = {
            role: 'development', // Primary agent role
            sessionId: `session_${Date.now()}`, // Unique session identifier
            specialization: [], // Specialized capabilities array
          };

          // Merge user configuration with defaults
          const agentConfig = { ...defaultConfig, ...config };

          // Register agent in the multi-agent coordination system
          this.agentId = await this.agentManager.registerAgent(agentConfig);

          return {
            success: true,
            agentId: this.agentId,
            config: agentConfig,
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('agent-init'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('agent-init'),
      };
    }
  }

  async getCurrentTask(agentId) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('task-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Agent ID is always required - no auto-detection fallback
          if (!agentId) {
            throw new Error(
              'Agent ID is required - must be provided explicitly',
            );
          }
          const targetAgentId = agentId;
          const task = await this.taskManager.getCurrentTask(targetAgentId);

          return {
            success: true,
            task: task || null,
            hasTask: !!task,
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    }
  }

  async listTasks(filter = {}) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('task-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Get properly sorted executable tasks
          let tasks = await this.taskManager.getExecutableTasks();

          // Also include non-executable tasks for complete listing
          const todoData = await this.taskManager.readTodo(true);
          const allTasks = todoData.tasks || [];

          // Combine executable (properly sorted) with non-executable tasks
          const executableIds = new Set(tasks.map((t) => t.id));
          const nonExecutableTasks = allTasks.filter(
            (t) => !executableIds.has(t.id),
          );

          // Put executable tasks first (properly sorted), then non-executable
          tasks = [...tasks, ...nonExecutableTasks];

          // Apply filters
          if (filter.status) {
            tasks = tasks.filter((task) => task.status === filter.status);
          }
          if (filter.mode) {
            tasks = tasks.filter((task) => task.mode === filter.mode);
          }
          if (filter.priority) {
            tasks = tasks.filter((task) => task.priority === filter.priority);
          }
          if (filter.category) {
            tasks = tasks.filter((task) => task.category === filter.category);
          }

          return {
            success: true,
            tasks,
            count: tasks.length,
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    }
  }

  async createTask(taskData) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('task-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Validate scope restrictions in task data (if provided)
          let scopeValidationInfo = null;
          if (taskData.scope_restrictions) {
            scopeValidationInfo = this._validateScopeRestrictions(
              taskData.scope_restrictions,
            );
            if (!scopeValidationInfo.isValid) {
              throw new Error(
                `Invalid scope restrictions: ${scopeValidationInfo.errors.join(', ')}`,
              );
            }
          }

          const taskId = await this.taskManager.createTask(taskData);

          const response = {
            success: true,
            taskId,
            task: taskData,
          };

          // Add scope validation information if scope restrictions were provided
          if (scopeValidationInfo) {
            response.scopeInfo = {
              hasRestrictions: true,
              restrictionTypes: scopeValidationInfo.restrictionTypes,
              validationPassed: scopeValidationInfo.isValid,
              message:
                'Task created with enhanced scope validation (files AND folders supported)',
            };
          } else {
            response.scopeInfo = {
              hasRestrictions: false,
              message:
                'Task created without scope restrictions - full access granted',
            };
          }

          return response;
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    }
  }

  /**
   * Create an error task with absolute priority
   *
   * === PURPOSE ===
   * Creates error tasks that bypass all feature-based ordering and have
   * absolute priority over regular tasks. Used when errors are detected
   * in the codebase that must be fixed immediately.
   *
   * === ERROR CATEGORIES ===
   * • linter-error: Code style and linting violations
   * • build-error: Compilation and build failures
   * • start-error: Application startup failures
   * • error: Generic critical errors
   *
   * @param {Object} taskData - Task data object
   * @returns {Object} Result with success status and task ID
   */
  async createErrorTask(taskData) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('task-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Ensure error category is set
          const errorCategories = [
            'error',
            'build-error',
            'linter-error',
            'start-error',
          ];
          if (!errorCategories.includes(taskData.category)) {
            taskData.category = 'error'; // Default to generic error
          }

          // Set high priority for error tasks
          taskData.priority = taskData.priority || 'critical';

          // Add error-specific metadata
          taskData.is_error_task = true;
          taskData.created_by = 'error-detection-system';

          const taskId = await this.taskManager.createTask(taskData);
          return {
            success: true,
            taskId,
            task: taskData,
            message: `Error task created with absolute priority (category: ${taskData.category})`,
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    }
  }

  async analyzePhaseInsertion(newTaskData) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('task-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          const data = await this.taskManager.readTodoFast();
          const newPhase = this.taskManager._extractPhase(newTaskData.title);

          if (!newPhase) {
            return {
              success: true,
              hasPhase: false,
              message: 'Task does not contain phase information',
            };
          }

          const insertionAnalysis = this.taskManager._checkPhaseInsertion(
            newPhase,
            data.tasks,
          );

          return {
            success: true,
            hasPhase: true,
            phase: newPhase,
            needsRenumbering: insertionAnalysis.needsRenumbering,
            conflicts: insertionAnalysis.conflicts,
            renumberingNeeded: insertionAnalysis.renumberingNeeded,
            affectedTasks: insertionAnalysis.renumberingNeeded.length,
            message: insertionAnalysis.needsRenumbering
              ? `Phase insertion will require renumbering ${insertionAnalysis.renumberingNeeded.length} tasks`
              : 'No phase conflicts detected',
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    }
  }

  /**
   * Claim a task for the specified agent with dependency validation and research guidance
   *
   * === PURPOSE ===
   * Assigns a task to an agent for execution, with comprehensive validation
   * of dependencies, research requirements, and agent capabilities. This is
   * the core method for task assignment in multi-agent workflows.
   *
   * === DEPENDENCY SYSTEM ===
   * • Automatically detects incomplete dependencies
   * • Prevents claiming tasks with unfinished prerequisites
   * • Provides guidance for dependency completion order
   * • Maintains dependency chain integrity across agents
   *
   * === RESEARCH INTEGRATION ===
   * • Detects research category tasks automatically
   * • Provides research workflow instructions
   * • Suggests research report templates and structure
   * • Integrates with development/reports/ directory
   *
   * === TASK ORDER OVERRIDE ===
   * When task claiming is blocked by order violations, agents can override by:
   * • Understanding the error response includes 'allowOutOfOrder: true' suggestion
   * • Using TaskManager.claimTask() directly with { allowOutOfOrder: true } options
   * • This bypasses normal priority order (error tasks → feature order → subtask order)
   * • Only use when agent has specific reason to work out of sequence
   *
   * === MULTI-AGENT COORDINATION ===
   * • Prevents race conditions in task claiming
   * • Tracks task ownership and agent assignment
   * • Provides conflict resolution for concurrent claims
   * • Maintains consistency across distributed agents
   *
   * @param {string} taskId - Unique identifier of task to claim
   * @param {string} agentId - Agent ID (optional, uses current agent if not provided)
   * @param {string} priority - Priority level for claiming ('normal', 'high', 'low')
   * @returns {Promise<Object>} Task claiming result with task details and instructions
   * @throws {Error} If task claiming fails or agent not initialized
   *
   * @example
   * // Claim task with current agent
   * const result = await api.claimTask('task_123');
   * if (result.success) {
   *   console.log(`Claimed: ${result.task.title}`);
   * }
   *
   * @example
   * // Handle dependency blocking
   * const result = await api.claimTask('task_456');
   * if (result.blockedByDependencies) {
   *   console.log(result.dependencyInstructions.message);
   *   // Claim dependency first: result.nextDependency.id
   * }
   *
   * @example
   * // Handle task order violations - use TaskManager directly with allowOutOfOrder
   * const result = await api.claimTask('task_789');
   * if (!result.success && result.reason.includes('order violation')) {
   *   // Agent can override order if needed
   *   const overrideResult = await api.taskManager.claimTask('task_789', agentId, priority, { allowOutOfOrder: true });
   * }
   */
  async claimTask(taskId, agentId, priority = 'normal') {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('task-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Agent ID is always required - no auto-detection fallback
          if (!agentId) {
            throw new Error(
              'Agent ID is required - must be provided explicitly when claiming tasks',
            );
          }
          const targetAgentId = agentId;

          // Read current TODO state for dependency validation
          const todoData = await this.taskManager.readTodo();
          const task = todoData.tasks.find((t) => t.id === taskId);

          // === DEPENDENCY VALIDATION SYSTEM ===
          // Check if task has incomplete dependencies that must be resolved first
          if (task && task.dependencies && task.dependencies.length > 0) {
            const incompleteDependencies = [];

            // Identify all dependencies that are not yet completed
            for (const depId of task.dependencies) {
              const depTask = todoData.tasks.find((t) => t.id === depId);
              if (depTask && depTask.status !== 'completed') {
                incompleteDependencies.push(depTask);
              }
            }

            // If dependencies exist, block task claiming and provide guidance
            if (incompleteDependencies.length > 0) {
              // Find the next dependency that should be worked on first
              const nextDependency =
                incompleteDependencies.find(
                  (dep) => dep.status === 'pending',
                ) || incompleteDependencies[0];

              return {
                success: false,
                reason:
                  'Task has incomplete dependencies that must be completed first',
                blockedByDependencies: true,
                incompleteDependencies: incompleteDependencies,
                nextDependency: nextDependency,
                dependencyInstructions: {
                  message: `🔗 DEPENDENCY DETECTED - Complete dependency first: ${nextDependency.title}`,
                  instructions: [
                    `📋 COMPLETE dependency task: ${nextDependency.title} (ID: ${nextDependency.id})`,
                    `🎯 CLAIM dependency task using: node taskmanager-api.js claim ${nextDependency.id}`,
                    `✅ FINISH dependency before returning to this task`,
                    `🔄 RETRY this task after dependency is completed`,
                  ],
                  dependencyTask: {
                    id: nextDependency.id,
                    title: nextDependency.title,
                    category: nextDependency.category,
                    status: nextDependency.status,
                  },
                },
                guide: guide || this._getFallbackGuide('task-operations'),
              };
            }
          }

          // === ENHANCED SCOPE VALIDATION SYSTEM ===
          // Validate agent scope access against task requirements (files AND folders)
          const scopeValidation = await this._validateAgentScope(
            task,
            targetAgentId,
          );
          if (!scopeValidation.isValid) {
            return {
              success: false,
              reason:
                'Agent scope validation failed - insufficient access permissions',
              scopeValidationFailed: true,
              scopeErrors: scopeValidation.errors,
              scopeChecks: scopeValidation.scopeChecks,
              agentScope: scopeValidation.agentScope,
              instructions: {
                message:
                  '🔒 SCOPE ACCESS DENIED - Agent lacks required permissions',
                details: [
                  '🚫 Agent does not have access to required files/folders for this task',
                  '📋 Review task scope_restrictions and agent permissions',
                  '🔧 Contact administrator to adjust agent scope or task restrictions',
                  '📝 Task may need to be assigned to a different agent with proper permissions',
                ],
                scopeViolations: scopeValidation.errors,
              },
              guide: guide || this._getFallbackGuide('task-operations'),
            };
          }

          // Research suggestion disabled - proceed directly to task claiming

          const result = await this.taskManager.claimTask(
            taskId,
            targetAgentId,
            priority,
          );

          // Check if task requires research or is a research category task
          const claimedTask = result.task;
          let researchInstructions = null;

          if (
            claimedTask &&
            (claimedTask.category === 'research' ||
              claimedTask.requires_research)
          ) {
            researchInstructions = {
              message: '🔬 RESEARCH TASK DETECTED - RESEARCH REQUIRED FIRST',
              instructions: [
                '📋 BEFORE IMPLEMENTATION: Perform comprehensive research',
                '📁 CREATE research report in development/reports/ directory',
                '🔍 ANALYZE existing solutions, best practices, and technical approaches',
                '📊 DOCUMENT findings, recommendations, and implementation strategy',
                '✅ COMPLETE research report before proceeding with implementation',
                '🗂️ USE research findings to guide implementation decisions',
              ],
              reportTemplate: {
                filename: `research-${claimedTask.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.md`,
                directory: 'development/reports/',
                sections: [
                  '# Research Report: ' + claimedTask.title,
                  '## Overview',
                  '## Current State Analysis',
                  '## Research Findings',
                  '## Technical Approaches',
                  '## Recommendations',
                  '## Implementation Strategy',
                  '## References',
                ],
              },
            };
          }

          // Enhanced response for task order violations
          if (
            !result.success &&
            result.reason &&
            result.reason.includes('order violation')
          ) {
            return {
              success: result.success,
              task: result.task,
              reason: result.reason,
              priority: result.priority,
              nextTaskId: result.nextTaskId,
              nextTaskTitle: result.nextTaskTitle,
              suggestion: result.suggestion,
              orderOverrideGuidance: {
                message: '🔄 TASK ORDER OVERRIDE AVAILABLE',
                instructions: [
                  '📋 NORMAL: Complete the suggested task first (recommended for autonomous work)',
                  '⚡ OVERRIDE: ALWAYS override when user explicitly requests a specific task',
                  `   • Use: await api.taskManager.claimTask('${taskId}', '${targetAgentId}', '${priority}', { allowOutOfOrder: true })`,
                  '🎯 OVERRIDE REASONS: USER REQUEST (always), urgent fixes, independent work, research tasks',
                  '⚠️  USER AUTHORITY: When user asks for specific task, override order - user intent takes precedence',
                ],
                codeExample: {
                  javascript: `// Override task order (required for user-requested tasks)\nconst overrideResult = await api.taskManager.claimTask('${taskId}', '${targetAgentId}', '${priority}', { allowOutOfOrder: true });`,
                  commandLine: `# Alternative: Move task to prioritize it\ntimeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" move-up ${taskId}`,
                },
              },
              researchInstructions: researchInstructions,
            };
          }

          return {
            success: result.success,
            task: result.task,
            reason: result.reason,
            priority: result.priority,
            researchInstructions: researchInstructions,
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    }
  }

  async completeTask(taskId, completionData = {}) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('task-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Validate and sanitize completion data first
          const validatedCompletionData =
            this._validateCompletionData(completionData);

          // Enhanced validation for structured evidence requirements
          const evidenceValidation = this._validateTaskEvidence(
            validatedCompletionData,
          );
          if (!evidenceValidation.isValid) {
            throw new Error(
              `Evidence validation failed: ${evidenceValidation.errors.join(', ')}`,
            );
          }

          // Get task details to check type
          const todoData = await this.taskManager.readTodoFast();
          const task = todoData.tasks.find((t) => t.id === taskId);

          if (!task) {
            throw new Error(`Task with ID ${taskId} not found`);
          }

          // Store task completion timestamp and evidence
          const completionTimestamp = new Date().toISOString();
          const taskCompletionRecord = {
            taskId,
            completedAt: completionTimestamp,
            completedBy: task.assigned_agent || 'unknown',
            evidence: validatedCompletionData.evidence || {},
            completionNotes: validatedCompletionData.notes || '',
            category: task.category,
            priority: task.priority,
          };

          // Add completion record to task history
          if (!task.completion_history) {
            task.completion_history = [];
          }
          task.completion_history.push(taskCompletionRecord);

          // Update task status with completion notes if provided
          if (validatedCompletionData.notes) {
            await this.taskManager.updateTaskStatusConcurrent(
              taskId,
              'completed',
              validatedCompletionData.notes,
            );
          } else {
            await this.taskManager.updateTaskStatus(taskId, 'completed');
          }

          let documentationInstructions = null;

          // Add documentation update instructions for feature and subtask types
          if (
            task &&
            (task.category === 'feature' || task.category === 'subtask')
          ) {
            documentationInstructions = {
              mandatory: true,
              message: '🔴 DOCUMENTATION UPDATE REQUIRED',
              instructions: [
                '📋 UPDATE development/essentials/features.md to reflect task completion',
                '📝 UPDATE relevant API documentation if functionality was modified',
                '✅ VERIFY documentation accuracy and completeness',
                '📖 UPDATE README.md if user-facing features were added/modified',
                '🔍 VALIDATE all documentation changes before final completion',
              ],
              files_to_update: [
                'development/essentials/features.md',
                'docs/ (relevant API documentation)',
                'README.md (if user-facing changes)',
              ],
            };
          }

          // Broadcast task completion via WebSocket if server is running
          const completionEvent = {
            taskId,
            agentId: task.assigned_agent || 'unknown',
            timestamp: completionTimestamp,
            category: task.category,
            priority: task.priority,
            title: task.title,
            evidence: validatedCompletionData.evidence || {},
            completionNotes: validatedCompletionData.notes || '',
          };

          const broadcastResult =
            await this._broadcastTaskCompletion(completionEvent);

          return {
            success: true,
            taskId,
            completionData: validatedCompletionData,
            completionTimestamp,
            evidenceValidation,
            documentationInstructions,
            broadcastStatus: broadcastResult,
            message: documentationInstructions
              ? 'Task marked complete. MANDATORY: Update documentation as instructed above.'
              : 'Task marked complete successfully.',
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    }
  }

  /**
   * Mark a task as failed with optional failure details and broadcast failure event
   * @param {string} taskId - Task identifier
   * @param {Object} failureData - Failure details including reason, error, etc.
   * @returns {Promise<Object>} Failure result with broadcasting status
   */
  async failTask(taskId, failureData = {}) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('task-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Validate and sanitize failure data first
          const validatedFailureData = this._validateFailureData(failureData);

          // Get task details to check type
          const todoData = await this.taskManager.readTodoFast();
          const task = todoData.tasks.find((t) => t.id === taskId);

          if (!task) {
            throw new Error(`Task with ID ${taskId} not found`);
          }

          // Store task failure timestamp and details
          const failureTimestamp = new Date().toISOString();
          const taskFailureRecord = {
            taskId,
            failedAt: failureTimestamp,
            failedBy: task.assigned_agent || 'unknown',
            reason: validatedFailureData.reason || 'Task execution failed',
            error: validatedFailureData.error || null,
            failureNotes: validatedFailureData.notes || '',
            category: task.category,
            priority: task.priority,
          };

          // Add failure record to task history
          if (!task.failure_history) {
            task.failure_history = [];
          }
          task.failure_history.push(taskFailureRecord);

          // Update task status to failed
          if (validatedFailureData.notes) {
            await this.taskManager.updateTaskStatusConcurrent(
              taskId,
              'failed',
              validatedFailureData.notes,
            );
          } else {
            await this.taskManager.updateTaskStatus(taskId, 'failed');
          }

          // Broadcast task failure via WebSocket if server is running
          const failureEvent = {
            taskId,
            agentId: task.assigned_agent || 'unknown',
            timestamp: failureTimestamp,
            category: task.category,
            priority: task.priority,
            title: task.title,
            reason: validatedFailureData.reason || 'Task execution failed',
            error: validatedFailureData.error || null,
            failureNotes: validatedFailureData.notes || '',
          };

          const broadcastResult = await this._broadcastTaskFailed(failureEvent);

          return {
            success: true,
            taskId,
            failureData: validatedFailureData,
            failureTimestamp,
            broadcastStatus: broadcastResult,
            message: 'Task marked as failed successfully.',
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    }
  }

  /**
   * Validate and sanitize failure data to prevent JSON errors
   * @param {Object} failureData - Raw failure data to validate
   * @returns {Object} Validated and sanitized failure data
   * @private
   */
  _validateFailureData(failureData) {
    // Handle null/undefined cases
    if (!failureData) {
      return {};
    }

    // Ensure it's an object
    if (typeof failureData !== 'object' || Array.isArray(failureData)) {
      throw new Error('Failure data must be a valid object');
    }

    const validated = {};

    // Validate and sanitize common failure fields
    const allowedFields = [
      'reason',
      'error',
      'notes',
      'details',
      'stackTrace',
      'source',
    ];

    for (const [key, value] of Object.entries(failureData)) {
      if (!allowedFields.includes(key)) {
        // eslint-disable-next-line no-console -- Validation warning for failure data field
        console.warn(`[WARNING] Ignoring unknown failure data field: ${key}`);
        continue;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        // Check for truncation indicators
        if (value.includes('...') && value.length > 3) {
          throw new Error(
            `Failure data field "${key}" appears to be truncated (contains "...")`,
          );
        }

        // Limit string length to prevent excessively large data
        if (value.length > 10000) {
          throw new Error(
            `Failure data field "${key}" exceeds maximum length of 10,000 characters`,
          );
        }

        // Store sanitized string
        // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
        validated[key] = value.trim();
      } else if (Array.isArray(value)) {
        // Validate array contents
        // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
        validated[key] = value.filter(
          (item) =>
            typeof item === 'string' && item.length > 0 && item.length < 1000,
        );
      } else if (typeof value === 'object' && value !== null) {
        // Recursively validate nested objects (limited depth)
        try {
          // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
          validated[key] = JSON.parse(JSON.stringify(value)); // Deep clone and validate JSON serializability
        } catch (error) {
          throw new Error(
            `Failure data field "${key}" contains non-serializable data: ${error.message}`,
          );
        }
      } else {
        // Allow primitives (boolean, number)
        // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
        validated[key] = value;
      }
    }

    return validated;
  }

  /**
   * Validate and sanitize completion data to prevent JSON errors
   * @param {Object} completionData - Raw completion data to validate
   * @returns {Object} Validated and sanitized completion data
   * @private
   */
  _validateCompletionData(completionData) {
    // Handle null/undefined cases
    if (!completionData) {
      return {};
    }

    // Ensure it's an object
    if (typeof completionData !== 'object' || Array.isArray(completionData)) {
      throw new Error('Completion data must be a valid object');
    }

    const validated = {};

    // Validate and sanitize common fields
    const allowedFields = [
      'notes',
      'message',
      'outcome',
      'details',
      'files_modified',
      'evidence',
      'metrics',
    ];

    for (const [key, value] of Object.entries(completionData)) {
      if (!allowedFields.includes(key)) {
        // eslint-disable-next-line no-console -- Validation warning for completion data field
        console.warn(
          `[WARNING] Ignoring unknown completion data field: ${key}`,
        );
        continue;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        // Check for truncation indicators
        if (value.includes('...') && value.length > 3) {
          throw new Error(
            `Completion data field "${key}" appears to be truncated (contains "...")`,
          );
        }

        // Limit string length to prevent excessively large data
        if (value.length > 10000) {
          throw new Error(
            `Completion data field "${key}" exceeds maximum length of 10,000 characters`,
          );
        }

        // Remove control characters that could cause JSON issues
      } else if (Array.isArray(value)) {
        // Validate array contents
        // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
        validated[key] = value.filter(
          (item) =>
            typeof item === 'string' && item.length > 0 && item.length < 1000,
        );
      } else if (typeof value === 'object' && value !== null) {
        // Recursively validate nested objects (limited depth)
        try {
          // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
          validated[key] = JSON.parse(JSON.stringify(value)); // Deep clone and validate JSON serializability
        } catch (error) {
          throw new Error(
            `Completion data field "${key}" contains non-serializable data: ${error.message}`,
          );
        }
      } else {
        // Allow primitives (boolean, number)
        // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
        validated[key] = value;
      }
    }

    return validated;
  }

  /**
   * Validate structured evidence requirements for task completion
   * @param {Object} completionData - Validated completion data to check for evidence
   * @returns {Object} Evidence validation result with isValid flag and errors array
   * @private
   */
  _validateTaskEvidence(completionData) {
    const validation = {
      isValid: true,
      errors: [],
      evidenceChecks: {},
    };

    // If no evidence is provided, issue warning but allow completion
    if (!completionData.evidence) {
      validation.evidenceChecks.hasEvidence = false;
      validation.errors.push(
        'No evidence provided - consider adding completion evidence for better tracking',
      );
      return validation; // Allow completion without evidence for backwards compatibility
    }

    const evidence = completionData.evidence;
    validation.evidenceChecks.hasEvidence = true;

    // Validate common evidence fields
    const recommendedFields = [
      'files_modified',
      'tests_passed',
      'build_status',
      'linter_status',
      'commit_hash',
    ];

    let foundRecommendedFields = 0;
    for (const field of recommendedFields) {
      // eslint-disable-next-line security/detect-object-injection -- Safe: field from predefined recommendedFields array
      if (evidence[field] !== undefined) {
        foundRecommendedFields++;
        // eslint-disable-next-line security/detect-object-injection -- Safe: field from predefined recommendedFields array
        validation.evidenceChecks[field] = true;

        // Validate specific evidence types
        switch (field) {
          case 'files_modified':
            // eslint-disable-next-line security/detect-object-injection -- Safe: field from predefined recommendedFields array
            if (!Array.isArray(evidence[field])) {
              validation.errors.push(
                'files_modified must be an array of file paths',
              );
              validation.isValid = false;
            }
            break;
          case 'tests_passed':
          case 'build_status':
          case 'linter_status':
            // eslint-disable-next-line security/detect-object-injection -- Safe: field from predefined recommendedFields array
            if (typeof evidence[field] !== 'boolean') {
              validation.errors.push(`${field} must be a boolean (true/false)`);
              validation.isValid = false;
            }
            break;
          case 'commit_hash':
            if (
              // eslint-disable-next-line security/detect-object-injection -- Safe: field from predefined recommendedFields array
              typeof evidence[field] !== 'string' ||
              // eslint-disable-next-line security/detect-object-injection -- Safe: field from predefined recommendedFields array
              !/^[a-f0-9]{7,40}$/i.test(evidence[field])
            ) {
              validation.errors.push(
                'commit_hash must be a valid git commit hash (7-40 hex characters)',
              );
              validation.isValid = false;
            }
            break;
        }
      } else {
        // eslint-disable-next-line security/detect-object-injection -- Safe: field from predefined recommendedFields array
        validation.evidenceChecks[field] = false;
      }
    }

    // Encourage evidence completeness
    if (foundRecommendedFields === 0) {
      validation.errors.push(
        'Consider providing structured evidence: files_modified, tests_passed, build_status, linter_status, commit_hash',
      );
    }

    validation.evidenceChecks.completeness = foundRecommendedFields;
    validation.evidenceChecks.recommendedTotal = recommendedFields.length;

    return validation;
  }

  /**
   * Broadcast task completion event to all connected WebSocket clients
   * @param {Object} completionEvent - Task completion event data
   * @returns {Object} Broadcast result with success/error counts
   * @private
   */
  _broadcastTaskCompletion(completionEvent) {
    if (!this.isWebSocketRunning || this.webSocketClients.size === 0) {
      return {
        broadcast: false,
        reason: 'No WebSocket server or clients',
        clientCount: 0,
      };
    }

    const message = {
      type: 'task_completed',
      timestamp: new Date().toISOString(),
      data: completionEvent,
    };

    let successCount = 0;
    let errorCount = 0;

    for (const client of this.webSocketClients) {
      try {
        this._sendWebSocketMessage(client, message);
        successCount++;
      } catch {
        errorCount++;
        // Remove dead clients
        this.webSocketClients.delete(client);
      }
    }

    return {
      broadcast: true,
      successCount,
      errorCount,
      totalClients: successCount + errorCount,
      eventType: 'task_completed',
    };
  }

  /**
   * Validate agent scope access against task requirements (files AND folders)
   * Enhanced scope validation supporting both file and folder restrictions
   * @param {Object} task - Task object with potential scope restrictions
   * @param {string} agentId - Agent ID to validate scope for
   * @returns {Promise<Object>} Scope validation result with isValid flag and details
   * @private
   */
  async _validateAgentScope(task, agentId) {
    const validation = {
      isValid: true,
      errors: [],
      scopeChecks: {
        hasRestrictions: false,
        restrictedFiles: [],
        restrictedFolders: [],
        allowedFiles: [],
        allowedFolders: [],
      },
      agentScope: {},
    };

    // Check if task has any scope restrictions
    if (!task.scope_restrictions) {
      validation.scopeChecks.hasRestrictions = false;
      return validation; // No restrictions, allow access
    }

    validation.scopeChecks.hasRestrictions = true;

    const restrictions = task.scope_restrictions;

    // Get agent configuration and scope (future enhancement - for now allow all)
    const todoData = await this.taskManager.readTodoFast();
    // eslint-disable-next-line security/detect-object-injection -- Safe: agentId is validated parameter
    const agent = todoData.agents?.[agentId];

    if (!agent) {
      validation.isValid = false;
      validation.errors.push(`Agent ${agentId} not found in system`);
      return validation;
    }

    // For now, store agent scope info but don't enforce restrictions
    // This provides the foundation for future agent-specific scope enforcement
    validation.agentScope = {
      agentId,
      capabilities: agent.capabilities || [],
      specialization: agent.specialization || [],
      role: agent.role || 'general',
    };

    // Validate restricted files (if specified)
    if (
      restrictions.restricted_files &&
      Array.isArray(restrictions.restricted_files)
    ) {
      validation.scopeChecks.restrictedFiles = restrictions.restricted_files;

      // Future enhancement: Check if agent has access to these files
      for (const restrictedFile of restrictions.restricted_files) {
        if (typeof restrictedFile !== 'string') {
          validation.errors.push(
            `Invalid restricted file specification: ${restrictedFile}`,
          );
          validation.isValid = false;
          continue;
        }

        // For now, log the restriction but don't enforce
        // eslint-disable-next-line no-console -- Enhanced scope validation logging
        console.log(
          `[SCOPE] Task ${task.id} restricts access to file: ${restrictedFile}`,
        );
      }
    }

    // Validate restricted folders (if specified) - NEW FEATURE
    if (
      restrictions.restricted_folders &&
      Array.isArray(restrictions.restricted_folders)
    ) {
      validation.scopeChecks.restrictedFolders =
        restrictions.restricted_folders;

      // Enhanced folder restriction validation
      for (const restrictedFolder of restrictions.restricted_folders) {
        if (typeof restrictedFolder !== 'string') {
          validation.errors.push(
            `Invalid restricted folder specification: ${restrictedFolder}`,
          );
          validation.isValid = false;
          continue;
        }

        // Normalize folder path (ensure trailing slash for proper matching)
        const normalizedFolder = restrictedFolder.endsWith('/')
          ? restrictedFolder
          : `${restrictedFolder}/`;

        // For now, log the restriction but don't enforce
        // eslint-disable-next-line no-console -- Enhanced scope validation logging
        console.log(
          `[SCOPE] Task ${task.id} restricts access to folder: ${normalizedFolder}`,
        );
      }
    }

    // Validate allowed files (whitelist approach - if specified, only these files are allowed)
    if (
      restrictions.allowed_files &&
      Array.isArray(restrictions.allowed_files)
    ) {
      validation.scopeChecks.allowedFiles = restrictions.allowed_files;

      for (const allowedFile of restrictions.allowed_files) {
        if (typeof allowedFile !== 'string') {
          validation.errors.push(
            `Invalid allowed file specification: ${allowedFile}`,
          );
          validation.isValid = false;
        }
      }
    }

    // Validate allowed folders (whitelist approach - NEW FEATURE)
    if (
      restrictions.allowed_folders &&
      Array.isArray(restrictions.allowed_folders)
    ) {
      validation.scopeChecks.allowedFolders = restrictions.allowed_folders;

      for (const allowedFolder of restrictions.allowed_folders) {
        if (typeof allowedFolder !== 'string') {
          validation.errors.push(
            `Invalid allowed folder specification: ${allowedFolder}`,
          );
          validation.isValid = false;
          continue;
        }

        // Normalize folder path
        const normalizedFolder = allowedFolder.endsWith('/')
          ? allowedFolder
          : `${allowedFolder}/`;
        validation.scopeChecks.allowedFolders[
          validation.scopeChecks.allowedFolders.indexOf(allowedFolder)
        ] = normalizedFolder;
      }
    }

    // Enhanced validation logic: check for conflicts between restrictions and allowlists
    if (
      validation.scopeChecks.restrictedFiles.length > 0 &&
      validation.scopeChecks.allowedFiles.length > 0
    ) {
      // Check for conflicts between restricted and allowed files
      const conflicts = validation.scopeChecks.restrictedFiles.filter((file) =>
        validation.scopeChecks.allowedFiles.includes(file),
      );
      if (conflicts.length > 0) {
        validation.errors.push(
          `Scope conflict: Files cannot be both restricted and allowed: ${conflicts.join(', ')}`,
        );
        validation.isValid = false;
      }
    }

    if (
      validation.scopeChecks.restrictedFolders.length > 0 &&
      validation.scopeChecks.allowedFolders.length > 0
    ) {
      // Check for conflicts between restricted and allowed folders
      const conflicts = validation.scopeChecks.restrictedFolders.filter(
        (folder) => {
          const normalizedRestricted = folder.endsWith('/')
            ? folder
            : `${folder}/`;
          return validation.scopeChecks.allowedFolders.some((allowed) => {
            const normalizedAllowed = allowed.endsWith('/')
              ? allowed
              : `${allowed}/`;
            return normalizedRestricted === normalizedAllowed;
          });
        },
      );
      if (conflicts.length > 0) {
        validation.errors.push(
          `Scope conflict: Folders cannot be both restricted and allowed: ${conflicts.join(', ')}`,
        );
        validation.isValid = false;
      }
    }

    return validation;
  }

  /**
   * Broadcast task failure event to all connected WebSocket clients
   * @param {Object} failureEvent - Task failure event data
   * @returns {Object} Broadcast result with success/error counts
   * @private
   */
  _broadcastTaskFailed(failureEvent) {
    if (!this.isWebSocketRunning || this.webSocketClients.size === 0) {
      return {
        broadcast: false,
        reason: 'No WebSocket server or clients',
        clientCount: 0,
      };
    }

    const message = {
      type: 'task_failed',
      timestamp: new Date().toISOString(),
      data: failureEvent,
    };

    let successCount = 0;
    let errorCount = 0;

    for (const client of this.webSocketClients) {
      try {
        this._sendWebSocketMessage(client, message);
        successCount++;
      } catch {
        errorCount++;
        // Remove dead clients
        this.webSocketClients.delete(client);
      }
    }

    return {
      broadcast: true,
      successCount,
      errorCount,
      totalClients: successCount + errorCount,
      eventType: 'task_failed',
    };
  }

  /**
   * Validate scope restrictions format and structure during task creation
   * @param {Object} scopeRestrictions - Scope restrictions object from task data
   * @returns {Object} Validation result with isValid flag and restriction types
   * @private
   */
  _validateScopeRestrictions(scopeRestrictions) {
    const validation = {
      isValid: true,
      errors: [],
      restrictionTypes: [],
    };

    if (!scopeRestrictions || typeof scopeRestrictions !== 'object') {
      validation.isValid = false;
      validation.errors.push('scope_restrictions must be a valid object');
      return validation;
    }

    // Validate restricted_files
    if (scopeRestrictions.restricted_files !== undefined) {
      if (!Array.isArray(scopeRestrictions.restricted_files)) {
        validation.errors.push('restricted_files must be an array');
        validation.isValid = false;
      } else {
        validation.restrictionTypes.push('restricted_files');
        for (const file of scopeRestrictions.restricted_files) {
          if (typeof file !== 'string') {
            validation.errors.push(
              `Invalid file path in restricted_files: ${file}`,
            );
            validation.isValid = false;
          }
        }
      }
    }

    // Validate restricted_folders - NEW FEATURE
    if (scopeRestrictions.restricted_folders !== undefined) {
      if (!Array.isArray(scopeRestrictions.restricted_folders)) {
        validation.errors.push('restricted_folders must be an array');
        validation.isValid = false;
      } else {
        validation.restrictionTypes.push('restricted_folders');
        for (const folder of scopeRestrictions.restricted_folders) {
          if (typeof folder !== 'string') {
            validation.errors.push(
              `Invalid folder path in restricted_folders: ${folder}`,
            );
            validation.isValid = false;
          }
        }
      }
    }

    // Validate allowed_files
    if (scopeRestrictions.allowed_files !== undefined) {
      if (!Array.isArray(scopeRestrictions.allowed_files)) {
        validation.errors.push('allowed_files must be an array');
        validation.isValid = false;
      } else {
        validation.restrictionTypes.push('allowed_files');
        for (const file of scopeRestrictions.allowed_files) {
          if (typeof file !== 'string') {
            validation.errors.push(
              `Invalid file path in allowed_files: ${file}`,
            );
            validation.isValid = false;
          }
        }
      }
    }

    // Validate allowed_folders - NEW FEATURE
    if (scopeRestrictions.allowed_folders !== undefined) {
      if (!Array.isArray(scopeRestrictions.allowed_folders)) {
        validation.errors.push('allowed_folders must be an array');
        validation.isValid = false;
      } else {
        validation.restrictionTypes.push('allowed_folders');
        for (const folder of scopeRestrictions.allowed_folders) {
          if (typeof folder !== 'string') {
            validation.errors.push(
              `Invalid folder path in allowed_folders: ${folder}`,
            );
            validation.isValid = false;
          }
        }
      }
    }

    // Validate for conflicts between restricted and allowed
    if (scopeRestrictions.restricted_files && scopeRestrictions.allowed_files) {
      const conflicts = scopeRestrictions.restricted_files.filter((file) =>
        scopeRestrictions.allowed_files.includes(file),
      );
      if (conflicts.length > 0) {
        validation.errors.push(
          `Files cannot be both restricted and allowed: ${conflicts.join(', ')}`,
        );
        validation.isValid = false;
      }
    }

    if (
      scopeRestrictions.restricted_folders &&
      scopeRestrictions.allowed_folders
    ) {
      const conflicts = scopeRestrictions.restricted_folders.filter(
        (folder) => {
          const normalizedRestricted = folder.endsWith('/')
            ? folder
            : `${folder}/`;
          return scopeRestrictions.allowed_folders.some((allowed) => {
            const normalizedAllowed = allowed.endsWith('/')
              ? allowed
              : `${allowed}/`;
            return normalizedRestricted === normalizedAllowed;
          });
        },
      );
      if (conflicts.length > 0) {
        validation.errors.push(
          `Folders cannot be both restricted and allowed: ${conflicts.join(', ')}`,
        );
        validation.isValid = false;
      }
    }

    return validation;
  }

  async deleteTask(taskId) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('task-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          const todoData = await this.taskManager.readTodoFast();
          const taskIndex = todoData.tasks.findIndex((t) => t.id === taskId);

          if (taskIndex === -1) {
            return {
              success: false,
              error: `Task not found: ${taskId}`,
              guide: guide || this._getFallbackGuide('task-operations'),
            };
          }

          // Remove task from the tasks array
          const deletedTask = todoData.tasks.splice(taskIndex, 1)[0];

          // Write updated data back
          await this.taskManager.writeTodo(todoData);

          return {
            success: true,
            taskId,
            deletedTask: {
              id: deletedTask.id,
              title: deletedTask.title,
              status: deletedTask.status,
            },
          };
        })(),
      );

      // Add guide to success response if not already present
      if (result.success) {
        return {
          ...result,
          guide: guide || this._getFallbackGuide('task-operations'),
        };
      }
      return result; // Already contains guide for error case
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    }
  }

  async getAgentStatus(agentId) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      // Use agent-related context for status commands
      guide = await this._getGuideForError('agent-init');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Agent ID is always required - no auto-detection fallback
          if (!agentId) {
            throw new Error(
              'Agent ID is required - must be provided explicitly',
            );
          }
          const targetAgentId = agentId;

          const agent = await this.agentManager.getAgent(targetAgentId);
          const tasks = await this.taskManager.getTasksForAgent(targetAgentId);

          return {
            success: true,
            agent,
            tasks,
            taskCount: tasks.length,
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('agent-init'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('agent-init'),
      };
    }
  }

  async reinitializeAgent(agentId, config = {}) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('agent-reinit');
    } catch {
      // If guide fails, continue with reinitialization without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Smart agent auto-detection if no agentId provided
          let targetAgentId = agentId;
          if (!targetAgentId) {
            const agentsResult = await this.listAgents();
            if (
              agentsResult.success &&
              agentsResult.agents &&
              agentsResult.agents.length > 0
            ) {
              // Auto-detect: Use the most recently active agent
              const sortedAgents = agentsResult.agents.sort(
                (a, b) => new Date(b.lastHeartbeat) - new Date(a.lastHeartbeat),
              );
              targetAgentId = sortedAgents[0].agentId;
            } else {
              throw new Error(
                'No agents found for auto-detection. Use initAgent() to create a new agent first, or provide explicit agentId.',
              );
            }
          }

          // Get current agent configuration
          const currentAgent = await this.agentManager.getAgent(targetAgentId);
          if (!currentAgent) {
            throw new Error(`Agent ${targetAgentId} not found`);
          }

          // Merge current config with new config
          const renewalConfig = {
            ...currentAgent,
            ...config,
            name: config.name || currentAgent.name,
            role: config.role || currentAgent.role,
            specialization:
              config.specialization || currentAgent.specialization,
            sessionId: config.sessionId || currentAgent.sessionId,
            metadata: { ...currentAgent.metadata, ...config.metadata },
          };

          // Reinitialize the agent (renew heartbeat, reset timeout, update status)
          const result = await this.agentManager.reinitializeAgent(
            targetAgentId,
            renewalConfig,
          );

          return {
            success: true,
            agentId: targetAgentId,
            agent: result.agent,
            renewed: result.renewed,
            message:
              'Agent reinitialized successfully - heartbeat renewed and timeout reset',
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('agent-reinit'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('agent-reinit'),
      };
    }
  }

  /**
   * Smart reinitialization that handles all agent scenarios intelligently
   * @param {string} agentId - Optional explicit agent ID
   * @param {Object} config - Agent configuration overrides
   * @returns {Promise<Object>} Reinitialization result with scenario detection
   */
  async smartReinitializeAgent(agentId, config = {}) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('agent-reinit');
    } catch {
      // If guide fails, continue with reinitialization without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          let detectedScenario = 'unknown';
          let selectedAgentId = agentId;

          // Scenario 1: Explicit agent ID provided
          if (agentId) {
            detectedScenario = 'explicit_agent_provided';

            // Verify the agent exists
            const agent = await this.agentManager.getAgent(agentId);
            if (!agent) {
              throw new Error(
                `Agent ${agentId} not found. Use 'init' to create a new agent or check available agents.`,
              );
            }

            return this._performReinitializeWithScenario(
              agentId,
              config,
              detectedScenario,
              guide,
            );
          }

          // Scenario 2: Auto-detect stored agent ID
          if (this.agentId) {
            selectedAgentId = this.agentId;
            detectedScenario = 'using_stored_agent_id';

            try {
              const agent = await this.agentManager.getAgent(selectedAgentId);
              if (agent) {
                return this._performReinitializeWithScenario(
                  selectedAgentId,
                  config,
                  detectedScenario,
                  guide,
                );
              }
            } catch {
              // Stored agent ID is stale, continue to other scenarios
            }
          }

          // Scenario 3: Look for existing active agents
          const cleanupResult = await this.agentManager.cleanupStaleAgents();
          const bestAgent =
            await this.agentManager.findBestAgentForReinitialization(
              config.role || 'development',
            );

          if (bestAgent) {
            selectedAgentId = bestAgent.agentId;
            detectedScenario = 'auto_detected_best_agent';

            return this._performReinitializeWithScenario(
              selectedAgentId,
              config,
              detectedScenario,
              guide,
              {
                cleanedStaleAgents: cleanupResult.cleanedCount,
                agentSelectionReason:
                  bestAgent.agent.role === (config.role || 'development')
                    ? 'role_match'
                    : 'most_recent',
              },
            );
          }

          // Scenario 4: No agents found, auto-fallback to init
          if (cleanupResult.cleanedCount > 0) {
            detectedScenario = 'auto_init_after_cleanup';
          } else {
            detectedScenario = 'auto_init_fresh_project';
          }

          // Initialize new agent instead
          const initResult = await this.initAgent(config);

          return {
            success: true,
            scenario: detectedScenario,
            agentId: initResult.agentId,
            agent: initResult.agent,
            autoInitialized: true,
            cleanedStaleAgents: cleanupResult.cleanedCount,
            message: `No active agents found. Auto-initialized new agent: ${initResult.agentId}`,
            fallbackToInit: true,
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('agent-reinit'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('agent-reinit'),
      };
    }
  }

  /**
   * Internal helper to perform reinitialization with scenario context
   */
  async _performReinitializeWithScenario(
    agentId,
    config,
    scenario,
    guide,
    additionalInfo = {},
  ) {
    const reinitResult = await this.reinitializeAgent(agentId, config);

    if (reinitResult.success) {
      return {
        ...reinitResult,
        scenario,
        ...additionalInfo,
        smartReinitialize: true,
      };
    }

    throw new Error(reinitResult.error || 'Reinitialization failed');
  }

  /**
   * List all agents with their current status
   * @returns {Promise<Object>} List of agents with detailed information
   */
  async listAgents() {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('agent-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          const activeAgents = await this.agentManager.getAllActiveAgents();

          return {
            success: true,
            agents: activeAgents.map((a) => ({
              agentId: a.agentId,
              name: a.agent.name,
              role: a.agent.role,
              status: a.agent.status,
              lastHeartbeat: a.agent.lastHeartbeat,
              timeSinceLastHeartbeat: a.timeSinceLastHeartbeat,
              isStale: a.isStale,
              assignedTasks: a.agent.assignedTasks?.length || 0,
              createdAt: a.agent.createdAt,
            })),
            totalAgents: activeAgents.length,
            message:
              activeAgents.length === 0
                ? "No active agents found. Use 'init' to create a new agent."
                : `Found ${activeAgents.length} active agent${activeAgents.length === 1 ? '' : 's'}.`,
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('agent-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('agent-operations'),
      };
    }
  }

  async getStatistics() {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('general');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          const stats = await this.orchestrator.getOrchestrationStatistics();

          return {
            success: true,
            statistics: stats,
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('general'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('general'),
      };
    }
  }

  // Task reordering methods
  async moveTaskToTop(taskId) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('task-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          const result = await this.taskManager.moveTaskToTop(taskId);
          return {
            success: true,
            moved: result,
            taskId,
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    }
  }

  async moveTaskUp(taskId) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('task-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          const result = await this.taskManager.moveTaskUp(taskId);
          return {
            success: true,
            moved: result,
            taskId,
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    }
  }

  async moveTaskDown(taskId) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('task-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          const result = await this.taskManager.moveTaskDown(taskId);
          return {
            success: true,
            moved: result,
            taskId,
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    }
  }

  async moveTaskToBottom(taskId) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('task-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          const result = await this.taskManager.moveTaskToBottom(taskId);
          return {
            success: true,
            moved: result,
            taskId,
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    }
  }

  /**
   * Check if a task might benefit from research before implementation
   * @private
   * @param {Object} task - Task to analyze
   * @param {Object} todoData - Full TODO data
   * @returns {Object} Research suggestion result
   */
  _checkResearchRequirements(task, todoData) {
    // Only suggest research for implementation-focused tasks
    const implementationCategories = ['missing-feature', 'enhancement', 'bug'];
    if (!implementationCategories.includes(task.category)) {
      return { suggestResearch: false };
    }

    // Skip if task already has research dependency or is already research-flagged
    if (
      task.requires_research ||
      (task.dependencies && task.dependencies.length > 0)
    ) {
      return { suggestResearch: false };
    }

    // Check for complexity indicators that suggest research might be helpful
    const complexityIndicators = [
      // Keywords in title/description that suggest complexity
      /api|integration|authentication|oauth|jwt|database|schema|architecture|security|performance|scalability/i,
      // Multiple words suggesting broad scope
      /system|platform|framework|infrastructure|migration|refactor/i,
      // External service integration
      /external|third.?party|service|endpoint|webhook/i,
    ];

    const taskText = `${task.title} ${task.description}`.toLowerCase();
    const hasComplexityIndicators = complexityIndicators.some((pattern) =>
      pattern.test(taskText),
    );

    // Check if there are related research tasks already completed
    const relatedResearchTasks = todoData.tasks.filter(
      (t) =>
        t.category === 'research' &&
        t.status === 'completed' &&
        this._isTaskRelated(task, t),
    );

    if (hasComplexityIndicators && relatedResearchTasks.length === 0) {
      return {
        suggestResearch: true,
        reason: 'Task appears complex and might benefit from research',
        complexityFactors: this._identifyComplexityFactors(taskText),
        suggestions: {
          message: '🔬 RESEARCH RECOMMENDED BEFORE IMPLEMENTATION',
          instructions: [
            '📋 CONSIDER creating a research task first to:',
            '🔍 INVESTIGATE best practices and technical approaches',
            '📚 RESEARCH existing solutions and patterns',
            '🎯 DEFINE implementation strategy and requirements',
            '✅ CREATE research task or proceed if confident',
          ],
          researchTaskTemplate: {
            title: `Research: ${task.title}`,
            description: `Research technical approaches, best practices, and implementation strategies for: ${task.description}`,
            category: 'research',
            mode: 'RESEARCH',
          },
          createResearchCommand: `node taskmanager-api.js create '{"title": "Research: ${task.title}", "description": "Research technical approaches and implementation strategies", "category": "research", "mode": "RESEARCH"}'`,
        },
      };
    }

    return { suggestResearch: false };
  }

  /**
   * Check if two tasks are related based on keywords
   * @private
   */
  _isTaskRelated(task1, task2) {
    const extractKeywords = (text) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 3);
    };

    const task1Keywords = extractKeywords(
      `${task1.title} ${task1.description}`,
    );
    const task2Keywords = extractKeywords(
      `${task2.title} ${task2.description}`,
    );

    const commonKeywords = task1Keywords.filter((word) =>
      task2Keywords.includes(word),
    );
    return commonKeywords.length >= 2; // At least 2 common significant words
  }

  /**
   * Identify specific complexity factors in task text
   * @private
   */
  _identifyComplexityFactors(taskText) {
    const factors = [];

    if (/api|integration|endpoint/.test(taskText)) {
      factors.push('API/Integration complexity');
    }
    if (/auth|oauth|jwt|security/.test(taskText)) {
      factors.push('Authentication/Security requirements');
    }
    if (/database|schema|migration/.test(taskText)) {
      factors.push('Database/Schema complexity');
    }
    if (/external|third.?party/.test(taskText)) {
      factors.push('External service dependencies');
    }
    if (/performance|scalability/.test(taskText)) {
      factors.push('Performance/Scalability considerations');
    }

    return factors;
  }

  // Feature management methods removed - unified with TODO.json feature-based system

  /**
   * Update task progress with real-time WebSocket broadcasting
   * @param {string} taskId - Task identifier
   * @param {Object} updateData - Progress update data including message, percent_complete, etc.
   * @returns {Promise<Object>} Update result with broadcasting status
   */
  async updateTaskProgress(taskId, updateData) {
    try {
      // Validate input parameters
      if (!taskId) {
        throw new Error('Task ID is required for progress update');
      }
      if (!updateData || typeof updateData !== 'object') {
        throw new Error('Update data must be a valid object');
      }

      // Read current TODO data to validate task exists
      const todoData = await this.taskManager.readTodo();
      const task = todoData.tasks.find((t) => t.id === taskId);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      // Create progress update record
      const progressUpdate = {
        taskId,
        timestamp: new Date().toISOString(),
        message: updateData.message || 'Progress update',
        percentComplete:
          updateData.percent_complete || updateData.percentComplete || 0,
        phase: updateData.phase || 'unknown',
        details: updateData.details || {},
        agentId: updateData.agentId || task.assigned_agent || 'unknown',
      };

      // Store progress update in task history (if task has progress_history field)
      if (!task.progress_history) {
        task.progress_history = [];
      }
      task.progress_history.push(progressUpdate);

      // Update last_progress timestamp
      task.last_progress = progressUpdate.timestamp;
      task.current_progress = progressUpdate.percentComplete;

      // Save updated task data
      await this.taskManager.writeTodo(todoData);

      // Broadcast progress update via WebSocket if server is running
      const broadcastResult =
        await this._broadcastProgressUpdate(progressUpdate);

      return {
        success: true,
        taskId,
        progressUpdate,
        broadcastStatus: broadcastResult,
        timestamp: progressUpdate.timestamp,
      };
    } catch (error) {
      throw new Error(`Failed to update task progress: ${error.message}`);
    }
  }

  /**
   * Start WebSocket server for real-time communication
   * @param {number} port - Port number for WebSocket server
   * @returns {Promise<Object>} Server start result
   */
  async startWebSocketServer(port = 8080) {
    try {
      if (this.isWebSocketRunning) {
        return {
          success: true,
          message: 'WebSocket server is already running',
          port: this.currentPort,
          status: 'already_running',
        };
      }

      // Create HTTP server for WebSocket upgrade
      this.httpServer = http.createServer();
      this.currentPort = port;

      // Handle WebSocket upgrade manually (simplified implementation)
      this.httpServer.on('upgrade', (request, socket, head) => {
        this._handleWebSocketUpgrade(request, socket, head);
      });

      // Start HTTP server
      await new Promise((resolve, reject) => {
        this.httpServer.listen(port, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      this.isWebSocketRunning = true;

      return {
        success: true,
        message: `WebSocket server started on port ${port}`,
        port,
        status: 'started',
        clientCount: this.webSocketClients.size,
      };
    } catch (error) {
      throw new Error(`Failed to start WebSocket server: ${error.message}`);
    }
  }

  /**
   * Stop WebSocket server
   * @returns {Promise<Object>} Server stop result
   */
  async stopWebSocketServer() {
    try {
      if (!this.isWebSocketRunning) {
        return {
          success: true,
          message: 'WebSocket server is not running',
          status: 'not_running',
        };
      }

      // Close all client connections
      for (const client of this.webSocketClients) {
        try {
          client.close();
        } catch {
          // Ignore close errors for already closed connections
        }
      }
      this.webSocketClients.clear();

      // Close HTTP server
      await new Promise((resolve) => {
        this.httpServer.close(() => {
          resolve();
        });
      });

      this.isWebSocketRunning = false;
      this.httpServer = null;
      this.currentPort = null;

      return {
        success: true,
        message: 'WebSocket server stopped',
        status: 'stopped',
      };
    } catch (error) {
      throw new Error(`Failed to stop WebSocket server: ${error.message}`);
    }
  }

  /**
   * Get WebSocket server status
   * @returns {Object} Server status information
   */
  getWebSocketStatus() {
    return {
      success: true,
      isRunning: this.isWebSocketRunning,
      port: this.currentPort || null,
      clientCount: this.webSocketClients.size,
      status: this.isWebSocketRunning ? 'running' : 'stopped',
    };
  }

  /**
   * Handle WebSocket upgrade (simplified implementation)
   * @private
   */
  _handleWebSocketUpgrade(request, socket, _head) {
    try {
      // WebSocket handshake (simplified)
      const key = request.headers['sec-websocket-key'];
      if (!key) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        return;
      }

      const acceptKey = crypto
        .createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');

      const responseHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        '',
        '',
      ].join('\r\n');

      socket.write(responseHeaders);

      // Add client to set
      this.webSocketClients.add(socket);

      // Handle client disconnect
      socket.on('close', () => {
        this.webSocketClients.delete(socket);
      });

      socket.on('error', () => {
        this.webSocketClients.delete(socket);
      });

      // Send welcome message
      this._sendWebSocketMessage(socket, {
        type: 'welcome',
        message: 'Connected to TaskManager WebSocket',
        timestamp: new Date().toISOString(),
      });
    } catch {
      socket.end('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    }
  }

  /**
   * Send WebSocket message to a client
   * @private
   */
  _sendWebSocketMessage(socket, data) {
    try {
      const message = JSON.stringify(data);
      const messageLength = Buffer.byteLength(message);

      // Simple WebSocket frame format for text messages
      let frame;
      if (messageLength < 126) {
        frame = Buffer.allocUnsafe(2 + messageLength);
        frame[0] = 0x81; // FIN=1, opcode=1 (text)
        frame[1] = messageLength;
        Buffer.from(message).copy(frame, 2);
      } else {
        // Handle longer messages (simplified)
        frame = Buffer.allocUnsafe(4 + messageLength);
        frame[0] = 0x81; // FIN=1, opcode=1 (text)
        frame[1] = 126;
        frame.writeUInt16BE(messageLength, 2);
        Buffer.from(message).copy(frame, 4);
      }

      socket.write(frame);
    } catch {
      // Ignore errors for closed connections
    }
  }

  /**
   * Broadcast progress update to all connected WebSocket clients
   * @private
   */
  _broadcastProgressUpdate(progressUpdate) {
    if (!this.isWebSocketRunning || this.webSocketClients.size === 0) {
      return {
        broadcast: false,
        reason: 'No WebSocket server or clients',
        clientCount: 0,
      };
    }

    const message = {
      type: 'progress_update',
      data: progressUpdate,
      timestamp: new Date().toISOString(),
    };

    let successCount = 0;
    let errorCount = 0;

    for (const client of this.webSocketClients) {
      try {
        this._sendWebSocketMessage(client, message);
        successCount++;
      } catch {
        errorCount++;
        // Remove failed clients
        this.webSocketClients.delete(client);
      }
    }

    return {
      broadcast: true,
      successCount,
      errorCount,
      totalClients: successCount + errorCount,
    };
  }

  /**
   * Get available tasks for agent swarm - core method for self-organizing agent coordination
   *
   * === AGENT SWARM ARCHITECTURE ===
   * This method is the foundation of the self-organizing agent swarm concept where:
   * • Any agent can join the swarm and immediately query for work
   * • The TaskManager API acts as the central "brain" distributing work intelligently
   * • Agents become peers that query for highest-priority tasks autonomously
   * • No persistent orchestrator needed - the API coordinates everything
   *
   * === TASK PRIORITIZATION ===
   * Returns tasks in strict priority order:
   * 1. ERROR tasks (absolute priority - linter, build, startup errors)
   * 2. FEATURE tasks (after all errors resolved)
   * 3. SUBTASK tasks (after features complete)
   * 4. TEST tasks (only after errors, features, subtasks complete)
   *
   * === SWARM COORDINATION FEATURES ===
   * • Auto-excludes tasks already claimed by other agents
   * • Provides task claiming guidance and next steps
   * • Supports filtering for agent specialization/capabilities
   * • Includes dependency validation and research requirements
   *
   * @param {Object} options - Query options for task filtering and agent preferences
   * @param {string} options.agentId - Agent ID for personalized task suggestions
   * @param {Array} options.categories - Filter by task categories ['error', 'feature', 'subtask', 'test']
   * @param {Array} options.specializations - Filter by agent specializations/capabilities
   * @param {number} options.limit - Maximum number of tasks to return (default: 10)
   * @param {boolean} options.includeBlocked - Include tasks with incomplete dependencies (default: false)
   * @returns {Promise<Object>} Available tasks with claiming instructions and coordination info
   *
   * @example
   * // Basic swarm query - get highest priority available tasks
   * const result = await api.getTasks();
   * if (result.success && result.tasks.length > 0) {
   *   const nextTask = result.tasks[0];
   *   console.log(`Next task: ${nextTask.title} (Priority: ${nextTask.swarmPriority})`);
   * }
   *
   * @example
   * // Agent-specific query with specialization filtering
   * const result = await api.getTasks({
   *   agentId: 'development_session_123',
   *   specializations: ['frontend', 'react'],
   *   categories: ['feature', 'error'],
   *   limit: 5
   * });
   *
   * @example
   * // Research agent querying for research tasks
   * const result = await api.getTasks({
   *   agentId: 'research_agent_456',
   *   categories: ['research'],
   *   includeBlocked: true  // Research can work on blocked tasks
   * });
   */
  async getTasks(options = {}) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this._getGuideForError('task-operations');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Set defaults for swarm operation
          const {
            agentId = null,
            categories = ['error', 'feature', 'subtask', 'test'],
            specializations = [],
            limit = 10,
            includeBlocked = false,
            swarmMode: _swarmMode = true,
          } = options;

          // Get all executable tasks in proper priority order
          let availableTasks = await this.taskManager.getExecutableTasks();

          // SWARM COORDINATION: Exclude tasks already claimed by other agents
          const todoData = await this.taskManager.readTodo(true);
          const claimedTaskIds = new Set(
            todoData.tasks
              .filter((t) => t.status === 'in_progress' && t.assigned_agent)
              .map((t) => t.id),
          );

          availableTasks = availableTasks.filter(
            (task) => task.status === 'pending' && !claimedTaskIds.has(task.id),
          );

          // Apply category filtering for agent specialization
          if (categories.length > 0) {
            availableTasks = availableTasks.filter((task) =>
              categories.includes(task.category),
            );
          }

          // Filter by dependencies unless specifically including blocked tasks
          if (!includeBlocked) {
            availableTasks = availableTasks.filter((task) => {
              if (!task.dependencies || task.dependencies.length === 0) {
                return true;
              }

              // Check if all dependencies are completed
              return task.dependencies.every((depId) => {
                const depTask = todoData.tasks.find((t) => t.id === depId);
                return depTask && depTask.status === 'completed';
              });
            });
          }

          // Apply specialization filtering if agent has specific capabilities
          if (specializations.length > 0 && agentId) {
            // Future enhancement: filter tasks based on agent specializations
            // For now, we'll include this as metadata for the agent to consider
          }

          // Limit results for performance and agent focus
          availableTasks = availableTasks.slice(0, limit);

          // Enhance tasks with swarm coordination metadata
          const enhancedTasks = availableTasks.map((task, index) => {
            const swarmMetadata = {
              swarmPriority: index + 1, // 1 = highest priority
              categoryPriority: this._getCategoryPriority(task.category),
              isHighestPriority: index === 0,
              estimatedComplexity: this._estimateTaskComplexity(task),
              requiresResearch:
                task.requires_research || this._detectResearchNeeds(task),
              blockedDependencies: (task.dependencies || []).filter((depId) => {
                const depTask = todoData.tasks.find((t) => t.id === depId);
                return !depTask || depTask.status !== 'completed';
              }),
              claimingInstructions: {
                command: `timeout 10s node "${__filename}" claim ${task.id} ${agentId || '<your-agent-id>'}`,
                requiredParameters: ['taskId', 'agentId'],
                optionalParameters: ['priority'],
              },
            };

            return {
              ...task,
              swarmMetadata,
            };
          });

          // Generate swarm coordination summary
          const swarmCoordination = {
            totalAvailableTasks: enhancedTasks.length,
            totalClaimedTasks: claimedTaskIds.size,
            nextRecommendedTask: enhancedTasks[0] || null,
            taskDistribution: {
              error: enhancedTasks.filter((t) => t.category === 'error').length,
              feature: enhancedTasks.filter((t) => t.category === 'feature')
                .length,
              subtask: enhancedTasks.filter((t) => t.category === 'subtask')
                .length,
              test: enhancedTasks.filter((t) => t.category === 'test').length,
            },
            agentGuidance: {
              message:
                enhancedTasks.length > 0
                  ? '🤖 SWARM READY - Tasks available for autonomous execution'
                  : '⏳ SWARM IDLE - No available tasks at this time',
              nextAction:
                enhancedTasks.length > 0
                  ? `Claim highest priority task: ${enhancedTasks[0].id}`
                  : 'Wait for new tasks or check if initialization is needed',
              workflowTip:
                'Agents should claim tasks immediately in priority order for optimal swarm coordination',
            },
          };

          return {
            success: true,
            tasks: enhancedTasks,
            swarmCoordination,
            filterApplied: {
              categories,
              specializations,
              limit,
              includeBlocked,
              agentId,
            },
            timestamp: new Date().toISOString(),
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        swarmCoordination: {
          agentGuidance: {
            message: '🔥 SWARM ERROR - Unable to fetch available tasks',
            nextAction:
              'Check agent initialization and TaskManager connectivity',
            workflowTip:
              'Ensure agent is properly initialized before querying for tasks',
          },
        },
        guide: guide || this._getFallbackGuide('task-operations'),
      };
    }
  }

  /**
   * Get numeric priority for task category (lower number = higher priority)
   * @private
   */
  _getCategoryPriority(category) {
    const priorities = {
      error: 1, // Highest priority
      feature: 2, // High priority
      subtask: 3, // Medium priority
      test: 4, // Lowest priority
    };
    // eslint-disable-next-line security/detect-object-injection -- Safe: accessing predefined priorities object with validated category
    return priorities[category] || 999;
  }

  /**
   * Estimate task complexity based on title and description analysis
   * @private
   */
  _estimateTaskComplexity(task) {
    const text = `${task.title} ${task.description}`.toLowerCase();

    let complexity = 'low';
    let score = 0;

    // Complexity indicators
    const indicators = {
      high: /architecture|system|platform|migration|integration|oauth|security|database|api/g,
      medium: /refactor|enhance|optimize|implement|feature|component|service/g,
      low: /fix|update|add|change|modify|adjust/g,
    };

    // Count matches for each complexity level
    const highMatches = (text.match(indicators.high) || []).length;
    const mediumMatches = (text.match(indicators.medium) || []).length;
    const lowMatches = (text.match(indicators.low) || []).length;

    score = highMatches * 3 + mediumMatches * 2 + lowMatches * 1;

    if (score >= 6) {
      complexity = 'high';
    } else if (score >= 3) {
      complexity = 'medium';
    } else {
      complexity = 'low';
    }

    return complexity;
  }

  /**
   * Detect if task might need research based on content analysis
   * @private
   */
  _detectResearchNeeds(task) {
    const text = `${task.title} ${task.description}`.toLowerCase();
    const researchIndicators =
      /new|unknown|investigate|research|analysis|evaluate|best.?practice|approach|solution|design|architecture/g;
    const matches = (text.match(researchIndicators) || []).length;
    return matches >= 2; // Suggest research if multiple indicators present
  }

  // Cleanup method
  async cleanup() {
    try {
      // Cleanup in proper order with sufficient time
      if (this.taskManager && typeof this.taskManager.cleanup === 'function') {
        await this.taskManager.cleanup();
      }
      if (
        this.agentManager &&
        typeof this.agentManager.cleanup === 'function'
      ) {
        await this.agentManager.cleanup();
      }
      if (
        this.orchestrator &&
        typeof this.orchestrator.cleanup === 'function'
      ) {
        await this.orchestrator.cleanup();
      }
    } catch (error) {
      // Log cleanup warnings through proper error handling
      this.taskManager?.logger?.logError?.(error, 'cleanup') || (() => {})();
    }

    // Return instead of using process.exit for better error handling
    // This allows calling code to handle cleanup completion appropriately
    return Promise.resolve();
  }

  /**
   * Create embedded subtask for an existing task
   * @param {string} taskId - Parent task ID
   * @param {string} subtaskType - Type of subtask: 'research' or 'audit'
   * @param {Object} subtaskData - Additional subtask configuration
   * @returns {Promise<Object>} Subtask creation result
   */
  async createSubtask(taskId, subtaskType, subtaskData = {}) {
    let guide = null;
    try {
      guide = await this._getCachedGuide();

      // Validate subtask type
      if (!['research', 'audit'].includes(subtaskType)) {
        throw new Error(
          `Invalid subtask type: ${subtaskType}. Must be 'research' or 'audit'`,
        );
      }

      // Get the parent task
      const todoData = await this.taskManager.readTodo(true);
      const tasks = todoData.tasks || [];
      const parentTask = tasks.find((t) => t.id === taskId);

      if (!parentTask) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // Generate subtask ID and create subtask object
      const subtaskId = `${subtaskType}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      const timestamp = new Date().toISOString();

      let newSubtask;

      if (subtaskType === 'research') {
        newSubtask = {
          id: subtaskId,
          type: 'research',
          title: `Research: ${parentTask.title}`,
          description: `Comprehensive research for ${parentTask.title} to support implementation`,
          status: 'pending',
          estimated_hours: 1,
          research_locations: [
            {
              type: 'codebase',
              paths: subtaskData.codebasePaths || ['/lib', '/src', '/'],
              focus: 'Existing implementation patterns and architecture',
            },
            {
              type: 'internet',
              keywords:
                subtaskData.keywords || this._extractKeywords(parentTask.title),
              focus:
                'Best practices, industry standards, and technical specifications',
            },
            {
              type: 'documentation',
              sources: [
                'README.md',
                'docs/',
                'API documentation',
                'package.json',
              ],
              focus: 'Project configuration and existing documentation',
            },
          ],
          deliverables: [
            'Technical analysis report',
            'Implementation recommendations',
            'Risk assessment',
            'Alternative approaches evaluation',
          ],
          prevents_implementation: true,
          created_at: timestamp,
          ...subtaskData,
        };
      } else if (subtaskType === 'audit') {
        newSubtask = {
          id: subtaskId,
          type: 'audit',
          title: `Audit: ${parentTask.title}`,
          description: `Comprehensive quality audit and review of the completed feature: ${parentTask.title}\n\nOriginal Description: ${parentTask.description}`,
          status: 'pending',
          estimated_hours: 0.5,
          success_criteria: [
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
          ],
          prevents_completion: true,
          original_implementer: null,
          prevents_self_review: true,
          audit_type: 'embedded_quality_gate',
          created_at: timestamp,
          ...subtaskData,
        };
      }

      // Initialize subtasks array if it doesn't exist
      if (!parentTask.subtasks) {
        parentTask.subtasks = [];
      }

      // Add the subtask
      parentTask.subtasks.push(newSubtask);

      // Save the updated tasks
      todoData.tasks = tasks;
      await this.taskManager.writeTodo(todoData);

      return {
        success: true,
        subtaskId: subtaskId,
        subtask: newSubtask,
        parentTaskId: taskId,
        message: `${subtaskType} subtask created successfully`,
        guide,
      };
    } catch (error) {
      guide = guide || (await this._getGuideForError('task-operations'));
      const enhancedError = new Error(error.message);
      enhancedError.context = {
        operation: 'createSubtask',
        taskId,
        subtaskType,
        timestamp: new Date().toISOString(),
        guide,
      };
      throw enhancedError;
    }
  }

  /**
   * List all subtasks for a given task
   * @param {string} taskId - Parent task ID
   * @returns {Promise<Object>} List of subtasks
   */
  async listSubtasks(taskId) {
    let guide = null;
    try {
      guide = await this._getCachedGuide();

      const todoData = await this.taskManager.readTodo(true);
      const tasks = todoData.tasks || [];
      const parentTask = tasks.find((t) => t.id === taskId);

      if (!parentTask) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const subtasks = parentTask.subtasks || [];

      return {
        success: true,
        taskId,
        subtasks,
        count: subtasks.length,
        guide,
      };
    } catch (error) {
      guide = guide || (await this._getGuideForError('task-operations'));
      const enhancedError = new Error(error.message);
      enhancedError.context = {
        operation: 'listSubtasks',
        taskId,
        timestamp: new Date().toISOString(),
        guide,
      };
      throw enhancedError;
    }
  }

  /**
   * Update an existing subtask
   * @param {string} taskId - Parent task ID
   * @param {string} subtaskId - Subtask ID to update
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Update result
   */
  async updateSubtask(taskId, subtaskId, updateData) {
    let guide = null;
    try {
      guide = await this._getCachedGuide();

      const todoData = await this.taskManager.readTodo(true);
      const tasks = todoData.tasks || [];
      const parentTask = tasks.find((t) => t.id === taskId);

      if (!parentTask) {
        throw new Error(`Task not found: ${taskId}`);
      }

      if (!parentTask.subtasks) {
        throw new Error(`No subtasks found for task: ${taskId}`);
      }

      const subtaskIndex = parentTask.subtasks.findIndex(
        (s) => s.id === subtaskId,
      );
      if (subtaskIndex === -1) {
        throw new Error(`Subtask not found: ${subtaskId}`);
      }

      // Update the subtask
      const originalSubtask = { ...parentTask.subtasks[subtaskIndex] };
      parentTask.subtasks[subtaskIndex] = {
        ...parentTask.subtasks[subtaskIndex],
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      // Save the updated tasks
      todoData.tasks = tasks;
      await this.taskManager.writeTodo(todoData);

      return {
        success: true,
        taskId,
        subtaskId,
        originalSubtask,
        updatedSubtask: parentTask.subtasks[subtaskIndex],
        message: 'Subtask updated successfully',
        guide,
      };
    } catch (error) {
      guide = guide || (await this._getGuideForError('task-operations'));
      const enhancedError = new Error(error.message);
      enhancedError.context = {
        operation: 'updateSubtask',
        taskId,
        subtaskId,
        timestamp: new Date().toISOString(),
        guide,
      };
      throw enhancedError;
    }
  }

  /**
   * Delete a subtask from a task
   * @param {string} taskId - Parent task ID
   * @param {string} subtaskId - Subtask ID to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteSubtask(taskId, subtaskId) {
    let guide = null;
    try {
      guide = await this._getCachedGuide();

      const todoData = await this.taskManager.readTodo(true);
      const tasks = todoData.tasks || [];
      const parentTask = tasks.find((t) => t.id === taskId);

      if (!parentTask) {
        throw new Error(`Task not found: ${taskId}`);
      }

      if (!parentTask.subtasks) {
        throw new Error(`No subtasks found for task: ${taskId}`);
      }

      const subtaskIndex = parentTask.subtasks.findIndex(
        (s) => s.id === subtaskId,
      );
      if (subtaskIndex === -1) {
        throw new Error(`Subtask not found: ${subtaskId}`);
      }

      // Remove the subtask
      const deletedSubtask = parentTask.subtasks.splice(subtaskIndex, 1)[0];

      // Save the updated tasks
      todoData.tasks = tasks;
      await this.taskManager.writeTodo(todoData);

      return {
        success: true,
        taskId,
        subtaskId,
        deletedSubtask,
        message: 'Subtask deleted successfully',
        guide,
      };
    } catch (error) {
      guide = guide || (await this._getGuideForError('task-operations'));
      const enhancedError = new Error(error.message);
      enhancedError.context = {
        operation: 'deleteSubtask',
        taskId,
        subtaskId,
        timestamp: new Date().toISOString(),
        guide,
      };
      throw enhancedError;
    }
  }

  /**
   * Add success criteria to task or project-wide
   * @param {string} targetType - 'task' or 'project'
   * @param {string} targetId - Task ID for task-specific, null for project-wide
   * @param {Object} criteriaData - Success criteria data
   * @returns {Promise<Object>} Add result
   */
  async addSuccessCriteria(targetType, targetId, criteriaData) {
    let guide = null;
    try {
      guide = await this._getCachedGuide();

      if (!['task', 'project'].includes(targetType)) {
        throw new Error(
          `Invalid target type: ${targetType}. Must be 'task' or 'project'`,
        );
      }

      const todoData = await this.taskManager.readTodo(true);
      const tasks = todoData.tasks || [];

      if (targetType === 'task') {
        if (!targetId) {
          throw new Error(
            'Task ID required for task-specific success criteria',
          );
        }

        const task = tasks.find((t) => t.id === targetId);
        if (!task) {
          throw new Error(`Task not found: ${targetId}`);
        }

        // Initialize success_criteria array if it doesn't exist
        if (!task.success_criteria) {
          task.success_criteria = [];
        }

        // Add criteria (can be array or single criterion)
        if (Array.isArray(criteriaData.criteria)) {
          task.success_criteria.push(...criteriaData.criteria);
        } else if (criteriaData.criteria) {
          task.success_criteria.push(criteriaData.criteria);
        } else if (Array.isArray(criteriaData)) {
          task.success_criteria.push(...criteriaData);
        } else {
          task.success_criteria.push(criteriaData);
        }

        todoData.tasks = tasks;
        await this.taskManager.writeTodo(todoData);

        return {
          success: true,
          targetType,
          targetId,
          addedCriteria: criteriaData,
          totalCriteria: task.success_criteria.length,
          message: 'Success criteria added to task successfully',
          guide,
        };
      } else {
        // Project-wide success criteria - stored in TODO.json root level
        const todoData = await this.taskManager.readTodoJson();

        if (!todoData.project_success_criteria) {
          todoData.project_success_criteria = [];
        }

        // Add criteria
        if (Array.isArray(criteriaData.criteria)) {
          todoData.project_success_criteria.push(...criteriaData.criteria);
        } else if (criteriaData.criteria) {
          todoData.project_success_criteria.push(criteriaData.criteria);
        } else if (Array.isArray(criteriaData)) {
          todoData.project_success_criteria.push(...criteriaData);
        } else {
          todoData.project_success_criteria.push(criteriaData);
        }

        await this.taskManager.writeTodo(todoData);

        return {
          success: true,
          targetType,
          addedCriteria: criteriaData,
          totalCriteria: todoData.project_success_criteria.length,
          message: 'Success criteria added to project successfully',
          guide,
        };
      }
    } catch (error) {
      guide = guide || (await this._getGuideForError('task-operations'));
      const enhancedError = new Error(error.message);
      enhancedError.context = {
        operation: 'addSuccessCriteria',
        targetType,
        targetId,
        timestamp: new Date().toISOString(),
        guide,
      };
      throw enhancedError;
    }
  }

  /**
   * Get success criteria for task or project
   * @param {string} targetType - 'task' or 'project'
   * @param {string} targetId - Task ID for task-specific, null for project-wide
   * @returns {Promise<Object>} Success criteria
   */
  async getSuccessCriteria(targetType, targetId) {
    let guide = null;
    try {
      guide = await this._getCachedGuide();

      if (!['task', 'project'].includes(targetType)) {
        throw new Error(
          `Invalid target type: ${targetType}. Must be 'task' or 'project'`,
        );
      }

      if (targetType === 'task') {
        if (!targetId) {
          throw new Error(
            'Task ID required for task-specific success criteria',
          );
        }

        const todoData = await this.taskManager.readTodo(true);
        const tasks = todoData.tasks || [];
        const task = tasks.find((t) => t.id === targetId);

        if (!task) {
          throw new Error(`Task not found: ${targetId}`);
        }

        return {
          success: true,
          targetType,
          targetId,
          success_criteria: task.success_criteria || [],
          count: (task.success_criteria || []).length,
          guide,
        };
      } else {
        const todoData = await this.taskManager.readTodoJson();

        return {
          success: true,
          targetType,
          success_criteria: todoData.project_success_criteria || [],
          count: (todoData.project_success_criteria || []).length,
          guide,
        };
      }
    } catch (error) {
      guide = guide || (await this._getGuideForError('task-operations'));
      const enhancedError = new Error(error.message);
      enhancedError.context = {
        operation: 'getSuccessCriteria',
        targetType,
        targetId,
        timestamp: new Date().toISOString(),
        guide,
      };
      throw enhancedError;
    }
  }

  /**
   * Update success criteria for task or project
   * @param {string} targetType - 'task' or 'project'
   * @param {string} targetId - Task ID for task-specific, null for project-wide
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Update result
   */
  async updateSuccessCriteria(targetType, targetId, updateData) {
    let guide = null;
    try {
      guide = await this._getCachedGuide();

      if (!['task', 'project'].includes(targetType)) {
        throw new Error(
          `Invalid target type: ${targetType}. Must be 'task' or 'project'`,
        );
      }

      if (targetType === 'task') {
        if (!targetId) {
          throw new Error(
            'Task ID required for task-specific success criteria',
          );
        }

        const todoData = await this.taskManager.readTodo(true);
        const tasks = todoData.tasks || [];
        const task = tasks.find((t) => t.id === targetId);

        if (!task) {
          throw new Error(`Task not found: ${targetId}`);
        }

        const originalCriteria = [...(task.success_criteria || [])];

        // Replace success criteria with new ones
        if (updateData.success_criteria) {
          task.success_criteria = Array.isArray(updateData.success_criteria)
            ? updateData.success_criteria
            : [updateData.success_criteria];
        } else if (Array.isArray(updateData)) {
          task.success_criteria = updateData;
        } else {
          throw new Error(
            'Update data must contain success_criteria array or be an array',
          );
        }

        todoData.tasks = tasks;
        await this.taskManager.writeTodo(todoData);

        return {
          success: true,
          targetType,
          targetId,
          originalCriteria,
          updatedCriteria: task.success_criteria,
          message: 'Task success criteria updated successfully',
          guide,
        };
      } else {
        const todoData = await this.taskManager.readTodoJson();
        const originalCriteria = [...(todoData.project_success_criteria || [])];

        // Replace success criteria with new ones
        if (updateData.success_criteria) {
          todoData.project_success_criteria = Array.isArray(
            updateData.success_criteria,
          )
            ? updateData.success_criteria
            : [updateData.success_criteria];
        } else if (Array.isArray(updateData)) {
          todoData.project_success_criteria = updateData;
        } else {
          throw new Error(
            'Update data must contain success_criteria array or be an array',
          );
        }

        await this.taskManager.writeTodo(todoData);

        return {
          success: true,
          targetType,
          originalCriteria,
          updatedCriteria: todoData.project_success_criteria,
          message: 'Project success criteria updated successfully',
          guide,
        };
      }
    } catch (error) {
      guide = guide || (await this._getGuideForError('task-operations'));
      const enhancedError = new Error(error.message);
      enhancedError.context = {
        operation: 'updateSuccessCriteria',
        targetType,
        targetId,
        timestamp: new Date().toISOString(),
        guide,
      };
      throw enhancedError;
    }
  }

  /**
   * Manage research task routing and execution
   * @param {string} action - 'start', 'complete', 'status'
   * @param {string} taskId - Task ID
   * @param {Object} researchData - Research configuration
   * @returns {Promise<Object>} Research task result
   */
  async manageResearchTask(action, taskId, researchData = {}) {
    let guide = null;
    try {
      guide = await this._getCachedGuide();

      if (!['start', 'complete', 'status'].includes(action)) {
        throw new Error(
          `Invalid action: ${action}. Must be 'start', 'complete', or 'status'`,
        );
      }

      const todoData = await this.taskManager.readTodo(true);
      const tasks = todoData.tasks || [];
      const task = tasks.find((t) => t.id === taskId);

      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // Find research subtask
      const researchSubtask = (task.subtasks || []).find(
        (s) => s.type === 'research',
      );

      if (!researchSubtask && action !== 'status') {
        throw new Error(`No research subtask found for task: ${taskId}`);
      }

      switch (action) {
        case 'start': {
          if (researchSubtask.status === 'in_progress') {
            return {
              success: true,
              action,
              taskId,
              message: 'Research task already in progress',
              researchSubtask,
              guide,
            };
          }

          // Start the research task
          researchSubtask.status = 'in_progress';
          researchSubtask.started_at = new Date().toISOString();
          researchSubtask.agent_assigned = this.agentId;

          // Apply any additional research configuration
          if (researchData.research_locations) {
            researchSubtask.research_locations =
              researchData.research_locations;
          }

          todoData.tasks = tasks;
          await this.taskManager.writeTodo(todoData);

          return {
            success: true,
            action,
            taskId,
            message: 'Research task started successfully',
            researchSubtask,
            guide,
          };
        }

        case 'complete': {
          if (researchSubtask.status === 'completed') {
            return {
              success: true,
              action,
              taskId,
              message: 'Research task already completed',
              researchSubtask,
              guide,
            };
          }

          // Complete the research task
          researchSubtask.status = 'completed';
          researchSubtask.completed_at = new Date().toISOString();

          // Store research results if provided
          if (researchData.findings || researchData.report) {
            researchSubtask.results = {
              findings: researchData.findings || [],
              report: researchData.report || '',
              completed_by: this.agentId,
              completion_timestamp: new Date().toISOString(),
            };
          }

          todoData.tasks = tasks;
          await this.taskManager.writeTodo(todoData);

          return {
            success: true,
            action,
            taskId,
            message: 'Research task completed successfully',
            researchSubtask,
            guide,
          };
        }

        case 'status': {
          return {
            success: true,
            action,
            taskId,
            hasResearchTask: !!researchSubtask,
            researchSubtask: researchSubtask || null,
            guide,
          };
        }

        default:
          throw new Error(`Unhandled action: ${action}`);
      }
    } catch (error) {
      guide = guide || (await this._getGuideForError('task-operations'));
      const enhancedError = new Error(error.message);
      enhancedError.context = {
        operation: 'manageResearchTask',
        action,
        taskId,
        timestamp: new Date().toISOString(),
        guide,
      };
      throw enhancedError;
    }
  }

  /**
   * Manage audit task assignment with objectivity controls
   * @param {string} action - 'start', 'complete', 'status'
   * @param {string} taskId - Task ID
   * @param {Object} auditData - Audit configuration
   * @returns {Promise<Object>} Audit task result
   */
  async manageAuditTask(action, taskId, auditData = {}) {
    let guide = null;
    try {
      guide = await this._getCachedGuide();

      if (!['start', 'complete', 'status'].includes(action)) {
        throw new Error(
          `Invalid action: ${action}. Must be 'start', 'complete', or 'status'`,
        );
      }

      const todoData = await this.taskManager.readTodo(true);
      const tasks = todoData.tasks || [];
      const task = tasks.find((t) => t.id === taskId);

      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // Find audit subtask
      const auditSubtask = (task.subtasks || []).find(
        (s) => s.type === 'audit',
      );

      if (!auditSubtask && action !== 'status') {
        throw new Error(`No audit subtask found for task: ${taskId}`);
      }

      switch (action) {
        case 'start': {
          // Check objectivity - current agent cannot audit their own work
          if (
            task.assigned_agent === this.agentId ||
            task.claimed_by === this.agentId
          ) {
            return {
              success: false,
              action,
              taskId,
              reason: 'Objectivity violation: Cannot audit own work',
              message:
                'Audit must be performed by different agent to ensure objectivity',
              original_implementer: task.assigned_agent || task.claimed_by,
              current_agent: this.agentId,
              guide,
            };
          }

          if (auditSubtask.status === 'in_progress') {
            return {
              success: true,
              action,
              taskId,
              message: 'Audit task already in progress',
              auditSubtask,
              guide,
            };
          }

          // Start the audit task
          auditSubtask.status = 'in_progress';
          auditSubtask.started_at = new Date().toISOString();
          auditSubtask.audit_agent = this.agentId;
          auditSubtask.original_implementer =
            task.assigned_agent || task.claimed_by;

          todoData.tasks = tasks;
          await this.taskManager.writeTodo(todoData);

          return {
            success: true,
            action,
            taskId,
            message: 'Audit task started successfully',
            auditSubtask,
            guide,
          };
        }

        case 'complete': {
          if (auditSubtask.status === 'completed') {
            return {
              success: true,
              action,
              taskId,
              message: 'Audit task already completed',
              auditSubtask,
              guide,
            };
          }

          // Complete the audit task
          auditSubtask.status = 'completed';
          auditSubtask.completed_at = new Date().toISOString();

          // Store audit results
          if (auditData.findings || auditData.report || auditData.passed) {
            auditSubtask.results = {
              passed: auditData.passed !== false, // Default to true unless explicitly false
              findings: auditData.findings || [],
              report: auditData.report || '',
              completed_by: this.agentId,
              completion_timestamp: new Date().toISOString(),
              success_criteria_met: auditData.success_criteria_met || [],
              recommendations: auditData.recommendations || [],
            };
          }

          todoData.tasks = tasks;
          await this.taskManager.writeTodo(todoData);

          return {
            success: true,
            action,
            taskId,
            message: 'Audit task completed successfully',
            auditSubtask,
            guide,
          };
        }

        case 'status': {
          return {
            success: true,
            action,
            taskId,
            hasAuditTask: !!auditSubtask,
            auditSubtask: auditSubtask || null,
            can_audit:
              task.assigned_agent !== this.agentId &&
              task.claimed_by !== this.agentId,
            objectivity_check: {
              current_agent: this.agentId,
              original_implementer: task.assigned_agent || task.claimed_by,
              objectivity_maintained:
                task.assigned_agent !== this.agentId &&
                task.claimed_by !== this.agentId,
            },
            guide,
          };
        }

        default:
          throw new Error(`Unhandled action: ${action}`);
      }
    } catch (error) {
      guide = guide || (await this._getGuideForError('task-operations'));
      const enhancedError = new Error(error.message);
      enhancedError.context = {
        operation: 'manageAuditTask',
        action,
        taskId,
        timestamp: new Date().toISOString(),
        guide,
      };
      throw enhancedError;
    }
  }

  /**
   * Extract keywords from task title for research
   * @private
   */
  _extractKeywords(title) {
    const stopWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'as',
    ];
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word))
      .slice(0, 5);
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

    /* OLD SWITCH LOGIC REMOVED - ALL FUNCTIONALITY MOVED TO cliInterface.js
       This entire section was causing ESLint unreachable code errors */
    /* switch (command) { // COMMENTED OUT - UNREACHABLE CODE REMOVED
      case "methods": {
        const result = await api.getApiMethods();
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }
      case "guide": {
        const result = await api.getComprehensiveGuide();
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "init": {
        let config = {};
        if (args[1]) {
          try {
            config = JSON.parse(args[1]);
          } catch (parseError) {
            throw new Error(
              `Invalid JSON configuration: ${parseError.message}`,
            );
          }
        }

        // Check if agent already exists and is still valid
        if (api.agentId) {
          let shouldCreateNew = true;
          try {
            // Try to get status of existing agent to see if it's still active
            const statusResult = await api.getAgentStatus(api.agentId);
            if (statusResult.success && statusResult.agent) {
              console.log(
                `Existing agent found (${api.agentId}). Reinitializing instead of creating new agent...`,
              );
              const result = await api.reinitializeAgent(api.agentId, config);
              // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
              console.log(JSON.stringify(result, null, 2));
              shouldCreateNew = false;
            }
          } catch {
            // If status check fails, agent is stale - proceed with new initialization
            console.log(
              `Previous agent (${api.agentId}) is stale. Creating new agent...`,
            );
          }

          if (!shouldCreateNew) {
            break;
          }
        }

        const result = await api.initAgent(config);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "current": {
        let agentId = args[1];

        // Auto-detect stored agent ID if not provided
        if (!agentId && api.agentId) {
          agentId = api.agentId;
          console.log(`Using stored agent ID: ${agentId}`);
        }

        // If still no agent ID, provide helpful error
        if (!agentId) {
          throw new Error(
            "Agent ID required for current task. Options:\n" +
              "1. Provide agent ID: current <agentId>\n" +
              "2. Initialize first: init (saves agent ID for reuse)\n" +
              "3. Current stored agent ID: " +
              (api.agentId || "none"),
          );
        }

        const result = await api.getCurrentTask(agentId);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "list": {
        let filter = {};
        if (args[1]) {
          try {
            filter = JSON.parse(args[1]);
          } catch (parseError) {
            throw new Error(`Invalid JSON filter: ${parseError.message}`);
          }
        }
        const result = await api.listTasks(filter);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "create": {
        if (!args[1]) {
          throw new Error("Task data required for create command");
        }
        let taskData;
        try {
          taskData = JSON.parse(args[1]);
        } catch (parseError) {
          throw new Error(`Invalid JSON task data: ${parseError.message}`);
        }
        const result = await api.createTask(taskData);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "create-error": {
        if (!args[1]) {
          throw new Error("Task data required for create-error command");
        }
        let taskData;
        try {
          taskData = JSON.parse(args[1]);
        } catch (parseError) {
          throw new Error(`Invalid JSON task data: ${parseError.message}`);
        }
        const result = await api.createErrorTask(taskData);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "analyze-phase-insertion": {
        if (!args[1]) {
          throw new Error(
            "Task data required for analyze-phase-insertion command",
          );
        }
        let taskData;
        try {
          taskData = JSON.parse(args[1]);
        } catch (parseError) {
          throw new Error(`Invalid JSON task data: ${parseError.message}`);
        }
        const result = await api.analyzePhaseInsertion(taskData);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "claim": {
        const taskId = args[1];
        let agentId = args[2];
        const priority = args[3] || "normal";

        if (!taskId) {
          throw new Error("Task ID required for claim command");
        }

        // Auto-detect stored agent ID if not provided
        if (!agentId && api.agentId) {
          agentId = api.agentId;
          console.log(`Using stored agent ID: ${agentId}`);
        }

        // If still no agent ID, provide helpful error
        if (!agentId) {
          throw new Error(
            "Agent ID required for claim. Options:\n" +
              "1. Provide agent ID: claim <taskId> <agentId>\n" +
              "2. Initialize first: init (saves agent ID for reuse)\n" +
              "3. Current stored agent ID: " +
              (api.agentId || "none"),
          );
        }

        const result = await api.claimTask(taskId, agentId, priority);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "complete": {
        const taskId = args[1];
        let agentId = null;
        let completionData = {};

        // Parse arguments intelligently to handle agent ID
        // Command format: complete <taskId> [agentId] [completionData]
        if (args.length >= 3) {
          // Check if args[2] looks like an agent ID (contains session_)
          if (args[2] && args[2].includes("session_")) {
            agentId = args[2];
            // Completion data would be in args[3]
            if (args[3]) {
              try {
                // Validate and sanitize the JSON input before parsing
                const rawInput = args[3];

                // Check for truncation indicators
                if (rawInput.includes("...") || rawInput.endsWith("...")) {
                  throw new Error(
                    'JSON completion data appears to be truncated (contains "..."). Please provide complete JSON data.',
                  );
                }

                // Check for common JSON formatting issues - allow strings too
                if (
                  !rawInput.trim().startsWith("{") &&
                  !rawInput.trim().startsWith("[") &&
                  !rawInput.trim().startsWith('"')
                ) {
                  throw new Error(
                    'JSON completion data must start with "{", "[", or be a quoted string',
                  );
                }

                // Additional validation for proper closing
                const trimmed = rawInput.trim();
                if (trimmed.startsWith("{") && !trimmed.endsWith("}")) {
                  throw new Error('JSON object must end with "}"');
                }
                if (trimmed.startsWith("[") && !trimmed.endsWith("]")) {
                  throw new Error('JSON array must end with "]"');
                }
                if (trimmed.startsWith('"') && !trimmed.endsWith('"')) {
                  throw new Error('JSON string must end with """');
                }

                // Check for unescaped quotes that might cause parsing issues
                const quotedStringRegex = /"[^"]*"/g;
                const matches = rawInput.match(quotedStringRegex);
                if (matches) {
                  for (const match of matches) {
                    if (match.includes("\n") || match.includes("\r")) {
                      throw new Error(
                        "JSON completion data contains unescaped newlines in string values",
                      );
                    }
                  }
                }

                // Attempt to parse with detailed error reporting
                completionData = JSON.parse(rawInput);

                // Validate completion data structure
                if (
                  typeof completionData !== "object" &&
                  typeof completionData !== "string"
                ) {
                  throw new Error(
                    "JSON completion data must be an object or string",
                  );
                }

                // Convert string to object format
                if (typeof completionData === "string") {
                  completionData = { message: completionData };
                }

                // Log successful parsing for debugging
                if (process.env.DEBUG) {
                  // eslint-disable-next-line no-console -- Debug logging for completion data parsing
                  console.error(
                    `[DEBUG] Successfully parsed completion data: ${JSON.stringify(completionData, null, 2)}`,
                  );
                }
              } catch (parseError) {
                // Enhanced error reporting with context
                const errorContext = {
                  input: args[3],
                  inputLength: args[3]?.length || 0,
                  inputPreview:
                    args[3]?.substring(0, 100) +
                    (args[3]?.length > 100 ? "..." : ""),
                  parseErrorMessage: parseError.message,
                  suggestion:
                    'Ensure JSON is properly formatted: {"message": "Task completed"} or "Simple message"',
                };

                throw new Error(
                  `Invalid JSON completion data: ${parseError.message}. Input preview: "${errorContext.inputPreview}". ${errorContext.suggestion}`,
                );
              }
            }
          } else {
            // args[2] is completion data, no agent ID provided
            try {
              // Validate and sanitize the JSON input before parsing
              const rawInput = args[2];

              // Check for truncation indicators
              if (rawInput.includes("...") || rawInput.endsWith("...")) {
                throw new Error(
                  'JSON completion data appears to be truncated (contains "..."). Please provide complete JSON data.',
                );
              }

              // Check for common JSON formatting issues - allow strings too
              if (
                !rawInput.trim().startsWith("{") &&
                !rawInput.trim().startsWith("[") &&
                !rawInput.trim().startsWith('"')
              ) {
                throw new Error(
                  'JSON completion data must start with "{", "[", or be a quoted string',
                );
              }

              // Additional validation for proper closing
              const trimmed = rawInput.trim();
              if (trimmed.startsWith("{") && !trimmed.endsWith("}")) {
                throw new Error('JSON object must end with "}"');
              }
              if (trimmed.startsWith("[") && !trimmed.endsWith("]")) {
                throw new Error('JSON array must end with "]"');
              }
              if (trimmed.startsWith('"') && !trimmed.endsWith('"')) {
                throw new Error('JSON string must end with """');
              }

              // Check for unescaped quotes that might cause parsing issues
              const quotedStringRegex = /"[^"]*"/g;
              const matches = rawInput.match(quotedStringRegex);
              if (matches) {
                for (const match of matches) {
                  if (match.includes("\n") || match.includes("\r")) {
                    throw new Error(
                      "JSON completion data contains unescaped newlines in string values",
                    );
                  }
                }
              }

              // Attempt to parse with detailed error reporting
              completionData = JSON.parse(rawInput);

              // Validate completion data structure
              if (
                typeof completionData !== "object" &&
                typeof completionData !== "string"
              ) {
                throw new Error(
                  "JSON completion data must be an object or string",
                );
              }

              // Convert string to object format
              if (typeof completionData === "string") {
                completionData = { message: completionData };
              }

              // Log successful parsing for debugging
              if (process.env.DEBUG) {
                // eslint-disable-next-line no-console -- Debug logging for completion data parsing
                console.error(
                  `[DEBUG] Successfully parsed completion data: ${JSON.stringify(completionData, null, 2)}`,
                );
              }
            } catch (parseError) {
              // Enhanced error reporting with context
              const errorContext = {
                input: args[2],
                inputLength: args[2]?.length || 0,
                inputPreview:
                  args[2]?.substring(0, 100) +
                  (args[2]?.length > 100 ? "..." : ""),
                parseErrorMessage: parseError.message,
                suggestion:
                  'Ensure JSON is properly formatted: {"message": "Task completed"} or "Simple message"',
              };

              throw new Error(
                `Invalid JSON completion data: ${parseError.message}. Input preview: "${errorContext.inputPreview}". ${errorContext.suggestion}`,
              );
            }
          }
        }

        if (!taskId) {
          throw new Error("Task ID required for complete command");
        }

        // Add agent ID to completion data if provided
        if (agentId) {
          completionData.agentId = agentId;
        }

        const result = await api.completeTask(taskId, completionData);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "fail": {
        const taskId = args[1];
        let failureData = {};

        // Parse failure data if provided
        if (args[2]) {
          try {
            failureData = JSON.parse(args[2]);

            // Convert string to object format
            if (typeof failureData === "string") {
              failureData = { reason: failureData };
            }
          } catch (parseError) {
            throw new Error(
              `Invalid JSON failure data: ${parseError.message}. Ensure proper format: '{"reason": "Task failed due to X"}'`,
            );
          }
        }

        if (!taskId) {
          throw new Error("Task ID required for fail command");
        }

        const result = await api.failTask(taskId, failureData);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "status": {
        let agentId = args[1];

        // Auto-detect stored agent ID if not provided
        if (!agentId && api.agentId) {
          agentId = api.agentId;
          console.log(`Using stored agent ID: ${agentId}`);
        }

        // If still no agent ID, provide helpful error
        if (!agentId) {
          throw new Error(
            "Agent ID required for status. Options:\n" +
              "1. Provide agent ID: status <agentId>\n" +
              "2. Initialize first: init (saves agent ID for reuse)\n" +
              "3. Current stored agent ID: " +
              (api.agentId || "none"),
          );
        }

        const result = await api.getAgentStatus(agentId);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "reinitialize": {
        const agentId = args[1];
        let config = {};

        // Parse config if provided
        if (args[2]) {
          try {
            config = JSON.parse(args[2]);
          } catch (parseError) {
            throw new Error(
              `Invalid JSON config for reinitialize: ${parseError.message}`,
            );
          }
        }

        // Smart agent auto-detection if no agentId provided
        let targetAgentId = agentId;
        if (!targetAgentId) {
          try {
            const agentsResult = await api.listAgents();
            if (agentsResult.success && agentsResult.agents && agentsResult.agents.length > 0) {
              // Auto-detect: Use the most recently active agent
              const sortedAgents = agentsResult.agents.sort((a, b) =>
                new Date(b.lastHeartbeat) - new Date(a.lastHeartbeat)
              );
              targetAgentId = sortedAgents[0].agentId;

              // eslint-disable-next-line no-console -- CLI API requires console output for auto-detection feedback
              console.log(`Auto-detected agent: ${targetAgentId} (most recent)`);
            } else {
              // No agents found - fall back to init
              // eslint-disable-next-line no-console -- CLI API requires console output for fallback feedback
              console.log("No existing agents found. Creating new agent...");
              const initResult = await api.initAgent(config);
              // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
              console.log(JSON.stringify(initResult, null, 2));
              break;
            }
          } catch (autoDetectError) {
            throw new Error(
              `Failed to auto-detect agent for reinitialize: ${autoDetectError.message}\n` +
                "To manually specify agent ID:\n" +
                '1. Run: timeout 10s node "' + process.argv[1] + '" list-agents\n' +
                "2. Copy the agentId from the output\n" +
                '3. Run: timeout 10s node "' + process.argv[1] + '" reinitialize <agentId>'
            );
          }
        }

        const result = await api.reinitializeAgent(targetAgentId, config);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "stats": {
        const result = await api.getStatistics();
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "list-agents": {
        const result = await api.listAgents();
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "move-top": {
        const taskId = args[1];
        if (!taskId) {
          throw new Error("Task ID required for move-top command");
        }
        const result = await api.moveTaskToTop(taskId);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "move-up": {
        const taskId = args[1];
        if (!taskId) {
          throw new Error("Task ID required for move-up command");
        }
        const result = await api.moveTaskUp(taskId);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "move-down": {
        const taskId = args[1];
        if (!taskId) {
          throw new Error("Task ID required for move-down command");
        }
        const result = await api.moveTaskDown(taskId);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "move-bottom": {
        const taskId = args[1];
        if (!taskId) {
          throw new Error("Task ID required for move-bottom command");
        }
        const result = await api.moveTaskToBottom(taskId);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      // ========================================
      // FEATURE MANAGEMENT COMMANDS
      // ========================================

      case "suggest-feature": {
        if (args.length < 2) {
          // eslint-disable-next-line no-console -- CLI API requires console output for command-line error messages
          console.error("Usage: suggest-feature <featureData> [agentId]");
          throw new Error("Invalid arguments for suggest-feature");
        }

        try {
          const featureData = JSON.parse(args[1]);
          const agentId = args[2] || "agent_unknown";

          if (!featureData.title) {
            // eslint-disable-next-line no-console -- CLI API requires console output for validation error messages
            console.error("Error: Feature title is required");
            throw new Error("Feature title is required");
          }

          const featureId = await api.taskManager.suggestFeature(
            featureData,
            agentId,
          );
          // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
          console.log(
            JSON.stringify(
              {
                success: true,
                featureId: featureId,
                message: `Feature suggested: ${featureData.title}`,
                status: "suggested",
                awaiting_approval: true,
              },
              null,
              2,
            ),
          );
        } catch (error) {
          // eslint-disable-next-line no-console -- CLI API requires console output for error reporting
          console.error(`Error suggesting feature: ${error.message}`);
          throw error;
        }
        break;
      }

      case "approve-feature": {
        if (args.length < 2) {
          // eslint-disable-next-line no-console -- CLI API requires console output for command-line error messages
          console.error("Usage: approve-feature <featureId> [userId]");
          throw new Error("Invalid arguments for approve-feature");
        }

        try {
          const featureId = args[1];
          const userId = args[2] || "user";

          const success = await api.taskManager.approveFeature(
            featureId,
            userId,
          );
          if (success) {
            const feature = await api.taskManager.getFeature(featureId);
            // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
            console.log(
              JSON.stringify(
                {
                  success: true,
                  featureId: featureId,
                  message: `Feature approved: ${feature.title}`,
                  status: "approved",
                  ready_for_implementation: true,
                },
                null,
                2,
              ),
            );
          } else {
            // eslint-disable-next-line no-console -- CLI API requires console output for error reporting
            console.error(`Failed to approve feature: ${featureId}`);
            throw new Error(`Failed to approve feature: ${featureId}`);
          }
        } catch (error) {
          // eslint-disable-next-line no-console -- CLI API requires console output for error reporting
          console.error(`Error approving feature: ${error.message}`);
          throw error;
        }
        break;
      }

      case "reject-feature": {
        if (args.length < 2) {
          // eslint-disable-next-line no-console -- CLI API requires console output for command-line error messages
          console.error("Usage: reject-feature <featureId> [userId] [reason]");
          throw new Error("Invalid arguments for reject-feature");
        }

        try {
          const featureId = args[1];
          const userId = args[2] || "user";
          const reason = args[3] || "";

          const feature = await api.taskManager.getFeature(featureId);
          const featureTitle = feature ? feature.title : featureId;

          const success = await api.taskManager.rejectFeature(
            featureId,
            userId,
            reason,
          );
          if (success) {
            // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
            console.log(
              JSON.stringify(
                {
                  success: true,
                  featureId: featureId,
                  message: `Feature rejected: ${featureTitle}`,
                  reason: reason,
                  removed: true,
                },
                null,
                2,
              ),
            );
          } else {
            // eslint-disable-next-line no-console -- CLI API requires console output for error reporting
            console.error(`Failed to reject feature: ${featureId}`);
            throw new Error(`Failed to reject feature: ${featureId}`);
          }
        } catch (error) {
          // eslint-disable-next-line no-console -- CLI API requires console output for error reporting
          console.error(`Error rejecting feature: ${error.message}`);
          throw error;
        }
        break;
      }

      case "list-suggested-features": {
        try {
          const features = await api.taskManager.getFeatures({
            status: "suggested",
          });
          // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
          console.log(
            JSON.stringify(
              {
                success: true,
                suggested_features: features.map((f) => ({
                  id: f.id,
                  title: f.title,
                  description: f.description,
                  rationale: f.rationale,
                  category: f.category,
                  priority: f.priority,
                  suggested_by: f.suggested_by,
                  created_at: f.created_at,
                  estimated_effort: f.metadata?.estimated_effort,
                })),
                count: features.length,
              },
              null,
              2,
            ),
          );
        } catch (error) {
          // eslint-disable-next-line no-console -- CLI API requires console output for error reporting
          console.error(`Error listing suggested features: ${error.message}`);
          throw error;
        }
        break;
      }

      case "list-features": {
        const filters = args.length > 1 ? JSON.parse(args[1]) : {};
        try {
          const features = await api.taskManager.getFeatures(filters);
          // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
          console.log(
            JSON.stringify(
              {
                success: true,
                features: features,
                count: features.length,
              },
              null,
              2,
            ),
          );
        } catch (error) {
          // eslint-disable-next-line no-console -- CLI API requires console output for error reporting
          console.error(`Error listing features: ${error.message}`);
          throw error;
        }
        break;
      }

      case "feature-stats": {
        try {
          const allFeatures = await api.taskManager.getFeatures();
          const stats = {
            total: allFeatures.length,
            by_status: {},
            by_category: {},
            by_priority: {},
            awaiting_approval: allFeatures.filter(
              (f) => f.status === "suggested",
            ).length,
          };

          allFeatures.forEach((f) => {
            stats.by_status[f.status] = (stats.by_status[f.status] || 0) + 1;
            stats.by_category[f.category] =
              (stats.by_category[f.category] || 0) + 1;
            stats.by_priority[f.priority] =
              (stats.by_priority[f.priority] || 0) + 1;
          });

          // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
          console.log(
            JSON.stringify(
              {
                success: true,
                feature_statistics: stats,
              },
              null,
              2,
            ),
          );
        } catch (error) {
          // eslint-disable-next-line no-console -- CLI API requires console output for error reporting
          console.error(`Error getting feature stats: ${error.message}`);
          throw error;
        }
        break;
      }

      // ========================================
      // PHASE MANAGEMENT COMMANDS - FEATURE-ONLY
      // 🚨 CRITICAL: Phases are EXCLUSIVELY for FEATURE tasks
      // Error, subtask, and test tasks NEVER have phases
      // ========================================

      case "create-phase": {
        const featureId = args[1];
        if (!featureId) {
          throw new Error("Feature ID required for create-phase command");
        }

        let phaseData;
        try {
          phaseData = JSON.parse(args[2] || "{}");
        } catch (parseError) {
          throw new Error(`Invalid JSON phase data: ${parseError.message}`);
        }

        if (!phaseData.title) {
          throw new Error("Phase title is required in phase data");
        }

        const phase = await api.taskManager.createPhase(featureId, phaseData);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(
          JSON.stringify(
            {
              success: true,
              phase: phase,
              featureId: featureId,
              message: `Phase "${phase.title}" created for feature ${featureId}`,
              guide: await api.getContextualGuide("phase-operations"),
            },
            null,
            2,
          ),
        );
        break;
      }

      case "update-phase": {
        const featureId = args[1];
        const phaseNumber = parseInt(args[2], 10);

        if (!featureId) {
          throw new Error("Feature ID required for update-phase command");
        }
        if (!phaseNumber || isNaN(phaseNumber)) {
          throw new Error(
            "Valid phase number required for update-phase command",
          );
        }

        let updates;
        try {
          updates = JSON.parse(args[3] || "{}");
        } catch (parseError) {
          throw new Error(`Invalid JSON updates: ${parseError.message}`);
        }

        const phase = await api.taskManager.updatePhase(
          featureId,
          phaseNumber,
          updates,
        );
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(
          JSON.stringify(
            {
              success: true,
              phase: phase,
              featureId: featureId,
              message: `Phase ${phaseNumber} updated in feature ${featureId}`,
              guide: await api.getContextualGuide("phase-operations"),
            },
            null,
            2,
          ),
        );
        break;
      }

      case "progress-phase": {
        const featureId = args[1];
        const currentPhaseNumber = parseInt(args[2], 10);

        if (!featureId) {
          throw new Error("Feature ID required for progress-phase command");
        }
        if (!currentPhaseNumber || isNaN(currentPhaseNumber)) {
          throw new Error(
            "Valid current phase number required for progress-phase command",
          );
        }

        const nextPhase = await api.taskManager.progressToNextPhase(
          featureId,
          currentPhaseNumber,
        );
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(
          JSON.stringify(
            {
              success: true,
              nextPhase: nextPhase,
              featureId: featureId,
              message: nextPhase
                ? `Progressed from Phase ${currentPhaseNumber} to Phase ${nextPhase.number} in feature ${featureId}`
                : `Phase ${currentPhaseNumber} completed - no more phases in feature ${featureId}`,
              guide: await api.getContextualGuide("phase-operations"),
            },
            null,
            2,
          ),
        );
        break;
      }

      case "list-phases": {
        const featureId = args[1];
        if (!featureId) {
          throw new Error("Feature ID required for list-phases command");
        }

        const phases = await api.taskManager.getFeaturePhases(featureId);
        const stats = await api.taskManager.getPhaseCompletionStats(featureId);

        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(
          JSON.stringify(
            {
              success: true,
              featureId: featureId,
              phases: phases,
              statistics: stats,
              count: phases.length,
              guide: await api.getContextualGuide("phase-operations"),
            },
            null,
            2,
          ),
        );
        break;
      }

      case "current-phase": {
        const featureId = args[1];
        if (!featureId) {
          throw new Error("Feature ID required for current-phase command");
        }

        const currentPhase = await api.taskManager.getCurrentPhase(featureId);
        const stats = await api.taskManager.getPhaseCompletionStats(featureId);

        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(
          JSON.stringify(
            {
              success: true,
              featureId: featureId,
              currentPhase: currentPhase,
              statistics: stats,
              message: currentPhase
                ? `Current phase: Phase ${currentPhase.number} - ${currentPhase.title} (${currentPhase.status})`
                : `No active phases found for feature ${featureId}`,
              guide: await api.getContextualGuide("phase-operations"),
            },
            null,
            2,
          ),
        );
        break;
      }

      case "phase-stats": {
        const featureId = args[1];
        if (!featureId) {
          throw new Error("Feature ID required for phase-stats command");
        }

        const stats = await api.taskManager.getPhaseCompletionStats(featureId);
        const phases = await api.taskManager.getFeaturePhases(featureId);

        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(
          JSON.stringify(
            {
              success: true,
              featureId: featureId,
              statistics: stats,
              phase_details: phases.map((p) => ({
                number: p.number,
                title: p.title,
                status: p.status,
                created_at: p.created_at,
                updated_at: p.updated_at,
              })),
              guide: await api.getContextualGuide("phase-operations"),
            },
            null,
            2,
          ),
        );
        break;
      }

      case "delete": {
        const taskId = args[1];
        if (!taskId) {
          throw new Error("Task ID required for delete command");
        }
        const result = await api.deleteTask(taskId);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "update": {
        const taskId = args[1];
        const updateData = args[2];
        if (!taskId) {
          throw new Error("Task ID required for update command");
        }
        if (!updateData) {
          throw new Error("Update data required for update command");
        }

        let parsedUpdateData;
        try {
          parsedUpdateData = JSON.parse(updateData);
        } catch (parseError) {
          throw new Error(`Invalid JSON update data: ${parseError.message}`);
        }

        const result = await api.updateTaskProgress(taskId, parsedUpdateData);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "start-websocket": {
        const port = args[1] ? parseInt(args[1], 10) : 8080;
        if (isNaN(port) || port < 1024 || port > 65535) {
          throw new Error("Valid port number required (1024-65535)");
        }
        const result = await api.startWebSocketServer(port);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "stop-websocket": {
        const result = await api.stopWebSocketServer();
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "websocket-status": {
        const result = await api.getWebSocketStatus();
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      // ========================================
      // AGENT SWARM COORDINATION COMMANDS
      // Core commands for self-organizing agent swarm architecture
      // ========================================

      case "get-tasks": {
        let options = {};

        // Parse options if provided as JSON
        if (args[1]) {
          try {
            options = JSON.parse(args[1]);
          } catch (parseError) {
            throw new Error(
              `Invalid JSON options for get-tasks: ${parseError.message}`,
            );
          }
        }

        const result = await api.getTasks(options);
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line interface
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      // ========================================

      default: {
        // eslint-disable-next-line no-console -- CLI API requires console output for command-line help text
        console.log(`
TaskManager Node.js API

Usage: timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" <command> [args...]

IMPORTANT: Always use 'timeout 10s' prefix to prevent hanging operations

Core Commands:
  methods                      - Get all available TaskManager and API methods with CLI/API mapping
  guide                        - Get comprehensive API documentation and troubleshooting
  init [config]                - Initialize agent with optional config JSON
  reinitialize <agentId> [config] - Reinitialize existing agent (use list-agents to find your agent ID)
  list-agents                  - List all active agents with their IDs and status
  status [agentId]             - Get agent status and current tasks
  current [agentId]            - Get current task for agent
  stats                        - Get orchestration statistics

Task Operations:
  create <taskData>            - Create new task with JSON data (requires category)
  create-error <taskData>      - Create error task with absolute priority (bypasses feature ordering)
  list [filter]                - List tasks with optional filter JSON
  claim <taskId> [agentId] [priority] - Claim task for agent
  complete <taskId> [data]     - Complete task with optional completion data JSON
  delete <taskId>              - Delete task (for task conversion/cleanup)

Task Management:
  move-top <taskId>            - Move task to top priority
  move-up <taskId>             - Move task up one position
  move-down <taskId>           - Move task down one position
  move-bottom <taskId>         - Move task to bottom

Feature Management:
  suggest-feature <featureData> [agentId] - Suggest new feature for user approval
  approve-feature <featureId> [userId]    - Approve suggested feature for implementation
  reject-feature <featureId> [userId] [reason] - Reject suggested feature
  list-suggested-features      - List all features awaiting user approval
  list-features [filter]       - List all features with optional filter
  feature-stats                - Get feature statistics and status breakdown

Phase Management (FEATURE-ONLY - not for error/subtask/test tasks):
  create-phase <featureId> <phaseData>    - Create new phase for a feature (sequential: Phase 1, Phase 2, etc.)
  update-phase <featureId> <phaseNumber> <updates> - Update phase status and details
  progress-phase <featureId> <currentPhaseNumber>  - Complete current phase and progress to next
  list-phases <featureId>      - List all phases for a feature with statistics
  current-phase <featureId>    - Get current active phase for a feature
  phase-stats <featureId>      - Get detailed phase completion statistics

Agent Swarm Coordination (Self-Organizing Agent Architecture):
  get-tasks [options]          - Get highest-priority available tasks for agent swarm
                                 Any agent can query this to find work autonomously
                                 TaskManager API acts as central "brain" coordinating agents
                                 Options: {"agentId": "...", "categories": ["error"], "limit": 5}

Essential Examples:
  timeout 10s timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" init
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create '{"title": "Fix linting errors", "description": "Resolve ESLint violations", "category": "error"}'
  timeout 10s timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete task_123 '{"message": "Task completed successfully"}'
  timeout 10s timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete task_123
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"status": "pending"}'
  timeout 10s timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide

Troubleshooting:
  • For completion JSON errors, ensure proper quoting: '{"message": "text"}'
  • Use 'methods' command to see CLI-to-API method mapping
  • Use 'guide' command for comprehensive documentation
  • CLI commands (like 'complete') map to API methods (like 'completeTask')

Advanced Examples:
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" suggest-feature '{"title": "Add dark mode", "description": "Implement dark theme", "rationale": "Improve UX", "category": "ui", "estimated_effort": "medium"}' agent_dev_001
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete error_456 '{"fixed": true, "details": "Resolved linting errors", "files_modified": ["src/auth.js"]}'

Agent Swarm Examples:
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-tasks
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-tasks '{"categories": ["error"], "limit": 3}'
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-tasks '{"agentId": "development_session_123", "specializations": ["frontend"]}'

                `);
        break;
      }
    } // END OF COMMENTED OUT SWITCH - UNREACHABLE CODE REMOVED */
  } catch (error) {
    // Enhanced error handling with contextual guide delivery
    let guide = null;
    let errorContext = 'general';

    // Determine error context based on error message and command
    if (
      error.message.includes('no agent id') ||
      error.message.includes('agent not initialized')
    ) {
      errorContext = 'agent-init';
    } else if (command === 'init' || command === 'reinitialize') {
      errorContext = command === 'init' ? 'agent-init' : 'agent-reinit';
    } else if (['create', 'claim', 'complete', 'list'].includes(command)) {
      errorContext = 'task-operations';
    }

    try {
      // Use cached guide method for better performance
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
