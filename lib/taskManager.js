/**
 * TaskManager - Core Task Management System
 *
 * === OVERVIEW ===
 * The TaskManager class is the central component of the TaskManager system,
 * providing comprehensive task management capabilities including creation,
 * modification, status tracking, dependency management, and multi-agent
 * coordination. This class manages the TODO.json file and provides atomic
 * operations for task workflows.
 *
 * === KEY FEATURES ===
 * • Atomic task operations with distributed locking
 * • Multi-agent coordination and conflict resolution
 * • Dependency management and validation
 * • Automatic error detection and recovery
 * • Performance optimization with caching and lazy loading
 * • Stale task monitoring and cleanup
 * • Category-based task organization
 * • Research workflow integration
 *
 * === ARCHITECTURE ===
 * • AutoFixer: Automatic error detection and resolution
 * • DistributedLockManager: Prevents race conditions in multi-agent scenarios
 * • AgentRegistry: Agent management and coordination
 * • TaskCategories: Task classification and priority management
 * • Performance optimizations: Caching, lazy loading, and efficient I/O
 *
 * === TASK LIFECYCLE ===
 * 1. Creation - Tasks created with unique IDs and metadata
 * 2. Assignment - Tasks claimed by agents through coordination system
 * 3. Execution - Task status updated through workflow states
 * 4. Completion - Tasks marked complete with optional archiving
 * 5. Cleanup - Completed tasks moved to DONE.json archive
 *
 * === MULTI-AGENT COORDINATION ===
 * • Distributed locking prevents concurrent modification conflicts
 * • Agent registry tracks active agents and their assignments
 * • Task claiming system ensures single-agent ownership
 * • Heartbeat monitoring for stale task detection
 * • Automatic task reassignment on agent failure
 *
 * === PERFORMANCE CHARACTERISTICS ===
 * • Aggressive caching with file modification time tracking
 * • Lazy loading of heavy components (AutoFixer, LockManager)
 * • Optimized JSON parsing with validation skipping options
 * • Efficient stale task monitoring with configurable thresholds
 * • Memory-efficient operation for large task sets
 *
 * @fileoverview Core task management and TODO.json operations
 * @author TaskManager System
 * @version 2.0.0
 * @since 2024-01-01
 */

const fs = require('fs');
const _path = require('path');
const crypto = require('crypto');
const { spawn: _spawn } = require('child_process');
const logger = require('./appLogger');
const AutoFixer = require('./autoFixer');
const DistributedLockManager = require('./distributedLockManager');
const AgentRegistry = require('./agentRegistry');
const TaskCategories = require('./taskCategories');

class TaskManager {
  constructor(todoPath, options = {}) {
    this.todoPath = todoPath;
    this.donePath =
      options.donePath || todoPath.replace('TODO.json', 'DONE.json');

    // Performance optimization: Add aggressive caching
    this._cache = {
      data: null,
      lastModified: 0,
      enabled: options.enableCache !== false,
    };

    // Detect test environment and disable archiving by default in tests
    const isTestEnvironment =
      process.env.NODE_ENV === 'test' ||
      process.env.JEST_WORKER_ID !== undefined ||
      typeof global.it === 'function';

    // Lazy-load heavy components for better performance
    this._autoFixer = null;
    this._lockManager = null;
    this._agentRegistry = null;
    this._taskCategories = null;
    this._autoFixerOptions = {
      projectRoot: options.projectRoot,
      ...options.autoFixer,
      recovery: {
        allowTestFiles: isTestEnvironment || options.allowTestFiles,
        ...options.autoFixer?.recovery,
      },
    };
    this._lockManagerOptions = {
      lockTimeout: options.lockTimeout || 2000, // 2 seconds (reduced from 30)
      lockRetryInterval: options.lockRetryInterval || 5, // 5ms (very fast)
      maxRetries: options.maxRetries || 10, // 10 retries (reduced from 50)
      enableDeadlockDetection: options.enableDeadlockDetection !== false,
      ...options.lockManager,
    };

    this.options = {
      enableAutoFix: options.enableAutoFix !== false,
      autoFixLevel: options.autoFixLevel || 'moderate',
      validateOnRead: options.validateOnRead !== false,
      enableArchiving: isTestEnvironment
        ? options.enableArchiving === true
        : options.enableArchiving !== false,
      enableMultiAgent: options.enableMultiAgent !== false,
      enableAutoSetup: options.enableAutoSetup !== false,
      // Enhanced stale task monitoring configuration
      staleTaskTimeout: options.staleTaskTimeout || 15, // minutes - configurable timeout (matches stale agent timeout)
      staleTaskWarningThreshold: options.staleTaskWarningThreshold || 0.75, // warn at 75% of timeout
      enableStaleTaskWarnings: options.enableStaleTaskWarnings !== false,
      enableStaleTaskStatistics: options.enableStaleTaskStatistics !== false,
      maxStaleTaskHistory: options.maxStaleTaskHistory || 100,
      ...options,
    };

    // Initialize enhanced stale task monitoring
    this._staleTaskHistory = [];
    this._staleTaskStats = {
      totalStaleEvents: 0,
      tasksReverted: 0,
      warningsIssued: 0,
      lastStaleCheck: null,
      avgStaleTime: 0,
      frequentlyStaleAgents: new Map(),
      frequentlyStaleTaskTypes: new Map(),
    };

    // Auto-setup disabled - causing performance issues
    // if (this.options.enableAutoSetup && !isTestEnvironment) {
    //     this._ensureProjectSetup().catch(error => {
    //         // Log error but don't fail construction - setup is optional
    //         console.warn(`TaskManager auto-setup failed: ${error.message}`);
    //     });
    // }

    // Performance Optimization Agent #9: Enhanced task indexing and caching system
    this._taskIndex = null;
    this._lastIndexTime = 0;
    this._criteriaCache = null;
    this._lastCriteriaTime = 0;
    this._performanceMonitor = null;

    // Initialize performance monitoring if enabled
    if (options.enablePerformanceMonitoring !== false) {
      this._performanceMonitor = {
        metrics: {
          queryTimes: [],
          cacheHitRates: { hits: 0, misses: 0 },
          batchOperations: [],
          memoryUsage: [],
        },
        recordQueryTime: (operation, duration) => {
          this._performanceMonitor.metrics.queryTimes.push({
            operation,
            duration,
            timestamp: Date.now(),
          });

          // Keep only recent metrics (last 1000)
          if (this._performanceMonitor.metrics.queryTimes.length > 1000) {
            this._performanceMonitor.metrics.queryTimes = this._performanceMonitor.metrics.queryTimes.slice(-1000);
          }
        },
        recordCacheHit: (hit) => {
          if (hit) {
            this._performanceMonitor.metrics.cacheHitRates.hits++;
          } else {
            this._performanceMonitor.metrics.cacheHitRates.misses++;
          }
        },
        getPerformanceReport: () => {
          const avgQueryTime = this._performanceMonitor.metrics.queryTimes.length > 0
            ? this._performanceMonitor.metrics.queryTimes.reduce((sum, m) => sum + m.duration, 0) / this._performanceMonitor.metrics.queryTimes.length
            : 0;

          const cacheHitRate = this._performanceMonitor.metrics.cacheHitRates.hits /
            (this._performanceMonitor.metrics.cacheHitRates.hits + this._performanceMonitor.metrics.cacheHitRates.misses) * 100;

          return {
            avgQueryTime: `${avgQueryTime.toFixed(2)}ms`,
            cacheHitRate: `${cacheHitRate.toFixed(1)}%`,
            totalQueries: this._performanceMonitor.metrics.queryTimes.length,
            recentQueries: this._performanceMonitor.metrics.queryTimes.slice(-10),
          };
        },
      };
    }
  }

  // Lazy-load AutoFixer only when needed
  get autoFixer() {
    if (!this._autoFixer) {
      this._autoFixer = new AutoFixer(this._autoFixerOptions);
    }
    return this._autoFixer;
  }

  set autoFixer(value) {
    this._autoFixer = value;
  }

  // Lazy-load DistributedLockManager only when needed
  get lockManager() {
    if (!this._lockManager) {
      this._lockManager = new DistributedLockManager(this._lockManagerOptions);
    }
    return this._lockManager;
  }

  // Lazy-load AgentRegistry only when needed
  get agentRegistry() {
    if (!this._agentRegistry) {
      const registryPath = this.todoPath.replace(
        'TODO.json',
        'agent-registry.json',
      );
      this._agentRegistry = new AgentRegistry(registryPath);
    }
    return this._agentRegistry;
  }

  // Lazy-load TaskCategories only when needed
  get taskCategories() {
    if (!this._taskCategories) {
      this._taskCategories = new TaskCategories();
    }
    return this._taskCategories;
  }

  // Performance Optimization Agent #9: Enhanced task indexing system for O(1) subtask lookups
  _buildTaskIndex() {
    if (!this._taskIndex || this._cache.lastModified > this._lastIndexTime) {
      const startTime = Date.now();
      const todoData = this._cache.data || this.readTodoFast();

      this._taskIndex = {
        byId: new Map(),
        byParent: new Map(),
        byCategory: new Map(),
        subtasks: new Map(),
        researchTasks: new Map(),
        auditTasks: new Map(),
      };

      todoData.tasks?.forEach(task => {
        // Core task indexing
        this._taskIndex.byId.set(task.id, task);

        // Category indexing for fast filtering
        if (!this._taskIndex.byCategory.has(task.category)) {
          this._taskIndex.byCategory.set(task.category, []);
        }
        this._taskIndex.byCategory.get(task.category).push(task);

        // Index subtasks for O(1) lookup
        if (task.subtasks?.length) {
          task.subtasks.forEach(subtask => {
            this._taskIndex.subtasks.set(subtask.id, {
              ...subtask,
              parentId: task.id,
              parentTask: task,
            });

            // Special indexing for research and audit subtasks
            if (subtask.type === 'research') {
              this._taskIndex.researchTasks.set(subtask.id, {
                ...subtask,
                parentId: task.id,
                parentTask: task,
              });
            } else if (subtask.type === 'audit') {
              this._taskIndex.auditTasks.set(subtask.id, {
                ...subtask,
                parentId: task.id,
                parentTask: task,
              });
            }
          });
        }
      });

      this._lastIndexTime = Date.now();

      // Record performance metrics
      if (this._performanceMonitor) {
        const duration = Date.now() - startTime;
        this._performanceMonitor.recordQueryTime('buildTaskIndex', duration);
      }
    }
    return this._taskIndex;
  }

  // Performance Optimization Agent #9: Success criteria cache with inheritance
  _buildSuccessCriteriaCache() {
    if (!this._criteriaCache || this._cache.lastModified > this._lastCriteriaTime) {
      const startTime = Date.now();
      const todoData = this._cache.data || this.readTodoFast();

      this._criteriaCache = new Map();

      // Cache project-wide criteria
      if (todoData.project_success_criteria) {
        this._criteriaCache.set('__project_wide__',
          new Set(todoData.project_success_criteria));
      }

      // Cache task-specific criteria
      todoData.tasks?.forEach(task => {
        if (task.success_criteria?.length) {
          this._criteriaCache.set(task.id, new Set(task.success_criteria));
        }

        // Cache subtask criteria
        if (task.subtasks?.length) {
          task.subtasks.forEach(subtask => {
            if (subtask.success_criteria?.length) {
              this._criteriaCache.set(subtask.id, new Set(subtask.success_criteria));
            }
          });
        }
      });

      this._lastCriteriaTime = Date.now();

      // Record performance metrics
      if (this._performanceMonitor) {
        const duration = Date.now() - startTime;
        this._performanceMonitor.recordQueryTime('buildSuccessCriteriaCache', duration);
      }
    }
    return this._criteriaCache;
  }

  // Performance Optimization Agent #9: Fast criteria lookup with inheritance
  getEffectiveCriteria(taskId) {
    const startTime = Date.now();
    const cache = this._buildSuccessCriteriaCache();
    const taskCriteria = cache.get(taskId) || new Set();
    const projectCriteria = cache.get('__project_wide__') || new Set();

    const result = new Set([...taskCriteria, ...projectCriteria]);

    // Record performance metrics
    if (this._performanceMonitor) {
      const duration = Date.now() - startTime;
      this._performanceMonitor.recordQueryTime('getEffectiveCriteria', duration);
      this._performanceMonitor.recordCacheHit(cache.has(taskId));
    }

    return result;
  }

  // Performance Optimization Agent #9: Optimized subtask retrieval with O(1) lookup
  getSubtasksOptimized(parentTaskId) {
    const startTime = Date.now();
    const index = this._buildTaskIndex();
    const parentTask = index.byId.get(parentTaskId);
    const result = parentTask?.subtasks || [];

    // Record performance metrics
    if (this._performanceMonitor) {
      const duration = Date.now() - startTime;
      this._performanceMonitor.recordQueryTime('getSubtasksOptimized', duration);
      this._performanceMonitor.recordCacheHit(index.byId.has(parentTaskId));
    }

    return result;
  }

  // Performance Optimization Agent #9: Fast subtask lookup by ID
  getSubtaskById(subtaskId) {
    const startTime = Date.now();
    const index = this._buildTaskIndex();
    const result = index.subtasks.get(subtaskId);

    // Record performance metrics
    if (this._performanceMonitor) {
      const duration = Date.now() - startTime;
      this._performanceMonitor.recordQueryTime('getSubtaskById', duration);
      this._performanceMonitor.recordCacheHit(!!result);
    }

    return result;
  }

  // Performance Optimization Agent #9: Fast research task lookup
  getResearchTasksOptimized(parentTaskId = null) {
    const startTime = Date.now();
    const index = this._buildTaskIndex();

    let result;
    if (parentTaskId) {
      // Get research tasks for specific parent
      const parentTask = index.byId.get(parentTaskId);
      result = parentTask?.subtasks?.filter(s => s.type === 'research') || [];
    } else {
      // Get all research tasks
      result = Array.from(index.researchTasks.values());
    }

    // Record performance metrics
    if (this._performanceMonitor) {
      const duration = Date.now() - startTime;
      this._performanceMonitor.recordQueryTime('getResearchTasksOptimized', duration);
    }

    return result;
  }

  // Performance Optimization Agent #9: Fast audit task lookup
  getAuditTasksOptimized(parentTaskId = null) {
    const startTime = Date.now();
    const index = this._buildTaskIndex();

    let result;
    if (parentTaskId) {
      // Get audit tasks for specific parent
      const parentTask = index.byId.get(parentTaskId);
      result = parentTask?.subtasks?.filter(s => s.type === 'audit') || [];
    } else {
      // Get all audit tasks
      result = Array.from(index.auditTasks.values());
    }

    // Record performance metrics
    if (this._performanceMonitor) {
      const duration = Date.now() - startTime;
      this._performanceMonitor.recordQueryTime('getAuditTasksOptimized', duration);
    }

    return result;
  }

  // Performance Optimization Agent #9: Get performance monitoring report
  getPerformanceReport() {
    return this._performanceMonitor?.getPerformanceReport() || {
      avgQueryTime: 'N/A',
      cacheHitRate: 'N/A',
      totalQueries: 0,
      recentQueries: [],
    };
  }

