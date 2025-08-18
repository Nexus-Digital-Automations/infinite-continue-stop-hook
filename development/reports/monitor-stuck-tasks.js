#!/usr/bin/env node

/**
 * Stuck Task Monitor
 * 
 * This script monitors for stuck tasks and provides intervention guidance.
 * Can be integrated with the hook system to automatically detect and help
 * with repetitive task patterns.
 */

const path = require('path');
const TaskManager = require('./lib/taskManager');

async function main() {
    const args = process.argv.slice(2);
    const projectRoot = args[0] || process.cwd();
    const agentId = args[1] || process.env.CLAUDE_AGENT_ID || 'default_agent';
    
    const todoPath = path.join(projectRoot, 'TODO.json');
    const tm = new TaskManager(todoPath);
    
    try {
        const guidance = await tm.getTaskContinuationGuidance(agentId);
        
        if (guidance.action === 'stuck_task_intervention') {
            console.log('🚨 STUCK TASK DETECTED!');
            console.log(`Task: ${guidance.task.title}`);
            console.log(`Repetition Count: ${guidance.repetitionCount}`);
            console.log('\n' + guidance.instructions);
            
            // Exit with special code to indicate intervention is needed
            process.exit(2);
        } else if (guidance.action === 'continue_task') {
            console.log('✅ Normal task continuation');
            console.log(`Current Task: ${guidance.task.title}`);
            process.exit(0);
        } else if (guidance.action === 'start_new_task') {
            console.log('🆕 New task available');
            console.log(`Next Task: ${guidance.task.title}`);
            process.exit(0);
        } else {
            console.log('📭 No tasks available');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('Error monitoring tasks:', error.message);
        process.exit(3);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };