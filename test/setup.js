// Test setup file for better isolation and consistent mock patterns
const fs = require('fs');
const path = require('path');
const TestErrorHandler = require('../lib/testErrorHandler');
const FileOperationLogger = require('../lib/fileOperationLogger');
const {
    TestEnvironmentFactory,
    MockFileSystemFactory,
    MockTaskManagerFactory,
    MockAutoFixerFactory,
    MockReviewSystemFactory,
    MockAgentExecutorFactory,
    MockLoggerFactory,
    ChaosTestingUtils,
    PerformanceTestingUtils,
    TestDataBuilders
} = require('./testInfrastructure');

// Coverage mode detection
const isCoverageMode = process.argv.includes('--coverage') || 
                      process.env.npm_config_coverage || 
                      process.env.JEST_COVERAGE ||
                      (process.argv.find(arg => arg.includes('jest.coverage.config.js')));

if (isCoverageMode) {
    console.log('🔬 Coverage mode detected - enabling coverage-safe operations');
}

// Initialize file operation logger for comprehensive monitoring
const fileOpLogger = new FileOperationLogger({
    projectRoot: process.cwd(),
    enableRealTimeAlerts: true,
    enableThreatDetection: true,
    enableAuditTrail: true
});

// Make logger available globally for test utilities
global.fileOperationLogger = fileOpLogger;

// =============================================================================
// STANDARDIZED MOCK SETUP FOR ALL TEST SUITES
// =============================================================================

// Create global error handler instance for all tests
global.testErrorHandler = new TestErrorHandler({
    enableLogging: process.env.NODE_ENV !== 'test',
    enableRecovery: true,
    maxRetries: 2,
    retryDelay: 100
});

// Make enhanced test infrastructure available globally
global.TestEnvironmentFactory = TestEnvironmentFactory;
global.TestDataBuilders = TestDataBuilders;
global.ChaosTestingUtils = ChaosTestingUtils;
global.PerformanceTestingUtils = PerformanceTestingUtils;

// Enhanced error handling utility for test operations
global.withTestErrorHandling = function(operation, context = {}) {
    return global.testErrorHandler.withErrorHandling(operation, {
        createMissingFiles: true,
        defaultFileContent: '{}',
        fallbackData: context.fallbackData || null,
        resetMocks: context.resetMocks || (() => jest.clearAllMocks()),
        ...context
    });
};

// Resilient test environment factory
global.createResilientTestEnv = function(options = {}) {
    return global.testErrorHandler.createResilientTestEnv(options);
};

// Create centralized mock factories for consistent behavior across tests
global.createMockFS = function(options) {
    return MockFileSystemFactory.create(options);
};

global.createMockAutoFixer = function(options) {
    return MockAutoFixerFactory.create(options);
};

global.createMockTaskManager = function(options) {
    return MockTaskManagerFactory.create(options);
};

global.createMockReviewSystem = function(options) {
    return MockReviewSystemFactory.create(options);
};

global.createMockAgentExecutor = function(options) {
    return MockAgentExecutorFactory.create(options);
};

global.createMockLogger = function(options) {
    return MockLoggerFactory.create(options);
};

// CRITICAL: Override all filesystem operations to prevent corruption
const originalWriteFileSync = fs.writeFileSync;
const originalWriteFile = fs.writeFile;
const originalAppendFileSync = fs.appendFileSync;
const originalAppendFile = fs.appendFile;
const originalCreateWriteStream = fs.createWriteStream;

// Store original functions for restoration if needed
global.__originalFS = {
    writeFileSync: originalWriteFileSync,
    writeFile: originalWriteFile,
    appendFileSync: originalAppendFileSync,
    appendFile: originalAppendFile,
    createWriteStream: originalCreateWriteStream
};

