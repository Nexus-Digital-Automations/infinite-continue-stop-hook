#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const TaskManager = require('./lib/taskManager');
const Logger = require('./lib/logger');

// ============================================================================
// NEVER-STOP INFINITE CONTINUE HOOK WITH INSTRUCTIVE TASK MANAGEMENT
// ============================================================================

/**
 * Find the root "Claude Coding Projects" directory containing TODO.json
 */
function findClaudeProjectRoot(startDir = process.cwd()) {
    let currentDir = startDir;
    
    // Look for "Claude Coding Projects" in the path and check for TODO.json
    while (currentDir !== path.dirname(currentDir)) { // Not at filesystem root
        // Check if we're in or found "Claude Coding Projects"
        if (currentDir.includes('Claude Coding Projects')) {
            // Look for TODO.json in potential project roots
            const segments = currentDir.split(path.sep);
            const claudeIndex = segments.findIndex(segment => segment.includes('Claude Coding Projects'));
            
            if (claudeIndex !== -1 && claudeIndex < segments.length - 1) {
                // Try the next directory after "Claude Coding Projects"
                const projectDir = segments.slice(0, claudeIndex + 2).join(path.sep);
                if (fs.existsSync(path.join(projectDir, 'TODO.json'))) {
                    return projectDir;
                }
            }
            
            // Also check current directory
            if (fs.existsSync(path.join(currentDir, 'TODO.json'))) {
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
    const stopFlagPath = path.join(workingDir, '.stop-allowed');
    
    if (fs.existsSync(stopFlagPath)) {
        // Read and immediately delete the flag (single-use)
        try {
            const flagData = JSON.parse(fs.readFileSync(stopFlagPath, 'utf8'));
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
**IF YOU HAVE AN UNFINISHED TASK - CONTINUE WORKING ON IT IMMEDIATELY**
**DO NOT STOP - DO NOT CLAIM NEW TASKS - FINISH YOUR CURRENT WORK FIRST**

🚨 **ABSOLUTE PROHIBITIONS - NEVER EVER:**
**❌ DO NOT CLAIM TASKS ALREADY CLAIMED BY OTHER AGENTS**
**❌ DO NOT CLAIM TASKS WITH assigned_agent OR claimed_by FIELDS SET**
**❌ DO NOT START WORK WITHOUT READING development/features.md FIRST**
**❌ DO NOT IMPLEMENT FEATURES NOT APPROVED IN development/features.md**

🔄 MANDATORY WORKFLOW FOR CLAUDE CODE AGENT:
1. **ABSOLUTELY FIRST: Read development/features.md to understand approved features and project scope**
2. **SECOND: Check if you have an unfinished task using the commands below**  
3. **TASK CLAIMING VALIDATION: Before claiming any task, verify it is NOT already claimed by another agent**
4. **FEATURES COMPLIANCE: Only work on features listed in development/features.md "Implemented" or "Planned" sections**
5. **IF UNFINISHED TASK EXISTS: CONTINUE WORKING ON IT - DO NOT STOP UNTIL COMPLETE**
6. **BEFORE STARTING ANY TASK: Scan development/reports/ and development/research-reports/ for relevant research reports**
7. **READ RESEARCH REPORTS FIRST: Include applicable reports in task important_files and read them before implementation**
8. **IF NO CURRENT TASK: COMPLETE current task and claim next one (only if not claimed by another agent)**
9. **ALWAYS: Use TaskManager API endpoints to manage your work**
10. **WHEN FINISHED: Mark tasks complete using the commands below**
11. **THEN: Claim new tasks using the API commands below (verify not already claimed first)**

⚡ **EXPLICIT CONTINUATION MANDATE:**
- If your task is partially complete but not finished → **CONTINUE THE TASK**
- If implementation is halfway done → **COMPLETE THE IMPLEMENTATION** 
- If validation hasn't been run → **RUN VALIDATION AND FIX ISSUES**
- If requirements aren't fully met → **FINISH MEETING ALL REQUIREMENTS**
- If code was written but not tested → **TEST AND VALIDATE THE CODE**
- If research reports haven't been read → **READ RELEVANT RESEARCH REPORTS IMMEDIATELY**

🎯 ESSENTIAL TASKMANAGER API COMMANDS

**CRITICAL**: Replace [PROJECT_DIRECTORY] with actual project path and [AGENT_ID] with your agent ID.

🚨 **CRITICAL BASH ESCAPING RULE - ALWAYS USE SINGLE QUOTES FOR NODE -E COMMANDS**

⚠️ **BASH SHELL WARNING**: Bash escapes special characters causing syntax errors in node -e commands.
**MANDATORY FIX**: ALWAYS use single quotes for the outer shell command:
   - ❌ BROKEN: node -e "JavaScript code with special chars"  
   - ✅ CORRECT: node -e 'JavaScript code with special chars'
   - ❌ AVOID: !== and != operators in double-quoted commands
   - ✅ SAFE: Use single quotes OR create temp .js files for complex scripts

**ERROR PATTERNS TO AVOID:**
- SyntaxError: Unexpected end of input
- SyntaxError: missing ) after argument list  
- Unexpected eof

🚀 CORE WORKFLOW COMMANDS:

   # STEP 1: MANDATORY - Read features file first
   cat development/features.md

   # STEP 2: Initialize agent (get your agent ID)
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]

   # STEP 3: Check current task status
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTask("[AGENT_ID]").then(task => console.log(task ? JSON.stringify(task, null, 2) : "No active task"));'

   # STEP 4: Before claiming any task - check if it's already claimed
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { const task = data.tasks.find(t => t.id === "TASK_ID"); console.log("Task claim status:", { id: task?.id, assigned_agent: task?.assigned_agent, claimed_by: task?.claimed_by, status: task?.status }); });'

   # Mark current task completed (if finished)
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTask("[AGENT_ID]").then(async task => { if(task) { await tm.updateTaskStatus(task.id, "completed", "Task completed successfully"); console.log("✅ Task completed:", task.title); } else { console.log("No active task to complete"); } });'

   # Claim next available task  
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getNextPendingTask().then(task => { if(task) { console.log("📋 Next task available:"); console.log(JSON.stringify(task, null, 2)); } else { console.log("No pending tasks available"); } });'

   # Claim specific task by ID
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.claimTask("TASK_ID", "[AGENT_ID]", "normal").then(result => console.log(JSON.stringify(result, null, 2)));'

🔄 **NEW: TASK SWITCHING & URGENT TASK SUPPORT**:

   # NEW: Check available tasks with context (shows current, previous, and available tasks)
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getAvailableTasksWithContext("[AGENT_ID]").then(result => console.log(JSON.stringify(result, null, 2)));'

   # NEW: Create urgent task that automatically switches current work
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.createUrgentTask({title: "Critical issue", description: "Urgent task description", category: "error", mode: "DEVELOPMENT", switchReason: "Critical bug found"}, "[AGENT_ID]").then(result => console.log(JSON.stringify(result, null, 2)));'

   # NEW: Resume a previously switched task
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.resumeSwitchedTask("TASK_ID", "[AGENT_ID]").then(result => console.log(JSON.stringify(result, null, 2)));'

   # NEW: Check for urgent task switching recommendations
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTaskWithSwitching("[AGENT_ID]").then(result => console.log(JSON.stringify(result, null, 2)));'

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
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.createTask({title: "[Dependency task]", category: "[any-category]"}).then(id => console.log("Dependency task:", id));'

   # Create dependent task with dependency
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.createTask({title: "[Dependent task]", category: "[any-category]", dependencies: ["DEPENDENCY_TASK_ID"]}).then(id => console.log("Dependent task:", id));'

   # Use TaskManager API for dependency-aware claiming (handles blocking automatically)
   node taskmanager-api.js claim TASK_ID

   # Check project status
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getTaskStatus().then(status => console.log(JSON.stringify(status, null, 2)));'

🛑 STOP HOOK CONTROL:

   # Authorize stop for infinite continue hook (single-use, 30-second expiration)
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.authorizeStopHook("[AGENT_ID]", "Reason for stopping").then(result => console.log(JSON.stringify(result, null, 2)));'

📊 CURRENT PROJECT STATUS: ${taskStatus.pending} pending, ${taskStatus.in_progress} in progress, ${taskStatus.completed} completed

📋 TASK CATEGORIES (Priority Order):
• linter-error (highest) • build-error • start-error • error • missing-feature
• bug • enhancement • refactor • documentation • chore • research • missing-test (lowest)

🔗 DEPENDENCY SYSTEM: Any task can depend on any other task - dependencies prioritized first

⏰ AUTOMATIC STALE TASK RESET: Tasks in progress for >15 minutes are automatically reset to pending

🔍 MANDATORY POST-COMPLETION VALIDATION: Run lint and type checks immediately after completing any task that modified code files

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
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { data.tasks.forEach(t => console.log("Task " + t.id + ": " + t.title + " | Status: " + t.status + " | Claimed by: " + (t.assigned_agent || t.claimed_by || "none"))); });'

   # Find available unclaimed tasks
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(data => { const available = data.tasks.filter(t => t.status === "pending" && !t.assigned_agent && !t.claimed_by); console.log("Available tasks:", available.map(t => ({ id: t.id, title: t.title, category: t.category }))); });'

   # Safe task claiming (only if not claimed)
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.readTodo().then(async data => { const task = data.tasks.find(t => t.id === "TASK_ID"); if (!task) { console.log("Task not found"); return; } if (task.assigned_agent || task.claimed_by) { console.log("❌ Task already claimed by:", task.assigned_agent || task.claimed_by); return; } const result = await tm.claimTask("TASK_ID", "[AGENT_ID]", "normal"); console.log("✅ Task claimed:", result); });'

⚠️ TROUBLESHOOTING BASH ESCAPING ERRORS:
If you get "SyntaxError: missing ) after argument list" with !== or !=:
   # ❌ BROKEN: bash escapes the ! character
   node -e "script with !== operator"
   
   # ✅ FIXED: Use single quotes 
   node -e 'script with !== operator'
   
   # ✅ ALTERNATIVE: Create temp script file
   echo 'script here' > temp.js && node temp.js && rm temp.js
`;
}

// Read input from Claude Code
let inputData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => inputData += chunk);

process.stdin.on('end', async () => {
    const workingDir = findClaudeProjectRoot();
    const logger = new Logger(workingDir);
    
    try {
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
                hook_event_name: 'manual_execution'
            };
        } else {
            hookInput = JSON.parse(inputData);
        }
        
        const { session_id: _session_id, transcript_path: _transcript_path, stop_hook_active: _stop_hook_active, hook_event_name } = hookInput;
        
        // Log input with event details
        logger.logInput(hookInput);
        logger.addFlow(`Received ${hook_event_name || 'unknown'} event from Claude Code`);
        
        // Check if TODO.json exists in current project
        const todoPath = path.join(workingDir, 'TODO.json');
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
            const heartbeatTime = lastHeartbeat ? new Date(lastHeartbeat).getTime() : 0;
            const timeSinceHeartbeat = Date.now() - heartbeatTime;
            const isActive = timeSinceHeartbeat < staleAgentTimeout;
            
            logger.addFlow(`Agent ${agentId}: heartbeat=${lastHeartbeat}, timeSince=${Math.round(timeSinceHeartbeat/1000)}s, isActive=${isActive}`);
            
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
        
        // Save changes if any stale agents were removed
        if (agentsRemoved > 0) {
            await taskManager.writeTodo(todoData);
            logger.addFlow(`Removed ${agentsRemoved} stale agents from TODO.json`);
        }
        
        logger.addFlow(`Active agents found: ${activeAgents.length}, Stale agents removed: ${agentsRemoved}`);
        
        // Check for stale in-progress tasks (stuck for > 15 minutes) and reset them
        const staleTaskTimeout = 900000; // 15 minutes
        let staleTasksReset = 0;
        
        for (const task of todoData.tasks) {
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
                    if (!task.agent_assignment_history) task.agent_assignment_history = [];
                    task.agent_assignment_history.push({
                        agent: task.assigned_agent || 'system',
                        action: 'auto_reset_stale',
                        timestamp: new Date().toISOString(),
                        reason: `Task stale for ${Math.round(timeSinceStart / 60000)} minutes`
                    });
                    
                    staleTasksReset++;
                    logger.addFlow(`Reset stale task: ${task.title} (${Math.round(timeSinceStart / 60000)} min)`);
                }
            }
        }
        
        // Save changes if any stale tasks were reset
        if (staleTasksReset > 0) {
            await taskManager.writeTodo(todoData);
            logger.addFlow(`Reset ${staleTasksReset} stale tasks back to pending`);
        }

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

TaskManager project exists but no active agents are registered.

🚨 **CLAUDE CODE AGENT - CRITICAL INSTRUCTION:**
**IF YOU WERE WORKING ON SOMETHING BEFORE THIS MESSAGE:**
**CONTINUE YOUR WORK - DO NOT ABANDON UNFINISHED TASKS**
**INITIALIZE AGENT AND CONTINUE WHERE YOU LEFT OFF**

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
            logger.addFlow("Stop endpoint triggered - allowing ONE stop, then returning to infinite mode");
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
        logger.addFlow(`Task status: ${taskStatus.pending} pending, ${taskStatus.in_progress} in_progress, ${taskStatus.completed} completed`);
        
        // Provide detailed instructive guidance based on current state
        const instructiveGuidance = await provideInstructiveTaskGuidance(taskManager, taskStatus);
        
        // Always continue - never allow natural stops
        logger.addFlow("Never-stop mode: Providing instructive task management guidance");
        logger.logExit(2, "Infinite continue mode - providing task guidance");
        logger.save();
        
        // Output detailed instructions to Claude
        console.error(`
🔄 INFINITE CONTINUE MODE ACTIVE

🚨 **CLAUDE CODE AGENT - READ THIS FIRST:**
**IF YOU HAVE AN UNFINISHED TASK, DO NOT STOP - CONTINUE WORKING ON IT**
**CHECK YOUR CURRENT TASK STATUS IMMEDIATELY USING COMMANDS BELOW**
**COMPLETE ALL UNFINISHED WORK BEFORE CLAIMING NEW TASKS**

${instructiveGuidance}

🚫 STOP NOT ALLOWED
This system operates in infinite continue mode. To authorize a stop, use:

🛑 AUTHORIZE STOP WITH TASKMANAGER API:
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.authorizeStopHook("agent_id", "Reason for stopping").then(result => console.log(JSON.stringify(result, null, 2)));'

⚡ CONTINUING OPERATION...
`);
        
        process.exit(2); // Always continue - never allow natural stops
        
    } catch (error) {
        logger.logError(error, 'stop-hook-main');
        logger.logExit(2, `Error handled - continuing infinite mode: ${error.message}`);
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