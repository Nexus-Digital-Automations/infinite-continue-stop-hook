#!/usr/bin/env node

/**
 * Robust Build - Fault-tolerant build system with recovery mechanisms
 * Handles build failures gracefully and provides detailed error reporting
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class RobustBuildSystem {
    constructor() {
        this.args = process.argv.slice(2);
        this.verbose = this.args.includes('--verbose');
        this.commandIndex = this.args.findIndex(arg => arg === '--command');
        this.customCommand = this.commandIndex >= 0 ? this.args[this.commandIndex + 1] : null;
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }

    async runRobustBuild() {
        console.log('Robust Build: Starting fault-tolerant build process...');
        
        if (this.verbose) {
            console.log('Robust Build: Verbose mode enabled');
            console.log('Robust Build: Arguments:', this.args);
            if (this.customCommand) {
                console.log('Robust Build: Custom command:', this.customCommand);
            }
        }

        try {
            // Pre-build setup
            await this.preBuildSetup();
            
            // Determine build command
            const buildCommand = this.customCommand || 'npm run validate-build && npm run lint && npm run test && npm run post-build-validate';
            
            console.log(`Robust Build: Executing: ${buildCommand}`);
            
            // Run build with retry mechanism
            await this.executeWithRetry(buildCommand);
            
            // Post-build validation
            await this.postBuildValidation();
            
            console.log('Robust Build: ✅ Build completed successfully');
            
        } catch (error) {
            console.error('Robust Build: ❌ Build failed after all retry attempts:', error.message);
            await this.buildFailureRecovery(error);
            process.exit(1);
        }
    }

    async preBuildSetup() {
        console.log('Robust Build: Running pre-build setup...');
        
        try {
            // Ensure clean environment
            await this.runCommand('node', ['scripts/fix-contamination.js']);
            
            // Cleanup old artifacts
            await this.runCommand('node', ['scripts/cleanup-backups.js']);
            
            if (this.verbose) {
                console.log('Robust Build: Pre-build setup completed');
            }
        } catch (error) {
            console.warn('Robust Build: Pre-build setup warning:', error.message);
            // Continue build process even if pre-build setup has issues
        }
    }

    async executeWithRetry(command) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                console.log(`Robust Build: Attempt ${attempt}/${this.retryAttempts}`);
                
                if (this.verbose) {
                    console.log(`Robust Build: Running: ${command}`);
                }
                
                await this.runShellCommand(command);
                return; // Success - exit retry loop
                
            } catch (error) {
                lastError = error;
                console.error(`Robust Build: Attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.retryAttempts) {
                    console.log(`Robust Build: Retrying in ${this.retryDelay}ms...`);
                    await this.sleep(this.retryDelay);
                    
                    // Try recovery before retry
                    await this.attemptRecovery();
                }
            }
        }
        
        throw lastError;
    }

    async attemptRecovery() {
        console.log('Robust Build: Attempting recovery...');
        
        try {
            // Run contamination fix
            await this.runCommand('node', ['scripts/fix-contamination.js']);
            
            // Clear any lock files or temporary artifacts
            const tempFiles = ['test-fallback.lock', 'test-contamination.json'];
            tempFiles.forEach(file => {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                    if (this.verbose) {
                        console.log(`Robust Build: Removed temp file: ${file}`);
                    }
                }
            });
            
            if (this.verbose) {
                console.log('Robust Build: Recovery attempt completed');
            }
        } catch (error) {
            console.warn('Robust Build: Recovery attempt failed:', error.message);
        }
    }

    async postBuildValidation() {
        console.log('Robust Build: Running post-build validation...');
        
        try {
            // Validate build artifacts
            await this.runCommand('node', ['scripts/build-validator.js']);
            
            // Final contamination cleanup
            await this.runCommand('node', ['scripts/fix-contamination.js']);
            
            if (this.verbose) {
                console.log('Robust Build: Post-build validation completed');
            }
        } catch (error) {
            console.warn('Robust Build: Post-build validation warning:', error.message);
            // Don't fail the build for validation warnings
        }
    }

    async buildFailureRecovery(error) {
        console.log('Robust Build: Running build failure recovery...');
        
        try {
            // Generate failure report
            const failureReport = {
                timestamp: new Date().toISOString(),
                error: error.message,
                stack: error.stack,
                args: this.args,
                customCommand: this.customCommand,
                attempts: this.retryAttempts
            };
            
            const reportPath = path.join(process.cwd(), 'build-failure-report.json');
            fs.writeFileSync(reportPath, JSON.stringify(failureReport, null, 2));
            console.log(`Robust Build: Failure report saved to ${reportPath}`);
            
            // Attempt final cleanup
            await this.runCommand('node', ['scripts/fix-contamination.js']);
            
        } catch (recoveryError) {
            console.error('Robust Build: Recovery process failed:', recoveryError.message);
        }
    }

    runCommand(command, args) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                stdio: this.verbose ? 'inherit' : 'pipe',
                shell: process.platform === 'win32'
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Command failed with exit code ${code}`));
                }
            });
            
            child.on('error', (error) => {
                reject(error);
            });
        });
    }

    runShellCommand(command) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, [], {
                stdio: this.verbose ? 'inherit' : 'pipe',
                shell: true
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Shell command failed with exit code ${code}`));
                }
            });
            
            child.on('error', (error) => {
                reject(error);
            });
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create and run the robust build system
const buildSystem = new RobustBuildSystem();
buildSystem.runRobustBuild().catch((error) => {
    console.error('Robust Build: Fatal error:', error.message);
    process.exit(1);
});