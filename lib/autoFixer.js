/**
 * Auto-Fix Engine
 * 
 * Orchestrates comprehensive TODO.json error detection and automatic repair
 * using the TodoValidator and ErrorRecovery components.
 */

const fs = require('fs');
const path = require('path');
const TodoValidator = require('./todoValidator');
const ErrorRecovery = require('./errorRecovery');
const Logger = require('./logger');

class AutoFixer {
    constructor(options = {}) {
        this.validator = new TodoValidator();
        this.recovery = new ErrorRecovery(options.recovery || {});
        this.logger = options.logger || new Logger(process.cwd());
        
        this.options = {
            autoFixLevel: options.autoFixLevel || 'moderate', // 'conservative', 'moderate', 'aggressive'
            createBackups: options.createBackups !== false,
            validateAfterFix: options.validateAfterFix !== false,
            maxFixAttempts: options.maxFixAttempts || 3,
            logLevel: options.logLevel || 'info'
        };
        
        this.fixSession = {
            sessionId: null,
            startTime: null,
            totalErrors: 0,
            fixedErrors: 0,
            failedFixes: 0,
            operations: []
        };
    }

    /**
     * Performs comprehensive auto-fix on a TODO.json file
     * @param {string} filePath - Path to the TODO.json file
     * @param {Object} fixOptions - Options for this specific fix operation
     * @returns {Object} Comprehensive fix result
     */
    async autoFix(filePath, _fixOptions = {}) {
        this._initializeFixSession();
        
        try {
            this.logger.addFlow(`Starting auto-fix for ${filePath}`);
            
            // Step 1: Pre-fix validation and safety checks
            const preCheck = await this._performPreFixChecks(filePath);
            if (!preCheck.canProceed) {
                return this._generateFailureResult(preCheck.reason, preCheck.details);
            }

            // Step 2: Create backup if enabled
            let backupResult = null;
            if (this.options.createBackups) {
                backupResult = await this.recovery.createBackup(filePath);
                this._logOperation('backup_creation', backupResult);
            }

            // Step 3: Acquire file lock
            const lockResult = await this.recovery.acquireLock(filePath);
            if (!lockResult.success) {
                return this._generateFailureResult('file_lock_failed', lockResult);
            }

            try {
                // Step 4: Read and parse file with error handling
                const fileContent = await this._safeReadFile(filePath);
                if (!fileContent.success) {
                    return await this._handleCorruptedFile(filePath, fileContent.error);
                }

                // Step 5: Validate and fix content
                const fixResult = await this._performFixCycle(fileContent.data, filePath);
                
                // Step 6: Write fixed content back to file
                if (fixResult.hasChanges) {
                    const writeResult = await this.recovery.atomicWrite(
                        filePath,
                        JSON.stringify(fixResult.data, null, 2),
                        false // Don't create backup again
                    );
                    
                    if (!writeResult.success) {
                        throw new Error(`Failed to write fixed file: ${writeResult.error}`);
                    }
                    
                    this._logOperation('file_write', writeResult);
                }

                // Step 7: Post-fix validation
                if (this.options.validateAfterFix) {
                    const postValidation = await this._performPostFixValidation(filePath);
                    this._logOperation('post_validation', postValidation);
                }

                return this._generateSuccessResult(fixResult, backupResult);

            } finally {
                // Always release the lock
                await this.recovery.releaseLock(filePath, lockResult.lockId);
            }

        } catch (error) {
            this.logger.logError(error, 'auto-fixer');
            return this._generateFailureResult('unexpected_error', { error: error.message });
        } finally {
            this._finalizeFixSession();
        }
    }

    /**
     * Performs a dry run to show what would be fixed without making changes
     * @param {string} filePath - Path to the TODO.json file
     * @returns {Object} Dry run result showing proposed fixes
     */
    async dryRun(filePath) {
        try {
            const fileContent = await this._safeReadFile(filePath);
            if (!fileContent.success) {
                return {
                    success: false,
                    error: fileContent.error,
                    fixes: []
                };
            }

            const validationResult = this.validator.validateAndSanitize(fileContent.data, filePath);
            
            return {
                success: true,
                wouldFix: validationResult.fixes.length > 0,
                proposedFixes: validationResult.fixes,
                errors: validationResult.errors,
                summary: validationResult.summary,
                originalValid: validationResult.isValid
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                fixes: []
            };
        }
    }

    /**
     * Fixes specific types of errors only
     * @param {string} filePath - Path to the TODO.json file
     * @param {Array} errorTypes - Array of error types to fix
     * @returns {Object} Selective fix result
     */
    async fixSpecificErrors(filePath, errorTypes) {
        const originalAutoFixLevel = this.options.autoFixLevel;
        this.options.autoFixLevel = 'selective';
        this.selectiveErrorTypes = errorTypes;

        try {
            return await this.autoFix(filePath);
        } finally {
            this.options.autoFixLevel = originalAutoFixLevel;
            delete this.selectiveErrorTypes;
        }
    }

