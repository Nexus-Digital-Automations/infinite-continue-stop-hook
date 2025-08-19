#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const TaskManager = require('./lib/taskManager');
const Logger = require('./lib/logger');

// ============================================================================
// NEVER-STOP INFINITE CONTINUE HOOK WITH INSTRUCTIVE TASK MANAGEMENT
// ============================================================================

/**
 * Check if stop is allowed via endpoint trigger
 */
function checkStopAllowed() {
    const stopFlagPath = path.join(process.cwd(), '.stop-allowed');
    
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
📋 TASK MANAGEMENT WORKFLOW

🔄 STANDARD WORKFLOW:
1. **CONTINUE current task if unfinished** OR **COMPLETE current task and claim next one**
2. **Use TaskManager API endpoints** to manage your work
3. **Mark tasks complete** when finished
4. **Claim new tasks** using the API commands below

🎯 ESSENTIAL TASKMANAGER API COMMANDS

**CRITICAL**: Replace [PROJECT_DIRECTORY] with actual project path and [AGENT_ID] with your agent ID.

⚠️ **BASH SHELL WARNING**: Bash escapes the '!' character in !== and != operators, causing syntax errors.
**QUICK FIX**: Use single quotes instead of double quotes:
   - ❌ BROKEN: node -e "script with !== operator"  
   - ✅ FIXED:  node -e 'script with !== operator'
**OTHER SOLUTIONS**: Create .js files, use != instead of !==, or escape with \\!==

🚀 CORE WORKFLOW COMMANDS:

   # Initialize agent (get your agent ID)
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]

   # Check current task status
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTask("[AGENT_ID]").then(task => console.log(task ? JSON.stringify(task, null, 2) : "No active task"));'

   # Mark current task completed (if finished)
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTask("[AGENT_ID]").then(async task => { if(task) { await tm.updateTaskStatus(task.id, "completed", "Task completed successfully"); console.log("✅ Task completed:", task.title); } else { console.log("No active task to complete"); } });'

   # Claim next available task  
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getNextPendingTask().then(task => { if(task) { console.log("📋 Next task available:"); console.log(JSON.stringify(task, null, 2)); } else { console.log("No pending tasks available"); } });'

   # Claim specific task by ID
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.claimTask("TASK_ID", "[AGENT_ID]", "normal").then(result => console.log(JSON.stringify(result, null, 2)));'

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
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.authorizeStopHook('[AGENT_ID]', 'Reason for stopping').then(result => console.log(JSON.stringify(result, null, 2)));"

📊 CURRENT PROJECT STATUS: ${taskStatus.pending} pending, ${taskStatus.in_progress} in progress, ${taskStatus.completed} completed

📋 TASK CATEGORIES (Priority Order):
• linter-error (highest) • build-error • start-error • error • missing-feature
• bug • enhancement • refactor • documentation • chore • research • missing-test (lowest)

🔗 DEPENDENCY SYSTEM: Any task can depend on any other task - dependencies prioritized first

⏰ AUTOMATIC STALE TASK RESET: Tasks in progress for >15 minutes are automatically reset to pending

🔍 MANDATORY POST-COMPLETION VALIDATION: Run lint and type checks immediately after completing any task that modified code files

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
    const workingDir = process.cwd();
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
        const activeAgents = Object.keys(todoData.agents || {}).filter(agentId => {
            const agent = todoData.agents[agentId];
            // Handle both lastHeartbeat (camelCase) and last_heartbeat (snake_case) formats
            const lastHeartbeat = agent.lastHeartbeat || agent.last_heartbeat;
            const heartbeatTime = lastHeartbeat ? new Date(lastHeartbeat).getTime() : 0;
            const timeSinceHeartbeat = Date.now() - heartbeatTime;
            return timeSinceHeartbeat < 900000; // 15 minutes (more reasonable for active sessions)
        });
        
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

TaskManager project exists but no active agents are registered.

🔄 INFINITE CONTINUE MODE ACTIVE
The stop hook will continue infinitely to prevent accidental termination.

💡 AGENT INITIALIZATION REQUIRED:
To start working with this TaskManager project:

1. **Initialize your agent:**
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project "${workingDir}"

2. **Use the returned agent ID in subsequent commands**
   (Commands will show [AGENT_ID] placeholder that you replace with your actual agent ID)

3. **Check current status:**
   node -e 'const TaskManager = require("/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager"); const tm = new TaskManager("./TODO.json"); tm.getCurrentTask("[YOUR_AGENT_ID]").then(task => console.log(task ? JSON.stringify(task, null, 2) : "No active task"));'

⚡ CONTINUING OPERATION...
`);
            process.exit(2);
        }
        
        // ========================================================================
        // NEVER-STOP PROTOCOL: CHECK ENDPOINT STOP TRIGGER
        // ========================================================================
        
        const stopAllowed = checkStopAllowed();
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

${instructiveGuidance}

🚫 STOP NOT ALLOWED
This system operates in infinite continue mode. To authorize a stop, use:

🛑 AUTHORIZE STOP WITH TASKMANAGER API:
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.authorizeStopHook('agent_id', 'Reason for stopping').then(result => console.log(JSON.stringify(result, null, 2)));"

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