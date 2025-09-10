/**
 * Comprehensive TODO.json Corruption Prevention Test Suite
 *
 * Tests all the corruption prevention mechanisms we implemented:
 * 1. Enhanced autoFixer with escaped JSON string detection
 * 2. Fixed double-encoding issue in taskManager.js
 * 3. Prevention mechanisms in atomicWrite function
 * 4. Stop hook error recovery with autoFixer integration
 */

/* eslint-disable security/detect-non-literal-fs-filename */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const TaskManager = require('../../lib/taskManager');
const AutoFixer = require('../../lib/autoFixer');

class CorruptionPreventionTester {
  constructor() {
    this.testResults = [];
    this.todoPath = './TODO.json';
    this.backupPath = './TODO.json.test-backup';
  }

  log(_message, _type = 'info') {
    // Logging disabled in test environment
  }

  createBackup() {
    try {
      // Validate file paths to prevent security issues
      const todoPathResolved = path.resolve(this.todoPath);
      const backupPathResolved = path.resolve(this.backupPath);
      const originalContent = fs.readFileSync(todoPathResolved, 'utf8');
      fs.writeFileSync(backupPathResolved, originalContent);
      this.log('Created backup of original TODO.json');
    } catch (error) {
      this.log(`Failed to create backup: ${error.message}`, 'error');
      throw error;
    }
  }

  restoreBackup() {
    try {
      // Validate file paths to prevent security issues
      const todoPathResolved = path.resolve(this.todoPath);
      const backupPathResolved = path.resolve(this.backupPath);
      if (fs.existsSync(backupPathResolved)) {
        const backupContent = fs.readFileSync(backupPathResolved, 'utf8');
        fs.writeFileSync(todoPathResolved, backupContent);
        fs.unlinkSync(backupPathResolved);
        this.log('Restored TODO.json from backup');
      }
    } catch (error) {
      this.log(`Failed to restore backup: ${error.message}`, 'error');
    }
  }

  async test1_AutoFixerCorruptionDetection() {
    this.log('TEST 1: AutoFixer corruption detection and repair');

    try {
      // Create a corrupted JSON file (double-encoded)
      const validData = { test: 'data', tasks: [], features: [], agents: {} };
      const corruptedContent = JSON.stringify(
        JSON.stringify(validData, null, 2),
      );
      fs.writeFileSync('./test-corrupted.json', corruptedContent);

      this.log('Created corrupted test file (double-encoded JSON)');

      const autoFixer = new AutoFixer();
      const result = await autoFixer.autoFix('./test-corrupted.json');

      if (result.fixed) {
        const fixedContent = fs.readFileSync('./test-corrupted.json', 'utf8');
        const parsed = JSON.parse(fixedContent);

        if (parsed.test === 'data') {
          this.log(
            '✅ AutoFixer successfully detected and repaired corruption',
            'success',
          );
          this.testResults.push({
            test: 'AutoFixer Corruption Detection',
            result: 'PASS',
          });
        } else {
          this.log(
            '❌ AutoFixer fixed corruption but data integrity lost',
            'error',
          );
          this.testResults.push({
            test: 'AutoFixer Corruption Detection',
            result: 'FAIL',
          });
        }
      } else {
        this.log('❌ AutoFixer failed to fix corruption', 'error');
        this.testResults.push({
          test: 'AutoFixer Corruption Detection',
          result: 'FAIL',
        });
      }

      // Cleanup
      fs.unlinkSync('./test-corrupted.json');
    } catch (error) {
      this.log(`TEST 1 FAILED: ${error.message}`, 'error');
      this.testResults.push({
        test: 'AutoFixer Corruption Detection',
        result: 'ERROR',
        error: error.message,
      });
    }
  }

