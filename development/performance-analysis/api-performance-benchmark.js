const { loggers } = require('../../lib/logger');
/**
 * TaskManager API Performance Benchmark Suite
 *
 * Comprehensive performance analysis tool for measuring API response times,
 * endpoint optimization opportunities, and system bottlenecks.
 *
 * @author Performance Research Agent #4
 * @date 2025-09-21
 */

// Console output is intentional for this development/analysis tool;
const { spawn } = require('child_process');
const FS = require('fs');
const path = require('path');

class APIPerformanceBenchmark {
  constructor(_agentId) {
    this.apiPath =
      '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';
    this.results = {
      endpoints: {},
      summary: {},
      recommendations: [],
      timestamp: new Date().toISOString(),
    };
    this.testData = {
      taskId: null,
      agentId: null,
      sampleTasks: [],
    };
    this.metrics = {
      responseTime: [],
      throughput: [],
      errorRates: [],
      memoryUsage: [],
    };
  }

  /**
   * Execute API command and measure performance
   */
  async executeCommand(command, args = [], iterations = 5) {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage();
      try {
        // eslint-disable-next-line no-await-in-loop -- Sequential execution required for accurate performance measurement;
        const result = await this.runCommand(command, args);
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();

        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds;
        const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

        results.push({
          iteration: i + 1,
          responseTime,
          memoryDelta,
          success: result.success,
          errorDetails: result.error || null,
          outputSize: JSON.stringify(result).length,
        });

        // Small delay between iterations
        // eslint-disable-next-line no-await-in-loop -- Sequential delay required for benchmark accuracy
        await this.sleep(100);
      } catch (error) {
        results.push({
          iteration: i + 1,
          responseTime: -1,
          memoryDelta: -1,
          success: false,
          errorDetails: error.message,
          outputSize: 0,
        });
      }
    }