    /**
     * Recovers a completely corrupted TODO.json file
     * @param {string} filePath - Path to the corrupted file
     * @returns {Object} Recovery result
     */
    async recoverCorruptedFile(filePath) {
        this._initializeFixSession();
        
        try {
            this.logger.addFlow(`Attempting recovery of corrupted file: ${filePath}`);
            
            const recoveryResult = await this.recovery.recoverCorruptedFile(filePath);
            this._logOperation('corruption_recovery', recoveryResult);
            
            if (recoveryResult.success) {
                // Validate the recovered file
                const validationResult = this.validator.validateAndSanitize(recoveryResult.recoveredData, filePath);
                
                if (!validationResult.isValid) {
                    // Apply fixes to the recovered data
                    await this.recovery.atomicWrite(
                        filePath,
                        JSON.stringify(validationResult.data, null, 2)
                    );
                }
                
                return {
                    success: true,
                    strategy: recoveryResult.strategy,
                    message: recoveryResult.message,
                    additionalFixes: validationResult.fixes.length,
                    finalData: validationResult.data
                };
            }

            return {
                success: false,
                error: recoveryResult.error,
                strategies: recoveryResult.strategies
            };

        } catch (error) {
            this.logger.logError(error, 'corruption-recovery');
            return {
                success: false,
                error: error.message
            };
        } finally {
            this._finalizeFixSession();
        }
    }

    /**
     * Gets detailed status of a TODO.json file
     * @param {string} filePath - Path to the TODO.json file
     * @returns {Object} Detailed file status
     */
    async getFileStatus(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                return {
                    exists: false,
                    error: 'File does not exist',
                    canAutoFix: false,
                    suggestedAction: 'Create new TODO.json file'
                };
            }

            const fileContent = await this._safeReadFile(filePath);
            if (!fileContent.success) {
                return {
                    exists: true,
                    readable: false,
                    error: fileContent.error,
                    canAutoFix: true,
                    suggestedAction: 'Attempt file recovery'
                };
            }

            const validationResult = this.validator.validateAndSanitize(fileContent.data, filePath);
            const backups = this.recovery.listAvailableBackups(filePath);
            
