/**
 * TaskManager - Modular Task Management System
 *
 * === OVERVIEW ===
 * Modularized version of the TaskManager class That delegates functionality
 * to specialized modules while maintaining full API compatibility. This version
 * provides the same interface as the original monolithic implementation but
 * with improved maintainability, testability, And performance.
 *
 * === ARCHITECTURE ===
 * • TaskStorage: File operations And data persistence
 * • TaskPerformance: Performance monitoring And metrics
 * • TaskIndexing: Fast lookups And indexing
 * • TaskValidation: Validation And success criteria
 * • AutoFixer: Automatic error detection And resolution
 * • DistributedLockManager: Concurrency control
 * • AgentRegistry: Multi-agent coordination
 * • TaskCategories: Task classification And priority
 *
 * === KEY FEATURES ===
 * • Full API compatibility with original TaskManager
 * • Modular architecture for better maintainability
 * • Performance-optimized with specialized modules
 * • Comprehensive error handling And validation
 * • Multi-agent coordination capabilities
 * • Automatic backup And recovery systems
 *
 * @fileoverview Modular task management system with specialized components
 * @author TaskManager System
 * @version 2.0.0
 * @since 2024-01-01
 */

const { LOGGER } = require('./logger');

// Import specialized modules
const TASK_STORAGE = require('./modules/TaskStorage');
const TASK_PERFORMANCE = require('./modules/TaskPerformance');
const TASK_INDEXING = require('./modules/TaskIndexing');
const TASK_VALIDATION = require('./modules/TaskValidation');

// Import existing dependencies That weren't modularized yet
const AUTO_FIXER = require('./autoFixer');
const DISTRIBUTED_LOCK_MANAGER = require('./distributedLockManager');
const AGENT_REGISTRY = require('./agentRegistry');
const TASK_CATEGORIES = require('./taskCategories');

class TaskManager {
  /**
   * Initialize TaskManager with modular architecture
   * @param {string} todoPath - Path to TODO.json file
   * @param {Object} options - Configuration options
   */
  constructor(todoPath, options = {}) {
    this.todoPath = todoPath;
    this.logger = LOGGER;
    this.options = {
      enableMultiAgent: options.enableMultiAgent !== false,
      enableAutoFix: options.enableAutoFix !== false,
      enableArchiving: options.enableArchiving !== false,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring !== false,
      enableIndexing: options.enableIndexing !== false,
      enableValidation: options.enableValidation !== false,
      validateOnRead: options.validateOnRead !== false,
      ...options,
    };

    this.logger?.logInfo?.('Initializing modular TaskManager system');

    // Initialize performance monitoring first (other modules depend on it)
    this.performance = new TASK_PERFORMANCE({
      enablePerformanceMonitoring: this.options.enablePerformanceMonitoring,
      maxMetricsHistory: options.maxMetricsHistory || 1000,
    });

    // Initialize storage module
    this.storage = new TASK_STORAGE(todoPath, {
      donePath: options.donePath,
      enableCache: options.enableCache !== false,
      enableArchiving: this.options.enableArchiving,
      validateOnRead: this.options.validateOnRead,
    });

    // Initialize indexing module with performance monitoring
    this.indexing = new TASK_INDEXING(this.performance, {
      enableIndexing: this.options.enableIndexing,
      enableCriteriaInheritance: options.enableCriteriaInheritance !== false,
    });

    // Initialize validation module
    this.validation = new TASK_VALIDATION({
      enableStrictValidation: options.enableStrictValidation !== false,
      enableAutoRepair: options.enableAutoRepair !== false,
      requireCategory: options.requireCategory !== false,
      validCategories: options.validCategories,
      validStatuses: options.validStatuses,
    });

    // Initialize existing non-modularized components lazily
    this._autoFixer = null;
    this._lockManager = null;
    this._agentRegistry = null;
    this._taskCategories = null;

    // Configuration for lazy-loaded components
    this._autoFixerOptions = {
      projectRoot: options.projectRoot,
      ...options.autoFixer,
    };

    this._lockManagerOptions = {
      lockTimeout: options.lockTimeout || 2000,
      lockRetryInterval: options.lockRetryInterval || 5,
      maxRetries: options.maxRetries || 10,
      enableDeadlockDetection: options.enableDeadlockDetection !== false,
      ...options.lockManager,
    };

    this.logger?.logInfo?.('Modular TaskManager system initialized successfully');
  }

