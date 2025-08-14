const fs = require('fs');
const _path = require('path');
const { spawn: _spawn } = require('child_process');
const AutoFixer = require('./autoFixer');
const DistributedLockManager = require('./distributedLockManager');

class TaskManager {
    constructor(todoPath, options = {}) {
        this.todoPath = todoPath;
        this.donePath = options.donePath || todoPath.replace('TODO.json', 'DONE.json');
        
        // Detect test environment and disable archiving by default in tests
        const isTestEnvironment = process.env.NODE_ENV === 'test' || 
                                 process.env.JEST_WORKER_ID !== undefined ||
                                 typeof global.it === 'function';
        
        // Lazy-load heavy components for better performance
        this._autoFixer = null;
        this._lockManager = null;
        this._autoFixerOptions = {
            ...options.autoFixer,
            recovery: {
                allowTestFiles: isTestEnvironment || options.allowTestFiles,
                ...options.autoFixer?.recovery
            }
        };
        this._lockManagerOptions = {
            lockTimeout: options.lockTimeout || 30000,
            enableDeadlockDetection: options.enableDeadlockDetection !== false,
            ...options.lockManager
        };
        
        this.options = {
            enableAutoFix: options.enableAutoFix !== false,
            autoFixLevel: options.autoFixLevel || 'moderate',
            // Performance fix: disable expensive validation by default for better performance
            validateOnRead: options.validateOnRead === true,
            enableArchiving: isTestEnvironment ? (options.enableArchiving === true) : (options.enableArchiving !== false),
            enableMultiAgent: options.enableMultiAgent !== false,
            enableAutoSetup: options.enableAutoSetup !== false,
            ...options
        };
        
        // Auto-setup disabled - causing performance issues
        // if (this.options.enableAutoSetup && !isTestEnvironment) {
        //     this._ensureProjectSetup().catch(error => {
        //         // Log error but don't fail construction - setup is optional
        //         console.warn(`TaskManager auto-setup failed: ${error.message}`);
        //     });
        // }
    }

    // Lazy-load AutoFixer only when needed
    get autoFixer() {
        if (!this._autoFixer) {
            this._autoFixer = new AutoFixer(this._autoFixerOptions);
        }
        return this._autoFixer;
    }

    // Lazy-load DistributedLockManager only when needed
    get lockManager() {
        if (!this._lockManager) {
            this._lockManager = new DistributedLockManager(this._lockManagerOptions);
        }
        return this._lockManager;
    }

    // Fast read without validation (for performance-critical operations)
    readTodoSync() {
        if (!fs.existsSync(this.todoPath)) {
            throw new Error(`TODO.json not found at ${this.todoPath}`);
        }
        
        try {
            const content = fs.readFileSync(this.todoPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Failed to read TODO.json: ${error.message}`);
        }
    }

    // Ultra-fast read for performance-critical operations (no validation, no auto-fix)
    async readTodoFast() {
        if (!fs.existsSync(this.todoPath)) {
            throw new Error(`TODO.json not found at ${this.todoPath}`);
        }
        
        try {
            const content = fs.readFileSync(this.todoPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Failed to read TODO.json: ${error.message}`);
        }
    }

    async readTodo(skipValidation = false) {
        if (!fs.existsSync(this.todoPath)) {
            throw new Error(`TODO.json not found at ${this.todoPath}`);
        }

        try {
            const content = fs.readFileSync(this.todoPath, 'utf8');
            const data = JSON.parse(content);

            // Skip expensive validation for simple read operations
            if (skipValidation || !this.options.validateOnRead) {
                return data;
            }

            // Only validate and auto-fix if explicitly enabled (expensive operations)
            if (this.options.validateOnRead && this.options.enableAutoFix) {
                const status = await this.autoFixer.getFileStatus(this.todoPath);
                
                if (!status.valid && status.canAutoFix) {
                    const fixResult = await this.autoFixer.autoFix(this.todoPath, {
                        autoFixLevel: this.options.autoFixLevel
                    });
                    
                    if (fixResult.success && fixResult.hasChanges) {
                        // Re-read the fixed file
                        return JSON.parse(fs.readFileSync(this.todoPath, 'utf8'));
                    }
                }
            }

            return data;

        } catch (error) {
            if (this.options.enableAutoFix) {
                // Attempt recovery for corrupted files
                const recoveryResult = await this.autoFixer.recoverCorruptedFile(this.todoPath);
                
                if (recoveryResult.success) {
                    return recoveryResult.finalData;
                }
            }
            
            throw new Error(`Failed to read TODO.json: ${error.message}`);
        }
    }

    async writeTodo(data) {
        try {
            // Validate data before writing if enabled
            if (this.options.validateOnRead) {
                const validationResult = this.autoFixer.validator.validateAndSanitize(data, this.todoPath);
                
                if (!validationResult.isValid && this.options.enableAutoFix) {
                    data = validationResult.data; // Use the sanitized data
                }
            }

            // Use atomic write operation from ErrorRecovery
            const writeResult = await this.autoFixer.recovery.atomicWrite(
                this.todoPath,
                JSON.stringify(data, null, 2),
                true // Create backup
            );

            if (!writeResult.success) {
                throw new Error(`Failed to write TODO.json: ${writeResult.error}`);
            }

            return writeResult;

        } catch (error) {
            throw new Error(`Failed to write TODO.json: ${error.message}`);
        }
    }

    // Removed slow auto-setup methods for performance

    async getCurrentTask(agentId = null) {
        const todoData = await this.readTodoFast(); // Use fast read for performance
        if (!todoData.tasks || !Array.isArray(todoData.tasks)) {
            return undefined;
        }
        
        if (agentId) {
            // Agent-specific task retrieval
            // First look for tasks assigned to this agent that are in_progress
            let currentTask = todoData.tasks.find(task => 
                task && task.status === 'in_progress' && 
                (task.assigned_agent === agentId || (task.assigned_agents && task.assigned_agents.includes(agentId)))
            );
            
            // If no in_progress task, get next assigned pending task with no unmet dependencies
            if (!currentTask) {
                const executableTasks = await this.getExecutableTasks();
                currentTask = executableTasks.find(task => 
                    task && task.status === 'pending' && 
                    (task.assigned_agent === agentId || (task.assigned_agents && task.assigned_agents.includes(agentId)))
                );
            }
            
            return currentTask || undefined;
        } else {
            // General task retrieval (existing behavior)
            // First prioritize in_progress tasks
            let currentTask = todoData.tasks.find(t => t && t.status === 'in_progress');
            
            // If no in_progress task, get first pending task
            if (!currentTask) {
                currentTask = todoData.tasks.find(t => t && t.status === 'pending');
            }
            
            return currentTask || undefined;
        }
    }

    /**
     * Get next available task for an agent when current task is completed
     * @param {string} agentId - Agent ID
     * @param {string} completedTaskId - ID of just completed task (optional)
     * @returns {Object|null} Next task or null if none available
     */
    async getNextTask(agentId, completedTaskId = null) {
        const todoData = await this.readTodoFast();
        
        // First check if there are other agents working on the same task that was just completed
        if (completedTaskId) {
            const completedTask = todoData.tasks.find(t => t.id === completedTaskId);
            if (completedTask && completedTask.assigned_agents && completedTask.assigned_agents.length > 1) {
                // Multiple agents on same task - see if task still needs work
                if (completedTask.status !== 'completed') {
                    return completedTask; // Continue working on same task
                }
            }
        }
        
        // Look for assigned tasks first
        const executableTasks = await this.getExecutableTasks();
        let nextTask = executableTasks.find(task => 
            task.status === 'pending' && 
            (task.assigned_agent === agentId || (task.assigned_agents && task.assigned_agents.includes(agentId)))
        );
        
        // If no assigned tasks, look for unassigned tasks that can be auto-assigned
        if (!nextTask) {
            nextTask = executableTasks.find(task => 
                task.status === 'pending' && 
                !task.assigned_agent && 
                (!task.assigned_agents || task.assigned_agents.length === 0)
            );
            
            // Auto-assign the task to this agent
            if (nextTask) {
                await this.assignTaskToAgent(nextTask.id, agentId, 'primary');
            }
        }
        
        // If still no task, check if agent can join collaborative tasks
        if (!nextTask) {
            nextTask = executableTasks.find(task => 
                task.status === 'pending' && 
                task.allows_collaboration !== false && // Allow by default unless explicitly disabled
                (!task.assigned_agents || task.assigned_agents.length < (task.max_agents || 3))
            );
            
            // Add agent to collaborative task
            if (nextTask) {
                await this.assignTaskToAgent(nextTask.id, agentId, 'collaborative');
            }
        }
        
        return nextTask || null;
    }