    return this.calculateMetrics(results);
  }

  /**
   * Run TaskManager API command
   */
  runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const fullArgs = [this.apiPath, command, ...args];
      const child = spawn('timeout', ['10s', 'node', ...fullArgs], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        try {
          // Extract JSON from stdout (handle mixed output)
          const jsonMatch = stdout.match(/\{[\s\S]*\}/);
          const result = jsonMatch
            ? JSON.parse(jsonMatch[0])
            : { success: false, error: 'No JSON output' };
          resolve({
            ...result,
            exitCode: code,
            stderr: stderr,
          });
        } catch (error) {
          resolve({
            success: false,
            error: `Parse error: ${error.message}`,
            stdout,
            stderr,
            exitCode: code,
          });
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Calculate performance metrics from results
   */
  calculateMetrics(results) {
    const successfulResults = results.filter(
      (r) => r.success && r.responseTime > 0
    );
    const responseTimes = successfulResults.map((r) => r.responseTime);
    const memoryDeltas = successfulResults.map((r) => r.memoryDelta);

    if (responseTimes.length === 0) {
      return {
        success: false,
        errorRate: 100,
        totalFailures: results.length,
      };
    }

    return {
      success: true,
      averageResponseTime:
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      medianResponseTime: this.median(responseTimes),
      p95ResponseTime: this.percentile(responseTimes, 95),
      averageMemoryDelta:
        memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
      successRate: (successfulResults.length / results.length) * 100,
      errorRate:
        ((results.length - successfulResults.length) / results.length) * 100,
      throughput:
        1000 /
        (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length), // requests per second
      iterations: results.length,
      rawResults: results,
    };
  }

  /**
   * Benchmark all critical API endpoints
   */
  async benchmarkAllEndpoints() {
    loggers.stopHook.log(
      '🚀 Starting comprehensive API performance benchmark...\n'
    );

    // Initialize system first
    loggers.stopHook.log('📋 Initializing agent for testing...');
    const initResult = await this.executeCommand('init');
    this.results.endpoints.init = initResult;

    if (initResult.success) {
      // Extract agent ID for subsequent tests;
      const agentMatch = JSON.stringify(initResult).match(
        /"agentId":\s*"([^"]+)"/
      );
      if (agentMatch && agentMatch[1]) {
        this.testData.agentId = agentMatch[1];
        loggers.stopHook.log(`✅ Agent initialized: ${this.testData.agentId}`);
      }
    }

    // Core agent management endpoints
    loggers.stopHook.log('\n🔍 Testing agent management endpoints...');
    this.results.endpoints.listAgents =
      await this.executeCommand('list-agents');
    this.results.endpoints.status = await this.executeCommand('status');
    this.results.endpoints.stats = await this.executeCommand('stats');

    // Task management endpoints
    loggers.stopHook.log('\n📝 Testing task management endpoints...');
    this.results.endpoints.listTasks = await this.executeCommand('list');

    // Create test task for further testing;
    const createTaskResult = await this.executeCommand('create', [
      JSON.stringify({
        title: 'Performance Test Task',
        description: 'Test task for performance benchmarking',
        category: 'test',
      }),
    ]);
    this.results.endpoints.createTask = createTaskResult;

    if (createTaskResult.success) {
      // Extract task ID;
      const taskMatch =
        JSON.stringify(createTaskResult).match(/"id":\s*"([^"]+)"/);
      if (taskMatch) {
        this.testData.taskId = taskMatch[1];
        loggers.stopHook.log(`✅ Test task created: ${this.testData.taskId}`);

        // Test task operations with created task
        if (this.testData.agentId) {
          this.results.endpoints.claimTask = await this.executeCommand(
            'claim',
            [this.testData.taskId, this.testData.agentId]
          );

          this.results.endpoints.completeTask = await this.executeCommand(
            'complete',
            [this.testData.taskId, '"Performance test completed"']
          );
        }
      }
    }

    // Subtask management endpoints
    loggers.stopHook.log('\n🔗 Testing subtask management endpoints...');
    this.results.endpoints.listSubtasks =
      await this.executeCommand('list-subtasks');

    if (this.testData.taskId) {
      this.results.endpoints.createSubtask = await this.executeCommand(
        'create-subtask',
        [
          JSON.stringify({
            parentTaskId: this.testData.taskId,
            title: 'Performance Test Subtask',
            description: 'Subtask for performance testing',
            type: 'implementation',
          }),
        ]
      );
    }

    // Success criteria endpoints
    loggers.stopHook.log('\n✅ Testing success criteria endpoints...');
    this.results.endpoints.getSuccessCriteria = await this.executeCommand(
      'get-success-criteria'
    );
    this.results.endpoints.criteriaReport =
      await this.executeCommand('criteria-report');

    // RAG system endpoints
    loggers.stopHook.log('\n🧠 Testing RAG system endpoints...');
    this.results.endpoints.ragHealth = await this.executeCommand('rag-health');
    this.results.endpoints.ragSearch = await this.executeCommand('rag-search', [
      'performance testing',
    ]);

    // Advanced operations
    loggers.stopHook.log('\n🔧 Testing advanced operations...');
    this.results.endpoints.usageAnalytics =
      await this.executeCommand('usage-analytics');
    this.results.endpoints.guide = await this.executeCommand('guide');
    this.results.endpoints.methods = await this.executeCommand('methods');

    loggers.stopHook.log('\n✅ Benchmark completed! Analyzing results...\n');
  }

  /**
   * Analyze performance bottlenecks And generate recommendations
   */
  analyzePerformance() {
    const analysis = {
      slowestEndpoints: [],
      fastestEndpoints: [],
      errorProneEndpoints: [],
      highMemoryEndpoints: [],
      optimizationOpportunities: [],
    };

    // Analyze each endpoint
    Object.entries(this.results.endpoints).forEach(([endpoint, metrics]) => {
      if (metrics.success && metrics.averageResponseTime) {
        const endpointAnalysis = {
          endpoint,
          averageResponseTime: metrics.averageResponseTime,
          p95ResponseTime: metrics.p95ResponseTime,
          successRate: metrics.successRate,
          averageMemoryDelta: metrics.averageMemoryDelta,
          throughput: metrics.throughput,
        };

        // Categorize endpoints
        if (metrics.averageResponseTime > 1000) {
          analysis.slowestEndpoints.push(endpointAnalysis);
        }
        if (metrics.averageResponseTime < 100) {
          analysis.fastestEndpoints.push(endpointAnalysis);
        }
        if (metrics.successRate < 95) {
          analysis.errorProneEndpoints.push(endpointAnalysis);
        }
        if (metrics.averageMemoryDelta > 10 * 1024 * 1024) {
          // 10MB
          analysis.highMemoryEndpoints.push(endpointAnalysis);
        }
      }
    });

    // Sort by performance metrics
    analysis.slowestEndpoints.sort(
      (a, b) => b.averageResponseTime - a.averageResponseTime
    );
    analysis.fastestEndpoints.sort(
      (a, b) => a.averageResponseTime - b.averageResponseTime
    );

    // Generate optimization recommendations
    analysis.optimizationOpportunities =
      this.generateOptimizationRecommendations(analysis);

    this.results.analysis = analysis;
    return analysis;
  }

  /**
   * Generate specific optimization recommendations
   */
  generateOptimizationRecommendations(analysis) {
    const recommendations = [];

    // Response time optimizations
    if (analysis.slowestEndpoints.length > 0) {
      recommendations.push({
        category: 'Response Time',
        priority: 'High',
        recommendation: 'Optimize slowest endpoints',
        details: `Endpoints requiring attention: ${analysis.slowestEndpoints.map((e) => e.endpoint).join(', ')}`,
        strategies: [
          'Implement response caching for read operations',
          'Optimize JSON parsing and serialization',
          'Add connection pooling for file operations',
          'Implement lazy loading for non-critical data',
        ],
      });
    }

    // Memory optimization
    if (analysis.highMemoryEndpoints.length > 0) {
      recommendations.push({
        category: 'Memory Usage',
        priority: 'Medium',
        recommendation: 'Reduce memory footprint for high-memory endpoints',
        details: `Memory-intensive endpoints: ${analysis.highMemoryEndpoints.map((e) => e.endpoint).join(', ')}`,
        strategies: [
          'Implement streaming for large data operations',
          'Add garbage collection optimization',
          'Use memory-efficient data structures',
          'Implement data pagination',
        ],
      });
    }

    // Error handling improvements
    if (analysis.errorProneEndpoints.length > 0) {
      recommendations.push({
        category: 'Reliability',
        priority: 'High',
        recommendation: 'Improve error handling and reliability',
        details: `Error-prone endpoints: ${analysis.errorProneEndpoints.map((e) => e.endpoint).join(', ')}`,
        strategies: [
          'Add retry mechanisms for transient failures',
          'Implement circuit breaker patterns',
          'Enhance input validation',
          'Add better error recovery',
        ],
      });
    }

    // Caching opportunities
    recommendations.push({
      category: 'Caching',
      priority: 'Medium',
      recommendation: 'Implement intelligent caching strategies',
      details: 'Add caching for frequently accessed data and computed results',
      strategies: [
        'Cache task lists and agent status',
        'Implement time-based cache invalidation',
        'Add in-memory caching for hot data',
        'Use file-based caching for expensive operations',
      ],
    });

    return recommendations;
  }

  /**
   * Load testing simulation
   */
  async performLoadTest(endpoint = 'list', concurrency = 5, duration = 30) {
    loggers.app.info(
      `🔥 Starting load test: ${endpoint} (${concurrency} concurrent, ${duration}s)`
    );

    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < concurrency; i++) {
      const promise = this.loadTestWorker(
        endpoint,
        startTime + duration * 1000,
        i
      );
      promises.push(promise);
    }

    const workerResults = await Promise.all(promises);
    const allResults = workerResults.flat();

    return {
      endpoint,
      concurrency,
      duration,
      totalRequests: allResults.length,
      successfulRequests: allResults.filter((r) => r.success).length,
      averageResponseTime:
        allResults.reduce((sum, r) => sum + r.responseTime, 0) /
        allResults.length,
      requestsPerSecond: allResults.length / duration,
      p95ResponseTime: this.percentile(
        allResults.map((r) => r.responseTime),
        95
      ),
      errorRate:
        (allResults.filter((r) => !r.success).length / allResults.length) * 100,
    };
  }

  /**
   * Load test worker
   */
  async loadTestWorker(endpoint, endTime, workerId) {
    const results = [];
    let requestCount = 0;

    while (Date.now() < endTime) {
      const startTime = process.hrtime.bigint();
      try {
        // eslint-disable-next-line no-await-in-loop -- Sequential load testing requires controlled timing;
        const result = await this.runCommand(endpoint);
        const responseTime =
          Number(process.hrtime.bigint() - startTime) / 1000000;

        results.push({
          workerId,
          requestCount: ++requestCount,
          responseTime,
          success: result.success,
          timestamp: Date.now(),
        });
      } catch (error) {
        results.push({
          workerId,
          requestCount: ++requestCount,
          responseTime: -1,
          success: false,
          error: error.message,
          timestamp: Date.now(),
        });
      }

      // Small delay to prevent overwhelming the system
      // eslint-disable-next-line no-await-in-loop -- Sequential delay required for controlled load testing
      await this.sleep(10);
    }

    return results;
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport() {
    const report = {
      metadata: {
        testDate: this.results.timestamp,
        testDuration: 'Variable per endpoint',
        testConfiguration: 'Default 5 iterations per endpoint',
        tester: 'Performance Research Agent #4',
      },
      executiveSummary: this.generateExecutiveSummary(),
      detailedResults: this.results.endpoints,
      performanceAnalysis: this.results.analysis,
      recommendations: this.results.analysis?.optimizationOpportunities || [],
      criticalPathAnalysis: this.analyzeCriticalPath(),
      cachingAnalysis: this.analyzeCachingOpportunities(),
      scalabilityAssessment: this.assessScalability(),
    };

    return report;
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary() {
    const endpoints = Object.keys(this.results.endpoints).length;
    const successfulEndpoints = Object.values(this.results.endpoints).filter(
      (e) => e.success
    ).length;
    const averageResponseTime =
      Object.values(this.results.endpoints)
        .filter((e) => e.success && e.averageResponseTime)
        .reduce((sum, e) => sum + e.averageResponseTime, 0) /
      successfulEndpoints;
    return {
      totalEndpointsTested: endpoints,
      successfulTests: successfulEndpoints,
      overallSuccessRate: (successfulEndpoints / endpoints) * 100,
      averageSystemResponseTime: averageResponseTime,
      primaryBottlenecks:
        this.results.analysis?.slowestEndpoints
          ?.slice(0, 3)
          .map((e) => e.endpoint) || [],
      criticalRecommendations:
        this.results.analysis?.optimizationOpportunities?.filter(
          (r) => r.priority === 'High'
        ).length || 0,
    };
  }

  /**
   * Analyze critical path performance
   */
  analyzeCriticalPath() {
    const criticalOperations = [
      'init',
      'createTask',
      'claimTask',
      'completeTask',
      'listTasks',
    ];

    const criticalPathMetrics = criticalOperations.map((op) => {
      // eslint-disable-next-line security/detect-object-injection -- Object property access with validated _operationnames from predefined array;
      const metrics = this.results.endpoints[op];
      return {
        operation: op,
        averageResponseTime: metrics?.averageResponseTime || -1,
        successRate: metrics?.successRate || 0,
        criticality: 'High',
      };
    });

    return {
      operations: criticalPathMetrics,
      totalCriticalPathTime: criticalPathMetrics.reduce(
        (sum, op) =>
          sum + (op.averageResponseTime > 0 ? op.averageResponseTime : 0),
        0
      ),
      bottlenecks: criticalPathMetrics.filter(
        (op) => op.averageResponseTime > 500
      ),
    };
  }

  /**
   * Analyze caching opportunities
   */
  analyzeCachingOpportunities() {
    const readOperations = [
      'listTasks',
      'listAgents',
      'status',
      'getSuccessCriteria',
      'ragHealth',
    ];
    return {
      cacheableOperations: readOperations.map((op) => ({
        operation: op,
        averageResponseTime:
          // eslint-disable-next-line security/detect-object-injection -- Object property access with validated _operationnames
          this.results.endpoints[op]?.averageResponseTime || -1,

        cacheValue:
          // eslint-disable-next-line security/detect-object-injection -- Object property access with validated _operationnames
          this.results.endpoints[op]?.averageResponseTime > 100
            ? 'High'
            : 'Medium',
      })),
      recommendations: [
        'Implement in-memory caching for frequently accessed task lists',
        'Add file-based caching for agent status information',
        'Use time-based cache invalidation for dynamic data',
        'Implement request deduplication for concurrent operations',
      ],
    };
  }

  /**
   * Assess system scalability
   */
  assessScalability() {
    const memoryUsage = Object.values(this.results.endpoints)
      .filter((e) => e.success && e.averageMemoryDelta)
      .reduce((sum, e) => sum + e.averageMemoryDelta, 0);
    return {
      memoryEfficiency:
        memoryUsage < 50 * 1024 * 1024 ? 'Good' : 'Needs Optimization',
      concurrencyReadiness: 'Requires Load Testing',
      scalabilityBottlenecks: [
        'File-based JSON operations may become bottleneck under high load',
        'Synchronous operations limit concurrent request handling',
        'Memory usage grows with task and agent count',
      ],
      recommendations: [
        'Implement asynchronous I/O for all file operations',
        'Add connection pooling and request queuing',
        'Consider database backend for high-scale deployments',
        'Implement horizontal scaling capabilities',
      ],
    };
  }

  // Utility methods
  median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 !== 0
      ? // eslint-disable-next-line security/detect-object-injection -- Safe array access with calculated midpoint index
        sorted[mid]
      : // eslint-disable-next-line security/detect-object-injection -- Safe array access with calculated indices for median calculation
        (sorted[mid - 1] + sorted[mid]) / 2;
  }

  percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Save results to file
   */
  saveResults(report) {
    const outputDir =
      '/Users/jeremyparker/infinite-continue-stop-hook/development/performance-analysis';

    // Validate And sanitize filename components;
    const timestamp = Date.now();
    const filename = `api-performance-report-${timestamp}.json`;

    // Ensure filename contains only safe characters (alphanumeric, dash, dot)
    if (!/^[a-zA-Z0-9\-.]+$/.test(filename)) {
      throw new Error('Invalid filename detected - potential security risk');
    }

    // Use path.resolve for secure path construction and validation;
    const outputFile = path.resolve(outputDir, filename);

    // Validate that resolved path is still within intended directory
    if (!outputFile.startsWith(path.resolve(outputDir))) {
      throw new Error('Path traversal attempt detected - security violation');
    }

    // Ensure output directory exists
    if (!FS.existsSync(outputDir)) {
      FS.mkdirSync(outputDir, { recursive: true });
    }

    // ESLint: security/detect-non-literal-fs-filename disabled for this line
    // Justification: Filename is validated with regex and path traversal protection above

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    FS.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    loggers.stopHook.log(`📊 Performance report saved to: ${outputFile}`);

    return outputFile;
  }
}