  // Lazy-loaded component getters
  get autoFixer() {
    if (!this._autoFixer && this.options.enableAutoFix) {
      this._autoFixer = new AUTO_FIXER(this._autoFixerOptions);
    }
    return this._autoFixer;
  }

  get lockManager() {
    if (!this._lockManager && this.options.enableMultiAgent) {
      this._lockManager = new DISTRIBUTED_LOCK_MANAGER(this._lockManagerOptions);
    }
    return this._lockManager;
  }

  get agentRegistry() {
    if (!this._agentRegistry && this.options.enableMultiAgent) {
      const registryPath = this.todoPath.replace('TODO.json', 'agent-registry.json');
      this._agentRegistry = new AGENT_REGISTRY(registryPath);
    }
    return this._agentRegistry;
  }

  get taskCategories() {
    if (!this._taskCategories) {
      this._taskCategories = new TASK_CATEGORIES();
    }
    return this._taskCategories;
  }

  // =================== STORAGE OPERATIONS ===================
  // Delegate to TaskStorage module

  /**
   * Read TODO.json synchronously
   * @returns {Object} TODO data
   */
  readTodoSync() {
    return this.storage.readTodoSync();
  }

  /**
   * Read TODO.json with caching
   * @returns {Object} TODO data
   */
  readTodoFast() {
    return this.storage.readTodoFast();
  }

  /**
   * Read TODO.json with full validation
   * @param {boolean} skipValidation - Skip validation for performance
   * @returns {Promise<Object>} TODO data
   */
  async readTodo(skipValidation = false) {
    const startTime = Date.now();
    const data = await this.storage.readTodo(skipValidation);

    // Invalidate indexes when data is loaded
    this.indexing.invalidateIndexes();

    // Record performance metrics
    const duration = Date.now() - startTime;
    this.performance.recordQueryTime('readTodo', duration);

    return data;
  }

  /**
   * Write TODO.json atomically
   * @param {Object} data - TODO data to write
   * @param {boolean} skipBackup - Skip backup creation
   * @returns {Promise<Object>} Write result
   */
  async writeTodo(data, skipBackup = false) {
    const startTime = Date.now();

    // Validate data if validation is enabled
    if (this.options.enableValidation) {
      const validationResult = this.validation.validateTodoStructure(data);
      if (!validationResult.isValid) {
        this.logger?.logWarning?.('TODO data validation failed', {
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        });

        // Continue with write if auto-repair is not enabled, otherwise fail
        if (!this.options.enableAutoRepair) {
          throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
        }
      }
    }

    const result = await this.storage.writeTodo(data, skipBackup);

    // Invalidate indexes after successful write
    this.indexing.invalidateIndexes();

    // Record performance metrics
    const duration = Date.now() - startTime;
    this.performance.recordQueryTime('writeTodo', duration);

    return result;
  }

  /**
   * Create backup of TODO.json
   * @returns {Promise<Object>} Backup result
   */
  async createBackup() {
    const result = await this.storage.createBackup();
    return result;
  }

  /**
   * List available backups
   * @returns {Array} Backup files list
   */
  listBackups() {
    return this.storage.listBackups();
  }

  /**
   * Restore from backup
   * @param {string} backupFile - Backup file to restore from
   * @returns {Promise<Object>} Restore result
   */
  async restoreFromBackup(backupFile = null) {
    const result = await this.storage.restoreFromBackup(backupFile);

    // Invalidate indexes after restore
    if (result.success) {
      this.indexing.invalidateIndexes();
    }

    return result;
  }

  /**
   * Clean up old backup files
   * @param {number} keepCount - Number of backups to keep
   * @returns {Object} Cleanup result
   */
  cleanupLegacyBackups(keepCount = 5) {
    return this.storage.cleanupLegacyBackups(keepCount);
  }

  /**
   * Get file status information
   * @returns {Object} File status
   */
  getFileStatus() {
    return this.storage.getFileStatus();
  }

  // =================== INDEXING OPERATIONS ===================
  // Delegate to TaskIndexing module

