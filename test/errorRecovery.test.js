// =============================================================================
// errorRecovery.test.js - Comprehensive Test Suite for ErrorRecovery Class
// 
// This test suite provides complete coverage of the ErrorRecovery class including
// backup creation, file restoration, atomic operations, file locking, and
// recovery strategies for TODO.json files.
// =============================================================================

// Mock dependencies FIRST, before importing modules
jest.mock('fs');
jest.mock('crypto');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ErrorRecovery = require('../lib/errorRecovery');

describe('ErrorRecovery', () => {
    let errorRecovery;
    let mockFilePath;
    let mockBackupDir;
    let mockBackupPath;

    beforeAll(() => {
        // Set up fs module mocks
        fs.existsSync = jest.fn();
        fs.readFileSync = jest.fn();
        fs.writeFileSync = jest.fn();
        fs.mkdirSync = jest.fn();
        fs.copyFileSync = jest.fn();
        fs.statSync = jest.fn();
        fs.unlinkSync = jest.fn();
        fs.renameSync = jest.fn();
        fs.readdirSync = jest.fn();
        
        // Set up crypto module mocks
        crypto.createHash = jest.fn();
        crypto.randomBytes = jest.fn();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockFilePath = '/test/project/TODO.json';
        mockBackupDir = '.todo-backups';
        mockBackupPath = `/test/project/${mockBackupDir}`;
        
        // Mock crypto methods
        crypto.createHash.mockReturnValue({
            update: jest.fn().mockReturnValue({
                digest: jest.fn().mockReturnValue({
                    substr: jest.fn().mockReturnValue('abc12345')
                })
            })
        });
        
        crypto.randomBytes.mockReturnValue({
            toString: jest.fn().mockReturnValue('mock-lock-id-123456')
        });
        
        // Mock process properties
        Object.defineProperty(process, 'pid', { value: 12345, configurable: true });
        
        errorRecovery = new ErrorRecovery();
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with default options', () => {
            const recovery = new ErrorRecovery();
            
            expect(recovery.maxBackups).toBe(3);
            expect(recovery.backupDir).toBe('.todo-backups');
            expect(recovery.lockTimeout).toBe(5000);
            expect(recovery.activeLocks).toBeInstanceOf(Map);
        });
        
        it('should initialize with custom options', () => {
            const options = {
                maxBackups: 5,
                backupDir: 'custom-backups',
                lockTimeout: 10000
            };
            
            const recovery = new ErrorRecovery(options);
            
            expect(recovery.maxBackups).toBe(5);
            expect(recovery.backupDir).toBe('custom-backups');
            expect(recovery.lockTimeout).toBe(10000);
        });
        
        it('should initialize with empty active locks map', () => {
            expect(errorRecovery.activeLocks.size).toBe(0);
        });
    });

    describe('Backup Creation', () => {
        beforeEach(() => {
            // Mock Date.toISOString for consistent timestamps
            jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-07-27T12:00:00.000Z');
            Date.now = jest.fn(() => 1690459200000);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should create backup successfully', async () => {
            const mockFileContent = '{"project": "test", "tasks": []}';
            
            fs.existsSync
                .mockReturnValueOnce(true) // File exists
                .mockReturnValueOnce(false); // Backup dir doesn't exist
            
            fs.readFileSync.mockReturnValue(mockFileContent);
            fs.mkdirSync.mockImplementation(() => {});
            fs.copyFileSync.mockImplementation(() => {});
            fs.statSync.mockReturnValue({ size: 1024 });
            
            // Mock cleanup method
            errorRecovery._cleanupOldBackups = jest.fn();
            
            const result = await errorRecovery.createBackup(mockFilePath);
            
            expect(result.success).toBe(true);
            expect(result.backupPath).toMatch(/TODO\.json\.2023-07-27T12-00-00-000Z\.abc12345\.backup$/);
            expect(result.timestamp).toBe('2023-07-27T12-00-00-000Z');
            expect(result.checksum).toBe('abc12345');
            expect(result.size).toBe(1024);
            
            expect(fs.mkdirSync).toHaveBeenCalledWith(mockBackupPath, { recursive: true });
            expect(fs.copyFileSync).toHaveBeenCalledWith(mockFilePath, expect.any(String));
            expect(errorRecovery._cleanupOldBackups).toHaveBeenCalledWith(mockBackupPath);
        });
        
        it('should handle non-existent file', async () => {
            fs.existsSync.mockReturnValue(false);
            
            const result = await errorRecovery.createBackup(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('File does not exist');
            expect(result.backupPath).toBeNull();
        });
        
        it('should create backup directory if it does not exist', async () => {
            fs.existsSync
                .mockReturnValueOnce(true) // File exists
                .mockReturnValueOnce(false); // Backup dir doesn't exist
            
            fs.readFileSync.mockReturnValue('{}');
            fs.mkdirSync.mockImplementation(() => {});
            fs.copyFileSync.mockImplementation(() => {});
            fs.statSync.mockReturnValue({ size: 100 });
            
            errorRecovery._cleanupOldBackups = jest.fn();
            
            await errorRecovery.createBackup(mockFilePath);
            
            expect(fs.mkdirSync).toHaveBeenCalledWith(mockBackupPath, { recursive: true });
        });
        
        it('should skip creating backup directory if it already exists', async () => {
            fs.existsSync.mockReturnValue(true); // Both file and backup dir exist
            fs.readFileSync.mockReturnValue('{}');
            fs.copyFileSync.mockImplementation(() => {});
            fs.statSync.mockReturnValue({ size: 100 });
            
            errorRecovery._cleanupOldBackups = jest.fn();
            
            await errorRecovery.createBackup(mockFilePath);
            
            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });
        
        it('should handle backup creation errors', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });
            
            const result = await errorRecovery.createBackup(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied');
            expect(result.backupPath).toBeNull();
        });
        
        it('should generate correct backup filename format', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('test content');
            fs.copyFileSync.mockImplementation(() => {});
            fs.statSync.mockReturnValue({ size: 100 });
            
            errorRecovery._cleanupOldBackups = jest.fn();
            
            const result = await errorRecovery.createBackup(mockFilePath);
            
            expect(result.backupPath).toMatch(/TODO\.json\.2023-07-27T12-00-00-000Z\.abc12345\.backup$/);
        });
    });

    describe('Backup Restoration', () => {
        beforeEach(() => {
            errorRecovery._listBackups = jest.fn();
            errorRecovery._validateBackup = jest.fn();
            errorRecovery.createBackup = jest.fn();
        });

        it('should restore from most recent backup successfully', async () => {
            const mockBackups = [
                { path: '/test/backup1.backup', timestamp: '2023-07-27T12-00-00-000Z' },
                { path: '/test/backup2.backup', timestamp: '2023-07-27T11-00-00-000Z' }
            ];
            
            const mockValidation = {
                isValid: true,
                backupInfo: { size: 1024, taskCount: 5, project: 'test' }
            };
            
            fs.existsSync
                .mockReturnValueOnce(true) // Backup dir exists
                .mockReturnValueOnce(true); // Current file exists
            
            errorRecovery._listBackups.mockReturnValue(mockBackups);
            errorRecovery._validateBackup.mockResolvedValue(mockValidation);
            errorRecovery.createBackup.mockResolvedValue({ success: true });
            fs.copyFileSync.mockImplementation(() => {});
            
            const result = await errorRecovery.restoreFromBackup(mockFilePath);
            
            expect(result.success).toBe(true);
            expect(result.restoredFrom).toBe('/test/backup1.backup');
            expect(result.backupInfo).toEqual(mockValidation.backupInfo);
            
            expect(errorRecovery._validateBackup).toHaveBeenCalledWith('/test/backup1.backup');
            expect(errorRecovery.createBackup).toHaveBeenCalledWith(mockFilePath);
            expect(fs.copyFileSync).toHaveBeenCalledWith('/test/backup1.backup', mockFilePath);
        });
        
        it('should restore from specific backup', async () => {
            const specificBackup = 'TODO.json.2023-07-27T10-00-00-000Z.xyz98765.backup';
            const specificBackupPath = path.join(mockBackupPath, specificBackup);
            
            const mockValidation = {
                isValid: true,
                backupInfo: { size: 512, taskCount: 3, project: 'test' }
            };
            
            fs.existsSync
                .mockReturnValueOnce(true) // Backup dir exists
                .mockReturnValueOnce(true) // Specific backup exists
                .mockReturnValueOnce(false); // Current file doesn't exist
            
            errorRecovery._validateBackup.mockResolvedValue(mockValidation);
            fs.copyFileSync.mockImplementation(() => {});
            
            const result = await errorRecovery.restoreFromBackup(mockFilePath, specificBackup);
            
            expect(result.success).toBe(true);
            expect(result.restoredFrom).toBe(specificBackupPath);
            expect(errorRecovery.createBackup).not.toHaveBeenCalled();
        });
        
        it('should handle non-existent backup directory', async () => {
            fs.existsSync.mockReturnValue(false);
            
            const result = await errorRecovery.restoreFromBackup(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('No backup directory found');
            expect(result.restoredFrom).toBeNull();
        });
        
        it('should handle no backup files found', async () => {
            fs.existsSync.mockReturnValue(true);
            errorRecovery._listBackups.mockReturnValue([]);
            
            const result = await errorRecovery.restoreFromBackup(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('No backup files found');
            expect(result.restoredFrom).toBeNull();
        });
        
        it('should handle specific backup file not found', async () => {
            const specificBackup = 'nonexistent.backup';
            
            fs.existsSync
                .mockReturnValueOnce(true) // Backup dir exists
                .mockReturnValueOnce(false); // Specific backup doesn't exist
            
            const result = await errorRecovery.restoreFromBackup(mockFilePath, specificBackup);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Specified backup file not found');
            expect(result.restoredFrom).toBeNull();
        });
        
        it('should handle backup validation failure', async () => {
            const mockBackups = [{ path: '/test/corrupt.backup' }];
            const mockValidation = {
                isValid: false,
                error: 'Corrupted backup file'
            };
            
            fs.existsSync.mockReturnValue(true);
            errorRecovery._listBackups.mockReturnValue(mockBackups);
            errorRecovery._validateBackup.mockResolvedValue(mockValidation);
            
            const result = await errorRecovery.restoreFromBackup(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Backup validation failed: Corrupted backup file');
            expect(result.restoredFrom).toBeNull();
        });
        
        it('should handle restoration errors', async () => {
            const mockBackups = [{ path: '/test/backup.backup' }];
            const mockValidation = { isValid: true, backupInfo: {} };
            
            fs.existsSync.mockReturnValue(true);
            errorRecovery._listBackups.mockReturnValue(mockBackups);
            errorRecovery._validateBackup.mockResolvedValue(mockValidation);
            errorRecovery.createBackup.mockResolvedValue({ success: true });
            fs.copyFileSync.mockImplementation(() => {
                throw new Error('Disk full');
            });
            
            const result = await errorRecovery.restoreFromBackup(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Disk full');
            expect(result.restoredFrom).toBeNull();
        });
    });

    describe('Atomic Write Operations', () => {
        beforeEach(() => {
            Date.now = jest.fn(() => 1690459200000);
            errorRecovery.createBackup = jest.fn();
        });

        it('should perform atomic write successfully with backup', async () => {
            const content = '{"project": "test", "tasks": []}';
            const tempPath = `${mockFilePath}.tmp.1690459200000`;
            
            fs.existsSync.mockReturnValue(true); // File exists for backup
            errorRecovery.createBackup.mockResolvedValue({ success: true, backupPath: '/test/backup.backup' });
            fs.writeFileSync.mockImplementation(() => {});
            fs.renameSync.mockImplementation(() => {});
            
            const result = await errorRecovery.atomicWrite(mockFilePath, content, true);
            
            expect(result.success).toBe(true);
            expect(result.backupCreated).toBe(true);
            expect(result.backupPath).toBe('/test/backup.backup');
            
            expect(errorRecovery.createBackup).toHaveBeenCalledWith(mockFilePath);
            expect(fs.writeFileSync).toHaveBeenCalledWith(tempPath, content, 'utf8');
            expect(fs.renameSync).toHaveBeenCalledWith(tempPath, mockFilePath);
        });
        
        it('should perform atomic write without backup', async () => {
            const content = '{"project": "test", "tasks": []}';
            const tempPath = `${mockFilePath}.tmp.1690459200000`;
            
            fs.writeFileSync.mockImplementation(() => {});
            fs.renameSync.mockImplementation(() => {});
            
            const result = await errorRecovery.atomicWrite(mockFilePath, content, false);
            
            expect(result.success).toBe(true);
            expect(result.backupCreated).toBe(false);
            expect(result.backupPath).toBeNull();
            
            expect(errorRecovery.createBackup).not.toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalledWith(tempPath, content, 'utf8');
            expect(fs.renameSync).toHaveBeenCalledWith(tempPath, mockFilePath);
        });
        
        it('should handle backup failure', async () => {
            const content = '{"project": "test"}';
            
            fs.existsSync.mockReturnValue(true);
            errorRecovery.createBackup.mockResolvedValue({ success: false, error: 'Backup failed' });
            
            const result = await errorRecovery.atomicWrite(mockFilePath, content, true);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Backup failed: Backup failed');
            expect(result.backupCreated).toBe(false);
        });
        
        it('should validate JSON content before atomic move', async () => {
            const invalidContent = '{"project": "test", invalid json}';
            const tempPath = `${mockFilePath}.tmp.1690459200000`;
            
            fs.existsSync.mockReturnValue(false); // No file to backup
            fs.writeFileSync.mockImplementation(() => {});
            fs.unlinkSync.mockImplementation(() => {});
            
            const result = await errorRecovery.atomicWrite(mockFilePath, invalidContent, true);
            
            expect(result.success).toBe(false);
            expect(result.error).toMatch(/Invalid JSON content:/);
            expect(result.backupCreated).toBe(false);
            
            expect(fs.unlinkSync).toHaveBeenCalledWith(tempPath);
            expect(fs.renameSync).not.toHaveBeenCalled();
        });
        
        it('should handle write errors and cleanup temp file', async () => {
            const content = '{"project": "test"}';
            const tempPath = `${mockFilePath}.tmp.1690459200000`;
            
            fs.existsSync
                .mockReturnValueOnce(false) // No file to backup
                .mockReturnValueOnce(true); // Temp file exists for cleanup
            
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Disk full');
            });
            fs.unlinkSync.mockImplementation(() => {});
            
            const result = await errorRecovery.atomicWrite(mockFilePath, content, false);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Disk full');
            expect(result.backupCreated).toBe(false);
            
            expect(fs.unlinkSync).toHaveBeenCalledWith(tempPath);
        });
        
        it('should handle cleanup errors gracefully', async () => {
            const content = '{"invalid": json}';
            const _tempPath = `${mockFilePath}.tmp.1690459200000`;
            
            fs.existsSync.mockReturnValue(true);
            fs.writeFileSync.mockImplementation(() => {});
            fs.unlinkSync.mockImplementation(() => {
                throw new Error('Cleanup failed');
            });
            
            const result = await errorRecovery.atomicWrite(mockFilePath, content, false);
            
            expect(result.success).toBe(false);
            // Should not throw even if cleanup fails
        });
    });

    describe('File Locking', () => {
        beforeEach(() => {
            Date.now = jest.fn(() => 1690459200000);
            errorRecovery._readLockFile = jest.fn();
            errorRecovery._isLockValid = jest.fn();
        });

        it('should acquire lock successfully', async () => {
            const lockPath = `${mockFilePath}.lock`;
            const expectedLockData = {
                lockId: 'mock-lock-id-123456',
                pid: 12345,
                timestamp: 1690459200000,
                filePath: mockFilePath
            };
            
            fs.existsSync.mockReturnValue(false); // No existing lock
            fs.writeFileSync.mockImplementation(() => {});
            
            const result = await errorRecovery.acquireLock(mockFilePath);
            
            expect(result.success).toBe(true);
            expect(result.lockId).toBe('mock-lock-id-123456');
            expect(result.lockPath).toBe(lockPath);
            
            expect(fs.writeFileSync).toHaveBeenCalledWith(lockPath, JSON.stringify(expectedLockData), 'utf8');
            expect(errorRecovery.activeLocks.get(mockFilePath)).toEqual({
                lockId: 'mock-lock-id-123456',
                lockPath: lockPath
            });
        });
        
        it('should handle existing valid lock', async () => {
            const _lockPath = `${mockFilePath}.lock`;
            const existingLock = { lockId: 'existing-lock', timestamp: Date.now() };
            
            fs.existsSync.mockReturnValue(true);
            errorRecovery._readLockFile.mockReturnValue(existingLock);
            errorRecovery._isLockValid.mockReturnValue(true);
            
            const result = await errorRecovery.acquireLock(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('File is locked by another process');
            expect(result.lockId).toBeNull();
        });
        
        it('should remove stale lock and acquire new one', async () => {
            const lockPath = `${mockFilePath}.lock`;
            const staleLock = { lockId: 'stale-lock', timestamp: Date.now() - 10000 };
            
            fs.existsSync.mockReturnValue(true);
            errorRecovery._readLockFile.mockReturnValue(staleLock);
            errorRecovery._isLockValid.mockReturnValue(false); // Stale lock
            fs.unlinkSync.mockImplementation(() => {});
            fs.writeFileSync.mockImplementation(() => {});
            
            const result = await errorRecovery.acquireLock(mockFilePath);
            
            expect(result.success).toBe(true);
            expect(fs.unlinkSync).toHaveBeenCalledWith(lockPath);
            expect(fs.writeFileSync).toHaveBeenCalled();
        });
        
        it('should handle lock acquisition errors', async () => {
            fs.existsSync.mockReturnValue(false);
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });
            
            const result = await errorRecovery.acquireLock(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied');
            expect(result.lockId).toBeNull();
        });
        
        it('should release lock successfully', async () => {
            const lockId = 'test-lock-id';
            const lockPath = `${mockFilePath}.lock`;
            
            // Set up active lock
            errorRecovery.activeLocks.set(mockFilePath, { lockId, lockPath });
            
            fs.existsSync.mockReturnValue(true);
            fs.unlinkSync.mockImplementation(() => {});
            
            const result = await errorRecovery.releaseLock(mockFilePath, lockId);
            
            expect(result.success).toBe(true);
            expect(fs.unlinkSync).toHaveBeenCalledWith(lockPath);
            expect(errorRecovery.activeLocks.has(mockFilePath)).toBe(false);
        });
        
        it('should handle invalid lock ID on release', async () => {
            const lockId = 'test-lock-id';
            const wrongLockId = 'wrong-lock-id';
            
            errorRecovery.activeLocks.set(mockFilePath, { lockId, lockPath: 'test.lock' });
            
            const result = await errorRecovery.releaseLock(mockFilePath, wrongLockId);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid lock ID or file not locked by this process');
        });
        
        it('should handle lock release errors', async () => {
            const lockId = 'test-lock-id';
            const lockPath = `${mockFilePath}.lock`;
            
            errorRecovery.activeLocks.set(mockFilePath, { lockId, lockPath });
            
            fs.existsSync.mockReturnValue(true);
            fs.unlinkSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });
            
            const result = await errorRecovery.releaseLock(mockFilePath, lockId);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied');
        });
    });

    describe('Backup Listing', () => {
        beforeEach(() => {
            errorRecovery._listBackups = jest.fn();
        });

        it('should list available backups', () => {
            const mockBackups = [
                { filename: 'TODO.json.2023-07-27T12-00-00-000Z.abc12345.backup', path: '/test/backup1.backup' },
                { filename: 'TODO.json.2023-07-27T11-00-00-000Z.def67890.backup', path: '/test/backup2.backup' }
            ];
            
            fs.existsSync.mockReturnValue(true);
            errorRecovery._listBackups.mockReturnValue(mockBackups);
            
            const result = errorRecovery.listAvailableBackups(mockFilePath);
            
            expect(result).toEqual(mockBackups);
            expect(errorRecovery._listBackups).toHaveBeenCalledWith(mockBackupPath);
        });
        
        it('should return empty array when backup directory does not exist', () => {
            fs.existsSync.mockReturnValue(false);
            
            const result = errorRecovery.listAvailableBackups(mockFilePath);
            
            expect(result).toEqual([]);
        });
        
        it('should handle listing errors gracefully', () => {
            fs.existsSync.mockImplementation(() => {
                throw new Error('Access denied');
            });
            
            const result = errorRecovery.listAvailableBackups(mockFilePath);
            
            expect(result).toEqual([]);
        });
    });

    describe('Recovery Strategies', () => {
        beforeEach(() => {
            errorRecovery._executeRecoveryStrategy = jest.fn();
        });

        it('should execute recovery strategies in order until success', async () => {
            errorRecovery._executeRecoveryStrategy
                .mockResolvedValueOnce({ success: false }) // restore_from_backup fails
                .mockResolvedValueOnce({ success: true, message: 'JSON repaired', data: {} }); // repair_json_syntax succeeds
            
            const result = await errorRecovery.recoverCorruptedFile(mockFilePath);
            
            expect(result.success).toBe(true);
            expect(result.strategy).toBe('repair_json_syntax');
            expect(result.message).toBe('JSON repaired');
            expect(result.recoveredData).toEqual({});
            
            expect(errorRecovery._executeRecoveryStrategy).toHaveBeenCalledTimes(2);
            expect(errorRecovery._executeRecoveryStrategy).toHaveBeenNthCalledWith(1, 'restore_from_backup', mockFilePath);
            expect(errorRecovery._executeRecoveryStrategy).toHaveBeenNthCalledWith(2, 'repair_json_syntax', mockFilePath);
        });
        
        it('should try all strategies and fail if none succeed', async () => {
            errorRecovery._executeRecoveryStrategy.mockResolvedValue({ success: false });
            
            const result = await errorRecovery.recoverCorruptedFile(mockFilePath);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('All recovery strategies failed');
            expect(result.strategies).toEqual([
                'restore_from_backup',
                'repair_json_syntax',
                'rebuild_from_fragments',
                'create_minimal_structure'
            ]);
            
            expect(errorRecovery._executeRecoveryStrategy).toHaveBeenCalledTimes(4);
        });
    });

    describe('Private Helper Methods', () => {
        describe('_listBackups', () => {
            it('should list and sort backup files correctly', () => {
                const mockFiles = [
                    'TODO.json.2023-07-27T12-00-00-000Z.abc12345.backup',
                    'TODO.json.2023-07-27T11-00-00-000Z.def67890.backup',
                    'other-file.txt'
                ];
                
                const mockStats = { size: 1024, mtime: new Date('2023-07-27T12:00:00Z') };
                
                fs.readdirSync.mockReturnValue(mockFiles);
                fs.statSync.mockReturnValue(mockStats);
                
                const result = errorRecovery._listBackups(mockBackupPath);
                
                expect(result).toHaveLength(2); // Only backup files
                expect(result[0].filename).toBe('TODO.json.2023-07-27T12-00-00-000Z.abc12345.backup');
                expect(result[0].timestamp).toBe('2023-07-27T12-00-00-000Z');
                expect(result[0].checksum).toBe('abc12345');
                expect(result[0].size).toBe(1024);
            });
            
            it('should handle empty directory', () => {
                fs.readdirSync.mockReturnValue([]);
                
                const result = errorRecovery._listBackups(mockBackupPath);
                
                expect(result).toEqual([]);
            });
            
            it('should handle read errors gracefully', () => {
                fs.readdirSync.mockImplementation(() => {
                    throw new Error('Directory not accessible');
                });
                
                const result = errorRecovery._listBackups(mockBackupPath);
                
                expect(result).toEqual([]);
            });
        });

        describe('_validateBackup', () => {
            it('should validate backup successfully', async () => {
                const mockBackupContent = '{"project": "test", "tasks": [{"id": "1"}]}';
                const mockStats = { size: 1024, mtime: new Date('2023-07-27T12:00:00Z') };
                
                fs.readFileSync.mockReturnValue(mockBackupContent);
                fs.statSync.mockReturnValue(mockStats);
                
                const result = await errorRecovery._validateBackup('/test/backup.backup');
                
                expect(result.isValid).toBe(true);
                expect(result.backupInfo.size).toBe(1024);
                expect(result.backupInfo.taskCount).toBe(1);
                expect(result.backupInfo.project).toBe('test');
            });
            
            it('should detect invalid backup structure', async () => {
                const mockBackupContent = '{"invalid": "structure"}';
                
                fs.readFileSync.mockReturnValue(mockBackupContent);
                
                const result = await errorRecovery._validateBackup('/test/backup.backup');
                
                expect(result.isValid).toBe(false);
                expect(result.error).toBe('Invalid TODO.json structure in backup');
            });
            
            it('should handle JSON parse errors', async () => {
                fs.readFileSync.mockReturnValue('invalid json content');
                
                const result = await errorRecovery._validateBackup('/test/backup.backup');
                
                expect(result.isValid).toBe(false);
                expect(result.error).toMatch(/Unexpected token/);
            });
        });

        describe('_isLockValid', () => {
            beforeEach(() => {
                Date.now = jest.fn(() => 1690459200000);
            });

            it('should validate lock within timeout', () => {
                const lockInfo = { timestamp: 1690459198000 }; // 2 seconds ago
                
                const result = errorRecovery._isLockValid(lockInfo);
                
                expect(result).toBe(true);
            });
            
            it('should invalidate expired lock', () => {
                const lockInfo = { timestamp: 1690459190000 }; // 10 seconds ago (> 5 second timeout)
                
                const result = errorRecovery._isLockValid(lockInfo);
                
                expect(result).toBe(false);
            });
            
            it('should handle missing lock info', () => {
                expect(errorRecovery._isLockValid(null)).toBe(false);
                expect(errorRecovery._isLockValid({})).toBe(false);
                expect(errorRecovery._isLockValid({ timestamp: null })).toBe(false);
            });
        });

        describe('_cleanupOldBackups', () => {
            it('should remove excess backups', async () => {
                const mockBackups = [
                    { path: '/backup1.backup' },
                    { path: '/backup2.backup' },
                    { path: '/backup3.backup' },
                    { path: '/backup4.backup' }, // Should be deleted
                    { path: '/backup5.backup' }  // Should be deleted
                ];
                
                errorRecovery._listBackups = jest.fn().mockReturnValue(mockBackups);
                fs.unlinkSync.mockImplementation(() => {});
                
                await errorRecovery._cleanupOldBackups(mockBackupPath);
                
                expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
                expect(fs.unlinkSync).toHaveBeenCalledWith('/backup4.backup');
                expect(fs.unlinkSync).toHaveBeenCalledWith('/backup5.backup');
            });
            
            it('should not delete anything if within limit', async () => {
                const mockBackups = [
                    { path: '/backup1.backup' },
                    { path: '/backup2.backup' }
                ];
                
                errorRecovery._listBackups = jest.fn().mockReturnValue(mockBackups);
                
                await errorRecovery._cleanupOldBackups(mockBackupPath);
                
                expect(fs.unlinkSync).not.toHaveBeenCalled();
            });
            
            it('should handle cleanup errors gracefully', async () => {
                const mockBackups = [
                    { path: '/backup1.backup' },
                    { path: '/backup2.backup' },
                    { path: '/backup3.backup' },
                    { path: '/backup4.backup' }
                ];
                
                errorRecovery._listBackups = jest.fn().mockReturnValue(mockBackups);
                fs.unlinkSync.mockImplementation(() => {
                    throw new Error('Permission denied');
                });
                
                // Should not throw error
                await expect(errorRecovery._cleanupOldBackups(mockBackupPath)).resolves.toBeUndefined();
            });
        });
    });

    describe('Recovery Strategy Implementation', () => {
        describe('_strategyRestoreFromBackup', () => {
            it('should restore from backup successfully', async () => {
                const mockRestoreResult = { success: true };
                const mockFileContent = '{"project": "test", "tasks": []}';
                
                errorRecovery.restoreFromBackup = jest.fn().mockResolvedValue(mockRestoreResult);
                fs.readFileSync.mockReturnValue(mockFileContent);
                
                const result = await errorRecovery._strategyRestoreFromBackup(mockFilePath);
                
                expect(result.success).toBe(true);
                expect(result.message).toBe('Restored from backup successfully');
                expect(result.data).toEqual(JSON.parse(mockFileContent));
            });
            
            it('should handle restore failure', async () => {
                const mockRestoreResult = { success: false, error: 'No backups found' };
                
                errorRecovery.restoreFromBackup = jest.fn().mockResolvedValue(mockRestoreResult);
                
                const result = await errorRecovery._strategyRestoreFromBackup(mockFilePath);
                
                expect(result.success).toBe(false);
                expect(result.message).toBe('No backups found');
            });
        });

        describe('_strategyRepairJsonSyntax', () => {
            it('should repair JSON syntax successfully', async () => {
                const corruptedContent = '{"project": "test", "tasks": [],}'; // Trailing comma
                const repairedContent = '{"project": "test", "tasks": []}';
                
                fs.existsSync.mockReturnValue(true);
                fs.readFileSync.mockReturnValue(corruptedContent);
                errorRecovery.atomicWrite = jest.fn().mockResolvedValue({ success: true });
                
                const result = await errorRecovery._strategyRepairJsonSyntax(mockFilePath);
                
                expect(result.success).toBe(true);
                expect(result.message).toBe('Repaired JSON syntax');
                expect(result.data).toEqual(JSON.parse(repairedContent));
                
                expect(errorRecovery.atomicWrite).toHaveBeenCalledWith(
                    mockFilePath,
                    JSON.stringify(JSON.parse(repairedContent), null, 2)
                );
            });
            
            it('should handle file not found', async () => {
                fs.existsSync.mockReturnValue(false);
                
                const result = await errorRecovery._strategyRepairJsonSyntax(mockFilePath);
                
                expect(result.success).toBe(false);
                expect(result.message).toBe('File not found');
            });
            
            it('should handle unrepairable JSON', async () => {
                const corruptedContent = 'completely invalid json content {[';
                
                fs.existsSync.mockReturnValue(true);
                fs.readFileSync.mockReturnValue(corruptedContent);
                
                const result = await errorRecovery._strategyRepairJsonSyntax(mockFilePath);
                
                expect(result.success).toBe(false);
                expect(result.message).toMatch(/JSON repair failed:/);
            });
        });

        describe('_strategyCreateMinimalStructure', () => {
            it('should create minimal structure successfully', async () => {
                const expectedStructure = {
                    project: 'project',
                    tasks: [],
                    review_strikes: 0,
                    strikes_completed_last_run: false,
                    current_task_index: 0,
                    last_mode: null
                };
                
                errorRecovery.atomicWrite = jest.fn().mockResolvedValue({ success: true });
                
                const result = await errorRecovery._strategyCreateMinimalStructure(mockFilePath);
                
                expect(result.success).toBe(true);
                expect(result.message).toBe('Created minimal TODO.json structure');
                expect(result.data).toEqual(expectedStructure);
                
                expect(errorRecovery.atomicWrite).toHaveBeenCalledWith(
                    mockFilePath,
                    JSON.stringify(expectedStructure, null, 2)
                );
            });
        });
    });

    describe('Integration and Error Scenarios', () => {
        it('should handle complete backup and restore workflow', async () => {
            const originalContent = '{"project": "test", "tasks": [{"id": "1"}]}';
            const _corruptedContent = '{"project": "test", "tasks": [';
            
            // Setup mocks for backup creation
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(originalContent);
            fs.mkdirSync.mockImplementation(() => {});
            fs.copyFileSync.mockImplementation(() => {});
            fs.statSync.mockReturnValue({ size: 1024, mtime: new Date() });
            
            errorRecovery._cleanupOldBackups = jest.fn();
            
            // Create backup
            const backupResult = await errorRecovery.createBackup(mockFilePath);
            expect(backupResult.success).toBe(true);
            
            // Simulate corruption and recovery
            errorRecovery._listBackups = jest.fn().mockReturnValue([
                { path: backupResult.backupPath }
            ]);
            errorRecovery._validateBackup = jest.fn().mockResolvedValue({
                isValid: true,
                backupInfo: { size: 1024, taskCount: 1, project: 'test' }
            });
            
            // Restore from backup
            const restoreResult = await errorRecovery.restoreFromBackup(mockFilePath);
            expect(restoreResult.success).toBe(true);
        });
        
        it('should handle concurrent lock operations', async () => {
            const _lockPath = `${mockFilePath}.lock`;
            
            // First process acquires lock
            fs.existsSync.mockReturnValueOnce(false); // No existing lock
            fs.writeFileSync.mockImplementation(() => {});
            
            const firstLock = await errorRecovery.acquireLock(mockFilePath);
            expect(firstLock.success).toBe(true);
            
            // Second process tries to acquire same lock
            fs.existsSync.mockReturnValueOnce(true); // Lock exists
            errorRecovery._readLockFile = jest.fn().mockReturnValue({
                lockId: firstLock.lockId,
                timestamp: Date.now()
            });
            errorRecovery._isLockValid = jest.fn().mockReturnValue(true);
            
            const secondLock = await errorRecovery.acquireLock(mockFilePath);
            expect(secondLock.success).toBe(false);
            expect(secondLock.error).toBe('File is locked by another process');
            
            // First process releases lock
            fs.existsSync.mockReturnValueOnce(true);
            fs.unlinkSync.mockImplementation(() => {});
            
            const releaseResult = await errorRecovery.releaseLock(mockFilePath, firstLock.lockId);
            expect(releaseResult.success).toBe(true);
        });
        
        it('should handle filesystem permission errors gracefully', async () => {
            const content = '{"project": "test"}';
            
            // Test backup creation failure
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });
            
            const backupResult = await errorRecovery.createBackup(mockFilePath);
            expect(backupResult.success).toBe(false);
            expect(backupResult.error).toBe('Permission denied');
            
            // Test atomic write failure
            fs.existsSync.mockReturnValue(false);
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Disk full');
            });
            fs.unlinkSync.mockImplementation(() => {}); // Cleanup should work
            
            const writeResult = await errorRecovery.atomicWrite(mockFilePath, content);
            expect(writeResult.success).toBe(false);
            expect(writeResult.error).toBe('Disk full');
        });
    });
});