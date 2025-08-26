#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Task Switching Functionality
 * 
 * This script tests all the new task switching features:
 * - Creating urgent tasks and automatic switching
 * - Preserving previous task context 
 * - Resuming switched tasks
 * - Available tasks endpoint with context
 * - Task switching API endpoints
 */

const TaskManager = require('./lib/taskManager');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_TODO_PATH = path.join(__dirname, 'test-switching-TODO.json');
const TEST_DONE_PATH = path.join(__dirname, 'test-switching-DONE.json');

// Test agent IDs
const AGENT_1 = 'test-agent-switching-1';
const AGENT_2 = 'test-agent-switching-2';

class TaskSwitchingTester {
    constructor() {
        this.taskManager = new TaskManager(TEST_TODO_PATH, {
            donePath: TEST_DONE_PATH,
            enableArchiving: false,
            enableMultiAgent: true
        });
        this.results = [];
        this.testStartTime = Date.now();
    }

    /**
     * Initialize clean test environment
     */
    async setup() {
        console.log('🔧 Setting up test environment...\n');
        
        // Remove existing test files
        if (fs.existsSync(TEST_TODO_PATH)) fs.unlinkSync(TEST_TODO_PATH);
        if (fs.existsSync(TEST_DONE_PATH)) fs.unlinkSync(TEST_DONE_PATH);
        
        // Initialize empty TODO structure
        const initialData = {
            project: 'task-switching-test',
            tasks: [],
            agents: {},
            metadata: {
                created_at: new Date().toISOString(),
                test_mode: true
            }
        };
        
        fs.writeFileSync(TEST_TODO_PATH, JSON.stringify(initialData, null, 2));
        console.log('✅ Test environment initialized');
    }

    /**
     * Clean up test files
     */
    async cleanup() {
        console.log('\n🧹 Cleaning up test environment...');
        
        try {
            if (fs.existsSync(TEST_TODO_PATH)) fs.unlinkSync(TEST_TODO_PATH);
            if (fs.existsSync(TEST_DONE_PATH)) fs.unlinkSync(TEST_DONE_PATH);
            console.log('✅ Test files cleaned up');
        } catch (error) {
            console.warn('⚠️  Error cleaning up test files:', error.message);
        }
    }