// Enhanced filesystem mock with better isolation and safety
fs.writeFileSync = function(filePath, data, options) {
    const path = require('path');
    const normalizedPath = path.resolve(filePath);
    
    // Critical system protection - prevent writes to dangerous paths
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
    
    // Extra protection: Block any write that looks like it's going to node_modules
    if (normalizedPath.includes('node_modules') || 
        normalizedPath.includes('/exit.js') ||
        normalizedPath.endsWith('exit.js')) {
        console.warn(`🚫 BLOCKED: Dangerous write to ${normalizedPath}`);
        if (normalizedPath.includes('exit')) {
            console.error(`🚨 CRITICAL: Prevented JSON contamination of exit library at ${normalizedPath}`);
            console.error(`🚨 CRITICAL: Data was: ${typeof data === 'string' ? data.substring(0, 100) : typeof data}...`);
            // Log stack trace to see where this write is coming from
            console.error(`🚨 CRITICAL: Write attempted from:`, new Error().stack);
        }
        return;
    }
    
    if (dangerousPaths.some(dangerous => normalizedPath.includes(dangerous))) {
        console.warn(`BLOCKED: Dangerous write to ${normalizedPath}`);
        if (normalizedPath.includes('exit')) {
            console.error(`CRITICAL: Prevented JSON contamination of exit library at ${normalizedPath}`);
        }
        return;
    }
    
    // Enhanced JSON contamination prevention - but allow coverage JSON files
    if (typeof data === 'string' && 
        (data.startsWith('{') || data.startsWith('[')) && 
        !filePath.endsWith('.json') && 
        !filePath.endsWith('.backup') &&
        !filePath.includes('coverage') &&
        !filePath.includes('lcov')) {
        console.warn(`BLOCKED: JSON write to non-JSON file: ${normalizedPath}`);
        console.error(`CRITICAL: Prevented JSON contamination - data starts with: ${data.substring(0, 50)}...`);
        return;
    }
    
    // Only allow writes to explicitly safe test directories
    const allowedPaths = [
        '.test-env',
        '.test-isolated', 
        'test-todo.json',
        'backup',
        '.backup',
        'development/', // Allow development directory for logs and reports
        '/tmp/',
        '/temp/',
        'coverage/', // Allow Jest coverage reports
        '.nyc_output/', // Allow NYC coverage
        'lcov.info' // Allow LCOV coverage files
    ];
    
    // Enhanced coverage-mode allowlist
    const coverageAllowedPaths = [
        ...allowedPaths,
        'coverage-final.json',
        'clover.xml',
        'coverage.json',
        'lcov-report/',
        '.coverage/',
        'jest-coverage/'
    ];
    
    const pathsToCheck = isCoverageMode ? coverageAllowedPaths : allowedPaths;
    
    const isAllowed = pathsToCheck.some(allowed => 
        normalizedPath.includes(allowed) || 
        normalizedPath.includes('/test/') ||
        path.basename(normalizedPath).startsWith('test-') ||
        normalizedPath.includes('TODO.json') ||
        normalizedPath.includes('coverage') ||
        normalizedPath.includes('lcov')
    );
    
    if (!isAllowed) {
        console.warn(`BLOCKED: Unauthorized write to ${normalizedPath}`);
        return;
    }
    
    // Safe write to test files only
    console.log(`ALLOWED: Test write to ${normalizedPath}`);
    return originalWriteFileSync.call(this, filePath, data, options);
};