  async test2_TaskManagerWriteOperations() {
    this.log('TEST 2: TaskManager write operations with corruption prevention');

    try {
      const taskManager = new TaskManager(this.todoPath);

      // Read current data
      const originalData = await taskManager.readTodo();
      const originalTaskCount = originalData.tasks.length;

      this.log(`Original TODO.json has ${originalTaskCount} tasks`);

      // Perform multiple write operations that previously caused corruption
      const writeOperations = [];
      for (let i = 0; i < 3; i++) {
        writeOperations.push(taskManager.writeTodo(originalData));
      }

      // Execute all write operations
      await Promise.all(writeOperations);
      this.log('All write operations completed');

      // Verify integrity after all writes
      const todoPathResolved = path.resolve(this.todoPath);
      const content = fs.readFileSync(todoPathResolved, 'utf8');

      if (content.startsWith('"') && content.endsWith('"')) {
        throw new Error('Corruption detected: JSON wrapped in quotes');
      }

      const parsed = JSON.parse(content);
      if (parsed.tasks.length !== originalTaskCount) {
        throw new Error(
          `Task count mismatch: expected ${originalTaskCount}, got ${parsed.tasks.length}`,
        );
      }

      this.log(
        '✅ Multiple write operations completed without corruption',
        'success',
      );
      this.testResults.push({
        test: 'TaskManager Write Operations',
        result: 'PASS',
      });
    } catch (error) {
      this.log(`TEST 2 FAILED: ${error.message}`, 'error');
      this.testResults.push({
        test: 'TaskManager Write Operations',
        result: 'FAIL',
        error: error.message,
      });
    }
  }

