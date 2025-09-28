/**
 * Centralized Structured Logging Utility
 *
 * Provides consistent structured logging across the entire application using Pino.
 * Replaces console.log calls with structured JSON logging for better observability
 * and monitoring in production environments.
 *
 * Features:
 * - Structured JSON logging with consistent fields
 * - Context-aware logging (agentId, taskId, operationId)
 * - Performance metrics and timing information
 * - Error tracking with stack traces
 * - Development and production-friendly output formats
 */

const pino = require('pino');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Logger configuration
const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
    log: (object) => {
      // Add consistent metadata to all log entries
      return {
        ...object,
        hostname: os.hostname(),
        pid: process.pid,
        service: 'infinite-continue-stop-hook',
        version: process.env.npm_package_version || '1.0.0',
      };
    },
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  // Pretty print in development, JSON in production
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname,service,version',
    },
  } : undefined,
};

// Create base logger
const baseLogger = pino(loggerConfig);

/**
 * Creates a contextual logger with agent/task/operation context
 * @param {Object} context - Context information
 * @param {string} context.agentId - Unique agent identifier
 * @param {string} context.taskId - Task identifier
 * @param {string} context.operationId - Operation identifier
 * @param {string} context.module - Module or component name
 * @returns {Object} Contextual logger instance
 */
function createContextLogger(context = {}) {
  const contextData = {
    agentId: context.agentId || 'unknown',
    taskId: context.taskId || null,
    operationId: context.operationId || null,
    module: context.module || 'main',
  };

  return baseLogger.child(contextData);
}

/**
 * Performance timing utility for operations
 * @param {Object} logger - Logger instance
 * @param {string} operationName - Name of the operation being timed
 * @returns {Function} Function to call when operation completes
 */
function timeOperation(logger, operationName) {
  const startTime = process.hrtime.bigint();

  logger.info({
    operation: operationName,
    status: 'started',
  }, `Starting operation: ${operationName}`);

  return function endTiming(result = {}) {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    logger.info({
      operation: operationName,
      status: 'completed',
      duration_ms: durationMs,
      ...result,
    }, `Completed operation: ${operationName} in ${durationMs.toFixed(2)}ms`);

    return { duration_ms: durationMs, ...result };
  };
}

/**
 * Structured error logging with stack traces and context
 * @param {Object} logger - Logger instance
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 * @param {string} message - Custom error message
 */
function logError(logger, error, context = {}, message = 'An error occurred') {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code || null,
    },
    ...context,
  }, message);
}

/**
 * Log API request/response for audit trail
 * @param {Object} logger - Logger instance
 * @param {string} method - HTTP method or API method
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Request parameters
 * @param {Object} response - Response data (sanitized)
 * @param {number} duration - Request duration in ms
 */
function logApiCall(logger, method, endpoint, params = {}, response = {}, duration = 0) {
  // Sanitize sensitive data
  const sanitizedParams = { ...params };
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];

  for (const key of Object.keys(sanitizedParams)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitizedParams[key] = '[REDACTED]';
    }
  }

  logger.info({
    api_call: {
      method,
      endpoint,
      params: sanitizedParams,
      response_status: response.status || 'success',
      duration_ms: duration,
    },
  }, `API Call: ${method} ${endpoint}`);
}

/**
 * Create specialized loggers for different components
 */
const loggers = {
  // Main application logger
  app: createContextLogger({ module: 'app' }),

  // Task management logger
  taskManager: createContextLogger({ module: 'taskManager' }),

  // Agent operations logger
  agent: createContextLogger({ module: 'agent' }),

  // Validation system logger
  validation: createContextLogger({ module: 'validation' }),

  // Stop hook logger
  stopHook: createContextLogger({ module: 'stopHook' }),

  // Performance metrics logger
  performance: createContextLogger({ module: 'performance' }),

  // Security and audit logger
  security: createContextLogger({ module: 'security' }),

  // Database operations logger
  database: createContextLogger({ module: 'database' }),

  // API logger
  api: createContextLogger({ module: 'api' }),
};

