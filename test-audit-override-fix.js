/**
 * Test for the audit task override bug fix
 * This test verifies that agents can now override audit tasks to work on other tasks
 * when using the allowOutOfOrder: true option.
 */

const TaskManagerAPI = require("./taskmanager-api");

async function testAuditOverrideFix() {
  console.log("🧪 Testing audit task override fix...");

  const tm = new TaskManager("./TODO.json");

  try {
    // Initialize a test agent
    const agentId = "test_audit_override_agent_123";

    // Create a simple feature task
    const featureResult = await tm.createTask({
      title: "Test Feature Task",
      description: "A simple test feature",
      category: "feature",
    });

    if (!featureResult.success) {
      console.error("❌ Failed to create feature task:", featureResult.reason);
      return false;
    }

    const featureId = featureResult.taskId;
    console.log("✅ Created feature task:", featureId);

    // Create an audit task with the same agent as original implementer
    const auditResult = await tm.createTask({
      title: "AUDIT: Test Feature Task",
      description: "Audit the test feature task",
      category: "audit",
      original_implementer: agentId,
    });

    if (!auditResult.success) {
      console.error("❌ Failed to create audit task:", auditResult.reason);
      return false;
    }

    const auditId = auditResult.taskId;
    console.log("✅ Created audit task:", auditId);

    console.log("🔒 Testing objectivity enforcement...");

    // Test 1: Try to claim audit task normally (should fail due to objectivity)
    const claimAttempt1 = await tm.claimTask(auditId, agentId, "normal");

    if (claimAttempt1.success) {
      console.error(
        "❌ BUG: Agent was able to claim their own audit task without override!",
      );
      return false;
    } else {
      console.log(
        "✅ Objectivity enforcement working - agent cannot claim own audit task normally",
      );
      console.log("   Reason:", claimAttempt1.reason);
    }

    console.log("🚀 Testing audit task override...");

    // Test 2: Try to claim audit task with allowOutOfOrder: true (should succeed)
    const claimAttempt2 = await tm.claimTask(auditId, agentId, "normal", {
      allowOutOfOrder: true,
    });

    if (!claimAttempt2.success) {
      console.error(
        "❌ FAILED: Agent cannot override audit task even with allowOutOfOrder: true",
      );
      console.error("   Reason:", claimAttempt2.reason);
      return false;
    } else {
      console.log(
        "✅ SUCCESS: Agent can now override audit task with allowOutOfOrder: true",
      );
      console.log("   This allows agents to move on to other work when needed");
    }

    // Clean up - complete the task
    await tm.updateTaskStatus(
      auditId,
      "completed",
      "Test completed successfully",
    );

    console.log("🎉 All tests passed! The audit task override bug is fixed.");
    return true;
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testAuditOverrideFix()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test crashed:", error);
      process.exit(1);
    });
}

module.exports = { testAuditOverrideFix };