  /**
   * Get subtasks with optimized lookup
   * @param {string} parentTaskId - Parent task ID
   * @returns {Array} Subtasks array
   */
  async getSubtasksOptimized(parentTaskId) {
    const todoData = await this.readTodo();
    return this.indexing.getSubtasksOptimized(parentTaskId, todoData);
  }

  /**
   * Get subtask by ID
   * @param {string} subtaskId - Subtask ID
   * @returns {Object|null} Subtask with parent info
   */
  async getSubtaskById(subtaskId) {
    const todoData = await this.readTodo();
    return this.indexing.getSubtaskById(subtaskId, todoData);
  }

  /**
   * Get research tasks
   * @param {string} parentTaskId - Parent task ID (optional)
   * @returns {Array} Research tasks
   */
  async getResearchTasksOptimized(parentTaskId = null) {
    const todoData = await this.readTodo();
    return this.indexing.getResearchTasksOptimized(parentTaskId, todoData);
  }

  /**
   * Get audit tasks
   * @param {string} parentTaskId - Parent task ID (optional)
   * @returns {Array} Audit tasks
   */
  async getAuditTasksOptimized(parentTaskId = null) {
    const todoData = await this.readTodo();
    return this.indexing.getAuditTasksOptimized(parentTaskId, todoData);
  }

  /**
   * Get effective success criteria for a task
   * @param {string} taskId - Task ID
   * @returns {Set} Effective criteria
   */
  async getEffectiveCriteria(taskId) {
    const todoData = await this.readTodo();
    return this.indexing.getEffectiveCriteria(taskId, todoData);
  }

  /**
   * Get tasks by category
   * @param {string} category - Task category
   * @returns {Array} Tasks in category
   */
  async getTasksByCategory(category) {
    const todoData = await this.readTodo();
    return this.indexing.getTasksByCategory(category, todoData);
  }

  /**
   * Get tasks by status
   * @param {string} status - Task status
   * @returns {Array} Tasks with status
   */
  async getTasksByStatus(status) {
    const todoData = await this.readTodo();
    return this.indexing.getTasksByStatus(status, todoData);
  }

  // =================== VALIDATION OPERATIONS ===================
  // Delegate to TaskValidation module

  /**
   * Validate a task object
   * @param {Object} task - Task to validate
   * @param {Object} context - Validation context
   * @returns {Object} Validation result
   */
  validateTask(task, context = {}) {
    return this.validation.validateTask(task, context);
  }

  /**
   * Validate TODO structure
   * @param {Object} todoData - TODO data to validate
   * @returns {Object} Validation result
   */
  validateTodoStructure(todoData) {
    return this.validation.validateTodoStructure(todoData);
  }

  /**
   * Evaluate success criteria for a task
   * @param {Object} task - Task to evaluate
   * @param {Object} context - Evaluation context
   * @returns {Object} Success criteria evaluation
   */
  evaluateSuccessCriteria(task, context = {}) {
    return this.validation.evaluateSuccessCriteria(task, context);
  }

  /**
   * Validate agent scope for a task
   * @param {Object} task - Task to validate
   * @param {string} agentId - Agent ID
   * @param {Object} context - Validation context
   * @returns {Object} Scope validation result
   */
  validateAgentScope(task, agentId, context = {}) {
    return this.validation.validateAgentScope(task, agentId, context);
  }

  /**
   * Validate completion data
   * @param {Object} completionData - Completion data to validate
   * @param {Object} task - Task being completed
   * @returns {Object} Validation result
   */
  validateCompletionData(completionData, task) {
    return this.validation.validateCompletionData(completionData, task);
  }

  /**
   * Validate failure data
   * @param {Object} failureData - Failure data to validate
   * @param {Object} task - Task That failed
   * @returns {Object} Validation result
   */
  validateFailureData(failureData, task) {
    return this.validation.validateFailureData(failureData, task);
  }

  // =================== PERFORMANCE OPERATIONS ===================
  // Delegate to TaskPerformance module

