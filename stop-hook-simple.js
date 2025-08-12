#!/usr/bin/env node

/**
 * Simplified Stop Hook - Focus on Task Continuation and Linter Checks
 * 
 * This stop hook implementation focuses on:
 * 1. Continuing current task or marking it complete
 * 2. Mandatory linter checks when tasks complete
 * 3. Using TaskManager API for all task orchestration
 */

const { execSync } = require('child_process');

// Import TaskManager and AgentRegistry for all operations
const TaskManager = require('./lib/taskManager');
const { initializeAgent, updateAgentActivity } = require('./initialize-agent');

async function main() {
    try {
        // Initialize or get existing agent
        let agentId = process.env.CLAUDE_AGENT_ID;
        
        if (!agentId) {
            // Initialize new agent through registry
            const agentInfo = {
                sessionId: process.env.CLAUDE_SESSION_ID || `session_${Date.now()}`,
                role: process.env.CLAUDE_AGENT_ROLE || 'development',
                specialization: process.env.CLAUDE_AGENT_SPECIALIZATION ? 
                    process.env.CLAUDE_AGENT_SPECIALIZATION.split(',') : []
            };
            
            const initResult = await initializeAgent(agentInfo);
            
            if (initResult.success) {
                agentId = initResult.agentId;
                console.log(`🤖 Agent Initialized: ${agentId} (${initResult.action})`);
                if (initResult.action === 'reused_inactive_slot' && initResult.previousAgent) {
                    console.log(`   Reused slot from session ${initResult.previousAgent.sessionId}`);
                    console.log(`   Previous agent inactive since: ${initResult.previousAgent.inactiveSince}`);
                }
                console.log('');
            } else {
                console.error('Failed to initialize agent:', initResult.error);
                process.exit(1);
            }
        } else {
            // Update activity for existing agent
            await updateAgentActivity(agentId);
        }
        
        // Initialize TaskManager
        const taskManager = new TaskManager('./TODO.json');
        
        // Get task continuation guidance
        const guidance = await taskManager.getTaskContinuationGuidance(agentId);
        
        // Handle different guidance actions
        switch (guidance.action) {
            case 'continue_task':
                await handleContinueTask(guidance);
                break;
                
            case 'start_new_task':
                await handleStartNewTask(guidance);
                break;
                
            case 'no_tasks_available':
                handleNoTasks(guidance);
                break;
                
            default:
                console.log('Unknown guidance action:', guidance.action);
                process.exit(0);
        }
        
    } catch (error) {
        console.error('Error in stop hook:', error.message);
        process.exit(0);
    }
}

async function handleContinueTask(guidance) {
    console.log('┌─ TASK CONTINUATION ─┐');
    console.log('│ Continue Current Task │');
    console.log('└──────────────────────┘\n');
    
    console.log(guidance.instructions);
    
    // Check if linter check is required
    if (guidance.requiresLinterCheck) {
        console.log('🔍 **LINTER CHECK REQUIRED**');
        console.log('Before proceeding, run: `npm run lint`');
        console.log('Fix any errors before continuing.\n');
        
        // Run linter check automatically
        try {
            execSync('npm run lint', { stdio: 'inherit' });
            console.log('✅ Linter check passed!\n');
        } catch {
            console.log('❌ **LINTER ERRORS MUST BE FIXED BEFORE CONTINUING**');
            console.log('Run `npm run lint:fix` then `npm run lint` again.\n');
            console.log('Task continuation blocked until linter issues resolved.');
            process.exit(2); // Exit with code 2 to indicate linter issues
        }
    }
    
    console.log('**Next Steps:**');
    console.log('1. Continue working on the task above');
    console.log('2. When task is complete, run:');
    console.log(`   ${guidance.completionCommand}`);
    console.log('3. Then get next task with:');
    console.log(`   ${guidance.nextTaskCommand}`);
    
    process.exit(2); // Exit with code 2 to continue with current task
}

async function handleStartNewTask(guidance) {
    console.log('┌─ NEW TASK ASSIGNMENT ─┐');
    console.log('│ Starting New Task      │');
    console.log('└───────────────────────┘\n');
    
    console.log(guidance.instructions);
    
    console.log('**Next Steps:**');
    console.log('1. Start the task by running:');
    console.log(`   ${guidance.startCommand}`);
    console.log('2. Work on the task according to the description and success criteria');
    console.log('3. When complete, run:');
    console.log(`   ${guidance.completionCommand}`);
    
    // Auto-start the task
    try {
        const TaskManager = require('./lib/taskManager');
        const tm = new TaskManager('./TODO.json');
        await tm.updateTaskStatus(guidance.task.id, 'in_progress');
        console.log('\n✅ Task automatically started and marked as in_progress');
    } catch (error) {
        console.log('\n⚠️ Could not auto-start task:', error.message);
        console.log('Please run the start command manually.');
    }
    
    process.exit(2); // Exit with code 2 to start working on new task
}

function handleNoTasks(guidance) {
    console.log('┌─ ALL TASKS COMPLETE ─┐');
    console.log('│ No More Tasks         │');
    console.log('└──────────────────────┘\n');
    
    console.log(guidance.message);
    console.log('\n**Status Check:**');
    console.log(`Run: ${guidance.checkCommand}`);
    
    console.log('\n🎉 All tasks completed! Great work!');
    process.exit(0); // Exit with code 0 - all done
}

// Handle script execution
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = { main, handleContinueTask, handleStartNewTask, handleNoTasks };