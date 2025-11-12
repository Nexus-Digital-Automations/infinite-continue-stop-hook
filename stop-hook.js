#!/usr/bin/env node
/* eslint-disable no-console */

/*
 * Stop Hook CLI Tool - Console output is intentional for user feedback
 * and instructive task management messaging.
 */

const FS = require('fs');
const path = require('path');
const TASK_MANAGER = require('./lib/taskManager');
const LOGGER = require('./lib/logger');
const { loggers } = require('./lib/logger');
const VALIDATION_DEPENDENCY_MANAGER = require('./lib/validationDependencyManager');

// ============================================================================
// NEVER-STOP INFINITE CONTINUE HOOK WITH INSTRUCTIVE TASK MANAGEMENT
// ============================================================================

/**
 * Find the root "Claude Coding Projects" directory containing TASKS.json
 */
function findClaudeProjectRoot(
  startDir = process.cwd(),
  _category = 'general',
) {
  let currentDir = startDir;

  // Look for "Claude Coding Projects" in the path And check for TASKS.json
  while (currentDir !== path.dirname(currentDir)) {
    // Not at filesystem root
    // Check if we're in or found "Claude Coding Projects"
    if (currentDir.includes('Claude Coding Projects')) {
      // Look for TASKS.json in potential project roots;
      const segments = currentDir.split(path.sep);
      const claudeIndex = segments.findIndex((segment) =>
        segment.includes('Claude Coding Projects'),
      );

      if (claudeIndex !== -1 && claudeIndex < segments.length - 1) {
        // Try the next directory after "Claude Coding Projects"
        const projectDir = segments.slice(0, claudeIndex + 2).join(path.sep);
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script validating project structure with computed paths
        if (FS.existsSync(path.join(projectDir, 'TASKS.json'))) {
          return projectDir;
        }
      }

      // Also check current directory
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script validating project structure with computed paths
      if (FS.existsSync(path.join(currentDir, 'TASKS.json'))) {
        return currentDir;
      }
    }

    currentDir = path.dirname(currentDir);
  }

  // Fallback to original behavior
  return startDir;
}

/**
 * Check if stop is allowed via endpoint trigger
 */
/**
 * Feature 1: Validation Progress Reporting with Dependency Management
 * Enhanced stop authorization checking with comprehensive validation progress reporting
 * Provides real-time visibility into validation progress, completion percentage, detailed status,
 * dependency relationships, And intelligent execution planning
 */
function generateValidationProgressReport(
  flagData,
  logger,
  _workingDir,
  _category = 'general',
) {
  // Initialize dependency manager for intelligent validation ordering;
  const dependencyManager = new VALIDATION_DEPENDENCY_MANAGER(_workingDir);

  // Validate dependency configuration;
  const configValidation = dependencyManager.validateDependencyConfiguration();
  if (!configValidation.valid) {
    logger.warn(
      `Validation dependency configuration issues: ${configValidation.issues.map((i) => i.message).join(', ')}`,
    );
  }

  // Get dependency-aware execution information;
  const executionOrder = dependencyManager.getValidationOrder();
  const parallelGroups = dependencyManager.getParallelExecutionPlan();
  const timeEstimates = dependencyManager.getExecutionTimeEstimates();

  const progressReport = {
    totalValidations: executionOrder.length,
    completedValidations: 0,
    failedValidations: 0,
    validationDetails: [],
    overallProgress: 0,
    estimatedTimeRemaining: 0,
    lastValidationTime: new Date().toISOString(),
    // Add dependency management information
    dependencyInfo: {
      executionOrder,
      parallelGroups,
      timeEstimates,
      configurationValid: configValidation.valid,
      configurationIssues: configValidation.issues,
    },
  };

  // Load custom validation rules from project configuration;
  function loadCustomValidationRules(_workingDir, _category = 'general') {
    const customRules = [];
    try {
      // Implementation would go here to load custom rules
      return customRules;
    } catch (_) {
      logger.warn(`Failed to load custom validation rules: ${_.message}`);
      return customRules;
    }
  }

  // Use dependency-aware validation criteria in execution order;
  const customRules = loadCustomValidationRules(_workingDir);
  // const CUSTOM_CRITERIA_IDS = customRules.map((rule) => rule.id);

  // Add any custom criteria to dependency manager
  customRules.forEach((rule) => {
    dependencyManager.addCustomCriterion(rule.id, {
      dependencies: rule.dependencies || [],
      parallel_group: rule.parallel_group || 'custom',
      estimated_duration: rule.estimated_duration || 60,
      description: rule.description || rule.Name || '',
    });
  });

  // Get updated execution order including custom criteria;
  const validationCriteria = dependencyManager.getValidationOrder();

  // Process validation results from flag data
  if (flagData.validation_results) {
    for (const criteria of validationCriteria) {
      // eslint-disable-next-line security/detect-object-injection -- Property access validated through input validation
      const result = flagData.validation_results[criteria];
      if (result) {
        progressReport.validationDetails.push({
          criterion: criteria,
          status: result.status || 'pending',
          duration: result.duration || 0,
          message: result.message || 'No details available',
          timestamp: result.timestamp || new Date().toISOString(),
          progress:
            result.status === 'completed'
              ? 100
              : result.status === 'failed'
                ? 0
                : 50,
        });

        if (result.status === 'completed') {
          progressReport.completedValidations++;
        } else if (result.status === 'failed') {
          progressReport.failedValidations++;
        }
      } else {
        progressReport.validationDetails.push({
          criterion: criteria,
          status: 'pending',
          duration: 0,
          message: 'Validation not yet started',
          timestamp: new Date().toISOString(),
          progress: 0,
        });
      }
    }
  }

  // Calculate overall progress percentage
  progressReport.overallProgress = Math.round(
    (progressReport.completedValidations / progressReport.totalValidations) *
      100,
  );

  // Use dependency-aware time estimation for better accuracy;
  const completedCriteria = new Set(
    progressReport.validationDetails
      .filter((v) => v.status === 'completed')
      .map((v) => v.criterion),
  );

  // Get intelligent time remaining based on parallel execution potential
  progressReport.estimatedTimeRemaining =
    timeEstimates.parallel_time_seconds || 0;

  // Adjust based on actual completion progress
  if (progressReport.completedValidations > 0) {
    const remainingCriteria = validationCriteria.filter(
      (criterion) => !completedCriteria.has(criterion),
    );
    const remainingDuration = remainingCriteria.reduce((total, criterion) => {
      return (
        total +
        // eslint-disable-next-line security/detect-object-injection -- Property access validated through input validation
        (dependencyManager.dependencies[criterion]?.estimated_duration || 60)
      );
    }, 0);
    progressReport.estimatedTimeRemaining = Math.round(remainingDuration * 0.8); // Account for parallel execution
  }

  logger.addFlow(
    `Validation progress: ${progressReport.overallProgress}% complete (${progressReport.completedValidations}/${progressReport.totalValidations})`,
  );

  return progressReport;
}

/**
 * Enhanced stop authorization checking with validation progress reporting
 * Provides comprehensive visibility into validation progress And status
 */
