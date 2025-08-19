#!/usr/bin/env node

/**
 * Universal TaskManager Command-Line Interface
 * 
 * A unified entry point for all TaskManager operations that can work with any project.
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

function showUsage() {
    console.log(`
TaskManager Universal CLI

Usage: node tm-universal.js <command> [args...] [--project /path/to/project]

Commands:
  init                           Initialize a new agent
  update <taskId> <status> [notes] Update task status
  revert-stale [--minutes=N]     Revert stale in_progress tasks to pending
  api <api-command> [args...]     Direct API access
  
  API Commands:
    current                      Get current active task
    list [filter]               List tasks with optional filter
    create <task-data>          Create new task
    status                      Get system status
    stats                       Get statistics

Options:
  --project /path/to/project    Project root directory (default: current directory)

Examples:
  node tm-universal.js init
  node tm-universal.js update task_123 completed
  node tm-universal.js revert-stale --minutes=15
  node tm-universal.js api current
  node tm-universal.js api list --project /path/to/my-project
  node tm-universal.js update task_456 completed "Fixed bug" --project /path/to/project

Individual Script Usage:
  node tm-init.js [project-root-path]
  node tm-update.js <taskId> <status> [notes] [project-root-path]
  node taskmanager-api.js <command> [args...] [--project-root /path/to/project]
`);
}

function runScript(scriptName, scriptArgs) {
    const scriptPath = path.join(TASKMANAGER_ROOT, scriptName);
    
    return new Promise((resolve, reject) => {
        const child = spawn('node', [scriptPath, ...scriptArgs], {
            stdio: 'inherit'
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Script exited with code ${code}`));
            }
        });
        
        child.on('error', reject);
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