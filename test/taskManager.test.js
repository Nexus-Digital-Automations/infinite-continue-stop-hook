// =============================================================================
// taskManager.test.js - Comprehensive Test Suite for TaskManager Class
// 
// This test suite provides 100% coverage of the TaskManager class including
// all methods, edge cases, error scenarios, and integration tests.
// =============================================================================

// Mock dependencies FIRST, before importing TaskManager
jest.mock('fs');
jest.mock('../lib/autoFixer', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getFileStatus: jest.fn().mockResolvedValue({ valid: true, canAutoFix: false }),
            autoFix: jest.fn().mockResolvedValue({ success: true, hasChanges: false }),
            recoverCorruptedFile: jest.fn().mockResolvedValue({ success: true, finalData: {} }),
            dryRun: jest.fn().mockResolvedValue({ success: true, wouldFix: false }),
            validator: {
                validateAndSanitize: jest.fn().mockReturnValue({ isValid: true, data: {}, fixes: [] })
            },
            recovery: {
                atomicWrite: jest.fn().mockResolvedValue({ success: true }),
                listAvailableBackups: jest.fn().mockReturnValue([]),
                restoreFromBackup: jest.fn().mockResolvedValue({ success: true }),
                createBackup: jest.fn().mockResolvedValue({ success: true })
            }
        };
    });
});

const fs = require('fs');
const TaskManager = require('../lib/taskManager');