  // Fast read without validation (for performance-critical operations)
  readTodoSync() {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.todoPath is from constructor, validated file path
    if (!fs.existsSync(this.todoPath)) {
      throw new Error(`TODO.json not found at ${this.todoPath}`);
    }

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.todoPath is from constructor, validated file path
      const content = fs.readFileSync(this.todoPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read TODO.json: ${error.message}`);
    }
  }

  // Ultra-fast read for performance-critical operations (no validation, no auto-fix)
  readTodoFast() {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.todoPath is from constructor, validated file path
    if (!fs.existsSync(this.todoPath)) {
      throw new Error(`TODO.json not found at ${this.todoPath}`);
    }

    // Performance optimization: Use file modification time for caching
    if (this._cache.enabled) {
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.todoPath is from constructor, validated file path
        const stats = fs.statSync(this.todoPath);
        const currentModified = stats.mtime.getTime();

        // Return cached data if file hasn't changed
        if (this._cache.data && this._cache.lastModified === currentModified) {
          return this._cache.data;
        }

        // File changed or no cache, read and cache
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.todoPath is from constructor, validated file path
        const content = fs.readFileSync(this.todoPath, 'utf8');
        const data = JSON.parse(content);

        this._cache.data = data;
        this._cache.lastModified = currentModified;

        return data;
      } catch {
        // Fallback to non-cached read if caching fails
        this._cache.enabled = false;
      }
    }

    // Fallback: Direct read without caching
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.todoPath is from constructor, validated file path
      const content = fs.readFileSync(this.todoPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read TODO.json: ${error.message}`);
    }
  }

  async readTodo(skipValidation = false) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.todoPath is from constructor, validated file path
    if (!fs.existsSync(this.todoPath)) {
      throw new Error(`TODO.json not found at ${this.todoPath}`);
    }

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.todoPath is from constructor, validated file path
      const content = fs.readFileSync(this.todoPath, 'utf8');
      const data = JSON.parse(content);

      // Skip expensive validation for simple read operations
      if (skipValidation || !this.options.validateOnRead) {
        return data;
      }

      // Only validate and auto-fix if explicitly enabled (expensive operations)
      if (this.options.validateOnRead && this.options.enableAutoFix) {
        const status = await this.autoFixer.getFileStatus(this.todoPath);

        if (!status.valid && status.canAutoFix) {
          const fixResult = await this.autoFixer.autoFix(this.todoPath, {
            autoFixLevel: this.options.autoFixLevel,
          });

          if (fixResult.success && fixResult.hasChanges) {
            // Re-read the fixed file
            // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.todoPath is from constructor, validated file path
            return JSON.parse(fs.readFileSync(this.todoPath, 'utf8'));
          }
        }
      }

      return data;
    } catch (error) {
      if (this.options.enableAutoFix) {
        // Attempt recovery for corrupted files
        const recoveryResult = await this.autoFixer.recoverCorruptedFile(
          this.todoPath,
        );

        if (recoveryResult.success) {
          return recoveryResult.finalData;
        }
      }

      throw new Error(`Failed to read TODO.json: ${error.message}`);
    }
  }

  async writeTodo(data) {
    try {
      // CRITICAL CORRUPTION PREVENTION: Pre-validation before any processing
      if (!data || typeof data !== 'object') {
        throw new Error(
          `Invalid data type for TODO.json write: ${typeof data}`,
        );
      }

      // CRITICAL: Prevent double-encoding by ensuring data is a plain object
      if (typeof data === 'string') {
        logger.error(
          '🚨 CRITICAL: Attempted to write string data to TODO.json - this causes corruption!',
        );
        throw new Error(
          'String data passed to writeTodo - this would cause JSON corruption',
        );
      }

      // Validate data before writing if enabled
      if (this.options.validateOnRead) {
        const validationResult = this.autoFixer.validator.validateAndSanitize(
          data,
          this.todoPath,
        );

        if (!validationResult.isValid && this.options.enableAutoFix) {
          data = validationResult.data; // Use the sanitized data
        }
      }

      // Initialize settings if needed and apply auto-sorting
      data = this._initializeSettings(data);
      data = this._applyAutoSort(data);

      // CRITICAL CORRUPTION PREVENTION: Additional validation before write
      this._validateTodoDataStructure(data);

      // Create a backup before writing (corruption recovery)
      const backupPath = this.todoPath + '.pre-write-backup';
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.todoPath is from constructor, validated file path
      if (fs.existsSync(this.todoPath)) {
        try {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.todoPath is from constructor, validated file path
          const currentContent = fs.readFileSync(this.todoPath, 'utf8');
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- backupPath is derived from validated todoPath
          fs.writeFileSync(backupPath, currentContent);
        } catch (backupError) {
          logger.warn(`Failed to create backup: ${backupError.message}`);
        }
      }

      // Use atomic write operation from ErrorRecovery - pass data object not string
      const writeResult = await this.autoFixer.recovery.atomicWrite(
        this.todoPath,
        data, // Pass the data object, not the JSON string
      );

      if (!writeResult.success) {
        // Attempt to restore from backup if write failed
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- backupPath is derived from validated todoPath
        if (fs.existsSync(backupPath)) {
          try {
            fs.copyFileSync(backupPath, this.todoPath);
            logger.info(
              '🔄 Restored TODO.json from backup after write failure',
            );
          } catch (restoreError) {
            logger.error(`Failed to restore backup: ${restoreError.message}`);
          }
        }
        throw new Error(`Failed to write TODO.json: ${writeResult.error}`);
      }

      // Verify the write was successful and not corrupted
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.todoPath is from constructor, validated file path
        const writtenContent = fs.readFileSync(this.todoPath, 'utf8');
        JSON.parse(writtenContent); // This will throw if corrupted

        // Additional check: ensure it doesn't start with quotes (double-encoded)
        if (
          writtenContent.trim().startsWith('"') &&
          writtenContent.trim().endsWith('"')
        ) {
          logger.error(
            '🚨 CRITICAL: TODO.json was corrupted with double-encoding after write!',
          );

          // Attempt to fix immediately
          const fixResult = await this.autoFixer.fixJsonFile(this.todoPath);
          if (fixResult.fixed) {
            logger.info(
              '✅ Successfully fixed TODO.json corruption immediately after detection',
            );
          } else {
            throw new Error('TODO.json corrupted and automatic fix failed');
          }
        }

        // Clean up backup after successful write
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- backupPath is derived from validated todoPath
        if (fs.existsSync(backupPath)) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- backupPath is derived from validated todoPath
          fs.unlinkSync(backupPath);
        }
      } catch (verificationError) {
        logger.error(
          '🚨 CRITICAL: TODO.json verification failed after write!',
          verificationError.message,
        );

        // Attempt to restore from backup
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- backupPath is derived from validated todoPath
        if (fs.existsSync(backupPath)) {
          try {
            fs.copyFileSync(backupPath, this.todoPath);
            logger.info(
              '🔄 Restored TODO.json from backup after verification failure',
            );
          } catch (restoreError) {
            logger.error(`Failed to restore backup: ${restoreError.message}`);
          }
        }
        throw new Error(
          `TODO.json verification failed: ${verificationError.message}`,
        );
      }

      // Performance optimization: Invalidate cache after write
      if (this._cache.enabled) {
        this._cache.data = null;
        this._cache.lastModified = 0;
      }

      return writeResult;
    } catch (error) {
      throw new Error(`Failed to write TODO.json: ${error.message}`);
    }
  }

  // Removed slow auto-setup methods for performance

  async getCurrentTask(agentId = null) {
    const todoData = await this.readTodoFast(); // Use fast read for performance
    if (!todoData.tasks || !Array.isArray(todoData.tasks)) {
      return undefined;
    }

    if (agentId) {
      // Agent-specific task retrieval
      // First look for tasks assigned to this agent that are in_progress
      let currentTask = todoData.tasks.find(
        (task) =>
          task &&
          task.status === 'in_progress' &&
          (task.assigned_agent === agentId ||
            (task.assigned_agents && task.assigned_agents.includes(agentId))),
      );

      // If no in_progress task, get next assigned pending task with no unmet dependencies
      if (!currentTask) {
        const executableTasks = await this.getExecutableTasks();
        currentTask = executableTasks.find(
          (task) =>
            task &&
            task.status === 'pending' &&
            (task.assigned_agent === agentId ||
              (task.assigned_agents && task.assigned_agents.includes(agentId))),
        );
      }

      return currentTask || undefined;
    } else {
      // Multi-agent concurrent task retrieval
      // Support multiple in_progress tasks for different agents
      let currentTask = null;

      // First, look for any in_progress tasks (for backwards compatibility)
      const inProgressTasks = todoData.tasks.filter(
        (t) => t && t.status === 'in_progress',
      );

      if (inProgressTasks.length > 0) {
        // Return first available in_progress task
        currentTask = inProgressTasks[0];
      } else {
        // If no in_progress tasks, get first pending task for concurrent claiming
        currentTask = todoData.tasks.find((t) => t && t.status === 'pending');
      }

      return currentTask || undefined;
    }
  }

  /**
   * Get next available task for an agent when current task is completed
   * @param {string} agentId - Agent ID
   * @param {string} completedTaskId - ID of just completed task (optional)
   * @returns {Object|null} Next task or null if none available
   */
  async getNextTask(agentId, completedTaskId = null) {
    // Check for and revert stale in_progress tasks (30+ minutes)
    await this.revertStaleInProgressTasks();

    const todoData = await this.readTodoFast();

    // Fast path: Look for simple pending tasks first (most common case)
    const pendingTasks = todoData.tasks.filter((t) => t.status === 'pending');

    // First check if there are other agents working on the same task that was just completed
    if (completedTaskId) {
      const completedTask = todoData.tasks.find(
        (t) => t.id === completedTaskId,
      );
      if (
        completedTask &&
        completedTask.assigned_agents &&
        completedTask.assigned_agents.length > 1
      ) {
        // Multiple agents on same task - see if task still needs work
        if (completedTask.status !== 'completed') {
          return completedTask; // Continue working on same task
        }
      }
    }

    // Look for assigned tasks first (fast filter on pending tasks)
    let nextTask = pendingTasks.find(
      (task) =>
        task.assigned_agent === agentId ||
        (task.assigned_agents && task.assigned_agents.includes(agentId)),
    );

    if (nextTask) {
      // Quick dependency check for assigned task
      if (!nextTask.dependencies || nextTask.dependencies.length === 0) {
        return nextTask;
      }
      // Check dependencies
      const completed = todoData.tasks
        .filter((t) => t.status === 'completed')
        .map((t) => t.id);
      if (nextTask.dependencies.every((depId) => completed.includes(depId))) {
        return nextTask;
      }
    }

    // If no quick wins, fall back to full executable tasks analysis
    const executableTasks = await this.getExecutableTasks();
    nextTask = executableTasks.find(
      (task) =>
        task.status === 'pending' &&
        (task.assigned_agent === agentId ||
          (task.assigned_agents && task.assigned_agents.includes(agentId))),
    );

    // If no assigned tasks, look for unassigned tasks that can be auto-assigned
    if (!nextTask) {
      nextTask = executableTasks.find(
        (task) =>
          task.status === 'pending' &&
          !task.assigned_agent &&
          (!task.assigned_agents || task.assigned_agents.length === 0),
      );

      // Auto-assign the task to this agent
      if (nextTask) {
        await this.assignTaskToAgent(nextTask.id, agentId, 'primary');
      }
    }

    // If still no task, check if agent can join collaborative tasks
    if (!nextTask) {
      nextTask = executableTasks.find(
        (task) =>
          task.status === 'pending' &&
          task.allows_collaboration !== false && // Allow by default unless explicitly disabled
          (!task.assigned_agents ||
            task.assigned_agents.length < (task.max_agents || 3)),
      );

      // Add agent to collaborative task
      if (nextTask) {
        await this.assignTaskToAgent(nextTask.id, agentId, 'collaborative');
      }
    }

    return nextTask || null;
  }

  /**
   * Get task continuation guidance for the stop hook
   * @param {string} agentId - Current agent ID
   * @returns {Object} Task guidance object
   */
  async getTaskContinuationGuidance(agentId) {
    // Clean up stale agents and recover their tasks first
    await this.cleanupStaleAgents();

    // Check for and revert stale in_progress tasks (30+ minutes)
    const revertedTasks = await this.revertStaleInProgressTasks();
    if (revertedTasks.length > 0) {
      logger.info(
        `Auto-reverted ${revertedTasks.length} stale tasks to pending:`,
        revertedTasks,
      );
    }

    // Get current task for this agent
    const currentTask = await this.getCurrentTask(agentId);

    if (currentTask) {
      // Check for task repetition/stuck behavior
      const repetitionCheck = await this.checkTaskRepetition(
        currentTask.id,
        agentId,
      );

      if (repetitionCheck.isStuck) {
        // Return special guidance for stuck tasks
        const guidance = {
          action: 'stuck_task_intervention',
          task: currentTask,
          repetitionCount: repetitionCheck.count,
          instructions: this.generateStuckTaskInstructions(
            currentTask,
            repetitionCheck,
          ),
          completionCommand: `node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.updateTaskStatus('${currentTask.id}', 'completed').then(() => console.log('Task marked as completed'));"`,
        };

        // Record this intervention
        await this.recordTaskIntervention(
          currentTask.id,
          agentId,
          'stuck_task_detected',
        );

        return guidance;
      }

      // Normal task continuation
      const guidance = {
        action: 'continue_task',
        task: currentTask,
        instructions: this.generateTaskInstructions(currentTask),
        completionCommand: `node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.updateTaskStatus('${currentTask.id}', 'completed').then(() => console.log('Task marked as completed'));"`,
      };

      // Track task continuation for repetition detection
      await this.trackTaskAccess(currentTask.id, agentId);

      return guidance;
    } else {
      // No current task - try to get next available task
      const nextTask = await this.getNextTask(agentId);

      if (nextTask) {
        const guidance = {
          action: 'start_new_task',
          task: nextTask,
          instructions: this.generateTaskInstructions(nextTask),
          startCommand: `node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.updateTaskStatus('${nextTask.id}', 'in_progress').then(() => console.log('Task started'));"`,
          completionCommand: `node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.updateTaskStatus('${nextTask.id}', 'completed').then(() => console.log('Task completed'));"`,
        };

        return guidance;
      } else {
        // Check if TODO.json is empty and handle task creation attempts
        const todoData = await this.readTodo();
        const activeTasks = todoData.tasks.filter(
          (t) => t.status === 'pending' || t.status === 'in_progress',
        );

        if (activeTasks.length === 0) {
          // Initialize task creation attempts tracking if not present
          if (!todoData.task_creation_attempts) {
            todoData.task_creation_attempts = {
              count: 0,
              last_attempt: null,
              max_attempts: 3,
            };
          }

          // Check if we should enter task creation mode
          if (
            todoData.task_creation_attempts.count <
            todoData.task_creation_attempts.max_attempts
          ) {
            // Increment attempt count and update timestamp
            todoData.task_creation_attempts.count++;
            todoData.task_creation_attempts.last_attempt =
              new Date().toISOString();

            // Save the updated data
            await this.writeTodo(todoData);

            return {
              action: 'enter_task_creation_mode',
              attempt: todoData.task_creation_attempts.count,
              max_attempts: todoData.task_creation_attempts.max_attempts,
              message: `No tasks available. Entering task creation mode (attempt ${todoData.task_creation_attempts.count} of ${todoData.task_creation_attempts.max_attempts})`,
              instructions: this.generateTaskCreationInstructions(),
              mode: 'TASK_CREATION',
            };
          } else {
            // All 3 attempts exhausted, allow stopping
            return {
              action: 'no_tasks_available',
              message:
                'All tasks completed or no tasks available for this agent. Task creation attempts exhausted.',
              attempts_made: todoData.task_creation_attempts.count,
              checkCommand: `node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.readTodo().then(data => console.log('Total tasks:', data.tasks.length, 'Pending:', data.tasks.filter(t => t.status === 'pending').length));"`,
            };
          }
        } else {
          // There are tasks available, but none for this agent
          return {
            action: 'no_tasks_available',
            message: 'All tasks completed or no tasks available for this agent',
            checkCommand: `node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.readTodo().then(data => console.log('Total tasks:', data.tasks.length, 'Pending:', data.tasks.filter(t => t.status === 'pending').length));"`,
          };
        }
      }
    }
  }

  /**
   * Generate detailed instructions for a task
   * @param {Object} task - Task object
   * @returns {string} Formatted instructions
   */
  generateTaskInstructions(task) {
    let instructions = `**Continue what you are doing** - Stay focused on your current task until completion.\n\n`;
    instructions += `**Current Task: ${task.title}**\n\n`;
    instructions += `**Description:** ${task.description}\n\n`;
    instructions += `**Mode:** ${task.mode}\n`;
    instructions += `**Priority:** ${task.priority || 'medium'}\n`;
    instructions += `**Status:** ${task.status}\n\n`;

    if (task.success_criteria && task.success_criteria.length > 0) {
      instructions += `**Success Criteria (required for task completion):**\n`;
      task.success_criteria.forEach((criteria, index) => {
        instructions += `${index + 1}. ${criteria}\n`;
      });
      instructions += '\n';
    }

    if (task.important_files && task.important_files.length > 0) {
      instructions += `**Important Files:**\n`;
      task.important_files.forEach((file) => {
        instructions += `- ${file}\n`;
      });
      instructions += '\n';
    }

    if (task.dependencies && task.dependencies.length > 0) {
      instructions += `**Dependencies:** ${task.dependencies.length} task(s)\n\n`;
    }

    if (task.assigned_agents && task.assigned_agents.length > 1) {
      instructions += `**Collaborative Task:** ${task.assigned_agents.length} agents assigned\n\n`;
    }

    instructions += `**KEEP WORKING** - Continue with this task until all success criteria are met and you mark it as completed using:\n`;
    instructions += `\`\`\`bash\nnode -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.updateTaskStatus('${task.id}', 'completed').then(() => console.log('Task completed'));"\n\`\`\`\n\n`;

    return instructions;
  }

  /**
   * Generate instructions for task creation mode
   * @returns {string} Formatted task creation instructions
   */
  generateTaskCreationInstructions() {
    let instructions = `**🚨 TASK CREATION MODE ACTIVATED** - You are now in task creation mode because no tasks are available.\n\n`;
    instructions += `**Your Mission:** Analyze the current project state and create actionable tasks if any opportunities exist.\n\n`;
    instructions += `**IMPORTANT GUIDELINES:**\n`;
    instructions += `- Only create tasks if there are genuine opportunities for improvement or work to be done\n`;
    instructions += `- Follow the task creation guidelines in the TASK_CREATION mode documentation\n`;
    instructions += `- Be specific and actionable - avoid vague tasks like "improve code quality"\n`;
    instructions += `- If no meaningful tasks can be created, that's perfectly acceptable\n`;
    instructions += `- Focus on value-driven task creation with clear deliverables\n\n`;
    instructions += `**EVALUATION AREAS:**\n`;
    instructions += `1. Code quality issues or technical debt\n`;
    instructions += `2. Missing documentation for user-facing features\n`;
    instructions += `3. Performance optimization opportunities\n`;
    instructions += `4. Security vulnerabilities or improvements\n`;
    instructions += `5. Missing tests or test coverage gaps\n`;
    instructions += `6. Bug fixes or error handling improvements\n`;
    instructions += `7. Feature enhancements with clear user value\n\n`;
    instructions += `**IF YOU CREATE TASKS:** Use the TaskManager API to create them with proper structure, priorities, and success criteria.\n\n`;
    instructions += `**IF NO TASKS ARE NEEDED:** Simply continue without creating any tasks. This indicates the project is in a good state.\n\n`;
    instructions += `**Remember:** Task creation should be purposeful, not just to create work. Quality over quantity always.\n`;

    return instructions;
  }

  async updateTaskStatus(taskId, status, _options = {}) {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);
    if (task) {
      const oldStatus = task.status;
      task.status = status;

      // Track status change for repetition detection
      if (!task.access_history) {
        task.access_history = [];
      }

      task.access_history.push({
        agentId: _options.agentId || 'system',
        timestamp: new Date().toISOString(),
        action: 'status_change',
        details: {
          oldStatus: oldStatus,
          newStatus: status,
        },
      });

      // Keep access history manageable
      if (task.access_history.length > 20) {
        task.access_history = task.access_history.slice(-20);
      }

      // If task is now completed, handle completion actions
      if (status === 'completed' && oldStatus !== 'completed') {
        // Complete the task
        task.completed_at = new Date().toISOString();

        // Mark for linter feedback on next hook call
        task.needs_linter_feedback = true;
        task.linter_feedback_generated = false;

        // Create automatic audit task for completed feature tasks
        if (task.category === 'feature' && !task.skip_audit_creation) {
          await this._createPostCompletionAuditTask(task, todoData);
        }

        // Archive completed task if archiving is enabled
        if (this.options.enableArchiving) {
          await this.archiveCompletedTask(task);
          todoData.tasks = todoData.tasks.filter((t) => t.id !== taskId);
        }
      }

      await this.writeTodo(todoData);
      return true;
    }
    return false;
  }

  async updateTask(taskId, updates, _options = {}) {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);
    if (task) {
      // Update allowed fields
      const allowedFields = [
        'title',
        'description',
        'priority',
        'mode',
        'important_files',
        'dependencies',
        'success_criteria',
        'estimate',
        'requires_research',
      ];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          // eslint-disable-next-line security/detect-object-injection -- key is validated against allowedFields whitelist
          task[key] = value;
        }
      }

      // Update last modified timestamp
      task.last_modified = new Date().toISOString();

      await this.writeTodo(todoData);
      return task;
    }
    return null;
  }

  async modifyTask(taskId, modifications, _options = {}) {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);
    if (task) {
      // Apply modifications based on operation type
      if (modifications.appendDescription) {
        task.description =
          (task.description || '') + '\n\n' + modifications.appendDescription;
      }

      if (modifications.prependDescription) {
        task.description =
          modifications.prependDescription + '\n\n' + (task.description || '');
      }

      if (modifications.addImportantFiles) {
        task.important_files = task.important_files || [];
        const newFiles = Array.isArray(modifications.addImportantFiles)
          ? modifications.addImportantFiles
          : [modifications.addImportantFiles];
        newFiles.forEach((file) => {
          if (!task.important_files.includes(file)) {
            task.important_files.push(file);
          }
        });
      }

      if (modifications.addDependencies) {
        task.dependencies = task.dependencies || [];
        const newDeps = Array.isArray(modifications.addDependencies)
          ? modifications.addDependencies
          : [modifications.addDependencies];
        newDeps.forEach((dep) => {
          if (!task.dependencies.includes(dep)) {
            task.dependencies.push(dep);
          }
        });
      }

      if (modifications.addSuccessCriteria) {
        task.success_criteria = task.success_criteria || [];
        const newCriteria = Array.isArray(modifications.addSuccessCriteria)
          ? modifications.addSuccessCriteria
          : [modifications.addSuccessCriteria];
        task.success_criteria.push(...newCriteria);
      }

      // Direct field updates
      const directFields = [
        'title',
        'priority',
        'mode',
        'estimate',
        'requires_research',
      ];
      for (const field of directFields) {
        // eslint-disable-next-line security/detect-object-injection -- field is validated against directFields whitelist
        if (modifications[field] !== undefined) {
          // eslint-disable-next-line security/detect-object-injection -- field is validated against directFields whitelist
          task[field] = modifications[field];
        }
      }

      // Update last modified timestamp
      task.last_modified = new Date().toISOString();

      await this.writeTodo(todoData);
      return task;
    }
    return null;
  }

  async addSubtask(parentTaskId, subtask) {
    const todoData = await this.readTodoFast();
    const parentTask = todoData.tasks.find((t) => t.id === parentTaskId);
    if (parentTask) {
      if (!parentTask.subtasks) {
        parentTask.subtasks = [];
      }
      parentTask.subtasks.push(subtask);
      await this.writeTodo(todoData);
    }
  }

  async addImportantFile(taskId, filePath) {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);
    if (task) {
      if (!task.important_files) {
        task.important_files = [];
      }
      // Avoid duplicates
      if (!task.important_files.includes(filePath)) {
        task.important_files.push(filePath);
        await this.writeTodo(todoData);
        return true;
      }
    }
    return false;
  }

  async removeImportantFile(taskId, filePath) {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);
    if (task && task.important_files) {
      const index = task.important_files.indexOf(filePath);
      if (index !== -1) {
        task.important_files.splice(index, 1);
        await this.writeTodo(todoData);
        return true;
      }
    }
    return false;
  }

  /**
   * Generates the standardized research report file path for a task
   * @param {string} taskId - The task ID
   * @returns {string} The research report file path
   */
  getResearchReportPath(taskId) {
    return `./development/research-reports/research-report-${taskId}.md`;
  }

  /**
   * Checks if a research report file exists for the given task ID
   * @param {string} taskId - The task ID
   * @returns {boolean} True if the research report file exists
   */
  researchReportExists(taskId) {
    const reportPath = this.getResearchReportPath(taskId);
    const path = require('path');

    // Convert relative path to absolute path
    const workingDir = process.cwd();
    const absolutePath = path.resolve(workingDir, reportPath);

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- absolutePath is resolved from process.cwd() and task ID
    return fs.existsSync(absolutePath);
  }

  /**
   * Create a new feature with optional subtasks
   * IMPORTANT: Features can only be added with explicit user authorization
   * @param {Object} featureData - Feature data
   * @param {boolean} userAuthorized - Must be true for feature creation
   * @returns {string} Created feature ID
   */
  async createFeature(featureData, userAuthorized = false) {
    // CRITICAL: Enforce user authorization requirement
    if (!userAuthorized) {
      throw new Error(
        'Feature creation requires explicit user authorization. Features cannot be added without user approval.',
      );
    }

    const todoData = await this.readTodoFast();

    // Ensure features array exists
    if (!todoData.features) {
      todoData.features = [];
    }

    // Generate unique feature ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const featureId = `feature_${timestamp}_${randomSuffix}`;

    const feature = {
      id: featureId,
      title: featureData.title,
      description: featureData.description || '',
      status: featureData.status || 'planned',
      category: featureData.category || 'uncategorized',
      priority: featureData.priority || 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subtasks: featureData.subtasks || [],
      dependencies: featureData.dependencies || [],
      success_criteria: featureData.success_criteria || [],
      metadata: {
        estimated_effort: featureData.estimated_effort || 'medium',
        completion_percentage: 0,
        ...featureData.metadata,
      },
    };

    todoData.features.push(feature);
    await this.writeTodo(todoData);

    return featureId;
  }

  /**
   * Suggest a new feature for user consideration (no authorization required)
   *
   * This method allows agents to suggest features without requiring explicit user authorization.
   * Suggested features have "suggested" status and are not implemented until user approval.
   *
   * @param {Object} featureData - Feature suggestion data
   * @param {string} featureData.title - Feature title
   * @param {string} featureData.description - Feature description
   * @param {string} featureData.rationale - Why this feature would be beneficial
   * @param {string} [featureData.category] - Feature category
   * @param {string} [featureData.priority] - Suggested priority level
   * @param {string} [featureData.estimated_effort] - Implementation effort estimate
   * @param {string} agentId - ID of agent suggesting the feature
   * @returns {string} Created feature ID
   */
  async suggestFeature(featureData, agentId) {
    // No user authorization required for suggestions
    const todoData = await this.readTodoFast();

    // Ensure features array exists
    if (!todoData.features) {
      todoData.features = [];
    }

    // Generate unique feature ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const featureId = `feature_suggested_${timestamp}_${randomSuffix}`;

    const feature = {
      id: featureId,
      title: featureData.title,
      description: featureData.description || '',
      rationale: featureData.rationale || '',
      status: 'suggested', // Always "suggested" for agent proposals
      category: featureData.category || 'uncategorized',
      priority: featureData.priority || 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      suggested_by: agentId,
      subtasks: [], // No subtasks until approved
      dependencies: [],
      success_criteria: [],
      metadata: {
        estimated_effort: featureData.estimated_effort || 'medium',
        completion_percentage: 0,
        requires_user_approval: true,
        ...featureData.metadata,
      },
    };

    todoData.features.push(feature);
    await this.writeTodo(todoData);

    return featureId;
  }

  /**
   * Approve a suggested feature and change status to "approved"
   *
   * This method allows users to approve suggested features for implementation.
   * Only features with "suggested" status can be approved.
   *
   * @param {string} featureId - Feature ID to approve
   * @param {string} userId - ID of user approving the feature
   * @returns {boolean} Success status
   */
  async approveFeature(featureId, userId = 'user') {
    const todoData = await this.readTodoFast();
    if (!todoData.features) {
      return false;
    }

    const feature = todoData.features.find((f) => f.id === featureId);
    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }

    if (feature.status !== 'suggested') {
      throw new Error(
        `Feature ${featureId} is not in suggested status (current: ${feature.status})`,
      );
    }

    // Update feature to approved status
    feature.status = 'approved';
    feature.approved_by = userId;
    feature.approved_at = new Date().toISOString();
    feature.updated_at = new Date().toISOString();

    // Remove the requires_user_approval flag
    if (feature.metadata && feature.metadata.requires_user_approval) {
      delete feature.metadata.requires_user_approval;
    }

    await this.writeTodo(todoData);
    return true;
  }

  /**
   * Reject a suggested feature and remove it from the system
   *
   * This method allows users to reject suggested features.
   * Rejected features are completely removed from the features array.
   *
   * @param {string} featureId - Feature ID to reject
   * @param {string} userId - ID of user rejecting the feature
   * @param {string} [reason] - Optional reason for rejection
   * @returns {boolean} Success status
   */
  async rejectFeature(featureId, userId = 'user', reason = '') {
    const todoData = await this.readTodoFast();
    if (!todoData.features) {
      return false;
    }

    const featureIndex = todoData.features.findIndex((f) => f.id === featureId);
    if (featureIndex === -1) {
      throw new Error(`Feature ${featureId} not found`);
    }

    // eslint-disable-next-line security/detect-object-injection -- featureIndex validated through findIndex, safe array access
    const feature = todoData.features[featureIndex];
    if (feature.status !== 'suggested') {
      throw new Error(
        `Feature ${featureId} is not in suggested status (current: ${feature.status})`,
      );
    }

    // Log the rejection for audit trail
    logger.info(
      `Feature rejected: ${feature.title} by ${userId}${reason ? ` - Reason: ${reason}` : ''}`,
    );

    // Remove the feature from the array
    todoData.features.splice(featureIndex, 1);

    await this.writeTodo(todoData);
    return true;
  }

  /**
   * Get feature by ID
   * @param {string} featureId - Feature ID
   * @returns {Object|null} Feature object or null if not found
   */
  async getFeature(featureId) {
    const todoData = await this.readTodoFast();
    if (!todoData.features) {
      return null;
    }

    return todoData.features.find((f) => f.id === featureId) || null;
  }

  /**
   * Update feature status and metadata
   * @param {string} featureId - Feature ID
   * @param {Object} updates - Updates to apply
   * @returns {boolean} Success status
   */
  async updateFeature(featureId, updates) {
    const todoData = await this.readTodoFast();
    if (!todoData.features) {
      return false;
    }

    const feature = todoData.features.find((f) => f.id === featureId);
    if (!feature) {
      return false;
    }

    // Apply updates
    Object.assign(feature, updates);
    feature.updated_at = new Date().toISOString();

    // Recalculate completion percentage if subtasks changed
    if (updates.subtasks || todoData.tasks) {
      feature.metadata.completion_percentage = this._calculateFeatureCompletion(
        feature,
        todoData.tasks,
      );
    }

    await this.writeTodo(todoData);
    return true;
  }

  /**
   * Calculate feature completion percentage based on subtask status
   * @param {Object} feature - Feature object
   * @param {Array} tasks - All tasks array
   * @returns {number} Completion percentage (0-100)
   */
  _calculateFeatureCompletion(feature, tasks) {
    if (!feature.subtasks || feature.subtasks.length === 0) {
      return 0;
    }

    const subtaskStatuses = feature.subtasks.map((taskId) => {
      const task = tasks.find((t) => t.id === taskId);
      return task ? task.status : 'pending';
    });

    const completedCount = subtaskStatuses.filter(
      (status) => status === 'completed',
    ).length;
    return Math.round((completedCount / subtaskStatuses.length) * 100);
  }

  /**
   * Get all features with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered features
   */
  async getFeatures(filters = {}) {
    const todoData = await this.readTodoFast();
    if (!todoData.features) {
      return [];
    }

    let features = todoData.features;

    if (filters.status) {
      features = features.filter((f) => f.status === filters.status);
    }
    if (filters.category) {
      features = features.filter((f) => f.category === filters.category);
    }
    if (filters.priority) {
      features = features.filter((f) => f.priority === filters.priority);
    }

    return features;
  }

  /**
   * PHASE SYSTEM METHODS - EXCLUSIVELY FOR FEATURE TASKS ONLY
   *
   * 🚨 CRITICAL: Phase system is ONLY for FEATURE tasks
   * Error tasks, subtask tasks, and test tasks should NEVER have phases
   */

  /**
   * Create a new phase for a specific feature
   * EXCLUSIVE to feature objects - phases NOT supported for error/subtask/test tasks
   * @param {string} featureId - Feature ID to add phase to
   * @param {Object} phaseData - Phase data
   * @param {string} phaseData.title - Phase title
   * @param {string} [phaseData.description] - Phase description
   * @param {number} [phaseData.number] - Phase number (auto-assigned if not provided)
   * @param {string} [phaseData.status] - Phase status (default: 'pending')
   * @returns {Object} Created phase object
   */
  async createPhase(featureId, phaseData) {
    if (!featureId || typeof featureId !== 'string') {
      throw new Error('Feature ID is required to create a phase');
    }

    if (!phaseData || !phaseData.title) {
      throw new Error('Phase title is required');
    }

    const todoData = await this.readTodoFast();

    // Ensure features array exists
    if (!todoData.features) {
      throw new Error('No features exist - phases can only be added to features');
    }

    // Find the feature
    const feature = todoData.features.find(f => f.id === featureId);
    if (!feature) {
      throw new Error(`Feature ${featureId} not found - phases can only be added to existing features`);
    }

    // Initialize phases array if not present
    if (!feature.phases) {
      feature.phases = [];
    }

    // Determine phase number (next sequential number)
    const nextPhaseNumber = phaseData.number || Math.max(0, ...feature.phases.map(p => p.number || 0)) + 1;

    // Create phase object
    const phase = {
      number: nextPhaseNumber,
      title: phaseData.title,
      description: phaseData.description || '',
      status: phaseData.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...phaseData,
    };

    // Add phase to feature
    feature.phases.push(phase);

    // Sort phases by number
    feature.phases.sort((a, b) => (a.number || 0) - (b.number || 0));

    // Update feature timestamp
    feature.updated_at = new Date().toISOString();

    // Save changes
    await this.writeTodo(todoData);

    return phase;
  }

  /**
   * Update phase status and progression for a specific feature
   * EXCLUSIVE to feature objects - phases NOT supported for error/subtask/test tasks
   * @param {string} featureId - Feature ID
   * @param {number} phaseNumber - Phase number to update
   * @param {Object} updates - Phase updates
   * @returns {Object} Updated phase object
   */
  async updatePhase(featureId, phaseNumber, updates) {
    if (!featureId || typeof featureId !== 'string') {
      throw new Error('Feature ID is required to update a phase');
    }

    if (!phaseNumber || typeof phaseNumber !== 'number') {
      throw new Error('Phase number is required');
    }

    const todoData = await this.readTodoFast();

    if (!todoData.features) {
      throw new Error('No features exist - phases can only exist within features');
    }

    const feature = todoData.features.find(f => f.id === featureId);
    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }

    if (!feature.phases || !Array.isArray(feature.phases)) {
      throw new Error(`Feature ${featureId} has no phases`);
    }

    const phase = feature.phases.find(p => p.number === phaseNumber);
    if (!phase) {
      throw new Error(`Phase ${phaseNumber} not found in feature ${featureId}`);
    }

    // Apply updates
    Object.assign(phase, updates);
    phase.updated_at = new Date().toISOString();

    // Update feature timestamp
    feature.updated_at = new Date().toISOString();

    // Save changes
    await this.writeTodo(todoData);

    return phase;
  }

  /**
   * Progress to next phase in a feature's development lifecycle
   * EXCLUSIVE to feature objects - phases NOT supported for error/subtask/test tasks
   * @param {string} featureId - Feature ID
   * @param {number} currentPhaseNumber - Current phase number to complete
   * @returns {Object} Next phase object or null if no next phase
   */
  async progressToNextPhase(featureId, currentPhaseNumber) {
    if (!featureId || typeof featureId !== 'string') {
      throw new Error('Feature ID is required for phase progression');
    }

    if (!currentPhaseNumber || typeof currentPhaseNumber !== 'number') {
      throw new Error('Current phase number is required');
    }

    const todoData = await this.readTodoFast();

    if (!todoData.features) {
      throw new Error('No features exist - phases can only exist within features');
    }

    const feature = todoData.features.find(f => f.id === featureId);
    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }

    if (!feature.phases || !Array.isArray(feature.phases)) {
      throw new Error(`Feature ${featureId} has no phases`);
    }

    // Mark current phase as completed
    const currentPhase = feature.phases.find(p => p.number === currentPhaseNumber);
    if (!currentPhase) {
      throw new Error(`Phase ${currentPhaseNumber} not found in feature ${featureId}`);
    }

    currentPhase.status = 'completed';
    currentPhase.completed_at = new Date().toISOString();
    currentPhase.updated_at = new Date().toISOString();

    // Find next phase
    const nextPhase = feature.phases.find(p => p.number === currentPhaseNumber + 1);
    if (nextPhase) {
      nextPhase.status = 'in_progress';
      nextPhase.started_at = new Date().toISOString();
      nextPhase.updated_at = new Date().toISOString();
    }

    // Update feature timestamp
    feature.updated_at = new Date().toISOString();

    // Save changes
    await this.writeTodo(todoData);

    return nextPhase || null;
  }

  /**
   * Get all phases for a specific feature
   * EXCLUSIVE to feature objects - phases NOT supported for error/subtask/test tasks
   * @param {string} featureId - Feature ID
   * @returns {Array} Array of phase objects
   */
  async getFeaturePhases(featureId) {
    if (!featureId || typeof featureId !== 'string') {
      throw new Error('Feature ID is required to get phases');
    }

    const todoData = await this.readTodoFast();

    if (!todoData.features) {
      return [];
    }

    const feature = todoData.features.find(f => f.id === featureId);
    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }

    return feature.phases || [];
  }

  /**
   * Get current active phase for a feature
   * EXCLUSIVE to feature objects - phases NOT supported for error/subtask/test tasks
   * @param {string} featureId - Feature ID
   * @returns {Object|null} Current active phase or null
   */
  async getCurrentPhase(featureId) {
    const phases = await this.getFeaturePhases(featureId);

    // Find in_progress phase first, then pending
    return phases.find(p => p.status === 'in_progress') ||
           phases.find(p => p.status === 'pending') ||
           null;
  }

  /**
   * Calculate feature phase completion percentage
   * EXCLUSIVE to feature objects - phases NOT supported for error/subtask/test tasks
   * @param {string} featureId - Feature ID
   * @returns {Object} Phase completion statistics
   */
  async getPhaseCompletionStats(featureId) {
    const phases = await this.getFeaturePhases(featureId);

    if (phases.length === 0) {
      return {
        total: 0,
        completed: 0,
        in_progress: 0,
        pending: 0,
        completion_percentage: 0,
      };
    }

    const completed = phases.filter(p => p.status === 'completed').length;
    const in_progress = phases.filter(p => p.status === 'in_progress').length;
    const pending = phases.filter(p => p.status === 'pending').length;

    return {
      total: phases.length,
      completed,
      in_progress,
      pending,
      completion_percentage: Math.round((completed / phases.length) * 100),
    };
  }

  async createTask(taskData) {
    // Support both category (preferred) and task_type (legacy) parameters
    const taskCategory = taskData.category || taskData.task_type;
    if (!taskCategory) {
      // Category is optional but helps with sorting. If not provided, will use default classification
      logger.warn('No category provided - task will use default priority classification');
    }

    const todoData = await this.readTodoFast();

    // Generate unique task ID with robust fallback mechanisms
    let randomSuffix;
    try {
      const randomValue = Math.random();
      if (randomValue && typeof randomValue.toString === 'function') {
        randomSuffix = randomValue.toString(36).substr(2, 9);
      } else {
        throw new Error('Math.random returned invalid value');
      }
    } catch {
      // Fallback to process.hrtime for high-resolution time-based uniqueness
      const hrtime = process.hrtime();
      randomSuffix = (hrtime[0] * 1000000 + hrtime[1]).toString(36).substr(-9);
    }

    // Determine task ID prefix based on exact category mapping
    let taskPrefix = 'feature'; // default
    if (taskCategory) {
      // Direct category to prefix mapping
      const categoryMap = {
        'error': 'error',
        'bug': 'error',
        'feature': 'feature',
        'subtask': 'subtask',
        'test': 'test',
        'audit': 'audit',
      };

      taskPrefix = categoryMap[taskCategory.toLowerCase()] || 'feature';
    }
    const taskId = `${taskPrefix}_${Date.now()}_${randomSuffix}`;

    // Start with provided important_files or empty array
    const importantFiles = [...(taskData.important_files || [])];
    const successCriteria = [...(taskData.success_criteria || [])];

    // For research tasks, automatically add research report path and success criteria
    if (taskData.mode === 'RESEARCH' || taskData.mode === 'research') {
      const researchReportPath = this.getResearchReportPath(taskId);

      // Add research report to important_files if not already present
      if (!importantFiles.includes(researchReportPath)) {
        importantFiles.push(researchReportPath);
      }

      // Add research report creation to success criteria if not already present
      const reportCriterion = `Research report created: ${researchReportPath}`;
      if (!successCriteria.some((criterion) => criterion === reportCriterion)) {
        successCriteria.push(reportCriterion);
      }
    }

    // ID-based priority system - no category validation needed
    let priority = taskData.priority;

    // Fallback to medium priority if nothing specified
    if (!priority) {
      priority = 'medium';
    }

    // Auto-create research dependencies for complex implementation tasks
    const researchDependencies = [...(taskData.dependencies || [])];
    const shouldAutoCreateResearch =
      this._shouldAutoCreateResearchTask(taskData);

    if (shouldAutoCreateResearch && !taskData.skip_auto_research) {
      const researchTaskId = await this._createResearchDependency(
        taskData,
        taskId,
      );
      if (researchTaskId) {
        researchDependencies.push(researchTaskId);
      }
    }

    // Extract phase information from title if present
    const phaseInfo = this._extractPhase(taskData.title);

    // Create complete task object with required fields
    const newTask = {
      id: taskId,
      title: taskData.title,
      description: taskData.description,
      mode: taskData.mode,
      priority: priority,
      category: taskCategory || this._inferCategoryFromTask(taskData) || 'enhancement',
      status: taskData.status || 'pending',
      dependencies: researchDependencies,
      important_files: importantFiles,
      success_criteria: successCriteria,
      estimate: taskData.estimate || '',
      requires_research: taskData.requires_research || shouldAutoCreateResearch,
      subtasks: await this._generateEmbeddedSubtasks(taskData, taskId, taskCategory),
      created_at: new Date().toISOString(),
      auto_research_created: shouldAutoCreateResearch || false,
    };

    // Add phase information if extracted from title
    if (phaseInfo) {
      newTask.phase = phaseInfo;
    }

    // Allow manual phase override
    if (taskData.phase) {
      newTask.phase = taskData.phase;
    }

    // Check for intelligent phase insertion needs
    if (phaseInfo && !taskData.skip_phase_insertion) {
      try {
        const phaseInsertionResult =
          await this.performIntelligentPhaseInsertion(newTask, true);
        if (
          phaseInsertionResult.success &&
          phaseInsertionResult.renumbering.length > 0
        ) {
          logger.info(
            `TaskManager: Intelligent phase insertion completed - renumbered ${phaseInsertionResult.renumbering.length} tasks`,
          );
        }
      } catch (error) {
        logger.warn(
          'TaskManager: Phase insertion failed, continuing with normal creation:',
          error.message,
        );
        // Continue with normal task creation if phase insertion fails
      }
    }

    // Add task to the tasks array using three-section structure: ERROR → FEATURE → REVIEW
    this._insertTaskInCorrectSection(todoData, newTask);

    // Reset task creation attempts when a new task is created
    if (todoData.task_creation_attempts) {
      todoData.task_creation_attempts = {
        count: 0,
        last_attempt: null,
        max_attempts: 3,
      };
    }

    // Write updated TODO.json
    await this.writeTodo(todoData);

    return taskId;
  }

  /**
   * Create an automatic audit task after a feature task is completed
   * @private
   * @param {Object} completedFeatureTask - The completed feature task
   * @param {Object} todoData - Current TODO data
   */
  _createPostCompletionAuditTask(completedFeatureTask, todoData) {
    try {
      // Generate unique audit task ID
      const auditTaskId = `audit_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

      // Standard success criteria for audit tasks
      const standardSuccessCriteria = [
        'Linter perfection achieved (zero warnings/errors)',
        'Build perfection achieved (clean build)',
        'All tests pass with full coverage',
        'Code quality standards met',
        'Implementation follows architectural patterns',
        'Security review passed',
        'Performance standards met',
        'Documentation is complete and accurate',
      ];

      // Merge with any custom success criteria from the original feature task
      const customCriteria = completedFeatureTask.success_criteria || [];
      const allSuccessCriteria = [
        ...standardSuccessCriteria,
        ...customCriteria.filter(criteria =>
          !standardSuccessCriteria.some(std =>
            std.toLowerCase().includes(criteria.toLowerCase().substring(0, 10)),
          ),
        ),
      ];

      // Create the audit task
      const auditTask = {
        id: auditTaskId,
        title: `Post-Completion Audit: ${completedFeatureTask.title}`,
        description: `Comprehensive quality audit and review of the completed feature: ${completedFeatureTask.title}\n\nOriginal Description: ${completedFeatureTask.description}`,
        category: 'audit',
        priority: 'high',
        status: 'pending',
        dependencies: [], // No dependencies - can start immediately after feature completion
        important_files: [...(completedFeatureTask.important_files || [])],
        success_criteria: allSuccessCriteria,
        estimate: '1-2 hours',
        requires_research: false,
        subtasks: [],
        created_at: new Date().toISOString(),
        created_from_completed_task: completedFeatureTask.id,
        original_implementer: completedFeatureTask.assigned_agent || completedFeatureTask.claimed_by,
        prevents_self_review: true,
        audit_type: 'post_completion',
      };

      // Add the audit task using the correct section insertion
      this._insertTaskInCorrectSection(todoData, auditTask);

      logger.info(`TaskManager: Created post-completion audit task ${auditTaskId} for completed feature ${completedFeatureTask.id}`);
    } catch (error) {
      logger.error(`TaskManager: Failed to create post-completion audit task: ${error.message}`);
      // Don't throw - let the feature completion continue even if audit creation fails
    }
  }

  /**
   * Inserts task into correct section based on four-section structure:
   * SECTION 1: ERROR TASKS (linter-error, build-error, start-error, test-error, test-linter-error)
   * SECTION 2: AUDIT TASKS (post-completion audits and quality reviews)
   * SECTION 3: FEATURE TASKS (all development features and subtasks)
   * SECTION 4: REVIEW TASKS (test, validation, review categories)
   * @private
   * @param {Object} todoData - TODO data object
   * @param {Object} task - Task to insert
   */
  _insertTaskInCorrectSection(todoData, task) {
    const errorCategories = [
      'linter-error',
      'build-error',
      'start-error',
      'error',
    ];
    const auditCategories = [
      'audit',
    ];
    const reviewCategories = [
      'missing-test',
      'test-setup',
      'test-refactor',
      'test-performance',
      'test-feature',
      'test-failure',
      'test-linter-failure',
      'test-coverage',
      'validation',
      'review',
      'testing',
    ];

    // SECTION 1: ERROR TASKS - Insert at beginning (highest priority)
    if (errorCategories.includes(task.category)) {
      // Find last error task position
      let insertIndex = 0;
      for (let i = 0; i < todoData.tasks.length; i++) {
        // eslint-disable-next-line security/detect-object-injection -- i is loop index within bounds check, safe array access
        if (errorCategories.includes(todoData.tasks[i].category)) {
          insertIndex = i + 1;
        } else {
          break; // Stop when we reach non-error tasks
        }
      }
      todoData.tasks.splice(insertIndex, 0, task);
      return;
    }

    // SECTION 2: AUDIT TASKS - Insert after errors, before features (high priority)
    if (auditCategories.includes(task.category)) {
      // Find insertion point after all error tasks and existing audit tasks
      let insertIndex = 0;
      for (let i = 0; i < todoData.tasks.length; i++) {
        // eslint-disable-next-line security/detect-object-injection -- i is loop index within bounds check, safe array access
        const currentTask = todoData.tasks[i];
        if (errorCategories.includes(currentTask.category) || auditCategories.includes(currentTask.category)) {
          insertIndex = i + 1;
        } else {
          break; // Stop when we reach feature/review tasks
        }
      }
      todoData.tasks.splice(insertIndex, 0, task);
      return;
    }

    // SECTION 4: REVIEW TASKS - Insert at end (lowest priority)
    if (
      reviewCategories.includes(task.category) ||
      (task.title || '').toLowerCase().includes('test') ||
      (task.description || '').toLowerCase().includes('test') ||
      (task.title || '').toLowerCase().includes('review') ||
      (task.description || '').toLowerCase().includes('review') ||
      (task.title || '').toLowerCase().includes('validation')
    ) {
      todoData.tasks.push(task);
      return;
    }

    // SECTION 3: FEATURE TASKS - Insert between audit and review sections
    // Find the insertion point (after all error/audit tasks, before review tasks)
    let insertIndex = todoData.tasks.length;

    // Find first review task to insert before it
    for (let i = 0; i < todoData.tasks.length; i++) {
      // eslint-disable-next-line security/detect-object-injection -- i is loop index within bounds check, safe array access
      const currentTask = todoData.tasks[i];
      if (
        reviewCategories.includes(currentTask.category) ||
        (currentTask.title || '').toLowerCase().includes('test') ||
        (currentTask.description || '').toLowerCase().includes('test') ||
        (currentTask.title || '').toLowerCase().includes('review') ||
        (currentTask.description || '').toLowerCase().includes('review') ||
        (currentTask.title || '').toLowerCase().includes('validation')
      ) {
        insertIndex = i;
        break;
      }
    }

    todoData.tasks.splice(insertIndex, 0, task);
  }

  async getNextMode(todoData) {
    // Alternate between TASK_CREATION and task execution
    if (todoData.last_mode === 'TASK_CREATION' || !todoData.last_mode) {
      const currentTask = await this.getCurrentTask();
      return currentTask ? currentTask.mode : 'DEVELOPMENT';
    }
    return 'TASK_CREATION';
  }

  shouldRunReviewer(todoData) {
    // Check if it's time for a review strike
    const completedTasks = todoData.tasks.filter(
      (t) => t.status === 'completed' && t.mode !== 'REVIEWER',
    ).length;

    // Run reviewer every 5 completed tasks
    return completedTasks > 0 && completedTasks % 5 === 0;
  }

  handleStrikeLogic(todoData) {
    // Reset strikes if all 3 were completed in previous run
    if (todoData.review_strikes === 3 && todoData.strikes_completed_last_run) {
      todoData.review_strikes = 0;
      todoData.strikes_completed_last_run = false;
      return {
        action: 'reset',
        message: 'Resetting review strikes to 0 for new cycle',
      };
    }

    // Mark as completed if just finished third strike
    if (todoData.review_strikes === 3 && !todoData.strikes_completed_last_run) {
      todoData.strikes_completed_last_run = true;
      return {
        action: 'complete',
        message: 'Third strike completed! Project approved.',
      };
    }

    return { action: 'continue', message: null };
  }

  /**
   * Gets detailed status of the TODO.json file
   * @returns {Object} File status including validation results
   */
  getFileStatus() {
    return this.autoFixer.getFileStatus(this.todoPath);
  }

  /**
   * Manually triggers auto-fix on the TODO.json file
   * @param {Object} options - Fix options
   * @returns {Object} Fix result
   */
  performAutoFix(options = {}) {
    return this.autoFixer.autoFix(this.todoPath, options);
  }

  /**
   * Performs a dry run to show what would be fixed
   * @returns {Object} Dry run result
   */
  dryRunAutoFix() {
    return this.autoFixer.dryRun(this.todoPath);
  }

  /**
   * Lists available backups for the TODO.json file
   * @returns {Array} List of backup files
   */
  listBackups() {
    return this.autoFixer.recovery.listAvailableBackups(this.todoPath);
  }

  /**
   * Restores TODO.json from a backup
   * @param {string} backupFile - Specific backup file to restore (optional)
   * @returns {Object} Restoration result
   */
  restoreFromBackup(backupFile = null) {
    return this.autoFixer.recovery.restoreFromBackup(
      this.todoPath,
      backupFile,
    );
  }

  /**
   * Creates a manual backup of the current TODO.json file
   * @returns {Object} Backup creation result
   */
  createBackup() {
    return this.autoFixer.recovery.createBackup(this.todoPath);
  }

  /**
   * Cleans up legacy backup files in the project root directory
   * @returns {Object} Cleanup result
   */
  cleanupLegacyBackups() {
    return this.autoFixer.recovery.cleanupLegacyBackups(this.todoPath);
  }

  /**
   * Validates the current TODO.json without making changes
   * @returns {Object} Validation result
   */
  validateTodoFile() {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.todoPath is from constructor, validated file path
      const content = fs.readFileSync(this.todoPath, 'utf8');
      const data = JSON.parse(content);
      return this.autoFixer.validator.validateAndSanitize(data, this.todoPath);
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            type: 'FILE_READ_ERROR',
            message: error.message,
            severity: 'critical',
          },
        ],
        fixes: [],
        summary: { totalErrors: 1, totalFixes: 0, criticalErrors: 1 },
      };
    }
  }

  /**
   * Build dependency graph from tasks and return text-based visualization
   * @param {Array} tasks - Array of task objects (optional, uses current tasks if not provided)
   * @returns {Object} Dependency analysis with text tree
   */
  async buildDependencyGraph(tasks = null) {
    const todoData = await this.readTodoFast();
    const allTasks = tasks || todoData.tasks || [];

    // Build dependency map
    const dependencyMap = new Map();
    const taskMap = new Map();

    // Index all tasks
    allTasks.forEach((task) => {
      taskMap.set(task.id, task);
      dependencyMap.set(task.id, task.dependencies || []);
    });

    // Detect circular dependencies
    const circularDeps = this._detectCircularDependencies(dependencyMap);

    // Generate text tree visualization
    const dependencyTree = this._generateDependencyTree(
      allTasks,
      dependencyMap,
      taskMap,
    );

    // Calculate execution order
    const executionOrder = this._calculateExecutionOrder(
      dependencyMap,
      circularDeps,
    );

    return {
      tree: dependencyTree,
      circularDependencies: circularDeps,
      executionOrder: executionOrder,
      stats: {
        totalTasks: allTasks.length,
        tasksWithDependencies: allTasks.filter(
          (t) => t.dependencies && t.dependencies.length > 0,
        ).length,
        circularIssues: circularDeps.length,
      },
    };
  }

  /**
   * Get tasks that can be executed (no unmet dependencies)
   * @returns {Array} Tasks ready for execution
   */
  async getExecutableTasks() {
    const todoData = await this.readTodoFast();
    const tasks = todoData.tasks || [];
    const completed = tasks
      .filter((t) => t.status === 'completed')
      .map((t) => t.id);

    const executable = tasks.filter((task) => {
      if (task.status === 'completed') {
        return false;
      }
      if (!task.dependencies || task.dependencies.length === 0) {
        return true;
      }
      return task.dependencies.every((depId) => completed.includes(depId));
    });

    // Sort tasks with ERROR → FEATURE → SUBTASK → TEST priority
    return executable.sort((a, b) => {
      // Use category ranks for priority ordering
      const categoryRanks = {
        error: 1,
        feature: 2,
        subtask: 3,
        test: 4,
        quality: 5,
      };

      const aRank = categoryRanks[a.category] || 5;
      const bRank = categoryRanks[b.category] || 5;

      // Primary sort by category rank
      if (aRank !== bRank) {
        return aRank - bRank;
      }

      // For non-error tasks, use feature-based sorting
      if (a.parent_feature && b.parent_feature) {
        const aFeature = todoData.features?.find(
          (f) => f.id === a.parent_feature,
        );
        const bFeature = todoData.features?.find(
          (f) => f.id === b.parent_feature,
        );

        if (
          aFeature &&
          bFeature &&
          this._isFeatureEarlier(aFeature, bFeature)
        ) {
          return -1;
        } else if (
          aFeature &&
          bFeature &&
          this._isFeatureEarlier(bFeature, aFeature)
        ) {
          return 1;
        }

        // Same feature - sort by subtask order
        if (aFeature && bFeature && aFeature.id === bFeature.id) {
          return this._compareTaskOrder(a, b);
        }
      }

      // Tasks with features come before standalone tasks
      if (a.parent_feature && !b.parent_feature) {
        return -1;
      }
      if (!a.parent_feature && b.parent_feature) {
        return 1;
      }

      // Default: creation time order
      return new Date(a.created_at) - new Date(b.created_at);
    });
  }

  /**
   * Generate dependency status report in markdown format
   * @returns {string} Markdown dependency report
   */
  async generateDependencyReport() {
    const graph = await this.buildDependencyGraph();
    const executable = await this.getExecutableTasks();

    let report = '# Task Dependency Report\n\n';

    report += '## Dependency Tree\n```\n';
    report += graph.tree;
    report += '\n```\n\n';

    if (graph.circularDependencies.length > 0) {
      report += '## ⚠️ Circular Dependencies\n';
      graph.circularDependencies.forEach((cycle) => {
        report += `- ${cycle.join(' → ')}\n`;
      });
      report += '\n';
    }

    report += '## 🚀 Ready to Execute\n';
    executable.forEach((task) => {
      report += `- **${task.title}** (${task.id}) - ${task.priority} priority\n`;
    });

    report += '\n## 📊 Statistics\n';
    report += `- Total Tasks: ${graph.stats.totalTasks}\n`;
    report += `- Tasks with Dependencies: ${graph.stats.tasksWithDependencies}\n`;
    report += `- Executable Now: ${executable.length}\n`;
    report += `- Circular Issues: ${graph.stats.circularIssues}\n`;

    return report;
  }

  /**
   * Private method to detect circular dependencies
   */
  _detectCircularDependencies(dependencyMap) {
    const visited = new Set();
    const visiting = new Set();
    const cycles = [];

    const visit = (taskId, path = []) => {
      if (visiting.has(taskId)) {
        // Found a cycle
        const cycleStart = path.indexOf(taskId);
        cycles.push(path.slice(cycleStart).concat([taskId]));
        return;
      }

      if (visited.has(taskId)) {
        return;
      }

      visiting.add(taskId);
      const dependencies = dependencyMap.get(taskId) || [];

      dependencies.forEach((depId) => {
        visit(depId, [...path, taskId]);
      });

      visiting.delete(taskId);
      visited.add(taskId);
    };

    Array.from(dependencyMap.keys()).forEach((taskId) => {
      if (!visited.has(taskId)) {
        visit(taskId);
      }
    });

    return cycles;
  }

  /**
   * Private method to generate ASCII dependency tree
   */
  _generateDependencyTree(tasks, _dependencyMap, _taskMap) {
    const roots = tasks.filter(
      (task) => !task.dependencies || task.dependencies.length === 0,
    );

    let tree = '';
    const visited = new Set();

    const addNode = (task, depth = 0, isLast = true, prefix = '') => {
      if (visited.has(task.id)) {
        tree += `${prefix}${isLast ? '└── ' : '├── '}${task.title} (${task.id}) [CIRCULAR]\n`;
        return;
      }

      visited.add(task.id);
      const connector = isLast ? '└── ' : '├── ';
      const status =
        task.status === 'completed'
          ? '✅'
          : task.status === 'in_progress'
            ? '🔄'
            : '⏳';

      tree += `${prefix}${connector}${status} ${task.title} (${task.id})\n`;

      // Find tasks that depend on this one
      const dependents = tasks.filter(
        (t) => t.dependencies && t.dependencies.includes(task.id),
      );

      dependents.forEach((dependent, index) => {
        const isLastDependent = index === dependents.length - 1;
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        addNode(dependent, depth + 1, isLastDependent, newPrefix);
      });
    };

    if (roots.length === 0) {
      tree = 'No root tasks found (all tasks have dependencies)\n';
    } else {
      roots.forEach((root, index) => {
        addNode(root, 0, index === roots.length - 1);
      });
    }

    return tree;
  }

  /**
   * Private method to calculate optimal execution order
   */
  _calculateExecutionOrder(dependencyMap, circularDeps) {
    if (circularDeps.length > 0) {
      return {
        error: 'Cannot calculate execution order due to circular dependencies',
        cycles: circularDeps,
      };
    }

    const order = [];
    const completed = new Set();
    const tasks = Array.from(dependencyMap.keys());

    while (order.length < tasks.length) {
      const ready = tasks.filter((taskId) => {
        if (completed.has(taskId)) {
          return false;
        }
        const deps = dependencyMap.get(taskId) || [];
        return deps.every((depId) => completed.has(depId));
      });

      if (ready.length === 0) {
        // Should not happen if no circular deps, but safety check
        const remaining = tasks.filter((taskId) => !completed.has(taskId));
        return { error: 'Cannot resolve dependencies', remaining };
      }

      ready.forEach((taskId) => {
        order.push(taskId);
        completed.add(taskId);
      });
    }

    return {
      order,
      phases: this._groupByExecutionPhases(order, dependencyMap),
    };
  }

  /**
   * Private method to group tasks by execution phases (tasks that can run in parallel)
   */
  _groupByExecutionPhases(order, dependencyMap) {
    const phases = [];
    const completed = new Set();

    while (completed.size < order.length) {
      const phase = [];

      order.forEach((taskId) => {
        if (completed.has(taskId)) {
          return;
        }

        const deps = dependencyMap.get(taskId) || [];
        if (deps.every((depId) => completed.has(depId))) {
          phase.push(taskId);
        }
      });

      if (phase.length === 0) {
        break;
      } // Safety check

      phases.push(phase);
      phase.forEach((taskId) => completed.add(taskId));
    }

    return phases;
  }

  /**
   * Convert success criteria to executable quality gates
   * @param {string} taskId - Task ID
   * @returns {Object} Quality gate execution results
   */
  async executeQualityGates(taskId) {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);

    if (!task || !task.success_criteria) {
      return { success: false, error: 'Task not found or no success criteria' };
    }

    // Execute all quality gates in parallel for better performance
    const qualityGatePromises = task.success_criteria.map(async (criterion) => {
      const result = await this._executeQualityGate(criterion);
      return {
        criterion,
        passed: result.success,
        output: result.output,
        error: result.error,
      };
    });

    const results = await Promise.all(qualityGatePromises);

    const allPassed = results.every((r) => r.passed);

    return {
      success: allPassed,
      results,
      summary: {
        total: results.length,
        passed: results.filter((r) => r.passed).length,
        failed: results.filter((r) => !r.passed).length,
      },
    };
  }

  /**
   * Private method to execute a single quality gate
   */
  async _executeQualityGate(criterion) {
    try {
      // Detect different types of quality gates
      if (criterion.startsWith('npm run ') || criterion.startsWith('node ')) {
        // Execute npm/node commands
        return await this._executeCommand(criterion);
      } else if (criterion.startsWith('file exists: ')) {
        // Check file existence
        const filePath = criterion.replace('file exists: ', '').trim();
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath comes from success criteria definition, used for project file checking
        const exists = fs.existsSync(filePath);
        return {
          success: exists,
          output: `File ${exists ? 'exists' : 'missing'}: ${filePath}`,
        };
      } else if (criterion.startsWith('coverage > ')) {
        // Check coverage threshold
        const threshold = parseFloat(
          criterion.replace('coverage > ', '').replace('%', ''),
        );
        return await this._checkCoverageThreshold(threshold);
      } else if (criterion.startsWith('tests pass')) {
        // Run tests
        const commands = this._getValidationCommands();
        return await this._executeCommand(commands.test);
      } else if (criterion.startsWith('lint passes')) {
        // Run linting
        const commands = this._getValidationCommands();
        return await this._executeCommand(commands.lint);
      } else {
        // Default: treat as manual verification needed
        return {
          success: false,
          output: 'Manual verification required',
          error: `Cannot auto-execute: ${criterion}`,
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a shell command for quality gates
   */
  async _executeCommand(command) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      const { stdout, stderr: _stderr } = await execAsync(command, { timeout: 300000 });
      return {
        success: true,
        output: stdout || 'Command completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message,
      };
    }
  }

  /**
   * Check if coverage meets threshold
   */
  _checkCoverageThreshold(threshold) {
    try {
      // Try to read coverage summary
      const coveragePath = './coverage/coverage-summary.json';
      if (!fs.existsSync(coveragePath)) {
        return {
          success: false,
          error: 'Coverage report not found. Run npm run test:coverage first.',
        };
      }

      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const totalCoverage =
        coverage.total && coverage.total.lines ? coverage.total.lines.pct : 0;

      return {
        success: totalCoverage >= threshold,
        output: `Coverage: ${totalCoverage}% (threshold: ${threshold}%)`,
        actualCoverage: totalCoverage,
      };
    } catch (error) {
      return {
        success: false,
        error: `Coverage check failed: ${error.message}`,
      };
    }
  }

  /**
   * Add executable quality gate to task
   * @param {string} taskId - Task ID
   * @param {string} gateCommand - Executable command or check
   * @returns {boolean} Success status
   */
  async addQualityGate(taskId, gateCommand) {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);

    if (!task) {
      return false;
    }

    if (!task.success_criteria) {
      task.success_criteria = [];
    }

    if (!task.success_criteria.includes(gateCommand)) {
      task.success_criteria.push(gateCommand);
      await this.writeTodo(todoData);
      return true;
    }

    return false;
  }

  /**
   * Batch update multiple tasks
   * @param {Array} updates - Array of {taskId, field, value} objects
   * @returns {Object} Batch update results
   */
  async batchUpdateTasks(updates) {
    const todoData = await this.readTodoFast();
    const results = { success: [], failed: [] };

    updates.forEach((update) => {
      const task = todoData.tasks.find((t) => t.id === update.taskId);
      if (task && update.field && update.value !== undefined) {
        task[update.field] = update.value;
        results.success.push(update.taskId);
      } else {
        results.failed.push({
          taskId: update.taskId,
          error: 'Task not found or invalid update',
        });
      }
    });

    if (results.success.length > 0) {
      await this.writeTodo(todoData);
    }

    return results;
  }

  /**
   * Filter and query tasks with various criteria
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered tasks
   */
  async queryTasks(filters = {}) {
    const todoData = await this.readTodoFast();
    let tasks = todoData.tasks || [];

    // Apply filters
    if (filters.status) {
      tasks = tasks.filter((t) => t.status === filters.status);
    }

    if (filters.priority) {
      tasks = tasks.filter((t) => t.priority === filters.priority);
    }

    if (filters.mode) {
      tasks = tasks.filter((t) => t.mode === filters.mode);
    }

    if (filters.hasFile) {
      tasks = tasks.filter(
        (t) =>
          t.important_files &&
          t.important_files.some((f) => f.includes(filters.hasFile)),
      );
    }

    if (filters.titleContains) {
      tasks = tasks.filter((t) =>
        t.title.toLowerCase().includes(filters.titleContains.toLowerCase()),
      );
    }

    return tasks;
  }

  /**
   * Enhanced error tracking for task failures
   * @param {string} taskId - Task ID
   * @param {Object} errorInfo - Error information
   */
  async trackTaskError(taskId, errorInfo) {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);

    if (!task) {
      return false;
    }

    if (!task.errors) {
      task.errors = [];
    }

    task.errors.push({
      timestamp: new Date().toISOString(),
      type: errorInfo.type || 'unknown',
      message: errorInfo.message || '',
      context: errorInfo.context || {},
      recoverable: errorInfo.recoverable || false,
    });

    // Also update status if this is a blocking error
    if (errorInfo.blocking) {
      task.status = 'blocked';
    }

    await this.writeTodo(todoData);
    return true;
  }

  /**
   * Get error summary for debugging
   * @param {string} taskId - Task ID (optional, gets all errors if not provided)
   * @returns {Object} Error summary
   */
  async getErrorSummary(taskId = null) {
    const todoData = await this.readTodoFast();

    if (taskId) {
      const task = todoData.tasks.find((t) => t.id === taskId);
      return task ? task.errors || [] : [];
    }

    // Get all errors across all tasks
    const allErrors = [];
    todoData.tasks.forEach((task) => {
      if (task.errors) {
        task.errors.forEach((error) => {
          allErrors.push({ taskId: task.id, taskTitle: task.title, ...error });
        });
      }
    });

    return {
      totalErrors: allErrors.length,
      errorsByType: this._groupErrorsByType(allErrors),
      recentErrors: allErrors.filter(
        (e) => new Date() - new Date(e.timestamp) < 24 * 60 * 60 * 1000, // Last 24 hours
      ),
      blockingTasks: todoData.tasks
        .filter((t) => t.status === 'blocked')
        .map((t) => ({ id: t.id, title: t.title })),
    };
  }

  /**
   * Remove a task by ID
   * @param {string} taskId - Task ID to remove
   * @returns {boolean} True if task was removed, false if not found
   */
  async removeTask(taskId) {
    const todoData = await this.readTodoFast();
    const initialCount = todoData.tasks.length;

    // Filter out the task with the specified ID
    todoData.tasks = todoData.tasks.filter((task) => task.id !== taskId);

    // Check if a task was actually removed
    if (todoData.tasks.length < initialCount) {
      await this.writeTodo(todoData);
      return true;
    }

    return false;
  }

  /**
   * Remove multiple tasks by IDs
   * @param {Array} taskIds - Array of task IDs to remove
   * @returns {Object} Result with success/failed arrays
   */
  async removeTasks(taskIds) {
    const todoData = await this.readTodoFast();
    const results = { success: [], failed: [] };

    taskIds.forEach((taskId) => {
      const taskExists = todoData.tasks.some((task) => task.id === taskId);
      if (taskExists) {
        results.success.push(taskId);
      } else {
        results.failed.push(taskId);
      }
    });

    // Remove all successful task IDs
    if (results.success.length > 0) {
      todoData.tasks = todoData.tasks.filter(
        (task) => !results.success.includes(task.id),
      );
      await this.writeTodo(todoData);
    }

    return results;
  }

  /**
   * Reorder a task to a new position
   * @param {string} taskId - Task ID to reorder
   * @param {number} newIndex - New position index (0-based)
   * @returns {boolean} True if task was reordered, false if not found
   */
  async reorderTask(taskId, newIndex) {
    const todoData = await this.readTodoFast();
    const taskIndex = todoData.tasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      return false; // Task not found
    }

    // Validate new index
    if (newIndex < 0 || newIndex >= todoData.tasks.length) {
      throw new Error(
        `Invalid index ${newIndex}. Must be between 0 and ${todoData.tasks.length - 1}`,
      );
    }

    // If already at the target position, no change needed
    if (taskIndex === newIndex) {
      return true;
    }

    // Remove task from current position
    const [task] = todoData.tasks.splice(taskIndex, 1);

    // Insert task at new position
    todoData.tasks.splice(newIndex, 0, task);

    await this.writeTodo(todoData);
    return true;
  }

  /**
   * Move a task to the beginning of the list
   * @param {string} taskId - Task ID to move to top
   * @returns {boolean} True if task was moved, false if not found
   */
  moveTaskToTop(taskId) {
    return this.reorderTask(taskId, 0);
  }

  /**
   * Move a task to the end of the list
   * @param {string} taskId - Task ID to move to bottom
   * @returns {boolean} True if task was moved, false if not found
   */
  async moveTaskToBottom(taskId) {
    const todoData = await this.readTodoFast();
    const lastIndex = todoData.tasks.length - 1;
    return this.reorderTask(taskId, lastIndex);
  }

  /**
   * Move a task up one position
   * @param {string} taskId - Task ID to move up
   * @returns {boolean} True if task was moved, false if not found or already at top
   */
  async moveTaskUp(taskId) {
    const todoData = await this.readTodoFast();
    const taskIndex = todoData.tasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1 || taskIndex === 0) {
      return false; // Task not found or already at top
    }

    return this.reorderTask(taskId, taskIndex - 1);
  }

  /**
   * Move a task down one position
   * @param {string} taskId - Task ID to move down
   * @returns {boolean} True if task was moved, false if not found or already at bottom
   */
  async moveTaskDown(taskId) {
    const todoData = await this.readTodoFast();
    const taskIndex = todoData.tasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1 || taskIndex === todoData.tasks.length - 1) {
      return false; // Task not found or already at bottom
    }

    return this.reorderTask(taskId, taskIndex + 1);
  }

  /**
   * Reorder multiple tasks to new positions
   * @param {Array} reorderSpecs - Array of {taskId, newIndex} objects
   * @returns {Object} Result with success/failed arrays and details
   */
  async reorderTasks(reorderSpecs) {
    const todoData = await this.readTodoFast();
    const results = { success: [], failed: [], errors: [] };

    // Validate all specs first
    for (const spec of reorderSpecs) {
      const { taskId, newIndex } = spec;

      if (!taskId || typeof newIndex !== 'number') {
        results.failed.push(taskId || 'unknown');
        results.errors.push({
          taskId: taskId || 'unknown',
          error:
            'Invalid reorder specification: requires taskId and numeric newIndex',
        });
        continue;
      }

      const taskExists = todoData.tasks.some((task) => task.id === taskId);
      if (!taskExists) {
        results.failed.push(taskId);
        results.errors.push({
          taskId,
          error: 'Task not found',
        });
        continue;
      }

      if (newIndex < 0 || newIndex >= todoData.tasks.length) {
        results.failed.push(taskId);
        results.errors.push({
          taskId,
          error: `Invalid index ${newIndex}. Must be between 0 and ${todoData.tasks.length - 1}`,
        });
        continue;
      }

      results.success.push(taskId);
    }

    // If any validation failed, don't perform any reordering
    if (results.failed.length > 0) {
      return results;
    }

    // Sort reorder specs by current position to avoid conflicts
    const sortedSpecs = reorderSpecs
      .map((spec) => ({
        ...spec,
        currentIndex: todoData.tasks.findIndex(
          (task) => task.id === spec.taskId,
        ),
      }))
      .sort((a, b) => a.currentIndex - b.currentIndex);

    // Apply reordering operations in sequence
    for (const spec of sortedSpecs) {
      const { taskId, newIndex } = spec;
      const currentIndex = todoData.tasks.findIndex(
        (task) => task.id === taskId,
      );

      if (currentIndex !== newIndex) {
        // Remove task from current position
        const [task] = todoData.tasks.splice(currentIndex, 1);
        // Insert at new position
        todoData.tasks.splice(newIndex, 0, task);
      }
    }

    await this.writeTodo(todoData);
    return results;
  }

  /**
   * Get the current position of a task
   * @param {string} taskId - Task ID to find position for
   * @returns {number} Current index of task, or -1 if not found
   */
  getTaskPosition(taskId) {
    const todoData = this.readTodo();
    return todoData.tasks.findIndex((task) => task.id === taskId);
  }

  /**
   * Archive a completed task to DONE.json
   * @param {Object} task - Task object to archive
   */
  archiveCompletedTask(task) {
    if (!this.options.enableArchiving) {
      return;
    }

    // Add completion timestamp
    const archivedTask = {
      ...task,
      completed_at: new Date().toISOString(),
      archived_from_todo: this.todoPath,
    };

    // Read or create DONE.json
    let doneData;
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.donePath is from constructor, validated file path
    if (fs.existsSync(this.donePath)) {
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.donePath is from constructor, validated file path
        const content = fs.readFileSync(this.donePath, 'utf8');
        doneData = JSON.parse(content);
      } catch {
        // If DONE.json is corrupted, create new structure
        doneData = this._createDoneStructure();
      }
    } else {
      doneData = this._createDoneStructure();
    }

    // Add task to completed tasks
    doneData.completed_tasks.push(archivedTask);
    doneData.total_completed = doneData.completed_tasks.length;
    doneData.last_completion = archivedTask.completed_at;

    // Write DONE.json
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.donePath is from constructor, validated file path
    fs.writeFileSync(this.donePath, JSON.stringify(doneData, null, 2));
  }

  /**
   * Create initial DONE.json structure
   * @returns {Object} DONE.json structure
   */
  _createDoneStructure() {
    return {
      project: 'infinite-continue-stop-hook',
      completed_tasks: [],
      total_completed: 0,
      last_completion: null,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Read DONE.json file
   * @returns {Object} DONE.json data
   */
  readDone() {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.donePath is from constructor, validated file path
    if (!fs.existsSync(this.donePath)) {
      return this._createDoneStructure();
    }

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.donePath is from constructor, validated file path
      const content = fs.readFileSync(this.donePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return this._createDoneStructure();
    }
  }

  /**
   * Get completed tasks with optional filtering
   * @param {Object} filters - Optional filters (limit, since, taskType, etc.)
   * @returns {Array} Array of completed tasks
   */
  async getCompletedTasks(filters = {}) {
    const doneData = await this.readDone();
    let tasks = doneData.completed_tasks || [];

    // Apply filters
    if (filters.limit && typeof filters.limit === 'number') {
      tasks = tasks.slice(-filters.limit); // Get most recent N tasks
    }

    if (filters.since && typeof filters.since === 'string') {
      const sinceDate = new Date(filters.since);
      tasks = tasks.filter(
        (task) => task.completed_at && new Date(task.completed_at) >= sinceDate,
      );
    }

    if (filters.mode && typeof filters.mode === 'string') {
      tasks = tasks.filter((task) => task.mode === filters.mode);
    }

    if (filters.priority && typeof filters.priority === 'string') {
      tasks = tasks.filter((task) => task.priority === filters.priority);
    }

    return tasks;
  }

  /**
   * Get completion statistics
   * @returns {Object} Statistics about completed tasks
   */
  async getCompletionStats() {
    const doneData = await this.readDone();
    const tasks = doneData.completed_tasks || [];

    const stats = {
      total_completed: tasks.length,
      last_completion: doneData.last_completion,
      modes: {},
      priorities: {},
      recent_completions: {
        last_24h: 0,
        last_7d: 0,
        last_30d: 0,
      },
    };

    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    tasks.forEach((task) => {
      // Count by mode
      if (task.mode) {
        stats.modes[task.mode] = (stats.modes[task.mode] || 0) + 1;
      }

      // Count by priority
      if (task.priority) {
        stats.priorities[task.priority] =
          (stats.priorities[task.priority] || 0) + 1;
      }

      // Count recent completions
      if (task.completed_at) {
        const completedAt = new Date(task.completed_at);
        const daysAgo = (now - completedAt) / day;

        if (daysAgo <= 1) {
          stats.recent_completions.last_24h++;
        }
        if (daysAgo <= 7) {
          stats.recent_completions.last_7d++;
        }
        if (daysAgo <= 30) {
          stats.recent_completions.last_30d++;
        }
      }
    });

    return stats;
  }

  /**
   * Restore a completed task back to TODO.json
   * @param {string} taskId - ID of completed task to restore
   * @returns {boolean} True if task was restored, false if not found
   */
  async restoreCompletedTask(taskId) {
    const doneData = await this.readDone();
    const taskIndex = doneData.completed_tasks.findIndex(
      (task) => task.id === taskId,
    );

    if (taskIndex === -1) {
      return false;
    }

    // Remove from DONE.json
    const [task] = doneData.completed_tasks.splice(taskIndex, 1);
    doneData.total_completed = doneData.completed_tasks.length;

    // Clean up archive metadata
    const {
      completed_at: _completed_at,
      archived_from_todo: _archived_from_todo,
      ...restoredTask
    } = task;
    restoredTask.status = 'pending'; // Reset status

    // Add back to TODO.json using correct section placement
    const todoData = await this.readTodoFast();
    this._insertTaskInCorrectSection(todoData, restoredTask);

    // Write both files
    await this.writeTodo(todoData);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.donePath is from constructor, validated file path
    fs.writeFileSync(this.donePath, JSON.stringify(doneData, null, 2));

    return true;
  }

  /**
   * Migrate all existing completed tasks from TODO.json to DONE.json
   * @returns {Object} Migration results with counts
   */
  async migrateCompletedTasks() {
    const todoData = await this.readTodoFast();
    const completedTasks = todoData.tasks.filter(
      (task) => task.status === 'completed',
    );

    if (completedTasks.length === 0) {
      return { migrated: 0, skipped: 0, total: 0 };
    }

    // Archive all completed tasks in parallel for better performance
    const archivePromises = completedTasks.map(async (task) => {
      try {
        await this.archiveCompletedTask(task);
        return { success: true, taskId: task.id };
      } catch (error) {
        logger.warn(`Failed to archive task ${task.id}: ${error.message}`);
        return { success: false, taskId: task.id, error };
      }
    });

    const archiveResults = await Promise.all(archivePromises);
    const migrated = archiveResults.filter(r => r.success).length;
    const skipped = archiveResults.filter(r => !r.success).length;

    // Remove all successfully archived tasks from TODO.json
    if (migrated > 0) {
      todoData.tasks = todoData.tasks.filter(
        (task) => task.status !== 'completed',
      );
      await this.writeTodo(todoData);
    }

    return {
      migrated,
      skipped,
      total: completedTasks.length,
    };
  }

  /**
   * Get pending linter reminders from recent completed tasks
   */
  async getLinterReminders(hoursBack = 24) {
    const todoData = await this.readTodoFast();
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const reminders = [];

    // Check completed tasks in TODO.json (if archiving is disabled)
    if (todoData.tasks) {
      todoData.tasks.forEach((task) => {
        if (
          task.status === 'completed' &&
          task.linterReminder &&
          task.linterReminder.needsLinting
        ) {
          const taskTime = new Date(task.linterReminder.timestamp);
          if (taskTime > cutoffTime) {
            reminders.push(task.linterReminder);
          }
        }
      });
    }

    // Also check recently archived tasks in DONE.json
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.donePath is from constructor, validated file path
      if (fs.existsSync(this.donePath)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- this.donePath is from constructor, validated file path
        const doneContent = fs.readFileSync(this.donePath, 'utf8');
        const doneData = JSON.parse(doneContent);

        if (doneData.completed_tasks) {
          doneData.completed_tasks.forEach((task) => {
            if (task.linterReminder && task.linterReminder.needsLinting) {
              const taskTime = new Date(task.linterReminder.timestamp);
              if (taskTime > cutoffTime) {
                reminders.push(task.linterReminder);
              }
            }
          });
        }
      }
    } catch {
      // Ignore errors reading DONE.json
    }

    return reminders;
  }

  /**
   * Generate linter feedback message for Claude Code
   */
  async generateLinterFeedbackMessage() {
    if (!this.options.enableLinterReminders) {
      return null;
    }

    const reminders = await this.getLinterReminders(1); // Last 1 hour
    if (reminders.length === 0) {
      return null;
    }

    // Collect unique directories from all reminders
    const allDirectories = new Set();
    const taskTitles = [];

    reminders.forEach((reminder) => {
      reminder.directories.forEach((dir) => allDirectories.add(dir));
      taskTitles.push(reminder.taskTitle);
    });

    if (allDirectories.size === 0) {
      return null;
    }

    const dirList = Array.from(allDirectories).sort();
    const message = {
      type: 'linter_reminder',
      title: '🔍 Linter Check Recommended',
      message: this.buildLinterMessage(taskTitles, dirList),
      directories: dirList,
      taskCount: reminders.length,
    };

    return message;
  }

  /**
   * Build the linter feedback message text
   */
  buildLinterMessage(taskTitles, directories) {
    const taskText =
      taskTitles.length === 1
        ? `task "${taskTitles[0]}"`
        : `${taskTitles.length} tasks`;

    const dirText =
      directories.length === 1
        ? `the ${directories[0]} directory`
        : `these directories: ${directories.join(', ')}`;

    return `You recently completed ${taskText} that worked in ${dirText}.

## Code Quality Check Required

Based on your recent work, it's important to run linter checks to maintain code quality and ensure consistency across the project.

**Primary Actions:**

1. **Run targeted linting on modified areas:**
${directories.map((dir) => `   \`npm run lint ${dir}\``).join('\n')}

