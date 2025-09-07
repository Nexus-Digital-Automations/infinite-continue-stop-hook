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
 *    node taskmanager-api.js init --project-root /path/to/project
 *
 * 2. Task Operations:
 *    node taskmanager-api.js create '{"title": "Task", "category": "enhancement"}'
 *    node taskmanager-api.js list '{"status": "pending"}'
 *    node taskmanager-api.js claim task_123 agent_456
 *
 * 3. Status and Monitoring:
 *    node taskmanager-api.js status agent_456
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

const path = require("path");

// Parse project root from --project-root flag or use current directory
const args = process.argv.slice(2);
const projectRootIndex = args.indexOf("--project-root");
const PROJECT_ROOT =
  projectRootIndex !== -1 && projectRootIndex + 1 < args.length
    ? args[projectRootIndex + 1]
    : process.cwd();
const TODO_PATH = path.join(PROJECT_ROOT, "TODO.json");

// Remove --project-root and its value from args for command parsing
if (projectRootIndex !== -1) {
  args.splice(projectRootIndex, 2);
}

// Absolute path to the infinite-continue-stop-hook directory (where TaskManager system lives)
const TASKMANAGER_ROOT = __dirname;

// Import TaskManager modules using absolute paths
let TaskManager, AgentManager, MultiAgentOrchestrator;

