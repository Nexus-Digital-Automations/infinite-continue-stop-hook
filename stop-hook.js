const _fs = require('fs');
const _path = require('path');
const _TaskManager = require('./lib/taskManager');
const _Logger = require('./lib/logger');

// ============================================================================
// NEVER-STOP INFINITE CONTINUE HOOK WITH INSTRUCTIVE TASK MANAGEMENT
// ============================================================================

/**
 * Find the root "Claude Coding Projects" directory containing TODO.json
 */
function findClaudeProjectRoot(startDir = process.cwd()) {
  let currentDir = startDir;

  // Look for "Claude Coding Projects" in the path and check for TODO.json
  while (currentDir !== _path.dirname(currentDir)) {
    // Not at filesystem root
    // Check if we're in or found "Claude Coding Projects"
    if (currentDir.includes('Claude Coding Projects')) {
      // Look for TODO.json in potential project roots
      const segments = currentDir.split(_path.sep);
      const claudeIndex = segments.findIndex((segment) =>
        segment.includes('Claude Coding Projects'),
      );

      if (claudeIndex !== -1 && claudeIndex < segments.length - 1) {
        // Try the next directory after "Claude Coding Projects"
        const projectDir = segments.slice(0, claudeIndex + 2).join(_path.sep);
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script validating project structure with computed paths
        if (_fs.existsSync(_path.join(projectDir, 'TODO.json'))) {
          return projectDir;
        }
      }

      // Also check current directory
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script validating project structure with computed paths
      if (_fs.existsSync(_path.join(currentDir, 'TODO.json'))) {
        return currentDir;
      }
    }

    currentDir = _path.dirname(currentDir);
  }

  // Fallback to original behavior
  return startDir;
}

/**
 * Check if stop is allowed via endpoint trigger
 */
function checkStopAllowed(workingDir = process.cwd()) {
  const stopFlagPath = _path.join(workingDir, '.stop-allowed');

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script with validated working directory path
  if (_fs.existsSync(stopFlagPath)) {
    // Read and immediately delete the flag (single-use)
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script reading validated stop flag file
      const flagData = JSON.parse(_fs.readFileSync(stopFlagPath, 'utf8'));
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script with validated file path for cleanup
      _fs.unlinkSync(stopFlagPath); // Remove flag after reading
      return flagData.stop_allowed === true;
    } catch {
      // Invalid flag file, remove it
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script with validated file path for cleanup
      _fs.unlinkSync(stopFlagPath);
      return false;
    }
  }

  return false; // Default: never allow stops
}

/**
 * Clean up stale agents in a single TODO.json file
 * @param {string} projectPath - Path to project directory containing TODO.json
 * @param {Object} logger - Logger instance for output
 * @returns {Object} Cleanup results
 */
async function cleanupStaleAgentsInProject(projectPath, logger) {
  const todoPath = _path.join(projectPath, 'TODO.json');

  // Check if TODO.json exists in this project
  if (!_fs.existsSync(todoPath)) {
    logger.addFlow(`No TODO.json found in ${projectPath} - skipping`);
    return { agentsRemoved: 0, tasksUnassigned: 0, projectPath };
  }

  let _todoData;
  try {
    _todoData = JSON.parse(_fs.readFileSync(todoPath, 'utf8'));
  } catch (error) {
    logger.addFlow(`Failed to read TODO.json in ${projectPath}: ${error.message}`);
    return { agentsRemoved: 0, tasksUnassigned: 0, projectPath, error: error.message };
  }

  // Get all agents from TODO.json
  const allAgents = Object.keys(_todoData.agents || {});
  if (allAgents.length === 0) {
    logger.addFlow(`No agents found in ${projectPath} - skipping`);
    return { agentsRemoved: 0, tasksUnassigned: 0, projectPath };
  }

  // Clean up stale agents (older than 30 minutes) and identify active ones
  const staleAgentTimeout = 1800000; // 30 minutes
  const staleAgents = [];

  for (const agentId of allAgents) {
    const agent = _todoData.agents[agentId];
    // Handle both lastHeartbeat (camelCase) and last_heartbeat (snake_case) formats
    const lastHeartbeat = agent.lastHeartbeat || agent.last_heartbeat;
    const heartbeatTime = lastHeartbeat ? new Date(lastHeartbeat).getTime() : 0;
    const timeSinceHeartbeat = Date.now() - heartbeatTime;
    const isActive = timeSinceHeartbeat < staleAgentTimeout;

    if (!isActive) {
      staleAgents.push(agentId);
    }
  }

  // Remove stale agents from the system AND unassign them from tasks
  let agentsRemoved = 0;
  let tasksUnassigned = 0;

  for (const staleAgentId of staleAgents) {
    delete _todoData.agents[staleAgentId];
    agentsRemoved++;
    logger.addFlow(`Removed stale agent from ${projectPath}: ${staleAgentId}`);

    // Find all tasks assigned to this stale agent and unassign them
    for (const task of _todoData.tasks || []) {
      // Skip null/undefined tasks
      if (!task || typeof task !== 'object') {
        continue;
      }

      if (
        task.assigned_agent === staleAgentId ||
        task.claimed_by === staleAgentId
      ) {
        // Unassign the stale agent from the task
        task.assigned_agent = null;
        task.claimed_by = null;

        // Reset task to pending if it was in_progress
        if (task.status === 'in_progress') {
          task.status = 'pending';
          task.started_at = null;
        }

        // Add assignment history entry
        if (!task.agent_assignment_history) {
          task.agent_assignment_history = [];
        }
        task.agent_assignment_history.push({
          agent: staleAgentId,
          action: 'auto_unassign_stale',
          timestamp: new Date().toISOString(),
          reason: 'Agent became stale (inactive >30 minutes)',
        });

        tasksUnassigned++;
        logger.addFlow(
          `Unassigned task in ${projectPath}: "${task.title}" from stale agent: ${staleAgentId}`,
        );
      }
    }
  }

  // Write back if any changes were made
  if (agentsRemoved > 0 || tasksUnassigned > 0) {
    try {
      _fs.writeFileSync(todoPath, JSON.stringify(_todoData, null, 2));
      logger.addFlow(`Updated ${projectPath}/TODO.json with cleanup results`);
    } catch (error) {
      logger.addFlow(`Failed to write TODO.json in ${projectPath}: ${error.message}`);
      return { agentsRemoved: 0, tasksUnassigned: 0, projectPath, error: error.message };
    }
  }

  return { agentsRemoved, tasksUnassigned, projectPath };
}

