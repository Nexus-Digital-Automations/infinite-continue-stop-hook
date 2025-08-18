// Mock fs before importing modules
jest.mock('fs');

const fs = require('fs');
const TaskManager = require('./lib/taskManager');
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');

describe('Debug MultiAgent Issue', () => {
    let todoPath;
    let taskManager;
    let orchestrator;
    let mockFS;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup standardized mocks using global factory functions
        mockFS = global.createMockFS();
        todoPath = './test-debug-todo.json';
        
        // Apply fs mocks
        Object.assign(fs, mockFS);
        
        // Create initial TODO.json with all required fields
        const initialTodo = {
            project: "test-debug",
            tasks: [],
            agents: {}, 
            review_strikes: 0,
            strikes_completed_last_run: false,
            current_task_index: 0,
            last_mode: "DEVELOPMENT",
            execution_count: 1,
            last_hook_activation: Date.now()
        };
        
        const fileSystemState = {
            [todoPath]: initialTodo
        };
        
        mockFS.existsSync.mockImplementation((filePath) => {
            return filePath === todoPath || filePath in fileSystemState;
        });
        
        mockFS.readFileSync.mockImplementation((filePath) => {
            if (filePath === todoPath || filePath in fileSystemState) {
                const data = fileSystemState[filePath] || initialTodo;
                return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
            }
            throw new Error(`File not found: ${filePath}`);
        });
        
        mockFS.writeFileSync.mockImplementation((filePath, content) => {
            if (filePath === todoPath) {
                try {
                    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
                    fileSystemState[filePath] = parsed;
                } catch {
                    fileSystemState[filePath] = content;
                }
            }
            return undefined;
        });
        
        taskManager = new TaskManager(todoPath, { 
            enableMultiAgent: true,
            enableAutoFix: false,
            lockTimeout: 1000
        });
        
        // Override autoFixer with mock
        taskManager.autoFixer = global.createMockAutoFixer({
            isValid: true,
            canAutoFix: true,
            recoveredData: initialTodo
        });
        
        orchestrator = new MultiAgentOrchestrator(todoPath, {
            maxParallelAgents: 3,
            coordinationTimeout: 10000
        });
    });

    test('debug task distribution failure', async () => {
        try {
            // Initialize session
            const agentConfigs = [
                { role: 'development', specialization: ['build-fixes'] },
                { role: 'testing', specialization: ['unit-tests'] }
            ];
            
            console.log('🔍 Initializing session...');
            const sessionResult = await orchestrator.initializeSession(agentConfigs);
            console.log('Session result:', JSON.stringify(sessionResult, null, 2));
            
            // Create tasks
            console.log('🔍 Creating tasks...');
            const task1 = await taskManager.createTask({
                title: 'Dev Task',
                description: 'Development task',
                mode: 'DEVELOPMENT'
            });
            
            const task2 = await taskManager.createTask({
                title: 'Test Task',
                description: 'Testing task',
                mode: 'TESTING'
            });
            
            console.log('Created tasks:', task1, task2);
            
            // Test task distribution
            console.log('🔍 Testing distribution...');
            const distributionResult = await orchestrator.orchestrateTaskDistribution({
                strategy: 'intelligent',
                maxTasks: 2
            });
            
            console.log('Distribution result:', JSON.stringify(distributionResult, null, 2));
            
            // This should fail in the original test
            expect(distributionResult.success).toBe(true);
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            console.error('Stack:', error.stack);
            throw error;
        }
    });
});

module.exports = {};