// Test setup file for better isolation and consistent mock patterns
const fs = require('fs');
const path = require('path');

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