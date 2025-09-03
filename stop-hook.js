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

🚨 CRITICAL INSTRUCTION FOR CLAUDE CODE AGENT:
**ULTRATHINK - IMMEDIATELY REINITIALIZE AGENT TO PREVENT EXPIRATION**
**ULTRATHINK - IF YOU HAVE AN UNFINISHED TASK - CONTINUE WORKING ON IT IMMEDIATELY**
**ULTRATHINK - DO NOT STOP - DO NOT CLAIM NEW TASKS - FINISH YOUR CURRENT WORK FIRST**
**ULTRATHINK - DEPLOY MAXIMUM CONCURRENT TASK SUBAGENTS FOR ALL PARALLELIZABLE WORK**
**ULTRATHINK - USE UP TO 10 SIMULTANEOUS SUBAGENTS FOR COMPLEX MULTI-COMPONENT TASKS**

🚨 **ABSOLUTE PROHIBITIONS - NEVER EVER:**
**❌ DO NOT CLAIM TASKS ALREADY CLAIMED BY OTHER AGENTS**
**❌ DO NOT CLAIM TASKS WITH assigned_agent OR claimed_by FIELDS SET**
**❌ DO NOT START WORK WITHOUT READING development/features.md FIRST**
**❌ DO NOT IMPLEMENT FEATURES NOT APPROVED IN development/features.md**

🔄 MANDATORY WORKFLOW FOR CLAUDE CODE AGENT:
1. **IMMEDIATELY FIRST: REINITIALIZE AGENT TO PREVENT EXPIRATION USING COMMAND BELOW**
2. **ABSOLUTELY SECOND: Read development/features.md to understand approved features and project scope**
3. **THIRD: Check if you have an unfinished task using the commands below**  
4. **FOURTH: ASSESS TASK FOR CONCURRENT SUBAGENT DEPLOYMENT - USE MAXIMUM PARALLELIZATION**
5. **FIFTH: DEPLOY UP TO 10 CONCURRENT SUBAGENTS FOR COMPLEX MULTI-COMPONENT TASKS**
6. **TASK CLAIMING VALIDATION: Before claiming any task, verify it is NOT already claimed by another agent**
7. **FEATURES COMPLIANCE: Only work on features listed in development/features.md "Implemented" or "Planned" sections**
8. **IF UNFINISHED TASK EXISTS: CONTINUE WORKING ON IT - DO NOT STOP UNTIL COMPLETE**
9. **CONCURRENT EXECUTION: Break work into parallel streams and execute simultaneously**
10. **BEFORE STARTING ANY TASK: Scan development/reports/ and development/research-reports/ for relevant research reports**
11. **READ RESEARCH REPORTS FIRST: Include applicable reports in task important_files and read them before implementation**
12. **IF NO CURRENT TASK: COMPLETE current task and claim next one (only if not claimed by another agent)**
13. **ALWAYS: Use TaskManager API endpoints to manage your work**
14. **WHEN FINISHED: Mark tasks complete using the commands below**
15. **AFTER TASK COMPLETION: IMMEDIATELY REINITIALIZE AGENT AGAIN**
16. **THEN: Claim new tasks using the API commands below (verify not already claimed first)**
17. **COMPREHENSIVE COMMENTING: ADD THOROUGH, UP-TO-DATE COMMENTS TO ALL SCRIPT FILES**

⚡ **TASK STATE-AWARE CONTINUATION MANDATE:**

🔍 **IDENTIFY YOUR TASK STATE FIRST - THEN ACT ACCORDINGLY:**
- **Just Started (0-25% complete)** → Review requirements, read research reports, begin implementation methodically
- **Early Progress (25-50% complete)** → Continue implementation, maintain context, don't restart from scratch
- **Mid-Implementation (50-75% complete)** → Focus on completing core functionality, preserve existing work
- **Near Completion (75-95% complete)** → Finish implementation, run comprehensive validation, fix any issues
- **Validation Phase (95%+ complete)** → Run all checks (lint, typecheck, tests), fix errors, verify requirements met
- **Failed Validation** → Analyze failure reasons, fix specific issues, re-run validation until passing

