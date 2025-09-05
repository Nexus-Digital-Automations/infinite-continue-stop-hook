#!/usr/bin/env node

/**
 * Test Intelligent Phase Insertion Functionality
 * 
 * This script tests the intelligent phase insertion capabilities of the TaskManager API.
 * It creates a minimal phase-based TODO.json and tests:
 * 1. Phase insertion analysis
 * 2. Automatic task renumbering
 * 3. Phase sorting verification
 */

const fs = require('fs');
const path = require('path');
const TaskManager = require('./lib/taskManager');

async function testPhaseInsertion() {
    console.log('🧪 Testing Intelligent Phase Insertion Functionality');
    console.log('=' .repeat(60));
    
    // Backup original TODO.json and work with test data
    const originalTodoPath = path.join(__dirname, 'TODO.json');
    const backupPath = path.join(__dirname, 'TODO-backup-phase-test.json');
    
    // Backup original
    if (fs.existsSync(originalTodoPath)) {
        fs.copyFileSync(originalTodoPath, backupPath);
    }
    const testData = {
        project: "Phase Insertion Test",
        tasks: [
            {
                id: "task_test_1",
                title: "Phase 1: Foundation setup",
                description: "Set up the basic project structure",
                mode: "DEVELOPMENT",
                category: "missing-feature",
                priority: "high",
                status: "pending",
                dependencies: [],
                important_files: [],
                success_criteria: [],
                requires_research: false,
                created_at: new Date().toISOString(),
                phase: { major: 1, minor: 0, patch: 0 }
            },
            {
                id: "task_test_2", 
                title: "Phase 2: Core implementation",
                description: "Implement the core functionality",
                mode: "DEVELOPMENT",
                category: "missing-feature", 
                priority: "high",
                status: "pending",
                dependencies: ["task_test_1"],
                important_files: [],
                success_criteria: [],
                requires_research: false,
                created_at: new Date().toISOString(),
                phase: { major: 2, minor: 0, patch: 0 }
            },
            {
                id: "task_test_3",
                title: "Phase 3: Advanced features",
                description: "Add advanced functionality",
                mode: "DEVELOPMENT",
                category: "missing-feature",
                priority: "medium",
                status: "pending", 
                dependencies: ["task_test_2"],
                important_files: [],
                success_criteria: [],
                requires_research: false,
                created_at: new Date().toISOString(),
                phase: { major: 3, minor: 0, patch: 0 }
            },
            {
                id: "task_test_4",
                title: "Phase 3.1: Sub-feature implementation",
                description: "Implement sub-features for phase 3",
                mode: "DEVELOPMENT",
                category: "missing-feature",
                priority: "medium",
                status: "pending",
                dependencies: ["task_test_3"],
                important_files: [],
                success_criteria: [],
                requires_research: false,
                created_at: new Date().toISOString(),
                phase: { major: 3, minor: 1, patch: 0 }
            }
        ],
        current_mode: "DEVELOPMENT",
        last_mode: null,
        execution_count: 0,
        review_strikes: 0,
        strikes_completed_last_run: false,
        last_hook_activation: Date.now(),
        agents: {}
    };
    
    // Write test data to TODO.json
    fs.writeFileSync(originalTodoPath, JSON.stringify(testData, null, 2));
    console.log('✅ Created test TODO.json with phase-based tasks');
    
    // Initialize TaskManager with TODO.json
    const taskManager = new TaskManager(originalTodoPath);
    
    console.log('\n📋 Original tasks:');
    testData.tasks.forEach(task => {
        console.log(`  - ${task.title}`);
    });
    
    // Test 1: Analyze phase insertion for Phase 3 (which should cause renumbering)
    console.log('\n🔍 Test 1: Analyzing Phase 3 insertion...');
    const newTask1 = {
        title: "Phase 3: New priority feature",
        description: "Add a new high-priority feature that should push existing Phase 3 to Phase 4",
        mode: "DEVELOPMENT",
        category: "missing-feature"
    };
    
    const analysis1 = await taskManager.performIntelligentPhaseInsertion(newTask1, false);
    console.log(`   Analysis result: ${analysis1.message}`);
    if (analysis1.needsRenumbering) {
        console.log(`   Tasks to renumber: ${analysis1.renumberingNeeded?.length || 0}`);
        analysis1.renumberingNeeded?.forEach(item => {
            console.log(`     - ${item.task.title} → Phase ${item.newPhase.major}.${item.newPhase.minor}`);
        });
    }
    
    // Test 2: Actually perform phase insertion for Phase 3
    console.log('\n⚡ Test 2: Performing Phase 3 insertion with auto-renumbering...');
    await taskManager.performIntelligentPhaseInsertion(newTask1, true);
    
    // Verify renumbering
    const updatedData = await taskManager.readTodoFast();
    console.log('\n✅ Updated tasks after Phase 2.5 insertion:');
    updatedData.tasks
        .filter(t => t.phase)
        .sort((a, b) => taskManager._comparePhases(a.phase, b.phase))
        .forEach(task => {
            console.log(`  - ${task.title}`);
        });
    
    // Test 3: Add the new Phase 3 task (skip auto phase insertion since we already did it)
    console.log('\n➕ Test 3: Adding the new Phase 3 task...');
    newTask1.skip_phase_insertion = true; // Skip automatic phase insertion since we already did it
    const newTaskId = await taskManager.createTask(newTask1);
    console.log(`   Created task: ${newTaskId}`);
    
    // Final verification - show all tasks in phase order
    const finalData = await taskManager.readTodoFast();
    console.log('\n🎯 Final task list in phase order:');
    finalData.tasks
        .filter(t => t.phase)
        .sort((a, b) => taskManager._comparePhases(a.phase, b.phase))
        .forEach((task, index) => {
            const phaseStr = `${task.phase.major}.${task.phase.minor}.${task.phase.patch}`;
            console.log(`  ${index + 1}. Phase ${phaseStr}: ${task.title.replace(/^Phase \d+(\.\d+)*:\s*/, '')}`);
        });
    
    console.log('\n🧪 Test completed successfully!');
    console.log('=' .repeat(60));
    
    // Restore original TODO.json
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, originalTodoPath);
        fs.unlinkSync(backupPath);
        console.log('🧹 Restored original TODO.json');
    }
}

// Run the test
testPhaseInsertion().catch(error => {
    console.error('❌ Test failed:', error);
    
    // Cleanup in case of error
    const originalTodoPath = path.join(__dirname, 'TODO.json');
    const backupPath = path.join(__dirname, 'TODO-backup-phase-test.json');
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, originalTodoPath);
        fs.unlinkSync(backupPath);
        console.log('🧹 Restored original TODO.json after error');
    }
    
    process.exit(1);
});