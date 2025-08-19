#!/usr/bin/env node

/**
 * TaskManager Node.js API Wrapper
 * 
 * Universal API for TaskManager functionality - works with any project
 * Usage: node taskmanager-api.js <command> [args...] [--project-root /path/to/project]
 */

const path = require('path');

// Parse project root from --project-root flag or use current directory
const args = process.argv.slice(2);
const projectRootIndex = args.indexOf('--project-root');
const PROJECT_ROOT = (projectRootIndex !== -1 && projectRootIndex + 1 < args.length) 
    ? args[projectRootIndex + 1] 
    : process.cwd();
const TODO_PATH = path.join(PROJECT_ROOT, 'TODO.json');

// Remove --project-root and its value from args for command parsing
if (projectRootIndex !== -1) {
    args.splice(projectRootIndex, 2);
}

// Absolute path to the infinite-continue-stop-hook directory (where TaskManager system lives)
const TASKMANAGER_ROOT = __dirname;

// Import TaskManager modules using absolute paths
let TaskManager, AgentManager, MultiAgentOrchestrator;

try {
    // Import TaskManager modules using absolute paths
    TaskManager = require(path.join(TASKMANAGER_ROOT, 'lib', 'taskManager.js'));
    AgentManager = require(path.join(TASKMANAGER_ROOT, 'lib', 'agentManager.js'));
    MultiAgentOrchestrator = require(path.join(TASKMANAGER_ROOT, 'lib', 'multiAgentOrchestrator.js'));
} catch (error) {
    console.error('Failed to load TaskManager modules:', error.message);
    console.error('Full error:', error);
    process.exit(1);
}

class TaskManagerAPI {
    constructor() {
        this.taskManager = new TaskManager(TODO_PATH, {
            enableMultiAgent: true,
            enableAutoFix: false, // Disable auto-fix for better performance
            validateOnRead: false  // Disable validation for better performance
        });
        this.agentManager = new AgentManager(TODO_PATH);
        this.orchestrator = new MultiAgentOrchestrator(TODO_PATH);
        this.agentId = null;
    }

    // API Discovery and Documentation
    async getApiMethods() {
        try {
            const taskManagerMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.taskManager))
                .filter(name => name !== 'constructor' && !name.startsWith('_'))
                .sort();

            const apiMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
                .filter(name => name !== 'constructor' && !name.startsWith('_'))
                .sort();

