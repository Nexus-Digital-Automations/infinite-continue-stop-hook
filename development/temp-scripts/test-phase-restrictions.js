/**
 * Test script to validate phase parameter restrictions
 *
 * This tests the implementation of:
 * - Phase parameters only allowed for feature tasks
 * - Validation in create endpoint
 * - Validation in analyze-phase-insertion endpoint
 */

const { spawn } = require('child_process');
const path = require('path');

const API_PATH = path.join(__dirname, 'taskmanager-api.js');

function execAPI(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [API_PATH, command, ...args], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (_data) => {
      /* Ignore stderr for this test */
    });

    child.on('close', (_code) => {
      try {
        // Extract JSON from stdout (ignore logging)
        const lines = stdout.split('\n');
        let jsonString = '';

        // Find the line that starts with { and contains the complete JSON
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            jsonString = line.trim();
            break;
          }
        }

        // If no single line JSON found, try to find JSON block
        if (!jsonString) {
          const jsonStart = stdout.indexOf('{');
          const jsonEnd = stdout.lastIndexOf('}');
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            jsonString = stdout.substring(jsonStart, jsonEnd + 1);
          }
        }

        if (jsonString) {
          const result = JSON.parse(jsonString);
          resolve(result);
        } else {
          reject(new Error(`No JSON output found. Full output: ${stdout}`));
        }
      } catch (parseError) {
        reject(
          new Error(`Parse error: ${parseError.message}. Output: ${stdout}`),
        );
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runTests() {
  // Test suite: Phase Parameter Restrictions

  const tests = [
    {
      name: 'Create error task with phase (should be rejected)',
      command: 'create',
      args: [
        JSON.stringify({
          title: 'Test Error Task',
          description: 'Test',
          task_type: 'error',
          phase: { major: 1, minor: 1 },
        }),
      ],
      expectSuccess: false,
    },
    {
      name: 'Create subtask with phase (should be rejected)',
      command: 'create',
      args: [
        JSON.stringify({
          title: 'Test Subtask',
          description: 'Test',
          task_type: 'subtask',
          phase: { major: 1, minor: 1 },
        }),
      ],
      expectSuccess: false,
    },
    {
      name: 'Create test task with phase (should be rejected)',
      command: 'create',
      args: [
        JSON.stringify({
          title: 'Test Task',
          description: 'Test',
          task_type: 'test',
          phase: { major: 1, minor: 1 },
        }),
      ],
      expectSuccess: false,
    },
    {
      name: 'Create feature task with phase (should succeed)',
      command: 'create',
      args: [
        JSON.stringify({
          title: 'Test Feature Task',
          description: 'Test feature',
          task_type: 'feature',
          phase: { major: 1, minor: 1 },
        }),
      ],
      expectSuccess: true,
    },
    {
      name: 'Phase analysis for error task (should be rejected)',
      command: 'analyze-phase-insertion',
      args: [
        JSON.stringify({
          title: 'Test Error Phase',
          description: 'Test',
          task_type: 'error',
          phase: { major: 1, minor: 1 },
        }),
      ],
      expectSuccess: false,
    },
    {
      name: 'Phase analysis for feature task (should succeed)',
      command: 'analyze-phase-insertion',
      args: [
        JSON.stringify({
          title: 'Test Feature Phase',
          description: 'Test',
          task_type: 'feature',
          phase: { major: 2, minor: 1 },
        }),
      ],
      expectSuccess: true,
    },
  ];

  let passed = 0;
  let failed = 0;

  // Use Promise.allSettled to avoid await in loop
  const testResults = await Promise.allSettled(
    tests.map(async (test) => {
      try {
        const result = await execAPI(test.command, test.args);
        return {
          name: test.name,
          success: result.success === test.expectSuccess,
          expectedSuccess: test.expectSuccess,
          actualSuccess: result.success,
          error: result.error || null,
        };
      } catch (error) {
        return {
          name: test.name,
          success: false,
          expectedSuccess: test.expectSuccess,
          actualSuccess: null,
          error: error.message,
        };
      }
    }),
  );

  // Process results and count passed/failed
  for (const testResult of testResults) {
    if (testResult.status === 'fulfilled' && testResult.value.success) {
      passed++;
    } else {
      failed++;
    }
  }

  // Output test results summary
  const total = passed + failed;
  const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  console.log(`Test Results Summary:`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${successRate}%`);

  if (failed === 0) {
    console.log(
      'All tests passed! Phase parameter restrictions are working correctly.',
    );
    return true;
  } else {
    console.log(
      'Some tests failed. Phase parameter restrictions may need additional work.',
    );
    return false;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    // Test execution failed with error
    throw error;
  });
}

module.exports = { runTests };
