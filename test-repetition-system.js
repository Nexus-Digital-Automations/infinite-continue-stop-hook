#!/usr/bin/env node

/**
 * Test Script for Task Repetition Detection System
 * 
 * This script tests the anti-repetition functionality to ensure it works
 * correctly in detecting stuck tasks and providing appropriate guidance.
 */

const fs = require('fs');
const path = require('path');
const TaskManager = require('./lib/taskManager');

async function runTests() {
    console.log('🧪 Testing Task Repetition Detection System\n');
    
    // Use the existing TODO.json file but backup and restore it
    const todoPath = path.join(__dirname, 'TODO.json');
    const backupPath = path.join(__dirname, 'TODO-backup-test.json');
    
    let originalData = null;
    if (fs.existsSync(todoPath)) {
        originalData = fs.readFileSync(todoPath, 'utf8');
        fs.writeFileSync(backupPath, originalData);
    }
    
    const testData = createTestData();
    
    try {
        // Use the existing TODO.json for testing
        fs.writeFileSync(todoPath, JSON.stringify(testData, null, 2));
        const tm = new TaskManager(todoPath);
        
        // Run tests
        await testBasicTaskAccess(tm);
        await testRepetitionDetection(tm);
        await testStuckTaskGuidance(tm);
        await testStatusChangeTracking(tm);
        await testCleanupFunction(tm);
        await testStatistics(tm);
        
        console.log('✅ All tests passed!\n');
        
        // Show final statistics
        console.log('📊 Final Test Statistics:');
        const stats = await tm.getRepetitionStatistics();
        console.log(`- Tasks with access history: ${stats.tasksWithAccessHistory}`);
        console.log(`- Tasks with interventions: ${stats.tasksWithInterventions}`);
        console.log(`- Total interventions: ${stats.totalInterventions}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    } finally {
        // Restore original TODO.json
        if (originalData) {
            fs.writeFileSync(todoPath, originalData);
        }
        // Cleanup backup
        if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
        }
    }
}

function createTestData() {
    return {
        project: "test_project",
        tasks: [
            {
                id: "test_task_1",
                title: "Test Task for Repetition",
                description: "A task to test repetition detection",
                mode: "DEVELOPMENT",
                priority: "medium",
                status: "in_progress",
                dependencies: [],
                important_files: [],
                success_criteria: ["Complete the test", "Verify functionality"],
                created_at: new Date().toISOString()
            },
            {
                id: "test_task_2",
                title: "Normal Task",
                description: "A normal task that should not trigger repetition",
                mode: "DEVELOPMENT",
                priority: "low",
                status: "pending",
                dependencies: [],
                important_files: [],
                created_at: new Date().toISOString()
            }
        ],
        current_mode: "DEVELOPMENT",
        execution_count: 0,
        agents: {}
    };
}

async function testBasicTaskAccess(tm) {
    console.log('1. Testing basic task access tracking...');
    
    const taskId = "test_task_1";
    const agentId = "test_agent";
    
    // Track a single access
    await tm.trackTaskAccess(taskId, agentId);
    
    const todoData = await tm.readTodo();
    const task = todoData.tasks.find(t => t.id === taskId);
    
    if (!task.access_history || task.access_history.length !== 1) {
        throw new Error('Access tracking failed');
    }
    
    if (task.access_history[0].agentId !== agentId) {
        throw new Error('Agent ID not tracked correctly');
    }
    
    console.log('   ✅ Basic access tracking works');
}

async function testRepetitionDetection(tm) {
    console.log('2. Testing repetition detection...');
    
    const taskId = "test_task_1";
    const agentId = "test_agent";
    
    // Simulate multiple accesses
    for (let i = 0; i < 4; i++) {
        await tm.trackTaskAccess(taskId, agentId);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const repetitionCheck = await tm.checkTaskRepetition(taskId, agentId);
    
    if (!repetitionCheck.isStuck) {
        throw new Error('Repetition not detected when it should be');
    }
    
    if (repetitionCheck.count < 3) {
        throw new Error('Repetition count incorrect');
    }
    
    console.log(`   ✅ Repetition detected (count: ${repetitionCheck.count})`);
}

async function testStuckTaskGuidance(tm) {
    console.log('3. Testing stuck task guidance...');
    
    const agentId = "test_agent";
    
    // First, assign the repetitive task to this agent
    await tm.assignTaskToAgent("test_task_1", agentId, "primary");
    
    const guidance = await tm.getTaskContinuationGuidance(agentId);
    
    if (guidance.action !== 'stuck_task_intervention') {
        throw new Error('Stuck task intervention not triggered');
    }
    
    if (!guidance.instructions.includes('STUCK TASK INTERVENTION')) {
        throw new Error('Intervention instructions not properly generated');
    }
    
    if (guidance.repetitionCount < 3) {
        throw new Error('Repetition count not included in guidance');
    }
    
    console.log('   ✅ Stuck task guidance generated correctly');
}

async function testStatusChangeTracking(tm) {
    console.log('4. Testing status change tracking...');
    
    const taskId = "test_task_2";
    const agentId = "test_agent_2";
    
    // Update task status
    await tm.updateTaskStatus(taskId, 'in_progress', { agentId });
    
    const todoData = await tm.readTodo();
    const task = todoData.tasks.find(t => t.id === taskId);
    
    if (!task.access_history || task.access_history.length === 0) {
        throw new Error('Status change not tracked in access history');
    }
    
    const statusChange = task.access_history.find(h => h.action === 'status_change');
    if (!statusChange) {
        throw new Error('Status change action not recorded');
    }
    
    if (statusChange.details.newStatus !== 'in_progress') {
        throw new Error('New status not recorded correctly');
    }
    
    console.log('   ✅ Status change tracking works');
}

async function testCleanupFunction(tm) {
    console.log('5. Testing cleanup function...');
    
    const result = await tm.cleanupTrackingData(0); // Clean everything
    
    if (typeof result.cleanedRecords !== 'number') {
        throw new Error('Cleanup did not return proper result');
    }
    
    console.log(`   ✅ Cleanup function works (cleaned ${result.cleanedRecords} records)`);
}

async function testStatistics(tm) {
    console.log('6. Testing statistics generation...');
    
    const stats = await tm.getRepetitionStatistics();
    
    if (typeof stats.totalTasks !== 'number') {
        throw new Error('Statistics not generated properly');
    }
    
    if (!Array.isArray(stats.mostAccessedTasks)) {
        throw new Error('Most accessed tasks not returned as array');
    }
    
    if (!Array.isArray(stats.recentInterventions)) {
        throw new Error('Recent interventions not returned as array');
    }
    
    console.log('   ✅ Statistics generation works');
}

// Run tests if called directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };