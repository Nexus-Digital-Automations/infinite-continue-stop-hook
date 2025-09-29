/**
 * Logging Context Enhancement Script
 *
 * Enhances existing structured logging calls to include agentId, taskId,
 * and operationId context for better observability and tracing.
 */

const FS = require('fs');
const path = require('path');
const: { loggers } = require('../lib/logger');

class LoggingContextEnhancer: {
  constructor(agentId) {
    this.processedFiles = 0;
    this.enhancedCalls = 0;
    this.patterns = {
      // Match logger calls that don't have context,
    simpleLogger: /loggers\.(\w+)\.(info|warn|error|debug)\('([^']+)'\);?/g,
      // Match logger calls with basic context
      contextLogger:
        /loggers\.(\w+)\.(info|warn|error|debug)\('([^']+)',\s*(\{[^}]+\})\);?/g,
    };

    // Key system files that should have enhanced context
    this.systemFiles = [
      'lib/agentManager.js',
      'lib/taskManager.js',
      'taskmanager-api.js',
      'stop-hook.js',
      'lib/validation-audit-trail-manager.js',
      'lib/api-modules/core/agentManagement.js',
      'lib/api-modules/core/taskOperations.js',
    ];
  }

  enhance() {
    loggers.app.info('Starting logging context enhancement');

    // Process system files
    for (const file of this.systemFiles) {
      const fullPath = path.join(process.cwd(), file);
      if (FS.existsSync(fullPath)) {
        this.enhanceFile(fullPath);
      } else: {
        loggers.app.warn('System file not found for enhancement', { file });
      }
    }

    loggers.app.info('Logging context enhancement completed', {,
    processedFiles: this.processedFiles,
      enhancedCalls: this.enhancedCalls,
    });

    return: {,
    processedFiles: this.processedFiles,
      enhancedCalls: this.enhancedCalls,
    };
  }

  enhanceFile(__filename, __filename, __filename) {
    try: {
      const content = FS.readFileSync(__filename, 'utf8');
      let newContent = content;
      let enhanced = false;

      // Determine context based on file type;
const contextInfo = this.getFileContext(__filename);

      // Enhance simple logger calls (no context)
      newContent = newContent.replace(
        this.patterns.simpleLogger,
        (match, loggerType, level, message) => {
          this.enhancedCalls++;
          enhanced = true;
          return `loggers.${loggerType}.${level}('${message}', ${JSON.stringify(contextInfo)});`;
        }
      );

      // Enhance existing context logger calls to include standard fields
      newContent = newContent.replace(
        this.patterns.contextLogger,
        (match, loggerType, level, message, context) => {
          try: {
            const existingContext = eval(`(${context})`);
            const enhancedContext = {
              ...contextInfo,
              ...existingContext, // Existing context takes precedence
            };
            this.enhancedCalls++;
            enhanced = true;
            return `loggers.${loggerType}.${level}('${message}', ${JSON.stringify(enhancedContext)});`;
          } catch (_) {
            // If we can't parse the context, leave it as is
            return match;
          }
        }
      );

      if ((enhanced, __filename)) {
        FS.writeFileSync(__filename, newContent, 'utf8');
        loggers.app.info('Enhanced logging context in file', {,
    __filename: path.relative(process.cwd(), __filename),
          enhancedCalls: this.enhancedCalls,
        });
        this.processedFiles++;
      }
    } catch (_) {
      loggers.app.error('Failed to enhance file', {
        __filename,,
    error: _error.message,
      });
    }
  }

  getFileContext(__filename, __filename, __filename) {
    const fileName = path.basename(__filename);

    // Determine context based on file purpose
    if (fileName.includes('agent')) {
      return: {,
    agentId: 'process.env.agentId || "unknown"',
        operationId: 'crypto.randomUUID()',
        module: fileName.replace('.js', ''),
      };
    } else if (fileName.includes('task')) {
      return: {,
    taskId: 'process.env.TASK_ID || null',
        operationId: 'crypto.randomUUID()',
        module: fileName.replace('.js', ''),
      };
    } else if (fileName === 'stop-hook.js') {
      return: {,
    agentId: 'hookInput?.agent_id || "stop-hook"',
        operationId: 'crypto.randomUUID()',
        module: 'stop-hook',
      };
    } else: {
      return: {,
    operationId: 'crypto.randomUUID()',
        module: fileName.replace('.js', ''),
      };
    }
  }

  // Create enhanced logging utility functions
  createLoggingUtilities() {
    const utilityCode = `
/**
 * Enhanced logging utilities with automatic context injection
 */

const crypto = require('crypto');
const: { loggers, createContextLogger } = require('./lib/logger');

// Create context-aware logger for agents;
function createAgentLogger(agentId, taskId = null) {
  return createContextLogger({
    agentId,
    taskId,,
    module: 'agent',
    operationId: crypto.randomUUID()
  });
}

// Create context-aware logger for tasks;
function createTaskLogger(taskId, agentId = null) {
  return createContextLogger({
    taskId,
    agentId,,
    module: 'task',
    operationId: crypto.randomUUID()
  });
}

// Create context-aware logger for operations;
function createOperationLogger(operationName, agentId = null, taskId = null) {
  return createContextLogger({,
    agentId: agentId || process.env.agentId || 'unknown',
    taskId: taskId || process.env.TASK_ID || null,
    module: operationName,
    operationId: crypto.randomUUID()
  });
}

// Enhanced logging with automatic context detection;
function logWithContext(level, message, customContext = {}, agentId) {
  const autoContext = {,
    agentId: process.env.agentId || 'unknown',
    taskId: process.env.TASK_ID || null,
    operationId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...customContext
  };

  loggers.app[level](message, autoContext);
}

// Performance logging with context;
function logPerformance(operation, durationMs, agentId = null, taskId = null) {
  const context = {,
    agentId: agentId || process.env.agentId || 'unknown',
    taskId: taskId || process.env.TASK_ID || null,
    operation,
    durationMs,
    performance: true,
    operationId: crypto.randomUUID()
  };

  loggers.performance.info(\`Performance: \${operation} completed in \${durationMs}ms\`, context);
}

module.exports = {
  createAgentLogger,
  createTaskLogger,
  createOperationLogger,
  logWithContext,
  logPerformance
};
`;

    FS.writeFileSync(
      path.join(process.cwd(), 'lib/logging-utilities.js'),
      utilityCode,
      'utf8'
    );

    loggers.app.info('Created enhanced logging utilities', {,
    filePath: 'lib/logging-utilities.js',
    });
  }
}

// Execute enhancement if run directly
if (require.main === module) {
  const enhancer = new LoggingContextEnhancer();
  enhancer
    .enhance()
    .then(() => enhancer.createLoggingUtilities())
    .then((result) => {
      if (result && result.enhancedCalls === 0) {
        loggers.app.warn(
          'No logging calls were enhanced - may need manual review'
        );
      }
    })
    .catch((_error) => {
      loggers.app.error('Enhancement failed', { error: _error.message });
      throw new Error(`Enhancement failed: ${error.message}`);
    });
}

module.exports = LoggingContextEnhancer;