/**
 * Legacy file-based logger for backward compatibility with stop hook
 * Maintains the original interface while adding structured logging capabilities
 */
class LegacyLogger {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.logger = createContextLogger({ module: 'stopHook', projectRoot });

    // Configure logging to development/logs directory
    const logsDir = path.join(projectRoot, 'development', 'logs');
    // Ensure logs directory exists
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Validated project logs directory path
    if (!fs.existsSync(logsDir)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Validated project logs directory path
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logPath = path.join(logsDir, 'infinite-continue-hook.log');
    this.logData = {
      execution: {
        timestamp: new Date().toISOString(),
        projectRoot: projectRoot,
        hookVersion: '1.0.0',
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        pid: process.pid,
        cwd: process.cwd(),
      },
      input: {},
      projectState: {},
      decisions: [],
      flow: [],
      output: {},
      errors: [],
    };
  }

  logInput(hookInput) {
    this.logData.input = {
      sessionId: hookInput.session_id,
      transcriptPath: hookInput.transcript_path,
      stopHookActive: hookInput.stop_hook_active,
      rawInput: hookInput,
    };
    this.logger.info({ hookInput }, 'Received input from Claude Code');
    this.addFlow('Received input from Claude Code');
  }

  logProjectState(todoData, todoPath) {
    this.logData.projectState = {
      todoPath: todoPath,
      project: todoData.project,
      totalTasks: todoData.tasks.length,
      pendingTasks: todoData.tasks.filter(t => t.status === 'pending').length,
      inProgressTasks: todoData.tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: todoData.tasks.filter(t => t.status === 'completed').length,
      lastMode: todoData.last_mode,
      reviewStrikes: todoData.review_strikes,
      strikesCompletedLastRun: todoData.strikes_completed_last_run,
      availableModes: todoData.available_modes,
    };
    this.logger.info({ projectState: this.logData.projectState }, 'Loaded project state from TODO.json');
    this.addFlow('Loaded project state from TODO.json');
  }

  logCurrentTask(task) {
    if (task) {
      this.logData.projectState.currentTask = {
        id: task.id,
        title: task.title,
        description: task.description,
        mode: task.mode,
        priority: task.priority,
        status: task.status,
        isReviewTask: task.is_review_task,
        strikeNumber: task.strike_number,
      };
      this.logger.info({ task: this.logData.projectState.currentTask }, `Selected task: ${task.title} (${task.id})`);
      this.addFlow(`Selected task: ${task.title} (${task.id})`);
    } else {
      this.logData.projectState.currentTask = null;
      this.logger.info('No tasks available');
      this.addFlow('No tasks available');
    }
  }

  logModeDecision(previousMode, selectedMode, reason) {
    const decision = {
      type: 'mode_selection',
      timestamp: new Date().toISOString(),
      previousMode: previousMode,
      selectedMode: selectedMode,
      reason: reason,
    };
    this.logData.decisions.push(decision);
    this.logger.info({ decision }, `Mode decision: ${previousMode || 'none'} → ${selectedMode} (${reason})`);
    this.addFlow(`Mode decision: ${previousMode || 'none'} → ${selectedMode} (${reason})`);
  }

  logStrikeHandling(strikeResult, todoData) {
    const decision = {
      type: 'strike_handling',
      timestamp: new Date().toISOString(),
      action: strikeResult.action,
      message: strikeResult.message,
      currentStrikes: todoData.review_strikes,
      strikesCompleted: todoData.strikes_completed_last_run,
    };
    this.logData.decisions.push(decision);
    this.logger.info({ decision }, `Strike handling: ${strikeResult.action} - ${strikeResult.message || 'continue'}`);
    this.addFlow(`Strike handling: ${strikeResult.action} - ${strikeResult.message || 'continue'}`);
  }

