/**
 * Test Suite for NodeModulesMonitor
 * 
 * Comprehensive tests for the node_modules file integrity monitoring system.
 * Tests cover checksum generation, corruption detection, backup/restore functionality,
 * and integration with test lifecycle.
 */

const NodeModulesMonitor = require('../lib/nodeModulesMonitor');
const fs = require('fs');
const path = require('path');

describe('NodeModulesMonitor', () => {
    let monitor;
    let testDir;
    let mockNodeModules;
    
    beforeEach(() => {
        // Create isolated test environment with better path handling
        const testId = `monitor_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        testDir = path.resolve('.test-isolated', testId);
        mockNodeModules = path.join(testDir, 'node_modules');
        
        // Ensure parent directories exist with error handling
        try {
            // Create the full directory structure in correct order
            if (!fs.existsSync(path.dirname(testDir))) {
                fs.mkdirSync(path.dirname(testDir), { recursive: true });
            }
            
            if (!fs.existsSync(testDir)) {
                fs.mkdirSync(testDir, { recursive: true });
            }
            
            if (!fs.existsSync(mockNodeModules)) {
                fs.mkdirSync(mockNodeModules, { recursive: true });
            }
            
            console.log(`✅ Test directories created: ${testDir}`);
        } catch (error) {
            console.error('❌ Failed to create test directories:', error.message);
            throw error; // Don't continue if we can't create directories
        }
        
        // Create mock critical files - this function will ensure directories exist
        try {
            createMockCriticalFiles(mockNodeModules);
            
            // Small delay to ensure filesystem operations complete
            // This helps with any timing issues in the test environment
            const start = Date.now();
            while (Date.now() - start < 10) {
                // 10ms delay
            }
        } catch (error) {
            console.error('❌ Failed to create mock files:', error.message);
            throw error; // Don't continue if we can't create mock files
        }
        
        // Initialize monitor with test directory and test-friendly settings
        monitor = new NodeModulesMonitor({
            projectRoot: testDir,
            enableBackup: true,
            enableRestore: true,
            enableDetailed: false,
            maxBackups: 2,
            realTimeWatch: false, // Disable real-time watching to prevent test timeouts
            autoRestore: false, // Disable auto-restore to prevent async operations
            emergencyLockdown: false // Disable emergency lockdown for tests
        });
        
        // Register cleanup with proper resource cleanup
        global.registerTestCleanup(async () => {
            try {
                // Stop monitoring to cleanup resources
                if (monitor && monitor.monitoringActive) {
                    await monitor.stopMonitoring();
                }
                
                // Clean up test directory
                if (fs.existsSync(testDir)) {
                    fs.rmSync(testDir, { recursive: true, force: true });
                }
            } catch {
                // Ignore cleanup errors
            }
        });
    });
    
    afterEach(async () => {
        // Ensure proper cleanup of resources after each test
        if (monitor) {
            try {
                // Stop monitoring and clean up watchers
                if (monitor.monitoringActive) {
                    await monitor.stopMonitoring();
                }
                
                // Force cleanup of any remaining watchers
                monitor.stopRealTimeWatching();
            } catch (error) {
                // Ignore cleanup errors but log them for debugging
                console.warn('Cleanup warning:', error.message);
            }
        }
        
        // Clear any remaining timers and force cleanup
        if (global._timers && global._timers.length > 0) {
            global._timers.forEach(timer => {
                try {
                    if (timer && typeof timer.unref === 'function') {
                        timer.unref();
                    }
                } catch {
                    // Ignore cleanup errors
                }
            });
            global._timers.length = 0;
        }
    });
    
    function createMockCriticalFiles(nodeModulesPath) {
        // Use require to get fresh fs methods that work with filesystem protection
        const fs = require('fs');
        const path = require('path');
        
        console.log(`Creating mock files in: ${nodeModulesPath}`);
        
        try {
            // Ensure the base node_modules directory exists first
            if (!fs.existsSync(nodeModulesPath)) {
                fs.mkdirSync(nodeModulesPath, { recursive: true });
                console.log(`✅ Created base directory: ${nodeModulesPath}`);
            }
            
            // Helper function to safely create file with error handling
            function safeWriteFile(filePath, content, description) {
                try {
                    // Ensure parent directory exists
                    const parentDir = path.dirname(filePath);
                    if (!fs.existsSync(parentDir)) {
                        fs.mkdirSync(parentDir, { recursive: true });
                        console.log(`📁 Created parent directory: ${parentDir}`);
                    }
                    
                    // Write the file
                    fs.writeFileSync(filePath, content);
                    
                    // Immediately verify the file exists
                    if (fs.existsSync(filePath)) {
                        console.log(`✅ Created ${description} at ${filePath}`);
                        return true;
                    } else {
                        console.error(`❌ File not found after write: ${filePath}`);
                        return false;
                    }
                } catch (error) {
                    console.error(`❌ Failed to write ${description}: ${error.message}`);
                    console.error(`❌ Path: ${filePath}`);
                    console.error(`❌ Error details:`, error);
                    return false;
                }
            }
            
            const creationResults = [];
            
            // Create exit directory structure and files
            const exitDir = path.join(nodeModulesPath, 'exit');
            const exitLibDir = path.join(exitDir, 'lib');
            const exitJsPath = path.join(exitLibDir, 'exit.js');
            const exitPackagePath = path.join(exitDir, 'package.json');
            
            creationResults.push(safeWriteFile(
                exitJsPath,
                'module.exports = function exit() { process.exit(); };',
                'exit.js'
            ));
            
            creationResults.push(safeWriteFile(
                exitPackagePath,
                JSON.stringify({ name: 'exit', version: '0.1.2' }, null, 2),
                'exit package.json'
            ));
            
            // Create jest-worker directory structure and files
            const jestWorkerDir = path.join(nodeModulesPath, 'jest-worker');
            const jestWorkerBuildDir = path.join(jestWorkerDir, 'build');
            const jestWorkerPath = path.join(jestWorkerBuildDir, 'index.js');
            const jestWorkerPackagePath = path.join(jestWorkerDir, 'package.json');
            
            creationResults.push(safeWriteFile(
                jestWorkerPath,
                'module.exports = { Worker: class Worker {} };',
                'jest-worker index.js'
            ));
            
            creationResults.push(safeWriteFile(
                jestWorkerPackagePath,
                JSON.stringify({ name: 'jest-worker', version: '29.7.0' }, null, 2),
                'jest-worker package.json'
            ));
            
            // Create jest directory and package.json
            const jestDir = path.join(nodeModulesPath, 'jest');
            const jestPackagePath = path.join(jestDir, 'package.json');
            
            creationResults.push(safeWriteFile(
                jestPackagePath,
                JSON.stringify({ name: 'jest', version: '29.7.0' }, null, 2),
                'jest package.json'
            ));
            
            // Create istanbul-lib-report directory structure and files
            const istanbulDir = path.join(nodeModulesPath, 'istanbul-lib-report');
            const istanbulIndexPath = path.join(istanbulDir, 'index.js');
            const istanbulPackagePath = path.join(istanbulDir, 'package.json');
            
            creationResults.push(safeWriteFile(
                istanbulIndexPath,
                'module.exports = { createContext: () => ({}) };',
                'istanbul index.js'
            ));
            
            creationResults.push(safeWriteFile(
                istanbulPackagePath,
                JSON.stringify({ name: 'istanbul-lib-report', version: '3.0.1' }, null, 2),
                'istanbul package.json'
            ));
            
            // Check results
            const failedCreations = creationResults.filter(result => !result);
            if (failedCreations.length > 0) {
                throw new Error(`Failed to create ${failedCreations.length} files out of ${creationResults.length}`);
            }
            
            console.log(`✅ Successfully created all ${creationResults.length} mock critical files for NodeModulesMonitor test`);
            
        } catch (error) {
            console.error('❌ Failed to create mock critical files:', error.message);
            console.error('❌ Stack trace:', error.stack);
            throw error;
        }
    }
    
    describe('initialization', () => {
        it('should initialize with default configuration', () => {
            const defaultMonitor = new NodeModulesMonitor();
            
            expect(defaultMonitor.projectRoot).toBe(process.cwd());
            expect(defaultMonitor.config.enableBackup).toBe(true);
            expect(defaultMonitor.config.enableRestore).toBe(true);
            expect(defaultMonitor.config.maxBackups).toBe(3);
            expect(defaultMonitor.config.checksumAlgorithm).toBe('sha256');
        });
        
        it('should initialize with custom configuration', () => {
            const customMonitor = new NodeModulesMonitor({
                projectRoot: '/custom/path',
                enableBackup: false,
                maxBackups: 5,
                checksumAlgorithm: 'md5'
            });
            
            expect(customMonitor.projectRoot).toBe('/custom/path');
            expect(customMonitor.config.enableBackup).toBe(false);
            expect(customMonitor.config.maxBackups).toBe(5);
            expect(customMonitor.config.checksumAlgorithm).toBe('md5');
        });
        
        it('should set up critical files list', () => {
            expect(monitor.criticalFiles).toContain('exit/lib/exit.js');
            expect(monitor.criticalFiles).toContain('jest-worker/build/index.js');
            expect(monitor.criticalFiles).toContain('jest/package.json');
            expect(monitor.criticalFiles).toContain('exit/package.json');
        });
    });
    
    describe('startMonitoring', () => {
        it('should start monitoring successfully', async () => {
            // Debug: Check what files actually exist before starting monitoring
            console.log('=== DEBUG: File existence check ===');
            console.log('testDir:', testDir);
            console.log('mockNodeModules:', mockNodeModules);
            console.log('monitor.nodeModulesPath:', monitor.nodeModulesPath);
            console.log('monitor.criticalFiles:', monitor.criticalFiles);
            
            for (const file of monitor.criticalFiles) {
                const fullPath = path.join(mockNodeModules, file);
                const monitorPath = path.join(monitor.nodeModulesPath, file);
                console.log(`File: ${file}`);
                console.log(`  Expected at: ${fullPath} (exists: ${fs.existsSync(fullPath)})`);
                console.log(`  Monitor looks at: ${monitorPath} (exists: ${fs.existsSync(monitorPath)})`);
                console.log(`  Paths match: ${fullPath === monitorPath}`);
            }
            console.log('=== END DEBUG ===');
            
            const result = await monitor.startMonitoring();
            
            expect(result.success).toBe(true);
            expect(result.filesMonitored).toBeGreaterThan(0);
            expect(result.timestamp).toBeDefined();
            expect(monitor.monitoringActive).toBe(true);
            expect(monitor.preTestChecksums.size).toBeGreaterThan(0);
        }, 15000); // Increased timeout for isolated test environment
        
        it('should generate checksums for critical files', async () => {
            await monitor.startMonitoring();
            
            const exitJsPath = path.join(mockNodeModules, 'exit', 'lib', 'exit.js');
            const jestWorkerPath = path.join(mockNodeModules, 'jest-worker', 'build', 'index.js');
            
            expect(monitor.preTestChecksums.has(exitJsPath)).toBe(true);
            expect(monitor.preTestChecksums.has(jestWorkerPath)).toBe(true);
            expect(monitor.preTestChecksums.get(exitJsPath)).toMatch(/^[a-f0-9]{64}$/); // SHA256 format
        }, 15000); // Increased timeout for checksum calculations
        
        it('should create backups when enabled', async () => {
            await monitor.startMonitoring();
            
            const backupDir = path.join(testDir, '.node-modules-backup');
            expect(fs.existsSync(backupDir)).toBe(true);
            
            // Check that backup files exist
            const backups = fs.readdirSync(backupDir);
            expect(backups.length).toBeGreaterThan(0);
            
            const latestBackup = backups[0];
            const exitBackup = path.join(backupDir, latestBackup, 'exit', 'lib', 'exit.js');
            expect(fs.existsSync(exitBackup)).toBe(true);
        }, 15000); // Increased timeout for backup operations
        
        it('should handle missing node_modules gracefully', async () => {
            // Remove node_modules
            fs.rmSync(mockNodeModules, { recursive: true, force: true });
            
            const result = await monitor.startMonitoring();
            
            expect(result.success).toBe(true);
            expect(result.filesMonitored).toBe(0);
        }, 15000); // Increased timeout for error handling
    });
    
    describe('checkIntegrity', () => {
        beforeEach(async () => {
            await monitor.startMonitoring();
        }, 15000); // Increased timeout for beforeEach setup
        
        it('should pass integrity check when no changes made', async () => {
            const result = await monitor.checkIntegrity();
            
            expect(result.success).toBe(true);
            expect(result.violations).toHaveLength(0);
            expect(result.filesChecked).toBeGreaterThan(0);
            expect(result.unexpectedFiles).toBe(0);
        });
        
        it('should detect checksum mismatches', async () => {
            // Modify a critical file
            const exitJsPath = path.join(mockNodeModules, 'exit', 'lib', 'exit.js');
            fs.writeFileSync(exitJsPath, 'module.exports = function exit() { console.log("corrupted"); };');
            
            const result = await monitor.checkIntegrity();
            
            expect(result.success).toBe(false);
            expect(result.violations).toHaveLength(1);
            expect(result.violations[0].type).toBe('CHECKSUM_MISMATCH');
            expect(result.violations[0].file).toBe(exitJsPath);
            expect(result.violations[0].originalChecksum).toBeDefined();
            expect(result.violations[0].currentChecksum).toBeDefined();
            expect(result.violations[0].originalChecksum).not.toBe(result.violations[0].currentChecksum);
        });
        
        it('should detect unexpected files', async () => {
            // Create an unexpected JSON file
            const unexpectedFile = path.join(mockNodeModules, 'exit', 'unexpected.json');
            fs.writeFileSync(unexpectedFile, '{"corrupted": true}');
            
            const result = await monitor.checkIntegrity();
            
            expect(result.success).toBe(false);
            expect(result.violations.length).toBeGreaterThanOrEqual(1);
            
            const unexpectedViolation = result.violations.find(v => v.type === 'UNEXPECTED_FILE');
            expect(unexpectedViolation).toBeDefined();
            expect(unexpectedViolation.file).toBe(unexpectedFile);
        });
        
        it('should detect multiple violations', async () => {
            // Modify a file
            const exitJsPath = path.join(mockNodeModules, 'exit', 'lib', 'exit.js');
            fs.writeFileSync(exitJsPath, 'corrupted content');
            
            // Add unexpected file
            const unexpectedFile = path.join(mockNodeModules, 'jest-worker', 'malicious.json');
            fs.writeFileSync(unexpectedFile, '{"malicious": true}');
            
            const result = await monitor.checkIntegrity();
            
            expect(result.success).toBe(false);
            expect(result.violations.length).toBeGreaterThanOrEqual(2);
            
            const checksumViolation = result.violations.find(v => v.type === 'CHECKSUM_MISMATCH');
            const unexpectedViolation = result.violations.find(v => v.type === 'UNEXPECTED_FILE');
            
            expect(checksumViolation).toBeDefined();
            expect(unexpectedViolation).toBeDefined();
        });
        
        it('should require monitoring to be started first', async () => {
            const newMonitor = new NodeModulesMonitor({ projectRoot: testDir });
            
            await expect(newMonitor.checkIntegrity()).rejects.toThrow('Monitoring not active');
        });
    });
    
    describe('restoreCorruptedFiles', () => {
        beforeEach(async () => {
            await monitor.startMonitoring();
        });
        
        it('should restore corrupted files from backup', async () => {
            const exitJsPath = path.join(mockNodeModules, 'exit', 'lib', 'exit.js');
            const originalContent = fs.readFileSync(exitJsPath, 'utf8');
            
            // Corrupt the file
            fs.writeFileSync(exitJsPath, 'corrupted content');
            
            // Check integrity to detect corruption
            await monitor.checkIntegrity();
            
            // Restore files
            const restoreResult = await monitor.restoreCorruptedFiles();
            
            expect(restoreResult.restored).toBe(1);
            expect(restoreResult.files).toContain(exitJsPath);
            expect(restoreResult.message).toContain('Restored 1 corrupted files');
            
            // Verify file was restored
            const restoredContent = fs.readFileSync(exitJsPath, 'utf8');
            expect(restoredContent).toBe(originalContent);
        });
        
        it('should handle no violations gracefully', async () => {
            const restoreResult = await monitor.restoreCorruptedFiles();
            
            expect(restoreResult.restored).toBe(0);
            expect(restoreResult.message).toBe('No corrupted files found');
        });
        
        it('should handle restore disabled', async () => {
            monitor.config.enableRestore = false;
            
            // Corrupt a file and detect it
            const exitJsPath = path.join(mockNodeModules, 'exit', 'lib', 'exit.js');
            fs.writeFileSync(exitJsPath, 'corrupted');
            await monitor.checkIntegrity();
            
            const restoreResult = await monitor.restoreCorruptedFiles();
            
            expect(restoreResult.restored).toBe(0);
            expect(restoreResult.message).toBe('Restore disabled');
        });
        
        it('should handle missing backups gracefully', async () => {
            // Remove backup directory
            const backupDir = path.join(testDir, '.node-modules-backup');
            if (fs.existsSync(backupDir)) {
                fs.rmSync(backupDir, { recursive: true, force: true });
            }
            
            // Corrupt a file
            const exitJsPath = path.join(mockNodeModules, 'exit', 'lib', 'exit.js');
            fs.writeFileSync(exitJsPath, 'corrupted');
            await monitor.checkIntegrity();
            
            await expect(monitor.restoreCorruptedFiles()).rejects.toThrow('No backups available');
        });
    });
    
    describe('generateReport', () => {
        beforeEach(async () => {
            await monitor.startMonitoring();
        });
        
        it('should generate clean report when no violations', async () => {
            await monitor.checkIntegrity();
            const report = monitor.generateReport();
            
            expect(report.timestamp).toBeDefined();
            expect(report.monitoringActive).toBe(true);
            expect(report.filesMonitored).toBeGreaterThan(0);
            expect(report.violations).toHaveLength(0);
            expect(report.summary.integrityStatus).toBe('CLEAN');
            expect(report.summary.totalViolations).toBe(0);
            expect(report.criticalFiles).toBeDefined();
            expect(report.criticalFiles.every(cf => cf.status === 'CLEAN')).toBe(true);
        });
        
        it('should generate detailed report with violations', async () => {
            // Create violations
            const exitJsPath = path.join(mockNodeModules, 'exit', 'lib', 'exit.js');
            fs.writeFileSync(exitJsPath, 'corrupted');
            
            await monitor.checkIntegrity();
            const report = monitor.generateReport();
            
            expect(report.summary.integrityStatus).toBe('COMPROMISED');
            expect(report.summary.totalViolations).toBeGreaterThan(0);
            expect(report.summary.corruptedFiles).toBeGreaterThan(0);
            
            const criticalFileStatus = report.criticalFiles.find(cf => cf.file === 'exit/lib/exit.js');
            expect(criticalFileStatus.status).toBe('COMPROMISED');
            expect(criticalFileStatus.violation).toBeDefined();
        });
    });
    
    describe('stopMonitoring', () => {
        it('should stop monitoring successfully', async () => {
            await monitor.startMonitoring();
            expect(monitor.monitoringActive).toBe(true);
            
            const result = await monitor.stopMonitoring();
            
            expect(result.success).toBe(true);
            expect(result.timestamp).toBeDefined();
            expect(monitor.monitoringActive).toBe(false);
        });
        
        it('should save checksums when stopping', async () => {
            await monitor.startMonitoring();
            await monitor.stopMonitoring();
            
            const checksumFile = path.join(testDir, '.node-modules-checksums.json');
            expect(fs.existsSync(checksumFile)).toBe(true);
            
            const checksumData = JSON.parse(fs.readFileSync(checksumFile, 'utf8'));
            expect(checksumData.timestamp).toBeDefined();
            expect(checksumData.checksums).toBeDefined();
            expect(checksumData.algorithm).toBe('sha256');
        });
    });
    
    describe('backup management', () => {
        beforeEach(async () => {
            await monitor.startMonitoring();
        });
        
        it('should cleanup old backups when limit exceeded', async () => {
            const backupDir = path.join(testDir, '.node-modules-backup');
            
            // Create multiple monitoring sessions to generate backups
            for (let i = 0; i < 4; i++) {
                const newMonitor = new NodeModulesMonitor({
                    projectRoot: testDir,
                    maxBackups: 2
                });
                await newMonitor.startMonitoring();
                await newMonitor.stopMonitoring();
                
                // Small delay to ensure different timestamps
                await new Promise(resolve => {
                    const timeoutId = global.setTimeout(resolve, 10);
                    timeoutId.unref();
                });
            }
            
            const backups = fs.readdirSync(backupDir);
            expect(backups.length).toBeLessThanOrEqual(2);
        });
        
        it('should maintain backup chronological order', async () => {
            // Clean up any existing backups first
            const backupDir = path.join(testDir, '.node-modules-backup');
            if (fs.existsSync(backupDir)) {
                fs.rmSync(backupDir, { recursive: true, force: true });
            }
            
            const newMonitor1 = new NodeModulesMonitor({ 
                projectRoot: testDir,
                maxBackups: 2
            });
            await newMonitor1.startMonitoring();
            await newMonitor1.stopMonitoring();
            
            await new Promise(resolve => {
                const timeoutId = global.setTimeout(resolve, 10);
                timeoutId.unref();
            });
            
            const newMonitor2 = new NodeModulesMonitor({ 
                projectRoot: testDir,
                maxBackups: 2
            });
            await newMonitor2.startMonitoring();
            await newMonitor2.stopMonitoring();
            
            const backups = await newMonitor2.getAvailableBackups();
            expect(backups.length).toBe(2);
            
            // Backups should be sorted by date, newest first
            // Convert backup names (ISO timestamp with dashes) back to valid ISO format
            // Format: "2023-01-01T12-30-45.123Z" -> "2023-01-01T12:30:45.123Z"
            const backup1Time = new Date(backups[0].replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3'));
            const backup2Time = new Date(backups[1].replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3'));
            expect(backup1Time.getTime()).toBeGreaterThanOrEqual(backup2Time.getTime());
        });
    });
    
    describe('error handling', () => {
        it('should handle permission errors gracefully', async () => {
            // Mock fs.createReadStream to simulate permission error
            const originalCreateReadStream = fs.createReadStream;
            fs.createReadStream = jest.fn().mockImplementation(() => {
                const { EventEmitter } = require('events');
                const stream = new EventEmitter();
                const timeoutId = global.setTimeout(() => stream.emit('error', new Error('EACCES: permission denied')), 0);
                timeoutId.unref();
                return stream;
            });
            
            try {
                await expect(monitor.startMonitoring()).rejects.toThrow();
            } finally {
                fs.createReadStream = originalCreateReadStream;
            }
        });
        
        it('should handle corrupted backup files', async () => {
            await monitor.startMonitoring();
            
            // Corrupt a file
            const exitJsPath = path.join(mockNodeModules, 'exit', 'lib', 'exit.js');
            fs.writeFileSync(exitJsPath, 'corrupted');
            await monitor.checkIntegrity();
            
            // Corrupt the backup
            const backupDir = path.join(testDir, '.node-modules-backup');
            const backups = fs.readdirSync(backupDir);
            const backupFile = path.join(backupDir, backups[0], 'exit', 'lib', 'exit.js');
            fs.writeFileSync(backupFile, 'also corrupted');
            
            // Restoration should still complete without throwing
            const restoreResult = await monitor.restoreCorruptedFiles();
            expect(restoreResult.restored).toBe(1); // It will restore the corrupted backup
        });
    });
    
    describe('performance', () => {
        it('should complete monitoring setup quickly', async () => {
            const startTime = Date.now();
            await monitor.startMonitoring();
            const duration = Date.now() - startTime;
            
            expect(duration).toBeLessThan(1000); // Should complete within 1 second
        });
        
        it('should handle large numbers of files efficiently', async () => {
            // Create many files to test performance
            const testPackage = path.join(mockNodeModules, 'large-package');
            fs.mkdirSync(testPackage, { recursive: true });
            
            for (let i = 0; i < 50; i++) {
                fs.writeFileSync(path.join(testPackage, `file${i}.js`), `module.exports = ${i};`);
            }
            
            const detailedMonitor = new NodeModulesMonitor({
                projectRoot: testDir,
                enableDetailed: true
            });
            
            const startTime = Date.now();
            await detailedMonitor.startMonitoring();
            const setupDuration = Date.now() - startTime;
            
            const checkStart = Date.now();
            await detailedMonitor.checkIntegrity();
            const checkDuration = Date.now() - checkStart;
            
            expect(setupDuration).toBeLessThan(2000); // 2 seconds max for setup
            expect(checkDuration).toBeLessThan(1000); // 1 second max for check
        });
    });
});