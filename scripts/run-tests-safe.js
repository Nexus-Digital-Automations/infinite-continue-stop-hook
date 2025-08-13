#!/usr/bin/env node

/**
 * Run Tests Safe - Executes Jest tests in a fully isolated environment
 * Prevents test contamination and ensures clean test execution
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('Run Tests Safe: Starting isolated test execution...');

class SafeTestRunner {
    constructor() {
        this.tempDir = path.join(os.tmpdir(), `jest-safe-${Date.now()}`);
        this.isCleanedUp = false;
    }

    async runSafeTests() {
        try {
            // Pre-test setup
            console.log('Run Tests Safe: Setting up isolated environment...');
            await this.setupIsolatedEnvironment();
            
            // Run contamination fix
            console.log('Run Tests Safe: Running pre-test contamination fix...');
            await this.runCommand('node', ['scripts/fix-contamination.js']);
            
            // Run Jest tests with maximum isolation
            console.log('Run Tests Safe: Running Jest in isolated mode...');
            await this.runCommand('node', [
                '--max-old-space-size=4096',
                './node_modules/.bin/jest',
                '--config', 'jest.contamination-safe.config.js',
                '--runInBand', // Run tests serially to prevent conflicts
                '--forceExit', // Force exit after tests complete
                '--detectOpenHandles', // Detect handles that prevent exit
                '--verbose'
            ]);
            
            // Post-test cleanup
            console.log('Run Tests Safe: Running post-test contamination fix...');
            await this.runCommand('node', ['scripts/fix-contamination.js']);
            
            console.log('Run Tests Safe: ✅ All tests completed successfully');
            
        } catch (error) {
            console.error('Run Tests Safe: ❌ Test execution failed:', error.message);
            process.exit(1);
        } finally {
            // Ensure cleanup happens even if tests fail
            await this.cleanup();
        }
    }

    async setupIsolatedEnvironment() {
        // Create temporary directory for test artifacts
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
        
        // Set environment variables for isolation
        process.env.NODE_ENV = 'test';
        process.env.JEST_WORKER_ID = '1';
        process.env.JEST_SAFE_MODE = 'true';
        process.env.TEMP_TEST_DIR = this.tempDir;
        
        console.log(`Run Tests Safe: Isolated environment created at ${this.tempDir}`);
    }

    async cleanup() {
        if (this.isCleanedUp) {
            return;
        }
        
        console.log('Run Tests Safe: Cleaning up isolated environment...');
        
        try {
            // Remove temporary directory
            if (fs.existsSync(this.tempDir)) {
                fs.rmSync(this.tempDir, { recursive: true, force: true });
            }
            
            // Clear test-related environment variables
            delete process.env.TEMP_TEST_DIR;
            delete process.env.JEST_SAFE_MODE;
            
            console.log('Run Tests Safe: Cleanup completed');
        } catch (error) {
            console.warn('Run Tests Safe: Cleanup warning:', error.message);
        }
        
        this.isCleanedUp = true;
    }

    runCommand(command, args) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                stdio: 'inherit',
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
}

// Create and run the safe test runner
const runner = new SafeTestRunner();

// Set up cleanup on process exit
process.on('exit', () => runner.cleanup());
process.on('SIGINT', () => runner.cleanup());
process.on('SIGTERM', () => runner.cleanup());

// Run the safe tests
runner.runSafeTests().catch((error) => {
    console.error('Run Tests Safe: Fatal error:', error.message);
    process.exit(1);
});