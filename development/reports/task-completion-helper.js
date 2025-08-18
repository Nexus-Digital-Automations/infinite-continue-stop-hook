#!/usr/bin/env node

/**
 * Task Completion Helper
 * 
 * Interactive script to help agents complete stuck or repetitive tasks.
 * Provides step-by-step guidance and completion commands.
 */

const path = require('path');
const TaskManager = require('./lib/taskManager');

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'guide';
    
    switch (command) {
        case 'guide':
            await interactiveGuidance(args[1], args[2]);
            break;
        case 'complete':
            await quickComplete(args[1], args[2]);
            break;
        case 'breakdown':
            await breakdownTask(args[1]);
            break;
        case 'help':
            showHelp();
            break;
        default:
            console.error(`Unknown command: ${command}`);
            showHelp();
            process.exit(1);
    }
}

async function interactiveGuidance(taskId, agentId) {
    if (!taskId) {
        console.error('Usage: node task-completion-helper.js guide <task_id> [agent_id]');
        process.exit(1);
    }
    
    const projectRoot = process.cwd();
    const todoPath = path.join(projectRoot, 'TODO.json');
    const tm = new TaskManager(todoPath);
    const agent = agentId || 'default_agent';
    
    try {
        const todoData = await tm.readTodo();
        const task = todoData.tasks.find(t => t.id === taskId);
        
        if (!task) {
            console.error(`Task not found: ${taskId}`);
            process.exit(1);
        }
        
        console.log('🎯 Task Completion Guidance\n');
        console.log(`Task: ${task.title}`);
        console.log(`Status: ${task.status}`);
        console.log(`Priority: ${task.priority || 'medium'}`);
        console.log(`Mode: ${task.mode}\n`);
        
        if (task.description) {
            console.log('📝 Description:');
            console.log(task.description + '\n');
        }
        
        // Check for repetition
        const repetitionCheck = await tm.checkTaskRepetition(taskId, agent);
        if (repetitionCheck.isStuck) {
            console.log('🚨 REPETITION DETECTED!');
            console.log(`This task has been accessed ${repetitionCheck.count} times recently.`);
            console.log('This suggests the task may be stuck or needs intervention.\n');
        }
        
        // Show success criteria
        if (task.success_criteria && task.success_criteria.length > 0) {
            console.log('✅ Success Criteria:');
            task.success_criteria.forEach((criteria, index) => {
                console.log(`${index + 1}. ${criteria}`);
            });
            console.log();
        }
        
        // Show important files
        if (task.important_files && task.important_files.length > 0) {
            console.log('📁 Important Files:');
            task.important_files.forEach(file => {
                console.log(`- ${file}`);
            });
            console.log();
        }
        
        // Show dependencies
        if (task.dependencies && task.dependencies.length > 0) {
            console.log('🔗 Dependencies:');
            for (const depId of task.dependencies) {
                const depTask = todoData.tasks.find(t => t.id === depId);
                if (depTask) {
                    const status = depTask.status === 'completed' ? '✅' : '⏳';
                    console.log(`${status} ${depTask.title} (${depId})`);
                } else {
                    console.log(`❓ Unknown dependency: ${depId}`);
                }
            }
            console.log();
        }
        
        console.log('💡 Completion Options:\n');
        
        console.log('1. Mark as Completed (if work is done):');
        console.log(`   node task-completion-helper.js complete ${taskId}\n`);
        
        console.log('2. Break Down Task (if too complex):');
        console.log(`   node task-completion-helper.js breakdown ${taskId}\n`);
        
        console.log('3. Update Task Status:');
        console.log(`   node -e "const tm = require('./lib/taskManager'); new tm('./TODO.json').updateTaskStatus('${taskId}', 'STATUS').then(() => console.log('Updated'));"\n`);
        
        console.log('4. Add Progress Notes:');
        console.log(`   node -e "const tm = require('./lib/taskManager'); new tm('./TODO.json').modifyTask('${taskId}', {appendDescription: 'Progress update: YOUR_NOTES'}).then(() => console.log('Added notes'));"\n`);
        
        if (repetitionCheck.isStuck) {
            console.log('⚠️  Recommended Action:');
            console.log('Since this task shows repetition patterns, consider:');
            console.log('- Completing it if work is actually done');
            console.log('- Breaking it into smaller, more specific tasks');
            console.log('- Moving to a different task if blocked');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

async function quickComplete(taskId, reason) {
    if (!taskId) {
        console.error('Usage: node task-completion-helper.js complete <task_id> [reason]');
        process.exit(1);
    }
    
    const projectRoot = process.cwd();
    const todoPath = path.join(projectRoot, 'TODO.json');
    const tm = new TaskManager(todoPath);
    
    try {
        const success = await tm.updateTaskStatus(taskId, 'completed', {
            agentId: 'completion_helper',
            reason: reason || 'Manually completed via helper script'
        });
        
        if (success) {
            console.log(`✅ Task ${taskId} marked as completed!`);
            if (reason) {
                console.log(`Reason: ${reason}`);
            }
        } else {
            console.error(`❌ Failed to complete task ${taskId}. Task may not exist.`);
            process.exit(1);
        }
        
    } catch (error) {
        console.error('Error completing task:', error.message);
        process.exit(1);
    }
}

async function breakdownTask(taskId) {
    if (!taskId) {
        console.error('Usage: node task-completion-helper.js breakdown <task_id>');
        process.exit(1);
    }
    
    const projectRoot = process.cwd();
    const todoPath = path.join(projectRoot, 'TODO.json');
    const tm = new TaskManager(todoPath);
    
    try {
        const todoData = await tm.readTodo();
        const task = todoData.tasks.find(t => t.id === taskId);
        
        if (!task) {
            console.error(`Task not found: ${taskId}`);
            process.exit(1);
        }
        
        console.log('🔨 Task Breakdown Helper\n');
        console.log(`Original Task: ${task.title}\n`);
        
        console.log('Suggested breakdown approach:\n');
        
        if (task.mode === 'DEVELOPMENT') {
            console.log('For development tasks, consider breaking into:');
            console.log('1. Analysis/investigation subtask');
            console.log('2. Implementation subtask');
            console.log('3. Testing/validation subtask');
        } else if (task.mode === 'TESTING') {
            console.log('For testing tasks, consider breaking into:');
            console.log('1. Test planning subtask');
            console.log('2. Test implementation subtask');
            console.log('3. Test execution subtask');
        } else if (task.mode === 'RESEARCH') {
            console.log('For research tasks, consider breaking into:');
            console.log('1. Information gathering subtask');
            console.log('2. Analysis subtask');
            console.log('3. Documentation/reporting subtask');
        } else {
            console.log('Consider breaking into smaller, focused subtasks:');
            console.log('1. Specific action items');
            console.log('2. Distinct deliverables');
            console.log('3. Sequential steps');
        }
        
        console.log('\nExample commands to create subtasks:\n');
        
        console.log('Create subtask 1:');
        console.log(`node -e "const tm = require('./lib/taskManager'); new tm('./TODO.json').createTask({title: '${task.title} - Part 1', description: 'First part of the original task', mode: '${task.mode}', priority: '${task.priority}'}).then(id => console.log('Created:', id));"\n`);
        
        console.log('Create subtask 2:');
        console.log(`node -e "const tm = require('./lib/taskManager'); new tm('./TODO.json').createTask({title: '${task.title} - Part 2', description: 'Second part of the original task', mode: '${task.mode}', priority: '${task.priority}'}).then(id => console.log('Created:', id));"\n`);
        
        console.log('After creating subtasks, complete the original task:');
        console.log(`node task-completion-helper.js complete ${taskId} "Broken down into smaller tasks"\n`);
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

function showHelp() {
    console.log('Task Completion Helper\n');
    console.log('Usage:');
    console.log('  node task-completion-helper.js [command] [args]\n');
    console.log('Commands:');
    console.log('  guide <task_id> [agent_id]     Interactive guidance for completing a task');
    console.log('  complete <task_id> [reason]    Quickly mark a task as completed');
    console.log('  breakdown <task_id>            Get help breaking down a complex task');
    console.log('  help                           Show this help message\n');
    console.log('Examples:');
    console.log('  node task-completion-helper.js guide task_123');
    console.log('  node task-completion-helper.js complete task_123 "Work finished"');
    console.log('  node task-completion-helper.js breakdown task_123');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, interactiveGuidance, quickComplete, breakdownTask };