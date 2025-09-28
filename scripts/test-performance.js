/**
 * Test Performance Monitoring Script
 *
 * Comprehensive test execution performance monitoring And analysis.
 * Tracks test execution times, identifies slow tests, And provides optimization insights.
 *
 * @author CI/CD Integration Agent
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { loggers } = require('../lib/logger');

// Configuration
const CONFIG = {
  performance_thresholds: {
    slow_test_warning: 5000, // 5 seconds
    slow_test_critical: 10000, // 10 seconds
    total_suite_warning: 60000, // 1 minute
    total_suite_critical: 180000, // 3 minutes
  },
  monitoring: {
    collect_memory_usage: true,
    collect_cpu_usage: true,
    track_test_parallelization: true,
    identify_bottlenecks: true,
  },
  paths: {
    reports: path.join(process.cwd(), 'test-performance'),
    results: path.join(process.cwd(), 'test-performance', 'results'),
    trends: path.join(process.cwd(), 'test-performance', 'trends.json'),
    summary: path.join(process.cwd(), 'test-performance', 'latest-report.json'),
  },
  output: {
    verbose: process.env.VERBOSE === 'true',
    json_output: process.env.JSON_OUTPUT === 'true',
    ci_mode: process.env.CI === 'true',
  },
};

/**
 * Performance monitoring logger
 */
class PerformanceLogger {
  static info(message) {
    if (!CONFIG.output.ci_mode || CONFIG.output.verbose) {
      loggers.stopHook.log(`⚡ ${message}`);
    }
  }

  static success(message) {
    loggers.stopHook.log(`✅ ${message}`);
  }

  static warning(message) {
    loggers.stopHook.log(`⚠️  ${message}`);
  }

  static error(message) {
    loggers.stopHook.log(`❌ ${message}`);
  }

  static debug(message) {
    if (CONFIG.output.verbose) {
      loggers.stopHook.log(`🐛 DEBUG: ${message}`);
    }
  }

  static metric(name, value, unit = '') {
    loggers.stopHook.log(`📊 ${name}: ${value}${unit}`);
  }
}

/**
 * System resource monitor
 */
class ResourceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.startMemory = process.memoryUsage();
    this.measurements = [];
  }

  /**
   * Start monitoring system resources
   */
  startMonitoring() {
    if (
      !CONFIG.monitoring.collect_memory_usage &&
      !CONFIG.monitoring.collect_cpu_usage
    ) {
      return;
    }

    this.monitoringInterval = setInterval(() => {
      const memory = process.memoryUsage();
      const timestamp = Date.now();

      this.measurements.push({
        timestamp,
        memory: {
          rss: memory.rss,
          heapUsed: memory.heapUsed,
          heapTotal: memory.heapTotal,
          external: memory.external,
        },
        uptime: timestamp - this.startTime,
      });
    }, 1000); // Collect every second
  }

  /**
   * Stop monitoring And return summary
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    const endMemory = process.memoryUsage();
    const totalTime = Date.now() - this.startTime;

    return {
      duration: totalTime,
      memory: {
        start: this.startMemory,
        end: endMemory,
        peak: this.getPeakMemoryUsage(),
        average: this.getAverageMemoryUsage(),
      },
      measurements: this.measurements,
    };
  }

  /**
   * Get peak memory usage
   */
  getPeakMemoryUsage() {
    if (this.measurements.length === 0) {
      return this.startMemory;
    }

    return this.measurements.reduce((peak, current) => {
      if (current.memory.rss > peak.rss) {
        return current.memory;
      }
      return peak;
    }, this.startMemory);
  }

  /**
   * Get average memory usage
   */
  getAverageMemoryUsage() {
    if (this.measurements.length === 0) {
      return this.startMemory;
    }

    const totals = this.measurements.reduce(
      (sum, measurement) => ({
        rss: sum.rss + measurement.memory.rss,
        heapUsed: sum.heapUsed + measurement.memory.heapUsed,
        heapTotal: sum.heapTotal + measurement.memory.heapTotal,
        external: sum.external + measurement.memory.external,
      }),
      { rss: 0, heapUsed: 0, heapTotal: 0, external: 0 }
    );

    const count = this.measurements.length;
    return {
      rss: Math.round(totals.rss / count),
      heapUsed: Math.round(totals.heapUsed / count),
      heapTotal: Math.round(totals.heapTotal / count),
      external: Math.round(totals.external / count),
    };
  }
}