    /**
     * Get task continuation guidance for the stop hook
     * @param {string} agentId - Current agent ID
     * @returns {Object} Task guidance object
     */
    async getTaskContinuationGuidance(agentId) {
        // Get current task for this agent
        const currentTask = await this.getCurrentTask(agentId);
        
        if (currentTask) {
            // Agent has an active task
            const guidance = {
                action: 'continue_task',
                task: currentTask,
                instructions: this.generateTaskInstructions(currentTask),
                completionCommand: `node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.updateTaskStatus('${currentTask.id}', 'completed').then(() => console.log('Task marked as completed'));"`
            };
            
            return guidance;
        } else {
            // No current task - try to get next available task
            const nextTask = await this.getNextTask(agentId);
            
            if (nextTask) {
                const guidance = {
                    action: 'start_new_task',
                    task: nextTask,
                    instructions: this.generateTaskInstructions(nextTask),
                    startCommand: `node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.updateTaskStatus('${nextTask.id}', 'in_progress').then(() => console.log('Task started'));"`,
                    completionCommand: `node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.updateTaskStatus('${nextTask.id}', 'completed').then(() => console.log('Task completed'));"`
                };
                
                return guidance;
            } else {
                return {
                    action: 'no_tasks_available',
                    message: 'All tasks completed or no tasks available for this agent',
                    checkCommand: `node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.readTodo().then(data => console.log('Total tasks:', data.tasks.length, 'Pending:', data.tasks.filter(t => t.status === 'pending').length));"`
                };
            }
        }
    }

    /**
     * Generate detailed instructions for a task
     * @param {Object} task - Task object
     * @returns {string} Formatted instructions
     */
    generateTaskInstructions(task) {
        let instructions = `**Current Task: ${task.title}**\n\n`;
        instructions += `**Description:** ${task.description}\n\n`;
        instructions += `**Mode:** ${task.mode}\n`;
        instructions += `**Priority:** ${task.priority || 'medium'}\n`;
        instructions += `**Status:** ${task.status}\n\n`;
        
        if (task.success_criteria && task.success_criteria.length > 0) {
            instructions += `**Success Criteria:**\n`;
            task.success_criteria.forEach((criteria, index) => {
                instructions += `${index + 1}. ${criteria}\n`;
            });
            instructions += '\n';
        }
        
        if (task.important_files && task.important_files.length > 0) {
            instructions += `**Important Files:**\n`;
            task.important_files.forEach(file => {
                instructions += `- ${file}\n`;
            });
            instructions += '\n';
        }
        
        if (task.dependencies && task.dependencies.length > 0) {
            instructions += `**Dependencies:** ${task.dependencies.length} task(s)\n\n`;
        }
        
        if (task.assigned_agents && task.assigned_agents.length > 1) {
            instructions += `**Collaborative Task:** ${task.assigned_agents.length} agents assigned\n\n`;
        }
        
        return instructions;
    }


    async updateTaskStatus(taskId, status, _options = {}) {
        const todoData = await this.readTodoFast();
        const task = todoData.tasks.find(t => t.id === taskId);
        if (task) {
            const oldStatus = task.status;
            task.status = status;
            
            // If task is now completed, handle completion actions
            if (status === 'completed' && oldStatus !== 'completed') {
                // Archive completed task if archiving is enabled
                if (this.options.enableArchiving) {
                    await this.archiveCompletedTask(task);
                    todoData.tasks = todoData.tasks.filter(t => t.id !== taskId);
                }
            }
            
            await this.writeTodo(todoData);
            return true;
        }
        return false;
    }

    async addSubtask(parentTaskId, subtask) {
        const todoData = await this.readTodoFast();
        const parentTask = todoData.tasks.find(t => t.id === parentTaskId);
        if (parentTask) {
            if (!parentTask.subtasks) {
                parentTask.subtasks = [];
            }
            parentTask.subtasks.push(subtask);
            await this.writeTodo(todoData);
        }
    }

    async addImportantFile(taskId, filePath) {
        const todoData = await this.readTodoFast();
        const task = todoData.tasks.find(t => t.id === taskId);
        if (task) {
            if (!task.important_files) {
                task.important_files = [];
            }
            // Avoid duplicates
            if (!task.important_files.includes(filePath)) {
                task.important_files.push(filePath);
                await this.writeTodo(todoData);
                return true;
            }
        }
        return false;
    }

    async removeImportantFile(taskId, filePath) {
        const todoData = await this.readTodoFast();
        const task = todoData.tasks.find(t => t.id === taskId);
        if (task && task.important_files) {
            const index = task.important_files.indexOf(filePath);
            if (index !== -1) {
                task.important_files.splice(index, 1);
                await this.writeTodo(todoData);
                return true;
            }
        }
        return false;
    }

    /**
     * Generates the standardized research report file path for a task
     * @param {string} taskId - The task ID
     * @returns {string} The research report file path
     */
    getResearchReportPath(taskId) {
        return `./development/research-reports/research-report-${taskId}.md`;
    }

    /**
     * Checks if a research report file exists for the given task ID
     * @param {string} taskId - The task ID
     * @returns {boolean} True if the research report file exists
     */
    researchReportExists(taskId) {
        const reportPath = this.getResearchReportPath(taskId);
        const path = require('path');
        
        // Convert relative path to absolute path
        const workingDir = process.cwd();
        const absolutePath = path.resolve(workingDir, reportPath);
        
        return fs.existsSync(absolutePath);
    }

    async createTask(taskData) {
        const todoData = await this.readTodoFast();
        
        // Generate unique task ID with robust fallback mechanisms
        let randomSuffix;
        try {
            const randomValue = Math.random();
            if (randomValue && typeof randomValue.toString === 'function') {
                randomSuffix = randomValue.toString(36).substr(2, 9);
            } else {
                throw new Error('Math.random returned invalid value');
            }
        } catch {
            // Fallback to process.hrtime for high-resolution time-based uniqueness
            const hrtime = process.hrtime();
            randomSuffix = (hrtime[0] * 1000000 + hrtime[1]).toString(36).substr(-9);
        }
        const taskId = `task_${Date.now()}_${randomSuffix}`;
        
        // Start with provided important_files or empty array
        let importantFiles = [...(taskData.important_files || [])];
        let successCriteria = [...(taskData.success_criteria || [])];
        
        // For research tasks, automatically add research report path and success criteria
        if (taskData.mode === 'RESEARCH' || taskData.mode === 'research') {
            const researchReportPath = this.getResearchReportPath(taskId);
            
            // Add research report to important_files if not already present
            if (!importantFiles.includes(researchReportPath)) {
                importantFiles.push(researchReportPath);
            }
            
            // Add research report creation to success criteria if not already present
            const reportCriterion = `Research report created: ${researchReportPath}`;
            if (!successCriteria.some(criterion => criterion === reportCriterion)) {
                successCriteria.push(reportCriterion);
            }
        }
        
        // Create complete task object with required fields
        const newTask = {
            id: taskId,
            title: taskData.title,
            description: taskData.description,
            mode: taskData.mode,
            priority: taskData.priority || 'medium',
            status: taskData.status || 'pending',
            dependencies: taskData.dependencies || [],
            important_files: importantFiles,
            success_criteria: successCriteria,
            estimate: taskData.estimate || '',
            requires_research: taskData.requires_research || false,
            subtasks: taskData.subtasks || [],
            created_at: new Date().toISOString()
        };
        
        // Add task to the tasks array
        todoData.tasks.push(newTask);
        
        // Write updated TODO.json
        await this.writeTodo(todoData);
        
        return taskId;
    }

    async getNextMode(todoData) {
        // Alternate between TASK_CREATION and task execution
        if (todoData.last_mode === 'TASK_CREATION' || !todoData.last_mode) {
            const currentTask = await this.getCurrentTask();
            return currentTask ? currentTask.mode : 'DEVELOPMENT';
        }
        return 'TASK_CREATION';
    }

    shouldRunReviewer(todoData) {
        // Check if it's time for a review strike
        const completedTasks = todoData.tasks.filter(t => 
            t.status === 'completed' && 
            t.mode !== 'REVIEWER'
        ).length;
        
        // Run reviewer every 5 completed tasks
        return completedTasks > 0 && completedTasks % 5 === 0;
    }

    handleStrikeLogic(todoData) {
        // Reset strikes if all 3 were completed in previous run
        if (todoData.review_strikes === 3 && todoData.strikes_completed_last_run) {
            todoData.review_strikes = 0;
            todoData.strikes_completed_last_run = false;
            return { action: 'reset', message: 'Resetting review strikes to 0 for new cycle' };
        }
        
        // Mark as completed if just finished third strike
        if (todoData.review_strikes === 3 && !todoData.strikes_completed_last_run) {
            todoData.strikes_completed_last_run = true;
            return { action: 'complete', message: 'Third strike completed! Project approved.' };
        }
        
        return { action: 'continue', message: null };
    }

