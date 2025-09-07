const fs = require("fs");
const path = require("path");
const TaskManager = require("./lib/taskManager");
const Logger = require("./lib/logger");

// ============================================================================
// NEVER-STOP INFINITE CONTINUE HOOK WITH INSTRUCTIVE TASK MANAGEMENT
// ============================================================================

/**
 * Find the root "Claude Coding Projects" directory containing TODO.json
 */
function findClaudeProjectRoot(startDir = process.cwd()) {
  let currentDir = startDir;

  // Look for "Claude Coding Projects" in the path and check for TODO.json
  while (currentDir !== path.dirname(currentDir)) {
    // Not at filesystem root
    // Check if we're in or found "Claude Coding Projects"
    if (currentDir.includes("Claude Coding Projects")) {
      // Look for TODO.json in potential project roots
      const segments = currentDir.split(path.sep);
      const claudeIndex = segments.findIndex((segment) =>
        segment.includes("Claude Coding Projects"),
      );

      if (claudeIndex !== -1 && claudeIndex < segments.length - 1) {
        // Try the next directory after "Claude Coding Projects"
        const projectDir = segments.slice(0, claudeIndex + 2).join(path.sep);
        if (fs.existsSync(path.join(projectDir, "TODO.json"))) {
          return projectDir;
        }
      }

      // Also check current directory
      if (fs.existsSync(path.join(currentDir, "TODO.json"))) {
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
function checkStopAllowed(workingDir = process.cwd()) {
  const stopFlagPath = path.join(workingDir, ".stop-allowed");

  if (fs.existsSync(stopFlagPath)) {
    // Read and immediately delete the flag (single-use)
    try {
      const flagData = JSON.parse(fs.readFileSync(stopFlagPath, "utf8"));
      fs.unlinkSync(stopFlagPath); // Remove flag after reading
      return flagData.stop_allowed === true;
    } catch {
      // Invalid flag file, remove it
      fs.unlinkSync(stopFlagPath);
      return false;
    }
  }

  return false; // Default: never allow stops
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
      const parts = taskId.split("_");
      return parts[0] || "unknown";
    };

    const determineCorrectPrefix = (task) => {
      const title = (task.title || "").toLowerCase();
      const description = (task.description || "").toLowerCase();
      const category = (task.category || "").toLowerCase();
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
        ["linter-error", "build-error", "start-error", "error", "bug"].includes(
          category,
        );

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
          return "test";
        }
        return "error";
      }

      // TEST detection
      const testPatterns = [
        /test|testing|spec|coverage|jest|mocha|cypress|e2e|unit.*test|integration.*test/i,
        /\.test\.|\.spec\.|__tests__|test.*suite/i,
      ];

      const isTest =
        testPatterns.some((pattern) => pattern.test(allText)) ||
        category.startsWith("test-") ||
        ["missing-test", "test-setup", "test-refactor", "testing"].includes(
          category,
        );

      if (isTest) {
        return "test";
      }

      // Check if implementing a feature subtask
      if (
        task.feature_id ||
        task.implementing_feature ||
        task.parent_feature_id
      ) {
        return "subtask";
      }

      // Default to feature
      return "feature";
    };

    // ID-based priority system
    const getTaskPriority = (task) => {
      const id = task.id || "";

      if (id.startsWith("error_")) {
        return 1;
      } // ERROR tasks - highest priority
      if (id.startsWith("feature_")) {
        return 2;
      } // FEATURE tasks - high priority
      if (id.startsWith("subtask_")) {
        return 3;
      } // SUBTASK tasks - medium priority
      if (id.startsWith("test_")) {
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
      let updated = false;
      const currentId = task.id || "";

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
      primary: "id_prefix",
      secondary: "created_at",
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
    console.error("Error in autoSortTasksByPriority:", error);
    return { error: error.message, tasksMoved: 0, tasksUpdated: 0 };
  }
}

/**
 * Provides standardized TaskManager API guidance for all scenarios
 */
async function provideInstructiveTaskGuidance(taskManager, taskStatus) {
  return `
📋 CLAUDE CODE AGENT TASK CONTINUATION PROTOCOL

🚨 **CRITICAL AGENT PROTOCOL:**
**ULTRATHINK - MANDATORY SEQUENCE:**
1. **GET TASKMANAGER API GUIDE FIRST** - Always run: timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" guide
2. **READ/REVIEW development/essentials/** directory - MANDATORY EVERY TIME
3. **REINITIALIZE AGENT** to prevent expiration using commands below
4. **CHECK CURRENT TASK** status - continue unfinished work first
5. **DEPLOY CONCURRENT SUBAGENTS** - use up to 10 for complex multi-component tasks
6. **VERIFY TASK CLAIMS** - never claim tasks already assigned to other agents
7. **FEATURES COMPLIANCE** - only implement "approved" features in TODO.json
8. **MAXIMUM LOGGING & DOCUMENTATION** - add the most comprehensive logging possible to all code

**ABSOLUTE PROHIBITIONS:**
❌ Don't claim tasks with assigned_agent/claimed_by fields set
❌ Don't start work without reading development/essentials/ files first
❌ Don't implement features not approved in TODO.json features array
❌ Don't skip development/essentials/ review - mandatory every task/continue
❌ Don't ignore post-tool linter errors - actively scan and fix immediately
❌ Don't skip TaskManager API guide on startup - always get it first
❌ Don't leave root folder cluttered - organize into development/ subdirectories

🔄 **CONTEXT-AWARE CONTINUATION:**

**TASK STATE IDENTIFICATION:**
- **0-25% complete** → Review requirements, read research reports, begin methodically
- **25-50% complete** → Continue implementation, maintain context, don't restart
- **50-75% complete** → Focus on core functionality, preserve existing work
- **75-95% complete** → Finish implementation, run validation, fix issues
- **95%+ complete** → Run all checks (lint, typecheck, tests), verify requirements
- **Failed Validation** → Analyze failures, fix specific issues, re-run until passing

**CONTEXT PRESERVATION ESSENTIALS:**
- **NEVER restart from scratch** - build upon existing progress
- **READ previous agent notes** and task history before continuing
- **MAINTAIN established implementation approach** and architectural decisions
- **PRESERVE variable names, file structures, and code patterns**
- **REVIEW task important_files** for context and requirements
- **BACKUP current state** before making changes: \`git stash && git status\`

**IMPLEMENTATION CONTINUATION STRATEGIES:**
- **For Code Changes:** Use git diff to see what was modified, continue from that point
- **For New Features:** Check partially written functions, complete missing functionality
- **For Bug Fixes:** Review error logs, continue debugging from last known state
- **For Refactoring:** Understand scope of changes, complete transformation consistently
- **For Testing:** Run existing tests first, then add missing test coverage

**BEFORE RESUMING - MANDATORY CONTEXT GATHERING:**
1. **Read task description and requirements** - understand the full scope
2. **Review agent_assignment_history** - see what previous agents attempted
3. **Check important_files list** - read all referenced documentation
4. **Examine existing code changes** - understand current implementation state
5. **Review status_history** - identify previous blockers or issues

**WORK PRESERVATION PRINCIPLES:**
- **Partial implementations have value** → Build upon them rather than restarting
- **Failed attempts contain lessons** → Learn from previous errors, don't repeat
- **Context switching is expensive** → Maintain momentum when resuming work
- **Architecture decisions persist** → Follow established patterns and structures

🎯 **ESSENTIAL COMMANDS:**

**CRITICAL**: Replace [PROJECT_DIRECTORY] with actual project path and [AGENT_ID] with your agent ID.

**🚨 BASH ESCAPING RULE: ALWAYS USE SINGLE QUOTES FOR NODE -E COMMANDS**
- ✅ CORRECT: \`node -e 'JavaScript code'\`
- ❌ BROKEN: \`node -e "JavaScript with special chars"\`

**CORE WORKFLOW:**
   # STEP 1: Initialize/Reinitialize agent
   timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" init --project-root "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook"
   timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" reinitialize [AGENT_ID]

   # STEP 2: Read development/essentials/ files
   ls development/essentials/ 2>/dev/null && find development/essentials/ -type f -name "*.md" -exec echo "=== {} ===" \\; -exec cat {} \\;

   # STEP 3: Check current task status
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTask("[AGENT_ID]").then(task => console.log(task ? JSON.stringify(task, null, 2) : "No active task"));'

**TASK MANAGEMENT:**
   # Check if task already claimed (MANDATORY before claiming)
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { const task = data.tasks.find(t => t.id === "TASK_ID"); console.log("Task status:", { id: task?.id, assigned_agent: task?.assigned_agent, claimed_by: task?.claimed_by, status: task?.status }); });'

   # Claim specific task (only if unclaimed)
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.claimTask("TASK_ID", "[AGENT_ID]", "normal").then(result => console.log(JSON.stringify(result, null, 2)));'

   # Mark task completed (AFTER linter validation)
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTask("[AGENT_ID]").then(async task => { if(task) { await tm.updateTaskStatus(task.id, "completed", "Task completed successfully"); console.log("✅ Task completed:", task.title); } });'

**ESSENTIAL TASKMANAGER API COMMANDS:**
   # Get comprehensive guide with ALL examples, workflows, and task creation patterns
   timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" guide
   
   # Quick start workflow  
   timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" init
   timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" status

**🔴 CRITICAL: task_type PARAMETER REQUIRED**
ALL task creation commands MUST include explicit task_type parameter: "error" | "feature" | "subtask" | "test"
Tasks without task_type will be REJECTED by the API.

**🚨 ZERO TOLERANCE FOR SHORTCUTS OR MASKING**
Fix problems directly - never hide, mask, cover up, or use workarounds.
Honest failure is better than fake solutions.

**📋 COMPREHENSIVE API GUIDE AVAILABLE:**
Use: timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" guide
This provides complete information about task classification, workflows, and all API capabilities.

**GIT WORKFLOW (MANDATORY AFTER TASK COMPLETION):**
   git add -A
   git commit -m "feat: [description]

   - [changes made]
   - [accomplishments]

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   git push

**📋 COMPREHENSIVE API REFERENCE:**
All advanced commands, examples, workflows, and patterns are available in the comprehensive guide:
   timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" guide

**CONTINUE COMMAND PROTOCOL:**
   # When user says "continue" - check current task first
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/TODO.json"); tm.getCurrentTask("[YOUR_AGENT_ID]").then(task => console.log(task ? JSON.stringify(task, null, 2) : "No active task"));'

🔍 **VALIDATION PROTOCOL:**

**LINTER CHECKS (MANDATORY BEFORE TASK COMPLETION):**
❌ NEVER mark task complete without running linter checks first
✅ ALWAYS run: \`npm run lint\`, \`npm run typecheck\`, etc.
✅ ALWAYS fix all errors before completion
✅ ALWAYS provide validation evidence

**LINTER FAILURE PROTOCOL:**
- If linting fails → Create linter-error task IMMEDIATELY
- If type errors found → Create error task IMMEDIATELY  
- DO NOT mark original task complete until ALL validation passes

**VALIDATION STATE DETECTION:**
- **Never attempted** → Run full validation suite (lint, typecheck, tests, build)
- **Partially run** → Continue from last successful check, fix remaining issues
- **Failed previously** → Focus on specific failing checks, don't re-run passing ones
- **Intermittent failures** → Identify flaky tests or environment issues

**VALIDATION COMMANDS:**
   # Check what validation was previously attempted
   git log --oneline -10  # See recent commits and validation attempts
   npm run lint 2>&1 | tee lint-output.log
   npx tsc --noEmit 2>&1 | tee typecheck-output.log
   npm test -- --verbose 2>&1 | tee test-output.log

**FOCUSED VALIDATION FIXES:**
- **Lint errors only** → Fix style/syntax issues, preserve functionality
- **Type errors only** → Add type annotations, fix type mismatches
- **Test failures only** → Fix broken tests, update test expectations
- **Build errors only** → Resolve import/export issues, fix build configuration

📋 **MANDATORY REQUIREMENTS:**
• **RESEARCH REPORTS**: Scan development/reports/ and development/research-reports/ before starting tasks
• **DEVELOPMENT ESSENTIALS**: Read/review ALL development/essentials/ files before any work
• **FEATURES MANAGEMENT**: Only implement "approved" status features in TODO.json
• **TASK CLAIMING**: Always verify tasks not claimed by other agents before claiming
• **MULTI-AGENT COORDINATION**: Respect agent assignment system, never force-claim tasks

📝 **DOCUMENTATION STANDARDS:**
- **ALL SCRIPT FILES** must have thorough comments and documentation
- **FUNCTION DOCS** with purpose, parameters, return values explained
- **UPDATE DOCS** when adding/modifying features - part of completion requirement
- **MAINTAIN ACCURACY** - keep comments current with code changes

📊 **CURRENT PROJECT STATUS:** ${taskStatus.pending} pending, ${taskStatus.in_progress} in progress, ${taskStatus.completed} completed

🔗 **FEATURE SYSTEM:** Complete features in numerical order (Feature 1 → 2 → 3...), subtasks sequentially within features

⏰ **AUTOMATIC CLEANUP:** Stale tasks (>15 min) reset to pending, stale agents removed automatically

🛑 **STOP AUTHORIZATION:** Only via API endpoint - \`tm.authorizeStopHook(agentId, reason)\` for single-use stop permission

⚠️ **TROUBLESHOOTING BASH ERRORS:**
If you get "SyntaxError: missing ) after argument list" with !== or !=:
   # ❌ BROKEN: bash escapes the ! character
   node -e "script with !== operator"
   
   # ✅ FIXED: Use single quotes 
   node -e 'script with !== operator'
   
   # ✅ ALTERNATIVE: Avoid ! operator entirely
   # Instead of: !variable
   # Use: (variable === undefined || variable === null)
   
   # ✅ ALTERNATIVE: Create temp script file
   echo 'script here' > temp.js && node temp.js && rm temp.js

🚨 **SPECIAL CASE - NEGATION OPERATOR (!)**:
The bash exclamation mark (!) is used for history expansion, causing syntax errors:
   # ❌ BROKEN: !t.assigned_agent (bash interprets !)
   # ✅ SAFE: (t.assigned_agent === undefined || t.assigned_agent === null)
   # ✅ SAFE: t.assigned_agent == null (coerces undefined and null)

`;
}

// Read input from Claude Code
let inputData = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (inputData += chunk));

process.stdin.on("end", async () => {
  const workingDir = findClaudeProjectRoot();
  const logger = new Logger(workingDir);

  try {
    // Debug logging for input data
    logger.addFlow(`Raw input data: "${inputData}"`);
    logger.addFlow(`Input data length: ${inputData.length}`);

    let hookInput;
    if (!inputData || inputData.trim() === "") {
      // No input - probably manual execution, simulate Claude Code input
      logger.addFlow("No input detected - running in manual mode");
      hookInput = {
        session_id: "manual_test",
        transcript_path: "",
        stop_hook_active: true,
        hook_event_name: "manual_execution",
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
      `Received ${hook_event_name || "unknown"} event from Claude Code`,
    );

    // Check if TODO.json exists in current project
    const todoPath = path.join(workingDir, "TODO.json");
    if (!fs.existsSync(todoPath)) {
      logger.addFlow("No TODO.json found - this is not a TaskManager project");
      logger.logExit(2, "No TODO.json found - continuing infinite mode");
      logger.save();

      console.error(`
🚫 NO TASKMANAGER PROJECT DETECTED

This directory does not contain a TODO.json file, which means it's not a TaskManager project.

🔄 INFINITE CONTINUE MODE ACTIVE
The stop hook will continue infinitely to prevent accidental termination.

💡 TO SET UP TASKMANAGER:
If you want to enable task management for this project:
1. Run: node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project "${workingDir}"
2. This will create TODO.json and initialize your agent

⚡ CONTINUING OPERATION...
`);
      process.exit(2); // Never allow stops even without TODO.json
    }

    // CRITICAL: Check for TODO.json corruption before initializing TaskManager
    const AutoFixer = require("./lib/autoFixer");
    const autoFixer = new AutoFixer();

    try {
      const corruptionCheck = await autoFixer.autoFix(todoPath);
      if (corruptionCheck.fixed && corruptionCheck.fixesApplied.length > 0) {
        console.log(
          `🔧 STOP HOOK: Automatically fixed TODO.json corruption - ${corruptionCheck.fixesApplied.join(", ")}`,
        );
      }
    } catch (corruptionError) {
      console.error(
        `⚠️ STOP HOOK: Corruption check failed:`,
        corruptionError.message,
      );
    }

    // Initialize TaskManager to check agent status
    const taskManager = new TaskManager(todoPath);

    // Check if there are any active agents or if agent initialization is needed
    const todoData = await taskManager.readTodo();

    // Debug logging for agent detection
    const allAgents = Object.keys(todoData.agents || {});
    logger.addFlow(`Found ${allAgents.length} total agents in TODO.json`);

    // Clean up stale agents (older than 15 minutes) and identify active ones
    const staleAgentTimeout = 900000; // 15 minutes
    const activeAgents = [];
    const staleAgents = [];

    for (const agentId of allAgents) {
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
      delete todoData.agents[staleAgentId];
      agentsRemoved++;
      logger.addFlow(`Removed stale agent: ${staleAgentId}`);

      // Find all tasks assigned to this stale agent and unassign them
      for (const task of todoData.tasks) {
        if (
          task.assigned_agent === staleAgentId ||
          task.claimed_by === staleAgentId
        ) {
          // Unassign the stale agent from the task
          task.assigned_agent = null;
          task.claimed_by = null;

          // Reset task to pending if it was in_progress
          if (task.status === "in_progress") {
            task.status = "pending";
            task.started_at = null;
          }

          // Add assignment history entry
          if (!task.agent_assignment_history) {
            task.agent_assignment_history = [];
          }
          task.agent_assignment_history.push({
            agent: staleAgentId,
            action: "auto_unassign_stale",
            timestamp: new Date().toISOString(),
            reason: "Agent became stale (inactive >15 minutes)",
          });

          tasksUnassigned++;
          logger.addFlow(
            `Unassigned task "${task.title}" from stale agent: ${staleAgentId}`,
          );
        }
      }
    }

    // Check for stale in-progress tasks (stuck for > 15 minutes) and reset them
    const staleTaskTimeout = 900000; // 15 minutes
    let staleTasksReset = 0;

    for (const task of todoData.tasks) {
      if (task.status === "in_progress" && task.started_at) {
        const taskStartTime = new Date(task.started_at).getTime();
        const timeSinceStart = Date.now() - taskStartTime;

        if (timeSinceStart > staleTaskTimeout) {
          // Reset stale task back to pending
          task.status = "pending";
          task.assigned_agent = null;
          task.claimed_by = null;
          task.started_at = null;

          // Add reset history entry
          if (!task.agent_assignment_history) {
            task.agent_assignment_history = [];
          }
          task.agent_assignment_history.push({
            agent: task.assigned_agent || "system",
            action: "auto_reset_stale",
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
        "Running automatic task sorting and test error reclassification",
      );
      const sortResult = await autoSortTasksByPriority(taskManager);

      if (sortResult.error) {
        logger.addFlow(`Task sorting failed: ${sortResult.error}`);
      } else if (sortResult.tasksMoved > 0) {
        logger.addFlow(
          `Successfully reclassified ${sortResult.tasksMoved} test errors from error section to testing section`,
        );

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
        logger.addFlow("Task sorting completed - no reclassification needed");
      }
    } catch (sortingError) {
      logger.addFlow(
        `Task sorting encountered an error: ${sortingError.message}`,
      );
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
        "No active agents detected - analyzing situation for appropriate guidance",
      );

      // Differentiate between "no agents ever" vs "only stale agents were found"
      if (hadStaleAgents && totalAgentsBeforeCleanup > 0) {
        logger.addFlow(
          `Found ${totalAgentsBeforeCleanup} stale agents - providing reactivation guidance`,
        );
        logger.logExit(
          2,
          "Only stale agents found - providing reactivation guidance",
        );
        logger.save();

        console.error(`
🔄 STALE AGENTS DETECTED AND CLEANED UP

Working Directory: ${workingDir}
TODO.json Path: ${todoPath}
Total Agents Found: ${totalAgentsBeforeCleanup}
Active Agents Found: ${activeAgents.length}
Stale Agents Removed: ${agentsRemoved}
Stale Tasks Reset: ${staleTasksReset}

✅ **AUTOMATIC CLEANUP COMPLETED:**
- Removed ${agentsRemoved} stale agents (inactive >15 minutes)
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

💡 **AGENT INITIALIZATION FOR STALE PROJECT RECOVERY:**
To recover and continue work from the previous stale agents:

1. **Initialize your recovery agent:**
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project "${workingDir}"

2. **Check for unfinished tasks from previous agents:**
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { const pending = data.tasks.filter(t => t.status === "pending"); console.log("Pending tasks to continue:", pending.map(t => ({id: t.id, title: t.title, category: t.category}))); });'

3. **Continue the most important unfinished work first**

⚡ CONTINUING OPERATION - RECOVER AND CONTINUE PREVIOUS WORK...
`);
        process.exit(2);
      } else {
        // Truly no agents case (fresh project or first time)
        logger.addFlow("No agents detected - need fresh agent initialization");
        logger.logExit(
          2,
          "No agents - providing fresh initialization guidance",
        );
        logger.save();

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
**ULTRATHINK - INITIALIZE AGENT AND CONTINUE WHERE YOU LEFT OFF**
**ULTRATHINK - DEPLOY MAXIMUM CONCURRENT SUBAGENTS FOR ANY PARALLELIZABLE WORK**
**ULTRATHINK - USE UP TO 10 SIMULTANEOUS SUBAGENTS FOR COMPLEX MULTI-COMPONENT TASKS**
**ULTRATHINK - ADD COMPREHENSIVE COMMENTS TO ALL SCRIPT FILES FOR FUTURE DEVELOPERS**

💡 **FRESH PROJECT INITIALIZATION:**
To start working with this TaskManager project:

1. **Initialize your first agent:**
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project "${workingDir}"

2. **Check for any existing tasks to work on:**
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { const pending = data.tasks.filter(t => t.status === "pending"); console.log("Available tasks:", pending.map(t => ({id: t.id, title: t.title, category: t.category}))); });'

3. **Begin working on the highest priority tasks**

⚡ CONTINUING OPERATION - START FRESH AGENT WORK...
`);
        process.exit(2);
      }
    }

    // ========================================================================
    // NEVER-STOP PROTOCOL: CHECK ENDPOINT STOP TRIGGER
    // ========================================================================

    const stopAllowed = checkStopAllowed(workingDir);
    if (stopAllowed) {
      logger.addFlow(
        "Stop endpoint triggered - allowing ONE stop, then returning to infinite mode",
      );
      logger.logExit(0, "Endpoint-triggered stop (single use)");
      logger.save();

      console.error(`
🛑 ENDPOINT-TRIGGERED STOP AUTHORIZED

A stop request was authorized via the stop endpoint.
This is a single-use authorization.

✅ Allowing stop now...
⚡ Future stop hook triggers will return to infinite continue mode.

To trigger another stop, use the TaskManager API:
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.authorizeStopHook('agent_id', 'Reason for stopping').then(result => console.log(JSON.stringify(result, null, 2)));"
`);
      process.exit(0); // Allow stop only when endpoint triggered
    }

    // ========================================================================
    // INFINITE CONTINUE MODE: NEVER ALLOW NATURAL STOPS
    // ========================================================================

    // Check task status to provide appropriate instructions (taskManager already initialized above)
    let taskStatus;
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
    const instructiveGuidance = await provideInstructiveTaskGuidance(
      taskManager,
      taskStatus,
    );

    // ========================================================================
    // AUTOMATIC TASK ARCHIVAL: MOVE COMPLETED TASKS TO DONE.json
    // ========================================================================

    try {
      logger.addFlow("Running automatic task archival for completed tasks");
      const archivalResult = await taskManager.migrateCompletedTasks();

      if (archivalResult && archivalResult.migrated > 0) {
        logger.addFlow(
          `Successfully archived ${archivalResult.migrated} completed tasks to DONE.json`,
        );

        console.error(`
✅ AUTOMATIC TASK ARCHIVAL COMPLETED

📁 Archived ${archivalResult.migrated} completed tasks to DONE.json
📊 Total found: ${archivalResult.total || "N/A"}
📋 Skipped: ${archivalResult.skipped || 0}

This keeps TODO.json clean and prevents it from becoming crowded with completed work.
        `);
      } else {
        logger.addFlow("No completed tasks found to archive");
      }
    } catch (archivalError) {
      logger.addFlow(`Task archival failed: ${archivalError.message}`);
      console.error(`
⚠️ AUTOMATIC TASK ARCHIVAL WARNING

Task archival encountered an issue: ${archivalError.message}

This is non-critical and won't prevent continued operation.
      `);
    }

    // Always continue - never allow natural stops
    logger.addFlow(
      "Never-stop mode: Providing instructive task management guidance",
    );
    logger.logExit(2, "Infinite continue mode - providing task guidance");
    logger.save();

    // Output detailed instructions to Claude
    console.error(`
🔄 INFINITE CONTINUE MODE ACTIVE

🚨 **CLAUDE CODE AGENT - PROFESSIONAL DEVELOPER PROTOCOL:**
**ULTRATHINK - ACT AS TOP-LEVEL PROFESSIONAL DEVELOPER WITH BRUTAL HONESTY**
**ULTRATHINK - BE THOROUGH, METICULOUS, AND A PERFECTIONIST - ZERO TOLERANCE FOR INCOMPLETE WORK**
**ULTRATHINK - FOLLOW ALL DIRECTIVES TO THE TEE WITH COMPLETE PRECISION**
**ULTRATHINK - FIRST: READ OR REVIEW ALL development/essentials/ FILES - MANDATORY EVERY TIME**
**ULTRATHINK - GET TASKMANAGER API GUIDE IMMEDIATELY - ALWAYS RUN IT ON STARTUP**
**ULTRATHINK - IMMEDIATELY REINITIALIZE AGENT TO PREVENT EXPIRATION**
**ULTRATHINK - ACTIVELY SCAN POST-TOOL FEEDBACK FOR LINTER ERRORS AND FIX IMMEDIATELY**
**ULTRATHINK - IF YOU HAVE AN UNFINISHED TASK, DO NOT STOP - CONTINUE WORKING ON IT**
**ULTRATHINK - CHECK YOUR CURRENT TASK STATUS IMMEDIATELY USING COMMANDS BELOW**
**ULTRATHINK - COMPLETE ALL UNFINISHED WORK BEFORE CLAIMING NEW TASKS**
**ULTRATHINK - DEPLOY MAXIMUM CONCURRENT SUBAGENTS FOR PARALLELIZABLE WORK**
**ULTRATHINK - USE UP TO 10 SIMULTANEOUS SUBAGENTS FOR COMPLEX TASKS**
**ULTRATHINK - ADD THE MOST COMPREHENSIVE LOGGING AND DOCUMENTATION POSSIBLE**
**ULTRATHINK - KEEP ROOT FOLDER CLEAN AND ORGANIZE INTO development/ SUBDIRECTORIES**

${instructiveGuidance}

🚫 STOP NOT ALLOWED
This system operates in infinite continue mode. To authorize a stop, use:

🛑 AUTHORIZE STOP WITH TASKMANAGER API:
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.authorizeStopHook("agent_id", "Reason for stopping").then(result => console.log(JSON.stringify(result, null, 2)));'

⚡ CONTINUING OPERATION...
`);

    process.exit(2); // Always continue - never allow natural stops
  } catch (error) {
    logger.logError(error, "stop-hook-main");
    logger.logExit(
      2,
      `Error handled - continuing infinite mode: ${error.message}`,
    );
    logger.save();

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
    process.exit(2); // Even on error, continue infinite mode
  }
});
