#!/usr/bin/env node

/**
 * TaskManager CLI Tool
 * 
 * Command-line interface for the TaskManager API that allows Claude Code
 * to create and manage tasks via bash commands instead of Node.js code.
 * 
 * Usage:
 *   node task-cli.js create --title "Task" --description "Desc" --mode "DEVELOPMENT"
 *   node task-cli.js status <task-id> <status>
 *   node task-cli.js list [--status pending]
 *   node task-cli.js current
 *   node task-cli.js batch --file tasks.json
 */

const fs = require('fs');
const path = require('path');
const TaskManager = require('./lib/taskManager');

class TaskCLI {
    constructor() {
        this.taskManager = new TaskManager('./TODO.json');
    }

    async run() {
        const args = process.argv.slice(2);
        
        if (args.length === 0) {
            this.showHelp();
            return;
        }

        const command = args[0];
        
        try {
            switch (command) {
                case 'create':
                    await this.createTask(args.slice(1));
                    break;
                case 'status':
                    await this.updateStatus(args.slice(1));
                    break;
                case 'list':
                    await this.listTasks(args.slice(1));
                    break;
                case 'current':
                    await this.getCurrentTask();
                    break;
                case 'batch':
                    await this.batchCreate(args.slice(1));
                    break;
                case 'help':
                case '--help':
                case '-h':
                    this.showHelp();
                    break;
                default:
                    console.error(`Unknown command: ${command}`);
                    this.showHelp();
                    process.exit(1);
            }
        } catch (error) {
            console.error(`Error: ${error.message}`);
            process.exit(1);
        }
    }

    async createTask(args) {
        const options = this.parseArgs(args);
        
        // Validate required fields
        if (!options.title) {
            throw new Error('--title is required');
        }
        if (!options.description) {
            throw new Error('--description is required');
        }
        if (!options.mode) {
            throw new Error('--mode is required (DEVELOPMENT|TESTING|RESEARCH|DEBUGGING|REFACTORING)');
        }

        // Parse arrays from string
        const dependencies = options.dependencies ? options.dependencies.split(',').map(d => d.trim()) : [];
        const importantFiles = options['important-files'] ? options['important-files'].split(',').map(f => f.trim()) : [];
        const successCriteria = options['success-criteria'] ? options['success-criteria'].split(',').map(s => s.trim()) : [];

        const taskData = {
            title: options.title,
            description: options.description,
            mode: options.mode.toUpperCase(),
            priority: options.priority || 'medium',
            dependencies,
            important_files: importantFiles,
            success_criteria: successCriteria,
            estimate: options.estimate || '',
            requires_research: options['requires-research'] === 'true'
        };

        const taskId = await this.taskManager.createTask(taskData);
        console.log(`✅ Created task: ${taskId}`);
        
        if (options.json) {
            console.log(JSON.stringify({ success: true, taskId }, null, 2));
        }
    }

    async updateStatus(args) {
        if (args.length < 2) {
            throw new Error('Usage: node task-cli.js status <task-id> <status>');
        }

        const taskId = args[0];
        const status = args[1];
        
        const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        await this.taskManager.updateTaskStatus(taskId, status);
        console.log(`✅ Updated task ${taskId} status to: ${status}`);
    }

    async listTasks(args) {
        const options = this.parseArgs(args);
        const todoData = await this.taskManager.readTodo();
        
        let tasks = todoData.tasks || [];
        
        // Filter by status if specified
        if (options.status) {
            tasks = tasks.filter(task => task.status === options.status);
        }

        if (options.json) {
            console.log(JSON.stringify(tasks, null, 2));
            return;
        }

        console.log(`\n📋 Tasks (${tasks.length} found):`);
        console.log('═'.repeat(60));
        
        if (tasks.length === 0) {
            console.log('No tasks found.');
            return;
        }

        tasks.forEach(task => {
            const statusIcon = this.getStatusIcon(task.status);
            console.log(`${statusIcon} ${task.id}: ${task.title || task.description}`);
            console.log(`   Mode: ${task.mode} | Priority: ${task.priority || 'medium'} | Status: ${task.status}`);
            if (task.dependencies && task.dependencies.length > 0) {
                console.log(`   Dependencies: ${task.dependencies.join(', ')}`);
            }
            console.log('');
        });
    }

