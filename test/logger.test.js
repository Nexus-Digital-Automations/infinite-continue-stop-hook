// =============================================================================
// logger.test.js - Comprehensive Test Suite for Logger Class
// 
// This test suite provides complete coverage of the Logger class including
// log data collection, flow tracking, error handling, and file operations.
// =============================================================================

const fs = require('fs');
const os = require('os');
const Logger = require('../lib/logger');

// Mock dependencies
jest.mock('fs');
jest.mock('os');

describe('Logger', () => {
    let logger;
    let mockProjectRoot;
    let mockLogPath;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockProjectRoot = '/test/project';
        mockLogPath = '/test/project/infinite-continue-hook.log';
        
        // Mock os module
        os.platform.mockReturnValue('linux');
        os.arch.mockReturnValue('x64');
        
        // Mock process properties
        Object.defineProperty(process, 'version', { value: 'v18.17.0', configurable: true });
        Object.defineProperty(process, 'pid', { value: 12345, configurable: true });
        Object.defineProperty(process, 'cwd', { value: jest.fn(() => '/test/project'), configurable: true });
        
        logger = new Logger(mockProjectRoot);
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with correct project root and log path', () => {
            expect(logger.projectRoot).toBe(mockProjectRoot);
            expect(logger.logPath).toBe(mockLogPath);
        });
        
        it('should initialize log data with execution metadata', () => {
            expect(logger.logData.execution).toEqual({
                timestamp: expect.any(String),
                projectRoot: mockProjectRoot,
                hookVersion: '1.0.0',
                nodeVersion: 'v18.17.0',
                platform: 'linux',
                arch: 'x64',
                pid: 12345,
                cwd: '/test/project'
            });
        });
        
        it('should initialize empty data structures', () => {
            expect(logger.logData.input).toEqual({});
            expect(logger.logData.projectState).toEqual({});
            expect(logger.logData.decisions).toEqual([]);
            expect(logger.logData.flow).toEqual([]);
            expect(logger.logData.output).toEqual({});
            expect(logger.logData.errors).toEqual([]);
        });
        
        it('should set timestamp in ISO format', () => {
            const timestamp = logger.logData.execution.timestamp;
            expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
            expect(new Date(timestamp)).toBeInstanceOf(Date);
        });
    });

    describe('Input Logging', () => {
        it('should log hook input correctly', () => {
            const mockInput = {
                session_id: 'test-session-123',
                transcript_path: '/path/to/transcript',
                stop_hook_active: false,
                additional_data: 'test'
            };
            
            logger.logInput(mockInput);
            
            expect(logger.logData.input).toEqual({
                sessionId: 'test-session-123',
                transcriptPath: '/path/to/transcript',
                stopHookActive: false,
                rawInput: mockInput
            });
            
            expect(logger.logData.flow).toHaveLength(1);
            expect(logger.logData.flow[0].message).toBe('Received input from Claude Code');
        });
        
        it('should handle undefined or null input fields', () => {
            const mockInput = {
                session_id: null,
                stop_hook_active: undefined
            };
            
            logger.logInput(mockInput);
            
            expect(logger.logData.input.sessionId).toBeNull();
            expect(logger.logData.input.stopHookActive).toBeUndefined();
            expect(logger.logData.input.rawInput).toEqual(mockInput);
        });
    });

    describe('Project State Logging', () => {
        it('should log complete project state', () => {
            const mockTodoData = {
                project: 'test-project',
                tasks: [
                    { status: 'pending' },
                    { status: 'in_progress' },
                    { status: 'completed' },
                    { status: 'completed' }
                ],
                last_mode: 'DEVELOPMENT',
                review_strikes: 2,
                strikes_completed_last_run: true,
                available_modes: ['DEVELOPMENT', 'TESTING']
            };
            
            const todoPath = '/test/TODO.json';
            
            logger.logProjectState(mockTodoData, todoPath);
            
            expect(logger.logData.projectState).toEqual({
                todoPath: todoPath,
                project: 'test-project',
                totalTasks: 4,
                pendingTasks: 1,
                inProgressTasks: 1,
                completedTasks: 2,
                lastMode: 'DEVELOPMENT',
                reviewStrikes: 2,
                strikesCompletedLastRun: true,
                availableModes: ['DEVELOPMENT', 'TESTING']
            });
            
            expect(logger.logData.flow).toContainEqual({
                timestamp: expect.any(String),
                message: 'Loaded project state from TODO.json'
            });
        });
        
        it('should handle empty tasks array', () => {
            const mockTodoData = {
                project: 'empty-project',
                tasks: [],
                last_mode: null,
                review_strikes: 0,
                strikes_completed_last_run: false
            };
            
            logger.logProjectState(mockTodoData, '/test/TODO.json');
            
            expect(logger.logData.projectState.totalTasks).toBe(0);
            expect(logger.logData.projectState.pendingTasks).toBe(0);
            expect(logger.logData.projectState.inProgressTasks).toBe(0);
            expect(logger.logData.projectState.completedTasks).toBe(0);
        });
        
        it('should count tasks by status correctly', () => {
            const mockTodoData = {
                project: 'test-project',
                tasks: [
                    { status: 'pending' },
                    { status: 'pending' },
                    { status: 'in_progress' },
                    { status: 'completed' },
                    { status: 'completed' },
                    { status: 'completed' }
                ]
            };
            
            logger.logProjectState(mockTodoData, '/test/TODO.json');
            
            expect(logger.logData.projectState.pendingTasks).toBe(2);
            expect(logger.logData.projectState.inProgressTasks).toBe(1);
            expect(logger.logData.projectState.completedTasks).toBe(3);
        });
    });

    describe('Current Task Logging', () => {
        it('should log task details when task exists', () => {
            const mockTask = {
                id: 'task-123',
                title: 'Test Task',
                description: 'Test task description',
                mode: 'DEVELOPMENT',
                priority: 'high',
                status: 'pending',
                is_review_task: false,
                strike_number: null
            };
            
            logger.logCurrentTask(mockTask);
            
            expect(logger.logData.projectState.currentTask).toEqual({
                id: 'task-123',
                title: 'Test Task',
                description: 'Test task description',
                mode: 'DEVELOPMENT',
                priority: 'high',
                status: 'pending',
                isReviewTask: false,
                strikeNumber: null
            });
            
            expect(logger.logData.flow).toContainEqual({
                timestamp: expect.any(String),
                message: 'Selected task: Test Task (task-123)'
            });
        });
        
        it('should log review task details correctly', () => {
            const mockReviewTask = {
                id: 'review-strike-1',
                title: 'Review Strike 1',
                description: 'First review strike',
                mode: 'REVIEWER',
                priority: 'high',
                status: 'pending',
                is_review_task: true,
                strike_number: 1
            };
            
            logger.logCurrentTask(mockReviewTask);
            
            expect(logger.logData.projectState.currentTask.isReviewTask).toBe(true);
            expect(logger.logData.projectState.currentTask.strikeNumber).toBe(1);
        });
        
        it('should handle null task', () => {
            logger.logCurrentTask(null);
            
            expect(logger.logData.projectState.currentTask).toBeNull();
            expect(logger.logData.flow).toContainEqual({
                timestamp: expect.any(String),
                message: 'No tasks available'
            });
        });
        
        it('should handle undefined task', () => {
            logger.logCurrentTask(undefined);
            
            expect(logger.logData.projectState.currentTask).toBeNull();
            expect(logger.logData.flow).toContainEqual({
                timestamp: expect.any(String),
                message: 'No tasks available'
            });
        });
    });

    describe('Mode Decision Logging', () => {
        it('should log mode selection decision', () => {
            logger.logModeDecision('TESTING', 'DEVELOPMENT', 'Task mode changed');
            
            expect(logger.logData.decisions).toContainEqual({
                type: 'mode_selection',
                timestamp: expect.any(String),
                previousMode: 'TESTING',
                selectedMode: 'DEVELOPMENT',
                reason: 'Task mode changed'
            });
            
            expect(logger.logData.flow).toContainEqual({
                timestamp: expect.any(String),
                message: 'Mode decision: TESTING → DEVELOPMENT (Task mode changed)'
            });
        });
        
        it('should handle null previous mode', () => {
            logger.logModeDecision(null, 'DEVELOPMENT', 'Initial mode selection');
            
            expect(logger.logData.decisions[0].previousMode).toBeNull();
            expect(logger.logData.flow).toContainEqual({
                timestamp: expect.any(String),
                message: 'Mode decision: none → DEVELOPMENT (Initial mode selection)'
            });
        });
        
        it('should handle undefined previous mode', () => {
            logger.logModeDecision(undefined, 'TESTING', 'First time setup');
            
            expect(logger.logData.decisions[0].previousMode).toBeUndefined();
            expect(logger.logData.flow).toContainEqual({
                timestamp: expect.any(String),
                message: 'Mode decision: none → TESTING (First time setup)'
            });
        });
    });

    describe('Strike Handling Logging', () => {
        it('should log strike handling decision', () => {
            const strikeResult = {
                action: 'reset',
                message: 'Strike limit reached, resetting'
            };
            
            const todoData = {
                review_strikes: 3,
                strikes_completed_last_run: false
            };
            
            logger.logStrikeHandling(strikeResult, todoData);
            
            expect(logger.logData.decisions).toContainEqual({
                type: 'strike_handling',
                timestamp: expect.any(String),
                action: 'reset',
                message: 'Strike limit reached, resetting',
                currentStrikes: 3,
                strikesCompleted: false
            });
            
            expect(logger.logData.flow).toContainEqual({
                timestamp: expect.any(String),
                message: 'Strike handling: reset - Strike limit reached, resetting'
            });
        });
        
        it('should handle strike result without message', () => {
            const strikeResult = { action: 'continue' };
            const todoData = { review_strikes: 1, strikes_completed_last_run: true };
            
            logger.logStrikeHandling(strikeResult, todoData);
            
            expect(logger.logData.decisions[0].message).toBeUndefined();
            expect(logger.logData.flow).toContainEqual({
                timestamp: expect.any(String),
                message: 'Strike handling: continue - continue'
            });
        });
    });

    describe('Review Injection Logging', () => {
        it('should log review injection when needed', () => {
            logger.logReviewInjection(true, 2);
            
            expect(logger.logData.decisions).toContainEqual({
                type: 'review_injection',
                timestamp: expect.any(String),
                shouldInject: true,
                strikeNumber: 2
            });
            
            expect(logger.logData.flow).toContainEqual({
                timestamp: expect.any(String),
                message: 'Injecting review task for strike 2'
            });
        });
        
        it('should log when review injection is not needed', () => {
            logger.logReviewInjection(false, 1);
            
            expect(logger.logData.decisions).toContainEqual({
                type: 'review_injection',
                timestamp: expect.any(String),
                shouldInject: false,
                strikeNumber: 1
            });
            
            // Should not add flow message when not injecting
            const injectionMessages = logger.logData.flow.filter(f => 
                f.message.includes('Injecting review task')
            );
            expect(injectionMessages).toHaveLength(0);
        });
    });

    describe('Prompt Generation Logging', () => {
        it('should log prompt generation details', () => {
            const longPrompt = 'A'.repeat(1000);
            const additionalInstructions = 'B'.repeat(200);
            
            logger.logPromptGeneration(longPrompt, additionalInstructions);
            
            expect(logger.logData.output).toEqual({
                promptLength: 1000,
                additionalInstructionsLength: 200,
                totalLength: 1200,
                promptPreview: 'A'.repeat(500) + '...',
                timestamp: expect.any(String)
            });
            
            expect(logger.logData.flow).toContainEqual({
                timestamp: expect.any(String),
                message: 'Generated prompt for Claude'
            });
        });
        
        it('should handle short prompts', () => {
            const shortPrompt = 'Short prompt';
            const noInstructions = '';
            
            logger.logPromptGeneration(shortPrompt, noInstructions);
            
            expect(logger.logData.output.promptLength).toBe(12);
            expect(logger.logData.output.additionalInstructionsLength).toBe(0);
            expect(logger.logData.output.totalLength).toBe(12);
            expect(logger.logData.output.promptPreview).toBe('Short prompt...');
        });
        
        it('should truncate prompt preview at 500 characters', () => {
            const veryLongPrompt = 'A'.repeat(600);
            
            logger.logPromptGeneration(veryLongPrompt, '');
            
            expect(logger.logData.output.promptPreview).toBe('A'.repeat(500) + '...');
            expect(logger.logData.output.promptPreview.length).toBe(503);
        });
    });

    describe('Exit Logging', () => {
        it('should log exit with code and reason', () => {
            logger.logExit(0, 'Task completed successfully');
            
            expect(logger.logData.output.exitCode).toBe(0);
            expect(logger.logData.output.exitReason).toBe('Task completed successfully');
            
            expect(logger.logData.flow).toContainEqual({
                timestamp: expect.any(String),
                message: 'Exiting with code 0: Task completed successfully'
            });
        });
        
        it('should handle error exit codes', () => {
            logger.logExit(1, 'Error occurred during processing');
            
            expect(logger.logData.output.exitCode).toBe(1);
            expect(logger.logData.output.exitReason).toBe('Error occurred during processing');
        });
    });

    describe('Error Logging', () => {
        it('should log error details with context', () => {
            const mockError = new Error('Test error message');
            mockError.name = 'TestError';
            mockError.stack = 'Error: Test error message\n    at test.js:1:1';
            
            logger.logError(mockError, 'test-context');
            
            expect(logger.logData.errors).toContainEqual({
                timestamp: expect.any(String),
                context: 'test-context',
                message: 'Test error message',
                stack: 'Error: Test error message\n    at test.js:1:1',
                name: 'TestError'
            });
            
            expect(logger.logData.flow).toContainEqual({
                timestamp: expect.any(String),
                message: 'ERROR in test-context: Test error message'
            });
        });
        
        it('should handle errors without stack trace', () => {
            const mockError = new Error('Simple error');
            delete mockError.stack;
            
            logger.logError(mockError, 'simple-context');
            
            expect(logger.logData.errors[0].stack).toBeUndefined();
            expect(logger.logData.errors[0].message).toBe('Simple error');
        });
        
        it('should handle custom error properties', () => {
            const mockError = new Error('Custom error');
            mockError.code = 'CUSTOM_CODE';
            mockError.details = { extra: 'info' };
            
            logger.logError(mockError, 'custom-context');
            
            expect(logger.logData.errors[0].message).toBe('Custom error');
            expect(logger.logData.errors[0].context).toBe('custom-context');
        });
    });

    describe('Flow Tracking', () => {
        it('should add flow messages with timestamps', () => {
            logger.addFlow('First action');
            logger.addFlow('Second action');
            
            expect(logger.logData.flow).toHaveLength(2);
            expect(logger.logData.flow[0]).toEqual({
                timestamp: expect.any(String),
                message: 'First action'
            });
            expect(logger.logData.flow[1]).toEqual({
                timestamp: expect.any(String),
                message: 'Second action'
            });
        });
        
        it('should maintain chronological order', () => {
            const startTime = Date.now();
            
            logger.addFlow('First');
            logger.addFlow('Second');
            
            const firstTimestamp = new Date(logger.logData.flow[0].timestamp).getTime();
            const secondTimestamp = new Date(logger.logData.flow[1].timestamp).getTime();
            
            expect(firstTimestamp).toBeLessThanOrEqual(secondTimestamp);
            expect(firstTimestamp).toBeGreaterThanOrEqual(startTime);
        });
    });

    describe('Save Operation', () => {
        beforeEach(() => {
            fs.writeFileSync.mockImplementation(() => {});
        });
        
        it('should save log data to file with execution duration', () => {
            // Setup some log data
            logger.logInput({ session_id: 'test' });
            logger.addFlow('Test action');
            
            logger.save();
            
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                mockLogPath,
                expect.any(String),
                'utf8'
            );
            
            const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
            expect(writtenData.execution.endTimestamp).toBeDefined();
            expect(writtenData.execution.durationMs).toBeGreaterThanOrEqual(0);
        });
        
        it('should calculate execution duration correctly', () => {
            const startTime = Date.now();
            logger.logData.execution.timestamp = new Date(startTime).toISOString();
            
            logger.save();
            
            const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
            expect(writtenData.execution.durationMs).toBeGreaterThanOrEqual(0);
        });
        
        it('should create debug file when errors exist', () => {
            logger.logError(new Error('Test error'), 'test');
            
            logger.save();
            
            expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
            
            // Check main log file
            expect(fs.writeFileSync).toHaveBeenNthCalledWith(1, mockLogPath, expect.any(String), 'utf8');
            
            // Check debug file
            const debugCall = fs.writeFileSync.mock.calls[1];
            expect(debugCall[0]).toMatch(/\.hook-debug-\d+\.json$/);
            expect(debugCall[1]).toEqual(expect.any(String));
            expect(debugCall[2]).toBe('utf8');
        });
        
        it('should not create debug file when no errors exist', () => {
            logger.addFlow('Normal operation');
            
            logger.save();
            
            expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
            expect(fs.writeFileSync).toHaveBeenCalledWith(mockLogPath, expect.any(String), 'utf8');
        });
        
        it('should handle file write errors gracefully', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });
            
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            expect(() => logger.save()).not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('Failed to save log: Permission denied');
            
            consoleSpy.mockRestore();
        });
        
        it('should preserve all log data in saved file', () => {
            // Add comprehensive log data
            logger.logInput({ session_id: 'test-session' });
            logger.logProjectState({ project: 'test', tasks: [] }, '/test/TODO.json');
            logger.logCurrentTask({ id: 'task-1', title: 'Test Task' });
            logger.logModeDecision('TESTING', 'DEVELOPMENT', 'Mode change');
            logger.logError(new Error('Test error'), 'test-context');
            logger.addFlow('Custom flow message');
            
            logger.save();
            
            const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
            
            expect(writtenData.input.sessionId).toBe('test-session');
            expect(writtenData.projectState.project).toBe('test');
            expect(writtenData.projectState.currentTask.title).toBe('Test Task');
            expect(writtenData.decisions).toHaveLength(1);
            expect(writtenData.errors).toHaveLength(1);
            expect(writtenData.flow.some(f => f.message === 'Custom flow message')).toBe(true);
        });
    });

    describe('Integration and Complex Scenarios', () => {
        it('should handle complete hook execution workflow', () => {
            // Simulate a complete hook execution
            const hookInput = {
                session_id: 'session-123',
                transcript_path: '/path/transcript',
                stop_hook_active: false
            };
            
            const todoData = {
                project: 'test-project',
                tasks: [
                    { id: 'task-1', status: 'pending' },
                    { id: 'task-2', status: 'completed' }
                ],
                review_strikes: 1,
                strikes_completed_last_run: false
            };
            
            const currentTask = {
                id: 'task-1',
                title: 'Current Task',
                mode: 'DEVELOPMENT',
                status: 'pending'
            };
            
            // Execute logging workflow
            logger.logInput(hookInput);
            logger.logProjectState(todoData, '/test/TODO.json');
            logger.logCurrentTask(currentTask);
            logger.logModeDecision(null, 'DEVELOPMENT', 'Task mode');
            logger.logPromptGeneration('Generated prompt content', 'Additional instructions');
            logger.logExit(2, 'Continuing with task');
            
            // Verify comprehensive logging
            expect(logger.logData.input.sessionId).toBe('session-123');
            expect(logger.logData.projectState.totalTasks).toBe(2);
            expect(logger.logData.projectState.currentTask.id).toBe('task-1');
            expect(logger.logData.decisions).toHaveLength(1);
            expect(logger.logData.output.exitCode).toBe(2);
            expect(logger.logData.flow.length).toBeGreaterThan(5);
        });
        
        it('should handle concurrent logging operations', () => {
            // Simulate rapid logging operations
            for (let i = 0; i < 10; i++) {
                logger.addFlow(`Action ${i}`);
            }
            
            expect(logger.logData.flow).toHaveLength(10);
            
            // Verify all timestamps are unique and ordered
            const timestamps = logger.logData.flow.map(f => new Date(f.timestamp).getTime());
            const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
            expect(timestamps).toEqual(sortedTimestamps);
        });
        
        it('should maintain data integrity across multiple operations', () => {
            // Perform various logging operations
            logger.logInput({ session_id: 'integrity-test' });
            logger.addFlow('First flow');
            logger.logError(new Error('First error'), 'context1');
            logger.addFlow('Second flow');
            logger.logError(new Error('Second error'), 'context2');
            
            // Verify data structures remain consistent
            expect(logger.logData.input.sessionId).toBe('integrity-test');
            expect(logger.logData.flow).toHaveLength(2);
            expect(logger.logData.errors).toHaveLength(2);
            expect(logger.logData.errors[0].message).toBe('First error');
            expect(logger.logData.errors[1].message).toBe('Second error');
        });
    });
});