🧠 **CONTEXT PRESERVATION CRITICAL:**
- **NEVER restart work from scratch** - always build upon existing progress
- **READ all previous agent notes** and task history before continuing
- **MAINTAIN implementation approach** established by previous work
- **PRESERVE variable names, file structures, and architectural decisions**
- **REVIEW task important_files** for context and requirements

🔄 **IMPLEMENTATION RESUMPTION PROTOCOL:**

📂 **BEFORE RESUMING - MANDATORY CONTEXT GATHERING:**
1. **Read task description and requirements** - understand the full scope
2. **Review agent_assignment_history** - see what previous agents attempted
3. **Check important_files list** - read all referenced documentation
4. **Examine existing code changes** - understand current implementation state
5. **Review status_history** - identify previous blockers or issues

💻 **IMPLEMENTATION CONTINUATION STRATEGIES:**
- **For Code Changes:** Use git diff to see what was modified, continue from that point
- **For New Features:** Check partially written functions, complete missing functionality
- **For Bug Fixes:** Review error logs, continue debugging from last known state  
- **For Refactoring:** Understand scope of changes, complete transformation consistently
- **For Testing:** Run existing tests first, then add missing test coverage

🚨 **NEVER DO DURING CONTINUATION:**
- ❌ **Don't rewrite existing working code** unless absolutely necessary
- ❌ **Don't change architectural decisions** made by previous agents
- ❌ **Don't skip validation steps** that were previously failing
- ❌ **Don't ignore task requirements** to rush completion

📈 **PROGRESS PRESERVATION MANDATE - NEVER LOSE WORK:**

🛡️ **WORK PRESERVATION PRINCIPLES:**
- **Partial implementations have value** → Build upon them rather than restarting
- **Failed attempts contain lessons** → Learn from previous errors, don't repeat
- **Context switching is expensive** → Maintain momentum when resuming work
- **Architecture decisions persist** → Follow established patterns and structures

💾 **BEFORE CONTINUING - PRESERVE EXISTING WORK:**
   # Backup current state before making changes
   git status  # See what files are modified
   git diff > /tmp/current-changes-backup.patch  # Save current changes
   git stash  # Preserve uncommitted work if needed
   
   # Review what was previously implemented  
   git log --oneline -5  # Recent commits
   git diff HEAD~3..HEAD --name-only  # Files changed in recent work

🔍 **CONTEXT ANALYSIS CHECKLIST:**
- [ ] **Task requirements fully understood** - re-read description and success criteria
- [ ] **Previous work direction identified** - understand implementation approach
- [ ] **Blocking issues catalogued** - know what stopped previous progress  
- [ ] **Dependencies satisfied** - ensure all prerequisite tasks completed
- [ ] **Validation requirements clear** - know what checks must pass
- [ ] **Integration points mapped** - understand how work fits into larger system

🚀 **CONCURRENT SUBAGENT DEPLOYMENT MANDATE:**
- **ALWAYS ASSESS PARALLELIZATION POTENTIAL** - Every task must be evaluated for concurrent execution
- **DEPLOY MAXIMUM SUBAGENTS** - Use up to 10 concurrent subagents for complex tasks
- **SIMULTANEOUS START** - All subagents must begin AT THE EXACT SAME TIME
- **BREAK DOWN WORK** - Divide tasks into parallel streams for maximum efficiency
- **COORDINATE EXECUTION** - Ensure subagents work in harmony without conflicts
- **APPROPRIATE SCALING** - Use as many subagents as the task meaningfully supports
- **NO SINGLE-AGENT BIAS** - Default to concurrent execution when possible

