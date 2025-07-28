/**
 * Enhanced Test Infrastructure - Consistent Mock Patterns and Utilities
 * 
 * This module provides standardized mock factories, test utilities, and infrastructure
 * patterns to ensure consistent and reliable test behavior across all test suites.
 * 
 * Key Features:
 * - Consistent mock factories for all core dependencies
 * - Enhanced filesystem mocking with isolation protection
 * - Standardized test environment setup and teardown
 * - Advanced testing patterns for chaos, performance, and security testing
 * - Test data factories and builders
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// STANDARDIZED MOCK FACTORIES
// =============================================================================

/**
 * Enhanced FileSystem Mock Factory
 * Provides consistent filesystem mocking with comprehensive protection
 */
class MockFileSystemFactory {
    static create(options = {}) {
        const mockFS = {
            // Read operations
            existsSync: jest.fn().mockReturnValue(false),
            readFileSync: jest.fn().mockReturnValue('{}'),
            readFile: jest.fn((path, options, callback) => {
                if (typeof options === 'function') {
                    callback = options;
                    options = {};
                }
                callback(null, '{}');
            }),
            
            // Write operations (protected)
            writeFileSync: jest.fn((filePath, _data, _options) => {
                if (MockFileSystemFactory._isDangerousPath(filePath)) {
                    console.warn(`🚫 BLOCKED: Mock write to dangerous path: ${filePath}`);
                    return;
                }
                console.log(`📝 Mock write to: ${filePath}`);
            }),
            writeFile: jest.fn((filePath, data, options, callback) => {
                if (typeof options === 'function') {
                    callback = options;
                    options = {};
                }
                if (MockFileSystemFactory._isDangerousPath(filePath)) {
                    console.warn(`🚫 BLOCKED: Mock async write to dangerous path: ${filePath}`);
                    if (callback) callback(null);
                    return;
                }
                console.log(`📝 Mock async write to: ${filePath}`);
                if (callback) callback(null);
            }),
            
            // Directory operations
            mkdirSync: jest.fn(),
            mkdir: jest.fn((path, options, callback) => {
                if (typeof options === 'function') {
                    callback = options;
                    options = {};
                }
                if (callback) callback(null);
            }),
            readdirSync: jest.fn().mockReturnValue([]),
            readdir: jest.fn((path, callback) => callback(null, [])),
            
            // File info operations
            statSync: jest.fn().mockReturnValue({
                isFile: () => true,
                isDirectory: () => false,
                size: 1024,
                mtime: new Date(),
                ctime: new Date(),
                atime: new Date()
            }),
            stat: jest.fn((path, callback) => {
                callback(null, {
                    isFile: () => true,
                    isDirectory: () => false,
                    size: 1024,
                    mtime: new Date(),
                    ctime: new Date(),
                    atime: new Date()
                });
            }),
            
            // File operations
            unlinkSync: jest.fn(),
            unlink: jest.fn((path, callback) => callback(null)),
            copyFileSync: jest.fn(),
            copyFile: jest.fn((src, dest, callback) => callback(null)),
            renameSync: jest.fn(),
            rename: jest.fn((oldPath, newPath, callback) => callback(null)),
            
            // Access operations
            accessSync: jest.fn(),
            access: jest.fn((path, mode, callback) => {
                if (typeof mode === 'function') {
                    callback = mode;
                    mode = fs.constants.F_OK;
                }
                callback(null);
            }),
            
            // Stream operations
            createReadStream: jest.fn(() => ({
                on: jest.fn(),
                pipe: jest.fn(),
                close: jest.fn()
            })),
            createWriteStream: jest.fn(() => ({
                write: jest.fn(),
                end: jest.fn(),
                on: jest.fn()
            })),
            
            // Constants
            constants: fs.constants,
            
            // Append operations
            appendFileSync: jest.fn(),
            appendFile: jest.fn((path, data, callback) => callback(null)),
            
            // Directory removal
            rmSync: jest.fn(),
            rm: jest.fn((path, options, callback) => {
                if (typeof options === 'function') {
                    callback = options;
                    options = {};
                }
                callback(null);
            }),
            
            // Watch operations
            watch: jest.fn(() => ({
                on: jest.fn(),
                close: jest.fn()
            })),
            watchFile: jest.fn(),
            unwatchFile: jest.fn()
        };
        
        // Apply custom overrides
        if (options.overrides) {
            Object.assign(mockFS, options.overrides);
        }
        
        // Add enhanced reset capability
        mockFS.__reset = () => {
            Object.values(mockFS).forEach(mock => {
                if (jest.isMockFunction(mock)) {
                    mock.mockClear();
                    mock.mockReset();
                }
            });
            
            // Reset to default behaviors
            mockFS.existsSync.mockReturnValue(false);
            mockFS.readFileSync.mockReturnValue('{}');
            mockFS.statSync.mockReturnValue({
                isFile: () => true,
                isDirectory: () => false,
                size: 1024,
                mtime: new Date(),
                ctime: new Date(),
                atime: new Date()
            });
        };
        
        return mockFS;
    }
    
