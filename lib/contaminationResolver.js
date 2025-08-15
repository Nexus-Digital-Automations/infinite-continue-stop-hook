/**
 * Contamination Resolver
 * 
 * This module provides immediate cleanup and restoration for JSON contamination
 * in critical node_modules files that occurs during test execution.
 */

const fs = require('fs');
const path = require('path');

class ContaminationResolver {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
        this.criticalFiles = [
            'node_modules/exit/lib/exit.js',
            'node_modules/jest-worker/build/index.js',
            'node_modules/istanbul-lib-report/index.js',
            'node_modules/@jest/reporters/build/CoverageReporter.js',
            'node_modules/jest-cli/build/run.js'
        ];
        
        // Store original file contents
        this.originalContents = new Map();
    }
    
    /**
     * Store original contents of critical files
     */
    async storeOriginalContents() {
        for (const file of this.criticalFiles) {
            const fullPath = path.join(this.projectRoot, file);
            if (fs.existsSync(fullPath)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    // Only store if it's valid JavaScript (not contaminated)
                    if (this.isValidJavaScript(content)) {
                        this.originalContents.set(fullPath, content);
                        console.log(`✅ Stored original content for ${file}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Could not store original content for ${file}: ${error.message}`);
                }
            }
        }
    }
    
    /**
     * Check if content is valid JavaScript (not JSON contaminated)
     */
    isValidJavaScript(content) {
        // Check for JSON contamination patterns
        const jsonPatterns = [
            /^\s*\{.*"project".*\}/s,
            /^\s*\{.*"tasks".*\}/s,
            /^\s*\{.*"execution_count".*\}/s
        ];
        
        // If any JSON pattern matches at the start, it's contaminated
        for (const pattern of jsonPatterns) {
            if (pattern.test(content)) {
                return false;
            }
        }
        
        // Check for proper JavaScript structure
        return content.includes('module.exports') || 
               content.includes('exports.') || 
               content.includes('function') ||
               content.includes('class ');
    }
    
    /**
     * Detect contamination in critical files
     */
    async detectContamination() {
        const contaminated = [];
        
        for (const file of this.criticalFiles) {
            const fullPath = path.join(this.projectRoot, file);
            if (fs.existsSync(fullPath)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    if (!this.isValidJavaScript(content)) {
                        contaminated.push({
                            file,
                            fullPath,
                            content: content.substring(0, 200) // First 200 chars for logging
                        });
                    }
                } catch (error) {
                    console.warn(`⚠️ Could not read ${file}: ${error.message}`);
                }
            }
        }
        
        return contaminated;
    }
    
    /**
     * Synchronous contamination restoration for exit handlers
     */
    syncRestoreContaminatedFiles() {
        const contaminated = [];
        
        // Synchronous contamination detection
        for (const file of this.criticalFiles) {
            const fullPath = path.join(this.projectRoot, file);
            if (fs.existsSync(fullPath)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    if (!this.isValidJavaScript(content)) {
                        contaminated.push({
                            file,
                            fullPath,
                            content: content.substring(0, 200)
                        });
                    }
                } catch (error) {
                    console.warn(`⚠️ Could not read ${file}: ${error.message}`);
                }
            }
        }
        
        // Synchronous restoration
        let restored = 0;
        for (const item of contaminated) {
            const originalContent = this.originalContents.get(item.fullPath);
            if (originalContent) {
                try {
                    // Check if file is writable before attempting to restore
                    try {
                        fs.accessSync(item.fullPath, fs.constants.W_OK);
                        fs.writeFileSync(item.fullPath, originalContent, 'utf8');
                        console.log(`✅ Sync restored ${item.file}`);
                        restored++;
                    } catch (writeError) {
                        if (writeError.message && writeError.message.includes('node_modules write blocked')) {
                            // This is expected in test isolation mode - file is intentionally protected
                            console.log(`🛡️ Skipped protected file ${item.file} (test isolation active)`);
                        } else {
                            console.warn(`⚠️ Cannot sync restore ${item.file}: ${writeError.message}`);
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ Error checking sync file access for ${item.file}: ${error.message}`);
                }
            }
        }
        
        return { restored, files: contaminated.map(c => c.file) };
    }
    
    /**
     * Restore contaminated files immediately
     */
    async restoreContaminatedFiles() {
        const contaminated = await this.detectContamination();
        
        if (contaminated.length === 0) {
            console.log('✅ No contamination detected');
            return { restored: 0, files: [] };
        }
        
        const restored = [];
        
        for (const item of contaminated) {
            const originalContent = this.originalContents.get(item.fullPath);
            if (originalContent) {
                try {
                    // Check if file is writable before attempting to restore
                    try {
                        fs.accessSync(item.fullPath, fs.constants.W_OK);
                        fs.writeFileSync(item.fullPath, originalContent, 'utf8');
                        console.log(`✅ Restored ${item.file}`);
                        restored.push(item.file);
                    } catch (writeError) {
                        if (writeError.message && writeError.message.includes('node_modules write blocked')) {
                            // This is expected in test isolation mode - file is intentionally protected
                            console.log(`🛡️ Skipped protected file ${item.file} (test isolation active)`);
                        } else {
                            console.warn(`⚠️ Cannot restore ${item.file}: ${writeError.message}`);
                        }
                    }
                } catch (error) {
                    // Handle any other unexpected errors
                    console.warn(`⚠️ Error checking file access for ${item.file}: ${error.message}`);
                }
            } else {
                // Try to restore from backup or known good content
                await this.restoreFromKnownGood(item.fullPath, item.file);
                restored.push(item.file);
            }
        }
        
        return { restored: restored.length, files: restored };
    }
    
    /**
     * Enhanced automatic recovery system that prevents contamination
     */
    async startContinuousMonitoring() {
        const checkInterval = 100; // Check every 100ms for contamination
        
        const monitor = setInterval(async () => {
            try {
                const contaminated = await this.detectContamination();
                if (contaminated.length > 0) {
                    console.log(`🧹 Auto-fixing ${contaminated.length} contaminated files...`);
                    await this.restoreContaminatedFiles();
                }
            } catch {
                // Silent fail to prevent breaking the main process
            }
        }, checkInterval);
        
        // Clean up monitoring on process exit
        process.on('exit', () => {
            clearInterval(monitor);
            // Emergency restoration
            this.criticalFiles.forEach(file => {
                const fullPath = path.join(this.projectRoot, file);
                if (fs.existsSync(fullPath)) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        if (!this.isValidJavaScript(content)) {
                            const originalContent = this.originalContents.get(fullPath);
                            if (originalContent) {
                                fs.writeFileSync(fullPath, originalContent, 'utf8');
                            } else {
                                this.restoreFromKnownGood(fullPath, file);
                            }
                        }
                    } catch {
                        // Silent fail during exit
                    }
                }
            });
        });
        
        return monitor;
    }
    
    /**
     * Restore from known good content for specific files
     */
    async restoreFromKnownGood(fullPath, file) {
        let knownGoodContent = null;
        
        if (file.includes('exit.js')) {
            // Known good exit.js content
            knownGoodContent = `/*
 * exit
 * https://github.com/cowboy/node-exit
 *
 * Copyright (c) 2013 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function exit(exitCode, streams) {
  if (!streams) { streams = [process.stdout, process.stderr]; }
  var drainCount = 0;
  // Actually exit if all streams are drained.
  function tryToExit() {
    if (drainCount === streams.length) {
      process.exit(exitCode);
    }
  }
  streams.forEach(function(stream) {
    // Count drained streams now, but monitor non-drained streams.
    if (stream.bufferSize === 0) {
      drainCount++;
    } else {
      stream.write('', 'utf-8', function() {
        drainCount++;
        tryToExit();
      });
    }
    // Prevent further writing.
    stream.write = function() {};
  });
  // If all streams were already drained, exit now.
  tryToExit();
  // In Windows, when run as a Node.js child process, a script utilizing
  // this library might just exit with a 0 exit code, regardless. This code,
  // despite the fact that it looks a bit crazy, appears to fix that.
  process.on('exit', function() {
    process.exit(exitCode);
  });
};
`;
        } else if (file.includes('jest-worker')) {
            // Check if backup exists
            const backupPath = fullPath + '.backup.original';
            if (fs.existsSync(backupPath)) {
                knownGoodContent = fs.readFileSync(backupPath, 'utf8');
            }
        }
        
        if (knownGoodContent) {
            try {
                fs.writeFileSync(fullPath, knownGoodContent, 'utf8');
                console.log(`✅ Restored ${file} from known good content`);
            } catch (error) {
                console.error(`❌ Failed to restore ${file} from known good: ${error.message}`);
            }
        }
    }
    
    /**
     * Enhanced Jest exit process protection with proactive write blocking
     * Prevents contamination during Jest shutdown by monitoring exit signals AND blocking writes
     */
    setupJestExitProtection() {
        // Detect if we're in a Jest environment (enhanced detection for coverage)
        const isJestEnvironment = process.env.JEST_WORKER_ID || 
                                process.env.NODE_ENV === 'test' ||
                                process.argv.some(arg => arg.includes('jest')) ||
                                process.argv.some(arg => arg.includes('--coverage'));
        
        if (!isJestEnvironment) {
            return;
        }
        
        console.log('🛡️ Setting up enhanced Jest exit process protection with write blocking...');
        
        // Store clean versions of critical files before any Jest operations
        this.storeOriginalContents();
        
        // ENHANCED: Set up proactive write interception before any contamination can occur
        this.setupProactiveWriteBlocking();
        
        // Monitor for Jest exit signals and immediately restore files
        const exitHandlers = ['exit', 'beforeExit', 'SIGINT', 'SIGTERM', 'SIGQUIT'];
        
        exitHandlers.forEach(signal => {
            process.on(signal, () => {
                // Synchronous immediate restoration to prevent exit contamination
                try {
                    this.syncRestoreContaminatedFiles();
                } catch (error) {
                    // Silent restoration attempt - don't block exit process
                    console.warn(`⚠️ Exit restoration warning: ${error.message}`);
                }
            });
        });
        
        // Add even more aggressive exit protection with multiple event listeners
        process.prependListener('exit', () => {
            try {
                this.syncRestoreContaminatedFiles();
            } catch {
                // Silent cleanup
            }
        });
        
        // Use process.once for final cleanup
        process.once('beforeExit', () => {
            try {
                this.syncRestoreContaminatedFiles();
            } catch {
                // Silent cleanup
            }
        });
        
        // Set up immediate post-test cleanup using setTimeout with 0 delay
        // Only if Jest is not already done
        if (process.env.NODE_ENV !== 'test' || !global.jestDone) {
            setTimeout(async () => {
                try {
                    // Check if jest is still running
                    if (global.jestDone) return;
                    
                    const contaminated = await this.detectContamination();
                    if (contaminated.length > 0) {
                        await this.restoreContaminatedFiles();
                    }
                } catch {
                    // Silent cleanup
                }
            }, 0);
            
            // Use process.nextTick for even faster cleanup
            process.nextTick(async () => {
                try {
                    // Check if jest is still running
                    if (global.jestDone) return;
                    
                    const contaminated = await this.detectContamination();
                    if (contaminated.length > 0) {
                        await this.restoreContaminatedFiles();
                    }
                } catch {
                    // Silent cleanup
                }
            });
        }
        
        // Enhanced coverage-specific protection with aggressive cleanup
        const isCoverageRun = process.argv.includes('--coverage') || 
                             process.env.npm_config_coverage ||
                             process.env.JEST_COVERAGE;
        
        if (isCoverageRun) {
            console.log('🛡️ Enhanced coverage protection mode activated...');
            
            // More aggressive cleanup intervals during coverage collection
            const coverageCleanupInterval = setInterval(async () => {
                try {
                    // Don't run cleanup if Jest is done
                    if (global.jestDone) {
                        clearInterval(coverageCleanupInterval);
                        return;
                    }
                    
                    const contaminated = await this.detectContamination();
                    if (contaminated.length > 0) {
                        console.log(`🧹 Coverage cleanup: ${contaminated.length} files restored`);
                        await this.restoreContaminatedFiles();
                    }
                } catch {
                    // Silent cleanup
                }
            }, 50); // Very frequent cleanup every 50ms during coverage
            
            // Clean up interval when process exits
            ['exit', 'beforeExit'].forEach(signal => {
                process.on(signal, () => {
                    if (coverageCleanupInterval) {
                        clearInterval(coverageCleanupInterval);
                    }
                });
            });
        }
    }
    
    /**
     * NEW: Proactive write blocking system that intercepts file writes before they occur
     * This prevents JSON contamination from happening in the first place
     */
    setupProactiveWriteBlocking() {
        // Skip if already set up or if protection is disabled
        if (this.writeBlockingSetup || process.env.DISABLE_FS_PROTECTION === 'true') {
            return;
        }
        
        console.log('🚧 Setting up proactive write blocking for critical files...');
        
        // Store original fs methods
        const originalWriteFileSync = fs.writeFileSync;
        const originalWriteFile = fs.writeFile;
        const originalAppendFileSync = fs.appendFileSync;
        const originalAppendFile = fs.appendFile;
        const originalCreateWriteStream = fs.createWriteStream;
        
        // Enhanced write protection with contamination detection
        fs.writeFileSync = (filePath, data, options) => {
            const resolvedPath = path.resolve(filePath);
            
            // Check if this is a critical file that should be protected
            if (this.isCriticalFile(resolvedPath)) {
                // Check if this is JSON contamination
                if (this.isJsonContamination(resolvedPath, data)) {
                    console.warn(`🛡️ BLOCKED: JSON contamination prevented in ${filePath}`);
                    console.warn(`🔍 Contamination details: Writing JSON data to JavaScript file`);
                    throw new Error(`CRITICAL: Complete test isolation - JSON contamination blocked for ${filePath}`);
                }
                
                // Block all writes to node_modules JavaScript files during tests
                if (this.isNodeModulesJSFile(resolvedPath)) {
                    console.warn(`🛡️ BLOCKED: node_modules JavaScript file write prevented: ${filePath}`);
                    throw new Error(`CRITICAL: Complete test isolation - node_modules write blocked for ${filePath}`);
                }
            }
            
            return originalWriteFileSync.call(fs, filePath, data, options);
        };
        
        fs.writeFile = (filePath, data, options, callback) => {
            // Handle both 3 and 4 parameter versions
            if (typeof options === 'function') {
                callback = options;
                options = undefined;
            }
            
            const resolvedPath = path.resolve(filePath);
            
            if (this.isCriticalFile(resolvedPath)) {
                if (this.isJsonContamination(resolvedPath, data)) {
                    console.warn(`🛡️ BLOCKED: Async JSON contamination prevented in ${filePath}`);
                    const error = new Error(`CRITICAL: Async JSON contamination blocked for ${filePath}`);
                    return callback ? callback(error) : Promise.reject(error);
                }
                
                if (this.isNodeModulesJSFile(resolvedPath)) {
                    console.warn(`🛡️ BLOCKED: Async node_modules write prevented: ${filePath}`);
                    const error = new Error(`CRITICAL: Async node_modules write blocked for ${filePath}`);
                    return callback ? callback(error) : Promise.reject(error);
                }
            }
            
            return originalWriteFile.call(fs, filePath, data, options, callback);
        };
        
        fs.appendFileSync = (filePath, data, options) => {
            const resolvedPath = path.resolve(filePath);
            
            if (this.isCriticalFile(resolvedPath)) {
                if (this.isJsonContamination(resolvedPath, data)) {
                    console.warn(`🛡️ BLOCKED: JSON append contamination prevented in ${filePath}`);
                    throw new Error(`CRITICAL: JSON append contamination blocked for ${filePath}`);
                }
                
                if (this.isNodeModulesJSFile(resolvedPath)) {
                    console.warn(`🛡️ BLOCKED: node_modules append prevented: ${filePath}`);
                    throw new Error(`CRITICAL: node_modules append blocked for ${filePath}`);
                }
            }
            
            return originalAppendFileSync.call(fs, filePath, data, options);
        };
        
        fs.appendFile = (filePath, data, options, callback) => {
            if (typeof options === 'function') {
                callback = options;
                options = undefined;
            }
            
            const resolvedPath = path.resolve(filePath);
            
            if (this.isCriticalFile(resolvedPath)) {
                if (this.isJsonContamination(resolvedPath, data)) {
                    console.warn(`🛡️ BLOCKED: Async JSON append contamination prevented in ${filePath}`);
                    const error = new Error(`CRITICAL: Async JSON append contamination blocked for ${filePath}`);
                    return callback ? callback(error) : Promise.reject(error);
                }
                
                if (this.isNodeModulesJSFile(resolvedPath)) {
                    console.warn(`🛡️ BLOCKED: Async node_modules append prevented: ${filePath}`);
                    const error = new Error(`CRITICAL: Async node_modules append blocked for ${filePath}`);
                    return callback ? callback(error) : Promise.reject(error);
                }
            }
            
            return originalAppendFile.call(fs, filePath, data, options, callback);
        };
        
        fs.createWriteStream = (filePath, options) => {
            const resolvedPath = path.resolve(filePath);
            
            if (this.isCriticalFile(resolvedPath)) {
                console.warn(`🛡️ BLOCKED: Write stream to critical file prevented: ${filePath}`);
                
                // Return a mock stream that silently discards writes
                const { Writable } = require('stream');
                const mockStream = new Writable({
                    write(chunk, encoding, callback) {
                        // Silently discard the write
                        callback();
                    }
                });
                
                // Add standard WriteStream methods for compatibility
                mockStream.path = filePath;
                mockStream.pending = false;
                
                return mockStream;
            }
            
            return originalCreateWriteStream.call(fs, filePath, options);
        };
        
        this.writeBlockingSetup = true;
        console.log('✅ Proactive write blocking system activated');
    }
    
    /**
     * NEW: Check if a file path is critical and should be protected
     * Excludes test directories to allow test mock file creation
     */
    isCriticalFile(filePath) {
        const normalizedPath = path.normalize(filePath);
        
        // Allow test directories - they should not be blocked
        if (normalizedPath.includes('.test-') || 
            normalizedPath.includes('/test/') || 
            normalizedPath.includes('\\test\\') ||
            normalizedPath.includes('test-env-') ||
            normalizedPath.includes('.test-isolated') ||
            normalizedPath.includes('.test-corruption-prevention')) {
            return false;
        }
        
        // Check against our list of critical file patterns
        return this.criticalFiles.some(pattern => 
            normalizedPath.includes(pattern) || 
            normalizedPath.endsWith(pattern)
        );
    }
    
    /**
     * NEW: Check if this is JSON data being written to a JavaScript file (contamination)
     */
    isJsonContamination(filePath, data) {
        // Only check JavaScript files
        if (!filePath.endsWith('.js')) {
            return false;
        }
        
        // Check if the data looks like JSON
        if (typeof data !== 'string') {
            data = String(data);
        }
        
        // Look for JSON contamination patterns
        const jsonPatterns = [
            /^\s*\{.*"project".*\}/s,
            /^\s*\{.*"tasks".*\}/s,
            /^\s*\{.*"execution_count".*\}/s,
            /^\s*\{.*"agents".*\}/s,
            /^\s*\{.*"current_mode".*\}/s
        ];
        
        return jsonPatterns.some(pattern => pattern.test(data.trim()));
    }
    
    /**
     * NEW: Check if this is a JavaScript file in node_modules
     * Excludes test directories to allow test mock file creation
     */
    isNodeModulesJSFile(filePath) {
        const normalizedPath = path.normalize(filePath);
        
        // Allow test directories - they should not be blocked
        if (normalizedPath.includes('.test-') || 
            normalizedPath.includes('/test/') || 
            normalizedPath.includes('\\test\\') ||
            normalizedPath.includes('test-env-') ||
            normalizedPath.includes('.test-isolated') ||
            normalizedPath.includes('.test-corruption-prevention')) {
            return false;
        }
        
        // Block real node_modules JavaScript files
        return normalizedPath.includes('node_modules') && normalizedPath.endsWith('.js');
    }
    
    /**
     * Continuous monitoring and cleanup (for use during test runs)
     */
    async startContinuousCleanup(intervalMs = 1000) {
        console.log('🔄 Starting continuous contamination cleanup...');
        
        const cleanupInterval = setInterval(async () => {
            const result = await this.restoreContaminatedFiles();
            if (result.restored > 0) {
                console.log(`🧹 Cleaned up contamination in ${result.files.join(', ')}`);
            }
        }, intervalMs);
        
        // Clean up on process exit
        process.on('exit', () => {
            clearInterval(cleanupInterval);
            // Final cleanup before exit
            this.restoreContaminatedFiles().catch(() => {});
        });
        
        process.on('SIGINT', () => {
            clearInterval(cleanupInterval);
            this.restoreContaminatedFiles().then(() => process.exit()).catch(() => process.exit());
        });
        
        return cleanupInterval;
    }
    
    /**
     * Create backups of clean files
     */
    async createBackups() {
        for (const file of this.criticalFiles) {
            const fullPath = path.join(this.projectRoot, file);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (this.isValidJavaScript(content)) {
                    const backupPath = fullPath + '.backup.original';
                    fs.writeFileSync(backupPath, content, 'utf8');
                    console.log(`📦 Created backup for ${file}`);
                }
            }
        }
    }
}

module.exports = ContaminationResolver;