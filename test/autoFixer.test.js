// =============================================================================
// autoFixer.test.js - Comprehensive Test Suite for AutoFixer Class
// 
// This test suite provides complete coverage of the AutoFixer class including
// validation, auto-fixing, backup/recovery, and error handling scenarios.
// =============================================================================

const fs = require('fs');
const AutoFixer = require('../lib/autoFixer');
const TodoValidator = require('../lib/todoValidator');
const ErrorRecovery = require('../lib/errorRecovery');
const Logger = require('../lib/logger');

// Mock dependencies
jest.mock('fs');
jest.mock('../lib/todoValidator');
jest.mock('../lib/errorRecovery');
jest.mock('../lib/logger');

describe('AutoFixer', () => {
    let autoFixer;
    let mockTodoValidator;
    let mockErrorRecovery;
    let mockLogger;
    let mockFilePath;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockFilePath = '/test/project/TODO.json';
        
        // Mock TodoValidator
        mockTodoValidator = {
            validateJsonSyntax: jest.fn(),
            validateAndSanitize: jest.fn()
        };
        TodoValidator.mockImplementation(() => mockTodoValidator);
        
        // Mock ErrorRecovery
        mockErrorRecovery = {
            createBackup: jest.fn(),
            acquireLock: jest.fn(),
            releaseLock: jest.fn(),
            atomicWrite: jest.fn(),
            recoverCorruptedFile: jest.fn(),
            listAvailableBackups: jest.fn()
        };
        ErrorRecovery.mockImplementation(() => mockErrorRecovery);
        
        // Mock Logger
        mockLogger = {
            addFlow: jest.fn(),
            logError: jest.fn()
        };
        Logger.mockImplementation(() => mockLogger);
        
        autoFixer = new AutoFixer({
            autoFixLevel: 'moderate',
            createBackups: true,
            validateAfterFix: true,
            maxFixAttempts: 3
        });
    });

    describe('Constructor and Configuration', () => {
        it('should initialize with default options', () => {
            const fixer = new AutoFixer();
            
            expect(fixer.options.autoFixLevel).toBe('moderate');
            expect(fixer.options.createBackups).toBe(true);
            expect(fixer.options.validateAfterFix).toBe(true);
            expect(fixer.options.maxFixAttempts).toBe(3);
        });
        
        it('should accept custom options', () => {
            const customOptions = {
                autoFixLevel: 'aggressive',
                createBackups: false,
                validateAfterFix: false,
                maxFixAttempts: 5,
                logLevel: 'debug'
            };
            
            const fixer = new AutoFixer(customOptions);
            
            expect(fixer.options.autoFixLevel).toBe('aggressive');
            expect(fixer.options.createBackups).toBe(false);
            expect(fixer.options.validateAfterFix).toBe(false);
            expect(fixer.options.maxFixAttempts).toBe(5);
            expect(fixer.options.logLevel).toBe('debug');
        });
        
        it('should initialize fix session tracking', () => {
            expect(autoFixer.fixSession).toEqual({
                sessionId: null,
                startTime: null,
                totalErrors: 0,
                fixedErrors: 0,
                failedFixes: 0,
                operations: []
            });
        });
    });

    describe('AutoFix Main Workflow', () => {
        beforeEach(() => {
            // Setup common mocks for successful workflow
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{"project": "test", "tasks": []}');
            
            mockTodoValidator.validateJsonSyntax.mockReturnValue({
                isValid: true,
                data: { project: 'test', tasks: [] },
                repaired: false
            });
            
            mockTodoValidator.validateAndSanitize.mockReturnValue({
                isValid: true,
                data: { project: 'test', tasks: [] },
                errors: [],
                fixes: []
            });
            
            mockErrorRecovery.createBackup.mockResolvedValue({
                success: true,
                backupPath: '/test/project/.todo-backups/TODO.json.backup'
            });
            
            mockErrorRecovery.acquireLock.mockResolvedValue({
                success: true,
                lockId: 'test-lock-id'
            });
            
            mockErrorRecovery.releaseLock.mockResolvedValue({
                success: true
            });
            
            mockErrorRecovery.atomicWrite.mockResolvedValue({
                success: true
            });
        });
        
        it('should perform complete auto-fix workflow successfully', async () => {
            const result = await autoFixer.autoFix(mockFilePath);
            
            expect(result.success).toBe(true);
            expect(result.sessionId).toMatch(/^fix-\d+-[a-z0-9]{9}$/);
            expect(result.hasChanges).toBe(false);
            expect(result.backupCreated).toBe(true);
            expect(mockErrorRecovery.createBackup).toHaveBeenCalledWith(mockFilePath);
            expect(mockErrorRecovery.acquireLock).toHaveBeenCalledWith(mockFilePath);
            expect(mockErrorRecovery.releaseLock).toHaveBeenCalledWith(mockFilePath, 'test-lock-id');
        });
        
        it('should handle validation errors and apply fixes', async () => {
            const validationResult = {
                isValid: false,
                data: { project: 'test', tasks: [], fixed: true },
                errors: [
                    { type: 'MISSING_FIELD', message: 'Missing required field', severity: 'medium' }
                ],
                fixes: [
                    { type: 'MISSING_FIELD_ADDED', message: 'Added missing field', automated: true }
                ]
            };
            
            mockTodoValidator.validateAndSanitize
                .mockReturnValueOnce(validationResult)
                .mockReturnValueOnce({
                    isValid: true,
                    data: validationResult.data,
                    errors: [],
                    fixes: []
                });
            
            const result = await autoFixer.autoFix(mockFilePath);
            
            expect(result.success).toBe(true);
            expect(result.hasChanges).toBe(true);
            expect(result.fixesApplied).toEqual(validationResult.fixes);
            expect(result.errorsFixed).toBe(1);
            expect(mockErrorRecovery.atomicWrite).toHaveBeenCalledWith(
                mockFilePath,
                JSON.stringify(validationResult.data, null, 2),
                false
            );
        });
        
        it('should fail if pre-fix checks fail', async () => {
            fs.existsSync.mockReturnValue(false);
            
            const result = await autoFixer.autoFix(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.reason).toContain('Pre-fix check failed');
            expect(mockErrorRecovery.createBackup).not.toHaveBeenCalled();
        });
        
        it('should fail if backup creation fails', async () => {
            mockErrorRecovery.createBackup.mockResolvedValue({
                success: false,
                error: 'Backup failed'
            });
            
            const result = await autoFixer.autoFix(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.reason).toContain('Backup failed');
        });
        
        it('should fail if file lock cannot be acquired', async () => {
            mockErrorRecovery.acquireLock.mockResolvedValue({
                success: false,
                error: 'File is locked'
            });
            
            const result = await autoFixer.autoFix(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.reason).toBe('file_lock_failed');
        });
        
        it('should handle corrupted file and attempt recovery', async () => {
            fs.readFileSync.mockReturnValue('invalid json {');
            mockTodoValidator.validateJsonSyntax.mockReturnValue({
                isValid: false,
                error: 'JSON syntax error'
            });
            
            // Mock successful recovery
            autoFixer.recoverCorruptedFile = jest.fn().mockResolvedValue({
                success: true,
                finalData: { project: 'recovered', tasks: [] },
                strategy: 'restore_from_backup'
            });
            
            const result = await autoFixer.autoFix(mockFilePath);
            
            expect(result.success).toBe(true);
            expect(result.fixesApplied).toContain('File recovered using strategy: restore_from_backup');
            expect(autoFixer.recoverCorruptedFile).toHaveBeenCalledWith(mockFilePath, 'JSON syntax error');
        });
        
        it('should always release lock even if errors occur', async () => {
            mockTodoValidator.validateAndSanitize.mockImplementation(() => {
                throw new Error('Validation failed');
            });
            
            const result = await autoFixer.autoFix(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(mockErrorRecovery.releaseLock).toHaveBeenCalledWith(mockFilePath, 'test-lock-id');
        });
    });

    describe('Dry Run Functionality', () => {
        it('should return proposed fixes without making changes', async () => {
            fs.readFileSync.mockReturnValue('{"project": "test", "tasks": []}');
            
            mockTodoValidator.validateJsonSyntax.mockReturnValue({
                isValid: true,
                data: { project: 'test', tasks: [] }
            });
            
            const validationResult = {
                isValid: false,
                data: { project: 'test', tasks: [] },
                errors: [{ type: 'MISSING_FIELD', message: 'Missing field' }],
                fixes: [{ type: 'MISSING_FIELD_ADDED', message: 'Would add field' }],
                summary: { totalErrors: 1, totalFixes: 1 }
            };
            
            mockTodoValidator.validateAndSanitize.mockReturnValue(validationResult);
            
            const result = await autoFixer.dryRun(mockFilePath);
            
            expect(result.success).toBe(true);
            expect(result.wouldFix).toBe(true);
            expect(result.proposedFixes).toEqual(validationResult.fixes);
            expect(result.errors).toEqual(validationResult.errors);
            expect(result.originalValid).toBe(false);
            expect(mockErrorRecovery.atomicWrite).not.toHaveBeenCalled();
        });
        
        it('should handle file read errors in dry run', async () => {
            fs.readFileSync.mockImplementation(() => {
                throw new Error('File not readable');
            });
            
            const result = await autoFixer.dryRun(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('File not readable');
            expect(result.fixes).toEqual([]);
        });
    });

    describe('Selective Error Fixing', () => {
        it('should fix only specified error types', async () => {
            const validationResult = {
                isValid: false,
                data: { project: 'test', tasks: [] },
                errors: [
                    { type: 'MISSING_FIELD', message: 'Missing field' },
                    { type: 'INVALID_TYPE', message: 'Invalid type' }
                ],
                fixes: [
                    { type: 'MISSING_FIELD', message: 'Add field', automated: true },
                    { type: 'INVALID_TYPE', message: 'Fix type', automated: true }
                ]
            };
            
            mockTodoValidator.validateAndSanitize.mockReturnValue(validationResult);
            
            // Setup other mocks as before
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{"project": "test"}');
            mockTodoValidator.validateJsonSyntax.mockReturnValue({
                isValid: true,
                data: { project: 'test' }
            });
            mockErrorRecovery.createBackup.mockResolvedValue({ success: true });
            mockErrorRecovery.acquireLock.mockResolvedValue({ success: true, lockId: 'test' });
            mockErrorRecovery.releaseLock.mockResolvedValue({ success: true });
            mockErrorRecovery.atomicWrite.mockResolvedValue({ success: true });
            
            const result = await autoFixer.fixSpecificErrors(mockFilePath, ['MISSING_FIELD']);
            
            expect(result.success).toBe(true);
            // Should have filtered fixes to only include MISSING_FIELD type
            expect(result.fixesApplied).toHaveLength(1);
            expect(result.fixesApplied[0].type).toBe('MISSING_FIELD');
        });
    });

    describe('Corrupted File Recovery', () => {
        beforeEach(() => {
            mockErrorRecovery.recoverCorruptedFile.mockResolvedValue({
                success: true,
                strategy: 'restore_from_backup',
                message: 'Restored from backup',
                recoveredData: { project: 'recovered', tasks: [] }
            });
            
            mockTodoValidator.validateAndSanitize.mockReturnValue({
                isValid: true,
                data: { project: 'recovered', tasks: [] },
                fixes: []
            });
            
            mockErrorRecovery.atomicWrite.mockResolvedValue({ success: true });
        });
        
        it('should recover corrupted file successfully', async () => {
            const result = await autoFixer.recoverCorruptedFile(mockFilePath);
            
            expect(result.success).toBe(true);
            expect(result.strategy).toBe('restore_from_backup');
            expect(result.message).toBe('Restored from backup');
            expect(result.finalData).toEqual({ project: 'recovered', tasks: [] });
            expect(mockErrorRecovery.recoverCorruptedFile).toHaveBeenCalledWith(mockFilePath);
        });
        
        it('should apply additional fixes to recovered data', async () => {
            mockTodoValidator.validateAndSanitize.mockReturnValue({
                isValid: false,
                data: { project: 'recovered', tasks: [], fixed: true },
                fixes: [{ type: 'ADDITIONAL_FIX', message: 'Fixed recovered data' }]
            });
            
            const result = await autoFixer.recoverCorruptedFile(mockFilePath);
            
            expect(result.success).toBe(true);
            expect(result.additionalFixes).toBe(1);
            expect(mockErrorRecovery.atomicWrite).toHaveBeenCalled();
        });
        
        it('should handle recovery failure', async () => {
            mockErrorRecovery.recoverCorruptedFile.mockResolvedValue({
                success: false,
                error: 'All recovery strategies failed',
                strategies: ['backup', 'repair']
            });
            
            const result = await autoFixer.recoverCorruptedFile(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('All recovery strategies failed');
            expect(result.strategies).toEqual(['backup', 'repair']);
        });
        
        it('should handle recovery errors gracefully', async () => {
            mockErrorRecovery.recoverCorruptedFile.mockRejectedValue(new Error('Recovery system failure'));
            
            const result = await autoFixer.recoverCorruptedFile(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Recovery system failure');
        });
    });

    describe('File Status Analysis', () => {
        it('should return status for non-existent file', async () => {
            fs.existsSync.mockReturnValue(false);
            
            const result = await autoFixer.getFileStatus(mockFilePath);
            
            expect(result.exists).toBe(false);
            expect(result.error).toBe('File does not exist');
            expect(result.canAutoFix).toBe(false);
            expect(result.suggestedAction).toBe('Create new TODO.json file');
        });
        
        it('should return status for unreadable file', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });
            
            const result = await autoFixer.getFileStatus(mockFilePath);
            
            expect(result.exists).toBe(true);
            expect(result.readable).toBe(false);
            expect(result.error).toBe('Permission denied');
            expect(result.canAutoFix).toBe(true);
            expect(result.suggestedAction).toBe('Attempt file recovery');
        });
        
        it('should return detailed status for valid file', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{"project": "test", "tasks": []}');
            
            mockTodoValidator.validateJsonSyntax.mockReturnValue({
                isValid: true,
                data: { project: 'test', tasks: [] }
            });
            
            const validationResult = {
                isValid: true,
                errors: [],
                fixes: [],
                summary: { totalErrors: 0, totalFixes: 0 }
            };
            
            mockTodoValidator.validateAndSanitize.mockReturnValue(validationResult);
            mockErrorRecovery.listAvailableBackups.mockReturnValue([
                { filename: 'backup1.backup', created: new Date() }
            ]);
            
            const result = await autoFixer.getFileStatus(mockFilePath);
            
            expect(result.exists).toBe(true);
            expect(result.readable).toBe(true);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.autoFixableErrors).toEqual([]);
            expect(result.backups).toBe(1);
            expect(result.canAutoFix).toBe(false);
            expect(result.suggestedAction).toBe('File is valid, no action needed');
        });
        
        it('should return status for file with fixable errors', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{"project": "test"}');
            
            mockTodoValidator.validateJsonSyntax.mockReturnValue({
                isValid: true,
                data: { project: 'test' }
            });
            
            const validationResult = {
                isValid: false,
                errors: [
                    { type: 'MISSING_FIELD', autoFixable: true, severity: 'medium' },
                    { type: 'MANUAL_ISSUE', autoFixable: false, severity: 'high' }
                ],
                fixes: [{ type: 'MISSING_FIELD_ADDED' }],
                summary: { totalErrors: 2, totalFixes: 1 }
            };
            
            mockTodoValidator.validateAndSanitize.mockReturnValue(validationResult);
            mockErrorRecovery.listAvailableBackups.mockReturnValue([]);
            
            const result = await autoFixer.getFileStatus(mockFilePath);
            
            expect(result.valid).toBe(false);
            expect(result.autoFixableErrors).toHaveLength(1);
            expect(result.manualFixRequired).toHaveLength(1);
            expect(result.canAutoFix).toBe(true);
            expect(result.suggestedAction).toBe('Run auto-fix to resolve issues automatically');
        });
    });

    describe('Fix Level Filtering', () => {
        let testFixes;
        
        beforeEach(() => {
            testFixes = [
                { type: 'MISSING_FIELD_ID', automated: true },
                { type: 'TYPE_CORRECTION', automated: true },
                { type: 'MANUAL_REVIEW_REQUIRED', automated: false },
                { type: 'COMPLEX_STRUCTURAL_CHANGE', automated: false }
            ];
        });
        
        it('should filter fixes for conservative level', () => {
            autoFixer.options.autoFixLevel = 'conservative';
            const filtered = autoFixer._filterFixesByLevel(testFixes);
            
            expect(filtered).toHaveLength(1);
            expect(filtered[0].type).toBe('MISSING_FIELD_ID');
        });
        
        it('should filter fixes for moderate level', () => {
            autoFixer.options.autoFixLevel = 'moderate';
            const filtered = autoFixer._filterFixesByLevel(testFixes);
            
            expect(filtered).toHaveLength(2);
            expect(filtered.every(fix => fix.automated)).toBe(true);
        });
        
        it('should apply all fixes for aggressive level', () => {
            autoFixer.options.autoFixLevel = 'aggressive';
            const filtered = autoFixer._filterFixesByLevel(testFixes);
            
            expect(filtered).toHaveLength(4);
            expect(filtered).toEqual(testFixes);
        });
        
        it('should filter for selective mode with specific error types', () => {
            autoFixer.options.autoFixLevel = 'selective';
            autoFixer.selectiveErrorTypes = ['TYPE_CORRECTION', 'MANUAL_REVIEW_REQUIRED'];
            
            const filtered = autoFixer._filterFixesByLevel(testFixes);
            
            expect(filtered).toHaveLength(2);
            expect(filtered.map(f => f.type)).toEqual(['TYPE_CORRECTION', 'MANUAL_REVIEW_REQUIRED']);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle unexpected errors during auto-fix', async () => {
            fs.existsSync.mockReturnValue(true);
            mockErrorRecovery.createBackup.mockImplementation(() => {
                throw new Error('Unexpected backup error');
            });
            
            const result = await autoFixer.autoFix(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.reason).toBe('unexpected_error');
            expect(result.details.error).toBe('Unexpected backup error');
            expect(mockLogger.logError).toHaveBeenCalled();
        });
        
        it('should handle file system permission errors', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.accessSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });
            
            const result = await autoFixer.autoFix(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.reason).toContain('Pre-fix check failed');
        });
        
        it('should handle atomic write failures', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{"project": "test"}');
            
            mockTodoValidator.validateJsonSyntax.mockReturnValue({
                isValid: true,
                data: { project: 'test' }
            });
            
            mockTodoValidator.validateAndSanitize.mockReturnValue({
                isValid: false,
                data: { project: 'test', fixed: true },
                errors: [],
                fixes: [{ type: 'TEST_FIX', automated: true }]
            });
            
            mockErrorRecovery.createBackup.mockResolvedValue({ success: true });
            mockErrorRecovery.acquireLock.mockResolvedValue({ success: true, lockId: 'test' });
            mockErrorRecovery.releaseLock.mockResolvedValue({ success: true });
            
            mockErrorRecovery.atomicWrite.mockResolvedValue({
                success: false,
                error: 'Write failed'
            });
            
            const result = await autoFixer.autoFix(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.reason).toBe('unexpected_error');
        });
        
        it('should handle validation errors gracefully', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{"project": "test"}');
            
            mockTodoValidator.validateJsonSyntax.mockReturnValue({
                isValid: true,
                data: { project: 'test' }
            });
            
            mockTodoValidator.validateAndSanitize.mockImplementation(() => {
                throw new Error('Validation system failure');
            });
            
            mockErrorRecovery.createBackup.mockResolvedValue({ success: true });
            mockErrorRecovery.acquireLock.mockResolvedValue({ success: true, lockId: 'test' });
            mockErrorRecovery.releaseLock.mockResolvedValue({ success: true });
            
            const result = await autoFixer.autoFix(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.reason).toBe('unexpected_error');
            expect(mockErrorRecovery.releaseLock).toHaveBeenCalled();
        });
    });

    describe('Session Management and Logging', () => {
        it('should initialize and finalize fix sessions', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{"project": "test", "tasks": []}');
            
            mockTodoValidator.validateJsonSyntax.mockReturnValue({
                isValid: true,
                data: { project: 'test', tasks: [] }
            });
            
            mockTodoValidator.validateAndSanitize.mockReturnValue({
                isValid: true,
                data: { project: 'test', tasks: [] },
                errors: [],
                fixes: []
            });
            
            mockErrorRecovery.createBackup.mockResolvedValue({ success: true });
            mockErrorRecovery.acquireLock.mockResolvedValue({ success: true, lockId: 'test' });
            mockErrorRecovery.releaseLock.mockResolvedValue({ success: true });
            
            const result = await autoFixer.autoFix(mockFilePath);
            
            expect(result.sessionId).toMatch(/^fix-\d+-[a-z0-9]{9}$/);
            expect(result.duration).toBeGreaterThan(0);
            expect(result.operations).toBeInstanceOf(Array);
            expect(mockLogger.addFlow).toHaveBeenCalledWith(expect.stringContaining('Starting fix session'));
            expect(mockLogger.addFlow).toHaveBeenCalledWith(expect.stringContaining('Fix session completed'));
        });
        
        it('should track fix statistics', async () => {
            const validationResult = {
                isValid: false,
                data: { project: 'test', tasks: [] },
                errors: [{ type: 'ERROR1' }, { type: 'ERROR2' }],
                fixes: [{ type: 'FIX1' }, { type: 'FIX2' }]
            };
            
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{"project": "test"}');
            
            mockTodoValidator.validateJsonSyntax.mockReturnValue({
                isValid: true,
                data: { project: 'test' }
            });
            
            mockTodoValidator.validateAndSanitize
                .mockReturnValueOnce(validationResult)
                .mockReturnValueOnce({
                    isValid: true,
                    data: validationResult.data,
                    errors: [],
                    fixes: []
                });
            
            mockErrorRecovery.createBackup.mockResolvedValue({ success: true });
            mockErrorRecovery.acquireLock.mockResolvedValue({ success: true, lockId: 'test' });
            mockErrorRecovery.releaseLock.mockResolvedValue({ success: true });
            mockErrorRecovery.atomicWrite.mockResolvedValue({ success: true });
            
            const result = await autoFixer.autoFix(mockFilePath);
            
            expect(result.totalErrors).toBe(2);
            expect(result.errorsFixed).toBe(2);
            expect(result.fixesApplied).toEqual(validationResult.fixes);
        });
    });
});