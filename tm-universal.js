#!/usr/bin/env node

/**
 * Universal TaskManager Command-Line Interface
 * 
 * === OVERVIEW ===
 * Unified entry point for all TaskManager operations that provides a consistent
 * interface across different projects. Acts as a command router that delegates
 * operations to specialized scripts while maintaining project context and
 * providing centralized error handling.
 * 
 * === KEY FEATURES ===
 * • Universal project support - works with any project containing TODO.json
 * • Command delegation - routes to specialized scripts for specific operations
 * • Project context management - maintains --project parameter across operations
 * • Centralized error handling - consistent error reporting and recovery
 * • Script orchestration - coordinates multiple TaskManager utilities
 * • Path resolution - handles absolute and relative project paths
 * 
 * === SUPPORTED COMMANDS ===
 * • init - Initialize new agent for project
 * • update - Update task status with optional notes
 * • revert-stale - Revert stale in_progress tasks to pending
 * • api - Direct access to TaskManager API commands
 * 
 * === SCRIPT DELEGATION ===
 * • tm-init.js - Agent initialization
 * • tm-update.js - Task status updates  
 * • revert-stale-tasks.js - Stale task cleanup
 * • taskmanager-api.js - Full API access
 * 
 * === PROJECT CONTEXT ===
 * The --project parameter is automatically passed to all delegated scripts,
 * ensuring consistent project binding across operations. This enables the
 * centralized TaskManager system to work with any project.
 * 
 * === ERROR HANDLING ===
 * • Process exit codes for CI/CD integration
 * • Detailed error messages with context
 * • Script failure detection and reporting
 * • Graceful degradation for missing dependencies
 * 
 * === USAGE PATTERNS ===
 * 1. Agent Management:
 *    node tm-universal.js init --project /path/to/project
 * 
 * 2. Task Operations:
 *    node tm-universal.js update task_123 completed
 *    node tm-universal.js api list '{"status": "pending"}'
 * 
 * 3. Maintenance:
 *    node tm-universal.js revert-stale --minutes=15
 * 
 * @author TaskManager System
 * @version 2.0.0
 * @since 2024-01-01
 * 
 * Usage: node tm-universal.js <command> [args...] [--project /path/to/project]
 */

const path = require('path');
const { spawn } = require('child_process');

// Parse arguments
const args = process.argv.slice(2);
const projectIndex = args.indexOf('--project');
const projectRoot = (projectIndex !== -1 && projectIndex + 1 < args.length) 
    ? args[projectIndex + 1] 
    : process.cwd();

// Remove --project and its value from args
if (projectIndex !== -1) {
    args.splice(projectIndex, 2);
}

const command = args[0];
const commandArgs = args.slice(1);

// Script directory (where TaskManager system lives)
const TASKMANAGER_ROOT = __dirname;

/**
 * Display comprehensive usage information for the Universal CLI
 * 
 * === PURPOSE ===
 * Provides detailed help documentation for all available commands,
 * options, and usage patterns. Essential for user onboarding and
 * reference during development workflows.
 * 
 * === HELP CATEGORIES ===
 * • Command overview with descriptions
 * • API sub-commands for direct system access
 * • Options and parameter explanations
 * • Real-world usage examples
 * • Individual script usage patterns
 * 
 * === USAGE GUIDANCE ===
 * • Common workflow patterns
 * • Project context management
 * • Error handling examples
 * • Integration with other tools
 * 
 * @function showUsage
 * @memberof UniversalCLI
 */
function showUsage() {
    console.log(`
TaskManager Universal CLI - Centralized Task Management Interface

Usage: node tm-universal.js <command> [args...] [--project /path/to/project]

=== CORE COMMANDS ===
  init                           Initialize a new agent for the project
  update <taskId> <status> [notes] Update task status with optional completion notes
  revert-stale [--minutes=N]     Revert stale in_progress tasks to pending status
  api <api-command> [args...]     Direct access to TaskManager API operations
  
=== API COMMANDS (via 'api' subcommand) ===
  current                        Get current active task for agent
  list [filter]                 List tasks with optional JSON filter criteria
  create <task-data>            Create new task with JSON task definition
  status                        Get comprehensive system status
  stats                         Get orchestration and performance statistics

=== OPTIONS ===
  --project /path/to/project    Project root directory (default: current directory)

=== EXAMPLES ===
  # Agent initialization
  node tm-universal.js init
  node tm-universal.js init --project /path/to/my-project
  
  # Task status management
  node tm-universal.js update task_123 completed
  node tm-universal.js update task_123 completed "Fixed the bug" --project /path/to/project
  
  # System maintenance
  node tm-universal.js revert-stale --minutes=15
  
  # API operations
  node tm-universal.js api current
  node tm-universal.js api list '{"status": "pending"}'
  node tm-universal.js api create '{"title": "New task", "category": "enhancement"}'
  node tm-universal.js api list --project /path/to/my-project

=== INDIVIDUAL SCRIPT USAGE (for direct access) ===
  node tm-init.js [project-root-path]
  node tm-update.js <taskId> <status> [notes] [project-root-path]
  node taskmanager-api.js <command> [args...] [--project-root /path/to/project]

=== INTEGRATION PATTERNS ===
  # CI/CD pipeline integration
  tm-universal.js api list '{"status": "pending"}' | jq .count
  
  # Batch operations
  for task in $(tm-universal.js api list | jq -r '.tasks[].id'); do
    tm-universal.js update $task completed
  done
`);
}

