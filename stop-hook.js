#!/usr/bin/env node

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
 * Provides standardized TaskManager API guidance for all scenarios
 */
async function provideInstructiveTaskGuidance(taskManager, taskStatus) {
  return `
📋 CLAUDE CODE AGENT TASK CONTINUATION PROTOCOL

🚨 **CRITICAL AGENT PROTOCOL:**
**ULTRATHINK - MANDATORY SEQUENCE:**
1. **REINITIALIZE AGENT** to prevent expiration using commands below
2. **READ/REVIEW development/essentials/** directory - MANDATORY EVERY TIME
3. **CHECK CURRENT TASK** status - continue unfinished work first
4. **DEPLOY CONCURRENT SUBAGENTS** - use up to 10 for complex multi-component tasks
5. **VERIFY TASK CLAIMS** - never claim tasks already assigned to other agents
6. **FEATURES COMPLIANCE** - only implement "approved" features in TODO.json
7. **COMPREHENSIVE COMMENTING** - add thorough documentation to all script files

**ABSOLUTE PROHIBITIONS:**
❌ Don't claim tasks with assigned_agent/claimed_by fields set
❌ Don't start work without reading development/essentials/ files first
❌ Don't implement features not approved in TODO.json features array
❌ Don't skip development/essentials/ review - mandatory every task/continue

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

**ERROR TASK CREATION (ABSOLUTE PRIORITY):**
   # Create linter error task (highest priority)
   timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" create-error '{"title": "Fix [specific error]", "description": "[error description]", "category": "linter-error", "priority": "critical", "important_files": ["path/to/file"]}'

**FEATURE MANAGEMENT:**
   # Agent suggests feature (no authorization required)
   timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" suggest-feature '{"title": "Feature Name", "description": "Detailed description", "rationale": "Why beneficial", "category": "enhancement", "estimated_effort": "medium"}' [AGENT_ID]

   # List approved features ready for implementation
   timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" list-features '{"status": "approved"}'

**GIT WORKFLOW (MANDATORY AFTER TASK COMPLETION):**
   git add -A
   git commit -m "feat: [description]

   - [changes made]
   - [accomplishments]

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   git push

**TASK SWITCHING & ADVANCED MANAGEMENT:**
   # Check available tasks with context
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getAvailableTasksWithContext("[AGENT_ID]").then(result => console.log(JSON.stringify(result, null, 2)));'

   # Create urgent task (automatically switches current work)
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.createUrgentTask({title: "Critical issue", description: "Urgent task description", category: "error", mode: "DEVELOPMENT", switchReason: "Critical bug found"}, "[AGENT_ID]").then(result => console.log(JSON.stringify(result, null, 2)));'

   # Resume previously switched task
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.resumeSwitchedTask("TASK_ID", "[AGENT_ID]").then(result => console.log(JSON.stringify(result, null, 2)));'

   # Get next available task
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getNextPendingTask().then(task => { if(task) { console.log("📋 Next task available:"); console.log(JSON.stringify(task, null, 2)); } else { console.log("No pending tasks available"); } });'

**ADVANCED FEATURE MANAGEMENT:**
   # Discover all TaskManager methods
   timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" methods

   # List features by status  
   timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" feature-list '{"status": "proposed"}'

   # Get feature statistics
   timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" feature-stats

   # Create new feature (automatically assigns next feature number)
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.insertFeature({title: "[feature name]", description: "[description]", category: "enhancement"}, 1).then(id => console.log("Created Feature 1:", id));'

   # Create subtask within feature
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.insertSubtask({title: "[subtask name]", description: "[description]", category: "missing-feature"}, "FEATURE_ID", 1).then(id => console.log("Created Subtask 1:", id));'

   # Link task to feature
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.linkTaskToFeature("task-id", "feature-id").then(() => console.log("✅ Task linked to feature"));'

**DEPENDENCY & PROJECT MANAGEMENT:**
   # Create dependency task
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.createTask({title: "[Dependency task]", category: "[any-category]"}).then(id => console.log("Dependency task:", id));'

   # Create dependent task with dependency
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.createTask({title: "[Dependent task]", category: "[any-category]", dependencies: ["DEPENDENCY_TASK_ID"]}).then(id => console.log("Dependent task:", id));'

   # Check project status
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getTaskStatus().then(status => console.log(JSON.stringify(status, null, 2)));'

   # Use TaskManager API for dependency-aware claiming
   timeout 10s node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" claim TASK_ID

**SAFE TASK CLAIMING COMMANDS:**
   # List all tasks with claim status
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { data.tasks.forEach(t => console.log("Task " + t.id + ": " + t.title + " | Status: " + t.status + " | Claimed by: " + (t.assigned_agent || t.claimed_by || "none"))); });'

   # Find available unclaimed tasks
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { const available = data.tasks.filter(t => t.status === "pending" && (t.assigned_agent === undefined || t.assigned_agent === null) && (t.claimed_by === undefined || t.claimed_by === null)); console.log("Available tasks:", available.map(t => ({ id: t.id, title: t.title, category: t.category }))); });'

   # Safe task claiming (only if not claimed)
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(async data => { const task = data.tasks.find(t => t.id === "TASK_ID"); if (!task) { console.log("Task not found"); return; } if (task.assigned_agent || task.claimed_by) { console.log("❌ Task already claimed by:", task.assigned_agent || task.claimed_by); return; } const result = await tm.claimTask("TASK_ID", "[AGENT_ID]", "normal"); console.log("✅ Task claimed:", result); });'

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

    // Remove stale agents from the system
    let agentsRemoved = 0;
    for (const staleAgentId of staleAgents) {
      delete todoData.agents[staleAgentId];
      agentsRemoved++;
      logger.addFlow(`Removed stale agent: ${staleAgentId}`);
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
          if (!task.agent_assignment_history)
            task.agent_assignment_history = [];
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
    if (agentsRemoved > 0 || staleTasksReset > 0) {
      await taskManager.writeTodo(todoData);
      if (agentsRemoved > 0) {
        logger.addFlow(`Removed ${agentsRemoved} stale agents from TODO.json`);
      }
      if (staleTasksReset > 0) {
        logger.addFlow(`Reset ${staleTasksReset} stale tasks back to pending`);
      }
    }

    logger.addFlow(
      `Active agents found: ${activeAgents.length}, Stale agents removed: ${agentsRemoved}, Stale tasks reset: ${staleTasksReset}`,
    );

    // Enhanced agent status analysis for better messaging
    const hadStaleAgents = staleAgents.length > 0;
    const totalAgentsBeforeCleanup = allAgents.length;

    if (activeAgents.length === 0) {
      logger.addFlow("No active agents detected - analyzing situation for appropriate guidance");
      
      // Differentiate between "no agents ever" vs "only stale agents were found"
      if (hadStaleAgents && totalAgentsBeforeCleanup > 0) {
        logger.addFlow(`Found ${totalAgentsBeforeCleanup} stale agents - providing reactivation guidance`);
        logger.logExit(2, "Only stale agents found - providing reactivation guidance");
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
        logger.logExit(2, "No agents - providing fresh initialization guidance");
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
    const taskStatus = await taskManager.getTaskStatus();
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
          `Successfully archived ${archivalResult.migrated} completed tasks to DONE.json`
        );
        
        console.error(`
✅ AUTOMATIC TASK ARCHIVAL COMPLETED

📁 Archived ${archivalResult.migrated} completed tasks to DONE.json
📊 Total found: ${archivalResult.total || 'N/A'}
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

🚨 **CLAUDE CODE AGENT - READ THIS FIRST:**
**ULTRATHINK - FIRST: READ OR REVIEW ALL development/essentials/ FILES - MANDATORY EVERY TIME**
**ULTRATHINK - IMMEDIATELY REINITIALIZE AGENT TO PREVENT EXPIRATION**
**ULTRATHINK - IF YOU HAVE AN UNFINISHED TASK, DO NOT STOP - CONTINUE WORKING ON IT**
**ULTRATHINK - CHECK YOUR CURRENT TASK STATUS IMMEDIATELY USING COMMANDS BELOW**
**ULTRATHINK - COMPLETE ALL UNFINISHED WORK BEFORE CLAIMING NEW TASKS**
**ULTRATHINK - DEPLOY MAXIMUM CONCURRENT SUBAGENTS FOR PARALLELIZABLE WORK**
**ULTRATHINK - USE UP TO 10 SIMULTANEOUS SUBAGENTS FOR COMPLEX TASKS**
**ULTRATHINK - ADD COMPREHENSIVE COMMENTS TO ALL SCRIPT FILES**

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
