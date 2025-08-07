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
        if (!todoData.tasks || !Array.isArray(todoData.tasks)) {
            return undefined;
        }
        return todoData.tasks.find(t => t && (t.status === 'pending' || t.status === 'in_progress'));
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

    async addImportantFile(taskId, filePath) {
        const todoData = await this.readTodo();
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
        const todoData = await this.readTodo();
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
        const todoData = await this.readTodo();
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
        const todoData = await this.readTodo();
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
        const todoData = await this.readTodo();
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
        const todoData = await this.readTodo();
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
        const todoData = await this.readTodo();
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
        const todoData = await this.readTodo();
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
        const todoData = await this.readTodo();
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
        const todoData = await this.readTodo();
        
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
        const todoData = await this.readTodo();
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
        const todoData = await this.readTodo();
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
}

module.exports = TaskManager;