/**
 * Clean up stale agents across all known projects
 * @param {Object} logger - Logger instance for output
 * @returns {Object} Overall cleanup results
 */
async function cleanupStaleAgentsAcrossProjects(logger) {
  // Define known project paths to check for stale agents
  const knownProjects = [
    '/Users/jeremyparker/Desktop/Claude Coding Projects/AIgent/bytebot',
    '/Users/jeremyparker/infinite-continue-stop-hook',
    // Add more project paths as needed
  ];

  const results = {
    totalAgentsRemoved: 0,
    totalTasksUnassigned: 0,
    projectResults: [],
    errors: [],
  };

  logger.addFlow(`🧹 Starting multi-project stale agent cleanup across ${knownProjects.length} projects...`);

  // Process projects in parallel for better performance
  const projectPromises = knownProjects.map(async (projectPath) => {
    try {
      if (_fs.existsSync(projectPath)) {
        const result = await cleanupStaleAgentsInProject(projectPath, logger);
        return result;
      } else {
        logger.addFlow(`Project path does not exist: ${projectPath} - skipping`);
        return { agentsRemoved: 0, tasksUnassigned: 0, projectPath, skipped: true };
      }
    } catch (error) {
      const errorMsg = `Failed to process ${projectPath}: ${error.message}`;
      logger.addFlow(errorMsg);
      return { agentsRemoved: 0, tasksUnassigned: 0, projectPath, error: error.message };
    }
  });

  const projectResults = await Promise.all(projectPromises);

  // Aggregate results from parallel processing
  for (const result of projectResults) {
    results.projectResults.push(result);
    results.totalAgentsRemoved += result.agentsRemoved;
    results.totalTasksUnassigned += result.tasksUnassigned;

    if (result.error) {
      results.errors.push(`${result.projectPath}: ${result.error}`);
    }
  }

  logger.addFlow(`🧹 Multi-project cleanup complete: ${results.totalAgentsRemoved} agents removed, ${results.totalTasksUnassigned} tasks unassigned`);

  return results;
}

/**
 * Automatically reclassify test errors and sort tasks according to CLAUDE.md priority rules
 */
