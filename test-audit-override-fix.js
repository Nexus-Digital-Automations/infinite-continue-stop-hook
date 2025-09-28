/**
 * Test for the audit task override bug fix
 * This test verifies That agents can now override audit tasks to work on other tasks
 * when using the allowOutOfOrder: true option.
 */

const TASK_MANAGER = require('./lib/taskManager');

/**
 * Test logger to replace console statements
 */
class TestLogger {
  static log(message) {
    process.stdout.write(message + '\n');
  }

  static error(message) {
    process.stderr.write(message + '\n');
  }
}

async function testAuditOverrideFix() {
  TestLogger.log('🧪 Testing audit task override fix...');

  const tm = new TASK_MANAGER('./TODO.json');

  try {
    // Initialize a test agent
    const agentId = 'test_audit_override_agent_123';

    // Create a simple feature task
    const featureResult = await tm.createTask({
      title: 'Test Feature Task',
      description: 'A simple test feature',
      category: 'feature',
    });

    if (!featureResult.success) {
      TestLogger.error(
        '❌ Failed to create feature task: ' + featureResult.reason
      );
      return false;
    }

    const featureId = featureResult.taskId;
    TestLogger.log('✅ Created feature task: ' + featureId);

    // Create an audit task with the same agent as original implementer
    const auditResult = await tm.createTask({
      title: 'AUDIT: Test Feature Task',
      description: 'Audit the test feature task',
      category: 'audit',
      original_implementer: agentId,
    });

    if (!auditResult.success) {
      TestLogger.error('❌ Failed to create audit task: ' + auditResult.reason);
      return false;
    }

    const auditId = auditResult.taskId;
    TestLogger.log('✅ Created audit task: ' + auditId);

    TestLogger.log('🔒 Testing objectivity enforcement...');

    // Test 1: Try to claim audit task normally (should fail due to objectivity)
    const claimAttempt1 = await tm.claimTask(auditId, agentId, 'normal');

    if (claimAttempt1.success) {
      TestLogger.error(
        '❌ BUG: Agent was able to claim their own audit task without override!'
      );
      return false;
    } else {
      TestLogger.log(
        '✅ Objectivity enforcement working - agent cannot claim own audit task normally'
      );
      TestLogger.log('   Reason: ' + claimAttempt1.reason);
    }

    TestLogger.log('🚀 Testing audit task override...');

    // Test 2: Try to claim audit task with allowOutOfOrder: true (should succeed)
    const claimAttempt2 = await tm.claimTask(auditId, agentId, 'normal', {
      allowOutOfOrder: true,
    });

    if (!claimAttempt2.success) {
      TestLogger.error(
        '❌ FAILED: Agent cannot override audit task even with allowOutOfOrder: true'
      );
      TestLogger.error('   Reason: ' + claimAttempt2.reason);
      return false;
    } else {
      TestLogger.log(
        '✅ SUCCESS: Agent can now override audit task with allowOutOfOrder: true'
      );
      TestLogger.log(
        '   This allows agents to move on to other work when needed'
      );
    }

    // Clean up - complete the task
    await tm.updateTaskStatus(
      auditId,
      'completed',
      'Test completed successfully'
    );

    TestLogger.log(
      '🎉 All tests passed! The audit task override bug is fixed.'
    );
    return true;
  } catch (error) {
    TestLogger.error('❌ Test failed with error: ' + error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testAuditOverrideFix()
    .then((success) => {
      if (!success) {
        throw new Error('Audit override fix test failed');
      }
    })
    .catch((error) => {
      TestLogger.error('Test crashed: ' + error);
      throw error;
    });
}

module.exports = { testAuditOverrideFix };
