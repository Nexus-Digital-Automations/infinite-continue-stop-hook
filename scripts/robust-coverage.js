#!/usr/bin/env node

/**
 * Robust Coverage Collection System
 * 
 * This script provides contamination-resistant coverage collection with:
 * - Pre/post-run cache cleanup
 * - Isolated coverage environments
 * - Comprehensive validation
 * - Emergency recovery mechanisms
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class RobustCoverageCollector {
    constructor(options = {}) {
        this.options = {
            // Paths
            projectRoot: options.projectRoot || process.cwd(),
            cacheDir: options.cacheDir || '.jest-cache',
            coverageDir: options.coverageDir || 'coverage',
            configFile: options.configFile || 'jest.coverage.robust.config.js',
            
            // Safety settings
            maxRetries: options.maxRetries || 3,
            cleanupTimeout: options.cleanupTimeout || 5000,
            isolationMode: options.isolationMode || 'complete', // 'complete', 'partial', 'none'
            validateBeforeRun: options.validateBeforeRun || true,
            
            // Recovery settings
            enableEmergencyRecovery: options.enableEmergencyRecovery || true,
            backupOriginalFiles: options.backupOriginalFiles || true,
            
            ...options
        };
        
        this.cacheFiles = [];
        this.backups = new Map();
        this.contaminated = new Set();
        this.results = {
            success: false,
            attempts: 0,
            cleanupPerformed: false,
            contaminationDetected: false,
            emergencyRecoveryUsed: false
        };
    }

    /**
     * Main execution pipeline
     */
    async collect() {
        console.log('🔬 Robust Coverage Collection System');
        console.log('=====================================');
        
        try {
            // Phase 1: Pre-run preparation
            await this.prepareEnvironment();
            
            // Phase 2: Coverage collection with retries
            await this.collectWithRetries();
            
            // Phase 3: Post-run validation and cleanup
            await this.validateAndCleanup();
            
            console.log(this.results.success ? 
                '✅ Coverage collection completed successfully' : 
                '❌ Coverage collection failed'
            );
            
            return this.results;
            
        } catch (error) {
            console.error('💥 Critical error in coverage collection:', error.message);
            
            if (this.options.enableEmergencyRecovery) {
                await this.performEmergencyRecovery();
            }
            
            throw error;
        }
    }

    /**
     * Prepare clean environment for coverage collection
     */
    async prepareEnvironment() {
        console.log('🧹 Preparing clean environment...');
        
        // Step 1: Scan for existing contamination
        await this.scanForContamination();
        
        // Step 2: Clean cache directories
        await this.cleanCacheDirectories();
        
        // Step 3: Backup critical files
        if (this.options.backupOriginalFiles) {
            await this.backupCriticalFiles();
        }
        
        // Step 4: Initialize clean cache
        await this.initializeCleanCache();
        
        // Step 5: Validate configuration
        await this.validateConfiguration();
        
        console.log('✅ Environment preparation complete');
    }

    /**
     * Scan for contamination in critical files
     */
    async scanForContamination() {
        console.log('🔍 Scanning for existing contamination...');
        
        const criticalFiles = [
            'node_modules/exit/lib/exit.js',
            `${this.options.cacheDir}/haste-map*`,
            `${this.options.cacheDir}/coverage/haste-map*`,
            'package.json',
            'package-lock.json'
        ];
        
        for (const pattern of criticalFiles) {
            const files = await this.glob(pattern);
            
            for (const file of files) {
                if (await this.isFileContaminated(file)) {
                    this.contaminated.add(file);
                    console.warn(`⚠️ Contamination detected in: ${file}`);
                }
            }
        }
        
        if (this.contaminated.size > 0) {
            this.results.contaminationDetected = true;
            console.log(`🧹 Found ${this.contaminated.size} contaminated files`);
        }
    }

    /**
     * Check if a file is contaminated with JSON or binary data
     */
    async isFileContaminated(filePath) {
        try {
            if (!fs.existsSync(filePath)) return false;
            
            const content = fs.readFileSync(filePath, 'utf8');
            const size = fs.statSync(filePath).size;
            
            // Size-based detection
            if (size > 50 * 1024 * 1024) { // > 50MB
                return true;
            }
            
            // Content-based detection
            const contaminationPatterns = [
                // JSON contamination patterns
                /"tasks":\s*\[\s*\{/,
                /"infinite-continue-stop-hook"/,
                /"TODO\.json"/,
                /"mode":\s*"(DEVELOPMENT|TESTING|RESEARCH)"/,
                
                /\uFFFD/, // Replacement character
                
                // Cache corruption patterns
                /duplicates.*files.*map.*infinite-continue-stop-hook/,
                /gaI.*package\.json.*II@/,
                
                // Invalid JS patterns in cache files
                /^[^a-zA-Z]*[^\x20-\x7E]/
            ];
            
            for (const pattern of contaminationPatterns) {
                if (pattern.test(content)) {
                    return true;
                }
            }
            
            // Check for control characters separately to avoid regex issues
            for (let i = 0; i < content.length; i++) {
                const charCode = content.charCodeAt(i);
                if ((charCode >= 0 && charCode <= 8) || 
                    charCode === 11 || charCode === 12 || 
                    (charCode >= 14 && charCode <= 31) || 
                    charCode === 127) {
                    return true;
                }
            }
            
            // Additional checks for cache files
            if (filePath.includes('haste-map') || filePath.includes('.jest-cache')) {
                // Cache files should be valid JSON or binary format
                try {
                    if (content.trim().startsWith('{')) {
                        JSON.parse(content);
                    }
                } catch {
                    return true; // Invalid JSON in cache file
                }
            }
            
            return false;
            
        } catch (error) {
            console.warn(`⚠️ Could not check contamination in ${filePath}: ${error.message}`);
            return false;
        }
    }

    /**
     * Clean cache directories completely
     */
    async cleanCacheDirectories() {
        console.log('🗑️ Cleaning cache directories...');
        
        const dirsToClean = [
            this.options.cacheDir,
            `${this.options.cacheDir}/coverage`,
            'node_modules/.cache',
            this.options.coverageDir
        ];
        
        for (const dir of dirsToClean) {
            if (fs.existsSync(dir)) {
                try {
                    await this.rimraf(dir);
                    console.log(`✅ Cleaned: ${dir}`);
                } catch (error) {
                    console.warn(`⚠️ Could not clean ${dir}: ${error.message}`);
                }
            }
        }
        
        // Clean contaminated files
        for (const file of this.contaminated) {
            if (fs.existsSync(file)) {
                try {
                    fs.unlinkSync(file);
                    console.log(`✅ Removed contaminated file: ${file}`);
                } catch (error) {
                    console.warn(`⚠️ Could not remove ${file}: ${error.message}`);
                }
            }
        }
    }

    /**
     * Backup critical files before operation
     */
    async backupCriticalFiles() {
        console.log('💾 Backing up critical files...');
        
        const criticalFiles = [
            'node_modules/exit/lib/exit.js',
            'package.json',
            'package-lock.json'
        ];
        
        for (const file of criticalFiles) {
            if (fs.existsSync(file)) {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    this.backups.set(file, content);
                    console.log(`✅ Backed up: ${file}`);
                } catch (error) {
                    console.warn(`⚠️ Could not backup ${file}: ${error.message}`);
                }
            }
        }
    }

    /**
     * Initialize clean cache structure
     */
    async initializeCleanCache() {
        console.log('🆕 Initializing clean cache...');
        
        // Create clean cache directories
        const cacheDirs = [
            this.options.cacheDir,
            `${this.options.cacheDir}/coverage`,
            this.options.coverageDir
        ];
        
        for (const dir of cacheDirs) {
            try {
                fs.mkdirSync(dir, { recursive: true });
                
                // Create .gitignore to prevent accidental commits
                const gitignorePath = path.join(dir, '.gitignore');
                fs.writeFileSync(gitignorePath, '*\n!.gitignore\n');
                
            } catch (error) {
                console.warn(`⚠️ Could not create ${dir}: ${error.message}`);
            }
        }
    }

    /**
     * Validate Jest configuration
     */
    async validateConfiguration() {
        console.log('⚙️ Validating Jest configuration...');
        
        const configPath = path.join(this.options.projectRoot, this.options.configFile);
        
        if (!fs.existsSync(configPath)) {
            throw new Error(`Jest config not found: ${configPath}`);
        }
        
        try {
            const config = require(configPath);
            
            // Validate critical settings
            const requiredSettings = {
                collectCoverage: true,
                coverageDirectory: this.options.coverageDir,
                maxWorkers: 1, // Single worker to prevent contamination
                cache: false   // Disable cache during coverage for safety
            };
            
            for (const [key, value] of Object.entries(requiredSettings)) {
                if (config[key] !== value) {
                    console.warn(`⚠️ Config mismatch: ${key} should be ${value}, got ${config[key]}`);
                }
            }
            
            console.log('✅ Configuration validation complete');
            
        } catch (error) {
            throw new Error(`Invalid Jest configuration: ${error.message}`);
        }
    }

    /**
     * Collect coverage with retry logic
     */
    async collectWithRetries() {
        console.log('📊 Starting coverage collection with retries...');
        
        for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
            this.results.attempts = attempt;
            console.log(`\n🔄 Attempt ${attempt}/${this.options.maxRetries}`);
            
            try {
                const success = await this.runCoverageCollection();
                
                if (success) {
                    this.results.success = true;
                    console.log(`✅ Coverage collection succeeded on attempt ${attempt}`);
                    return;
                }
                
            } catch (error) {
                console.error(`❌ Attempt ${attempt} failed: ${error.message}`);
                
                if (attempt < this.options.maxRetries) {
                    console.log('🧹 Cleaning up for retry...');
                    await this.cleanupForRetry();
                }
            }
        }
        
        throw new Error(`Coverage collection failed after ${this.options.maxRetries} attempts`);
    }

    /**
     * Run actual coverage collection
     */
    async runCoverageCollection() {
        console.log('🚀 Running Jest coverage collection...');
        
        return new Promise((resolve, reject) => {
            const args = [
                'jest',
                '--config', this.options.configFile,
                '--coverage',
                '--no-cache',
                '--maxWorkers=1',
                '--forceExit'
            ];
            
            const jestProcess = spawn('npx', args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { 
                    ...process.env, 
                    CI: 'true',
                    NODE_ENV: 'test',
                    COVERAGE_MODE: 'true'
                }
            });
            
            let _stdout = '';
            let _stderr = '';
            
            jestProcess.stdout.on('data', (data) => {
                _stdout += data.toString();
                // Stream output in real-time
                process.stdout.write(data);
            });
            
            jestProcess.stderr.on('data', (data) => {
                _stderr += data.toString();
                process.stderr.write(data);
            });
            
            // Timeout handling
            const timeout = setTimeout(() => {
                jestProcess.kill('SIGKILL');
                reject(new Error('Coverage collection timed out'));
            }, this.options.cleanupTimeout * 6); // 30 seconds default
            
            jestProcess.on('close', async (code) => {
                clearTimeout(timeout);
                
                try {
                    // Always restore exit.js after Jest runs
                    await this.restoreExitJs();
                    
                    // Check for contamination after run
                    const contaminationDetected = await this.detectPostRunContamination();
                    
                    if (code === 0 && !contaminationDetected) {
                        resolve(true);
                    } else {
                        reject(new Error(`Jest failed with code ${code}${contaminationDetected ? ' and contamination detected' : ''}`));
                    }
                    
                } catch (error) {
                    reject(error);
                }
            });
            
            jestProcess.on('error', (error) => {
                clearTimeout(timeout);
                reject(new Error(`Jest process error: ${error.message}`));
            });
        });
    }

    /**
     * Restore exit.js file
     */
    async restoreExitJs() {
        const exitJsPath = 'node_modules/exit/lib/exit.js';
        const originalContent = this.backups.get(exitJsPath);
        
        if (originalContent && fs.existsSync(exitJsPath)) {
            try {
                const currentContent = fs.readFileSync(exitJsPath, 'utf8');
                
                if (currentContent !== originalContent) {
                    fs.writeFileSync(exitJsPath, originalContent, 'utf8');
                    console.log('✅ Restored exit.js to original state');
                }
            } catch (error) {
                console.warn(`⚠️ Could not restore exit.js: ${error.message}`);
            }
        }
    }

    /**
     * Detect contamination after coverage run
     */
    async detectPostRunContamination() {
        const cacheFiles = await this.glob(`${this.options.cacheDir}/**/*`);
        
        for (const file of cacheFiles) {
            if (await this.isFileContaminated(file)) {
                console.warn(`⚠️ Post-run contamination detected in: ${file}`);
                return true;
            }
        }
        
        return false;
    }

    /**
     * Cleanup between retry attempts
     */
    async cleanupForRetry() {
        // Clean cache again
        await this.cleanCacheDirectories();
        
        // Restore backed up files
        for (const [file, content] of this.backups) {
            if (fs.existsSync(file)) {
                try {
                    fs.writeFileSync(file, content, 'utf8');
                } catch (error) {
                    console.warn(`⚠️ Could not restore ${file}: ${error.message}`);
                }
            }
        }
        
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    /**
     * Validate results and perform final cleanup
     */
    async validateAndCleanup() {
        console.log('🔍 Validating coverage results...');
        
        // Check if coverage files were generated
        const coverageFiles = [
            `${this.options.coverageDir}/coverage-summary.json`,
            `${this.options.coverageDir}/coverage-final.json`,
            `${this.options.coverageDir}/lcov.info`
        ];
        
        let filesGenerated = 0;
        for (const file of coverageFiles) {
            if (fs.existsSync(file)) {
                filesGenerated++;
                console.log(`✅ Generated: ${file}`);
            }
        }
        
        if (filesGenerated === 0) {
            throw new Error('No coverage files were generated');
        }
        
        // Final contamination check
        const finalContamination = await this.detectPostRunContamination();
        if (finalContamination) {
            console.warn('⚠️ Final contamination check failed');
        }
        
        this.results.cleanupPerformed = true;
        console.log('✅ Validation and cleanup complete');
    }

    /**
     * Emergency recovery procedures
     */
    async performEmergencyRecovery() {
        console.log('🚨 Performing emergency recovery...');
        
        try {
            // Restore all backed up files
            for (const [file, content] of this.backups) {
                try {
                    fs.writeFileSync(file, content, 'utf8');
                    console.log(`✅ Emergency restored: ${file}`);
                } catch (error) {
                    console.error(`❌ Could not restore ${file}: ${error.message}`);
                }
            }
            
            // Complete cache cleanup
            await this.cleanCacheDirectories();
            
            this.results.emergencyRecoveryUsed = true;
            console.log('✅ Emergency recovery completed');
            
        } catch (error) {
            console.error('💥 Emergency recovery failed:', error.message);
        }
    }

    /**
     * Utility: Glob pattern matching
     */
    async glob(pattern) {
        // Simple glob implementation for basic patterns
        const files = [];
        
        if (pattern.includes('*')) {
            const baseDir = pattern.split('*')[0];
            if (fs.existsSync(baseDir)) {
                try {
                    const dirContents = fs.readdirSync(baseDir, { recursive: true });
                    files.push(...dirContents.map(f => path.join(baseDir, f)));
                } catch {
                    // Ignore errors
                }
            }
        } else if (fs.existsSync(pattern)) {
            files.push(pattern);
        }
        
        return files;
    }

    /**
     * Utility: Remove directory recursively
     */
    async rimraf(dir) {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    }
}

// CLI interface
if (require.main === module) {
    const collector = new RobustCoverageCollector();
    
    collector.collect()
        .then(results => {
            console.log('\n📊 Coverage Collection Results:');
            console.log(`   Success: ${results.success ? '✅' : '❌'}`);
            console.log(`   Attempts: ${results.attempts}`);
            console.log(`   Contamination Detected: ${results.contaminationDetected ? '⚠️' : '✅'}`);
            console.log(`   Cleanup Performed: ${results.cleanupPerformed ? '✅' : '❌'}`);
            console.log(`   Emergency Recovery: ${results.emergencyRecoveryUsed ? '⚠️' : '✅'}`);
            
            process.exit(results.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Coverage collection failed:', error.message);
            process.exit(1);
        });
}

module.exports = RobustCoverageCollector;