/**
 * Execute a delegated TaskManager script with proper error handling
 * 
 * === PURPOSE ===
 * Provides a centralized way to execute specialized TaskManager scripts
 * while maintaining consistent error handling, process management, and
 * output streaming. This is the core delegation mechanism.
 * 
 * === EXECUTION STRATEGY ===
 * • Child process spawning for isolation
 * • Stdio inheritance for real-time output
 * • Exit code monitoring for error detection
 * • Process error handling with detailed reporting
 * 
 * === ERROR HANDLING ===
 * • Non-zero exit codes trigger rejection
 * • Process spawn errors are caught and propagated
 * • Detailed error context with script name and exit code
 * • Clean process cleanup on completion or failure
 * 
 * @param {string} scriptName - Name of script file to execute (e.g., 'tm-init.js')
 * @param {Array} scriptArgs - Arguments to pass to the script
 * @returns {Promise<void>} Resolves on successful execution, rejects on error
 * @throws {Error} If script execution fails or returns non-zero exit code
 * 
 * @example
 * // Execute agent initialization
 * await runScript('tm-init.js', ['/path/to/project']);
 * 
 * @example
 * // Execute API command with arguments
 * await runScript('taskmanager-api.js', ['list', '{"status": "pending"}']);
 */
function runScript(scriptName, scriptArgs) {
    // Resolve full path to script in TaskManager system directory
    const scriptPath = path.join(TASKMANAGER_ROOT, scriptName);
    
    return new Promise((resolve, reject) => {
        // Spawn child process with stdio inheritance for real-time output
        const child = spawn('node', [scriptPath, ...scriptArgs], {
            stdio: 'inherit'  // Inherit stdin, stdout, stderr for interactive behavior
        });
        
        // Handle process completion
        child.on('close', (code) => {
            if (code === 0) {
                resolve();  // Success - script completed normally
            } else {
                reject(new Error(`Script ${scriptName} exited with code ${code}`));
            }
        });
        
        // Handle process spawn errors
        child.on('error', (error) => {
            reject(new Error(`Failed to execute script ${scriptName}: ${error.message}`));
        });
    });
}

async function main() {
    if (!command || command === 'help' || command === '--help' || command === '-h') {
        showUsage();
        return;
    }

    try {
        switch (command) {
            case 'init':
                await runScript('tm-init.js', [projectRoot]);
                break;
            
            case 'update': {
                if (commandArgs.length < 2) {
                    console.error('Error: update command requires taskId and status');
                    console.error('Usage: node tm-universal.js update <taskId> <status> [notes]');
                    process.exit(1);
                }
                // tm-update.js expects: taskId, status, notes, projectRoot
                const updateArgs = [commandArgs[0], commandArgs[1], commandArgs[2] || '', projectRoot];
                await runScript('tm-update.js', updateArgs);
                break;
            }
            
            case 'revert-stale': {
                // Handle revert-stale command with optional --minutes parameter
                const revertArgs = commandArgs.concat(['--project-root', projectRoot]);
                await runScript('revert-stale-tasks.js', revertArgs);
                break;
            }
            
            case 'api':
                if (commandArgs.length === 0) {
                    console.error('Error: api command requires a sub-command');
                    console.error('Usage: node tm-universal.js api <api-command> [args...]');
                    process.exit(1);
                }
                await runScript('taskmanager-api.js', commandArgs.concat(['--project-root', projectRoot]));
                break;
            
            default:
                console.error(`Error: Unknown command '${command}'`);
                showUsage();
                process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
});