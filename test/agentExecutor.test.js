const fs = require('fs');
const path = require('path');
const AgentExecutor = require('../lib/agentExecutor');

describe('AgentExecutor', () => {
    let agentExecutor;
    let testDir;
    let originalCwd;
    let mockTask;
    let mockTodoData;

    beforeEach(() => {
        // Create isolated test environment
        testDir = path.join('.test-env', `agentExecutor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        
        originalCwd = process.cwd();
        process.chdir(testDir);
        
        // Initialize AgentExecutor with test modes directory
        const modesDir = path.join(testDir, 'development', 'modes');
        fs.mkdirSync(modesDir, { recursive: true });
        agentExecutor = new AgentExecutor(modesDir);
        
        // Setup mock task
        mockTask = {
            id: 'task_123',
            description: 'Test task description',
            mode: 'DEVELOPMENT',
            status: 'pending',
            prompt: 'Test task prompt',
            dependencies: ['src/test.js', 'package.json'],
            important_files: ['README.md', 'src/main.js'],
            requires_research: false,
            subtasks: []
        };
        
        // Setup mock todo data
        mockTodoData = {
            project: 'Test Project',
            tasks: [
                mockTask,
                { id: 'task_456', status: 'completed' },
                { id: 'task_789', status: 'pending' }
            ],
            review_strikes: 0
        };
        
        // Register cleanup
        global.registerTestCleanup(() => {
            process.chdir(originalCwd);
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true, force: true });
            }
        });
    });

    afterEach(() => {
        process.chdir(originalCwd);
    });

    describe('constructor', () => {
        test('should initialize with modes directory', () => {
            const modesDir = '/path/to/modes';
            const executor = new AgentExecutor(modesDir);
            expect(executor.modesDir).toBe(modesDir);
        });
    });

    describe('buildPrompt', () => {
        test('should build complete prompt with all sections', async () => {
            const prompt = await agentExecutor.buildPrompt(mockTask, 'DEVELOPMENT', mockTodoData);
            
            expect(prompt).toContain('# INFINITE CONTINUE HOOK - ACTIVE TASK');
            expect(prompt).toContain('CURRENT TASK: Test task description');
            expect(prompt).toContain('Mode: DEVELOPMENT');
            expect(prompt).toContain('Task ID: task_123');
            expect(prompt).toContain('Status: pending');
            expect(prompt).toContain('Project: Test Project');
            expect(prompt).toContain('Progress: 1/3 tasks (33%)');
            expect(prompt).toContain('## Critical Instructions');
            expect(prompt).toContain('READ OR REVIEW IF ALREADY READ all files listed below:');
            expect(prompt).toContain('These files contain ALL necessary context and instructions');
        });

        test('should include task-specific file instructions', async () => {
            const prompt = await agentExecutor.buildPrompt(mockTask, 'DEVELOPMENT', mockTodoData);
            
            expect(prompt).toContain('`README.md`');
            expect(prompt).toContain('`src/main.js`');
            expect(prompt).toContain('`src/test.js`');
            expect(prompt).toContain('`package.json`');
        });

        test('should handle TASK_CREATION mode specifically', async () => {
            const prompt = await agentExecutor.buildPrompt(mockTask, 'TASK_CREATION', mockTodoData);
            
            expect(prompt).toContain('## Intelligent Task Creation Context');
            expect(prompt).toContain('**CORE PRINCIPLE**: Create only necessary tasks');
            expect(prompt).toContain('**Current Task Context**');
            expect(prompt).toContain('**Project Analysis Required**');
        });

        test('should handle REVIEWER mode with strike information', async () => {
            mockTodoData.review_strikes = 1;
            const prompt = await agentExecutor.buildPrompt(mockTask, 'REVIEWER', mockTodoData);
            
            expect(prompt).toContain('## Review Context');
            expect(prompt).toContain('**Current Review Strike:** 2/3');
            expect(prompt).toContain('**Strike 2 Focus:** Lint and Code Quality');
        });

        test('should handle research mode with research report integration', async () => {
            mockTask.mode = 'RESEARCH';
            const prompt = await agentExecutor.buildPrompt(mockTask, 'RESEARCH', mockTodoData);
            
            expect(prompt).toContain('🔬 RESEARCH TASK REQUIREMENTS');
            expect(prompt).toContain('Follow structured research methodology');
            expect(prompt).toContain('Use standardized research report template');
        });

        test('should include subtasks when present', async () => {
            mockTask.subtasks = [
                { description: 'Subtask 1', status: 'pending' },
                { description: 'Subtask 2', status: 'completed' }
            ];
            
            const prompt = await agentExecutor.buildPrompt(mockTask, 'DEVELOPMENT', mockTodoData);
            
            expect(prompt).toContain('**Subtasks created:**');
            expect(prompt).toContain('[pending] Subtask 1');
            expect(prompt).toContain('[completed] Subtask 2');
        });

        test('should include task completion reminder', async () => {
            const prompt = await agentExecutor.buildPrompt(mockTask, 'DEVELOPMENT', mockTodoData);
            
            expect(prompt).toContain('🔴 CRITICAL: TASK COMPLETION REMINDER');
            expect(prompt).toContain('Quick Completion Code');
            expect(prompt).toContain('updateTaskStatus("task_123", "completed")');
            expect(prompt).toContain('🔧 COMMIT YOUR CHANGES BEFORE CONTINUING');
        });
    });

    describe('discoverDevelopmentFiles', () => {
        beforeEach(() => {
            // Create development directory structure
            const devDir = path.join(testDir, 'development');
            const modesDir = path.join(devDir, 'modes');
            const reportsDir = path.join(devDir, 'research-reports');
            
            fs.mkdirSync(devDir, { recursive: true });
            fs.mkdirSync(modesDir, { recursive: true });
            fs.mkdirSync(reportsDir, { recursive: true });
            
            // Create test files
            fs.writeFileSync(path.join(devDir, 'file1.md'), 'Content 1');
            fs.writeFileSync(path.join(devDir, 'file2.txt'), 'Content 2');
            fs.writeFileSync(path.join(modesDir, 'development.md'), 'Development mode content');
            fs.writeFileSync(path.join(modesDir, 'testing.md'), 'Testing mode content');
            fs.writeFileSync(path.join(reportsDir, 'report1.md'), 'Research report 1');
        });

        test('should discover files in development directory', () => {
            const files = agentExecutor.discoverDevelopmentFiles(testDir, 'DEVELOPMENT');
            
            expect(files).toContain('./development/file1.md');
            expect(files).toContain('./development/file2.txt');
            expect(files).toContain('./development/modes/development.md');
        });

        test('should include mode-specific file', () => {
            const files = agentExecutor.discoverDevelopmentFiles(testDir, 'TESTING');
            
            expect(files).toContain('./development/modes/testing.md');
        });

        test('should handle research mode with research reports', () => {
            const files = agentExecutor.discoverDevelopmentFiles(testDir, 'RESEARCH');
            
            expect(files).toContain('./development/research-reports/report1.md');
        });

        test('should handle non-existent development directory', () => {
            const emptyDir = path.join('.test-env', 'empty');
            fs.mkdirSync(emptyDir, { recursive: true });
            
            const files = agentExecutor.discoverDevelopmentFiles(emptyDir, 'DEVELOPMENT');
            
            expect(files).toEqual([]);
        });

        test('should handle filesystem errors gracefully', () => {
            // Mock fs.readdirSync to throw an error
            const originalReaddir = fs.readdirSync;
            fs.readdirSync = jest.fn(() => {
                throw new Error('Permission denied');
            });
            
            const files = agentExecutor.discoverDevelopmentFiles(testDir, 'DEVELOPMENT');
            
            expect(files).toEqual([]);
            
            // Restore original function
            fs.readdirSync = originalReaddir;
        });

        test('should handle mode with underscores', () => {
            fs.writeFileSync(path.join(testDir, 'development/modes/task-creation.md'), 'Task creation mode');
            
            const files = agentExecutor.discoverDevelopmentFiles(testDir, 'TASK_CREATION');
            
            expect(files).toContain('./development/modes/task-creation.md');
        });
    });

    describe('getAllFilesRecursively', () => {
        beforeEach(() => {
            // Create nested directory structure
            const subDir = path.join(testDir, 'subdir');
            const deepDir = path.join(subDir, 'deep');
            
            fs.mkdirSync(subDir, { recursive: true });
            fs.mkdirSync(deepDir, { recursive: true });
            
            fs.writeFileSync(path.join(testDir, 'root.txt'), 'Root file');
            fs.writeFileSync(path.join(subDir, 'sub.txt'), 'Sub file');
            fs.writeFileSync(path.join(deepDir, 'deep.txt'), 'Deep file');
        });

        test('should get all files recursively', () => {
            const files = agentExecutor.getAllFilesRecursively(testDir, testDir);
            
            expect(files).toContain('./root.txt');
            expect(files).toContain('./subdir/sub.txt');
            expect(files).toContain('./subdir/deep/deep.txt');
        });

        test('should handle directory read errors', () => {
            const originalReaddir = fs.readdirSync;
            fs.readdirSync = jest.fn(() => {
                throw new Error('Directory access denied');
            });
            
            const files = agentExecutor.getAllFilesRecursively(testDir, testDir);
            
            expect(files).toEqual([]);
            
            fs.readdirSync = originalReaddir;
        });

        test('should handle stat errors gracefully', () => {
            const originalStat = fs.statSync;
            fs.statSync = jest.fn(() => {
                throw new Error('Stat failed');
            });
            
            const files = agentExecutor.getAllFilesRecursively(testDir, testDir);
            
            expect(files).toEqual([]);
            
            fs.statSync = originalStat;
        });
    });

    describe('readModeFile', () => {
        beforeEach(() => {
            const modesDir = path.join(testDir, 'modes');
            fs.mkdirSync(modesDir, { recursive: true });
            fs.writeFileSync(path.join(modesDir, 'test.md'), 'Test mode content');
            
            agentExecutor = new AgentExecutor(modesDir);
        });

        test('should read existing mode file', () => {
            const content = agentExecutor.readModeFile('test.md');
            expect(content).toBe('Test mode content');
        });

        test('should throw error for non-existent file', () => {
            expect(() => {
                agentExecutor.readModeFile('nonexistent.md');
            }).toThrow('Mode file not found');
        });
    });

    describe('buildTaskContext', () => {
        test('should build basic task context', () => {
            const context = agentExecutor.buildTaskContext(mockTask, 'DEVELOPMENT', mockTodoData);
            
            expect(context).toContain('CURRENT TASK: Test task description');
            expect(context).toContain('Mode: DEVELOPMENT');
            expect(context).toContain('Task ID: task_123');
            expect(context).toContain('Progress: 1/3 tasks (33%)');
            expect(context).toContain('## Current Task Details');
            expect(context).toContain('**Dependencies to consider:** src/test.js, package.json');
            expect(context).toContain('**REVIEW these important files:** README.md, src/main.js');
        });

        test('should handle task with requires_research flag', () => {
            mockTask.requires_research = true;
            const context = agentExecutor.buildTaskContext(mockTask, 'DEVELOPMENT', mockTodoData);
            
            expect(context).toContain('This task requires research');
        });

        test('should handle task without dependencies', () => {
            mockTask.dependencies = [];
            const context = agentExecutor.buildTaskContext(mockTask, 'DEVELOPMENT', mockTodoData);
            
            expect(context).not.toContain('**Dependencies to consider:**');
        });

        test('should handle task without important files', () => {
            mockTask.important_files = [];
            const context = agentExecutor.buildTaskContext(mockTask, 'DEVELOPMENT', mockTodoData);
            
            expect(context).not.toContain('**REVIEW these important files:**');
        });
    });

    describe('getReviewFocus', () => {
        test('should return strike 1 focus', () => {
            const focus = agentExecutor.getReviewFocus(1);
            
            expect(focus).toContain('**Strike 1 Focus:** Build Verification');
            expect(focus).toContain('Ensure the project builds completely');
        });

        test('should return strike 2 focus', () => {
            const focus = agentExecutor.getReviewFocus(2);
            
            expect(focus).toContain('**Strike 2 Focus:** Lint and Code Quality');
            expect(focus).toContain('Run all linters and ensure zero errors');
        });

        test('should return strike 3 focus', () => {
            const focus = agentExecutor.getReviewFocus(3);
            
            expect(focus).toContain('**Strike 3 Focus:** Test Coverage and Success');
            expect(focus).toContain('Verify all tests pass without failures');
        });

        test('should default to strike 1 for invalid numbers', () => {
            const focus = agentExecutor.getReviewFocus(99);
            
            expect(focus).toContain('**Strike 1 Focus:** Build Verification');
        });
    });

    describe('getTaskSummary', () => {
        test('should calculate task summary correctly', () => {
            const summary = agentExecutor.getTaskSummary(mockTodoData);
            
            expect(summary.total).toBe(3);
            expect(summary.completed).toBe(1);
            expect(summary.percentage).toBe(33);
        });

        test('should handle empty task list', () => {
            const emptyTodoData = { tasks: [] };
            const summary = agentExecutor.getTaskSummary(emptyTodoData);
            
            expect(summary.total).toBe(0);
            expect(summary.completed).toBe(0);
            expect(summary.percentage).toBe(0);
        });
    });

    describe('getResearchReportPath', () => {
        test('should generate correct research report path', () => {
            const path = agentExecutor.getResearchReportPath('task_123');
            
            expect(path).toBe('./development/research-reports/research-report-task_123.md');
        });

        test('should handle different task ID formats', () => {
            const path = agentExecutor.getResearchReportPath('complex_task_456_abc');
            
            expect(path).toBe('./development/research-reports/research-report-complex_task_456_abc.md');
        });
    });

    describe('researchReportExists', () => {
        test('should return false for non-existent report', () => {
            const exists = agentExecutor.researchReportExists('nonexistent_task');
            
            expect(exists).toBe(false);
        });

        test('should return true for existing report', () => {
            // Create research report directory and file in the current working directory
            const reportsDir = path.join(process.cwd(), 'development', 'research-reports');
            fs.mkdirSync(reportsDir, { recursive: true });
            fs.writeFileSync(path.join(reportsDir, 'research-report-task_123.md'), 'Research content');
            
            const exists = agentExecutor.researchReportExists('task_123');
            
            expect(exists).toBe(true);
            
            // Cleanup
            if (fs.existsSync(path.join(reportsDir, 'research-report-task_123.md'))) {
                fs.unlinkSync(path.join(reportsDir, 'research-report-task_123.md'));  
            }
        });
    });

    describe('buildTaskFileInstructions', () => {
        test('should build instructions for task with files', () => {
            const instructions = agentExecutor.buildTaskFileInstructions(mockTask, 5);
            
            expect(instructions).toContain('5. `README.md`');
            expect(instructions).toContain('6. `src/main.js`');
            expect(instructions).toContain('7. `src/test.js`');
            expect(instructions).toContain('8. `package.json`');
        });

        test('should handle research task with existing report', () => {
            mockTask.mode = 'RESEARCH';
            
            // Create research report in current working directory
            const reportsDir = path.join(process.cwd(), 'development', 'research-reports');
            fs.mkdirSync(reportsDir, { recursive: true });
            fs.writeFileSync(path.join(reportsDir, 'research-report-task_123.md'), 'Research content');
            
            const instructions = agentExecutor.buildTaskFileInstructions(mockTask, 1);
            
            expect(instructions).toContain('research report - contains previous research findings');
            
            // Cleanup
            if (fs.existsSync(path.join(reportsDir, 'research-report-task_123.md'))) {
                fs.unlinkSync(path.join(reportsDir, 'research-report-task_123.md'));
            }
        });

        test('should handle research task without existing report', () => {
            mockTask.mode = 'RESEARCH';
            
            const instructions = agentExecutor.buildTaskFileInstructions(mockTask, 1);
            
            expect(instructions).toContain('create research report following standardized template');
        });

        test('should return empty string for task without files', () => {
            const taskWithoutFiles = {
                ...mockTask,
                dependencies: [],
                important_files: []
            };
            
            const instructions = agentExecutor.buildTaskFileInstructions(taskWithoutFiles);
            
            expect(instructions).toBe('');
        });

        test('should handle null/undefined file entries', () => {
            const taskWithNullFiles = {
                ...mockTask,
                dependencies: ['valid.js', null, '', 'another.js'],
                important_files: [null, 'valid.md', '']
            };
            
            const instructions = agentExecutor.buildTaskFileInstructions(taskWithNullFiles, 1);
            
            expect(instructions).toContain('`valid.md`');
            expect(instructions).toContain('`valid.js`');
            expect(instructions).toContain('`another.js`');
            expect(instructions).not.toContain('null');
            expect(instructions).not.toContain('READ ``');
        });
    });

    describe('buildTaskCompletionReminder', () => {
        test('should build reminder for development task', () => {
            const reminder = agentExecutor.buildTaskCompletionReminder(mockTask, 'DEVELOPMENT');
            
            expect(reminder).toContain('🔴 CRITICAL: TASK COMPLETION REMINDER');
            expect(reminder).toContain('AFTER COMPLETING THIS TASK');
            expect(reminder).toContain('updateTaskStatus("task_123", "completed")');
            expect(reminder).toContain('🔧 COMMIT YOUR CHANGES BEFORE CONTINUING');
        });

        test('should build reminder for task creation mode', () => {
            const reminder = agentExecutor.buildTaskCompletionReminder(mockTask, 'TASK_CREATION');
            
            expect(reminder).toContain('AFTER CREATING TASKS');
            expect(reminder).toContain('mark this task-creation task as completed');
        });

        test('should build reminder for reviewer mode', () => {
            const reminder = agentExecutor.buildTaskCompletionReminder(mockTask, 'REVIEWER');
            
            expect(reminder).toContain('AFTER COMPLETING REVIEW');
            expect(reminder).toContain('mark this review task as completed');
        });

        test('should include git commit instructions', () => {
            const reminder = agentExecutor.buildTaskCompletionReminder(mockTask, 'DEVELOPMENT');
            
            expect(reminder).toContain('git add -A');
            expect(reminder).toContain('git commit -m "feat: implement');
            expect(reminder).toContain('🤖 Generated with Claude Code');
            expect(reminder).toContain('git push');
        });

        test('should include completion criteria checklist', () => {
            const reminder = agentExecutor.buildTaskCompletionReminder(mockTask, 'DEVELOPMENT');
            
            expect(reminder).toContain('Completion Criteria Checklist');
            expect(reminder).toContain('All success criteria are met');
            expect(reminder).toContain('Tests pass (if applicable)');
            expect(reminder).toContain('Do NOT mark as completed if');
        });
    });

    describe('formatSubagentPrompt', () => {
        test('should format prompt for subagent execution', () => {
            const subtaskPrompt = 'Complete this specific subtask';
            const formattedPrompt = agentExecutor.formatSubagentPrompt(mockTask, subtaskPrompt);
            
            expect(formattedPrompt).toContain('Execute the following subtask');
            expect(formattedPrompt).toContain('Test task description');
            expect(formattedPrompt).toContain('Complete this specific subtask');
            expect(formattedPrompt).toContain('Important context from parent task');
            expect(formattedPrompt).toContain('Dependencies: ["src/test.js","package.json"]');
            expect(formattedPrompt).toContain('Important files: ["README.md","src/main.js"]');
            expect(formattedPrompt).toContain('Focus on completing this specific subtask');
        });

        test('should handle task without dependencies', () => {
            const taskWithoutDeps = { ...mockTask, dependencies: [], important_files: [] };
            const formattedPrompt = agentExecutor.formatSubagentPrompt(taskWithoutDeps, 'Test subtask');
            
            expect(formattedPrompt).toContain('Dependencies: []');
            expect(formattedPrompt).toContain('Important files: []');
        });
    });

    describe('edge cases and error handling', () => {
        test('should handle malformed task object', async () => {
            const malformedTask = {
                id: 'null_task',
                description: 'Test description',
                mode: 'DEVELOPMENT',
                status: 'pending',
                prompt: 'Test prompt',
                dependencies: [],
                important_files: [],
                requires_research: false,
                subtasks: []
            };
            
            // Should not throw errors
            const prompt = await agentExecutor.buildPrompt(malformedTask, 'DEVELOPMENT', mockTodoData);
            expect(prompt).toContain('# INFINITE CONTINUE HOOK - ACTIVE TASK');
        });

        test('should handle malformed todo data', async () => {
            const malformedTodoData = {
                project: 'Test Project',
                tasks: [mockTask],
                review_strikes: 0
            };
            
            // Should not throw errors and provide defaults
            const prompt = await agentExecutor.buildPrompt(mockTask, 'DEVELOPMENT', malformedTodoData);
            expect(prompt).toContain('# INFINITE CONTINUE HOOK - ACTIVE TASK');
        });

        test('should handle very long file paths', () => {
            const longPath = 'very/long/path/to/some/file/that/has/many/nested/directories/and/a/very/long/filename.js';
            const taskWithLongPaths = {
                ...mockTask,
                dependencies: [longPath],
                important_files: [longPath]
            };
            
            const instructions = agentExecutor.buildTaskFileInstructions(taskWithLongPaths);
            expect(instructions).toContain(longPath);
        });

        test('should handle special characters in file paths', () => {
            const specialPath = 'src/file with spaces & symbols!@#$%.js';
            const taskWithSpecialChars = {
                ...mockTask,
                dependencies: [specialPath],
                important_files: [specialPath]
            };
            
            const instructions = agentExecutor.buildTaskFileInstructions(taskWithSpecialChars);
            expect(instructions).toContain(specialPath);
        });
    });

    describe('integration scenarios', () => {
        test('should handle complete workflow with all features', async () => {
            const complexTask = {
                id: 'complex_task_789',
                description: 'Complex multi-step task',
                mode: 'RESEARCH',
                status: 'in_progress',
                prompt: 'Research and implement complex feature',
                dependencies: ['src/core/', 'config/', 'docs/'],
                important_files: ['README.md', 'ARCHITECTURE.md'],
                requires_research: true,
                subtasks: [
                    { description: 'Research phase', status: 'completed' },
                    { description: 'Implementation phase', status: 'in_progress' },
                    { description: 'Testing phase', status: 'pending' }
                ]
            };
            
            const complexTodoData = {
                project: 'Complex Project',
                tasks: [
                    { status: 'completed' },
                    { status: 'completed' },
                    complexTask,
                    { status: 'pending' },
                    { status: 'pending' }
                ],
                review_strikes: 2
            };
            
            // Create research report in current working directory
            const originalWriteFileSync = global.__originalFS?.writeFileSync || fs.writeFileSync;
            const originalMkdirSync = fs.mkdirSync;
            
            const reportsDir = path.join(process.cwd(), 'development', 'research-reports');
            originalMkdirSync.call(fs, reportsDir, { recursive: true });
            originalWriteFileSync.call(fs, path.join(reportsDir, 'research-report-complex_task_789.md'), 'Research findings');
            
            const prompt = await agentExecutor.buildPrompt(complexTask, 'RESEARCH', complexTodoData);
            
            expect(prompt).toContain('🔬 RESEARCH TASK REQUIREMENTS');
            expect(prompt).toContain('Review existing research report:');
            expect(prompt).toContain('This task requires research');
            expect(prompt).toContain('**Subtasks created:**');
            expect(prompt).toContain('[completed] Research phase');
            expect(prompt).toContain('[in_progress] Implementation phase');
            
            // Cleanup
            if (fs.existsSync(path.join(reportsDir, 'research-report-complex_task_789.md'))) {
                fs.unlinkSync(path.join(reportsDir, 'research-report-complex_task_789.md'));
            }
        });
    });
});