  /**
   * Get performance report
   * @returns {Object} Comprehensive performance report
   */
  getPerformanceReport() {
    return this.performance.getPerformanceReport();
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics() {
    this.performance.clearMetrics();
  }

  /**
   * Record memory usage
   * @param {Object} additionalMetrics - Additional metrics
   */
  recordMemoryUsage(additionalMetrics = {}) {
    this.performance.recordMemoryUsage(additionalMetrics);
  }

  // =================== AGENT TASK OPERATIONS ===================
  // Agent-related task operations (claim, assignment, etc.)

  /**
   * Claim a task for an agent with distributed locking
   * @param {string} taskId - Task ID
   * @param {string} agentId - Agent ID
   * @param {string} priority - Claim priority (normal, high, urgent)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Claim result
   */
  async claimTask(taskId, agentId, priority = 'normal', options = {}) {
    const startTime = Date.now();
    this.logger?.logInfo?.(`[claimTask] Starting task claim: ${taskId} by agent ${agentId}`);

    // Fast path: Check if task exists first before acquiring expensive locks
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);

    if (!task) {
      this.logger?.logWarning?.(`[claimTask] Task not found: ${taskId}`);
      return { success: false, reason: 'Task not found' };
    }

    // Allow claiming of pending tasks And switched tasks That can be resumed
    if (
      task.status !== 'pending' &&
      !(task.status === 'switched' && task.switch_context?.canResume)
    ) {
      this.logger?.logWarning?.(`[claimTask] Task not available for claiming: ${taskId} (status: ${task.status})`);
      return {
        success: false,
        reason: `Task is not available for claiming (status: ${task.status})`,
      };
    }

    // for switched tasks, verify the agent can claim it
    if (
      task.status === 'switched' &&
      task.switch_context?.switchedBy !== agentId
    ) {
      return {
        success: false,
        reason:
          'Switched task can only be resumed by the agent who switched it',
      };
    }

    if (!this.options.enableMultiAgent) {
      // Fall back to simple assignment if multi-agent is disabled
      return this.claimTaskSimple(taskId, agentId, priority, options);
    }

    // Use distributed locking for safe task claiming (only when needed)
    const lockResult = await this.lockManager.acquireLock(
      this.todoPath,
      agentId,
    );

    if (!lockResult.success) {
      this.logger?.logError?.(`[claimTask] Failed to acquire lock for task ${taskId}:`, lockResult.error);
      return {
        success: false,
        reason: `Failed to acquire lock: ${lockResult.error}`,
        lockError: lockResult,
      };
    }

    try {
      const todoData = await this.readTodoFast();
      const task = todoData.tasks.find((t) => t.id === taskId);

      if (!task) {
        return { success: false, reason: 'Task not found' };
      }

      if (task.status !== 'pending') {
        return { success: false, reason: 'Task is not available for claiming' };
      }

      if (task.assigned_agent) {
        return {
          success: false,
          reason: 'Task is already assigned to another agent',
        };
      }

      // Validate task claiming prerequisites
      const validationResult = this._validateTaskClaiming(
        taskId,
        todoData,
        options,
        agentId,
      );
      if (!validationResult.valid) {
        return validationResult.errorResult;
      }

      // Claim the task atomically
      task.assigned_agent = agentId;
      task.status = 'in_progress';
      task.started_at = new Date().toISOString();
      task.claimed_by = agentId;

      // Initialize multi-agent fields if not present
      if (!task.agent_assignment_history) {
        task.agent_assignment_history = [];
      }

      task.agent_assignment_history.push({
        agentId: agentId,
        role: 'primary',
        assignedAt: new Date().toISOString(),
        reassignReason: null,
        claimPriority: priority,
      });

      await this.writeTodo(todoData);

      // Record performance metrics
      const duration = Date.now() - startTime;
      this.performance.recordQueryTime('claimTask', duration);

      this.logger?.logInfo?.(`[claimTask] Task claimed successfully: ${taskId} by agent ${agentId}`);

      return {
        success: true,
        task: task,
        claimedAt: new Date().toISOString(),
        priority: priority,
        lockId: lockResult.lockId,
      };
    } finally {
      // Always release the lock
      await this.lockManager.releaseLock(this.todoPath, agentId);
    }
  }

