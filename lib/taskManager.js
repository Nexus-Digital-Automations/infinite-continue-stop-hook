/**
 * TaskManager - Modular Task Management System
 *
 * === OVERVIEW ===
 * Modularized version of the TaskManager class that delegates functionality
 * to specialized modules while maintaining full API compatibility. This version
 * provides the same interface as the original monolithic implementation but
 * with improved maintainability, testability, and performance.
 *
 * === ARCHITECTURE ===
 * • TaskStorage: File operations and data persistence
 * • TaskPerformance: Performance monitoring and metrics
 * • TaskIndexing: Fast lookups and indexing
 * • TaskValidation: Validation and success criteria
 * • AutoFixer: Automatic error detection and resolution
 * • DistributedLockManager: Concurrency control
 * • AgentRegistry: Multi-agent coordination
 * • TaskCategories: Task classification and priority
 *
 * === KEY FEATURES ===
 * • Full API compatibility with original TaskManager
 * • Modular architecture for better maintainability
 * • Performance-optimized with specialized modules
 * • Comprehensive error handling and validation
 * • Multi-agent coordination capabilities
 * • Automatic backup and recovery systems
 *
 * @fileoverview Modular task management system with specialized components
 * @author TaskManager System
 * @version 2.0.0
 * @since 2024-01-01
 */

const fs = require('fs');
const _path = require('path');
const logger = require('./appLogger');

// Import specialized modules
const TaskStorage = require('./modules/TaskStorage');
const TaskPerformance = require('./modules/TaskPerformance');
const TaskIndexing = require('./modules/TaskIndexing');
const TaskValidation = require('./modules/TaskValidation');

// Import existing dependencies that weren't modularized yet
const AutoFixer = require('./autoFixer');
const DistributedLockManager = require('./distributedLockManager');
const AgentRegistry = require('./agentRegistry');
const TaskCategories = require('./taskCategories');

class TaskManager {
  /**
   * Initialize TaskManager with modular architecture
   * @param {string} todoPath - Path to TODO.json file
   * @param {Object} options - Configuration options
   */
  constructor(todoPath, options = {}) {
    this.todoPath = todoPath;
    this.logger = logger;
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
    this.performance = new TaskPerformance({
      enablePerformanceMonitoring: this.options.enablePerformanceMonitoring,
      maxMetricsHistory: options.maxMetricsHistory || 1000,
    });

    // Initialize storage module
    this.storage = new TaskStorage(todoPath, {
      donePath: options.donePath,
      enableCache: options.enableCache !== false,
      enableArchiving: this.options.enableArchiving,
      validateOnRead: this.options.validateOnRead,
    });

    // Initialize indexing module with performance monitoring
    this.indexing = new TaskIndexing(this.performance, {
      enableIndexing: this.options.enableIndexing,
      enableCriteriaInheritance: options.enableCriteriaInheritance !== false,
    });

    // Initialize validation module
    this.validation = new TaskValidation({
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
      this._autoFixer = new AutoFixer(this._autoFixerOptions);
    }
    return this._autoFixer;
  }

  get lockManager() {
    if (!this._lockManager && this.options.enableMultiAgent) {
      this._lockManager = new DistributedLockManager(this._lockManagerOptions);
    }
    return this._lockManager;
  }

  get agentRegistry() {
    if (!this._agentRegistry && this.options.enableMultiAgent) {
      const registryPath = this.todoPath.replace('TODO.json', 'agent-registry.json');
      this._agentRegistry = new AgentRegistry(registryPath);
    }
    return this._agentRegistry;
  }

  get taskCategories() {
    if (!this._taskCategories) {
      this._taskCategories = new TaskCategories();
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
    return this.storage.createBackup();
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
   * @param {Object} task - Task that failed
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

    // Read current data, add task, and write back
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

    const task = todoData.tasks[taskIndex];
    const updatedTask = { ...task, ...updates, updated_at: new Date().toISOString() };

    // Validate updated task
    const validationResult = this.validation.validateTask(updatedTask, { todoData });
    if (!validationResult.isValid) {
      throw new Error(`Task validation failed: ${validationResult.errors.join(', ')}`);
    }

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
      } catch (error) {
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

    return this.autoFixer.performAutoFix(options);
  }

  /**
   * Legacy autoFix method for backward compatibility
   * @param {string} filePath - Path to TODO.json file
   * @returns {Promise<Object>} Fix result
   */
  async autoFix(filePath) {
    if (!this.options.enableAutoFix || !this.autoFixer) {
      return {
        success: false,
        fixed: false,
        message: 'Auto-fix is disabled',
      };
    }

    return this.autoFixer.autoFix(filePath);
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
        if (statusCounts.hasOwnProperty(task.status)) {
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
