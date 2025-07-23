#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const TaskManager = require('./lib/taskManager');
const AgentExecutor = require('./lib/agentExecutor');
const ReviewSystem = require('./lib/reviewSystem');
const Logger = require('./lib/logger');

// Read input from Claude Code
let inputData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => inputData += chunk);

process.stdin.on('end', () => {
    const workingDir = process.cwd();
    const logger = new Logger(workingDir);
    
    try {
        const hookInput = JSON.parse(inputData);
        const { session_id, transcript_path, stop_hook_active, hook_event_name } = hookInput;
        
        // Log input with event details
        logger.logInput(hookInput);
        logger.addFlow(`Received ${hook_event_name || 'unknown'} event from Claude Code`);
        
        // Prevent infinite loops
        if (stop_hook_active) {
            logger.addFlow("Stop hook already active - preventing infinite loop");
            logger.logExit(0, "Stop hook already active");
            logger.save();
            console.error("Stop hook already active, allowing stop");
            process.exit(0);
        }
        
        // Initialize components
        const todoPath = path.join(workingDir, 'TODO.json');
        const modesDir = path.join(__dirname, 'modes');
        
        const taskManager = new TaskManager(todoPath);
        const agentExecutor = new AgentExecutor(modesDir);
        const reviewSystem = new ReviewSystem();
        
        // Check if TODO.json exists
        if (!fs.existsSync(todoPath)) {
            logger.addFlow("No TODO.json found in project directory");
            logger.logExit(0, "No TODO.json found");
            logger.save();
            console.log("No TODO.json found in current project. Run setup first.");
            process.exit(0);
        }
        
        // Read TODO.json
        let todoData = taskManager.readTodo();
        logger.logProjectState(todoData, todoPath);
        
        // Handle strike reset logic
        const strikeResult = taskManager.handleStrikeLogic(todoData);
        logger.logStrikeHandling(strikeResult, todoData);
        
        if (strikeResult.action === 'reset') {
            console.error(strikeResult.message);
            taskManager.writeTodo(todoData);
            todoData = taskManager.readTodo(); // Re-read after update
        } else if (strikeResult.action === 'complete') {
            taskManager.writeTodo(todoData);
            logger.logExit(0, "All strikes completed - project approved");
            logger.save();
            console.log(strikeResult.message + " Stopping.");
            process.exit(0);
        }
        
        // Check if we should inject a review task
        const shouldInjectReview = reviewSystem.shouldInjectReviewTask(todoData);
        logger.logReviewInjection(shouldInjectReview, reviewSystem.getNextStrikeNumber(todoData));
        
        if (shouldInjectReview) {
            const strikeNumber = reviewSystem.getNextStrikeNumber(todoData);
            const reviewTask = reviewSystem.createReviewTask(strikeNumber, todoData.project);
            todoData.tasks.push(reviewTask);
            taskManager.writeTodo(todoData);
            console.error(`Injecting Review Strike ${strikeNumber} task`);
        }
        
        // Find next task
        const currentTask = taskManager.getCurrentTask();
        logger.logCurrentTask(currentTask);
        
        if (!currentTask) {
            logger.logExit(0, "All tasks completed");
            logger.save();
            console.log("All tasks completed!");
            process.exit(0);
        }
        
        // Determine mode
        let mode;
        let modeReason;
        
        if (currentTask.is_review_task) {
            mode = 'REVIEWER';
            modeReason = 'Current task is a review task';
        } else if (todoData.last_mode === 'TASK_CREATION' || !todoData.last_mode) {
            mode = currentTask.mode;
            modeReason = `Using task mode: ${currentTask.mode}`;
        } else {
            mode = 'TASK_CREATION';
            modeReason = 'Alternating to TASK_CREATION mode';
        }
        
        logger.logModeDecision(todoData.last_mode, mode, modeReason);
        
        // Update last mode
        todoData.last_mode = mode;
        
        // Build the prompt
        const fullPrompt = agentExecutor.buildPrompt(currentTask, mode, todoData);
        
        // Update task status
        currentTask.status = 'in_progress';
        taskManager.writeTodo(todoData);
        logger.addFlow(`Updated task ${currentTask.id} status to in_progress`);
        
        // Log prompt generation
        logger.logPromptGeneration(fullPrompt, '');
        
        // Output the prompt for Claude
        console.error(fullPrompt);
        
        // Log exit
        logger.logExit(2, `Continuing with ${mode} mode for task: ${currentTask.title}`);
        logger.save();
        
        // Force continuation with the prompt
        process.exit(2);
        
    } catch (error) {
        logger.logError(error, 'stop-hook-main');
        logger.logExit(0, `Error: ${error.message}`);
        logger.save();
        
        console.error(`Error in stop hook: ${error.message}`);
        console.error(`Stack: ${error.stack}`);
        console.log("Stop hook error - allowing stop");
        process.exit(0);
    }
});