function checkStopAllowed(workingDir = process.cwd(), _category = 'general') {
  // Check for legacy counter-based emergency stop first (deprecated, kept for backward compatibility)
  // NOTE: New emergency stops use .stop-allowed file format with grace period
  const stopCountPath = path.join(workingDir, '.stop-count');

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script with validated working directory path
  if (FS.existsSync(stopCountPath)) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script reading validated stop count file
      const countStr = FS.readFileSync(stopCountPath, 'utf8').trim();

      // Try to parse as JSON first (new format with grace period)
      try {
        const countData = JSON.parse(countStr);
        const emergencyTimestamp = new Date(countData.timestamp).getTime();
        const now = Date.now();
        const gracePeriod = 20000; // 20 seconds
        const age = now - emergencyTimestamp;

        if (age > gracePeriod) {
          // Emergency stop expired - clean up and reject
          loggers.stopHook.warn('EMERGENCY STOP EXPIRED (LEGACY COUNTER)', {
            status: 'Emergency stop authorization expired',
            age: `${Math.round(age / 1000)}s`,
            gracePeriod: '20s',
            note: 'Emergency stop file was too old - cleaning up',
          });
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script with validated file path for cleanup
          FS.unlinkSync(stopCountPath);
          return false;
        }

        // Valid emergency stop within grace period - honor across multiple calls
        loggers.stopHook.info('EMERGENCY STOP DETECTED (LEGACY COUNTER WITH GRACE PERIOD)', {
          status: 'EMERGENCY STOP DETECTED',
          authorized_by: countData.authorized_by || 'unknown',
          timestamp: countData.timestamp,
          age: `${Math.round(age / 1000)}s`,
          gracePeriod: '20s',
          note: 'Emergency stop valid - will be honored for all stop hooks within 20-second window',
        });

        return true; // Allow stop
      } catch {
        // Not JSON - fallback to old numeric counter format
        const count = parseInt(countStr, 10);

        if (count === 1) {
          // Old format detected - convert to new format with grace period for future calls
          const newCountData = {
            count: 1,
            timestamp: new Date().toISOString(),
            authorized_by: 'legacy-counter',
            note: 'Converted from old numeric format to grace-period format',
          };

          // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script with validated file path
          FS.writeFileSync(stopCountPath, JSON.stringify(newCountData, null, 2), 'utf8');

          loggers.stopHook.info('EMERGENCY STOP - CONVERTED TO GRACE PERIOD FORMAT', {
            status: 'Old numeric counter detected and converted',
            action: 'Converted to grace-period format for persistence across multiple calls',
            gracePeriod: '20s',
            note: 'Stop will be honored for all calls within grace period',
          });

          return true; // Allow stop
        } else {
          // Counter is 0 or invalid - back to infinite mode, clean up
          loggers.stopHook.info('EMERGENCY STOP CONSUMED - RESUMING INFINITE MODE', {
            status: 'Emergency stop already used (counter at 0)',
            action: 'Cleaning up counter file and resuming infinite mode',
            note: 'Conversation will continue in infinite mode',
          });

          // Clean up the file
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script with validated file path for cleanup
          FS.unlinkSync(stopCountPath);
          return false; // Back to infinite mode
        }
      }
    } catch (error) {
      // Invalid counter file, clean up
      loggers.stopHook.warn('Invalid emergency stop counter detected - cleaning up', {
        error: error.message,
        stopCountPath,
      });

      try {
        FS.unlinkSync(stopCountPath);

      } catch {
        // Ignore cleanup errors
      }
      return false;
    }
  }

  // Check for legacy validation-based stop authorization (.stop-allowed file)
  const stopFlagPath = path.join(workingDir, '.stop-allowed');

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script with validated working directory path
  if (FS.existsSync(stopFlagPath)) {
    // Read And immediately delete the flag (single-use),
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script reading validated stop flag file;
      const flagData = JSON.parse(FS.readFileSync(stopFlagPath, 'utf8'));

      // Check if this is an emergency stop (bypasses validation reporting)
      if (flagData.session_type === 'emergency_stop' && flagData.validation_bypassed === true) {
        // Check if emergency stop is still valid (within 20-second grace period)
        const emergencyTimestamp = new Date(flagData.timestamp).getTime();
        const now = Date.now();
        const gracePeriod = 20000; // 20 seconds - handles slow stop hook intervals
        const age = now - emergencyTimestamp;

        if (age > gracePeriod) {
          // Emergency stop expired - clean up and reject
          loggers.stopHook.warn('EMERGENCY STOP EXPIRED', {
            status: 'Emergency stop authorization expired',
            age: `${Math.round(age / 1000)}s`,
            gracePeriod: '20s',
            note: 'Emergency stop file was too old - cleaning up',
          });
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script with validated file path for cleanup
          FS.unlinkSync(stopFlagPath);
          return false;
        }

        // Valid emergency stop within grace period
        loggers.stopHook.info('EMERGENCY STOP DETECTED', {
          status: 'EMERGENCY STOP DETECTED',
          authorized_by: flagData.authorized_by,
          reason: flagData.reason,
          timestamp: flagData.timestamp,
          age: `${Math.round(age / 1000)}s`,
          gracePeriod: '20s',
          validation_bypassed: true,
          session_type: 'emergency_stop',
          note: 'Emergency stop valid - will be honored for all stop hooks within 20-second window',
        });

        // DON'T delete yet - let it persist for the grace period to handle rapid calls
        // It will be auto-deleted when it expires (next check will be > 20s old)
        return flagData.stop_allowed === true;
      }

      // Generate comprehensive validation progress report for normal stops;
      const logger = new LOGGER.LOGGER(workingDir);
      const progressReport = generateValidationProgressReport(
        flagData,
        logger,
        workingDir,
      );

      // Display detailed validation progress
      loggers.stopHook.info('VALIDATION PROGRESS REPORT - STOP AUTHORIZATION', {
        overallProgress: progressReport.overallProgress,
        completedValidations: progressReport.completedValidations,
        totalValidations: progressReport.totalValidations,
        failedValidations: progressReport.failedValidations,
        estimatedTimeRemaining: progressReport.estimatedTimeRemaining,
        validationDetails: progressReport.validationDetails,
        lastValidationTime: progressReport.lastValidationTime,
        authorizationStatus: flagData.stop_allowed ? 'APPROVED' : 'PENDING',
      });

      // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script with validated file path for cleanup
      FS.unlinkSync(stopFlagPath); // Remove flag after reading
      return flagData.stop_allowed === true;
    } catch (_) {
      // Invalid flag file, remove it
      loggers.stopHook.warn(
        'Invalid validation progress file detected - cleaning up',
        {
          error: _.message,
          errorName: _.name,
          stopFlagPath,
        },
      );
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script with validated file path for cleanup
      FS.unlinkSync(stopFlagPath);
      return false;
    }
  }

  // No authorization found - provide progress guidance
  loggers.stopHook.info('VALIDATION PROGRESS MONITORING', {
    status: 'No active validation process detected',
    authorization: 'None found - stop hook will continue infinite mode',
    progressViewingInstructions: {
      realTimeCompletionPercentage: true,
      individualValidationStatus: true,
      estimatedTimeRemaining: true,
      detailedErrorMessages: true,
      timingMetrics: true,
    },
    authorizationWorkflow: [
      'Complete all TodoWrite tasks',
      'Run multi-step authorization: start-authorization → validate-criterion (×7) → complete-authorization',
      'Monitor progress through this enhanced reporting system',
      'Receive detailed completion status And approval confirmation',
    ],
    mode: 'CONTINUING INFINITE MODE',
    stopAuthorizationDetected: false,
  });

  return false; // Default: never allow stops,
}

/**
 * Clean up stale agents in a single TASKS.json file
 * @param {string} projectPath - Path to project directory containing TASKS.json
 * @param {Object} logger - LOGGER instance for output
 * @returns {Object} Cleanup results
 */