    /**
     * Gets detailed status of the TODO.json file
     * @returns {Object} File status including validation results
     */
    async getFileStatus() {
        return await this.autoFixer.getFileStatus(this.todoPath);
    }

    /**
     * Manually triggers auto-fix on the TODO.json file
     * @param {Object} options - Fix options
     * @returns {Object} Fix result
     */
    async performAutoFix(options = {}) {
        return await this.autoFixer.autoFix(this.todoPath, options);
    }

    /**
     * Performs a dry run to show what would be fixed
     * @returns {Object} Dry run result
     */
    async dryRunAutoFix() {
        return await this.autoFixer.dryRun(this.todoPath);
    }

    /**
     * Lists available backups for the TODO.json file
     * @returns {Array} List of backup files
     */
    async listBackups() {
        return await this.autoFixer.recovery.listAvailableBackups(this.todoPath);
    }

    /**
     * Restores TODO.json from a backup
     * @param {string} backupFile - Specific backup file to restore (optional)
     * @returns {Object} Restoration result
     */
    async restoreFromBackup(backupFile = null) {
        return await this.autoFixer.recovery.restoreFromBackup(this.todoPath, backupFile);
    }

    /**
     * Creates a manual backup of the current TODO.json file
     * @returns {Object} Backup creation result
     */
    async createBackup() {
        return await this.autoFixer.recovery.createBackup(this.todoPath);
    }

    /**
     * Cleans up legacy backup files in the project root directory
     * @returns {Object} Cleanup result
     */
    async cleanupLegacyBackups() {
        return await this.autoFixer.recovery.cleanupLegacyBackups(this.todoPath);
    }

    /**
     * Validates the current TODO.json without making changes
     * @returns {Object} Validation result
     */
    async validateTodoFile() {
        try {
            const content = fs.readFileSync(this.todoPath, 'utf8');
            const data = JSON.parse(content);
            return this.autoFixer.validator.validateAndSanitize(data, this.todoPath);
        } catch (error) {
            return {
                isValid: false,
                errors: [{ 
                    type: 'FILE_READ_ERROR', 
                    message: error.message, 
                    severity: 'critical' 
                }],
                fixes: [],
                summary: { totalErrors: 1, totalFixes: 0, criticalErrors: 1 }
            };
        }
    }

    /**
     * Build dependency graph from tasks and return text-based visualization
     * @param {Array} tasks - Array of task objects (optional, uses current tasks if not provided)
     * @returns {Object} Dependency analysis with text tree
     */
    async buildDependencyGraph(tasks = null) {
        const todoData = await this.readTodoFast();
        const allTasks = tasks || todoData.tasks || [];
        
        // Build dependency map
        const dependencyMap = new Map();
        const taskMap = new Map();
        
        // Index all tasks
        allTasks.forEach(task => {
            taskMap.set(task.id, task);
            dependencyMap.set(task.id, task.dependencies || []);
        });
        
        // Detect circular dependencies
        const circularDeps = this._detectCircularDependencies(dependencyMap);
        
        // Generate text tree visualization
        const dependencyTree = this._generateDependencyTree(allTasks, dependencyMap, taskMap);
        
        // Calculate execution order
        const executionOrder = this._calculateExecutionOrder(dependencyMap, circularDeps);
        
        return {
            tree: dependencyTree,
            circularDependencies: circularDeps,
            executionOrder: executionOrder,
            stats: {
                totalTasks: allTasks.length,
                tasksWithDependencies: allTasks.filter(t => t.dependencies && t.dependencies.length > 0).length,
                circularIssues: circularDeps.length
            }
        };
    }

    /**
     * Get tasks that can be executed (no unmet dependencies)
     * @returns {Array} Tasks ready for execution
     */
    async getExecutableTasks() {
        const todoData = await this.readTodoFast();
        const tasks = todoData.tasks || [];
        const completed = tasks.filter(t => t.status === 'completed').map(t => t.id);
        
        return tasks.filter(task => {
            if (task.status === 'completed') return false;
            if (!task.dependencies || task.dependencies.length === 0) return true;
            return task.dependencies.every(depId => completed.includes(depId));
        });
    }

    /**
     * Generate dependency status report in markdown format
     * @returns {string} Markdown dependency report
     */
    async generateDependencyReport() {
        const graph = await this.buildDependencyGraph();
        const executable = await this.getExecutableTasks();
        
        let report = '# Task Dependency Report\n\n';
        
        report += '## Dependency Tree\n```\n';
        report += graph.tree;
        report += '\n```\n\n';
        
        if (graph.circularDependencies.length > 0) {
            report += '## ⚠️ Circular Dependencies\n';
            graph.circularDependencies.forEach(cycle => {
                report += `- ${cycle.join(' → ')}\n`;
            });
            report += '\n';
        }
        
        report += '## 🚀 Ready to Execute\n';
        executable.forEach(task => {
            report += `- **${task.title}** (${task.id}) - ${task.priority} priority\n`;
        });
        
        report += '\n## 📊 Statistics\n';
        report += `- Total Tasks: ${graph.stats.totalTasks}\n`;
        report += `- Tasks with Dependencies: ${graph.stats.tasksWithDependencies}\n`;
        report += `- Executable Now: ${executable.length}\n`;
        report += `- Circular Issues: ${graph.stats.circularIssues}\n`;
        
        return report;
    }

    /**
     * Private method to detect circular dependencies
     */
    _detectCircularDependencies(dependencyMap) {
        const visited = new Set();
        const visiting = new Set();
        const cycles = [];
        
        const visit = (taskId, path = []) => {
            if (visiting.has(taskId)) {
                // Found a cycle
                const cycleStart = path.indexOf(taskId);
                cycles.push(path.slice(cycleStart).concat([taskId]));
                return;
            }
            
            if (visited.has(taskId)) return;
            
            visiting.add(taskId);
            const dependencies = dependencyMap.get(taskId) || [];
            
            dependencies.forEach(depId => {
                visit(depId, [...path, taskId]);
            });
            
            visiting.delete(taskId);
            visited.add(taskId);
        };
        
        Array.from(dependencyMap.keys()).forEach(taskId => {
            if (!visited.has(taskId)) {
                visit(taskId);
            }
        });
        
        return cycles;
    }

    /**
     * Private method to generate ASCII dependency tree
     */
    _generateDependencyTree(tasks, _dependencyMap, _taskMap) {
        const roots = tasks.filter(task => 
            !task.dependencies || task.dependencies.length === 0
        );
        
        let tree = '';
        const visited = new Set();
        
        const addNode = (task, depth = 0, isLast = true, prefix = '') => {
            if (visited.has(task.id)) {
                tree += `${prefix}${isLast ? '└── ' : '├── '}${task.title} (${task.id}) [CIRCULAR]\n`;
                return;
            }
            
            visited.add(task.id);
            const connector = isLast ? '└── ' : '├── ';
            const status = task.status === 'completed' ? '✅' : 
                          task.status === 'in_progress' ? '🔄' : '⏳';
            
            tree += `${prefix}${connector}${status} ${task.title} (${task.id})\n`;
            
            // Find tasks that depend on this one
            const dependents = tasks.filter(t => 
                t.dependencies && t.dependencies.includes(task.id)
            );
            
            dependents.forEach((dependent, index) => {
                const isLastDependent = index === dependents.length - 1;
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                addNode(dependent, depth + 1, isLastDependent, newPrefix);
            });
        };
        
        if (roots.length === 0) {
            tree = 'No root tasks found (all tasks have dependencies)\n';
        } else {
            roots.forEach((root, index) => {
                addNode(root, 0, index === roots.length - 1);
            });
        }
        
        return tree;
    }

    /**
     * Private method to calculate optimal execution order
     */
    _calculateExecutionOrder(dependencyMap, circularDeps) {
        if (circularDeps.length > 0) {
            return { error: 'Cannot calculate execution order due to circular dependencies', cycles: circularDeps };
        }
        
        const order = [];
        const completed = new Set();
        const tasks = Array.from(dependencyMap.keys());
        
        while (order.length < tasks.length) {
            const ready = tasks.filter(taskId => {
                if (completed.has(taskId)) return false;
                const deps = dependencyMap.get(taskId) || [];
                return deps.every(depId => completed.has(depId));
            });
            
            if (ready.length === 0) {
                // Should not happen if no circular deps, but safety check
                const remaining = tasks.filter(taskId => !completed.has(taskId));
                return { error: 'Cannot resolve dependencies', remaining };
            }
            
            ready.forEach(taskId => {
                order.push(taskId);
                completed.add(taskId);
            });
        }
        
        return { order, phases: this._groupByExecutionPhases(order, dependencyMap) };
    }