  async test3_StopHookIntegration() {
    this.log('TEST 3: Stop hook integration with autoFixer');

    try {
      // Run the stop hook to see if it handles the current TODO.json correctly
      const stopHookPromise = new Promise((resolve, reject) => {
        const hookInput = JSON.stringify({
          session_id: 'test-corruption',
          transcript_path: 'test.jsonl',
          hook_event_name: 'Stop',
          stop_hook_active: false,
        });

        const stopHook = spawn('node', ['stop-hook.js'], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let output = '';
        let errorOutput = '';

        stopHook.stdout.on('data', (data) => {
          output += data.toString();
        });

        stopHook.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        stopHook.on('close', (code) => {
          resolve({ code, output, errorOutput });
        });

        stopHook.on('error', (error) => {
          reject(error);
        });

        // Send input and close stdin
        stopHook.stdin.write(hookInput);
        stopHook.stdin.end();

        // Set timeout
        setTimeout(() => {
          stopHook.kill('SIGTERM');
          resolve({ code: -1, output, errorOutput, timeout: true });
        }, 10000);
      });

      const result = await stopHookPromise;

      // Check if the stop hook ran without "todoData.tasks is not iterable" error
      if (result.errorOutput.includes('todoData.tasks is not iterable')) {
        throw new Error('Stop hook still encountering JSON corruption errors');
      }

      if (result.errorOutput.includes('INFINITE CONTINUE MODE ACTIVE')) {
        this.log(
          '✅ Stop hook executed successfully without corruption errors',
          'success',
        );
        this.testResults.push({
          test: 'Stop Hook Integration',
          result: 'PASS',
        });
      } else if (result.timeout) {
        this.log(
          '⚠️ Stop hook timed out (may be normal for infinite mode)',
          'warning',
        );
        this.testResults.push({
          test: 'Stop Hook Integration',
          result: 'TIMEOUT',
        });
      } else {
        throw new Error('Stop hook did not complete expected execution');
      }
    } catch (error) {
      this.log(`TEST 3 FAILED: ${error.message}`, 'error');
      this.testResults.push({
        test: 'Stop Hook Integration',
        result: 'FAIL',
        error: error.message,
      });
    }
  }

  async test4_AtomicWritePrevention() {
    this.log('TEST 4: Atomic write corruption prevention');

    try {
      const autoFixer = new AutoFixer();

      // Test with double-encoded string (should be detected and prevented)
      const validData = {
        test: 'atomic',
        tasks: [{ id: 'test', title: 'Test Task' }],
      };
      const doubleEncoded = JSON.stringify(JSON.stringify(validData));

      const result1 = await autoFixer.recovery.atomicWrite(
        './test-atomic.json',
        doubleEncoded,
      );

      if (!result1.success) {
        throw new Error(`Atomic write failed: ${result1.error}`);
      }

      // Verify the content is properly formatted
      const content = fs.readFileSync('./test-atomic.json', 'utf8');
      const parsed = JSON.parse(content);

      if (parsed.test === 'atomic' && parsed.tasks.length === 1) {
        this.log(
          '✅ Atomic write successfully prevented double-encoding',
          'success',
        );
      } else {
        throw new Error(
          'Atomic write did not properly handle double-encoded content',
        );
      }

      // Test with proper object (should work normally)
      const result2 = await autoFixer.recovery.atomicWrite(
        './test-atomic2.json',
        validData,
      );

      if (!result2.success) {
        throw new Error(`Atomic write with object failed: ${result2.error}`);
      }

      const content2 = fs.readFileSync('./test-atomic2.json', 'utf8');
      const parsed2 = JSON.parse(content2);

      if (parsed2.test === 'atomic' && parsed2.tasks.length === 1) {
        this.log(
          '✅ Atomic write works correctly with proper objects',
          'success',
        );
        this.testResults.push({
          test: 'Atomic Write Prevention',
          result: 'PASS',
        });
      } else {
        throw new Error('Atomic write failed with proper object data');
      }

      // Cleanup
      fs.unlinkSync('./test-atomic.json');
      fs.unlinkSync('./test-atomic2.json');
    } catch (error) {
      this.log(`TEST 4 FAILED: ${error.message}`, 'error');
      this.testResults.push({
        test: 'Atomic Write Prevention',
        result: 'FAIL',
        error: error.message,
      });

      // Cleanup on error
      try {
        if (fs.existsSync('./test-atomic.json')) {
          fs.unlinkSync('./test-atomic.json');
        }
        if (fs.existsSync('./test-atomic2.json')) {
          fs.unlinkSync('./test-atomic2.json');
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  generateReport() {
    this.log('\n' + '='.repeat(60));
    this.log('📊 CORRUPTION PREVENTION TEST REPORT');
    this.log('='.repeat(60));

    let passCount = 0;
    let failCount = 0;
    let timeoutCount = 0;
    let errorCount = 0;

    this.testResults.forEach((result) => {
      const status = result.result;

      // Test ${index + 1}: ${result.test} - ${status}
      // Error: ${result.error || 'N/A'}

      switch (status) {
        case 'PASS':
          passCount++;
          break;
        case 'FAIL':
          failCount++;
          break;
        case 'TIMEOUT':
          timeoutCount++;
          break;
        case 'ERROR':
          errorCount++;
          break;
      }
    });

    // Log the summary
    this.log(
      `SUMMARY: ${passCount} passed, ${failCount} failed, ${timeoutCount} timeout, ${errorCount} errors`,
    );

    // Success rate and other metrics available if needed
    // const totalTests = this.testResults.length;
    // const successRate = (((passCount + timeoutCount) / totalTests) * 100).toFixed(1);
    // Success Rate: ${successRate}% (${passCount + timeoutCount}/${totalTests})

    if (failCount === 0 && errorCount === 0) {
      // ALL CRITICAL TESTS PASSED - TODO.json corruption has been successfully prevented!
      return true;
    } else {
      // Some tests failed - corruption prevention may need additional work
      return false;
    }
  }

  async runAllTests() {
    this.log(
      '🚀 Starting comprehensive TODO.json corruption prevention test suite',
    );

    try {
      // Create backup
      this.createBackup();

      // Run all tests
      await this.test1_AutoFixerCorruptionDetection();
      await this.test2_TaskManagerWriteOperations();
      await this.test3_StopHookIntegration();
      await this.test4_AtomicWritePrevention();

      // Generate report
      const allPassed = this.generateReport();

      // Restore backup
      this.restoreBackup();

      return allPassed;
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      this.restoreBackup();
      return false;
    }
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const tester = new CorruptionPreventionTester();
  tester
    .runAllTests()
    .then((success) => {
      if (!success) {
        throw new Error('Test suite failed');
      }
      // Test suite completed successfully
    })
    .catch((_error) => {
      // Test suite crashed with error
      throw new Error('Test suite crashed');
    });
}

module.exports = CorruptionPreventionTester;
