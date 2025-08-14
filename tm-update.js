#!/usr/bin/env node

/**
 * TaskManager Task Update Script
 * 
 * Universal script for updating task status - works with any project
 * Usage: node tm-update.js <taskId> <status> [notes] [project-root-path]
 */

const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const PROJECT_ROOT = args[3] || process.cwd(); // Fourth argument or current directory
const TODO_PATH = path.join(PROJECT_ROOT, 'TODO.json');

// Absolute path to the infinite-continue-stop-hook directory (where TaskManager system lives)
const TASKMANAGER_ROOT = __dirname;

// Import TaskManager modules using absolute paths
let TaskManager;

try {
    TaskManager = require(path.join(TASKMANAGER_ROOT, 'lib', 'taskManager.js'));
} catch (error) {
    console.error('Failed to load TaskManager modules:', error.message);
    process.exit(1);
}

async function updateTask() {
    if (args.length < 2) {
        console.error(JSON.stringify({
            success: false,
            error: 'Usage: node tm-update.js <taskId> <status> [notes] [project-root-path]',
            validStatuses: ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'],
            examples: [
                'node tm-update.js task_123 completed',
                'node tm-update.js task_123 completed "Fixed the bug" /path/to/project'
            ]
        }, null, 2));
        process.exit(1);
    }

    const taskId = args[0];
    const status = args[1];
    const notes = args[2] || null;

    // Check if TODO.json exists
    if (!require('fs').existsSync(TODO_PATH)) {
        console.error(JSON.stringify({
            success: false,
            error: `TODO.json not found at ${TODO_PATH}`,
            projectRoot: PROJECT_ROOT,
            suggestion: 'Make sure you are running this script from a project with TODO.json or provide the correct project path'
        }, null, 2));
        process.exit(1);
    }

    try {
        const taskManager = new TaskManager(TODO_PATH, {
            enableMultiAgent: true,
            enableAutoFix: false, // Disable auto-fix for better performance
            validateOnRead: false  // Disable validation for better performance
        });

        // Update task status
        await taskManager.updateTaskStatus(taskId, status);
        
        // Notes functionality not available - just log them
        if (notes) {
            console.log(`Notes: ${notes}`);
        }

        console.log(JSON.stringify({
            success: true,
            taskId: taskId,
            status: status,
            notes: notes,
            message: `Task ${taskId} updated to ${status}`
        }, null, 2));

        // Cleanup
        if (taskManager && typeof taskManager.cleanup === 'function') {
            taskManager.cleanup();
        }

    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            error: error.message,
            taskId: taskId,
            status: status
        }, null, 2));
        process.exit(1);
    }
}

// Run update
updateTask().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
});