            return {
                exists: true,
                readable: true,
                valid: validationResult.isValid,
                errors: validationResult.errors,
                autoFixableErrors: validationResult.errors.filter(e => e.autoFixable),
                manualFixRequired: validationResult.errors.filter(e => !e.autoFixable),
                summary: validationResult.summary,
                backups: backups.length,
                mostRecentBackup: backups[0] || null,
                canAutoFix: validationResult.fixes.length > 0,
                suggestedAction: this._getSuggestedAction(validationResult)
            };

        } catch (error) {
            return {
                exists: fs.existsSync(filePath),
                error: error.message,
                canAutoFix: false,
                suggestedAction: 'Manual intervention required'
            };
        }
    }

    /**
     * Initializes a new fix session
     */
    _initializeFixSession() {
        this.fixSession = {
            sessionId: `fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            startTime: Date.now(),
            totalErrors: 0,
            fixedErrors: 0,
            failedFixes: 0,
            operations: []
        };
        
        this.logger.addFlow(`Starting fix session: ${this.fixSession.sessionId}`);
    }

    /**
     * Finalizes the current fix session
     */
    _finalizeFixSession() {
        const duration = Date.now() - this.fixSession.startTime;
        this.logger.addFlow(`Fix session completed in ${duration}ms`);
        this.logger.addFlow(`Session stats: ${this.fixSession.fixedErrors}/${this.fixSession.totalErrors} errors fixed`);
    }

    /**
     * Performs pre-fix safety checks
     */
    async _performPreFixChecks(filePath) {
        const checks = {
            fileExists: fs.existsSync(filePath),
            directoryWritable: await this._checkDirectoryWritable(path.dirname(filePath)),
            fileWritable: fs.existsSync(filePath) ? await this._checkFileWritable(filePath) : true,
            sufficientSpace: await this._checkDiskSpace(filePath)
        };

        const failed = Object.entries(checks).find(([_check, passed]) => !passed);
        
        if (failed) {
            return {
                canProceed: false,
                reason: `Pre-fix check failed: ${failed[0]}`,
                details: checks
            };
        }

        return { canProceed: true, checks };
    }

    /**
     * Safely reads and parses a TODO.json file
     */
    async _safeReadFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const parseResult = this.validator.validateJsonSyntax(content);
            
            if (!parseResult.isValid) {
                return {
                    success: false,
                    error: 'JSON syntax error',
                    details: parseResult
                };
            }

            return {
                success: true,
                data: parseResult.data,
                repaired: parseResult.repaired
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Performs the main fix cycle with multiple attempts
     */
    async _performFixCycle(data, filePath) {
        let currentData = data;
        let totalFixes = [];
        let attempts = 0;
        
        while (attempts < this.options.maxFixAttempts) {
            attempts++;
            
            const validationResult = this.validator.validateAndSanitize(currentData, filePath);
            this.fixSession.totalErrors += validationResult.errors.length;
            
            if (validationResult.isValid || validationResult.fixes.length === 0) {
                break;
            }

            // Apply fixes based on auto-fix level
            const applicableFixes = this._filterFixesByLevel(validationResult.fixes);
            totalFixes.push(...applicableFixes);
            this.fixSession.fixedErrors += applicableFixes.length;
            
            currentData = validationResult.data;
            
            this._logOperation('validation_cycle', {
                attempt: attempts,
                errorsFound: validationResult.errors.length,
                fixesApplied: applicableFixes.length
            });
        }

        return {
            data: currentData,
            hasChanges: totalFixes.length > 0,
            fixes: totalFixes,
            attempts,
            finalValidation: this.validator.validateAndSanitize(currentData, filePath)
        };
    }

    /**
     * Handles corrupted file recovery
     */
    async _handleCorruptedFile(filePath, error) {
        this._logOperation('corruption_detected', { error });
        
        const recoveryResult = await this.recoverCorruptedFile(filePath);
        
        if (recoveryResult.success) {
            return this._generateSuccessResult({
                data: recoveryResult.finalData,
                hasChanges: true,
                fixes: [`File recovered using strategy: ${recoveryResult.strategy}`],
                recovery: true
            });
        }

        return this._generateFailureResult('recovery_failed', recoveryResult);
    }

    /**
     * Performs post-fix validation
     */
    async _performPostFixValidation(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            const validationResult = this.validator.validateAndSanitize(data, filePath);
            
            return {
                success: true,
                valid: validationResult.isValid,
                remainingErrors: validationResult.errors.length
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Filters fixes based on auto-fix level
     */
    _filterFixesByLevel(fixes) {
        if (this.options.autoFixLevel === 'selective' && this.selectiveErrorTypes) {
            return fixes.filter(fix => this.selectiveErrorTypes.includes(fix.type));
        }

        switch (this.options.autoFixLevel) {
            case 'conservative':
                return fixes.filter(fix => fix.automated && fix.type.includes('MISSING_FIELD'));
                
            case 'moderate':
                return fixes.filter(fix => fix.automated);
                
            case 'aggressive':
                return fixes; // Apply all fixes
                
            default:
                return fixes.filter(fix => fix.automated);
        }
    }

    /**
     * Logs an operation in the fix session
     */
    _logOperation(type, result) {
        this.fixSession.operations.push({
            type,
            timestamp: Date.now(),
            result,
            success: result.success !== false
        });
        
        this.logger.addFlow(`Operation ${type}: ${result.success !== false ? 'SUCCESS' : 'FAILED'}`);
    }

    /**
     * Generates a success result object
     */
    _generateSuccessResult(fixResult, backupResult = null) {
        return {
            success: true,
            sessionId: this.fixSession.sessionId,
            hasChanges: fixResult.hasChanges,
            fixesApplied: fixResult.fixes || [],
            errorsFixed: this.fixSession.fixedErrors,
            totalErrors: this.fixSession.totalErrors,
            backupCreated: backupResult ? backupResult.success : false,
            backupPath: backupResult ? backupResult.backupPath : null,
            operations: this.fixSession.operations,
            duration: Date.now() - this.fixSession.startTime
        };
    }

    /**
     * Generates a failure result object
     */
    _generateFailureResult(reason, details) {
        return {
            success: false,
            sessionId: this.fixSession.sessionId,
            reason,
            details,
            operations: this.fixSession.operations,
            duration: Date.now() - this.fixSession.startTime
        };
    }

    /**
     * Gets suggested action based on validation result
     */
    _getSuggestedAction(validationResult) {
        if (validationResult.isValid) {
            return 'File is valid, no action needed';
        }

        const criticalErrors = validationResult.errors.filter(e => e.severity === 'critical').length;
        const autoFixableErrors = validationResult.errors.filter(e => e.autoFixable).length;

        if (criticalErrors > 0) {
            return 'Critical errors detected, consider file recovery';
        }

        if (autoFixableErrors > 0) {
            return 'Run auto-fix to resolve issues automatically';
        }

        return 'Manual intervention required for remaining errors';
    }

    /**
     * Utility methods for pre-fix checks
     */
    async _checkDirectoryWritable(dirPath) {
        try {
            const testFile = path.join(dirPath, '.write-test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            return true;
        } catch {
            return false;
        }
    }

    async _checkFileWritable(filePath) {
        try {
            fs.accessSync(filePath, fs.constants.W_OK);
            return true;
        } catch {
            return false;
        }
    }

    async _checkDiskSpace(filePath) {
        // Basic implementation - in production, you might want to check actual disk space
        try {
            const stats = fs.statSync(filePath);
            return stats.size < 100 * 1024 * 1024; // Assume we need 100MB for operations
        } catch {
            return true; // If we can't check, assume it's fine
        }
    }
}

module.exports = AutoFixer;