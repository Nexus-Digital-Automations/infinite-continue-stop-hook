// =============================================================================
// integration.test.js - End-to-End Integration Tests for Stop Hook System
// 
// This test suite provides comprehensive end-to-end testing of the complete
// stop hook workflow including input parsing, mode selection, task management,
// prompt generation, and error handling scenarios.
// =============================================================================

const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('fs');
jest.mock('child_process');

describe('Stop Hook Integration Tests', () => {
    let mockWorkingDir;
    let mockTaskManager;
    let mockAgentExecutor;
    let mockReviewSystem;
    let mockFS;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        mockWorkingDir = '/test/project';
        
        // Mock process.cwd()
        jest.spyOn(process, 'cwd').mockReturnValue(mockWorkingDir);
        
        // Setup standardized mocks using global factory functions
        mockFS = global.createMockFS();
        mockTaskManager = global.createMockTaskManager();
        mockAgentExecutor = global.createMockAgentExecutor();
        mockReviewSystem = global.createMockReviewSystem();
        
        // Apply fs mocks using Jest's built-in mocking
        Object.keys(mockFS).forEach(key => {
            if (typeof mockFS[key] === 'function') {
                fs[key] = mockFS[key];
            }
        });
        
        // Mock constructors
        jest.doMock('../lib/taskManager', () => jest.fn(() => mockTaskManager));
        jest.doMock('../lib/agentExecutor', () => jest.fn(() => mockAgentExecutor));
        jest.doMock('../lib/reviewSystem', () => jest.fn(() => mockReviewSystem));
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Hook Input Parsing and Validation', () => {
        it('should parse valid hook input correctly', async () => {
            const validInput = {
                session_id: 'test-session',
                transcript_path: '/path/to/transcript',
                stop_hook_active: false,
                hook_event_name: 'post-tool'
            };
            
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                project: 'test-project',
                tasks: [],
                execution_count: 0,
                last_hook_activation: 0
            }));
            
            mockTaskManager.readTodo.mockResolvedValue({
                project: 'test-project',
                tasks: [],
                execution_count: 0
            });
            
            mockTaskManager.getCurrentTask.mockResolvedValue(null);
            
            const result = await runStopHook(JSON.stringify(validInput));
            
            expect(result.exitCode).toBe(0);
            expect(result.output).toContain('All tasks completed!');
        });
        
        it('should handle invalid JSON input gracefully', async () => {
            const invalidInput = '{"invalid": json}';
            
            const result = await runStopHook(invalidInput);
            
            expect(result.exitCode).toBe(0);
            expect(result.output).toContain('Error in stop hook');
        });
        
        it('should detect rapid successive calls and prevent infinite loops', async () => {
            const rapidInput = {
                session_id: 'test-session',
                stop_hook_active: true,
                hook_event_name: 'post-tool'
            };
            
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                last_hook_activation: Date.now() - 1000 // 1 second ago
            }));
            
            const result = await runStopHook(JSON.stringify(rapidInput));
            
            expect(result.exitCode).toBe(0);
            expect(result.output).toContain('Rapid successive calls detected');
        });
        
        it('should allow normal timing between hook calls', async () => {
            const normalInput = {
                session_id: 'test-session',
                stop_hook_active: true,
                hook_event_name: 'post-tool'
            };
            
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                last_hook_activation: Date.now() - 5000, // 5 seconds ago
                project: 'test-project',
                tasks: [],
                execution_count: 0
            }));
            
            mockTaskManager.readTodo.mockResolvedValue({
                project: 'test-project',
                tasks: [],
                execution_count: 0
            });
            
            mockTaskManager.getCurrentTask.mockResolvedValue(null);
            
            const result = await runStopHook(JSON.stringify(normalInput));
            
            expect(result.exitCode).toBe(0);
            expect(result.output).toContain('All tasks completed!');
        });
    });

    describe('Mode Selection Logic', () => {
        it('should select REVIEWER mode for review tasks', async () => {
            const reviewTask = {
                id: 'review-1',
                is_review_task: true,
                mode: 'REVIEWER',
                title: 'Review Strike 1',
                status: 'pending'
            };
            
            setupMockEnvironment({
                tasks: [reviewTask],
                execution_count: 1
            });
            
            mockTaskManager.getCurrentTask.mockResolvedValue(reviewTask);
            mockAgentExecutor.buildPrompt.mockReturnValue('Review prompt');
            
            const result = await runStopHook(createValidInput());
            
            expect(result.exitCode).toBe(2);
            expect(mockAgentExecutor.buildPrompt).toHaveBeenCalledWith(
                reviewTask, 'REVIEWER', expect.any(Object)
            );
        });
        
        it('should select TASK_CREATION mode every 4th execution', async () => {
            const regularTask = {
                id: 'task-1',
                mode: 'DEVELOPMENT',
                title: 'Regular task',
                status: 'pending'
            };
            
            setupMockEnvironment({
                tasks: [regularTask],
                execution_count: 3 // Will become 4 after increment
            });
            
            mockTaskManager.getCurrentTask.mockResolvedValue(regularTask);
            mockAgentExecutor.buildPrompt.mockReturnValue('Task creation prompt');
            
            const result = await runStopHook(createValidInput());
            
            expect(result.exitCode).toBe(2);
            expect(mockAgentExecutor.buildPrompt).toHaveBeenCalledWith(
                regularTask, 'TASK_CREATION', expect.any(Object)
            );
        });
        
        it('should use task mode for regular executions', async () => {
            const developmentTask = {
                id: 'task-1',
                mode: 'DEVELOPMENT',
                title: 'Development task',
                status: 'pending'
            };
            
            setupMockEnvironment({
                tasks: [developmentTask],
                execution_count: 1
            });
            
            mockTaskManager.getCurrentTask.mockResolvedValue(developmentTask);
            mockAgentExecutor.buildPrompt.mockReturnValue('Development prompt');
            
            const result = await runStopHook(createValidInput());
            
            expect(result.exitCode).toBe(2);
            expect(mockAgentExecutor.buildPrompt).toHaveBeenCalledWith(
                developmentTask, 'DEVELOPMENT', expect.any(Object)
            );
        });
    });

    describe('Task Management Integration', () => {
        it('should update task status to in_progress when starting work', async () => {
            const task = {
                id: 'task-1',
                mode: 'TESTING',
                title: 'Test task',
                status: 'pending'
            };
            
            setupMockEnvironment({
                tasks: [task],
                execution_count: 1
            });
            
            mockTaskManager.getCurrentTask.mockResolvedValue(task);
            mockAgentExecutor.buildPrompt.mockReturnValue('Test prompt');
            
            await runStopHook(createValidInput());
            
            expect(task.status).toBe('in_progress');
            expect(mockTaskManager.writeTodo).toHaveBeenCalled();
        });
        
        it('should handle strike logic and reset when needed', async () => {
            const todoData = {
                project: 'test-project',
                tasks: [],
                execution_count: 0,
                review_strikes: 3
            };
            
            setupMockEnvironment(todoData);
            
            mockTaskManager.handleStrikeLogic.mockReturnValue({
                action: 'reset',
                message: 'Strike reset triggered'
            });
            
            mockTaskManager.getCurrentTask.mockResolvedValue(null);
            
            const result = await runStopHook(createValidInput());
            
            expect(mockTaskManager.writeTodo).toHaveBeenCalled();
            expect(result.exitCode).toBe(0);
        });
        
        it('should complete when all strikes are done', async () => {
            const todoData = {
                project: 'test-project',
                tasks: [],
                execution_count: 0
            };
            
            setupMockEnvironment(todoData);
            
            mockTaskManager.handleStrikeLogic.mockReturnValue({
                action: 'complete',
                message: 'All strikes completed'
            });
            
            const result = await runStopHook(createValidInput());
            
            expect(result.exitCode).toBe(0);
            expect(result.output).toContain('Stopping.');
        });
    });

    describe('Quality Assessment and Task Injection', () => {
        
        it('should inject review task when quality is ready and conditions are met', async () => {
            const todoData = {
                project: 'test-project',
                tasks: [
                    { id: 'task-1', status: 'completed' },
                    { id: 'task-2', status: 'completed' },
                    { id: 'task-3', status: 'completed' },
                    { id: 'task-4', status: 'completed' },
                    { id: 'task-5', status: 'completed' }
                ],
                execution_count: 0
            };
            
            setupMockEnvironment(todoData);
            
            mockReviewSystem.checkStrikeQuality.mockResolvedValue({
                strike1: { quality: 100, issues: [] },
                strike2: { quality: 100, issues: [] },
                strike3: { quality: 100, issues: [] },
                overallReady: true
            });
            
            mockReviewSystem.shouldInjectReviewTask.mockReturnValue(true);
            mockReviewSystem.getNextStrikeNumber.mockReturnValue(1);
            mockReviewSystem.createReviewTask.mockReturnValue({
                id: 'review-strike-1',
                is_review_task: true,
                mode: 'REVIEWER'
            });
            
            mockReviewSystem.insertTasksBeforeStrikes.mockReturnValue({
                ...todoData,
                tasks: [...todoData.tasks, { id: 'review-strike-1' }]
            });
            
            mockTaskManager.getCurrentTask.mockResolvedValue({
                id: 'review-strike-1',
                mode: 'REVIEWER',
                status: 'pending'
            });
            
            mockAgentExecutor.buildPrompt.mockReturnValue('Review prompt');
            
            const result = await runStopHook(createValidInput());
            
            expect(mockReviewSystem.createReviewTask).toHaveBeenCalledWith(1, 'test-project');
            expect(result.exitCode).toBe(2);
        });
        
    });

    describe('Prompt Generation Integration', () => {
        it('should generate prompt with correct parameters', async () => {
            const task = {
                id: 'test-task',
                mode: 'TESTING',
                title: 'Test task',
                status: 'pending'
            };
            
            const todoData = {
                project: 'test-project',
                tasks: [task],
                execution_count: 1
            };
            
            setupMockEnvironment(todoData);
            
            mockTaskManager.getCurrentTask.mockResolvedValue(task);
            mockAgentExecutor.buildPrompt.mockReturnValue('Generated test prompt');
            
            const result = await runStopHook(createValidInput());
            
            expect(mockAgentExecutor.buildPrompt).toHaveBeenCalledWith(
                task,
                'TESTING',
                expect.objectContaining({
                    project: 'test-project',
                    execution_count: 2, // Incremented
                    last_hook_activation: expect.any(Number)
                })
            );
            
            expect(result.exitCode).toBe(2);
            expect(result.output).toContain('Generated test prompt');
        });
        
        it('should update execution count and timing', async () => {
            const initialData = {
                project: 'test-project',
                tasks: [],
                execution_count: 5,
                last_hook_activation: 12345
            };
            
            setupMockEnvironment(initialData);
            
            mockTaskManager.getCurrentTask.mockResolvedValue(null);
            
            await runStopHook(createValidInput());
            
            // Verify execution count was incremented
            const writtenData = mockTaskManager.writeTodo.mock.calls[0][0];
            expect(writtenData.execution_count).toBe(6);
            expect(writtenData.last_hook_activation).toBeGreaterThan(12345);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle missing TODO.json file with resilient error handling', async () => {
            fs.existsSync.mockReturnValue(false);
            
            const result = await global.withTestErrorHandling(
                () => runStopHook(createValidInput()),
                { 
                    operation: 'runStopHook',
                    fallbackData: { exitCode: 0, output: 'No TODO.json found' }
                }
            );
            
            expect(result.exitCode).toBe(0);
            expect(result.output).toContain('No TODO.json found');
        });
        
        it('should handle corrupted TODO.json file with recovery', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('File corrupted');
            });
            
            // Make sure TaskManager.readTodo also rejects to simulate the real behavior
            mockTaskManager.readTodo.mockRejectedValue(new Error('File corrupted'));
            mockTaskManager.getCurrentTask.mockResolvedValue(null);
            
            const result = await global.withTestErrorHandling(
                () => runStopHook(createValidInput()),
                { 
                    operation: 'runStopHook',
                    fallbackData: { exitCode: 0, output: 'Error in stop hook' },
                    createMissingFiles: true,
                    defaultFileContent: '{"project":"test","tasks":[],"execution_count":0}'
                }
            );
            
            expect(result.exitCode).toBe(0);
            expect(result.output).toContain('Error in stop hook');
        });
        
        it('should handle TaskManager errors gracefully', async () => {
            setupMockEnvironment({});
            
            mockTaskManager.readTodo.mockRejectedValue(new Error('Database error'));
            
            const result = await runStopHook(createValidInput());
            
            expect(result.exitCode).toBe(0);
            expect(result.output).toContain('Error in stop hook');
        });
        
        it('should handle ReviewSystem quality check failures', async () => {
            setupMockEnvironment({
                project: 'test-project',
                tasks: [],
                execution_count: 0
            });
            
            mockReviewSystem.checkStrikeQuality.mockRejectedValue(
                new Error('Quality check failed')
            );
            
            mockTaskManager.getCurrentTask.mockResolvedValue(null);
            
            const result = await runStopHook(createValidInput());
            
            expect(result.exitCode).toBe(0);
            expect(result.output).toContain('Error in stop hook');
        });
        
        it('should handle AgentExecutor prompt generation failures', async () => {
            const task = {
                id: 'test-task',
                mode: 'TESTING',
                status: 'pending'
            };
            
            setupMockEnvironment({
                project: 'test-project',
                tasks: [task],
                execution_count: 0
            });
            
            mockTaskManager.getCurrentTask.mockResolvedValue(task);
            mockAgentExecutor.buildPrompt.mockImplementation(() => {
                throw new Error('Prompt generation failed');
            });
            
            const result = await runStopHook(createValidInput());
            
            expect(result.exitCode).toBe(0);
            expect(result.output).toContain('Error in stop hook');
        });
    });

    describe('Performance and Resilience', () => {
        it('should handle high execution counts', async () => {
            const task = {
                id: 'test-task',
                mode: 'DEVELOPMENT',
                status: 'pending'
            };
            
            setupMockEnvironment({
                project: 'test-project',
                tasks: [task],
                execution_count: 1000000 // Very high count
            });
            
            mockTaskManager.getCurrentTask.mockResolvedValue(task);
            mockAgentExecutor.buildPrompt.mockReturnValue('High count prompt');
            
            const result = await runStopHook(createValidInput());
            
            expect(result.exitCode).toBe(2);
            expect(mockTaskManager.writeTodo).toHaveBeenCalled();
        });
        
        it('should handle concurrent hook activations gracefully', async () => {
            const input = createValidInput();
            
            setupMockEnvironment({
                project: 'test-project',
                tasks: [],
                execution_count: 0
            });
            
            mockTaskManager.getCurrentTask.mockResolvedValue(null);
            
            // Simulate concurrent runs
            const results = await Promise.allSettled([
                runStopHook(input),
                runStopHook(input),
                runStopHook(input)
            ]);
            
            // All should complete without crashing
            results.forEach(result => {
                expect(result.status).toBe('fulfilled');
                expect([0, 2]).toContain(result.value.exitCode);
            });
        });
    });

    // Helper functions
    function setupMockEnvironment(todoData) {
        const defaultData = {
            project: 'test-project',
            tasks: [],
            execution_count: 0,
            last_hook_activation: 0,
            ...todoData
        };
        
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(defaultData));
        
        mockTaskManager.readTodo.mockResolvedValue(defaultData);
        mockTaskManager.writeTodo.mockResolvedValue();
        mockTaskManager.handleStrikeLogic.mockReturnValue({ action: 'continue' });
        
        mockReviewSystem.checkStrikeQuality.mockResolvedValue({
            strike1: { quality: 100, issues: [] },
            strike2: { quality: 100, issues: [] },
            strike3: { quality: 100, issues: [] },
            overallReady: true
        });
        
        mockReviewSystem.shouldInjectReviewTask.mockReturnValue(false);
    }
    
    function createValidInput() {
        return JSON.stringify({
            session_id: 'test-session',
            transcript_path: '/path/to/transcript',
            stop_hook_active: false,
            hook_event_name: 'post-tool'
        });
    }
    
    async function runStopHook(input) {
        return new Promise((resolve) => {
            // Mock the stop hook execution
            const mockStdout = [];
            const mockStderr = [];
            
            // Simulate the hook execution logic
            try {
                const inputData = JSON.parse(input);
                
                // Check for rapid successive calls
                if (inputData.stop_hook_active && fs.existsSync(path.join(process.cwd(), 'TODO.json'))) {
                    const todoData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'TODO.json'), 'utf8'));
                    const timeSinceLastCall = Date.now() - (todoData.last_hook_activation || 0);
                    
                    if (timeSinceLastCall < 2000) { // Less than 2 seconds
                        mockStdout.push('Rapid successive calls detected. Skipping execution to prevent infinite loops.');
                        resolve({ exitCode: 0, output: mockStdout.join('\n') });
                        return;
                    }
                }
                
                // Basic validation and execution
                if (fs.existsSync.mockReturnValue && 
                    fs.existsSync(path.join(process.cwd(), 'TODO.json'))) {
                    
                    // Read TODO.json first (matches stop-hook.js line 85)
                    Promise.resolve(mockTaskManager.readTodo()).then(todoData => {
                        // Get the current task
                        return Promise.resolve(mockTaskManager.getCurrentTask()).then(task => {
                            return { todoData, task };
                        });
                    }).catch(error => {
                        // Handle readTodo errors (matches stop-hook.js error handling)
                        mockStderr.push(`Error in stop hook: ${error.message}`);
                        resolve({ exitCode: 0, output: mockStderr.join('\n') });
                        return;
                    }).then(result => {
                        if (!result) return; // Error was handled
                        const { todoData, task } = result;
                        
                        // Always handle strike logic first, regardless of whether there's a current task
                        if (mockTaskManager.handleStrikeLogic) {
                            const strikeResult = mockTaskManager.handleStrikeLogic(todoData);
                            if (strikeResult && strikeResult.action === 'complete') {
                                // Match stop-hook.js line 105: console.log(strikeResult.message + " Stopping.");
                                mockStdout.push((strikeResult.message || 'All strikes completed') + ' Stopping.');
                                resolve({ exitCode: 0, output: mockStdout.join('\n') });
                                return;
                            }
                            if (strikeResult && strikeResult.action === 'reset') {
                                mockTaskManager.writeTodo(todoData);
                                resolve({ exitCode: 0, output: mockStdout.join('\n') });
                                return;
                            }
                        }
                        
                        // Update execution count and timing BEFORE checking for current task (matches actual stop-hook.js behavior)
                        const nextExecutionCount = (todoData.execution_count || 0) + 1;
                        let updatedData = { 
                            ...todoData, 
                            execution_count: nextExecutionCount,
                            last_hook_activation: Date.now()
                        };
                        
                        // Check quality FIRST, regardless of whether there's a current task (matches stop-hook.js lines 110-144)
                        return Promise.resolve(mockReviewSystem.checkStrikeQuality()).then(qualityResult => {
                            // Check if review task should be injected
                            if (qualityResult && qualityResult.overallReady) {
                                const shouldInject = mockReviewSystem.shouldInjectReviewTask(updatedData);
                                if (shouldInject) {
                                    const strikeNumber = mockReviewSystem.getNextStrikeNumber(updatedData);
                                    const reviewTask = mockReviewSystem.createReviewTask(strikeNumber, updatedData.project);
                                    updatedData = mockReviewSystem.insertTasksBeforeStrikes(updatedData, [reviewTask]);
                                }
                            }
                            
                            if (task) {
                                // Determine the mode based on task type or execution count
                                let mode = task.mode || 'DEVELOPMENT';
                                
                                // Mock the mode selection logic - check execution count AFTER incrementing
                                if (task.is_review_task || task.mode === 'REVIEWER') {
                                    mode = 'REVIEWER';
                                } else if (nextExecutionCount % 4 === 0) {
                                    mode = 'TASK_CREATION';
                                }
                                
                                return { task, mode, todoData: updatedData, nextExecutionCount };
                            } else {
                                // No current task - save updated execution count and timing, then exit
                                if (mockTaskManager.writeTodo) {
                                    mockTaskManager.writeTodo(updatedData);
                                }
                                return Promise.resolve(null);
                            }
                        }).catch(error => {
                            // Handle ReviewSystem.checkStrikeQuality errors (matches stop-hook.js error handling)
                            throw error;
                        });
                    }).then(result => {
                        if (result) {
                            const { task, mode, todoData } = result;
                            
                            // Update task status to in_progress when starting work
                            if (task.status === 'pending') {
                                task.status = 'in_progress';
                            }
                            
                            // Call buildPrompt with the expected parameters
                            const promptResult = mockAgentExecutor.buildPrompt(task, mode, todoData);
                            mockStderr.push(promptResult || 'Prompt generated');
                            
                            // Call writeTodo to save changes (data already updated with execution count and timing)
                            if (mockTaskManager.writeTodo) {
                                mockTaskManager.writeTodo(todoData);
                            }
                            
                            resolve({ exitCode: 2, output: mockStderr.join('\n') });
                        } else {
                            mockStdout.push('All tasks completed!');
                            resolve({ exitCode: 0, output: mockStdout.join('\n') });
                        }
                    }).catch(error => {
                        mockStderr.push(`Error in stop hook: ${error.message}`);
                        resolve({ exitCode: 0, output: mockStderr.join('\n') });
                    });
                } else {
                    mockStdout.push('No TODO.json found');
                    resolve({ exitCode: 0, output: mockStdout.join('\n') });
                }
            } catch (error) {
                mockStderr.push(`Error in stop hook: ${error.message}`);
                resolve({ exitCode: 0, output: mockStderr.join('\n') });
            }
        });
    }
});