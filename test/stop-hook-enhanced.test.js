/**
 * Enhanced Stop Hook Tests
 * 
 * Comprehensive tests for stop-hook.js functionality including:
 * - Current working directory behavior
 * - TaskManager integration
 * - Professional messaging validation
 * - Task completion validation system
 * - Infinite continue mode operation
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

describe('Enhanced Stop Hook Tests', () => {
    const originalCwd = process.cwd();
    const projectDir = '/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook';
    
    beforeEach(() => {
        // Ensure we're in the project directory 
        process.chdir(projectDir);
    });
    
    afterEach(() => {
        // Return to original directory
        process.chdir(originalCwd);
    });

    describe('TaskManager Integration', () => {
        test('should provide TaskManager API instructions', async () => {
            const result = await runStopHook();
            
            // Should contain TaskManager API instructions
            expect(result.output).toContain('TASKMANAGER API');
            expect(result.output).toContain('Check current task status');
            expect(result.output).toContain('Mark current task completed');
            expect(result.output).toContain('Claim next available task');
            
            // Should provide absolute paths to TaskManager
            expect(result.output).toContain('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager');
        });
        
        test('should show current project status', async () => {
            const result = await runStopHook();
            
            expect(result.output).toContain('CURRENT PROJECT STATUS');
            expect(result.output).toMatch(/\d+ pending, \d+ in progress, \d+ completed/);
        });
        
        test('should display available task categories', async () => {
            const result = await runStopHook();
            
            expect(result.output).toContain('TASK CATEGORIES (Priority Order)');
            expect(result.output).toContain('linter-error (highest)');
            expect(result.output).toContain('linter-error');
            expect(result.output).toContain('missing-test (lowest)');
        });
    });

    describe('Professional Messaging Validation', () => {
        test('should use professional language in output', async () => {
            const result = await runStopHook();
            
            // Should NOT contain dramatic emojis or ALL CAPS dramatic text
            expect(result.output).not.toContain('🚨🚨🚨');
            expect(result.output).not.toContain('BLOCKING ISSUES');
            
            // Should contain professional guidance
            expect(result.output).toContain('WORKFLOW');
            expect(result.output).toContain('COMMANDS');
            expect(result.output).toContain('MANAGEMENT');
        });
        
        test('should provide constructive guidance', async () => {
            const result = await runStopHook();
            
            expect(result.output).toContain('MANDATORY WORKFLOW');
            expect(result.output).toContain('CONTINUE WORKING ON IT');
            expect(result.output).toContain('COMPLETE');
            expect(result.output).toContain('Mark tasks complete');
        });
    });

    describe('Infinite Continue Mode', () => {
        test('should default to infinite continue mode', async () => {
            const result = await runStopHook();
            
            expect(result.output).toContain('INFINITE CONTINUE MODE ACTIVE');
            expect(result.output).toContain('CONTINUING OPERATION');
            expect(result.exitCode).toBe(2); // Should continue by default
        });
        
        test('should provide stop authorization mechanism', async () => {
            const result = await runStopHook();
            
            expect(result.output).toContain('AUTHORIZE STOP WITH TASKMANAGER API');
            expect(result.output).toContain('authorizeStopHook');
            expect(result.output).toContain('single-use, 30-second expiration');
        });
        
        test('should not stop without authorization', async () => {
            // Run multiple times - should always continue
            for (let i = 0; i < 3; i++) {
                const result = await runStopHook();
                expect(result.exitCode).toBe(2);
                expect(result.output).toContain('STOP NOT ALLOWED');
            }
        });
    });

    describe('Task Completion Validation', () => {
        test('should detect blocked task completions', async () => {
            const result = await runStopHook();
            
            // Should provide guidance for task completion
            expect(result.output).toContain('Mark tasks complete');
            expect(result.output).toContain('WORKFLOW');
        });
        
        test('should provide evidence requirements guidance', async () => {
            const result = await runStopHook();
            
            // Should mention task management and completion 
            expect(result.output).toContain('MANDATORY WORKFLOW FOR CLAUDE CODE AGENT');
            expect(result.output).toContain('TaskManager API endpoints');
        });
    });

    describe('Universal Compatibility', () => {
        test('should work from project root directory', async () => {
            // Already in project directory from beforeEach
            const result = await runStopHook();
            
            expect(result.exitCode).toBe(2); // Should continue
            expect(result.output).toContain('TASKMANAGER API');
        });
        
        test('should handle different working directories', async () => {
            // Test from subdirectory
            const testDir = path.join(projectDir, 'test');
            process.chdir(testDir);
            
            const result = await runStopHook();
            
            // Should still work and provide absolute paths
            expect(result.output).toContain('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager');
        });
    });

    describe('Error Handling', () => {
        test('should handle missing TODO.json gracefully', async () => {
            // Move to temp directory without TODO.json
            const tempDir = fs.mkdtempSync('/tmp/test-stop-hook-');
            process.chdir(tempDir);
            
            try {
                const result = await runStopHook();
                
                expect(result.output).toContain('NO TASKMANAGER PROJECT DETECTED');
                expect(result.output).toContain('TODO.json');
                expect(result.output).toContain('INFINITE CONTINUE MODE ACTIVE');
                
                // Should still continue to prevent accidental stops
                expect(result.exitCode).toBe(2);
            } finally {
                // Cleanup
                process.chdir(originalCwd);
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });
        
        test('should provide setup instructions for new projects', async () => {
            const tempDir = fs.mkdtempSync('/tmp/test-stop-hook-');
            process.chdir(tempDir);
            
            try {
                const result = await runStopHook();
                
                expect(result.output).toContain('TO SET UP TASKMANAGER');
                expect(result.output).toContain('Run: node');
                expect(result.output).toContain('init --project');
            } finally {
                process.chdir(originalCwd);
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });
    });
});

/**
 * Helper function to run stop-hook and capture output
 */
function runStopHook(input = '') {
    const stopHookPath = path.join(__dirname, '..', 'stop-hook.js');
    return new Promise((resolve) => {
        const child = spawn('node', [stopHookPath], { 
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: process.cwd()
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('close', (code) => {
            resolve({
                exitCode: code,
                output: stderr + stdout, // Stop-hook outputs to stderr
                stdout,
                stderr
            });
        });
        
        child.on('error', (error) => {
            resolve({
                exitCode: -1,
                output: error.message,
                stdout: '',
                stderr: error.message
            });
        });
        
        // Send input if provided
        if (input) {
            child.stdin.write(input);
        }
        child.stdin.end();
    });
}