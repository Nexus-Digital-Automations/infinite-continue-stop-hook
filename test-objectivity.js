/**
 * Test script for audit task objectivity enforcement
 * Tests that agents cannot claim audit tasks for their own work
 */

const TaskManager = require('./lib/taskManager.js');

async function testObjectivityEnforcement() {
  const taskManager = new TaskManager('./TODO.json');

  console.log('Testing Audit Task Objectivity Enforcement...\n');

  try {
    // First create a test audit task with original_implementer set
    console.log('Creating test audit task...');
    const testAgentId = 'development_session_1757785266907_1_general_8560e4a6';

    const testTaskId = await taskManager.createTask({
      title: 'Test Objectivity Audit Task',
      description: 'Test audit task to verify objectivity enforcement',
      category: 'audit',
      original_implementer: testAgentId,
    });

    console.log(`Created test audit task: ${testTaskId}`);

    // Test 1: Try to claim audit task that has same agent as original implementer
    console.log(
      '\nTest 1: Attempting to claim audit task with original implementer agent...',
    );

    const result = await taskManager.claimTask(
      testTaskId,
      testAgentId,
      'normal',
      { allowOutOfOrder: true }, // Override task order to get to objectivity check
    );

    console.log('Result:', JSON.stringify(result, null, 2));

    if (
      !result.success &&
      result.reason &&
      result.reason.includes('Objectivity violation')
    ) {
      console.log(
        '✅ TEST PASSED: Objectivity enforcement is working correctly!',
      );
      console.log(
        '   Agent was blocked from claiming audit task for their own work.',
      );
    } else if (result.success) {
      console.log(
        '❌ TEST FAILED: Agent was able to claim audit task for their own work!',
      );
      console.log('   This violates objectivity principles.');
    } else {
      console.log(
        '⚠️  TEST INCONCLUSIVE: Failed for different reason:',
        result.reason,
      );
    }
  } catch (error) {
    console.error('Error during test:', error.message);
  }

  console.log('\nObjectivity test completed.');
}

// Run the test
testObjectivityEnforcement();
