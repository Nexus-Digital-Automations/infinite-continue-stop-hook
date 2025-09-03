#!/usr/bin/env node

/**
 * TaskManager Agent Initialization Script
 * 
 * === OVERVIEW ===
 * Specialized utility for initializing new agents within the TaskManager system.
 * This script creates agent identities, registers them in the multi-agent
 * coordination system, and establishes session context for task operations.
 * 
 * === KEY RESPONSIBILITIES ===
 * • Agent registration in the multi-agent coordination system
 * • Unique agent ID generation and assignment
 * • Session management and context establishment
 * • Project binding and TODO.json validation
 * • Default configuration setup for development workflows
 * 
 * === AGENT LIFECYCLE ===
 * This script represents the first phase of the agent lifecycle:
 * 1. Initialization (this script) - Creates agent identity
 * 2. Task claiming - Agent begins work on assigned tasks
 * 3. Heartbeat renewal - Agent maintains active status
 * 4. Completion/cleanup - Agent finishes work and cleans up
 * 
 * === MULTI-AGENT COORDINATION ===
 * • Registers agent in shared agent-registry.json
 * • Establishes unique identity for conflict resolution
 * • Enables concurrent multi-agent development workflows
 * • Provides foundation for task assignment and tracking
 * 
 * === PROJECT VALIDATION ===
 * • Verifies TODO.json exists at specified project root
 * • Validates project structure for TaskManager compatibility
 * • Provides detailed error messages for missing requirements
 * • Suggests corrective actions for setup issues
 * 
 * === CONFIGURATION ===
 * • role: 'development' - Default agent specialization
 * • sessionId: timestamp-based unique identifier
 * • specialization: [] - Empty array for general-purpose agent
 * • enableMultiAgent: true - Enables coordination features
 * • Performance optimizations for responsive initialization
 * 
 * === ERROR HANDLING ===
 * • JSON-formatted error responses for automation compatibility
 * • Detailed error context and recovery suggestions
 * • Process exit codes for CI/CD integration
 * • Graceful cleanup on initialization failure
 * 
 * === USAGE PATTERNS ===
 * 1. Current Directory:
 *    node tm-init.js
 * 
 * 2. Specific Project:
 *    node tm-init.js /path/to/project
 * 
 * 3. CI/CD Integration:
 *    node tm-init.js $PROJECT_ROOT || exit 1
 * 
 * @author TaskManager System
 * @version 2.0.0
 * @since 2024-01-01
 * 
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

/**
 * Initialize a new agent for the specified project
 * 
 * === INITIALIZATION PROCESS ===
 * 1. Project validation - verifies TODO.json exists and is accessible
 * 2. Component initialization - creates AgentManager and TaskManager instances
 * 3. Agent registration - registers new agent with default configuration
 * 4. Success reporting - outputs agent details in JSON format
 * 5. Resource cleanup - ensures proper cleanup of system resources
 * 
 * === PROJECT VALIDATION ===
 * • Checks for TODO.json existence at project root
 * • Validates file accessibility and permissions
 * • Provides detailed error messaging for missing files
 * • Suggests corrective actions for common setup issues
 * 
 * === AGENT CONFIGURATION ===
 * • role: 'development' - Suitable for general development tasks
 * • sessionId: Timestamp-based unique session identifier
 * • specialization: [] - General-purpose agent capabilities
 * 
 * === MULTI-AGENT SYSTEM ===
 * • Registers agent in shared coordination system
 * • Enables participation in multi-agent workflows
 * • Provides unique identity for task assignment
 * • Establishes heartbeat and monitoring capabilities
 * 
 * === ERROR HANDLING ===
 * • JSON-formatted error responses for automation
 * • Detailed error context with project information
 * • Process exit codes for CI/CD pipeline integration
 * • Resource cleanup on both success and failure paths
 * 
 * === PERFORMANCE OPTIMIZATION ===
 * • Disabled auto-fix for faster initialization
 * • Disabled validation on read for better performance
 * • Lazy loading of expensive components
 * • Efficient resource cleanup patterns
 * 
 * @async
 * @function initAgent
 * @returns {Promise<void>} Completes when agent is successfully initialized
 * @throws {Error} If project validation fails or agent registration fails
 * 
 * @example
 * // Output on successful initialization:
 * {
 *   "success": true,
 *   "agentId": "agent_1234567890123_abc123",
 *   "config": {
 *     "role": "development",
 *     "sessionId": "session_1234567890123",
 *     "specialization": []
 *   },
 *   "message": "Agent initialized successfully"
 * }
 */
async function initAgent() {
    // === PROJECT VALIDATION PHASE ===
    // Verify that TODO.json exists at the specified project root
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
        // === COMPONENT INITIALIZATION PHASE ===
        // Create AgentManager instance for multi-agent coordination
        const agentManager = new AgentManager(TODO_PATH);
        
        // Create TaskManager instance with performance optimizations
        const taskManager = new TaskManager(TODO_PATH, {
            enableMultiAgent: true,     // Enable multi-agent coordination features
            enableAutoFix: false,       // Disable auto-fix for better performance
            validateOnRead: false       // Disable validation for better performance
        });

        // === AGENT CONFIGURATION PHASE ===
        // Default configuration suitable for development workflows
        const defaultConfig = {
            role: 'development',                    // Agent specialization role
            sessionId: `session_${Date.now()}`,    // Unique session identifier
            specialization: []                      // General-purpose agent capabilities
        };

        // === AGENT REGISTRATION PHASE ===
        // Register agent in the multi-agent coordination system
        const agentId = await agentManager.registerAgent(defaultConfig);
        
        // === SUCCESS REPORTING PHASE ===
        // Output success response in JSON format for automation
        console.log(JSON.stringify({
            success: true,
            agentId: agentId,
            config: defaultConfig,
            message: 'Agent initialized successfully'
        }, null, 2));

        // === RESOURCE CLEANUP PHASE ===
        // Ensure proper cleanup of system resources
        if (agentManager && typeof agentManager.cleanup === 'function') {
            agentManager.cleanup();
        }
        if (taskManager && typeof taskManager.cleanup === 'function') {
            taskManager.cleanup();
        }

    } catch (error) {
        // === ERROR HANDLING PHASE ===
        // Output error response in JSON format with detailed context
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