    static _isDangerousPath(filePath) {
        const dangerousPaths = [
            'node_modules',
            '/usr/',
            '/bin/',
            '/lib/',
            '/System/',
            'package-lock.json',
            'yarn.lock',
            '.git/',
            'exit.js',
            'exit/',
            '/exit/',
            '/lib/exit.js',
            'exit/lib/exit.js',
            'node_modules/exit'
        ];
        
        const normalizedPath = path.resolve(filePath);
        return dangerousPaths.some(dangerous => normalizedPath.includes(dangerous)) ||
               normalizedPath.includes('node_modules') ||
               normalizedPath.includes('/exit.js') ||
               normalizedPath.endsWith('exit.js');
    }
}

/**
 * Enhanced TaskManager Mock Factory
 * Provides consistent TaskManager mocking with realistic behavior
 */
class MockTaskManagerFactory {
    static create(options = {}) {
        const defaultTodoData = {
            project: 'test-project',
            current_mode: 'development',
            tasks: [],
            execution_count: 0,
            last_hook_activation: 0,
            strikes_completed_last_run: false,
            current_task_index: 0,
            last_mode: 'DEVELOPMENT'
        };
        
        const mockTaskManager = {
            // Core operations
            readTodo: jest.fn().mockResolvedValue(options.todoData || defaultTodoData),
            writeTodo: jest.fn().mockResolvedValue(true),
            
            // Task operations
            getCurrentTask: jest.fn().mockResolvedValue(options.currentTask || null),
            updateTaskStatus: jest.fn().mockResolvedValue(true),
            createTask: jest.fn().mockResolvedValue('task-' + Date.now()),
            addSubtask: jest.fn().mockResolvedValue(true),
            
            // Strike and mode logic
            handleStrikeLogic: jest.fn().mockReturnValue({ action: 'continue' }),
            getNextMode: jest.fn().mockResolvedValue('DEVELOPMENT'),
            shouldRunReviewer: jest.fn().mockReturnValue(false),
            
            // File operations
            getFileStatus: jest.fn().mockResolvedValue({ valid: true, canAutoFix: false }),
            performAutoFix: jest.fn().mockResolvedValue({ success: true, hasChanges: false }),
            validateTodoFile: jest.fn().mockResolvedValue(true),
            
            // Backup operations
            createBackup: jest.fn().mockResolvedValue(true),
            listBackups: jest.fn().mockReturnValue([]),
            restoreFromBackup: jest.fn().mockResolvedValue(true),
            
            // Configuration
            options: {
                enableAutoFix: true,
                autoFixLevel: 'moderate',
                validateOnRead: true
            },
            
            // Internal state
            todoPath: options.todoPath || './TODO.json',
            autoFixer: options.autoFixer || MockAutoFixerFactory.create()
        };
        
        // Add realistic behavior for mode switching
        if (options.enableModeLogic) {
            mockTaskManager.getNextMode.mockImplementation(async (todoData) => {
                if (todoData.execution_count % 4 === 0) return 'TASK_CREATION';
                if (todoData.tasks.length === 0) return 'DEVELOPMENT';
                const pendingTasks = todoData.tasks.filter(t => t.status === 'pending');
                return pendingTasks.length > 0 ? 'DEVELOPMENT' : 'TESTING';
            });
        }
        
        // Add enhanced reset capability  
        mockTaskManager.__reset = () => {
            Object.values(mockTaskManager).forEach(prop => {
                if (jest.isMockFunction(prop)) {
                    prop.mockClear();
                    prop.mockReset();
                }
            });
            
            // Reset to default behaviors
            mockTaskManager.readTodo.mockResolvedValue(options.todoData || defaultTodoData);
            mockTaskManager.writeTodo.mockResolvedValue(true);
            mockTaskManager.getCurrentTask.mockResolvedValue(options.currentTask || null);
            mockTaskManager.updateTaskStatus.mockResolvedValue(true);
            mockTaskManager.createTask.mockResolvedValue('task-' + Date.now());
            mockTaskManager.validateTodoFile.mockResolvedValue(true);
        };
        
        return mockTaskManager;
    }
}

