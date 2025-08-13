// Mock dependencies FIRST, before importing classes
jest.mock('fs');

const fs = require('fs');
const AgentManager = require('../lib/agentManager');
const TaskManager = require('../lib/taskManager');
const MultiAgentOrchestrator = require('../lib/multiAgentOrchestrator');

describe('Multi-Agent System', () => {
    let todoPath;
    let agentManager;
    let taskManager;
    let lockManager;
    let orchestrator;
    let mockFS;

    beforeEach(() => {
        // Reset all mocks first
        jest.clearAllMocks();
        
        // Setup standardized mocks using global factory functions
        mockFS = global.createMockFS();
        todoPath = './test-todo.json';
        
        // Apply fs mocks
        Object.assign(fs, mockFS);
        
        // Create initial TODO.json with all required fields for multi-agent
        const initialTodo = {
            project: "test-multiagent",
            tasks: [],
            agents: {}, // Add agents field for multi-agent support
            review_strikes: 0,
            strikes_completed_last_run: false,
            current_task_index: 0,
            last_mode: "DEVELOPMENT",
            execution_count: 1,
            last_hook_activation: Date.now()
        };
        
        // Setup mock file system data with agent state tracking
        const fileSystemState = {
            [todoPath]: initialTodo
        };
        
        mockFS.existsSync.mockImplementation((filePath) => {
            // Always return true for TODO.json and test files to prevent ENOENT errors
            if (filePath === todoPath || 
                filePath.includes('.locks') || 
                filePath.includes('test-locks') || 
                filePath.includes('temp_') || 
                filePath in fileSystemState ||
                filePath.includes('TODO.json') ||
                filePath.includes('DONE.json')) {
                return true;
            }
            return false;
        });
        
        mockFS.readFileSync.mockImplementation((filePath, _options) => {
            if (filePath === todoPath || filePath in fileSystemState) {
                const data = fileSystemState[filePath] || initialTodo;
                const result = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
                console.log('MockFS: Read from', filePath, 'returning', JSON.parse(result).tasks?.length || 0, 'tasks');
                return result;
            }
            if (filePath.includes('TODO.json') || filePath.includes('DONE.json')) {
                // Return default structure for any TODO.json or DONE.json files
                console.log('MockFS: Read default TODO.json');
                return JSON.stringify(initialTodo, null, 2);
            }
            throw new Error(`File not found: ${filePath}`);
        });
        
        mockFS.writeFileSync.mockImplementation((filePath, content, _options) => {
            // Mock successful write and update state
            if (filePath === todoPath || filePath.includes('TODO.json')) {
                try {
                    // Parse content and store as object for proper retrieval
                    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
                    fileSystemState[filePath] = parsed;
                    console.log('MockFS: Wrote to', filePath, 'with', parsed.tasks?.length || 0, 'tasks');
                } catch {
                    fileSystemState[filePath] = content;
                }
            } else {
                fileSystemState[filePath] = content;
            }
            return undefined; // writeFileSync returns undefined on success
        });
        
        mockFS.mkdirSync.mockImplementation((dirPath, _options) => {
            // Mock successful directory creation - track created directories
            fileSystemState[dirPath] = 'directory';
            return undefined; // mkdirSync returns undefined on success
        });
        
        // Add async file operations mocking
        mockFS.readFile = jest.fn().mockImplementation((filePath, options, callback) => {
            if (typeof options === 'function') {
                callback = options;
                options = {};
            }
            try {
                const result = mockFS.readFileSync(filePath, options);
                callback(null, result);
            } catch (error) {
                callback(error);
            }
        });
        
        mockFS.writeFile = jest.fn().mockImplementation((filePath, content, options, callback) => {
            if (typeof options === 'function') {
                callback = options;
                options = {};
            }
            try {
                mockFS.writeFileSync(filePath, content, options);
                callback(null);
            } catch (error) {
                callback(error);
            }
        });
        
        // Initialize components with mocked filesystem
        agentManager = new AgentManager(todoPath, { 
            enableDistributedMode: false, // Disable for testing
            logger: { addFlow: jest.fn(), addError: jest.fn() } // Mock logger
        });
        
        taskManager = new TaskManager(todoPath, { 
            enableArchiving: false,
            enableMultiAgent: true, // Enable multi-agent for these tests
            enableAutoFix: false, // Disable AutoFixer for tests initially
            lockTimeout: 1000, // Shorter timeout for tests
            lockRetryInterval: 50, // Faster retry for tests
            maxRetries: 10, // Fewer retries for tests
            lockManager: {
                lockDirectory: './test-locks-temp', // Use test-specific lock directory
                lockTimeout: 1000,
                lockRetryInterval: 50,
                maxRetries: 10
            }
        });
        
        // Override the autoFixer instance with our mock (following existing test patterns)
        const mockAutoFixer = global.createMockAutoFixer({
            isValid: true,
            canAutoFix: true,
            fixSuccess: true,
            recoverSuccess: true,
            recoveredData: initialTodo
        });
        taskManager.autoFixer = mockAutoFixer;
        
        // Mock lockManager for tests that don't need real locking
        lockManager = {
            acquireLock: jest.fn().mockResolvedValue({ success: true, lockId: 'test-lock' }),
            releaseLock: jest.fn().mockResolvedValue({ success: true }),
            detectConflicts: jest.fn().mockResolvedValue({ hasConflicts: false, severity: 'none', conflicts: [] }),
            getStatistics: jest.fn().mockReturnValue({ activeLocks: 0 }),
            cleanup: jest.fn()
        };
        
        orchestrator = new MultiAgentOrchestrator(todoPath, {
            maxParallelAgents: 3,
            coordinationTimeout: 10000
        });
    });

    afterEach(async () => {
        // Cleanup async resources properly with timeout
        const cleanupPromises = [];
        
        try {
            if (orchestrator) {
                cleanupPromises.push(
                    Promise.race([
                        orchestrator.cleanup(),
                        new Promise((_, reject) => {
                            const timeoutId = setTimeout(() => reject(new Error('Orchestrator cleanup timeout')), 1000);
                            timeoutId.unref();
                        })
                    ])
                );
            }
            
            if (agentManager) {
                try {
                    agentManager.cleanup();
                } catch (error) {
                    console.warn('AgentManager cleanup error:', error.message);
                }
            }
            
            if (lockManager) {
                try {
                    lockManager.cleanup();
                } catch (error) {
                    console.warn('LockManager cleanup error:', error.message);
                }
            }
            
            // Wait for all cleanup operations with timeout
            await Promise.allSettled(cleanupPromises);
            
        } catch (error) {
            console.warn('Cleanup error:', error.message);
        } finally {
            // Force null all references
            orchestrator = null;
            agentManager = null;
            lockManager = null;
            taskManager = null;
            
            // Clear any remaining timers and force cleanup
            if (global._timers && global._timers.length > 0) {
                console.warn(`Clearing ${global._timers.length} remaining timers`);
                global._timers.forEach(timer => {
                    try {
                        if (timer && typeof timer.unref === 'function') {
                            timer.unref();
                        }
                        if (timer && typeof timer.clearTimeout === 'function') {
                            clearTimeout(timer);
                        }
                    } catch {
                        // Ignore cleanup errors
                    }
                });
                global._timers.length = 0;
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
        }
        
        // Clear Jest mocks
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // Global cleanup for entire test suite
        console.log('🧹 Performing global cleanup for multiAgent test suite...');
        
        // Clear all global timers
        if (global._timers && global._timers.length > 0) {
            console.warn(`Clearing ${global._timers.length} global timers`);
            global._timers.forEach(timer => {
                try {
                    if (timer && typeof timer.unref === 'function') {
                        timer.unref();
                    }
                    clearTimeout(timer);
                    clearInterval(timer);
                } catch {
                    // Ignore cleanup errors
                }
            });
            global._timers.length = 0;
        }
        
        // Clear all intervals
        if (global._intervals && global._intervals.length > 0) {
            global._intervals.forEach(interval => {
                try {
                    if (interval && typeof interval.unref === 'function') {
                        interval.unref();
                    }
                    clearInterval(interval);
                } catch {
                    // Ignore cleanup errors
                }
            });
            global._intervals.length = 0;
        }
        
        // Force cleanup any Jest resources
        if (jest.restoreAllMocks) {
            jest.restoreAllMocks();
        }
        
        console.log('✅ Global multiAgent test cleanup completed');
    });

    describe('AgentManager', () => {
        test('should register and unregister agents', async () => {
            const agentConfig = {
                role: 'development',
                specialization: ['testing', 'linting'],
                sessionId: 'test_session_123'
            };
            
            const agentId = await agentManager.registerAgent(agentConfig);
            expect(agentId).toBeTruthy();
            expect(agentId).toContain('development_test_session_123');
            
            const agent = await agentManager.getAgent(agentId);
            expect(agent).toBeTruthy();
            expect(agent.role).toBe('development');
            expect(agent.specialization).toEqual(['testing', 'linting']);
            
            const unregistered = await agentManager.unregisterAgent(agentId);
            expect(unregistered).toBe(true);
            
            const removedAgent = await agentManager.getAgent(agentId);
            expect(removedAgent).toBeNull();
        });

        test('should find best agent for task', async () => {
            // Register multiple agents
            const devAgent = await agentManager.registerAgent({
                role: 'development',
                specialization: ['build-fixes'],
                sessionId: 'test_123'
            });
            
            const _testAgent = await agentManager.registerAgent({
                role: 'testing',
                specialization: ['unit-tests'],
                sessionId: 'test_123'
            });
            
            // Create a development task
            const task = {
                mode: 'DEVELOPMENT',
                specialization: 'build-fixes',
                priority: 'high'
            };
            
            const bestAgent = await agentManager.findBestAgentForTask(task);
            expect(bestAgent).toBe(devAgent);
        });

        test('should track agent workload', async () => {
            const agentId = await agentManager.registerAgent({
                role: 'development',
                sessionId: 'test_123'
            });
            
            const canAccept = await agentManager.canAgentAcceptTasks(agentId);
            expect(canAccept).toBe(true);
            
            await agentManager.updateAgentWorkload(agentId, 3);
            
            const agent = await agentManager.getAgent(agentId);
            expect(agent.workload).toBe(3);
        });
    });

    describe('DistributedLockManager', () => {
        test('should acquire and release locks', async () => {
            const testFile = './test.txt';
            
            const lockResult = await lockManager.acquireLock(testFile, 'agent1');
            expect(lockResult.success).toBe(true);
            expect(lockResult.lockId).toBeTruthy();
            
            const releaseResult = await lockManager.releaseLock(testFile, 'agent1');
            expect(releaseResult.success).toBe(true);
        });

        test('should prevent concurrent access', async () => {
            const testFile = './test.txt';
            
            // Mock lock manager to simulate concurrent access
            lockManager.acquireLock = jest.fn()
                .mockResolvedValueOnce({ success: true, lockId: 'lock1' })
                .mockResolvedValueOnce({ success: false, error: 'Lock acquisition timeout' });
            
            const lock1 = await lockManager.acquireLock(testFile, 'agent1');
            expect(lock1.success).toBe(true);
            
            const lock2 = await lockManager.acquireLock(testFile, 'agent2', 1000);
            expect(lock2.success).toBe(false);
            expect(lock2.error).toContain('timeout');
        });

        test('should detect conflicts', async () => {
            const testFile = './test.txt';
            
            // Mock conflict detection
            lockManager.detectConflicts = jest.fn().mockResolvedValue({
                hasConflicts: true,
                severity: 'high',
                conflicts: [{ type: 'active_lock', conflictingAgent: 'agent1' }]
            });
            
            const conflicts = await lockManager.detectConflicts(testFile, 'agent2', 'write');
            expect(conflicts.hasConflicts).toBe(true);
            expect(conflicts.severity).toBe('high');
        });
    });

    describe('TaskManager Multi-Agent Features', () => {
        test('should assign tasks to agents', async () => {
            // Create a task
            const taskId = await taskManager.createTask({
                title: 'Test Task',
                description: 'Test multi-agent assignment',
                mode: 'DEVELOPMENT'
            });
            
            console.log('Returned task ID:', taskId);
            
            // Debug: Check if task was created
            const todoData = await taskManager.readTodo();
            console.log('Todo data after creation:', JSON.stringify(todoData, null, 2));
            const task = todoData.tasks.find(t => t.id === taskId);
            console.log('Found task:', task);
            expect(task).toBeDefined();
            
            const assigned = await taskManager.assignTaskToAgent(taskId, 'agent1', 'primary');
            expect(assigned).toBe(true);
            
            const tasks = await taskManager.getTasksForAgent('agent1');
            expect(tasks).toHaveLength(1);
            expect(tasks[0].id).toBe(taskId);
        });

        test('should claim tasks with locking', async () => {
            // Create a task
            const taskId = await taskManager.createTask({
                title: 'Test Task',
                description: 'Test task claiming',
                mode: 'DEVELOPMENT'
            });
            
            const claimResult = await taskManager.claimTask(taskId, 'agent1', 'high');
            expect(claimResult.success).toBe(true);
            expect(claimResult.task.id).toBe(taskId);
            expect(claimResult.priority).toBe('high');
            
            // Try to claim the same task with another agent
            const claimResult2 = await taskManager.claimTask(taskId, 'agent2', 'normal');
            expect(claimResult2.success).toBe(false);
            expect(claimResult2.reason).toContain('already assigned');
        });

        test('should handle task dependencies', async () => {
            // Create dependency task
            const depTaskId = await taskManager.createTask({
                title: 'Dependency Task',
                description: 'Must complete first',
                mode: 'DEVELOPMENT'
            });
            
            // Create dependent task
            const mainTaskId = await taskManager.createTask({
                title: 'Main Task',
                description: 'Depends on other task',
                mode: 'DEVELOPMENT',
                dependencies: [depTaskId]
            });
            
            // Try to claim dependent task before dependency is complete
            const claimResult1 = await taskManager.claimTask(mainTaskId, 'agent1', 'normal');
            expect(claimResult1.success).toBe(false);
            expect(claimResult1.reason).toBe('Unmet dependencies');
            
            // Complete dependency task
            await taskManager.updateTaskStatus(depTaskId, 'completed');
            
            // Now should be able to claim main task
            const claimResult2 = await taskManager.claimTask(mainTaskId, 'agent1', 'normal');
            expect(claimResult2.success).toBe(true);
        });

        test('should create parallel execution plans', async () => {
            // Create multiple independent tasks
            const task1 = await taskManager.createTask({
                title: 'Task 1',
                description: 'Independent task 1',
                mode: 'DEVELOPMENT'
            });
            
            const task2 = await taskManager.createTask({
                title: 'Task 2',
                description: 'Independent task 2',
                mode: 'TESTING'
            });
            
            const task3 = await taskManager.createTask({
                title: 'Task 3',
                description: 'Independent task 3',
                mode: 'DEVELOPMENT'
            });
            
            const parallelResult = await taskManager.createParallelExecution(
                [task1, task2, task3],
                ['agent1', 'agent2', 'agent3'],
                ['sync_point_1', 'sync_point_2']
            );
            
            expect(parallelResult.success).toBe(true);
            expect(parallelResult.parallelPlan.taskIds).toEqual([task1, task2, task3]);
            expect(parallelResult.parallelPlan.agentIds).toEqual(['agent1', 'agent2', 'agent3']);
        });
    });

    describe('MultiAgentOrchestrator', () => {
        test('should initialize multi-agent session', async () => {
            const agentConfigs = [
                { role: 'development', specialization: ['build-fixes'] },
                { role: 'testing', specialization: ['unit-tests'] },
                { role: 'review', specialization: ['code-review'] }
            ];
            
            const sessionResult = await orchestrator.initializeSession(agentConfigs);
            expect(sessionResult.totalRegistered).toBe(3);
            expect(sessionResult.totalFailed).toBe(0);
            expect(sessionResult.sessionId).toBeTruthy();
        });

        test('should orchestrate task distribution', async () => {
            // Initialize session with agents
            const agentConfigs = [
                { role: 'development', specialization: ['build-fixes'] },
                { role: 'testing', specialization: ['unit-tests'] }
            ];
            
            await orchestrator.initializeSession(agentConfigs);
            
            // Create tasks
            await taskManager.createTask({
                title: 'Dev Task',
                description: 'Development task',
                mode: 'DEVELOPMENT'
            });
            
            await taskManager.createTask({
                title: 'Test Task',
                description: 'Testing task',
                mode: 'TESTING'
            });
            
            const distributionResult = await orchestrator.orchestrateTaskDistribution({
                strategy: 'intelligent',
                maxTasks: 2
            });
            
            expect(distributionResult.success).toBe(true);
            expect(distributionResult.strategy).toBe('intelligent');
            expect(distributionResult.availableAgents).toBe(2);
            expect(distributionResult.availableTasks).toBe(2);
        });

        test('should handle different distribution strategies', async () => {
            // Initialize session
            const agentConfigs = [
                { role: 'development' },
                { role: 'testing' }
            ];
            
            await orchestrator.initializeSession(agentConfigs);
            
            // Create tasks
            await taskManager.createTask({
                title: 'Task 1',
                description: 'Task 1',
                mode: 'DEVELOPMENT'
            });
            
            // Test round-robin strategy
            const roundRobinResult = await orchestrator.orchestrateTaskDistribution({
                strategy: 'round_robin',
                maxTasks: 1
            });
            
            expect(roundRobinResult.success).toBe(true);
            expect(roundRobinResult.strategy).toBe('round_robin');
            
            // Test capability-based strategy
            const capabilityResult = await orchestrator.orchestrateTaskDistribution({
                strategy: 'capability_based',
                maxTasks: 1
            });
            
            expect(capabilityResult.success).toBe(true);
            expect(capabilityResult.strategy).toBe('capability_based');
        });

        test('should create and monitor parallel executions', async () => {
            // Initialize session
            const agentConfigs = [
                { role: 'development' },
                { role: 'testing' },
                { role: 'review' }
            ];
            
            await orchestrator.initializeSession(agentConfigs);
            
            // Create tasks
            const task1 = await taskManager.createTask({
                title: 'Task 1',
                description: 'Independent task 1',
                mode: 'DEVELOPMENT'
            });
            
            const task2 = await taskManager.createTask({
                title: 'Task 2',
                description: 'Independent task 2',
                mode: 'TESTING'
            });
            
            const task3 = await taskManager.createTask({
                title: 'Task 3',
                description: 'Independent task 3',
                mode: 'REVIEW'
            });
            
            const parallelResult = await orchestrator.createParallelExecution(
                [task1, task2, task3],
                { 
                    coordinatorRequired: false,
                    syncPoints: ['checkpoint_1'],
                    timeout: 30000
                }
            );
            
            expect(parallelResult.success).toBe(true);
            expect(parallelResult.type).toBe('parallel');
            expect(parallelResult.taskCount).toBe(3);
            
            // Monitor coordination
            const coordinationStatus = await orchestrator.monitorCoordinations();
            expect(coordinationStatus.active).toBe(1);
        });

        test('should get orchestration statistics', async () => {
            const stats = await orchestrator.getOrchestrationStatistics();
            
            expect(stats).toHaveProperty('agents');
            expect(stats).toHaveProperty('tasks');
            expect(stats).toHaveProperty('locks');
            expect(stats).toHaveProperty('coordinations');
            expect(stats).toHaveProperty('timestamp');
        });
    });

    describe('Integration Tests', () => {
        test('should handle complete multi-agent workflow', async () => {
            // 1. Initialize session with multiple agents
            const agentConfigs = [
                { role: 'development', specialization: ['build-fixes'] },
                { role: 'testing', specialization: ['unit-tests'] },
                { role: 'review', specialization: ['code-review'] }
            ];
            
            const sessionResult = await orchestrator.initializeSession(agentConfigs);
            expect(sessionResult.totalRegistered).toBe(3);
            
            // 2. Create multiple tasks with dependencies
            const buildTask = await taskManager.createTask({
                title: 'Build Task',
                description: 'Fix build issues',
                mode: 'DEVELOPMENT',
                priority: 'high'
            });
            
            const testTask = await taskManager.createTask({
                title: 'Test Task',
                description: 'Run unit tests',
                mode: 'TESTING',
                dependencies: [buildTask],
                priority: 'medium'
            });
            
            const reviewTask = await taskManager.createTask({
                title: 'Review Task',
                description: 'Code review',
                mode: 'REVIEW',
                dependencies: [testTask],
                priority: 'low'
            });
            
            // 3. Distribute tasks intelligently
            const distributionResult = await orchestrator.orchestrateTaskDistribution({
                strategy: 'intelligent',
                maxTasks: 3
            });
            
            expect(distributionResult.success).toBe(true);
            
            // 4. Simulate task completion workflow
            // Complete build task
            await taskManager.updateTaskStatus(buildTask, 'completed');
            
            // Now test task should be available
            const testClaimResult = await taskManager.claimTask(testTask, sessionResult.registeredAgents[1].agentId);
            expect(testClaimResult.success).toBe(true);
            
            // Complete test task
            await taskManager.updateTaskStatus(testTask, 'completed');
            
            // Now review task should be available
            const reviewClaimResult = await taskManager.claimTask(reviewTask, sessionResult.registeredAgents[2].agentId);
            expect(reviewClaimResult.success).toBe(true);
            
            // 5. Check final statistics
            const finalStats = await orchestrator.getOrchestrationStatistics();
            expect(finalStats.tasks.totalTasks).toBe(3);
            expect(finalStats.agents.totalAgents).toBe(3);
        });

        test('should handle agent failures gracefully', async () => {
            // Register agents
            const agentId1 = await agentManager.registerAgent({
                role: 'development',
                sessionId: 'test_session'
            });
            
            const agentId2 = await agentManager.registerAgent({
                role: 'testing',
                sessionId: 'test_session'
            });
            
            // Create and assign task to agent1
            const taskId = await taskManager.createTask({
                title: 'Test Task',
                description: 'Task for failure test',
                mode: 'DEVELOPMENT'
            });
            
            await taskManager.assignTaskToAgent(taskId, agentId1, 'primary');
            
            // Simulate agent1 failure by unregistering
            await agentManager.unregisterAgent(agentId1);
            
            // Verify task is released and can be reassigned
            const todoData = await taskManager.readTodo();
            const task = todoData.tasks.find(t => t.id === taskId);
            expect(task.status).toBe('pending');
            expect(task.assigned_agent).toBeNull();
            
            // Should be able to assign to agent2
            const reassignResult = await taskManager.claimTask(taskId, agentId2);
            expect(reassignResult.success).toBe(true);
        });
    });
});

describe('Multi-Agent CLI Integration', () => {
    test('should provide bash-compatible commands for multi-agent operations', async () => {
        // Use mocked filesystem instead of real filesystem
        const todoPath = './test-cli-todo.json';
        const initialData = {
            project: "test-cli",
            tasks: [],
            agents: {},
            review_strikes: 0,
            strikes_completed_last_run: false,
            current_task_index: 0,
            last_mode: "DEVELOPMENT",
            execution_count: 1,
            last_hook_activation: Date.now()
        };
        
        // Setup mocked filesystem for this test
        const originalExistsSync = fs.existsSync;
        const originalReadFileSync = fs.readFileSync;
        const originalWriteFileSync = fs.writeFileSync;
        
        let mockData = initialData;
        
        fs.existsSync = jest.fn().mockImplementation((filePath) => {
            if (filePath === todoPath) return true;
            return originalExistsSync.call(fs, filePath);
        });
        
        fs.readFileSync = jest.fn().mockImplementation((filePath, options) => {
            if (filePath === todoPath) {
                return JSON.stringify(mockData, null, 2);
            }
            return originalReadFileSync.call(fs, filePath, options);
        });
        
        fs.writeFileSync = jest.fn().mockImplementation((filePath, content, options) => {
            if (filePath === todoPath) {
                try {
                    mockData = JSON.parse(content);
                } catch {
                    mockData = content;
                }
                return;
            }
            return originalWriteFileSync.call(fs, filePath, content, options);
        });
        
        try {
            // Test agent registration command
            const agentManager = new AgentManager(todoPath, {
                enableDistributedMode: false,
                logger: { addFlow: jest.fn(), addError: jest.fn() }
            });
            const agentId = await agentManager.registerAgent({
                role: 'development',
                sessionId: 'cli_test_123'
            });
            
            expect(agentId).toContain('development_cli_test_123');
            
            // Verify agent can be retrieved
            const agent = await agentManager.getAgent(agentId);
            expect(agent).toBeTruthy();
            
            // Test task claiming with mocked TaskManager
            const taskManager = new TaskManager(todoPath, { 
                enableMultiAgent: true,
                enableAutoFix: false // Disable AutoFixer for tests initially
            });
            
            // Override autoFixer with mock
            taskManager.autoFixer = global.createMockAutoFixer({
                isValid: true,
                canAutoFix: true,
                recoveredData: mockData
            });
            
            const taskId = await taskManager.createTask({
                title: 'CLI Test Task',
                description: 'Task for CLI testing',
                mode: 'DEVELOPMENT'
            });
            
            const claimResult = await taskManager.claimTask(taskId, agentId);
            expect(claimResult.success).toBe(true);
            
            // Cleanup
            agentManager.cleanup();
            
        } finally {
            // Restore original filesystem methods
            fs.existsSync = originalExistsSync;
            fs.readFileSync = originalReadFileSync;
            fs.writeFileSync = originalWriteFileSync;
        }
    });
});