function cleanupStaleAgentsInProject(
  projectPath,
  logger,
  _category = 'general',
) {
  const todoPath = path.join(projectPath, 'TASKS.json');

  // Check if TASKS.json exists in this project
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Stop hook path validated through hook configuration system
  if (!FS.existsSync(todoPath)) {
    logger.addFlow(`No TASKS.json found in ${projectPath} - skipping`);
    return {
      agentsRemoved: 0,
      tasksUnassigned: 0,
      orphanedTasksReset: 0,
      projectPath,
    };
  }

  let todoData;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- File path constructed from trusted hook configuration
    todoData = JSON.parse(FS.readFileSync(todoPath, 'utf8'));
  } catch (_) {
    logger.addFlow(`Failed to read TASKS.json in ${projectPath}: ${_.message}`);
    return {
      agentsRemoved: 0,
      tasksUnassigned: 0,
      orphanedTasksReset: 0,
      projectPath,
      error: _.message,
    };
  }

  // Initialize agents object if it doesn't exist (TASKS.json may not have agents)
  if (!todoData.agents) {
    todoData.agents = {};
  }

  // Get all agents from TASKS.json;
  const allAgents = Object.keys(todoData.agents || {});
  if (allAgents.length === 0) {
    logger.addFlow(`No agents found in ${projectPath} - skipping`);
    return {
      agentsRemoved: 0,
      tasksUnassigned: 0,
      orphanedTasksReset: 0,
      projectPath,
    };
  }

  // Clean up stale agents (older than 30 minutes) And identify active ones;
  const staleAgentTimeout = 1800000; // 30 minutes;
  const staleAgents = [];

  for (const agentId of allAgents) {
    // eslint-disable-next-line security/detect-object-injection -- Agent ID validated through Object.keys() iteration from TASKS.json structure;
    const agent = todoData.agents[agentId];
    // Handle both lastHeartbeat (camelCase) And last_heartbeat (snake_case) formats;
    const lastHeartbeat = agent.lastHeartbeat || agent.last_heartbeat;
    const heartbeatTime = lastHeartbeat ? new Date(lastHeartbeat).getTime() : 0;
    const timeSinceHeartbeat = Date.now() - heartbeatTime;
    const isActive = timeSinceHeartbeat < staleAgentTimeout;

    if (!isActive) {
      staleAgents.push(agentId);
    }
  }

  // Remove stale agents from the system AND unassign them from tasks;
  let agentsRemoved = 0;
  let tasksUnassigned = 0;
  const orphanedTasksReset = 0;

  for (const staleAgentId of staleAgents) {
    // eslint-disable-next-line security/detect-object-injection -- Stale agent ID validated through timeout calculation And cleanup process
    delete todoData.agents[staleAgentId];
    agentsRemoved++;
    logger.addFlow(`Removed stale agent from ${projectPath}: ${staleAgentId}`);

    // Find all features assigned to this stale agent And unassign them (if tasks field exists)
    const tasksOrFeatures = todoData.tasks || todoData.features || [];
    for (const item of tasksOrFeatures) {
      // Skip null/undefined items
      if (!item || typeof item !== 'object') {
        continue;
      }

      if (
        item.assigned_agent === staleAgentId ||
        item.claimed_by === staleAgentId
      ) {
        // Unassign the stale agent from the item
        item.assigned_agent = null;
        item.claimed_by = null;

        // Reset item to pending if it was in_progress
        if (item.status === 'in_progress') {
          item.status = 'pending';
          item.started_at = null;
        }

        // Add assignment history entry
        if (!item.agent_assignment_history) {
          item.agent_assignment_history = [];
        }
        item.agent_assignment_history.push({
          agent: staleAgentId,
          action: 'auto_unassign_stale',
          timestamp: new Date().toISOString(),
          reason: 'Agent became stale (inactive >30 minutes)',
        });

        tasksUnassigned++;
        logger.addFlow(
          `Unassigned item in ${projectPath}: "${item.title}" from stale agent: ${staleAgentId}`,
        );
      }
    }
  }

  // Write back if any changes were made
  if (agentsRemoved > 0 || tasksUnassigned > 0) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Hook system path controlled by stop hook security protocols
      FS.writeFileSync(todoPath, JSON.stringify(todoData, null, 2));
      logger.addFlow(`Updated ${projectPath}/TASKS.json with cleanup results`);
    } catch (_) {
      logger.addFlow(
        `Failed to write TASKS.json in ${projectPath}: ${_.message}`,
      );
      return {
        agentsRemoved: 0,
        tasksUnassigned: 0,
        orphanedTasksReset: 0,
        projectPath,
        error: _.message,
      };
    }
  }

  return { agentsRemoved, tasksUnassigned, orphanedTasksReset, projectPath };
}

/**
 * Clean up stale agents across all known projects
 * @param {Object} logger - LOGGER instance for output
 * @returns {Object} Overall cleanup results
 */
async function cleanupStaleAgentsAcrossProjects(logger, _category = 'general') {
  // Define known project paths to check for stale agents;
  const knownProjects = [
    '/Users/jeremyparker/Desktop/Claude Coding Projects/AIgent/bytebot',
    '/Users/jeremyparker/infinite-continue-stop-hook',
    // Add more project paths as needed,
  ];

  const results = {
    totalAgentsRemoved: 0,
    totalTasksUnassigned: 0,
    totalOrphanedTasksReset: 0,
    projectResults: [],
    errors: [],
  };

  logger.addFlow(
    `🧹 Starting multi-project stale agent cleanup across ${knownProjects.length} projects...`,
  );

  // Process projects in parallel for better performance;
  const projectPromises = knownProjects.map(async (projectPath) => {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Stop hook path validated through hook configuration system
      if (FS.existsSync(projectPath)) {
        const _result = await cleanupStaleAgentsInProject(projectPath, logger);
        return _result;
      } else {
        logger.addFlow(
          `Project path does not exist: ${projectPath} - skipping`,
        );
        return {
          agentsRemoved: 0,
          tasksUnassigned: 0,
          orphanedTasksReset: 0,
          projectPath,
          skipped: true,
        };
      }
    } catch (_) {
      const errorMsg = `Failed to process ${projectPath}: ${_.message}`;
      logger.addFlow(errorMsg);
      return {
        agentsRemoved: 0,
        tasksUnassigned: 0,
        orphanedTasksReset: 0,
        projectPath,
        error: _.message,
      };
    }
  });

  const projectResults = await Promise.all(projectPromises);

  // Aggregate results from parallel processing
  for (const result of projectResults) {
    results.projectResults.push(result);
    results.totalAgentsRemoved += result.agentsRemoved;
    results.totalTasksUnassigned += result.tasksUnassigned;
    results.totalOrphanedTasksReset += result.orphanedTasksReset || 0;

    if (result.error) {
      results.errors.push(`${result.projectPath}: ${result.error}`);
    }
  }

  logger.addFlow(
    `🧹 Multi-project cleanup complete: ${results.totalAgentsRemoved} agents removed, ${results.totalTasksUnassigned} tasks unassigned, ${results.totalOrphanedTasksReset} orphaned tasks reset`,
  );

  return results;
}

/**
 * Automatically reclassify test errors And sort tasks according to CLAUDE.md priority rules
 */