📝 **COMPREHENSIVE COMMENTING MANDATE:**
- **ALL SCRIPT FILES MUST HAVE THOROUGH COMMENTS** - Future developers need comprehensive documentation
- **FUNCTION DOCUMENTATION** - Every function must have purpose, parameters, return values explained
- **COMPLEX LOGIC COMMENTS** - Inline explanations for non-obvious implementation decisions
- **FILE HEADER COMMENTS** - Purpose, dependencies, usage instructions for every script file
- **MAINTAIN COMMENT ACCURACY** - Always update comments when modifying code
- **REMOVE INCORRECT COMMENTS** - Delete or fix comments that are outdated or wrong

🎯 ESSENTIAL TASKMANAGER API COMMANDS

**CRITICAL**: Replace [PROJECT_DIRECTORY] with actual project path and [AGENT_ID] with your agent ID.

🚨 **CRITICAL BASH ESCAPING RULE - ALWAYS USE SINGLE QUOTES FOR NODE -E COMMANDS**

🚨 **ABSOLUTE REQUIREMENTS FOR TASKMANAGER API:**
- **ALWAYS USE SINGLE QUOTES** - Wrap entire node -e command in single quotes
- **DOUBLE QUOTES INSIDE** - Use double quotes for JavaScript strings inside the command
- **NO NESTED SINGLE QUOTES** - Never mix single quotes inside single-quoted commands
- **PREVENTS SHELL INTERFERENCE** - Single quotes prevent bash from interpreting JavaScript

⚠️ **BASH SHELL WARNING**: Bash escapes special characters causing syntax errors in node -e commands.
**MANDATORY FIX**: ALWAYS use single quotes for the outer shell command:
   - ❌ BROKEN: node -e "JavaScript code with special chars"  
   - ✅ CORRECT: node -e 'JavaScript code with special chars'
   - ❌ AVOID: !== and != operators in double-quoted commands
   - ✅ SAFE: Use single quotes OR create temp .js files for complex scripts

**🔴 MANDATORY FOR ALL TASKMANAGER OPERATIONS:**
- Task creation: node -e 'const TaskManager = require("./lib/taskManager"); ...'
- Task updates: node -e 'const TaskManager = require("./lib/taskManager"); ...'
- Task queries: node -e 'const TaskManager = require("./lib/taskManager"); ...'

**ERROR PATTERNS TO AVOID:**
- SyntaxError: Unexpected end of input
- SyntaxError: missing ) after argument list  
- Unexpected eof

🚀 CORE WORKFLOW COMMANDS:

   # STEP 0: CRITICAL - INITIALIZE AGENT FIRST, THEN REINITIALIZE TO PREVENT EXPIRATION
   # If you get "No agent ID" error, run init first:
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" init --project-root "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook"
   # Then immediately reinitialize with your agent ID (REQUIRED - get it from init output above):
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" reinitialize AGENT_ID_FROM_INIT_COMMAND

   # STEP 1: MANDATORY - Read features file first
   cat development/features.md

   # STEP 2: Initialize agent (get your agent ID) - ONLY IF NOT ALREADY INITIALIZED
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]

   # STEP 3: Check current task status
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTask("[AGENT_ID]").then(task => console.log(task ? JSON.stringify(task, null, 2) : "No active task"));'

   # STEP 4: Before claiming any task - check if it's already claimed
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { const task = data.tasks.find(t => t.id === "TASK_ID"); console.log("Task claim status:", { id: task?.id, assigned_agent: task?.assigned_agent, claimed_by: task?.claimed_by, status: task?.status }); });'

   # Mark current task completed (if finished) - MUST RUN LINTER CHECKS FIRST
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTask("[AGENT_ID]").then(async task => { if(task) { await tm.updateTaskStatus(task.id, "completed", "Task completed successfully"); console.log("✅ Task completed:", task.title); } else { console.log("No active task to complete"); } });'

   # IMMEDIATE AFTER TASK COMPLETION: REINITIALIZE AGENT TO PREVENT EXPIRATION
   # Use your actual agent ID from the init command above (REQUIRED):
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" reinitialize YOUR_ACTUAL_AGENT_ID

   # Claim next available task  
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getNextPendingTask().then(task => { if(task) { console.log("📋 Next task available:"); console.log(JSON.stringify(task, null, 2)); } else { console.log("No pending tasks available"); } });'

   # Claim specific task by ID
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.claimTask("TASK_ID", "[AGENT_ID]", "normal").then(result => console.log(JSON.stringify(result, null, 2)));'

