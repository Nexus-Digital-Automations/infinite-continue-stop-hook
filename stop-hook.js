#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const TaskManager = require('./lib/taskManager');
const Logger = require('./lib/logger');

// ============================================================================
// SIMPLIFIED TASKMANAGER API INSTRUCTION PROVIDER
// ============================================================================

/**
 * Provides standard TaskManager API instructions for autonomous task management
 */
function provideTaskManagerInstructions() {
    const instructions = `
=== AUTONOMOUS TASK MANAGEMENT INSTRUCTIONS ===

Use these TaskManager API commands to manage your own tasks:

1. CHECK YOUR CURRENT TASK:
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getCurrentTask().then(task => console.log(task ? JSON.stringify(task, null, 2) : 'No active task'));"

2. GET NEXT PENDING TASK:
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getNextPendingTask().then(task => console.log(task ? JSON.stringify(task, null, 2) : 'No pending tasks'));"

3. CHECK TASK STATUS OVERVIEW:
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getTaskStatus().then(status => console.log(JSON.stringify(status, null, 2)));"

4. UPDATE TASK STATUS (when completed):
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.updateTaskStatus('[TASK_ID]', 'completed', 'Task completed successfully').then(() => console.log('Task marked as completed'));"

5. CREATE NEW TASK (if needed):
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: '[TASK_TITLE]', description: '[DESCRIPTION]', mode: 'DEVELOPMENT', category: '[CATEGORY]'}).then(id => console.log('Created task:', id));"

WORKFLOW:
1. Run bash command #1 to check if you have an active task
2. If no active task, run bash command #2 to get next pending task  
3. Work on the task using your normal tools and processes
4. When complete, run bash command #4 to mark it as completed
5. Run bash command #3 to check overall status and see if more work is available
`;
    
    return instructions;
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
            logger.logExit(0, "No TODO.json found");
            logger.save();
            console.error("No TODO.json found - this is not a TaskManager project, allowing stop");
            process.exit(0);
        }
        
        
        // Initialize TaskManager
        const taskManager = new TaskManager(todoPath);
        
        // Read TODO.json to check task creation attempts
        let todoData = await taskManager.readTodo();
        
        // Initialize task creation tracking if not present
        if (!todoData.task_creation_attempts || typeof todoData.task_creation_attempts !== 'object') {
            todoData.task_creation_attempts = { count: 0, last_attempt: null, max_attempts: 3 };
        }
        
        // Check task status to provide appropriate instructions
        const taskStatus = await taskManager.getTaskStatus();
        logger.addFlow(`Task status: ${taskStatus.pending} pending, ${taskStatus.in_progress} in_progress, ${taskStatus.completed} completed`);
        
        // If no work available, handle task creation attempts
        if (!taskStatus.hasWork) {
            const maxAttempts = 3;
            
            if (todoData.task_creation_attempts.count < maxAttempts) {
                // Increment attempt counter
                todoData.task_creation_attempts.count++;
                todoData.task_creation_attempts.last_attempt = new Date().toISOString();
                await taskManager.writeTodo(todoData);
                
                logger.addFlow(`No work available - entering task creation mode (attempt ${todoData.task_creation_attempts.count}/${maxAttempts})`);
                
                const taskCreationInstructions = `
🔄 TASK CREATION MODE (Attempt ${todoData.task_creation_attempts.count}/${maxAttempts})

No pending tasks found. Please analyze the project and create new tasks if needed:

1. ANALYZE PROJECT STATUS:
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getTaskStatus().then(status => console.log(JSON.stringify(status, null, 2)));"

2. CREATE NEW TASK (if work is needed):
   node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: '[TASK_TITLE]', description: '[DESCRIPTION]', mode: 'DEVELOPMENT', category: '[CATEGORY]'}).then(id => console.log('Created task:', id));"

3. AVAILABLE CATEGORIES (choose appropriate one):
   - research, linter-error, build-error, start-error, error
   - missing-feature, bug, enhancement, refactor, documentation
   - chore, missing-test, test-setup, test-refactor, etc.

WHAT TO ANALYZE:
- Check if all features are complete
- Look for missing documentation
- Identify potential improvements
- Check for missing tests
- Verify code quality standards

If no new tasks are needed, the system will stop after ${maxAttempts - todoData.task_creation_attempts.count} more attempt(s).
`;
                
                logger.logExit(2, `Task creation mode attempt ${todoData.task_creation_attempts.count}/${maxAttempts}`);
                logger.save();
                
                console.error(taskCreationInstructions);
                process.exit(2);
            } else {
                // Reset counter and allow stop
                todoData.task_creation_attempts.count = 0;
                todoData.task_creation_attempts.last_attempt = null;
                await taskManager.writeTodo(todoData);
                
                logger.addFlow(`Maximum task creation attempts (${maxAttempts}) reached - no new tasks created, allowing stop`);
                logger.logExit(0, "No tasks created after maximum attempts - project complete");
                logger.save();
                
                console.error(`No tasks created after ${maxAttempts} attempts. Project appears complete - allowing stop.`);
                process.exit(0);
            }
        } else {
            // Reset task creation attempts when work is available
            if (todoData.task_creation_attempts.count > 0) {
                todoData.task_creation_attempts.count = 0;
                todoData.task_creation_attempts.last_attempt = null;
                await taskManager.writeTodo(todoData);
            }
            
            // Provide TaskManager API instructions
            const instructions = provideTaskManagerInstructions();
            
            // Add project-specific context
            const contextualInstructions = `
${instructions}

CURRENT PROJECT STATUS:
- Total tasks: ${taskStatus.total}
- Pending tasks: ${taskStatus.pending}
- In progress: ${taskStatus.in_progress}  
- Completed: ${taskStatus.completed}
- Has work available: ${taskStatus.hasWork}

✅ Work is available! Use the bash commands above to continue working on tasks.
`;
            
            logger.addFlow("Providing TaskManager API instructions to agent");
            logger.logExit(2, "Providing autonomous task management instructions");
            logger.save();
            
            // Output instructions to Claude
            console.error(contextualInstructions);
            process.exit(2);
        }
        
    } catch (error) {
        logger.logError(error, 'stop-hook-main');
        logger.logExit(0, `Error: ${error.message}`);
        logger.save();
        
        console.error(`Error in stop hook: ${error.message}`);
        console.error("Stop hook error - allowing stop");
        process.exit(0);
    }
});