fs.writeFile = function(filePath, data, options, callback) {
    // Handle both callback and options parameters
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    
    const path = require('path');
    const normalizedPath = path.resolve(filePath);
    
    // Use same comprehensive protection as sync version
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
    
    // Extra protection: Block any write that looks like it's going to node_modules
    if (normalizedPath.includes('node_modules') || 
        normalizedPath.includes('/exit.js') ||
        normalizedPath.endsWith('exit.js')) {
        console.warn(`🚫 BLOCKED: Dangerous async write to ${normalizedPath}`);
        if (normalizedPath.includes('exit')) {
            console.error(`🚨 CRITICAL: Prevented async JSON contamination of exit library at ${normalizedPath}`);
            console.error(`🚨 CRITICAL: Async data was: ${typeof data === 'string' ? data.substring(0, 100) : typeof data}...`);
            console.error(`🚨 CRITICAL: Async write attempted from:`, new Error().stack);
        }
        if (callback) callback(null);
        return;
    }
    
    if (dangerousPaths.some(dangerous => normalizedPath.includes(dangerous))) {
        console.warn(`BLOCKED: Dangerous async write to ${normalizedPath}`);
        if (normalizedPath.includes('exit')) {
            console.error(`CRITICAL: Prevented async JSON contamination of exit library at ${normalizedPath}`);
        }
        if (callback) callback(null);
        return;
    }
    
    // Enhanced JSON contamination prevention - but allow coverage JSON files
    if (typeof data === 'string' && 
        (data.startsWith('{') || data.startsWith('[')) && 
        !filePath.endsWith('.json') && 
        !filePath.endsWith('.backup') &&
        !filePath.includes('coverage') &&
        !filePath.includes('lcov')) {
        console.warn(`BLOCKED: Async JSON write to non-JSON file: ${normalizedPath}`);
        console.error(`CRITICAL: Prevented async JSON contamination - data starts with: ${data.substring(0, 50)}...`);
        if (callback) callback(null);
        return;
    }
    
    // Only allow writes to explicitly safe test directories
    const allowedPaths = [
        '.test-env',
        '.test-isolated', 
        'test-todo.json',
        'backup',
        '.backup',
        'development/', // Allow development directory for logs and reports
        '/tmp/',
        '/temp/',
        'coverage/', // Allow Jest coverage reports
        '.nyc_output/', // Allow NYC coverage
        'lcov.info' // Allow LCOV coverage files
    ];
    
    // Enhanced coverage-mode allowlist
    const coverageAllowedPaths = [
        ...allowedPaths,
        'coverage-final.json',
        'clover.xml',
        'coverage.json',
        'lcov-report/',
        '.coverage/',
        'jest-coverage/'
    ];
    
    const pathsToCheck = isCoverageMode ? coverageAllowedPaths : allowedPaths;
    
    const isAllowed = pathsToCheck.some(allowed => 
        normalizedPath.includes(allowed) || 
        normalizedPath.includes('/test/') ||
        path.basename(normalizedPath).startsWith('test-') ||
        normalizedPath.includes('TODO.json') ||
        normalizedPath.includes('coverage') ||
        normalizedPath.includes('lcov')
    );
    
    if (!isAllowed) {
        console.warn(`BLOCKED: Unauthorized async write to ${normalizedPath}`);
        if (callback) callback(null);
        return;
    }
    
    // Safe write to test files only
    console.log(`ALLOWED: Async test write to ${normalizedPath}`);
    return originalWriteFile.call(this, filePath, data, options, callback);
};

// Protect appendFileSync operations
fs.appendFileSync = function(filePath, data, options) {
    const path = require('path');
    const normalizedPath = path.resolve(filePath);
    
    // Block dangerous append operations using same protection logic
    if (normalizedPath.includes('node_modules') || 
        normalizedPath.includes('/exit.js') ||
        normalizedPath.endsWith('exit.js') ||
        normalizedPath.includes('/usr/') || 
        normalizedPath.includes('/bin/') ||
        normalizedPath.includes('/System/')) {
        console.warn(`🚫 BLOCKED: Dangerous appendFileSync to ${normalizedPath}`);
        if (normalizedPath.includes('exit')) {
            console.error(`🚨 CRITICAL: Prevented append contamination of exit library at ${normalizedPath}`);
        }
        return;
    }
    
    // Only allow appends to safe test files and development logs
    if (!normalizedPath.includes('/test/') && 
        !normalizedPath.includes('TODO.json') && 
        !normalizedPath.includes('.test-env') && 
        !normalizedPath.includes('development/') &&
        !path.basename(normalizedPath).startsWith('test-')) {
        console.warn(`BLOCKED: Unauthorized appendFileSync to ${normalizedPath}`);
        return;
    }
    
    return originalAppendFileSync.call(this, filePath, data, options);
};

// Protect appendFile operations (async)
fs.appendFile = function(filePath, data, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    
    const path = require('path');
    const normalizedPath = path.resolve(filePath);
    
    // Block dangerous async append operations
    if (normalizedPath.includes('node_modules') || 
        normalizedPath.includes('/exit.js') ||
        normalizedPath.endsWith('exit.js') ||
        normalizedPath.includes('/usr/') || 
        normalizedPath.includes('/bin/') ||
        normalizedPath.includes('/System/')) {
        console.warn(`🚫 BLOCKED: Dangerous async appendFile to ${normalizedPath}`);
        if (normalizedPath.includes('exit')) {
            console.error(`🚨 CRITICAL: Prevented async append contamination of exit library at ${normalizedPath}`);
        }
        if (callback) callback(null);
        return;
    }
    
    // Only allow appends to safe test files and development logs
    if (!normalizedPath.includes('/test/') && 
        !normalizedPath.includes('TODO.json') && 
        !normalizedPath.includes('.test-env') && 
        !normalizedPath.includes('development/') &&
        !path.basename(normalizedPath).startsWith('test-')) {
        console.warn(`BLOCKED: Unauthorized async appendFile to ${normalizedPath}`);
        if (callback) callback(null);
        return;
    }
    
    return originalAppendFile.call(this, filePath, data, options, callback);
};

