// Test setup file for better isolation and consistent mock patterns
const fs = require('fs');
const path = require('path');
const ContaminationResolver = require('../lib/contaminationResolver');

// Initialize Jest exit protection immediately
console.log('🛡️ Initializing Jest contamination protection...');
const resolver = new ContaminationResolver();
resolver.setupJestExitProtection();

// Helper function to get current test file
function getCurrentTestFile() {
    const stack = new Error().stack || '';
    const lines = stack.split('\n');
    
    // Look for test file in stack trace
    for (const line of lines) {
        const match = line.match(/at.*\(([^)]+\.test\.js):\d+:\d+\)/) || 
                     line.match(/at.*\(([^)]+\.spec\.js):\d+:\d+\)/) ||
                     line.match(/([^/\\]+\.test\.js):\d+:\d+/) ||
                     line.match(/([^/\\]+\.spec\.js):\d+:\d+/);
        
        if (match) {
            return match[1];
        }
    }
    
    // Fallback to Jest environment variables
    if (process.env.JEST_CURRENT_TEST_NAME) {
        return process.env.JEST_CURRENT_TEST_NAME;
    }
    
    return 'unknown-test-file';
}
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
// In test mode, disable verbose logging and file I/O for better performance
const fileOpLogger = new FileOperationLogger({
    projectRoot: process.cwd(),
    enableRealTimeAlerts: false, // Disabled in test mode automatically
    enableThreatDetection: true,
    enableAuditTrail: false, // Disabled in test mode automatically
    enableConsoleLogging: false, // Disable console logs in test mode
    testMode: true // Explicit test mode flag
});

// Make logger available globally for test utilities
global.fileOperationLogger = fileOpLogger;

// Initialize enhanced node_modules monitoring
const { getGlobalMonitor } = require('../lib/nodeModulesMonitor');
global.nodeModulesMonitor = getGlobalMonitor({
    enableBackup: true,
    enableRestore: true,
    realTimeWatch: process.env.ENABLE_REALTIME_WATCH === 'true', // Disabled for performance
    autoRestore: true,
    threatEscalation: true,
    deepContentAnalysis: process.env.ENABLE_DEEP_ANALYSIS === 'true', // Disabled for performance
    proactiveScanning: false, // Disabled for performance - enable only when debugging
    emergencyLockdown: true
});

// Initialize contamination prevention system
const JestContaminationPrevention = require('../scripts/jest-contamination-fix');
let contaminationPrevention = null;

// Start contamination prevention if not already running
if (!global.contaminationPreventionActive) {
    contaminationPrevention = new JestContaminationPrevention();
    contaminationPrevention.initialize().catch(error => {
        console.warn('Failed to initialize contamination prevention:', error.message);
    });
    global.contaminationPreventionActive = true;
    global.contaminationPrevention = contaminationPrevention;
}

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

// Enhanced filesystem mock with MAXIMUM protection and early detection
fs.writeFileSync = function(filePath, data, options) {
    const path = require('path');
    const normalizedPath = path.resolve(filePath);
    
    // ULTRA-STRICT JSON contamination detection - check FIRST
    // BUT allow legitimate test JSON files in test directories
    // AND allow exit.js contamination tests (for validator testing purposes)
    const isTestEnvironment = normalizedPath.includes('.test-env') || normalizedPath.includes('.test-isolated');
    const isJsonFile = normalizedPath.endsWith('.json');
    const isExitJsContaminationTest = isTestEnvironment && 
                                     normalizedPath.includes('exit.js') && 
                                     typeof data === 'string' && 
                                     data.includes('module.exports = {') && 
                                     data.includes('"tasks"') &&
                                     data.includes('malicious');
    
    // ULTRA-ENHANCED: Deep analysis of file type and data structure
    const isJavaScriptFile = normalizedPath.endsWith('.js') || normalizedPath.endsWith('.mjs') || normalizedPath.endsWith('.cjs');
    
    // Enhanced JSON-like data detection with binary safety
    let isJSONLikeData = false;
    
    if (typeof data === 'string') {
        // Check for JSON structure patterns
        const trimmedData = data.trim();
        isJSONLikeData = (
            (trimmedData.startsWith('{') && trimmedData.endsWith('}')) ||
            (trimmedData.startsWith('[') && trimmedData.endsWith(']'))
        ) && (data.includes('"') || data.includes("'"));
        
        // Enhanced binary detection (safe regex without control characters)
        const hasBinaryMarkers = data.includes('\u0000') || // Null bytes using Unicode escape
                                data.includes('\uFFFE') || // UTF-16 BOM
                                data.includes('\uFEFF') || // UTF-16 BOM (BE) 
                                data.includes('\uEFBB\uBFBF'); // UTF-8 BOM (fixed escape)
        
        // Check for multiple suspicious non-printable characters (safe pattern using indexOf)
        let nonPrintableCount = 0;
        const controlChars = ['\u0000', '\u0001', '\u0002', '\u0003', '\u0004', '\u0005', '\u0006', '\u0007', '\u0008'];
        for (const char of controlChars) {
            if (data.indexOf(char) !== -1) {
                nonPrintableCount++;
            }
        }
        const hasManyNonPrintable = nonPrintableCount >= 4;
        
        if (hasBinaryMarkers || hasManyNonPrintable) {
            console.warn(`BLOCKED: Binary data detected in write to ${normalizedPath}`);
            return; // Block binary data writes
        }
    } else if (Buffer.isBuffer(data)) {
        // Convert small buffer portions to string for pattern analysis
        try {
            const stringData = data.toString('utf8', 0, Math.min(data.length, 1024));
            isJSONLikeData = stringData.includes('{') && (stringData.includes('"project":') || stringData.includes('"tasks":'));
        } catch {
            // Buffer conversion failed, block the write
            console.warn(`BLOCKED: Invalid buffer data in write to ${normalizedPath}`);
            return;
        }
    }
    
    // ULTRA-ENHANCED contamination patterns with advanced threat detection
    const contaminationPatterns = [
        // Core TODO.json patterns
        /"project":/,
        /"tasks":/,
        /"execution_count":/,
        /"current_mode":/,
        /"test-project"/,
        /"task_\d+"/,
        /"subtasks":/,
        /"dependencies":/,
        /"success_criteria":/,
        /"important_files":/,
        
        // Module exports contamination
        /module\.exports\s*=\s*\{.*"tasks"/s,
        /exports\s*=\s*\{.*"project"/s,
        /module\.exports\s*=\s*\{.*"execution_count"/s,
        /exports\s*=\s*\{.*"current_mode"/s,
        
        // Advanced JSON structure patterns
        /\{\s*"project"\s*:\s*"[^"]*"\s*,/,
        /\{\s*"tasks"\s*:\s*\[/,
        /\{\s*"current_mode"\s*:\s*"[^"]*"/,
        /"mode"\s*:\s*"(development|testing|research|refactoring|task-creation|reviewer)"/,
        
        // Coverage-specific contamination patterns
        /"__coverage__":/,
        /"c":\s*{\s*\d+:/,  // NYC coverage data structure
        /"f":\s*{\s*\d+:/,  // Function coverage
        /"s":\s*{\s*\d+:/,  // Statement coverage
        /"b":\s*{\s*\d+:/,  // Branch coverage
        /coverage-\w+\.json/,
        /\.nyc_output/,
        /lcov-report/,
        
        // Task management contamination
        /"status"\s*:\s*"(pending|in_progress|completed|blocked)"/,
        /"priority"\s*:\s*"(high|medium|low|critical)"/,
        /"created_at"\s*:\s*"\d{4}-\d{2}-\d{2}T/,
        /"updated_at"\s*:\s*"\d{4}-\d{2}-\d{2}T/,
        
        // Hook system contamination
        /"hook_\w+"/,
        /"infinite-continue-stop-hook"/,
        /"CLAUDE\.md"/,
        /"modes\//,
        
        // Process environment contamination
        /process\.env\.\w+\s*=\s*["'][^"']*["']/,
        /global\.\w+\s*=\s*\{/
    ];
    
    const hasContaminationPattern = typeof data === 'string' && 
        contaminationPatterns.some(pattern => pattern.test(data));
    
        // ENHANCED: Real-time node modules monitoring integration with complete isolation
    if (global.nodeModulesMonitor && typeof global.nodeModulesMonitor.reportThreat === 'function') {
        if (normalizedPath.includes('node_modules') && hasContaminationPattern) {
            global.nodeModulesMonitor.reportThreat('REALTIME_CONTAMINATION_ATTEMPT', {
                filePath: normalizedPath,
                dataPreview: typeof data === 'string' ? data.substring(0, 200) : String(data).substring(0, 200),
                timestamp: new Date().toISOString(),
                writeType: 'writeFileSync',
                testFile: getCurrentTestFile(),
                workerId: process.env.JEST_WORKER_ID,
                severity: 'CRITICAL',
                isolationLevel: 'MAXIMUM'
            });
        }
    }
    
    // ENHANCED: Complete test environment isolation - block ALL node_modules writes
    if (normalizedPath.includes('node_modules') && 
        !isTestEnvironment && 
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
        
        console.error(`🚨 CRITICAL TEST ISOLATION: All node_modules writes blocked during tests`);
        console.error(`🚨 Path: ${normalizedPath}`);
        console.error(`🚨 Test Environment: ${process.env.NODE_ENV}`);
        console.error(`🚨 Jest Worker: ${process.env.JEST_WORKER_ID}`);
        console.error(`🚨 Current Test: ${getCurrentTestFile()}`);
        console.error(`🚨 Data Type: ${typeof data}, Size: ${typeof data === 'string' ? data.length : 'unknown'}`);
        
        // Set emergency isolation flags
        process.env.NODE_MODULES_ISOLATION_ACTIVE = 'true';
        process.env.TEST_ENVIRONMENT_PROTECTED = 'true';
        
        // Report critical isolation breach
        if (global.nodeModulesMonitor?.reportThreat) {
            global.nodeModulesMonitor.reportThreat('TEST_ISOLATION_BREACH', {
                filePath: normalizedPath,
                severity: 'CRITICAL',
                timestamp: new Date().toISOString(),
                testFile: getCurrentTestFile(),
                workerId: process.env.JEST_WORKER_ID,
                emergencyAction: 'WRITE_BLOCKED'
            });
        }
        
        throw new Error(`CRITICAL: Complete test isolation - node_modules write blocked: ${normalizedPath}`);
    }
    
    // CRITICAL: Block JSON data to JavaScript files (enhanced detection)
    if (isJavaScriptFile && isJSONLikeData && hasContaminationPattern &&
        !isExitJsContaminationTest && !isTestEnvironment) {
        console.error(`🚨 ULTRA-CRITICAL: JSON contamination detected in JS file write to ${normalizedPath}`);
        console.error(`🚨 ULTRA-CRITICAL: Data preview: ${data.substring(0, 150)}...`);
        console.error(`🚨 ULTRA-CRITICAL: Write blocked - JSON contamination of JavaScript file prevented`);
        console.error(`🚨 ULTRA-CRITICAL: Stack trace:`, new Error().stack);
        
        // Enhanced threat reporting with coverage-aware detection
        if (global.fileOperationLogger && typeof global.fileOperationLogger.reportThreat === 'function') {
            global.fileOperationLogger.reportThreat('JSON_TO_JS_CONTAMINATION', {
                filePath: normalizedPath,
                dataPreview: data.substring(0, 200),
                timestamp: new Date().toISOString(),
                isCoverageMode: isCoverageMode,
                threatLevel: 'CRITICAL'
            });
        }
        
        // ENHANCED: Emergency coverage mode protection
        if (isCoverageMode) {
            console.error(`🚨 COVERAGE EMERGENCY: Contamination during coverage collection blocked`);
            // Signal to coverage system that emergency protection was triggered
            process.env.COVERAGE_EMERGENCY_TRIGGERED = 'true';
        }
        
        return; // HARD BLOCK
    }
    
    // Original contamination check (enhanced)
    if (typeof data === 'string' && hasContaminationPattern &&
        !(isTestEnvironment && isJsonFile) &&
        !isExitJsContaminationTest) {
        console.error(`🚨 ULTRA-CRITICAL: JSON contamination detected in write to ${normalizedPath}`);
        console.error(`🚨 ULTRA-CRITICAL: Data preview: ${data.substring(0, 150)}...`);
        console.error(`🚨 ULTRA-CRITICAL: Write blocked - this is likely TODO.json contamination`);
        console.error(`🚨 ULTRA-CRITICAL: Stack trace:`, new Error().stack);
        
        // Enhanced threat reporting
        if (global.fileOperationLogger && typeof global.fileOperationLogger.reportThreat === 'function') {
            global.fileOperationLogger.reportThreat('JSON_CONTAMINATION', {
                filePath: normalizedPath,
                dataPreview: data.substring(0, 200),
                timestamp: new Date().toISOString()
            });
        }
        return; // HARD BLOCK
    }
    
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
        'node_modules/exit',
        'jest-worker'
    ];
    
    // ABSOLUTE protection: Any write to node_modules is blocked (except test dirs)
    if (normalizedPath.includes('node_modules') &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
        console.warn(`BLOCKED: node_modules write prevented: ${normalizedPath}`);
        console.error(`🚫 Data type: ${typeof data}, starts with: ${typeof data === 'string' ? data.substring(0, 50) : 'non-string'}...`);
        console.error(`🚫 Stack trace:`, new Error().stack);
        return; // HARD BLOCK
    }
    
    // Extra protection: Block any write that looks like it's going to exit libraries
    if ((normalizedPath.includes('/exit.js') ||
         normalizedPath.endsWith('exit.js') ||
         normalizedPath.includes('exit/lib/') ||
         normalizedPath.includes('jest-worker')) &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
        console.warn(`BLOCKED: EXIT LIBRARY PROTECTION - write to ${normalizedPath}`);
        console.error(`🚫 This prevents critical library contamination`);
        console.error(`🚫 Data preview: ${typeof data === 'string' ? data.substring(0, 100) : typeof data}...`);
        console.error(`🚫 Stack trace:`, new Error().stack);
        return; // HARD BLOCK
    }
    
    if (dangerousPaths.some(dangerous => normalizedPath.includes(dangerous)) &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
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
        normalizedPath.includes('package.json') ||
        normalizedPath.includes('coverage') ||
        normalizedPath.includes('lcov')
    );
    
    if (!isAllowed) {
        console.warn(`BLOCKED: Unauthorized write to ${normalizedPath}`);
        if (process.env.PRESERVE_CONSOLE === 'true') {
            console.warn(`DEBUG: Filesystem protection blocked write - Path: ${normalizedPath}`);
            console.warn(`DEBUG: Paths checked: ${JSON.stringify(pathsToCheck)}`);
            console.warn(`DEBUG: isAllowed checks: ${pathsToCheck.map(allowed => `${allowed}: ${normalizedPath.includes(allowed)}`).join(', ')}`);
        }
        return;
    }
    
    // Safe write to test files only - log only if verbose testing enabled
    if (process.env.VERBOSE_TESTS) {
        console.log(`ALLOWED: Test write to ${normalizedPath}`);
    }
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
    
    // ULTRA-STRICT JSON contamination detection - check FIRST (async version)
    // BUT allow legitimate test JSON files in test directories
    // AND allow exit.js contamination tests (for validator testing purposes)
    const isTestEnvironment = normalizedPath.includes('.test-env') || normalizedPath.includes('.test-isolated');
    const isJsonFile = normalizedPath.endsWith('.json');
    const isExitJsContaminationTest = isTestEnvironment && 
                                     normalizedPath.includes('exit.js') && 
                                     typeof data === 'string' && 
                                     data.includes('module.exports = {') && 
                                     data.includes('"tasks"') &&
                                     data.includes('malicious');
    
    if (typeof data === 'string' && 
        (data.includes('"project"') || 
         data.includes('"tasks"') || 
         data.includes('"execution_count"') ||
         (data.startsWith('{') && data.includes('test-project'))) &&
        !(isTestEnvironment && isJsonFile) &&
        !isExitJsContaminationTest) {
        console.error(`🚨 ULTRA-CRITICAL: JSON contamination detected in async write to ${normalizedPath}`);
        console.error(`🚨 ULTRA-CRITICAL: Data preview: ${data.substring(0, 150)}...`);
        console.error(`🚨 ULTRA-CRITICAL: Async write blocked - this is likely TODO.json contamination`);
        console.error(`🚨 ULTRA-CRITICAL: Stack trace:`, new Error().stack);
        if (callback) callback(null);
        return; // HARD BLOCK
    }
    
    // ABSOLUTE protection: Any write to node_modules is blocked (except test dirs)
    if (normalizedPath.includes('node_modules') &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
        console.warn(`BLOCKED: node_modules async write prevented: ${normalizedPath}`);
        console.error(`🚫 Data type: ${typeof data}, starts with: ${typeof data === 'string' ? data.substring(0, 50) : 'non-string'}...`);
        console.error(`🚫 Stack trace:`, new Error().stack);
        if (callback) callback(null);
        return; // HARD BLOCK
    }
    
    // Extra protection: Block any write that looks like it's going to exit libraries
    if ((normalizedPath.includes('/exit.js') ||
         normalizedPath.endsWith('exit.js') ||
         normalizedPath.includes('exit/lib/') ||
         normalizedPath.includes('jest-worker')) &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
        console.warn(`BLOCKED: EXIT LIBRARY PROTECTION - async write to ${normalizedPath}`);
        console.error(`🚫 This prevents critical library contamination`);
        console.error(`🚫 Data preview: ${typeof data === 'string' ? data.substring(0, 100) : typeof data}...`);
        console.error(`🚫 Stack trace:`, new Error().stack);
        if (callback) callback(null);
        return; // HARD BLOCK
    }
    
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
        'node_modules/exit',
        'jest-worker'
    ];
    
    if (dangerousPaths.some(dangerous => normalizedPath.includes(dangerous)) &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
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
        normalizedPath.includes('package.json') ||
        normalizedPath.includes('coverage') ||
        normalizedPath.includes('lcov')
    );
    
    if (!isAllowed) {
        console.warn(`BLOCKED: Unauthorized async write to ${normalizedPath}`);
        if (callback) callback(null);
        return;
    }
    
    // Safe write to test files only - log only if verbose testing enabled
    if (process.env.VERBOSE_TESTS) {
        console.log(`ALLOWED: Async test write to ${normalizedPath}`);
    }
    return originalWriteFile.call(this, filePath, data, options, callback);
};

// Protect appendFileSync operations
fs.appendFileSync = function(filePath, data, options) {
    const path = require('path');
    const normalizedPath = path.resolve(filePath);
    
    // ULTRA-STRICT JSON contamination detection - check FIRST (appendFileSync version)
    // BUT allow legitimate test JSON files in test directories
    // AND allow exit.js contamination tests (for validator testing purposes)
    const isTestEnvironment = normalizedPath.includes('.test-env') || normalizedPath.includes('.test-isolated');
    const isJsonFile = normalizedPath.endsWith('.json');
    const isExitJsContaminationTest = isTestEnvironment && 
                                     normalizedPath.includes('exit.js') && 
                                     typeof data === 'string' && 
                                     data.includes('module.exports = {') && 
                                     data.includes('"tasks"') &&
                                     data.includes('malicious');
    
    if (typeof data === 'string' && 
        (data.includes('"project"') || 
         data.includes('"tasks"') || 
         data.includes('"execution_count"') ||
         (data.startsWith('{') && data.includes('test-project'))) &&
        !(isTestEnvironment && isJsonFile) &&
        !isExitJsContaminationTest) {
        console.error(`🚨 ULTRA-CRITICAL: JSON contamination detected in appendFileSync to ${normalizedPath}`);
        console.error(`🚨 ULTRA-CRITICAL: Data preview: ${data.substring(0, 150)}...`);
        console.error(`🚨 ULTRA-CRITICAL: Append blocked - this is likely TODO.json contamination`);
        console.error(`🚨 ULTRA-CRITICAL: Stack trace:`, new Error().stack);
        return; // HARD BLOCK
    }
    
    // ABSOLUTE protection: Any write to node_modules is blocked (except test dirs)
    if (normalizedPath.includes('node_modules') &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
        console.warn(`BLOCKED: node_modules appendFileSync prevented: ${normalizedPath}`);
        console.error(`🚫 Data type: ${typeof data}, starts with: ${typeof data === 'string' ? data.substring(0, 50) : 'non-string'}...`);
        console.error(`🚫 Stack trace:`, new Error().stack);
        return; // HARD BLOCK
    }
    
    // Extra protection: Block any append that looks like it's going to exit libraries
    if ((normalizedPath.includes('/exit.js') ||
         normalizedPath.endsWith('exit.js') ||
         normalizedPath.includes('exit/lib/') ||
         normalizedPath.includes('jest-worker')) &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
        console.warn(`BLOCKED: EXIT LIBRARY PROTECTION - appendFileSync to ${normalizedPath}`);
        console.error(`🚫 This prevents critical library contamination`);
        console.error(`🚫 Data preview: ${typeof data === 'string' ? data.substring(0, 100) : typeof data}...`);
        console.error(`🚫 Stack trace:`, new Error().stack);
        return; // HARD BLOCK
    }
    
    // Block dangerous append operations using same protection logic
    // BUT allow .test-env and .test-isolated for testing
    if ((normalizedPath.includes('/usr/') || 
         normalizedPath.includes('/bin/') ||
         normalizedPath.includes('/System/')) &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
        console.warn(`BLOCKED: Dangerous appendFileSync to ${normalizedPath}`);
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
    
    // ULTRA-STRICT JSON contamination detection - check FIRST (async appendFile version)
    // BUT allow legitimate test JSON files in test directories
    // AND allow exit.js contamination tests (for validator testing purposes)
    const isTestEnvironment = normalizedPath.includes('.test-env') || normalizedPath.includes('.test-isolated');
    const isJsonFile = normalizedPath.endsWith('.json');
    const isExitJsContaminationTest = isTestEnvironment && 
                                     normalizedPath.includes('exit.js') && 
                                     typeof data === 'string' && 
                                     data.includes('module.exports = {') && 
                                     data.includes('"tasks"') &&
                                     data.includes('malicious');
    
    if (typeof data === 'string' && 
        (data.includes('"project"') || 
         data.includes('"tasks"') || 
         data.includes('"execution_count"') ||
         (data.startsWith('{') && data.includes('test-project'))) &&
        !(isTestEnvironment && isJsonFile) &&
        !isExitJsContaminationTest) {
        console.error(`🚨 ULTRA-CRITICAL: JSON contamination detected in async appendFile to ${normalizedPath}`);
        console.error(`🚨 ULTRA-CRITICAL: Data preview: ${data.substring(0, 150)}...`);
        console.error(`🚨 ULTRA-CRITICAL: Async append blocked - this is likely TODO.json contamination`);
        console.error(`🚨 ULTRA-CRITICAL: Stack trace:`, new Error().stack);
        if (callback) callback(null);
        return; // HARD BLOCK
    }
    
    // ABSOLUTE protection: Any write to node_modules is blocked (except test dirs)
    if (normalizedPath.includes('node_modules') &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
        console.warn(`BLOCKED: node_modules async appendFile prevented: ${normalizedPath}`);
        console.error(`🚫 Data type: ${typeof data}, starts with: ${typeof data === 'string' ? data.substring(0, 50) : 'non-string'}...`);
        console.error(`🚫 Stack trace:`, new Error().stack);
        if (callback) callback(null);
        return; // HARD BLOCK
    }
    
    // Extra protection: Block any append that looks like it's going to exit libraries
    if ((normalizedPath.includes('/exit.js') ||
         normalizedPath.endsWith('exit.js') ||
         normalizedPath.includes('exit/lib/') ||
         normalizedPath.includes('jest-worker')) &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
        console.warn(`BLOCKED: EXIT LIBRARY PROTECTION - async appendFile to ${normalizedPath}`);
        console.error(`🚫 This prevents critical library contamination`);
        console.error(`🚫 Data preview: ${typeof data === 'string' ? data.substring(0, 100) : typeof data}...`);
        console.error(`🚫 Stack trace:`, new Error().stack);
        if (callback) callback(null);
        return; // HARD BLOCK
    }
    
    // Block dangerous async append operations
    // BUT allow .test-env and .test-isolated for testing
    if ((normalizedPath.includes('/usr/') || 
         normalizedPath.includes('/bin/') ||
         normalizedPath.includes('/System/')) &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
        console.warn(`BLOCKED: Dangerous async appendFile to ${normalizedPath}`);
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
    
    // ABSOLUTE protection: Any write stream to node_modules is blocked (except test dirs)
    if (normalizedPath.includes('node_modules') &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
        console.warn(`BLOCKED: node_modules createWriteStream prevented: ${normalizedPath}`);
        console.error(`🚫 This prevents critical library contamination through write streams`);
        console.error(`🚫 Stack trace:`, new Error().stack);
        // Return a mock stream that does nothing
        const { Writable } = require('stream');
        return new Writable({
            write(_chunk, _encoding, callback) {
                // Check for JSON contamination in stream writes too
                // BUT allow legitimate test JSON files in test directories
                // AND allow exit.js contamination tests (for validator testing purposes)
                const isTestEnvironment = normalizedPath.includes('.test-env') || normalizedPath.includes('.test-isolated');
                const isJsonFile = normalizedPath.endsWith('.json');
                const isExitJsContaminationTest = isTestEnvironment && 
                    normalizedPath.includes('exit.js') && 
                    typeof _chunk === 'string' && 
                    _chunk.includes('module.exports = {') && 
                    _chunk.includes('"tasks"') &&
                    _chunk.includes('malicious');
                
                if (typeof _chunk === 'string' && 
                    (_chunk.includes('"project"') || 
                     _chunk.includes('"tasks"') || 
                     _chunk.includes('"execution_count"') ||
                     (_chunk.startsWith('{') && _chunk.includes('test-project'))) &&
                    !(isTestEnvironment && isJsonFile) &&
                    !isExitJsContaminationTest) {
                    console.error(`🚨 ULTRA-CRITICAL: JSON TODO data detected in write stream chunk`);
                    console.error(`🚨 ULTRA-CRITICAL: Stream write blocked - contamination prevented`);
                }
                callback();
            }
        });
    }
    
    // Extra protection: Block any write stream that looks like it's going to exit libraries
    if ((normalizedPath.includes('/exit.js') ||
         normalizedPath.endsWith('exit.js') ||
         normalizedPath.includes('exit/lib/') ||
         normalizedPath.includes('jest-worker')) &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
        console.warn(`BLOCKED: EXIT LIBRARY PROTECTION - createWriteStream to ${normalizedPath}`);
        console.error(`🚫 This prevents critical library contamination through write streams`);
        console.error(`🚫 Stack trace:`, new Error().stack);
        // Return a mock stream that does nothing
        const { Writable } = require('stream');
        return new Writable({
            write(_chunk, _encoding, callback) {
                callback();
            }
        });
    }
    
    // Block dangerous write streams
    // BUT allow .test-env and .test-isolated for testing
    if ((normalizedPath.includes('/usr/') || 
         normalizedPath.includes('/bin/') ||
         normalizedPath.includes('/System/')) &&
        !normalizedPath.includes('.test-env') &&
        !normalizedPath.includes('.test-isolated')) {
        console.warn(`BLOCKED: Dangerous createWriteStream to ${normalizedPath}`);
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

// Store original critical file contents - isolated per test
let originalFileContents = new Map();

// Initialize critical file protection (quiet mode in test environment)
criticalFiles.forEach(filePath => {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            originalFileContents.set(filePath, content);
            // Only log protection messages if not in test mode or verbose testing is enabled
            if (process.env.VERBOSE_TESTS) {
                console.log(`🛡️ Protected critical file: ${path.basename(filePath)}`);
            }
        }
    } catch (error) {
        // Only warn about backup failures in non-test mode or verbose mode
        if (process.env.NODE_ENV !== 'test' || process.env.VERBOSE_TESTS) {
            console.warn(`⚠️ Could not backup critical file ${filePath}: ${error.message}`);
        }
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
    
    // 3. Selective module cache clearing for performance
    // Only clear cache when explicitly needed to avoid overhead
    
    // 4. Reset environment variables to clean state
    // Store original environment for restoration
    if (!global.__originalEnv) {
        global.__originalEnv = { ...process.env };
    }
    
    // Clear test-specific environment variables
    Object.keys(process.env).forEach(key => {
        if (key.startsWith('TEST_') || key.startsWith('JEST_') || key.startsWith('DEBUG')) {
            delete process.env[key];
        }
    });
    
    // Ensure clean test environment
    process.env.NODE_ENV = 'test';
    
    // 5. Ensure working directory is consistent
    const targetDir = path.join(__dirname, '..');
    try {
        process.chdir(targetDir);
    } catch (error) {
        console.warn(`Could not change directory to ${targetDir}: ${error.message}`);
    }
    
    // 6. Reset global test state completely
    global.testCleanup = [];
    global.currentMocks = {};
    
    // 7. Reset critical file contents Map for test isolation
    originalFileContents.clear();
    criticalFiles.forEach(filePath => {
        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                originalFileContents.set(filePath, content);
            }
        } catch (error) {
            console.warn(`⚠️ Could not backup critical file ${filePath}: ${error.message}`);
        }
    });
    
    // 8. Reset mock factories with enhanced cleanup
    if (global.currentMocks) {
        Object.values(global.currentMocks).forEach(mock => {
            if (mock && typeof mock.__reset === 'function') {
                mock.__reset();
            }
        });
        global.currentMocks = {};
    }
    
    // 9. Isolate console output for cleaner test output
    if (!process.env.PRESERVE_CONSOLE) {
        global.isolateConsole();
    }
    
    // 10. Skip proactive security scan for performance (enable only when debugging)
    // Proactive scanning disabled by default for test performance
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
    
    // 2. Enhanced resource cleanup for worker process management
    await global.cleanupWorkerResources();
    
    // 3. Clean up temporary files with enhanced patterns
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
    
    // 4. Restore console output
    global.restoreConsole();
    
    // 5. Clear any remaining timers and intervals
    global.clearAllTimers();
    
    // 6. Force garbage collection if available
    if (global.gc) {
        global.gc();
    }
    
    // 7. Skip delay for maximum performance
    // Delay removed for faster test execution
});

// Enhanced global error handlers for unhandled promises and exceptions
const unhandledRejections = new Set();
const uncaughtExceptions = new Set();

process.on('unhandledRejection', (reason, promise) => {
    unhandledRejections.add(promise);
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    // Track promise for cleanup
    promise.catch(() => {
        unhandledRejections.delete(promise);
    });
});

process.on('rejectionHandled', (promise) => {
    unhandledRejections.delete(promise);
});

process.on('uncaughtException', (error, origin) => {
    console.error('UncaughtException:', error, 'origin:', origin);
    uncaughtExceptions.add(error);
});

// Function to clean up tracked errors
global.cleanupErrorTracking = function() {
    unhandledRejections.clear();
    uncaughtExceptions.clear();
};

// registerTestCleanup will be called later after it's defined

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
    // In test environment, avoid process.exit() to prevent Jest worker crashes
    if (process.env.NODE_ENV !== 'test') {
        process.exit(0);
    }
});

process.on('SIGTERM', () => {
    try {
        restoreCriticalFiles();
    } catch (error) {
        console.error('Failed to restore critical files on SIGTERM:', error.message);
    }
    // In test environment, avoid process.exit() to prevent Jest worker crashes
    if (process.env.NODE_ENV !== 'test') {
        process.exit(0);
    }
});

// Utility function to register cleanup functions
global.registerTestCleanup = function(cleanupFn) {
    if (!global.testCleanup) {
        global.testCleanup = [];
    }
    global.testCleanup.push(cleanupFn);
};

// Register error tracking cleanup
global.registerTestCleanup(() => {
    global.cleanupErrorTracking();
});

// Enhanced console isolation and process protection
let originalConsole;
let originalProcessExit;

global.isolateConsole = function() {
    if (!originalConsole) {
        originalConsole = { ...console };
    }
    // Use silent mocks by default for better performance, unless verbose testing is enabled
    if (!process.env.VERBOSE_TESTS) {
        console.log = () => {}; // Silent mock for performance
        console.error = () => {}; 
        console.warn = () => {};
        console.info = () => {};
        console.debug = () => {};
    } else {
        // Use Jest mocks for verbose testing
        console.log = jest.fn();
        console.error = jest.fn();
        console.warn = jest.fn();
        console.info = jest.fn();
        console.debug = jest.fn();
    }
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

// ENHANCED: Comprehensive worker process exit protection
global.protectWorkerProcesses = function() {
    // Protect against unexpected process exits that could crash Jest workers
    const processExitMethods = ['exit', 'abort'];
    const processSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    processExitMethods.forEach(method => {
        const original = process[method];
        if (original && typeof original === 'function') {
            process[method] = function(...args) {
                if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
                    console.warn(`🛡️ WORKER PROTECTION: Blocked ${method} in test environment`);
                    
                    // Report to monitor
                    if (global.nodeModulesMonitor?.reportThreat) {
                        global.nodeModulesMonitor.reportThreat('WORKER_EXIT_PROTECTION', {
                            method,
                            args,
                            workerId: process.env.JEST_WORKER_ID,
                            testFile: getCurrentTestFile(),
                            timestamp: new Date().toISOString(),
                            preventedCrash: true
                        });
                    }
                    
                    // In tests, throw instead of exiting to maintain test isolation
                    throw new Error(`Test environment: ${method} call blocked to prevent worker crash`);
                }
                return original.apply(this, args);
            };
        }
    });
    
    // Enhanced signal handling for test environment
    processSignals.forEach(signal => {
        process.removeAllListeners(signal);
        process.on(signal, () => {
            if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
                console.warn(`🛡️ SIGNAL PROTECTION: ${signal} intercepted in test environment`);
                
                // Report to monitor
                if (global.nodeModulesMonitor?.reportThreat) {
                    global.nodeModulesMonitor.reportThreat('SIGNAL_PROTECTION', {
                        signal,
                        workerId: process.env.JEST_WORKER_ID,
                        testFile: getCurrentTestFile(),
                        timestamp: new Date().toISOString(),
                        intercepted: true
                    });
                }
                
                // Perform graceful cleanup instead of terminating
                try {
                    restoreCriticalFiles();
                    if (global.testCleanup) {
                        global.testCleanup.forEach(cleanup => {
                            try {
                                cleanup();
                            } catch (e) {
                                console.warn(`Cleanup error during signal handling: ${e.message}`);
                            }
                        });
                    }
                } catch (e) {
                    console.warn(`Error during signal cleanup: ${e.message}`);
                }
                
                return; // Don't terminate, let Jest handle the lifecycle
            }
            
            // In non-test environments, allow normal signal handling
            console.log(`Received ${signal}, performing graceful shutdown...`);
            try {
                restoreCriticalFiles();
            } catch (e) {
                console.error(`Error restoring files during ${signal}: ${e.message}`);
            }
            process.exit(0);
        });
    });
};

// ENHANCED: Test environment recovery and validation
global.validateTestEnvironment = function() {
    const issues = [];
    
    // Check for contamination flags
    const contaminationFlags = [
        'NODE_MODULES_ISOLATION_ACTIVE',
        'TEST_ENVIRONMENT_PROTECTED',
        'JSON_CONTAMINATION_CRITICAL',
        'TEST_ISOLATION_EMERGENCY',
        'NODE_MODULES_WRITE_BLOCKED',
        'COVERAGE_THREAT_DETECTED',
        'NODE_MODULES_EMERGENCY'
    ];
    
    contaminationFlags.forEach(flag => {
        if (process.env[flag]) {
            issues.push({
                type: 'CONTAMINATION_FLAG',
                flag,
                severity: 'HIGH'
            });
        }
    });
    
    // Validate critical files integrity
    criticalFiles.forEach(filePath => {
        try {
            if (fs.existsSync(filePath) && originalFileContents.has(filePath)) {
                const currentContent = fs.readFileSync(filePath, 'utf8');
                const originalContent = originalFileContents.get(filePath);
                
                if (currentContent !== originalContent) {
                    issues.push({
                        type: 'CRITICAL_FILE_CONTAMINATION',
                        file: filePath,
                        severity: 'CRITICAL'
                    });
                }
            }
        } catch (error) {
            issues.push({
                type: 'FILE_ACCESS_ERROR',
                file: filePath,
                error: error.message,
                severity: 'MEDIUM'
            });
        }
    });
    
    return {
        isClean: issues.length === 0,
        issues,
        timestamp: new Date().toISOString(),
        workerId: process.env.JEST_WORKER_ID
    };
};

// ENHANCED: Emergency test environment recovery
global.emergencyTestRecovery = async function() {
    console.log('🚨 EMERGENCY TEST RECOVERY ACTIVATED');
    
    const recoverySteps = [];
    
    // Step 1: Restore critical files
    try {
        restoreCriticalFiles();
        recoverySteps.push({ step: 'critical_files_restored', success: true });
    } catch (error) {
        recoverySteps.push({ step: 'critical_files_restored', success: false, error: error.message });
    }
    
    // Step 2: Clear contamination flags
    const contaminationFlags = [
        'NODE_MODULES_ISOLATION_ACTIVE',
        'TEST_ENVIRONMENT_PROTECTED',
        'JSON_CONTAMINATION_CRITICAL',
        'TEST_ISOLATION_EMERGENCY',
        'NODE_MODULES_WRITE_BLOCKED',
        'COVERAGE_THREAT_DETECTED',
        'NODE_MODULES_EMERGENCY',
        'COVERAGE_QUARANTINE_ACTIVE',
        'FILESYSTEM_PROTECTION_EMERGENCY'
    ];
    
    contaminationFlags.forEach(flag => {
        delete process.env[flag];
    });
    recoverySteps.push({ step: 'contamination_flags_cleared', success: true });
    
    // Step 3: Clean up test artifacts
    try {
        const tempDirs = ['.test-isolated', '.test-env'];
        for (const dir of tempDirs) {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        }
        recoverySteps.push({ step: 'test_artifacts_cleaned', success: true });
    } catch (error) {
        recoverySteps.push({ step: 'test_artifacts_cleaned', success: false, error: error.message });
    }
    
    // Step 4: Reset node modules monitor if available
    if (global.nodeModulesMonitor) {
        try {
            if (typeof global.nodeModulesMonitor.resetGlobalMonitor === 'function') {
                global.nodeModulesMonitor.resetGlobalMonitor();
            }
            recoverySteps.push({ step: 'monitor_reset', success: true });
        } catch (error) {
            recoverySteps.push({ step: 'monitor_reset', success: false, error: error.message });
        }
    }
    
    // Step 5: Validate recovery
    const validation = global.validateTestEnvironment();
    recoverySteps.push({ step: 'environment_validated', success: validation.isClean, issues: validation.issues });
    
    const recoveryReport = {
        timestamp: new Date().toISOString(),
        workerId: process.env.JEST_WORKER_ID,
        steps: recoverySteps,
        success: recoverySteps.every(step => step.success),
        validation
    };
    
    console.log('🚨 EMERGENCY RECOVERY COMPLETED:', recoveryReport.success ? '✅ SUCCESS' : '❌ PARTIAL');
    
    return recoveryReport;
};

// ENHANCED: Worker resource cleanup for proper Jest exit
global.cleanupWorkerResources = async function() {
    try {
        // Clear all timers and intervals that could keep workers alive
        if (global._timers) {
            global._timers.forEach(timer => {
                clearTimeout(timer);
                clearInterval(timer);
            });
            global._timers = [];
        }
        
        // Clear any node modules monitors that might have watchers
        if (global.nodeModulesMonitor && typeof global.nodeModulesMonitor.stopMonitoring === 'function') {
            try {
                await global.nodeModulesMonitor.stopMonitoring();
            } catch {
                // Silent fail to avoid breaking tests
            }
        }
        
        // Close any open file streams or watchers
        if (global._openStreams) {
            global._openStreams.forEach(stream => {
                try {
                    if (stream && typeof stream.close === 'function') {
                        stream.close();
                    } else if (stream && typeof stream.destroy === 'function') {
                        stream.destroy();
                    }
                } catch {
                    // Silent fail
                }
            });
            global._openStreams = [];
        }
        
        // Clear process event listeners that might prevent exit
        const eventTypes = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'unhandledRejection', 'uncaughtException'];
        eventTypes.forEach(eventType => {
            if (process.listenerCount(eventType) > 0) {
                // Only remove our test listeners, not system ones
                const listeners = process.listeners(eventType);
                listeners.forEach(listener => {
                    // Check if this looks like a test listener
                    if (listener.toString().includes('testFile') || 
                        listener.toString().includes('workerId') ||
                        listener.toString().includes('WORKER_PROTECTION')) {
                        process.removeListener(eventType, listener);
                    }
                });
            }
        });
        
        // Enhanced module cache cleanup to prevent memory leaks
        Object.keys(require.cache).forEach(key => {
            // Clear test modules, lib modules, and any temporary modules
            if (key.includes('/test/') || 
                key.includes('/lib/') || 
                key.includes('/.test-') || 
                key.includes('/temp') || 
                key.includes('/coverage/') ||
                (key.includes('node_modules') && key.includes('.test'))) {
                // Don't clear setup.js to avoid breaking test infrastructure
                if (!key.includes('setup.js')) {
                    delete require.cache[key];
                }
            }
        });
        
        // Clear WeakMaps and WeakSets to prevent memory leaks
        if (global.currentMocks) {
            Object.values(global.currentMocks).forEach(mock => {
                if (mock && typeof mock.__reset === 'function') {
                    mock.__reset();
                }
                if (mock && typeof mock.__cleanup === 'function') {
                    mock.__cleanup();
                }
            });
            global.currentMocks = {};
        }
        
        // Clear any accumulated event listeners
        const processEvents = ['unhandledRejection', 'uncaughtException', 'warning'];
        processEvents.forEach(eventType => {
            const listeners = process.listeners(eventType);
            listeners.forEach(listener => {
                // Only remove test-related listeners, keep system ones
                if (listener.toString().includes('test') || 
                    listener.toString().includes('Test') ||
                    listener.toString().includes('cleanup')) {
                    process.removeListener(eventType, listener);
                }
            });
        });
        
        // Clear any global variables that may accumulate
        if (global._openStreams) {
            global._openStreams.forEach(stream => {
                try {
                    if (stream && typeof stream.destroy === 'function') {
                        stream.destroy();
                    }
                } catch (streamError) {
                    // Silent cleanup, but prevent empty catch
                    void streamError;
                }
            });
            global._openStreams = [];
        }
        
        // Clear any cached file contents and checksums
        if (global.fileOperationLogger && global.fileOperationLogger.clearCache) {
            global.fileOperationLogger.clearCache();
        }
        
        if (global.nodeModulesMonitor && global.nodeModulesMonitor.preTestChecksums) {
            // Don't clear checksums completely, but remove old entries
            const checksumEntries = Array.from(global.nodeModulesMonitor.preTestChecksums.entries());
            if (checksumEntries.length > 50) { // Keep only recent 50 entries
                global.nodeModulesMonitor.preTestChecksums.clear();
                checksumEntries.slice(-25).forEach(([key, value]) => {
                    global.nodeModulesMonitor.preTestChecksums.set(key, value);
                });
            }
        }
        
        // Small delay to let resources cleanup
        await new Promise(resolve => setTimeout(resolve, 5));
        
    } catch {
        // Silent fail to not break tests
    }
};

// ENHANCED: Timer tracking for proper cleanup
global.clearAllTimers = function() {
    // Track and clear all test-created timers
    if (!global._timers) {
        global._timers = [];
    }
    
    // Clear all tracked timers
    global._timers.forEach(timer => {
        try {
            clearTimeout(timer);
            clearInterval(timer);
            // Don't try to clear timers as immediates - different ID spaces
        } catch (timerError) {
            // Silent fail
            void timerError;
        }
    });
    global._timers = [];
    
    // Clear any remaining immediates
    if (global._immediates) {
        global._immediates.forEach(immediate => {
            try {
                if (typeof global.clearImmediate !== 'undefined') {
                    global.clearImmediate(immediate);
                }
            } catch (immediateError) {
                // Silent fail
                void immediateError;
            }
        });
        global._immediates = [];
    }
    
    // Additional cleanup for any remaining timers in test environment
    if (process.env.NODE_ENV === 'test') {
        // Clear any remaining timers that might have been missed
        const maxTimerId = setTimeout(() => {}, 0);
        for (let i = 1; i <= maxTimerId; i++) {
            clearTimeout(i);
            clearInterval(i);
            // Don't try to clear immediates with timer IDs - they use different ID spaces
        }
        clearTimeout(maxTimerId);
    }
};

// Override setTimeout, setInterval, and setImmediate to track timers
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;
const originalSetImmediate = global.setImmediate;

// Initialize tracking arrays
if (!global._timers) {
    global._timers = [];
}
if (!global._immediates) {
    global._immediates = [];
}

global.setTimeout = function(callback, delay, ...args) {
    const wrappedCallback = function(...callbackArgs) {
        try {
            // Remove timer from tracking when it executes
            const index = global._timers.indexOf(timer);
            if (index > -1) {
                global._timers.splice(index, 1);
            }
            return callback.apply(this, callbackArgs);
        } catch (error) {
            console.error('Timer callback error:', error);
            throw error;
        }
    };
    
    const timer = originalSetTimeout.call(this, wrappedCallback, delay, ...args);
    global._timers.push(timer);
    return timer;
};

global.setInterval = function(callback, delay, ...args) {
    const wrappedCallback = function(...callbackArgs) {
        try {
            return callback.apply(this, callbackArgs);
        } catch (error) {
            console.error('Interval callback error:', error);
            // Clear the interval on error to prevent infinite errors
            global.clearInterval(timer);
            throw error;
        }
    };
    
    const timer = originalSetInterval.call(this, wrappedCallback, delay, ...args);
    global._timers.push(timer);
    return timer;
};

if (typeof originalSetImmediate !== 'undefined') {
    global.setImmediate = function(callback, ...args) {
        const wrappedCallback = function(...callbackArgs) {
            try {
                // Remove immediate from tracking when it executes
                const index = global._immediates.indexOf(immediate);
                if (index > -1) {
                    global._immediates.splice(index, 1);
                }
                return callback.apply(this, callbackArgs);
            } catch (error) {
                console.error('Immediate callback error:', error);
                throw error;
            }
        };
        
        const immediate = originalSetImmediate.call(this, wrappedCallback, ...args);
        global._immediates.push(immediate);
        return immediate;
    };
}

// Override clear functions to remove from tracking
const originalClearTimeout = global.clearTimeout;
const originalClearInterval = global.clearInterval;
const originalClearImmediate = global.clearImmediate;

global.clearTimeout = function(timer) {
    const index = global._timers.indexOf(timer);
    if (index > -1) {
        global._timers.splice(index, 1);
    }
    return originalClearTimeout.call(this, timer);
};

global.clearInterval = function(timer) {
    const index = global._timers.indexOf(timer);
    if (index > -1) {
        global._timers.splice(index, 1);
    }
    return originalClearInterval.call(this, timer);
};

if (typeof originalClearImmediate !== 'undefined') {
    global.clearImmediate = function(immediate) {
        const index = global._immediates.indexOf(immediate);
        if (index > -1) {
            global._immediates.splice(index, 1);
        }
        return originalClearImmediate.call(this, immediate);
    };
}

// Initialize enhanced protection systems
global.protectWorkerProcesses();

// Export empty module for compatibility
module.exports = {};