async function autoSortTasksByPriority(taskManager) {
  try {
    const todoData = await taskManager.readTodo();
    let tasksMoved = 0;
    let tasksUpdated = 0;

    // Helper functions for ID-based classification
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
      const category = task.category ? String(task.category).toLowerCase() : '';
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
        (category &&
          [
            'linter-error',
            'build-error',
            'start-error',
            'error',
            'bug',
          ].includes(category));

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

      // TEST detection
      const testPatterns = [
        /test|testing|spec|coverage|jest|mocha|cypress|e2e|unit.*test|integration.*test/i,
        /\.test\.|\.spec\.|__tests__|test.*suite/i,
      ];

      const isTest =
        testPatterns.some((pattern) => pattern.test(allText)) ||
        (category && category.startsWith('test-')) ||
        (category &&
          ['missing-test', 'test-setup', 'test-refactor', 'testing'].includes(
            category,
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

    // ID-based priority system
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

    // Ensure tasks is an array
    if (!Array.isArray(todoData.tasks)) {
      todoData.tasks = [];
    }

    // Process all tasks for ID-based classification
    for (const task of todoData.tasks) {
      // Skip null/undefined tasks
      if (!task || typeof task !== 'object') {
        continue;
      }

      let updated = false;
      const currentId = task.id || '';

      // STEP 1: Auto-reclassify tasks with incorrect ID prefixes
      const shouldBePrefix = determineCorrectPrefix(task);
      const currentPrefix = getCurrentPrefix(currentId);

      if (currentPrefix !== shouldBePrefix) {
        // Generate new ID with correct prefix
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substr(2, 9);
        task.id = `${shouldBePrefix}_${timestamp}_${randomSuffix}`;
        updated = true;
        tasksMoved++;
      }

      if (updated) {
        tasksUpdated++;
      }
    }

    // STEP 2: Sort tasks by ID-based priority
    todoData.tasks.sort((a, b) => {
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

    // Update TODO.json settings for ID-based classification
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

    // Save the updated TODO.json
    if (tasksMoved > 0 || tasksUpdated > 0) {
      await taskManager.writeTodo(todoData);
    }

    return {
      tasksMoved,
      tasksUpdated,
      totalTasks: todoData.tasks.length,
    };
  } catch (error) {
    // eslint-disable-next-line no-console -- hook script error logging for debugging
    console.error('Error in autoSortTasksByPriority:', error);
    return { error: error.message, tasksMoved: 0, tasksUpdated: 0 };
  }
}

/**
 * Provides standardized TaskManager API guidance for all scenarios
 */
function provideInstructiveTaskGuidance(taskManager, taskStatus) {
  return `
📋 CLAUDE CODE AGENT TASK CONTINUATION PROTOCOL

🚨 **CRITICAL AGENT PROTOCOL:**
**ULTRATHINK - MANDATORY SEQUENCE:**
1. **READ/REVIEW development/essentials/** directory - MANDATORY EVERY TIME
2. **REINITIALIZE AGENT** to continue existing work or init new agent
3. **CHECK CURRENT TASK** status - complete unfinished work first
4. **DEPLOY CONCURRENT SUBAGENTS** - use up to 10 for complex tasks
5. **VALIDATE BEFORE COMPLETION** - run all checks (lint, typecheck, tests) before marking complete
6. **MAXIMUM LOGGING & DOCUMENTATION** - comprehensive logging and documentation in all code

🔴 **TASK COMPLETION MANDATE - ZERO TOLERANCE FOR ABANDONMENT:**
**FINISH CURRENT TASKS BEFORE STARTING NEW ONES - PROFESSIONAL DEVELOPERS COMPLETE THEIR WORK**

**CONTINUATION PROTOCOL:**
✅ **CHECK AGENT STATUS** → Always use reinitialize (works for both fresh and existing agents)
✅ **COMPLETE CURRENT WORK** → Never abandon unfinished tasks - teams depend on you
✅ **PRESERVE CONTEXT** → Build upon existing work, maintain implementation approach
✅ **VALIDATE THOROUGHLY** → Run all checks before completion
❌ **NO TASK ABANDONMENT** → Only interrupt for critical errors (linter, build-blocking, user commands)
❌ **NO SCOPE EXPANSION** → Never create feature tasks without explicit user request
❌ **NO SHORTCUTS** → Fix problems directly, never hide or mask issues

**MANDATORY RULES:**
• **FEATURES**: Only implement "approved" status features in TODO.json
• **SCOPE CONTROL**: Write feature suggestions in development/essentials/features.md only
• **TASK CLAIMING**: Verify tasks not already claimed before claiming
• **DEVELOPMENT ESSENTIALS**: Read all files before any work
• **VALIDATION**: Run linter/typecheck after every change, create error tasks for failures

🎯 **ESSENTIAL COMMANDS:**

**CORE WORKFLOW:**
   # Reinitialize agent (works for fresh and existing agents)
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize [AGENT_ID] --project-root "/Users/jeremyparker/infinite-continue-stop-hook"

   # Read development/essentials/ files
   ls development/essentials/ 2>/dev/null && find development/essentials/ -type f -name "*.md" -exec echo "=== {} ===" \\; -exec cat {} \\;

   # Check current task status
   timeout 10s node -e 'const _TaskManager = require("/Users/jeremyparker/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTask("[AGENT_ID]").then(task => console.log(task ? JSON.stringify(task, null, 2) : "No active task"));'

**TASK MANAGEMENT:**
   # Check task status before claiming
   timeout 10s node -e 'const _TaskManager = require("/Users/jeremyparker/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { const task = data.tasks.find(t => t.id === "TASK_ID"); console.log("Task status:", { id: task?.id, assigned_agent: task?.assigned_agent, claimed_by: task?.claimed_by, status: task?.status }); });'

   # Claim specific task (only if unclaimed)
   timeout 10s node -e 'const _TaskManager = require("/Users/jeremyparker/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.claimTask("TASK_ID", "[AGENT_ID]", "normal").then(result => console.log(JSON.stringify(result, null, 2)));'

   # Mark task completed (AFTER validation)
   timeout 10s node -e 'const _TaskManager = require("/Users/jeremyparker/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTask("[AGENT_ID]").then(async task => { if(task) { await tm.updateTaskStatus(task.id, "completed", "Task completed successfully"); console.log("✅ Task completed:", task.title); } });'

**VALIDATION PROTOCOL:**
❌ NEVER mark complete without validation → ✅ Always run \`npm run lint\`, \`npm run typecheck\`
If validation fails → Create linter-error task IMMEDIATELY, fix before completion

**GIT WORKFLOW (AFTER TASK COMPLETION):**
   git add -A
   git commit -m "feat: [description]

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   git push

📊 **PROJECT STATUS:** ${taskStatus.pending} pending, ${taskStatus.in_progress} in progress, ${taskStatus.completed} completed
🔗 **FEATURE SYSTEM:** Complete features in numerical order (Feature 1 → 2 → 3...), subtasks sequentially within features
⏰ **AUTOMATIC CLEANUP:** Stale tasks (>30 min) reset to pending on every stop hook call, stale agents removed automatically
🛑 **STOP AUTHORIZATION:** Only via API endpoint - \`tm.authorizeStopHook(agentId, reason)\` for single-use stop permission

⚠️ **BASH ESCAPING:** Use single quotes for node -e commands: \`node -e 'code'\` not \`node -e "code"\`
Avoid ! operator - use \`(variable === undefined || variable === null)\` instead of \`!variable\`

`;
}

// Read input from Claude Code
let inputData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (inputData += chunk));

process.stdin.on('end', async () => {
  const workingDir = findClaudeProjectRoot();
  const logger = new _Logger(workingDir);

  try {
    // Debug logging for input data
    logger.addFlow(`Raw input data: "${inputData}"`);
    logger.addFlow(`Input data length: ${inputData.length}`);

    let _hookInput;
    if (!inputData || inputData.trim() === '') {
      // No input - probably manual execution, simulate Claude Code input
      logger.addFlow('No input detected - running in manual mode');
      _hookInput = {
        session_id: 'manual_test',
        transcript_path: '',
        stop_hook_active: true,
        hook_event_name: 'manual_execution',
      };
    } else {
      _hookInput = JSON.parse(inputData);
    }

    const {
      session_id: _session_id,
      transcript_path: _transcript_path,
      stop_hook_active: _stop_hook_active,
      hook_event_name,
    } = _hookInput;

    // Log input with event details
    logger.logInput(_hookInput);
    logger.addFlow(
      `Received ${hook_event_name || 'unknown'} event from Claude Code`,
    );

    // Check if TODO.json exists in current project
    const todoPath = _path.join(workingDir, 'TODO.json');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- hook script with validated paths from project structure
    if (!_fs.existsSync(todoPath)) {
      logger.addFlow('No TODO.json found - this is not a TaskManager project');
      logger.logExit(2, 'No TODO.json found - continuing infinite mode');
      logger.save();

      // eslint-disable-next-line no-console -- hook script user guidance output
      console.error(`
🚫 NO TASKMANAGER PROJECT DETECTED

This directory does not contain a TODO.json file, which means it's not a TaskManager project.

🔄 INFINITE CONTINUE MODE ACTIVE
The stop hook will continue infinitely to prevent accidental termination.

💡 TO SET UP TASKMANAGER:
If you want to enable task management for this project:
1. Run: timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize [AGENT_ID] --project-root "${workingDir}"
2. This will create TODO.json and reinitialize your agent

⚡ CONTINUING OPERATION...
`);
      // eslint-disable-next-line n/no-process-exit
      process.exit(2); // Never allow stops even without TODO.json
    }

    // CRITICAL: Check for TODO.json corruption before initializing TaskManager
    const _AutoFixer = require('./lib/autoFixer');
    const autoFixer = new _AutoFixer();

    try {
      const corruptionCheck = await autoFixer.autoFix(todoPath);
      if (corruptionCheck.fixed && corruptionCheck.fixesApplied.length > 0) {
        // eslint-disable-next-line no-console -- hook script status logging for user awareness
        console.log(
          `🔧 STOP HOOK: Automatically fixed TODO.json corruption - ${corruptionCheck.fixesApplied.join(', ')}`,
        );
      }
    } catch (corruptionError) {
      // eslint-disable-next-line no-console -- hook script error logging for debugging
      console.error(
        `⚠️ STOP HOOK: Corruption check failed:`,
        corruptionError.message,
      );
    }

    // Initialize TaskManager with explicit project root to check agent status
    // Pass the working directory to ensure security validation uses correct project root
    const taskManager = new _TaskManager(todoPath, {
      projectRoot: workingDir,
      enableAutoFix: true,
      validateOnRead: false,
    });

    // Check if there are any active agents or if agent initialization is needed
    const todoData = await taskManager.readTodo();

    // Debug logging for agent detection
    const allAgents = Object.keys(todoData.agents || {});
    logger.addFlow(`Found ${allAgents.length} total agents in TODO.json`);

    // ========================================================================
    // MULTI-PROJECT STALE AGENT CLEANUP
    // ========================================================================

    // Clean up stale agents across all known projects first
    try {
      const multiProjectResults = await cleanupStaleAgentsAcrossProjects(logger);

      if (multiProjectResults.totalAgentsRemoved > 0) {
        logger.addFlow(
          `✅ Multi-project cleanup: ${multiProjectResults.totalAgentsRemoved} stale agents removed, ${multiProjectResults.totalTasksUnassigned} tasks unassigned across ${multiProjectResults.projectResults.length} projects`,
        );

        // eslint-disable-next-line no-console -- hook script status reporting to user
        console.error(`
🧹 **MULTI-PROJECT STALE AGENT CLEANUP COMPLETED:**
- Projects processed: ${multiProjectResults.projectResults.length}
- Total stale agents removed: ${multiProjectResults.totalAgentsRemoved}
- Total tasks unassigned: ${multiProjectResults.totalTasksUnassigned}
- Errors: ${multiProjectResults.errors.length > 0 ? multiProjectResults.errors.join(', ') : 'None'}
`);
      }

      if (multiProjectResults.errors.length > 0) {
        logger.addFlow(`Multi-project cleanup errors: ${multiProjectResults.errors.join('; ')}`);
      }
    } catch (multiProjectError) {
      logger.addFlow(`Multi-project cleanup failed: ${multiProjectError.message}`);
      // Continue with local cleanup even if multi-project cleanup fails
    }


    // ========================================================================
    // LOCAL PROJECT STALE AGENT CLEANUP (for current project specifically)
    // ========================================================================

    // Clean up stale agents (older than 30 minutes) and identify active ones
    const staleAgentTimeout = 1800000; // 30 minutes
    const activeAgents = [];
    const staleAgents = [];

    for (const agentId of allAgents) {
      // eslint-disable-next-line security/detect-object-injection -- validated agent ID from TODO.json structure
      const agent = todoData.agents[agentId];
      // Handle both lastHeartbeat (camelCase) and last_heartbeat (snake_case) formats
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

    // Remove stale agents from the system AND unassign them from tasks
    let agentsRemoved = 0;
    let tasksUnassigned = 0;

    for (const staleAgentId of staleAgents) {
      // eslint-disable-next-line security/detect-object-injection -- validated stale agent ID for cleanup
      delete todoData.agents[staleAgentId];
      agentsRemoved++;
      logger.addFlow(`Removed stale agent: ${staleAgentId}`);

      // Find all tasks assigned to this stale agent and unassign them
      for (const task of todoData.tasks) {
        // Skip null/undefined tasks
        if (!task || typeof task !== 'object') {
          continue;
        }

        if (
          task.assigned_agent === staleAgentId ||
          task.claimed_by === staleAgentId
        ) {
          // Unassign the stale agent from the task
          task.assigned_agent = null;
          task.claimed_by = null;

          // Reset task to pending if it was in_progress
          if (task.status === 'in_progress') {
            task.status = 'pending';
            task.started_at = null;
          }

          // Add assignment history entry
          if (!task.agent_assignment_history) {
            task.agent_assignment_history = [];
          }
          task.agent_assignment_history.push({
            agent: staleAgentId,
            action: 'auto_unassign_stale',
            timestamp: new Date().toISOString(),
            reason: 'Agent became stale (inactive >30 minutes)',
          });

          tasksUnassigned++;
          logger.addFlow(
            `Unassigned task "${task.title}" from stale agent: ${staleAgentId}`,
          );
        }
      }
    }

    // Check for stale in-progress tasks (stuck for > 30 minutes) and reset them
    const staleTaskTimeout = 1800000; // 30 minutes
    let staleTasksReset = 0;

    for (const task of todoData.tasks) {
      // Skip null/undefined tasks
      if (!task || typeof task !== 'object') {
        continue;
      }

      if (task.status === 'in_progress' && task.started_at) {
        const taskStartTime = new Date(task.started_at).getTime();
        const timeSinceStart = Date.now() - taskStartTime;

        if (timeSinceStart > staleTaskTimeout) {
          // Reset stale task back to pending
          task.status = 'pending';
          task.assigned_agent = null;
          task.claimed_by = null;
          task.started_at = null;

          // Add reset history entry
          if (!task.agent_assignment_history) {
            task.agent_assignment_history = [];
          }
          task.agent_assignment_history.push({
            agent: task.assigned_agent || 'system',
            action: 'auto_reset_stale',
            timestamp: new Date().toISOString(),
            reason: `Task stale for ${Math.round(timeSinceStart / 60000)} minutes`,
          });

          staleTasksReset++;
          logger.addFlow(
            `Reset stale task: ${task.title} (${Math.round(timeSinceStart / 60000)} min)`,
          );
        }
      }
    }

    // Save changes if any stale agents were removed or tasks were reset
    if (agentsRemoved > 0 || staleTasksReset > 0 || tasksUnassigned > 0) {
      await taskManager.writeTodo(todoData);
      if (agentsRemoved > 0) {
        logger.addFlow(`Removed ${agentsRemoved} stale agents from TODO.json`);
      }
      if (tasksUnassigned > 0) {
        logger.addFlow(`Unassigned ${tasksUnassigned} tasks from stale agents`);
      }
      if (staleTasksReset > 0) {
        logger.addFlow(`Reset ${staleTasksReset} stale tasks back to pending`);
      }
    }

    // ========================================================================
    // AUTOMATIC TASK SORTING: RECLASSIFY TEST ERRORS AND SORT BY PRIORITY
    // ========================================================================

    try {
      logger.addFlow(
        'Running automatic task sorting and test error reclassification',
      );
      const sortResult = await autoSortTasksByPriority(taskManager);

      if (sortResult.error) {
        logger.addFlow(`Task sorting failed: ${sortResult.error}`);
      } else if (sortResult.tasksMoved > 0) {
        logger.addFlow(
          `Successfully reclassified ${sortResult.tasksMoved} test errors from error section to testing section`,
        );

        // eslint-disable-next-line no-console -- hook script status reporting to user
        console.error(`
✅ AUTOMATIC TASK SORTING COMPLETED

📊 Task Classification Results:
- Total tasks processed: ${sortResult.totalTasks}
- Test errors moved to testing section: ${sortResult.tasksMoved}
- Tasks updated: ${sortResult.tasksUpdated}

🔄 All tasks have been sorted according to ID-based classification system:
1. ERROR TASKS (error_*): Build-blocking errors, linter violations, critical bugs
2. FEATURE TASKS (feature_*): New functionality, enhancements, refactoring  
3. SUBTASK TASKS (subtask_*): Implementation of specific feature subtasks
4. TEST TASKS (test_*): Test coverage, test creation, test performance

This ensures proper priority ordering with test tasks only executed after all errors, features, and subtasks are complete.
        `);
      } else {
        logger.addFlow('Task sorting completed - no reclassification needed');
      }
    } catch (sortingError) {
      logger.addFlow(
        `Task sorting encountered an error: ${sortingError.message}`,
      );
      // eslint-disable-next-line no-console -- hook script warning output for user awareness
      console.error(`
⚠️ AUTOMATIC TASK SORTING WARNING

Task sorting encountered an issue: ${sortingError.message}

This is non-critical and won't prevent continued operation.
Tasks will continue to work but may not be optimally sorted.
      `);
    }

    logger.addFlow(
      `Active agents found: ${activeAgents.length}, Stale agents removed: ${agentsRemoved}, Tasks unassigned: ${tasksUnassigned}, Stale tasks reset: ${staleTasksReset}`,
    );

    // Enhanced agent status analysis for better messaging
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

        // eslint-disable-next-line no-console -- hook script status and guidance output
        console.error(`
🔄 STALE AGENTS DETECTED AND CLEANED UP

Working Directory: ${workingDir}
TODO.json Path: ${todoPath}
Total Agents Found: ${totalAgentsBeforeCleanup}
Active Agents Found: ${activeAgents.length}
Stale Agents Removed: ${agentsRemoved}
Stale Tasks Reset: ${staleTasksReset}

✅ **AUTOMATIC CLEANUP COMPLETED:**
- Removed ${agentsRemoved} stale agents (inactive >30 minutes)
- Unassigned ${tasksUnassigned} tasks from stale agents
- Reset ${staleTasksReset} stuck tasks back to pending status
- Project is now ready for fresh agent initialization

🚨 **CLAUDE CODE AGENT - STALE AGENT RECOVERY:**
**ULTRATHINK - PREVIOUS AGENTS HAVE EXPIRED - INITIALIZE NEW AGENT**
**ULTRATHINK - CONTINUE ANY UNFINISHED WORK FROM PREVIOUS SESSIONS**
**ULTRATHINK - CHECK FOR PENDING TASKS THAT NEED COMPLETION**
**ULTRATHINK - DEPLOY MAXIMUM CONCURRENT SUBAGENTS FOR PARALLELIZABLE WORK**
**ULTRATHINK - USE UP TO 10 SIMULTANEOUS SUBAGENTS FOR COMPLEX TASKS**
**ULTRATHINK - ADD COMPREHENSIVE COMMENTS TO ALL SCRIPT FILES**
**ULTRATHINK - 🚨 SCOPE CONTROL: NEVER CREATE FEATURE TASKS WITHOUT EXPLICIT USER REQUEST**
**ULTRATHINK - 🚨 FEATURE IDEAS: WRITE SUGGESTIONS IN development/essentials/features.md ONLY**
**ULTRATHINK - 🚨 NO UNAUTHORIZED FEATURES: Wait for user approval before creating any feature tasks**

🔄 **AGENT RECOVERY WORKFLOW:**
This project had ${totalAgentsBeforeCleanup} agent(s) that became stale due to inactivity.
The system has automatically cleaned them up and is ready for a fresh start.

💡 **RECOVERY ACTIONS TAKEN:**
- ✅ Removed expired agent sessions from registry
- ✅ Released any stuck in-progress tasks back to pending
- ✅ Preserved all task history and progress
- ✅ Project is ready for immediate agent initialization

⚡ **CONTINUE PREVIOUS WORK:**
Your previous agents may have been working on important tasks.
Initialize a new agent and continue where they left off.

🔄 INFINITE CONTINUE MODE ACTIVE

💡 **AGENT REINITIALIZATION FOR STALE PROJECT RECOVERY:**
To recover and continue work from the previous stale agents:

1. **Reinitialize your recovery agent:**
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize [AGENT_ID] --project-root "${workingDir}"

2. **Check for unfinished tasks from previous agents:**
   node -e 'const _TaskManager = require("/Users/jeremyparker/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { const pending = data.tasks.filter(t => t.status === "pending"); console.log("Pending tasks to continue:", pending.map(t => ({id: t.id, title: t.title, category: t.category}))); });'

3. **Continue the most important unfinished work first**

⚡ CONTINUING OPERATION - RECOVER AND CONTINUE PREVIOUS WORK...
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

        // eslint-disable-next-line no-console -- hook script guidance output for project setup
        console.error(`
🤖 NO AGENTS DETECTED - FRESH PROJECT SETUP

Working Directory: ${workingDir}
TODO.json Path: ${todoPath}
Total Agents Found: ${allAgents.length}
Active Agents Found: ${activeAgents.length}
Stale Agents Removed: ${agentsRemoved}
Stale Tasks Reset: ${staleTasksReset}

TaskManager project exists but no agents have been registered yet.

🚨 **CLAUDE CODE AGENT - CRITICAL INSTRUCTION:**
**ULTRATHINK - IF YOU WERE WORKING ON SOMETHING BEFORE THIS MESSAGE:**
**ULTRATHINK - CONTINUE YOUR WORK - DO NOT ABANDON UNFINISHED TASKS**
**ULTRATHINK - ALWAYS USE REINITIALIZE COMMAND - WORKS FOR ALL SCENARIOS**
**ULTRATHINK - REINITIALIZE HANDLES BOTH FRESH AND EXISTING AGENTS AUTOMATICALLY**
**ULTRATHINK - DEPLOY MAXIMUM CONCURRENT SUBAGENTS FOR ANY PARALLELIZABLE WORK**
**ULTRATHINK - USE UP TO 10 SIMULTANEOUS SUBAGENTS FOR COMPLEX MULTI-COMPONENT TASKS**
**ULTRATHINK - ADD COMPREHENSIVE COMMENTS TO ALL SCRIPT FILES FOR FUTURE DEVELOPERS**
**ULTRATHINK - 🚨 SCOPE CONTROL: NEVER CREATE FEATURE TASKS WITHOUT EXPLICIT USER REQUEST**
**ULTRATHINK - 🚨 FEATURE IDEAS: WRITE SUGGESTIONS IN development/essentials/features.md ONLY**
**ULTRATHINK - 🚨 NO UNAUTHORIZED FEATURES: Wait for user approval before creating any feature tasks**

💡 **FRESH PROJECT AGENT SETUP:**
To start working with this TaskManager project:

1. **Reinitialize agent for fresh start:**
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize [AGENT_ID] --project-root "${workingDir}"

2. **Check for any existing tasks to work on:**
   node -e 'const _TaskManager = require("/Users/jeremyparker/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { const pending = data.tasks.filter(t => t.status === "pending"); console.log("Available tasks:", pending.map(t => ({id: t.id, title: t.title, category: t.category}))); });'

3. **Begin working on the highest priority tasks**

⚡ CONTINUING OPERATION - START FRESH AGENT WORK...
`);
        // eslint-disable-next-line n/no-process-exit
        process.exit(2);
      }
    }

    // ========================================================================
    // NEVER-STOP PROTOCOL: CHECK ENDPOINT STOP TRIGGER
    // ========================================================================

    const stopAllowed = checkStopAllowed(workingDir);
    if (stopAllowed) {
      logger.addFlow(
        'Stop endpoint triggered - allowing ONE stop, then returning to infinite mode',
      );
      logger.logExit(0, 'Endpoint-triggered stop (single use)');
      logger.save();

      // eslint-disable-next-line no-console -- hook script stop authorization message
      console.error(`
🛑 ENDPOINT-TRIGGERED STOP AUTHORIZED

A stop request was authorized via the stop endpoint.
This is a single-use authorization.

✅ Allowing stop now...
⚡ Future stop hook triggers will return to infinite continue mode.

To trigger another stop, use the TaskManager API:
node -e "const _TaskManager = require('/Users/jeremyparker/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.authorizeStopHook('agent_id', 'Reason for stopping').then(result => console.log(JSON.stringify(result, null, 2)));"
`);
      // eslint-disable-next-line n/no-process-exit
      process.exit(0); // Allow stop only when endpoint triggered
    }

    // ========================================================================
    // INFINITE CONTINUE MODE: NEVER ALLOW NATURAL STOPS
    // ========================================================================

    // Check task status to provide appropriate instructions (taskManager already initialized above)
    let _taskStatus;
    try {
      taskStatus = await taskManager.getTaskStatus();
    } catch (error) {
      // Handle corrupted TODO.json by using autoFixer
      logger.addFlow(
        `Task status failed, attempting auto-fix: ${error.message}`,
      );
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

    // Provide detailed instructive guidance based on current state
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

        // eslint-disable-next-line no-console -- hook script archival status reporting
        console.error(`
✅ AUTOMATIC TASK ARCHIVAL COMPLETED

📁 Archived ${archivalResult.migrated} completed tasks to DONE.json
📊 Total found: ${archivalResult.total || 'N/A'}
📋 Skipped: ${archivalResult.skipped || 0}

This keeps TODO.json clean and prevents it from becoming crowded with completed work.
        `);
      } else {
        logger.addFlow('No completed tasks found to archive');
      }
    } catch (archivalError) {
      logger.addFlow(`Task archival failed: ${archivalError.message}`);
      // eslint-disable-next-line no-console -- hook script archival warning output
      console.error(`
⚠️ AUTOMATIC TASK ARCHIVAL WARNING

Task archival encountered an issue: ${archivalError.message}

This is non-critical and won't prevent continued operation.
      `);
    }

    // Always continue - never allow natural stops
    logger.addFlow(
      'Never-stop mode: Providing instructive task management guidance',
    );
    logger.logExit(2, 'Infinite continue mode - providing task guidance');
    logger.save();

    // Output detailed instructions to Claude
    // eslint-disable-next-line no-console -- hook script core guidance output to Claude agent
    console.error(`
🔄 INFINITE CONTINUE MODE ACTIVE

🚨 **CLAUDE CODE AGENT - PROFESSIONAL DEVELOPER PROTOCOL:**
**ULTRATHINK - MANDATORY REQUIREMENTS:**
• **READ development/essentials/ FILES FIRST** - Every task/session start
• **REINITIALIZE/INIT AGENT** - Continue existing work or start fresh
• **COMPLETE UNFINISHED TASKS** - Never abandon work, finish what you start
• **DEPLOY CONCURRENT SUBAGENTS** - Use up to 10 for complex tasks
• **COMPREHENSIVE LOGGING** - Document all functions and decisions
• **SCOPE CONTROL** - Only create features when user explicitly requests
• **LINTER VIGILANCE** - Fix all errors immediately, create error tasks for failures

${instructiveGuidance}

🚫 STOP NOT ALLOWED
This system operates in infinite continue mode. To authorize a stop, use:

🛑 AUTHORIZE STOP WITH TASKMANAGER API:
   timeout 10s node -e 'const _TaskManager = require("/Users/jeremyparker/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.authorizeStopHook("agent_id", "Reason for stopping").then(result => console.log(JSON.stringify(result, null, 2)));'

⚡ CONTINUING OPERATION...
`);

    // eslint-disable-next-line n/no-process-exit
    process.exit(2); // Always continue - never allow natural stops
  } catch (error) {
    logger.logError(error, 'stop-hook-main');
    logger.logExit(
      2,
      `Error handled - continuing infinite mode: ${error.message}`,
    );
    logger.save();

    // eslint-disable-next-line no-console -- hook script error handling with user guidance
    console.error(`
⚠️ STOP HOOK ERROR - CONTINUING ANYWAY

Error encountered: ${error.message}

🔄 INFINITE CONTINUE MODE MAINTAINED
Even with errors, the system continues to prevent accidental termination.

💡 CHECK YOUR TASKMANAGER SETUP:
- Ensure TODO.json is properly formatted
- Verify TaskManager library is accessible
- Check file permissions

⚡ CONTINUING OPERATION...
`);
    // eslint-disable-next-line n/no-process-exit
    process.exit(2); // Even on error, continue infinite mode
  }
});
