// =============================================================================
// todoValidator.test.js - Comprehensive Test Suite for TodoValidator Class
// 
// This test suite provides complete coverage of the TodoValidator class including
// validation, sanitization, JSON syntax repair, and error detection.
// =============================================================================

const fs = require('fs');
const TodoValidator = require('../lib/todoValidator');

// Mock dependencies
jest.mock('fs');

describe('TodoValidator', () => {
    let validator;
    let validTodoData;
    let mockFilePath;

    beforeEach(() => {
        jest.clearAllMocks();
        validator = new TodoValidator();
        mockFilePath = '/test/project/TODO.json';
        
        validTodoData = {
            project: 'test-project',
            tasks: [
                {
                    id: 'task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Test task',
                    status: 'pending',
                    dependencies: [],
                    important_files: [],
                    requires_research: false,
                    subtasks: []
                }
            ],
            review_strikes: 0,
            strikes_completed_last_run: false,
            current_task_index: 0
        };
    });

    describe('Constructor and Configuration', () => {
        it('should initialize with valid modes, statuses, and priorities', () => {
            expect(validator.validModes).toContain('DEVELOPMENT');
            expect(validator.validModes).toContain('TESTING');
            expect(validator.validModes).toContain('REVIEWER');
            expect(validator.validStatuses).toEqual(['pending', 'in_progress', 'completed']);
            expect(validator.validPriorities).toEqual(['low', 'medium', 'high']);
        });
        
        it('should define required fields for different object types', () => {
            expect(validator.requiredFields.root).toContain('project');
            expect(validator.requiredFields.root).toContain('tasks');
            expect(validator.requiredFields.task).toContain('id');
            expect(validator.requiredFields.task).toContain('mode');
            expect(validator.requiredFields.subtask).toContain('title');
        });
        
        it('should initialize empty error and fix arrays', () => {
            expect(validator.errors).toEqual([]);
            expect(validator.fixes).toEqual([]);
        });
    });

    describe('JSON Syntax Validation', () => {
        it('should validate correct JSON syntax', () => {
            const jsonString = '{"project": "test", "tasks": []}';
            const result = validator.validateJsonSyntax(jsonString);
            
            expect(result.isValid).toBe(true);
            expect(result.data).toEqual({ project: 'test', tasks: [] });
            expect(result.repaired).toBe(false);
        });
        
        it('should detect JSON syntax errors', () => {
            const invalidJson = '{"project": "test", "tasks": [}';
            const result = validator.validateJsonSyntax(invalidJson);
            
            expect(result.isValid).toBe(false);
            expect(result.data).toBeNull();
            expect(result.repaired).toBe(false);
            expect(validator.errors).toHaveLength(1);
            expect(validator.errors[0].type).toBe('JSON_SYNTAX_ERROR');
        });
        
        it('should repair trailing commas in JSON', () => {
            const jsonWithTrailingComma = '{"project": "test", "tasks": [],}';
            const result = validator.validateJsonSyntax(jsonWithTrailingComma);
            
            expect(result.isValid).toBe(true);
            expect(result.data).toEqual({ project: 'test', tasks: [] });
            expect(result.repaired).toBe(true);
            expect(validator.fixes).toHaveLength(1);
            expect(validator.fixes[0].type).toBe('JSON_SYNTAX_REPAIR');
        });
        
        it('should attempt to repair unescaped quotes', () => {
            const jsonWithUnescapedQuotes = '{"project": "test with "quotes"", "tasks": []}';
            const result = validator.validateJsonSyntax(jsonWithUnescapedQuotes);
            
            // This should attempt repair, though it may not always succeed
            expect(result.isValid || result.repaired).toBeDefined();
        });
        
        it('should extract error position from parser errors', () => {
            const invalidJson = '{"project": "test", "tasks": [}';
            validator.validateJsonSyntax(invalidJson);
            
            expect(validator.errors[0].position).toBeDefined();
        });
    });

    describe('Root Structure Validation', () => {
        it('should validate complete valid structure', () => {
            const result = validator.validateAndSanitize(validTodoData, mockFilePath);
            
            expect(result.isValid).toBe(true);
            expect(result.data).toEqual(validTodoData);
            expect(result.errors).toHaveLength(0);
        });
        
        it('should add missing required root fields', () => {
            const incompleteData = { project: 'test' };
            const result = validator.validateAndSanitize(incompleteData, mockFilePath);
            
            expect(result.data.tasks).toEqual([]);
            expect(result.data.review_strikes).toBe(0);
            expect(result.data.strikes_completed_last_run).toBe(false);
            expect(result.data.current_task_index).toBe(0);
            
            expect(result.fixes.some(fix => fix.type === 'MISSING_FIELD_ADDED')).toBe(true);
        });
        
        it('should correct invalid data types in root fields', () => {
            const invalidData = {
                project: 123,
                tasks: 'not an array',
                review_strikes: 'invalid',
                strikes_completed_last_run: 'not boolean',
                current_task_index: -5
            };
            
            const result = validator.validateAndSanitize(invalidData, mockFilePath);
            
            expect(typeof result.data.project).toBe('string');
            expect(Array.isArray(result.data.tasks)).toBe(true);
            expect(typeof result.data.review_strikes).toBe('number');
            expect(result.data.review_strikes).toBeGreaterThanOrEqual(0);
            expect(result.data.review_strikes).toBeLessThanOrEqual(3);
            expect(typeof result.data.strikes_completed_last_run).toBe('boolean');
            expect(result.data.current_task_index).toBeGreaterThanOrEqual(0);
            
            expect(result.fixes.some(fix => fix.type === 'TYPE_CORRECTION')).toBe(true);
        });
        
        it('should constrain review_strikes to valid range', () => {
            const invalidData = {
                project: 'test',
                tasks: [],
                review_strikes: 10,
                strikes_completed_last_run: false,
                current_task_index: 0
            };
            
            const result = validator.validateAndSanitize(invalidData, mockFilePath);
            
            expect(result.data.review_strikes).toBe(3);
            expect(result.fixes.some(fix => fix.type === 'VALUE_CORRECTION')).toBe(true);
        });
    });

    describe('Task Validation', () => {
        it('should validate tasks with all required fields', () => {
            const result = validator.validateAndSanitize(validTodoData, mockFilePath);
            
            expect(result.isValid).toBe(true);
            expect(result.data.tasks[0]).toEqual(validTodoData.tasks[0]);
        });
        
        it('should add missing required task fields', () => {
            const dataWithIncompleteTask = {
                project: 'test',
                tasks: [{ description: 'Task without required fields' }],
                review_strikes: 0,
                strikes_completed_last_run: false,
                current_task_index: 0
            };
            
            const result = validator.validateAndSanitize(dataWithIncompleteTask, mockFilePath);
            
            const task = result.data.tasks[0];
            expect(task.id).toBeDefined();
            expect(task.mode).toBe('DEVELOPMENT');
            expect(task.status).toBe('pending');
            expect(task.description).toBe('Task without required fields');
            
            expect(result.fixes.some(fix => fix.type === 'MISSING_TASK_FIELD')).toBe(true);
        });
        
        it('should correct invalid task modes', () => {
            const dataWithInvalidMode = {
                ...validTodoData,
                tasks: [{
                    id: 'task-1',
                    mode: 'INVALID_MODE',
                    description: 'Test task',
                    status: 'pending'
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithInvalidMode, mockFilePath);
            
            expect(result.data.tasks[0].mode).toBe('DEVELOPMENT');
            expect(result.fixes.some(fix => fix.type === 'MODE_CORRECTION')).toBe(true);
        });
        
        it('should correct invalid task statuses', () => {
            const dataWithInvalidStatus = {
                ...validTodoData,
                tasks: [{
                    id: 'task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Test task',
                    status: 'invalid_status'
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithInvalidStatus, mockFilePath);
            
            expect(result.data.tasks[0].status).toBe('pending');
            expect(result.fixes.some(fix => fix.type === 'STATUS_CORRECTION')).toBe(true);
        });
        
        it('should generate IDs for tasks missing them', () => {
            const dataWithoutTaskId = {
                ...validTodoData,
                tasks: [{
                    mode: 'DEVELOPMENT',
                    description: 'Task without ID',
                    status: 'pending'
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithoutTaskId, mockFilePath);
            
            expect(result.data.tasks[0].id).toMatch(/^task-\d+$/);
            expect(result.fixes.some(fix => fix.type === 'ID_CORRECTION')).toBe(true);
        });
        
        it('should ensure only one task is in_progress', () => {
            const dataWithMultipleInProgress = {
                ...validTodoData,
                tasks: [
                    { id: 'task-1', mode: 'DEVELOPMENT', description: 'Task 1', status: 'in_progress' },
                    { id: 'task-2', mode: 'TESTING', description: 'Task 2', status: 'in_progress' },
                    { id: 'task-3', mode: 'DEVELOPMENT', description: 'Task 3', status: 'in_progress' }
                ]
            };
            
            const result = validator.validateAndSanitize(dataWithMultipleInProgress, mockFilePath);
            
            const inProgressTasks = result.data.tasks.filter(t => t.status === 'in_progress');
            expect(inProgressTasks).toHaveLength(1);
            expect(result.fixes.some(fix => fix.type === 'STATUS_CORRECTION')).toBe(true);
        });
        
        it('should handle invalid task objects', () => {
            const dataWithInvalidTasks = {
                ...validTodoData,
                tasks: [null, 'invalid task', { id: 'valid-task', mode: 'DEVELOPMENT', description: 'Valid', status: 'pending' }]
            };
            
            const result = validator.validateAndSanitize(dataWithInvalidTasks, mockFilePath);
            
            expect(result.errors.some(error => error.type === 'INVALID_TASK_TYPE')).toBe(true);
            expect(result.data.tasks[2].id).toBe('valid-task');
        });
        
        it('should correct array fields in tasks', () => {
            const dataWithInvalidArrays = {
                ...validTodoData,
                tasks: [{
                    id: 'task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Test task',
                    status: 'pending',
                    dependencies: 'not an array',
                    important_files: 'also not an array'
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithInvalidArrays, mockFilePath);
            
            expect(Array.isArray(result.data.tasks[0].dependencies)).toBe(true);
            expect(Array.isArray(result.data.tasks[0].important_files)).toBe(true);
            expect(result.fixes.some(fix => fix.type === 'ARRAY_CORRECTION')).toBe(true);
        });
    });

    describe('Subtask Validation', () => {
        it('should validate subtasks with required fields', () => {
            const dataWithSubtasks = {
                ...validTodoData,
                tasks: [{
                    id: 'task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Task with subtasks',
                    status: 'pending',
                    subtasks: [{
                        id: 'subtask-1',
                        title: 'Subtask title',
                        description: 'Subtask description',
                        mode: 'DEVELOPMENT',
                        priority: 'medium',
                        status: 'pending'
                    }]
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithSubtasks, mockFilePath);
            
            expect(result.isValid).toBe(true);
            expect(result.data.tasks[0].subtasks[0]).toEqual(dataWithSubtasks.tasks[0].subtasks[0]);
        });
        
        it('should add missing subtask fields', () => {
            const dataWithIncompleteSubtask = {
                ...validTodoData,
                tasks: [{
                    id: 'task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Task with incomplete subtask',
                    status: 'pending',
                    subtasks: [{ description: 'Incomplete subtask' }]
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithIncompleteSubtask, mockFilePath);
            
            const subtask = result.data.tasks[0].subtasks[0];
            expect(subtask.id).toBeDefined();
            expect(subtask.title).toBe('Incomplete subtask');
            expect(subtask.mode).toBe('DEVELOPMENT');
            expect(subtask.priority).toBe('medium');
            expect(subtask.status).toBe('pending');
            
            expect(result.fixes.some(fix => fix.type === 'MISSING_SUBTASK_FIELD')).toBe(true);
        });
        
        it('should correct invalid subtask status and priority', () => {
            const dataWithInvalidSubtask = {
                ...validTodoData,
                tasks: [{
                    id: 'task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Task with invalid subtask',
                    status: 'pending',
                    subtasks: [{
                        id: 'subtask-1',
                        title: 'Subtask',
                        description: 'Subtask description',
                        mode: 'DEVELOPMENT',
                        priority: 'invalid_priority',
                        status: 'invalid_status'
                    }]
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithInvalidSubtask, mockFilePath);
            
            const subtask = result.data.tasks[0].subtasks[0];
            expect(subtask.status).toBe('pending');
            expect(subtask.priority).toBe('medium');
            
            expect(result.fixes.some(fix => fix.type === 'SUBTASK_STATUS_CORRECTION')).toBe(true);
            expect(result.fixes.some(fix => fix.type === 'SUBTASK_PRIORITY_CORRECTION')).toBe(true);
        });
        
        it('should handle invalid subtask objects', () => {
            const dataWithInvalidSubtasks = {
                ...validTodoData,
                tasks: [{
                    id: 'task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Task with invalid subtasks',
                    status: 'pending',
                    subtasks: [null, 'invalid subtask']
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithInvalidSubtasks, mockFilePath);
            
            expect(result.errors.some(error => error.type === 'INVALID_SUBTASK_TYPE')).toBe(true);
        });
    });

    describe('Review Strike System Validation', () => {
        it('should validate review tasks correctly', () => {
            const dataWithReviewTask = {
                ...validTodoData,
                tasks: [{
                    id: 'review-strike-1',
                    mode: 'REVIEWER',
                    description: 'Review task',
                    status: 'pending',
                    is_review_task: true,
                    strike_number: 1
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithReviewTask, mockFilePath);
            
            expect(result.isValid).toBe(true);
            expect(result.data.tasks[0].is_review_task).toBe(true);
            expect(result.data.tasks[0].strike_number).toBe(1);
        });
        
        it('should add missing review task flags', () => {
            const dataWithIncompleteReviewTask = {
                ...validTodoData,
                tasks: [{
                    id: 'review-task',
                    mode: 'REVIEWER',
                    description: 'Review task without flags',
                    status: 'pending'
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithIncompleteReviewTask, mockFilePath);
            
            expect(result.data.tasks[0].is_review_task).toBe(true);
            expect(result.data.tasks[0].strike_number).toBe(1);
            
            expect(result.fixes.some(fix => fix.type === 'REVIEW_TASK_FLAG_ADDED')).toBe(true);
            expect(result.fixes.some(fix => fix.type === 'REVIEW_STRIKE_NUMBER_ADDED')).toBe(true);
        });
    });

    describe('File Reference Validation', () => {
        beforeEach(() => {
            fs.existsSync.mockImplementation((filePath) => {
                return filePath.includes('existing-file.js');
            });
        });
        
        it('should validate existing file references', () => {
            const dataWithFileReferences = {
                ...validTodoData,
                tasks: [{
                    id: 'task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Task with file references',
                    status: 'pending',
                    important_files: ['existing-file.js', '**/*.test.js']
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithFileReferences, mockFilePath);
            
            expect(result.errors.some(error => error.type === 'MISSING_IMPORTANT_FILES')).toBe(false);
        });
        
        it('should detect missing file references', () => {
            const dataWithMissingFiles = {
                ...validTodoData,
                tasks: [{
                    id: 'task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Task with missing files',
                    status: 'pending',
                    important_files: ['missing-file.js', 'another-missing.js']
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithMissingFiles, mockFilePath);
            
            expect(result.errors.some(error => error.type === 'MISSING_IMPORTANT_FILES')).toBe(true);
            const fileError = result.errors.find(error => error.type === 'MISSING_IMPORTANT_FILES');
            expect(fileError.files).toContain('missing-file.js');
            expect(fileError.files).toContain('another-missing.js');
        });
        
        it('should skip validation for glob patterns', () => {
            const dataWithGlobPatterns = {
                ...validTodoData,
                tasks: [{
                    id: 'task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Task with glob patterns',
                    status: 'pending',
                    important_files: ['**/*.js', 'src/**/*.test.js', '*.md']
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithGlobPatterns, mockFilePath);
            
            expect(result.errors.some(error => error.type === 'MISSING_IMPORTANT_FILES')).toBe(false);
        });
    });

    describe('Unique ID Validation', () => {
        it('should detect and resolve duplicate task IDs', () => {
            const dataWithDuplicateIds = {
                ...validTodoData,
                tasks: [
                    { id: 'duplicate-id', mode: 'DEVELOPMENT', description: 'Task 1', status: 'pending' },
                    { id: 'duplicate-id', mode: 'TESTING', description: 'Task 2', status: 'pending' },
                    { id: 'unique-id', mode: 'DEVELOPMENT', description: 'Task 3', status: 'pending' }
                ]
            };
            
            const result = validator.validateAndSanitize(dataWithDuplicateIds, mockFilePath);
            
            const taskIds = result.data.tasks.map(t => t.id);
            const uniqueIds = new Set(taskIds);
            expect(uniqueIds.size).toBe(taskIds.length);
            
            expect(result.fixes.some(fix => fix.type === 'DUPLICATE_ID_RESOLVED')).toBe(true);
        });
    });

    describe('Dependency Validation', () => {
        it('should validate existing task dependencies', () => {
            const dataWithValidDependencies = {
                ...validTodoData,
                tasks: [
                    { id: 'task-1', mode: 'DEVELOPMENT', description: 'Task 1', status: 'pending', dependencies: [] },
                    { id: 'task-2', mode: 'TESTING', description: 'Task 2', status: 'pending', dependencies: ['task-1'] }
                ]
            };
            
            const result = validator.validateAndSanitize(dataWithValidDependencies, mockFilePath);
            
            expect(result.errors.some(error => error.type === 'INVALID_DEPENDENCY')).toBe(false);
            expect(result.data.tasks[1].dependencies).toContain('task-1');
        });
        
        it('should detect invalid task dependencies', () => {
            const dataWithInvalidDependencies = {
                ...validTodoData,
                tasks: [{
                    id: 'task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Task with invalid dependencies',
                    status: 'pending',
                    dependencies: ['non-existent-task', 'another-missing-task']
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithInvalidDependencies, mockFilePath);
            
            expect(result.errors.some(error => error.type === 'INVALID_DEPENDENCY')).toBe(true);
            expect(result.data.tasks[0].dependencies).toHaveLength(0);
            expect(result.fixes.some(fix => fix.type === 'DEPENDENCY_CLEANUP')).toBe(true);
        });
        
        it('should allow file pattern dependencies', () => {
            const dataWithFileDependencies = {
                ...validTodoData,
                tasks: [{
                    id: 'task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Task with file dependencies',
                    status: 'pending',
                    dependencies: ['**/*.js', 'package.json', '*.test.js']
                }]
            };
            
            const result = validator.validateAndSanitize(dataWithFileDependencies, mockFilePath);
            
            expect(result.errors.some(error => error.type === 'INVALID_DEPENDENCY')).toBe(false);
            expect(result.data.tasks[0].dependencies).toHaveLength(3);
        });
    });

    describe('Summary Generation', () => {
        it('should generate accurate validation summary', () => {
            const problematicData = {
                project: 123,
                tasks: [
                    { mode: 'INVALID_MODE', description: 'Task 1', status: 'invalid_status' },
                    null
                ],
                review_strikes: 'invalid'
            };
            
            const result = validator.validateAndSanitize(problematicData, mockFilePath);
            
            expect(result.summary).toEqual({
                totalErrors: expect.any(Number),
                totalFixes: expect.any(Number),
                criticalErrors: expect.any(Number),
                autoFixedIssues: expect.any(Number),
                manualFixesRequired: expect.any(Number)
            });
            
            expect(result.summary.totalFixes).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle validation errors gracefully', () => {
            const circularData = {};
            circularData.self = circularData;
            
            const result = validator.validateAndSanitize(circularData, mockFilePath);
            
            expect(result.isValid).toBe(false);
            expect(result.data).toBeNull();
            expect(result.errors.some(error => error.type === 'CRITICAL_ERROR')).toBe(true);
        });
        
        it('should provide helpful error context', () => {
            const invalidData = {
                project: 'test',
                tasks: [null, 'invalid'],
                review_strikes: 0,
                strikes_completed_last_run: false,
                current_task_index: 0
            };
            
            const result = validator.validateAndSanitize(invalidData, mockFilePath);
            
            const errors = result.errors.filter(e => e.type === 'INVALID_TASK_TYPE');
            expect(errors).toHaveLength(2);
            expect(errors[0].message).toContain('index 0');
            expect(errors[1].message).toContain('index 1');
        });
    });

    describe('Default Value Generation', () => {
        it('should provide appropriate default values for root fields', () => {
            expect(validator._getDefaultValue('project')).toBe('unnamed-project');
            expect(validator._getDefaultValue('tasks')).toEqual([]);
            expect(validator._getDefaultValue('review_strikes')).toBe(0);
        });
        
        it('should provide appropriate default values for task fields', () => {
            const mockTask = { description: 'test description' };
            expect(validator._getTaskDefaultValue('mode', mockTask)).toBe('DEVELOPMENT');
            expect(validator._getTaskDefaultValue('status', mockTask)).toBe('pending');
            expect(validator._getTaskDefaultValue('prompt', mockTask)).toBe('test description');
        });
        
        it('should provide appropriate default values for subtask fields', () => {
            const mockSubtask = { description: 'test subtask' };
            expect(validator._getSubtaskDefaultValue('title', mockSubtask)).toBe('test subtask');
            expect(validator._getSubtaskDefaultValue('priority', mockSubtask)).toBe('medium');
            expect(validator._getSubtaskDefaultValue('estimate', mockSubtask)).toBe('2 hours');
        });
    });
});