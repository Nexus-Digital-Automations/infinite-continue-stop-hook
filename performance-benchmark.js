/**
const { loggers } = require('./lib/logger');
 * TaskManager Performance Benchmarking Suite
 *
 * Comprehensive performance analysis of TaskManager API endpoints,
 * embedded subtasks operations, success criteria validation,
 * And multi-agent coordination capabilities.
 *
 * @author Performance Research Agent #1
 * @version 1.0.0
 * @since 2025-09-21
 */

const { performance } = require('perf_hooks');
const { spawn } = require('child_process');
const FS = require('fs').promises;
const PATH = require('path');

class TaskManagerPerformanceBenchmark {
  constructor() {
    this.results = {
      apiResponses: [],
      memoryUsage: [],
      concurrentAccess: [],
      subtaskOperations: [],
      successCriteriaValidation: [],
      systemBottlenecks: [],
      recommendations: [],
    };
    this.taskManagerPath =
      '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';
    this.testStartTime = Date.now();
    this.testAgents = [];
  }

  /**
   * Execute TaskManager API command with timing
   * @param {string} command - API command to execute
   * @param {Array} args - Command arguments
   * @returns {Object} Result with timing And response data
   */
  executeTimedCommand(command, args = []) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    return new Promise((resolve) => {
      const cmdArgs = [this.taskManagerPath, command, ...args];
      const childProcess = spawn('timeout', ['10s', 'node', ...cmdArgs], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      childProcess.on('close', (code) => {
        const endTime = performance.now();
        const endMemory = process.memoryUsage();
        const duration = endTime - startTime;

        let response = null;
        try {
          // Extract JSON from stdout (may contain error messages)
          const jsonMatch = stdout.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            response = JSON.parse(jsonMatch[0]);
          }
        } catch {
          // Response is not JSON - keep as string
          response = stdout;
        }

        resolve({
          command,
          args,
          duration,
          exitCode: code,
          success: code === 0,
          response,
          stdout,
          stderr,
          memoryDelta: {
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            external: endMemory.external - startMemory.external,
            rss: endMemory.rss - startMemory.rss,
          },
        });
      });
    });
  }

  /**
   * Benchmark API endpoint response times
   */
  async benchmarkApiEndpoints() {
    loggers.stopHook.log('📊 Benchmarking API endpoint response times...');

    const endpoints = [
      ['init'],
      ['list'],
      ['status'],
      ['stats'],
      ['usage-analytics'],
      ['guide'],
      ['methods'],
      ['rag-health'],
      ['list-agents'],
    ];

    for (const endpoint of endpoints) {
      loggers.stopHook.log(`   Testing ${endpoint[0]}...`);

      // Run each endpoint multiple times for statistical significance
      for (let i = 0; i < 5; i++) {
        // eslint-disable-next-line no-await-in-loop -- Sequential timing measurements required
        const RESULT = await this.executeTimedCommand(
          endpoint[0],
          endpoint.slice(1)
        );
        this.results.apiResponses.push({
          endpoint: endpoint[0],
          iteration: i + 1,
          ...result,
        });

        // Brief pause between requests
        // eslint-disable-next-line no-await-in-loop -- Sequential timing with delays required
        await this.sleep(100);
      }
    }
  }

  /**
   * Test embedded subtasks performance
   */
  async benchmarkSubtaskOperations() {
    loggers.stopHook.log('🔧 Benchmarking embedded subtask operations...');

    try {
      // Initialize agent first
      loggers.stopHook.log('   Initializing test agent...');
      const initResult = await this.executeTimedCommand('init');
      if (!initResult.success) {
        loggers.stopHook.log(
          '   ❌ Failed to initialize agent for subtask testing'
        );
        return;
      }

      const agentId = initResult.response?.agentId;
      if (!agentId) {
        loggers.stopHook.log('   ❌ No agent ID returned from init');
        return;
      }

      // Create a test task
      loggers.stopHook.log('   Creating test task...');
      const taskData = {
        title: 'Performance Test Task',
        description: 'Task for performance testing embedded subtasks',
        category: 'feature',
      };

      const createResult = await this.executeTimedCommand('create', [
        JSON.stringify(taskData),
      ]);
      this.results.subtaskOperations.push({
        OPERATION 'create_task',
        ...createResult,
      });

      if (!createResult.success || !createResult.response?.task?.id) {
        loggers.stopHook.log('   ❌ Failed to create test task');
        return;
      }

      const taskId = createResult.response.task.id;
      loggers.stopHook.log(`   Created task: ${taskId}`);

      // Test subtask creation performance
      loggers.stopHook.log('   Testing subtask creation...');
      for (let i = 0; i < 3; i++) {
        const subtaskData = {
          type: 'research',
          title: `Performance Test Subtask ${i + 1}`,
          description: `Research subtask for performance testing iteration ${i + 1}`,
          estimated_hours: 1,
          prevents_implementation: false,
        };

        // eslint-disable-next-line no-await-in-loop -- Sequential subtask creation required for timing
        const RESULT = await this.executeTimedCommand('create-subtask', [
          taskId,
          JSON.stringify(subtaskData),
          agentId,
        ]);

        this.results.subtaskOperations.push({
          OPERATION 'create_subtask',
          iteration: i + 1,
          taskId,
          ...result,
        });
      }

      // Test subtask listing performance
      loggers.stopHook.log('   Testing subtask listing...');
      const listResult = await this.executeTimedCommand('list-subtasks', [
        taskId,
      ]);
      this.results.subtaskOperations.push({
        OPERATION 'list_subtasks',
        taskId,
        ...listResult,
      });
    } catch {
      loggers.stopHook.log(
        `   ❌ Error in subtask benchmarking: ${error.message}`
      );
    }
  }

  /**
   * Test success criteria validation performance
   */
  async benchmarkSuccessCriteria() {
    loggers.stopHook.log('✅ Benchmarking success criteria validation...');

    try {
      // Test basic criteria operations
      const operations = [
        [
          'set-project-criteria',
          JSON.stringify({
            buildSucceeds: {
              weight: 0.3,
              description: 'Project builds successfully',
            },
            testsPass: { weight: 0.3, description: 'All tests pass' },
            lintPasses: { weight: 0.2, description: 'Linting passes' },
            startSucceeds: {
              weight: 0.2,
              description: 'Application starts successfully',
            },
          }),
        ],
        ['criteria-report'],
        ['validate-criteria', 'feature_test_criteria'],
      ];

      for (const [command, ...args] of operations) {
        loggers.stopHook.log(`   Testing ${command}...`);
        // eslint-disable-next-line no-await-in-loop -- Sequential command testing required for timing
        const RESULT = await this.executeTimedCommand(command, args);
        this.results.successCriteriaValidation.push({
          operation, command,
          ...result,
        });
      }
    } catch {
      loggers.app.info(
        `   ❌ Error in success criteria benchmarking: ${error.message}`
      );
    }
  }

  /**
   * Test concurrent agent access performance
   */
  async benchmarkConcurrentAccess() {
    loggers.stopHook.log('👥 Benchmarking concurrent agent access...');

    const concurrentOperations = [];
    const numConcurrentAgents = 3;

    // Create multiple concurrent init operations
    for (let i = 0; i < numConcurrentAgents; i++) {
      concurrentOperations.push(
        this.executeTimedCommand('init').then((result) => ({
          agentIndex: i,
          OPERATION 'concurrent_init',
          ...result,
        }))
      );
    }

    try {
      const concurrentResults = await Promise.all(concurrentOperations);
      this.results.concurrentAccess.push(...concurrentResults);

      // Test concurrent list operations
      const listOperations = [];
      for (let i = 0; i < numConcurrentAgents; i++) {
        listOperations.push(
          this.executeTimedCommand('list').then((result) => ({
            agentIndex: i,
            OPERATION 'concurrent_list',
            ...result,
          }))
        );
      }

      const listResults = await Promise.all(listOperations);
      this.results.concurrentAccess.push(...listResults);
    } catch {
      loggers.app.info(
        `   ❌ Error in concurrent access benchmarking: ${error.message}`
      );
    }
  }

  /**
   * Monitor memory usage during operations
   */
  async monitorMemoryUsage() {
    loggers.stopHook.log('💾 Monitoring memory usage patterns...');

    const memorySnapshots = [];
    const startMemory = process.memoryUsage();

    // Take memory snapshots during various operations
    for (let i = 0; i < 10; i++) {
      const snapshot = {
        timestamp: Date.now(),
        iteration: i,
        ...process.memoryUsage(),
      };
      memorySnapshots.push(snapshot);

      // Perform some operations to trigger memory usage
      // eslint-disable-next-line no-await-in-loop -- Sequential memory monitoring required
      await this.executeTimedCommand('list');
      // eslint-disable-next-line no-await-in-loop -- Sequential memory monitoring required
      await this.executeTimedCommand('stats');

      // eslint-disable-next-line no-await-in-loop -- Sequential timing with delays required
      await this.sleep(500);
    }

    this.results.memoryUsage = {
      startMemory,
      snapshots: memorySnapshots,
      endMemory: process.memoryUsage(),
    };
  }

  /**
   * Analyze results And identify bottlenecks
   */
  analyzeBottlenecks() {
    loggers.stopHook.log('🔍 Analyzing performance bottlenecks...');

    const bottlenecks = [];

    // Analyze API response times
    const apiTimes = this.results.apiResponses.reduce((acc, result) => {
      if (!acc[result.endpoint]) {
        acc[result.endpoint] = [];
      }
      acc[result.endpoint].push(result.duration);
      return acc;
    }, {});

    for (const [endpoint, times] of Object.entries(apiTimes)) {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      if (avgTime > 1000) {
        // Slower than 1 second
        bottlenecks.push({
          type: 'slow_api_endpoint',
          endpoint,
          avgTime: avgTime.toFixed(2),
          maxTime: maxTime.toFixed(2),
          severity: avgTime > 3000 ? 'high' : 'medium',
        });
      }
    }

    // Analyze memory usage patterns
    if (this.results.memoryUsage.snapshots) {
      const memoryGrowth = this.results.memoryUsage.snapshots.map(
        (snapshot, i) => {
          if (i === 0) {
            return 0;
          }
          return (
            snapshot.heapUsed - this.results.memoryUsage.snapshots[0].heapUsed
          );
        }
      );

      const maxMemoryGrowth = Math.max(...memoryGrowth);
      if (maxMemoryGrowth > 50 * 1024 * 1024) {
        // 50MB growth
        bottlenecks.push({
          type: 'memory_growth',
          maxGrowthMB: (maxMemoryGrowth / (1024 * 1024)).toFixed(2),
          severity: maxMemoryGrowth > 100 * 1024 * 1024 ? 'high' : 'medium',
        });
      }
    }

    // Analyze concurrent access performance
    const concurrentInits = this.results.concurrentAccess.filter(
      (r) => r.OPERATION=== 'concurrent_init'
    );
    if (concurrentInits.length > 0) {
      const avgConcurrentTime =
        concurrentInits.reduce((sum, r) => sum + r.duration, 0) /
        concurrentInits.length;
      if (avgConcurrentTime > 2000) {
        bottlenecks.push({
          type: 'slow_concurrent_access',
          avgTime: avgConcurrentTime.toFixed(2),
          severity: 'medium',
        });
      }
    }

    this.results.systemBottlenecks = bottlenecks;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    loggers.stopHook.log('💡 Generating optimization recommendations...');

    const recommendations = [];

    this.results.systemBottlenecks.forEach((bottleneck) => {
      switch (bottleneck.type) {
        case 'slow_api_endpoint':
          recommendations.push({
            category: 'API Performance',
            priority: bottleneck.severity,
            issue: `${bottleneck.endpoint} endpoint averaging ${bottleneck.avgTime}ms`,
            recommendation: `Optimize ${bottleneck.endpoint} endpoint with caching, database indexing, or query optimization`,
            impact: 'Improved API responsiveness And user experience',
          });
          break;

        case 'memory_growth':
          recommendations.push({
            category: 'Memory Management',
            priority: bottleneck.severity,
            issue: `Memory growth of ${bottleneck.maxGrowthMB}MB during operations`,
            recommendation:
              'Implement memory cleanup, object pooling, or garbage collection optimization',
            impact: 'Reduced memory footprint And improved system stability',
          });
          break;

        case 'slow_concurrent_access':
          recommendations.push({
            category: 'Concurrency',
            priority: bottleneck.severity,
            issue: `Concurrent operations averaging ${bottleneck.avgTime}ms`,
            recommendation:
              'Implement connection pooling, reduce lock contention, or optimize concurrent access patterns',
            impact: 'Better multi-agent performance And system scalability',
          });
          break;
      }
    });

    // General performance recommendations
    recommendations.push({
      category: 'System Architecture',
      priority: 'low',
      issue: 'TaskManager system analysis complete',
      recommendation:
        'Consider implementing response caching, database connection pooling, And lazy loading for large datasets',
      impact: 'Overall system performance improvement And resource efficiency',
    });

    this.results.recommendations = recommendations;
  }

  /**
   * Generate comprehensive performance report
   */
  async generateReport() {
    loggers.stopHook.log('📋 Generating comprehensive performance report...');

    const report = {
      metadata: {
        testDate: new Date().toISOString(),
        testDuration: Date.now() - this.testStartTime,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      summary: {
        totalApiTests: this.results.apiResponses.length,
        totalSubtaskTests: this.results.subtaskOperations.length,
        totalConcurrentTests: this.results.concurrentAccess.length,
        totalBottlenecks: this.results.systemBottlenecks.length,
        totalRecommendations: this.results.recommendations.length,
      },
      performance: {
        apiEndpoints: this.summarizeApiPerformance(),
        subtaskOperations: this.summarizeSubtaskPerformance(),
        concurrentAccess: this.summarizeConcurrentPerformance(),
        memoryUsage: this.summarizeMemoryUsage(),
      },
      analysis: {
        bottlenecks: this.results.systemBottlenecks,
        recommendations: this.results.recommendations,
      },
      rawData: this.results,
    };

    // Save report to file
    const reportPath = `/Users/jeremyparker/infinite-continue-stop-hook/performance-report-${Date.now()}.json`;
    await FS.writeFile(reportPath, JSON.stringify(report, null, 2));

    loggers.stopHook.log(`\n📊 Performance Report Generated: ${reportPath}`);
    return report;
  }

  summarizeApiPerformance() {
    const endpoints = {};

    this.results.apiResponses.forEach((result) => {
      if (!endpoints[result.endpoint]) {
        endpoints[result.endpoint] = {
          count: 0,
          totalTime: 0,
          minTime: Infinity,
          maxTime: 0,
          errors: 0,
        };
      }

      const ep = endpoints[result.endpoint];
      ep.count++;
      ep.totalTime += RESULT.duration;
      ep.minTime = Math.min(ep.minTime, RESULT.duration);
      ep.maxTime = Math.max(ep.maxTime, RESULT.duration);
      if (!result.success) {
        ep.errors++;
      }
    });

    Object.keys(endpoints).forEach((ep) => {
      endpoints[ep].avgTime = endpoints[ep].totalTime / endpoints[ep].count;
      endpoints[ep].successRate =
        ((endpoints[ep].count - endpoints[ep].errors) / endpoints[ep].count) *
        100;
    });

    return endpoints;
  }

  summarizeSubtaskPerformance() {
    const operations = {};

    this.results.subtaskOperations.forEach((result) => {
      if (!operations[result.OPERATION) {
        operations[result.OPERATION = {
          count: 0,
          totalTime: 0,
          minTime: Infinity,
          maxTime: 0,
          errors: 0,
        };
      }

      const op = operations[result.OPERATION;
      op.count++;
      op.totalTime += RESULT.duration;
      op.minTime = Math.min(op.minTime, RESULT.duration);
      op.maxTime = Math.max(op.maxTime, RESULT.duration);
      if (!result.success) {
        op.errors++;
      }
    });

    Object.keys(operations).forEach((op) => {
      operations[op].avgTime = operations[op].totalTime / operations[op].count;
      operations[op].successRate =
        ((operations[op].count - operations[op].errors) /
          operations[op].count) *
        100;
    });

    return operations;
  }

  summarizeConcurrentPerformance() {
    const concurrent = {
      init: this.results.concurrentAccess.filter(
        (r) => r.OPERATION=== 'concurrent_init'
      ),
      list: this.results.concurrentAccess.filter(
        (r) => r.OPERATION=== 'concurrent_list'
      ),
    };

    const summary = {};
    Object.keys(concurrent).forEach((op) => {
      const results = concurrent[op];
      if (results.length > 0) {
        const times = results.map((r) => r.duration);
        summary[op] = {
          count: results.length,
          avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
          minTime: Math.min(...times),
          maxTime: Math.max(...times),
          successRate:
            (results.filter((r) => r.success).length / results.length) * 100,
        };
      }
    });

    return summary;
  }

  summarizeMemoryUsage() {
    if (
      !this.results.memoryUsage.snapshots ||
      this.results.memoryUsage.snapshots.length === 0
    ) {
      return { noData: true };
    }

    const snapshots = this.results.memoryUsage.snapshots;
    const heapUsages = snapshots.map((s) => s.heapUsed);

    return {
      initial: this.results.memoryUsage.startMemory,
      final: this.results.memoryUsage.endMemory,
      peak: Math.max(...heapUsages),
      average:
        heapUsages.reduce((sum, usage) => sum + usage, 0) / heapUsages.length,
      samples: snapshots.length,
    };
  }

  /**
   * Utility method to sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Run complete performance benchmark suite
   */
  async runCompleteBenchmark() {
    loggers.stopHook.log('🚀 Starting TaskManager Performance Benchmark Suite');
    loggers.stopHook.log('================================================\n');

    try {
      await this.benchmarkApiEndpoints();
      await this.benchmarkSubtaskOperations();
      await this.benchmarkSuccessCriteria();
      await this.benchmarkConcurrentAccess();
      await this.monitorMemoryUsage();

      this.analyzeBottlenecks();
      this.generateRecommendations();

      const report = await this.generateReport();

      loggers.stopHook.log(
        '\n✅ Performance Benchmark Suite Completed Successfully!'
      );
      loggers.stopHook.log(`\n📈 Summary:`);
      loggers.stopHook.log(
        `   • API Endpoints Tested: ${report.summary.totalApiTests}`
      );
      loggers.app.info(
        `   • Subtask Operations: ${report.summary.totalSubtaskTests}`
      );
      loggers.app.info(
        `   • Concurrent Tests: ${report.summary.totalConcurrentTests}`
      );
      loggers.app.info(
        `   • Bottlenecks Identified: ${report.summary.totalBottlenecks}`
      );
      loggers.app.info(
        `   • Recommendations Generated: ${report.summary.totalRecommendations}`
      );

      return report;
    } catch {
      loggers.stopHook.error(`❌ Benchmark suite failed: ${error.message}`);
      loggers.stopHook.error(error.stack);
      throw error;
    }
  }
}

// Run benchmark if this file is executed directly
if (require.main === module) {
  const benchmark = new TaskManagerPerformanceBenchmark();
  benchmark
    .runCompleteBenchmark()
    .then(() => {
      loggers.stopHook.log('\n🎉 All benchmarks completed successfully!');
      throw new Error('Benchmark completed successfully');
    })
    .catch((error) => {
      loggers.stopHook.error('\n❌ Benchmark suite failed:', error.message);
      throw error;
    });
}

module.exports = TaskManagerPerformanceBenchmark;