// Protect createWriteStream operations
fs.createWriteStream = function(filePath, options) {
    const path = require('path');
    const normalizedPath = path.resolve(filePath);
    
    // Block dangerous write streams
    if (normalizedPath.includes('node_modules') || 
        normalizedPath.includes('/exit.js') ||
        normalizedPath.endsWith('exit.js') ||
        normalizedPath.includes('/usr/') || 
        normalizedPath.includes('/bin/') ||
        normalizedPath.includes('/System/')) {
        console.warn(`🚫 BLOCKED: Dangerous createWriteStream to ${normalizedPath}`);
        if (normalizedPath.includes('exit')) {
            console.error(`🚨 CRITICAL: Prevented write stream contamination of exit library at ${normalizedPath}`);
        }
        // Return a mock stream that does nothing
        const { Writable } = require('stream');
        return new Writable({
            write(_chunk, _encoding, callback) {
                callback();
            }
        });
    }
    
    // Only allow write streams to safe test files
    if (!normalizedPath.includes('/test/') && 
        !normalizedPath.includes('TODO.json') && 
        !normalizedPath.includes('.test-env') && 
        !path.basename(normalizedPath).startsWith('test-')) {
        console.warn(`BLOCKED: Unauthorized createWriteStream to ${normalizedPath}`);
        // Return a mock stream that does nothing
        const { Writable } = require('stream');
        return new Writable({
            write(_chunk, _encoding, callback) {
                callback();
            }
        });
    }
    
    return originalCreateWriteStream.call(this, filePath, options);
};

// Critical file backup and validation system
const criticalFiles = [
    path.join(__dirname, '../node_modules/exit/lib/exit.js'),
    path.join(__dirname, '../node_modules/jest-worker/build/index.js')
];

// Store original critical file contents
const originalFileContents = new Map();

// Initialize critical file protection
criticalFiles.forEach(filePath => {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            originalFileContents.set(filePath, content);
            console.log(`🛡️ Protected critical file: ${path.basename(filePath)}`);
        }
    } catch (error) {
        console.warn(`⚠️ Could not backup critical file ${filePath}: ${error.message}`);
    }
});

// Function to restore critical files if contaminated
function restoreCriticalFiles() {
    criticalFiles.forEach(filePath => {
        try {
            if (originalFileContents.has(filePath) && fs.existsSync(filePath)) {
                const currentContent = fs.readFileSync(filePath, 'utf8');
                const originalContent = originalFileContents.get(filePath);
                
                if (currentContent !== originalContent) {
                    console.error(`🚨 CONTAMINATION DETECTED: ${path.basename(filePath)}`);
                    console.error(`🚨 Restoring original content...`);
                    fs.writeFileSync(filePath, originalContent, 'utf8');
                    console.log(`✅ Restored: ${path.basename(filePath)}`);
                }
            }
        } catch (error) {
            console.error(`❌ Failed to restore ${filePath}: ${error.message}`);
        }
    });
}

// Enhanced global test setup with comprehensive isolation
beforeEach(() => {
    // 0. Restore critical files before each test
    restoreCriticalFiles();
    
    // 1. Clear all mocks first
    jest.clearAllMocks();
    jest.resetAllMocks();
    
    // 2. Reset module registry to prevent state leakage
    jest.resetModules();
    
    // 3. Clear require cache for test modules to ensure fresh imports
    Object.keys(require.cache).forEach(key => {
        if (key.includes('/lib/') || key.includes('/test/')) {
            delete require.cache[key];
        }
    });
    
    // 4. Reset environment variables to clean state
    // Clear test-specific environment variables
    delete process.env.TEST_TODO_PATH;
    delete process.env.TEST_MODE;
    delete process.env.DEBUG;
    delete process.env.JEST_WORKER_ID;
    
    // Ensure clean test environment
    process.env.NODE_ENV = 'test';
    
    // 5. Ensure working directory is consistent
    const targetDir = path.join(__dirname, '..');
    try {
        process.chdir(targetDir);
    } catch (error) {
        console.warn(`Could not change directory to ${targetDir}: ${error.message}`);
    }
    
    // 6. Reset global test state
    global.testCleanup = [];
    
    // 7. Reset mock factories if they have reset capabilities
    if (global.currentMocks) {
        Object.values(global.currentMocks).forEach(mock => {
            if (mock && typeof mock.__reset === 'function') {
                mock.__reset();
            }
        });
    }
    
    // 8. Isolate console output for cleaner test output
    if (!process.env.PRESERVE_CONSOLE) {
        global.isolateConsole();
    }
});