  /**
   * Simple task claiming without distributed locking
   * @param {string} taskId - Task ID
   * @param {string} agentId - Agent ID
   * @param {string} priority - Claim priority
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Claim result
   */
  async claimTaskSimple(taskId, agentId, priority = 'normal', options = {}) {
    const startTime = Date.now();
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, reason: 'Task not found' };
    }

    // Allow claiming of pending tasks And switched tasks That can be resumed
    if (
      task.status !== 'pending' &&
      !(task.status === 'switched' && task.switch_context?.canResume)
    ) {
      return {
        success: false,
        reason: `Task is not available for claiming (status: ${task.status})`,
      };
    }

    if (task.assigned_agent) {
      return {
        success: false,
        reason: 'Task is already assigned to another agent',
      };
    }

    // Validate task claiming prerequisites
    const validationResult = this._validateTaskClaiming(
      taskId,
      todoData,
      options,
      agentId,
    );
    if (!validationResult.valid) {
      return validationResult.errorResult;
    }

    // Claim the task
    task.assigned_agent = agentId;
    task.status = 'in_progress';
    task.started_at = new Date().toISOString();
    task.claimed_by = agentId;

    // Initialize multi-agent fields if not present
    if (!task.agent_assignment_history) {
      task.agent_assignment_history = [];
    }

    task.agent_assignment_history.push({
      agentId: agentId,
      role: 'primary',
      assignedAt: new Date().toISOString(),
      reassignReason: null,
      claimPriority: priority,
    });

    await this.writeTodo(todoData);

    // Record performance metrics
    const duration = Date.now() - startTime;
    this.performance.recordQueryTime('claimTaskSimple', duration);

    return {
      success: true,
      task: task,
      claimedAt: new Date().toISOString(),
      priority: priority,
    };
  }

  /**
   * Validate task claiming prerequisites
   * @param {string} taskId - Task ID to validate
   * @param {Object} todoData - Todo data object
   * @param {Object} options - Validation options
   * @param {string} agentId - Agent ID attempting to claim the task
   * @returns {Object} Validation result
   * @private
   */
  _validateTaskClaiming(taskId, todoData, options = {}, agentId = null) {
    // AUDIT TASK OBJECTIVITY ENFORCEMENT
    const task = todoData.tasks.find((t) => t.id === taskId);
    if (agentId && task && task.category === 'audit') {
      // Check if the current agent was the original implementer
      if (task.original_implementer === agentId || task.audit_metadata?.original_implementer === agentId) {
        return {
          valid: false,
          errorResult: {
            success: false,
            reason: 'Objectivity violation: Cannot audit own work',
            message: 'Audit tasks must be performed by different agents to ensure objectivity',
            original_implementer: task.original_implementer || task.audit_metadata?.original_implementer,
            current_agent: agentId,
            suggestion: 'This audit task should be assigned to a different agent who did not implement the original feature',
          },
        };
      }
    }

    // Feature-based linear progression (unless explicitly overridden)
    if (!options.allowOutOfOrder) {
      // ERROR TASKS HAVE ABSOLUTE PRIORITY - Always allow claiming error tasks
      if (task.category === 'error') {
        return { valid: true };
      }

      // Check if there are pending error tasks That should be done first
      const pendingErrorTasks = todoData.tasks.filter(
        (t) =>
          t.status === 'pending' && !t.assigned_agent && t.category === 'error',
      );

      if (pendingErrorTasks.length > 0 && task.category !== 'error') {
        const nextErrorTask = pendingErrorTasks[0];
        return {
          valid: false,
          errorResult: {
            success: false,
            reason: `Error tasks have absolute priority And must be completed first`,
            nextTaskId: nextErrorTask.id,
            nextTaskTitle: nextErrorTask.title,
            errorCategory: nextErrorTask.category,
            suggestion: `Fix error task "${nextErrorTask.title}" first before proceeding with feature work`,
          },
        };
      }
    }

    return { valid: true };
  }

  // =================== CORE TASK OPERATIONS ===================
  // Basic task operations with modular support

  /**
   * List all tasks with optional filtering
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Array>} Filtered tasks
   */
  async listTasks(filter = {}) {
    const startTime = Date.now();
    const todoData = await this.readTodo();
    let tasks = todoData.tasks || [];

    // Apply filters using indexing when possible
    if (filter.status) {
      tasks = this.indexing.getTasksByStatus(filter.status, todoData);
    } else if (filter.category) {
      tasks = this.indexing.getTasksByCategory(filter.category, todoData);
    } else {
      tasks = todoData.tasks || [];
    }

    // Apply additional filters
    if (filter.assigned_agent) {
      tasks = tasks.filter(task => task.assigned_agent === filter.assigned_agent);
    }

    if (filter.priority) {
      tasks = tasks.filter(task => task.priority === filter.priority);
    }

    if (filter.hasFile) {
      tasks = tasks.filter(task =>
        task.important_files && task.important_files.includes(filter.hasFile),
      );
    }

    // Record performance metrics
    const duration = Date.now() - startTime;
    this.performance.recordQueryTime('listTasks', duration, { filterCount: Object.keys(filter).length });

    return tasks;
  }

  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} Creation result
   */
  async createTask(taskData) {
    const startTime = Date.now();

    // Generate task ID if not provided
    if (!taskData.id) {
      taskData.id = this._generateTaskId(taskData.category);
    }

    // Validate task data
    const validationResult = this.validation.validateTask(taskData);
    if (!validationResult.isValid) {
      throw new Error(`Task validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Set default values
    const task = {
      status: 'pending',
      created_at: new Date().toISOString(),
      ...taskData,
    };

    // Read current data, add task, And write back
    const todoData = await this.readTodo();
    if (!todoData.tasks) {
      todoData.tasks = [];
    }

    todoData.tasks.push(task);
    await this.writeTodo(todoData);

    // Record performance metrics
    const duration = Date.now() - startTime;
    this.performance.recordQueryTime('createTask', duration);

    this.logger?.logInfo?.(`Task created successfully: ${task.id}`);

    return {
      success: true,
      task,
      message: 'Task created successfully',
    };
  }

  /**
   * Get a single task by ID
   * @param {string} taskId - Task ID
   * @returns {Promise<Object|null>} Task or null if not found
   */
  async getTask(taskId) {
    const startTime = Date.now();
    const todoData = await this.readTodo();

    // Use indexing if available for faster lookup
    const index = this.indexing.buildTaskIndex(todoData);
    const task = index ? index.byId.get(taskId) : todoData.tasks?.find(t => t.id === taskId);

    // Record performance metrics
    const duration = Date.now() - startTime;
    this.performance.recordQueryTime('getTask', duration);
    this.performance.recordCacheHit(!!task, 'getTask');

    return task || null;
  }

  /**
   * Update a task
   * @param {string} taskId - Task ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Update result
   */
  async updateTask(taskId, updates) {
    const startTime = Date.now();
    const todoData = await this.readTodo();

    const taskIndex = todoData.tasks?.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // eslint-disable-next-line security/detect-object-injection -- Array access with validated index from findIndex() for task updates
    const task = todoData.tasks[taskIndex];
    const updatedTask = { ...task, ...updates, updated_at: new Date().toISOString() };

    // Validate updated task
    const validationResult = this.validation.validateTask(updatedTask, { todoData });
    if (!validationResult.isValid) {
      throw new Error(`Task validation failed: ${validationResult.errors.join(', ')}`);
    }

    // eslint-disable-next-line security/detect-object-injection -- Array access with validated index from findIndex() for task updates
    todoData.tasks[taskIndex] = updatedTask;
    await this.writeTodo(todoData);

    // Record performance metrics
    const duration = Date.now() - startTime;
    this.performance.recordQueryTime('updateTask', duration);

    this.logger?.logInfo?.(`Task updated successfully: ${taskId}`);

    return {
      success: true,
      task: updatedTask,
      message: 'Task updated successfully',
    };
  }

  /**
   * Complete a task (adapter method for API compatibility)
   * @param {string} taskId - Task ID to complete
   * @param {Object} completionData - Completion data
   * @returns {Promise<Object>} Completion result
   */
  async completeTask(taskId, completionData = {}) {
    const startTime = Date.now();

    // Validate completion data
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const validationResult = this.validation.validateCompletionData(completionData, task);
    if (!validationResult.isValid) {
      throw new Error(`Completion data validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Update task with completion data
    const updates = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      ...validationResult.sanitizedData,
    };

    const result = await this.updateTask(taskId, updates);

    // Archive if enabled
    if (this.options.enableArchiving) {
      try {
        await this.storage.archiveCompletedTask(result.task);
      } catch (_error) {
        this.logger?.logWarning?.(`Failed to archive task ${taskId}: ${error.message}`);
      }
    }

    // Record performance metrics
    const duration = Date.now() - startTime;
    this.performance.recordQueryTime('completeTask', duration);

    return {
      success: true,
      taskId,
      task: result.task,
      completedAt: result.task.completed_at,
      message: 'Task completed successfully',
    };
  }

  // =================== UTILITY METHODS ===================

  /**
   * Generate a task ID
   * @param {string} category - Task category
   * @returns {string} Generated task ID
   * @private
   */
  _generateTaskId(category) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    return `${category || 'task'}_${timestamp}_${randomSuffix}`;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.logger?.logInfo?.('Cleaning up TaskManager resources');

    // Cleanup performance monitoring
    if (this.performance) {
      this.performance.disable();
    }

    // Cleanup lock manager
    if (this._lockManager && typeof this._lockManager.cleanup === 'function') {
      await this._lockManager.cleanup();
    }

    // Clear storage cache
    if (this.storage) {
      this.storage.clearCache();
    }

    this.logger?.logInfo?.('TaskManager cleanup completed');
  }

  // =================== ADAPTER METHODS ===================
  // Methods to maintain compatibility with existing APIs

  /**
   * Validate TODO file (legacy compatibility)
   * @returns {Promise<Object>} Validation result
   */
  async validateTodoFile() {
    const todoData = await this.readTodo();
    return this.validation.validateTodoStructure(todoData);
  }

  /**
   * Perform auto-fix (delegate to AutoFixer)
   * @param {Object} options - Auto-fix options
   * @returns {Promise<Object>} Auto-fix result
   */
  async performAutoFix(options = {}) {
    if (!this.options.enableAutoFix || !this.autoFixer) {
      return {
        success: false,
        message: 'Auto-fix is disabled',
      };
    }

    const result = await this.autoFixer.performAutoFix(options);
    return result;
  }

  /**
   * Legacy autoFix method for backward compatibility
   * @param {string} filePath - Path to TODO.json file
   * @returns {Promise<Object>} Fix result
   */
  async autoFix(_filePath) {
    if (!this.options.enableAutoFix || !this.autoFixer) {
      return {
        success: false,
        fixed: false,
        message: 'Auto-fix is disabled',
      };
    }

    const result = await this.autoFixer.autoFix(_filePath);
    return result;
  }

  /**
   * Get task status counts by status
   * @returns {Promise<Object>} Task status counts
   */
  async getTaskStatus() {
    const todoData = await this.readTodo();
    const tasks = todoData.tasks || [];

    const statusCounts = {
      pending: 0,
      in_progress: 0,
      completed: 0,
    };

    for (const task of tasks) {
      if (task && task.status) {
        if (Object.prototype.hasOwnProperty.call(statusCounts, task.status)) {
          statusCounts[task.status]++;
        }
      }
    }

    return statusCounts;
  }

  /**
   * Migrate completed tasks to DONE.json
   * @returns {Promise<Object>} Migration result
   */
  async migrateCompletedTasks() {
    const todoData = await this.readTodo();
    const tasks = todoData.tasks || [];

    const completedTasks = tasks.filter(task => task && task.status === 'completed');
    const remainingTasks = tasks.filter(task => task && task.status !== 'completed');

    if (completedTasks.length === 0) {
      return {
        migrated: 0,
        total: tasks.length,
        skipped: 0,
      };
    }

    // Archive completed tasks to DONE.json
    await this.storage.archiveCompletedTasks(completedTasks);

    // Update TODO.json with only non-completed tasks
    todoData.tasks = remainingTasks;
    await this.writeTodo(todoData);

    return {
      migrated: completedTasks.length,
      total: tasks.length,
      skipped: 0,
    };
  }

  /**
   * Get indexing statistics
   * @returns {Object} Indexing statistics
   */
  getIndexingStats() {
    return this.indexing.getIndexingStats();
  }

  /**
   * Get validation statistics
   * @returns {Object} Validation statistics
   */
  getValidationStats() {
    return this.validation.getValidationStats();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return this.storage.getCacheStats();
  }
}

module.exports = TaskManager;
