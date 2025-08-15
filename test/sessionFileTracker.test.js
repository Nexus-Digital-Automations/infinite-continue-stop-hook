const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const SessionFileTracker = require('../lib/sessionFileTracker');

// Mock child_process for testing
jest.mock('child_process');

describe('SessionFileTracker', () => {
    let tracker;
    let testProjectPath;
    let originalCwd;

    beforeEach(async () => {
        // Create temporary project directory
        testProjectPath = await fs.mkdtemp(path.join(os.tmpdir(), 'test-session-'));
        originalCwd = process.cwd();
        
        // Reset execSync mock
        execSync.mockClear();
        
        tracker = new SessionFileTracker('test-session-123', testProjectPath);
    });

    afterEach(async () => {
        // Cleanup
        if (tracker && tracker.isActive) {
            await tracker.stopTracking();
        }
        
        try {
            await fs.rmdir(testProjectPath, { recursive: true });
        } catch {
            // Ignore cleanup errors
        }
        
        process.chdir(originalCwd);
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with provided session ID and project path', () => {
            expect(tracker.sessionId).toBe('test-session-123');
            expect(tracker.projectPath).toBe(testProjectPath);
            expect(tracker.trackedFiles).toBeInstanceOf(Set);
            expect(tracker.isActive).toBe(false);
        });

        test('should generate session ID if not provided', () => {
            const autoTracker = new SessionFileTracker();
            expect(autoTracker.sessionId).toMatch(/^session_\d+_[a-z0-9]{9}$/);
        });

        test('should use current working directory if project path not provided', () => {
            const autoTracker = new SessionFileTracker();
            expect(autoTracker.projectPath).toBe(process.cwd());
        });

        test('should initialize with empty tracked files set', () => {
            expect(tracker.trackedFiles.size).toBe(0);
        });

        test('should set session start time', () => {
            expect(tracker.sessionStart).toBeInstanceOf(Date);
        });
    });

    describe('Session ID Generation', () => {
        test('should generate unique session IDs', () => {
            const id1 = tracker.generateSessionId();
            const id2 = tracker.generateSessionId();
            
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^session_\d+_[a-z0-9]{9}$/);
            expect(id2).toMatch(/^session_\d+_[a-z0-9]{9}$/);
        });

        test('should include timestamp in session ID', () => {
            const beforeTime = Date.now();
            const sessionId = tracker.generateSessionId();
            const afterTime = Date.now();
            
            const timestamp = parseInt(sessionId.split('_')[1]);
            expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
            expect(timestamp).toBeLessThanOrEqual(afterTime);
        });
    });

    describe('Tracking Control', () => {
        test('should start tracking and set active status', async () => {
            execSync.mockReturnValue('abc123\n');
            
            await tracker.startTracking();
            
            expect(tracker.isActive).toBe(true);
            expect(tracker.trackedFiles.size).toBe(0);
        });

        test('should capture initial git state when starting tracking', async () => {
            execSync
                .mockReturnValueOnce('abc123\n')  // git rev-parse HEAD
                .mockReturnValueOnce('file1.js\nfile2.js\n');  // git diff --name-only
            
            await tracker.startTracking();
            
            expect(tracker.initialCommit).toBe('abc123');
            expect(tracker.preSessionModified).toContain('file1.js');
            expect(tracker.preSessionModified).toContain('file2.js');
        });

        test('should handle git errors gracefully when starting tracking', async () => {
            execSync.mockImplementation(() => {
                throw new Error('Git not available');
            });
            
            await expect(tracker.startTracking()).resolves.not.toThrow();
            expect(tracker.isActive).toBe(true);
            expect(tracker.initialCommit).toBe(null);
        });

        test('should stop tracking and return modified files', async () => {
            await tracker.startTracking();
            tracker.trackFileOperation('test.js', 'modified');
            
            const result = await tracker.stopTracking();
            
            expect(tracker.isActive).toBe(false);
            expect(result).toHaveProperty('allModified');
            expect(result).toHaveProperty('lintableFiles');
            expect(result).toHaveProperty('sessionId');
        });

        test('should clear tracked files when restarting tracking', async () => {
            await tracker.startTracking();
            tracker.trackFileOperation('test.js', 'modified');
            expect(tracker.trackedFiles.size).toBe(1);
            
            await tracker.startTracking();
            expect(tracker.trackedFiles.size).toBe(0);
        });
    });

    describe('File Operation Tracking', () => {
        beforeEach(async () => {
            await tracker.startTracking();
        });

        test('should track file operations when active', () => {
            tracker.trackFileOperation('src/test.js', 'modified');
            
            expect(tracker.trackedFiles.has('src/test.js')).toBe(true);
        });

        test('should not track file operations when inactive', async () => {
            await tracker.stopTracking();
            
            tracker.trackFileOperation('src/test.js', 'modified');
            
            expect(tracker.trackedFiles.size).toBe(0);
        });

        test('should normalize and relativize file paths', () => {
            const absolutePath = path.join(testProjectPath, 'src', 'test.js');
            tracker.trackFileOperation(absolutePath, 'modified');
            
            expect(tracker.trackedFiles.has('src/test.js')).toBe(true);
        });

        test('should skip files matching skip patterns', () => {
            const skipFiles = [
                'node_modules/package/index.js',
                '.git/config',
                'debug.log',
                'temp.tmp',
                'file.backup',
                'coverage/index.html',
                '.jest-cache/file',
                'TODO.json',
                'DONE.json'
            ];

            skipFiles.forEach(file => {
                tracker.trackFileOperation(file, 'modified');
            });

            expect(tracker.trackedFiles.size).toBe(0);
        });

        test('should track files that do not match skip patterns', () => {
            const validFiles = [
                'src/index.js',
                'test/unit.test.js',
                'lib/module.js',
                'README.md',
                'package.json'
            ];

            validFiles.forEach(file => {
                tracker.trackFileOperation(file, 'modified');
            });

            expect(tracker.trackedFiles.size).toBe(5);
        });
    });

    describe('File Skip Logic', () => {
        test('should skip node_modules files', () => {
            expect(tracker.shouldSkipFile('node_modules/package/index.js')).toBe(true);
            expect(tracker.shouldSkipFile('nested/node_modules/file.js')).toBe(true);
        });

        test('should skip git files', () => {
            expect(tracker.shouldSkipFile('.git/config')).toBe(true);
            expect(tracker.shouldSkipFile('nested/.git/index')).toBe(true);
        });

        test('should skip log and temporary files', () => {
            expect(tracker.shouldSkipFile('debug.log')).toBe(true);
            expect(tracker.shouldSkipFile('temp.tmp')).toBe(true);
            expect(tracker.shouldSkipFile('file.backup')).toBe(true);
        });

        test('should skip testing and coverage directories', () => {
            expect(tracker.shouldSkipFile('coverage/index.html')).toBe(true);
            expect(tracker.shouldSkipFile('.jest-cache/transform')).toBe(true);
            expect(tracker.shouldSkipFile('.nyc_output/data.json')).toBe(true);
        });

        test('should skip TODO and DONE json files', () => {
            expect(tracker.shouldSkipFile('TODO.json')).toBe(true);
            expect(tracker.shouldSkipFile('DONE.json')).toBe(true);
            expect(tracker.shouldSkipFile('path/TODO.json')).toBe(true);
        });

        test('should not skip regular source files', () => {
            expect(tracker.shouldSkipFile('src/index.js')).toBe(false);
            expect(tracker.shouldSkipFile('lib/module.js')).toBe(false);
            expect(tracker.shouldSkipFile('README.md')).toBe(false);
            expect(tracker.shouldSkipFile('package.json')).toBe(false);
        });
    });

    describe('Modified Files Retrieval', () => {
        beforeEach(async () => {
            await tracker.startTracking();
        });

        test('should return tracked files in modified files list', async () => {
            tracker.trackFileOperation('src/test.js', 'modified');
            tracker.trackFileOperation('lib/util.js', 'modified');
            
            const result = await tracker.getModifiedFiles();
            
            expect(result.allModified).toContain('src/test.js');
            expect(result.allModified).toContain('lib/util.js');
            expect(result.sessionId).toBe('test-session-123');
        });

        test('should include git modified files', async () => {
            execSync.mockReturnValue('git-modified.js\nanother-file.js\n');
            
            const result = await tracker.getModifiedFiles();
            
            expect(result.allModified).toContain('git-modified.js');
            expect(result.allModified).toContain('another-file.js');
        });

        test('should exclude pre-session modified files from git', async () => {
            // Set up pre-session modified files
            tracker.preSessionModified = new Set(['pre-existing.js']);
            execSync.mockReturnValue('pre-existing.js\nnew-file.js\n');
            
            const result = await tracker.getModifiedFiles();
            
            expect(result.allModified).not.toContain('pre-existing.js');
            expect(result.allModified).toContain('new-file.js');
        });

        test('should filter lintable files correctly', async () => {
            tracker.trackFileOperation('src/test.js', 'modified');
            tracker.trackFileOperation('README.md', 'modified');
            tracker.trackFileOperation('lib/util.mjs', 'modified');
            tracker.trackFileOperation('config.json', 'modified');
            
            const result = await tracker.getModifiedFiles();
            
            expect(result.lintableFiles).toContain('src/test.js');
            expect(result.lintableFiles).toContain('lib/util.mjs');
            expect(result.lintableFiles).not.toContain('README.md');
            expect(result.lintableFiles).not.toContain('config.json');
        });

        test('should handle git errors gracefully', async () => {
            execSync.mockImplementation(() => {
                throw new Error('Git command failed');
            });
            
            tracker.trackFileOperation('src/test.js', 'modified');
            
            const result = await tracker.getModifiedFiles();
            
            expect(result.allModified).toContain('src/test.js');
        });

        test('should deduplicate files', async () => {
            tracker.trackFileOperation('src/test.js', 'modified');
            execSync.mockReturnValue('src/test.js\n');
            
            const result = await tracker.getModifiedFiles();
            
            expect(result.allModified.filter(f => f === 'src/test.js')).toHaveLength(1);
        });
    });

    describe('Git Integration', () => {
        test('should get git modified files when git is available', async () => {
            tracker.initialCommit = 'abc123';
            execSync.mockReturnValue('modified1.js\nmodified2.js\n');
            
            const gitFiles = await tracker.getGitModifiedFiles();
            
            expect(gitFiles).toContain('modified1.js');
            expect(gitFiles).toContain('modified2.js');
        });

        test('should return empty array when no initial commit', async () => {
            tracker.initialCommit = null;
            
            const gitFiles = await tracker.getGitModifiedFiles();
            
            expect(gitFiles).toEqual([]);
        });

        test('should return empty array when git command fails', async () => {
            tracker.initialCommit = 'abc123';
            execSync.mockImplementation(() => {
                throw new Error('Git failed');
            });
            
            const gitFiles = await tracker.getGitModifiedFiles();
            
            expect(gitFiles).toEqual([]);
        });

        test('should filter empty file names from git output', async () => {
            tracker.initialCommit = 'abc123';
            execSync.mockReturnValue('file1.js\n\nfile2.js\n');
            
            const gitFiles = await tracker.getGitModifiedFiles();
            
            expect(gitFiles).toEqual(['file1.js', 'file2.js']);
        });
    });

    describe('Lintable File Detection', () => {
        test('should identify JavaScript files as lintable', () => {
            expect(tracker.isLintableFile('src/index.js')).toBe(true);
            expect(tracker.isLintableFile('lib/module.mjs')).toBe(true);
            expect(tracker.isLintableFile('config/setup.cjs')).toBe(true);
        });

        test('should not identify non-JavaScript files as lintable', () => {
            expect(tracker.isLintableFile('README.md')).toBe(false);
            expect(tracker.isLintableFile('package.json')).toBe(false);
            expect(tracker.isLintableFile('style.css')).toBe(false);
            expect(tracker.isLintableFile('script.py')).toBe(false);
        });

        test('should handle files without extensions', () => {
            expect(tracker.isLintableFile('Dockerfile')).toBe(false);
            expect(tracker.isLintableFile('LICENSE')).toBe(false);
        });
    });

    describe('Session Summary', () => {
        test('should provide comprehensive session summary', async () => {
            await tracker.startTracking();
            tracker.trackFileOperation('src/test.js', 'modified');
            tracker.trackFileOperation('lib/util.js', 'modified');
            tracker.trackFileOperation('README.md', 'modified');
            
            const summary = await tracker.getSessionSummary();
            
            expect(summary.sessionId).toBe('test-session-123');
            expect(summary.sessionStart).toBeInstanceOf(Date);
            expect(summary.sessionEnd).toBeInstanceOf(Date);
            expect(summary.isActive).toBe(true);
            expect(summary.totalFilesModified).toBe(3);
            expect(summary.lintableFilesModified).toBe(2);
            expect(summary.files).toHaveProperty('allModified');
            expect(summary.files).toHaveProperty('lintableFiles');
        });

        test('should reflect inactive status after stopping', async () => {
            await tracker.startTracking();
            await tracker.stopTracking();
            
            const summary = await tracker.getSessionSummary();
            
            expect(summary.isActive).toBe(false);
        });
    });

    describe('Static Factory Methods', () => {
        test('should create tracker from Claude context', async () => {
            const claudeInput = { session_id: 'claude-session-456' };
            const contextTracker = await SessionFileTracker.createFromClaudeContext(claudeInput, testProjectPath);
            
            expect(contextTracker.sessionId).toBe('claude-session-456');
            expect(contextTracker.projectPath).toBe(testProjectPath);
            expect(contextTracker.isActive).toBe(true);
            
            await contextTracker.stopTracking();
        });

        test('should create tracker without Claude context', async () => {
            const contextTracker = await SessionFileTracker.createFromClaudeContext(null, testProjectPath);
            
            expect(contextTracker.sessionId).toMatch(/^session_\d+_[a-z0-9]{9}$/);
            expect(contextTracker.projectPath).toBe(testProjectPath);
            expect(contextTracker.isActive).toBe(true);
            
            await contextTracker.stopTracking();
        });

        test('should get recent modifications', async () => {
            const _sinceTime = new Date(Date.now() - (30 * 60 * 1000)); // 30 minutes ago
            execSync.mockReturnValue('recent1.js\nrecent2.md\nrecent3.mjs\n');
            
            const modifications = await SessionFileTracker.getRecentModifications(testProjectPath, 30);
            
            expect(modifications.allModified).toContain('recent1.js');
            expect(modifications.allModified).toContain('recent2.md');
            expect(modifications.lintableFiles).toContain('recent1.js');
            expect(modifications.lintableFiles).toContain('recent3.mjs');
            expect(modifications.lintableFiles).not.toContain('recent2.md');
            expect(modifications.timeframe.since).toBeInstanceOf(Date);
        });

        test('should handle git errors in recent modifications', async () => {
            execSync.mockImplementation(() => {
                throw new Error('Git not available');
            });
            
            const modifications = await SessionFileTracker.getRecentModifications(testProjectPath, 30);
            
            expect(modifications.allModified).toEqual([]);
            expect(modifications.lintableFiles).toEqual([]);
            expect(modifications.error).toBeDefined();
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle very long file paths', async () => {
            await tracker.startTracking();
            const longPath = 'very/'.repeat(50) + 'long/path/file.js';
            
            tracker.trackFileOperation(longPath, 'modified');
            
            expect(tracker.trackedFiles.has(longPath)).toBe(true);
        });

        test('should handle special characters in file paths', async () => {
            await tracker.startTracking();
            const specialPath = 'path with spaces/file-with-dashes/file_with_underscores.js';
            
            tracker.trackFileOperation(specialPath, 'modified');
            
            expect(tracker.trackedFiles.has(specialPath)).toBe(true);
        });

        test('should handle concurrent file tracking', async () => {
            await tracker.startTracking();
            
            const files = Array.from({ length: 100 }, (_, i) => `file${i}.js`);
            files.forEach(file => tracker.trackFileOperation(file, 'modified'));
            
            expect(tracker.trackedFiles.size).toBe(100);
        });

        test('should handle empty git output', async () => {
            tracker.initialCommit = 'abc123';
            execSync.mockReturnValue('');
            
            const gitFiles = await tracker.getGitModifiedFiles();
            
            expect(gitFiles).toEqual([]);
        });

        test('should handle git output with only whitespace', async () => {
            tracker.initialCommit = 'abc123';
            execSync.mockReturnValue('   \n\n  \n');
            
            const gitFiles = await tracker.getGitModifiedFiles();
            
            expect(gitFiles).toEqual([]);
        });

        test('should maintain session state through multiple operations', async () => {
            await tracker.startTracking();
            
            tracker.trackFileOperation('file1.js', 'modified');
            const summary1 = await tracker.getSessionSummary();
            
            tracker.trackFileOperation('file2.js', 'modified');
            const summary2 = await tracker.getSessionSummary();
            
            expect(summary1.totalFilesModified).toBe(1);
            expect(summary2.totalFilesModified).toBe(2);
            expect(summary1.sessionId).toBe(summary2.sessionId);
        });
    });
});