  logPromptGeneration(prompt, additionalInstructions) {
    this.logData.output = {
      promptLength: prompt.length,
      additionalInstructionsLength: additionalInstructions.length,
      totalLength: prompt.length + additionalInstructions.length,
      promptPreview: prompt.substring(0, 500) + '...',
      timestamp: new Date().toISOString(),
    };
    this.logger.info({ output: this.logData.output }, 'Generated prompt for Claude');
    this.addFlow('Generated prompt for Claude');
  }

  logExit(code, reason) {
    this.logData.output.exitCode = code;
    this.logData.output.exitReason = reason;
    this.logger.info({ exitCode: code, exitReason: reason }, `Exiting with code ${code}: ${reason}`);
    this.addFlow(`Exiting with code ${code}: ${reason}`);
  }

  logError(error, context) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      context: context,
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
    this.logData.errors.push(errorEntry);
    logError(this.logger, error, { context }, `ERROR in ${context}: ${error.message}`);
    this.addFlow(`ERROR in ${context}: ${error.message}`);
  }

  addFlow(message) {
    this.logData.flow.push({
      timestamp: new Date().toISOString(),
      message: message,
    });
    this.logger.trace({ flowMessage: message }, message);
  }

  save() {
    try {
      // Add final timestamp
      this.logData.execution.endTimestamp = new Date().toISOString();

      // Calculate execution duration
      const start = new Date(this.logData.execution.timestamp);
      const end = new Date(this.logData.execution.endTimestamp);
      this.logData.execution.durationMs = end - start;

      // Write log file (overwrites existing)
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Validated project log file path
      fs.writeFileSync(this.logPath, JSON.stringify(this.logData, null, 2), 'utf8');

      this.logger.info({
        logPath: this.logPath,
        durationMs: this.logData.execution.durationMs,
        errors: this.logData.errors.length,
      }, 'Saved execution log');

      // Also save a copy with timestamp for debugging if needed
      if (this.logData.errors.length > 0) {
        const debugPath = path.join(this.projectRoot, `.hook-debug-${Date.now()}.json`);
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Validated project debug log path
        fs.writeFileSync(debugPath, JSON.stringify(this.logData, null, 2), 'utf8');
        this.logger.warn({ debugPath }, 'Saved debug log due to errors');
      }
    } catch (error) {
      // Don't let logging errors crash the hook - but log it with structured logger
      logError(this.logger, error, {}, 'Failed to save legacy log file');
    }
  }
}

// Export logger utilities
module.exports = {
  // Base logger for direct use
  logger: baseLogger,

  // Specialized component loggers
  loggers,

  // Utility functions
  createContextLogger,
  timeOperation,
  logError,
  logApiCall,

  // Legacy Logger class for backward compatibility
  Logger: LegacyLogger,

  // Convenience methods for migration from console.log
  info: (message, data = {}) => baseLogger.info(data, message),
  warn: (message, data = {}) => baseLogger.warn(data, message),
  error: (message, data = {}) => baseLogger.error(data, message),
  debug: (message, data = {}) => baseLogger.debug(data, message),
  trace: (message, data = {}) => baseLogger.trace(data, message),

  // Legacy console replacements (for gradual migration)
  log: (message, ...args) => {
    if (typeof message === 'object') {
      baseLogger.info(message);
    } else {
      baseLogger.info({ args }, message);
    }
  },

  // Performance metrics helpers
  metrics: {
    counter: (name, value = 1, labels = {}) => {
      loggers.performance.info({
        metric_type: 'counter',
        metric_name: name,
        metric_value: value,
        labels,
      }, `Counter: ${name} = ${value}`);
    },

    gauge: (name, value, labels = {}) => {
      loggers.performance.info({
        metric_type: 'gauge',
        metric_name: name,
        metric_value: value,
        labels,
      }, `Gauge: ${name} = ${value}`);
    },

    histogram: (name, value, labels = {}) => {
      loggers.performance.info({
        metric_type: 'histogram',
        metric_name: name,
        metric_value: value,
        labels,
      }, `Histogram: ${name} = ${value}`);
    },
  },
};