    /**
     * Private method to group tasks by execution phases (tasks that can run in parallel)
     */
    _groupByExecutionPhases(order, dependencyMap) {
        const phases = [];
        const completed = new Set();
        
        while (completed.size < order.length) {
            const phase = [];
            
            order.forEach(taskId => {
                if (completed.has(taskId)) return;
                
                const deps = dependencyMap.get(taskId) || [];
                if (deps.every(depId => completed.has(depId))) {
                    phase.push(taskId);
                }
            });
            
            if (phase.length === 0) break; // Safety check
            
            phases.push(phase);
            phase.forEach(taskId => completed.add(taskId));
        }
        
        return phases;
    }

    /**
     * Convert success criteria to executable quality gates
     * @param {string} taskId - Task ID
     * @returns {Object} Quality gate execution results
     */
    async executeQualityGates(taskId) {
        const todoData = await this.readTodoFast();
        const task = todoData.tasks.find(t => t.id === taskId);
        
        if (!task || !task.success_criteria) {
            return { success: false, error: 'Task not found or no success criteria' };
        }
        
        const results = [];
        
        for (const criterion of task.success_criteria) {
            const result = await this._executeQualityGate(criterion);
            results.push({
                criterion,
                passed: result.success,
                output: result.output,
                error: result.error
            });
        }
        
        const allPassed = results.every(r => r.passed);
        
        return {
            success: allPassed,
            results,
            summary: {
                total: results.length,
                passed: results.filter(r => r.passed).length,
                failed: results.filter(r => !r.passed).length
            }
        };
    }

    /**
     * Private method to execute a single quality gate
     */
    async _executeQualityGate(criterion) {
        try {
            // Detect different types of quality gates
            if (criterion.startsWith('npm run ') || criterion.startsWith('node ')) {
                // Execute npm/node commands
                return await this._executeCommand(criterion);
            } else if (criterion.startsWith('file exists: ')) {
                // Check file existence
                const filePath = criterion.replace('file exists: ', '').trim();
                const exists = fs.existsSync(filePath);
                return { success: exists, output: `File ${exists ? 'exists' : 'missing'}: ${filePath}` };
            } else if (criterion.startsWith('coverage > ')) {
                // Check coverage threshold
                const threshold = parseFloat(criterion.replace('coverage > ', '').replace('%', ''));
                return await this._checkCoverageThreshold(threshold);
            } else if (criterion.startsWith('tests pass')) {
                // Run tests
                return await this._executeCommand('npm test');
            } else if (criterion.startsWith('lint passes')) {
                // Run linting
                return await this._executeCommand('npm run lint');
            } else {
                // Default: treat as manual verification needed
                return { 
                    success: false, 
                    output: 'Manual verification required',
                    error: `Cannot auto-execute: ${criterion}` 
                };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute a shell command for quality gates
     */
    async _executeCommand(command) {
        return new Promise((resolve) => {
            const { exec } = require('child_process');
            exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
                if (error) {
                    resolve({ 
                        success: false, 
                        output: stdout || '', 
                        error: stderr || error.message 
                    });
                } else {
                    resolve({ 
                        success: true, 
                        output: stdout || 'Command completed successfully' 
                    });
                }
            });
        });
    }

    /**
     * Check if coverage meets threshold
     */
    async _checkCoverageThreshold(threshold) {
        try {
            // Try to read coverage summary
            const coveragePath = './coverage/coverage-summary.json';
            if (!fs.existsSync(coveragePath)) {
                return { 
                    success: false, 
                    error: 'Coverage report not found. Run npm run test:coverage first.' 
                };
            }
            
            const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
            const totalCoverage = coverage.total && coverage.total.lines ? coverage.total.lines.pct : 0;
            
            return {
                success: totalCoverage >= threshold,
                output: `Coverage: ${totalCoverage}% (threshold: ${threshold}%)`,
                actualCoverage: totalCoverage
            };
        } catch (error) {
            return { success: false, error: `Coverage check failed: ${error.message}` };
        }
    }

    /**
     * Add executable quality gate to task
     * @param {string} taskId - Task ID
     * @param {string} gateCommand - Executable command or check
     * @returns {boolean} Success status
     */
    async addQualityGate(taskId, gateCommand) {
        const todoData = await this.readTodoFast();
        const task = todoData.tasks.find(t => t.id === taskId);
        
        if (!task) return false;
        
        if (!task.success_criteria) {
            task.success_criteria = [];
        }
        
        if (!task.success_criteria.includes(gateCommand)) {
            task.success_criteria.push(gateCommand);
            await this.writeTodo(todoData);
            return true;
        }
        
        return false;
    }

    /**
     * Batch update multiple tasks
     * @param {Array} updates - Array of {taskId, field, value} objects
     * @returns {Object} Batch update results
     */
    async batchUpdateTasks(updates) {
        const todoData = await this.readTodoFast();
        const results = { success: [], failed: [] };
        
        updates.forEach(update => {
            const task = todoData.tasks.find(t => t.id === update.taskId);
            if (task && update.field && update.value !== undefined) {
                task[update.field] = update.value;
                results.success.push(update.taskId);
            } else {
                results.failed.push({ taskId: update.taskId, error: 'Task not found or invalid update' });
            }
        });
        
        if (results.success.length > 0) {
            await this.writeTodo(todoData);
        }
        
        return results;
    }

    /**
     * Filter and query tasks with various criteria
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered tasks
     */
    async queryTasks(filters = {}) {
        const todoData = await this.readTodoFast();
        let tasks = todoData.tasks || [];
        
        // Apply filters
        if (filters.status) {
            tasks = tasks.filter(t => t.status === filters.status);
        }
        
        if (filters.priority) {
            tasks = tasks.filter(t => t.priority === filters.priority);
        }
        
        if (filters.mode) {
            tasks = tasks.filter(t => t.mode === filters.mode);
        }
        
        if (filters.hasFile) {
            tasks = tasks.filter(t => 
                t.important_files && t.important_files.some(f => f.includes(filters.hasFile))
            );
        }
        
        if (filters.titleContains) {
            tasks = tasks.filter(t => 
                t.title.toLowerCase().includes(filters.titleContains.toLowerCase())
            );
        }
        
        return tasks;
    }

    /**
     * Create task from common templates
     * @param {string} templateType - Template type
     * @param {Object} params - Template parameters
     * @returns {string} Created task ID
     */
    async createTaskFromTemplate(templateType, params = {}) {
        const templates = {
            'bug-fix': {
                title: `Fix bug: ${params.bugDescription || 'Untitled bug'}`,
                description: `Investigate and fix the following bug:\n\n${params.bugDescription || 'Bug description needed'}\n\nSteps to reproduce:\n${params.stepsToReproduce || '1. Steps needed'}`,
                mode: 'DEVELOPMENT',
                priority: params.priority || 'high',
                success_criteria: [
                    'lint passes',
                    'tests pass',
                    'Bug no longer reproducible'
                ]
            },
            
            'feature': {
                title: `Implement feature: ${params.featureName || 'Untitled feature'}`,
                description: `Implement the following feature:\n\n${params.featureDescription || 'Feature description needed'}\n\nAcceptance criteria:\n${params.acceptanceCriteria || '- Criteria needed'}`,
                mode: 'DEVELOPMENT',
                priority: params.priority || 'medium',
                success_criteria: [
                    'lint passes',
                    'tests pass',
                    'coverage > 80%',
                    'Feature meets acceptance criteria'
                ]
            },
            
            'refactor': {
                title: `Refactor: ${params.targetComponent || 'Untitled component'}`,
                description: `Refactor the following component:\n\n${params.refactorDescription || 'Refactor description needed'}\n\nGoals:\n${params.goals || '- Improve maintainability'}`,
                mode: 'REFACTORING',
                priority: params.priority || 'medium',
                success_criteria: [
                    'lint passes',
                    'tests pass',
                    'coverage maintained',
                    'No breaking changes'
                ]
            },
            
            'research': {
                title: `Research: ${params.topic || 'Untitled research'}`,
                description: `Research the following topic:\n\n${params.researchDescription || 'Research description needed'}\n\nQuestions to answer:\n${params.questions || '- Questions needed'}`,
                mode: 'RESEARCH',
                priority: params.priority || 'medium',
                requires_research: true
            }
        };
        
        const template = templates[templateType];
        if (!template) {
            throw new Error(`Unknown template type: ${templateType}. Available: ${Object.keys(templates).join(', ')}`);
        }
        
        return await this.createTask({ ...template, ...params });
    }

    /**
     * Enhanced error tracking for task failures
     * @param {string} taskId - Task ID
     * @param {Object} errorInfo - Error information
     */
    async trackTaskError(taskId, errorInfo) {
        const todoData = await this.readTodoFast();
        const task = todoData.tasks.find(t => t.id === taskId);
        
        if (!task) return false;
        
        if (!task.errors) {
            task.errors = [];
        }
        
        task.errors.push({
            timestamp: new Date().toISOString(),
            type: errorInfo.type || 'unknown',
            message: errorInfo.message || '',
            context: errorInfo.context || {},
            recoverable: errorInfo.recoverable || false
        });
        
        // Also update status if this is a blocking error
        if (errorInfo.blocking) {
            task.status = 'blocked';
        }
        
        await this.writeTodo(todoData);
        return true;
    }

    /**
     * Get error summary for debugging
     * @param {string} taskId - Task ID (optional, gets all errors if not provided)
     * @returns {Object} Error summary
     */
    async getErrorSummary(taskId = null) {
        const todoData = await this.readTodoFast();
        
        if (taskId) {
            const task = todoData.tasks.find(t => t.id === taskId);
            return task ? (task.errors || []) : [];
        }
        
        // Get all errors across all tasks
        const allErrors = [];
        todoData.tasks.forEach(task => {
            if (task.errors) {
                task.errors.forEach(error => {
                    allErrors.push({ taskId: task.id, taskTitle: task.title, ...error });
                });
            }
        });
        
        return {
            totalErrors: allErrors.length,
            errorsByType: this._groupErrorsByType(allErrors),
            recentErrors: allErrors.filter(e => 
                new Date() - new Date(e.timestamp) < 24 * 60 * 60 * 1000 // Last 24 hours
            ),
            blockingTasks: todoData.tasks.filter(t => t.status === 'blocked').map(t => ({ id: t.id, title: t.title }))
        };
    }

    /**
     * Remove a task by ID
     * @param {string} taskId - Task ID to remove
     * @returns {boolean} True if task was removed, false if not found
     */
    async removeTask(taskId) {
        const todoData = await this.readTodoFast();
        const initialCount = todoData.tasks.length;
        
        // Filter out the task with the specified ID
        todoData.tasks = todoData.tasks.filter(task => task.id !== taskId);
        
        // Check if a task was actually removed
        if (todoData.tasks.length < initialCount) {
            await this.writeTodo(todoData);
            return true;
        }
        
        return false;
    }

    /**
     * Remove multiple tasks by IDs
     * @param {Array} taskIds - Array of task IDs to remove
     * @returns {Object} Result with success/failed arrays
     */
    async removeTasks(taskIds) {
        const todoData = await this.readTodoFast();
        const results = { success: [], failed: [] };
        
        taskIds.forEach(taskId => {
            const taskExists = todoData.tasks.some(task => task.id === taskId);
            if (taskExists) {
                results.success.push(taskId);
            } else {
                results.failed.push(taskId);
            }
        });
        
        // Remove all successful task IDs
        if (results.success.length > 0) {
            todoData.tasks = todoData.tasks.filter(task => 
                !results.success.includes(task.id)
            );
            await this.writeTodo(todoData);
        }
        
        return results;
    }

    /**
     * Reorder a task to a new position
     * @param {string} taskId - Task ID to reorder
     * @param {number} newIndex - New position index (0-based)
     * @returns {boolean} True if task was reordered, false if not found
     */
    async reorderTask(taskId, newIndex) {
        const todoData = await this.readTodoFast();
        const taskIndex = todoData.tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) {
            return false; // Task not found
        }
        
        // Validate new index
        if (newIndex < 0 || newIndex >= todoData.tasks.length) {
            throw new Error(`Invalid index ${newIndex}. Must be between 0 and ${todoData.tasks.length - 1}`);
        }
        
        // If already at the target position, no change needed
        if (taskIndex === newIndex) {
            return true;
        }
        
        // Remove task from current position
        const [task] = todoData.tasks.splice(taskIndex, 1);
        
        // Insert task at new position
        todoData.tasks.splice(newIndex, 0, task);
        
        await this.writeTodo(todoData);
        return true;
    }

