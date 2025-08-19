const fs = require('fs');
const path = require('path');
const os = require('os');
const DistributedLockManager = require('../lib/distributedLockManager');

describe('DistributedLockManager', () => {
    let lockManager;
    let testLockDir;
    let testFilePath;

    beforeEach(() => {
        // Create temporary directory for locks
        testLockDir = path.join(os.tmpdir(), `test-locks-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        testFilePath = path.join(testLockDir, 'test-file.txt');
        
        // Temporarily disable filesystem protection for lock tests
        process.env.DISABLE_FS_PROTECTION = 'true';
        
        lockManager = new DistributedLockManager({
            lockDirectory: testLockDir,
            lockTimeout: 5000,
            lockRetryInterval: 50,
            maxRetries: 10
        });
    });

    afterEach(async () => {
        // Cleanup
        if (lockManager) {
            lockManager.cleanup();
        }
        
        // Remove test directory
        if (fs.existsSync(testLockDir)) {
            fs.rmSync(testLockDir, { recursive: true, force: true });
        }
        
        // Re-enable filesystem protection
        delete process.env.DISABLE_FS_PROTECTION;
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with default options', () => {
            const defaultManager = new DistributedLockManager();
            expect(defaultManager.options.lockTimeout).toBe(5000);
            expect(defaultManager.options.lockRetryInterval).toBe(10);
            expect(defaultManager.options.maxRetries).toBe(20);
            expect(defaultManager.options.lockDirectory).toBe('./.locks');
            expect(defaultManager.options.enableDeadlockDetection).toBe(true);
            defaultManager.cleanup();
        });

        test('should initialize with custom options', () => {
            expect(lockManager.options.lockTimeout).toBe(5000);
            expect(lockManager.options.lockRetryInterval).toBe(50);
            expect(lockManager.options.maxRetries).toBe(10);
            expect(lockManager.options.lockDirectory).toBe(testLockDir);
        });

        test('should create lock directory if it does not exist', () => {
            expect(fs.existsSync(testLockDir)).toBe(true);
        });

        test('should initialize internal data structures', () => {
            expect(lockManager.activeLocks).toBeInstanceOf(Map);
            expect(lockManager.waitingQueue).toBeInstanceOf(Map);
            expect(lockManager.agentLocks).toBeInstanceOf(Map);
            expect(lockManager.lockDependencies).toBeInstanceOf(Map);
        });
    });

    describe('Lock Acquisition', () => {
        test('should successfully acquire a lock', async () => {
            const result = await lockManager.acquireLock(testFilePath, 'agent1');
            
            expect(result.success).toBe(true);
            expect(result.lockId).toBeDefined();
            expect(result.lockFile).toBeDefined();
            expect(result.acquiredAt).toBeDefined();
            expect(result.expiresAt).toBeDefined();
            expect(fs.existsSync(result.lockFile)).toBe(true);
        });

        test('should fail to acquire lock when already held by another agent', async () => {
            // Agent 1 acquires lock
            const result1 = await lockManager.acquireLock(testFilePath, 'agent1');
            expect(result1.success).toBe(true);

            // Agent 2 tries to acquire same lock (should fail quickly due to low retry count)
            const result2 = await lockManager.acquireLock(testFilePath, 'agent2');
            expect(result2.success).toBe(false);
            expect(result2.error).toContain('timeout');
        });

        test('should generate consistent lock IDs for same file path', () => {
            const lockId1 = lockManager.generateLockId(testFilePath);
            const lockId2 = lockManager.generateLockId(testFilePath);
            expect(lockId1).toBe(lockId2);
        });

        test('should generate different lock IDs for different file paths', () => {
            const lockId1 = lockManager.generateLockId(testFilePath);
            const lockId2 = lockManager.generateLockId(testFilePath + '.different');
            expect(lockId1).not.toBe(lockId2);
        });

        test('should respect custom timeout', async () => {
            const startTime = Date.now();
            const result = await lockManager.acquireLock(testFilePath, 'agent1', 1000);
            const endTime = Date.now();
            
            expect(result.success).toBe(true);
            expect(endTime - startTime).toBeLessThan(2000);
        });

        test('should update internal tracking when lock is acquired', async () => {
            const result = await lockManager.acquireLock(testFilePath, 'agent1');
            expect(result.success).toBe(true);

            expect(lockManager.activeLocks.size).toBe(1);
            expect(lockManager.agentLocks.get('agent1')).toContain(result.lockId);
        });
    });

    describe('Lock Release', () => {
        test('should successfully release an owned lock', async () => {
            const acquireResult = await lockManager.acquireLock(testFilePath, 'agent1');
            expect(acquireResult.success).toBe(true);

            const releaseResult = await lockManager.releaseLock(testFilePath, 'agent1');
            expect(releaseResult.success).toBe(true);
            expect(releaseResult.lockId).toBe(acquireResult.lockId);
            expect(fs.existsSync(acquireResult.lockFile)).toBe(false);
        });

        test('should fail to release lock not owned by agent', async () => {
            const acquireResult = await lockManager.acquireLock(testFilePath, 'agent1');
            expect(acquireResult.success).toBe(true);

            const releaseResult = await lockManager.releaseLock(testFilePath, 'agent2');
            expect(releaseResult.success).toBe(false);
            expect(releaseResult.error).toContain('not owned');
        });

        test('should fail to release non-existent lock', async () => {
            const releaseResult = await lockManager.releaseLock(testFilePath, 'agent1');
            expect(releaseResult.success).toBe(false);
            expect(releaseResult.error).toContain('not owned');
        });

        test('should update internal tracking when lock is released', async () => {
            const acquireResult = await lockManager.acquireLock(testFilePath, 'agent1');
            expect(acquireResult.success).toBe(true);
            expect(lockManager.activeLocks.size).toBe(1);

            await lockManager.releaseLock(testFilePath, 'agent1');
            expect(lockManager.activeLocks.size).toBe(0);
            expect(lockManager.agentLocks.has('agent1')).toBe(false);
        });
    });

    describe('Conflict Detection', () => {
        test('should detect no conflicts for unlocked file', async () => {
            const result = await lockManager.detectConflicts(testFilePath, 'agent1', 'read');
            
            expect(result.hasConflicts).toBe(false);
            expect(result.severity).toBe('none');
            expect(result.conflicts).toHaveLength(0);
            expect(result.recommendation).toContain('No conflicts');
        });

        test('should detect active lock conflict', async () => {
            await lockManager.acquireLock(testFilePath, 'agent1');
            
            const result = await lockManager.detectConflicts(testFilePath, 'agent2', 'read');
            
            expect(result.hasConflicts).toBe(true);
            expect(result.conflicts).toHaveLength(1);
            expect(result.conflicts[0].type).toBe('active_lock');
            expect(result.conflicts[0].conflictingAgent).toBe('agent1');
        });

        test('should detect high severity for write-write conflicts', async () => {
            await lockManager.acquireLock(testFilePath, 'agent1');
            
            const result = await lockManager.detectConflicts(testFilePath, 'agent2', 'write');
            
            expect(result.hasConflicts).toBe(true);
            expect(result.severity).toBe('high');
            expect(result.recommendation).toContain('exclusive access');
        });

        test('should not conflict with own locks', async () => {
            await lockManager.acquireLock(testFilePath, 'agent1');
            
            const result = await lockManager.detectConflicts(testFilePath, 'agent1', 'read');
            
            expect(result.hasConflicts).toBe(false);
        });
    });

    describe('Conflict Resolution', () => {
        test('should resolve conflicts with merge strategy', async () => {
            const conflict = { type: 'test_conflict' };
            const result = await lockManager.resolveConflict(conflict, 'merge');
            
            expect(result.success).toBe(true);
            expect(result.strategy).toBe('merge');
        });

        test('should resolve conflicts with queue strategy', async () => {
            const conflict = { type: 'test_conflict' };
            const result = await lockManager.resolveConflict(conflict, 'queue');
            
            expect(result.success).toBe(true);
            expect(result.strategy).toBe('queue');
        });

        test('should resolve conflicts with force strategy', async () => {
            const conflict = { type: 'test_conflict' };
            const result = await lockManager.resolveConflict(conflict, 'force');
            
            expect(result.success).toBe(true);
            expect(result.strategy).toBe('force');
        });

        test('should resolve conflicts with abort strategy', async () => {
            const conflict = { type: 'test_conflict' };
            const result = await lockManager.resolveConflict(conflict, 'abort');
            
            expect(result.success).toBe(false);
            expect(result.strategy).toBe('abort');
        });

        test('should fail with unknown resolution strategy', async () => {
            const conflict = { type: 'test_conflict' };
            const result = await lockManager.resolveConflict(conflict, 'unknown');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Unknown resolution strategy');
        });
    });

    describe('Deadlock Detection', () => {
        test('should not detect deadlock for single agent', async () => {
            lockManager.addLockDependency('agent1', 'lock1');
            
            const deadlock = await lockManager.detectDeadlock('agent1');
            expect(deadlock).toBeNull();
            
            lockManager.removeLockDependency('agent1', 'lock1');
        });

        test('should detect circular deadlock', async () => {
            // Set up circular dependency: agent1 -> lock1 -> agent2 -> lock2 -> agent1
            const lock1Result = await lockManager.acquireLock(testFilePath, 'agent1');
            const lock2Result = await lockManager.acquireLock(testFilePath + '2', 'agent2');
            
            expect(lock1Result.success).toBe(true);
            expect(lock2Result.success).toBe(true);
            
            // Add dependencies to simulate waiting
            lockManager.addLockDependency('agent1', lockManager.generateLockId(testFilePath + '2'));
            lockManager.addLockDependency('agent2', lockManager.generateLockId(testFilePath));
            
            const deadlock = await lockManager.detectDeadlock('agent1');
            expect(deadlock).not.toBeNull();
            expect(deadlock).toContain('agent1');
        });

        test('should properly manage lock dependencies', () => {
            lockManager.addLockDependency('agent1', 'lock1');
            lockManager.addLockDependency('agent1', 'lock2');
            
            expect(lockManager.lockDependencies.get('agent1')).toContain('lock1');
            expect(lockManager.lockDependencies.get('agent1')).toContain('lock2');
            
            lockManager.removeLockDependency('agent1', 'lock1');
            expect(lockManager.lockDependencies.get('agent1')).not.toContain('lock1');
            expect(lockManager.lockDependencies.get('agent1')).toContain('lock2');
            
            lockManager.removeLockDependency('agent1', 'lock2');
            expect(lockManager.lockDependencies.has('agent1')).toBe(false);
        });
    });

    describe('Stale Lock Cleanup', () => {
        test('should clean up stale locks', async () => {
            // Create lock manager with very short timeout for testing
            const shortTimeoutManager = new DistributedLockManager({
                lockDirectory: testLockDir,
                lockTimeout: 100
            });
            
            const result = await shortTimeoutManager.acquireLock(testFilePath, 'agent1');
            expect(result.success).toBe(true);
            expect(shortTimeoutManager.activeLocks.size).toBe(1);
            
            // Wait for lock to become stale
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Run cleanup
            await shortTimeoutManager.cleanupStaleLocks();
            
            expect(shortTimeoutManager.activeLocks.size).toBe(0);
            expect(fs.existsSync(result.lockFile)).toBe(false);
            
            shortTimeoutManager.cleanup();
        });

        test('should not clean up fresh locks', async () => {
            const result = await lockManager.acquireLock(testFilePath, 'agent1');
            expect(result.success).toBe(true);
            
            await lockManager.cleanupStaleLocks();
            
            expect(lockManager.activeLocks.size).toBe(1);
            expect(fs.existsSync(result.lockFile)).toBe(true);
        });
    });

    describe('Statistics and Utilities', () => {
        test('should provide accurate statistics', async () => {
            const stats1 = lockManager.getStatistics();
            expect(stats1.activeLocks).toBe(0);
            expect(stats1.agentsWithLocks).toBe(0);
            
            await lockManager.acquireLock(testFilePath, 'agent1');
            await lockManager.acquireLock(testFilePath + '2', 'agent1');
            await lockManager.acquireLock(testFilePath + '3', 'agent2');
            
            const stats2 = lockManager.getStatistics();
            expect(stats2.activeLocks).toBe(3);
            expect(stats2.agentsWithLocks).toBe(2);
            expect(stats2.totalLocksHeld).toBe(3);
        });

        test('should return correct lock file path', () => {
            const lockId = 'test123';
            const expectedPath = path.join(testLockDir, `${lockId}.lock`);
            expect(lockManager.getLockFilePath(lockId)).toBe(expectedPath);
        });

        test('should sleep for specified duration', async () => {
            const startTime = Date.now();
            await lockManager.sleep(100);
            const endTime = Date.now();
            
            expect(endTime - startTime).toBeGreaterThanOrEqual(90);
            expect(endTime - startTime).toBeLessThan(200);
        });
    });

    describe('Atomic Lock Operations', () => {
        test('should perform atomic lock acquisition', async () => {
            const lockFile = lockManager.getLockFilePath('test123');
            const result = await lockManager.attemptLockAcquisition(lockFile, 'agent1', 'test123');
            
            expect(result.success).toBe(true);
            expect(result.lockData).toBeDefined();
            expect(result.lockData.agentId).toBe('agent1');
            expect(result.lockData.lockId).toBe('test123');
            expect(fs.existsSync(lockFile)).toBe(true);
            
            // Cleanup
            fs.unlinkSync(lockFile);
        });

        test('should detect stale locks during acquisition', async () => {
            const lockFile = lockManager.getLockFilePath('test123');
            
            // Create stale lock
            const staleLockData = {
                lockId: 'test123',
                agentId: 'old_agent',
                acquiredAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
                pid: 99999,
                hostname: 'old_host'
            };
            fs.writeFileSync(lockFile, JSON.stringify(staleLockData));
            
            // Attempt acquisition should remove stale lock and succeed
            const result = await lockManager.attemptLockAcquisition(lockFile, 'agent1', 'test123');
            
            expect(result.success).toBe(true);
            expect(result.lockData.agentId).toBe('agent1');
            
            // Cleanup
            if (fs.existsSync(lockFile)) {
                fs.unlinkSync(lockFile);
            }
        });

        test('should fail acquisition for valid existing lock', async () => {
            const lockFile = lockManager.getLockFilePath('test123');
            
            // Create valid lock
            const validLockData = {
                lockId: 'test123',
                agentId: 'existing_agent',
                acquiredAt: new Date().toISOString(),
                pid: process.pid,
                hostname: os.hostname()
            };
            fs.writeFileSync(lockFile, JSON.stringify(validLockData));
            
            // Attempt acquisition should fail
            const result = await lockManager.attemptLockAcquisition(lockFile, 'agent1', 'test123');
            
            expect(result.success).toBe(false);
            expect(result.reason).toContain('another agent');
            
            // Cleanup
            fs.unlinkSync(lockFile);
        });
    });

    describe('Cleanup and Resource Management', () => {
        test('should clean up all resources on cleanup', async () => {
            await lockManager.acquireLock(testFilePath, 'agent1');
            await lockManager.acquireLock(testFilePath + '2', 'agent2');
            
            expect(lockManager.activeLocks.size).toBe(2);
            
            lockManager.cleanup();
            
            expect(lockManager.activeLocks.size).toBe(0);
            expect(lockManager.agentLocks.size).toBe(0);
            expect(lockManager.waitingQueue.size).toBe(0);
            expect(lockManager.lockDependencies.size).toBe(0);
            expect(lockManager.cleanupTimer).toBeNull();
        });

        test('should handle cleanup errors gracefully', async () => {
            const result = await lockManager.acquireLock(testFilePath, 'agent1');
            
            // Manually delete lock file to simulate cleanup error
            fs.unlinkSync(result.lockFile);
            
            // Cleanup should not throw
            expect(() => lockManager.cleanup()).not.toThrow();
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle file system errors during lock acquisition', async () => {
            // Create lock manager with invalid directory
            const invalidManager = new DistributedLockManager({
                lockDirectory: '/invalid/path/that/cannot/be/created'
            });
            
            const result = await invalidManager.acquireLock(testFilePath, 'agent1');
            expect(result.success).toBe(false);
            expect(result.error).toContain('failed');
            
            invalidManager.cleanup();
        });

        test('should handle concurrent lock attempts', async () => {
            // Start multiple lock acquisition attempts simultaneously
            const promises = [
                lockManager.acquireLock(testFilePath, 'agent1'),
                lockManager.acquireLock(testFilePath, 'agent2'),
                lockManager.acquireLock(testFilePath, 'agent3')
            ];
            
            const results = await Promise.all(promises);
            
            // Only one should succeed
            const successfulResults = results.filter(r => r.success);
            const failedResults = results.filter(r => !r.success);
            
            expect(successfulResults).toHaveLength(1);
            expect(failedResults).toHaveLength(2);
        });

        test('should handle very short timeouts', async () => {
            const result = await lockManager.acquireLock(testFilePath, 'agent1', 1); // 1ms timeout
            
            // Should either succeed quickly or timeout
            if (!result.success) {
                expect(result.error).toContain('timeout');
            }
        });
    });
});