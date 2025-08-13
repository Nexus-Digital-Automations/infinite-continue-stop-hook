#!/usr/bin/env node

/**
 * TaskManager Task Update Script
 * 
 * Simple Node.js command for updating task status without bash wrapper
 * Usage: node tm-update.js <taskId> <status> [notes]
 */

const path = require('path');

// Absolute path to the infinite-continue-stop-hook directory
const TASKMANAGER_ROOT = '/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook';
const TODO_PATH = path.join(TASKMANAGER_ROOT, 'TODO.json');

// Import TaskManager modules using absolute paths
let TaskManager;

try {
    TaskManager = require(path.join(TASKMANAGER_ROOT, 'lib', 'taskManager.js'));
} catch (error) {
    console.error('Failed to load TaskManager modules:', error.message);
    process.exit(1);
}

async function updateTask() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error(JSON.stringify({
            success: false,
            error: 'Usage: node tm-update.js <taskId> <status> [notes]',
            validStatuses: ['pending', 'in_progress', 'completed', 'blocked', 'cancelled']
        }, null, 2));
        process.exit(1);
    }

    const taskId = args[0];
    const status = args[1];
    const notes = args[2] || null;

    try {
        const taskManager = new TaskManager(TODO_PATH, {
            enableMultiAgent: true,
            enableAutoFix: true
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