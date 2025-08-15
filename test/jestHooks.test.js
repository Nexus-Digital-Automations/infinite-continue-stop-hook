const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { 
    JestNodeModulesHooks, 
    createGlobalSetup, 
    createGlobalTeardown, 
    NodeModulesTestEnvironment 
} = require('../lib/jestHooks');

// Mock dependencies
jest.mock('../lib/nodeModulesMonitor');
jest.mock('fs');

const NodeModulesMonitor = require('../lib/nodeModulesMonitor');

describe('JestNodeModulesHooks', () => {
    let hooks;
    let mockMonitor;
    let testProjectPath;
    let originalConsoleLog;

    beforeEach(() => {
        // Setup test project path
        testProjectPath = path.join(os.tmpdir(), `test-jest-hooks-${Date.now()}`);
        
        // Create mock monitor
        mockMonitor = {
            startMonitoring: jest.fn(),
            stopMonitoring: jest.fn(),
            checkIntegrity: jest.fn(),
            restoreCorruptedFiles: jest.fn(),
            generateReport: jest.fn(),
            criticalFiles: ['exit.js', 'jest-worker'],
            monitoringActive: false
        };
        
        // Mock NodeModulesMonitor constructor
        NodeModulesMonitor.mockImplementation(() => mockMonitor);
        
        // Mock fs promises
        fs.writeFile = jest.fn().mockResolvedValue();
        fs.mkdir = jest.fn().mockResolvedValue();
        fs.unlink = jest.fn().mockResolvedValue();
        
        // Capture console output
        originalConsoleLog = console.log;
        console.log = jest.fn();
        
        hooks = new JestNodeModulesHooks({
            projectRoot: testProjectPath,
            reportFile: 'test-report.json',
            verboseLogging: true
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        console.log = originalConsoleLog;
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with default options', () => {
            const defaultHooks = new JestNodeModulesHooks();
            
            expect(NodeModulesMonitor).toHaveBeenCalledWith({
                projectRoot: process.cwd(),
                enableBackup: true,
                enableRestore: true,
                enableDetailed: false
            });
            
            expect(defaultHooks.config.failOnViolations).toBe(true);
            expect(defaultHooks.config.verboseLogging).toBe(false);
        });

        test('should initialize with custom options', () => {
            const customOptions = {
                projectRoot: '/custom/path',
                enableBackup: false,
                reportFile: 'custom-report.json',
                failOnViolations: false,
                verboseLogging: true
            };
            
            const customHooks = new JestNodeModulesHooks(customOptions);
            
            expect(customHooks.config.reportFile).toBe('custom-report.json');
            expect(customHooks.config.failOnViolations).toBe(false);
            expect(customHooks.config.verboseLogging).toBe(true);
        });

        test('should initialize test run data', () => {
            expect(hooks.testRunData.startTime).toBeNull();
            expect(hooks.testRunData.endTime).toBeNull();
            expect(hooks.testRunData.violations).toEqual([]);
            expect(hooks.testRunData.restored).toEqual([]);
        });

        test('should initialize setup status', () => {
            expect(hooks.setupComplete).toBe(false);
        });
    });

    describe('Global Setup', () => {
        test('should perform global setup successfully', async () => {
            mockMonitor.startMonitoring.mockResolvedValue({
                filesMonitored: 150,
                timestamp: new Date().toISOString()
            });

            const result = await hooks.globalSetup();

            expect(mockMonitor.startMonitoring).toHaveBeenCalled();
            expect(hooks.setupComplete).toBe(true);
            expect(hooks.testRunData.startTime).toBeDefined();
            expect(fs.writeFile).toHaveBeenCalled();
            expect(result.filesMonitored).toBe(150);
        });

        test('should create monitoring state file', async () => {
            mockMonitor.startMonitoring.mockResolvedValue({
                filesMonitored: 100,
                timestamp: new Date().toISOString()
            });

            await hooks.globalSetup();

            const expectedStatePath = path.join(process.cwd(), '.jest-monitor-state.json');
            expect(fs.writeFile).toHaveBeenCalledWith(
                expectedStatePath,
                expect.stringContaining('"monitoringActive":true')
            );
        });

        test('should handle setup errors', async () => {
            mockMonitor.startMonitoring.mockRejectedValue(new Error('Setup failed'));

            await expect(hooks.globalSetup()).rejects.toThrow('Setup failed');
            expect(hooks.setupComplete).toBe(false);
        });

        test('should log setup progress', async () => {
            mockMonitor.startMonitoring.mockResolvedValue({
                filesMonitored: 50,
                timestamp: new Date().toISOString()
            });

            await hooks.globalSetup();

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('[JestNodeModulesHooks]'),
                expect.stringContaining('monitoring')
            );
        });
    });

    describe('Global Teardown', () => {
        beforeEach(async () => {
            hooks.setupComplete = true;
            hooks.testRunData.startTime = new Date().toISOString();
        });

        test('should perform teardown with no violations', async () => {
            mockMonitor.checkIntegrity.mockResolvedValue({
                violations: [],
                filesChecked: 100
            });
            mockMonitor.stopMonitoring.mockResolvedValue();

            const result = await hooks.globalTeardown();

            expect(result.success).toBe(true);
            expect(result.violations).toEqual([]);
            expect(result.filesChecked).toBe(100);
            expect(mockMonitor.stopMonitoring).toHaveBeenCalled();
            expect(fs.unlink).toHaveBeenCalled();
        });

        test('should handle violations and restore files', async () => {
            const violations = [
                { type: 'CHECKSUM_MISMATCH', file: 'corrupted.js' },
                { type: 'UNEXPECTED_FILE', file: 'extra.js' }
            ];

            mockMonitor.checkIntegrity.mockResolvedValue({
                violations,
                filesChecked: 100
            });
            mockMonitor.restoreCorruptedFiles.mockResolvedValue({
                restored: 1,
                files: ['corrupted.js']
            });
            mockMonitor.generateReport.mockReturnValue({ status: 'complete' });

            const result = await hooks.globalTeardown();

            expect(result.success).toBe(false);
            expect(result.violations).toEqual(violations);
            expect(result.restored).toEqual(['corrupted.js']);
            expect(mockMonitor.restoreCorruptedFiles).toHaveBeenCalled();
        });

        test('should fail when failOnViolations is true and violations exist', async () => {
            hooks.config.failOnViolations = true;
            mockMonitor.checkIntegrity.mockResolvedValue({
                violations: [{ type: 'CHECKSUM_MISMATCH', file: 'test.js' }],
                filesChecked: 100
            });
            mockMonitor.restoreCorruptedFiles.mockResolvedValue({
                restored: 0,
                files: []
            });
            mockMonitor.generateReport.mockReturnValue({});

            await expect(hooks.globalTeardown()).rejects.toThrow('integrity violations detected');
        });

        test('should skip teardown when setup was not completed', async () => {
            hooks.setupComplete = false;

            const result = await hooks.globalTeardown();

            expect(result.skipped).toBe(true);
            expect(mockMonitor.checkIntegrity).not.toHaveBeenCalled();
        });

        test('should handle teardown errors gracefully', async () => {
            mockMonitor.checkIntegrity.mockRejectedValue(new Error('Integrity check failed'));

            await expect(hooks.globalTeardown()).rejects.toThrow('Integrity check failed');
        });

        test('should calculate test duration', async () => {
            const startTime = new Date('2023-01-01T10:00:00Z');
            const _endTime = new Date('2023-01-01T10:05:30Z');
            
            hooks.testRunData.startTime = startTime.toISOString();
            
            mockMonitor.checkIntegrity.mockResolvedValue({
                violations: [],
                filesChecked: 50
            });
            mockMonitor.stopMonitoring.mockResolvedValue();

            const result = await hooks.globalTeardown();

            expect(result.duration).toBeGreaterThan(0);
        });
    });

    describe('Individual Test Hooks', () => {
        test('should setup individual test', async () => {
            const testFilePath = '/project/test/example.test.js';
            
            const result = await hooks.setupTest(testFilePath);

            expect(result.testFile).toBe(testFilePath);
            expect(result.timestamp).toBeDefined();
        });

        test('should teardown individual test', async () => {
            const testFilePath = '/project/test/example.test.js';
            
            const result = await hooks.teardownTest(testFilePath);

            expect(result.testFile).toBe(testFilePath);
            expect(result.timestamp).toBeDefined();
        });

        test('should log verbose messages for individual tests', async () => {
            hooks.config.verboseLogging = true;
            const testFilePath = '/project/test/example.test.js';

            await hooks.setupTest(testFilePath);
            await hooks.teardownTest(testFilePath);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Starting test file'),
                expect.stringContaining('example.test.js')
            );
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Completed test file'),
                expect.stringContaining('example.test.js')
            );
        });
    });

    describe('Emergency Integrity Check', () => {
        test('should perform emergency check when setup is complete', async () => {
            hooks.setupComplete = true;
            mockMonitor.checkIntegrity.mockResolvedValue({
                violations: [],
                filesChecked: 75
            });

            const result = await hooks.emergencyIntegrityCheck();

            expect(result.violations).toEqual([]);
            expect(result.filesChecked).toBe(75);
            expect(mockMonitor.checkIntegrity).toHaveBeenCalled();
        });

        test('should generate emergency report when violations found', async () => {
            hooks.setupComplete = true;
            const violations = [{ type: 'CHECKSUM_MISMATCH', file: 'emergency.js' }];
            
            mockMonitor.checkIntegrity.mockResolvedValue({
                violations,
                filesChecked: 50
            });
            mockMonitor.generateReport.mockReturnValue({ status: 'emergency' });

            const result = await hooks.emergencyIntegrityCheck();

            expect(result.violations).toEqual(violations);
            expect(fs.mkdir).toHaveBeenCalled();
            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('emergency-integrity-report.json'),
                expect.stringContaining('EMERGENCY_CHECK')
            );
        });

        test('should fail when monitoring not initialized', async () => {
            hooks.setupComplete = false;

            await expect(hooks.emergencyIntegrityCheck()).rejects.toThrow('Monitoring not initialized');
        });

        test('should handle emergency check errors', async () => {
            hooks.setupComplete = true;
            mockMonitor.checkIntegrity.mockRejectedValue(new Error('Emergency check failed'));

            await expect(hooks.emergencyIntegrityCheck()).rejects.toThrow('Emergency check failed');
        });
    });

    describe('Monitoring Status', () => {
        test('should return monitoring status', () => {
            hooks.setupComplete = true;
            hooks.testRunData.violations = [{ type: 'test', file: 'test.js' }];
            mockMonitor.monitoringActive = true;

            const status = hooks.getMonitoringStatus();

            expect(status.setupComplete).toBe(true);
            expect(status.monitoringActive).toBe(true);
            expect(status.testRunData.violations).toHaveLength(1);
            expect(status.config).toBeDefined();
        });
    });

    describe('Report Generation', () => {
        beforeEach(() => {
            hooks.testRunData.startTime = new Date('2023-01-01T10:00:00Z').toISOString();
            hooks.testRunData.endTime = new Date('2023-01-01T10:05:00Z').toISOString();
        });

        test('should generate comprehensive integrity report', async () => {
            const integrityResult = {
                violations: [{ type: 'CHECKSUM_MISMATCH', file: 'corrupted.js' }],
                filesChecked: 100
            };
            const restoreResult = { restored: 1, files: ['corrupted.js'] };
            
            mockMonitor.generateReport.mockReturnValue({ status: 'complete' });

            const report = await hooks.generateIntegrityReport(integrityResult, restoreResult);

            expect(report.testRun.duration).toBe(300); // 5 minutes
            expect(report.integrity).toBe(integrityResult);
            expect(report.restoration).toBe(restoreResult);
            expect(report.recommendations).toBeDefined();
            expect(fs.writeFile).toHaveBeenCalled();
        });

        test('should generate recommendations for violations', () => {
            const integrityResult = {
                violations: [
                    { type: 'CHECKSUM_MISMATCH', file: 'corrupted.js' },
                    { type: 'UNEXPECTED_FILE', file: 'extra.js' }
                ]
            };

            const recommendations = hooks.generateRecommendations(integrityResult);

            expect(recommendations).toHaveLength(2);
            expect(recommendations[0].type).toBe('CORRUPTED_FILES');
            expect(recommendations[1].type).toBe('UNEXPECTED_FILES');
        });

        test('should generate success recommendations for clean results', () => {
            const integrityResult = { violations: [] };

            const recommendations = hooks.generateRecommendations(integrityResult);

            expect(recommendations).toHaveLength(1);
            expect(recommendations[0].type).toBe('SUCCESS');
            expect(recommendations[0].priority).toBe('info');
        });

        test('should identify critical file violations', () => {
            const integrityResult = {
                violations: [
                    { type: 'CHECKSUM_MISMATCH', file: 'node_modules/exit.js' },
                    { type: 'CHECKSUM_MISMATCH', file: 'regular.js' }
                ]
            };

            const recommendations = hooks.generateRecommendations(integrityResult);

            const criticalRec = recommendations.find(r => r.type === 'CRITICAL_FILES');
            expect(criticalRec).toBeDefined();
            expect(criticalRec.priority).toBe('critical');
        });

        test('should handle report generation errors', async () => {
            fs.writeFile.mockRejectedValue(new Error('Write failed'));

            await expect(hooks.generateIntegrityReport({}, {})).rejects.toThrow('Write failed');
        });
    });

    describe('Utility Methods', () => {
        test('should calculate duration correctly', () => {
            hooks.testRunData.startTime = new Date('2023-01-01T10:00:00Z').toISOString();
            hooks.testRunData.endTime = new Date('2023-01-01T10:03:30Z').toISOString();

            const duration = hooks.calculateDuration();

            expect(duration).toBe(210); // 3.5 minutes = 210 seconds
        });

        test('should return null duration when times not set', () => {
            hooks.testRunData.startTime = null;
            hooks.testRunData.endTime = null;

            const duration = hooks.calculateDuration();

            expect(duration).toBeNull();
        });

        test('should log messages with appropriate formatting', () => {
            hooks.log('Test message', { data: 'value' }, 'error');

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('❌ [JestNodeModulesHooks] Test message'),
                { data: 'value' }
            );
        });

        test('should log simple messages without data', () => {
            hooks.log('Simple message');

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('ℹ️ [JestNodeModulesHooks] Simple message')
            );
        });
    });
});