🔄 **NEW: TASK SWITCHING & URGENT TASK SUPPORT**:

   # NEW: Check available tasks with context (shows current, previous, and available tasks)
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getAvailableTasksWithContext("[AGENT_ID]").then(result => console.log(JSON.stringify(result, null, 2)));'

   # NEW: Create urgent task that automatically switches current work
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.createUrgentTask({title: "Critical issue", description: "Urgent task description", category: "error", mode: "DEVELOPMENT", switchReason: "Critical bug found"}, "[AGENT_ID]").then(result => console.log(JSON.stringify(result, null, 2)));'

   # NEW: Resume a previously switched task
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.resumeSwitchedTask("TASK_ID", "[AGENT_ID]").then(result => console.log(JSON.stringify(result, null, 2)));'

   # NEW: Check for urgent task switching recommendations
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTaskWithSwitching("[AGENT_ID]").then(result => console.log(JSON.stringify(result, null, 2)));'

🆕 **TASK SWITCHING WORKFLOW**:
- **When critical issues arise**: Use createUrgentTask() to automatically switch and preserve context
- **Previous work preserved**: Switched tasks maintain "switched" status and can be resumed later
- **Context tracking**: All task switches are logged with timestamps and reasons
- **Resume capability**: Return to previous work with resumeSwitchedTask() when urgent work is done
- **API endpoint**: GET /api/available-tasks?agentId=AGENT_ID shows all task context

🔧 TASK CREATION & DEPENDENCY MANAGEMENT:

   # Discover all available methods and capabilities
   node taskmanager-api.js methods

   # Create dependency task (any category)
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.createTask({title: "[Dependency task]", category: "[any-category]"}).then(id => console.log("Dependency task:", id));'

   # Create dependent task with dependency
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.createTask({title: "[Dependent task]", category: "[any-category]", dependencies: ["DEPENDENCY_TASK_ID"]}).then(id => console.log("Dependent task:", id));'

   # Use TaskManager API for dependency-aware claiming (handles blocking automatically)
   node taskmanager-api.js claim TASK_ID

   # Check project status
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getTaskStatus().then(status => console.log(JSON.stringify(status, null, 2)));'

🛑 STOP HOOK CONTROL:

   # Authorize stop for infinite continue hook (single-use, 30-second expiration)
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.authorizeStopHook("[AGENT_ID]", "Reason for stopping").then(result => console.log(JSON.stringify(result, null, 2)));'

📊 CURRENT PROJECT STATUS: ${taskStatus.pending} pending, ${taskStatus.in_progress} in progress, ${taskStatus.completed} completed

📋 TASK CATEGORIES (Priority Order):
• linter-error (highest) • build-error • start-error • error • bug (same as error)
• missing-feature • enhancement • refactor • documentation • chore • research • missing-test (lowest)

🔗 DEPENDENCY SYSTEM: Any task can depend on any other task - dependencies prioritized first

⏰ AUTOMATIC STALE TASK RESET: Tasks in progress for >15 minutes are automatically reset to pending

🔍 MANDATORY POST-COMPLETION VALIDATION: Run lint and type checks immediately after completing any task that modified code files

🚨 **ABSOLUTE REQUIREMENT - LINTER CHECKS BEFORE TASK COMPLETION:**
**❌ NEVER mark a task complete without running linter checks first**
**✅ ALWAYS run npm run lint (or equivalent) before marking any task as completed**
**✅ ALWAYS fix all linting errors before task completion**
**✅ ALWAYS provide validation evidence showing linter results**

📋 MANDATORY LINTER CHECK SEQUENCE:
1. **Complete your implementation work**
2. **IMMEDIATELY run linter checks**: npm run lint, npm run typecheck, etc.
3. **Fix any errors found** - do not ignore or suppress
4. **Re-run linter to verify fixes**
5. **ONLY THEN mark task as completed** with validation evidence

🔴 **LINTER CHECK FAILURE PROTOCOL:**
- If linting fails → Create new linter-error task IMMEDIATELY
- If type errors found → Create new error task IMMEDIATELY  
- DO NOT mark original task complete until ALL validation passes
- Provide command outputs as evidence of successful validation

🧪 **VALIDATION CONTINUATION SPECIFICS:**

🔍 **VALIDATION STATE DETECTION:**
- **Never attempted** → Run full validation suite (lint, typecheck, tests, build)
- **Partially run** → Continue from last successful check, fix remaining issues
- **Failed previously** → Focus on specific failing checks, don't re-run passing ones
- **Intermittent failures** → Identify flaky tests or environment issues

⚙️ **VALIDATION RESUMPTION COMMANDS:**
   # Check what validation was previously attempted
   git log --oneline -10  # See recent commits and validation attempts
   npm run lint 2>&1 | tee lint-output.log  # Capture and review lint results
   npx tsc --noEmit 2>&1 | tee typecheck-output.log  # Capture TypeScript errors
   npm test -- --verbose 2>&1 | tee test-output.log  # Detailed test results

🎯 **FOCUSED VALIDATION FIXES:**
- **Lint errors only** → Fix style/syntax issues, preserve functionality
- **Type errors only** → Add type annotations, fix type mismatches  
- **Test failures only** → Fix broken tests, update test expectations
- **Build errors only** → Resolve import/export issues, fix build configuration

📋 RESEARCH REPORTS REQUIREMENT: ALWAYS scan development/reports/ and development/research-reports/ for relevant research reports BEFORE starting any task. Include applicable reports in task important_files and READ THEM FIRST before implementation.

📋 FEATURES MANAGEMENT REQUIREMENT: 
• MANDATORY: Read development/features.md BEFORE starting any work
• ONLY implement features listed in "✅ Implemented Features" or "📋 Planned Features" sections
• NEVER implement features from "❓ Potential Features Awaiting User Verification" without user approval
• ADD new feature ideas to "❓ Potential Features Awaiting User Verification" section for user review
• FOLLOW the feature proposal format specified in development/features.md

🚨 TASK CLAIMING VALIDATION PROTOCOL:
• ALWAYS verify task is not already claimed before attempting to claim it
• CHECK assigned_agent and claimed_by fields are null/empty before claiming
• USE the task validation command above to check claim status
• IF task is already claimed by another agent → FIND A DIFFERENT TASK
• NEVER forcibly claim tasks from other active agents
• RESPECT the multi-agent coordination system

🔍 TASK CLAIMING SAFETY COMMANDS:

   # List all tasks with claim status
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { data.tasks.forEach(t => console.log("Task " + t.id + ": " + t.title + " | Status: " + t.status + " | Claimed by: " + (t.assigned_agent || t.claimed_by || "none"))); });'

   # Find available unclaimed tasks
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { const available = data.tasks.filter(t => t.status === "pending" && (t.assigned_agent === undefined || t.assigned_agent === null) && (t.claimed_by === undefined || t.claimed_by === null)); console.log("Available tasks:", available.map(t => ({ id: t.id, title: t.title, category: t.category }))); });'

   # Safe task claiming (only if not claimed)
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(async data => { const task = data.tasks.find(t => t.id === "TASK_ID"); if (!task) { console.log("Task not found"); return; } if (task.assigned_agent || task.claimed_by) { console.log("❌ Task already claimed by:", task.assigned_agent || task.claimed_by); return; } const result = await tm.claimTask("TASK_ID", "[AGENT_ID]", "normal"); console.log("✅ Task claimed:", result); });'