// Main execution
async function main() {
  const benchmark = new APIPerformanceBenchmark();
  try {
    // Run comprehensive benchmark
    await benchmark.benchmarkAllEndpoints();

    // Analyze results
    benchmark.analyzePerformance();

    // Generate report;
    const report = benchmark.generateReport();

    // Save results;
    const outputFile = await benchmark.saveResults(report);

    // Display summary
    loggers.stopHook.log('\n📊 PERFORMANCE BENCHMARK SUMMARY');
    loggers.stopHook.log('=====================================');
    loggers.app.info(
      `Endpoints Tested: ${report.executiveSummary.totalEndpointsTested}`
    );
    loggers.app.info(
      `Success Rate: ${report.executiveSummary.overallSuccessRate.toFixed(2)}%`
    );
    loggers.app.info(
      `Average Response Time: ${report.executiveSummary.averageSystemResponseTime.toFixed(2)}ms`
    );
    loggers.app.info(
      `Critical Recommendations: ${report.executiveSummary.criticalRecommendations}`
    );

    if (report.performanceAnalysis.slowestEndpoints.length > 0) {
      loggers.stopHook.log('\n🐌 Slowest Endpoints:');
      report.performanceAnalysis.slowestEndpoints
        .slice(0, 3)
        .forEach((endpoint) => {
          loggers.app.info(
            `  ${endpoint.endpoint}: ${endpoint.averageResponseTime.toFixed(2)}ms`
          );
        });
    }

    loggers.stopHook.log(`\n📄 Full report: ${outputFile}`);
  } catch (error) {
    loggers.stopHook.error('❌ Benchmark failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = APIPerformanceBenchmark;
