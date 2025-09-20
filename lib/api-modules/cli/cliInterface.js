/* eslint-disable no-console -- CLI interface requires console output for command-line operations */
/**
 * CLI Interface Module - Command-line argument parsing and execution for TaskManager API
 *
 * === PURPOSE ===
 * Handles all command-line interface operations for the TaskManager API including:
 * • Command parsing and validation
 * • Argument extraction and JSON parsing
 * • Command execution delegation
 * • Error handling with contextual guidance
 * • CLI output formatting
 *
 * === COMMAND CATEGORIES ===
 * • Discovery Commands - guide, methods, help
 * • Agent Lifecycle - init, reinitialize, status, list-agents
 * • Task Operations - create, list, claim, complete, delete
 * • Task Management - move-top, move-up, move-down, move-bottom
 * • Feature Management - suggest-feature, approve-feature, reject-feature
 * • Phase Management - create-phase, update-phase, progress-phase
 * • Agent Swarm - get-tasks (self-organizing agent coordination)
 *
 * === ARCHITECTURE ===
 * This module acts as the translation layer between CLI commands and API methods.
 * Each CLI command maps to one or more TaskManagerAPI methods with proper
 * argument parsing, validation, and error handling.
 *
 * @author TaskManager System
 * @version 2.0.0
 * @since 2024-01-01
 */

// Import the utility modules we've already created
const apiUtils = require('../utils/apiUtils');

/**
 * Parse and execute CLI command with comprehensive error handling
 * @param {TaskManagerAPI} api - TaskManager API instance
 * @param {Array} args - Command line arguments (already processed)
 * @returns {Promise<void>} Command execution result via console output
 * @throws {Error} If command execution fails with contextual guidance
 */