describe('Jest Integration Helpers', () => {
    let mockMonitor;

    beforeEach(() => {
        mockMonitor = {
            startMonitoring: jest.fn().mockResolvedValue({ filesMonitored: 100 }),
            stopMonitoring: jest.fn().mockResolvedValue(),
            checkIntegrity: jest.fn().mockResolvedValue({ violations: [], filesChecked: 100 }),
            restoreCorruptedFiles: jest.fn().mockResolvedValue({ restored: 0, files: [] }),
            generateReport: jest.fn().mockReturnValue({ status: 'complete' }),
            criticalFiles: [],
            monitoringActive: false
        };
        
        NodeModulesMonitor.mockImplementation(() => mockMonitor);
        fs.writeFile = jest.fn().mockResolvedValue();
        fs.mkdir = jest.fn().mockResolvedValue();
        fs.unlink = jest.fn().mockResolvedValue();
    });

    afterEach(() => {
        delete global.__nodeModulesHooks;
        jest.clearAllMocks();
    });

    describe('createGlobalSetup', () => {
        test('should create global setup function', async () => {
            const setupFn = createGlobalSetup({ enableBackup: false });
            
            const result = await setupFn();

            expect(global.__nodeModulesHooks).toBeInstanceOf(JestNodeModulesHooks);
            expect(result.filesMonitored).toBe(100);
        });

        test('should pass options to hooks constructor', async () => {
            const options = { projectRoot: '/custom', verboseLogging: true };
            const setupFn = createGlobalSetup(options);
            
            await setupFn();

            expect(global.__nodeModulesHooks.config.verboseLogging).toBe(true);
        });
    });

    describe('createGlobalTeardown', () => {
        test('should create global teardown function', async () => {
            // Setup hooks first
            global.__nodeModulesHooks = new JestNodeModulesHooks();
            global.__nodeModulesHooks.setupComplete = true;
            global.__nodeModulesHooks.testRunData.startTime = new Date().toISOString();

            const teardownFn = createGlobalTeardown();
            const result = await teardownFn();

            expect(result.success).toBe(true);
            expect(result.violations).toEqual([]);
        });

        test('should handle missing hooks gracefully', async () => {
            global.__nodeModulesHooks = undefined;
            
            const teardownFn = createGlobalTeardown();
            const result = await teardownFn();

            expect(result.skipped).toBe(true);
            expect(result.reason).toBe('hooks_not_found');
        });
    });

    describe('NodeModulesTestEnvironment', () => {
        let testEnvironment;
        let mockConfig;
        let mockContext;

        beforeEach(() => {
            mockConfig = {
                projectConfig: {
                    testEnvironmentOptions: {
                        verboseLogging: true
                    }
                }
            };
            mockContext = {
                testPath: '/project/test/example.test.js'
            };

            testEnvironment = new NodeModulesTestEnvironment(mockConfig, mockContext);
        });

        test('should initialize with config and context', () => {
            expect(testEnvironment.config).toBe(mockConfig);
            expect(testEnvironment.context).toBe(mockContext);
            expect(testEnvironment.hooks).toBeInstanceOf(JestNodeModulesHooks);
        });

        test('should setup individual test', async () => {
            const setupSpy = jest.spyOn(testEnvironment.hooks, 'setupTest').mockResolvedValue({});
            
            await testEnvironment.setup();

            expect(setupSpy).toHaveBeenCalledWith('/project/test/example.test.js');
        });

        test('should teardown individual test', async () => {
            const teardownSpy = jest.spyOn(testEnvironment.hooks, 'teardownTest').mockResolvedValue({});
            
            await testEnvironment.teardown();

            expect(teardownSpy).toHaveBeenCalledWith('/project/test/example.test.js');
        });

        test('should handle setup without test path', async () => {
            testEnvironment.context.testPath = null;
            const setupSpy = jest.spyOn(testEnvironment.hooks, 'setupTest');
            
            await testEnvironment.setup();

            expect(setupSpy).not.toHaveBeenCalled();
        });

        test('should return null VM context', () => {
            const vmContext = testEnvironment.getVmContext();
            expect(vmContext).toBeNull();
        });

        test('should handle test events', async () => {
            const testStartEvent = { name: 'test_start' };
            const testDoneEvent = { name: 'test_done' };

            // These should not throw
            await testEnvironment.handleTestEvent(testStartEvent, {});
            await testEnvironment.handleTestEvent(testDoneEvent, {});
        });
    });
});