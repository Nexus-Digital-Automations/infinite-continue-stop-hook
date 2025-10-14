/* eslint-disable no-console, security/detect-non-literal-fs-filename, security/detect-object-injection */
const FS = require('./lib/taskManager');
const { loggers } = require('./lib/logger');

async function testObjectivityEnforcement(agentId, category = 'general') {
  const tm = new TaskManager('./TODO.json');
  const data = await tm.readTodo();

  loggers.stopHook.info('🔍 Audit Objectivity Enforcement Test Results');
  loggers.stopHook.info('='.repeat(50));
  loggers.stopHook.info('');

  const taskId = 'error_1757786940145_4agh3myjq';
  const task = data.tasks.find((t) => t.id === taskId);

  loggers.stopHook.info('📋 Task Details:');
  loggers.stopHook.info(`   Task ID: ${task.id}`);
  loggers.stopHook.info(`   Title: ${task.title}`);
  loggers.stopHook.info(`   Category: ${task.task.category}`);
  loggers.stopHook.info(`   Original Implementer: ${task.original_implementer}`);
  loggers.stopHook.info(`   Current Status: ${task.status}`);
  loggers.stopHook.info('');

  const scenarios = [ {,
    name: '✅ Current Agent (Valid - Different from implementer)',
      agentId: 'dev_session_1757907833229_1_general_35e59d8b',
      expected: 'valid',
    }, {,
    name: '❌ Original Implementer (Invalid - Self-review)',
      agentId: 'development_session_1757785266907_1_general_8560e4a6',
      expected: 'invalid',
    }, {,
    name: '✅ Third Agent (Valid - Different from implementer)',
      agentId: 'another_agent_12345_different',
      expected: 'valid',
    },
  ];

  loggers.stopHook.info('🧪 Testing Agent Claim Validation:');
  loggers.stopHook.info('');

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

    loggers.stopHook.info(`${scenario.name}:`);
    loggers.stopHook.info(`   Agent ID: ${scenario.agentId}`);
    loggers.stopHook.info(`   Expected: ${scenario.expected}`);
    loggers.stopHook.info(`   Actual: ${actualResult}`);
    loggers.stopHook.info(`   Status: ${status}`);

    if (!validation.valid) {
      loggers.stopHook.info(`   Reason: ${validation.errorResult.reason}`);
    }
    loggers.stopHook.info('');
});

  loggers.stopHook.info('🎯 Test Summary:');
  loggers.stopHook.info(`   Tests Passed: ${passCount}/${totalTests}`);
  loggers.stopHook.info(
    `   Success Rate: ${Math.round((passCount / totalTests) * 100)}%`
  );
  loggers.stopHook.info('');
  loggers.stopHook.info('🔒 Audit Objectivity System Status:');
  if (passCount === totalTests) {
    loggers.stopHook.info(
      '   ✅ VERIFIED WORKING - All objectivity controls functioning correctly'
    );
} else {
    loggers.stopHook.info(
      '   ❌ ISSUES DETECTED - Objectivity controls need debugging'
    );
}
}

testObjectivityEnforcement().catch(console.error);