async function _autoSortTasksByPriority(_taskManager, _category = 'general') {
  try {
    const todoData = await _taskManager.readTodo();
    let tasksMoved = 0;
    let tasksUpdated = 0;

    // Helper functions for ID-based classification;
    const getCurrentPrefix = (taskId) => {
      const parts = taskId.split('_');
      return parts[0] || 'unknown';
    };

    const determineCorrectPrefix = (task) => {
      // Guard against null/undefined task objects
      if (!task || typeof task !== 'object') {
        return 'feature'; // Default fallback
      }

      const title = (task.title || '').toLowerCase();
      const description = (task.description || '').toLowerCase();
      const CATEGORY = task.category ? String(task.category).toLowerCase() : '';
      const allText = `${title} ${description} ${CATEGORY}`;

      // ERROR detection (highest priority)
      const errorPatterns = [
        /error|failure|bug|fix|broken|crash|exception|fail/i,
        /linter|lint|eslint|tslint|syntax/i,
        /build.*fail|compilation|cannot.*build/i,
        /start.*fail|startup.*error|cannot.*start/i,
      ];

      const isError =
        errorPatterns.some((pattern) => pattern.test(allText)) ||
        (_category &&
          [
            'linter-error',
            'build-error',
            'start-error',
            'error',
            'bug',
          ].includes(_category));

      if (isError) {
        // Check if it's actually test-related (should be test_ not error_)
        const testRelated =
          /test.*error|test.*fail|coverage|spec|jest|mocha|cypress/.test(
            allText,
          );
        if (
          testRelated &&
          !/(build.*fail|compilation|cannot.*build|start.*fail)/.test(allText)
        ) {
          return 'test';
        }
        return 'error';
      }

      // TEST detection;
      const testPatterns = [
        /test|testing|spec|coverage|jest|mocha|cypress|e2e|unit.*test|integration.*test/i,
        /\.test\.|\.spec\.|__tests__|test.*suite/i,
      ];

      const isTest =
        testPatterns.some((pattern) => pattern.test(allText)) ||
        (_category && _category.startsWith('test-')) ||
        (_category &&
          ['missing-test', 'test-setup', 'test-refactor', 'testing'].includes(
            _category,
          ));

      if (isTest) {
        return 'test';
      }

      // Check if implementing a feature subtask
      if (
        task.feature_id ||
        task.implementing_feature ||
        task.parent_feature_id
      ) {
        return 'subtask';
      }

      // Default to feature
      return 'feature';
    };

    // ID-based priority system;
    const getTaskPriority = (task) => {
      // Handle null/undefined tasks
      if (!task || typeof task !== 'object') {
        return 5; // Lowest priority for invalid tasks
      }

      const id = task.id || '';

      if (id.startsWith('error_')) {
        return 1;
      } // ERROR tasks - highest priority
      if (id.startsWith('feature_')) {
        return 2;
      } // FEATURE tasks - high priority
      if (id.startsWith('subtask_')) {
        return 3;
      } // SUBTASK tasks - medium priority
      if (id.startsWith('test_')) {
        return 4;
      } // TEST tasks - lowest priority

      return 5; // Fallback for old tasks
    };

    // Ensure tasks/features is an array;
    const tasksOrFeatures = todoData.tasks || todoData.features || [];
    if (!Array.isArray(tasksOrFeatures)) {
      if (todoData.tasks) {
        todoData.tasks = [];
      } else {
        todoData.features = [];
      }
    }

    // Process all items for ID-based classification
    for (const task of tasksOrFeatures) {
      // Skip null/undefined tasks
      if (!task || typeof task !== 'object') {
        continue;
      }

      let updated = false;
      const currentId = task.id || '';

      // STEP 1: Auto-reclassify tasks with incorrect ID prefixes;
      const shouldBePrefix = determineCorrectPrefix(task);
      const currentPrefix = getCurrentPrefix(currentId);

      if (currentPrefix !== shouldBePrefix) {
        // Generate new ID with correct prefix;
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substr(2, 9);
        task.id = `${shouldBePrefix}_${timestamp}_${randomSuffix}`;
        updated = true;
        tasksMoved++;
      }

      // STEP 2: Ensure all tasks have required task.category field for validation
      if (!task.category) {
        const taskPrefix = getCurrentPrefix(task.id || '');
        switch (taskPrefix) {
          case 'error':
            task.category = 'error';
            break;
          case 'feature':
            task.category = 'implementation';
            break;
          case 'subtask':
            task.category = 'implementation';
            break;
          case 'test':
            task.category = 'testing';
            break;
          default:
            task.category = 'implementation';
        }
        updated = true;
      }

      if (updated) {
        tasksUpdated++;
      }
    }

    // STEP 2: Sort items by ID-based priority
    tasksOrFeatures.sort((a, b) => {
      // Handle null/undefined tasks - push to end
      if (!a || typeof a !== 'object') {
        return 1;
      }
      if (!b || typeof b !== 'object') {
        return -1;
      }

      const aPriority = getTaskPriority(a);
      const bPriority = getTaskPriority(b);

      // Primary sort: by ID prefix priority
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Secondary sort: by created_at (oldest first)
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return aTime - bTime;
    });

    // Update TASKS.json settings for ID-based classification
    if (!todoData.settings) {
      todoData.settings = {};
    }
    todoData.settings.id_based_classification = true;
    todoData.settings.auto_sort_enabled = true;
    todoData.settings.sort_criteria = {
      primary: 'id_prefix',
      secondary: 'created_at',
    };
    todoData.settings.id_priority_order = {
      error_: 1,
      feature_: 2,
      subtask_: 3,
      test_: 4,
    };

    // Update the appropriate array in the data structure
    if (todoData.tasks) {
      todoData.tasks = tasksOrFeatures;
    } else {
      todoData.features = tasksOrFeatures;
    }

    // Save the updated TASKS.json
    if (tasksMoved > 0 || tasksUpdated > 0) {
      await _taskManager.writeTodo(todoData);
    }

    return {
      tasksMoved,
      tasksUpdated,
      totalTasks: tasksOrFeatures.length,
    };
  } catch (_) {
    // Log _error through logger for proper tracking - use loggers.app for _error handling
    loggers.stopHook.error('autoSortTasksByPriority error', {
      error: _.message,
      errorName: _.name,
      stack: _.stack,
      operation: '_autoSortTasksByPriority',
      component: 'StopHook',
    });
    return { error: _.message, tasksMoved: 0, tasksUpdated: 0 };
  }
}

/**
 * Provides standardized TaskManager API guidance for all scenarios
 */
function provideInstructiveTaskGuidance(
  taskManager,
  taskStatus,
  agentId,
  _category = 'general',
) {
  return `
⚡ CONTINUE WORKING - SAME AGENT

🚨 **YOU ARE THE SAME AGENT - CONTINUE YOUR WORK:**
**ULTRATHINK - Finish current work completely before checking TASKS.json**
**ULTRATHINK - Complete ALL TodoWrite tasks first**
**ULTRATHINK - Never abandon unfinished work**

📋 **WORKFLOW:**

1. **FINISH CURRENT WORK:**
   Complete all TodoWrite tasks and in-progress changes

2. **CHECK TASKS.json:**
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-tasks-by-status approved

3. **CLAIM & COMPLETE:**
   Work through pending tasks in priority order

🛑 **STOP AUTHORIZATION (When ALL Complete & Project Perfect):**

**Verify Readiness:**
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" verify-stop-readiness [agentId]

**Start Authorization:**
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" start-authorization [agentId]

**Validate (sequential):**
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" validate-criterion [AUTH_KEY] focused-codebase
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" validate-criterion [AUTH_KEY] security-validation
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" validate-criterion [AUTH_KEY] linter-validation
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" validate-criterion [AUTH_KEY] type-validation
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" validate-criterion [AUTH_KEY] build-validation
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" validate-criterion [AUTH_KEY] start-validation
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" validate-criterion [AUTH_KEY] test-validation

**Complete:**
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete-authorization [AUTH_KEY]

**⚠️ EMERGENCY STOP (Only if stop hook triggers 2+ times with nothing to do):**
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" emergency-stop [agentId] "reason"

**SUCCESS CRITERIA:**
• focused-codebase
• security-validation
• linter-validation
• type-validation
• build-validation
• start-validation
• test-validation

📊 **STATUS:** ${taskStatus.pending} pending | ${taskStatus.in_progress} in progress | ${taskStatus.completed} completed

See CLAUDE.md for detailed validation criteria and complete command reference.
`;
}

// Immediate output to ensure Claude Code sees feedback
console.error('🔄 STOP HOOK ACTIVATED - Analyzing project state...\n');

// Read input from Claude Code;
let inputData = '';
process.stdin.setEncoding('utf8');

// Add timeout to prevent hanging
const stdinTimeout = setTimeout(() => {
  console.error('⚠️  Stop hook stdin timeout - proceeding with empty input');
  process.stdin.pause();
  process.stdin.emit('end');
}, 5000);

process.stdin.on('data', (chunk) => {
  inputData += chunk;
  clearTimeout(stdinTimeout);
});

/**
 * Track stop hook calls and detect multiple calls within time window
 * Returns true if emergency stop should be triggered
 */
