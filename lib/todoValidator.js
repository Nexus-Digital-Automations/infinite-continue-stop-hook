/**
 * TODO.json Validator & Sanitizer
 * 
 * Provides comprehensive validation and sanitization for TODO.json files
 * with automatic error detection and correction capabilities.
 */

const fs = require('fs');
const path = require('path');

class TodoValidator {
    constructor() {
        this.validModes = ['DEVELOPMENT', 'TESTING', 'DEBUGGING', 'REFACTORING', 'DOCUMENTATION', 'RESEARCH', 'REVIEWER', 'TASK_CREATION'];
        this.validStatuses = ['pending', 'in_progress', 'completed'];
        this.validPriorities = ['low', 'medium', 'high'];
        this.requiredFields = {
            root: ['project', 'tasks', 'review_strikes', 'strikes_completed_last_run', 'current_task_index'],
            task: ['id', 'mode', 'description', 'status'],
            subtask: ['id', 'title', 'description', 'mode', 'priority', 'status']
        };
        this.errors = [];
        this.fixes = [];
    }

    /**
     * Validates and sanitizes TODO.json data
     * @param {Object} data - The TODO.json data to validate
     * @param {string} filePath - Path to the TODO.json file for context
     * @returns {Object} Validation result with sanitized data and error/fix reports
     */
    validateAndSanitize(data, filePath = '') {
        this.errors = [];
        this.fixes = [];
        
        try {
            // Deep clone to avoid mutating original
            const sanitizedData = JSON.parse(JSON.stringify(data));
            
            // Validate root structure
            this._validateRootStructure(sanitizedData);
            
            // Validate and sanitize tasks
            this._validateTasks(sanitizedData);
            
            // Validate review strike system
            this._validateReviewStrikes(sanitizedData);
            
            // Validate file references
            this._validateFileReferences(sanitizedData, filePath);
            
            // Check for duplicate IDs
            this._validateUniqueIds(sanitizedData);
            
            // Validate task dependencies
            this._validateDependencies(sanitizedData);
            
            return {
                isValid: this.errors.length === 0,
                data: sanitizedData,
                errors: this.errors,
                fixes: this.fixes,
                summary: this._generateSummary()
            };
            
        } catch (error) {
            this.errors.push({
                type: 'CRITICAL_ERROR',
                message: `Validation failed: ${error.message}`,
                severity: 'critical',
                autoFixable: false
            });
            
            return {
                isValid: false,
                data: null,
                errors: this.errors,
                fixes: this.fixes,
                summary: this._generateSummary()
            };
        }
    }

