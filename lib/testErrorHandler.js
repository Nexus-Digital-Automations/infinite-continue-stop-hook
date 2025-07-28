// =============================================================================
// testErrorHandler.js - Comprehensive Error Handling Patterns for Test Suites
// 
// This module provides standardized error handling patterns, recovery strategies,
// and resilience mechanisms for all test suites to ensure consistent behavior
// across different failure scenarios.
// =============================================================================

class TestErrorHandler {
    constructor(options = {}) {
        this.options = {
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            timeout: options.timeout || 30000,
            enableLogging: options.enableLogging !== false,
            enableRecovery: options.enableRecovery !== false,
            ...options
        };
        
        this.errorStats = {
            totalErrors: 0,
            recoveredErrors: 0,
            fatalErrors: 0,
            errorsByType: new Map()
        };
        
        this.errorRecoveryStrategies = new Map();
        this.setupDefaultRecoveryStrategies();
    }

    /**
     * Sets up default error recovery strategies for common error types
     */
    setupDefaultRecoveryStrategies() {
        // File system errors
        this.errorRecoveryStrategies.set('ENOENT', this.handleFileNotFound.bind(this));
        this.errorRecoveryStrategies.set('EACCES', this.handlePermissionDenied.bind(this));
        this.errorRecoveryStrategies.set('EMFILE', this.handleTooManyFiles.bind(this));
        
        // Network/timeout errors
        this.errorRecoveryStrategies.set('ETIMEDOUT', this.handleTimeout.bind(this));
        this.errorRecoveryStrategies.set('ECONNRESET', this.handleConnectionReset.bind(this));
        this.errorRecoveryStrategies.set('ECONNREFUSED', this.handleConnectionRefused.bind(this));
        
        // JSON/parsing errors
        this.errorRecoveryStrategies.set('SyntaxError', this.handleSyntaxError.bind(this));
        this.errorRecoveryStrategies.set('JSONParseError', this.handleJSONParseError.bind(this));
        
        // Test-specific errors
        this.errorRecoveryStrategies.set('MockError', this.handleMockError.bind(this));
        this.errorRecoveryStrategies.set('AssertionError', this.handleAssertionError.bind(this));
        this.errorRecoveryStrategies.set('TimeoutError', this.handleTestTimeout.bind(this));
    }

    /**
     * Wraps an async operation with comprehensive error handling and recovery
     * @param {Function} operation - The async operation to wrap
     * @param {Object} context - Context information for error handling
     * @returns {Promise} Promise that resolves with result or handled error
     */
    async withErrorHandling(operation, context = {}) {
        const operationName = context.operation || 'UnknownOperation';
        const maxRetries = context.maxRetries || this.options.maxRetries;
        
        let lastError = null;
        let attempt = 0;
        
        while (attempt <= maxRetries) {
            try {
                // Add timeout wrapper if specified
                if (context.timeout || this.options.timeout) {
                    const timeoutMs = context.timeout || this.options.timeout;
                    return await this.withTimeout(operation, timeoutMs, context);
                }
                
                return await operation();
                
            } catch (error) {
                lastError = error;
                attempt++;
                
                this.recordError(error, operationName, attempt);
                
                // Try to recover from the error
                const recoveryResult = await this.attemptRecovery(error, context, attempt);
                
                if (recoveryResult.recovered) {
                    this.errorStats.recoveredErrors++;
                    
                    if (recoveryResult.shouldRetry && attempt <= maxRetries) {
                        await this.delay(this.options.retryDelay * attempt);
                        continue;
                    } else if (recoveryResult.result) {
                        return recoveryResult.result;
                    }
                }
                
                // If this was the last attempt or recovery failed, break
                if (attempt > maxRetries || !recoveryResult.shouldRetry) {
                    break;
                }
                
                await this.delay(this.options.retryDelay * attempt);
            }
        }
        
        // If we get here, all attempts failed
        this.errorStats.fatalErrors++;
        throw this.createEnhancedError(lastError, operationName, attempt, context);
    }

