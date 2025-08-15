const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const BuildRecoveryManager = require('../lib/buildRecoveryManager');

// Mock dependencies
jest.mock('../lib/contaminationResolver');
jest.mock('../lib/nodeModulesMonitor');
jest.mock('../lib/errorRecovery');
jest.mock('child_process');
jest.mock('fs');

const ContaminationResolver = require('../lib/contaminationResolver');
const { getGlobalMonitor } = require('../lib/nodeModulesMonitor');
const ErrorRecovery = require('../lib/errorRecovery');

describe('BuildRecoveryManager', () => {
    let buildRecovery;
    let testProjectPath;
    let mockContaminationResolver;
    let mockNodeModulesMonitor;
    let mockErrorRecovery;

    beforeEach(() => {
        // Setup test project path
        testProjectPath = path.join(os.tmpdir(), `test-build-${Date.now()}`);
        
        // Create mock instances
        mockContaminationResolver = {
            detectContamination: jest.fn(),
            restoreContaminatedFiles: jest.fn(),
            storeOriginalContents: jest.fn(),
            createBackups: jest.fn()
        };
        
        mockNodeModulesMonitor = {
            startMonitoring: jest.fn()
        };
        
        mockErrorRecovery = {};
        
        // Mock constructor calls
        ContaminationResolver.mockImplementation(() => mockContaminationResolver);
        getGlobalMonitor.mockReturnValue(mockNodeModulesMonitor);
        ErrorRecovery.mockImplementation(() => mockErrorRecovery);
        
        // Reset fs mocks
        fs.existsSync = jest.fn();
        fs.readFileSync = jest.fn();
        fs.writeFileSync = jest.fn();
        fs.rmSync = jest.fn();
        fs.unlinkSync = jest.fn();
        fs.readdirSync = jest.fn();
        
        buildRecovery = new BuildRecoveryManager({
            projectRoot: testProjectPath,
            maxRetries: 2,
            retryDelay: 100
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with default options', () => {
            const defaultManager = new BuildRecoveryManager();
            expect(defaultManager.projectRoot).toBe(process.cwd());
            expect(defaultManager.maxRetries).toBe(3);
            expect(defaultManager.retryDelay).toBe(2000);
        });

        test('should initialize with custom options', () => {
            expect(buildRecovery.projectRoot).toBe(testProjectPath);
            expect(buildRecovery.maxRetries).toBe(2);
            expect(buildRecovery.retryDelay).toBe(100);
        });

        test('should initialize recovery components', () => {
            expect(ContaminationResolver).toHaveBeenCalledWith(testProjectPath);
            expect(getGlobalMonitor).toHaveBeenCalledWith({
                enableBackup: true,
                enableRestore: true,
                enableDetailed: true
            });
            expect(ErrorRecovery).toHaveBeenCalled();
        });

        test('should initialize recovery state', () => {
            expect(buildRecovery.recoveryAttempts).toBe(0);
            expect(buildRecovery.lastRecoveryTime).toBeNull();
            expect(buildRecovery.recoveryHistory).toEqual([]);
        });
    });

    describe('Build Environment Setup', () => {
        test('should setup build environment successfully', async () => {
            mockContaminationResolver.storeOriginalContents.mockResolvedValue(true);
            mockContaminationResolver.createBackups.mockResolvedValue(true);
            mockContaminationResolver.detectContamination.mockResolvedValue([]);
            mockNodeModulesMonitor.startMonitoring.mockResolvedValue(true);

            const result = await buildRecovery.setupBuildEnvironment();

            expect(result.success).toBe(true);
            expect(mockContaminationResolver.storeOriginalContents).toHaveBeenCalled();
            expect(mockContaminationResolver.createBackups).toHaveBeenCalled();
            expect(mockNodeModulesMonitor.startMonitoring).toHaveBeenCalled();
        });

        test('should handle pre-build contamination', async () => {
            mockContaminationResolver.storeOriginalContents.mockResolvedValue(true);
            mockContaminationResolver.createBackups.mockResolvedValue(true);
            mockContaminationResolver.detectContamination.mockResolvedValue(['file1.js', 'file2.js']);
            mockContaminationResolver.restoreContaminatedFiles.mockResolvedValue({ restored: 2 });
            mockNodeModulesMonitor.startMonitoring.mockResolvedValue(true);

            const result = await buildRecovery.setupBuildEnvironment();

            expect(result.success).toBe(true);
            expect(mockContaminationResolver.restoreContaminatedFiles).toHaveBeenCalled();
        });

        test('should fail when unable to clean up contamination', async () => {
            mockContaminationResolver.storeOriginalContents.mockResolvedValue(true);
            mockContaminationResolver.createBackups.mockResolvedValue(true);
            mockContaminationResolver.detectContamination.mockResolvedValue(['file1.js']);
            mockContaminationResolver.restoreContaminatedFiles.mockResolvedValue({ restored: 0 });

            const result = await buildRecovery.setupBuildEnvironment();

            expect(result.success).toBe(false);
            expect(result.error).toContain('Unable to clean up contamination');
        });

        test('should handle setup errors gracefully', async () => {
            mockContaminationResolver.storeOriginalContents.mockRejectedValue(new Error('Backup failed'));

            const result = await buildRecovery.setupBuildEnvironment();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Backup failed');
        });
    });

    describe('Build Command Execution', () => {
        let _mockChildProcess;

        beforeEach(() => {
            _mockChildProcess = {
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn()
            };
            spawn.mockReturnValue(_mockChildProcess);
        });

        test('should execute build command successfully', async () => {
            const buildCommand = 'npm run build';
            
            // Mock successful execution
            _mockChildProcess.on.mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0); // success exit code
                }
            });

            const resultPromise = buildRecovery.executeBuildCommand(buildCommand);
            const result = await resultPromise;

            expect(spawn).toHaveBeenCalledWith('sh', ['-c', buildCommand], {
                cwd: testProjectPath,
                stdio: 'pipe',
                env: { ...process.env, NODE_ENV: 'production' }
            });
            expect(result.success).toBe(true);
            expect(result.exitCode).toBe(0);
        });

        test('should handle build command failure', async () => {
            _mockChildProcess.on.mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(1); // error exit code
                }
            });

            const result = await buildRecovery.executeBuildCommand('npm run build');

            expect(result.success).toBe(false);
            expect(result.exitCode).toBe(1);
            expect(result.error).toContain('exited with code 1');
        });

        test('should handle spawn errors', async () => {
            _mockChildProcess.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    callback(new Error('Command not found'));
                }
            });

            const result = await buildRecovery.executeBuildCommand('invalid-command');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Command not found');
        });

        test('should capture stdout and stderr', async () => {
            const stdout = 'Build successful\n';
            const stderr = 'Warning: deprecated\n';

            _mockChildProcess.stdout.on.mockImplementation((event, callback) => {
                if (event === 'data') {
                    callback(Buffer.from(stdout));
                }
            });

            _mockChildProcess.stderr.on.mockImplementation((event, callback) => {
                if (event === 'data') {
                    callback(Buffer.from(stderr));
                }
            });

            _mockChildProcess.on.mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
            });

            const result = await buildRecovery.executeBuildCommand('npm run build');

            expect(result.stdout).toBe(stdout);
            expect(result.stderr).toBe(stderr);
        });
    });

    describe('Build Recovery Execution', () => {
        beforeEach(() => {
            // Mock successful setup
            mockContaminationResolver.storeOriginalContents.mockResolvedValue(true);
            mockContaminationResolver.createBackups.mockResolvedValue(true);
            mockContaminationResolver.detectContamination.mockResolvedValue([]);
            mockNodeModulesMonitor.startMonitoring.mockResolvedValue(true);
        });

        test('should execute build with recovery successfully', async () => {
            // Mock successful build
            const _mockChildProcess2 = {
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, callback) => {
                    if (event === 'close') callback(0);
                })
            };
            spawn.mockReturnValue(_mockChildProcess2);

            const result = await buildRecovery.executeBuildWithRecovery('npm run build');

            expect(result.success).toBe(true);
            expect(result.attempt).toBe(1);
            expect(result.message).toContain('completed successfully');
        });

        test('should retry build on failure with recovery', async () => {
            let callCount = 0;
            const _mockChildProcess2 = {
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, callback) => {
                    if (event === 'close') {
                        callCount++;
                        callback(callCount === 1 ? 1 : 0); // fail first, succeed second
                    }
                })
            };
            spawn.mockReturnValue(_mockChildProcess2);

            // Mock recovery steps
            buildRecovery.performDeepContaminationRecovery = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.recoverCriticalFiles = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.recoverNodeModulesState = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.protectExitHandlers = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.performEnhancedCleanup = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.verifyRecoveryCompleteness = jest.fn().mockResolvedValue({ success: true });

            const result = await buildRecovery.executeBuildWithRecovery('npm run build');

            expect(result.success).toBe(true);
            expect(result.attempt).toBe(2);
            expect(buildRecovery.performDeepContaminationRecovery).toHaveBeenCalled();
        });

        test('should fail after max retries', async () => {
            const _mockChildProcess2 = {
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, callback) => {
                    if (event === 'close') callback(1); // always fail
                })
            };
            spawn.mockReturnValue(_mockChildProcess2);

            // Mock recovery steps
            buildRecovery.performDeepContaminationRecovery = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.recoverCriticalFiles = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.recoverNodeModulesState = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.protectExitHandlers = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.performEnhancedCleanup = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.verifyRecoveryCompleteness = jest.fn().mockResolvedValue({ success: true });

            const result = await buildRecovery.executeBuildWithRecovery('npm run build');

            expect(result.success).toBe(false);
            expect(result.attempts).toBe(2);
            expect(result.message).toContain('failed after 2 attempts');
        });

        test('should detect contamination-related failures', async () => {
            const _mockChildProcess2 = {
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, callback) => {
                    if (event === 'close') callback(1);
                })
            };
            spawn.mockImplementation(() => {
                throw new Error('SyntaxError: Unexpected token :');
            });

            buildRecovery.performDeepContaminationRecovery = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.recoverCriticalFiles = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.recoverNodeModulesState = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.protectExitHandlers = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.performEnhancedCleanup = jest.fn().mockResolvedValue({ success: true });
            buildRecovery.verifyRecoveryCompleteness = jest.fn().mockResolvedValue({ success: true });

            const result = await buildRecovery.executeBuildWithRecovery('npm run build');

            expect(result.contaminationDetected).toBe(true);
        });
    });

    describe('Enhanced Build Recovery', () => {
        test('should perform all recovery steps', async () => {
            // Mock all recovery steps
            buildRecovery.performDeepContaminationRecovery = jest.fn().mockResolvedValue({ 
                name: 'Deep Contamination Recovery', 
                success: true 
            });
            buildRecovery.recoverCriticalFiles = jest.fn().mockResolvedValue({ 
                name: 'Critical Files Recovery', 
                success: true 
            });
            buildRecovery.recoverNodeModulesState = jest.fn().mockResolvedValue({ 
                name: 'Node Modules State Recovery', 
                success: true 
            });
            buildRecovery.protectExitHandlers = jest.fn().mockResolvedValue({ 
                name: 'Exit Handler Protection', 
                success: true 
            });
            buildRecovery.performEnhancedCleanup = jest.fn().mockResolvedValue({ 
                name: 'Enhanced Cleanup', 
                success: true 
            });
            buildRecovery.verifyRecoveryCompleteness = jest.fn().mockResolvedValue({ 
                name: 'Recovery Verification', 
                success: true 
            });

            const result = await buildRecovery.performEnhancedBuildRecovery();

            expect(result.success).toBe(true);
            expect(result.allStepsSuccessful).toBe(true);
            expect(result.steps).toHaveLength(6);
            expect(buildRecovery.recoveryHistory).toHaveLength(1);
        });

        test('should succeed with critical steps even if non-critical fail', async () => {
            buildRecovery.performDeepContaminationRecovery = jest.fn().mockResolvedValue({ 
                name: 'Deep Contamination Recovery', 
                success: true 
            });
            buildRecovery.recoverCriticalFiles = jest.fn().mockResolvedValue({ 
                name: 'Critical Files Recovery', 
                success: false 
            });
            buildRecovery.recoverNodeModulesState = jest.fn().mockResolvedValue({ 
                name: 'Node Modules State Recovery', 
                success: false 
            });
            buildRecovery.protectExitHandlers = jest.fn().mockResolvedValue({ 
                name: 'Exit Handler Protection', 
                success: true 
            });
            buildRecovery.performEnhancedCleanup = jest.fn().mockResolvedValue({ 
                name: 'Enhanced Cleanup', 
                success: false 
            });
            buildRecovery.verifyRecoveryCompleteness = jest.fn().mockResolvedValue({ 
                name: 'Recovery Verification', 
                success: true 
            });

            const result = await buildRecovery.performEnhancedBuildRecovery();

            expect(result.success).toBe(true); // Critical steps passed
            expect(result.allStepsSuccessful).toBe(false);
        });

        test('should fail if critical steps fail', async () => {
            buildRecovery.performDeepContaminationRecovery = jest.fn().mockResolvedValue({ 
                name: 'Deep Contamination Recovery', 
                success: false 
            });
            buildRecovery.recoverCriticalFiles = jest.fn().mockResolvedValue({ 
                name: 'Critical Files Recovery', 
                success: true 
            });
            buildRecovery.recoverNodeModulesState = jest.fn().mockResolvedValue({ 
                name: 'Node Modules State Recovery', 
                success: true 
            });
            buildRecovery.protectExitHandlers = jest.fn().mockResolvedValue({ 
                name: 'Exit Handler Protection', 
                success: true 
            });
            buildRecovery.performEnhancedCleanup = jest.fn().mockResolvedValue({ 
                name: 'Enhanced Cleanup', 
                success: true 
            });
            buildRecovery.verifyRecoveryCompleteness = jest.fn().mockResolvedValue({ 
                name: 'Recovery Verification', 
                success: true 
            });

            const result = await buildRecovery.performEnhancedBuildRecovery();

            expect(result.success).toBe(false);
        });
    });

    describe('Contamination Recovery', () => {
        test('should recover from contamination successfully', async () => {
            mockContaminationResolver.detectContamination.mockResolvedValueOnce(['file1.js', 'file2.js']);
            mockContaminationResolver.restoreContaminatedFiles.mockResolvedValue({ 
                restored: 2, 
                files: ['file1.js', 'file2.js'] 
            });
            mockContaminationResolver.detectContamination.mockResolvedValueOnce([]);

            const result = await buildRecovery.recoverFromContamination();

            expect(result.name).toBe('Contamination Recovery');
            expect(result.success).toBe(true);
            expect(result.details.contaminationFound).toBe(2);
            expect(result.details.filesRestored).toBe(2);
            expect(result.details.remainingContamination).toBe(0);
        });

        test('should handle no contamination found', async () => {
            mockContaminationResolver.detectContamination.mockResolvedValue([]);

            const result = await buildRecovery.recoverFromContamination();

            expect(result.success).toBe(true);
            expect(result.details.message).toBe('No contamination found');
        });

        test('should handle contamination recovery errors', async () => {
            mockContaminationResolver.detectContamination.mockRejectedValue(new Error('Detection failed'));

            const result = await buildRecovery.recoverFromContamination();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Detection failed');
        });
    });

    describe('Critical Files Recovery', () => {
        test('should verify critical files exist', async () => {
            fs.existsSync.mockImplementation((filePath) => {
                return filePath.includes('package.json') || 
                       filePath.includes('stop-hook.js') || 
                       filePath.includes('taskManager.js');
            });

            const result = await buildRecovery.recoverCriticalFiles();

            expect(result.name).toBe('Critical Files Recovery');
            expect(result.success).toBe(true);
            expect(result.details.fileStatus).toHaveLength(3);
            expect(result.details.fileStatus.every(f => f.exists)).toBe(true);
        });

        test('should fail when critical files are missing', async () => {
            fs.existsSync.mockReturnValue(false);

            const result = await buildRecovery.recoverCriticalFiles();

            expect(result.success).toBe(false);
            expect(result.details.fileStatus.every(f => !f.exists)).toBe(true);
        });

        test('should handle file check errors', async () => {
            fs.existsSync.mockImplementation(() => {
                throw new Error('File system error');
            });

            const result = await buildRecovery.recoverCriticalFiles();

            expect(result.success).toBe(false);
            expect(result.error).toBe('File system error');
        });
    });

    describe('Node Modules State Recovery', () => {
        test('should verify node_modules and critical packages', async () => {
            fs.existsSync.mockImplementation((filePath) => {
                return filePath.includes('node_modules');
            });

            const result = await buildRecovery.recoverNodeModulesState();

            expect(result.name).toBe('Node Modules State Recovery');
            expect(result.success).toBe(true);
            expect(result.details.nodeModulesExists).toBe(true);
            expect(result.details.packageStatus).toHaveLength(3);
        });

        test('should fail when node_modules is missing', async () => {
            fs.existsSync.mockImplementation((filePath) => {
                return !filePath.includes('node_modules');
            });

            const result = await buildRecovery.recoverNodeModulesState();

            expect(result.success).toBe(false);
            expect(result.details.nodeModulesExists).toBe(false);
            expect(result.details.message).toContain('requires npm install');
        });

        test('should fail when critical packages are missing', async () => {
            fs.existsSync.mockImplementation((filePath) => {
                return filePath.endsWith('node_modules') && !filePath.includes('jest');
            });

            const result = await buildRecovery.recoverNodeModulesState();

            expect(result.success).toBe(false);
        });
    });

    describe('Deep Contamination Recovery', () => {
        test('should perform multi-pass contamination recovery', async () => {
            mockContaminationResolver.detectContamination
                .mockResolvedValueOnce(['file1.js'])  // Pass 1
                .mockResolvedValueOnce([])            // Pass 2 - clean
                .mockResolvedValueOnce([]);           // Final check

            mockContaminationResolver.restoreContaminatedFiles.mockResolvedValue({ restored: 1 });

            const result = await buildRecovery.performDeepContaminationRecovery();

            expect(result.name).toBe('Deep Contamination Recovery');
            expect(result.success).toBe(true);
            expect(result.details.totalRecovered).toBe(1);
            expect(result.details.finalContamination).toBe(0);
        });

        test('should continue multiple passes until clean', async () => {
            mockContaminationResolver.detectContamination
                .mockResolvedValueOnce(['file1.js'])  // Pass 1
                .mockResolvedValueOnce(['file2.js'])  // Pass 2
                .mockResolvedValueOnce(['file3.js'])  // Pass 3
                .mockResolvedValueOnce([]);           // Final check

            mockContaminationResolver.restoreContaminatedFiles.mockResolvedValue({ restored: 1 });

            const result = await buildRecovery.performDeepContaminationRecovery();

            expect(result.success).toBe(true);
            expect(result.details.totalRecovered).toBe(3);
            expect(mockContaminationResolver.detectContamination).toHaveBeenCalledTimes(4);
        });

        test('should limit to max passes', async () => {
            mockContaminationResolver.detectContamination.mockResolvedValue(['file1.js']);
            mockContaminationResolver.restoreContaminatedFiles.mockResolvedValue({ restored: 1 });

            const result = await buildRecovery.performDeepContaminationRecovery();

            expect(result.success).toBe(false);
            expect(mockContaminationResolver.detectContamination).toHaveBeenCalledTimes(4); // 3 passes + final check
        });
    });

    describe('Exit Handler Protection', () => {
        test('should protect clean exit handler files', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('module.exports = function() { process.exit(); };');

            const result = await buildRecovery.protectExitHandlers();

            expect(result.name).toBe('Exit Handler Protection');
            expect(result.success).toBe(true);
            expect(result.details.protectedFiles).toHaveLength(3);
            expect(result.details.failedFiles).toHaveLength(0);
        });

        test('should restore contaminated exit handler files', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{"project":"test-project","tasks":[]}');
            mockContaminationResolver.restoreContaminatedFiles.mockResolvedValue({ 
                files: [path.join(testProjectPath, 'node_modules/exit/lib/exit.js')] 
            });

            const result = await buildRecovery.protectExitHandlers();

            expect(result.success).toBe(true);
            expect(mockContaminationResolver.restoreContaminatedFiles).toHaveBeenCalled();
        });

        test('should handle missing exit handler files', async () => {
            fs.existsSync.mockReturnValue(false);

            const result = await buildRecovery.protectExitHandlers();

            expect(result.success).toBe(true);
            expect(result.details.protectedFiles).toHaveLength(0);
        });
    });

    describe('Enhanced Cleanup', () => {
        test('should clean up temporary directories', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockReturnValue([
                { name: '.test-env-123', isDirectory: () => true },
                { name: 'regular-file', isDirectory: () => false }
            ]);
            buildRecovery.isCriticalPath = jest.fn().mockResolvedValue(false);
            mockContaminationResolver.detectContamination.mockResolvedValue([]);

            const result = await buildRecovery.performEnhancedCleanup();

            expect(result.name).toBe('Enhanced Cleanup');
            expect(result.success).toBe(true);
            expect(fs.rmSync).toHaveBeenCalled();
        });

        test('should protect critical paths from cleanup', async () => {
            fs.existsSync.mockReturnValue(true);
            buildRecovery.isCriticalPath = jest.fn().mockResolvedValue(true);
            mockContaminationResolver.detectContamination.mockResolvedValue([]);

            const result = await buildRecovery.performEnhancedCleanup();

            expect(result.success).toBe(true);
            expect(result.details.protectedItems.length).toBeGreaterThan(0);
        });

        test('should fail if contamination is introduced during cleanup', async () => {
            fs.existsSync.mockReturnValue(false);
            mockContaminationResolver.detectContamination.mockResolvedValue(['contaminated.js']);

            const result = await buildRecovery.performEnhancedCleanup();

            expect(result.success).toBe(false);
            expect(result.details.contaminationIntroduced).toBe(true);
        });
    });

    describe('Recovery Verification', () => {
        test('should verify complete recovery', async () => {
            mockContaminationResolver.detectContamination.mockResolvedValue([]);
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('module.exports = function() { process.exit(); };');
            process.env.BUILD_PROTECTION_ACTIVE = 'true';

            const result = await buildRecovery.verifyRecoveryCompleteness();

            expect(result.name).toBe('Recovery Verification');
            expect(result.success).toBe(true);
            expect(result.details.contaminationCount).toBe(0);
            expect(result.details.validFiles).toHaveLength(2);
        });

        test('should fail verification with contamination present', async () => {
            mockContaminationResolver.detectContamination.mockResolvedValue(['contaminated.js']);
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('module.exports = function() { process.exit(); };');
            process.env.BUILD_PROTECTION_ACTIVE = 'true';

            const result = await buildRecovery.verifyRecoveryCompleteness();

            expect(result.success).toBe(false);
            expect(result.details.contaminationCount).toBe(1);
        });

        test('should fail verification with invalid files', async () => {
            mockContaminationResolver.detectContamination.mockResolvedValue([]);
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{"project":"test"}');
            process.env.BUILD_PROTECTION_ACTIVE = 'true';

            const result = await buildRecovery.verifyRecoveryCompleteness();

            expect(result.success).toBe(false);
            expect(result.details.invalidFiles).toHaveLength(2);
        });
    });

    describe('Build Output Validation', () => {
        test('should validate clean build output', async () => {
            mockContaminationResolver.detectContamination.mockResolvedValue([]);

            const result = await buildRecovery.validateBuildOutput();

            expect(result.success).toBe(true);
            expect(result.contamination).toBe(0);
            expect(result.message).toBe('Build output is clean');
        });

        test('should detect contaminated build output', async () => {
            mockContaminationResolver.detectContamination.mockResolvedValue(['file1.js', 'file2.js']);

            const result = await buildRecovery.validateBuildOutput();

            expect(result.success).toBe(false);
            expect(result.contamination).toBe(2);
            expect(result.message).toContain('2 contaminated files found');
        });

        test('should handle validation errors', async () => {
            mockContaminationResolver.detectContamination.mockRejectedValue(new Error('Validation failed'));

            const result = await buildRecovery.validateBuildOutput();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Validation failed');
        });
    });

    describe('Utility Methods', () => {
        test('should delay for specified time', async () => {
            const startTime = Date.now();
            await buildRecovery.delay(100);
            const endTime = Date.now();

            expect(endTime - startTime).toBeGreaterThanOrEqual(90);
            expect(endTime - startTime).toBeLessThan(200);
        });

        test('should log messages with prefix', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            buildRecovery.log('Test message');
            
            expect(consoleSpy).toHaveBeenCalledWith('🔧 [BuildRecovery] Test message');
            
            consoleSpy.mockRestore();
        });

        test('should determine non-critical paths', async () => {
            const isCritical = await buildRecovery.isCriticalPath('/some/path');
            expect(isCritical).toBe(false);
        });
    });

    describe('Legacy Method Compatibility', () => {
        test('should support legacy performBuildRecovery method', async () => {
            buildRecovery.performEnhancedBuildRecovery = jest.fn().mockResolvedValue({ success: true });

            const result = await buildRecovery.performBuildRecovery();

            expect(buildRecovery.performEnhancedBuildRecovery).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        test('should support legacy performCleanup method', async () => {
            buildRecovery.performEnhancedCleanup = jest.fn().mockResolvedValue({ success: true });

            const result = await buildRecovery.performCleanup();

            expect(buildRecovery.performEnhancedCleanup).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });
    });
});