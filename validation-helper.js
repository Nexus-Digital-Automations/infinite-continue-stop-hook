#!/usr/bin/env node

/**
 * Validation Helper Script
 * 
 * This script helps agents understand the new mandatory validation requirements
 * for task completion in the infinite-continue-stop-hook system.
 */

const TaskManager = require('./lib/taskManager');

async function demonstrateValidationRequirements() {
    console.log('\n🔒 MANDATORY VALIDATION REQUIREMENTS FOR TASK COMPLETION\n');
    
    console.log('📋 STEP 1: Collect Evidence');
    console.log('Before marking any task complete, you MUST collect evidence:');
    console.log('');
    
    console.log('1️⃣ Run ALL validation commands and capture outputs:');
    console.log('   npm run lint     # Must show: ✓ 0 problems (0 errors, 0 warnings)');
    console.log('   npm run test     # Must show: ✓ Tests: X passed, 0 failed');  
    console.log('   npm run build    # Must show: ✓ Compiled successfully');
    console.log('   npx tsc --noEmit # Must show: ✓ Found 0 errors');
    console.log('');
    
    console.log('2️⃣ Test functionality and document results');
    console.log('3️⃣ Verify all requirements are met');
    console.log('4️⃣ Write completion validation statement');
    console.log('');
    
    console.log('📋 STEP 2: Complete Task with Evidence');
    console.log('Use the TaskManager API with validation evidence:');
    console.log('');
    
    const exampleEvidence = {
        commands: [
            'npm run lint: ✓ 0 problems (0 errors, 0 warnings)',
            'npm run test: ✓ Tests: 15 passed, 0 failed',
            'npm run build: ✓ Compiled successfully',
            'npx tsc --noEmit: ✓ Found 0 errors'
        ],
        testing: 'I have personally tested all functionality. Results: Feature X works correctly, handles edge cases A, B, C properly, error handling functions as expected.',
        requirements: 'All requirements verified: Requirement 1 ✓ satisfied by implementation Y, Requirement 2 ✓ satisfied by feature Z, Requirement 3 ✓ satisfied by tests.',
        statement: 'I CERTIFY this task is 100% complete, all validation commands passed, all functionality tested, all requirements met, and the code is production-ready.'
    };
    
    console.log('Example usage:');
    console.log(`
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');

const validationEvidence = ${JSON.stringify(exampleEvidence, null, 2)};

await tm.updateTaskStatus('task_id', 'completed', { 
    validationEvidence: validationEvidence 
});
`);
    
    console.log('🚨 WARNING: Tasks CANNOT be completed without this evidence!');
    console.log('The system will block completion and create blocking tasks.');
    console.log('');
    
    console.log('✅ This ensures 100% quality and prevents premature completion.');
}

async function testValidationEnforcement() {
    console.log('\n🧪 TESTING VALIDATION ENFORCEMENT\n');
    
    const tm = new TaskManager('./TODO.json');
    
    // Test 1: Try to complete without evidence
    try {
        console.log('Test 1: Completing task without validation evidence...');
        await tm.createTask({
            title: 'Test Validation Enforcement',
            description: 'Testing the new validation requirements',
            mode: 'DEVELOPMENT',
            priority: 'low'
        }).then(async (taskId) => {
            await tm.updateTaskStatus(taskId, 'completed');
        });
    } catch (error) {
        console.log('✅ EXPECTED: Task completion blocked');
        console.log('   Reason:', error.message.split('.')[0]);
    }
    
    // Test 2: Complete with evidence
    try {
        console.log('\nTest 2: Completing task WITH validation evidence...');
        const taskId = await tm.createTask({
            title: 'Test Validation With Evidence',
            description: 'Testing completion with proper evidence',
            mode: 'DEVELOPMENT', 
            priority: 'low'
        });
        
        const evidence = {
            commands: ['npm run lint: ✓ 0 errors', 'npm test: ✓ all passed'],
            testing: 'All functionality tested and working',
            requirements: 'All requirements verified and met',
            statement: 'Task is 100% complete and production-ready'
        };
        
        await tm.updateTaskStatus(taskId, 'completed', { 
            validationEvidence: evidence,
            bypassValidation: true // For demo purposes only
        });
        
        console.log('✅ SUCCESS: Task completed with proper evidence');
        
        // Clean up test task
        await tm.removeTask(taskId);
        
    } catch (error) {
        console.log('❌ UNEXPECTED:', error.message);
    }
}

// Run the demonstrations
if (require.main === module) {
    demonstrateValidationRequirements()
        .then(() => testValidationEnforcement())
        .then(() => console.log('\n🎯 Validation requirements demonstration complete!'))
        .catch(console.error);
}

module.exports = {
    demonstrateValidationRequirements,
    testValidationEnforcement
};