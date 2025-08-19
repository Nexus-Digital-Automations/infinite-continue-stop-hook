#!/usr/bin/env node

/**
 * Simple CLI tool to manually revert stale in_progress tasks to pending
 * Usage: node revert-stale-tasks.js [--minutes=30] [--dry-run]
 */

const TaskManager = require('./lib/taskManager');

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        minutes: 30,
        dryRun: false,
        verbose: false,
        projectRoot: process.cwd()
    };
    
    args.forEach(arg => {
        if (arg.startsWith('--minutes=')) {
            options.minutes = parseInt(arg.split('=')[1], 10) || 30;
        } else if (arg.startsWith('--project-root=')) {
            options.projectRoot = arg.split('=')[1];
        } else if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '--verbose' || arg === '-v') {
            options.verbose = true;
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
Usage: node revert-stale-tasks.js [options]

Options:
  --minutes=N    Revert tasks in_progress for N minutes (default: 30)
  --dry-run      Show what would be reverted without making changes
  --verbose, -v  Show detailed output
  --help, -h     Show this help message

Examples:
  node revert-stale-tasks.js                 # Revert tasks older than 30 minutes
  node revert-stale-tasks.js --minutes=15    # Revert tasks older than 15 minutes
  node revert-stale-tasks.js --dry-run       # Preview what would be reverted
`);
            process.exit(0);
        }
    });
    
    return options;
}

async function revertStaleTasksCustom(minutes = 30, dryRun = false, projectRoot = process.cwd()) {
    const todoPath = require('path').join(projectRoot, 'TODO.json');
    const tm = new TaskManager(todoPath);
    const todoData = await tm.readTodoFast();
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    
    const staleTasks = [];
    
    for (const task of todoData.tasks) {
        if (task.status === 'in_progress' && task.started_at) {
            const startedTime = new Date(task.started_at);
            if (startedTime <= cutoffTime) {
                staleTasks.push({
                    id: task.id,
                    title: task.title,
                    started_at: task.started_at,
                    minutesInProgress: Math.round((Date.now() - startedTime.getTime()) / (60 * 1000)),
                    assigned_agent: task.assigned_agent
                });
            }
        }
    }
    
    if (staleTasks.length === 0) {
        console.log(`ℹ️  No tasks found that have been in_progress for ${minutes}+ minutes`);
        return [];
    }
    
    console.log(`Found ${staleTasks.length} stale task(s) in_progress for ${minutes}+ minutes:`);
    staleTasks.forEach(task => {
        console.log(`  • ${task.id} (${task.minutesInProgress}m) - ${task.title}`);
        if (task.assigned_agent) {
            console.log(`    Assigned to: ${task.assigned_agent}`);
        }
    });
    
    if (dryRun) {
        console.log('\n🔍 DRY RUN - No changes made');
        return staleTasks.map(t => t.id);
    }
    
    // Actually revert the tasks
    const revertedIds = await tm.revertStaleInProgressTasks();
    
    if (revertedIds.length > 0) {
        console.log(`\n✅ Successfully reverted ${revertedIds.length} task(s) to pending status`);
    }
    
    return revertedIds;
}

async function main() {
    const options = parseArgs();
    
    if (options.verbose) {
        console.log(`Configuration:
  Minutes threshold: ${options.minutes}
  Dry run: ${options.dryRun}
  Verbose: ${options.verbose}
`);
    }
    
    try {
        const revertedIds = await revertStaleTasksCustom(options.minutes, options.dryRun, options.projectRoot);
        
        if (options.verbose && revertedIds.length > 0) {
            console.log('\nReverted task IDs:', revertedIds);
            
            // Show updated task status
            const todoPath = require('path').join(options.projectRoot, 'TODO.json');
            const tm = new TaskManager(todoPath);
            const status = await tm.getTaskStatus();
            console.log('\nUpdated task status:', status);
        }
        
    } catch (error) {
        console.error('❌ Error reverting stale tasks:', error.message);
        if (options.verbose) {
            console.error(error);
        }
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { revertStaleTasksCustom };