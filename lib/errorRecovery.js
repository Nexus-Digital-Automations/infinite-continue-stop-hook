/**
 * Error Recovery Manager
 * 
 * Handles backup creation, file recovery, and atomic operations
 * for TODO.json files to ensure data safety during modifications.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ErrorRecovery {
    constructor(options = {}) {
        this.maxBackups = options.maxBackups || 3;
        this.backupDir = options.backupDir || '.todo-backups';
        this.lockTimeout = options.lockTimeout || 5000; // 5 seconds
        this.activeLocks = new Map();
    }

    /**
     * Creates a backup of the TODO.json file before modifications
     * @param {string} filePath - Path to the TODO.json file
     * @returns {Object} Backup creation result
     */
    async createBackup(filePath) {
        try {
            // CRITICAL SAFETY CHECK: Only backup TODO.json files
            if (filePath.includes('node_modules') || !filePath.includes('TODO.json')) {
                return {
                    success: false,
                    error: `Unsafe backup source: ${filePath}. Only TODO.json files can be backed up.`,
                    backupPath: null
                };
            }

            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: 'File does not exist',
                    backupPath: null
                };
            }

            const fileDir = path.dirname(filePath);
            const backupDirPath = path.join(fileDir, this.backupDir);
            
            // Ensure backup directory exists
            if (!fs.existsSync(backupDirPath)) {
                fs.mkdirSync(backupDirPath, { recursive: true });
            }

            // Generate backup filename with timestamp and checksum
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const checksum = crypto.createHash('md5').update(fileContent).digest('hex').substr(0, 8);
            const backupFilename = `TODO.json.${timestamp}.${checksum}.backup`;
            const backupPath = path.join(backupDirPath, backupFilename);

            // Copy file to backup location
            fs.copyFileSync(filePath, backupPath);

            // Clean up old backups
            await this._cleanupOldBackups(backupDirPath);

            return {
                success: true,
                backupPath,
                timestamp,
                checksum,
                size: fs.statSync(backupPath).size
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                backupPath: null
            };
        }
    }

    /**
     * Restores TODO.json from the most recent backup
     * @param {string} filePath - Path to the TODO.json file
     * @param {string} specificBackup - Optional specific backup file to restore
     * @returns {Object} Restoration result
     */
    async restoreFromBackup(filePath, specificBackup = null) {
        try {
            const fileDir = path.dirname(filePath);
            const backupDirPath = path.join(fileDir, this.backupDir);

            if (!fs.existsSync(backupDirPath)) {
                return {
                    success: false,
                    error: 'No backup directory found',
                    restoredFrom: null
                };
            }

            let backupToRestore;
            
            if (specificBackup) {
                backupToRestore = path.join(backupDirPath, specificBackup);
                if (!fs.existsSync(backupToRestore)) {
                    return {
                        success: false,
                        error: 'Specified backup file not found',
                        restoredFrom: null
                    };
                }
            } else {
                // Find the most recent backup
                const backups = this._listBackups(backupDirPath);
                if (backups.length === 0) {
                    return {
                        success: false,
                        error: 'No backup files found',
                        restoredFrom: null
                    };
                }
                backupToRestore = backups[0].path; // Most recent first
            }

            // Validate backup before restoring
            const validationResult = await this._validateBackup(backupToRestore);
            if (!validationResult.isValid) {
                return {
                    success: false,
                    error: `Backup validation failed: ${validationResult.error}`,
                    restoredFrom: null
                };
            }

            // Create backup of current file before restoring
            if (fs.existsSync(filePath)) {
                await this.createBackup(filePath);
            }

            // Restore from backup
            fs.copyFileSync(backupToRestore, filePath);

            return {
                success: true,
                restoredFrom: backupToRestore,
                backupInfo: validationResult.backupInfo
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                restoredFrom: null
            };
        }
    }

    /**
     * Performs atomic write operation with rollback capability
     * @param {string} filePath - Path to the file
     * @param {string} content - Content to write
     * @param {boolean} createBackup - Whether to create backup before writing
     * @returns {Object} Write operation result
     */
    async atomicWrite(filePath, content, createBackup = true) {
        // CRITICAL SAFETY CHECK: Prevent writing to node_modules or system files
        if (filePath.includes('node_modules') || filePath.includes('/usr/') || filePath.includes('/bin/') || 
            filePath.includes('/lib/') || filePath.includes('/system/') || !filePath.includes('TODO.json')) {
            return {
                success: false,
                error: `Unsafe file path detected: ${filePath}. Only TODO.json files are allowed.`,
                backupCreated: false
            };
        }

        const tempPath = `${filePath}.tmp.${Date.now()}`;
        let backupResult = null;

        try {
            // Create backup if requested and file exists
            if (createBackup && fs.existsSync(filePath)) {
                backupResult = await this.createBackup(filePath);
                if (!backupResult.success) {
                    return {
                        success: false,
                        error: `Backup failed: ${backupResult.error}`,
                        backupCreated: false
                    };
                }
            }

            // Write to temporary file first
            fs.writeFileSync(tempPath, content, 'utf8');

            // Validate the written content
            try {
                JSON.parse(content);
            } catch (jsonError) {
                fs.unlinkSync(tempPath);
                return {
                    success: false,
                    error: `Invalid JSON content: ${jsonError.message}`,
                    backupCreated: backupResult ? backupResult.success : false
                };
            }

            // Atomic move from temp to final location
            fs.renameSync(tempPath, filePath);

            return {
                success: true,
                backupCreated: backupResult ? backupResult.success : false,
                backupPath: backupResult ? backupResult.backupPath : null
            };

        } catch (error) {
            // Clean up temp file if it exists
            if (fs.existsSync(tempPath)) {
                try {
                    fs.unlinkSync(tempPath);
                } catch {
                    // Ignore cleanup errors
                }
            }

            return {
                success: false,
                error: error.message,
                backupCreated: backupResult ? backupResult.success : false
            };
        }
    }

    /**
     * Acquires a file lock to prevent concurrent modifications
     * @param {string} filePath - Path to the file to lock
     * @returns {Object} Lock acquisition result
     */
    async acquireLock(filePath) {
        const lockPath = `${filePath}.lock`;
        const lockId = crypto.randomBytes(16).toString('hex');
        
        try {
            // Check if lock already exists
            if (fs.existsSync(lockPath)) {
                const lockInfo = this._readLockFile(lockPath);
                if (lockInfo && this._isLockValid(lockInfo)) {
                    return {
                        success: false,
                        error: 'File is locked by another process',
                        lockId: null
                    };
                } else {
                    // Remove stale lock
                    fs.unlinkSync(lockPath);
                }
            }

            // Create lock file
            const lockData = {
                lockId,
                pid: process.pid,
                timestamp: Date.now(),
                filePath
            };

            fs.writeFileSync(lockPath, JSON.stringify(lockData), 'utf8');
            this.activeLocks.set(filePath, { lockId, lockPath });

            return {
                success: true,
                lockId,
                lockPath
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                lockId: null
            };
        }
    }

    /**
     * Releases a file lock
     * @param {string} filePath - Path to the file to unlock
     * @param {string} lockId - Lock ID for verification
     * @returns {Object} Lock release result
     */
    async releaseLock(filePath, lockId) {
        try {
            const activeLock = this.activeLocks.get(filePath);
            if (!activeLock || activeLock.lockId !== lockId) {
                return {
                    success: false,
                    error: 'Invalid lock ID or file not locked by this process'
                };
            }

            // Remove lock file
            if (fs.existsSync(activeLock.lockPath)) {
                fs.unlinkSync(activeLock.lockPath);
            }

            // Remove from active locks
            this.activeLocks.delete(filePath);

            return {
                success: true
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Lists available backups for a TODO.json file
     * @param {string} filePath - Path to the TODO.json file
     * @returns {Array} List of available backups
     */
    listAvailableBackups(filePath) {
        try {
            const fileDir = path.dirname(filePath);
            const backupDirPath = path.join(fileDir, this.backupDir);

            if (!fs.existsSync(backupDirPath)) {
                return [];
            }

            return this._listBackups(backupDirPath);

        } catch {
            return [];
        }
    }

    /**
     * Recovers from corrupted TODO.json using various strategies
     * @param {string} filePath - Path to the corrupted file
     * @returns {Object} Recovery result
     */
    async recoverCorruptedFile(filePath) {
        const strategies = [
            'restore_from_backup',
            'repair_json_syntax',
            'rebuild_from_fragments',
            'create_minimal_structure'
        ];

        for (const strategy of strategies) {
            const result = await this._executeRecoveryStrategy(strategy, filePath);
            if (result.success) {
                return {
                    success: true,
                    strategy,
                    message: result.message,
                    recoveredData: result.data
                };
            }
        }

        return {
            success: false,
            error: 'All recovery strategies failed',
            strategies: strategies
        };
    }

    /**
     * Cleans up old backup files
     */
    async _cleanupOldBackups(backupDirPath) {
        try {
            const backups = this._listBackups(backupDirPath);
            
            if (backups.length > this.maxBackups) {
                const toDelete = backups.slice(this.maxBackups);
                toDelete.forEach(backup => {
                    try {
                        fs.unlinkSync(backup.path);
                    } catch {
                        // Ignore individual deletion errors
                    }
                });
            }
        } catch {
            // Ignore cleanup errors
        }
    }

    /**
     * Lists and sorts backup files
     */
    _listBackups(backupDirPath) {
        try {
            const files = fs.readdirSync(backupDirPath)
                .filter(file => file.startsWith('TODO.json.') && file.endsWith('.backup'))
                .map(file => {
                    const filePath = path.join(backupDirPath, file);
                    const stats = fs.statSync(filePath);
                    
                    // Extract timestamp from filename
                    const matches = file.match(/TODO\.json\.([^.]+)\.([^.]+)\.backup/);
                    const timestamp = matches ? matches[1] : '';
                    const checksum = matches ? matches[2] : '';
                    
                    return {
                        filename: file,
                        path: filePath,
                        timestamp,
                        checksum,
                        size: stats.size,
                        created: stats.mtime
                    };
                });

            // Sort by creation time (newest first)
            return files.sort((a, b) => b.created - a.created);

        } catch {
            return [];
        }
    }

    /**
     * Validates a backup file
     */
    async _validateBackup(backupPath) {
        try {
            const content = fs.readFileSync(backupPath, 'utf8');
            const data = JSON.parse(content);
            
            // Basic structure validation
            if (!data.project || !Array.isArray(data.tasks)) {
                return {
                    isValid: false,
                    error: 'Invalid TODO.json structure in backup'
                };
            }

            const stats = fs.statSync(backupPath);
            return {
                isValid: true,
                backupInfo: {
                    size: stats.size,
                    created: stats.mtime,
                    taskCount: data.tasks.length,
                    project: data.project
                }
            };

        } catch (error) {
            return {
                isValid: false,
                error: error.message
            };
        }
    }

    /**
     * Reads lock file information
     */
    _readLockFile(lockPath) {
        try {
            const content = fs.readFileSync(lockPath, 'utf8');
            return JSON.parse(content);
        } catch {
            return null;
        }
    }

    /**
     * Checks if a lock is still valid
     */
    _isLockValid(lockInfo) {
        if (!lockInfo || !lockInfo.timestamp) return false;
        
        const age = Date.now() - lockInfo.timestamp;
        return age < this.lockTimeout;
    }

    /**
     * Executes a specific recovery strategy
     */
    async _executeRecoveryStrategy(strategy, filePath) {
        switch (strategy) {
            case 'restore_from_backup':
                return await this._strategyRestoreFromBackup(filePath);
            case 'repair_json_syntax':
                return await this._strategyRepairJsonSyntax(filePath);
            case 'rebuild_from_fragments':
                return await this._strategyRebuildFromFragments(filePath);
            case 'create_minimal_structure':
                return await this._strategyCreateMinimalStructure(filePath);
            default:
                return { success: false, message: 'Unknown strategy' };
        }
    }

    async _strategyRestoreFromBackup(filePath) {
        const result = await this.restoreFromBackup(filePath);
        if (result.success) {
            return {
                success: true,
                message: 'Restored from backup successfully',
                data: JSON.parse(fs.readFileSync(filePath, 'utf8'))
            };
        }
        return { success: false, message: result.error };
    }

    async _strategyRepairJsonSyntax(filePath) {
        try {
            if (!fs.existsSync(filePath)) return { success: false, message: 'File not found' };
            
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Try basic JSON repairs
            content = content.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
            content = content.replace(/([^\\])"/g, '$1\\"'); // Escape quotes
            
            const data = JSON.parse(content);
            await this.atomicWrite(filePath, JSON.stringify(data, null, 2));
            
            return {
                success: true,
                message: 'Repaired JSON syntax',
                data
            };
        } catch (error) {
            return { success: false, message: `JSON repair failed: ${error.message}` };
        }
    }

    async _strategyRebuildFromFragments(_filePath) {
        // This would implement more sophisticated recovery from partial data
        return { success: false, message: 'Fragment recovery not implemented' };
    }

    async _strategyCreateMinimalStructure(filePath) {
        const minimalStructure = {
            project: path.basename(path.dirname(filePath)),
            tasks: [],
            review_strikes: 0,
            strikes_completed_last_run: false,
            current_task_index: 0,
            last_mode: null
        };

        await this.atomicWrite(filePath, JSON.stringify(minimalStructure, null, 2));
        
        return {
            success: true,
            message: 'Created minimal TODO.json structure',
            data: minimalStructure
        };
    }
}

module.exports = ErrorRecovery;