    /**
     * Move a task to the beginning of the list
     * @param {string} taskId - Task ID to move to top
     * @returns {boolean} True if task was moved, false if not found
     */
    async moveTaskToTop(taskId) {
        return await this.reorderTask(taskId, 0);
    }

    /**
     * Move a task to the end of the list
     * @param {string} taskId - Task ID to move to bottom
     * @returns {boolean} True if task was moved, false if not found
     */
    async moveTaskToBottom(taskId) {
        const todoData = await this.readTodoFast();
        const lastIndex = todoData.tasks.length - 1;
        return await this.reorderTask(taskId, lastIndex);
    }

    /**
     * Move a task up one position
     * @param {string} taskId - Task ID to move up
     * @returns {boolean} True if task was moved, false if not found or already at top
     */
    async moveTaskUp(taskId) {
        const todoData = await this.readTodoFast();
        const taskIndex = todoData.tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1 || taskIndex === 0) {
            return false; // Task not found or already at top
        }
        
        return await this.reorderTask(taskId, taskIndex - 1);
    }

    /**
     * Move a task down one position
     * @param {string} taskId - Task ID to move down
     * @returns {boolean} True if task was moved, false if not found or already at bottom
     */
    async moveTaskDown(taskId) {
        const todoData = await this.readTodoFast();
        const taskIndex = todoData.tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1 || taskIndex === todoData.tasks.length - 1) {
            return false; // Task not found or already at bottom
        }
        
        return await this.reorderTask(taskId, taskIndex + 1);
    }

    /**
     * Reorder multiple tasks to new positions
     * @param {Array} reorderSpecs - Array of {taskId, newIndex} objects
     * @returns {Object} Result with success/failed arrays and details
     */
    async reorderTasks(reorderSpecs) {
        const todoData = await this.readTodoFast();
        const results = { success: [], failed: [], errors: [] };
        
        // Validate all specs first
        for (const spec of reorderSpecs) {
            const { taskId, newIndex } = spec;
            
            if (!taskId || typeof newIndex !== 'number') {
                results.failed.push(taskId || 'unknown');
                results.errors.push({
                    taskId: taskId || 'unknown',
                    error: 'Invalid reorder specification: requires taskId and numeric newIndex'
                });
                continue;
            }
            
            const taskExists = todoData.tasks.some(task => task.id === taskId);
            if (!taskExists) {
                results.failed.push(taskId);
                results.errors.push({
                    taskId,
                    error: 'Task not found'
                });
                continue;
            }
            
            if (newIndex < 0 || newIndex >= todoData.tasks.length) {
                results.failed.push(taskId);
                results.errors.push({
                    taskId,
                    error: `Invalid index ${newIndex}. Must be between 0 and ${todoData.tasks.length - 1}`
                });
                continue;
            }
            
            results.success.push(taskId);
        }
        
        // If any validation failed, don't perform any reordering
        if (results.failed.length > 0) {
            return results;
        }
        
        // Sort reorder specs by current position to avoid conflicts
        const sortedSpecs = reorderSpecs
            .map(spec => ({
                ...spec,
                currentIndex: todoData.tasks.findIndex(task => task.id === spec.taskId)
            }))
            .sort((a, b) => a.currentIndex - b.currentIndex);
        
        // Apply reordering operations in sequence
        for (const spec of sortedSpecs) {
            const { taskId, newIndex } = spec;
            const currentIndex = todoData.tasks.findIndex(task => task.id === taskId);
            
            if (currentIndex !== newIndex) {
                // Remove task from current position
                const [task] = todoData.tasks.splice(currentIndex, 1);
                // Insert at new position
                todoData.tasks.splice(newIndex, 0, task);
            }
        }
        
        await this.writeTodo(todoData);
        return results;
    }

    /**
     * Get the current position of a task
     * @param {string} taskId - Task ID to find position for
     * @returns {number} Current index of task, or -1 if not found
     */
    getTaskPosition(taskId) {
        const todoData = this.readTodo();
        return todoData.tasks.findIndex(task => task.id === taskId);
    }

    /**
     * Archive a completed task to DONE.json
     * @param {Object} task - Task object to archive
     */
    async archiveCompletedTask(task) {
        if (!this.options.enableArchiving) {
            return;
        }

        // Add completion timestamp
        const archivedTask = {
            ...task,
            completed_at: new Date().toISOString(),
            archived_from_todo: this.todoPath
        };

        // Read or create DONE.json
        let doneData;
        if (fs.existsSync(this.donePath)) {
            try {
                const content = fs.readFileSync(this.donePath, 'utf8');
                doneData = JSON.parse(content);
            } catch {
                // If DONE.json is corrupted, create new structure
                doneData = this._createDoneStructure();
            }
        } else {
            doneData = this._createDoneStructure();
        }

        // Add task to completed tasks
        doneData.completed_tasks.push(archivedTask);
        doneData.total_completed = doneData.completed_tasks.length;
        doneData.last_completion = archivedTask.completed_at;

        // Write DONE.json
        fs.writeFileSync(this.donePath, JSON.stringify(doneData, null, 2));
    }

    /**
     * Create initial DONE.json structure
     * @returns {Object} DONE.json structure
     */
    _createDoneStructure() {
        return {
            project: "infinite-continue-stop-hook",
            completed_tasks: [],
            total_completed: 0,
            last_completion: null,
            created_at: new Date().toISOString()
        };
    }

    /**
     * Read DONE.json file
     * @returns {Object} DONE.json data
     */
    async readDone() {
        if (!fs.existsSync(this.donePath)) {
            return this._createDoneStructure();
        }

        try {
            const content = fs.readFileSync(this.donePath, 'utf8');
            return JSON.parse(content);
        } catch {
            return this._createDoneStructure();
        }
    }

    /**
     * Get completed tasks with optional filtering
     * @param {Object} filters - Optional filters (limit, since, taskType, etc.)
     * @returns {Array} Array of completed tasks
     */
    async getCompletedTasks(filters = {}) {
        const doneData = await this.readDone();
        let tasks = doneData.completed_tasks || [];

        // Apply filters
        if (filters.limit && typeof filters.limit === 'number') {
            tasks = tasks.slice(-filters.limit); // Get most recent N tasks
        }

        if (filters.since && typeof filters.since === 'string') {
            const sinceDate = new Date(filters.since);
            tasks = tasks.filter(task => 
                task.completed_at && new Date(task.completed_at) >= sinceDate
            );
        }

        if (filters.mode && typeof filters.mode === 'string') {
            tasks = tasks.filter(task => task.mode === filters.mode);
        }

        if (filters.priority && typeof filters.priority === 'string') {
            tasks = tasks.filter(task => task.priority === filters.priority);
        }

        return tasks;
    }

    /**
     * Get completion statistics
     * @returns {Object} Statistics about completed tasks
     */
    async getCompletionStats() {
        const doneData = await this.readDone();
        const tasks = doneData.completed_tasks || [];

        const stats = {
            total_completed: tasks.length,
            last_completion: doneData.last_completion,
            modes: {},
            priorities: {},
            recent_completions: {
                last_24h: 0,
                last_7d: 0,
                last_30d: 0
            }
        };

        const now = new Date();
        const day = 24 * 60 * 60 * 1000;

        tasks.forEach(task => {
            // Count by mode
            if (task.mode) {
                stats.modes[task.mode] = (stats.modes[task.mode] || 0) + 1;
            }

            // Count by priority
            if (task.priority) {
                stats.priorities[task.priority] = (stats.priorities[task.priority] || 0) + 1;
            }

            // Count recent completions
            if (task.completed_at) {
                const completedAt = new Date(task.completed_at);
                const daysAgo = (now - completedAt) / day;

                if (daysAgo <= 1) stats.recent_completions.last_24h++;
                if (daysAgo <= 7) stats.recent_completions.last_7d++;
                if (daysAgo <= 30) stats.recent_completions.last_30d++;
            }
        });

        return stats;
    }

    /**
     * Restore a completed task back to TODO.json
     * @param {string} taskId - ID of completed task to restore
     * @returns {boolean} True if task was restored, false if not found
     */
    async restoreCompletedTask(taskId) {
        const doneData = await this.readDone();
        const taskIndex = doneData.completed_tasks.findIndex(task => task.id === taskId);

        if (taskIndex === -1) {
            return false;
        }

        // Remove from DONE.json
        const [task] = doneData.completed_tasks.splice(taskIndex, 1);
        doneData.total_completed = doneData.completed_tasks.length;

        // Clean up archive metadata
        const {completed_at: _completed_at, archived_from_todo: _archived_from_todo, ...restoredTask} = task;
        restoredTask.status = 'pending'; // Reset status

        // Add back to TODO.json
        const todoData = await this.readTodoFast();
        todoData.tasks.push(restoredTask);

        // Write both files
        await this.writeTodo(todoData);
        fs.writeFileSync(this.donePath, JSON.stringify(doneData, null, 2));

        return true;
    }

    /**
     * Migrate all existing completed tasks from TODO.json to DONE.json
     * @returns {Object} Migration results with counts
     */
    async migrateCompletedTasks() {
        const todoData = await this.readTodoFast();
        const completedTasks = todoData.tasks.filter(task => task.status === 'completed');
        
        if (completedTasks.length === 0) {
            return { migrated: 0, skipped: 0, total: 0 };
        }

        let migrated = 0;
        let skipped = 0;

        // Archive each completed task
        for (const task of completedTasks) {
            try {
                await this.archiveCompletedTask(task);
                migrated++;
            } catch (error) {
                console.warn(`Failed to archive task ${task.id}: ${error.message}`);
                skipped++;
            }
        }

        // Remove all successfully archived tasks from TODO.json
        if (migrated > 0) {
            todoData.tasks = todoData.tasks.filter(task => task.status !== 'completed');
            await this.writeTodo(todoData);
        }

        return {
            migrated,
            skipped,
            total: completedTasks.length
        };
    }


    /**
     * Get pending linter reminders from recent completed tasks
     */
    async getLinterReminders(hoursBack = 24) {
        const todoData = await this.readTodoFast();
        const cutoffTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
        const reminders = [];

        // Check completed tasks in TODO.json (if archiving is disabled)
        if (todoData.tasks) {
            todoData.tasks.forEach(task => {
                if (task.status === 'completed' && 
                    task.linterReminder && 
                    task.linterReminder.needsLinting) {
                    const taskTime = new Date(task.linterReminder.timestamp);
                    if (taskTime > cutoffTime) {
                        reminders.push(task.linterReminder);
                    }
                }
            });
        }

        // Also check recently archived tasks in DONE.json
        try {
            if (fs.existsSync(this.donePath)) {
                const doneContent = fs.readFileSync(this.donePath, 'utf8');
                const doneData = JSON.parse(doneContent);
                
                if (doneData.completed_tasks) {
                    doneData.completed_tasks.forEach(task => {
                        if (task.linterReminder && task.linterReminder.needsLinting) {
                            const taskTime = new Date(task.linterReminder.timestamp);
                            if (taskTime > cutoffTime) {
                                reminders.push(task.linterReminder);
                            }
                        }
                    });
                }
            }
        } catch {
            // Ignore errors reading DONE.json
        }

        return reminders;
    }

    /**
     * Generate linter feedback message for Claude Code
     */
    async generateLinterFeedbackMessage() {
        if (!this.options.enableLinterReminders) {
            return null;
        }

        const reminders = await this.getLinterReminders(1); // Last 1 hour
        if (reminders.length === 0) {
            return null;
        }

        // Collect unique directories from all reminders
        const allDirectories = new Set();
        const taskTitles = [];

        reminders.forEach(reminder => {
            reminder.directories.forEach(dir => allDirectories.add(dir));
            taskTitles.push(reminder.taskTitle);
        });

        if (allDirectories.size === 0) {
            return null;
        }

        const dirList = Array.from(allDirectories).sort();
        const message = {
            type: 'linter_reminder',
            title: '🔍 Linter Check Recommended',
            message: this.buildLinterMessage(taskTitles, dirList),
            directories: dirList,
            taskCount: reminders.length
        };

        return message;
    }

    /**
     * Build the linter feedback message text
     */
    buildLinterMessage(taskTitles, directories) {
        const taskText = taskTitles.length === 1 ? 
            `task "${taskTitles[0]}"` : 
            `${taskTitles.length} tasks`;

        const dirText = directories.length === 1 ?
            `the ${directories[0]} directory` :
            `these directories: ${directories.join(', ')}`;

        return `You recently completed ${taskText} that worked in ${dirText}.

## Code Quality Check Required

Based on your recent work, it's important to run linter checks to maintain code quality and ensure consistency across the project.

**Primary Actions:**

1. **Run targeted linting on modified areas:**
${directories.map(dir => `   \`npm run lint ${dir}\``).join('\n')}

