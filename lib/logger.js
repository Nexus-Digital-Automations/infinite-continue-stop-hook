const _fs = require('fs');
const _path = require('path');
const _os = require('os');

/**
 * Security utilities for path validation in Logger
 */
class LoggerSecurityValidator {
  /**
   * Validates that a log file path is safe and within project boundaries
   * @param {string} filePath - The file path to validate
   * @param {string} projectRoot - The project root directory
   * @returns {Object} Validation result with sanitized path
   */
  static validateLogFilePath(filePath, projectRoot) {
    if (typeof filePath !== 'string' || !filePath.trim()) {
      throw new Error('Log file path must be a non-empty string');
    }

    try {
      // Normalize and resolve the path to prevent directory traversal
      const normalizedPath = _path.normalize(filePath);
      const resolvedPath = _path.resolve(normalizedPath);
      const resolvedProjectRoot = _path.resolve(projectRoot);

      // Ensure the path is within the project root (prevent directory traversal)
      if (!resolvedPath.startsWith(resolvedProjectRoot)) {
        throw new Error('Log file path must be within project directory');
      }

      // Check for dangerous path components
      const dangerousPatterns = [/\.\.[/\\]/, /[/\\]\.\./];
      if (dangerousPatterns.some(pattern => pattern.test(filePath))) {
        throw new Error('Log file path contains dangerous traversal patterns');
      }

      // Only allow log files in project root or subdirectories
      const allowedExtensions = ['.log', '.json'];
      const ext = _path.extname(resolvedPath);
      if (!allowedExtensions.includes(ext)) {
        throw new Error(`Log files must have allowed extensions: ${allowedExtensions.join(', ')}`);
      }

      return resolvedPath;
    } catch (error) {
      throw new Error(`Log file path validation failed: ${error.message}`);
    }
  }
}

class Logger {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    // Configure logging to development/logs directory
    const logsDir = _path.join(projectRoot, 'development', 'logs');
    // Ensure logs directory exists
    if (!_fs.existsSync(logsDir)) {
      _fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logPath = _path.join(logsDir, 'infinite-continue-hook.log');
    this.logData = {
      execution: {
        timestamp: new Date().toISOString(),
        projectRoot: projectRoot,
        hookVersion: '1.0.0',
        nodeVersion: process.version,
        platform: _os.platform(),
        arch: _os.arch(),
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
      this.addFlow(`Selected task: ${task.title} (${task.id})`);
    } else {
      this.logData.projectState.currentTask = null;
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
    this.addFlow(`Strike handling: ${strikeResult.action} - ${strikeResult.message || 'continue'}`);
  }

  // Review injection logging removed - no automatic task injection

  logPromptGeneration(prompt, additionalInstructions) {
    this.logData.output = {
      promptLength: prompt.length,
      additionalInstructionsLength: additionalInstructions.length,
      totalLength: prompt.length + additionalInstructions.length,
      promptPreview: prompt.substring(0, 500) + '...',
      timestamp: new Date().toISOString(),
    };
    this.addFlow('Generated prompt for Claude');
  }

  logExit(code, reason) {
    this.logData.output.exitCode = code;
    this.logData.output.exitReason = reason;
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
    this.addFlow(`ERROR in ${context}: ${error.message}`);
  }

  addFlow(message) {
    this.logData.flow.push({
      timestamp: new Date().toISOString(),
      message: message,
    });
  }

  save() {
    try {
      // Add final timestamp
      this.logData.execution.endTimestamp = new Date().toISOString();

      // Calculate execution duration
      const start = new Date(this.logData.execution.timestamp);
      const end = new Date(this.logData.execution.endTimestamp);
      this.logData.execution.durationMs = end - start;

      // Security: Validate log file path before writing
      const validatedLogPath = LoggerSecurityValidator.validateLogFilePath(
        this.logPath,
        this.projectRoot,
      );

      // Write log file (overwrites existing)
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      _fs.writeFileSync(
        validatedLogPath,
        JSON.stringify(this.logData, null, 2),
        'utf8',
      );

      // Also save a copy with timestamp for debugging if needed
      if (this.logData.errors.length > 0) {
        const debugPath = _path.join(
          this.projectRoot,
          `.hook-debug-${Date.now()}.json`,
        );
        // Security: Validate debug path before writing
        const validatedDebugPath = LoggerSecurityValidator.validateLogFilePath(
          debugPath,
          this.projectRoot,
        );
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        _fs.writeFileSync(validatedDebugPath, JSON.stringify(this.logData, null, 2), 'utf8');
      }
    } catch {
      // Don't let logging errors crash the hook - silently fail
      // Error details would be available in error.message if needed for debugging
    }
  }
}

module.exports = Logger;
