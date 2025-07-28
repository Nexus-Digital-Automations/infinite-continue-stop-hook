// Test setup file for better isolation and consistent mock patterns
const fs = require('fs');
const path = require('path');

// =============================================================================
// STANDARDIZED MOCK SETUP FOR ALL TEST SUITES
// =============================================================================

// Create centralized mock factories for consistent behavior across tests
global.createMockFS = function() {
    return {
        existsSync: jest.fn().mockReturnValue(false),
        readFileSync: jest.fn().mockReturnValue('{}'),
        writeFileSync: jest.fn((path, _data, _encoding) => {
            // Prevent any writes to node_modules or actual filesystem
            if (path.includes('node_modules') || !path.includes('/test/') && !path.includes('TODO.json.backup')) {
                console.warn(`Prevented potential filesystem corruption: writeFileSync to ${path}`);
                return;
            }
            // Mock successful write for test files only
        }),
        mkdirSync: jest.fn(),
        readdirSync: jest.fn().mockReturnValue([]),
        statSync: jest.fn().mockReturnValue({ mtime: new Date() }),
        unlinkSync: jest.fn(),
        copyFileSync: jest.fn(),
        renameSync: jest.fn(),
        accessSync: jest.fn()
    };
};

global.createMockAutoFixer = function() {
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
};

global.createMockTaskManager = function() {
    return {
        readTodo: jest.fn().mockResolvedValue({ tasks: [], execution_count: 0 }),
        writeTodo: jest.fn().mockResolvedValue({}),
        getCurrentTask: jest.fn().mockResolvedValue(null),
        updateTaskStatus: jest.fn().mockResolvedValue({}),
        handleStrikeLogic: jest.fn().mockReturnValue({ action: 'continue' }),
        createTask: jest.fn().mockResolvedValue('task-id'),
        addSubtask: jest.fn().mockResolvedValue({}),
        getFileStatus: jest.fn().mockResolvedValue({ valid: true }),
        performAutoFix: jest.fn().mockResolvedValue({ success: true }),
        validateTodoFile: jest.fn().mockResolvedValue({ isValid: true })
    };
};

global.createMockReviewSystem = function() {
    return {
        checkStrikeQuality: jest.fn().mockResolvedValue({
            strike1: { quality: 100, issues: [] },
            strike2: { quality: 100, issues: [] },
            strike3: { quality: 100, issues: [] },
            overallReady: true
        }),
        injectQualityImprovementTask: jest.fn().mockReturnValue({}),
        shouldInjectReviewTask: jest.fn().mockReturnValue(false),
        getNextStrikeNumber: jest.fn().mockReturnValue(1),
        createReviewTask: jest.fn().mockReturnValue({ id: 'review-task' }),
        insertTasksBeforeStrikes: jest.fn().mockReturnValue({})
    };
};

global.createMockAgentExecutor = function() {
    return {
        buildPrompt: jest.fn().mockReturnValue('Generated prompt'),
        discoverDevelopmentFiles: jest.fn().mockReturnValue([]),
        buildTaskContext: jest.fn().mockReturnValue('Task context')
    };
};

global.createMockLogger = function() {
    return {
        logInput: jest.fn(),
        logProjectState: jest.fn(),
        logCurrentTask: jest.fn(),
        logModeDecision: jest.fn(),
        logStrikeHandling: jest.fn(),
        logReviewInjection: jest.fn(),
        logPromptGeneration: jest.fn(),
        logExit: jest.fn(),
        logError: jest.fn(),
        addFlow: jest.fn(),
        save: jest.fn().mockResolvedValue()
    };
};

// CRITICAL: Override all filesystem operations to prevent corruption
const originalWriteFileSync = fs.writeFileSync;
const originalWriteFile = fs.writeFile;

// Store original functions for restoration if needed
global.__originalFS = {
    writeFileSync: originalWriteFileSync,
    writeFile: originalWriteFile
};

// Override with safe versions that prevent writing to node_modules
fs.writeFileSync = function(filePath, data, options) {
    // Prevent any writes to node_modules or system files
    if (typeof filePath === 'string' && 
        (filePath.includes('node_modules') || 
         filePath.includes('/usr/') || 
         filePath.includes('/bin/') ||
         (!filePath.includes('TODO.json') && !filePath.includes('.test-env') && !filePath.includes('test-')))) {
        console.warn(`Blocked dangerous write attempt to: ${filePath}`);
        return;
    }
    // For allowed files, continue with original operation
    return originalWriteFileSync.call(this, filePath, data, options);
};

fs.writeFile = function(filePath, data, options, callback) {
    // Handle both callback and options parameters
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    
    if (typeof filePath === 'string' && 
        (filePath.includes('node_modules') || 
         filePath.includes('/usr/') || 
         filePath.includes('/bin/') ||
         (!filePath.includes('TODO.json') && !filePath.includes('.test-env') && !filePath.includes('test-')))) {
        console.warn(`Blocked dangerous async write attempt to: ${filePath}`);
        if (callback) callback(null);
        return;
    }
    
    return originalWriteFile.call(this, filePath, data, options, callback);
};

// Global test setup
beforeEach(() => {
    // Clear any module caches to ensure fresh imports
    jest.clearAllMocks();
    
    // Reset environment variables to clean state
    delete process.env.TEST_TODO_PATH;
    delete process.env.TEST_MODE;
    
    // Ensure working directory is consistent
    process.chdir(path.join(__dirname, '..'));
});

afterEach(() => {
    // Clean up any temporary files created during tests
    const tempFiles = [
        'test-todo.json',
        'temp-todo.json',
        'backup-todo.json'
    ];
    
    tempFiles.forEach(file => {
        try {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        } catch {
            // Ignore cleanup errors
        }
    });
    
    // Reset any global variables that might have been modified
    if (global.testCleanup) {
        global.testCleanup.forEach(cleanup => {
            try {
                cleanup();
            } catch {
                // Ignore cleanup errors
            }
        });
        global.testCleanup = [];
    }
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Utility function to register cleanup functions
global.registerTestCleanup = function(cleanupFn) {
    if (!global.testCleanup) {
        global.testCleanup = [];
    }
    global.testCleanup.push(cleanupFn);
};

// Mock console methods to reduce noise in tests unless specifically needed
const originalConsole = { ...console };
global.mockConsole = function() {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
};

global.restoreConsole = function() {
    Object.assign(console, originalConsole);
};

// Helper for creating isolated test environments
global.createTestEnvironment = function(options = {}) {
    const testDir = options.testDir || '.test-env';
    const testTodoPath = path.join(testDir, 'TODO.json');
    
    // Create test directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Register cleanup
    global.registerTestCleanup(() => {
        try {
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true, force: true });
            }
        } catch {
            // Ignore cleanup errors
        }
    });
    
    return {
        testDir,
        testTodoPath,
        createTodoFile: (data) => {
            fs.writeFileSync(testTodoPath, JSON.stringify(data, null, 2));
            return testTodoPath;
        }
    };
};

module.exports = {};