/**
 * Enhanced AutoFixer Mock Factory
 * Provides consistent AutoFixer mocking with realistic behavior
 */
class MockAutoFixerFactory {
    static create(options = {}) {
        const mockAutoFixer = {
            // Status operations
            getFileStatus: jest.fn().mockResolvedValue({
                valid: options.isValid !== false,
                canAutoFix: options.canAutoFix || false,
                issues: options.issues || [],
                severity: options.severity || 'none'
            }),
            
            // Fix operations
            autoFix: jest.fn().mockResolvedValue({
                success: options.fixSuccess !== false,
                hasChanges: options.hasChanges || false,
                appliedFixes: options.appliedFixes || [],
                remainingIssues: options.remainingIssues || []
            }),
            
            recoverCorruptedFile: jest.fn().mockResolvedValue({
                success: options.recoverSuccess !== false,
                finalData: options.recoveredData || {},
                appliedRecovery: options.appliedRecovery || []
            }),
            
            dryRun: jest.fn().mockResolvedValue({
                success: true,
                wouldFix: options.wouldFix || false,
                previewFixes: options.previewFixes || []
            }),
            
            // Validator component
            validator: {
                validateAndSanitize: jest.fn().mockReturnValue({
                    isValid: options.validatorValid !== false,
                    data: options.validatorData || {},
                    fixes: options.validatorFixes || [],
                    warnings: options.validatorWarnings || []
                })
            },
            
            // Recovery component
            recovery: {
                atomicWrite: jest.fn().mockResolvedValue({
                    success: options.atomicWriteSuccess !== false
                }),
                listAvailableBackups: jest.fn().mockReturnValue(options.backups || []),
                restoreFromBackup: jest.fn().mockResolvedValue({
                    success: options.restoreSuccess !== false
                }),
                createBackup: jest.fn().mockResolvedValue({
                    success: options.backupSuccess !== false
                })
            }
        };
        
        // Add enhanced reset capability
        mockAutoFixer.__reset = () => {
            Object.values(mockAutoFixer).forEach(prop => {
                if (jest.isMockFunction(prop)) {
                    prop.mockClear();
                    prop.mockReset();
                } else if (typeof prop === 'object' && prop !== null) {
                    Object.values(prop).forEach(subProp => {
                        if (jest.isMockFunction(subProp)) {
                            subProp.mockClear();
                            subProp.mockReset();
                        }
                    });
                }
            });
            
            // Reset to default behaviors
            mockAutoFixer.getFileStatus.mockResolvedValue({
                valid: options.isValid !== false,
                canAutoFix: options.canAutoFix || false,
                issues: options.issues || [],
                severity: options.severity || 'none'
            });
            
            mockAutoFixer.autoFix.mockResolvedValue({
                success: options.fixSuccess !== false,
                hasChanges: options.hasChanges || false,
                appliedFixes: options.appliedFixes || [],
                remainingIssues: options.remainingIssues || []
            });
        };
        
        return mockAutoFixer;
    }
}

/**
 * Enhanced ReviewSystem Mock Factory
 * Provides consistent ReviewSystem mocking with quality assessment logic
 */