            return {
                success: true,
                taskManagerMethods: {
                    count: taskManagerMethods.length,
                    methods: taskManagerMethods,
                    usage: "const tm = new TaskManager('./TODO.json'); tm.methodName()"
                },
                apiMethods: {
                    count: apiMethods.length,
                    methods: apiMethods,
                    usage: "node taskmanager-api.js methodName args"
                },
                examples: {
                    taskManager: "tm.createTask({title: 'Test', category: 'enhancement'})",
                    api: "node taskmanager-api.js list '{\"status\": \"pending\"}'"
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Agent initialization and management
    async initAgent(config = {}) {
        try {
            const defaultConfig = {
                role: 'development',
                sessionId: `session_${Date.now()}`,
                specialization: []
            };
            
            const agentConfig = { ...defaultConfig, ...config };
            this.agentId = await this.agentManager.registerAgent(agentConfig);
            
            return {
                success: true,
                agentId: this.agentId,
                config: agentConfig
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getCurrentTask(agentId = null) {
        try {
            const targetAgentId = agentId || this.agentId;
            const task = await this.taskManager.getCurrentTask(targetAgentId);
            
            return {
                success: true,
                task: task || null,
                hasTask: !!task
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async listTasks(filter = {}) {
        try {
            const todoData = await this.taskManager.readTodo(true); // Skip validation for better performance
            let tasks = todoData.tasks || [];
            
            // Apply filters
            if (filter.status) {
                tasks = tasks.filter(task => task.status === filter.status);
            }
            if (filter.mode) {
                tasks = tasks.filter(task => task.mode === filter.mode);
            }
            if (filter.priority) {
                tasks = tasks.filter(task => task.priority === filter.priority);
            }
            
            return {
                success: true,
                tasks,
                count: tasks.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createTask(taskData) {
        try {
            const taskId = await this.taskManager.createTask(taskData);
            
            return {
                success: true,
                taskId,
                task: taskData
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async claimTask(taskId, agentId = null, priority = 'normal') {
        try {
            const targetAgentId = agentId || this.agentId;
            if (!targetAgentId) {
                throw new Error('No agent ID provided and no agent initialized');
            }
            
            // First, check if task has incomplete dependencies
            const todoData = await this.taskManager.readTodo();
            const task = todoData.tasks.find(t => t.id === taskId);
            
            if (task && task.dependencies && task.dependencies.length > 0) {
                const incompleteDependencies = [];
                
                for (const depId of task.dependencies) {
                    const depTask = todoData.tasks.find(t => t.id === depId);
                    if (depTask && depTask.status !== 'completed') {
                        incompleteDependencies.push(depTask);
                    }
                }
                
                if (incompleteDependencies.length > 0) {
                    // Find the next dependency that should be worked on first
                    const nextDependency = incompleteDependencies.find(dep => dep.status === 'pending') || incompleteDependencies[0];
                    
                    return {
                        success: false,
                        reason: "Task has incomplete dependencies that must be completed first",
                        blockedByDependencies: true,
                        incompleteDependencies: incompleteDependencies,
                        nextDependency: nextDependency,
                        dependencyInstructions: {
                            message: `🔗 DEPENDENCY DETECTED - Complete dependency first: ${nextDependency.title}`,
                            instructions: [
                                `📋 COMPLETE dependency task: ${nextDependency.title} (ID: ${nextDependency.id})`,
                                `🎯 CLAIM dependency task using: node taskmanager-api.js claim ${nextDependency.id}`,
                                `✅ FINISH dependency before returning to this task`,
                                `🔄 RETRY this task after dependency is completed`
                            ],
                            dependencyTask: {
                                id: nextDependency.id,
                                title: nextDependency.title,
                                category: nextDependency.category,
                                status: nextDependency.status
                            }
                        }
                    };
                }
            }
            
            const result = await this.taskManager.claimTask(taskId, targetAgentId, priority);
            
            // Check if task requires research or is a research category task
            const claimedTask = result.task;
            let researchInstructions = null;
            
            if (claimedTask && (claimedTask.category === 'research' || claimedTask.requires_research)) {
                researchInstructions = {
                    message: "🔬 RESEARCH TASK DETECTED - RESEARCH REQUIRED FIRST",
                    instructions: [
                        "📋 BEFORE IMPLEMENTATION: Perform comprehensive research",
                        "📁 CREATE research report in development/reports/ directory",
                        "🔍 ANALYZE existing solutions, best practices, and technical approaches",
                        "📊 DOCUMENT findings, recommendations, and implementation strategy",
                        "✅ COMPLETE research report before proceeding with implementation",
                        "🗂️ USE research findings to guide implementation decisions"
                    ],
                    reportTemplate: {
                        filename: `research-${claimedTask.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.md`,
                        directory: "development/reports/",
                        sections: [
                            "# Research Report: " + claimedTask.title,
                            "## Overview",
                            "## Current State Analysis", 
                            "## Research Findings",
                            "## Technical Approaches",
                            "## Recommendations",
                            "## Implementation Strategy",
                            "## References"
                        ]
                    }
                };
            }
            
            return {
                success: result.success,
                task: result.task,
                reason: result.reason,
                priority: result.priority,
                researchInstructions: researchInstructions
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async completeTask(taskId, completionData = {}) {
        try {
            await this.taskManager.updateTaskStatus(taskId, 'completed');
            
            if (completionData.notes) {
                await this.taskManager.addTaskNote(taskId, completionData.notes);
            }
            
            return {
                success: true,
                taskId,
                completionData
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getAgentStatus(agentId = null) {
        try {
            const targetAgentId = agentId || this.agentId;
            if (!targetAgentId) {
                throw new Error('No agent ID provided and no agent initialized');
            }
            
            const agent = await this.agentManager.getAgent(targetAgentId);
            const tasks = await this.taskManager.getTasksForAgent(targetAgentId);
            
            return {
                success: true,
                agent,
                tasks,
                taskCount: tasks.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }


    async getStatistics() {
        try {
            const stats = await this.orchestrator.getOrchestrationStatistics();
            
            return {
                success: true,
                statistics: stats
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Task reordering methods
    async moveTaskToTop(taskId) {
        try {
            const result = await this.taskManager.moveTaskToTop(taskId);
            return {
                success: true,
                moved: result,
                taskId
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async moveTaskUp(taskId) {
        try {
            const result = await this.taskManager.moveTaskUp(taskId);
            return {
                success: true,
                moved: result,
                taskId
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async moveTaskDown(taskId) {
        try {
            const result = await this.taskManager.moveTaskDown(taskId);
            return {
                success: true,
                moved: result,
                taskId
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async moveTaskToBottom(taskId) {
        try {
            const result = await this.taskManager.moveTaskToBottom(taskId);
            return {
                success: true,
                moved: result,
                taskId
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Cleanup method
    async cleanup() {
        try {
            // Cleanup in proper order with sufficient time
            if (this.taskManager && typeof this.taskManager.cleanup === 'function') {
                await this.taskManager.cleanup();
            }
            if (this.agentManager && typeof this.agentManager.cleanup === 'function') {
                await this.agentManager.cleanup();
            }
            if (this.orchestrator && typeof this.orchestrator.cleanup === 'function') {
                await this.orchestrator.cleanup();
            }
        } catch (error) {
            console.warn('Cleanup warning:', error.message);
        }
        
        // Give more time for cleanup and use setTimeout for better performance
        setTimeout(() => {
            process.exit(0);
        }, 0);
    }
}

// CLI interface
async function main() {
    // Use the already parsed args (with --project-root removed)
    const command = args[0];
    
    
    const api = new TaskManagerAPI();

    try {
        switch (command) {
            case 'methods': {
                const result = await api.getApiMethods();
                console.log(JSON.stringify(result, null, 2));
                break;
            }

            case 'init': {
                const config = args[1] ? JSON.parse(args[1]) : {};
                const result = await api.initAgent(config);
                console.log(JSON.stringify(result, null, 2));
                break;
            }

            case 'current': {
                const agentId = args[1];
                const result = await api.getCurrentTask(agentId);
                console.log(JSON.stringify(result, null, 2));
                break;
            }

            case 'list': {
                const filter = args[1] ? JSON.parse(args[1]) : {};
                const result = await api.listTasks(filter);
                console.log(JSON.stringify(result, null, 2));
                break;
            }

            case 'create': {
                if (!args[1]) {
                    throw new Error('Task data required for create command');
                }
                const taskData = JSON.parse(args[1]);
                const result = await api.createTask(taskData);
                console.log(JSON.stringify(result, null, 2));
                break;
            }

            case 'claim': {
                const taskId = args[1];
                const agentId = args[2];
                const priority = args[3] || 'normal';
                if (!taskId) {
                    throw new Error('Task ID required for claim command');
                }
                const result = await api.claimTask(taskId, agentId, priority);
                console.log(JSON.stringify(result, null, 2));
                break;
            }

            case 'complete': {
                const taskId = args[1];
                const completionData = args[2] ? JSON.parse(args[2]) : {};
                if (!taskId) {
                    throw new Error('Task ID required for complete command');
                }
                const result = await api.completeTask(taskId, completionData);
                console.log(JSON.stringify(result, null, 2));
                break;
            }

            case 'status': {
                const agentId = args[1];
                const result = await api.getAgentStatus(agentId);
                console.log(JSON.stringify(result, null, 2));
                break;
            }

            case 'stats': {
                const result = await api.getStatistics();
                console.log(JSON.stringify(result, null, 2));
                break;
            }


            case 'move-top': {
                const taskId = args[1];
                if (!taskId) {
                    throw new Error('Task ID required for move-top command');
                }
                const result = await api.moveTaskToTop(taskId);
                console.log(JSON.stringify(result, null, 2));
                break;
            }

            case 'move-up': {
                const taskId = args[1];
                if (!taskId) {
                    throw new Error('Task ID required for move-up command');
                }
                const result = await api.moveTaskUp(taskId);
                console.log(JSON.stringify(result, null, 2));
                break;
            }

            case 'move-down': {
                const taskId = args[1];
                if (!taskId) {
                    throw new Error('Task ID required for move-down command');
                }
                const result = await api.moveTaskDown(taskId);
                console.log(JSON.stringify(result, null, 2));
                break;
            }

            case 'move-bottom': {
                const taskId = args[1];
                if (!taskId) {
                    throw new Error('Task ID required for move-bottom command');
                }
                const result = await api.moveTaskToBottom(taskId);
                console.log(JSON.stringify(result, null, 2));
                break;
            }

            default: {
                console.log(`
TaskManager Node.js API

Usage: node taskmanager-api.js <command> [args...]

Commands:
  methods                      - Get all available TaskManager and API methods
  init [config]                - Initialize agent with optional config JSON
  current [agentId]            - Get current task for agent
  list [filter]                - List tasks with optional filter JSON
  create <taskData>            - Create new task with JSON data
  claim <taskId> [agentId] [priority] - Claim task for agent
  complete <taskId> [data]     - Complete task with optional data JSON
  status [agentId]             - Get agent status and tasks
  stats                        - Get orchestration statistics
  move-top <taskId>            - Move task to top priority
  move-up <taskId>             - Move task up one position
  move-down <taskId>           - Move task down one position
  move-bottom <taskId>         - Move task to bottom

Examples:
  node taskmanager-api.js init '{"role": "development", "specialization": ["testing"]}'
  node taskmanager-api.js create '{"title": "Fix bug", "mode": "DEVELOPMENT", "priority": "high"}'
  node taskmanager-api.js list '{"status": "pending"}'
  node taskmanager-api.js move-top task_123
                `);
                break;
            }
        }
    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            error: error.message,
            command
        }, null, 2));
        process.exit(1);
    } finally {
        await api.cleanup();
    }
}

// Export for programmatic use
module.exports = TaskManagerAPI;

// Run CLI if called directly (CommonJS equivalent)
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
}