try {
  // Import TaskManager modules using absolute paths
  TaskManager = require(path.join(TASKMANAGER_ROOT, "lib", "taskManager.js"));
  AgentManager = require(path.join(TASKMANAGER_ROOT, "lib", "agentManager.js"));
  MultiAgentOrchestrator = require(
    path.join(TASKMANAGER_ROOT, "lib", "multiAgentOrchestrator.js"),
  );
} catch (error) {
  console.error("Failed to load TaskManager modules:", error.message);
  console.error("Full error:", error);
  throw error;
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

    // Multi-agent orchestration for concurrent operations
    this.orchestrator = new MultiAgentOrchestrator(TODO_PATH);

    // Feature management integrated into TODO.json feature-based system

    // Session state - current agent ID (null until agent is initialized)
    this.agentId = null;

    // Performance configuration - 10 second timeout for all operations
    // This prevents hanging operations and ensures responsive behavior
    this.timeout = 10000;
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
    try {
      return await this.withTimeout(
        (() => {
          // Extract all public methods from TaskManager core class
          const taskManagerMethods = Object.getOwnPropertyNames(
            Object.getPrototypeOf(this.taskManager),
          )
            .filter((name) => name !== "constructor" && !name.startsWith("_"))
            .sort();

          // Extract all public methods from TaskManagerAPI wrapper class
          const apiMethods = Object.getOwnPropertyNames(
            Object.getPrototypeOf(this),
          )
            .filter((name) => name !== "constructor" && !name.startsWith("_"))
            .sort();

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
              usage: "node taskmanager-api.js methodName args",
            },
            examples: {
              taskManager:
                "tm.createTask({title: 'Test', category: 'enhancement'})",
              api: 'node taskmanager-api.js list \'{"status": "pending"}\'',
            },
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
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
              version: "2.0.0",
              description:
                "Universal TaskManager API for agent-driven development workflows",
            },
            taskClassification: {
              required: true,
              parameter: "task_type",
              description:
                "All tasks MUST include explicit task_type parameter during creation",
              types: [
                {
                  value: "error",
                  name: "Error Task",
                  priority: 1,
                  description:
                    "System errors, linter violations, build failures, runtime bugs - HIGHEST PRIORITY",
                  examples: [
                    "Fix ESLint violations",
                    "Resolve build compilation errors",
                    "Fix runtime exceptions",
                  ],
                  triggers: [
                    "linter errors",
                    "build failures",
                    "startup errors",
                    "runtime bugs",
                    "security vulnerabilities",
                  ],
                },
                {
                  value: "feature",
                  name: "Feature Task",
                  priority: 2,
                  description:
                    "New functionality, enhancements, refactoring, documentation - HIGH PRIORITY",
                  examples: [
                    "Add user authentication",
                    "Implement dark mode",
                    "Refactor API endpoints",
                  ],
                  triggers: [
                    "new features requested",
                    "enhancements needed",
                    "code refactoring",
                    "documentation updates",
                  ],
                },
                {
                  value: "subtask",
                  name: "Subtask",
                  priority: 3,
                  description:
                    "Implementation of specific subtasks for preexisting features from TODO.json features array - MEDIUM PRIORITY",
                  examples: [
                    "Implement login form for auth feature",
                    "Add validation to signup process",
                  ],
                  triggers: [
                    "implementing approved feature components",
                    "feature breakdown tasks",
                  ],
                },
                {
                  value: "test",
                  name: "Test Task",
                  priority: 4,
                  description:
                    "Test coverage, test creation, test setup, test performance - LOWEST PRIORITY (ONLY AFTER ERRORS/FEATURES COMPLETE)",
                  examples: [
                    "Add unit tests for UserService",
                    "Implement E2E tests for login flow",
                  ],
                  triggers: [
                    "test coverage gaps",
                    "test setup needs",
                    "test performance issues",
                  ],
                  restrictions:
                    "BLOCKED until all error and feature tasks are resolved",
                },
              ],
              priorityRules: {
                "1_error":
                  "Always executed first - highest priority - can interrupt other work",
                "2_feature": "Executed after all errors resolved",
                "3_subtask": "Executed after new features complete",
                "4_test":
                  "Only executed when errors, features, and subtasks are complete",
              },
            },
            coreCommands: {
              discovery: {
                guide: {
                  description: "Get this comprehensive guide",
                  usage: "node taskmanager-api.js guide",
                  output: "Complete API documentation and usage information",
                },
                methods: {
                  description: "List all available API methods",
                  usage: "node taskmanager-api.js methods",
                  output: "Available methods and usage examples",
                },
                status: {
                  description: "Get agent status and current tasks",
                  usage: "node taskmanager-api.js status [agentId]",
                  output: "Agent state, assigned tasks, and system status",
                },
              },
              agentLifecycle: {
                init: {
                  description: "Initialize agent with TaskManager system",
                  usage: "node taskmanager-api.js init [config]",
                  required: "Must be called before any task operations",
                  output: "Agent ID and registration confirmation",
                },
                reinitialize: {
                  description: "Refresh agent registration and renew heartbeat",
                  usage:
                    "node taskmanager-api.js reinitialize [agentId] [config]",
                  when: "After task completion, before long operations, after idle periods",
                  output: "Updated agent status and renewed registration",
                },
              },
              taskOperations: {
                create: {
                  description: "Create new task with explicit classification",
                  usage:
                    'node taskmanager-api.js create \'{"title":"Task name", "description":"Details", "task_type":"error|feature|subtask|test"}\'',
                  required_fields: ["title", "description", "task_type"],
                  optional_fields: [
                    "priority",
                    "dependencies",
                    "important_files",
                  ],
                  validation:
                    "task_type must be one of: error, feature, subtask, test",
                },
                claim: {
                  description: "Claim task for agent execution",
                  usage:
                    "node taskmanager-api.js claim <taskId> [agentId] [priority]",
                  output: "Task assignment confirmation",
                },
                complete: {
                  description: "Mark task as completed",
                  usage:
                    "node taskmanager-api.js complete <taskId> [completionData]",
                  required: "Only after full implementation and validation",
                },
                list: {
                  description: "List tasks with optional filtering",
                  usage: "node taskmanager-api.js list [filter]",
                  examples: [
                    'node taskmanager-api.js list \'{"status":"pending"}\'',
                    'node taskmanager-api.js list \'{"task_type":"error"}\'',
                  ],
                },
              },
            },
            workflows: {
              taskCreationWorkflow: [
                "1. Call 'guide' endpoint to understand task classification",
                "2. Analyze request to determine appropriate task_type",
                "3. Create task with explicit task_type parameter",
                "4. System automatically assigns priority based on task_type",
                "5. Task added to appropriate priority queue",
              ],
              agentWorkflow: [
                "1. Initialize agent with 'init' command",
                "2. Check status and available tasks",
                "3. Claim highest priority available task",
                "4. Execute task implementation",
                "5. Complete task with evidence",
                "6. Reinitialize before next task",
              ],
              priorityEnforcement: [
                "ERROR tasks bypass all other ordering - executed immediately",
                "FEATURE tasks blocked until all errors resolved",
                "SUBTASK tasks blocked until all features complete",
                "TEST tasks blocked until errors, features, subtasks complete",
              ],
            },
            examples: {
              taskCreation: {
                errorTask:
                  'node taskmanager-api.js create \'{"title":"Fix ESLint violations in auth.js", "description":"Resolve linting errors", "task_type":"error"}\'',
                featureTask:
                  'node taskmanager-api.js create \'{"title":"Add dark mode toggle", "description":"Implement theme switching", "task_type":"feature"}\'',
                subtaskTask:
                  'node taskmanager-api.js create \'{"title":"Implement login form", "description":"Create login UI for auth feature", "task_type":"subtask"}\'',
                testTask:
                  'node taskmanager-api.js create \'{"title":"Add UserService tests", "description":"Unit test coverage", "task_type":"test"}\'',
              },
              commonWorkflows: {
                newAgent: [
                  "node taskmanager-api.js guide",
                  "node taskmanager-api.js init",
                  "node taskmanager-api.js status",
                ],
                taskExecution: [
                  'node taskmanager-api.js list \'{"status":"pending"}\'',
                  "node taskmanager-api.js claim <taskId>",
                  "# ... implement task ...",
                  "node taskmanager-api.js complete <taskId>",
                ],
              },
            },
            requirements: {
              mandatory: [
                "All task creation MUST include explicit task_type parameter",
                "Agent MUST call init before any task operations",
                "Agent MUST reinitialize after task completion",
                "Test tasks MUST NOT be created until errors/features complete",
              ],
              bestPractices: [
                "Use guide endpoint to understand system before starting",
                "Check status regularly to monitor system state",
                "Provide detailed task descriptions for better coordination",
                "Include important_files for tasks that modify specific files",
              ],
            },
            taskConversion: {
              description:
                "Guidelines for converting existing tasks to proper task_type classification",
              legacyTaskHandling:
                "Existing tasks without task_type should be analyzed and converted using TaskManager API",
              conversionWorkflow: [
                "1. List all pending tasks without proper task_type classification",
                "2. Analyze each task title and description to determine appropriate task_type",
                "3. Delete legacy tasks and recreate with proper task_type parameter",
                "4. Verify new tasks appear in correct priority order",
              ],
              classificationGuide: {
                "ERROR tasks": {
                  indicators: [
                    "fix",
                    "error",
                    "bug",
                    "broken",
                    "linter",
                    "build fail",
                    "compilation",
                    "syntax",
                  ],
                  examples: [
                    "Fix ESLint violations",
                    "Resolve build errors",
                    "Debug runtime exceptions",
                  ],
                  task_type: "error",
                },
                "FEATURE tasks": {
                  indicators: [
                    "add",
                    "implement",
                    "create",
                    "build",
                    "develop",
                    "new functionality",
                  ],
                  examples: [
                    "Add user authentication",
                    "Implement dashboard",
                    "Create API endpoints",
                  ],
                  task_type: "feature",
                },
                "SUBTASK tasks": {
                  indicators: [
                    "component of",
                    "part of",
                    "for feature",
                    "subtask",
                    "specific implementation",
                  ],
                  examples: [
                    "Create login form for auth feature",
                    "Add validation to user input",
                  ],
                  task_type: "subtask",
                },
                "TEST tasks": {
                  indicators: [
                    "test",
                    "coverage",
                    "unit test",
                    "integration test",
                    "e2e",
                    "spec",
                  ],
                  examples: [
                    "Add unit tests",
                    "Increase test coverage",
                    "E2E testing",
                  ],
                  task_type: "test",
                },
              },
              conversionCommands: {
                listLegacyTasks:
                  'node taskmanager-api.js list \'{"status":"pending"}\' | grep -v task_type',
                deleteTask: "node taskmanager-api.js delete <taskId>",
                recreateTask:
                  'node taskmanager-api.js create \'{"title":"New Title", "description":"Description", "task_type":"error|feature|subtask|test"}\'',
              },
            },
            advancedWorkflows: {
              bulkTaskConversion: [
                '1. Export existing tasks to analyze: node taskmanager-api.js list \'{"status":"pending"}\'',
                "2. For each task without task_type, determine classification using conversionGuide",
                "3. Delete old task: node taskmanager-api.js delete <oldTaskId>",
                "4. Create new task with proper task_type: node taskmanager-api.js create <taskData>",
                '5. Verify priority ordering: node taskmanager-api.js list \'{"status":"pending"}\'',
              ],
              priorityValidation: [
                "1. List all pending tasks to verify ordering",
                "2. Ensure ERROR tasks appear first in list",
                "3. Ensure TEST tasks appear last in list",
                "4. Verify task claiming follows priority rules",
              ],
            },
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
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
    try {
      return await this.withTimeout(
        (async () => {
          // Default agent configuration for development workflows
          const defaultConfig = {
            role: "development", // Primary agent role
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
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getCurrentTask(agentId = null) {
    try {
      return await this.withTimeout(
        (async () => {
          const targetAgentId = agentId || this.agentId;
          const task = await this.taskManager.getCurrentTask(targetAgentId);

          return {
            success: true,
            task: task || null,
            hasTask: !!task,
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async listTasks(filter = {}) {
    try {
      return await this.withTimeout(
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
          if (filter.task_type) {
            tasks = tasks.filter((task) => {
              // Extract task_type from task ID prefix
              const taskType = task.id.split("_")[0];
              return taskType === filter.task_type;
            });
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
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createTask(taskData) {
    try {
      return await this.withTimeout(
        (async () => {
          const taskId = await this.taskManager.createTask(taskData);

          return {
            success: true,
            taskId,
            task: taskData,
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
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
    try {
      return await this.withTimeout(
        (async () => {
          // Ensure error category is set
          const errorCategories = [
            "error",
            "build-error",
            "linter-error",
            "start-error",
          ];
          if (!errorCategories.includes(taskData.category)) {
            taskData.category = "error"; // Default to generic error
          }

          // Set high priority for error tasks
          taskData.priority = taskData.priority || "critical";

          // Add error-specific metadata
          taskData.is_error_task = true;
          taskData.created_by = "error-detection-system";

          const taskId = await this.taskManager.createTask(taskData);
          return {
            success: true,
            taskId,
            task: taskData,
            message: `Error task created with absolute priority (category: ${taskData.category})`,
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async analyzePhaseInsertion(newTaskData) {
    try {
      return await this.withTimeout(
        (async () => {
          const data = await this.taskManager.readTodoFast();
          const newPhase = this.taskManager._extractPhase(newTaskData.title);

          if (!newPhase) {
            return {
              success: true,
              hasPhase: false,
              message: "Task does not contain phase information",
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
              : "No phase conflicts detected",
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
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
   */
  async claimTask(taskId, agentId = null, priority = "normal") {
    try {
      return await this.withTimeout(
        (async () => {
          // Resolve target agent ID - use provided ID or current session agent
          const targetAgentId = agentId || this.agentId;
          if (!targetAgentId) {
            throw new Error("No agent ID provided and no agent initialized");
          }

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
              if (depTask && depTask.status !== "completed") {
                incompleteDependencies.push(depTask);
              }
            }

            // If dependencies exist, block task claiming and provide guidance
            if (incompleteDependencies.length > 0) {
              // Find the next dependency that should be worked on first
              const nextDependency =
                incompleteDependencies.find(
                  (dep) => dep.status === "pending",
                ) || incompleteDependencies[0];

              return {
                success: false,
                reason:
                  "Task has incomplete dependencies that must be completed first",
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
              };
            }
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
            (claimedTask.category === "research" ||
              claimedTask.requires_research)
          ) {
            researchInstructions = {
              message: "🔬 RESEARCH TASK DETECTED - RESEARCH REQUIRED FIRST",
              instructions: [
                "📋 BEFORE IMPLEMENTATION: Perform comprehensive research",
                "📁 CREATE research report in development/reports/ directory",
                "🔍 ANALYZE existing solutions, best practices, and technical approaches",
                "📊 DOCUMENT findings, recommendations, and implementation strategy",
                "✅ COMPLETE research report before proceeding with implementation",
                "🗂️ USE research findings to guide implementation decisions",
              ],
              reportTemplate: {
                filename: `research-${claimedTask.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}.md`,
                directory: "development/reports/",
                sections: [
                  "# Research Report: " + claimedTask.title,
                  "## Overview",
                  "## Current State Analysis",
                  "## Research Findings",
                  "## Technical Approaches",
                  "## Recommendations",
                  "## Implementation Strategy",
                  "## References",
                ],
              },
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
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async completeTask(taskId, completionData = {}) {
    try {
      return await this.withTimeout(
        (async () => {
          // Get task details to check type
          const todoData = await this.taskManager.readTodoFast();
          const task = todoData.tasks.find((t) => t.id === taskId);

          // Update task status with completion notes if provided
          if (completionData.notes) {
            await this.taskManager.updateTaskStatusConcurrent(
              taskId,
              "completed",
              completionData.notes,
            );
          } else {
            await this.taskManager.updateTaskStatus(taskId, "completed");
          }

          let documentationInstructions = null;

          // Add documentation update instructions for feature and subtask types
          if (
            task &&
            (task.category === "feature" || task.category === "subtask")
          ) {
            documentationInstructions = {
              mandatory: true,
              message: "🔴 DOCUMENTATION UPDATE REQUIRED",
              instructions: [
                "📋 UPDATE development/essentials/features.md to reflect task completion",
                "📝 UPDATE relevant API documentation if functionality was modified",
                "✅ VERIFY documentation accuracy and completeness",
                "📖 UPDATE README.md if user-facing features were added/modified",
                "🔍 VALIDATE all documentation changes before final completion",
              ],
              files_to_update: [
                "development/essentials/features.md",
                "docs/ (relevant API documentation)",
                "README.md (if user-facing changes)",
              ],
            };
          }

          return {
            success: true,
            taskId,
            completionData,
            documentationInstructions,
            message: documentationInstructions
              ? "Task marked complete. MANDATORY: Update documentation as instructed above."
              : "Task marked complete successfully.",
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteTask(taskId) {
    try {
      return await this.withTimeout(
        (async () => {
          const todoData = await this.taskManager.readTodoFast();
          const taskIndex = todoData.tasks.findIndex((t) => t.id === taskId);

          if (taskIndex === -1) {
            return {
              success: false,
              error: `Task not found: ${taskId}`,
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
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getAgentStatus(agentId = null) {
    try {
      return await this.withTimeout(
        (async () => {
          const targetAgentId = agentId || this.agentId;
          if (!targetAgentId) {
            throw new Error("No agent ID provided and no agent initialized");
          }

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
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async reinitializeAgent(agentId = null, config = {}) {
    try {
      return await this.withTimeout(
        (async () => {
          const targetAgentId = agentId || this.agentId;
          if (!targetAgentId) {
            throw new Error("No agent ID provided and no agent initialized");
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
              "Agent reinitialized successfully - heartbeat renewed and timeout reset",
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getStatistics() {
    try {
      return await this.withTimeout(
        (async () => {
          const stats = await this.orchestrator.getOrchestrationStatistics();

          return {
            success: true,
            statistics: stats,
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Task reordering methods
  async moveTaskToTop(taskId) {
    try {
      return await this.withTimeout(
        (async () => {
          const result = await this.taskManager.moveTaskToTop(taskId);
          return {
            success: true,
            moved: result,
            taskId,
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async moveTaskUp(taskId) {
    try {
      return await this.withTimeout(
        (async () => {
          const result = await this.taskManager.moveTaskUp(taskId);
          return {
            success: true,
            moved: result,
            taskId,
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async moveTaskDown(taskId) {
    try {
      return await this.withTimeout(
        (async () => {
          const result = await this.taskManager.moveTaskDown(taskId);
          return {
            success: true,
            moved: result,
            taskId,
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async moveTaskToBottom(taskId) {
    try {
      return await this.withTimeout(
        (async () => {
          const result = await this.taskManager.moveTaskToBottom(taskId);
          return {
            success: true,
            moved: result,
            taskId,
          };
        })(),
      );
    } catch (error) {
      return {
        success: false,
        error: error.message,
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
    const implementationCategories = ["missing-feature", "enhancement", "bug"];
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
        t.category === "research" &&
        t.status === "completed" &&
        this._isTaskRelated(task, t),
    );

    if (hasComplexityIndicators && relatedResearchTasks.length === 0) {
      return {
        suggestResearch: true,
        reason: "Task appears complex and might benefit from research",
        complexityFactors: this._identifyComplexityFactors(taskText),
        suggestions: {
          message: "🔬 RESEARCH RECOMMENDED BEFORE IMPLEMENTATION",
          instructions: [
            "📋 CONSIDER creating a research task first to:",
            "🔍 INVESTIGATE best practices and technical approaches",
            "📚 RESEARCH existing solutions and patterns",
            "🎯 DEFINE implementation strategy and requirements",
            "✅ CREATE research task or proceed if confident",
          ],
          researchTaskTemplate: {
            title: `Research: ${task.title}`,
            description: `Research technical approaches, best practices, and implementation strategies for: ${task.description}`,
            category: "research",
            mode: "RESEARCH",
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
        .replace(/[^\w\s]/g, " ")
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
      factors.push("API/Integration complexity");
    }
    if (/auth|oauth|jwt|security/.test(taskText)) {
      factors.push("Authentication/Security requirements");
    }
    if (/database|schema|migration/.test(taskText)) {
      factors.push("Database/Schema complexity");
    }
    if (/external|third.?party/.test(taskText)) {
      factors.push("External service dependencies");
    }
    if (/performance|scalability/.test(taskText)) {
      factors.push("Performance/Scalability considerations");
    }

    return factors;
  }

  // Feature management methods removed - unified with TODO.json feature-based system

  // Cleanup method
  async cleanup() {
    try {
      // Cleanup in proper order with sufficient time
      if (this.taskManager && typeof this.taskManager.cleanup === "function") {
        await this.taskManager.cleanup();
      }
      if (
        this.agentManager &&
        typeof this.agentManager.cleanup === "function"
      ) {
        await this.agentManager.cleanup();
      }
      if (
        this.orchestrator &&
        typeof this.orchestrator.cleanup === "function"
      ) {
        await this.orchestrator.cleanup();
      }
    } catch (error) {
      console.warn("Cleanup warning:", error.message);
    }

    // Give more time for cleanup and use setTimeout for better performance
    setTimeout(() => {
      process.exit(0);
    }, 0);
  }
}

// CLI interface
async function main() {
  // Use the already parsed args (with --project-root removed)
  const command = args[0];

  const api = new TaskManagerAPI();

  try {
    switch (command) {
      case "methods": {
        const result = await api.getApiMethods();
        console.log(JSON.stringify(result, null, 2));
        break;
      }
      case "guide": {
        const result = await api.getComprehensiveGuide();
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
        const result = await api.initAgent(config);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "current": {
        const agentId = args[1];
        const result = await api.getCurrentTask(agentId);
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
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "claim": {
        const taskId = args[1];
        const agentId = args[2];
        const priority = args[3] || "normal";
        if (!taskId) {
          throw new Error("Task ID required for claim command");
        }
        const result = await api.claimTask(taskId, agentId, priority);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "complete": {
        const taskId = args[1];
        let completionData = {};
        if (args[2]) {
          try {
            completionData = JSON.parse(args[2]);
          } catch (parseError) {
            throw new Error(
              `Invalid JSON completion data: ${parseError.message}`,
            );
          }
        }
        if (!taskId) {
          throw new Error("Task ID required for complete command");
        }
        const result = await api.completeTask(taskId, completionData);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "status": {
        const agentId = args[1];
        const result = await api.getAgentStatus(agentId);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "reinitialize": {
        const agentId = args[1];
        let config = {};
        if (args[2]) {
          try {
            config = JSON.parse(args[2]);
          } catch (parseError) {
            throw new Error(
              `Invalid JSON config for reinitialize: ${parseError.message}`,
            );
          }
        }
        const result = await api.reinitializeAgent(agentId, config);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "stats": {
        const result = await api.getStatistics();
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "move-top": {
        const taskId = args[1];
        if (!taskId) {
          throw new Error("Task ID required for move-top command");
        }
        const result = await api.moveTaskToTop(taskId);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "move-up": {
        const taskId = args[1];
        if (!taskId) {
          throw new Error("Task ID required for move-up command");
        }
        const result = await api.moveTaskUp(taskId);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "move-down": {
        const taskId = args[1];
        if (!taskId) {
          throw new Error("Task ID required for move-down command");
        }
        const result = await api.moveTaskDown(taskId);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "move-bottom": {
        const taskId = args[1];
        if (!taskId) {
          throw new Error("Task ID required for move-bottom command");
        }
        const result = await api.moveTaskToBottom(taskId);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      // ========================================
      // FEATURE MANAGEMENT COMMANDS
      // ========================================

      case "suggest-feature": {
        if (args.length < 2) {
          console.error("Usage: suggest-feature <featureData> [agentId]");
          throw new Error("Invalid arguments for suggest-feature");
        }

        try {
          const featureData = JSON.parse(args[1]);
          const agentId = args[2] || "agent_unknown";

          if (!featureData.title) {
            console.error("Error: Feature title is required");
            throw new Error("Feature title is required");
          }

          const featureId = await api.taskManager.suggestFeature(
            featureData,
            agentId,
          );
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
          console.error(`Error suggesting feature: ${error.message}`);
          throw error;
        }
        break;
      }

      case "approve-feature": {
        if (args.length < 2) {
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
            console.error(`Failed to approve feature: ${featureId}`);
            throw new Error(`Failed to approve feature: ${featureId}`);
          }
        } catch (error) {
          console.error(`Error approving feature: ${error.message}`);
          throw error;
        }
        break;
      }

      case "reject-feature": {
        if (args.length < 2) {
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
            console.error(`Failed to reject feature: ${featureId}`);
            throw new Error(`Failed to reject feature: ${featureId}`);
          }
        } catch (error) {
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
          console.error(`Error listing suggested features: ${error.message}`);
          throw error;
        }
        break;
      }

      case "list-features": {
        const filters = args.length > 1 ? JSON.parse(args[1]) : {};
        try {
          const features = await api.taskManager.getFeatures(filters);
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
          console.error(`Error getting feature stats: ${error.message}`);
          throw error;
        }
        break;
      }

      case "delete": {
        const taskId = args[1];
        if (!taskId) {
          throw new Error("Task ID required for delete command");
        }
        const result = await api.deleteTask(taskId);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      // ========================================

      default: {
        console.log(`
TaskManager Node.js API

Usage: node taskmanager-api.js <command> [args...]

Commands:
  methods                      - Get all available TaskManager and API methods
  init [config]                - Initialize agent with optional config JSON
  current [agentId]            - Get current task for agent
  list [filter]                - List tasks with optional filter JSON
  create <taskData>            - Create new task with JSON data
  create-error <taskData>      - Create error task with absolute priority (bypasses feature ordering)
  claim <taskId> [agentId] [priority] - Claim task for agent
  complete <taskId> [data]     - Complete task with optional data JSON
  delete <taskId>              - Delete task (for task conversion/cleanup)
  status [agentId]             - Get agent status and tasks
  reinitialize [agentId] [config] - Reinitialize agent (renew heartbeat, reset timeout)
  stats                        - Get orchestration statistics
  move-top <taskId>            - Move task to top priority
  move-up <taskId>             - Move task up one position
  move-down <taskId>           - Move task down one position
  move-bottom <taskId>         - Move task to bottom

Feature Suggestion & Management:
  suggest-feature <featureData> [agentId] - Suggest new feature for user approval
  approve-feature <featureId> [userId]    - Approve suggested feature for implementation
  reject-feature <featureId> [userId] [reason] - Reject suggested feature
  list-suggested-features      - List all features awaiting user approval
  list-features [filter]       - List all features with optional filter
  feature-stats                - Get feature statistics and status breakdown

Examples:
  timeout 10s node taskmanager-api.js init '{"role": "development", "specialization": ["testing"]}'
  timeout 10s node taskmanager-api.js create '{"title": "Fix bug", "mode": "DEVELOPMENT", "priority": "high"}'
  timeout 10s node taskmanager-api.js list '{"status": "pending"}'
  timeout 10s node taskmanager-api.js reinitialize agent_123 '{"metadata": {"renewed": true}}'
  
Feature Suggestion Examples:
  timeout 10s node taskmanager-api.js suggest-feature '{"title": "Add dark mode", "description": "Implement dark theme", "rationale": "Improve user experience", "category": "ui", "estimated_effort": "medium"}' agent_dev_001
  timeout 10s node taskmanager-api.js list-suggested-features
  timeout 10s node taskmanager-api.js approve-feature feature_suggested_123456789_abc123def user
  timeout 10s node taskmanager-api.js reject-feature feature_suggested_123456789_abc123def user "Not aligned with project goals"

Task Management Examples:
  timeout 10s node taskmanager-api.js move-top task_123
  
                `);
        break;
      }
    }
  } catch (error) {
    // Get comprehensive guide for error responses
    let guide = null;
    try {
      const guideResult = await api.getComprehensiveGuide();
      guide = guideResult.success ? guideResult : null;
    } catch (guideError) {
      // If guide fails, continue with error response without guide
    }

    const errorResponse = {
      success: false,
      error: error.message,
      command,
      guide: guide || {
        message:
          'For complete API usage guidance, run: timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" guide',
        helpText:
          "The guide provides comprehensive information about task classification, workflows, and all API capabilities",
      },
    };

    console.error(JSON.stringify(errorResponse, null, 2));
    throw new Error("TaskManager API execution failed");
  } finally {
    await api.cleanup();
  }
}

// Export for programmatic use
module.exports = TaskManagerAPI;

// Run CLI if called directly (CommonJS equivalent)
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error.message);
    throw error;
  });
}