class MockReviewSystemFactory {
    static create(options = {}) {
        const defaultQuality = {
            strike1: { quality: 100, issues: [] },
            strike2: { quality: 100, issues: [] },
            strike3: { quality: 100, issues: [] },
            overallReady: true
        };
        
        const mockReviewSystem = {
            // Quality assessment
            checkStrikeQuality: jest.fn().mockResolvedValue(options.quality || defaultQuality),
            
            // Task injection
            injectQualityImprovementTask: jest.fn().mockReturnValue({}),
            shouldInjectReviewTask: jest.fn().mockReturnValue(options.shouldInjectReview || false),
            
            // Strike management
            getNextStrikeNumber: jest.fn().mockReturnValue(options.nextStrike || 1),
            createReviewTask: jest.fn().mockReturnValue({
                id: 'review-task-' + Date.now(),
                title: 'Review Task',
                mode: 'REVIEWER'
            }),
            
            // Task management
            insertTasksBeforeStrikes: jest.fn().mockReturnValue({}),
            
            // Review criteria
            reviewCriteria: {
                1: {
                    name: 'Build Verification',
                    tasks: [
                        'Run clean build from scratch',
                        'Verify zero build errors',
                        'Check all dependencies installed',
                        'Ensure build artifacts generated'
                    ]
                },
                2: {
                    name: 'Lint and Code Quality',
                    tasks: [
                        'Run all linters',
                        'Ensure zero lint errors',
                        'Check for console.log statements',
                        'Verify code style consistency'
                    ]
                },
                3: {
                    name: 'Test Coverage and Success',
                    tasks: [
                        'Run all tests',
                        'Verify 100% coverage on critical modules',
                        'Check 90%+ coverage on other modules',
                        'Ensure no skipped or failing tests'
                    ]
                }
            }
        };
        
        // Add realistic quality assessment behavior
        if (options.enableQualityLogic) {
            mockReviewSystem.checkStrikeQuality.mockImplementation(async (todoData) => {
                // Simulate varying quality based on project state
                const hasFailingTests = todoData.tasks.some(t => t.title.includes('failing'));
                const hasLintErrors = todoData.tasks.some(t => t.title.includes('lint'));
                
                return {
                    strike1: { 
                        quality: hasFailingTests ? 50 : 100, 
                        issues: hasFailingTests ? ['Build command fails'] : [] 
                    },
                    strike2: { 
                        quality: hasLintErrors ? 60 : 100, 
                        issues: hasLintErrors ? ['Lint check failed'] : [] 
                    },
                    strike3: { 
                        quality: hasFailingTests ? 30 : 100, 
                        issues: hasFailingTests ? ['Tests are failing'] : [] 
                    },
                    overallReady: !hasFailingTests && !hasLintErrors
                };
            });
        }
        
        // Add reset capability
        mockReviewSystem.__reset = () => {
            Object.values(mockReviewSystem).forEach(prop => {
                if (jest.isMockFunction(prop)) {
                    prop.mockClear();
                }
            });
        };
        
        return mockReviewSystem;
    }
}

/**
 * Enhanced AgentExecutor Mock Factory
 * Provides consistent AgentExecutor mocking with prompt generation logic
 */
class MockAgentExecutorFactory {
    static create(options = {}) {
        const mockAgentExecutor = {
            // Core prompt building
            buildPrompt: jest.fn().mockReturnValue(options.prompt || 'Generated test prompt'),
            buildTaskContext: jest.fn().mockReturnValue(options.taskContext || 'Task context'),
            buildTaskFileInstructions: jest.fn().mockReturnValue(options.fileInstructions || 'File instructions'),
            
            // File discovery
            discoverDevelopmentFiles: jest.fn().mockReturnValue(options.discoveredFiles || []),
            getAllFilesRecursively: jest.fn().mockReturnValue(options.allFiles || []),
            
            // Review and analysis
            getReviewFocus: jest.fn().mockReturnValue(options.reviewFocus || 'Review focus'),
            getTaskSummary: jest.fn().mockReturnValue(options.taskSummary || 'Task summary'),
            
            // Research report handling
            getResearchReportPath: jest.fn().mockReturnValue(options.researchPath || null),
            hasResearchReport: jest.fn().mockReturnValue(options.hasResearch || false)
        };
        
        // Add realistic prompt generation behavior
        if (options.enablePromptLogic) {
            mockAgentExecutor.buildPrompt.mockImplementation((mode, todoData, currentTask) => {
                const modePrompts = {
                    DEVELOPMENT: `Development mode prompt for ${currentTask?.title || 'general development'}`,
                    TESTING: `Testing mode prompt - focus on test coverage and quality`,
                    RESEARCH: `Research mode prompt - investigate and analyze`,
                    REVIEWER: `Review mode prompt - quality assessment and validation`,
                    TASK_CREATION: `Task creation mode prompt - analyze and create tasks`
                };
                return modePrompts[mode] || 'Generic prompt';
            });
        }
        
        // Add reset capability
        mockAgentExecutor.__reset = () => {
            Object.values(mockAgentExecutor).forEach(prop => {
                if (jest.isMockFunction(prop)) {
                    prop.mockClear();
                }
            });
        };
        
        return mockAgentExecutor;
    }
}

