/**
 * Debug script for audit task objectivity enforcement
 * Enhanced debugging to see exactly what's happening
 */

const TaskManager = require("./lib/taskManager.js");

async function debugObjectivityEnforcement() {
  const taskManager = new TaskManager("./TODO.json");

  console.log("Debug: Audit Task Objectivity Enforcement...\n");

  try {
    // First create a test audit task with original_implementer set
    console.log("Debug: Creating test audit task...");
    const testAgentId = "development_session_1757785266907_1_general_8560e4a6";

    const testTaskId = await taskManager.createTask({
      title: "Debug Test Objectivity Audit Task",
      description: "Debug test audit task to verify objectivity enforcement",
      category: "audit",
      original_implementer: testAgentId,
    });

    console.log(`Debug: Created test audit task: ${testTaskId}`);

    // Read the task back to see what fields were actually saved
    const todoData = await taskManager.readTodo();
    const createdTask = todoData.tasks.find((t) => t.id === testTaskId);

    console.log("\nDebug: Created task details:");
    console.log("- Task ID:", createdTask.id);
    console.log("- Task category:", createdTask.category);
    console.log("- original_implementer:", createdTask.original_implementer);
    console.log(
      "- audit_metadata:",
      JSON.stringify(createdTask.audit_metadata, null, 2),
    );
    console.log("- Task status:", createdTask.status);
    console.log("- assigned_agent:", createdTask.assigned_agent);

    // Test 1: Try to claim audit task that has same agent as original implementer
    console.log(
      "\nDebug: Attempting to claim audit task with original implementer agent...",
    );
    console.log("- testAgentId:", testAgentId);
    console.log(
      "- task.original_implementer:",
      createdTask.original_implementer,
    );
    console.log("- Match?", testAgentId === createdTask.original_implementer);

    const result = await taskManager.claimTask(
      testTaskId,
      testAgentId,
      "normal",
      { allowOutOfOrder: true }, // Override task order to get to objectivity check
    );

    console.log("\nDebug: Claim result:", JSON.stringify(result, null, 2));

    // Also read task again to see if it was modified
    const todoDataAfter = await taskManager.readTodo();
    const taskAfter = todoDataAfter.tasks.find((t) => t.id === testTaskId);
    console.log("\nDebug: Task after claim attempt:");
    console.log("- Task status:", taskAfter.status);
    console.log("- assigned_agent:", taskAfter.assigned_agent);
    console.log("- claimed_by:", taskAfter.claimed_by);

    if (
      !result.success &&
      result.reason &&
      result.reason.includes("Objectivity violation")
    ) {
      console.log(
        "\n✅ TEST PASSED: Objectivity enforcement is working correctly!",
      );
      console.log(
        "   Agent was blocked from claiming audit task for their own work.",
      );
    } else if (result.success) {
      console.log(
        "\n❌ TEST FAILED: Agent was able to claim audit task for their own work!",
      );
      console.log("   This violates objectivity principles.");
      console.log("   DEBUGGING INFO:");
      console.log(
        "   - The objectivity check should have prevented this claim",
      );
      console.log("   - Check _validateTaskClaiming method for bugs");
    } else {
      console.log(
        "\n⚠️  TEST INCONCLUSIVE: Failed for different reason:",
        result.reason,
      );
    }
  } catch (error) {
    console.error("Error during debug test:", error.message);
    console.error("Stack:", error.stack);
  }

  console.log("\nDebug test completed.");
}

// Run the debug test
debugObjectivityEnforcement();
