#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Auto-Fix Functionality
 * 
 * Tests all components of the TODO.json auto-fix system including
 * validator, error recovery, auto-fixer engine, and CLI tool.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const TodoValidator = require('./lib/todoValidator');
const ErrorRecovery = require('./lib/errorRecovery');
const AutoFixer = require('./lib/autoFixer');
const TaskManager = require('./lib/taskManager');

class AutoFixTestSuite {
    constructor() {
        this.testDir = path.join(__dirname, 'test-temp');
        this.validator = new TodoValidator();
        this.recovery = new ErrorRecovery();
        this.autoFixer = new AutoFixer();
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    async runAllTests() {
        console.log('🧪 Starting Auto-Fix Test Suite\n');
        
        try {
            // Setup test environment
            await this._setupTestEnvironment();
            
            // Run test categories
            await this._runValidatorTests();
            await this._runErrorRecoveryTests();
            await this._runAutoFixerTests();
            await this._runTaskManagerTests();
            await this._runCLITests();
            await this._runIntegrationTests();
            
            // Show results
            this._showResults();
            
        } catch (error) {
            console.error(`💥 Test suite failed: ${error.message}`);
            process.exit(1);
        } finally {
            // Cleanup
            await this._cleanup();
        }
    }

    async _setupTestEnvironment() {
        console.log('📁 Setting up test environment...');
        
        // Create test directory
        if (fs.existsSync(this.testDir)) {
            fs.rmSync(this.testDir, { recursive: true, force: true });
        }
        fs.mkdirSync(this.testDir, { recursive: true });
        
        console.log('✅ Test environment ready\n');
    }

    async _runValidatorTests() {
        console.log('🔍 Testing TodoValidator...');
        
        await this._test('Validator: Valid TODO.json', async () => {
            const validData = {
                project: 'test-project',
                tasks: [{
                    id: 'task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Test task',
                    status: 'pending'
                }],
                review_strikes: 0,
                strikes_completed_last_run: false,
                current_task_index: 0
            };
            
            const result = this.validator.validateAndSanitize(validData);
            if (!result.isValid) throw new Error('Valid data marked as invalid');
            if (result.errors.length > 0) throw new Error('Valid data has errors');
        });

        await this._test('Validator: Missing required fields', async () => {
            const invalidData = {
                project: 'test-project'
                // Missing required fields
            };
            
            const result = this.validator.validateAndSanitize(invalidData);
            if (result.isValid) throw new Error('Invalid data marked as valid');
            if (result.fixes.length === 0) throw new Error('No fixes generated for missing fields');
            
            // Check that fixes were applied
            if (!result.data.tasks || !Array.isArray(result.data.tasks)) {
                throw new Error('Missing tasks field not fixed');
            }
        });

        await this._test('Validator: Invalid JSON syntax repair', async () => {
            const invalidJson = '{"project": "test",}'; // Trailing comma
            const result = this.validator.validateJsonSyntax(invalidJson);
            
            if (!result.repaired) throw new Error('JSON syntax not repaired');
            if (!result.isValid) throw new Error('Repaired JSON still invalid');
        });

        await this._test('Validator: Invalid task status correction', async () => {
            const invalidData = {
                project: 'test-project',
                tasks: [{
                    id: 'task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Test task',
                    status: 'invalid-status'
                }],
                review_strikes: 0,
                strikes_completed_last_run: false,
                current_task_index: 0
            };
            
            const result = this.validator.validateAndSanitize(invalidData);
            if (result.data.tasks[0].status !== 'pending') {
                throw new Error('Invalid status not corrected');
            }
        });

        await this._test('Validator: Duplicate ID resolution', async () => {
            const invalidData = {
                project: 'test-project',
                tasks: [
                    { id: 'task-1', mode: 'DEVELOPMENT', description: 'Task 1', status: 'pending' },
                    { id: 'task-1', mode: 'TESTING', description: 'Task 2', status: 'pending' }
                ],
                review_strikes: 0,
                strikes_completed_last_run: false,
                current_task_index: 0
            };
            
            const result = this.validator.validateAndSanitize(invalidData);
            const ids = result.data.tasks.map(t => t.id);
            const uniqueIds = [...new Set(ids)];
            
            if (ids.length !== uniqueIds.length) {
                throw new Error('Duplicate IDs not resolved');
            }
        });

        console.log('✅ TodoValidator tests completed\n');
    }

    async _runErrorRecoveryTests() {
        console.log('🔄 Testing ErrorRecovery...');
        
        await this._test('Recovery: Create and list backups', async () => {
            const testFile = path.join(this.testDir, 'test-backup.json');
            const testData = { project: 'test', tasks: [] };
            fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));
            
            const backupResult = await this.recovery.createBackup(testFile);
            if (!backupResult.success) throw new Error('Backup creation failed');
            
            const backups = this.recovery.listAvailableBackups(testFile);
            if (backups.length === 0) throw new Error('Backup not listed');
        });