/**
 * Enhanced Logger Mock Factory
 * Provides consistent Logger mocking with comprehensive logging methods
 */
class MockLoggerFactory {
    static create(options = {}) {
        const mockLogger = {
            // Input/Output logging
            logInput: jest.fn(),
            logProjectState: jest.fn(),
            logCurrentTask: jest.fn(),
            logExit: jest.fn(),
            logError: jest.fn(),
            
            // Decision logging
            logModeDecision: jest.fn(),
            logStrikeHandling: jest.fn(),
            logReviewInjection: jest.fn(),
            logPromptGeneration: jest.fn(),
            
            // Flow management
            addFlow: jest.fn(),
            save: jest.fn().mockResolvedValue(true),
            
            // Configuration
            config: options.config || {
                enableFileLogging: false,
                enableConsoleLogging: true,
                logLevel: 'info'
            }
        };
        
        // Add realistic logging behavior
        if (options.enableRealLogging) {
            mockLogger.logInput.mockImplementation((input) => {
                if (options.verbose) console.log('LOG: Input received:', input);
            });
            
            mockLogger.logError.mockImplementation((error) => {
                if (options.verbose) console.error('LOG: Error occurred:', error);
            });
        }
        
        // Add reset capability
        mockLogger.__reset = () => {
            Object.values(mockLogger).forEach(prop => {
                if (jest.isMockFunction(prop)) {
                    prop.mockClear();
                }
            });
        };
        
        return mockLogger;
    }
}

// =============================================================================
// ENHANCED TEST ENVIRONMENT MANAGEMENT
// =============================================================================

/**
 * Enhanced Test Environment Factory
 * Provides comprehensive test environment setup with isolation and cleanup
 */