    /**
     * Wraps operation with timeout handling
     * @param {Function} operation - The operation to wrap
     * @param {number} timeoutMs - Timeout in milliseconds
     * @param {Object} context - Context for error handling
     * @returns {Promise} Promise that resolves or times out
     */
    async withTimeout(operation, timeoutMs, context = {}) {
        return new Promise((resolve, reject) => {
            const timeoutId = global.setTimeout(() => {
                const timeoutError = new Error(`Operation timed out after ${timeoutMs}ms`);
                timeoutError.code = 'ETIMEDOUT';
                timeoutError.context = context;
                reject(timeoutError);
            }, timeoutMs);
            
            operation().then(result => {
                global.clearTimeout(timeoutId);
                resolve(result);
            }).catch(error => {
                global.clearTimeout(timeoutId);
                reject(error);
            });
        });
    }

    /**
     * Attempts to recover from an error using registered strategies
     * @param {Error} error - The error to recover from
     * @param {Object} context - Context information
     * @param {number} attempt - Current attempt number
     * @returns {Object} Recovery result
     */
    async attemptRecovery(error, context, attempt) {
        if (!this.options.enableRecovery) {
            return { recovered: false, shouldRetry: false };
        }
        
        const errorType = error.code || error.name || 'UnknownError';
        const recoveryStrategy = this.errorRecoveryStrategies.get(errorType);
        
        if (recoveryStrategy) {
            try {
                const result = await recoveryStrategy(error, context, attempt);
                return {
                    recovered: true,
                    shouldRetry: result.shouldRetry !== false,
                    result: result.result
                };
            } catch (recoveryError) {
                this.log(`Recovery strategy failed for ${errorType}:`, recoveryError);
                return { recovered: false, shouldRetry: false };
            }
        }
        
        // Generic recovery based on error characteristics
        return this.genericRecovery(error, context, attempt);
    }

    /**
     * Generic recovery strategies for unknown error types
     * @param {Error} error - The error to recover from
     * @param {Object} context - Context information
     * @param {number} attempt - Current attempt number
     * @returns {Object} Recovery result
     */
    genericRecovery(error, context, attempt) {
        // Transient errors should be retried
        const transientPatterns = [
            /network/i, /connection/i, /timeout/i, /temporary/i, /busy/i
        ];
        
        const isTransient = transientPatterns.some(pattern => 
            pattern.test(error.message) || pattern.test(error.code || '')
        );
        
        if (isTransient && attempt <= this.options.maxRetries) {
            return { recovered: true, shouldRetry: true };
        }
        
        return { recovered: false, shouldRetry: false };
    }

    /**
     * Recovery strategy for file not found errors
     */
    async handleFileNotFound(error, context, _attempt) {
        const filePath = this.extractFilePathFromError(error);
        
        if (context.createMissingFiles && filePath) {
            try {
                const fs = require('fs');
                const path = require('path');
                
                // Create directory if it doesn't exist
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                
                // Create empty file or use provided content
                const content = context.defaultFileContent || '{}';
                fs.writeFileSync(filePath, content, 'utf8');
                
                this.log(`Created missing file: ${filePath}`);
                return { shouldRetry: true };
            } catch (createError) {
                this.log(`Failed to create missing file ${filePath}:`, createError);
            }
        }
        
        return { shouldRetry: false };
    }

    /**
     * Recovery strategy for permission denied errors
     */
    async handlePermissionDenied(error, context, _attempt) {
        // In test environment, try to use alternative paths or mock operations
        if (context.useAlternativePath && typeof context.useAlternativePath === 'function') {
            try {
                const altResult = await context.useAlternativePath();
                return { shouldRetry: false, result: altResult };
            } catch (altError) {
                this.log('Alternative path failed:', altError);
            }
        }
        
        return { shouldRetry: false };
    }

    /**
     * Recovery strategy for too many open files
     */
    async handleTooManyFiles(error, context, attempt) {
        // Force garbage collection and wait
        if (global.gc) {
            global.gc();
        }
        
        await this.delay(1000 * attempt);
        return { shouldRetry: true };
    }

    /**
     * Recovery strategy for timeout errors
     */
    async handleTimeout(error, context, attempt) {
        const backoffDelay = Math.min(this.options.retryDelay * Math.pow(2, attempt - 1), 10000);
        await this.delay(backoffDelay);
        return { shouldRetry: attempt <= this.options.maxRetries };
    }