    /**
     * Validates JSON syntax and attempts repairs
     * @param {string} jsonString - The JSON string to validate
     * @returns {Object} Parse result with repaired JSON if possible
     */
    validateJsonSyntax(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            return { isValid: true, data: parsed, repaired: false };
        } catch (error) {
            // Attempt basic JSON repairs
            const repaired = this._attemptJsonRepair(jsonString, error);
            if (repaired.success) {
                this.fixes.push({
                    type: 'JSON_SYNTAX_REPAIR',
                    message: `Repaired JSON syntax: ${repaired.description}`,
                    automated: true
                });
                return { isValid: true, data: repaired.data, repaired: true };
            }
            
            this.errors.push({
                type: 'JSON_SYNTAX_ERROR',
                message: `Invalid JSON syntax: ${error.message}`,
                severity: 'critical',
                autoFixable: false,
                position: this._extractErrorPosition(error.message)
            });
            
            return { isValid: false, data: null, repaired: false };
        }
    }

    /**
     * Validates root structure and adds missing required fields
     */
    _validateRootStructure(data) {
        this.requiredFields.root.forEach(field => {
            if (!(field in data)) {
                const defaultValue = this._getDefaultValue(field);
                data[field] = defaultValue;
                this.fixes.push({
                    type: 'MISSING_FIELD_ADDED',
                    message: `Added missing field '${field}' with default value`,
                    field,
                    value: defaultValue,
                    automated: true
                });
            }
        });

        // Validate data types
        if (typeof data.project !== 'string') {
            data.project = String(data.project || 'unnamed-project');
            this.fixes.push({
                type: 'TYPE_CORRECTION',
                message: 'Corrected project field to string type',
                automated: true
            });
        }

        if (!Array.isArray(data.tasks)) {
            data.tasks = [];
            this.fixes.push({
                type: 'TYPE_CORRECTION',
                message: 'Corrected tasks field to array type',
                automated: true
            });
        }

        if (typeof data.review_strikes !== 'number' || data.review_strikes < 0 || data.review_strikes > 3) {
            data.review_strikes = Math.max(0, Math.min(3, parseInt(data.review_strikes) || 0));
            this.fixes.push({
                type: 'VALUE_CORRECTION',
                message: `Corrected review_strikes to valid range (0-3)`,
                automated: true
            });
        }

        if (typeof data.strikes_completed_last_run !== 'boolean') {
            data.strikes_completed_last_run = Boolean(data.strikes_completed_last_run);
            this.fixes.push({
                type: 'TYPE_CORRECTION',
                message: 'Corrected strikes_completed_last_run to boolean type',
                automated: true
            });
        }

        if (typeof data.current_task_index !== 'number' || data.current_task_index < 0) {
            data.current_task_index = 0;
            this.fixes.push({
                type: 'VALUE_CORRECTION',
                message: 'Corrected current_task_index to valid value',
                automated: true
            });
        }
    }

    /**
     * Validates and sanitizes all tasks
     */
    _validateTasks(data) {
        if (!Array.isArray(data.tasks)) return;

        // Validate each task, replacing invalid ones with a placeholder or processing valid ones
        data.tasks.forEach((task, index) => {
            if (typeof task !== 'object' || task === null) {
                this.errors.push({
                    type: 'INVALID_TASK_TYPE',
                    message: `Task at index ${index} is not a valid object`,
                    severity: 'high',
                    autoFixable: false
                });
                // Keep the invalid task slot but don't process it further
                return;
            }
            
            this._validateSingleTask(task, index, data.tasks);
        });

        // CONCURRENT MULTI-AGENT SUPPORT: Allow multiple tasks to be in_progress
        // Check for reasonable limits to prevent system overload (max 10 concurrent tasks)
        const inProgressTasks = data.tasks.filter(t => t && typeof t === 'object' && t.status === 'in_progress');
        const maxConcurrentTasks = 10; // Reasonable limit for system performance
        
        if (inProgressTasks.length > maxConcurrentTasks) {
            // Only reset excess tasks beyond the reasonable limit
            inProgressTasks.slice(maxConcurrentTasks).forEach(task => {
                task.status = 'pending';
                this.fixes.push({
                    type: 'STATUS_CORRECTION',
                    message: `Changed task ${task.id} from in_progress to pending (exceeded max concurrent limit of ${maxConcurrentTasks})`,
                    automated: true
                });
            });
        }
        
        // Log concurrent task info for monitoring
        if (inProgressTasks.length > 1) {
            this.fixes.push({
                type: 'INFO',
                message: `Multi-agent mode: ${inProgressTasks.length} tasks running concurrently`,
                automated: false
            });
        }
    }

    /**
     * Validates a single task
     */
    _validateSingleTask(task, index, _allTasks) {

        // Validate required fields
        this.requiredFields.task.forEach(field => {
            if (!(field in task)) {
                const defaultValue = this._getTaskDefaultValue(field, task);
                task[field] = defaultValue;
                this.fixes.push({
                    type: field === 'id' ? 'ID_CORRECTION' : 'MISSING_TASK_FIELD',
                    message: field === 'id' ? `Generated ID for task at index ${index}` : `Added missing field '${field}' to task ${task.id || index}`,
                    field,
                    value: defaultValue,
                    automated: true
                });
            }
        });

        // Validate task ID
        if (!task.id || typeof task.id !== 'string') {
            task.id = task.id ? String(task.id) : `task-${Date.now()}`;
            this.fixes.push({
                type: 'ID_CORRECTION',
                message: `Generated/corrected ID for task at index ${index}`,
                automated: true
            });
        }

        // Validate mode
        if (!this.validModes.includes(task.mode)) {
            const oldMode = task.mode;
            task.mode = 'DEVELOPMENT';
            this.fixes.push({
                type: 'MODE_CORRECTION',
                message: `Changed invalid mode '${oldMode}' to 'DEVELOPMENT' for task ${task.id}`,
                automated: true
            });
        }

        // Validate status
        if (!this.validStatuses.includes(task.status)) {
            const oldStatus = task.status;
            task.status = 'pending';
            this.fixes.push({
                type: 'STATUS_CORRECTION',
                message: `Changed invalid status '${oldStatus}' to 'pending' for task ${task.id}`,
                automated: true
            });
        }

        // Validate description
        if (!task.description || typeof task.description !== 'string') {
            task.description = task.description ? String(task.description) : 'No description provided';
            this.fixes.push({
                type: 'DESCRIPTION_CORRECTION',
                message: `Added/corrected description for task ${task.id}`,
                automated: true
            });
        }

        // Validate subtasks
        if (task.subtasks) {
            this._validateSubtasks(task.subtasks, task.id);
        }

        // Validate arrays
        ['dependencies', 'important_files'].forEach(arrayField => {
            if (task[arrayField] && !Array.isArray(task[arrayField])) {
                task[arrayField] = [];
                this.fixes.push({
                    type: 'ARRAY_CORRECTION',
                    message: `Corrected ${arrayField} to array type for task ${task.id}`,
                    automated: true
                });
            }
        });
    }

    /**
     * Validates subtasks array
     */
    _validateSubtasks(subtasks, parentTaskId) {
        if (!Array.isArray(subtasks)) return;

        subtasks.forEach((subtask, index) => {
            if (typeof subtask !== 'object' || subtask === null) {
                this.errors.push({
                    type: 'INVALID_SUBTASK_TYPE',
                    message: `Subtask at index ${index} in task ${parentTaskId} is not a valid object`,
                    severity: 'medium',
                    autoFixable: false
                });
                return;
            }

            // Validate required subtask fields
            this.requiredFields.subtask.forEach(field => {
                if (!(field in subtask)) {
                    const defaultValue = this._getSubtaskDefaultValue(field, subtask);
                    subtask[field] = defaultValue;
                    this.fixes.push({
                        type: 'MISSING_SUBTASK_FIELD',
                        message: `Added missing field '${field}' to subtask in task ${parentTaskId}`,
                        automated: true
                    });
                }
            });

            // Validate subtask status and priority
            if (!this.validStatuses.includes(subtask.status)) {
                subtask.status = 'pending';
                this.fixes.push({
                    type: 'SUBTASK_STATUS_CORRECTION',
                    message: `Corrected invalid status for subtask ${subtask.id} in task ${parentTaskId}`,
                    automated: true
                });
            }

            if (!this.validPriorities.includes(subtask.priority)) {
                subtask.priority = 'medium';
                this.fixes.push({
                    type: 'SUBTASK_PRIORITY_CORRECTION',
                    message: `Corrected invalid priority for subtask ${subtask.id} in task ${parentTaskId}`,
                    automated: true
                });
            }
        });
    }

    /**
     * Validates review strike system
     */
    _validateReviewStrikes(data) {
        const reviewTasks = data.tasks.filter(t => t && typeof t === 'object' && (t.is_review_task || t.mode === 'REVIEWER'));
        
        // Ensure review tasks have proper structure
        reviewTasks.forEach(task => {
            if (!task.strike_number || typeof task.strike_number !== 'number') {
                task.strike_number = reviewTasks.indexOf(task) + 1;
                this.fixes.push({
                    type: 'REVIEW_STRIKE_NUMBER_ADDED',
                    message: `Added strike_number to review task ${task.id}`,
                    automated: true
                });
            }

            if (!task.is_review_task) {
                task.is_review_task = true;
                this.fixes.push({
                    type: 'REVIEW_TASK_FLAG_ADDED',
                    message: `Added is_review_task flag to task ${task.id}`,
                    automated: true
                });
            }
        });
    }

    /**
     * Validates file references in tasks
     */
    _validateFileReferences(data, todoPath) {
        if (!todoPath) return;
        
        const projectDir = path.dirname(todoPath);
        
        data.tasks.forEach(task => {
            if (!task || typeof task !== 'object') return; // Skip invalid tasks
            if (task.important_files && Array.isArray(task.important_files)) {
                const invalidFiles = task.important_files.filter(file => {
                    const fullPath = path.resolve(projectDir, file);
                    return !fs.existsSync(fullPath) && !file.includes('*');
                });
                
                if (invalidFiles.length > 0) {
                    this.errors.push({
                        type: 'MISSING_IMPORTANT_FILES',
                        message: `Task ${task.id} references missing files: ${invalidFiles.join(', ')}`,
                        severity: 'medium',
                        autoFixable: false,
                        files: invalidFiles
                    });
                }
            }
        });
    }

    /**
     * Validates unique task IDs
     */
    _validateUniqueIds(data) {
        const ids = new Set();
        const duplicates = [];
        
        data.tasks.forEach((task, index) => {
            if (!task || typeof task !== 'object') return; // Skip invalid tasks
            
            if (ids.has(task.id)) {
                duplicates.push({ id: task.id, index });
                task.id = `${task.id}-dup-${index}`;
                this.fixes.push({
                    type: 'DUPLICATE_ID_RESOLVED',
                    message: `Resolved duplicate ID by renaming task to ${task.id}`,
                    automated: true
                });
            } else {
                ids.add(task.id);
            }
        });
    }

    /**
     * Validates task dependencies
     */
    _validateDependencies(data) {
        const taskIds = new Set(data.tasks.filter(t => t && typeof t === 'object').map(t => t.id));
        
        data.tasks.forEach(task => {
            if (!task || typeof task !== 'object') return; // Skip invalid tasks
            if (task.dependencies && Array.isArray(task.dependencies)) {
                const validDeps = task.dependencies.filter(dep => {
                    if (taskIds.has(dep) || dep.includes('*') || dep.includes('.')) {
                        return true;
                    }
                    this.errors.push({
                        type: 'INVALID_DEPENDENCY',
                        message: `Task ${task.id} has invalid dependency: ${dep}`,
                        severity: 'medium',
                        autoFixable: false
                    });
                    return false;
                });
                
                if (validDeps.length !== task.dependencies.length) {
                    task.dependencies = validDeps;
                    this.fixes.push({
                        type: 'DEPENDENCY_CLEANUP',
                        message: `Removed invalid dependencies from task ${task.id}`,
                        automated: true
                    });
                }
            }
        });
    }

    /**
     * Attempts to repair common JSON syntax errors
     */
    _attemptJsonRepair(jsonString, error) {
        let repaired = jsonString;
        let description = '';

        // Fix trailing commas - detect by pattern in string, not just error message
        if (error.message.includes('trailing comma') || /,(\s*[}\]])/.test(jsonString)) {
            repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
            description = 'Removed trailing commas';
        }

        // Fix unescaped quotes in strings
        if (error.message.includes('Unterminated string')) {
            repaired = repaired.replace(/([^\\])"/g, '$1\\"');
            description = 'Escaped quotes in strings';
        }

        // Try parsing the repaired JSON
        try {
            const parsed = JSON.parse(repaired);
            return { success: true, data: parsed, description };
        } catch {
            return { success: false, description: 'Could not repair JSON' };
        }
    }

    /**
     * Extracts error position from JSON parser error message
     */
    _extractErrorPosition(errorMessage) {
        const match = errorMessage.match(/position (\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * Gets default value for root-level fields
     */
    _getDefaultValue(field) {
        const defaults = {
            project: 'unnamed-project',
            tasks: [],
            review_strikes: 0,
            strikes_completed_last_run: false,
            current_task_index: 0,
            last_mode: null
        };
        return defaults[field];
    }

    /**
     * Gets default value for task fields
     */
    _getTaskDefaultValue(field, task) {
        const defaults = {
            id: `task-${Date.now()}`,
            mode: 'DEVELOPMENT',
            description: 'No description provided',
            status: 'pending',
            prompt: task.description || 'No prompt provided',
            dependencies: [],
            important_files: [],
            requires_research: false,
            subtasks: []
        };
        return defaults[field];
    }

    /**
     * Gets default value for subtask fields
     */
    _getSubtaskDefaultValue(field, subtask) {
        const defaults = {
            id: `subtask-${Date.now()}`,
            title: subtask.description || 'Untitled subtask',
            description: 'No description provided',
            mode: 'DEVELOPMENT',
            priority: 'medium',
            status: 'pending',
            success_criteria: [],
            dependencies: [],
            estimate: '2 hours'
        };
        return defaults[field];
    }

    /**
     * Generates validation summary
     */
    _generateSummary() {
        return {
            totalErrors: this.errors.length,
            totalFixes: this.fixes.length,
            criticalErrors: this.errors.filter(e => e.severity === 'critical').length,
            autoFixedIssues: this.fixes.filter(f => f.automated).length,
            manualFixesRequired: this.errors.filter(e => !e.autoFixable).length
        };
    }
}

module.exports = TodoValidator;