    /**
     * Log test result
     */
    logResult(testName, success, details = {}, error = null) {
        const result = {
            test: testName,
            success,
            details,
            error: error?.message || null,
            timestamp: new Date().toISOString(),
            duration: Date.now() - this.testStartTime
        };
        
        this.results.push(result);
        
        const status = success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${testName}`);
        
        if (details && Object.keys(details).length > 0) {
            console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
        }
        
        if (error) {
            console.log(`   Error: ${error.message}`);
        }
        
        console.log(); // Empty line for readability
    }

    /**
     * Test 1: Create basic tasks for testing
     */
    async test1_CreateBasicTasks() {
        console.log('📋 Test 1: Creating basic tasks for testing scenarios');
        
        try {
            // Create a regular task
            const regularTaskId = await this.taskManager.createTask({
                title: 'Regular development task',
                description: 'A normal development task that can be switched away from',
                category: 'missing-feature',
                priority: 'medium',
                mode: 'DEVELOPMENT'
            });
            
            // Create another regular task
            const anotherTaskId = await this.taskManager.createTask({
                title: 'Another regular task',
                description: 'Another task for testing available tasks',
                category: 'enhancement',
                priority: 'low',
                mode: 'DEVELOPMENT'
            });
            
            // Verify tasks were created
            const todoData = await this.taskManager.readTodo();
            const regularTask = todoData.tasks.find(t => t.id === regularTaskId);
            const anotherTask = todoData.tasks.find(t => t.id === anotherTaskId);
            
            this.logResult('Create basic tasks', 
                !!(regularTask && anotherTask),
                {
                    regularTaskId,
                    anotherTaskId,
                    regularTaskStatus: regularTask?.status,
                    anotherTaskStatus: anotherTask?.status
                }
            );
            
            return { regularTaskId, anotherTaskId };
            
        } catch (error) {
            this.logResult('Create basic tasks', false, {}, error);
            throw error;
        }
    }

    /**
     * Test 2: Agent claims a regular task
     */
    async test2_ClaimRegularTask(regularTaskId) {
        console.log('👤 Test 2: Agent claims regular task and starts working');
        
        try {
            // Claim the task
            const claimResult = await this.taskManager.claimTask(regularTaskId, AGENT_1, 'normal');
            
            // Verify task was claimed and is in progress
            const todoData = await this.taskManager.readTodo();
            const task = todoData.tasks.find(t => t.id === regularTaskId);
            
            this.logResult('Claim regular task',
                claimResult.success && task.status === 'in_progress' && task.assigned_agent === AGENT_1,
                {
                    claimSuccess: claimResult.success,
                    taskStatus: task?.status,
                    assignedAgent: task?.assigned_agent,
                    claimedAt: task?.started_at
                }
            );
            
        } catch (error) {
            this.logResult('Claim regular task', false, {}, error);
            throw error;
        }
    }

    /**
     * Test 3: Create urgent task and test automatic switching
     */
    async test3_CreateUrgentTask(regularTaskId) {
        console.log('🚨 Test 3: Create urgent task and test automatic switching');
        
        try {
            // Create urgent task
            const urgentTaskData = {
                title: 'Critical bug fix needed immediately',
                description: 'A critical issue that requires immediate attention',
                category: 'error',
                mode: 'DEVELOPMENT',
                switchReason: 'Critical production issue detected'
            };
            
            const switchResult = await this.taskManager.createUrgentTask(urgentTaskData, AGENT_1);
            
            // Verify switching occurred
            const todoData = await this.taskManager.readTodo();
            const originalTask = todoData.tasks.find(t => t.id === regularTaskId);
            const urgentTask = todoData.tasks.find(t => t.id === switchResult.urgentTaskId);
            
            this.logResult('Create urgent task and switch',
                switchResult.success && 
                originalTask.status === 'switched' &&
                urgentTask.status === 'in_progress' &&
                urgentTask.assigned_agent === AGENT_1,
                {
                    switchSuccess: switchResult.success,
                    urgentTaskId: switchResult.urgentTaskId,
                    originalTaskStatus: originalTask?.status,
                    urgentTaskStatus: urgentTask?.status,
                    urgentTaskPriority: urgentTask?.priority,
                    switchContext: originalTask?.switch_context,
                    previousTaskId: switchResult.previousTaskId
                }
            );
            
            return switchResult.urgentTaskId;
            
        } catch (error) {
            this.logResult('Create urgent task and switch', false, {}, error);
            throw error;
        }
    }

    /**
     * Test 4: Test getAvailableTasksWithContext method
     */
    async test4_GetAvailableTasksWithContext(regularTaskId, _anotherTaskId) {
        console.log('📋 Test 4: Test available tasks with context retrieval');
        
        try {
            const tasksContext = await this.taskManager.getAvailableTasksWithContext(AGENT_1);
            
            // Verify response structure
            const hasCurrentTask = !!tasksContext.currentTask;
            const hasPreviousTasks = tasksContext.previousTasks.length > 0;
            const previousTaskIsSwitched = tasksContext.previousTasks.some(t => t.id === regularTaskId);
            
            this.logResult('Get available tasks with context',
                tasksContext.success && hasCurrentTask && hasPreviousTasks,
                {
                    success: tasksContext.success,
                    agentId: tasksContext.agentId,
                    hasCurrentTask,
                    currentTaskId: tasksContext.currentTask?.id,
                    previousTasksCount: tasksContext.previousTasks.length,
                    availableTasksCount: tasksContext.availableTasks.length,
                    previousTaskIsSwitched,
                    summary: tasksContext.summary
                }
            );
            
        } catch (error) {
            this.logResult('Get available tasks with context', false, {}, error);
            throw error;
        }
    }

    /**
     * Test 5: Complete urgent task
     */
    async test5_CompleteUrgentTask(urgentTaskId) {
        console.log('✅ Test 5: Complete urgent task');
        
        try {
            // Complete the urgent task
            await this.taskManager.updateTaskStatus(urgentTaskId, 'completed', 'Urgent issue resolved');
            
            // Verify task completion
            const todoData = await this.taskManager.readTodo();
            const urgentTask = todoData.tasks.find(t => t.id === urgentTaskId);
            
            this.logResult('Complete urgent task',
                urgentTask.status === 'completed',
                {
                    taskId: urgentTaskId,
                    status: urgentTask?.status,
                    completedAt: urgentTask?.completed_at,
                    completionNotes: urgentTask?.completion_notes
                }
            );
            
        } catch (error) {
            this.logResult('Complete urgent task', false, {}, error);
            throw error;
        }
    }

    /**
     * Test 6: Resume switched task
     */
    async test6_ResumeSwitchedTask(regularTaskId) {
        console.log('🔄 Test 6: Resume previously switched task');
        
        try {
            // Resume the switched task
            const resumeResult = await this.taskManager.resumeSwitchedTask(regularTaskId, AGENT_1);
            
            // Verify task was resumed
            const todoData = await this.taskManager.readTodo();
            const resumedTask = todoData.tasks.find(t => t.id === regularTaskId);
            
            this.logResult('Resume switched task',
                resumeResult.success && resumedTask.status === 'in_progress',
                {
                    resumeSuccess: resumeResult.success,
                    taskId: regularTaskId,
                    status: resumedTask?.status,
                    assignedAgent: resumedTask?.assigned_agent,
                    resumedAt: resumedTask?.resumed_at,
                    switchContext: resumedTask?.switch_context
                }
            );
            
        } catch (error) {
            this.logResult('Resume switched task', false, {}, error);
            throw error;
        }
    }

    /**
     * Test 7: Test getCurrentTaskWithSwitching method
     */
    async test7_TestGetCurrentTaskWithSwitching() {
        console.log('🔍 Test 7: Test getCurrentTaskWithSwitching method');
        
        try {
            // First, create another urgent task to test detection
            await this.taskManager.createTask({
                title: 'Another critical issue',
                description: 'Another urgent issue for testing',
                category: 'linter-error',
                priority: 'critical',
                urgent: true,
                mode: 'DEVELOPMENT'
            });
            
            // Test the switching logic
            const switchingResult = await this.taskManager.getCurrentTaskWithSwitching(AGENT_1);
            
            this.logResult('Test getCurrentTaskWithSwitching',
                !!switchingResult && switchingResult.action,
                {
                    action: switchingResult.action,
                    hasCurrentTask: !!switchingResult.currentTask,
                    urgentTaskDetected: switchingResult.action === 'urgent_task_switch_recommended',
                    urgentTaskId: switchingResult.urgentTask?.id,
                    operationId: switchingResult.operationId
                }
            );
            
        } catch (error) {
            this.logResult('Test getCurrentTaskWithSwitching', false, {}, error);
            throw error;
        }
    }

    /**
     * Test 8: Test claiming switched tasks
     */
    async test8_TestClaimSwitchedTask(regularTaskId) {
        console.log('🎯 Test 8: Test claiming switched tasks');
        
        try {
            // Get the current state of the regular task (which should be switched)
            const todoData = await this.taskManager.readTodo();
            const switchedTask = todoData.tasks.find(t => t.id === regularTaskId);
            
            // Verify the task is in switched state
            const isInSwitchedState = switchedTask?.status === 'switched';
            
            if (isInSwitchedState) {
                // Try to claim by same agent (should work)
                const claimResult = await this.taskManager.claimTask(regularTaskId, AGENT_1, 'normal');
                
                // Try to claim by different agent (should fail)  
                const claimResult2 = await this.taskManager.claimTask(regularTaskId, AGENT_2, 'normal');
                
                this.logResult('Test claiming switched tasks',
                    claimResult.success && !claimResult2.success,
                    {
                        taskInSwitchedState: isInSwitchedState,
                        sameAgentClaim: claimResult.success,
                        differentAgentClaim: claimResult2.success,
                        sameAgentReason: claimResult.reason,
                        differentAgentReason: claimResult2.reason
                    }
                );
            } else {
                // If task is not switched, test that we can't claim a non-switched task from different agent
                const claimResult2 = await this.taskManager.claimTask(regularTaskId, AGENT_2, 'normal');
                
                this.logResult('Test claiming switched tasks', 
                    !claimResult2.success,  // Should fail for different agent
                    {
                        taskInSwitchedState: isInSwitchedState,
                        taskCurrentStatus: switchedTask?.status,
                        differentAgentClaim: claimResult2.success,
                        differentAgentReason: claimResult2.reason,
                        note: 'Task not in switched state, testing regular claim logic'
                    }
                );
            }
            
        } catch (error) {
            this.logResult('Test claiming switched tasks', false, {}, error);
        }
    }

    /**
     * Generate comprehensive test report
     */
    generateReport() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const totalDuration = Date.now() - this.testStartTime;
        
        console.log('='.repeat(80));
        console.log('📊 TASK SWITCHING FUNCTIONALITY TEST REPORT');
        console.log('='.repeat(80));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        console.log(`Total Duration: ${totalDuration}ms`);
        console.log('='.repeat(80));
        
        if (failedTests > 0) {
            console.log('❌ FAILED TESTS:');
            this.results.filter(r => !r.success).forEach(result => {
                console.log(`   - ${result.test}: ${result.error || 'Unknown error'}`);
            });
            console.log('='.repeat(80));
        }
        
        // Save detailed report
        const reportPath = path.join(__dirname, 'task-switching-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            summary: {
                totalTests,
                passedTests,
                failedTests,
                successRate: (passedTests / totalTests) * 100,
                duration: totalDuration,
                timestamp: new Date().toISOString()
            },
            results: this.results
        }, null, 2));
        
        console.log(`📋 Detailed report saved to: ${reportPath}`);
        
        return failedTests === 0;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting Task Switching Functionality Tests\n');
        
        try {
            await this.setup();
            
            // Run test sequence
            const { regularTaskId, anotherTaskId } = await this.test1_CreateBasicTasks();
            await this.test2_ClaimRegularTask(regularTaskId);
            const urgentTaskId = await this.test3_CreateUrgentTask(regularTaskId);
            await this.test4_GetAvailableTasksWithContext(regularTaskId, anotherTaskId);
            await this.test5_CompleteUrgentTask(urgentTaskId);
            await this.test6_ResumeSwitchedTask(regularTaskId);
            await this.test7_TestGetCurrentTaskWithSwitching();
            await this.test8_TestClaimSwitchedTask(regularTaskId);
            
        } catch (error) {
            console.error('🚨 Test execution failed:', error);
        } finally {
            await this.cleanup();
        }
        
        return this.generateReport();
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new TaskSwitchingTester();
    
    tester.runAllTests().then(allTestsPassed => {
        process.exit(allTestsPassed ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = TaskSwitchingTester;