class TestEnvironmentFactory {
    static create(testName, options = {}) {
        const testId = `${testName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const testDir = path.join('.test-isolated', testId);
        
        const environment = {
            testId,
            testDir,
            testTodoPath: path.join(testDir, 'TODO.json'),
            mockNodeModules: path.join(testDir, 'node_modules'),
            
            // Mocks container
            mocks: {},
            
            // Setup function
            async setup() {
                try {
                    // Create test directory
                    if (!fs.existsSync(testDir)) {
                        fs.mkdirSync(testDir, { recursive: true });
                    }
                    
                    // Create mock structure if needed
                    if (options.createMockStructure) {
                        await this.createMockStructure();
                    }
                    
                    // Initialize mocks
                    this.mocks.filesystem = MockFileSystemFactory.create(options.filesystem);
                    this.mocks.taskManager = MockTaskManagerFactory.create({
                        ...options.taskManager,
                        todoPath: this.testTodoPath
                    });
                    this.mocks.autoFixer = MockAutoFixerFactory.create(options.autoFixer);
                    this.mocks.reviewSystem = MockReviewSystemFactory.create(options.reviewSystem);
                    this.mocks.agentExecutor = MockAgentExecutorFactory.create(options.agentExecutor);
                    this.mocks.logger = MockLoggerFactory.create(options.logger);
                    
                    // Set environment variables
                    process.env.TEST_TODO_PATH = this.testTodoPath;
                    process.env.TEST_MODE = 'isolated';
                    process.env.NODE_ENV = 'test';
                    
                    console.log(`🧪 Test environment created: ${testId}`);
                    return this;
                    
                } catch (error) {
                    console.error(`Failed to setup test environment: ${error.message}`);
                    throw error;
                }
            },
            
            // Create mock file structure
            async createMockStructure() {
                // Create node_modules structure
                fs.mkdirSync(this.mockNodeModules, { recursive: true });
                
                // Create critical files
                const exitDir = path.join(this.mockNodeModules, 'exit', 'lib');
                fs.mkdirSync(exitDir, { recursive: true });
                fs.writeFileSync(
                    path.join(exitDir, 'exit.js'), 
                    'module.exports = function exit(code) { process.exit(code || 0); };'
                );
                
                const jestWorkerDir = path.join(this.mockNodeModules, 'jest-worker', 'build');
                fs.mkdirSync(jestWorkerDir, { recursive: true });
                fs.writeFileSync(
                    path.join(jestWorkerDir, 'index.js'),
                    'module.exports = { Worker: class Worker { constructor() {} } };'
                );
                
                // Create TODO.json
                const defaultTodo = {
                    project: 'test-project',
                    tasks: [],
                    execution_count: 0,
                    current_mode: 'development'
                };
                fs.writeFileSync(this.testTodoPath, JSON.stringify(defaultTodo, null, 2));
            },
            
            // Cleanup function
            async cleanup() {
                try {
                    // Reset all mocks with deep cleanup
                    Object.values(this.mocks).forEach(mock => {
                        if (mock && typeof mock.__reset === 'function') {
                            mock.__reset();
                        }
                    });
                    
                    // Clear all mock references
                    this.mocks = {};
                    
                    // Clean environment variables more thoroughly
                    Object.keys(process.env).forEach(key => {
                        if (key.startsWith('TEST_') || key.startsWith('JEST_') || key.startsWith('DEBUG')) {
                            delete process.env[key];
                        }
                    });
                    
                    // Clear any registered global cleanup functions
                    if (global.testCleanup) {
                        for (const cleanup of global.testCleanup) {
                            try {
                                await cleanup();
                            } catch (error) {
                                console.warn(`Global cleanup error: ${error.message}`);
                            }
                        }
                        global.testCleanup = [];
                    }
                    
                    // Remove test directory and all subdirectories
                    if (fs.existsSync(testDir)) {
                        fs.rmSync(testDir, { recursive: true, force: true });
                    }
                    
                    console.log(`🧹 Test environment cleaned: ${testId}`);
                    
                } catch (error) {
                    console.warn(`Test environment cleanup warning: ${error.message}`);
                }
            },
            
            // Get mock by name
            getMock(mockName) {
                return this.mocks[mockName];
            },
            
            // Apply mocks to modules
            applyMocks() {
                // Apply filesystem mocks
                Object.assign(fs, this.mocks.filesystem);
                
                // Store mocks globally for legacy compatibility
                global.testMocks = this.mocks;
                
                return this.mocks;
            }
        };
        
        return environment;
    }
}

// =============================================================================
// ADVANCED TESTING PATTERNS AND UTILITIES
// =============================================================================

/**
 * Chaos Testing Utilities
 * Implements fault injection and resilience testing patterns
 */
class ChaosTestingUtils {
    static createChaosMonkey(config = {}) {
        return {
            failureRate: config.failureRate || 0.1,
            latencyMs: config.latencyMs || 1000,
            scenarios: config.scenarios || ['latency', 'error', 'timeout'],
            
            async wrapService(service) {
                return new Proxy(service, {
                    get: (target, prop) => {
                        if (typeof target[prop] !== 'function') {
                            return target[prop];
                        }
                        
                        return async (...args) => {
                            // Randomly inject failures
                            if (Math.random() < this.failureRate) {
                                const scenario = this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
                                await this.injectFailure(scenario);
                            }
                            
                            return target[prop](...args);
                        };
                    }
                });
            },
            
            async injectFailure(scenario) {
                switch (scenario) {
                    case 'latency':
                        await new Promise(resolve => global.setTimeout(resolve, this.latencyMs));
                        break;
                    case 'error':
                        throw new Error('Chaos: Service temporarily unavailable');
                    case 'timeout':
                        await new Promise(resolve => global.setTimeout(resolve, 5000));
                        throw new Error('Chaos: Request timeout');
                }
            }
        };
    }
}

/**
 * Performance Testing Utilities
 * Implements load testing and performance validation patterns
 */
class PerformanceTestingUtils {
    static async runStressTest(testFunction, config = {}) {
        const concurrent = config.concurrent || 10;
        const duration = config.duration || 5000;
        
        const results = {
            successful: 0,
            failed: 0,
            latencies: [],
            errors: []
        };
        
        const startTime = Date.now();
        const workers = [];
        
        for (let i = 0; i < concurrent; i++) {
            workers.push(this.worker(testFunction, results, startTime, duration));
        }
        
        await Promise.all(workers);
        
        return {
            ...results,
            avgLatency: results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length || 0,
            successRate: results.successful / (results.successful + results.failed) || 0
        };
    }
    
    static async worker(testFunction, results, startTime, duration) {
        while (Date.now() - startTime < duration) {
            const start = Date.now();
            
            try {
                await testFunction();
                results.successful++;
                results.latencies.push(Date.now() - start);
            } catch (error) {
                results.failed++;
                results.errors.push(error.message);
            }
        }
    }
}

/**
 * Test Data Builders
 * Provides fluent interfaces for creating test data
 */
class TestDataBuilders {
    static todoData() {
        return new TodoDataBuilder();
    }
    
    static task() {
        return new TaskBuilder();
    }
    
    static qualityReport() {
        return new QualityReportBuilder();
    }
}

class TodoDataBuilder {
    constructor() {
        this.data = {
            project: 'test-project',
            current_mode: 'development',
            tasks: [],
            execution_count: 0,
            last_hook_activation: 0
        };
    }
    
    withProject(project) {
        this.data.project = project;
        return this;
    }
    
    withMode(mode) {
        this.data.current_mode = mode;
        return this;
    }
    
    withTasks(tasks) {
        this.data.tasks = tasks;
        return this;
    }
    
    withExecutionCount(count) {
        this.data.execution_count = count;
        return this;
    }
    
    build() {
        return { ...this.data };
    }
}

class TaskBuilder {
    constructor() {
        this.data = {
            id: 'task-' + Date.now(),
            title: 'Test Task',
            description: 'Test task description',
            mode: 'development',
            priority: 'medium',
            status: 'pending',
            success_criteria: [],
            created_at: new Date().toISOString()
        };
    }
    
    withId(id) {
        this.data.id = id;
        return this;
    }
    
    withTitle(title) {
        this.data.title = title;
        return this;
    }
    
    withStatus(status) {
        this.data.status = status;
        return this;
    }
    
    withMode(mode) {
        this.data.mode = mode;
        return this;
    }
    
    withSubtasks(subtasks) {
        this.data.subtasks = subtasks;
        return this;
    }
    
    build() {
        return { ...this.data };
    }
}

class QualityReportBuilder {
    constructor() {
        this.data = {
            strike1: { quality: 100, issues: [] },
            strike2: { quality: 100, issues: [] },
            strike3: { quality: 100, issues: [] },
            overallReady: true
        };
    }
    
    withStrike1Quality(quality, issues = []) {
        this.data.strike1 = { quality, issues };
        this.data.overallReady = this.data.overallReady && quality === 100;
        return this;
    }
    
    withStrike2Quality(quality, issues = []) {
        this.data.strike2 = { quality, issues };
        this.data.overallReady = this.data.overallReady && quality === 100;
        return this;
    }
    
    withStrike3Quality(quality, issues = []) {
        this.data.strike3 = { quality, issues };
        this.data.overallReady = this.data.overallReady && quality === 100;
        return this;
    }
    
    build() {
        return { ...this.data };
    }
}

/**
 * Test Isolation Diagnostics Utility
 * Helps identify test isolation issues and provides solutions
 */
class TestIsolationDiagnostics {
    static async diagnoseIsolationIssues() {
        const issues = [];
        
        // Check for shared global state
        const globalKeys = Object.keys(global).filter(key => 
            key.startsWith('test') || key.startsWith('mock') || key.includes('Mock')
        );
        
        if (globalKeys.length > 0) {
            issues.push({
                type: 'GLOBAL_STATE_POLLUTION',
                description: 'Global variables detected that may leak between tests',
                items: globalKeys,
                solution: 'Reset global state in beforeEach/afterEach hooks'
            });
        }
        
        // Check for environment variable pollution
        const testEnvVars = Object.keys(process.env).filter(key =>
            key.startsWith('TEST_') || key.startsWith('JEST_') || key.startsWith('DEBUG')
        );
        
        if (testEnvVars.length > 0) {
            issues.push({
                type: 'ENVIRONMENT_POLLUTION',
                description: 'Test environment variables found that may persist between tests',
                items: testEnvVars,
                solution: 'Clear test environment variables in beforeEach hook'
            });
        }
        
        // Check for require cache pollution
        const testModules = Object.keys(require.cache).filter(key =>
            key.includes('/lib/') || key.includes('/test/')
        );
        
        if (testModules.length > 10) {
            issues.push({
                type: 'MODULE_CACHE_POLLUTION',
                description: 'Large number of cached modules may cause state leakage',
                items: [`${testModules.length} cached modules`],
                solution: 'Use jest.resetModules() in beforeEach hook'
            });
        }
        
        // Check for temporary files
        const tempFiles = [];
        try {
            const glob = require('glob');
            const patterns = ['test-todo*.json', '.test-env*', '.test-isolated*'];
            for (const pattern of patterns) {
                const files = glob.sync(pattern);
                tempFiles.push(...files);
            }
        } catch {
            // Ignore glob errors
        }
        
        if (tempFiles.length > 0) {
            issues.push({
                type: 'TEMPORARY_FILE_LEAKAGE',
                description: 'Temporary test files found that may cause conflicts',
                items: tempFiles,
                solution: 'Ensure proper cleanup in afterEach hook'
            });
        }
        
        return {
            hasIssues: issues.length > 0,
            issues,
            recommendations: this.generateRecommendations(issues)
        };
    }
    
    static generateRecommendations(issues) {
        const recommendations = [];
        
        if (issues.some(i => i.type === 'GLOBAL_STATE_POLLUTION')) {
            recommendations.push('Add comprehensive global state reset in test setup');
        }
        
        if (issues.some(i => i.type === 'ENVIRONMENT_POLLUTION')) {
            recommendations.push('Implement environment variable isolation');
        }
        
        if (issues.some(i => i.type === 'MODULE_CACHE_POLLUTION')) {
            recommendations.push('Use jest.resetModules() and clear require cache');
        }
        
        if (issues.some(i => i.type === 'TEMPORARY_FILE_LEAKAGE')) {
            recommendations.push('Enhance temporary file cleanup patterns');
        }
        
        return recommendations;
    }
    
    static async runIsolationHealthCheck() {
        console.log('🔍 Running test isolation health check...');
        const diagnosis = await this.diagnoseIsolationIssues();
        
        if (!diagnosis.hasIssues) {
            console.log('✅ No test isolation issues detected');
            return true;
        }
        
        console.log(`⚠️ Found ${diagnosis.issues.length} test isolation issues:`);
        diagnosis.issues.forEach(issue => {
            console.log(`  • ${issue.type}: ${issue.description}`);
            console.log(`    Items: ${issue.items.join(', ')}`);
            console.log(`    Solution: ${issue.solution}`);
        });
        
        console.log('\n📋 Recommendations:');
        diagnosis.recommendations.forEach(rec => {
            console.log(`  • ${rec}`);
        });
        
        return false;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    // Mock Factories
    MockFileSystemFactory,
    MockTaskManagerFactory,
    MockAutoFixerFactory,
    MockReviewSystemFactory,
    MockAgentExecutorFactory,
    MockLoggerFactory,
    
    // Environment Management
    TestEnvironmentFactory,
    
    // Advanced Testing Utilities
    ChaosTestingUtils,
    PerformanceTestingUtils,
    TestDataBuilders,
    TestIsolationDiagnostics,
    
    // Legacy compatibility functions
    createEnhancedMockFS: (options) => MockFileSystemFactory.create(options),
    createEnhancedMockTaskManager: (options) => MockTaskManagerFactory.create(options),
    createEnhancedMockAutoFixer: (options) => MockAutoFixerFactory.create(options),
    createEnhancedMockReviewSystem: (options) => MockReviewSystemFactory.create(options),
    createEnhancedMockAgentExecutor: (options) => MockAgentExecutorFactory.create(options),
    createEnhancedMockLogger: (options) => MockLoggerFactory.create(options)
};