async function executeCommand(api, args) {
  const command = args[0];

  try {
    switch (command) {
      case 'methods': {
        const result = await api.getApiMethods();
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'guide': {
        const result = await api.getComprehensiveGuide();
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'init': {
        await handleInitCommand(api, args);
        break;
      }

      case 'reinitialize': {
        await handleReinitializeCommand(api, args);
        break;
      }

      case 'list-agents': {
        const result = await api.listAgents();
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'status': {
        await handleStatusCommand(api, args);
        break;
      }

      case 'current': {
        await handleCurrentCommand(api, args);
        break;
      }

      case 'stats': {
        const result = await api.getStats();
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'list': {
        await handleListCommand(api, args);
        break;
      }

      case 'create': {
        await handleCreateCommand(api, args);
        break;
      }

      case 'create-error': {
        await handleCreateErrorCommand(api, args);
        break;
      }

      case 'analyze-phase-insertion': {
        await handleAnalyzePhaseInsertionCommand(api, args);
        break;
      }

      case 'claim': {
        await handleClaimCommand(api, args);
        break;
      }

      case 'complete': {
        await handleCompleteCommand(api, args);
        break;
      }

      case 'delete': {
        await handleDeleteCommand(api, args);
        break;
      }

      case 'move-top': {
        await handleMoveTopCommand(api, args);
        break;
      }

      case 'move-up': {
        await handleMoveUpCommand(api, args);
        break;
      }

      case 'move-down': {
        await handleMoveDownCommand(api, args);
        break;
      }

      case 'move-bottom': {
        await handleMoveBottomCommand(api, args);
        break;
      }

      case 'suggest-feature': {
        await handleSuggestFeatureCommand(api, args);
        break;
      }

      case 'approve-feature': {
        await handleApproveFeatureCommand(api, args);
        break;
      }

      case 'reject-feature': {
        await handleRejectFeatureCommand(api, args);
        break;
      }

      case 'list-suggested-features': {
        const result = await api.listSuggestedFeatures();
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'list-features': {
        await handleListFeaturesCommand(api, args);
        break;
      }

      case 'feature-stats': {
        const result = await api.getFeatureStats();
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'create-phase': {
        await handleCreatePhaseCommand(api, args);
        break;
      }

      case 'update-phase': {
        await handleUpdatePhaseCommand(api, args);
        break;
      }

      case 'progress-phase': {
        await handleProgressPhaseCommand(api, args);
        break;
      }

      case 'list-phases': {
        await handleListPhasesCommand(api, args);
        break;
      }

      case 'current-phase': {
        await handleCurrentPhaseCommand(api, args);
        break;
      }

      case 'phase-stats': {
        await handlePhaseStatsCommand(api, args);
        break;
      }

      case 'get-tasks': {
        await handleGetTasksCommand(api, args);
        break;
      }

      case 'create-subtask': {
        await handleCreateSubtaskCommand(api, args);
        break;
      }

      case 'list-subtasks': {
        await handleListSubtasksCommand(api, args);
        break;
      }

      case 'update-subtask': {
        await handleUpdateSubtaskCommand(api, args);
        break;
      }

      case 'delete-subtask': {
        await handleDeleteSubtaskCommand(api, args);
        break;
      }

      case 'add-success-criteria': {
        await handleAddSuccessCriteriaCommand(api, args);
        break;
      }

      case 'get-success-criteria': {
        await handleGetSuccessCriteriaCommand(api, args);
        break;
      }

      case 'update-success-criteria': {
        await handleUpdateSuccessCriteriaCommand(api, args);
        break;
      }

      case 'set-project-criteria': {
        await handleSetProjectCriteriaCommand(api, args);
        break;
      }

      case 'validate-criteria': {
        await handleValidateCriteriaCommand(api, args);
        break;
      }

      case 'criteria-report': {
        await handleCriteriaReportCommand(api, args);
        break;
      }

      case 'research-task': {
        await handleResearchTaskCommand(api, args);
        break;
      }

      case 'audit-task': {
        await handleAuditTaskCommand(api, args);
        break;
      }

      // RAG Operations - Lessons and Error Database
      case 'store-lesson': {
        await handleStoreLessonCommand(api, args);
        break;
      }

      case 'store-error': {
        await handleStoreErrorCommand(api, args);
        break;
      }

      case 'search-lessons': {
        await handleSearchLessonsCommand(api, args);
        break;
      }

      case 'find-similar-errors': {
        await handleFindSimilarErrorsCommand(api, args);
        break;
      }

      case 'get-relevant-lessons': {
        await handleGetRelevantLessonsCommand(api, args);
        break;
      }

      case 'rag-analytics': {
        await handleRagAnalyticsCommand(api, args);
        break;
      }

      default: {
        // Display help for unknown commands
        await displayHelp();
        break;
      }
    }
  } catch (error) {
    throw await enhanceErrorWithContext(api, error, command);
  }
}

/**
 * Handle agent initialization command with config parsing
 */
async function handleInitCommand(api, args) {
  let config = {};
  if (args[1]) {
    try {
      config = JSON.parse(args[1]);
    } catch (parseError) {
      throw new Error(`Invalid JSON configuration: ${parseError.message}`);
    }
  }

  // Check if agent already exists and is still valid
  if (api.agentId) {
    try {
      // Try to get status of existing agent to see if it's still active
      const statusResult = await api.getAgentStatus(api.agentId);
      if (statusResult.success && statusResult.agent) {
        console.log(
          `Existing agent found (${api.agentId}). Reinitializing instead of creating new agent...`,
        );
        const result = await api.reinitializeAgent(api.agentId, config);
        console.log(JSON.stringify(result, null, 2));
        return;
      }
    } catch {
      // If status check fails, agent is stale - proceed with new initialization
      console.log(
        `Previous agent (${api.agentId}) is stale. Creating new agent...`,
      );
    }
  }

  const result = await api.initAgent(config);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle agent reinitialization command with smart agent detection
 */
async function handleReinitializeCommand(api, args) {
  const agentId = args[1];
  let config = {};

  // Parse config if provided
  if (args[2]) {
    try {
      config = JSON.parse(args[2]);
    } catch (parseError) {
      throw new Error(`Invalid JSON configuration: ${parseError.message}`);
    }
  }

  const result = await api.reinitializeAgent(agentId, config);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle agent status command with auto-detection
 */
async function handleStatusCommand(api, args) {
  let agentId = args[1];

  // Auto-detect stored agent ID if not provided
  if (!agentId && api.agentId) {
    agentId = api.agentId;
    console.log(`Using stored agent ID: ${agentId}`);
  }

  // If still no agent ID, provide helpful error
  if (!agentId) {
    throw new Error(
      'Agent ID required for status. Options:\n' +
        '1. Provide agent ID: status <agentId>\n' +
        '2. Initialize first: init (saves agent ID for reuse)\n' +
        '3. Use list-agents to find available agents\n' +
        '4. Current stored agent ID: ' +
        (api.agentId || 'none'),
    );
  }

  const result = await api.getAgentStatus(agentId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle current task command with agent ID detection
 */
async function handleCurrentCommand(api, args) {
  let agentId = args[1];

  // Auto-detect stored agent ID if not provided
  if (!agentId && api.agentId) {
    agentId = api.agentId;
    console.log(`Using stored agent ID: ${agentId}`);
  }

  // If still no agent ID, provide helpful error
  if (!agentId) {
    throw new Error(
      'Agent ID required for current task. Options:\n' +
        '1. Provide agent ID: current <agentId>\n' +
        '2. Initialize first: init (saves agent ID for reuse)\n' +
        '3. Current stored agent ID: ' +
        (api.agentId || 'none'),
    );
  }

  const result = await api.getCurrentTask(agentId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle list tasks command with filter parsing
 */
async function handleListCommand(api, args) {
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
}

/**
 * Handle create task command with JSON parsing
 */
async function handleCreateCommand(api, args) {
  if (!args[1]) {
    throw new Error('Task data required for create command');
  }
  let taskData;
  try {
    taskData = JSON.parse(args[1]);
  } catch (parseError) {
    throw new Error(`Invalid JSON task data: ${parseError.message}`);
  }
  const result = await api.createTask(taskData);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle create error task command with JSON parsing and category validation
 */
async function handleCreateErrorCommand(api, args) {
  if (!args[1]) {
    throw new Error('Task data required for create-error command');
  }
  let taskData;
  try {
    taskData = JSON.parse(args[1]);
  } catch (parseError) {
    throw new Error(`Invalid JSON task data: ${parseError.message}`);
  }

  // VALIDATE: Check category before proceeding
  if (taskData.category && taskData.category !== 'error') {
    throw new Error(
      `create-error command can only be used for error category tasks. ` +
      `Received category: "${taskData.category}". ` +
      `Use 'create' command for category: ${taskData.category}`,
    );
  }

  const result = await api.createErrorTask(taskData);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle analyze phase insertion command
 */
async function handleAnalyzePhaseInsertionCommand(api, args) {
  if (!args[1]) {
    throw new Error('Task data required for analyze-phase-insertion command');
  }
  let taskData;
  try {
    taskData = JSON.parse(args[1]);
  } catch (parseError) {
    throw new Error(`Invalid JSON task data: ${parseError.message}`);
  }
  const result = await api.analyzePhaseInsertion(taskData);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle claim task command with agent ID detection and allowOutOfOrder support
 */
async function handleClaimCommand(api, args) {
  const taskId = args[1];
  let agentId = args[2];
  let priority = args[3] || 'normal';

  // Check for --allow-out-of-order flag in all arguments
  const allowOutOfOrderFlag = args.includes('--allow-out-of-order');

  // Remove the flag from args and adjust parameters
  if (allowOutOfOrderFlag) {
    const flagIndex = args.indexOf('--allow-out-of-order');
    args.splice(flagIndex, 1);

    // Re-parse arguments after removing flag
    agentId = args[2];
    priority = args[3] || 'normal';
  }

  if (!taskId) {
    throw new Error('Task ID required for claim command');
  }

  // Auto-detect stored agent ID if not provided
  if (!agentId && api.agentId) {
    agentId = api.agentId;
    console.log(`Using stored agent ID: ${agentId}`);
  }

  // If still no agent ID, provide helpful error
  if (!agentId) {
    throw new Error(
      'Agent ID required for claim. Options:\n' +
        '1. Provide agent ID: claim <taskId> <agentId> [priority] [--allow-out-of-order]\n' +
        '2. Initialize first: init (saves agent ID for reuse)\n' +
        '3. Current stored agent ID: ' +
        (api.agentId || 'none') +
        '\n\nFlags:\n' +
        '  --allow-out-of-order: Override task order restrictions (use when user explicitly requests specific task)',
    );
  }

  // Use TaskManager directly when allowOutOfOrder is needed
  let result;
  if (allowOutOfOrderFlag) {
    console.log('🔄 OVERRIDING TASK ORDER - User-requested task takes priority');
    result = await api.taskManager.claimTask(taskId, agentId, priority, {
      allowOutOfOrder: true,
    });
  } else {
    result = await api.claimTask(taskId, agentId, priority);
  }

  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle complete task command with completion data parsing
 */
async function handleCompleteCommand(api, args) {
  const taskId = args[1];
  const agentId = null;
  let completionData = null;

  if (!taskId) {
    throw new Error('Task ID required for complete command');
  }

  // Parse optional completion data
  if (args[2]) {
    try {
      completionData = JSON.parse(args[2]);
    } catch (parseError) {
      throw new Error(`Invalid JSON completion data: ${parseError.message}`);
    }
  }

  const result = await api.completeTask(taskId, agentId, completionData);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle delete task command
 */
async function handleDeleteCommand(api, args) {
  const taskId = args[1];
  if (!taskId) {
    throw new Error('Task ID required for delete command');
  }
  const result = await api.deleteTask(taskId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle move task to top command
 */
async function handleMoveTopCommand(api, args) {
  const taskId = args[1];
  if (!taskId) {
    throw new Error('Task ID required for move-top command');
  }
  const result = await api.moveTaskToTop(taskId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle move task up command
 */
async function handleMoveUpCommand(api, args) {
  const taskId = args[1];
  if (!taskId) {
    throw new Error('Task ID required for move-up command');
  }
  const result = await api.moveTaskUp(taskId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle move task down command
 */
async function handleMoveDownCommand(api, args) {
  const taskId = args[1];
  if (!taskId) {
    throw new Error('Task ID required for move-down command');
  }
  const result = await api.moveTaskDown(taskId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle move task to bottom command
 */
async function handleMoveBottomCommand(api, args) {
  const taskId = args[1];
  if (!taskId) {
    throw new Error('Task ID required for move-bottom command');
  }
  const result = await api.moveTaskToBottom(taskId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle suggest feature command
 */
async function handleSuggestFeatureCommand(api, args) {
  if (!args[1]) {
    throw new Error('Feature data required for suggest-feature command');
  }
  let featureData;
  try {
    featureData = JSON.parse(args[1]);
  } catch (parseError) {
    throw new Error(`Invalid JSON feature data: ${parseError.message}`);
  }

  const agentId = args[2] || null;
  const result = await api.suggestFeature(featureData, agentId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle approve feature command
 */
async function handleApproveFeatureCommand(api, args) {
  const featureId = args[1];
  if (!featureId) {
    throw new Error('Feature ID required for approve-feature command');
  }
  const userId = args[2] || null;
  const result = await api.approveFeature(featureId, userId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle reject feature command
 */
async function handleRejectFeatureCommand(api, args) {
  const featureId = args[1];
  if (!featureId) {
    throw new Error('Feature ID required for reject-feature command');
  }
  const userId = args[2] || null;
  const reason = args[3] || null;
  const result = await api.rejectFeature(featureId, userId, reason);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle list features command
 */
async function handleListFeaturesCommand(api, args) {
  let filter = {};
  if (args[1]) {
    try {
      filter = JSON.parse(args[1]);
    } catch (parseError) {
      throw new Error(`Invalid JSON filter: ${parseError.message}`);
    }
  }
  const result = await api.listFeatures(filter);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle create phase command
 */
async function handleCreatePhaseCommand(api, args) {
  const featureId = args[1];
  if (!featureId) {
    throw new Error('Feature ID required for create-phase command');
  }
  if (!args[2]) {
    throw new Error('Phase data required for create-phase command');
  }
  let phaseData;
  try {
    phaseData = JSON.parse(args[2]);
  } catch (parseError) {
    throw new Error(`Invalid JSON phase data: ${parseError.message}`);
  }
  const result = await api.createPhase(featureId, phaseData);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle update phase command
 */
async function handleUpdatePhaseCommand(api, args) {
  const featureId = args[1];
  const phaseNumber = parseInt(args[2], 10);
  if (!featureId) {
    throw new Error('Feature ID required for update-phase command');
  }
  if (!args[2] || isNaN(phaseNumber)) {
    throw new Error('Valid phase number required for update-phase command');
  }
  if (!args[3]) {
    throw new Error('Update data required for update-phase command');
  }
  let updates;
  try {
    updates = JSON.parse(args[3]);
  } catch (parseError) {
    throw new Error(`Invalid JSON update data: ${parseError.message}`);
  }
  const result = await api.updatePhase(featureId, phaseNumber, updates);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle progress phase command
 */
async function handleProgressPhaseCommand(api, args) {
  const featureId = args[1];
  const currentPhaseNumber = parseInt(args[2], 10);
  if (!featureId) {
    throw new Error('Feature ID required for progress-phase command');
  }
  if (!args[2] || isNaN(currentPhaseNumber)) {
    throw new Error('Valid current phase number required for progress-phase command');
  }
  const result = await api.progressPhase(featureId, currentPhaseNumber);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle list phases command
 */
async function handleListPhasesCommand(api, args) {
  const featureId = args[1];
  if (!featureId) {
    throw new Error('Feature ID required for list-phases command');
  }
  const result = await api.listPhases(featureId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle current phase command
 */
async function handleCurrentPhaseCommand(api, args) {
  const featureId = args[1];
  if (!featureId) {
    throw new Error('Feature ID required for current-phase command');
  }
  const result = await api.getCurrentPhase(featureId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle phase stats command
 */
async function handlePhaseStatsCommand(api, args) {
  const featureId = args[1];
  if (!featureId) {
    throw new Error('Feature ID required for phase-stats command');
  }
  const result = await api.getPhaseStats(featureId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle get tasks command for agent swarm coordination
 */
async function handleGetTasksCommand(api, args) {
  let options = {};
  if (args[1]) {
    try {
      options = JSON.parse(args[1]);
    } catch (parseError) {
      throw new Error(`Invalid JSON options: ${parseError.message}`);
    }
  }
  const result = await api.getTasks(options);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle create subtask command - adds research or audit subtask to existing task
 */
async function handleCreateSubtaskCommand(api, args) {
  const taskId = args[1];
  const subtaskType = args[2]; // 'research' or 'audit'

  if (!taskId) {
    throw new Error('Task ID required for create-subtask command');
  }

  if (!subtaskType || !['research', 'audit'].includes(subtaskType)) {
    throw new Error('Subtask type required: "research" or "audit"');
  }

  let subtaskData = {};
  if (args[3]) {
    try {
      subtaskData = JSON.parse(args[3]);
    } catch (parseError) {
      throw new Error(`Invalid JSON subtask data: ${parseError.message}`);
    }
  }

  const result = await api.createSubtask(taskId, subtaskType, subtaskData);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle list subtasks command - shows all subtasks for a given task
 */
async function handleListSubtasksCommand(api, args) {
  const taskId = args[1];

  if (!taskId) {
    throw new Error('Task ID required for list-subtasks command');
  }

  const result = await api.listSubtasks(taskId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle update subtask command - updates subtask status, description, etc.
 */
async function handleUpdateSubtaskCommand(api, args) {
  const taskId = args[1];
  const subtaskId = args[2];

  if (!taskId) {
    throw new Error('Task ID required for update-subtask command');
  }

  if (!subtaskId) {
    throw new Error('Subtask ID required for update-subtask command');
  }

  if (!args[3]) {
    throw new Error('Update data required for update-subtask command');
  }

  let updateData;
  try {
    updateData = JSON.parse(args[3]);
  } catch (parseError) {
    throw new Error(`Invalid JSON update data: ${parseError.message}`);
  }

  const result = await api.updateSubtask(taskId, subtaskId, updateData);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle delete subtask command - removes subtask from task
 */
async function handleDeleteSubtaskCommand(api, args) {
  const taskId = args[1];
  const subtaskId = args[2];

  if (!taskId) {
    throw new Error('Task ID required for delete-subtask command');
  }

  if (!subtaskId) {
    throw new Error('Subtask ID required for delete-subtask command');
  }

  const result = await api.deleteSubtask(taskId, subtaskId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle add success criteria command - adds success criteria to task or project-wide
 */
async function handleAddSuccessCriteriaCommand(api, args) {
  const targetType = args[1]; // 'task' or 'project'
  const targetId = args[2]; // task ID for task-specific, null for project-wide

  if (!targetType || !['task', 'project'].includes(targetType)) {
    throw new Error('Target type required: "task" or "project"');
  }

  if (targetType === 'task' && !targetId) {
    throw new Error('Task ID required for task-specific success criteria');
  }

  if (!args[3]) {
    throw new Error('Success criteria data required');
  }

  let criteriaData;
  try {
    criteriaData = JSON.parse(args[3]);
  } catch (parseError) {
    throw new Error(`Invalid JSON criteria data: ${parseError.message}`);
  }

  const result = await api.addSuccessCriteria(targetType, targetId, criteriaData);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle get success criteria command - retrieves success criteria for task or project
 */
async function handleGetSuccessCriteriaCommand(api, args) {
  const targetType = args[1]; // 'task' or 'project'
  const targetId = args[2]; // task ID for task-specific, null for project-wide

  if (!targetType || !['task', 'project'].includes(targetType)) {
    throw new Error('Target type required: "task" or "project"');
  }

  if (targetType === 'task' && !targetId) {
    throw new Error('Task ID required for task-specific success criteria');
  }

  const result = await api.getSuccessCriteria(targetType, targetId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle update success criteria command - modifies existing success criteria
 */
async function handleUpdateSuccessCriteriaCommand(api, args) {
  const targetType = args[1]; // 'task' or 'project'
  const targetId = args[2]; // task ID for task-specific, null for project-wide

  if (!targetType || !['task', 'project'].includes(targetType)) {
    throw new Error('Target type required: "task" or "project"');
  }

  if (targetType === 'task' && !targetId) {
    throw new Error('Task ID required for task-specific success criteria');
  }

  if (!args[3]) {
    throw new Error('Update data required for update-success-criteria command');
  }

  let updateData;
  try {
    updateData = JSON.parse(args[3]);
  } catch (parseError) {
    throw new Error(`Invalid JSON update data: ${parseError.message}`);
  }

  const result = await api.updateSuccessCriteria(targetType, targetId, updateData);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle set project criteria command - sets project-wide success criteria
 */
async function handleSetProjectCriteriaCommand(api, args) {
  if (!args[1]) {
    throw new Error('Project criteria data required');
  }

  let criteriaData;
  try {
    criteriaData = JSON.parse(args[1]);
  } catch (parseError) {
    throw new Error(`Invalid JSON criteria data: ${parseError.message}`);
  }

  const result = await api.setProjectCriteria(criteriaData);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle validate criteria command - validates task against success criteria
 */
async function handleValidateCriteriaCommand(api, args) {
  const taskId = args[1];

  if (!taskId) {
    throw new Error('Task ID required for criteria validation');
  }

  // Optional validation type and evidence
  const validationType = args[2] || 'full'; // 'full' or 'partial'
  let evidence = {};

  if (args[3]) {
    try {
      evidence = JSON.parse(args[3]);
    } catch (parseError) {
      throw new Error(`Invalid JSON evidence data: ${parseError.message}`);
    }
  }

  const result = await api.validateCriteria(taskId, validationType, evidence);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle criteria report command - generates validation report for task
 */
async function handleCriteriaReportCommand(api, args) {
  const taskId = args[1];

  if (!taskId) {
    throw new Error('Task ID required for criteria report');
  }

  const result = await api.getCriteriaReport(taskId);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle research task command - manages research task routing and execution
 */
async function handleResearchTaskCommand(api, args) {
  const action = args[1]; // 'start', 'complete', 'status'
  const taskId = args[2];

  if (!action || !['start', 'complete', 'status'].includes(action)) {
    throw new Error('Action required: "start", "complete", or "status"');
  }

  if (!taskId) {
    throw new Error('Task ID required for research task command');
  }

  let researchData = {};
  if (args[3]) {
    try {
      researchData = JSON.parse(args[3]);
    } catch (parseError) {
      throw new Error(`Invalid JSON research data: ${parseError.message}`);
    }
  }

  const result = await api.manageResearchTask(action, taskId, researchData);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle audit task command - manages audit task assignment and execution with objectivity controls
 */
async function handleAuditTaskCommand(api, args) {
  const action = args[1]; // 'start', 'complete', 'status'
  const taskId = args[2];

  if (!action || !['start', 'complete', 'status'].includes(action)) {
    throw new Error('Action required: "start", "complete", or "status"');
  }

  if (!taskId) {
    throw new Error('Task ID required for audit task command');
  }

  let auditData = {};
  if (args[3]) {
    try {
      auditData = JSON.parse(args[3]);
    } catch (parseError) {
      throw new Error(`Invalid JSON audit data: ${parseError.message}`);
    }
  }

  const result = await api.manageAuditTask(action, taskId, auditData);
  console.log(JSON.stringify(result, null, 2));
}

// =================== RAG OPERATIONS HANDLERS ===================

/**
 * Handle store lesson command with JSON parsing
 */
async function handleStoreLessonCommand(api, args) {
  if (!args[1]) {
    throw new Error('Lesson data required for store-lesson command');
  }
  let lessonData;
  try {
    lessonData = JSON.parse(args[1]);
  } catch (parseError) {
    throw new Error(`Invalid JSON lesson data: ${parseError.message}`);
  }
  const result = await api.storeLesson(lessonData);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle store error command with JSON parsing
 */
async function handleStoreErrorCommand(api, args) {
  if (!args[1]) {
    throw new Error('Error data required for store-error command');
  }
  let errorData;
  try {
    errorData = JSON.parse(args[1]);
  } catch (parseError) {
    throw new Error(`Invalid JSON error data: ${parseError.message}`);
  }
  const result = await api.storeError(errorData);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle search lessons command
 */
async function handleSearchLessonsCommand(api, args) {
  if (!args[1]) {
    throw new Error('Search query required for search-lessons command');
  }

  const query = args[1];
  let options = {};

  if (args[2]) {
    try {
      options = JSON.parse(args[2]);
    } catch (parseError) {
      throw new Error(`Invalid JSON options: ${parseError.message}`);
    }
  }

  const result = await api.searchLessons(query, options);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle find similar errors command
 */
async function handleFindSimilarErrorsCommand(api, args) {
  if (!args[1]) {
    throw new Error('Error description required for find-similar-errors command');
  }

  const errorDescription = args[1];
  let options = {};

  if (args[2]) {
    try {
      options = JSON.parse(args[2]);
    } catch (parseError) {
      throw new Error(`Invalid JSON options: ${parseError.message}`);
    }
  }

  const result = await api.findSimilarErrors(errorDescription, options);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle get relevant lessons command
 */
async function handleGetRelevantLessonsCommand(api, args) {
  if (!args[1]) {
    throw new Error('Task context required for get-relevant-lessons command');
  }

  const taskContext = args[1];
  let options = {};

  if (args[2]) {
    try {
      options = JSON.parse(args[2]);
    } catch (parseError) {
      throw new Error(`Invalid JSON options: ${parseError.message}`);
    }
  }

  const result = await api.getRelevantLessons(taskContext, options);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Handle RAG analytics command
 */
async function handleRagAnalyticsCommand(api, args) {
  let options = {};

  if (args[1]) {
    try {
      options = JSON.parse(args[1]);
    } catch (parseError) {
      throw new Error(`Invalid JSON options: ${parseError.message}`);
    }
  }

  const result = await api.getRagAnalytics(options);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Enhance error with contextual guidance
 */
async function enhanceErrorWithContext(api, error, command) {
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
      guide = apiUtils.getFallbackGuide(errorContext);
    } catch {
      // If everything fails, use basic guide
    }
  }

  const enhancedError = new Error(error.message);
  enhancedError.context = {
    command,
    errorContext,
    timestamp: new Date().toISOString(),
    guide: guide || {
      message:
        'For complete API usage guidance, run: timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" guide',
      helpText:
        'The guide provides comprehensive information about task classification, workflows, and all API capabilities',
    },
  };

  return enhancedError;
}

/**
 * Display comprehensive help information
 */
function displayHelp() {
  console.log(`
TaskManager API - Universal Task Management CLI

Agent Management:
  init [config]                - Initialize agent with optional config JSON
  reinitialize <agentId> [config] - Reinitialize existing agent (use list-agents to find your agent ID)
  list-agents                  - List all active agents with their IDs and status
  status [agentId]             - Get agent status and current tasks
  current [agentId]            - Get current task for agent
  stats                        - Get orchestration statistics

Discovery Commands:
  methods                      - Get all available TaskManager and API methods with CLI/API mapping
  guide                        - Get comprehensive API documentation and troubleshooting

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

Embedded Subtasks Management:
  create-subtask <taskId> <type> [data]        - Create research/audit subtask for task
                                                Type: "research" or "audit"
  list-subtasks <taskId>                       - List all subtasks for a task
  update-subtask <taskId> <subtaskId> <data>   - Update subtask status/description
  delete-subtask <taskId> <subtaskId>          - Remove subtask from task

Success Criteria Management:
  add-success-criteria <type> <targetId> <data> - Add success criteria to task or project
                                                Type: "task" or "project"
  get-success-criteria <type> <targetId>       - Get success criteria for task/project
  update-success-criteria <type> <targetId> <data> - Update existing success criteria

Research & Audit Task Management:
  research-task <action> <taskId> [data]       - Manage research tasks (start/complete/status)
  audit-task <action> <taskId> [data]          - Manage audit tasks with objectivity controls

RAG Operations - Lessons and Error Database:
  store-lesson <lessonData>                    - Store new lesson with auto-embedding for semantic search
  store-error <errorData>                      - Store error resolution with embedding for similarity matching
  search-lessons <query> [options]             - Search for relevant lessons using semantic similarity
  find-similar-errors <errorDescription> [options] - Find similar resolved errors for current problem
  get-relevant-lessons <taskContext> [options] - Get contextually relevant lessons for task
  rag-analytics [options]                      - Get usage patterns and effectiveness metrics

Essential Examples:
  timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" init
  timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" create '{"title": "Fix linting errors", "description": "Resolve ESLint violations", "category": "error"}'
  timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" complete task_123 '{"message": "Task completed successfully"}'
  timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" list '{"status": "pending"}'
  timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" guide

Agent Swarm Examples:
  timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" get-tasks
  timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" get-tasks '{"categories": ["error"], "limit": 3}'
  timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" get-tasks '{"agentId": "development_session_123", "specializations": ["frontend"]}'

Subtasks & Success Criteria Examples:
  timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" create-subtask task_123 research '{"focus": "API best practices"}'
  timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" list-subtasks task_123
  timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" add-success-criteria task task_123 '{"criteria": ["Linter clean", "Tests pass"]}'
  timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" research-task start task_123 '{"locations": ["codebase", "internet"]}'

RAG Operations Examples:
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" store-lesson '{"title": "API Error Handling", "content": "Always use try-catch blocks", "category": "best-practices"}'
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" store-error '{"error_description": "Cannot read property", "resolution": "Add null checks", "error_type": "runtime"}'
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" search-lessons "error handling best practices" '{"category": "best-practices", "limit": 5}'
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" find-similar-errors "Cannot read property of undefined" '{"limit": 3}'
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-relevant-lessons "implementing API endpoints" '{"projectId": "current"}'
  timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" rag-analytics

Troubleshooting:
  • For completion JSON errors, ensure proper quoting: '{"message": "text"}'
  • Use 'methods' command to see CLI-to-API method mapping
  • Use 'guide' command for comprehensive documentation
  • CLI commands (like 'complete') map to API methods (like 'completeTask')
  `);
}

module.exports = {
  executeCommand,
  displayHelp,
};
