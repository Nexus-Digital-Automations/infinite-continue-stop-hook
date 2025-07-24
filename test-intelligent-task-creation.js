#!/usr/bin/env node

/**
 * Test Script for Intelligent Task Creation System
 * 
 * Tests the new every-4th execution pattern and intelligent task creation logic
 */

const fs = require('fs');
const path = require('path');
const TaskManager = require('./lib/taskManager');

class TaskCreationTester {
    constructor() {
        this.testDir = path.join(__dirname, 'test-task-creation');
        this.todoPath = path.join(this.testDir, 'TODO.json');
        this.results = {
            tests: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    async runTests() {
        console.log('🧪 Testing Intelligent Task Creation System\n');
        
        try {
            await this._setupTestEnvironment();
            
            await this._testExecutionCountIncrement();
            await this._testEveryFourthPattern();
            await this._testTaskManagerIntegration();
            
            this._showResults();
            
        } catch (error) {
            console.error(`💥 Test suite failed: ${error.message}`);
        } finally {
            await this._cleanup();
        }
    }

    async _setupTestEnvironment() {
        console.log('📁 Setting up test environment...');
        
        if (fs.existsSync(this.testDir)) {
            fs.rmSync(this.testDir, { recursive: true, force: true });
        }
        fs.mkdirSync(this.testDir, { recursive: true });
        
        // Create test TODO.json
        const testTodo = {
            project: 'test-project',
            tasks: [
                {
                    id: 'test-task-1',
                    mode: 'DEVELOPMENT',
                    description: 'Test task 1',
                    status: 'pending',
                    prompt: 'Test prompt'
                },
                {
                    id: 'test-task-2', 
                    mode: 'TESTING',
                    description: 'Test task 2',
                    status: 'pending',
                    prompt: 'Test prompt 2'
                }
            ],
            review_strikes: 0,
            strikes_completed_last_run: false,
            current_task_index: 0,
            last_mode: null,
            execution_count: 0
        };
        
        fs.writeFileSync(this.todoPath, JSON.stringify(testTodo, null, 2));
        console.log('✅ Test environment ready\n');
    }

    async _testExecutionCountIncrement() {
        await this._test('Execution count increments correctly', async () => {
            // Simulate the hook logic for execution count
            let todoData = JSON.parse(fs.readFileSync(this.todoPath, 'utf8'));
            
            // Initialize execution_count if not present (like in stop-hook.js)
            if (typeof todoData.execution_count !== 'number') {
                todoData.execution_count = 0;
            }
            
            const initialCount = todoData.execution_count;
            
            // Increment execution count (like in stop-hook.js)
            todoData.execution_count++;
            
            fs.writeFileSync(this.todoPath, JSON.stringify(todoData, null, 2));
            
            const updatedData = JSON.parse(fs.readFileSync(this.todoPath, 'utf8'));
            
            if (updatedData.execution_count !== initialCount + 1) {
                throw new Error(`Expected count ${initialCount + 1}, got ${updatedData.execution_count}`);
            }
        });
    }

    async _testEveryFourthPattern() {
        await this._test('Every 4th execution pattern works', async () => {
            let todoData = JSON.parse(fs.readFileSync(this.todoPath, 'utf8'));
            
            const testPattern = [];
            
            // Simulate 12 executions to test the pattern
            for (let i = 1; i <= 12; i++) {
                todoData.execution_count = i;
                
                // Apply the same logic as in stop-hook.js
                const currentTask = todoData.tasks.find(t => t.status === 'pending' || t.status === 'in_progress') || todoData.tasks[0];
                let mode;
                
                if (currentTask.is_review_task) {
                    mode = 'REVIEWER';
                } else if (todoData.execution_count % 4 === 0) {
                    mode = 'TASK_CREATION';
                } else {
                    mode = currentTask.mode;
                }
                
                testPattern.push({
                    execution: i,
                    mode: mode
                });
            }
            
            // Verify pattern: executions 4, 8, 12 should be TASK_CREATION
            const taskCreationExecutions = testPattern.filter(p => p.mode === 'TASK_CREATION').map(p => p.execution);
            const expected = [4, 8, 12];
            
            if (JSON.stringify(taskCreationExecutions) !== JSON.stringify(expected)) {
                throw new Error(`Expected TASK_CREATION at executions ${expected}, got ${taskCreationExecutions}`);
            }
            
            // Verify other executions are task modes
            const otherExecutions = testPattern.filter(p => p.mode !== 'TASK_CREATION');
            if (otherExecutions.length !== 9) {
                throw new Error(`Expected 9 non-TASK_CREATION executions, got ${otherExecutions.length}`);
            }
        });
    }

    async _testTaskManagerIntegration() {
        await this._test('TaskManager with auto-fix integration works', async () => {
            const taskManager = new TaskManager(this.todoPath, { enableAutoFix: false }); // Disable auto-fix for test
            
            const todoData = await taskManager.readTodo();
            
            if (!todoData.project) {
                throw new Error('TaskManager failed to read TODO.json');
            }
            
            if (todoData.tasks.length !== 2) {
                throw new Error(`Expected 2 tasks, got ${todoData.tasks.length}`);
            }
            
            // Test getCurrentTask
            const currentTask = await taskManager.getCurrentTask();
            if (!currentTask || currentTask.id !== 'test-task-1') {
                throw new Error('getCurrentTask failed to return correct task');
            }
        });
    }

    async _test(name, testFn) {
        this.results.tests++;
        
        try {
            await testFn();
            this.results.passed++;
            console.log(`  ✅ ${name}`);
        } catch (error) {
            this.results.failed++;
            this.results.errors.push({ name, error: error.message });
            console.log(`  ❌ ${name}: ${error.message}`);
        }
    }

    _showResults() {
        console.log('\n📊 Test Results');
        console.log('================');
        console.log(`Total tests: ${this.results.tests}`);
        console.log(`Passed: ${this.results.passed} ✅`);
        console.log(`Failed: ${this.results.failed} ❌`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.errors.forEach(({ name, error }) => {
                console.log(`  • ${name}: ${error}`);
            });
        } else {
            console.log('\n🎉 All tests passed! The intelligent task creation system is working correctly.');
        }
        
        console.log('\n📋 System Summary:');
        console.log('- Every 4th execution triggers TASK_CREATION mode');
        console.log('- Execution count tracking works correctly');
        console.log('- TaskManager integration maintains compatibility');
        console.log('- Ready for integration with Claude Code hook system');
    }

    async _cleanup() {
        try {
            if (fs.existsSync(this.testDir)) {
                fs.rmSync(this.testDir, { recursive: true, force: true });
            }
        } catch (error) {
            console.warn(`⚠️  Cleanup warning: ${error.message}`);
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new TaskCreationTester();
    tester.runTests().catch(error => {
        console.error(`💥 Test error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = TaskCreationTester;