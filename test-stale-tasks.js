#!/usr/bin/env node

const TaskManager = require('./lib/taskManager');

async function testStaleTaskReversion() {
    const tm = new TaskManager('./TODO.json');
    
    console.log('Testing stale task reversion...');
    
    try {
        // First, let's see current task status
        const status = await tm.getTaskStatus();
        console.log('Current task status:', status);
        
        // Check for and revert stale tasks
        const revertedTasks = await tm.revertStaleInProgressTasks();
        
        if (revertedTasks.length > 0) {
            console.log(`✅ Auto-reverted ${revertedTasks.length} stale tasks to pending:`, revertedTasks);
        } else {
            console.log('ℹ️ No stale tasks found to revert');
        }
        
        // Show updated status
        const newStatus = await tm.getTaskStatus();
        console.log('Updated task status:', newStatus);
        
        // Show task details for debugging
        const todoData = await tm.readTodo();
        console.log('\nCurrent tasks:');
        todoData.tasks.forEach(task => {
            console.log(`- ${task.id}: ${task.status} (${task.title})`);
            if (task.started_at) {
                const started = new Date(task.started_at);
                const minutesAgo = Math.round((Date.now() - started.getTime()) / (1000 * 60));
                console.log(`  Started: ${minutesAgo} minutes ago`);
            }
            if (task.reverted_at) {
                console.log(`  Reverted: ${task.reverted_at}`);
                console.log(`  Reason: ${task.revert_reason}`);
            }
        });
        
    } catch (error) {
        console.error('Error testing stale task reversion:', error);
    }
}

// Run if called directly
if (require.main === module) {
    testStaleTaskReversion().then(() => {
        console.log('Test completed');
    }).catch(err => {
        console.error('Test failed:', err);
        process.exit(1);
    });
}

module.exports = testStaleTaskReversion;