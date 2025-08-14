#!/usr/bin/env node

/**
 * TaskManager Agent Initialization Script
 * 
 * Universal script for agent initialization - works with any project
 * Usage: node tm-init.js [project-root-path]
 */

const path = require('path');

// Get project root from argument or use current directory
const PROJECT_ROOT = process.argv[2] || process.cwd();
const TODO_PATH = path.join(PROJECT_ROOT, 'TODO.json');

// Absolute path to the infinite-continue-stop-hook directory (where TaskManager system lives)
const TASKMANAGER_ROOT = __dirname;

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
    // Check if TODO.json exists
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
        const agentManager = new AgentManager(TODO_PATH);
        const taskManager = new TaskManager(TODO_PATH, {
            enableMultiAgent: true,
            enableAutoFix: false, // Disable auto-fix for better performance
            validateOnRead: false  // Disable validation for better performance
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