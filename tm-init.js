#!/usr/bin/env node

/**
 * TaskManager Agent Initialization Script
 * 
 * Simple Node.js command for agent initialization without bash wrapper
 */

const path = require('path');

// Absolute path to the infinite-continue-stop-hook directory
const TASKMANAGER_ROOT = '/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook';
const TODO_PATH = path.join(TASKMANAGER_ROOT, 'TODO.json');

// Import TaskManager modules using absolute paths
let TaskManager, AgentManager;

try {
    TaskManager = require(path.join(TASKMANAGER_ROOT, 'lib', 'taskManager.js'));
    AgentManager = require(path.join(TASKMANAGER_ROOT, 'lib', 'agentManager.js'));
} catch (error) {
    console.error('Failed to load TaskManager modules:', error.message);
    process.exit(1);
}

async function initAgent() {
    try {
        const agentManager = new AgentManager(TODO_PATH);
        const taskManager = new TaskManager(TODO_PATH, {
            enableMultiAgent: true,
            enableAutoFix: true
        });

        const defaultConfig = {
            role: 'development',
            sessionId: `session_${Date.now()}`,
            specialization: []
        };

        const agentId = await agentManager.registerAgent(defaultConfig);
        
        console.log(JSON.stringify({
            success: true,
            agentId: agentId,
            config: defaultConfig,
            message: 'Agent initialized successfully'
        }, null, 2));

        // Cleanup
        if (agentManager && typeof agentManager.cleanup === 'function') {
            agentManager.cleanup();
        }
        if (taskManager && typeof taskManager.cleanup === 'function') {
            taskManager.cleanup();
        }

    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            error: error.message
        }, null, 2));
        process.exit(1);
    }
}

// Run initialization
initAgent().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
});