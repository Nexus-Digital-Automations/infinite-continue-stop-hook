/**
 * Test Error Handler Tests
 * 
 * Comprehensive tests for the TestErrorHandler class that provides
 * standardized error handling patterns and recovery strategies for test suites.
 */

const TestErrorHandler = require('../lib/testErrorHandler');
const fs = require('fs');
const path = require('path');

describe('TestErrorHandler', () => {
    let errorHandler;
    let testDir;

    beforeEach(() => {
        testDir = path.join(__dirname, 'temp-error-handler-test');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        
        errorHandler = new TestErrorHandler({
            maxRetries: 2,
            retryDelay: 100,
            timeout: 5000,
            enableLogging: false
        });
    });

    afterEach(() => {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    describe('Constructor and Configuration', () => {
        it('should initialize with default options', () => {
            const handler = new TestErrorHandler();
            expect(handler.options.maxRetries).toBe(3);
            expect(handler.options.retryDelay).toBe(1000);
            expect(handler.options.timeout).toBe(30000);
            expect(handler.options.enableLogging).toBe(true);
            expect(handler.options.enableRecovery).toBe(true);
        });

        it('should override default options with provided options', () => {
            const customOptions = {
                maxRetries: 5,
                retryDelay: 2000,
                timeout: 60000,
                enableLogging: false,
                enableRecovery: false
            };
            
            const handler = new TestErrorHandler(customOptions);
            expect(handler.options.maxRetries).toBe(5);
            expect(handler.options.retryDelay).toBe(2000);
            expect(handler.options.timeout).toBe(60000);
            expect(handler.options.enableLogging).toBe(false);
            expect(handler.options.enableRecovery).toBe(false);
        });

        it('should initialize error statistics', () => {
            expect(errorHandler.errorStats.totalErrors).toBe(0);
            expect(errorHandler.errorStats.recoveredErrors).toBe(0);
            expect(errorHandler.errorStats.fatalErrors).toBe(0);
            expect(errorHandler.errorStats.errorsByType).toBeInstanceOf(Map);
        });

        it('should set up default recovery strategies', () => {
            expect(errorHandler.errorRecoveryStrategies).toBeInstanceOf(Map);
            expect(errorHandler.errorRecoveryStrategies.size).toBeGreaterThan(0);
        });
    });

    describe('Error Handling and Recovery', () => {
        it('should handle errors with retry mechanism', async () => {
            let attemptCount = 0;
            const failingOperation = async () => {
                attemptCount++;
                if (attemptCount < 3) {
                    throw new Error('Operation failed');
                }
                return 'success';
            };

            const result = await errorHandler.handleWithRetry(failingOperation);
            expect(result).toBe('success');
            expect(attemptCount).toBe(3);
        });

        it('should respect max retry limit', async () => {
            const alwaysFailingOperation = async () => {
                throw new Error('Always fails');
            };

            await expect(errorHandler.handleWithRetry(alwaysFailingOperation))
                .rejects.toThrow('Always fails');
        });

        it('should track error statistics', async () => {
            const failingOperation = async () => {
                throw new Error('Test error');
            };

            try {
                await errorHandler.handleWithRetry(failingOperation);
            } catch {
                // Expected to fail
            }

            expect(errorHandler.errorStats.totalErrors).toBeGreaterThan(0);
        });

        it('should categorize errors by type', async () => {
            const fsError = new Error('ENOENT: no such file or directory');
            fsError.code = 'ENOENT';
            
            await errorHandler.recordError(fsError);
            
            expect(errorHandler.errorStats.errorsByType.has('ENOENT')).toBe(true);
        });
    });

    describe('Recovery Strategies', () => {
        it('should register custom recovery strategies', () => {
            const customStrategy = async (_error) => {
                return { recovered: true, result: 'custom recovery' };
            };

            errorHandler.registerRecoveryStrategy('CUSTOM_ERROR', customStrategy);
            expect(errorHandler.errorRecoveryStrategies.has('CUSTOM_ERROR')).toBe(true);
        });

        it('should apply recovery strategies to matching errors', async () => {
            const recoveryStrategy = async (_error) => {
                return { recovered: true, result: 'recovered successfully' };
            };

            errorHandler.registerRecoveryStrategy('TEST_ERROR', recoveryStrategy);
            
            const testError = new Error('Test error');
            testError.code = 'TEST_ERROR';
            
            const result = await errorHandler.tryRecover(testError);
            expect(result.recovered).toBe(true);
            expect(result.result).toBe('recovered successfully');
        });

        it('should handle file system errors with appropriate recovery', async () => {
            const fsError = new Error('ENOENT: no such file or directory');
            fsError.code = 'ENOENT';
            
            const result = await errorHandler.tryRecover(fsError);
            expect(typeof result).toBe('object');
        });
    });

    describe('Test Environment Management', () => {
        it('should handle test cleanup errors gracefully', async () => {
            const cleanupError = new Error('Cleanup failed');
            const result = await errorHandler.handleTestCleanupError(cleanupError, testDir);
            
            expect(typeof result).toBe('object');
            expect(result.handled).toBe(true);
        });

        it('should provide test isolation error handling', async () => {
            const isolationError = new Error('Test isolation failed');
            const result = await errorHandler.handleTestIsolationError(isolationError);
            
            expect(typeof result).toBe('object');
        });

        it('should manage test timeout errors', async () => {
            const timeoutError = new Error('Test timeout');
            timeoutError.name = 'TimeoutError';
            
            const result = await errorHandler.handleTimeoutError(timeoutError);
            expect(result.handled).toBe(true);
        });
    });

    describe('Error Analysis and Reporting', () => {
        it('should generate error summary reports', async () => {
            // Generate some test errors
            await errorHandler.recordError(new Error('Error 1'));
            await errorHandler.recordError(new Error('Error 2'));
            
            const summary = errorHandler.getErrorSummary();
            expect(summary.totalErrors).toBe(2);
            expect(summary.recoveredErrors).toBeDefined();
            expect(summary.fatalErrors).toBeDefined();
        });

        it('should identify error patterns', async () => {
            const fsError1 = new Error('ENOENT: file not found');
            fsError1.code = 'ENOENT';
            const fsError2 = new Error('ENOENT: another file not found');
            fsError2.code = 'ENOENT';
            
            await errorHandler.recordError(fsError1);
            await errorHandler.recordError(fsError2);
            
            const patterns = errorHandler.analyzeErrorPatterns();
            expect(patterns.mostCommonErrors).toBeDefined();
            expect(patterns.errorFrequency).toBeDefined();
        });

        it('should provide error context information', async () => {
            const contextError = new Error('Context test error');
            const context = {
                testName: 'test context',
                testFile: 'context.test.js',
                additionalInfo: 'test context data'
            };
            
            await errorHandler.recordErrorWithContext(contextError, context);
            
            const errorDetails = errorHandler.getErrorDetails(contextError);
            expect(errorDetails.context).toBeDefined();
            expect(errorDetails.context.testName).toBe('test context');
        });
    });

    describe('Integration with Test Frameworks', () => {
        it('should handle Jest-specific errors', async () => {
            const jestError = new Error('Jest assertion failed');
            jestError.matcherResult = { pass: false };
            
            const result = await errorHandler.handleJestError(jestError);
            expect(result.handled).toBe(true);
        });

        it('should provide test setup error handling', async () => {
            const setupError = new Error('Test setup failed');
            const result = await errorHandler.handleTestSetupError(setupError);
            
            expect(result.handled).toBe(true);
            expect(result.suggestions).toBeDefined();
        });

        it('should handle mock-related errors', async () => {
            const mockError = new Error('Mock function failed');
            mockError.isMockError = true;
            
            const result = await errorHandler.handleMockError(mockError);
            expect(result.handled).toBe(true);
        });
    });

    describe('Performance and Monitoring', () => {
        it('should track error handling performance', async () => {
            const _startTime = Date.now();
            
            await errorHandler.recordError(new Error('Performance test'));
            
            const metrics = errorHandler.getPerformanceMetrics();
            expect(metrics.averageHandlingTime).toBeDefined();
            expect(metrics.totalHandlingTime).toBeGreaterThanOrEqual(0);
        });

        it('should monitor error recovery success rates', async () => {
            // Simulate some recoverable errors
            const recoverableError = new Error('Recoverable error');
            recoverableError.code = 'RECOVERABLE';
            
            errorHandler.registerRecoveryStrategy('RECOVERABLE', async () => ({
                recovered: true,
                result: 'recovered'
            }));
            
            await errorHandler.tryRecover(recoverableError);
            
            const stats = errorHandler.getRecoveryStats();
            expect(stats.recoveryRate).toBeDefined();
            expect(stats.successfulRecoveries).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Edge Cases and Error Boundaries', () => {
        it('should handle null and undefined errors gracefully', async () => {
            const result1 = await errorHandler.recordError(null);
            const result2 = await errorHandler.recordError(undefined);
            
            expect(result1).toBeDefined();
            expect(result2).toBeDefined();
        });

        it('should handle circular reference errors', async () => {
            const circularError = new Error('Circular reference');
            circularError.circular = circularError;
            
            const result = await errorHandler.recordError(circularError);
            expect(result.handled).toBe(true);
        });

        it('should handle very large error objects', async () => {
            const largeError = new Error('Large error');
            largeError.largeData = 'x'.repeat(100000);
            
            const result = await errorHandler.recordError(largeError);
            expect(result.handled).toBe(true);
        });

        it('should handle concurrent error processing', async () => {
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(errorHandler.recordError(new Error(`Concurrent error ${i}`)));
            }
            
            const results = await Promise.all(promises);
            expect(results).toHaveLength(10);
            results.forEach(result => {
                expect(result.handled).toBe(true);
            });
        });
    });
});