    /**
     * Recovery strategy for connection reset errors
     */
    async handleConnectionReset(error, context, attempt) {
        await this.delay(this.options.retryDelay * attempt);
        return { shouldRetry: attempt <= this.options.maxRetries };
    }

    /**
     * Recovery strategy for connection refused errors
     */
    async handleConnectionRefused(error, context, attempt) {
        // For tests, might indicate service not ready
        const waitTime = 2000 * attempt;
        await this.delay(waitTime);
        return { shouldRetry: attempt <= 2 }; // Limit retries for connection refused
    }

    /**
     * Recovery strategy for syntax errors
     */
    async handleSyntaxError(error, context, _attempt) {
        // Syntax errors are usually not recoverable
        if (context.fallbackData) {
            return { shouldRetry: false, result: context.fallbackData };
        }
        return { shouldRetry: false };
    }

    /**
     * Recovery strategy for JSON parse errors
     */
    async handleJSONParseError(error, context, attempt) {
        // Try to fix common JSON issues or use fallback
        if (context.rawContent && attempt === 1) {
            try {
                // Try to fix common JSON issues
                let fixed = context.rawContent
                    .replace(/,\s*}/g, '}')  // Remove trailing commas
                    .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
                    .replace(/'/g, '"');     // Replace single quotes with double quotes
                
                const parsed = JSON.parse(fixed);
                return { shouldRetry: false, result: parsed };
            } catch (fixError) {
                this.log('JSON fix attempt failed:', fixError);
            }
        }
        
        if (context.fallbackData) {
            return { shouldRetry: false, result: context.fallbackData };
        }
        
        return { shouldRetry: false };
    }

    /**
     * Recovery strategy for mock errors
     */
    async handleMockError(error, context, _attempt) {
        if (context.resetMocks && typeof context.resetMocks === 'function') {
            try {
                await context.resetMocks();
                return { shouldRetry: true };
            } catch (resetError) {
                this.log('Mock reset failed:', resetError);
            }
        }
        
        return { shouldRetry: false };
    }

    /**
     * Recovery strategy for assertion errors
     */
    async handleAssertionError(error, context, _attempt) {
        // Assertion errors usually indicate test logic issues
        // Log detailed information for debugging
        this.log('Assertion Error Details:', {
            message: error.message,
            actual: error.actual,
            expected: error.expected,
            operator: error.operator,
            context: context
        });
        
        return { shouldRetry: false };
    }

    /**
     * Recovery strategy for test timeout errors
     */
    async handleTestTimeout(error, context, attempt) {
        // For test timeouts, we might want to extend the timeout and retry once
        if (attempt === 1 && context.extendTimeout) {
            context.timeout = (context.timeout || this.options.timeout) * 2;
            return { shouldRetry: true };
        }
        
        return { shouldRetry: false };
    }