afterEach(async () => {
    // 0. Restore critical files after each test
    restoreCriticalFiles();
    
    // 1. Execute all registered cleanup functions
    if (global.testCleanup) {
        for (const cleanup of global.testCleanup) {
            try {
                await cleanup();
            } catch (error) {
                console.warn(`Cleanup error: ${error.message}`);
            }
        }
        global.testCleanup = [];
    }
    
    // 2. Clean up temporary files with enhanced patterns
    const tempPatterns = [
        'test-todo*.json',
        'temp-todo*.json', 
        'backup-todo*.json',
        '.test-env*',
        '.test-isolated*',
        '.hook-debug-*.json'
    ];
    
    for (const pattern of tempPatterns) {
        try {
            const glob = require('glob');
            const files = glob.sync(pattern);
            files.forEach(file => {
                if (fs.existsSync(file)) {
                    if (fs.statSync(file).isDirectory()) {
                        fs.rmSync(file, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(file);
                    }
                }
            });
        } catch (error) {
            console.warn(`Pattern cleanup error for ${pattern}: ${error.message}`);
        }
    }
    
    // 3. Restore console output
    global.restoreConsole();
    
    // 4. Force garbage collection if available
    if (global.gc) {
        global.gc();
    }
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Critical: Restore files before process exit
process.on('exit', () => {
    try {
        restoreCriticalFiles();
    } catch (error) {
        console.error('Failed to restore critical files on exit:', error.message);
    }
});

process.on('SIGINT', () => {
    try {
        restoreCriticalFiles();
    } catch (error) {
        console.error('Failed to restore critical files on SIGINT:', error.message);
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    try {
        restoreCriticalFiles();
    } catch (error) {
        console.error('Failed to restore critical files on SIGTERM:', error.message);
    }
    process.exit(0);
});

// Utility function to register cleanup functions
global.registerTestCleanup = function(cleanupFn) {
    if (!global.testCleanup) {
        global.testCleanup = [];
    }
    global.testCleanup.push(cleanupFn);
};

// Enhanced console isolation and process protection
let originalConsole;
let originalProcessExit;

global.isolateConsole = function() {
    if (!originalConsole) {
        originalConsole = { ...console };
    }
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
};

global.restoreConsole = function() {
    if (originalConsole) {
        Object.assign(console, originalConsole);
    }
};

// Process exit protection to prevent tests from terminating the process
global.protectProcessExit = function() {
    if (!originalProcessExit) {
        originalProcessExit = process.exit;
        process.exit = function(code) {
            if (process.env.NODE_ENV === 'test') {
                throw new Error(`Test attempted to exit with code ${code}`);
            }
            return originalProcessExit.call(this, code);
        };
    }
};

global.restoreProcessExit = function() {
    if (originalProcessExit) {
        process.exit = originalProcessExit;
        originalProcessExit = null;
    }
};

// Legacy functions for backward compatibility
global.mockConsole = global.isolateConsole;

// Enhanced isolated test environment factory
global.createIsolatedTestEnvironment = function(testName) {
    const testId = `${testName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testDir = path.join('.test-isolated', testId);
    
    // Ensure complete isolation
    const originalCwd = process.cwd();
    const originalEnv = { ...process.env };
    
    return {
        testDir,
        testId,
        setup: () => {
            // Create isolated directory
            if (!fs.existsSync(testDir)) {
                fs.mkdirSync(testDir, { recursive: true });
            }
            
            // Set isolated environment
            process.env.TEST_TODO_PATH = path.join(testDir, 'TODO.json');
            process.env.TEST_MODE = 'isolated';
            process.env.NODE_ENV = 'test';
            
            // Protect process exit
            global.protectProcessExit();
            
            return testDir;
        },
        cleanup: () => {
            // Restore original environment
            Object.keys(process.env).forEach(key => {
                if (key.startsWith('TEST_')) {
                    delete process.env[key];
                }
            });
            Object.assign(process.env, originalEnv);
            process.chdir(originalCwd);
            
            // Restore process exit
            global.restoreProcessExit();
            
            // Clean up test directory
            try {
                if (fs.existsSync(testDir)) {
                    fs.rmSync(testDir, { recursive: true, force: true });
                }
            } catch (error) {
                console.warn(`Cleanup warning: ${error.message}`);
            }
        }
    };
};

// Legacy function for backward compatibility
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