#!/usr/bin/env node

/**
 * Task Repetition Checker
 * 
 * Utility script to check for task repetition patterns and get statistics
 * about potential stuck tasks.
 */

const path = require('path');
const TaskManager = require('./lib/taskManager');

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'stats';
    const projectRoot = args[1] || process.cwd();
    
    const todoPath = path.join(projectRoot, 'TODO.json');
    const tm = new TaskManager(todoPath);
    
    try {
        switch (command) {
            case 'stats':
                await showRepetitionStats(tm);
                break;
            case 'check': {
                const taskId = args[1];
                const agentId = args[2] || 'default_agent';
                if (!taskId) {
                    console.error('Usage: node check-repetition.js check <task_id> [agent_id]');
                    process.exit(1);
                }
                await checkSpecificTask(tm, taskId, agentId);
                break;
            }
            case 'cleanup': {
                const days = parseInt(args[1]) || 7;
                await cleanupOldData(tm, days);
                break;
            }
            case 'help':
                showHelp();
                break;
            default:
                console.error(`Unknown command: ${command}`);
                showHelp();
                process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

async function showRepetitionStats(tm) {
    console.log('📊 Task Repetition Statistics\n');
    
    const stats = await tm.getRepetitionStatistics();
    
    console.log(`Total Tasks: ${stats.totalTasks}`);
    console.log(`Tasks with Access History: ${stats.tasksWithAccessHistory}`);
    console.log(`Tasks with Interventions: ${stats.tasksWithInterventions}`);
    console.log(`Total Interventions: ${stats.totalInterventions}\n`);
    
    if (stats.mostAccessedTasks.length > 0) {
        console.log('🔄 Most Accessed Tasks:');
        stats.mostAccessedTasks.forEach((task, index) => {
            console.log(`${index + 1}. ${task.title} (${task.id})`);
            console.log(`   Accesses: ${task.accessCount}, Status: ${task.status}`);
        });
        console.log();
    }
    
    if (stats.recentInterventions.length > 0) {
        console.log('🚨 Recent Interventions:');
        stats.recentInterventions.forEach((intervention, index) => {
            const date = new Date(intervention.timestamp).toLocaleString();
            console.log(`${index + 1}. ${intervention.taskTitle} (${intervention.taskId})`);
            console.log(`   Type: ${intervention.type}, Agent: ${intervention.agentId}`);
            console.log(`   Time: ${date}`);
        });
        console.log();
    }
}

async function checkSpecificTask(tm, taskId, agentId) {
    console.log(`🔍 Checking Task Repetition: ${taskId}\n`);
    
    const repetitionCheck = await tm.checkTaskRepetition(taskId, agentId);
    
    console.log(`Agent ID: ${agentId}`);
    console.log(`Is Stuck: ${repetitionCheck.isStuck ? '🚨 YES' : '✅ NO'}`);
    console.log(`Access Count: ${repetitionCheck.count}`);
    console.log(`Reason: ${repetitionCheck.reason}`);
    
    if (repetitionCheck.lastAccess) {
        console.log(`Last Access: ${new Date(repetitionCheck.lastAccess).toLocaleString()}`);
    }
    
    if (repetitionCheck.timeSpan) {
        const hours = Math.round(repetitionCheck.timeSpan / (1000 * 60 * 60) * 100) / 100;
        console.log(`Time Span: ${hours} hours`);
    }
    
    console.log();
    
    if (repetitionCheck.isStuck) {
        console.log('⚠️  This task appears to be stuck!');
        console.log('Consider:');
        console.log('- Breaking it down into smaller tasks');
        console.log('- Marking it as completed if work is done');
        console.log('- Moving to a different task if blocked');
        console.log('\nCompletion command:');
        console.log(`node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.updateTaskStatus('${taskId}', 'completed').then(() => console.log('Task marked as completed'));"`);
    }
}

async function cleanupOldData(tm, days) {
    console.log(`🧹 Cleaning up tracking data older than ${days} days...\n`);
    
    const result = await tm.cleanupTrackingData(days);
    
    console.log(`Cleaned ${result.cleanedRecords} old tracking records.`);
}

function showHelp() {
    console.log('Task Repetition Checker\n');
    console.log('Usage:');
    console.log('  node check-repetition.js [command] [args]\n');
    console.log('Commands:');
    console.log('  stats                     Show repetition statistics');
    console.log('  check <task_id> [agent]   Check specific task for repetition');
    console.log('  cleanup [days]            Clean up tracking data (default: 7 days)');
    console.log('  help                      Show this help message\n');
    console.log('Examples:');
    console.log('  node check-repetition.js stats');
    console.log('  node check-repetition.js check task_123 agent_1');
    console.log('  node check-repetition.js cleanup 14');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, showRepetitionStats, checkSpecificTask, cleanupOldData };