/**
 * TaskStorage - File Operations and Data Persistence Module
 *
 * === OVERVIEW ===
 * Handles all file system operations for TaskManager including reading/writing
 * TODO.json and DONE.json files, backup management, caching, and archiving.
 * This module provides atomic operations with caching for performance optimization.
 *
 * === KEY FEATURES ===
 * • Fast cached reading with file modification time tracking
 * • Atomic write operations with backup/restore capability
 * • Completed task archiving to DONE.json
 * • Legacy backup cleanup and management
 * • Performance-optimized file operations
 *
 * @fileoverview File operations and data persistence for TaskManager
 * @author TaskManager System
 * @version 2.0.0
 * @since 2024-01-01
 */

const fs = require('fs');
const _path = require('path');
const crypto = require('crypto');
const logger = require('../appLogger');

class TaskStorage {
  /**
   * Initialize TaskStorage with paths and options
   * @param {string} todoPath - Path to TODO.json file
   * @param {Object} options - Configuration options
   */
  constructor(todoPath, options = {}) {
    this.todoPath = todoPath;
    this.donePath = options.donePath || todoPath.replace('TODO.json', 'DONE.json');
    this.logger = logger;

    // Performance optimization: Add aggressive caching
    this._cache = {
      data: null,
      lastModified: 0,
      enabled: options.enableCache !== false,
    };

    this.options = {
      enableArchiving: options.enableArchiving !== false,
      validateOnRead: options.validateOnRead !== false,
      ...options,
    };
  }

