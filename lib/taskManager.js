const fs = require('fs');
const AutoFixer = require('./autoFixer');

class TaskManager {
    constructor(todoPath, options = {}) {
        this.todoPath = todoPath;
        this.autoFixer = new AutoFixer(options.autoFixer || {});
        this.options = {
            enableAutoFix: options.enableAutoFix !== false,
            autoFixLevel: options.autoFixLevel || 'moderate',
            validateOnRead: options.validateOnRead !== false,
            ...options
        };
    }

    async readTodo() {
        if (!fs.existsSync(this.todoPath)) {
            throw new Error(`TODO.json not found at ${this.todoPath}`);
        }

        try {
            const content = fs.readFileSync(this.todoPath, 'utf8');
            const data = JSON.parse(content);

            // Validate and auto-fix if enabled
            if (this.options.validateOnRead || this.options.enableAutoFix) {
                const status = await this.autoFixer.getFileStatus(this.todoPath);
                
                if (!status.valid && this.options.enableAutoFix && status.canAutoFix) {
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

    async getCurrentTask() {
        const todoData = await this.readTodo();
        return todoData.tasks.find(t => t.status === 'pending' || t.status === 'in_progress');
    }

    async updateTaskStatus(taskId, status) {
        const todoData = await this.readTodo();
        const task = todoData.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = status;
            await this.writeTodo(todoData);
        }
    }

    async addSubtask(parentTaskId, subtask) {
        const todoData = await this.readTodo();
        const parentTask = todoData.tasks.find(t => t.id === parentTaskId);
        if (parentTask) {
            if (!parentTask.subtasks) {
                parentTask.subtasks = [];
            }
            parentTask.subtasks.push(subtask);
            await this.writeTodo(todoData);
        }
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
        const fs = require('fs');
        const path = require('path');
        
        // Convert relative path to absolute path
        const workingDir = process.cwd();
        const absolutePath = path.resolve(workingDir, reportPath);
        
        return fs.existsSync(absolutePath);
    }

    async createTask(taskData) {
        const todoData = await this.readTodo();
        
        // Generate unique task ID
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
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
            if (!successCriteria.some(criterion => criterion.includes('Research report created'))) {
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
    listBackups() {
        return this.autoFixer.recovery.listAvailableBackups(this.todoPath);
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
     * Validates the current TODO.json without making changes
     * @returns {Object} Validation result
     */
    async validateTodoFile() {
        try {
            const content = require('fs').readFileSync(this.todoPath, 'utf8');
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
}

module.exports = TaskManager;