function detectRapidStopCalls(workingDir, _category = 'general') {
  const trackingFilePath = path.join(workingDir, '.stop-hook-calls.json');
  const cooldownFilePath = path.join(workingDir, '.emergency-cooldown');
  const now = Date.now();
  const timeWindow = 10000; // 10 seconds in milliseconds (balanced loop detection)
  const cooldownPeriod = 60000; // 60 seconds cooldown after emergency stop

  // Check for active cooldown period
  try {
    // Check if manual emergency stop is active - if so, skip cooldown enforcement
    const stopAllowedPath = path.join(workingDir, '.stop-allowed');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Stop allowed file check
    if (FS.existsSync(stopAllowedPath)) {
      loggers.stopHook.info('MANUAL EMERGENCY STOP DETECTED - BYPASSING COOLDOWN', {
        status: 'Active emergency stop authorization found',
        note: 'Manual emergency stops override automatic cooldown protection',
        component: 'StopHook',
        operation: 'cooldownBypass',
      });
      // Don't enforce cooldown - let checkStopAllowed handle the manual emergency stop
      // This ensures manual emergency stops always work regardless of cooldown state
      return false; // Return false to indicate no automatic emergency stop needed
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Emergency cooldown file in validated project directory
    if (FS.existsSync(cooldownFilePath)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Emergency cooldown file in validated project directory
      const cooldownData = JSON.parse(FS.readFileSync(cooldownFilePath, 'utf8'));
      const cooldownExpiry = new Date(cooldownData.expiresAt).getTime();

      if (now < cooldownExpiry) {
        // Still in cooldown period - CONTINUE INFINITE MODE to prevent rapid re-triggering
        const remainingCooldown = Math.ceil((cooldownExpiry - now) / 1000);
        loggers.stopHook.info('EMERGENCY COOLDOWN ACTIVE - CONTINUING INFINITE MODE', {
          status: 'Emergency stop cooldown period active',
          remainingSeconds: remainingCooldown,
          cooldownPeriod: '60s',
          reason: cooldownData.reason,
          triggeredAt: cooldownData.triggeredAt,
          action: 'Exiting with code 2 to continue infinite mode',
          note: 'Cooldown prevents rapid re-triggering of emergency stops',
          component: 'StopHook',
          operation: 'cooldownCheck',
        });
        // Exit with code 2 to continue infinite mode during cooldown
        // eslint-disable-next-line n/no-process-exit
        process.exit(2);
      } else {
        // Cooldown expired - clean up file
        loggers.stopHook.info('EMERGENCY COOLDOWN EXPIRED', {
          status: 'Cooldown period expired, resuming normal emergency detection',
          component: 'StopHook',
          operation: 'cooldownExpiry',
        });
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Emergency cooldown file cleanup
        FS.unlinkSync(cooldownFilePath);
      }
    }
  } catch (_) {
    // If cooldown file is corrupted or unreadable, continue with normal logic
    loggers.stopHook.warn('Failed to read cooldown file', {
      error: _.message,
      component: 'StopHook',
      operation: 'cooldownCheck',
    });
  }

  let callHistory = [];

  // Read existing call history
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Stop hook tracking file in validated project directory
    if (FS.existsSync(trackingFilePath)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Stop hook tracking file in validated project directory
      const data = FS.readFileSync(trackingFilePath, 'utf8');
      callHistory = JSON.parse(data);
    }
  } catch {
    // If file doesn't exist or is corrupted, start fresh
    callHistory = [];
  }

  // Add current call timestamp
  callHistory.push(now);

  // Filter to only keep calls within the time window
  const recentCalls = callHistory.filter(timestamp => now - timestamp < timeWindow);

  // Save updated call history
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Stop hook tracking file in validated project directory
    FS.writeFileSync(trackingFilePath, JSON.stringify(recentCalls, null, 2));
  } catch (_) {
    // If we can't write, continue anyway
    loggers.stopHook.warn('Failed to write stop hook call tracking', {
      error: _.message,
      component: 'StopHook',
      operation: 'detectRapidStopCalls',
    });
  }

  // If we have 2 or more calls within the time window, trigger emergency stop
  // Reduced from 3 to 2 since stop hook triggers on every response and indicates stuck loop
  if (recentCalls.length >= 2) {
    loggers.stopHook.warn('REPEATED STOP HOOK CALLS DETECTED', {
      status: 'Multiple stop hook calls detected - appears to be stuck in loop',
      callCount: recentCalls.length,
      timeWindow: `${timeWindow}ms (${timeWindow / 1000}s)`,
      timeBetweenCalls: recentCalls.length > 1 ? `${(recentCalls[recentCalls.length - 1] - recentCalls[0])}ms` : 'N/A',
      action: 'Triggering automatic emergency stop',
      component: 'StopHook',
      operation: 'rapidStopDetection',
    });

    // Create cooldown file to prevent immediate re-triggering
    const cooldownData = {
      triggeredAt: new Date(now).toISOString(),
      expiresAt: new Date(now + cooldownPeriod).toISOString(),
      reason: 'Automatic emergency stop due to rapid stop hook calls',
      cooldownSeconds: cooldownPeriod / 1000,
    };
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Emergency cooldown file in validated project directory
      FS.writeFileSync(cooldownFilePath, JSON.stringify(cooldownData, null, 2));
      loggers.stopHook.info('EMERGENCY COOLDOWN ACTIVATED', {
        status: 'Cooldown period initiated',
        cooldownSeconds: cooldownPeriod / 1000,
        expiresAt: cooldownData.expiresAt,
        component: 'StopHook',
        operation: 'cooldownActivation',
      });
    } catch (_) {
      loggers.stopHook.warn('Failed to create cooldown file', {
        error: _.message,
        component: 'StopHook',
        operation: 'cooldownActivation',
      });
    }

    return true;
  }

  return false;
}