    /**
     * Records error statistics for monitoring and analysis
     * @param {Error} error - The error to record
     * @param {string} operation - The operation that failed
     * @param {number} attempt - The attempt number
     */
    recordError(error, operation, attempt) {
        this.errorStats.totalErrors++;
        
        const errorType = error.code || error.name || 'UnknownError';
        const count = this.errorStats.errorsByType.get(errorType) || 0;
        this.errorStats.errorsByType.set(errorType, count + 1);
        
        if (this.options.enableLogging) {
            this.log(`Error in ${operation} (attempt ${attempt}):`, {
                type: errorType,
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 3).join('\n')
            });
        }
    }

    /**
     * Creates an enhanced error with additional context and recovery information
     * @param {Error} originalError - The original error
     * @param {string} operation - The operation that failed
     * @param {number} attempts - Number of attempts made
     * @param {Object} context - Additional context
     * @returns {Error} Enhanced error
     */
    createEnhancedError(originalError, operation, attempts, context) {
        const enhancedError = new Error(
            `Operation '${operation}' failed after ${attempts} attempts: ${originalError.message}`
        );
        
        enhancedError.name = 'TestOperationError';
        enhancedError.originalError = originalError;
        enhancedError.operation = operation;
        enhancedError.attempts = attempts;
        enhancedError.context = context;
        enhancedError.stack = originalError.stack;
        enhancedError.errorStats = this.getErrorStats();
        
        return enhancedError;
    }

    /**
     * Extracts file path from error message or context
     * @param {Error} error - The error to extract path from
     * @returns {string|null} File path if found
     */
    extractFilePathFromError(error) {
        // Try to extract file path from error message
        const pathPatterns = [
            /ENOENT: no such file or directory, open '([^']+)'/,
            /Cannot find module '([^']+)'/,
            /Error: ENOENT: .* '([^']+)'/
        ];
        
        for (const pattern of pathPatterns) {
            const match = error.message.match(pattern);
            if (match) {
                return match[1];
            }
        }
        
        // Check if path is in error object
        if (error.path) {
            return error.path;
        }
        
        return null;
    }

    /**
     * Utility method for delays
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => global.setTimeout(resolve, ms));
    }

    /**
     * Logging method with optional formatting
     * @param {string} message - Log message
     * @param {*} data - Additional data to log
     */
    log(message, data = null) {
        if (!this.options.enableLogging) return;
        
        const timestamp = new Date().toISOString();
        if (data) {
            console.log(`[${timestamp}] TestErrorHandler: ${message}`, data);
        } else {
            console.log(`[${timestamp}] TestErrorHandler: ${message}`);
        }
    }

    /**
     * Gets current error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        return {
            ...this.errorStats,
            errorsByType: Object.fromEntries(this.errorStats.errorsByType),
            recoveryRate: this.errorStats.totalErrors > 0 
                ? (this.errorStats.recoveredErrors / this.errorStats.totalErrors) * 100 
                : 0
        };
    }

    /**
     * Resets error statistics
     */
    resetStats() {
        this.errorStats = {
            totalErrors: 0,
            recoveredErrors: 0,
            fatalErrors: 0,
            errorsByType: new Map()
        };
    }

    /**
     * Registers a custom error recovery strategy
     * @param {string} errorType - Error type or code
     * @param {Function} strategy - Recovery strategy function
     */
    registerRecoveryStrategy(errorType, strategy) {
        this.errorRecoveryStrategies.set(errorType, strategy);
    }

    /**
     * Creates a resilient test environment with automatic error handling
     * @param {Object} options - Environment options
     * @returns {Object} Test environment with error handling
     */
    createResilientTestEnv(options = {}) {
        const self = this;
        
        return {
            // Wrapped fs operations
            fs: {
                readFile: (path, encoding = 'utf8') => 
                    self.withErrorHandling(
                        () => require('fs').readFileSync(path, encoding),
                        { 
                            operation: 'readFile', 
                            createMissingFiles: options.createMissingFiles,
                            defaultFileContent: options.defaultFileContent || '{}'
                        }
                    ),
                
                writeFile: (path, content) =>
                    self.withErrorHandling(
                        () => require('fs').writeFileSync(path, content, 'utf8'),
                        { operation: 'writeFile' }
                    ),
                
                exists: (path) =>
                    self.withErrorHandling(
                        () => require('fs').existsSync(path),
                        { operation: 'exists' }
                    )
            },
            
            // Wrapped JSON operations
            json: {
                parse: (content, fallback = null) =>
                    self.withErrorHandling(
                        () => JSON.parse(content),
                        { 
                            operation: 'jsonParse',
                            rawContent: content,
                            fallbackData: fallback
                        }
                    ),
                
                stringify: (data) =>
                    self.withErrorHandling(
                        () => JSON.stringify(data, null, 2),
                        { operation: 'jsonStringify' }
                    )
            },
            
            // Wrapped async operations
            async: {
                operation: (fn, context = {}) =>
                    self.withErrorHandling(fn, { operation: 'asyncOperation', ...context }),
                
                timeout: (fn, timeoutMs, context = {}) =>
                    self.withTimeout(fn, timeoutMs, { operation: 'timedOperation', ...context })
            },
            
            // Error handling utilities
            errorHandler: self,
            stats: () => self.getErrorStats(),
            reset: () => self.resetStats()
        };
    }
}

module.exports = TestErrorHandler;