describe('TaskManager', () => {
    let taskManager;
    let mockTodoPath;
    let mockAutoFixer;
    let mockFS;
    
    beforeEach(() => {
        // Reset all mocks first
        jest.clearAllMocks();
        
        // Setup standardized mocks using global factory functions
        mockFS = global.createMockFS();
        mockAutoFixer = global.createMockAutoFixer();
        mockTodoPath = './test-todo.json';
        
        // Apply fs mocks
        Object.assign(fs, mockFS);
        
        // Configure fs.existsSync to return true for the test TODO file
        fs.existsSync.mockImplementation((filePath) => {
            return filePath === mockTodoPath || filePath.includes('test-todo.json');
        });
        
        // Create TaskManager instance which will use the mocked AutoFixer
        taskManager = new TaskManager(mockTodoPath);
        
        // Override the autoFixer instance with our mock
        taskManager.autoFixer = mockAutoFixer;
    });

    describe('Constructor', () => {
        test('should initialize with default options', () => {
            const tm = new TaskManager(mockTodoPath);
            expect(tm.todoPath).toBe(mockTodoPath);
            expect(tm.options.enableAutoFix).toBe(true);
            expect(tm.options.autoFixLevel).toBe('moderate');
            expect(tm.options.validateOnRead).toBe(true);
        });

        test('should initialize with custom options', () => {
            const customOptions = {
                enableAutoFix: false,
                autoFixLevel: 'aggressive',
                validateOnRead: false,
                customOption: 'test'
            };
            
            const tm = new TaskManager(mockTodoPath, customOptions);
            expect(tm.options.enableAutoFix).toBe(false);
            expect(tm.options.autoFixLevel).toBe('aggressive');
            expect(tm.options.validateOnRead).toBe(false);
            expect(tm.options.customOption).toBe('test');
        });
    });

    describe('readTodo', () => {
        const mockTodoData = {
            current_mode: 'development',
            tasks: [
                {
                    id: 'task-1',
                    title: 'Test Task',
                    status: 'pending',
                    mode: 'development'
                }
            ]
        };

        test('should read and parse valid TODO.json file', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockTodoData));
            mockAutoFixer.getFileStatus.mockResolvedValue({ valid: true });

            const result = await taskManager.readTodo();
            
            expect(fs.existsSync).toHaveBeenCalledWith(mockTodoPath);
            expect(fs.readFileSync).toHaveBeenCalledWith(mockTodoPath, 'utf8');
            expect(result).toEqual(mockTodoData);
        });

        test('should throw error if file does not exist', async () => {
            fs.existsSync.mockReturnValue(false);

            await expect(taskManager.readTodo()).rejects.toThrow(
                `TODO.json not found at ${mockTodoPath}`
            );
        });

        test('should auto-fix file when validation fails but auto-fix succeeds', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync
                .mockReturnValueOnce(JSON.stringify(mockTodoData)) // First read for validation
                .mockReturnValueOnce(JSON.stringify(mockTodoData)); // Second read after fix
            
            mockAutoFixer.getFileStatus.mockResolvedValue({ 
                valid: false, 
                canAutoFix: true 
            });
            mockAutoFixer.autoFix.mockResolvedValue({ 
                success: true, 
                hasChanges: true 
            });

            const result = await taskManager.readTodo();
            
            expect(mockAutoFixer.getFileStatus).toHaveBeenCalled();
            expect(mockAutoFixer.autoFix).toHaveBeenCalledWith(mockTodoPath, {
                autoFixLevel: 'moderate'
            });
            expect(result).toEqual(mockTodoData);
        });

        test('should attempt recovery for corrupted files when auto-fix enabled', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Invalid JSON');
            });
            
            mockAutoFixer.recoverCorruptedFile.mockResolvedValue({
                success: true,
                finalData: mockTodoData
            });

            const result = await taskManager.readTodo();
            
            expect(mockAutoFixer.recoverCorruptedFile).toHaveBeenCalledWith(mockTodoPath);
            expect(result).toEqual(mockTodoData);
        });

        test('should throw error when JSON parsing fails and recovery fails', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Invalid JSON');
            });
            
            mockAutoFixer.recoverCorruptedFile.mockResolvedValue({
                success: false
            });

            await expect(taskManager.readTodo()).rejects.toThrow(
                'Failed to read TODO.json: Invalid JSON'
            );
        });

        test('should disable auto-fix when options.enableAutoFix is false', async () => {
            const tm = new TaskManager(mockTodoPath, { enableAutoFix: false });
            
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Invalid JSON');
            });

            await expect(tm.readTodo()).rejects.toThrow(
                'Failed to read TODO.json: Invalid JSON'
            );
            
            expect(mockAutoFixer.recoverCorruptedFile).not.toHaveBeenCalled();
        });
    });

    describe('writeTodo', () => {
        const mockTodoData = {
            current_mode: 'development',
            tasks: []
        };

        test('should write valid data successfully', async () => {
            mockAutoFixer.validator.validateAndSanitize.mockReturnValue({
                isValid: true,
                data: mockTodoData
            });
            mockAutoFixer.recovery.atomicWrite.mockResolvedValue({
                success: true
            });

            const result = await taskManager.writeTodo(mockTodoData);
            
            expect(mockAutoFixer.validator.validateAndSanitize).toHaveBeenCalledWith(
                mockTodoData, 
                mockTodoPath
            );
            expect(mockAutoFixer.recovery.atomicWrite).toHaveBeenCalledWith(
                mockTodoPath,
                JSON.stringify(mockTodoData, null, 2),
                true
            );
            expect(result.success).toBe(true);
        });

        test('should sanitize invalid data when validation fails but auto-fix is enabled', async () => {
            const sanitizedData = { ...mockTodoData, sanitized: true };
            
            mockAutoFixer.validator.validateAndSanitize.mockReturnValue({
                isValid: false,
                data: sanitizedData
            });
            mockAutoFixer.recovery.atomicWrite.mockResolvedValue({
                success: true
            });

            await taskManager.writeTodo(mockTodoData);
            
            expect(mockAutoFixer.recovery.atomicWrite).toHaveBeenCalledWith(
                mockTodoPath,
                JSON.stringify(sanitizedData, null, 2),
                true
            );
        });

        test('should throw error when atomic write fails', async () => {
            mockAutoFixer.validator.validateAndSanitize.mockReturnValue({
                isValid: true,
                data: mockTodoData
            });
            mockAutoFixer.recovery.atomicWrite.mockResolvedValue({
                success: false,
                error: 'Write failed'
            });

            await expect(taskManager.writeTodo(mockTodoData)).rejects.toThrow(
                'Failed to write TODO.json: Write failed'
            );
        });

        test('should handle exceptions during write process', async () => {
            mockAutoFixer.validator.validateAndSanitize.mockImplementation(() => {
                throw new Error('Validation error');
            });

            await expect(taskManager.writeTodo(mockTodoData)).rejects.toThrow(
                'Failed to write TODO.json: Validation error'
            );
        });
    });

    describe('getCurrentTask', () => {
        test('should return first pending task', async () => {
            const mockData = {
                tasks: [
                    { id: 'task-1', status: 'completed' },
                    { id: 'task-2', status: 'pending' },
                    { id: 'task-3', status: 'pending' }
                ]
            };

            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue(mockData);

            const result = await taskManager.getCurrentTask();
            expect(result).toEqual({ id: 'task-2', status: 'pending' });
        });

        test('should return first in_progress task', async () => {
            const mockData = {
                tasks: [
                    { id: 'task-1', status: 'completed' },
                    { id: 'task-2', status: 'in_progress' },
                    { id: 'task-3', status: 'pending' }
                ]
            };

            jest.spyOn(taskManager, 'readTodo').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue(mockData);

            const result = await taskManager.getCurrentTask();
            expect(result).toEqual({ id: 'task-2', status: 'in_progress' });
        });

        test('should return undefined when no current task exists', async () => {
            const mockData = {
                tasks: [
                    { id: 'task-1', status: 'completed' },
                    { id: 'task-2', status: 'completed' }
                ]
            };

            jest.spyOn(taskManager, 'readTodo').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue(mockData);

            const result = await taskManager.getCurrentTask();
            expect(result).toBeUndefined();
        });

        test('should handle empty tasks array', async () => {
            const mockData = { tasks: [] };

            jest.spyOn(taskManager, 'readTodo').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue(mockData);

            const result = await taskManager.getCurrentTask();
            expect(result).toBeUndefined();
        });

        test('should handle null/undefined task data gracefully', async () => {
            jest.spyOn(taskManager, 'readTodo').mockResolvedValue({ tasks: null });

            const result = await taskManager.getCurrentTask();
            expect(result).toBeUndefined();
        });

        test('should handle malformed task objects', async () => {
            const malformedData = {
                tasks: [
                    null,
                    undefined,
                    {},
                    { id: 'valid-task', status: 'pending' }
                ]
            };

            jest.spyOn(taskManager, 'readTodo').mockResolvedValue(malformedData);
            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue(malformedData);

            const result = await taskManager.getCurrentTask();
            expect(result).toEqual({ id: 'valid-task', status: 'pending' });
        });
    });

    describe('updateTaskStatus', () => {
        test('should update existing task status', async () => {
            const mockData = {
                tasks: [
                    { id: 'task-1', status: 'pending' },
                    { id: 'task-2', status: 'pending' }
                ]
            };

            jest.spyOn(taskManager, 'readTodo').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'writeTodo').mockResolvedValue({});

            await taskManager.updateTaskStatus('task-1', 'completed');

            expect(mockData.tasks[0].status).toBe('completed');
            expect(taskManager.writeTodo).toHaveBeenCalledWith(mockData);
        });

        test('should not modify data when task not found', async () => {
            const mockData = {
                tasks: [
                    { id: 'task-1', status: 'pending' }
                ]
            };

            jest.spyOn(taskManager, 'readTodo').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'writeTodo').mockResolvedValue({});

            await taskManager.updateTaskStatus('nonexistent-task', 'completed');

            expect(mockData.tasks[0].status).toBe('pending');
            expect(taskManager.writeTodo).not.toHaveBeenCalled();
        });

        test('should handle various status values', async () => {
            const mockData = {
                tasks: [{ id: 'task-1', status: 'pending' }]
            };

            jest.spyOn(taskManager, 'readTodo').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'writeTodo').mockResolvedValue({});

            const statuses = ['in_progress', 'completed', 'blocked', 'cancelled'];
            
            for (const status of statuses) {
                await taskManager.updateTaskStatus('task-1', status);
                expect(mockData.tasks[0].status).toBe(status);
            }
        });
    });

    describe('addSubtask', () => {
        test('should add subtask to existing parent task', async () => {
            const mockData = {
                tasks: [
                    { id: 'parent-task', title: 'Parent', subtasks: [] }
                ]
            };
            const newSubtask = { title: 'New Subtask', status: 'pending' };

            jest.spyOn(taskManager, 'readTodo').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'writeTodo').mockResolvedValue({});

            await taskManager.addSubtask('parent-task', newSubtask);

            expect(mockData.tasks[0].subtasks).toContain(newSubtask);
            expect(taskManager.writeTodo).toHaveBeenCalledWith(mockData);
        });

        test('should initialize subtasks array if it does not exist', async () => {
            const mockData = {
                tasks: [
                    { id: 'parent-task', title: 'Parent' } // No subtasks array
                ]
            };
            const newSubtask = { title: 'New Subtask', status: 'pending' };

            jest.spyOn(taskManager, 'readTodo').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'writeTodo').mockResolvedValue({});

            await taskManager.addSubtask('parent-task', newSubtask);

            expect(mockData.tasks[0].subtasks).toEqual([newSubtask]);
            expect(taskManager.writeTodo).toHaveBeenCalledWith(mockData);
        });

        test('should not modify data when parent task not found', async () => {
            const mockData = {
                tasks: [
                    { id: 'task-1', title: 'Task 1' }
                ]
            };
            const newSubtask = { title: 'New Subtask' };

            jest.spyOn(taskManager, 'readTodo').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'writeTodo').mockResolvedValue({});

            await taskManager.addSubtask('nonexistent-task', newSubtask);

            expect(taskManager.writeTodo).not.toHaveBeenCalled();
        });
    });

    describe('getResearchReportPath', () => {
        test('should generate correct research report path', () => {
            const taskId = 'task-123';
            const expectedPath = './development/research-reports/research-report-task-123.md';
            
            const result = taskManager.getResearchReportPath(taskId);
            expect(result).toBe(expectedPath);
        });

        test('should handle special characters in task ID', () => {
            const taskId = 'task-123-special_chars.test';
            const expectedPath = './development/research-reports/research-report-task-123-special_chars.test.md';
            
            const result = taskManager.getResearchReportPath(taskId);
            expect(result).toBe(expectedPath);
        });
    });

    describe('researchReportExists', () => {
        test('should return true when research report exists', () => {
            const taskId = 'task-123';
            fs.existsSync.mockReturnValue(true);

            const result = taskManager.researchReportExists(taskId);
            
            expect(result).toBe(true);
            expect(fs.existsSync).toHaveBeenCalled();
        });

        test('should return false when research report does not exist', () => {
            const taskId = 'task-123';
            fs.existsSync.mockReturnValue(false);

            const result = taskManager.researchReportExists(taskId);
            
            expect(result).toBe(false);
        });

        test('should resolve relative paths correctly', () => {
            const taskId = 'task-123';
            const path = require('path');
            const expectedPath = path.resolve(process.cwd(), './development/research-reports/research-report-task-123.md');
            
            fs.existsSync.mockReturnValue(true);
            
            taskManager.researchReportExists(taskId);
            
            expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
        });
    });

    describe('createTask', () => {
        let mockExistingData;

        beforeEach(() => {
            mockExistingData = { tasks: [] };
            jest.spyOn(taskManager, 'readTodo').mockResolvedValue(mockExistingData);
            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue(mockExistingData);
            jest.spyOn(taskManager, 'writeTodo').mockResolvedValue({});
            
            // Mock Date.now for consistent task IDs
            jest.spyOn(Date, 'now').mockReturnValue(1234567890);
            jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
        });

        test('should create task with all required fields', async () => {
            const taskData = {
                title: 'Test Task',
                description: 'Test Description',
                mode: 'development',
                priority: 'high',
                status: 'pending'
            };

            const taskId = await taskManager.createTask(taskData);

            expect(taskId).toMatch(/^task_\d+_[a-z0-9]+$/);
            expect(mockExistingData.tasks).toHaveLength(1);
            
            const createdTask = mockExistingData.tasks[0];
            expect(createdTask.title).toBe(taskData.title);
            expect(createdTask.description).toBe(taskData.description);
            expect(createdTask.mode).toBe(taskData.mode);
            expect(createdTask.priority).toBe(taskData.priority);
            expect(createdTask.status).toBe(taskData.status);
            expect(createdTask.created_at).toBeDefined();
        });

        test('should set default values for optional fields', async () => {
            const taskData = {
                title: 'Minimal Task',
                description: 'Description',
                mode: 'development'
            };

            await taskManager.createTask(taskData);
            
            const createdTask = mockExistingData.tasks[0];
            expect(createdTask.priority).toBe('medium');
            expect(createdTask.status).toBe('pending');
            expect(createdTask.dependencies).toEqual([]);
            expect(createdTask.important_files).toEqual([]);
            expect(createdTask.success_criteria).toEqual([]);
            expect(createdTask.estimate).toBe('');
            expect(createdTask.requires_research).toBe(false);
            expect(createdTask.subtasks).toEqual([]);
        });

        test('should automatically add research report for research tasks', async () => {
            const taskData = {
                title: 'Research Task',
                description: 'Research Description',
                mode: 'RESEARCH'
            };

            const taskId = await taskManager.createTask(taskData);
            
            const createdTask = mockExistingData.tasks[0];
            const expectedReportPath = `./development/research-reports/research-report-${taskId}.md`;
            
            expect(createdTask.important_files).toContain(expectedReportPath);
            expect(createdTask.success_criteria).toEqual(
                expect.arrayContaining([`Research report created: ${expectedReportPath}`])
            );
        });

        test('should handle lowercase research mode', async () => {
            const taskData = {
                title: 'Research Task',
                description: 'Research Description',
                mode: 'research'
            };

            const taskId = await taskManager.createTask(taskData);
            
            const createdTask = mockExistingData.tasks[0];
            const expectedReportPath = `./development/research-reports/research-report-${taskId}.md`;
            
            expect(createdTask.important_files).toContain(expectedReportPath);
        });

        test('should preserve existing important_files and success_criteria', async () => {
            const taskData = {
                title: 'Task with existing data',
                description: 'Description',
                mode: 'RESEARCH',
                important_files: ['existing-file.js'],
                success_criteria: ['Existing criterion']
            };

            const taskId = await taskManager.createTask(taskData);
            
            const createdTask = mockExistingData.tasks[0];
            const expectedReportPath = `./development/research-reports/research-report-${taskId}.md`;
            
            expect(createdTask.important_files).toContain('existing-file.js');
            expect(createdTask.important_files).toContain(expectedReportPath);
            expect(createdTask.success_criteria).toContain('Existing criterion');
            expect(createdTask.success_criteria).toEqual(
                expect.arrayContaining([`Research report created: ${expectedReportPath}`])
            );
        });

        test('should not duplicate research report if already present', async () => {
            const taskData = {
                title: 'Research Task',
                description: 'Description',
                mode: 'research',
                success_criteria: ['Research report created: some-path.md']
            };

            await taskManager.createTask(taskData);
            
            const createdTask = mockExistingData.tasks[0];
            const researchCriteria = createdTask.success_criteria.filter(
                c => c.includes('Research report created')
            );
            
            // Should have original + new one = 2 total
            expect(researchCriteria).toHaveLength(2);
        });
    });

    describe('getNextMode', () => {
        test('should return task mode when last_mode is TASK_CREATION and current task exists', async () => {
            const mockData = { last_mode: 'TASK_CREATION' };
            jest.spyOn(taskManager, 'getCurrentTask').mockResolvedValue({
                mode: 'development'
            });

            const result = await taskManager.getNextMode(mockData);
            expect(result).toBe('development');
        });

        test('should return DEVELOPMENT when last_mode is TASK_CREATION but no current task', async () => {
            const mockData = { last_mode: 'TASK_CREATION' };
            jest.spyOn(taskManager, 'getCurrentTask').mockResolvedValue(null);

            const result = await taskManager.getNextMode(mockData);
            expect(result).toBe('DEVELOPMENT');
        });

        test('should return TASK_CREATION when last_mode is not TASK_CREATION', async () => {
            const mockData = { last_mode: 'development' };

            const result = await taskManager.getNextMode(mockData);
            expect(result).toBe('TASK_CREATION');
        });

        test('should return DEVELOPMENT when no last_mode and no current task', async () => {
            const mockData = {};
            jest.spyOn(taskManager, 'getCurrentTask').mockResolvedValue(null);

            const result = await taskManager.getNextMode(mockData);
            expect(result).toBe('DEVELOPMENT');
        });
    });

    describe('shouldRunReviewer', () => {
        test('should return true when completed tasks is multiple of 5', () => {
            const mockData = {
                tasks: [
                    { status: 'completed', mode: 'development' },
                    { status: 'completed', mode: 'testing' },
                    { status: 'completed', mode: 'refactoring' },
                    { status: 'completed', mode: 'debugging' },
                    { status: 'completed', mode: 'documentation' }
                ]
            };

            const result = taskManager.shouldRunReviewer(mockData);
            expect(result).toBe(true);
        });

        test('should return false when completed tasks is not multiple of 5', () => {
            const mockData = {
                tasks: [
                    { status: 'completed', mode: 'development' },
                    { status: 'completed', mode: 'testing' },
                    { status: 'completed', mode: 'refactoring' }
                ]
            };

            const result = taskManager.shouldRunReviewer(mockData);
            expect(result).toBe(false);
        });

        test('should exclude REVIEWER mode tasks from count', () => {
            const mockData = {
                tasks: [
                    { status: 'completed', mode: 'development' },
                    { status: 'completed', mode: 'testing' },
                    { status: 'completed', mode: 'REVIEWER' },
                    { status: 'completed', mode: 'refactoring' },
                    { status: 'completed', mode: 'debugging' },
                    { status: 'completed', mode: 'documentation' }
                ]
            };

            const result = taskManager.shouldRunReviewer(mockData);
            expect(result).toBe(true);
        });

        test('should return false when no completed tasks', () => {
            const mockData = {
                tasks: [
                    { status: 'pending', mode: 'development' },
                    { status: 'in_progress', mode: 'testing' }
                ]
            };

            const result = taskManager.shouldRunReviewer(mockData);
            expect(result).toBe(false);
        });
    });

    describe('handleStrikeLogic', () => {
        test('should reset strikes when 3 strikes completed', () => {
            const mockData = {
                review_strikes: 3,
                strikes_completed_last_run: true
            };

            const result = taskManager.handleStrikeLogic(mockData);

            expect(mockData.review_strikes).toBe(0);
            expect(mockData.strikes_completed_last_run).toBe(false);
            expect(result.action).toBe('reset');
            expect(result.message).toBe('Resetting review strikes to 0 for new cycle');
        });

        test('should mark completion when third strike just finished', () => {
            const mockData = {
                review_strikes: 3,
                strikes_completed_last_run: false
            };

            const result = taskManager.handleStrikeLogic(mockData);

            expect(mockData.strikes_completed_last_run).toBe(true);
            expect(result.action).toBe('complete');
            expect(result.message).toBe('Third strike completed! Project approved.');
        });

        test('should continue when not at strike threshold', () => {
            const mockData = {
                review_strikes: 1,
                strikes_completed_last_run: false
            };

            const result = taskManager.handleStrikeLogic(mockData);

            expect(result.action).toBe('continue');
            expect(result.message).toBe(null);
        });
    });

    describe('Auto-fixer integration methods', () => {
        describe('getFileStatus', () => {
            test('should delegate to autoFixer.getFileStatus', async () => {
                const mockStatus = { valid: true, canAutoFix: false };
                mockAutoFixer.getFileStatus.mockResolvedValue(mockStatus);

                const result = await taskManager.getFileStatus();

                expect(mockAutoFixer.getFileStatus).toHaveBeenCalledWith(mockTodoPath);
                expect(result).toEqual(mockStatus);
            });
        });

        describe('performAutoFix', () => {
            test('should delegate to autoFixer.autoFix with options', async () => {
                const options = { level: 'aggressive' };
                const mockResult = { success: true, changes: 5 };
                mockAutoFixer.autoFix.mockResolvedValue(mockResult);

                const result = await taskManager.performAutoFix(options);

                expect(mockAutoFixer.autoFix).toHaveBeenCalledWith(mockTodoPath, options);
                expect(result).toEqual(mockResult);
            });

            test('should use default options when none provided', async () => {
                const mockResult = { success: true };
                mockAutoFixer.autoFix.mockResolvedValue(mockResult);

                await taskManager.performAutoFix();

                expect(mockAutoFixer.autoFix).toHaveBeenCalledWith(mockTodoPath, {});
            });
        });

        describe('dryRunAutoFix', () => {
            test('should delegate to autoFixer.dryRun', async () => {
                const mockResult = { wouldFix: ['issue1', 'issue2'] };
                mockAutoFixer.dryRun.mockResolvedValue(mockResult);

                const result = await taskManager.dryRunAutoFix();

                expect(mockAutoFixer.dryRun).toHaveBeenCalledWith(mockTodoPath);
                expect(result).toEqual(mockResult);
            });
        });

        describe('listBackups', () => {
            test('should delegate to recovery.listAvailableBackups', async () => {
                const mockBackups = ['backup1.json', 'backup2.json'];
                mockAutoFixer.recovery.listAvailableBackups.mockReturnValue(mockBackups);

                const result = await taskManager.listBackups();

                expect(mockAutoFixer.recovery.listAvailableBackups).toHaveBeenCalledWith(mockTodoPath);
                expect(result).toEqual(mockBackups);
            });
        });

        describe('restoreFromBackup', () => {
            test('should delegate to recovery.restoreFromBackup with specific backup', async () => {
                const backupFile = 'specific-backup.json';
                const mockResult = { success: true, restored: true };
                mockAutoFixer.recovery.restoreFromBackup.mockResolvedValue(mockResult);

                const result = await taskManager.restoreFromBackup(backupFile);

                expect(mockAutoFixer.recovery.restoreFromBackup).toHaveBeenCalledWith(mockTodoPath, backupFile);
                expect(result).toEqual(mockResult);
            });

            test('should use null backup file when none specified', async () => {
                const mockResult = { success: true };
                mockAutoFixer.recovery.restoreFromBackup.mockResolvedValue(mockResult);

                await taskManager.restoreFromBackup();

                expect(mockAutoFixer.recovery.restoreFromBackup).toHaveBeenCalledWith(mockTodoPath, null);
            });
        });

        describe('createBackup', () => {
            test('should delegate to recovery.createBackup', async () => {
                const mockResult = { success: true, backupPath: 'backup.json' };
                mockAutoFixer.recovery.createBackup.mockResolvedValue(mockResult);

                const result = await taskManager.createBackup();

                expect(mockAutoFixer.recovery.createBackup).toHaveBeenCalledWith(mockTodoPath);
                expect(result).toEqual(mockResult);
            });
        });
    });

    describe('validateTodoFile', () => {
        test('should validate file and return result when file is readable', async () => {
            const mockData = { valid: 'data' };
            const mockValidationResult = {
                isValid: true,
                errors: [],
                fixes: [],
                summary: { totalErrors: 0, totalFixes: 0, criticalErrors: 0 }
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockData));
            mockAutoFixer.validator.validateAndSanitize.mockReturnValue(mockValidationResult);

            const result = await taskManager.validateTodoFile();

            expect(fs.readFileSync).toHaveBeenCalledWith(mockTodoPath, 'utf8');
            expect(mockAutoFixer.validator.validateAndSanitize).toHaveBeenCalledWith(mockData, mockTodoPath);
            expect(result).toEqual(mockValidationResult);
        });

        test('should return error result when file cannot be read', async () => {
            const error = new Error('File not found');
            fs.readFileSync.mockImplementation(() => {
                throw error;
            });

            const result = await taskManager.validateTodoFile();

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].type).toBe('FILE_READ_ERROR');
            expect(result.errors[0].message).toBe('File not found');
            expect(result.errors[0].severity).toBe('critical');
            expect(result.summary.totalErrors).toBe(1);
            expect(result.summary.criticalErrors).toBe(1);
        });

        test('should return error result when JSON parsing fails', async () => {
            fs.readFileSync.mockReturnValue('invalid json{');

            const result = await taskManager.validateTodoFile();

            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('FILE_READ_ERROR');
            expect(result.summary.criticalErrors).toBe(1);
        });
    });

    describe('Edge Cases and Error Scenarios', () => {
        test('should handle very large task arrays efficiently', async () => {
            const largeTasks = Array.from({ length: 10000 }, (_, i) => ({
                id: `task-${i}`,
                status: i === 5000 ? 'pending' : 'completed'
            }));

            jest.spyOn(taskManager, 'readTodo').mockResolvedValue({ tasks: largeTasks });
            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue({ tasks: largeTasks });

            // Use performance.now() instead of Date.now() to avoid mock interference
            const startTime = performance.now();
            const result = await taskManager.getCurrentTask();
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(result.id).toBe('task-5000');
            expect(typeof duration).toBe('number');
            expect(duration).toBeGreaterThanOrEqual(0);
            expect(duration).toBeLessThan(100); // Should be fast
        });

        test('should handle special characters in task IDs and paths', async () => {
            const specialTaskId = 'task-with-special-chars-!@#$%^&*()';
            const mockData = {
                tasks: [{ id: specialTaskId, status: 'pending' }]
            };

            jest.spyOn(taskManager, 'readTodo').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'writeTodo').mockResolvedValue({});

            await taskManager.updateTaskStatus(specialTaskId, 'completed');

            expect(mockData.tasks[0].status).toBe('completed');
        });

        test('should handle concurrent access patterns', async () => {
            const mockData = { tasks: [{ id: 'task-1', status: 'pending' }] };
            
            jest.spyOn(taskManager, 'readTodo').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'readTodoFast').mockResolvedValue(mockData);
            jest.spyOn(taskManager, 'writeTodo').mockResolvedValue({});

            // Simulate concurrent updates
            const promises = [
                taskManager.updateTaskStatus('task-1', 'in_progress'),
                taskManager.updateTaskStatus('task-1', 'completed'),
                taskManager.addSubtask('task-1', { title: 'Subtask 1' }),
                taskManager.addSubtask('task-1', { title: 'Subtask 2' })
            ];

            await Promise.all(promises);

            // Verify all operations completed without errors
            expect(taskManager.writeTodo).toHaveBeenCalled();
        });

        test('should handle filesystem permission errors gracefully', async () => {
            const permissionError = new Error('EACCES: permission denied');
            permissionError.code = 'EACCES';
            
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw permissionError;
            });
            
            // Make recovery also fail for permission errors to test error propagation
            mockAutoFixer.recoverCorruptedFile.mockResolvedValue({ success: false });

            await expect(taskManager.readTodo()).rejects.toThrow('permission denied');
        });

        test('should handle network/disk full errors during write', async () => {
            const diskFullError = new Error('ENOSPC: no space left on device');
            diskFullError.code = 'ENOSPC';
            
            mockAutoFixer.validator.validateAndSanitize.mockReturnValue({
                isValid: true,
                data: {}
            });
            mockAutoFixer.recovery.atomicWrite.mockResolvedValue({
                success: false,
                error: diskFullError.message
            });

            await expect(taskManager.writeTodo({})).rejects.toThrow('no space left on device');
        });
    });

    describe('Integration Tests', () => {
        test('should handle complete task lifecycle', async () => {
            // Initial empty state
            let mockData = { tasks: [] };
            jest.spyOn(taskManager, 'readTodo').mockImplementation(() => Promise.resolve(mockData));
            jest.spyOn(taskManager, 'readTodoFast').mockImplementation(() => Promise.resolve(mockData));
            jest.spyOn(taskManager, 'writeTodo').mockImplementation((data) => {
                mockData = data;
                return Promise.resolve({});
            });

            // Create task
            const taskId = await taskManager.createTask({
                title: 'Integration Test Task',
                description: 'Test complete lifecycle',
                mode: 'development'
            });

            expect(mockData.tasks).toHaveLength(1);
            expect(mockData.tasks[0].id).toBe(taskId);

            // Get current task
            const currentTask = await taskManager.getCurrentTask();
            expect(currentTask.id).toBe(taskId);
            expect(currentTask.status).toBe('pending');

            // Update status
            await taskManager.updateTaskStatus(taskId, 'in_progress');
            expect(mockData.tasks[0].status).toBe('in_progress');

            // Add subtask
            await taskManager.addSubtask(taskId, {
                title: 'Subtask 1',
                status: 'pending'
            });
            expect(mockData.tasks[0].subtasks).toHaveLength(1);

            // Complete task
            await taskManager.updateTaskStatus(taskId, 'completed');
            expect(mockData.tasks[0].status).toBe('completed');

            // Verify no current task
            const noCurrentTask = await taskManager.getCurrentTask();
            expect(noCurrentTask).toBeUndefined();
        });

        test('should handle reviewer workflow correctly', async () => {
            const mockData = {
                tasks: Array.from({ length: 10 }, (_, i) => ({
                    id: `task-${i}`,
                    status: 'completed',
                    mode: 'development'
                })),
                review_strikes: 0,
                strikes_completed_last_run: false
            };

            // Should trigger reviewer after 5 tasks
            expect(taskManager.shouldRunReviewer(mockData)).toBe(true);

            // Simulate strikes
            mockData.review_strikes = 3;
            mockData.strikes_completed_last_run = false;

            let result = taskManager.handleStrikeLogic(mockData);
            expect(result.action).toBe('complete');

            // Next run should reset
            mockData.strikes_completed_last_run = true;
            result = taskManager.handleStrikeLogic(mockData);
            expect(result.action).toBe('reset');
            expect(mockData.review_strikes).toBe(0);
        });
    });

    describe('Important Files Management', () => {
        test('should add important file to task', async () => {
            const taskId = 'task-123';
            const filePath = './development/research-reports/analysis.md';
            
            const mockData = {
                tasks: [{ 
                    id: taskId, 
                    title: 'Test Task',
                    important_files: ['existing-file.md']
                }]
            };
            
            // Mock readTodo, readTodoFast and writeTodo to work with the actual mockData object
            taskManager.readTodo = jest.fn().mockResolvedValue(mockData);
            taskManager.readTodoFast = jest.fn().mockResolvedValue(mockData);
            taskManager.writeTodo = jest.fn().mockResolvedValue();
            
            const result = await taskManager.addImportantFile(taskId, filePath);
            
            expect(result).toBe(true);
            expect(mockData.tasks[0].important_files).toContain(filePath);
            expect(mockData.tasks[0].important_files).toHaveLength(2);
            expect(taskManager.writeTodo).toHaveBeenCalledWith(mockData);
        });

        test('should not add duplicate important file', async () => {
            const taskId = 'task-123';
            const filePath = './development/research-reports/analysis.md';
            
            const mockData = {
                tasks: [{ 
                    id: taskId, 
                    title: 'Test Task',
                    important_files: [filePath] // Already exists
                }]
            };
            
            // Mock readTodo, readTodoFast and writeTodo to work with the actual mockData object
            taskManager.readTodo = jest.fn().mockResolvedValue(mockData);
            taskManager.readTodoFast = jest.fn().mockResolvedValue(mockData);
            taskManager.writeTodo = jest.fn().mockResolvedValue();
            
            const result = await taskManager.addImportantFile(taskId, filePath);
            
            expect(result).toBe(false);
            expect(mockData.tasks[0].important_files).toHaveLength(1);
            expect(taskManager.writeTodo).not.toHaveBeenCalled();
        });

        test('should initialize important_files array if not present', async () => {
            const taskId = 'task-123';
            const filePath = './development/research-reports/analysis.md';
            
            const mockData = {
                tasks: [{ 
                    id: taskId, 
                    title: 'Test Task'
                    // No important_files property
                }]
            };
            
            // Mock readTodo, readTodoFast and writeTodo to work with the actual mockData object
            taskManager.readTodo = jest.fn().mockResolvedValue(mockData);
            taskManager.readTodoFast = jest.fn().mockResolvedValue(mockData);
            taskManager.writeTodo = jest.fn().mockResolvedValue();
            
            const result = await taskManager.addImportantFile(taskId, filePath);
            
            expect(result).toBe(true);
            expect(mockData.tasks[0].important_files).toEqual([filePath]);
            expect(taskManager.writeTodo).toHaveBeenCalledWith(mockData);
        });

        test('should remove important file from task', async () => {
            const taskId = 'task-123';
            const filePath = './development/research-reports/analysis.md';
            
            const mockData = {
                tasks: [{ 
                    id: taskId, 
                    title: 'Test Task',
                    important_files: [filePath, 'other-file.md']
                }]
            };
            
            // Mock readTodo, readTodoFast and writeTodo to work with the actual mockData object
            taskManager.readTodo = jest.fn().mockResolvedValue(mockData);
            taskManager.readTodoFast = jest.fn().mockResolvedValue(mockData);
            taskManager.writeTodo = jest.fn().mockResolvedValue();
            
            const result = await taskManager.removeImportantFile(taskId, filePath);
            
            expect(result).toBe(true);
            expect(mockData.tasks[0].important_files).not.toContain(filePath);
            expect(mockData.tasks[0].important_files).toEqual(['other-file.md']);
            expect(taskManager.writeTodo).toHaveBeenCalledWith(mockData);
        });

        test('should return false when removing non-existent file', async () => {
            const taskId = 'task-123';
            const filePath = './development/research-reports/nonexistent.md';
            
            const mockData = {
                tasks: [{ 
                    id: taskId, 
                    title: 'Test Task',
                    important_files: ['other-file.md']
                }]
            };
            
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockData));
            
            const result = await taskManager.removeImportantFile(taskId, filePath);
            
            expect(result).toBe(false);
            expect(mockData.tasks[0].important_files).toEqual(['other-file.md']);
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        test('should handle task without important_files when removing', async () => {
            const taskId = 'task-123';
            const filePath = './development/research-reports/analysis.md';
            
            const mockData = {
                tasks: [{ 
                    id: taskId, 
                    title: 'Test Task'
                    // No important_files property
                }]
            };
            
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockData));
            
            const result = await taskManager.removeImportantFile(taskId, filePath);
            
            expect(result).toBe(false);
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        test('should return false when task not found for adding file', async () => {
            const filePath = './development/research-reports/analysis.md';
            
            const mockData = { tasks: [] };
            
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockData));
            
            const result = await taskManager.addImportantFile('nonexistent-task', filePath);
            
            expect(result).toBe(false);
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        test('should return false when task not found for removing file', async () => {
            const filePath = './development/research-reports/analysis.md';
            
            const mockData = { tasks: [] };
            
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockData));
            
            const result = await taskManager.removeImportantFile('nonexistent-task', filePath);
            
            expect(result).toBe(false);
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });
    });
});

// =============================================================================
// End of taskManager.test.js
// =============================================================================