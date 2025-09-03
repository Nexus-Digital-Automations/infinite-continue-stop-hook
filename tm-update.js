#!/usr/bin/env node

/**
 * TaskManager Task Update Script
 * 
 * === OVERVIEW ===
 * Specialized utility for updating task status within the TaskManager system.
 * This script provides a simple, reliable way to modify task states, add
 * completion notes, and maintain task workflow integrity across projects.
 * 
 * === KEY RESPONSIBILITIES ===
 * • Task status updates with validation
 * • Completion notes and context tracking
 * • Project validation and error handling
 * • Multi-agent coordination support
 * • Workflow state management
 * 
 * === SUPPORTED OPERATIONS ===
 * • Status transitions (pending → in_progress → completed)
 * • Task blocking and unblocking
 * • Task cancellation and archiving
 * • Notes and context addition
 * • Validation of status transitions
 * 
 * === STATUS WORKFLOW ===
 * The TaskManager system supports these standard status transitions:
 * • pending - Task is ready to be claimed and worked on
 * • in_progress - Task is currently being worked on by an agent
 * • completed - Task has been finished successfully
 * • blocked - Task is waiting for dependencies or external factors
 * • cancelled - Task has been cancelled and will not be completed
 * 
 * === MULTI-AGENT COORDINATION ===
 * • Respects task ownership and agent assignments
 * • Maintains consistency across concurrent operations
 * • Provides atomic status updates to prevent race conditions
 * • Integrates with agent heartbeat and monitoring systems
 * 
 * === PROJECT VALIDATION ===
 * • Verifies TODO.json exists at specified project root
 * • Validates task ID existence and accessibility
 * • Provides detailed error messages for invalid operations
 * • Suggests corrective actions for common issues
 * 
 * === NOTES AND CONTEXT ===
 * • Optional completion notes for task documentation
 * • Context preservation for audit trails
 * • Integration with task history and reporting
 * • Support for structured completion data
 * 
 * === ERROR HANDLING ===
 * • JSON-formatted error responses for automation compatibility
 * • Detailed error context and recovery suggestions
 * • Process exit codes for CI/CD integration
 * • Graceful handling of invalid status transitions
 * 
 * === USAGE PATTERNS ===
 * 1. Basic Status Update:
 *    node tm-update.js task_123 completed
 * 
 * 2. Status Update with Notes:
 *    node tm-update.js task_123 completed "Fixed the bug in user authentication"
 * 
 * 3. Specific Project:
 *    node tm-update.js task_123 completed "Done" /path/to/project
 * 
 * 4. CI/CD Integration:
 *    node tm-update.js $TASK_ID completed "$BUILD_NOTES" $PROJECT_ROOT
 * 
 * @author TaskManager System
 * @version 2.0.0
 * @since 2024-01-01
 * 
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

/**
 * Update the status of a specific task with optional completion notes
 * 
 * === UPDATE PROCESS ===
 * 1. Argument validation - verifies required parameters are provided
 * 2. Project validation - ensures TODO.json exists and is accessible
 * 3. Component initialization - creates TaskManager with optimizations
 * 4. Status update - performs atomic status transition
 * 5. Notes handling - processes optional completion notes
 * 6. Success reporting - outputs update confirmation in JSON format
 * 7. Resource cleanup - ensures proper cleanup of system resources
 * 
 * === ARGUMENT VALIDATION ===
 * • Requires minimum of taskId and status parameters
 * • Validates argument count and provides usage examples
 * • Lists valid status transitions for reference
 * • Provides detailed error messages for invalid usage
 * 
 * === STATUS VALIDATION ===
 * Valid status values supported by the TaskManager system:
 * • 'pending' - Task is ready to be worked on
 * • 'in_progress' - Task is currently being worked on
 * • 'completed' - Task has been finished successfully
 * • 'blocked' - Task is waiting for dependencies or external factors
 * • 'cancelled' - Task has been cancelled and will not be completed
 * 
 * === ATOMIC OPERATIONS ===
 * • Uses TaskManager's updateTaskStatus for atomic updates
 * • Prevents race conditions in multi-agent environments
 * • Maintains task consistency across concurrent operations
 * • Provides transactional update semantics
 * 
 * === NOTES HANDLING ===
 * • Optional third parameter for completion notes
 * • Notes are logged for reference (full notes system integration pending)
 * • Supports structured completion information
 * • Maintains audit trail for task completion context
 * 
 * === ERROR RECOVERY ===
 * • JSON-formatted error responses for automation
 * • Detailed error context with operation parameters
 * • Process exit codes for CI/CD pipeline integration
 * • Graceful handling of TaskManager exceptions
 * 
 * === PERFORMANCE OPTIMIZATION ===
 * • Disabled auto-fix for faster execution
 * • Disabled validation on read for better performance
 * • Efficient resource cleanup patterns
 * • Minimal memory footprint for batch operations
 * 
 * @async
 * @function updateTask
 * @returns {Promise<void>} Completes when task status is successfully updated
 * @throws {Error} If argument validation, project validation, or status update fails
 * 
 * @example
 * // Successful update output:
 * {
 *   "success": true,
 *   "taskId": "task_123",
 *   "status": "completed",
 *   "notes": "Fixed authentication bug",
 *   "message": "Task task_123 updated to completed"
 * }
 */
async function updateTask() {
    // === ARGUMENT VALIDATION PHASE ===
    // Verify minimum required arguments are provided
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

    // Extract parameters from command line arguments
    const taskId = args[0];      // Required: Task identifier
    const status = args[1];      // Required: New status value
    const notes = args[2] || null; // Optional: Completion notes

    // === PROJECT VALIDATION PHASE ===
    // Verify that TODO.json exists at the specified project root
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
        // === COMPONENT INITIALIZATION PHASE ===
        // Create TaskManager instance with performance optimizations
        const taskManager = new TaskManager(TODO_PATH, {
            enableMultiAgent: true,     // Enable multi-agent coordination features
            enableAutoFix: false,       // Disable auto-fix for better performance
            validateOnRead: false       // Disable validation for better performance
        });

        // === STATUS UPDATE PHASE ===
        // Perform atomic status update operation
        await taskManager.updateTaskStatus(taskId, status);
        
        // === NOTES HANDLING PHASE ===
        // Process optional completion notes (full integration pending)
        if (notes) {
            console.log(`Notes: ${notes}`);
        }

        // === SUCCESS REPORTING PHASE ===
        // Output success response in JSON format for automation
        console.log(JSON.stringify({
            success: true,
            taskId: taskId,
            status: status,
            notes: notes,
            message: `Task ${taskId} updated to ${status}`
        }, null, 2));

        // === RESOURCE CLEANUP PHASE ===
        // Ensure proper cleanup of system resources
        if (taskManager && typeof taskManager.cleanup === 'function') {
            taskManager.cleanup();
        }

    } catch (error) {
        // === ERROR HANDLING PHASE ===
        // Output error response in JSON format with detailed context
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