2. **Run full project lint check:**
   \`npm run lint\`

3. **Address any linting errors before continuing:**
   \`npm run lint:fix\` (for auto-fixable issues)

**Why This Matters:**
- Maintains consistent code style across the project
- Catches potential bugs and code quality issues early
- Ensures your recent changes follow project standards
- Prevents accumulation of technical debt

**Next Steps:**
After addressing any linting issues, you can continue with your next task. Clean code is maintainable code!`;
  }

  /**
   * Private method to group errors by type
   */
  _groupErrorsByType(errors) {
    const grouped = {};
    errors.forEach((error) => {
      const type = error.type || 'unknown';
      // eslint-disable-next-line security/detect-object-injection -- type is validated as string from error.type or set to 'unknown'
      if (!grouped[type]) {
        // eslint-disable-next-line security/detect-object-injection -- type is validated as string from error.type or set to 'unknown'
        grouped[type] = [];
      }
      // eslint-disable-next-line security/detect-object-injection -- type is validated as string from error.type or set to 'unknown'
      grouped[type].push(error);
    });
    return grouped;
  }

  // ============================================================================
  // MULTI-AGENT SUPPORT METHODS
  // ============================================================================

  /**
   * Assign a task to a specific agent
   * @param {string} taskId - Task ID to assign
   * @param {string} agentId - Agent ID to assign to
   * @param {string} role - Assignment role (primary, secondary, coordinator)
   * @returns {boolean} Success status
   */
  async assignTaskToAgent(taskId, agentId, role = 'primary') {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);

    if (!task) {
      return false;
    }

    // Initialize multi-agent fields if not present
    if (!task.assigned_agent) {
      task.assigned_agent = agentId;
    }

    if (!task.agent_assignment_history) {
      task.agent_assignment_history = [];
    }

    if (!task.parallel_execution) {
      task.parallel_execution = {
        canParallelize: false,
        parallelWith: [],
        coordinatorTask: null,
      };
    }

    // Record assignment history
    task.agent_assignment_history.push({
      agentId: agentId,
      role: role,
      assignedAt: new Date().toISOString(),
      reassignReason: null,
    });

    // Update task status if assigning to primary agent
    if (role === 'primary' && task.status === 'pending') {
      task.status = 'in_progress';
      task.started_at = new Date().toISOString();
      task.claimed_by = agentId;
    }

    await this.writeTodo(todoData);
    return true;
  }

  /**
   * Get tasks assigned to a specific agent
   * @param {string} agentId - Agent ID
   * @param {boolean} includeCoordination - Include coordination tasks
   * @returns {Array} Array of tasks assigned to the agent
   */
  async getTasksForAgent(agentId, includeCoordination = false) {
    const todoData = await this.readTodoFast();
    const assignedTasks = todoData.tasks.filter((task) => {
      // Primary assignment
      if (task.assigned_agent === agentId) {
        return true;
      }

      // Coordination tasks if requested
      if (
        includeCoordination &&
        task.parallel_execution?.coordinatorTask === agentId
      ) {
        return true;
      }

      // Secondary assignments in history
      if (task.agent_assignment_history) {
        return task.agent_assignment_history.some(
          (history) =>
            history.agentId === agentId && history.role !== 'primary',
        );
      }

      return false;
    });

    return assignedTasks;
  }

  /**
   * Reassign a task from one agent to another
   * @param {string} taskId - Task ID
   * @param {string} fromAgentId - Current agent ID
   * @param {string} toAgentId - New agent ID
   * @param {string} reason - Reason for reassignment
   * @returns {boolean} Success status
   */
  async reassignTask(taskId, fromAgentId, toAgentId, reason) {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);

    if (!task || task.assigned_agent !== fromAgentId) {
      return false;
    }

    // Update assignment
    task.assigned_agent = toAgentId;

    // Record reassignment in history
    if (!task.agent_assignment_history) {
      task.agent_assignment_history = [];
    }

    task.agent_assignment_history.push({
      agentId: toAgentId,
      role: 'primary',
      assignedAt: new Date().toISOString(),
      reassignReason: reason,
    });

    await this.writeTodo(todoData);
    return true;
  }

  /**
   * Release a task from an agent
   * @param {string} taskId - Task ID
   * @param {string} agentId - Agent ID
   * @returns {boolean} Success status
   */
  async releaseTaskFromAgent(taskId, agentId) {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);

    if (!task || task.assigned_agent !== agentId) {
      return false;
    }

    // Reset assignment
    task.assigned_agent = null;

    // Reset status if in progress
    if (task.status === 'in_progress') {
      task.status = 'pending';
    }

    await this.writeTodo(todoData);
    return true;
  }

  /**
   * Get available tasks for multiple agents
   * @param {number} agentCount - Number of agents requesting tasks
   * @param {Array} agentCapabilities - Array of agent capability arrays
   * @returns {Array} Array of available tasks
   */
  async getAvailableTasksForAgents(agentCount, agentCapabilities = []) {
    const todoData = await this.readTodoFast();
    const availableTasks = todoData.tasks.filter((task) => {
      // Must be pending and unassigned
      if (task.status !== 'pending' || task.assigned_agent) {
        return false;
      }

      // Check dependencies are met
      if (task.dependencies && task.dependencies.length > 0) {
        const completedTasks = todoData.tasks
          .filter((t) => t.status === 'completed')
          .map((t) => t.id);

        if (
          !task.dependencies.every((depId) => completedTasks.includes(depId))
        ) {
          return false;
        }
      }

      return true;
    });

    // Prioritize tasks based on agent capabilities if provided
    if (agentCapabilities.length > 0) {
      availableTasks.sort((a, b) => {
        const aScore = this._calculateTaskAgentScore(a, agentCapabilities);
        const bScore = this._calculateTaskAgentScore(b, agentCapabilities);
        return bScore - aScore;
      });
    }

    // Return up to agentCount tasks
    return availableTasks.slice(0, agentCount);
  }

  /**
   * Get tasks that can be executed in parallel
   * @param {number} maxAgents - Maximum number of agents
   * @returns {Array} Array of parallelizable task groups
   */
  async getParallelizableTasks(maxAgents = 3) {
    const availableTasks = await this.getAvailableTasksForAgents(999); // Get all available

    const parallelGroups = [];
    const usedTasks = new Set();

    for (const task of availableTasks) {
      if (usedTasks.has(task.id)) {
        continue;
      }

      // Check if task can be parallelized
      if (task.parallel_execution?.canParallelize) {
        const parallelTasks = [task];
        usedTasks.add(task.id);

        // Find related parallel tasks
        if (task.parallel_execution.parallelWith) {
          for (const parallelTaskId of task.parallel_execution.parallelWith) {
            const parallelTask = availableTasks.find(
              (t) => t.id === parallelTaskId,
            );
            if (parallelTask && !usedTasks.has(parallelTask.id)) {
              parallelTasks.push(parallelTask);
              usedTasks.add(parallelTask.id);
            }
          }
        }

        if (parallelTasks.length <= maxAgents) {
          parallelGroups.push({
            tasks: parallelTasks,
            coordinatorTask: task.parallel_execution.coordinatorTask,
            estimatedDuration: Math.max(
              ...parallelTasks.map((t) =>
                this._parseEstimate(t.estimate || '1 hour'),
              ),
            ),
          });
        }
      }
    }

    return parallelGroups;
  }

  /**
   * Claim a task for an agent with distributed locking
   * @param {string} taskId - Task ID
   * @param {string} agentId - Agent ID
   * @param {string} priority - Claim priority (normal, high, urgent)
   * @returns {Object} Claim result
   */
  async claimTask(taskId, agentId, priority = 'normal', options = {}) {
    // Fast path: Check if task exists first before acquiring expensive locks
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, reason: 'Task not found' };
    }

    // Allow claiming of pending tasks and switched tasks that can be resumed
    if (
      task.status !== 'pending' &&
      !(task.status === 'switched' && task.switch_context?.canResume)
    ) {
      return {
        success: false,
        reason: `Task is not available for claiming (status: ${task.status})`,
      };
    }

    // For switched tasks, verify the agent can claim it
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
   * Validate task claiming prerequisites (extracted common logic)
   * @private
   * @param {string} taskId - Task ID to validate
   * @param {Object} todoData - Todo data object
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  _validateTaskClaiming(taskId, todoData, options = {}) {
    // Feature-based linear progression (unless explicitly overridden)
    if (!options.allowOutOfOrder) {
      const task = todoData.tasks.find((t) => t.id === taskId);

      // ERROR TASKS HAVE ABSOLUTE PRIORITY - Always allow claiming error tasks
      if (task.category === 'error') {
        return { valid: true };
      }

      // Check if there are pending error tasks that should be done first
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
            reason: `Error tasks have absolute priority and must be completed first`,
            nextTaskId: nextErrorTask.id,
            nextTaskTitle: nextErrorTask.title,
            errorCategory: nextErrorTask.category,
            suggestion: `Fix error task "${nextErrorTask.title}" first before proceeding with feature work`,
          },
        };
      }

      // If task is linked to a feature, enforce feature order
      if (task.parent_feature) {
        const feature = todoData.features?.find(
          (f) => f.id === task.parent_feature,
        );
        if (feature) {
          // Find earlier features that aren't completed
          const incompleteEarlierFeatures = todoData.features
            .filter((f) => f.id !== feature.id && f.status !== 'completed')
            .filter((f) => this._isFeatureEarlier(f, feature));

          if (incompleteEarlierFeatures.length > 0) {
            const earlierFeature = incompleteEarlierFeatures[0];
            const earlierTasks = todoData.tasks.filter(
              (t) =>
                t.parent_feature === earlierFeature.id &&
                t.status === 'pending' &&
                !t.assigned_agent,
            );

            if (earlierTasks.length > 0) {
              return {
                valid: false,
                errorResult: {
                  success: false,
                  reason: `Feature order violation: must complete features in sequence`,
                  nextTaskId: earlierTasks[0].id,
                  nextTaskTitle: earlierTasks[0].title,
                  nextFeature: earlierFeature.title,
                  currentFeature: feature.title,
                  suggestion: `Complete feature "${earlierFeature.title}" first, or use allowOutOfOrder: true`,
                },
              };
            }
          }

          // Within the same feature, enforce subtask order
          const featureTasks = todoData.tasks
            .filter((t) => t.parent_feature === feature.id)
            .sort((a, b) => this._compareTaskOrder(a, b));

          const taskIndex = featureTasks.findIndex((t) => t.id === taskId);
          const earlierIncompleteTasks = featureTasks
            .slice(0, taskIndex)
            .filter((t) => t.status === 'pending' && !t.assigned_agent);

          if (earlierIncompleteTasks.length > 0) {
            const earlierTask = earlierIncompleteTasks[0];
            return {
              valid: false,
              errorResult: {
                success: false,
                reason: `Subtask order violation: must complete subtasks in sequence within feature`,
                nextTaskId: earlierTask.id,
                nextTaskTitle: earlierTask.title,
                feature: feature.title,
                suggestion: `Complete subtask "${earlierTask.title}" first, or use allowOutOfOrder: true`,
              },
            };
          }
        }
      } else {
        // For tasks not linked to features, use simple list order
        const taskIndex = todoData.tasks.findIndex((t) => t.id === taskId);
        const earlierPendingTasks = todoData.tasks
          .slice(0, taskIndex)
          .filter(
            (t) =>
              t.status === 'pending' && !t.assigned_agent && !t.parent_feature,
          );

        if (earlierPendingTasks.length > 0) {
          const nextTask = earlierPendingTasks[0];
          return {
            valid: false,
            errorResult: {
              success: false,
              reason: 'Task order violation: must complete tasks in sequence',
              nextTaskId: nextTask.id,
              nextTaskTitle: nextTask.title,
              suggestion: `Complete task "${nextTask.title}" first, or use allowOutOfOrder: true`,
            },
          };
        }
      }
    }

    // Check dependencies
    const task = todoData.tasks.find((t) => t.id === taskId);
    if (task.dependencies && task.dependencies.length > 0) {
      const completedTasks = todoData.tasks
        .filter((t) => t.status === 'completed')
        .map((t) => t.id);

      const unmetDeps = task.dependencies.filter(
        (depId) => !completedTasks.includes(depId),
      );

      if (unmetDeps.length > 0) {
        return {
          valid: false,
          errorResult: {
            success: false,
            reason: 'Unmet dependencies',
            unmetDependencies: unmetDeps,
          },
        };
      }
    }

    // All validations passed
    return { valid: true };
  }

  /**
   * Compare features to determine which comes first (simplified feature ordering)
   * @private
   * @param {Object} featureA - First feature
   * @param {Object} featureB - Second feature
   * @returns {boolean} True if featureA comes before featureB
   */
  _isFeatureEarlier(featureA, featureB) {
    // Extract feature numbers from title (e.g., "Feature 1", "Phase 2.1")
    const getFeatureNumber = (feature) => {
      // Safe regex: match feature/phase prefix and extract numbers
      const baseMatch = feature.title.match(/^(?:Feature|Phase)\s+(\d+)/i);
      if (baseMatch) {
        const major = parseInt(baseMatch[1], 10);
        // Check for minor version separately
        const dotMatch = feature.title.match(/^(?:Feature|Phase)\s+\d+\.(\d+)/i);
        const minor = dotMatch ? parseInt(dotMatch[1], 10) : 0;
        return major * 1000 + minor; // Simple numeric comparison
      }
      // Fallback to creation time if no number found
      return new Date(feature.created_at || 0).getTime();
    };

    return getFeatureNumber(featureA) < getFeatureNumber(featureB);
  }

  /**
   * Compare tasks for ordering within a feature (simplified subtask ordering)
   * @private
   * @param {Object} taskA - First task
   * @param {Object} taskB - Second task
   * @returns {number} Comparison result (-1, 0, 1)
   */
  _compareTaskOrder(taskA, taskB) {
    // Extract subtask numbers from title (e.g., "Subtask 1", "Step 2.1")
    const getSubtaskNumber = (task) => {
      // Safe regex: match subtask/step prefix and extract numbers
      const baseMatch = task.title.match(/^(?:Subtask|Step)\s+(\d+)/i);
      if (baseMatch) {
        const major = parseInt(baseMatch[1], 10);
        // Check for minor version separately
        const dotMatch = task.title.match(/^(?:Subtask|Step)\s+\d+\.(\d+)/i);
        const minor = dotMatch ? parseInt(dotMatch[1], 10) : 0;
        return major * 100 + minor;
      }
      // Fallback to creation time order
      return new Date(task.created_at || 0).getTime();
    };

    const numA = getSubtaskNumber(taskA);
    const numB = getSubtaskNumber(taskB);

    if (numA < numB) {
      return -1;
    }
    if (numA > numB) {
      return 1;
    }
    return 0;
  }

  /**
   * Insert or replace a feature, shifting others down as needed
   * @param {Object} featureData - Feature data
   * @param {number} insertAtNumber - Feature number to insert at (e.g., 2 for "Feature 2")
   * @param {boolean} replace - Whether to replace existing feature or shift down
   * @returns {Promise<string>} Feature ID
   */
  async insertFeature(featureData, insertAtNumber, replace = false) {
    const todoData = await this.readTodo();

    if (!replace) {
      // Shift existing features down
      todoData.features.forEach((feature) => {
        // Safe regex: match feature/phase prefix and extract number
        const baseMatch = feature.title.match(/^(?:Feature|Phase)\s+(\d+)/i);
        if (baseMatch) {
          const featureNum = parseInt(baseMatch[1], 10);
          if (featureNum >= insertAtNumber) {
            // Update feature title to shift it down
            feature.title = feature.title.replace(
              /(?:Feature|Phase)\s+(\d+)/i,
              (match, num) => match.replace(num, parseInt(num) + 1),
            );
          }
        }
      });

      // Also update task titles that reference features
      todoData.tasks.forEach((task) => {
        // Safe regex: match feature/phase prefix and extract number
        const baseMatch = task.title.match(/^(?:Feature|Phase)\s+(\d+)/i);
        if (baseMatch) {
          const featureNum = parseInt(baseMatch[1], 10);
          if (featureNum >= insertAtNumber) {
            task.title = task.title.replace(
              /(?:Feature|Phase)\s+(\d+)/i,
              (match, num) => match.replace(num, parseInt(num) + 1),
            );
          }
        }
      });
    }

    // Create new feature with correct number
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const featureId = `feature_${timestamp}_${randomSuffix}`;

    const newFeature = {
      id: featureId,
      title: `Feature ${insertAtNumber}: ${featureData.title}`,
      description: featureData.description,
      status: 'planned',
      category: featureData.category || 'enhancement',
      priority: featureData.priority || 'medium',
      subtasks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...featureData,
    };

    todoData.features.push(newFeature);
    await this.writeTodo(todoData);

    return featureId;
  }

  /**
   * Insert or replace a subtask within a feature, shifting others down as needed
   * @param {Object} taskData - Task data
   * @param {string} featureId - Parent feature ID
   * @param {number} insertAtNumber - Subtask number to insert at (e.g., 2 for "Subtask 2")
   * @param {boolean} replace - Whether to replace existing subtask or shift down
   * @returns {Promise<string>} Task ID
   */
  async insertSubtask(taskData, featureId, insertAtNumber, replace = false) {
    const todoData = await this.readTodo();
    const feature = todoData.features.find((f) => f.id === featureId);

    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }

    const featureTasks = todoData.tasks.filter(
      (t) => t.parent_feature === featureId,
    );

    if (!replace) {
      // Shift existing subtasks down
      featureTasks.forEach((task) => {
        // Safe regex: match subtask/step prefix and extract number
        const baseMatch = task.title.match(/^(?:Subtask|Step)\s+(\d+)/i);
        if (baseMatch) {
          const subtaskNum = parseInt(baseMatch[1], 10);
          if (subtaskNum >= insertAtNumber) {
            task.title = task.title.replace(
              /^(?:Subtask|Step)\s+(\d+)/i,
              (match, num) => match.replace(num, parseInt(num) + 1),
            );
          }
        }
      });
    }

    // Create new subtask
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const taskId = `task_${timestamp}_${randomSuffix}`;

    const newTask = {
      id: taskId,
      title: `Subtask ${insertAtNumber}: ${taskData.title}`,
      description: taskData.description,
      mode: taskData.mode || 'DEVELOPMENT',
      category: taskData.category || 'missing-feature',
      priority: taskData.priority || 'medium',
      status: 'pending',
      dependencies: taskData.dependencies || [],
      important_files: taskData.important_files || [],
      parent_feature: featureId,
      created_at: new Date().toISOString(),
      subtasks: [],
      ...taskData,
    };

    this._insertTaskInCorrectSection(todoData, newTask);

    // Update feature's subtasks array
    feature.subtasks = feature.subtasks || [];
    if (!feature.subtasks.includes(taskId)) {
      feature.subtasks.push(taskId);
    }

    await this.writeTodo(todoData);

    return taskId;
  }

  /**
   * Simple task claiming without distributed locking (fallback)
   * @param {string} taskId - Task ID
   * @param {string} agentId - Agent ID
   * @param {string} priority - Claim priority
   * @returns {Object} Claim result
   */
  async claimTaskSimple(taskId, agentId, priority = 'normal', options = {}) {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, reason: 'Task not found' };
    }

    // Allow claiming of pending tasks and switched tasks that can be resumed
    if (
      task.status !== 'pending' &&
      !(task.status === 'switched' && task.switch_context?.canResume)
    ) {
      return {
        success: false,
        reason: `Task is not available for claiming (status: ${task.status})`,
      };
    }

    // For switched tasks, verify the agent can claim it
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
    );
    if (!validationResult.valid) {
      return validationResult.errorResult;
    }

    // Claim the task
    const success = await this.assignTaskToAgent(taskId, agentId, 'primary');

    if (success) {
      return {
        success: true,
        task: task,
        claimedAt: new Date().toISOString(),
        priority: priority,
      };
    } else {
      return { success: false, reason: 'Failed to assign task' };
    }
  }

  /**
   * Create a coordinated execution plan
   * @param {string} masterTaskId - Master task ID
   * @param {Array} workerTaskIds - Worker task IDs
   * @param {string} coordinatorAgentId - Coordinator agent ID
   * @returns {Object} Coordination plan
   */
  async createCoordinatedExecution(
    masterTaskId,
    workerTaskIds,
    coordinatorAgentId,
  ) {
    const todoData = await this.readTodoFast();
    const masterTask = todoData.tasks.find((t) => t.id === masterTaskId);

    if (!masterTask) {
      return { success: false, reason: 'Master task not found' };
    }

    // Update master task for coordination
    masterTask.parallel_execution = {
      canParallelize: true,
      parallelWith: workerTaskIds,
      coordinatorTask: coordinatorAgentId,
      role: 'master',
      syncPoints: [],
      createdAt: new Date().toISOString(),
    };

    // Update worker tasks
    for (const workerTaskId of workerTaskIds) {
      const workerTask = todoData.tasks.find((t) => t.id === workerTaskId);
      if (workerTask) {
        workerTask.parallel_execution = {
          canParallelize: true,
          parallelWith: [
            masterTaskId,
            ...workerTaskIds.filter((id) => id !== workerTaskId),
          ],
          coordinatorTask: coordinatorAgentId,
          role: 'worker',
          masterTask: masterTaskId,
          syncPoints: [],
          createdAt: new Date().toISOString(),
        };
      }
    }

    await this.writeTodo(todoData);

    return {
      success: true,
      coordinationPlan: {
        masterId: masterTaskId,
        workerIds: workerTaskIds,
        coordinatorId: coordinatorAgentId,
        totalTasks: 1 + workerTaskIds.length,
        createdAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Create parallel execution plan for independent tasks
   * @param {Array} taskIds - Task IDs to execute in parallel
   * @param {Array} agentIds - Agent IDs to assign tasks to
   * @param {Array} syncPoints - Synchronization checkpoints
   * @returns {Object} Parallel execution plan
   */
  async createParallelExecution(taskIds, agentIds, syncPoints = []) {
    const todoData = await this.readTodoFast();
    const tasks = taskIds
      .map((id) => todoData.tasks.find((t) => t.id === id))
      .filter((t) => t);

    if (tasks.length !== taskIds.length) {
      return { success: false, reason: 'Some tasks not found' };
    }

    if (agentIds.length < taskIds.length) {
      return {
        success: false,
        reason: 'Not enough agents for parallel execution',
      };
    }

    // Assign tasks to agents
    for (let i = 0; i < tasks.length; i++) {
      // eslint-disable-next-line security/detect-object-injection -- i is loop index within bounds check, safe array access
      const task = tasks[i];
      // eslint-disable-next-line security/detect-object-injection -- i is loop index within bounds check, safe array access
      const agentId = agentIds[i];

      task.parallel_execution = {
        canParallelize: true,
        parallelWith: taskIds.filter((id) => id !== task.id),
        coordinatorTask: null,
        role: 'parallel',
        syncPoints: syncPoints,
        assignedAgent: agentId,
        createdAt: new Date().toISOString(),
      };

      // eslint-disable-next-line no-await-in-loop -- Sequential assignment required for coordination and state consistency
      await this.assignTaskToAgent(task.id, agentId, 'primary');
    }

    await this.writeTodo(todoData);

    return {
      success: true,
      parallelPlan: {
        taskIds: taskIds,
        agentIds: agentIds,
        syncPoints: syncPoints,
        estimatedDuration: Math.max(
          ...tasks.map((t) => this._parseEstimate(t.estimate || '1 hour')),
        ),
        createdAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Calculate task-agent compatibility score
   * @param {Object} task - Task object
   * @param {Array} agentCapabilityArrays - Array of agent capability arrays
   * @returns {number} Compatibility score
   */
  _calculateTaskAgentScore(task, agentCapabilityArrays) {
    let maxScore = 0;

    for (const capabilities of agentCapabilityArrays) {
      let score = 0;

      // Mode compatibility
      if (capabilities.includes('mode:' + task.mode?.toLowerCase())) {
        score += 50;
      }

      // Required capabilities
      if (task.required_capabilities) {
        const matches = task.required_capabilities.filter((cap) =>
          capabilities.includes(cap),
        ).length;
        score += matches * 10;
      }

      // Priority weighting
      if (task.priority === 'high') {
        score += 20;
      }
      if (task.priority === 'medium') {
        score += 10;
      }

      maxScore = Math.max(maxScore, score);
    }

    return maxScore;
  }

  /**
   * Parse time estimate string to minutes
   * @param {string} estimate - Estimate string (e.g., "2 hours", "30 minutes")
   * @returns {number} Estimate in minutes
   */
  _parseEstimate(estimate) {
    if (!estimate || typeof estimate !== 'string') {
      return 60;
    }

    const hourMatch = estimate.match(/(\d+)\s*h/i);
    const minuteMatch = estimate.match(/(\d+)\s*m/i);

    let minutes = 0;
    if (hourMatch) {
      minutes += parseInt(hourMatch[1]) * 60;
    }
    if (minuteMatch) {
      minutes += parseInt(minuteMatch[1]);
    }

    return minutes || 60; // Default to 1 hour
  }

  /**
   * Get multi-agent statistics
   * @returns {Object} Multi-agent statistics
   */
  async getMultiAgentStatistics() {
    const todoData = await this.readTodoFast();

    const stats = {
      totalTasks: todoData.tasks.length,
      assignedTasks: 0,
      unassignedTasks: 0,
      parallelTasks: 0,
      coordinatedTasks: 0,
      agentAssignments: {},
      parallelGroups: 0,
    };

    const parallelGroups = new Set();

    todoData.tasks.forEach((task) => {
      if (task.assigned_agent) {
        stats.assignedTasks++;
        stats.agentAssignments[task.assigned_agent] =
          (stats.agentAssignments[task.assigned_agent] || 0) + 1;
      } else {
        stats.unassignedTasks++;
      }

      if (task.parallel_execution?.canParallelize) {
        stats.parallelTasks++;

        if (task.parallel_execution.coordinatorTask) {
          stats.coordinatedTasks++;
        }

        // Track parallel groups
        const groupKey = [task.id, ...task.parallel_execution.parallelWith]
          .sort()
          .join(':');
        parallelGroups.add(groupKey);
      }
    });

    stats.parallelGroups = parallelGroups.size;

    return stats;
  }

  /**
   * Cleanup method to release resources and prevent hanging
   */
  cleanup() {
    if (this.lockManager && typeof this.lockManager.cleanup === 'function') {
      this.lockManager.cleanup();
    }
  }

  // ============================================================================
  // TASK REPETITION DETECTION AND INTERVENTION SYSTEM
  // ============================================================================

  /**
   * Track when an agent accesses a task (for repetition detection)
   * @param {string} taskId - Task ID
   * @param {string} agentId - Agent ID
   */
  async trackTaskAccess(taskId, agentId) {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);

    if (!task) {
      return;
    }

    // Initialize tracking data
    if (!task.access_history) {
      task.access_history = [];
    }

    const currentTime = new Date().toISOString();
    task.access_history.push({
      agentId: agentId,
      timestamp: currentTime,
      action: 'accessed',
    });

    // Keep only last 20 access records to prevent bloat
    if (task.access_history.length > 20) {
      task.access_history = task.access_history.slice(-20);
    }

    await this.writeTodo(todoData);
  }

  /**
   * Check if a task is being repeated too many times (stuck behavior)
   * @param {string} taskId - Task ID to check
   * @param {string} agentId - Current agent ID
   * @returns {Object} Repetition analysis
   */
  async checkTaskRepetition(taskId, agentId) {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);

    if (!task || !task.access_history) {
      return { isStuck: false, count: 0, reason: 'no_history' };
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Count recent accesses by this agent
    const recentAccesses = task.access_history.filter(
      (access) =>
        access.agentId === agentId && new Date(access.timestamp) > oneHourAgo,
    );

    // Check for repetition patterns
    const repetitionThreshold = 3; // Consider stuck after 3+ accesses in an hour

    if (recentAccesses.length >= repetitionThreshold) {
      // Additional check: has the task status changed during these accesses?
      const statusChanges = task.access_history.filter(
        (access) =>
          access.action === 'status_change' &&
          new Date(access.timestamp) > oneHourAgo,
      );

      // If no status changes but many accesses, likely stuck
      if (statusChanges.length === 0) {
        return {
          isStuck: true,
          count: recentAccesses.length,
          reason: 'high_frequency_no_progress',
          lastAccess: recentAccesses[recentAccesses.length - 1].timestamp,
          timeSpan:
            now.getTime() - new Date(recentAccesses[0].timestamp).getTime(),
        };
      }
    }

    return {
      isStuck: false,
      count: recentAccesses.length,
      reason: 'normal_activity',
    };
  }

  /**
   * Generate specialized instructions for stuck tasks
   * @param {Object} task - The stuck task
   * @param {Object} repetitionInfo - Repetition analysis results
   * @returns {string} Specialized instructions
   */
  generateStuckTaskInstructions(task, repetitionInfo) {
    let instructions = '';

    // If repeated 2-3+ times, provide completion instructions at the top
    if (repetitionInfo.count >= 2) {
      instructions += `## 🔧 TASK COMPLETION COMMAND (Task repeated ${repetitionInfo.count} times)\n\n`;
      instructions += `**If you're stuck or need to move on, mark this task as completed:**\n`;
      instructions += `\`\`\`bash\n`;
      instructions += `node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.updateTaskStatus('${task.id}', 'completed').then(() => console.log('Task marked as completed'));"\n`;
      instructions += `\`\`\`\n\n`;
      instructions += `---\n\n`;
    }

    instructions += `**Continue what you are doing** - Stay focused on your current task until completion.\n\n`;
    instructions += `**Current Task: ${task.title}**\n\n`;
    instructions += `**Description:** ${task.description}\n\n`;
    instructions += `**Mode:** ${task.mode}\n`;
    instructions += `**Priority:** ${task.priority || 'medium'}\n`;
    instructions += `**Status:** ${task.status}\n`;
    instructions += `**Repetition Count:** ${repetitionInfo.count} times recently\n\n`;

    if (task.success_criteria && task.success_criteria.length > 0) {
      instructions += `**Success Criteria (required for task completion):**\n`;
      task.success_criteria.forEach((criteria, index) => {
        instructions += `${index + 1}. ${criteria}\n`;
      });
      instructions += '\n';
    }

    if (task.important_files && task.important_files.length > 0) {
      instructions += `**Important Files:**\n`;
      task.important_files.forEach((file) => {
        instructions += `- ${file}\n`;
      });
      instructions += '\n';
    }

    if (task.dependencies && task.dependencies.length > 0) {
      instructions += `**Dependencies:** ${task.dependencies.length} task(s)\n\n`;
    }

    if (task.assigned_agents && task.assigned_agents.length > 1) {
      instructions += `**Collaborative Task:** ${task.assigned_agents.length} agents assigned\n\n`;
    }

    instructions += `**KEEP WORKING** - Continue with this task until all success criteria are met and you mark it as completed.\n\n`;

    return instructions;
  }

  /**
   * Record a task intervention for tracking and analytics
   * @param {string} taskId - Task ID
   * @param {string} agentId - Agent ID
   * @param {string} interventionType - Type of intervention
   */
  async recordTaskIntervention(taskId, agentId, interventionType) {
    const todoData = await this.readTodoFast();
    const task = todoData.tasks.find((t) => t.id === taskId);

    if (!task) {
      return;
    }

    // Initialize intervention history
    if (!task.interventions) {
      task.interventions = [];
    }

    const intervention = {
      agentId: agentId,
      type: interventionType,
      timestamp: new Date().toISOString(),
      details: {
        taskStatus: task.status,
        accessCount: task.access_history ? task.access_history.length : 0,
      },
    };

    task.interventions.push(intervention);

    // Also add to access history for tracking
    if (!task.access_history) {
      task.access_history = [];
    }

    task.access_history.push({
      agentId: agentId,
      timestamp: intervention.timestamp,
      action: 'intervention_' + interventionType,
    });

    await this.writeTodo(todoData);
  }

  /**
   * Get repetition statistics for monitoring
   * @returns {Object} Statistics about task repetitions and interventions
   */
  async getRepetitionStatistics() {
    const todoData = await this.readTodoFast();

    const stats = {
      totalTasks: todoData.tasks.length,
      tasksWithAccessHistory: 0,
      tasksWithInterventions: 0,
      totalInterventions: 0,
      mostAccessedTasks: [],
      recentInterventions: [],
    };

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    todoData.tasks.forEach((task) => {
      if (task.access_history && task.access_history.length > 0) {
        stats.tasksWithAccessHistory++;

        // Track most accessed tasks
        stats.mostAccessedTasks.push({
          id: task.id,
          title: task.title,
          accessCount: task.access_history.length,
          status: task.status,
        });
      }

      if (task.interventions && task.interventions.length > 0) {
        stats.tasksWithInterventions++;
        stats.totalInterventions += task.interventions.length;

        // Recent interventions
        const recentTaskInterventions = task.interventions.filter(
          (intervention) => new Date(intervention.timestamp) > oneDayAgo,
        );

        stats.recentInterventions.push(
          ...recentTaskInterventions.map((intervention) => ({
            taskId: task.id,
            taskTitle: task.title,
            ...intervention,
          })),
        );
      }
    });

    // Sort most accessed tasks
    stats.mostAccessedTasks.sort((a, b) => b.accessCount - a.accessCount);
    stats.mostAccessedTasks = stats.mostAccessedTasks.slice(0, 10);

    // Sort recent interventions by timestamp
    stats.recentInterventions.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );

    return stats;
  }

  /**
   * Clean up old tracking data to prevent bloat
   * @param {number} daysToKeep - Number of days of history to keep (default: 7)
   */
  async cleanupTrackingData(daysToKeep = 7) {
    const todoData = await this.readTodoFast();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let cleaned = 0;

    todoData.tasks.forEach((task) => {
      // Clean access history
      if (task.access_history) {
        const originalLength = task.access_history.length;
        task.access_history = task.access_history.filter(
          (access) => new Date(access.timestamp) > cutoffDate,
        );
        cleaned += originalLength - task.access_history.length;
      }

      // Clean intervention history (keep less aggressive cleanup for interventions)
      if (task.interventions) {
        const cutoffForInterventions = new Date();
        cutoffForInterventions.setDate(
          cutoffForInterventions.getDate() - daysToKeep * 2,
        );

        const originalLength = task.interventions.length;
        task.interventions = task.interventions.filter(
          (intervention) =>
            new Date(intervention.timestamp) > cutoffForInterventions,
        );
        cleaned += originalLength - task.interventions.length;
      }
    });

    if (cleaned > 0) {
      await this.writeTodo(todoData);
    }

    return { cleanedRecords: cleaned };
  }

  /**
   * Generate completion instructions including linting recommendations
   * @param {Object} task - The completed task
   * @returns {Object} Completion instructions with linting commands
   */
  _generateCompletionInstructions(task) {
    const instructions = {
      taskId: task.id,
      taskTitle: task.title,
      completedAt: new Date().toISOString(),
      qualityChecks: [],
      lintingCommands: [],
      testingCommands: [],
      summary: [],
    };

    // Generate linting commands based on important files
    if (task.important_files && task.important_files.length > 0) {
      const fileExtensions = this._getFileExtensions(task.important_files);
      const lintCommands = this._generateLintCommands(
        fileExtensions,
        task.important_files,
      );
      instructions.lintingCommands.push(...lintCommands);
      instructions.summary.push(
        `Run linting on ${task.important_files.length} file(s)`,
      );
    }

    // Add general project linting if no specific files
    if (instructions.lintingCommands.length === 0) {
      // Detect project type and add appropriate linting commands
      const projectType = this.detectProjectType();

      if (projectType === 'python' || projectType === 'mixed') {
        instructions.lintingCommands.push({
          command: 'ruff check . --fix && black . && isort .',
          description: 'Run Python linting',
          scope: 'python',
        });
      }

      if (
        projectType === 'typescript' ||
        projectType === 'javascript' ||
        projectType === 'mixed'
      ) {
        instructions.lintingCommands.push({
          command: 'eslint . --fix && prettier --write .',
          description: 'Run TypeScript/JavaScript linting',
          scope: 'js/ts',
        });
      }

      // Add project-specific command as last resort
      if (projectType === 'unknown') {
        instructions.lintingCommands.push({
          command:
            'ruff check . --fix 2>/dev/null || eslint . --fix 2>/dev/null || make lint 2>/dev/null || echo "No linting tools detected"',
          description: 'Try available linting tools',
          scope: 'fallback',
        });
      }

      instructions.summary.push('Run appropriate project linting');
    }

    // Add testing commands if task has test-related success criteria
    if (task.success_criteria) {
      const testCriteria = task.success_criteria.filter(
        (c) => c.includes('test') || c.includes('coverage'),
      );
      if (testCriteria.length > 0) {
        const projectType = this.detectProjectType();

        if (projectType === 'python' || projectType === 'mixed') {
          instructions.testingCommands.push({
            command: 'pytest',
            description: 'Run Python tests to verify task completion',
            scope: 'python',
          });
        }

        if (
          projectType === 'typescript' ||
          projectType === 'javascript' ||
          projectType === 'mixed'
        ) {
          instructions.testingCommands.push({
            command: 'npm test',
            description:
              'Run JavaScript/TypeScript tests to verify task completion',
            scope: 'js/ts',
          });
        }

        if (projectType === 'unknown') {
          instructions.testingCommands.push({
            command:
              'pytest 2>/dev/null || npm test 2>/dev/null || make test 2>/dev/null',
            description: 'Try available testing tools',
            scope: 'fallback',
          });
        }

        instructions.summary.push('Run tests to verify completion');
      }
    }

    // Add quality gate execution if task has success criteria
    if (task.success_criteria && task.success_criteria.length > 0) {
      instructions.qualityChecks.push({
        command: `node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.executeQualityGates('${task.id}').then(result => console.log(JSON.stringify(result, null, 2)));"`,
        description: 'Execute all quality gates for this task',
        scope: 'task-specific',
      });
      instructions.summary.push('Execute quality gates');
    }

    return instructions;
  }

  /**
   * Check for recently completed tasks that need linter feedback
   * @returns {Object|null} Completion feedback object or null
   */
  async checkForCompletedTasksFeedback() {
    const todoData = await this.readTodoFast();

    // Check for tasks that need linter feedback
    const taskNeedingFeedback = todoData.tasks.find(
      (task) => task.needs_linter_feedback && !task.linter_feedback_generated,
    );

    if (taskNeedingFeedback) {
      // Mark feedback as generated to prevent repeated feedback
      taskNeedingFeedback.linter_feedback_generated = true;
      taskNeedingFeedback.linter_feedback_timestamp = new Date().toISOString();
      await this.writeTodo(todoData);

      return {
        shouldProvideFeedback: true,
        taskId: taskNeedingFeedback.id,
        taskTitle: taskNeedingFeedback.title,
        completionInstructions: taskNeedingFeedback.completion_instructions,
        importantFiles: taskNeedingFeedback.important_files || [],
        taskMode: taskNeedingFeedback.mode,
      };
    }

    return null;
  }

  /**
   * Detect project type based on working directory and file patterns
   * @param {string} workingDir - Working directory path
   * @returns {string} Project type: 'python', 'typescript', 'javascript', 'mixed', or 'unknown'
   */
  detectProjectType(workingDir = process.cwd()) {
    try {
      // Check for Python indicators
      const pythonIndicators = [
        'pyproject.toml',
        'requirements.txt',
        'setup.py',
        'Pipfile',
        'poetry.lock',
        'requirements-dev.txt',
      ];

      // Check for TypeScript/JavaScript indicators
      const jsIndicators = [
        'package.json',
        'tsconfig.json',
        'yarn.lock',
        'package-lock.json',
        'pnpm-lock.yaml',
      ];

      const hasPythonFiles = pythonIndicators.some((file) => {
        try {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- file is from predefined pythonIndicators array, workingDir is process.cwd()
          return fs.existsSync(_path.join(workingDir, file));
        } catch {
          return false;
        }
      });

      const hasJsFiles = jsIndicators.some((file) => {
        try {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- file is from predefined jsIndicators array, workingDir is process.cwd()
          return fs.existsSync(_path.join(workingDir, file));
        } catch {
          return false;
        }
      });

      // Check for TypeScript specific files
      const hasTypeScript = (() => {
        try {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed literal 'tsconfig.json', workingDir is process.cwd()
          return fs.existsSync(_path.join(workingDir, 'tsconfig.json'));
        } catch {
          return false;
        }
      })();

      // Determine project type
      if (hasPythonFiles && hasJsFiles) {
        return 'mixed';
      } else if (hasPythonFiles) {
        return 'python';
      } else if (hasTypeScript) {
        return 'typescript';
      } else if (hasJsFiles) {
        return 'javascript';
      } else {
        return 'unknown';
      }
    } catch (error) {
      logger.warn('Error detecting project type:', error.message);
      return 'unknown';
    }
  }

  /**
   * Generate linter feedback message for completed task
   * @param {Object} completionFeedback - Completion feedback object
   * @returns {string} Formatted linter feedback message
   */
  generateLinterFeedback(completionFeedback) {
    const { taskTitle, importantFiles, taskMode } = completionFeedback;

    let feedback = `✅ Task Completed - Code Quality Check Required\n\n`;
    feedback += `Task "${taskTitle}" has been completed successfully.\n\n`;
    feedback += `Please run linting and formatting checks on the files you worked on to ensure code quality standards are maintained.\n\n`;

    feedback += `**Recommended Quality Checks:**\n\n`;

    // Detect project type if no specific files are detected
    const workingDir = _path.dirname(this.todoPath);
    const projectType = this.detectProjectType(workingDir);

    // Python-specific linting if Python files were involved
    const pythonFiles = importantFiles.filter((f) => f.endsWith('.py'));
    const hasPythonContext =
      pythonFiles.length > 0 ||
      taskMode === 'python' ||
      importantFiles.some((f) => f.includes('python')) ||
      projectType === 'python' ||
      projectType === 'mixed';

    if (hasPythonContext) {
      feedback += `**🐍 Python Project - Recommended Commands:**\n`;
      feedback += `\`\`\`bash\n`;
      feedback += `ruff check . --fix                           # Check and fix Python linting issues\n`;
      feedback += `black .                                     # Format Python code\n`;
      feedback += `isort .                                     # Sort Python imports\n`;
      feedback += `mypy . --ignore-missing-imports             # Type check Python files\n`;
      feedback += `pytest --tb=short                           # Run Python tests\n`;
      if (pythonFiles.length > 0) {
        feedback += `# For specific files:\n`;
        pythonFiles.forEach((file) => {
          feedback += `ruff check ${file} --fix              # Lint ${file}\n`;
          feedback += `black ${file}                        # Format ${file}\n`;
          feedback += `mypy ${file} --ignore-missing-imports # Type check ${file}\n`;
        });
      }
      feedback += `\`\`\`\n\n`;
    }

    // TypeScript/JavaScript-specific linting
    const jsFiles = importantFiles.filter((f) => /\.(js|ts|jsx|tsx)$/.test(f));
    const hasJsContext =
      jsFiles.length > 0 ||
      taskMode === 'typescript' ||
      taskMode === 'javascript' ||
      importantFiles.some((f) => f.includes('node') || f.includes('npm')) ||
      projectType === 'typescript' ||
      projectType === 'javascript' ||
      (projectType === 'mixed' && !hasPythonContext);

    if (hasJsContext && projectType !== 'python') {
      feedback += `**⚡ JavaScript/TypeScript Project - Recommended Commands:**\n`;
      feedback += `\`\`\`bash\n`;
      feedback += `eslint . --max-warnings 0 --fix           # Check and fix JS/TS linting issues\n`;
      feedback += `prettier --write .                         # Format JS/TS code\n`;
      if (projectType === 'typescript') {
        feedback += `tsc --noEmit --strict                      # Type check TypeScript files\n`;
      }
      feedback += `npm test                                   # Run JS/TS tests\n`;
      if (jsFiles.length > 0) {
        feedback += `# For specific files:\n`;
        jsFiles.forEach((file) => {
          feedback += `eslint ${file} --fix                 # Lint ${file}\n`;
          feedback += `prettier --write ${file}             # Format ${file}\n`;
        });
      }
      feedback += `\`\`\`\n\n`;
    }

    // Project type fallback when specific files not detected
    if (!hasPythonContext && !hasJsContext) {
      feedback += `**🔍 Project Type: ${projectType.charAt(0).toUpperCase() + projectType.slice(1)}**\n\n`;

      if (projectType === 'python') {
        feedback += `**🐍 Python Project - Recommended Commands:**\n`;
        feedback += `\`\`\`bash\n`;
        feedback += `ruff check . --fix                       # Check and fix Python linting issues\n`;
        feedback += `black .                                 # Format Python code\n`;
        feedback += `isort .                                 # Sort Python imports\n`;
        feedback += `mypy . --ignore-missing-imports         # Type check Python files\n`;
        feedback += `pytest --tb=short                       # Run Python tests\n`;
        feedback += `\`\`\`\n\n`;
      } else if (projectType === 'typescript') {
        feedback += `**⚡ TypeScript Project - Recommended Commands:**\n`;
        feedback += `\`\`\`bash\n`;
        feedback += `eslint . --max-warnings 0 --fix         # Check and fix TypeScript linting issues\n`;
        feedback += `prettier --write .                       # Format TypeScript code\n`;
        feedback += `tsc --noEmit --strict                    # Type check TypeScript files\n`;
        feedback += `npm test                                 # Run TypeScript tests\n`;
        feedback += `\`\`\`\n\n`;
      } else if (projectType === 'javascript') {
        feedback += `**⚡ JavaScript Project - Recommended Commands:**\n`;
        feedback += `\`\`\`bash\n`;
        feedback += `eslint . --max-warnings 0 --fix         # Check and fix JavaScript linting issues\n`;
        feedback += `prettier --write .                       # Format JavaScript code\n`;
        feedback += `npm test                                 # Run JavaScript tests\n`;
        feedback += `\`\`\`\n\n`;
      } else if (projectType === 'mixed') {
        feedback += `**🔀 Mixed Project - Recommended Commands:**\n`;
        feedback += `\`\`\`bash\n`;
        feedback += `# Python tools:\n`;
        feedback += `ruff check . --fix && black . && isort . # Python linting\n`;
        feedback += `mypy . --ignore-missing-imports         # Python type checking\n`;
        feedback += `pytest --tb=short                       # Python tests\n\n`;
        feedback += `# JavaScript/TypeScript tools:\n`;
        feedback += `eslint . --fix && prettier --write .     # JS/TS linting\n`;
        feedback += `npm test                                 # JS/TS tests\n`;
        feedback += `\`\`\`\n\n`;
      } else {
        feedback += `**🔧 General Project - Try Available Tools:**\n`;
        feedback += `\`\`\`bash\n`;
        feedback += `# Try Python tools (if available):\n`;
        feedback += `ruff check . --fix 2>/dev/null || echo "Python tools not available"\n`;
        feedback += `black . 2>/dev/null || echo "Black not available"\n\n`;
        feedback += `# Try JavaScript/TypeScript tools (if available):\n`;
        feedback += `eslint . --fix 2>/dev/null || echo "ESLint not available"\n`;
        feedback += `prettier --write . 2>/dev/null || echo "Prettier not available"\n\n`;
        feedback += `# Try project-specific tools:\n`;
        feedback += `make lint 2>/dev/null || ./lint.sh 2>/dev/null || echo "No custom lint script found"\n`;
        feedback += `\`\`\`\n\n`;
      }
    }

    feedback += `**📋 Quality Standards:**\n`;
    feedback += `- Zero linting errors should be maintained\n`;
    feedback += `- Code formatting should be consistent\n`;
    feedback += `- Type errors should be resolved\n`;
    feedback += `- All linting tools should pass\n`;
    feedback += `- Create tasks for any issues that require additional work\n\n`;

    feedback += `**💡 If you encounter linting errors:**\n`;
    feedback += `1. Review the specific issues reported\n`;
    feedback += `2. Fix straightforward issues directly\n`;
    feedback += `3. Create tasks for complex issues that need investigation\n`;
    feedback += `4. Document any necessary configuration changes\n\n`;

    feedback += `Running these checks helps maintain code quality and consistency across the project.\n`;

    return feedback;
  }

  /**
   * Clean up stale agents and move their tasks back to tasks array
   * Syncs with AgentRegistry for proper agent reuse
   */
  async cleanupStaleAgents() {
    const todoData = await this.readTodoFast();
    const now = Date.now();
    const staleTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds

    if (!todoData.agents) {
      return; // No agents to clean up
    }

    const staleAgents = [];
    const tasksToRecover = [];

    // Sync with AgentRegistry to get authoritative agent status
    const registryStats = this.agentRegistry.getRegistryStats();
    const activeRegistryAgents = this.agentRegistry.getActiveAgents();
    const activeRegistryAgentIds = new Set(
      activeRegistryAgents.map((a) => a.agentId),
    );

    // Find stale agents (check both TODO.json heartbeat and AgentRegistry status)
    Object.entries(todoData.agents).forEach(([agentId, agent]) => {
      const lastHeartbeat = new Date(agent.lastHeartbeat).getTime();
      const timeSinceHeartbeat = now - lastHeartbeat;
      const isStaleByHeartbeat = timeSinceHeartbeat > staleTimeout;
      const isInactiveInRegistry = !activeRegistryAgentIds.has(agentId);

      if (
        (isStaleByHeartbeat || isInactiveInRegistry) &&
        agent.status === 'active'
      ) {
        staleAgents.push({ agentId, agent, timeSinceHeartbeat });

        // Collect tasks assigned to this stale agent
        if (agent.assignedTasks && agent.assignedTasks.length > 0) {
          agent.assignedTasks.forEach((taskId) => {
            // Find the task in current tasks array
            const existingTaskIndex = todoData.tasks.findIndex(
              (t) => t.id === taskId,
            );
            if (existingTaskIndex === -1) {
              // Task not in tasks array - need to recover it
              tasksToRecover.push({
                taskId,
                fromAgent: agentId,
                agentHeartbeat: agent.lastHeartbeat,
              });
            } else {
              // Task exists in tasks array - unassign it from agent completely
              // eslint-disable-next-line security/detect-object-injection -- safe array access with validated index from findIndex() result
              const task = todoData.tasks[existingTaskIndex];

              // Clear all agent assignments
              if (task.assigned_agents) {
                task.assigned_agents = task.assigned_agents.filter(
                  (id) => id !== agentId,
                );
                if (task.assigned_agents.length === 0) {
                  delete task.assigned_agents;
                }
              }

              // Clear single agent assignment if it matches
              if (task.assigned_agent === agentId) {
                delete task.assigned_agent;
              }

              // Clear claimed_by if it matches
              if (task.claimed_by === agentId) {
                delete task.claimed_by;
              }

              // Revert to pending if no agents left and was in progress
              if (
                task.status === 'in_progress' &&
                !task.assigned_agent &&
                (!task.assigned_agents || task.assigned_agents.length === 0)
              ) {
                task.status = 'pending';
                task.reverted_at = new Date().toISOString();
                task.revert_reason = `Stale agent ${agentId} removed`;
              }
            }
          });
        }

        // Mark agent as inactive
        agent.status = 'inactive';
        agent.inactiveSince = new Date().toISOString();
        agent.assignedTasks = [];
        agent.workload = 0;
      }
    });

    if (staleAgents.length > 0) {
      logger.info(
        `Cleaned up ${staleAgents.length} stale agents, recovered ${tasksToRecover.length} tasks`,
      );
      logger.info(
        `AgentRegistry status: ${registryStats.activeAgents} active, ${registryStats.inactiveAgents} inactive`,
      );

      // Log cleanup details
      staleAgents.forEach(({ agentId, timeSinceHeartbeat }) => {
        const minutesStale = Math.floor(timeSinceHeartbeat / (60 * 1000));
        logger.debug(`Agent ${agentId} was stale for ${minutesStale} minutes`);
      });

      // Save the updated TODO data
      await this.writeTodo(todoData);
    }
  }

  /**
   * Get file extensions from important files list
   * @param {Array} files - List of file paths
   * @returns {Set} Set of unique file extensions
   */
  _getFileExtensions(files) {
    const extensions = new Set();
    files.forEach((file) => {
      const ext = file.split('.').pop()?.toLowerCase();
      if (ext && ext !== file) {
        // Only if it's actually an extension
        extensions.add(ext);
      }
    });
    return extensions;
  }

  /**
   * Generate linting commands based on file types
   * @param {Set} extensions - File extensions
   * @param {Array} files - List of specific files
   * @returns {Array} Array of linting command objects
   */
  _generateLintCommands(extensions, files) {
    const commands = [];

    // Python files
    if (extensions.has('py')) {
      const pyFiles = files.filter((f) => f.endsWith('.py'));
      commands.push({
        command: 'ruff check . --fix',
        description: 'Run Ruff linting on Python files',
        scope: 'python',
        files: pyFiles,
      });
      commands.push({
        command: 'black .',
        description: 'Format Python code with Black',
        scope: 'python',
        files: pyFiles,
      });
      commands.push({
        command: 'isort .',
        description: 'Sort Python imports with isort',
        scope: 'python',
        files: pyFiles,
      });
      commands.push({
        command: 'mypy .',
        description: 'Type check Python files with mypy',
        scope: 'python',
        files: pyFiles,
      });

      // If specific files, add file-specific linting
      if (pyFiles.length > 0 && pyFiles.length <= 5) {
        pyFiles.forEach((file) => {
          commands.push({
            command: `ruff check ${file} --fix`,
            description: `Run Ruff on ${file}`,
            scope: 'file-specific',
            files: [file],
          });
        });
      }
    }

    // JavaScript/TypeScript files
    if (
      extensions.has('js') ||
      extensions.has('ts') ||
      extensions.has('jsx') ||
      extensions.has('tsx')
    ) {
      commands.push({
        command: 'eslint . --max-warnings 0 --fix',
        description: 'Run ESLint on JavaScript/TypeScript files',
        scope: 'js/ts',
        files: files.filter((f) => /\.(js|ts|jsx|tsx)$/i.test(f)),
      });
      commands.push({
        command: 'prettier --write .',
        description: 'Format JavaScript/TypeScript code with Prettier',
        scope: 'js/ts',
        files: files.filter((f) => /\.(js|ts|jsx|tsx)$/i.test(f)),
      });
      commands.push({
        command: 'tsc --noEmit --strict',
        description: 'Type check TypeScript files',
        scope: 'js/ts',
        files: files.filter((f) => /\.tsx?$/i.test(f)),
      });

      // If specific files, add file-specific linting
      const jsFiles = files.filter((f) => /\.(js|ts|jsx|tsx)$/i.test(f));
      if (jsFiles.length > 0 && jsFiles.length <= 5) {
        commands.push({
          command: `eslint ${jsFiles.join(' ')} --fix`,
          description: 'Run ESLint on specific files worked on',
          scope: 'file-specific',
          files: jsFiles,
        });
      }
    }

    // Go files
    if (extensions.has('go')) {
      commands.push({
        command: 'go fmt ./... && go vet ./...',
        description: 'Run Go formatting and vetting',
        scope: 'go',
        files: files.filter((f) => f.endsWith('.go')),
      });
    }

    // CSS/SCSS files
    if (
      extensions.has('css') ||
      extensions.has('scss') ||
      extensions.has('sass')
    ) {
      commands.push({
        command: 'npm run lint:css',
        description: 'Run CSS/SCSS linting',
        scope: 'css',
        files: files.filter((f) => /\.(css|scss|sass)$/i.test(f)),
      });
    }

    return commands;
  }

  /**
   * Get completion instructions for a specific task
   * @param {string} taskId - Task ID
   * @returns {Object|null} Completion instructions or null if not found
   */
  async getCompletionInstructions(taskId) {
    // First check active tasks
    const todoData = await this.readTodoFast();
    const activeTask = todoData.tasks.find((t) => t.id === taskId);

    if (activeTask && activeTask.completion_instructions) {
      return activeTask.completion_instructions;
    }

    // Then check completed tasks in DONE.json
    const completedTasks = await this.getCompletedTasks({ taskId });
    if (
      completedTasks.length > 0 &&
      completedTasks[0].completion_instructions
    ) {
      return completedTasks[0].completion_instructions;
    }

    return null;
  }

  /**
   * Display formatted completion instructions for a task
   * @param {string} taskId - Task ID
   * @returns {string} Formatted instructions text
   */
  async displayCompletionInstructions(taskId) {
    const instructions = await this.getCompletionInstructions(taskId);

    if (!instructions) {
      return `No completion instructions found for task ${taskId}`;
    }

    let output = `\n=== COMPLETION INSTRUCTIONS ===\n`;
    output += `Task: ${instructions.taskTitle}\n`;
    output += `Completed: ${instructions.completedAt}\n`;
    output += `\n📋 SUMMARY:\n`;
    instructions.summary.forEach((item) => {
      output += `  • ${item}\n`;
    });

    if (instructions.lintingCommands.length > 0) {
      output += `\n🔍 LINTING COMMANDS:\n`;
      instructions.lintingCommands.forEach((cmd) => {
        output += `  • ${cmd.description}\n`;
        output += `    $ ${cmd.command}\n`;
        if (cmd.files && cmd.files.length > 0) {
          output += `    Files: ${cmd.files.join(', ')}\n`;
        }
        output += '\n';
      });
    }

    if (instructions.testingCommands.length > 0) {
      output += `🧪 TESTING COMMANDS:\n`;
      instructions.testingCommands.forEach((cmd) => {
        output += `  • ${cmd.description}\n`;
        output += `    $ ${cmd.command}\n\n`;
      });
    }

    if (instructions.qualityChecks.length > 0) {
      output += `✅ QUALITY CHECKS:\n`;
      instructions.qualityChecks.forEach((cmd) => {
        output += `  • ${cmd.description}\n`;
        output += `    $ ${cmd.command}\n\n`;
      });
    }

    return output;
  }

  // ==========================================
  // AUTO-SORTING FUNCTIONALITY
  // ==========================================

  /**
   * Get numeric value for priority to enable sorting
   * @param {string} priority - Priority level (high, medium, low)
   * @returns {number} Numeric priority value
   */
  _getPriorityValue(priority) {
    const settings = this._getAutoSortSettings();
    const priorityValues = settings.priority_values || {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    // eslint-disable-next-line security/detect-object-injection -- safe access to static priority mapping with validated keys
    return priorityValues[priority] || priorityValues.medium || 2;
  }

  /**
   * Check if auto-sorting is enabled
   * @param {Object} todoData - TODO data object
   * @returns {boolean} True if auto-sorting is enabled
   */
  _isAutoSortEnabled(todoData) {
    if (!todoData.settings) {
      return true; // Default to enabled
    }
    return todoData.settings.auto_sort_enabled !== false;
  }

  /**
   * Get auto-sort settings with defaults
   * @returns {Object} Auto-sort settings
   */
  _getAutoSortSettings() {
    return {
      auto_sort_enabled: true,
      sort_criteria: {
        primary: 'category',
        secondary: 'created_at',
      },
      priority_values: {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      },
      category_enabled: true,
      category_ranks: {
        error: 1,
        feature: 2,
        subtask: 3,
        test: 4,
        quality: 5,
      },
    };
  }

  /**
   * Initialize settings in TODO.json if not present
   * @param {Object} todoData - TODO data object
   * @returns {Object} Updated TODO data with settings
   */
  _initializeSettings(todoData) {
    if (!todoData.settings) {
      todoData.settings = this._getAutoSortSettings();
    } else {
      // Merge with defaults for missing properties
      const defaults = this._getAutoSortSettings();
      todoData.settings = {
        ...defaults,
        ...todoData.settings,
        priority_values: {
          ...defaults.priority_values,
          ...(todoData.settings.priority_values || {}),
        },
        sort_criteria: {
          ...defaults.sort_criteria,
          ...(todoData.settings.sort_criteria || {}),
        },
      };
    }
    return todoData;
  }

  /**
   * Sort tasks with dependency-first, then category, then priority sorting
   * Logical hierarchy: Dependencies → Category → Priority → Phase → Time
   * @param {Array} tasks - Array of task objects
   * @returns {Array} Sorted tasks array
   */
  _sortTasks(tasks) {
    // Build a dependency graph to identify which tasks have dependents
    const dependencyGraph = this._buildDependencyGraph(tasks);

    return tasks.sort((a, b) => {
      // PRIMARY SORT: Dependency relationships (most logical - can't work on tasks with unmet dependencies)
      const aHasDependents = dependencyGraph.hasDependents.has(a.id);
      const bHasDependents = dependencyGraph.hasDependents.has(b.id);
      const aHasDependencies = a.dependencies && a.dependencies.length > 0;
      const bHasDependencies = b.dependencies && b.dependencies.length > 0;

      // Tasks that other tasks depend on should come first (blocking tasks)
      if (aHasDependents && !bHasDependents) {
        return -1;
      }
      if (!aHasDependents && bHasDependents) {
        return 1;
      }

      // Among tasks with dependents, prioritize by dependency depth
      if (aHasDependents && bHasDependents) {
        const depthA = this._getDependencyDepth(a, tasks);
        const depthB = this._getDependencyDepth(b, tasks);
        if (depthA !== depthB) {
          return depthA - depthB; // Deeper dependencies first
        }
      }

      // Among tasks without dependents, prefer those without dependencies (ready to work)
      if (!aHasDependents && !bHasDependents) {
        if (aHasDependencies && !bHasDependencies) {
          return 1;
        }
        if (!aHasDependencies && bHasDependencies) {
          return -1;
        }
      }

      // SECONDARY SORT: Category rank (user-requested category-first within dependency groups)
      const categoryA = a.category || a.priority;
      const categoryB = b.category || b.priority;

      const rankA = this.taskCategories.getCategoryRank(categoryA);
      const rankB = this.taskCategories.getCategoryRank(categoryB);

      if (rankA !== rankB) {
        return rankA - rankB; // Ascending order (lower rank first)
      }

      // TERTIARY SORT: Priority value within same category (user-requested priority-second)
      const priorityValueA = this._getPriorityValue(a.priority);
      const priorityValueB = this._getPriorityValue(b.priority);

      if (priorityValueA !== priorityValueB) {
        return priorityValueB - priorityValueA; // Descending order (higher priority first)
      }

      // QUATERNARY SORT: Phase ordering (within same dependency status, category, and priority)
      const phaseA = this._extractPhase(a.title);
      const phaseB = this._extractPhase(b.title);

      // If both tasks have phases, sort by phase
      if (phaseA && phaseB) {
        const phaseComparison = this._comparePhases(phaseA, phaseB);
        if (phaseComparison !== 0) {
          return phaseComparison;
        }
      }

      // If only one has a phase, phase tasks come first within same dependency/category/priority
      if (phaseA && !phaseB) {
        return -1;
      }
      if (!phaseA && phaseB) {
        return 1;
      }

      // QUINARY SORT: Creation time (newer first for all other criteria being equal)
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();

      return timeB - timeA; // Descending order (newer first)
    });
  }

  /**
   * Extract phase information from task title (e.g., "Phase 1.2:" -> {major: 1, minor: 2})
   * @param {string} title - Task title to parse
   * @returns {Object|null} Phase object with major/minor numbers, or null if no phase found
   */
  _extractPhase(title) {
    if (!title || typeof title !== 'string') {
      return null;
    }

    // Match patterns like "Phase 1.2:", "Phase 3:", "Phase 4.1.3:", etc.
    // Use string parsing instead of regex to avoid security warnings
    const cleanTitle = title.replace(/^Research:\s*/i, '').trim();
    if (!cleanTitle.toLowerCase().startsWith('phase ') || !title.includes(':')) {
      return null;
    }

    const phaseNumberPart = cleanTitle.slice(6).split(':')[0].trim(); // Remove "Phase " prefix
    const versionParts = phaseNumberPart.split('.');

    const major = parseInt(versionParts[0], 10);
    const minor = versionParts.length > 1 ? parseInt(versionParts[1], 10) : 0;
    const patch = versionParts.length > 2 ? parseInt(versionParts[2], 10) : 0;

    if (isNaN(major)) {
      return null;
    }

    const phaseMatch = [null, major.toString(), minor > 0 ? minor.toString() : undefined, patch > 0 ? patch.toString() : undefined];

    return {
      major: parseInt(phaseMatch[1], 10),
      minor: phaseMatch[2] ? parseInt(phaseMatch[2], 10) : 0,
      patch: phaseMatch[3] ? parseInt(phaseMatch[3], 10) : 0,
      raw: phaseMatch[0], // Store original match for debugging
    };
  }

  /**
   * Compare two phase objects for sorting
   * @param {Object} phaseA - First phase object
   * @param {Object} phaseB - Second phase object
   * @returns {number} Comparison result (-1, 0, 1)
   */
  _comparePhases(phaseA, phaseB) {
    // Compare major version first
    if (phaseA.major !== phaseB.major) {
      return phaseA.major - phaseB.major;
    }

    // Then minor version
    if (phaseA.minor !== phaseB.minor) {
      return phaseA.minor - phaseB.minor;
    }

    // Finally patch version
    return phaseA.patch - phaseB.patch;
  }

  /**
   * Check if inserting a new phase would conflict with existing phases
   * @param {Object} newPhase - Phase object for the new task
   * @param {Array} existingTasks - Current tasks to check against
   * @returns {Object} Object containing conflicts and suggested renumbering
   */
  _checkPhaseInsertion(newPhase, existingTasks) {
    if (!newPhase) {
      return { hasConflicts: false, renumberingNeeded: [] };
    }

    const conflicts = [];
    const renumberingNeeded = [];

    existingTasks.forEach((task) => {
      const existingPhase = this._extractPhase(task.title);
      if (!existingPhase) {
        return;
      }

      // Check for exact phase conflicts
      if (
        existingPhase.major === newPhase.major &&
        existingPhase.minor === newPhase.minor &&
        existingPhase.patch === newPhase.patch
      ) {
        conflicts.push({
          taskId: task.id,
          currentPhase: existingPhase,
          conflictingPhase: newPhase,
          task: task,
        });
      }

      // Check if this phase needs to be renumbered (pushed down)
      const shouldRenumber = this._shouldRenumberPhase(existingPhase, newPhase);
      if (shouldRenumber) {
        const newPhaseNumber = this._calculateNewPhaseNumber(
          existingPhase,
          newPhase,
        );
        renumberingNeeded.push({
          taskId: task.id,
          oldPhase: existingPhase,
          newPhase: newPhaseNumber,
          task: task,
        });
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      renumberingNeeded,
      needsRenumbering: renumberingNeeded.length > 0,
    };
  }

  /**
   * Determine if an existing phase should be renumbered when inserting a new phase
   * @param {Object} existingPhase - Current phase numbers
   * @param {Object} newPhase - Phase being inserted
   * @returns {boolean} True if the existing phase should be incremented
   */
  _shouldRenumberPhase(existingPhase, newPhase) {
    // For major phase insertion (e.g., inserting Phase 3 when Phase 3 exists)
    if (newPhase.minor === 0 && newPhase.patch === 0) {
      return existingPhase.major >= newPhase.major;
    }

    // For subphase insertion (e.g., inserting Phase 2.2 when Phase 2.2 exists)
    if (newPhase.patch === 0) {
      return (
        existingPhase.major === newPhase.major &&
        existingPhase.minor >= newPhase.minor
      );
    }

    // For patch phase insertion (e.g., inserting Phase 2.1.3 when Phase 2.1.3 exists)
    return (
      existingPhase.major === newPhase.major &&
      existingPhase.minor === newPhase.minor &&
      existingPhase.patch >= newPhase.patch
    );
  }

  /**
   * Calculate the new phase number after insertion
   * @param {Object} existingPhase - Current phase numbers
   * @param {Object} insertedPhase - Phase being inserted
   * @returns {Object} New phase numbers after renumbering
   */
  _calculateNewPhaseNumber(existingPhase, insertedPhase) {
    const newPhase = { ...existingPhase };

    // For major phase insertion, increment major version
    if (insertedPhase.minor === 0 && insertedPhase.patch === 0) {
      newPhase.major += 1;
      return newPhase;
    }

    // For subphase insertion, increment minor version
    if (insertedPhase.patch === 0) {
      if (existingPhase.major === insertedPhase.major) {
        newPhase.minor += 1;
      }
      return newPhase;
    }

    // For patch phase insertion, increment patch version
    if (
      existingPhase.major === insertedPhase.major &&
      existingPhase.minor === insertedPhase.minor
    ) {
      newPhase.patch += 1;
    }

    return newPhase;
  }

  /**
   * Perform intelligent phase insertion with automatic renumbering
   * @param {Object} newTaskData - New task data with phase information
   * @param {boolean} autoRenumber - Whether to automatically renumber conflicting phases
   * @returns {Promise<Object>} Result of phase insertion with details
   */
  async performIntelligentPhaseInsertion(newTaskData, autoRenumber = true) {
    const data = await this.readTodoFast();
    const newPhase = this._extractPhase(newTaskData.title);

    if (!newPhase) {
      // No phase detected, proceed with normal task creation
      return {
        success: true,
        renumbering: [],
        message: 'No phase detected, normal task creation',
      };
    }

    const insertionAnalysis = this._checkPhaseInsertion(newPhase, data.tasks);

    if (!insertionAnalysis.needsRenumbering) {
      // No conflicts, safe to insert
      return {
        success: true,
        renumbering: [],
        message: 'No phase conflicts detected',
      };
    }

    if (!autoRenumber) {
      return {
        success: false,
        conflicts: insertionAnalysis.conflicts,
        renumberingNeeded: insertionAnalysis.renumberingNeeded,
        message: 'Phase conflicts detected, auto-renumbering disabled',
      };
    }

    // Perform renumbering
    const renumberingResults = [];
    const lockId = `phase_insertion_${Date.now()}`;

    try {
      // Acquire distributed lock for safe renumbering
      if (this._lockManager) {
        await this._lockManager.acquireLock(lockId, 30000);
      }

      // Reload data to ensure we have the latest state
      const currentData = await this.readTodoFast();

      for (const renumberInfo of insertionAnalysis.renumberingNeeded) {
        const task = currentData.tasks.find(
          (t) => t.id === renumberInfo.taskId,
        );
        if (!task) {
          continue;
        }

        const oldTitle = task.title;
        const newPhaseStr = this._formatPhaseString(renumberInfo.newPhase);
        // Safe replacement: find the phase prefix and replace it using string methods
        const lowerTitle = task.title.toLowerCase();
        const hasResearch = lowerTitle.startsWith('research:');
        const phaseStartIndex = hasResearch ? task.title.toLowerCase().indexOf('phase ') : 0;
        const colonIndex = task.title.indexOf(':', phaseStartIndex);

        let newTitle;
        if (phaseStartIndex >= 0 && colonIndex > phaseStartIndex) {
          const beforePhase = hasResearch ? task.title.substring(0, phaseStartIndex) : '';
          const afterColon = task.title.substring(colonIndex + 1);
          newTitle = `${beforePhase}${newPhaseStr}:${afterColon}`;
        } else {
          newTitle = task.title; // Fallback if pattern doesn't match
        }

        // Update the task title
        task.title = newTitle;

        // Update phase info if stored separately
        if (task.phase) {
          task.phase = renumberInfo.newPhase;
        }

        renumberingResults.push({
          taskId: task.id,
          oldTitle,
          newTitle,
          oldPhase: renumberInfo.oldPhase,
          newPhase: renumberInfo.newPhase,
        });
      }

      // Save the updated data
      await this.writeTodo(currentData);

      return {
        success: true,
        renumbering: renumberingResults,
        message: `Successfully renumbered ${renumberingResults.length} tasks for phase insertion`,
      };
    } finally {
      if (this._lockManager) {
        await this._lockManager.releaseLock(lockId);
      }
    }
  }

  /**
   * Format phase object back to string representation
   * @param {Object} phase - Phase object with major, minor, patch
   * @returns {string} Formatted phase string (e.g., "Phase 2.1.3")
   */
  _formatPhaseString(phase) {
    let phaseStr = `Phase ${phase.major}`;
    if (phase.minor > 0) {
      phaseStr += `.${phase.minor}`;
      if (phase.patch > 0) {
        phaseStr += `.${phase.patch}`;
      }
    }
    return phaseStr;
  }

  /**
   * Generate embedded subtasks for feature tasks
   * @param {Object} taskData - Original task data
   * @param {string} parentTaskId - ID of the parent task
   * @param {string} taskCategory - Category of the parent task
   * @returns {Promise<Array>} Array of embedded subtasks
   */
  async _generateEmbeddedSubtasks(taskData, parentTaskId, taskCategory) {
    const subtasks = [...(taskData.subtasks || [])];

    // Only generate embedded subtasks for feature tasks
    if (taskCategory !== 'feature') {
      return subtasks;
    }

    // Skip auto-generation if explicitly disabled
    if (taskData.skip_embedded_subtasks) {
      return subtasks;
    }

    const timestamp = Date.now();
    const shortId = crypto.randomBytes(4).toString('hex');

    // Generate research subtask if needed
    if (this._shouldGenerateResearchSubtask(taskData)) {
      const researchSubtask = this._createResearchSubtask(taskData, parentTaskId, timestamp, shortId);
      subtasks.push(researchSubtask);
    }

    // Generate audit subtask for all feature tasks
    const auditSubtask = await this._createAuditSubtask(taskData, parentTaskId, timestamp, shortId);
    subtasks.push(auditSubtask);

    return subtasks;
  }

  /**
   * Determine if a research subtask should be generated
   * @param {Object} taskData - Original task data
   * @returns {boolean} True if research subtask should be generated
   */
  _shouldGenerateResearchSubtask(taskData) {
    // Skip if research already exists or was explicitly disabled
    if (taskData.requires_research === false || taskData.skip_research) {
      return false;
    }

    // Generate research for complex implementation tasks
    const title = (taskData.title || '').toLowerCase();
    const description = (taskData.description || '').toLowerCase();

    const complexKeywords = [
      'api', 'integration', 'database', 'authentication', 'security',
      'performance', 'architecture', 'framework', 'library', 'migration',
      'refactor', 'optimize', 'implement', 'design', 'system',
    ];

    return complexKeywords.some(keyword =>
      title.includes(keyword) || description.includes(keyword),
    );
  }

  /**
   * Create a research subtask
   * @param {Object} taskData - Original task data
   * @param {string} parentTaskId - ID of the parent task
   * @param {number} timestamp - Timestamp for ID generation
   * @param {string} shortId - Short ID for uniqueness
   * @returns {Object} Research subtask object
   */
  _createResearchSubtask(taskData, parentTaskId, timestamp, shortId) {
    const researchId = `research_${timestamp}_${shortId}`;

    // Determine research locations based on task content
    const researchLocations = this._determineResearchLocations(taskData);

    return {
      id: researchId,
      type: 'research',
      title: `Research: ${taskData.title}`,
      description: `Comprehensive research for ${taskData.title} to support implementation`,
      status: 'pending',
      estimated_hours: 1,
      research_locations: researchLocations,
      deliverables: [
        'Technical analysis report',
        'Implementation recommendations',
        'Risk assessment',
        'Alternative approaches evaluation',
      ],
      prevents_implementation: true, // Implementation cannot start until research is complete
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Determine research locations based on task content
   * @param {Object} taskData - Original task data
   * @returns {Array} Array of research location objects
   */
  _determineResearchLocations(taskData) {
    const locations = [];
    const title = (taskData.title || '').toLowerCase();
    const description = (taskData.description || '').toLowerCase();

    // Codebase research
    const codebaseLocation = {
      type: 'codebase',
      paths: [],
      focus: 'Existing implementation patterns and architecture',
    };

    // Add relevant paths based on task content
    if (title.includes('api') || description.includes('api')) {
      codebaseLocation.paths.push('/api', '/routes', '/controllers');
    }
    if (title.includes('ui') || title.includes('component')) {
      codebaseLocation.paths.push('/components', '/src', '/ui');
    }
    if (title.includes('database') || title.includes('data')) {
      codebaseLocation.paths.push('/models', '/database', '/migrations');
    }
    if (title.includes('test')) {
      codebaseLocation.paths.push('/test', '/tests', '/__tests__');
    }

    // Default to lib and src if no specific paths identified
    if (codebaseLocation.paths.length === 0) {
      codebaseLocation.paths.push('/lib', '/src', '/');
    }

    locations.push(codebaseLocation);

    // Internet research
    const keywords = this._extractResearchKeywords(taskData);
    if (keywords.length > 0) {
      locations.push({
        type: 'internet',
        keywords: keywords,
        focus: 'Best practices, industry standards, and technical specifications',
      });
    }

    // Documentation research
    locations.push({
      type: 'documentation',
      sources: ['README.md', 'docs/', 'API documentation', 'package.json'],
      focus: 'Project configuration and existing documentation',
    });

    return locations;
  }

  /**
   * Extract research keywords from task data
   * @param {Object} taskData - Original task data
   * @returns {Array} Array of research keywords
   */
  _extractResearchKeywords(taskData) {
    const keywords = [];
    const text = `${taskData.title || ''} ${taskData.description || ''}`.toLowerCase();

    // Technology keywords
    const techKeywords = [
      'node.js', 'javascript', 'typescript', 'react', 'vue', 'angular',
      'python', 'django', 'flask', 'fastapi', 'express', 'mongodb',
      'postgresql', 'mysql', 'redis', 'docker', 'kubernetes', 'aws',
      'authentication', 'oauth', 'jwt', 'security', 'encryption',
    ];

    techKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        keywords.push(keyword);
      }
    });

    // Extract specific terms from task title and description
    const words = text.split(/\s+/).filter(word => word.length > 3);
    const importantWords = words.filter(word =>
      !['that', 'with', 'from', 'this', 'will', 'should', 'would', 'could'].includes(word),
    );

    keywords.push(...importantWords.slice(0, 5)); // Limit to 5 extracted keywords

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Create an audit subtask
   * @param {Object} taskData - Original task data
   * @param {string} parentTaskId - ID of the parent task
   * @param {number} timestamp - Timestamp for ID generation
   * @param {string} shortId - Short ID for uniqueness
   * @returns {Promise<Object>} Audit subtask object
   */
  async _createAuditSubtask(taskData, parentTaskId, timestamp, shortId) {
    const auditId = `audit_${timestamp}_${shortId}`;

    // Load standard audit criteria from development/essentials/audit-criteria.md
    const auditCriteria = await this._loadAuditCriteria();

    return {
      id: auditId,
      type: 'audit',
      title: `Audit: ${taskData.title}`,
      description: `Comprehensive quality audit and review of the completed feature: ${taskData.title}\n\nOriginal Description: ${taskData.description || 'No description provided'}`,
      status: 'pending',
      estimated_hours: 0.5,
      success_criteria: auditCriteria,
      prevents_completion: true, // Parent task cannot be completed until audit passes
      original_implementer: null, // Will be set when parent task is assigned
      prevents_self_review: true, // Audit agent must be different from implementer
      audit_type: 'embedded_quality_gate',
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Load audit criteria from development/essentials/audit-criteria.md
   * @returns {Promise<Array>} Array of standard audit criteria
   */
  async _loadAuditCriteria() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const auditCriteriaPath = path.join(process.cwd(), 'development/essentials/audit-criteria.md');

      try {
        await fs.access(auditCriteriaPath);
      } catch {
        // File doesn't exist, return default criteria
        return this._getDefaultAuditCriteria();
      }

      const content = await fs.readFile(auditCriteriaPath, 'utf8');

      // Extract criteria from markdown checkboxes
      const criteriaRegex = /- \[ \] \*\*(.*?)\*\*:/g;
      const criteria = [];
      let match;

      while ((match = criteriaRegex.exec(content)) !== null) {
        criteria.push(match[1]);
      }

      // If no criteria found in file, return defaults
      return criteria.length > 0 ? criteria : this._getDefaultAuditCriteria();
    } catch (error) {
      logger.warn('Failed to load audit criteria from file, using defaults:', error.message);
      return this._getDefaultAuditCriteria();
    }
  }

  /**
   * Get default audit criteria if file cannot be loaded
   * @returns {Array} Array of default audit criteria
   */
  _getDefaultAuditCriteria() {
    return [
      'Linter Perfection',
      'Build Success',
      'Runtime Success',
      'Test Integrity',
      'Function Documentation',
      'Implementation Quality',
      'Security Standards',
      'Performance Standards',
    ];
  }

  /**
   * Build a dependency graph to identify which tasks have dependents
   * @param {Array} tasks - Array of task objects
   * @returns {Object} Dependency graph with hasDependents set
   */
  _buildDependencyGraph(tasks) {
    const hasDependents = new Set();

    // Go through all tasks and mark which ones have dependents
    tasks.forEach((task) => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach((depId) => {
          if (typeof depId === 'string') {
            hasDependents.add(depId);
          }
        });
      }
    });

    return { hasDependents };
  }

  /**
   * Perform topological sorting of tasks based on dependencies
   * @param {Array} tasks - Array of task objects
   * @returns {Array} Topologically sorted tasks
   */
  _topologicalSort(tasks) {
    const taskMap = new Map();
    tasks.forEach((task) => taskMap.set(task.id, task));

    const visited = new Set();
    const visiting = new Set();
    const result = [];

    const visit = (taskId) => {
      if (visiting.has(taskId)) {
        // Circular dependency detected, skip this dependency
        return;
      }
      if (visited.has(taskId)) {
        return;
      }

      const task = taskMap.get(taskId);
      if (!task) {
        return; // Task not found
      }

      visiting.add(taskId);

      // Visit all dependencies first
      const dependencies = task.dependencies || [];
      dependencies.forEach((depId) => {
        if (typeof depId === 'string' && taskMap.has(depId)) {
          visit(depId);
        }
      });

      visiting.delete(taskId);
      visited.add(taskId);
      result.push(task);
    };

    // Visit all tasks
    tasks.forEach((task) => {
      if (!visited.has(task.id)) {
        visit(task.id);
      }
    });

    // Add any tasks that weren't included (shouldn't happen with valid data)
    tasks.forEach((task) => {
      if (!result.find((t) => t.id === task.id)) {
        result.push(task);
      }
    });

    return result;
  }

  /**
   * Calculate dependency depth for a task (how many levels of dependencies it has)
   * @param {Object} task - Task object
   * @param {Array} allTasks - All tasks for reference
   * @returns {number} Dependency depth (0 = no dependencies, higher = more dependencies)
   */
  _getDependencyDepth(task, allTasks) {
    const taskMap = new Map();
    allTasks.forEach((t) => taskMap.set(t.id, t));

    const visited = new Set();

    const calculateDepth = (taskId) => {
      if (visited.has(taskId)) {
        return 0; // Avoid infinite loops
      }

      const currentTask = taskMap.get(taskId);
      if (
        !currentTask ||
        !currentTask.dependencies ||
        currentTask.dependencies.length === 0
      ) {
        return 0;
      }

      visited.add(taskId);

      let maxDepth = 0;
      currentTask.dependencies.forEach((depId) => {
        if (typeof depId === 'string' && taskMap.has(depId)) {
          const depDepth = calculateDepth(depId);
          maxDepth = Math.max(maxDepth, depDepth + 1);
        }
      });

      visited.delete(taskId);
      return maxDepth;
    };

    return calculateDepth(task.id);
  }

  /**
   * Apply auto-sorting to tasks if enabled
   * @param {Object} todoData - TODO data object
   * @returns {Object} TODO data with sorted tasks
   */
  _applyAutoSort(todoData) {
    if (!this._isAutoSortEnabled(todoData)) {
      return todoData;
    }

    // Only sort if we have tasks
    if (todoData.tasks && todoData.tasks.length > 1) {
      todoData.tasks = this._sortTasks(todoData.tasks);
    }

    return todoData;
  }

  /**
   * Enable or disable auto-sorting
   * @param {boolean} enabled - Whether to enable auto-sorting
   */
  async setAutoSortEnabled(enabled) {
    const todoData = await this.readTodoFast();
    this._initializeSettings(todoData);
    todoData.settings.auto_sort_enabled = enabled;
    await this.writeTodo(todoData);
  }

  /**
   * Get current auto-sort configuration
   * @returns {Object} Current auto-sort settings
   */
  async getAutoSortSettings() {
    const todoData = await this.readTodoFast();
    return todoData.settings || this._getAutoSortSettings();
  }

  /**
   * Update auto-sort settings
   * @param {Object} newSettings - New settings to merge
   */
  async updateAutoSortSettings(newSettings) {
    const todoData = await this.readTodoFast();
    this._initializeSettings(todoData);

    // Merge new settings
    todoData.settings = {
      ...todoData.settings,
      ...newSettings,
      priority_values: {
        ...todoData.settings.priority_values,
        ...(newSettings.priority_values || {}),
      },
      sort_criteria: {
        ...todoData.settings.sort_criteria,
        ...(newSettings.sort_criteria || {}),
      },
    };

    await this.writeTodo(todoData);
  }

  /**
   * Check important files exist
   */
  _checkImportantFiles(importantFiles) {
    const fs = require('fs');
    const missingFiles = [];

    for (const filePath of importantFiles) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath comes from task's important_files array, user-controlled but used for project file validation
      if (!fs.existsSync(filePath)) {
        missingFiles.push(filePath);
      }
    }

    return {
      success: missingFiles.length === 0,
      missingFiles,
      checked: importantFiles.length,
    };
  }

  /**
   * Check for security issues
   */
  async _checkSecurityIssues() {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      const projectType = this._detectProjectType();

      let securityCommand;
      if (projectType === 'python') {
        // Use Python security tools if available
        securityCommand =
          'bandit -r . -f json 2>/dev/null || pip-audit --format=json 2>/dev/null || echo "No Python security tools available"';
      } else {
        // Use npm audit for Node.js projects
        securityCommand = 'npm audit --audit-level=moderate';
      }

      try {
        const { stdout, stderr } = await execAsync(securityCommand, { timeout: 60000 });
        const output = stdout + stderr;

        if (projectType === 'python') {
          // For Python tools, parse JSON output or handle unavailable tools
          if (output.includes('No Python security tools available')) {
            return {
              success: true,
              criticalIssues: 0,
              output: 'Python security tools not installed - check skipped',
            };
          } else {
            // Parse security issues from output
            let criticalIssues = 0;
            if (output.includes('SEVERITY')) {
              // Count high/critical severity issues
              const highSeverityMatches = output.match(/HIGH/g);
              criticalIssues = highSeverityMatches ? highSeverityMatches.length : 0;
            }
            return {
              success: criticalIssues === 0,
              criticalIssues,
              output,
            };
          }
        } else {
          return {
            success: true,
            criticalIssues: 0,
            output: 'No security vulnerabilities found',
          };
        }
      } catch (execError) {
        if (projectType === 'nodejs') {
          // For npm audit, error indicates vulnerabilities found
          const output = execError.stdout + execError.stderr;
          const criticalMatch = output.match(/(\d+) critical/);
          const criticalIssues = criticalMatch ? parseInt(criticalMatch[1]) : 0;
          return {
            success: criticalIssues === 0,
            criticalIssues,
            output,
          };
        } else {
          return {
            success: true,
            criticalIssues: 0,
            output: 'No security vulnerabilities found',
          };
        }
      }
    } catch (error) {
      return {
        success: true,
        criticalIssues: 0,
        output: `Security check unavailable: ${error.message}`,
      };
    }
  }

  /**
   * Create a high-priority task to fix blocking issues
   * @param {Object} originalTask - The task that was blocked
   * @param {Object} validationResult - The validation result containing issues
   * @returns {string} ID of the created blocking issue task
   */

  // ============================================================================
  // CONCURRENT MULTI-AGENT PROCESSING METHODS
  // ============================================================================

  /**
   * Get available agents for concurrent processing
   * @returns {Promise<Array>} Available agents
   */
  async getAvailableAgents() {
    try {
      const agents = await this.agentRegistry.getActiveAgents();
      return agents.filter((agent) => {
        // Filter agents that are currently available for work
        return (
          agent.status === 'active' &&
          (agent.workload || 0) < (agent.maxConcurrentTasks || 5)
        );
      });
    } catch (error) {
      logger.warn('Failed to get available agents:', error.message);
      return [];
    }
  }

  /**
   * Get tasks that can be distributed across agents
   * @param {number} maxTasks - Maximum number of tasks to distribute
   * @returns {Promise<Array>} Tasks ready for distribution
   */
  async getDistributableTasks(maxTasks = 5) {
    const todoData = await this.readTodoFast();

    // Get pending tasks that are not blocked by dependencies
    const pendingTasks = todoData.tasks.filter(
      (task) =>
        task.status === 'pending' &&
        !task.auto_created && // Skip auto-generated blocking tasks
        !task.blocking_for, // Skip blocking resolution tasks
    );

    // Sort by category priority (research highest, tests lowest)
    const sortedTasks = this._sortTasks(pendingTasks);

    // Return up to maxTasks for distribution
    return sortedTasks.slice(0, maxTasks);
  }

  /**
   * Allow multiple tasks to have 'in_progress' status simultaneously
   * Thread-safe status updates with optimistic locking
   * @param {string} taskId - Task ID
   * @param {string} status - New status
   * @param {string} notes - Optional completion notes
   * @param {Object} options - Update options including agent info
   * @returns {Promise<boolean>} Success status
   */
  async updateTaskStatusConcurrent(taskId, status, notes = '', options = {}) {
    const maxRetries = 3;
    let retries = 0;


    while (retries < maxRetries) {
      try {
        // Read fresh data for optimistic locking
        // eslint-disable-next-line no-await-in-loop -- Sequential retry mechanism requires fresh data reads for optimistic locking
        const todoData = await this.readTodoFast();
        const task = todoData.tasks.find((t) => t.id === taskId);

        if (!task) {
          throw new Error(`Task ${taskId} not found`);
        }

        // Store original status for conflict detection
        const originalStatus = task.status;
        const currentTime = new Date().toISOString();

        // Validate status transition
        if (!this._isValidStatusTransition(originalStatus, status)) {
          throw new Error(
            `Invalid status transition from ${originalStatus} to ${status}`,
          );
        }

        // Update task status atomically
        const oldStatus = task.status;
        task.status = status;
        task.last_modified = currentTime;

        // Status-specific updates
        if (status === 'completed') {
          task.completed_at = currentTime;
          if (notes) {
            task.completion_notes = notes;
          }
          // Clear claiming info when completed
          task.claimed_by = null;
        } else if (status === 'in_progress') {
          if (!task.started_at) {
            task.started_at = currentTime;
          }
          if (options.agentId) {
            task.claimed_by = options.agentId;
            task.assigned_agent = options.agentId;
          }
        } else if (status === 'pending') {
          // Reset claiming info when moved back to pending
          task.claimed_by = null;
          if (task.started_at) {
            task.previous_started_at = task.started_at;
            delete task.started_at;
          }
        }

        // Track status change history
        if (!task.status_history) {
          task.status_history = [];
        }
        task.status_history.push({
          from: oldStatus,
          to: status,
          timestamp: currentTime,
          agent: options.agentId || 'system',
          notes: notes || null,
        });

        // Atomic write with retry logic
        // eslint-disable-next-line no-await-in-loop -- Sequential retry mechanism for data consistency
        await this.writeTodo(todoData);
        return true;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          logger.error(
            `Failed to update task ${taskId} after ${maxRetries} retries:`,
            error.message,
          );
          throw error;
        }

        // Exponential backoff for retries
        // eslint-disable-next-line no-await-in-loop -- Sequential delay required for proper retry backoff
        await new Promise((resolve) => {
          setTimeout(() => resolve(), Math.pow(2, retries) * 100);
        });
      }
    }

    return false;
  }

  /**
   * Validate if a status transition is allowed
   * @param {string} fromStatus - Current status
   * @param {string} toStatus - Desired status
   * @returns {boolean} Whether transition is valid
   */
  _isValidStatusTransition(fromStatus, toStatus) {
    const validTransitions = {
      pending: ['in_progress'],
      in_progress: ['completed', 'pending'],
      completed: ['pending'], // Allow reopening if needed
    };

    // eslint-disable-next-line security/detect-object-injection -- fromStatus is validated as string parameter, used to check valid task status transitions
    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  /**
   * Check for tasks that have been in_progress for 15+ minutes and revert them to pending
   * @returns {Promise<Array>} Array of reverted task IDs
   */
  async revertStaleInProgressTasks() {
    const logger = this._getLogger('StaleTaskMonitor');
    const todoData = await this.readTodoFast();
    const revertedTasks = [];
    const warningTasks = [];
    const now = Date.now();

    // Use configurable timeout instead of hardcoded 30 minutes
    const staleThreshold = new Date(
      now - this.options.staleTaskTimeout * 60 * 1000,
    );
    const warningThreshold = new Date(
      now -
        this.options.staleTaskTimeout *
          60 *
          1000 *
          this.options.staleTaskWarningThreshold,
    );

    logger.debug(
      `[STALE_CHECK] Checking tasks with timeout: ${this.options.staleTaskTimeout}min, warning at: ${Math.round(this.options.staleTaskTimeout * this.options.staleTaskWarningThreshold)}min`,
      {
        totalInProgress: todoData.tasks.filter(
          (t) => t.status === 'in_progress',
        ).length,
        staleThreshold: staleThreshold.toISOString(),
        warningThreshold: warningThreshold.toISOString(),
      },
    );

    for (const task of todoData.tasks) {
      if (task.status === 'in_progress' && task.started_at) {
        const startedTime = new Date(task.started_at);
        const taskDurationMs = now - startedTime.getTime();
        const taskDurationMinutes = Math.round(taskDurationMs / (60 * 1000));

        // Check if task should be reverted (exceeded timeout)
        if (startedTime <= staleThreshold) {
          task.status = 'pending';
          task.reverted_at = new Date().toISOString();
          task.revert_reason = `Task auto-reverted after ${this.options.staleTaskTimeout} minutes in progress`;

          // Enhanced tracking: record stale event details
          const staleEvent = {
            taskId: task.id,
            taskTitle: task.title,
            category: task.category,
            assignedAgent: task.assigned_agent,
            durationMinutes: taskDurationMinutes,
            revertedAt: task.reverted_at,
            startedAt: task.started_at,
          };

          // Update statistics
          this._recordStaleTaskEvent(staleEvent);

          // Clear all agent assignments since task is being reset
          if (task.assigned_agent) {
            task.previously_assigned_agent = task.assigned_agent;
            delete task.assigned_agent;
          }
          if (task.claimed_by) {
            task.previously_claimed_by = task.claimed_by;
            delete task.claimed_by;
          }
          if (task.assigned_agents) {
            task.previously_assigned_agents = [...task.assigned_agents];
            delete task.assigned_agents;
          }

          // Clear start timestamp
          if (task.started_at) {
            task.previous_started_at = task.started_at;
            delete task.started_at;
          }

          revertedTasks.push(task.id);

          logger.warn(
            `[STALE_REVERT] Task ${task.id} (${task.title}) reverted after ${taskDurationMinutes} minutes`,
            {
              taskId: task.id,
              category: task.category,
              assignedAgent: task.previously_assigned_agent,
              durationMinutes: taskDurationMinutes,
            },
          );
        } else if (
          this.options.enableStaleTaskWarnings &&
          startedTime <= warningThreshold
        ) {
          // Issue warning for tasks approaching stale threshold
          warningTasks.push({
            taskId: task.id,
            title: task.title,
            category: task.category,
            assignedAgent: task.assigned_agent,
            durationMinutes: taskDurationMinutes,
            minutesUntilStale:
              this.options.staleTaskTimeout - taskDurationMinutes,
          });

          logger.warn(
            `[STALE_WARNING] Task ${task.id} (${task.title}) has been in progress for ${taskDurationMinutes}min, will be auto-reverted in ${this.options.staleTaskTimeout - taskDurationMinutes}min`,
            {
              taskId: task.id,
              category: task.category,
              assignedAgent: task.assigned_agent,
              durationMinutes: taskDurationMinutes,
              warningThresholdMin: Math.round(
                this.options.staleTaskTimeout *
                  this.options.staleTaskWarningThreshold,
              ),
            },
          );

          this._staleTaskStats.warningsIssued++;
        }
      }
    }

    // Update last check timestamp
    this._staleTaskStats.lastStaleCheck = new Date().toISOString();

    if (revertedTasks.length > 0) {
      await this.writeTodo(todoData);

      logger.info(
        `[STALE_SUMMARY] Reverted ${revertedTasks.length} stale tasks`,
        {
          revertedTaskIds: revertedTasks,
          totalStaleEvents: this._staleTaskStats.totalStaleEvents,
          avgStaleTimeMin: Math.round(this._staleTaskStats.avgStaleTime),
        },
      );
    }

    if (warningTasks.length > 0) {
      logger.info(
        `[STALE_WARNINGS] Issued warnings for ${warningTasks.length} tasks approaching stale threshold`,
        {
          warningTasks: warningTasks.map((t) => ({
            taskId: t.taskId,
            durationMin: t.durationMinutes,
            minutesLeft: t.minutesUntilStale,
          })),
        },
      );
    }

    return revertedTasks;
  }

  /**
   * Record stale task event for statistics and analysis
   * @private
   * @param {Object} staleEvent - Event details
   */
  _recordStaleTaskEvent(staleEvent) {
    const logger = this._getLogger('StaleTaskStatistics');

    if (!this.options.enableStaleTaskStatistics) {
      return;
    }

    // Add to history (with circular buffer behavior)
    this._staleTaskHistory.push({
      ...staleEvent,
      timestamp: new Date().toISOString(),
    });

    // Maintain circular buffer of stale events
    if (this._staleTaskHistory.length > this.options.maxStaleTaskHistory) {
      this._staleTaskHistory.shift();
    }

    // Update overall statistics
    this._staleTaskStats.totalStaleEvents++;
    this._staleTaskStats.tasksReverted++;

    // Update average stale time
    const totalDuration = this._staleTaskHistory.reduce(
      (sum, event) => sum + event.durationMinutes,
      0,
    );
    this._staleTaskStats.avgStaleTime =
      totalDuration / this._staleTaskHistory.length;

    // Track frequently stale agents
    if (staleEvent.assignedAgent) {
      const agentCount =
        this._staleTaskStats.frequentlyStaleAgents.get(
          staleEvent.assignedAgent,
        ) || 0;
      this._staleTaskStats.frequentlyStaleAgents.set(
        staleEvent.assignedAgent,
        agentCount + 1,
      );
    }

    // Track frequently stale task categories
    if (staleEvent.category) {
      const categoryCount =
        this._staleTaskStats.frequentlyStaleTaskTypes.get(
          staleEvent.category,
        ) || 0;
      this._staleTaskStats.frequentlyStaleTaskTypes.set(
        staleEvent.category,
        categoryCount + 1,
      );
    }

    logger.debug(
      `[STALE_STATS] Recorded stale event for task ${staleEvent.taskId}`,
      {
        totalStaleEvents: this._staleTaskStats.totalStaleEvents,
        avgStaleTimeMin: Math.round(this._staleTaskStats.avgStaleTime),
        historySize: this._staleTaskHistory.length,
      },
    );

    // Check for patterns that warrant notifications
    this._checkStaleTaskPatterns(staleEvent);
  }

  /**
   * Check for concerning stale task patterns and issue notifications
   * @private
   * @param {Object} staleEvent - Recent stale event
   */
  _checkStaleTaskPatterns(staleEvent) {
    const logger = this._getLogger('StaleTaskAnalysis');

    // Check if an agent is frequently having stale tasks
    if (staleEvent.assignedAgent) {
      const agentStaleCount = this._staleTaskStats.frequentlyStaleAgents.get(
        staleEvent.assignedAgent,
      );
      if (agentStaleCount >= 3) {
        logger.warn(
          `[PATTERN_ALERT] Agent ${staleEvent.assignedAgent} has had ${agentStaleCount} stale tasks - may need investigation`,
          {
            agentId: staleEvent.assignedAgent,
            staleTaskCount: agentStaleCount,
            recentTaskId: staleEvent.taskId,
            category: staleEvent.category,
          },
        );
      }
    }

    // Check if a task category is frequently going stale
    if (staleEvent.category) {
      const categoryStaleCount =
        this._staleTaskStats.frequentlyStaleTaskTypes.get(staleEvent.category);
      if (categoryStaleCount >= 5) {
        logger.warn(
          `[PATTERN_ALERT] Task category "${staleEvent.category}" has had ${categoryStaleCount} stale tasks - may indicate systematic issues`,
          {
            category: staleEvent.category,
            staleTaskCount: categoryStaleCount,
            avgStaleTimeMin: Math.round(this._staleTaskStats.avgStaleTime),
          },
        );
      }
    }

    // Check if stale rate is increasing
    const recentStaleCount = this._staleTaskHistory.filter((event) => {
      const eventTime = new Date(event.timestamp);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return eventTime > oneHourAgo;
    }).length;

    if (recentStaleCount >= 3) {
      logger.warn(
        `[PATTERN_ALERT] High stale task rate: ${recentStaleCount} stale tasks in the last hour`,
        {
          recentStaleCount,
          totalStaleEvents: this._staleTaskStats.totalStaleEvents,
          avgStaleTimeMin: Math.round(this._staleTaskStats.avgStaleTime),
        },
      );
    }
  }

  /**
   * Get logger instance for structured logging
   * @private
   * @param {string} component - Component name for logging context
   * @returns {Object} Logger instance
   */
  _getLogger(component = 'TaskManager') {
    return {
      debug: (message, context = {}) => {
        if (
          this.options.logLevel === 'debug' ||
          process.env.NODE_ENV === 'development'
        ) {
          logger.debug(`[DEBUG] [${component}] ${message}`, context);
        }
      },
      info: (message, context = {}) => {
        logger.info(`[INFO] [${component}] ${message}`, context);
      },
      warn: (message, context = {}) => {
        logger.warn(`[WARN] [${component}] ${message}`, context);
      },
      error: (message, context = {}) => {
        logger.error(`[ERROR] [${component}] ${message}`, context);
      },
    };
  }

  /**
   * Get comprehensive stale task statistics and monitoring data
   * @returns {Object} Stale task statistics and history
   */
  getStaleTaskStatistics() {
    const logger = this._getLogger('StaleTaskStatistics');

    const stats = {
      configuration: {
        staleTaskTimeoutMin: this.options.staleTaskTimeout,
        warningThresholdMin: Math.round(
          this.options.staleTaskTimeout *
            this.options.staleTaskWarningThreshold,
        ),
        enableWarnings: this.options.enableStaleTaskWarnings,
        enableStatistics: this.options.enableStaleTaskStatistics,
        maxHistorySize: this.options.maxStaleTaskHistory,
      },
      statistics: {
        ...this._staleTaskStats,
        // Convert Maps to Objects for JSON serialization
        frequentlyStaleAgents: Object.fromEntries(
          this._staleTaskStats.frequentlyStaleAgents,
        ),
        frequentlyStaleTaskTypes: Object.fromEntries(
          this._staleTaskStats.frequentlyStaleTaskTypes,
        ),
      },
      recentHistory: this._staleTaskHistory.slice(-10), // Last 10 events
      analysis: {
        mostProblematicAgent: this._getMostProblematicAgent(),
        mostProblematicCategory: this._getMostProblematicCategory(),
        recentTrend: this._getRecentStaleTrend(),
      },
    };

    logger.info(`[STATS_RETRIEVED] Stale task statistics accessed`, {
      totalEvents: stats.statistics.totalStaleEvents,
      avgStaleTime: Math.round(stats.statistics.avgStaleTime),
      historySize: this._staleTaskHistory.length,
    });

    return stats;
  }

  /**
   * Get agent with most stale tasks
   * @private
   */
  _getMostProblematicAgent() {
    let maxCount = 0;
    let maxAgent = null;

    for (const [agent, count] of this._staleTaskStats.frequentlyStaleAgents) {
      if (count > maxCount) {
        maxCount = count;
        maxAgent = agent;
      }
    }

    return maxAgent ? { agentId: maxAgent, staleTaskCount: maxCount } : null;
  }

  /**
   * Get category with most stale tasks
   * @private
   */
  _getMostProblematicCategory() {
    let maxCount = 0;
    let maxCategory = null;

    for (const [category, count] of this._staleTaskStats
      .frequentlyStaleTaskTypes) {
      if (count > maxCount) {
        maxCount = count;
        maxCategory = category;
      }
    }

    return maxCategory
      ? { category: maxCategory, staleTaskCount: maxCount }
      : null;
  }

  /**
   * Get recent stale task trend
   * @private
   */
  _getRecentStaleTrend() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const recentCount = this._staleTaskHistory.filter((event) => {
      const eventTime = new Date(event.timestamp);
      return eventTime > oneHourAgo;
    }).length;

    const olderCount = this._staleTaskHistory.filter((event) => {
      const eventTime = new Date(event.timestamp);
      return eventTime > sixHoursAgo && eventTime <= oneHourAgo;
    }).length;

    let trend = 'stable';
    if (recentCount > olderCount * 1.5) {
      trend = 'increasing';
    } else if (recentCount < olderCount * 0.5) {
      trend = 'decreasing';
    }

    return {
      trend,
      recentHourCount: recentCount,
      previousPeriodCount: olderCount,
      description: `${recentCount} stale tasks in last hour vs ${olderCount} in previous 5 hours`,
    };
  }

  // ============================================================================
  // SIMPLIFIED AUTONOMOUS AGENT METHODS
  // ============================================================================

  /**
   * Get next pending task for autonomous processing
   * Thread-safe: claims task immediately when found
   * @returns {Promise<Object|null>} Next task or null
   */
  async getNextPendingTask(agentId = null) {
    const todoData = await this.readTodo();

    // Get pending tasks and sort them properly (respecting dependencies)
    const pendingTasks = todoData.tasks.filter(
      (task) => task && task.status === 'pending',
    );

    if (pendingTasks.length === 0) {
      return null;
    }

    // Sort pending tasks to get the highest priority task (with dependency awareness)
    const sortedPendingTasks = this._sortTasks(pendingTasks);
    const nextTask = sortedPendingTasks[0];

    if (nextTask) {
      // Atomic claim operation to prevent race conditions
      nextTask.status = 'in_progress';
      nextTask.started_at = new Date().toISOString();
      nextTask.claimed_by = agentId || `agent_${Date.now()}`;
      nextTask.assigned_agent = agentId || nextTask.claimed_by;

      // Add agent assignment history for tracking
      if (!nextTask.agent_assignment_history) {
        nextTask.agent_assignment_history = [];
      }
      nextTask.agent_assignment_history.push({
        agent: agentId || nextTask.claimed_by,
        action: 'claimed',
        timestamp: new Date().toISOString(),
      });

      await this.writeTodo(todoData);
      return nextTask;
    }

    return null;
  }

  /**
   * Concurrent task claiming for multiple agents
   * @param {string} agentId - Agent ID
   * @param {number} maxTasks - Maximum tasks this agent can handle concurrently
   * @returns {Promise<Object|null>} Claimed task or null
   */
  async claimNextAvailableTask(agentId, maxTasks = 1) {
    const todoData = await this.readTodo();

    // Check how many tasks this agent already has
    const agentTasks = todoData.tasks.filter(
      (task) =>
        task.status === 'in_progress' &&
        (task.assigned_agent === agentId || task.claimed_by === agentId),
    );

    if (agentTasks.length >= maxTasks) {
      return null; // Agent at capacity
    }

    // Find next available task
    const availableTask = todoData.tasks.find(
      (task) =>
        task.status === 'pending' && !task.assigned_agent && !task.claimed_by,
    );

    if (availableTask) {
      // Atomic claim
      availableTask.status = 'in_progress';
      availableTask.started_at = new Date().toISOString();
      availableTask.claimed_by = agentId;
      availableTask.assigned_agent = agentId;

      // Track assignment
      if (!availableTask.agent_assignment_history) {
        availableTask.agent_assignment_history = [];
      }
      availableTask.agent_assignment_history.push({
        agent: agentId,
        action: 'concurrent_claim',
        timestamp: new Date().toISOString(),
        agent_capacity: `${agentTasks.length + 1}/${maxTasks}`,
      });

      await this.writeTodo(todoData);
    }

    return availableTask || null;
  }

  /**
   * Get optimal task assignment based on agent load balancing
   * @param {Array} agents - Array of agent objects with capabilities
   * @returns {Promise<Array>} Array of task assignments
   */
  async getOptimalTaskAssignments(agents) {
    const todoData = await this.readTodo();
    const pendingTasks = todoData.tasks.filter((t) => t.status === 'pending');
    const assignments = [];

    // Sort agents by current workload (ascending)
    const agentWorkloads = agents
      .map((agent) => ({
        ...agent,
        currentTasks: todoData.tasks.filter(
          (t) =>
            t.status === 'in_progress' &&
            (t.assigned_agent === agent.id || t.claimed_by === agent.id),
        ).length,
      }))
      .sort((a, b) => a.currentTasks - b.currentTasks);

    // Assign tasks based on priority and agent capacity
    for (const task of pendingTasks.slice(0, 10)) {
      // Limit to top 10 tasks
      const availableAgent = agentWorkloads.find(
        (agent) =>
          agent.currentTasks < (agent.maxConcurrentTasks || 1) &&
          this._agentCanHandleTask(agent, task),
      );

      if (availableAgent) {
        assignments.push({
          taskId: task.id,
          agentId: availableAgent.id,
          priority: task.priority,
          category: task.category,
        });
        availableAgent.currentTasks++; // Update workload for next iteration
      }
    }

    return assignments;
  }

  /**
   * Check if an agent can handle a specific task based on capabilities
   * @param {Object} agent - Agent object with capabilities
   * @param {Object} task - Task object
   * @returns {boolean} Whether agent can handle the task
   */
  _agentCanHandleTask(agent, task) {
    if (!agent.capabilities) {
      return true;
    } // No restrictions

    const taskCategory = task.category || 'general';
    const taskMode = task.mode || 'DEVELOPMENT';

    return (
      (!agent.capabilities.categories ||
        agent.capabilities.categories.includes(taskCategory)) &&
      (!agent.capabilities.modes || agent.capabilities.modes.includes(taskMode))
    );
  }

  /**
   * Distribute tasks automatically across multiple agents
   * @param {Array} agentIds - Array of agent IDs
   * @param {number} maxTasksPerAgent - Maximum tasks per agent
   * @returns {Promise<Object>} Distribution results
   */
  async distributeTasksToAgents(agentIds, maxTasksPerAgent = 2) {
    const todoData = await this.readTodo();
    const pendingTasks = todoData.tasks.filter((t) => t.status === 'pending');
    const results = {
      distributed: [],
      failed: [],
      summary: {},
    };

    // Track agent workloads
    const agentWorkloads = {};
    agentIds.forEach((agentId) => {
      // eslint-disable-next-line security/detect-object-injection -- agentId is from validated agentIds array parameter
      agentWorkloads[agentId] = todoData.tasks.filter(
        (t) =>
          t.status === 'in_progress' &&
          (t.assigned_agent === agentId || t.claimed_by === agentId),
      ).length;
    });

    // Distribute tasks using round-robin with load balancing
    for (const task of pendingTasks) {
      // Find agent with lowest current workload
      const availableAgent = agentIds
        // eslint-disable-next-line security/detect-object-injection -- agentId is from validated agentIds array parameter
        .filter((agentId) => agentWorkloads[agentId] < maxTasksPerAgent)
        // eslint-disable-next-line security/detect-object-injection -- a and b are from validated agentIds array parameter
        .sort((a, b) => agentWorkloads[a] - agentWorkloads[b])[0];

      if (availableAgent) {
        try {
          // Claim task for the agent
          task.status = 'in_progress';
          task.assigned_agent = availableAgent;
          task.claimed_by = availableAgent;
          task.started_at = new Date().toISOString();
          task.distributed_at = new Date().toISOString();

          results.distributed.push({
            taskId: task.id,
            agentId: availableAgent,
            title: task.title,
          });

          // eslint-disable-next-line security/detect-object-injection -- availableAgent is from validated agentIds array parameter
          agentWorkloads[availableAgent]++;
        } catch (error) {
          results.failed.push({
            taskId: task.id,
            error: error.message,
          });
        }
      } else {
        // No available agents
        break;
      }
    }

    // Save updated task assignments
    if (results.distributed.length > 0) {
      await this.writeTodo(todoData);
    }

    // Generate summary
    results.summary = {
      totalDistributed: results.distributed.length,
      totalFailed: results.failed.length,
      agentWorkloads: agentWorkloads,
    };

    return results;
  }

  /**
   * Check if there are any tasks available for processing
   * @returns {Promise<Object>} Task availability status
   */
  async getTaskStatus() {
    const todoData = await this.readTodo();

    const pendingTasks = todoData.tasks.filter(
      (t) => t && t.status === 'pending',
    ).length;
    const inProgressTasks = todoData.tasks.filter(
      (t) => t && t.status === 'in_progress',
    ).length;
    const completedTasks = todoData.tasks.filter(
      (t) => t && t.status === 'completed',
    ).length;

    return {
      pending: pendingTasks,
      in_progress: inProgressTasks,
      completed: completedTasks,
      total: todoData.tasks.length,
      hasWork: pendingTasks > 0 || inProgressTasks > 0,
    };
  }

  /**
   * Authorize a single stop for the infinite continue hook system
   * Creates a .stop-allowed flag file that the stop hook will consume
   * @param {string} agentId - Agent ID requesting the stop
   * @param {string} reason - Reason for the stop request
   * @returns {Promise<Object>} Stop authorization result
   */
  authorizeStopHook(agentId = null, reason = 'Agent-requested stop') {
    const path = require('path');
    const projectRoot = path.dirname(this.todoPath);
    const stopFlagPath = path.join(projectRoot, '.stop-allowed');

    // Create stop authorization flag
    const stopFlag = {
      stop_allowed: true,
      single_use: true,
      authorized_by: agentId || 'unknown',
      reason: reason,
      timestamp: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30000).toISOString(), // 30 second expiration
    };

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- stopFlagPath is constructed from project constants for stop flag functionality
      fs.writeFileSync(stopFlagPath, JSON.stringify(stopFlag, null, 2));

      return {
        success: true,
        message: 'Stop authorization granted',
        flag_path: stopFlagPath,
        expires_in_seconds: 30,
        authorized_by: agentId || 'unknown',
        reason: reason,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create stop authorization: ${error.message}`,
        flag_path: stopFlagPath,
      };
    }
  }

  /**
   * Determine if a task requires automatic research dependency creation
   * @private
   * @param {Object} taskData - Task data to analyze
   * @returns {boolean} True if research task should be auto-created
   */
  /**
   * Infer task category from task title, description, and other attributes
   * @private
   * @param {Object} taskData - Task data object
   * @returns {string|null} Inferred category or null
   */
  _inferCategoryFromTask(taskData) {
    const title = (taskData.title || '').toLowerCase();
    const description = (taskData.description || '').toLowerCase();
    const allText = `${title} ${description}`;

    // Error/bug patterns (highest priority)
    if (/error|failure|bug|fix|broken|crash|exception|fail|linter|lint|build.*fail|compilation|syntax/.test(allText)) {
      return 'error';
    }

    // Test patterns (lowest priority)
    if (/test|testing|spec|coverage|jest|mocha|cypress|e2e|unit.*test|integration.*test/.test(allText)) {
      return 'test-coverage';
    }

    // Feature patterns (default for new functionality)
    if (/add|implement|create|build|develop|new|feature/.test(allText)) {
      return 'enhancement';
    }

    // Documentation patterns
    if (/document|readme|guide|docs|documentation/.test(allText)) {
      return 'documentation';
    }

    // Refactoring patterns
    if (/refactor|cleanup|optimize|improve|reorganize/.test(allText)) {
      return 'refactor';
    }

    return null; // No clear pattern detected
  }

  _shouldAutoCreateResearchTask(taskData) {
    // Skip if explicitly disabled or already marked as research
    if (
      taskData.skip_auto_research ||
      taskData.mode === 'RESEARCH' ||
      taskData.category === 'research'
    ) {
      return false;
    }

    // Skip for simple categories that rarely need research
    const simpleCategories = [
      'chore',
      'documentation',
      'test-failure',
      'linter-error',
      'build-error',
    ];
    if (simpleCategories.includes(taskData.category)) {
      return false;
    }

    // Always create research for these high-complexity categories
    const researchRequiredCategories = [
      'missing-feature',
      'enhancement',
      'refactor',
    ];
    if (researchRequiredCategories.includes(taskData.category)) {
      return this._isComplexImplementationTask(taskData);
    }

    return false;
  }

  /**
   * Determine if a task involves complex implementation requiring research
   * @private
   * @param {Object} taskData - Task data to analyze
   * @returns {boolean} True if task is complex and needs research
   */
  _isComplexImplementationTask(taskData) {
    const title = (taskData.title || '').toLowerCase();
    const description = (taskData.description || '').toLowerCase();
    const text = title + ' ' + description;

    // Complex patterns that require research (from CLAUDE.md)
    const complexPatterns = [
      // External integrations
      /\b(api|external|integration|third[- ]?party|webhook|oauth|authentication|auth)\b/,

      // Database and data
      /\b(database|schema|migration|sql|nosql|mongodb|postgresql|mysql|data[- ]?model)\b/,

      // Security and authentication
      /\b(security|encryption|jwt|token|permission|authorization|2fa|saml|ldap)\b/,

      // Performance and algorithms
      /\b(performance|optimization|algorithm|caching|scaling|load[- ]?balancing)\b/,

      // Architecture and patterns
      /\b(architecture|design[- ]?pattern|microservice|distributed|event[- ]?driven)\b/,

      // Complex UI/UX
      /\b(dashboard|real[- ]?time|websocket|streaming|visualization|chart|graph)\b/,

      // Infrastructure
      /\b(deployment|docker|kubernetes|aws|cloud|infrastructure|devops)\b/,

      // Advanced features
      /\b(machine[- ]?learning|ai|analytics|reporting|notification|email)\b/,
    ];

    // Check if any complex pattern matches
    return complexPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Create a research dependency task for complex implementation
   * @private
   * @param {Object} implementationTaskData - The implementation task data
   * @param {string} implementationTaskId - The implementation task ID
   * @returns {Promise<string|null>} Research task ID or null if creation failed
   */
  async _createResearchDependency(
    implementationTaskData,
    implementationTaskId,
  ) {
    try {
      const researchTitle = this._generateResearchTitle(implementationTaskData);
      const researchDescription = this._generateResearchDescription(
        implementationTaskData,
        implementationTaskId,
      );

      // Create research task with higher priority than implementation
      const researchPriority = this._getResearchPriority(
        implementationTaskData.priority,
      );

      const researchTaskData = {
        title: researchTitle,
        description: researchDescription,
        mode: 'RESEARCH',
        category: 'research',
        priority: researchPriority,
        status: 'pending',
        dependencies: [],
        requires_research: false,
        skip_auto_research: true, // Prevent recursive research creation
        estimate: '1-2 hours',
        success_criteria: [
          'Research methodology and approach documented',
          'Key findings and recommendations provided',
          'Implementation guidance and best practices identified',
          'Risk assessment and mitigation strategies outlined',
        ],
        created_by: 'auto-research-system',
        auto_created_for: implementationTaskId,
      };

      // Create the research task using existing createTask method
      const todoData = await this.readTodoFast();
      const researchTaskId = await this._createTaskDirectly(
        todoData,
        researchTaskData,
      );

      return researchTaskId;
    } catch (error) {
      logger.error('Failed to create research dependency:', error.message);
      return null;
    }
  }

  /**
   * Determine task type prefix from task content
   * @private
   * @param {Object} taskData - Task data to analyze
   * @returns {string} Task type prefix: 'error', 'feature', 'subtask', or 'test'
   */
  _determineTaskTypeFromContent(taskData) {
    const title = (taskData.title || '').toLowerCase();
    const description = (taskData.description || '').toLowerCase();
    const category = (taskData.category || '').toLowerCase();
    const allText = `${title} ${description} ${category}`;

    // ERROR detection (highest priority)
    const errorPatterns = [
      /error|failure|bug|fix|broken|crash|exception|fail/i,
      /linter|lint|eslint|tslint|syntax/i,
      /build.*fail|compilation|cannot.*build/i,
      /start.*fail|startup.*error|cannot.*start/i,
    ];

    const isError =
      errorPatterns.some((pattern) => pattern.test(allText)) ||
      ['linter-error', 'build-error', 'start-error', 'error', 'bug'].includes(
        category,
      );

    if (isError) {
      // Check if it's actually a test-related error (should be test_ not error_)
      const testRelated =
        /test.*error|test.*fail|coverage|spec|jest|mocha|cypress/.test(allText);
      if (
        testRelated &&
        !/(build.*fail|compilation|cannot.*build|start.*fail)/.test(allText)
      ) {
        return 'test'; // Test-related issues are test tasks, not error tasks
      }
      return 'error';
    }

    // TEST detection (lowest priority)
    const testPatterns = [
      /test|testing|spec|coverage|jest|mocha|cypress|e2e|unit.*test|integration.*test/i,
      /\.test\.|\.spec\.|__tests__|test.*suite/i,
    ];

    const isTest =
      testPatterns.some((pattern) => pattern.test(allText)) ||
      category.startsWith('test-') ||
      ['missing-test', 'test-setup', 'test-refactor', 'testing'].includes(
        category,
      );

    if (isTest) {
      return 'test';
    }

    // Check if implementing a preexisting feature subtask
    if (
      taskData.feature_id ||
      taskData.implementing_feature ||
      taskData.parent_feature_id
    ) {
      return 'subtask';
    }

    // Default to feature for new functionality
    return 'feature';
  }

  /**
   * Create a task directly without triggering auto-research logic
   * @private
   */
  async _createTaskDirectly(todoData, taskData) {
    // Generate unique task ID with appropriate type prefix
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const taskTypePrefix = this._determineTaskTypeFromContent(taskData);
    const taskId = `${taskTypePrefix}_${Date.now()}_${randomSuffix}`;

    // Get research report path for research tasks
    const importantFiles = [...(taskData.important_files || [])];
    const successCriteria = [...(taskData.success_criteria || [])];

    if (taskData.mode === 'RESEARCH') {
      const researchReportPath = this.getResearchReportPath(taskId);
      if (!importantFiles.includes(researchReportPath)) {
        importantFiles.push(researchReportPath);
      }
      const reportCriterion = `Research report created: ${researchReportPath}`;
      if (!successCriteria.some((criterion) => criterion === reportCriterion)) {
        successCriteria.push(reportCriterion);
      }
    }

    // Extract phase information from title if present
    const phaseInfo = this._extractPhase(taskData.title);

    // Create task object
    const newTask = {
      id: taskId,
      title: taskData.title,
      description: taskData.description,
      mode: taskData.mode,
      category: taskData.category || 'research',
      priority: taskData.priority || 'medium',
      status: taskData.status || 'pending',
      dependencies: taskData.dependencies || [],
      important_files: importantFiles,
      success_criteria: successCriteria,
      estimate: taskData.estimate || '',
      requires_research: taskData.requires_research || false,
      subtasks: taskData.subtasks || [],
      created_at: new Date().toISOString(),
      created_by: taskData.created_by || 'system',
      auto_created_for: taskData.auto_created_for || null,
    };

    // Add phase information if extracted from title
    if (phaseInfo) {
      newTask.phase = phaseInfo;
    }

    // Allow manual phase override
    if (taskData.phase) {
      newTask.phase = taskData.phase;
    }

    // Add to tasks array and save
    this._insertTaskInCorrectSection(todoData, newTask);
    await this.writeTodo(todoData);

    return taskId;
  }

  /**
   * Generate research task title based on implementation task
   * @private
   */
  _generateResearchTitle(implementationTaskData) {
    const title = implementationTaskData.title || 'Implementation Task';
    return `Research: ${title}`;
  }

  /**
   * Generate research task description
   * @private
   */
  _generateResearchDescription(implementationTaskData, implementationTaskId) {
    const title = implementationTaskData.title || 'implementation task';
    const description = implementationTaskData.description || '';

    return `Research and analysis required for implementing: "${title}"

**Implementation Task Details:**
${description}

**Research Objectives:**
1. Investigate best practices and methodologies for this implementation
2. Identify potential challenges, risks, and mitigation strategies  
3. Research relevant technologies, frameworks, and tools
4. Define implementation approach and architecture decisions
5. Provide actionable recommendations and guidance

**Implementation Task ID:** ${implementationTaskId}

**Auto-created by:** TaskManager research dependency system
**Research Priority:** This research task must be completed before implementation begins`;
  }

  /**
   * Determine research task priority based on implementation priority
   * @private
   */
  _getResearchPriority(implementationPriority) {
    // Research tasks should generally have same or higher priority
    const priorityMap = {
      critical: 'critical',
      high: 'high',
      medium: 'high', // Boost medium to high for research
      low: 'medium', // Boost low to medium for research
    };

    // eslint-disable-next-line security/detect-object-injection -- safe access to static priority mapping with validated priority levels
    return priorityMap[implementationPriority] || 'high';
  }

  /**
   * Create an urgent task and automatically switch to it
   * This method creates a high-priority task and preserves the current task context
   * @param {Object} taskData - Task data for the urgent task
   * @param {string} agentId - Agent ID that will work on the urgent task
   * @returns {Promise<Object>} Result object containing task switch information
   */
  async createUrgentTask(taskData, agentId) {
    const logger = this.getLogger('TaskSwitching');
    const operationId = this.generateOperationId();

    logger.info(`[${operationId}] Creating urgent task and switching context`, {
      agentId,
      taskTitle: taskData.title,
      taskCategory: taskData.category,
      operationId,
    });

    try {
      // Find current task for this agent
      const currentTask = await this.getCurrentTask(agentId);

      // Create the urgent task with high priority
      const urgentTaskData = {
        ...taskData,
        priority: 'critical',
        urgent: true,
        created_by_switch: true,
        switch_context: {
          previousTaskId: currentTask?.id || null,
          switchedAt: new Date().toISOString(),
          switchReason: taskData.switchReason || 'Urgent task detected',
          agentId: agentId,
        },
      };

      const urgentTaskId = await this.createTask(urgentTaskData);

      // If there was a current task, preserve its context and mark it as switched
      if (currentTask && currentTask.status === 'in_progress') {
        await this._preserveTaskContext(currentTask.id, urgentTaskId, agentId);
      }

      // Claim the urgent task for the agent (allow out of order for urgent tasks)
      const claimResult = await this.claimTask(
        urgentTaskId,
        agentId,
        'urgent',
        { allowOutOfOrder: true },
      );

      if (!claimResult.success) {
        logger.error(`[${operationId}] Failed to claim urgent task`, {
          urgentTaskId,
          agentId,
          claimError: claimResult.reason,
          operationId,
        });
        throw new Error(`Failed to claim urgent task: ${claimResult.reason}`);
      }

      const result = {
        success: true,
        urgentTaskId: urgentTaskId,
        previousTaskId: currentTask?.id || null,
        switchedAt: new Date().toISOString(),
        action: 'task_switch',
        message: `Switched to urgent task: ${taskData.title}`,
        operationId,
      };

      logger.info(`[${operationId}] Task switch completed successfully`, {
        urgentTaskId,
        previousTaskId: currentTask?.id,
        agentId,
        operationId,
      });

      return result;
    } catch (error) {
      logger.error(`[${operationId}] Failed to create urgent task and switch`, {
        agentId,
        error: error.message,
        stack: error.stack,
        operationId,
      });
      throw error;
    }
  }

  /**
   * Preserve context when switching away from a task
   * @private
   */
  async _preserveTaskContext(currentTaskId, urgentTaskId, agentId) {
    const logger = this.getLogger('TaskPreservation');
    const operationId = this.generateOperationId();

    logger.debug(`[${operationId}] Preserving task context for switch`, {
      currentTaskId,
      urgentTaskId,
      agentId,
      operationId,
    });

    const todoData = await this.readTodo();
    const task = todoData.tasks.find((t) => t.id === currentTaskId);

    if (task) {
      // Add switch context to the task
      task.switch_context = {
        switchedTo: urgentTaskId,
        switchedAt: new Date().toISOString(),
        switchedBy: agentId,
        canResume: true,
        workProgress: task.work_progress || null,
      };

      // Mark task as switched (not pending, but can be resumed)
      task.status = 'switched';
      task.switched_at = new Date().toISOString();

      // Add to status history
      if (!task.status_history) {
        task.status_history = [];
      }
      task.status_history.push({
        from: 'in_progress',
        to: 'switched',
        timestamp: new Date().toISOString(),
        agent: agentId,
        reason: `Switched to urgent task ${urgentTaskId}`,
        operationId,
      });

      await this.writeTodo(todoData);

      logger.info(`[${operationId}] Task context preserved successfully`, {
        currentTaskId,
        urgentTaskId,
        agentId,
        operationId,
      });
    }
  }

  /**
   * Get available tasks including previously worked-on tasks for an agent
   * This method shows both current available tasks and tasks the agent was previously working on
   * @param {string} agentId - Agent ID to get tasks for
   * @returns {Promise<Object>} Available tasks with previous task context
   */
  async getAvailableTasksWithContext(agentId) {
    const logger = this.getLogger('TaskRetrieval');
    const operationId = this.generateOperationId();

    logger.info(`[${operationId}] Getting available tasks with context`, {
      agentId,
      operationId,
    });

    try {
      const todoData = await this.readTodo();

      // Get current task for agent
      const currentTask = await this.getCurrentTask(agentId);

      // Find previously worked-on tasks (switched status)
      const previousTasks = todoData.tasks
        .filter(
          (task) =>
            task.status === 'switched' &&
            task.switch_context?.switchedBy === agentId &&
            task.switch_context?.canResume,
        )
        .sort((a, b) => new Date(b.switched_at) - new Date(a.switched_at));

      // Get available pending tasks
      const availableTasks = todoData.tasks
        .filter(
          (task) =>
            task.status === 'pending' &&
            !task.assigned_agent &&
            !task.dependencies?.some((depId) => {
              const depTask = todoData.tasks.find((t) => t.id === depId);
              return !depTask || depTask.status !== 'completed';
            }),
        )
        .sort((a, b) => {
          // Sort by priority and creation time
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          const aPriority = priorityOrder[a.priority] || 2;
          const bPriority = priorityOrder[b.priority] || 2;
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          return new Date(a.created_at) - new Date(b.created_at);
        });

      const result = {
        success: true,
        agentId,
        currentTask: currentTask,
        previousTasks: previousTasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          switchedAt: task.switched_at,
          switchContext: task.switch_context,
          canResume: true,
        })),
        availableTasks: availableTasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          created_at: task.created_at,
          dependencies: task.dependencies || [],
        })),
        summary: {
          hasCurrentTask: !!currentTask,
          previousTasksCount: previousTasks.length,
          availableTasksCount: availableTasks.length,
        },
        operationId,
      };

      logger.info(`[${operationId}] Retrieved tasks with context`, {
        agentId,
        hasCurrentTask: !!currentTask,
        previousTasksCount: previousTasks.length,
        availableTasksCount: availableTasks.length,
        operationId,
      });

      return result;
    } catch (error) {
      logger.error(
        `[${operationId}] Failed to get available tasks with context`,
        {
          agentId,
          error: error.message,
          stack: error.stack,
          operationId,
        },
      );
      throw error;
    }
  }

  /**
   * Resume a previously switched task
   * @param {string} taskId - ID of the task to resume
   * @param {string} agentId - Agent ID resuming the task
   * @returns {Promise<Object>} Resume operation result
   */
  async resumeSwitchedTask(taskId, agentId) {
    const logger = this.getLogger('TaskResume');
    const operationId = this.generateOperationId();

    logger.info(`[${operationId}] Resuming switched task`, {
      taskId,
      agentId,
      operationId,
    });

    try {
      const todoData = await this.readTodo();
      const task = todoData.tasks.find((t) => t.id === taskId);

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (task.status !== 'switched') {
        throw new Error(
          `Task ${taskId} is not in switched status (current: ${task.status})`,
        );
      }

      if (task.switch_context?.switchedBy !== agentId) {
        throw new Error(`Task ${taskId} was not switched by agent ${agentId}`);
      }

      if (!task.switch_context?.canResume) {
        throw new Error(`Task ${taskId} cannot be resumed`);
      }

      // Check if agent has a current task and switch it if needed
      const currentTask = await this.getCurrentTask(agentId);
      if (currentTask && currentTask.status === 'in_progress') {
        await this._preserveTaskContext(currentTask.id, taskId, agentId);
      }

      // Resume the task
      task.status = 'in_progress';
      task.resumed_at = new Date().toISOString();
      task.assigned_agent = agentId;
      delete task.switched_at;

      // Update switch context
      task.switch_context.resumedAt = new Date().toISOString();
      task.switch_context.resumedBy = agentId;

      // Add to status history
      if (!task.status_history) {
        task.status_history = [];
      }
      task.status_history.push({
        from: 'switched',
        to: 'in_progress',
        timestamp: new Date().toISOString(),
        agent: agentId,
        reason: 'Task resumed from switched status',
        operationId,
      });

      await this.writeTodo(todoData);

      const result = {
        success: true,
        taskId,
        agentId,
        resumedAt: task.resumed_at,
        message: `Successfully resumed task: ${task.title}`,
        operationId,
      };

      logger.info(`[${operationId}] Task resumed successfully`, {
        taskId,
        agentId,
        taskTitle: task.title,
        operationId,
      });

      return result;
    } catch (error) {
      logger.error(`[${operationId}] Failed to resume switched task`, {
        taskId,
        agentId,
        error: error.message,
        stack: error.stack,
        operationId,
      });
      throw error;
    }
  }

  /**
   * Enhanced getCurrentTask that handles task switching scenarios
   * This method checks for urgent tasks and handles automatic switching
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object>} Current task or task switching guidance
   */
  async getCurrentTaskWithSwitching(agentId) {
    const logger = this.getLogger('TaskSwitching');
    const operationId = this.generateOperationId();

    logger.debug(`[${operationId}] Getting current task with switching logic`, {
      agentId,
      operationId,
    });

    try {
      const todoData = await this.readTodo();

      // First check for any urgent tasks that need immediate attention
      const urgentTasks = todoData.tasks
        .filter(
          (task) =>
            task.status === 'pending' &&
            task.priority === 'critical' &&
            task.urgent === true &&
            !task.assigned_agent,
        )
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      // If there are urgent tasks, check if we should switch
      if (urgentTasks.length > 0) {
        const currentTask = await this.getCurrentTask(agentId);

        // Only switch if current task is not also urgent/critical
        if (
          currentTask &&
          currentTask.priority !== 'critical' &&
          !currentTask.urgent
        ) {
          const urgentTask = urgentTasks[0];

          logger.info(
            `[${operationId}] Urgent task detected, recommending switch`,
            {
              agentId,
              currentTaskId: currentTask.id,
              urgentTaskId: urgentTask.id,
              operationId,
            },
          );

          return {
            action: 'urgent_task_switch_recommended',
            currentTask: currentTask,
            urgentTask: urgentTask,
            switchRecommendation: {
              reason: 'Critical urgent task requires immediate attention',
              urgentTaskTitle: urgentTask.title,
              urgentTaskCategory: urgentTask.category,
              canSwitchBack: true,
            },
            message: `Urgent task detected: ${urgentTask.title}. Consider switching from current task.`,
            operationId,
          };
        }
      }

      // No urgent switching needed, return regular current task
      const currentTask = await this.getCurrentTask(agentId);

      return {
        action: 'continue_current_task',
        currentTask: currentTask,
        operationId,
      };
    } catch (error) {
      logger.error(
        `[${operationId}] Failed to get current task with switching`,
        {
          agentId,
          error: error.message,
          stack: error.stack,
          operationId,
        },
      );
      throw error;
    }
  }

  /**
   * Utility method to generate operation IDs for logging
   * @private
   */
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get logger instance for task switching operations
   * @private
   */
  getLogger(component = 'TaskManager') {
    // Simple logger implementation for comprehensive logging
    return {
      info: (message, context = {}) => {
        logger.info(
          `[INFO] [${component}] ${message}`,
          JSON.stringify(context, null, 2),
        );
      },
      debug: (message, context = {}) => {
        if (process.env.DEBUG) {
          logger.debug(
            `[DEBUG] [${component}] ${message}`,
            JSON.stringify(context, null, 2),
          );
        }
      },
      warn: (message, context = {}) => {
        logger.warn(
          `[WARN] [${component}] ${message}`,
          JSON.stringify(context, null, 2),
        );
      },
      error: (message, context = {}) => {
        logger.error(
          `[ERROR] [${component}] ${message}`,
          JSON.stringify(context, null, 2),
        );
      },
    };
  }

  /**
   * CRITICAL CORRUPTION PREVENTION: Validate TODO.json data structure before writing
   * This prevents malformed data from corrupting the file
   * @private
   * @param {Object} data - TODO.json data to validate
   * @throws {Error} If data structure is invalid
   */
  _validateTodoDataStructure(data) {
    // Basic structure validation
    if (!data || typeof data !== 'object') {
      throw new Error('TODO.json data must be an object');
    }

    // Prevent string data (major corruption source)
    if (typeof data === 'string') {
      throw new Error(
        'TODO.json data cannot be a string - this causes corruption',
      );
    }

    // Required fields validation
    const requiredFields = ['project', 'tasks', 'current_mode'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        logger.warn(`Missing required field in TODO.json: ${field}`);
        // Auto-fix missing fields
        if (field === 'project') {
          data.project = 'unknown-project';
        }
        if (field === 'tasks') {
          data.tasks = [];
        }
        if (field === 'current_mode') {
          data.current_mode = 'DEVELOPMENT';
        }
      }
    }

    // Validate tasks array
    if (!Array.isArray(data.tasks)) {
      logger.warn('TODO.json tasks is not an array, converting');
      data.tasks = [];
    }

    // Validate each task structure
    data.tasks.forEach((task, index) => {
      if (!task || typeof task !== 'object') {
        throw new Error(`Task at index ${index} is not a valid object`);
      }
      if (!task.id || typeof task.id !== 'string') {
        throw new Error(`Task at index ${index} missing valid id field`);
      }
      if (!task.title || typeof task.title !== 'string') {
        throw new Error(`Task at index ${index} missing valid title field`);
      }
    });

    // Validate features array if present
    if (data.features && !Array.isArray(data.features)) {
      logger.warn('TODO.json features is not an array, converting');
      data.features = [];
    }

    // Validate feature objects and ensure phases field exists ONLY for features
    if (data.features && Array.isArray(data.features)) {
      data.features.forEach((feature, index) => {
        if (!feature || typeof feature !== 'object') {
          logger.warn(`Feature at index ${index} is not a valid object, skipping`);
          return;
        }

        // Initialize phases array if not present (FEATURE-ONLY functionality)
        if (!feature.phases) {
          feature.phases = [];
        } else if (!Array.isArray(feature.phases)) {
          logger.warn(`Feature ${feature.id || index}: phases field is not an array, converting to empty array`);
          feature.phases = [];
        }

        // Validate phase objects structure
        feature.phases.forEach((phase, phaseIndex) => {
          if (!phase || typeof phase !== 'object') {
            logger.warn(`Feature ${feature.id || index}: phase at index ${phaseIndex} is not a valid object`);
            return;
          }

          // Ensure required phase fields exist
          if (!phase.number || typeof phase.number !== 'number') {
            phase.number = phaseIndex + 1;
          }
          if (!phase.title || typeof phase.title !== 'string') {
            phase.title = `Phase ${phase.number}`;
          }
          if (!phase.status || typeof phase.status !== 'string') {
            phase.status = 'pending';
          }
          if (!phase.created_at) {
            phase.created_at = new Date().toISOString();
          }
        });

        // Sort phases by number to maintain correct order
        feature.phases.sort((a, b) => (a.number || 0) - (b.number || 0));
      });
    }

    // Validate agents object if present
    if (data.agents && typeof data.agents !== 'object') {
      logger.warn('TODO.json agents is not an object, converting');
      data.agents = {};
    }

    logger.info('✅ TODO.json data structure validation passed');
  }
}

module.exports = TaskManager;
