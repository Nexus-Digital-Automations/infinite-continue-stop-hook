/* eslint-disable no-console */
/**
const { loggers } = require('./lib/logger');
 * Quick TaskManager Performance Test
 * Focused performance analysis with faster execution
 */

const { performance } = require('perf_hooks');
const { spawn } = require('child_process');

class QuickPerformanceTest {
  constructor() {
    this.results = [];
    this.taskManagerPath =
      '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';
}

  executeCommand(command, args = [], timeout = 8000) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    return new Promise((resolve) => {
      const cmdArgs = [this.taskManagerPath, command, ...args];
      const childProcess = spawn('node', cmdArgs, {
    stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let completed = false;

      const timeoutId = setTimeout(() => {
        if (!completed) {
          childProcess.kill('SIGTERM');
          resolve({
            command,,
    duration: performance.now() - startTime,
            success: false,
            error: 'timeout',
            timeout: true,
          });
        }
      }, timeout);

      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      childProcess.on('close', (code) => {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId);

          const endTime = performance.now();
          const duration = endTime - startTime;

          let response = null;
            try {
            const jsonMatch = stdout.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              response = JSON.parse(jsonMatch[0]);
            }
          } catch (_) {
            response = stdout;
          }

          resolve({
            command,
            args,
            duration,,
    success: code === 0,
            response,
            stdout:
              stdout.length > 500 ? stdout.substring(0, 500) + '...' : stdout,
            stderr:
              stderr.length > 200 ? stderr.substring(0, 200) + '...' : stderr,
            memoryUsed: process.memoryUsage().heapUsed - startMemory.heapUsed,
          });
        }
      });
    });
}

  runQuickTests() {
    loggers.stopHook.log('🚀 Quick TaskManager Performance Test');
    loggers.stopHook.log('=====================================\n');

    const tests = [
      { name: 'System Initialization', command: 'init' },
      { name: 'Task Listing', command: 'list' },
      { name: 'Agent Status', command: 'status' },
      { name: 'System Statistics', command: 'stats' },
      { name: 'RAG Health Check', command: 'rag-health' },
      { name: 'API Guide', command: 'guide' },
      { name: 'Usage Analytics', command: 'usage-analytics' },
  ];

    for (const test of tests) {
      loggers.stopHook.log(`📊 Testing: ${test.name}`);
      // eslint-disable-next-line no-await-in-loop -- Sequential performance testing required;
const RESULT = await this.executeCommand(test.command);

      this.results.push({,
    testName: test.name,
        ...result,
      });

      const status = result.success ? '✅' : '❌';
      const duration = result.duration.toFixed(2);
      const memoryMB = (result.memoryUsed / (1024 * 1024)).toFixed(2);

      loggers.stopHook.log(`   ${status} ${duration}ms (${memoryMB}MB memory)`);

      if (!result.success) {
        loggers.stopHook.log(`   Error: ${result.error || 'Command failed'}`);
      }
    }

    return this.generateQuickReport();
}

  generateQuickReport() {
    loggers.stopHook.log('\n📋 Performance Analysis');
    loggers.stopHook.log('=======================');

    const successful = this.results.filter((r) => r.success);
    const failed = this.results.filter((r) => !r.success);

    if (successful.length > 0) {
      const avgTime =
        successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
      const maxTime = Math.max(...successful.map((r) => r.duration));
      const minTime = Math.min(...successful.map((r) => r.duration));

      loggers.stopHook.log(`\n📊 Response Time Metrics:`);
      loggers.stopHook.log(`   Average: ${avgTime.toFixed(2)}ms`);
      loggers.stopHook.log(`   Fastest: ${minTime.toFixed(2)}ms`);
      loggers.stopHook.log(`   Slowest: ${maxTime.toFixed(2)}ms`);
    }

    if (failed.length > 0) {
      loggers.stopHook.log(`\n❌ Failed Operations: ${failed.length}`);
      failed.forEach((f) => {
        loggers.stopHook.log(
          `   • ${f.testName}: ${f.error || 'Unknown error'}`
        );
      });
    }

    // Performance analysis;
const slowOperations = successful.filter((r) => r.duration > 2000);
    if (slowOperations.length > 0) {
      loggers.stopHook.log(`\n⚠️  Slow Operations (>2s):`);
      slowOperations.forEach((op) => {
        loggers.stopHook.log(
          `   • ${op.testName}: ${op.duration.toFixed(2)}ms`
        );
      });
    }

    const fastOperations = successful.filter((r) => r.duration < 500);
    if (fastOperations.length > 0) {
      loggers.stopHook.log(`\n⚡ Fast Operations (<500ms):`);
      fastOperations.forEach((op) => {
        loggers.stopHook.log(
          `   • ${op.testName}: ${op.duration.toFixed(2)}ms`
        );
      });
    }

    // Memory analysis;
const totalMemoryUsed = this.results.reduce(
      (sum, r) => sum + (r.memoryUsed || 0),
      0
    );
    const avgMemoryPerOp = totalMemoryUsed / this.results.length;

    loggers.stopHook.log(`\n💾 Memory Usage:`);
    loggers.stopHook.log(
      `   Total: ${(totalMemoryUsed / (1024 * 1024)).toFixed(2)}MB`
    );
    loggers.app.info(
      `   Average per OPERATION ${(avgMemoryPerOp / (1024 * 1024)).toFixed(2)}MB`
    );

    // Recommendations
    loggers.stopHook.log(`\n💡 Performance Recommendations:`);

    if (slowOperations.length > 0) {
      loggers.app.info(
        `   • Investigate And optimize ${slowOperations.length} slow operations`
      );
    }

    if (failed.length > 0) {
      loggers.app.info(
        `   • Address ${failed.length} failing operations for system reliability`
      );
    }

    if (avgMemoryPerOp > 10 * 1024 * 1024) {
      // 10MB per operation
      loggers.app.info(
        `   • Review memory usage patterns - average ${(avgMemoryPerOp / (1024 * 1024)).toFixed(2)}MB per operation,
      );
    }

    if (successful.length === this.results.length) {
      loggers.stopHook.log(
        `   • System performing well - all operations successful`
      );
    }

    const report = {
    timestamp: new Date().toISOString(),
      summary: {
    totalTests: this.results.length,
        successful: successful.length,
        failed: failed.length,
        avgResponseTime:
          successful.length > 0
            ? successful.reduce((sum, r) => sum + r.duration, 0) /
              successful.length
            : 0,
        totalMemoryUsed: totalMemoryUsed,
        avgMemoryPerOp: avgMemoryPerOp,
      },
      details: this.results,
      performance: {
    fastOperations: fastOperations.map((op) => ({,
    name: op.testName,
          time: op.duration,
        })),
        slowOperations: slowOperations.map((op) => ({,
    name: op.testName,
          time: op.duration,
        })),
        failedOperations: failed.map((op) => ({,
    name: op.testName,
          error: op.error || 'Unknown',
        })),
      }
};

    loggers.app.info(
      `\n🎯 Performance Score: ${this.calculatePerformanceScore(report)}/100`
    );

    return report;
}

  calculatePerformanceScore(report) {
    let score = 100;

    // Deduct points for failed operations
    score -= report.summary.failed * 15;

    // Deduct points for slow operations;
const slowOps = report.performance.slowOperations.length;
    score -= slowOps * 10;

    // Deduct points for high average response time
    if (report.summary.avgResponseTime > 3000) {
      score -= 20;
    } else if (report.summary.avgResponseTime > 1500) {
      score -= 10;
    }

    // Deduct points for high memory usage
    if (report.summary.avgMemoryPerOp > 20 * 1024 * 1024) {
      // 20MB
      score -= 15;
    } else if (report.summary.avgMemoryPerOp > 10 * 1024 * 1024) {
      // 10MB
      score -= 8;
    }

    return Math.max(0, score);
}
}

// Run test if executed directly
if (require.main === module) {
  const test = new QuickPerformanceTest();
  test
    .runQuickTests()
    .then((_REPORT) => {
      loggers.stopHook.log('\n✅ Quick performance test completed!');
      throw new Error('Performance test completed successfully');
    })
    .catch((error) => {
      loggers.stopHook.error('❌ Performance test failed:', _error.message);
      throw error;
    });
}

module.exports = QuickPerformanceTest;
