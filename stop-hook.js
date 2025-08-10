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

process.stdin.on('end', async () => {
    const workingDir = process.cwd();
    const logger = new Logger(workingDir);
    
    try {
        const hookInput = JSON.parse(inputData);
        const { session_id: _session_id, transcript_path: _transcript_path, stop_hook_active, hook_event_name } = hookInput;
        
        // Log input with event details
        logger.logInput(hookInput);
        logger.addFlow(`Received ${hook_event_name || 'unknown'} event from Claude Code`);
        
        // Intelligent infinite loop prevention with 3-second timing
        if (stop_hook_active) {
            // First check if TODO.json exists to get timing data
            const todoPath = path.join(workingDir, 'TODO.json');
            if (fs.existsSync(todoPath)) {
                try {
                    const todoData = JSON.parse(fs.readFileSync(todoPath, 'utf8'));
                    const now = Date.now();
                    const lastActivation = todoData.last_hook_activation || 0;
                    const timeSinceLastCall = now - lastActivation;
                    
                    if (timeSinceLastCall < 3000) {
                        // Called within 3 seconds - approve the stop (likely infinite loop)
                        logger.addFlow(`Rapid successive call detected (${timeSinceLastCall}ms) - allowing stop`);
                        logger.logExit(0, "Rapid successive calls detected - preventing infinite loop");
                        logger.save();
                        console.error("Rapid successive calls detected, allowing stop");
                        process.exit(0);
                    } else {
                        // More than 3 seconds - continue normally
                        logger.addFlow(`Normal timing detected (${timeSinceLastCall}ms) - continuing with caution`);
                    }
                } catch (error) {
                    // If we can't read TODO.json, use conservative approach
                    logger.addFlow(`Could not read TODO.json for timing check - allowing stop: ${error.message}`);
                    logger.logExit(0, "Could not validate timing - allowing stop");
                    logger.save();
                    console.error("Could not validate timing, allowing stop");
                    process.exit(0);
                }
            } else {
                // No TODO.json means this isn't our project - allow stop
                logger.addFlow("No TODO.json found - allowing stop");
                logger.logExit(0, "No TODO.json found");
                logger.save();
                console.error("No TODO.json found, allowing stop");
                process.exit(0);
            }
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
        let todoData = await taskManager.readTodo();
        logger.logProjectState(todoData, todoPath);
        
        // Initialize execution count if not present
        if (typeof todoData.execution_count !== 'number') {
            todoData.execution_count = 0;
        }
        
        // Handle strike reset logic
        const strikeResult = taskManager.handleStrikeLogic(todoData);
        logger.logStrikeHandling(strikeResult, todoData);
        
        if (strikeResult.action === 'reset') {
            console.error(strikeResult.message);
            await taskManager.writeTodo(todoData);
            todoData = await taskManager.readTodo(); // Re-read after update
        } else if (strikeResult.action === 'complete') {
            await taskManager.writeTodo(todoData);
            logger.logExit(0, "All strikes completed - project approved");
            logger.save();
            console.log(strikeResult.message + " Stopping.");
            process.exit(0);
        }
        
        // Check strike quality before proceeding - inject quality improvement task if needed
        const qualityResults = await reviewSystem.checkStrikeQuality(workingDir);
        logger.addFlow(`Quality check results: Strike1=${qualityResults.strike1?.quality}%, Strike2=${qualityResults.strike2?.quality}%, Strike3=${qualityResults.strike3?.quality}%, Overall Ready=${qualityResults.overallReady}`);
        
        // If quality is not 100% for all strikes, inject quality improvement task
        if (!qualityResults.overallReady) {
            // Check if we already have a quality improvement task pending
            const hasQualityTask = todoData.tasks.some(task => 
                task.is_quality_improvement_task && 
                (task.status === 'pending' || task.status === 'in_progress')
            );
            
            if (!hasQualityTask) {
                logger.addFlow('Quality issues detected - injecting quality improvement task');
                todoData = reviewSystem.injectQualityImprovementTask(todoData, qualityResults, todoData.project);
                await taskManager.writeTodo(todoData);
                console.error(`Quality issues detected - injecting quality improvement task`);
            } else {
                logger.addFlow('Quality improvement task already exists');
            }
        }
        
        // Check if we should inject a review task (only if quality is ready)
        if (qualityResults.overallReady) {
            const shouldInjectReview = reviewSystem.shouldInjectReviewTask(todoData);
            logger.logReviewInjection(shouldInjectReview, reviewSystem.getNextStrikeNumber(todoData));
            
            if (shouldInjectReview) {
                const strikeNumber = reviewSystem.getNextStrikeNumber(todoData);
                const reviewTask = reviewSystem.createReviewTask(strikeNumber, todoData.project);
                // Use the insertTasksBeforeStrikes method to maintain proper ordering
                todoData = reviewSystem.insertTasksBeforeStrikes(todoData, [reviewTask]);
                await taskManager.writeTodo(todoData);
                console.error(`Injecting Review Strike ${strikeNumber} task`);
            }
        }
        
        // Find next task
        const currentTask = await taskManager.getCurrentTask();
        logger.logCurrentTask(currentTask);
        
        if (!currentTask) {
            logger.logExit(0, "All tasks completed");
            logger.save();
            console.log("All tasks completed!");
            process.exit(0);
        }
        
        // Increment execution count and update timing for infinite loop prevention
        todoData.execution_count++;
        todoData.last_hook_activation = Date.now();
        
        // Determine mode
        let mode;
        let modeReason;
        
        if (currentTask.is_review_task) {
            mode = 'REVIEWER';
            modeReason = 'Current task is a review task';
        } else if (todoData.execution_count % 4 === 0) {
            mode = 'TASK_CREATION';
            modeReason = `Every 4th execution: entering TASK_CREATION mode (count: ${todoData.execution_count})`;
        } else {
            mode = currentTask.mode;
            modeReason = `Using task mode: ${currentTask.mode} (execution ${todoData.execution_count})`;
        }
        
        logger.logModeDecision(todoData.last_mode, mode, modeReason);
        
        // Update last mode
        todoData.last_mode = mode;
        
        // Build the prompt with linter feedback
        const fullPrompt = await agentExecutor.buildPrompt(currentTask, mode, todoData, taskManager);
        
        // Update task status
        currentTask.status = 'in_progress';
        await taskManager.writeTodo(todoData);
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