    async getCurrentTask() {
        const todoData = await this.taskManager.readTodo();
        const currentTask = todoData.tasks.find(t => t.status === 'in_progress') || 
                           todoData.tasks.find(t => t.status === 'pending');
        
        if (!currentTask) {
            console.log('No current task found.');
            return;
        }

        console.log('\n🎯 Current Task:');
        console.log('═'.repeat(40));
        console.log(`ID: ${currentTask.id}`);
        console.log(`Title: ${currentTask.title || 'N/A'}`);
        console.log(`Description: ${currentTask.description}`);
        console.log(`Mode: ${currentTask.mode}`);
        console.log(`Priority: ${currentTask.priority || 'medium'}`);
        console.log(`Status: ${currentTask.status}`);
        
        if (currentTask.dependencies && currentTask.dependencies.length > 0) {
            console.log(`Dependencies: ${currentTask.dependencies.join(', ')}`);
        }
        
        if (currentTask.important_files && currentTask.important_files.length > 0) {
            console.log(`Important Files: ${currentTask.important_files.join(', ')}`);
        }
        
        if (currentTask.success_criteria && currentTask.success_criteria.length > 0) {
            console.log('\nSuccess Criteria:');
            currentTask.success_criteria.forEach((criteria, index) => {
                console.log(`  ${index + 1}. ${criteria}`);
            });
        }
    }

    async batchCreate(args) {
        const options = this.parseArgs(args);
        
        if (!options.file) {
            throw new Error('--file is required for batch creation');
        }

        const filePath = path.resolve(options.file);
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const tasksData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (!Array.isArray(tasksData)) {
            throw new Error('Batch file must contain an array of task objects');
        }

        console.log(`Creating ${tasksData.length} tasks...`);
        
        const createdTasks = [];
        for (const taskData of tasksData) {
            // Validate required fields
            if (!taskData.title || !taskData.description || !taskData.mode) {
                console.error(`Skipping invalid task: ${JSON.stringify(taskData)}`);
                continue;
            }

            const taskId = await this.taskManager.createTask(taskData);
            createdTasks.push(taskId);
            console.log(`✅ Created task: ${taskId}`);
        }

        console.log(`\n🎉 Successfully created ${createdTasks.length} tasks`);
        
        if (options.json) {
            console.log(JSON.stringify({ success: true, createdTasks }, null, 2));
        }
    }

    parseArgs(args) {
        const options = {};
        
        for (let i = 0; i < args.length; i++) {
            if (args[i].startsWith('--')) {
                const key = args[i].substring(2);
                const value = args[i + 1];
                
                if (value && !value.startsWith('--')) {
                    options[key] = value;
                    i++; // Skip the value in next iteration
                } else {
                    options[key] = true; // Flag without value
                }
            }
        }
        
        return options;
    }

    getStatusIcon(status) {
        const icons = {
            'pending': '⏳',
            'in_progress': '🚀',
            'completed': '✅',
            'blocked': '🚫'
        };
        return icons[status] || '❓';
    }

    showHelp() {
        console.log(`
TaskManager CLI - Command-line interface for TODO.json task management

USAGE:
  node task-cli.js <command> [options]

COMMANDS:
  create              Create a new task
  status <id> <stat>  Update task status
  list                List tasks
  current             Show current task
  batch               Create multiple tasks from JSON file
  help                Show this help message

CREATE OPTIONS:
  --title <string>           Task title (required)
  --description <string>     Task description (required)  
  --mode <string>           Task mode: DEVELOPMENT|TESTING|RESEARCH|DEBUGGING|REFACTORING (required)
  --priority <string>        Priority: high|medium|low (default: medium)
  --dependencies <string>    Comma-separated file/directory dependencies
  --important-files <string> Comma-separated important files to read first
  --success-criteria <string> Comma-separated success criteria
  --estimate <string>        Time estimate (e.g., "2-4 hours")
  --requires-research        Flag if task requires research (true/false)
  --json                     Output JSON format

LIST OPTIONS:
  --status <string>     Filter by status: pending|in_progress|completed|blocked
  --json               Output JSON format

BATCH OPTIONS:
  --file <path>        JSON file containing array of task objects
  --json              Output JSON format

STATUS VALUES:
  pending              Task not started
  in_progress          Currently working on task
  completed            Task finished successfully
  blocked              Task blocked by dependencies

EXAMPLES:
  # Create a development task
  node task-cli.js create \\
    --title "Implement user auth" \\
    --description "Create login/logout with JWT" \\
    --mode "DEVELOPMENT" \\
    --priority "high" \\
    --dependencies "src/auth/,package.json" \\
    --important-files "src/auth/login.js,README.md" \\
    --success-criteria "Login works,JWT generated,Logout clears session"

  # Update task status
  node task-cli.js status task-1 completed

  # List pending tasks
  node task-cli.js list --status pending

  # Show current task
  node task-cli.js current

  # Create tasks from JSON file
  node task-cli.js batch --file tasks.json
`);
    }
}

// Run CLI if called directly
if (require.main === module) {
    const cli = new TaskCLI();
    cli.run().catch(error => {
        console.error(`Fatal error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = TaskCLI;