/**
 * Test performance monitor
 */
class TestPerformanceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.testResults = [];
    this.suiteResults = [];
    this.resourceMonitor = new ResourceMonitor();
    this.warnings = [];
    this.errors = [];
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      PerformanceLogger.info('Starting test performance monitoring...');

      this.setupDirectories();
      this.resourceMonitor.startMonitoring();

      await this.runTestSuites();

      const resourceData = this.resourceMonitor.stopMonitoring();
      this.analyzeResults(resourceData);
      this.generateReports();
      this.updateTrends();
      this.generateSummary();

      const duration = Date.now() - this.startTime;
      PerformanceLogger.success(
        `Test performance monitoring completed in ${duration}ms`
      );

      // Exit with appropriate code
      const hasErrors = this.errors.length > 0;
      if (hasErrors) {
        throw new Error('Test performance monitoring completed with errors');
      }
    } catch {
      PerformanceLogger.error(
        `Test performance monitoring failed: ${error.message}`
      );
      PerformanceLogger.debug(error.stack);
      throw error;
    }
  }

  /**
   * Setup required directories
   */
  setupDirectories() {
    PerformanceLogger.debug('Setting up directories...');

    const dirs = [CONFIG.paths.reports, CONFIG.paths.results];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        PerformanceLogger.debug(`Created directory: ${dir}`);
      }
    }
  }

  /**
   * Run test suites And collect performance data
   */
  async runTestSuites() {
    PerformanceLogger.info(
      'Running test suites with performance monitoring...'
    );

    const testCommands = [
      { name: 'API Tests', command: 'npm run test:api', timeout: 60000 },
      {
        name: 'RAG Unit Tests',
        command: 'npm run test:rag:unit',
        timeout: 45000,
      },
      {
        name: 'RAG Integration Tests',
        command: 'npm run test:rag:integration',
        timeout: 120000,
      },
      {
        name: 'RAG Performance Tests',
        command: 'npm run test:rag:performance',
        timeout: 300000,
      },
      { name: 'Full Test Suite', command: 'npm test', timeout: 180000 },
    ];

    for (const testSuite of testCommands) {
      // eslint-disable-next-line no-await-in-loop -- Sequential test execution required
      await this.runTestSuite(testSuite);
    }
  }

  /**
   * Run individual test suite with performance monitoring
   */
  async runTestSuite(testSuite) {
    PerformanceLogger.info(`Running ${testSuite.name}...`);

    const suiteStartTime = Date.now();
    const suiteStartMemory = process.memoryUsage();

    try {
      const _result = await this.executeTestCommand(testSuite);
      const duration = Date.now() - suiteStartTime;
      const endMemory = process.memoryUsage();

      const suiteResult = {
        name: testSuite.name,
        command: testSuite.command,
        duration,
        success: result.success,
        memory: {
          start: suiteStartMemory,
          end: endMemory,
          delta: {
            rss: endMemory.rss - suiteStartMemory.rss,
            heapUsed: endMemory.heapUsed - suiteStartMemory.heapUsed,
          },
        },
        output: result.output,
        timestamp: new Date().toISOString(),
      };

      this.suiteResults.push(suiteResult);

      // Check performance thresholds
      this.checkSuitePerformance(suiteResult);

      PerformanceLogger.success(`${testSuite.name} completed in ${duration}ms`);
    } catch {
      const duration = Date.now() - suiteStartTime;
      PerformanceLogger.error(
        `${testSuite.name} failed after ${duration}ms: ${error.message}`
      );

      this.errors.push({
        suite: testSuite.name,
        error: error.message,
        duration,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Execute test command with timeout And performance monitoring
   */
  executeTestCommand(testSuite) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let output = '';

      const child = spawn('npm', testSuite.command.split(' ').slice(1), {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' },
      });

      child.stdout.on('data', (data) => {
        output += data.toString();
        if (CONFIG.output.verbose) {
          process.stdout.write(data);
        }
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
        if (CONFIG.output.verbose) {
          process.stderr.write(data);
        }
      });

      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Test suite timed out after ${testSuite.timeout}ms`));
      }, testSuite.timeout);

      child.on('close', (code) => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;

        resolve({
          success: code === 0,
          output,
          duration,
          exitCode: code,
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Check suite performance against thresholds
   */
  checkSuitePerformance(suiteResult) {
    const { duration, name } = suiteResult;

    if (duration > CONFIG.performance_thresholds.total_suite_critical) {
      this.errors.push({
        type: 'performance',
        message: `CRITICAL: ${name} took ${duration}ms (>${CONFIG.performance_thresholds.total_suite_critical}ms)`,
        suite: name,
        duration,
      });
    } else if (duration > CONFIG.performance_thresholds.total_suite_warning) {
      this.warnings.push({
        type: 'performance',
        message: `WARNING: ${name} took ${duration}ms (>${CONFIG.performance_thresholds.total_suite_warning}ms)`,
        suite: name,
        duration,
      });
    }
  }

  /**
   * Analyze test results And identify performance issues
   */
  analyzeResults(resourceData) {
    PerformanceLogger.info('Analyzing test performance results...');

    // Calculate total test time
    const totalTestTime = this.suiteResults.reduce(
      (sum, result) => sum + result.duration,
      0
    );

    // Identify slowest tests
    const slowestTests = this.suiteResults
      .filter((result) => result.success)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    // Memory analysis
    const memoryAnalysis = this.analyzeMemoryUsage(resourceData);

    // Parallelization opportunities
    const parallelizationAnalysis = this.analyzeParallelizationOpportunities();

    this.analysis = {
      totalTestTime,
      slowestTests,
      memoryAnalysis,
      parallelizationAnalysis,
      resourceData,
      performance_issues: {
        errors: this.errors.filter((e) => e.type === 'performance'),
        warnings: this.warnings.filter((w) => w.type === 'performance'),
      },
    };

    PerformanceLogger.debug('Performance analysis completed');
  }

  /**
   * Analyze memory usage patterns
   */
  analyzeMemoryUsage(resourceData) {
    const { memory } = resourceData;

    return {
      initial_memory: this.formatBytes(memory.start.rss),
      final_memory: this.formatBytes(memory.end.rss),
      peak_memory: this.formatBytes(memory.peak.rss),
      average_memory: this.formatBytes(memory.average.rss),
      memory_growth: this.formatBytes(memory.end.rss - memory.start.rss),
      heap_utilization: {
        start:
          ((memory.start.heapUsed / memory.start.heapTotal) * 100).toFixed(1) +
          '%',
        end:
          ((memory.end.heapUsed / memory.end.heapTotal) * 100).toFixed(1) + '%',
      },
    };
  }

  /**
   * Analyze test parallelization opportunities
   */
  analyzeParallelizationOpportunities() {
    const serialTime = this.suiteResults.reduce(
      (sum, result) => sum + result.duration,
      0
    );
    const longestSuite = Math.max(...this.suiteResults.map((r) => r.duration));

    const potentialSpeedup =
      serialTime > 0 ? (serialTime / longestSuite).toFixed(2) : 1;

    return {
      current_serial_time: serialTime,
      longest_suite_time: longestSuite,
      potential_speedup: `${potentialSpeedup}x`,
      recommendation:
        potentialSpeedup > 2
          ? 'Consider running test suites in parallel to reduce total execution time'
          : 'Current test execution is reasonably optimized',
    };
  }

  /**
   * Generate comprehensive performance reports
   */
  generateReports() {
    PerformanceLogger.info('Generating performance reports...');

    const report = {
      timestamp: new Date().toISOString(),
      git: this.getGitInfo(),
      execution_summary: {
        total_duration: Date.now() - this.startTime,
        test_suites_run: this.suiteResults.length,
        successful_suites: this.suiteResults.filter((r) => r.success).length,
        failed_suites: this.suiteResults.filter((r) => !r.success).length,
      },
      performance_analysis: this.analysis,
      suite_results: this.suiteResults,
      warnings: this.warnings,
      errors: this.errors,
      environment: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        ci: process.env.CI || false,
        max_old_space_size:
          process.env.NODE_OPTIONS?.includes('max-old-space-size') || 'default',
      },
    };

    // Write detailed report
    fs.writeFileSync(CONFIG.paths.summary, JSON.stringify(report, null, 2));

    // Write individual suite results
    for (const suiteResult of this.suiteResults) {
      const suiteFile = path.join(
        CONFIG.paths.results,
        `${suiteResult.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`
      );
      fs.writeFileSync(suiteFile, JSON.stringify(suiteResult, null, 2));
    }

    PerformanceLogger.success('Performance reports generated');
  }

  /**
   * Update performance trends
   */
  updateTrends() {
    PerformanceLogger.info('Updating performance trends...');

    let trends = [];

    if (fs.existsSync(CONFIG.paths.trends)) {
      try {
        trends = JSON.parse(fs.readFileSync(CONFIG.paths.trends, 'utf8'));
      } catch {
        PerformanceLogger.warning(
          'Could not load existing trends, starting fresh'
        );
      }
    }

    const currentTrend = {
      timestamp: new Date().toISOString(),
      commit: this.getGitInfo().commit,
      total_duration: Date.now() - this.startTime,
      suite_performance: this.suiteResults.map((r) => ({
        name: r.name,
        duration: r.duration,
        success: r.success,
      })),
      memory_peak: this.analysis?.resourceData?.memory?.peak?.rss || 0,
      warnings_count: this.warnings.length,
      errors_count: this.errors.length,
    };

    trends.push(currentTrend);

    // Keep last 50 trend entries
    if (trends.length > 50) {
      trends = trends.slice(-50);
    }

    fs.writeFileSync(CONFIG.paths.trends, JSON.stringify(trends, null, 2));

    PerformanceLogger.success('Performance trends updated');
  }

  /**
   * Generate performance summary
   */
  generateSummary() {
    PerformanceLogger.info('Generating performance summary...');

    const totalDuration = Date.now() - this.startTime;
    const successfulSuites = this.suiteResults.filter((r) => r.success).length;
    const failedSuites = this.suiteResults.filter((r) => !r.success).length;

    loggers.stopHook.log('\n⚡ Test Performance Summary:');
    loggers.stopHook.log(
      '┌─────────────────────────┬──────────────────┬──────────┐'
    );
    loggers.stopHook.log(
      '│ Metric                  │ Value            │ Status   │'
    );
    loggers.stopHook.log(
      '├─────────────────────────┼──────────────────┼──────────┤'
    );

    // Overall metrics
    loggers.stopHook.log(
      `│ Total Execution Time    │ ${this.formatDuration(totalDuration).padEnd(14)} │ ${this.getTimeStatus(totalDuration).padEnd(8)} │`
    );
    loggers.stopHook.log(
      `│ Test Suites Run         │ ${this.suiteResults.length.toString().padEnd(14)} │ ${'ℹ️ Info'.padEnd(8)} │`
    );
    loggers.stopHook.log(
      `│ Successful Suites       │ ${successfulSuites.toString().padEnd(14)} │ ${successfulSuites === this.suiteResults.length ? '✅ Good' : '⚠️ Check'} │`
    );
    loggers.stopHook.log(
      `│ Failed Suites           │ ${failedSuites.toString().padEnd(14)} │ ${failedSuites === 0 ? '✅ Good' : '❌ Bad'} │`
    );

    if (this.analysis) {
      loggers.stopHook.log(
        `│ Peak Memory Usage       │ ${this.analysis.memoryAnalysis.peak_memory.padEnd(14)} │ ${'📊 Info'.padEnd(8)} │`
      );
      loggers.stopHook.log(
        `│ Potential Speedup       │ ${this.analysis.parallelizationAnalysis.potential_speedup.padEnd(14)} │ ${'🚀 Info'.padEnd(8)} │`
      );
    }

    loggers.stopHook.log(
      '└─────────────────────────┴──────────────────┴──────────┘'
    );

    // Slowest tests
    if (this.analysis?.slowestTests?.length > 0) {
      loggers.stopHook.log('\n🐌 Slowest Test Suites:');
      this.analysis.slowestTests.forEach((test, index) => {
        loggers.stopHook.log(
          `${index + 1}. ${test.name}: ${this.formatDuration(test.duration)}`
        );
      });
    }

    // Warnings And errors
    if (this.warnings.length > 0) {
      loggers.stopHook.log(
        `\n⚠️  Performance Warnings: ${this.warnings.length}`
      );
    }

    if (this.errors.length > 0) {
      loggers.stopHook.log(`\n❌ Performance Errors: ${this.errors.length}`);
      this.errors.forEach((error) => {
        loggers.stopHook.log(`   - ${error.message || error.error}`);
      });
    }

    // Recommendations
    if (this.analysis?.parallelizationAnalysis?.recommendation) {
      loggers.stopHook.log(
        `\n💡 Recommendation: ${this.analysis.parallelizationAnalysis.recommendation}`
      );
    }

    loggers.stopHook.log(
      `\n📁 Detailed reports available in: ${CONFIG.paths.reports}`
    );
  }

  /**
   * Get time status based on duration
   */
  getTimeStatus(duration) {
    if (duration > CONFIG.performance_thresholds.total_suite_critical) {
      return '❌ Slow';
    } else if (duration > CONFIG.performance_thresholds.total_suite_warning) {
      return '⚠️ OK';
    } else {
      return '✅ Fast';
    }
  }

  /**
   * Format duration in human readable format
   */
  formatDuration(ms) {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    }
    return `${(ms / 60000).toFixed(1)}m`;
  }

  /**
   * Format bytes in human readable format
   */
  formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) {
      return '0B';
    }
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)}${sizes[i]}`;
  }

  /**
   * Get Git information
   */
  getGitInfo() {
    try {
      return {
        commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        branch: execSync('git rev-parse --abbrev-ref HEAD', {
          encoding: 'utf8',
        }).trim(),
        author: execSync('git log -1 --format="%an"', {
          encoding: 'utf8',
        }).trim(),
      };
    } catch {
      return { commit: 'unknown', branch: 'unknown', author: 'unknown' };
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    loggers.stopHook.log(`
Test Performance Monitor

Usage: node test-performance.js [options]

Options:
  --verbose, -v        Enable verbose output
  --json              Output results in JSON format
  --help, -h          Show this help message

Environment Variables:
  VERBOSE=true        Enable verbose output
  JSON_OUTPUT=true    Output in JSON format
  CI=true            Run in CI mode (less verbose)

Examples:
  node test-performance.js
  VERBOSE=true node test-performance.js
  JSON_OUTPUT=true node test-performance.js > performance-report.json
    `);
    return;
  }

  if (args.includes('--verbose') || args.includes('-v')) {
    CONFIG.output.verbose = true;
  }

  if (args.includes('--json')) {
    CONFIG.output.json_output = true;
  }

  const monitor = new TestPerformanceMonitor();
  monitor.run().catch((error) => {
    PerformanceLogger.error(`Fatal error: ${error.message}`);
    throw error;
  });
}

module.exports = TestPerformanceMonitor;