2. **Run full project lint check:**
   \`npm run lint\`

3. **Address any linting errors before continuing:**
   \`npm run lint:fix\` (for auto-fixable issues)

**Why This Matters:**
- Maintains consistent code style across the project
- Catches potential bugs and code quality issues early
- Ensures your recent changes follow project standards
- Prevents accumulation of technical debt

**Next Steps:**
After addressing any linting issues, you can continue with your next task. Clean code is maintainable code!`;
    }

    /**
     * Private method to group errors by type
     */
    _groupErrorsByType(errors) {
        const grouped = {};
        errors.forEach(error => {
            const type = error.type || 'unknown';
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push(error);
        });
        return grouped;
    }

    // ============================================================================
    // MULTI-AGENT SUPPORT METHODS
    // ============================================================================

    /**
     * Assign a task to a specific agent
     * @param {string} taskId - Task ID to assign
     * @param {string} agentId - Agent ID to assign to
     * @param {string} role - Assignment role (primary, secondary, coordinator)
     * @returns {boolean} Success status
     */
    async assignTaskToAgent(taskId, agentId, role = "primary") {
        const todoData = await this.readTodoFast();
        const task = todoData.tasks.find(t => t.id === taskId);
        
        if (!task) {
            return false;
        }

        // Initialize multi-agent fields if not present
        if (!task.assigned_agent) {
            task.assigned_agent = agentId;
        }
        
        if (!task.agent_assignment_history) {
            task.agent_assignment_history = [];
        }
        
        if (!task.parallel_execution) {
            task.parallel_execution = {
                canParallelize: false,
                parallelWith: [],
                coordinatorTask: null
            };
        }

        // Record assignment history
        task.agent_assignment_history.push({
            agentId: agentId,
            role: role,
            assignedAt: new Date().toISOString(),
            reassignReason: null
        });

        // Update task status if assigning to primary agent
        if (role === "primary" && task.status === 'pending') {
            task.status = 'in_progress';
        }

        await this.writeTodo(todoData);
        return true;
    }

    /**
     * Get tasks assigned to a specific agent
     * @param {string} agentId - Agent ID
     * @param {boolean} includeCoordination - Include coordination tasks
     * @returns {Array} Array of tasks assigned to the agent
     */
    async getTasksForAgent(agentId, includeCoordination = false) {
        const todoData = await this.readTodoFast();
        const assignedTasks = todoData.tasks.filter(task => {
            // Primary assignment
            if (task.assigned_agent === agentId) {
                return true;
            }
            
            // Coordination tasks if requested
            if (includeCoordination && 
                task.parallel_execution?.coordinatorTask === agentId) {
                return true;
            }
            
            // Secondary assignments in history
            if (task.agent_assignment_history) {
                return task.agent_assignment_history.some(
                    history => history.agentId === agentId && 
                              history.role !== 'primary'
                );
            }
            
            return false;
        });

        return assignedTasks;
    }

    /**
     * Reassign a task from one agent to another
     * @param {string} taskId - Task ID
     * @param {string} fromAgentId - Current agent ID
     * @param {string} toAgentId - New agent ID
     * @param {string} reason - Reason for reassignment
     * @returns {boolean} Success status
     */
    async reassignTask(taskId, fromAgentId, toAgentId, reason) {
        const todoData = await this.readTodoFast();
        const task = todoData.tasks.find(t => t.id === taskId);
        
        if (!task || task.assigned_agent !== fromAgentId) {
            return false;
        }

        // Update assignment
        task.assigned_agent = toAgentId;
        
        // Record reassignment in history
        if (!task.agent_assignment_history) {
            task.agent_assignment_history = [];
        }
        
        task.agent_assignment_history.push({
            agentId: toAgentId,
            role: "primary",
            assignedAt: new Date().toISOString(),
            reassignReason: reason
        });

        await this.writeTodo(todoData);
        return true;
    }

    /**
     * Release a task from an agent
     * @param {string} taskId - Task ID
     * @param {string} agentId - Agent ID
     * @returns {boolean} Success status
     */
    async releaseTaskFromAgent(taskId, agentId) {
        const todoData = await this.readTodoFast();
        const task = todoData.tasks.find(t => t.id === taskId);
        
        if (!task || task.assigned_agent !== agentId) {
            return false;
        }

        // Reset assignment
        task.assigned_agent = null;
        
        // Reset status if in progress
        if (task.status === 'in_progress') {
            task.status = 'pending';
        }

        await this.writeTodo(todoData);
        return true;
    }

    /**
     * Get available tasks for multiple agents
     * @param {number} agentCount - Number of agents requesting tasks
     * @param {Array} agentCapabilities - Array of agent capability arrays
     * @returns {Array} Array of available tasks
     */
    async getAvailableTasksForAgents(agentCount, agentCapabilities = []) {
        const todoData = await this.readTodoFast();
        const availableTasks = todoData.tasks.filter(task => {
            // Must be pending and unassigned
            if (task.status !== 'pending' || task.assigned_agent) {
                return false;
            }
            
            // Check dependencies are met
            if (task.dependencies && task.dependencies.length > 0) {
                const completedTasks = todoData.tasks
                    .filter(t => t.status === 'completed')
                    .map(t => t.id);
                
                if (!task.dependencies.every(depId => completedTasks.includes(depId))) {
                    return false;
                }
            }
            
            return true;
        });

        // Prioritize tasks based on agent capabilities if provided
        if (agentCapabilities.length > 0) {
            availableTasks.sort((a, b) => {
                const aScore = this._calculateTaskAgentScore(a, agentCapabilities);
                const bScore = this._calculateTaskAgentScore(b, agentCapabilities);
                return bScore - aScore;
            });
        }

        // Return up to agentCount tasks
        return availableTasks.slice(0, agentCount);
    }

    /**
     * Get tasks that can be executed in parallel
     * @param {number} maxAgents - Maximum number of agents
     * @returns {Array} Array of parallelizable task groups
     */
    async getParallelizableTasks(maxAgents = 3) {
        const availableTasks = await this.getAvailableTasksForAgents(999); // Get all available
        
        const parallelGroups = [];
        const usedTasks = new Set();
        
        for (const task of availableTasks) {
            if (usedTasks.has(task.id)) continue;
            
            // Check if task can be parallelized
            if (task.parallel_execution?.canParallelize) {
                const parallelTasks = [task];
                usedTasks.add(task.id);
                
                // Find related parallel tasks
                if (task.parallel_execution.parallelWith) {
                    for (const parallelTaskId of task.parallel_execution.parallelWith) {
                        const parallelTask = availableTasks.find(t => t.id === parallelTaskId);
                        if (parallelTask && !usedTasks.has(parallelTask.id)) {
                            parallelTasks.push(parallelTask);
                            usedTasks.add(parallelTask.id);
                        }
                    }
                }
                
                if (parallelTasks.length <= maxAgents) {
                    parallelGroups.push({
                        tasks: parallelTasks,
                        coordinatorTask: task.parallel_execution.coordinatorTask,
                        estimatedDuration: Math.max(...parallelTasks.map(t => 
                            this._parseEstimate(t.estimate || '1 hour')
                        ))
                    });
                }
            }
        }
        
        return parallelGroups;
    }

    /**
     * Claim a task for an agent with distributed locking
     * @param {string} taskId - Task ID
     * @param {string} agentId - Agent ID
     * @param {string} priority - Claim priority (normal, high, urgent)
     * @returns {Object} Claim result
     */
    async claimTask(taskId, agentId, priority = "normal") {
        if (!this.options.enableMultiAgent) {
            // Fall back to simple assignment if multi-agent is disabled
            return await this.claimTaskSimple(taskId, agentId, priority);
        }

        // Use distributed locking for safe task claiming
        const lockResult = await this.lockManager.acquireLock(this.todoPath, agentId);
        
        if (!lockResult.success) {
            return {
                success: false,
                reason: `Failed to acquire lock: ${lockResult.error}`,
                lockError: lockResult
            };
        }

        try {
            const todoData = await this.readTodoFast();
            const task = todoData.tasks.find(t => t.id === taskId);
            
            if (!task) {
                return { success: false, reason: 'Task not found' };
            }
            
            if (task.status !== 'pending') {
                return { success: false, reason: 'Task is not available for claiming' };
            }
            
            if (task.assigned_agent) {
                return { success: false, reason: 'Task is already assigned to another agent' };
            }
            
            // Check dependencies
            if (task.dependencies && task.dependencies.length > 0) {
                const completedTasks = todoData.tasks
                    .filter(t => t.status === 'completed')
                    .map(t => t.id);
                
                const unmetDeps = task.dependencies.filter(depId => 
                    !completedTasks.includes(depId)
                );
                
                if (unmetDeps.length > 0) {
                    return { 
                        success: false, 
                        reason: 'Unmet dependencies',
                        unmetDependencies: unmetDeps
                    };
                }
            }
            
            // Claim the task atomically
            task.assigned_agent = agentId;
            task.status = 'in_progress';
            
            // Initialize multi-agent fields if not present
            if (!task.agent_assignment_history) {
                task.agent_assignment_history = [];
            }
            
            task.agent_assignment_history.push({
                agentId: agentId,
                role: 'primary',
                assignedAt: new Date().toISOString(),
                reassignReason: null,
                claimPriority: priority
            });

            await this.writeTodo(todoData);
            
            return { 
                success: true, 
                task: task,
                claimedAt: new Date().toISOString(),
                priority: priority,
                lockId: lockResult.lockId
            };
            
        } finally {
            // Always release the lock
            await this.lockManager.releaseLock(this.todoPath, agentId);
        }
    }

    /**
     * Simple task claiming without distributed locking (fallback)
     * @param {string} taskId - Task ID
     * @param {string} agentId - Agent ID
     * @param {string} priority - Claim priority
     * @returns {Object} Claim result
     */
    async claimTaskSimple(taskId, agentId, priority = "normal") {
        const todoData = await this.readTodoFast();
        const task = todoData.tasks.find(t => t.id === taskId);
        
        if (!task) {
            return { success: false, reason: 'Task not found' };
        }
        
        if (task.status !== 'pending') {
            return { success: false, reason: 'Task is not available for claiming' };
        }
        
        if (task.assigned_agent) {
            return { success: false, reason: 'Task is already assigned to another agent' };
        }
        
        // Check dependencies
        if (task.dependencies && task.dependencies.length > 0) {
            const completedTasks = todoData.tasks
                .filter(t => t.status === 'completed')
                .map(t => t.id);
            
            const unmetDeps = task.dependencies.filter(depId => 
                !completedTasks.includes(depId)
            );
            
            if (unmetDeps.length > 0) {
                return { 
                    success: false, 
                    reason: 'Unmet dependencies',
                    unmetDependencies: unmetDeps
                };
            }
        }
        
        // Claim the task
        const success = await this.assignTaskToAgent(taskId, agentId, 'primary');
        
        if (success) {
            return { 
                success: true, 
                task: task,
                claimedAt: new Date().toISOString(),
                priority: priority
            };
        } else {
            return { success: false, reason: 'Failed to assign task' };
        }
    }

    /**
     * Create a coordinated execution plan
     * @param {string} masterTaskId - Master task ID
     * @param {Array} workerTaskIds - Worker task IDs
     * @param {string} coordinatorAgentId - Coordinator agent ID
     * @returns {Object} Coordination plan
     */
    async createCoordinatedExecution(masterTaskId, workerTaskIds, coordinatorAgentId) {
        const todoData = await this.readTodoFast();
        const masterTask = todoData.tasks.find(t => t.id === masterTaskId);
        
        if (!masterTask) {
            return { success: false, reason: 'Master task not found' };
        }
        
        // Update master task for coordination
        masterTask.parallel_execution = {
            canParallelize: true,
            parallelWith: workerTaskIds,
            coordinatorTask: coordinatorAgentId,
            role: 'master',
            syncPoints: [],
            createdAt: new Date().toISOString()
        };
        
        // Update worker tasks
        for (const workerTaskId of workerTaskIds) {
            const workerTask = todoData.tasks.find(t => t.id === workerTaskId);
            if (workerTask) {
                workerTask.parallel_execution = {
                    canParallelize: true,
                    parallelWith: [masterTaskId, ...workerTaskIds.filter(id => id !== workerTaskId)],
                    coordinatorTask: coordinatorAgentId,
                    role: 'worker',
                    masterTask: masterTaskId,
                    syncPoints: [],
                    createdAt: new Date().toISOString()
                };
            }
        }
        
        await this.writeTodo(todoData);
        
        return {
            success: true,
            coordinationPlan: {
                masterId: masterTaskId,
                workerIds: workerTaskIds,
                coordinatorId: coordinatorAgentId,
                totalTasks: 1 + workerTaskIds.length,
                createdAt: new Date().toISOString()
            }
        };
    }

    /**
     * Create parallel execution plan for independent tasks
     * @param {Array} taskIds - Task IDs to execute in parallel
     * @param {Array} agentIds - Agent IDs to assign tasks to
     * @param {Array} syncPoints - Synchronization checkpoints
     * @returns {Object} Parallel execution plan
     */
    async createParallelExecution(taskIds, agentIds, syncPoints = []) {
        const todoData = await this.readTodoFast();
        const tasks = taskIds.map(id => todoData.tasks.find(t => t.id === id)).filter(t => t);
        
        if (tasks.length !== taskIds.length) {
            return { success: false, reason: 'Some tasks not found' };
        }
        
        if (agentIds.length < taskIds.length) {
            return { success: false, reason: 'Not enough agents for parallel execution' };
        }
        
        // Assign tasks to agents
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            const agentId = agentIds[i];
            
            task.parallel_execution = {
                canParallelize: true,
                parallelWith: taskIds.filter(id => id !== task.id),
                coordinatorTask: null,
                role: 'parallel',
                syncPoints: syncPoints,
                assignedAgent: agentId,
                createdAt: new Date().toISOString()
            };
            
            await this.assignTaskToAgent(task.id, agentId, 'primary');
        }
        
        await this.writeTodo(todoData);
        
        return {
            success: true,
            parallelPlan: {
                taskIds: taskIds,
                agentIds: agentIds,
                syncPoints: syncPoints,
                estimatedDuration: Math.max(...tasks.map(t => 
                    this._parseEstimate(t.estimate || '1 hour')
                )),
                createdAt: new Date().toISOString()
            }
        };
    }

    /**
     * Calculate task-agent compatibility score
     * @param {Object} task - Task object
     * @param {Array} agentCapabilityArrays - Array of agent capability arrays
     * @returns {number} Compatibility score
     */
    _calculateTaskAgentScore(task, agentCapabilityArrays) {
        let maxScore = 0;
        
        for (const capabilities of agentCapabilityArrays) {
            let score = 0;
            
            // Mode compatibility
            if (capabilities.includes('mode:' + task.mode?.toLowerCase())) {
                score += 50;
            }
            
            // Required capabilities
            if (task.required_capabilities) {
                const matches = task.required_capabilities.filter(cap => 
                    capabilities.includes(cap)
                ).length;
                score += matches * 10;
            }
            
            // Priority weighting
            if (task.priority === 'high') score += 20;
            if (task.priority === 'medium') score += 10;
            
            maxScore = Math.max(maxScore, score);
        }
        
        return maxScore;
    }

    /**
     * Parse time estimate string to minutes
     * @param {string} estimate - Estimate string (e.g., "2 hours", "30 minutes")
     * @returns {number} Estimate in minutes
     */
    _parseEstimate(estimate) {
        if (!estimate || typeof estimate !== 'string') return 60;
        
        const hourMatch = estimate.match(/(\d+)\s*h/i);
        const minuteMatch = estimate.match(/(\d+)\s*m/i);
        
        let minutes = 0;
        if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
        if (minuteMatch) minutes += parseInt(minuteMatch[1]);
        
        return minutes || 60; // Default to 1 hour
    }

    /**
     * Get multi-agent statistics
     * @returns {Object} Multi-agent statistics
     */
    async getMultiAgentStatistics() {
        const todoData = await this.readTodoFast();
        
        const stats = {
            totalTasks: todoData.tasks.length,
            assignedTasks: 0,
            unassignedTasks: 0,
            parallelTasks: 0,
            coordinatedTasks: 0,
            agentAssignments: {},
            parallelGroups: 0
        };
        
        const parallelGroups = new Set();
        
        todoData.tasks.forEach(task => {
            if (task.assigned_agent) {
                stats.assignedTasks++;
                stats.agentAssignments[task.assigned_agent] = 
                    (stats.agentAssignments[task.assigned_agent] || 0) + 1;
            } else {
                stats.unassignedTasks++;
            }
            
            if (task.parallel_execution?.canParallelize) {
                stats.parallelTasks++;
                
                if (task.parallel_execution.coordinatorTask) {
                    stats.coordinatedTasks++;
                }
                
                // Track parallel groups
                const groupKey = [task.id, ...task.parallel_execution.parallelWith].sort().join(':');
                parallelGroups.add(groupKey);
            }
        });
        
        stats.parallelGroups = parallelGroups.size;
        
        return stats;
    }

    /**
     * Cleanup method to release resources and prevent hanging
     */
    cleanup() {
        if (this.lockManager && typeof this.lockManager.cleanup === 'function') {
            this.lockManager.cleanup();
        }
    }
}

module.exports = TaskManager;