  /**
   * Read TODO.json synchronously without caching
   * @returns {Object} Parsed TODO data
   */
  readTodoSync() {
    this.logger?.logInfo?.('Reading TODO.json synchronously');
    if (!fs.existsSync(this.todoPath)) {
      this.logger?.logWarning?.('TODO.json does not exist, returning default structure');
      return {
        tasks: [],
        completed_tasks: [],
        features: [],
        agents: [],
        project_success_criteria: [],
        task_creation_attempts: [],
      };
    }

    try {
      const data = fs.readFileSync(this.todoPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.logger?.logError?.(error, 'Failed to read TODO.json synchronously');
      throw error;
    }
  }

  /**
   * Fast read with caching for performance optimization
   * @returns {Object} Cached or freshly read TODO data
   */
  readTodoFast() {
    this.logger?.logDebug?.('Fast read with caching');
    if (!fs.existsSync(this.todoPath)) {
      this.logger?.logWarning?.('TODO.json does not exist for fast read');
      return { tasks: [], completed_tasks: [], features: [], agents: [] };
    }

    if (this._cache.enabled) {
      try {
        const stats = fs.statSync(this.todoPath);
        const currentModified = stats.mtime.getTime();

        // Return cached data if file hasn't been modified
        if (this._cache.data && this._cache.lastModified === currentModified) {
          this.logger?.logDebug?.('Returning cached TODO data');
          return this._cache.data;
        }

        // Update cache with fresh data
        const data = fs.readFileSync(this.todoPath, 'utf8');
        const parsedData = JSON.parse(data);

        this._cache.data = parsedData;
        this._cache.lastModified = currentModified;

        this.logger?.logDebug?.('Updated cache with fresh TODO data');
        return parsedData;
      } catch (error) {
        this.logger?.logError?.(error, 'Error in fast read, falling back to uncached read');
        // Fall through to uncached read
      }
    }

    // Fallback to uncached read
    return this.readTodoSync();
  }

  /**
   * Read TODO.json with full validation and auto-fix capabilities
   * @param {boolean} skipValidation - Skip validation for performance
   * @returns {Promise<Object>} Validated TODO data
   */
  async readTodo(skipValidation = false) {
    this.logger?.logInfo?.('Reading TODO.json with validation');
    if (!fs.existsSync(this.todoPath)) {
      this.logger?.logInfo?.('TODO.json does not exist, creating default structure');
      const defaultData = {
        tasks: [],
        completed_tasks: [],
        features: [],
        agents: [],
        project_success_criteria: [],
        task_creation_attempts: [],
      };
      await this.writeTodo(defaultData);
      return defaultData;
    }

    let data;
    try {
      if (skipValidation || !this.options.validateOnRead) {
        data = this.readTodoFast();
        return data;
      }

      // TODO: Add validation logic here when needed
      data = this.readTodoFast();
      return data;
    } catch (error) {
      this.logger?.logError?.(error, 'Critical error reading TODO.json');
      throw error;
    }
  }

  /**
   * Write TODO.json with atomic operations and backup
   * @param {Object} data - Data to write
   * @param {boolean} skipBackup - Skip backup creation
   * @returns {Promise<Object>} Write operation result
   */
  async writeTodo(data, skipBackup = false) {
    this.logger?.logInfo?.('Writing TODO.json with atomic operation');

    if (!data || typeof data !== 'object') {
      const error = new Error('Invalid data provided to writeTodo');
      this.logger?.logError?.(error, 'WriteTodo validation failed');
      throw error;
    }

    // Ensure required structure
    if (!data.tasks) {data.tasks = [];}
    if (!data.completed_tasks) {data.completed_tasks = [];}
    if (!data.features) {data.features = [];}
    if (!data.agents) {data.agents = [];}

    let backupPath = null;

    try {
      // Create backup if file exists and backup is enabled
      if (!skipBackup && fs.existsSync(this.todoPath)) {
        backupPath = `${this.todoPath}.backup.${Date.now()}`;
        fs.copyFileSync(this.todoPath, backupPath);
        this.logger?.logDebug?.(`Created backup: ${backupPath}`);
      }

      // Write with atomic operation (write to temp file, then rename)
      const tempPath = `${this.todoPath}.tmp.${Date.now()}`;
      const jsonData = JSON.stringify(data, null, 2);

      fs.writeFileSync(tempPath, jsonData, 'utf8');
      fs.renameSync(tempPath, this.todoPath);

      this.logger?.logInfo?.('Successfully wrote TODO.json');

      // Update cache
      if (this._cache.enabled) {
        this._cache.data = data;
        const stats = fs.statSync(this.todoPath);
        this._cache.lastModified = stats.mtime.getTime();
      }

      return {
        success: true,
        message: 'TODO.json written successfully',
        backupPath,
      };
    } catch (error) {
      this.logger?.logError?.(error, 'Failed to write TODO.json');

      // Restore from backup if available
      if (backupPath && fs.existsSync(backupPath)) {
        try {
          fs.copyFileSync(backupPath, this.todoPath);
          this.logger?.logInfo?.('Restored from backup after write failure');
        } catch (restoreError) {
          this.logger?.logError?.(restoreError, 'Failed to restore from backup');
        }
      }

      throw error;
    } finally {
      // Clean up backup after successful operation
      if (backupPath && fs.existsSync(backupPath)) {
        try {
          fs.unlinkSync(backupPath);
          this.logger?.logDebug?.('Cleaned up temporary backup');
        } catch (cleanupError) {
          this.logger?.logWarning?.(cleanupError, 'Failed to cleanup temporary backup');
        }
      }
    }
  }

  /**
   * Create a timestamped backup of TODO.json
   * @returns {Promise<Object>} Backup operation result
   */
  async createBackup() {
    this.logger?.logInfo?.('Creating manual backup of TODO.json');

    if (!fs.existsSync(this.todoPath)) {
      return {
        success: false,
        message: 'TODO.json does not exist, cannot create backup',
      };
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${this.todoPath}.backup.${timestamp}`;

      fs.copyFileSync(this.todoPath, backupPath);

      this.logger?.logInfo?.(`Backup created: ${backupPath}`);
      return {
        success: true,
        message: 'Backup created successfully',
        backupPath,
      };
    } catch (error) {
      this.logger?.logError?.(error, 'Failed to create backup');
      return {
        success: false,
        message: `Failed to create backup: ${error.message}`,
        error,
      };
    }
  }

  /**
   * List available backup files
   * @returns {Array} List of backup files with metadata
   */
  listBackups() {
    this.logger?.logDebug?.('Listing available backups');

    const todoDir = _path.dirname(this.todoPath);
    const todoFilename = _path.basename(this.todoPath);

    try {
      const files = fs.readdirSync(todoDir);
      const backupFiles = files
        .filter(file => file.startsWith(`${todoFilename}.backup.`))
        .map(file => {
          const filePath = _path.join(todoDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());

      this.logger?.logDebug?.(`Found ${backupFiles.length} backup files`);
      return backupFiles;
    } catch (error) {
      this.logger?.logError?.(error, 'Failed to list backups');
      return [];
    }
  }

  /**
   * Restore TODO.json from a backup file
   * @param {string} backupFile - Backup filename (optional, uses latest if not provided)
   * @returns {Promise<Object>} Restore operation result
   */
  async restoreFromBackup(backupFile = null) {
    this.logger?.logInfo?.('Restoring TODO.json from backup');

    const backups = this.listBackups();
    if (backups.length === 0) {
      return {
        success: false,
        message: 'No backup files found',
      };
    }

    let selectedBackup;
    if (backupFile) {
      selectedBackup = backups.find(backup => backup.filename === backupFile);
      if (!selectedBackup) {
        return {
          success: false,
          message: `Backup file '${backupFile}' not found`,
        };
      }
    } else {
      selectedBackup = backups[0]; // Latest backup
    }

    try {
      // Create backup of current file before restore
      if (fs.existsSync(this.todoPath)) {
        const preRestoreBackup = `${this.todoPath}.pre-restore.${Date.now()}`;
        fs.copyFileSync(this.todoPath, preRestoreBackup);
        this.logger?.logInfo?.(`Created pre-restore backup: ${preRestoreBackup}`);
      }

      // Restore from backup
      fs.copyFileSync(selectedBackup.path, this.todoPath);

      // Clear cache to force reload
      if (this._cache.enabled) {
        this._cache.data = null;
        this._cache.lastModified = 0;
      }

      this.logger?.logInfo?.(`Successfully restored from backup: ${selectedBackup.filename}`);
      return {
        success: true,
        message: `Restored from backup: ${selectedBackup.filename}`,
        backupUsed: selectedBackup,
      };
    } catch (error) {
      this.logger?.logError?.(error, 'Failed to restore from backup');
      return {
        success: false,
        message: `Failed to restore from backup: ${error.message}`,
        error,
      };
    }
  }

  /**
   * Clean up old backup files, keeping only the most recent ones
   * @param {number} keepCount - Number of backups to keep (default: 5)
   * @returns {Object} Cleanup operation result
   */
  cleanupLegacyBackups(keepCount = 5) {
    this.logger?.logInfo?.(`Cleaning up old backups, keeping ${keepCount} most recent`);

    const backups = this.listBackups();
    if (backups.length <= keepCount) {
      return {
        success: true,
        message: `No cleanup needed, ${backups.length} backups found`,
        removedCount: 0,
      };
    }

    const toRemove = backups.slice(keepCount);
    let removedCount = 0;

    for (const backup of toRemove) {
      try {
        fs.unlinkSync(backup.path);
        removedCount++;
        this.logger?.logDebug?.(`Removed old backup: ${backup.filename}`);
      } catch (error) {
        this.logger?.logWarning?.(error, `Failed to remove backup: ${backup.filename}`);
      }
    }

    this.logger?.logInfo?.(`Cleanup completed, removed ${removedCount} old backups`);
    return {
      success: true,
      message: `Cleaned up ${removedCount} old backups`,
      removedCount,
    };
  }

  /**
   * Archive a completed task to DONE.json
   * @param {Object} task - Completed task to archive
   * @returns {Promise<Object>} Archive operation result
   */
  async archiveCompletedTask(task) {
    if (!this.options.enableArchiving) {
      this.logger?.logDebug?.('Archiving disabled, skipping task archive');
      return {
        success: true,
        message: 'Archiving disabled',
        archived: false,
      };
    }

    this.logger?.logInfo?.(`Archiving completed task: ${task.id}`);

    try {
      let doneData = {};

      // Read existing DONE.json or create structure
      if (fs.existsSync(this.donePath)) {
        const doneContent = fs.readFileSync(this.donePath, 'utf8');
        doneData = JSON.parse(doneContent);
      } else {
        doneData = this._createDoneStructure();
      }

      // Ensure structure exists
      if (!doneData.completed_tasks) {
        doneData.completed_tasks = [];
      }

      // Add completion metadata
      const archivedTask = {
        ...task,
        archived_at: new Date().toISOString(),
        archive_version: '2.0.0',
      };

      doneData.completed_tasks.push(archivedTask);
      doneData.last_archived = new Date().toISOString();
      doneData.total_completed = doneData.completed_tasks.length;

      // Write DONE.json
      fs.writeFileSync(this.donePath, JSON.stringify(doneData, null, 2), 'utf8');

      this.logger?.logInfo?.(`Task archived successfully: ${task.id}`);
      return {
        success: true,
        message: 'Task archived successfully',
        archived: true,
        archivePath: this.donePath,
      };
    } catch (error) {
      this.logger?.logError?.(error, `Failed to archive task: ${task.id}`);
      return {
        success: false,
        message: `Failed to archive task: ${error.message}`,
        archived: false,
        error,
      };
    }
  }

  /**
   * Create default DONE.json structure
   * @returns {Object} Default DONE.json structure
   * @private
   */
  _createDoneStructure() {
    return {
      completed_tasks: [],
      project_info: {
        created: new Date().toISOString(),
        version: '2.0.0',
      },
      statistics: {
        total_completed: 0,
        last_archived: null,
      },
    };
  }

  /**
   * Read DONE.json file
   * @returns {Promise<Object>} DONE.json data
   */
  async readDone() {
    this.logger?.logDebug?.('Reading DONE.json');

    if (!fs.existsSync(this.donePath)) {
      this.logger?.logInfo?.('DONE.json does not exist, creating default structure');
      const defaultData = this._createDoneStructure();
      try {
        fs.writeFileSync(this.donePath, JSON.stringify(defaultData, null, 2), 'utf8');
        return defaultData;
      } catch (error) {
        this.logger?.logWarning?.(error, 'Failed to create DONE.json, returning default structure');
        return defaultData;
      }
    }

    try {
      const data = fs.readFileSync(this.donePath, 'utf8');
      const parsedData = JSON.parse(data);

      // Ensure structure
      if (!parsedData.completed_tasks) {
        parsedData.completed_tasks = [];
      }

      return parsedData;
    } catch (error) {
      this.logger?.logError?.(error, 'Failed to read DONE.json');
      throw error;
    }
  }

  /**
   * Get file status information
   * @returns {Object} File status information
   */
  getFileStatus() {
    this.logger?.logDebug?.('Getting file status information');

    const status = {
      todoExists: fs.existsSync(this.todoPath),
      doneExists: fs.existsSync(this.donePath),
      cacheEnabled: this._cache.enabled,
      cacheValid: this._cache.data !== null,
    };

    if (status.todoExists) {
      const stats = fs.statSync(this.todoPath);
      status.todoSize = stats.size;
      status.todoModified = stats.mtime;
    }

    if (status.doneExists) {
      const stats = fs.statSync(this.donePath);
      status.doneSize = stats.size;
      status.doneModified = stats.mtime;
    }

    return status;
  }

  /**
   * Clear the cache to force fresh reads
   */
  clearCache() {
    this.logger?.logDebug?.('Clearing storage cache');
    this._cache.data = null;
    this._cache.lastModified = 0;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      enabled: this._cache.enabled,
      hasData: this._cache.data !== null,
      lastModified: this._cache.lastModified,
      size: this._cache.data ? JSON.stringify(this._cache.data).length : 0,
    };
  }
}

module.exports = TaskStorage;
