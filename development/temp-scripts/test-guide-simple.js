/**
 * Simple Guide Integration Test
 *
 * Tests core functionality of guide integration without complex timeout handling.
 * Validates that guide information is properly included in API responses.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Creates a safe file path for test reports within the current directory.
 * Prevents directory traversal attacks by validating and sanitizing the filename.
 * @param {string} baseFilename - The base filename to use (without extension)
 * @param {string} extension - The file extension (e.g., '.json')
 * @returns {string} Safe, absolute file path within the current directory
 */
function createSafeReportPath(baseFilename, extension) {
  // Sanitize the base filename to prevent directory traversal
  const sanitizedBase = baseFilename.replace(/[^a-zA-Z0-9-_]/g, '-');

  // Create a safe filename with timestamp
  const safeFilename = `${sanitizedBase}-${Date.now()}${extension}`;

  // Use path.join to create a safe path within the current directory
  // This prevents directory traversal attacks and ensures the file stays in the intended location
  const safePath = path.join(__dirname, safeFilename);

  // Additional security check: ensure the resolved path is within the current directory
  const resolvedPath = path.resolve(safePath);
  const currentDir = path.resolve(__dirname);

  if (!resolvedPath.startsWith(currentDir)) {
    throw new Error('Security violation: File path outside allowed directory');
  }

  return safePath;
}

function executeCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['taskmanager-api.js', command, ...args], {
      stdio: 'pipe',
      cwd: __dirname,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => (stdout += data.toString()));
    child.stderr.on('data', (data) => (stderr += data.toString()));

    // Set timeout manually
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Command timed out: ${command}`));
    }, 8000); // 8 second timeout

    child.on('close', (code) => {
      clearTimeout(timeout);
      resolve({
        success: code === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code,
      });
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function testGuideIntegration() {
  console.log('🚀 Starting Simple Guide Integration Test\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  // Test 1: Guide command
  try {
    console.log('📋 Testing guide command...');
    const result = await executeCommand('guide');

    if (!result.success) {
      throw new Error(`Guide command failed with code ${result.code}`);
    }

    const parsed = JSON.parse(result.stdout);
    if (
      !parsed.taskClassification ||
      !parsed.coreCommands ||
      !parsed.examples
    ) {
      throw new Error('Guide missing essential components');
    }

    console.log('✅ Guide command: PASSED');
    passed++;
    results.push({ test: 'Guide Command', status: 'PASSED' });
  } catch (error) {
    console.log(`❌ Guide command: FAILED - ${error.message}`);
    failed++;
    results.push({
      test: 'Guide Command',
      status: 'FAILED',
      error: error.message,
    });
  }

  // Test 2: Init command with guide
  try {
    console.log('📋 Testing init command guide integration...');
    const result = await executeCommand('init');

    if (!result.success) {
      throw new Error(`Init command failed: ${result.stderr}`);
    }

    const parsed = JSON.parse(result.stdout);
    if (!parsed.guide || !parsed.guide.taskClassification) {
      throw new Error('Init response missing guide information');
    }

    console.log('✅ Init command guide integration: PASSED');
    passed++;
    results.push({ test: 'Init Command Guide', status: 'PASSED' });
  } catch (error) {
    console.log(`❌ Init command guide integration: FAILED - ${error.message}`);
    failed++;
    results.push({
      test: 'Init Command Guide',
      status: 'FAILED',
      error: error.message,
    });
  }

  // Test 3: Error case with guide
  try {
    console.log('📋 Testing error response guide integration...');
    const result = await executeCommand('create', [
      '{"title": "Missing task_type"}',
    ]);

    if (result.success) {
      throw new Error('Create without task_type should fail');
    }

    const errorParsed = JSON.parse(result.stderr);
    if (!errorParsed.guide || !errorParsed.guide.taskClassification) {
      throw new Error('Error response missing guide information');
    }

    console.log('✅ Error response guide integration: PASSED');
    passed++;
    results.push({ test: 'Error Response Guide', status: 'PASSED' });
  } catch (error) {
    console.log(
      `❌ Error response guide integration: FAILED - ${error.message}`,
    );
    failed++;
    results.push({
      test: 'Error Response Guide',
      status: 'FAILED',
      error: error.message,
    });
  }

  // Test 4: Task creation with guide
  try {
    console.log('📋 Testing task creation with guide...');
    const taskData = {
      title: 'Test Guide Integration',
      description: 'Testing guide integration in task creation',
      task_type: 'test',
    };

    const result = await executeCommand('create', [JSON.stringify(taskData)]);

    if (!result.success) {
      throw new Error(`Task creation failed: ${result.stderr}`);
    }

    const parsed = JSON.parse(result.stdout);
    if (!parsed.guide || !parsed.guide.taskClassification) {
      throw new Error('Task creation response missing guide information');
    }

    console.log('✅ Task creation guide integration: PASSED');
    passed++;
    results.push({ test: 'Task Creation Guide', status: 'PASSED' });

    // Clean up the test task
    if (parsed.taskId) {
      try {
        await executeCommand('delete', [parsed.taskId]);
        console.log('🧹 Cleaned up test task');
      } catch (cleanupError) {
        console.warn(
          `Warning: Failed to cleanup test task: ${cleanupError.message}`,
        );
      }
    }
  } catch (error) {
    console.log(
      `❌ Task creation guide integration: FAILED - ${error.message}`,
    );
    failed++;
    results.push({
      test: 'Task Creation Guide',
      status: 'FAILED',
      error: error.message,
    });
  }

  // Test 5: Performance test
  try {
    console.log('📋 Testing guide performance...');
    const times = [];

    // Use Promise.all to run performance tests concurrently instead of await in loop
    const performancePromises = Array.from({ length: 3 }, (_, i) =>
      (async () => {
        const start = Date.now();
        const result = await executeCommand('guide');
        const duration = Date.now() - start;

        if (!result.success) {
          throw new Error(`Performance test iteration ${i + 1} failed`);
        }

        return duration;
      })(),
    );

    const concurrentTimes = await Promise.all(performancePromises);
    times.push(...concurrentTimes);

    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    if (avgTime > 5000) {
      // 5 second threshold
      throw new Error(`Guide generation too slow: ${avgTime}ms average`);
    }

    console.log(`✅ Guide performance: PASSED (avg: ${Math.round(avgTime)}ms)`);
    passed++;
    results.push({
      test: 'Guide Performance',
      status: 'PASSED',
      avgTime: Math.round(avgTime),
      times: times,
    });
  } catch (error) {
    console.log(`❌ Guide performance: FAILED - ${error.message}`);
    failed++;
    results.push({
      test: 'Guide Performance',
      status: 'FAILED',
      error: error.message,
    });
  }

  // Summary
  console.log('\n📋 TEST SUMMARY');
  console.log('═'.repeat(50));
  console.log(`✅ Tests Passed: ${passed}`);
  console.log(`❌ Tests Failed: ${failed}`);
  console.log(
    `📊 Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`,
  );

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results
      .filter((r) => r.status === 'FAILED')
      .forEach((r) => {
        console.log(`• ${r.test}: ${r.error}`);
      });
  }

  // Save results using secure file path construction
  // This prevents security vulnerabilities from dynamic file path construction
  const reportPath = createSafeReportPath('guide-test-report', '.json');
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        passed,
        failed,
        total: passed + failed,
        passRate: ((passed / (passed + failed)) * 100).toFixed(1) + '%',
        results,
      },
      null,
      2,
    ),
  );

  console.log(`\n📄 Report saved to: ${reportPath}`);

  if (failed === 0) {
    console.log(
      '\n🎉 ALL TESTS PASSED! Guide integration is working correctly.',
    );
    process.exit(0);
  } else {
    console.log('\n🚨 SOME TESTS FAILED. Review and fix issues.');
    process.exit(1);
  }
}

// Run tests
testGuideIntegration().catch((error) => {
  console.error('\n💥 FATAL ERROR:', error.message);
  process.exit(2);
});