process.stdin.on('end', async () => {
  clearTimeout(stdinTimeout);
  const workingDir = findClaudeProjectRoot();
  const logger = new LOGGER.LOGGER(workingDir);
  try {
    // ========================================================================
    // CHECK FOR MANUAL EMERGENCY STOP FIRST (before automatic detection)
    // ========================================================================
    const stopAllowed = checkStopAllowed(workingDir);
    if (stopAllowed) {
      // Clear tracking file to prevent rapid call detection interference
      const trackingFilePath = path.join(workingDir, '.stop-hook-calls.json');
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- tracking file in validated project directory
        if (FS.existsSync(trackingFilePath)) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- tracking file cleanup
          FS.unlinkSync(trackingFilePath);
          logger.addFlow('Cleared tracking file to prevent interference');
        }
      } catch (_) {
        // Ignore cleanup errors - not critical
        logger.addFlow(`Warning: could not clear tracking file: ${_.message}`);
      }

      logger.addFlow('Manual emergency stop detected - allowing stop');
      logger.logExit(0, 'Emergency stop authorized');
      logger.save();

      loggers.stopHook.info('MANUAL EMERGENCY STOP HONORED', {
        status: 'MANUAL EMERGENCY STOP HONORED',
        authorization: 'Manual emergency-stop via TaskManager API',
        authorizationType: 'manual emergency stop',
        action: 'Allowing conversation to stop immediately',
        component: 'StopHook',
        operation: 'manualEmergencyStop',
        exitCode: 0,
      });

      // eslint-disable-next-line n/no-process-exit
      process.exit(0); // Allow stop for manual emergency-stop
    }

    // DETECT RAPID STOP CALLS - Check if stop hook called multiple times within 5 seconds
    const shouldEmergencyStop = detectRapidStopCalls(workingDir);
    if (shouldEmergencyStop) {
      logger.addFlow('RAPID STOP CALLS DETECTED - Triggering automatic emergency stop');

      // Create emergency stop flag immediately
      const stopFlagPath = path.join(workingDir, '.stop-allowed');
      const stopData = {
        stop_allowed: true,
        authorized_by: 'system_auto_detection',
        reason: 'Emergency stop: Stop hook called multiple times - infinite loop detected',
        timestamp: new Date().toISOString(),
        session_type: 'emergency_stop',
        validation_bypassed: true,
        auto_triggered: true,
      };

      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Stop flag file in validated project directory
      FS.writeFileSync(stopFlagPath, JSON.stringify(stopData, null, 2));

      logger.addFlow('Emergency stop authorized automatically');
      logger.logExit(0, 'Automatic emergency stop due to rapid calls');
      logger.save();

      loggers.stopHook.info('AUTOMATIC EMERGENCY STOP TRIGGERED', {
        status: 'AUTOMATIC EMERGENCY STOP TRIGGERED',
        reason: 'Stop hook called multiple times - infinite loop detected',
        action: 'Allowing conversation to stop',
        authorizationType: 'automatic emergency stop',
        component: 'StopHook',
        operation: 'autoEmergencyStop',
        exitCode: 0,
        note: 'Tracking file preserved to prevent re-triggering',
      });

      // DO NOT clean up tracking file - it must persist to prevent re-triggering
      // The tracking file will be cleaned up only after 20 seconds of inactivity
      // This prevents the infinite loop where emergency stop triggers repeatedly

      // eslint-disable-next-line n/no-process-exit
      process.exit(0); // Allow stop due to automatic emergency detection
    }

    // Debug logging for input data
    logger.addFlow(`Raw input data: "${inputData}"`);
    logger.addFlow(`Input data length: ${inputData.length}`);

    let hookInput;
    if (!inputData || inputData.trim() === '') {
      // No input - probably manual execution, simulate Claude Code input
      logger.addFlow('No input detected - running in manual mode');
      hookInput = {
        session_id: 'manual_test',
        transcript_path: '',
        stop_hook_active: true,
        hook_event_name: 'manual_execution',
      };
    } else {
      hookInput = JSON.parse(inputData);
    }

    const {
      session_id: _session_id,
      transcript_path: _transcript_path,
      stop_hook_active: _stop_hook_active,
      hook_event_name,
    } = hookInput;

    // Log input with event details
    logger.logInput(hookInput);
    logger.addFlow(
      `Received ${hook_event_name || 'unknown'} event from Claude Code`,
    );

    // ========================================================================
    // CHECK FOR DONE COMMAND IN TRANSCRIPT
    // ========================================================================
    // Check if the transcript contains just "DONE" as the last assistant message
    if (_transcript_path && _transcript_path.trim() !== '') {
      try {
        logger.addFlow(
          `Checking transcript for DONE command: ${_transcript_path}`,
        );
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- transcript path from Claude Code hook
        if (FS.existsSync(_transcript_path)) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- transcript path from Claude Code hook;
          const transcriptContent = FS.readFileSync(_transcript_path, 'utf8');

          // Parse the transcript to find the last assistant message;
          const lines = transcriptContent.split('\n');
          let lastAssistantMessage = '';
          let inAssistantBlock = false;

          for (const line of lines) {
            if (line.startsWith('Assistant:')) {
              inAssistantBlock = true;
              lastAssistantMessage = ''; // Reset for new assistant message
            } else if (line.startsWith('Human:')) {
              inAssistantBlock = false;
            } else if (inAssistantBlock) {
              lastAssistantMessage += line.trim() + ' ';
            }
          }

          // Check if the last assistant message is just "DONE"
          const trimmedMessage = lastAssistantMessage.trim();
          logger.addFlow(`Last assistant message: "${trimmedMessage}"`);

          if (trimmedMessage === 'DONE' || trimmedMessage === 'DONE.') {
            logger.addFlow('DONE command detected - allowing stop');
            logger.logExit(0, 'DONE command detected - allowing stop');
            logger.save();

            loggers.stopHook.info('DONE COMMAND DETECTED', {
              status: 'DONE command detected',
              action: 'Allowing conversation to stop',
              behavior: 'Expected behavior when /done command is used',
              lastAssistantMessage: trimmedMessage,
              component: 'StopHook',
              operation: 'doneCommandDetection',
            });
            // eslint-disable-next-line n/no-process-exit
            process.exit(0); // Allow stop when DONE is detected
          }
        } else {
          logger.addFlow(`Transcript file not found: ${_transcript_path}`);
        }
      } catch (_) {
        logger.addFlow(`Error reading transcript: ${_.message}`);
      }
    }

    // Check if TASKS.json exists in current project;
    const todoPath = path.join(workingDir, 'TASKS.json');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script with validated paths from project structure
    if (!FS.existsSync(todoPath)) {
      logger.addFlow('No TASKS.json found - this is not a TaskManager project');
      logger.logExit(2, 'No TASKS.json found - continuing infinite mode');
      logger.save();

      loggers.stopHook.warn('NO TASKMANAGER PROJECT DETECTED', {
        status: 'No TASKS.json file found',
        projectType: 'Non-TaskManager project',
        mode: 'INFINITE CONTINUE MODE ACTIVE',
        behavior:
          'Stop hook will continue infinitely to prevent accidental termination',
        setupInstructions: {
          description: 'To enable task management for this project',
          steps: [
            'Run: timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize [agentId]',
            'This will reinitialize your agent And prepare the TASKS.json system',
          ],
        },
        operation: 'CONTINUING OPERATION',
        component: 'StopHook',
        exitCode: 2,
      });
      // eslint-disable-next-line n/no-process-exit
      process.exit(2); // Never allow stops even without TASKS.json
    }

    // CRITICAL: Check for TASKS.json corruption before initializing TaskManager;
    const AUTO_FIXER = require('./lib/autoFixer');
    const autoFixer = new AUTO_FIXER();

    try {
      const corruptionCheck = await autoFixer.autoFix(todoPath);
      if (corruptionCheck.fixed && corruptionCheck.fixesApplied.length > 0) {
        logger.info('TASKS.json corruption automatically fixed', {
          fixesApplied: corruptionCheck.fixesApplied,
          component: 'StopHook',
          operation: 'corruptionCheck',
        });
        loggers.stopHook.info('TASKS.json corruption automatically fixed', {
          status: 'Corruption fixed successfully',
          fixesApplied: corruptionCheck.fixesApplied,
          fixCount: corruptionCheck.fixesApplied.length,
          component: 'StopHook',
          operation: 'autoFix',
        });
      }
    } catch (_) {
      logger.addFlow(`TASKS.json corruption check failed: ${_.message}`);
      loggers.stopHook.error('TASKS.json corruption check failed', {
        error: _.message,
        errorName: _.name,
        stack: _.stack,
        component: 'StopHook',
        operation: 'corruptionCheck',
      });
    }

    // Initialize TaskManager with explicit project root to check agent status
    // Pass the working directory to ensure security validation uses correct project root;
    const taskManager = new TASK_MANAGER(todoPath, {
      projectRoot: workingDir,
      enableAutoFix: true,
      validateOnRead: false,
    });

    // Check if there are any active agents or if agent initialization is needed;
    const todoData = await taskManager.readTodo();

    // Initialize agents object if it doesn't exist in TASKS.json
    if (!todoData.agents) {
      todoData.agents = {};
    }

    // Debug logging for agent detection;
    const allAgents = Object.keys(todoData.agents || {});
    logger.addFlow(`Found ${allAgents.length} total agents in TASKS.json`);

    // ========================================================================
    // MULTI-PROJECT STALE AGENT CLEANUP
    // ========================================================================

    // Clean up stale agents across all known projects first
    try {
      const multiProjectResults =
        await cleanupStaleAgentsAcrossProjects(logger);

      if (multiProjectResults.totalAgentsRemoved > 0) {
        logger.addFlow(
          `✅ Multi-project cleanup: ${multiProjectResults.totalAgentsRemoved} stale agents removed, ${multiProjectResults.totalTasksUnassigned} tasks unassigned, ${multiProjectResults.totalOrphanedTasksReset} orphaned tasks reset across ${multiProjectResults.projectResults.length} projects`,
        );

        logger.info('Multi-project stale agent cleanup completed', {
          projectsProcessed: multiProjectResults.projectResults.length,
          staleAgentsRemoved: multiProjectResults.totalAgentsRemoved,
          tasksUnassigned: multiProjectResults.totalTasksUnassigned,
          orphanedTasksReset: multiProjectResults.totalOrphanedTasksReset,
          errors: multiProjectResults.errors,
          component: 'StopHook',
          operation: 'multiProjectCleanup',
        });

        loggers.stopHook.info('MULTI-PROJECT STALE AGENT CLEANUP COMPLETED', {
          status: 'Multi-project cleanup completed successfully',
          projectsProcessed: multiProjectResults.projectResults.length,
          totalStaleAgentsRemoved: multiProjectResults.totalAgentsRemoved,
          totalTasksUnassigned: multiProjectResults.totalTasksUnassigned,
          totalOrphanedTasksReset: multiProjectResults.totalOrphanedTasksReset,
          errors:
            multiProjectResults.errors.length > 0
              ? multiProjectResults.errors
              : [],
          errorCount: multiProjectResults.errors.length,
          hasErrors: multiProjectResults.errors.length > 0,
          component: 'StopHook',
          operation: 'multiProjectCleanupReport',
        });
      }

      if (multiProjectResults.errors.length > 0) {
        logger.addFlow(
          `Multi-project cleanup errors: ${multiProjectResults.errors.join('; ')}`,
        );
      }
    } catch (_) {
      logger.addFlow(`Multi-project cleanup failed: ${_.message}`);
      // Continue with local cleanup even if multi-project cleanup fails
    }

    // ========================================================================
    // LOCAL PROJECT STALE AGENT CLEANUP (for current project specifically)
    // ========================================================================

    // Clean up stale agents (older than 30 minutes) And identify active ones;
    const staleAgentTimeout = 1800000; // 30 minutes;
    const activeAgents = [];
    const staleAgents = [];

    for (const agentId of allAgents) {
      // eslint-disable-next-line security/detect-object-injection -- validated agent ID from TASKS.json structure;
      const agent = todoData.agents[agentId];
      // Handle both lastHeartbeat (camelCase) And last_heartbeat (snake_case) formats;
      const lastHeartbeat = agent.lastHeartbeat || agent.last_heartbeat;
      const heartbeatTime = lastHeartbeat
        ? new Date(lastHeartbeat).getTime()
        : 0;
      const timeSinceHeartbeat = Date.now() - heartbeatTime;
      const isActive = timeSinceHeartbeat < staleAgentTimeout;

      logger.addFlow(
        `Agent ${agentId}: heartbeat=${lastHeartbeat}, timeSince=${Math.round(timeSinceHeartbeat / 1000)}s, isActive=${isActive}`,
      );

      if (isActive) {
        activeAgents.push(agentId);
      } else {
        staleAgents.push(agentId);
      }
    }

    // Remove stale agents from the system AND unassign them from tasks;
    let agentsRemoved = 0;
    let tasksUnassigned = 0;

    for (const staleAgentId of staleAgents) {
      // eslint-disable-next-line security/detect-object-injection -- validated stale agent ID for cleanup
      delete todoData.agents[staleAgentId];
      agentsRemoved++;
      logger.addFlow(`Removed stale agent: ${staleAgentId}`);

      // Find all items assigned to this stale agent And unassign them;
      const itemsArray = todoData.tasks || todoData.features || [];
      for (const item of itemsArray) {
        // Skip null/undefined items
        if (!item || typeof item !== 'object') {
          continue;
        }

        if (
          item.assigned_agent === staleAgentId ||
          item.claimed_by === staleAgentId
        ) {
          // Unassign the stale agent from the item
          item.assigned_agent = null;
          item.claimed_by = null;

          // Reset item to pending if it was in_progress
          if (item.status === 'in_progress') {
            item.status = 'pending';
            item.started_at = null;
          }

          // Add assignment history entry
          if (!item.agent_assignment_history) {
            item.agent_assignment_history = [];
          }
          item.agent_assignment_history.push({
            agent: staleAgentId,
            action: 'auto_unassign_stale',
            timestamp: new Date().toISOString(),
            reason: 'Agent became stale (inactive >30 minutes)',
          });

          tasksUnassigned++;
          logger.addFlow(
            `Unassigned item "${item.title}" from stale agent: ${staleAgentId}`,
          );
        }
      }
    }

    // Check for stale in-progress tasks (stuck for > 30 minutes) And reset them;
    const staleTaskTimeout = 1800000; // 30 minutes;
    let staleTasksReset = 0;

    const staleItemsArray = todoData.tasks || todoData.features || [];
    for (const item of staleItemsArray) {
      // Skip null/undefined items
      if (!item || typeof item !== 'object') {
        continue;
      }

      if (item.status === 'in_progress' && item.started_at) {
        const itemStartTime = new Date(item.started_at).getTime();
        const timeSinceStart = Date.now() - itemStartTime;

        if (timeSinceStart > staleTaskTimeout) {
          // Reset stale item back to pending
          item.status = 'pending';
          item.assigned_agent = null;
          item.claimed_by = null;
          item.started_at = null;

          // Add reset history entry
          if (!item.agent_assignment_history) {
            item.agent_assignment_history = [];
          }
          item.agent_assignment_history.push({
            agent: item.assigned_agent || 'system',
            action: 'auto_reset_stale',
            timestamp: new Date().toISOString(),
            reason: `Item stale for ${Math.round(timeSinceStart / 60000)} minutes`,
          });

          staleTasksReset++;
          logger.addFlow(
            `Reset stale item: ${item.title} (${Math.round(timeSinceStart / 60000)} min)`,
          );
        }
      }
    }

    // ========================================================================
    // ORPHANED TASK CLEANUP: Reset tasks That have been unassigned for >24 hours
    // This fixes the critical bug where tasks unassigned by previous cleanup runs
    // remain in limbo indefinitely because they're no longer tied to active stale agents
    // ========================================================================

    const orphanedTaskTimeout = 86400000; // 24 hours in milliseconds;
    let orphanedTasksReset = 0;

    function getLastActivityTime(item, _category = 'general') {
      if (
        !item.agent_assignment_history ||
        item.agent_assignment_history.length === 0
      ) {
        return new Date(item.created_at).getTime();
      }

      // Find the most recent assignment history entry;
      const lastEntry =
        item.agent_assignment_history[item.agent_assignment_history.length - 1];
      return new Date(lastEntry.timestamp).getTime();
    }

    const orphanedItemsArray = todoData.tasks || todoData.features || [];
    for (const item of orphanedItemsArray) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      // Check for orphaned items: pending status with no assignment for >24 hours
      if (
        item.status === 'pending' &&
        !item.assigned_agent &&
        !item.claimed_by
      ) {
        const lastActivity = getLastActivityTime(item);
        const timeSinceActivity = Date.now() - lastActivity;

        if (timeSinceActivity > orphanedTaskTimeout) {
          // Reset orphaned item completely to ensure fresh start
          item.started_at = null;

          // Add comprehensive reset history for audit trail
          if (!item.agent_assignment_history) {
            item.agent_assignment_history = [];
          }
          item.agent_assignment_history.push({
            agent: 'system',
            action: 'auto_reset_orphaned',
            timestamp: new Date().toISOString(),
            reason: `Item orphaned for ${Math.round(timeSinceActivity / 3600000)} hours - forced reset`,
            orphaned_duration_hours: Math.round(timeSinceActivity / 3600000),
            last_activity: new Date(lastActivity).toISOString(),
          });

          orphanedTasksReset++;
          logger.addFlow(
            `Reset orphaned item: ${item.title} (orphaned ${Math.round(timeSinceActivity / 3600000)} hours)`,
          );
        }
      }
    }

    // Save changes if any stale agents were removed or tasks were reset
    if (
      agentsRemoved > 0 ||
      staleTasksReset > 0 ||
      tasksUnassigned > 0 ||
      orphanedTasksReset > 0
    ) {
      await taskManager.writeTodo(todoData);
      if (agentsRemoved > 0) {
        logger.addFlow(`Removed ${agentsRemoved} stale agents from TASKS.json`);
      }
      if (tasksUnassigned > 0) {
        logger.addFlow(`Unassigned ${tasksUnassigned} tasks from stale agents`);
      }
      if (staleTasksReset > 0) {
        logger.addFlow(`Reset ${staleTasksReset} stale tasks back to pending`);
      }
      if (orphanedTasksReset > 0) {
        logger.addFlow(
          `Reset ${orphanedTasksReset} orphaned tasks (unassigned >24 hours)`,
        );
      }
    }

    // ========================================================================
    // AUTOMATIC TASK SORTING: DISABLED DUE TO VALIDATION CONFLICTS
    // ========================================================================

    // Automatic task sorting disabled to prevent validation conflicts
    // The sorting function was causing category validation errors
    logger.addFlow(
      'Automatic task sorting disabled - using manual task management instead',
    );

    logger.addFlow(
      `Active agents found: ${activeAgents.length}, Stale agents removed: ${agentsRemoved}, Tasks unassigned: ${tasksUnassigned}, Stale tasks reset: ${staleTasksReset}`,
    );

    // ========================================================================
    // STOP AUTHORIZATION CHECK MOVED TO TOP OF FUNCTION
    // ========================================================================
    // NOTE: checkStopAllowed() is now called at the beginning of the function
    // (before detectRapidStopCalls) to ensure manual emergency-stops are
    // honored before automatic detection interferes.
    // See lines 1013-1045 for the actual check.

    // Enhanced agent status analysis for better messaging;
    const hadStaleAgents = staleAgents.length > 0;
    const totalAgentsBeforeCleanup = allAgents.length;

    if (activeAgents.length === 0) {
      logger.addFlow(
        'No active agents detected - analyzing situation for appropriate guidance',
      );

      // Differentiate between "no agents ever" vs "only stale agents were found"
      if (hadStaleAgents && totalAgentsBeforeCleanup > 0) {
        logger.addFlow(
          `Found ${totalAgentsBeforeCleanup} stale agents - providing reactivation guidance`,
        );
        logger.logExit(
          2,
          'Only stale agents found - providing reactivation guidance',
        );
        logger.save();

        // Get task status for guidance
        let taskStatus = { pending: 0, in_progress: 0, completed: 0 };
        try {
          taskStatus = await taskManager.getTaskStatus();
        } catch (_) {
          logger.addFlow(`Failed to get task status: ${_.message}`);
        }

        console.error(`
⚡ CONTINUE WORKING - SAME AGENT (Stale agents cleaned up)

Working Directory: ${workingDir}
TASKS.json Path: ${todoPath}
Total Agents: ${totalAgentsBeforeCleanup} | Active: ${activeAgents.length} | Removed: ${agentsRemoved} | Reset: ${staleTasksReset}

✅ CLEANUP: Removed ${agentsRemoved} stale agents, unassigned ${tasksUnassigned} tasks, reset ${staleTasksReset} stuck tasks

${provideInstructiveTaskGuidance(taskManager, taskStatus, null)}
`);
        // eslint-disable-next-line n/no-process-exit
        process.exit(2);
      } else {
        // Truly no agents case (fresh project or first time)
        logger.addFlow('No agents detected - need fresh agent initialization');
        logger.logExit(
          2,
          'No agents - providing fresh initialization guidance',
        );
        logger.save();

        // Get task status for guidance
        let taskStatus = { pending: 0, in_progress: 0, completed: 0 };
        try {
          taskStatus = await taskManager.getTaskStatus();
        } catch (_) {
          logger.addFlow(`Failed to get task status: ${_.message}`);
        }

        console.error(`
⚡ CONTINUE WORKING - SAME AGENT

Working Directory: ${workingDir}
TASKS.json Path: ${todoPath}
Total Agents: ${allAgents.length} | Active: ${activeAgents.length} | Removed: ${agentsRemoved} | Reset: ${staleTasksReset}

${provideInstructiveTaskGuidance(taskManager, taskStatus, null)}
`);
        // eslint-disable-next-line n/no-process-exit
        process.exit(2);
      }
    }

    // ========================================================================
    // INFINITE CONTINUE MODE: NEVER ALLOW NATURAL STOPS
    // ========================================================================

    // Check task status to provide appropriate instructions (taskManager already initialized above)
    let taskStatus;
    try {
      taskStatus = await taskManager.getTaskStatus();
    } catch (_) {
      // Handle corrupted TASKS.json by using autoFixer
      logger.addFlow(`Task status failed, attempting auto-fix: ${_.message}`);
      const fixResult = await taskManager.autoFix(todoPath);
      if (fixResult.fixed) {
        taskStatus = await taskManager.getTaskStatus();
        logger.addFlow(`Auto-fix successful, retrieved task status`);
      } else {
        // Fallback to default status
        taskStatus = { pending: 0, in_progress: 0, completed: 0 };
        logger.addFlow(`Auto-fix failed, using default task status`);
      }
    }
    logger.addFlow(
      `Task status: ${taskStatus.pending} pending, ${taskStatus.in_progress} in_progress, ${taskStatus.completed} completed`,
    );

    // Provide detailed instructive guidance based on current state;
    const instructiveGuidance = provideInstructiveTaskGuidance(
      taskManager,
      taskStatus,
    );

    // ========================================================================
    // AUTOMATIC TASK ARCHIVAL: MOVE COMPLETED TASKS TO DONE.json
    // ========================================================================

    try {
      logger.addFlow('Running automatic task archival for completed tasks');
      const archivalResult = await taskManager.migrateCompletedTasks();

      if (archivalResult && archivalResult.migrated > 0) {
        logger.addFlow(
          `Successfully archived ${archivalResult.migrated} completed tasks to DONE.json`,
        );

        loggers.stopHook.info('AUTOMATIC TASK ARCHIVAL COMPLETED', {
          status: 'AUTOMATIC TASK ARCHIVAL COMPLETED',
          archivedTasks: archivalResult.migrated,
          totalFound: archivalResult.total || 'N/A',
          skipped: archivalResult.skipped || 0,
          purpose:
            'This keeps TASKS.json clean and prevents it from becoming crowded with completed work',
          component: 'StopHook',
          operation: 'taskArchival',
        });
      } else {
        logger.addFlow('No completed tasks found to archive');
      }
    } catch (_) {
      logger.addFlow(`Task archival failed: ${_.message}`);

      loggers.stopHook.warn('AUTOMATIC TASK ARCHIVAL WARNING', {
        status: 'AUTOMATIC TASK ARCHIVAL WARNING',
        error: _.message,
        errorName: _.name,
        severity: 'non-critical',
        impact: "Won't prevent continued operation",
        component: 'StopHook',
        operation: 'taskArchivalError',
      });
    }

    // Always continue - never allow natural stops
    logger.addFlow(
      'Never-stop mode: Providing instructive task management guidance',
    );
    logger.logExit(2, 'Infinite continue mode - providing task guidance');
    logger.save();

    // Output detailed instructions to Claude

    loggers.stopHook.info('INFINITE CONTINUE MODE ACTIVE', {
      status: 'INFINITE CONTINUE MODE ACTIVE',
      agentWorkflowMandates: {
        mandatoryAgentLifecycle: [
          'INITIALIZE AGENT - Start fresh or reinitialize existing agent for session',
          'CLAIM FEATURE OR REVIEW - Either claim approved feature tasks OR focus on codebase review',
          'TODOWRITE EXECUTION - Use TodoWrite for task management and infinite continuation',
          'VALIDATION CYCLE - Continuously ensure: linter passes, builds succeed, runs/starts properly, unit tests pass with adequate coverage',
          'STOP ONLY WHEN PERFECT - Only stop when all validation passes and codebase is perfect',
        ],
        ultrathinkRequirements: [
          'READ development/essentials/ FILES FIRST - Every task/session start',
          'CHECK APPROVED FEATURES - Only work on user-approved features',
          'COMPLETE UNFINISHED TASKS - Never abandon work, finish what you start',
          'DEPLOY CONCURRENT SUBAGENTS - Use up to 10 for complex tasks',
          'COMPREHENSIVE LOGGING - Document all functions and decisions',
          'SCOPE CONTROL - Only create features when user explicitly requests',
          'LINTER VIGILANCE - Fix all errors immediately, create error tasks for failures',
        ],
      },
      instructiveGuidance: instructiveGuidance,
      stopPolicy: {
        allowed: false,
        message: 'This system operates in infinite continue mode',
      },
      authorizationProtocol: {
        condition: 'When ALL TodoWrite tasks complete AND project perfect',
        steps: [
          'Start: timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" start-authorization [agentId]',
          'Validate all 7 criteria sequentially with validate-criterion [AUTH_KEY] [criterion]',
          'Complete: timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete-authorization [AUTH_KEY]',
        ],
      },
      operation: 'CONTINUING OPERATION',
      component: 'StopHook',
      mode: 'infinite_continue',
    });

    // eslint-disable-next-line n/no-process-exit
    process.exit(2); // Always continue - never allow natural stops
  } catch (_) {
    loggers.stopHook.error('DETAILED ERROR DEBUG', {
      errorName: _.name,
      errorMessage: _.message,
      stack: _.stack,
      component: 'StopHook',
      operation: 'mainErrorHandler',
    });
    loggers.stopHook.info('Error handled - continuing infinite mode', {
      errorMessage: _.message,
      errorName: _.name,
      mode: 'infinite continue mode',
      component: 'StopHook',
      operation: 'errorRecovery',
    });

    loggers.stopHook.error('STOP HOOK ERROR - CONTINUING ANYWAY', {
      status: 'STOP HOOK ERROR - CONTINUING ANYWAY',
      error: _.message,
      errorName: _.name,
      stack: _.stack,
      behavior:
        'Even with errors, the system continues to prevent accidental termination',
      mode: 'INFINITE CONTINUE MODE MAINTAINED',
      troubleshooting: [
        'Ensure TASKS.json is properly formatted',
        'Verify TaskManager library is accessible',
        'Check file permissions',
      ],
      operation: 'CONTINUING OPERATION',
      component: 'StopHook',
      exitCode: 2,
    });
    // eslint-disable-next-line n/no-process-exit
    process.exit(2); // Even on _error, continue infinite mode
  }
});
