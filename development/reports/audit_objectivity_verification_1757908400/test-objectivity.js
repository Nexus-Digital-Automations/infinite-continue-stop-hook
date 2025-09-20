const _TaskManager = require("./lib/taskManager");

async function testObjectivityEnforcement() {
  const tm = new TaskManager("./TODO.json");
  const data = await tm.readTodo();
  
  console.log("🔍 Audit Objectivity Enforcement Test Results");
  console.log("=".repeat(50));
  console.log("");
  
  const taskId = "error_1757786940145_4agh3myjq";
  const task = data.tasks.find(t => t.id === taskId);
  
  console.log("📋 Task Details:");
  console.log(`   Task ID: ${task.id}`);
  console.log(`   Title: ${task.title}`);
  console.log(`   Category: ${task.category}`);
  console.log(`   Original Implementer: ${task.original_implementer}`);
  console.log(`   Current Status: ${task.status}`);
  console.log("");
  
  const scenarios = [
    {
      name: "✅ Current Agent (Valid - Different from implementer)",
      agentId: "dev_session_1757907833229_1_general_35e59d8b",
      expected: "valid"
    },
    {
      name: "❌ Original Implementer (Invalid - Self-review)",
      agentId: "development_session_1757785266907_1_general_8560e4a6",
      expected: "invalid"
    },
    {
      name: "✅ Third Agent (Valid - Different from implementer)",
      agentId: "another_agent_12345_different",
      expected: "valid"
    }
  ];
  
  console.log("🧪 Testing Agent Claim Validation:");
  console.log("");
  
  let passCount = 0;
  let totalTests = 0;
  
  scenarios.forEach(scenario => {
    const validation = tm._validateTaskClaiming(taskId, data, {}, scenario.agentId);
    const actualResult = validation.valid ? "valid" : "invalid";
    const status = actualResult === scenario.expected ? "✅ PASS" : "❌ FAIL";
    
    if (actualResult === scenario.expected) passCount++;
    totalTests++;
    
    console.log(`${scenario.name}:`);
    console.log(`   Agent ID: ${scenario.agentId}`);
    console.log(`   Expected: ${scenario.expected}`);
    console.log(`   Actual: ${actualResult}`);
    console.log(`   Status: ${status}`);
    
    if (!validation.valid) {
      console.log(`   Reason: ${validation.errorResult.reason}`);
    }
    console.log("");
  });
  
  console.log("🎯 Test Summary:");
  console.log(`   Tests Passed: ${passCount}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((passCount/totalTests)*100)}%`);
  console.log("");
  console.log("🔒 Audit Objectivity System Status:");
  if (passCount === totalTests) {
    console.log("   ✅ VERIFIED WORKING - All objectivity controls functioning correctly");
  } else {
    console.log("   ❌ ISSUES DETECTED - Objectivity controls need debugging");
  }
}

testObjectivityEnforcement().catch(console.error);
