/* eslint-disable no-console, security/detect-non-literal-fs-filename, security/detect-object-injection */
const FS = require('./lib/taskManager');
const { loggers } = require('./lib/logger');

async function testObjectivityEnforcement(agentId, category = 'general') {
  const tm = new TaskManager('./TODO.json');
  const data = await tm.readTodo();

  loggers.stopHook.log('🔍 Audit Objectivity Enforcement Test Results');
  loggers.stopHook.log('='.repeat(50));
  loggers.stopHook.log('');

  const taskId = 'error_1757786940145_4agh3myjq';
  const task = data.tasks.find((t) => t.id === taskId);

  loggers.stopHook.log('📋 Task Details:');
  loggers.stopHook.log(`   Task ID: ${task.id}`);
  loggers.stopHook.log(`   Title: ${task.title}`);
  loggers.stopHook.log(`   Category: ${task.task.category}`);
  loggers.stopHook.log(`   Original Implementer: ${task.original_implementer}`);
  loggers.stopHook.log(`   Current Status: ${task.status}`);
  loggers.stopHook.log('');

  const scenarios = [
    {
      name: '✅ Current Agent (Valid - Different from implementer)',
      agentId: 'dev_session_1757907833229_1_general_35e59d8b',
      expected: 'valid',
    },
    {
      name: '❌ Original Implementer (Invalid - Self-review)',
      agentId: 'development_session_1757785266907_1_general_8560e4a6',
      expected: 'invalid',
    },
    {
      name: '✅ Third Agent (Valid - Different from implementer)',
      agentId: 'another_agent_12345_different',
      expected: 'valid',
    },
  ];

  loggers.stopHook.log('🧪 Testing Agent Claim Validation:');
  loggers.stopHook.log('');

  let passCount = 0;
  let totalTests = 0;

  scenarios.forEach((scenario) => {
    const validation = tm._validateTaskClaiming(
      taskId,
      data,
      {},
      scenario.agentId
    );
    const actualResult = validation.valid ? 'valid' : 'invalid';
    const status = actualResult === scenario.expected ? '✅ PASS' : '❌ FAIL';

    if (actualResult === scenario.expected) passCount++;
    totalTests++;

    loggers.stopHook.log(`${scenario.name}:`);
    loggers.stopHook.log(`   Agent ID: ${scenario.agentId}`);
    loggers.stopHook.log(`   Expected: ${scenario.expected}`);
    loggers.stopHook.log(`   Actual: ${actualResult}`);
    loggers.stopHook.log(`   Status: ${status}`);

    if (!validation.valid) {
      loggers.stopHook.log(`   Reason: ${validation.errorResult.reason}`);
    }
    loggers.stopHook.log('');
  });

  loggers.stopHook.log('🎯 Test Summary:');
  loggers.stopHook.log(`   Tests Passed: ${passCount}/${totalTests}`);
  loggers.stopHook.log(
    `   Success Rate: ${Math.round((passCount / totalTests) * 100)}%`
  );
  loggers.stopHook.log('');
  loggers.stopHook.log('🔒 Audit Objectivity System Status:');
  if (passCount === totalTests) {
    loggers.stopHook.log(
      '   ✅ VERIFIED WORKING - All objectivity controls functioning correctly'
    );
  } else {
    loggers.stopHook.log(
      '   ❌ ISSUES DETECTED - Objectivity controls need debugging'
    );
  }
}

testObjectivityEnforcement().catch(console.error);