⚠️ TROUBLESHOOTING BASH ESCAPING ERRORS:
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

🚨 SPECIAL CASE - NEGATION OPERATOR (!):
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

    if (activeAgents.length === 0) {
      logger.addFlow("No active agents detected - need agent initialization");
      logger.logExit(2, "No active agents - providing initialization guidance");
      logger.save();

      console.error(`
🤖 NO ACTIVE AGENTS DETECTED

Working Directory: ${workingDir}
TODO.json Path: ${todoPath}
Total Agents Found: ${allAgents.length}
Active Agents Found: ${activeAgents.length}
Stale Agents Removed: ${agentsRemoved}
Stale Tasks Reset: ${staleTasksReset}

TaskManager project exists but no active agents are registered.

🚨 **CLAUDE CODE AGENT - CRITICAL INSTRUCTION:**
**ULTRATHINK - IF YOU WERE WORKING ON SOMETHING BEFORE THIS MESSAGE:**
**ULTRATHINK - CONTINUE YOUR WORK - DO NOT ABANDON UNFINISHED TASKS**
**ULTRATHINK - INITIALIZE AGENT AND CONTINUE WHERE YOU LEFT OFF**
**ULTRATHINK - DEPLOY MAXIMUM CONCURRENT SUBAGENTS FOR ANY PARALLELIZABLE WORK**
**ULTRATHINK - USE UP TO 10 SIMULTANEOUS SUBAGENTS FOR COMPLEX MULTI-COMPONENT TASKS**
**ULTRATHINK - ADD COMPREHENSIVE COMMENTS TO ALL SCRIPT FILES FOR FUTURE DEVELOPERS**

🤖 **MULTI-AGENT COORDINATION CONTINUATION:**

🔄 **AGENT HANDOFF PROTOCOLS:**
- **Check task.agent_assignment_history** → See which agents worked on this before
- **Read completion notes** from previous attempts → Understand what was tried
- **Review switched task contexts** → If task was interrupted, understand why
- **Coordinate with active agents** → Don't claim tasks actively worked on by others

👥 **AGENT COLLABORATION PATTERNS:**
- **Sequential work** → Continue exactly where previous agent left off
- **Parallel work** → Ensure no conflicts with concurrent agents on related tasks  
- **Specialized handoffs** → Frontend agents → Backend agents → Test agents
- **Expertise handoffs** → Research agents → Implementation agents → Validation agents

📋 **HANDOFF CONTEXT COMMANDS:**
   # Review agent assignment history for context
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTask("AGENT_ID").then(task => { if(task?.agent_assignment_history) { console.log("Previous agents:", task.agent_assignment_history.map(h => h.agentId + " " + h.role + " " + h.assignedAt)); } });'
   
   # Check for related tasks by same agents
   timeout 10s node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { const relatedTasks = data.tasks.filter(t => t.agent_assignment_history?.some(h => h.agentId === "PREVIOUS_AGENT")); console.log("Related tasks by agent:", relatedTasks.map(t => ({id: t.id, title: t.title}))); });'

🔄 INFINITE CONTINUE MODE ACTIVE
The stop hook will continue infinitely to prevent accidental termination.

💡 AGENT INITIALIZATION REQUIRED:
To continue working with this TaskManager project:

1. **Initialize your agent to continue work:**
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project "${workingDir}"

2. **Use the returned agent ID in subsequent commands**
   (Commands will show [AGENT_ID] placeholder that you replace with your actual agent ID)

3. **Check if you have unfinished tasks and continue them:**
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTask("[YOUR_AGENT_ID]").then(task => console.log(task ? JSON.stringify(task, null, 2) : "No active task"));'

⚡ CONTINUING OPERATION - COMPLETE YOUR UNFINISHED WORK...
`);
      process.exit(2);
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