        await this._test('Recovery: Atomic write operation', async () => {
            const testFile = path.join(this.testDir, 'test-atomic.json');
            const testContent = JSON.stringify({ test: 'data' }, null, 2);
            
            const result = await this.recovery.atomicWrite(testFile, testContent);
            if (!result.success) throw new Error('Atomic write failed');
            
            const written = fs.readFileSync(testFile, 'utf8');
            if (written !== testContent) throw new Error('Written content mismatch');
        });

        await this._test('Recovery: File locking', async () => {
            const testFile = path.join(this.testDir, 'test-lock.json');
            fs.writeFileSync(testFile, '{}');
            
            const lock1 = await this.recovery.acquireLock(testFile);
            if (!lock1.success) throw new Error('First lock failed');
            
            const lock2 = await this.recovery.acquireLock(testFile);
            if (lock2.success) throw new Error('Second lock should have failed');
            
            const release = await this.recovery.releaseLock(testFile, lock1.lockId);
            if (!release.success) throw new Error('Lock release failed');
        });

        await this._test('Recovery: Restore from backup', async () => {
            const testFile = path.join(this.testDir, 'test-restore.json');
            const originalData = { project: 'original', tasks: [] };
            fs.writeFileSync(testFile, JSON.stringify(originalData, null, 2));
            
            // Create backup
            await this.recovery.createBackup(testFile);
            
            // Modify file
            const modifiedData = { project: 'modified', tasks: [] };
            fs.writeFileSync(testFile, JSON.stringify(modifiedData, null, 2));
            
            // Restore
            const restoreResult = await this.recovery.restoreFromBackup(testFile);
            if (!restoreResult.success) throw new Error('Restore failed');
            
            const restored = JSON.parse(fs.readFileSync(testFile, 'utf8'));
            if (restored.project !== 'original') throw new Error('Data not restored correctly');
        });

