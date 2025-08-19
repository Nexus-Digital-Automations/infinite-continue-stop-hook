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
 * Provides detailed, instructive TaskManager guidance based on current task status
 */
async function provideInstructiveTaskGuidance(taskManager, taskStatus) {
    // Check if agent has a current task
    const currentTask = await taskManager.getCurrentTask();
    
    if (currentTask) {
        return `
🎯 CONTINUE YOUR CURRENT TASK

You have an active task in progress. Focus on completing it before moving to other work.

📋 CURRENT TASK DETAILS:
• Task ID: ${currentTask.id}
• Title: ${currentTask.title}
• Status: ${currentTask.status}
• Category: ${currentTask.category || 'N/A'}
• Priority: ${currentTask.priority || 'Normal'}
${currentTask.description ? `• Description: ${currentTask.description}` : ''}

🔄 WHAT TO DO NOW:
1. CONTINUE WORKING on your current task: "${currentTask.title}"
2. Use your regular tools and processes to make progress
3. When task is COMPLETE, mark it as done with this command:

   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.updateTaskStatus('${currentTask.id}', 'completed', 'Task completed successfully').then(() => console.log('✅ Task marked as completed'));"

4. After completing, the stop hook will guide you to your next task

💡 TASK COMPLETION CHECKLIST:
${currentTask.success_criteria && currentTask.success_criteria.length > 0 ? 
  currentTask.success_criteria.map(criteria => `• ${criteria}`).join('\n') :
  '• Verify functionality works as expected\n• Run any relevant tests\n• Ensure code quality standards are met'
}

📊 PROJECT STATUS: ${taskStatus.pending} pending, ${taskStatus.in_progress} in progress, ${taskStatus.completed} completed
`;
        
    } else if (taskStatus.pending > 0) {
        return `
🆕 GET YOUR NEXT TASK

You don't have an active task. There are ${taskStatus.pending} pending tasks waiting for you.

🔄 GET NEXT TASK COMMAND:
Run this command to claim your next task:

   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getNextPendingTask().then(task => console.log(task ? JSON.stringify(task, null, 2) : 'No pending tasks'));"

📋 AFTER GETTING YOUR TASK:
1. Review the task title, description, and requirements
2. Check any important files listed for the task
3. Begin working on the task using your normal tools
4. When complete, mark it as done with the updateTaskStatus command
5. The system will then guide you to your next task

📊 CURRENT WORKLOAD:
• Pending tasks: ${taskStatus.pending} (ready for assignment)
• In progress: ${taskStatus.in_progress} (being worked on by other agents)
• Completed: ${taskStatus.completed} (finished work)
• Total: ${taskStatus.total} tasks in the system

💼 TASK CATEGORIES AVAILABLE:
Priority order: research → linter-error → build-error → missing-feature → bug → enhancement
`;
        
    } else if (taskStatus.in_progress > 0) {
        return `
⏳ WAIT FOR TASK COMPLETION OR CREATE NEW WORK

No pending tasks available, but ${taskStatus.in_progress} tasks are in progress by other agents.

🔄 OPTIONS FOR YOU:
1. WAIT briefly for other agents to complete tasks and create new ones
2. CREATE NEW TASKS if you identify missing work

📊 CURRENT STATUS:
• In progress: ${taskStatus.in_progress} (other agents working)
• Completed: ${taskStatus.completed} (finished work)
• Pending: ${taskStatus.pending} (none available)

🆕 CREATE NEW TASK (if needed):
If you identify missing functionality, bugs, or improvements needed:

   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: '[TASK_TITLE]', description: '[DESCRIPTION]', mode: 'DEVELOPMENT', category: '[CATEGORY]'}).then(id => console.log('Created task:', id));"

📋 ANALYSIS AREAS TO CONSIDER:
• Missing features or functionality gaps
• Code quality improvements needed  
• Documentation that needs updating
• Test coverage requirements
• Performance optimizations
• Security enhancements

Wait 10-15 seconds, then check for new tasks:
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getTaskStatus().then(status => console.log(JSON.stringify(status, null, 2)));"
`;
        
    } else {
        return `
🔍 CREATE NEW TASKS - PROJECT ANALYSIS NEEDED

No tasks are currently pending or in progress. Analyze the project to identify new work.

🎯 PROJECT ANALYSIS WORKFLOW:
1. EXAMINE codebase for missing features, bugs, or improvements
2. CHECK documentation for gaps or outdated information  
3. REVIEW code quality and identify refactoring opportunities
4. ASSESS test coverage and identify missing tests
5. CREATE tasks for any work you identify

🆕 CREATE NEW TASK COMMAND:
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: '[TASK_TITLE]', description: '[DESCRIPTION]', mode: 'DEVELOPMENT', category: '[CATEGORY]'}).then(id => console.log('Created task:', id));"

📋 AVAILABLE CATEGORIES (choose appropriate):
HIGH PRIORITY:
• research - Investigation, exploration, learning tasks
• linter-error - Code style/formatting issues  
• build-error - Compilation or build failures
• missing-feature - New functionality needed

STANDARD PRIORITY:  
• bug - Incorrect behavior to fix
• enhancement - Improvements to existing features
• refactor - Code restructuring/optimization
• documentation - Documentation updates

LOW PRIORITY:
• chore - Maintenance and cleanup tasks
• missing-test - Test coverage gaps (lowest priority)

🚨 TASKMANAGER API REFERENCE GUIDE

**CRITICAL**: Directory restrictions resolved with Node.js API. ALL TaskManager commands MUST use universal scripts. Replace [PROJECT_DIRECTORY] with actual project path.

🌟 UNIVERSAL USAGE (ALWAYS USE THESE!):

   # Universal CLI (recommended)
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" <command> [args...] [--project /path/to/project]

   # Examples:
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" api current --project [PROJECT_DIRECTORY]
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" update task_123 completed --project [PROJECT_DIRECTORY]

✅ AGENT INITIALIZATION (MANDATORY):
   # ALWAYS use universal script with project path:
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]
   
   # Alternative direct script usage:
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-init.js" [PROJECT_DIRECTORY]

🎯 Core TaskManager Node.js API Operations:

   # Agent initialization and management
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" init '{"role": "testing", "specialization": ["unit-tests"]}' --project-root [PROJECT_DIRECTORY]

   # Task management operations
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" api current --project [PROJECT_DIRECTORY]
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" list '{"status": "pending"}' --project-root [PROJECT_DIRECTORY]
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" create '{"title": "Fix linter errors", "mode": "DEVELOPMENT", "category": "linter-error"}' --project-root [PROJECT_DIRECTORY]
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" claim task_123 [agentId] normal --project-root [PROJECT_DIRECTORY]
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" update task_123 completed "Fixed successfully" --project [PROJECT_DIRECTORY]

   # Task organization and prioritization
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" move-top task_123 --project-root [PROJECT_DIRECTORY]
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" move-up task_123 --project-root [PROJECT_DIRECTORY]
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" move-down task_123 --project-root [PROJECT_DIRECTORY]
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" move-bottom task_123 --project-root [PROJECT_DIRECTORY]

   # System status and statistics
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" status [agentId] --project-root [PROJECT_DIRECTORY]
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" stats --project-root [PROJECT_DIRECTORY]

📋 Direct Node.js API Commands:

   # Core task operations
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" init --project-root [PROJECT_DIRECTORY]
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" api current --project [PROJECT_DIRECTORY]
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" list '{"mode": "DEVELOPMENT"}' --project-root [PROJECT_DIRECTORY]
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js" create '{"title": "Add missing unit tests", "mode": "TESTING", "category": "missing-test"}' --project-root [PROJECT_DIRECTORY]

   # Task management using universal TaskManager API directly (from any directory)
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getCurrentTask('agent_1').then(task => console.log(JSON.stringify(task, null, 2)));"
   
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createTask({title: 'Fix build error', description: 'Webpack compilation failing', mode: 'DEVELOPMENT', category: 'build-error'}).then(id => console.log('Created task:', id));"
   
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.updateTaskStatus('task_id', 'completed').then(() => console.log('Task updated'));"

🔧 Advanced TaskManager Operations:

   # Multi-agent task assignment
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.assignTaskToAgent('task_id', 'agent_1', 'primary').then(success => console.log('Task assigned:', success));"
   
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.claimTask('task_id', 'agent_1', 'high').then(result => console.log(JSON.stringify(result, null, 2)));"

   # Task removal and reordering
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.removeTask('task_id').then(removed => console.log('Task removed:', removed));"
   
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.moveTaskToTop('task_id').then(moved => console.log('Task moved to top:', moved));"

🎯 Most Common Quick Operations:

   # Essential workflow commands
   # Initialize agent (save the returned agentId) - ALWAYS use universal script
   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]

   # Get current task
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getCurrentTask('agent_1').then(task => console.log(task ? task.title : 'No active tasks'));"

   # Mark current task completed  
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getCurrentTask('agent_1').then(async task => { if(task) { await tm.updateTaskStatus(task.id, 'completed'); console.log('Task completed:', task.title); } });"

   # Get next task
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getNextTask('agent_1').then(task => console.log(task ? 'Next: ' + task.title : 'No more tasks'));"

   # Create categorized task
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createTask({title: 'Fix linter errors in auth module', description: 'ESLint errors found in authentication', mode: 'DEVELOPMENT', category: 'linter-error'}).then(id => console.log('Created:', id));"

   # Move task to top priority
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.moveTaskToTop('task_id').then(moved => console.log('Moved to top:', moved));"

🛑 STOP HOOK CONTROL:

   # Authorize stop for infinite continue hook (single-use, 30-second expiration)
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.authorizeStopHook('agent_id', 'Reason for stopping').then(result => console.log(JSON.stringify(result, null, 2)));"

🔍 ANALYSIS COMMANDS:
Check current project status:
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getTaskStatus().then(status => console.log(JSON.stringify(status, null, 2)));"

📊 CURRENT STATUS: ${taskStatus.completed} completed tasks, ${taskStatus.total} total
`;
    }
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
1. Run the setup script to create TODO.json
2. Initialize TaskManager for the project

⚡ CONTINUING OPERATION...
`);
            process.exit(2); // Never allow stops even without TODO.json
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
        
        // Initialize TaskManager
        const taskManager = new TaskManager(todoPath);
        
        // Check task status to provide appropriate instructions
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