        console.log('✅ ErrorRecovery tests completed\n');
    }

    async _runAutoFixerTests() {
        console.log('🔧 Testing AutoFixer...');
        
        await this._test('AutoFixer: Complete auto-fix cycle', async () => {
            const testFile = path.join(this.testDir, 'test-autofix.json');
            const corruptData = {
                project: 'test',
                // Missing required fields
                tasks: [{
                    id: 'task-1',
                    // Missing required fields
                    status: 'invalid-status'
                }]
            };
            fs.writeFileSync(testFile, JSON.stringify(corruptData, null, 2));
            
            const result = await this.autoFixer.autoFix(testFile);
            if (!result.success) throw new Error(`Auto-fix failed: ${result.reason}`);
            if (!result.hasChanges) throw new Error('No changes applied');
            
            // Verify the file is now valid
            const fixed = JSON.parse(fs.readFileSync(testFile, 'utf8'));
            const validation = this.validator.validateAndSanitize(fixed);
            if (!validation.isValid) throw new Error('Fixed file still invalid');
        });

        await this._test('AutoFixer: Dry run functionality', async () => {
            const testFile = path.join(this.testDir, 'test-dryrun.json');
            const corruptData = { project: 'test' }; // Missing fields
            fs.writeFileSync(testFile, JSON.stringify(corruptData, null, 2));
            
            const result = await this.autoFixer.dryRun(testFile);
            if (!result.success) throw new Error('Dry run failed');
            if (!result.wouldFix) throw new Error('Dry run should detect fixes needed');
            
            // Verify file unchanged
            const unchanged = JSON.parse(fs.readFileSync(testFile, 'utf8'));
            if (unchanged.tasks) throw new Error('Dry run modified file');
        });

        await this._test('AutoFixer: File status check', async () => {
            const testFile = path.join(this.testDir, 'test-status.json');
            const invalidData = { project: 'test' }; // Missing fields
            fs.writeFileSync(testFile, JSON.stringify(invalidData, null, 2));
            
            const status = await this.autoFixer.getFileStatus(testFile);
            if (!status.exists) throw new Error('File existence not detected');
            if (status.valid) throw new Error('Invalid file marked as valid');
            if (!status.canAutoFix) throw new Error('Auto-fixable issues not detected');
        });

        await this._test('AutoFixer: Corrupted file recovery', async () => {
            const testFile = path.join(this.testDir, 'test-corrupt.json');
            fs.writeFileSync(testFile, 'invalid json content {');
            
            const result = await this.autoFixer.recoverCorruptedFile(testFile);
            if (!result.success) throw new Error('Recovery failed');
            
            // Verify file is now valid JSON
            const recovered = JSON.parse(fs.readFileSync(testFile, 'utf8'));
            if (!recovered.project) throw new Error('Recovered file missing project');
        });

        console.log('✅ AutoFixer tests completed\n');
    }

    async _runTaskManagerTests() {
        console.log('📋 Testing TaskManager with auto-fix integration...');
        
        await this._test('TaskManager: Auto-fix on read', async () => {
            const testFile = path.join(this.testDir, 'test-taskmanager.json');
            const corruptData = {
                project: 'test',
                tasks: [{
                    id: 'task-1',
                    status: 'invalid-status' // Invalid status
                }]
                // Missing required fields
            };
            fs.writeFileSync(testFile, JSON.stringify(corruptData, null, 2));
            
            const taskManager = new TaskManager(testFile, { enableAutoFix: true });
            const data = await taskManager.readTodo();
            
            // Should be auto-fixed
            if (!data.review_strikes === undefined) throw new Error('Missing fields not fixed');
            if (data.tasks[0].status === 'invalid-status') throw new Error('Invalid status not fixed');
        });

        await this._test('TaskManager: Validation methods', async () => {
            const testFile = path.join(this.testDir, 'test-validation.json');
            const validData = {
                project: 'test',
                tasks: [],
                review_strikes: 0,
                strikes_completed_last_run: false,
                current_task_index: 0
            };
            fs.writeFileSync(testFile, JSON.stringify(validData, null, 2));
            
            const taskManager = new TaskManager(testFile);
            const validation = await taskManager.validateTodoFile();
            if (!validation.isValid) throw new Error('Valid file marked invalid');
            
            const status = await taskManager.getFileStatus();
            if (!status.valid) throw new Error('Status check failed');
        });

        await this._test('TaskManager: Backup operations', async () => {
            const testFile = path.join(this.testDir, 'test-backup-ops.json');
            const testData = { project: 'test', tasks: [] };
            fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));
            
            const taskManager = new TaskManager(testFile);
            
            const backupResult = await taskManager.createBackup();
            if (!backupResult.success) throw new Error('Backup creation failed');
            
            const backups = taskManager.listBackups();
            if (backups.length === 0) throw new Error('Backup not found');
        });

        console.log('✅ TaskManager tests completed\n');
    }

    async _runCLITests() {
        console.log('💻 Testing CLI tool...');
        
        await this._test('CLI: Help and version commands', async () => {
            const cliPath = path.join(__dirname, 'auto-fix-todo.js');
            
            try {
                execSync(`node "${cliPath}" --help`, { stdio: 'pipe' });
                execSync(`node "${cliPath}" --version`, { stdio: 'pipe' });
            } catch {
                throw new Error('CLI help/version commands failed');
            }
        });

        await this._test('CLI: Status command', async () => {
            const testFile = path.join(this.testDir, 'test-cli-status.json');
            const testData = { project: 'test', tasks: [] };
            fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));
            
            const cliPath = path.join(__dirname, 'auto-fix-todo.js');
            
            try {
                execSync(`node "${cliPath}" "${this.testDir}" --status --quiet`, { stdio: 'pipe' });
            } catch {
                throw new Error('CLI status command failed');
            }
        });

        await this._test('CLI: Dry run command', async () => {
            const testFile = path.join(this.testDir, 'test-cli-dryrun.json');
            const corruptData = { project: 'test' }; // Missing fields
            fs.writeFileSync(testFile, JSON.stringify(corruptData, null, 2));
            
            const cliPath = path.join(__dirname, 'auto-fix-todo.js');
            
            try {
                execSync(`node "${cliPath}" "${this.testDir}" --dry-run --quiet`, { stdio: 'pipe' });
                
                // Verify file unchanged
                const unchanged = JSON.parse(fs.readFileSync(testFile, 'utf8'));
                if (unchanged.tasks) throw new Error('Dry run modified file');
            } catch {
                throw new Error('CLI dry run command failed');
            }
        });

        console.log('✅ CLI tests completed\n');
    }

    async _runIntegrationTests() {
        console.log('🔗 Running integration tests...');
        
        await this._test('Integration: Complete workflow', async () => {
            const testFile = path.join(this.testDir, 'test-integration.json');
            
            // Create severely corrupted file
            const corruptData = {
                project: 'integration-test',
                tasks: [
                    {
                        id: 'task-1',
                        status: 'invalid',
                        mode: 'INVALID_MODE'
                        // Missing required fields
                    },
                    {
                        id: 'task-1', // Duplicate ID
                        description: 'Test task 2'
                        // Missing required fields
                    }
                ]
                // Missing root required fields
            };
            fs.writeFileSync(testFile, JSON.stringify(corruptData, null, 2));
            
            // Run complete auto-fix
            const autoFixer = new AutoFixer({ createBackups: true });
            const result = await autoFixer.autoFix(testFile);
            
            if (!result.success) throw new Error('Integration auto-fix failed');
            if (!result.hasChanges) throw new Error('No changes applied');
            if (!result.backupCreated) throw new Error('Backup not created');
            
            // Verify final file is completely valid
            const fixed = JSON.parse(fs.readFileSync(testFile, 'utf8'));
            const validation = this.validator.validateAndSanitize(fixed);
            
            if (!validation.isValid) {
                throw new Error(`Final file still invalid: ${validation.errors.map(e => e.message).join(', ')}`);
            }
            
            // Check that all issues were resolved
            const uniqueIds = [...new Set(fixed.tasks.map(t => t.id))];
            if (fixed.tasks.length !== uniqueIds.length) {
                throw new Error('Duplicate IDs not resolved');
            }
            
            // Verify TaskManager can read it
            const taskManager = new TaskManager(testFile);
            const data = await taskManager.readTodo();
            if (!data.project) throw new Error('TaskManager cannot read fixed file');
        });

        await this._test('Integration: Error handling and recovery', async () => {
            const testFile = path.join(this.testDir, 'test-error-handling.json');
            
            // Create completely invalid JSON
            fs.writeFileSync(testFile, 'completely invalid json content!!!');
            
            const autoFixer = new AutoFixer();
            const result = await autoFixer.autoFix(testFile);
            
            if (!result.success) {
                // This is expected for completely invalid content
                // Try recovery instead
                const recoveryResult = await autoFixer.recoverCorruptedFile(testFile);
                if (!recoveryResult.success) throw new Error('Recovery also failed');
            }
            
            // File should now be readable
            const content = fs.readFileSync(testFile, 'utf8');
            JSON.parse(content); // Should not throw
        });

        console.log('✅ Integration tests completed\n');
    }

    async _test(name, testFn) {
        this.results.total++;
        
        try {
            await testFn();
            this.results.passed++;
            console.log(`  ✅ ${name}`);
        } catch (error) {
            this.results.failed++;
            this.results.errors.push({ name, error: error.message });
            console.log(`  ❌ ${name}: ${error.message}`);
        }
    }

    _showResults() {
        console.log('\n📊 Test Results Summary');
        console.log('========================');
        console.log(`Total tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed} ✅`);
        console.log(`Failed: ${this.results.failed} ❌`);
        console.log(`Success rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.errors.forEach(({ name, error }) => {
                console.log(`  • ${name}: ${error}`);
            });
            console.log('\n💡 Some tests may fail due to missing dependencies or environment setup.');
        } else {
            console.log('\n🎉 All tests passed!');
        }
    }

    async _cleanup() {
        try {
            if (fs.existsSync(this.testDir)) {
                fs.rmSync(this.testDir, { recursive: true, force: true });
            }
        } catch (error) {
            console.warn(`⚠️  Cleanup warning: ${error.message}`);
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const testSuite = new AutoFixTestSuite();
    testSuite.runAllTests().catch(error => {
        console.error(`💥 Test suite error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = AutoFixTestSuite;