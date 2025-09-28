/**
const { loggers } = require('../lib/logger');
 * Node.js Version Performance Benchmarking Script
 *
 * Comprehensive performance testing across different Node.js versions
 * to validate compatibility And identify optimal version for production.
 *
 * @author Performance Testing Agent
 * @version 2.0.0
 * @since 2025-09-23
 */

const fs = require('fs');
const path = require('path');
const { _execSync, _spawn } = require('child_process');
const os = require('os');
const { createLogger } = require('../lib/utils/logger');

class NodeVersionPerformanceBenchmark {
  constructor() {
    this.logger = createLogger('NodeVersionPerformanceBenchmark', {
      component: 'performance-benchmark',
      logToFile: true,
    });

    this.results = {
      environment: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        cpu_count: os.cpus().length,
        total_memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
        timestamp: new Date().toISOString(),
      },
      benchmarks: {},
      performance_analysis: {},
      recommendations: [],
    };

    this.outputDir = path.join(process.cwd(), 'test-performance');
    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * CPU-intensive benchmark testing V8 performance
   */
  benchmarkCPUIntensive() {
    this.logger.info('Running CPU-intensive benchmark', {
      iterations: 1000000,
      OPERATION 'cpu-benchmark-start',
    });

    const iterations = 1000000;
    const start = process.hrtime.bigint();

    // Mathematical computations
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    }

    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    this.results.benchmarks.cpu_intensive = {
      iterations,
      duration_ms: duration,
      operations_per_second: Math.round(iterations / (duration / 1000)),
      result_hash: Math.round(result % 1000000),
    };

    this.logger.info('CPU benchmark completed', {
      duration_ms: duration.toFixed(2),
      operations_per_second: Math.round(iterations / (duration / 1000)),
      iterations,
      OPERATION 'cpu-benchmark-complete',
    });
  }

  /**
   * Memory allocation And garbage collection benchmark
   */
  benchmarkMemoryOperations() {
    loggers.stopHook.log('🧠 Running memory operations benchmark...');

    const start = process.hrtime.bigint();
    const initialMemory = process.memoryUsage();

    // Memory allocation tests
    const arrays = [];
    for (let i = 0; i < 1000; i++) {
      arrays.push(new Array(1000).fill(Math.random()));
    }

    // JSON serialization/deserialization
    const testObject = {
      data: arrays.slice(0, 100),
      metadata: { timestamp: Date.now(), iteration: 0 },
    };

    for (let i = 0; i < 100; i++) {
      testObject.metadata.iteration = i;
      const serialized = JSON.stringify(testObject);
      const parsed = JSON.parse(serialized);
      if (parsed.metadata.iteration !== i) {
        throw new Error('JSON round-trip failed');
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const end = process.hrtime.bigint();
    const finalMemory = process.memoryUsage();
    const duration = Number(end - start) / 1000000;

    this.results.benchmarks.memory_operations = {
      duration_ms: duration,
      initial_memory_mb: Math.round(initialMemory.heapUsed / 1024 / 1024),
      final_memory_mb: Math.round(finalMemory.heapUsed / 1024 / 1024),
      memory_delta_mb: Math.round(
        (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024
      ),
      arrays_created: arrays.length,
      json_operations: 100,
    };

    loggers.stopHook.log(
      `✅ Memory benchmark completed: ${duration.toFixed(2)}ms`
    );
  }

  /**
   * Asynchronous operations benchmark
   */
  async benchmarkAsyncOperations() {
    loggers.stopHook.log('⚡ Running async operations benchmark...');

    const start = process.hrtime.bigint();

    // Promise-based operations
    const promises = [];
    for (let i = 0; i < 1000; i++) {
      promises.push(
        new Promise((resolve) => {
          setImmediate(() => resolve(i * 2));
        })
      );
    }

    const RESULTS = await Promise.all(promises);

    // Async/await operations
    const asyncOperations = async (count) => {
      const promises = Array.from(
        { length: count },
        (_, i) =>
          new Promise((resolve) => {
            process.nextTick(() => resolve(i));
          })
      );
      return Promise.all(promises);
    };

    const asyncResults = await asyncOperations(500);

    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000;

    this.results.benchmarks.async_operations = {
      duration_ms: duration,
      promise_count: promises.length,
      async_operations: asyncResults.length,
      total_operations: promises.length + asyncResults.length,
    };

    loggers.stopHook.log(
      `✅ Async benchmark completed: ${duration.toFixed(2)}ms`
    );
  }

  /**
   * File system operations benchmark
   */
  async benchmarkFileOperations() {
    loggers.stopHook.log('📁 Running file operations benchmark...');

    const tempDir = path.join(this.outputDir, 'temp-benchmark');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const start = process.hrtime.bigint();

    // File write operations
    const writePromises = [];
    for (let i = 0; i < 100; i++) {
      const filePath = path.join(tempDir, `test-file-${i}.json`);
      const data = JSON.stringify({
        id: i,
        data: new Array(100).fill(i),
        timestamp: Date.now(),
      });

      writePromises.push(fs.promises.writeFile(filePath, data, 'utf8'));
    }

    await Promise.all(writePromises);

    // File read operations
    const files = fs.readdirSync(tempDir);
    const readPromises = files.map((file) =>
      fs.promises.readFile(path.join(tempDir, file), 'utf8')
    );

    const fileContents = await Promise.all(readPromises);

    // Cleanup
    for (const file of files) {
      fs.unlinkSync(path.join(tempDir, file));
    }
    fs.rmdirSync(tempDir);

    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000;

    this.results.benchmarks.file_operations = {
      duration_ms: duration,
      files_written: writePromises.length,
      files_read: fileContents.length,
      total_file_operations: writePromises.length + fileContents.length,
    };

    console.log(
      `✅ File operations benchmark completed: ${duration.toFixed(2)}ms`
    );
  }

  /**
   * Native module performance test
   */
  benchmarkNativeModules() {
    loggers.stopHook.log('🔧 Testing native module performance...');

    const start = process.hrtime.bigint();

    try {
      // Test crypto module (native)
      const crypto = require('crypto');
      const hashes = [];
      for (let i = 0; i < 1000; i++) {
        const hash = crypto.createHash('sha256');
        hash.update(`test-data-${i}`);
        hashes.push(hash.digest('hex'));
      }

      // Test buffer operations
      const buffers = [];
      for (let i = 0; i < 1000; i++) {
        const buffer = Buffer.from(`test-buffer-data-${i}`, 'utf8');
        buffers.push(buffer.toString('base64'));
      }

      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000;

      this.results.benchmarks.native_modules = {
        duration_ms: duration,
        crypto_operations: hashes.length,
        buffer_operations: buffers.length,
        status: 'success',
      };

      console.log(
        `✅ Native modules benchmark completed: ${duration.toFixed(2)}ms`
      );
    } catch (error) {
      this.results.benchmarks.native_modules = {
        duration_ms: 0,
        status: 'failed',
        error: error.message,
      };

      loggers.stopHook.log(
        `❌ Native modules benchmark failed: ${error.message}`
      );
    }
  }

  /**
   * Analyze benchmark results And generate performance insights
   */
  analyzePerformance() {
    loggers.stopHook.log('📊 Analyzing performance results...');

    const totalBenchmarkTime = Object.values(this.results.benchmarks)
      .filter((b) => b.duration_ms)
      .reduce((sum, b) => sum + b.duration_ms, 0);

    this.results.performance_analysis = {
      total_benchmark_time_ms: totalBenchmarkTime,
      node_version: process.version,
      performance_score: this.calculatePerformanceScore(),
      bottlenecks: this.identifyBottlenecks(),
      optimization_opportunities: this.identifyOptimizations(),
    };

    this.generateRecommendations();
  }

  /**
   * Calculate overall performance score (0-100)
   */
  calculatePerformanceScore() {
    const benchmarks = this.results.benchmarks;
    let score = 100;

    // Penalize slow CPU operations (baseline: <1000ms)
    if (
      benchmarks.cpu_intensive &&
      benchmarks.cpu_intensive.duration_ms > 1000
    ) {
      score -= Math.min(
        20,
        (benchmarks.cpu_intensive.duration_ms - 1000) / 100
      );
    }

    // Penalize excessive memory usage
    if (
      benchmarks.memory_operations &&
      benchmarks.memory_operations.memory_delta_mb > 100
    ) {
      score -= Math.min(
        15,
        (benchmarks.memory_operations.memory_delta_mb - 100) / 10
      );
    }

    // Penalize slow async operations (baseline: <500ms)
    if (
      benchmarks.async_operations &&
      benchmarks.async_operations.duration_ms > 500
    ) {
      score -= Math.min(
        15,
        (benchmarks.async_operations.duration_ms - 500) / 50
      );
    }

    // Penalize slow file operations (baseline: <1000ms)
    if (
      benchmarks.file_operations &&
      benchmarks.file_operations.duration_ms > 1000
    ) {
      score -= Math.min(
        10,
        (benchmarks.file_operations.duration_ms - 1000) / 100
      );
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Identify performance bottlenecks
   */
  identifyBottlenecks() {
    const bottlenecks = [];
    const benchmarks = this.results.benchmarks;

    if (benchmarks.cpu_intensive?.duration_ms > 1500) {
      bottlenecks.push({
        category: 'cpu',
        severity: 'high',
        message: 'CPU-intensive operations are slower than expected',
      });
    }

    if (benchmarks.memory_operations?.memory_delta_mb > 200) {
      bottlenecks.push({
        category: 'memory',
        severity: 'medium',
        message: 'High memory allocation detected',
      });
    }

    if (benchmarks.async_operations?.duration_ms > 1000) {
      bottlenecks.push({
        category: 'async',
        severity: 'medium',
        message: 'Async operations are slower than optimal',
      });
    }

    if (benchmarks.native_modules?.status === 'failed') {
      bottlenecks.push({
        category: 'native',
        severity: 'high',
        message: 'Native module operations failed',
      });
    }

    return bottlenecks;
  }

  /**
   * Identify optimization opportunities
   */
  identifyOptimizations() {
    const optimizations = [];
    const benchmarks = this.results.benchmarks;

    if (benchmarks.cpu_intensive?.operations_per_second < 50000) {
      optimizations.push(
        'Consider upgrading to newer Node.js version for V8 improvements'
      );
    }

    if (benchmarks.memory_operations?.memory_delta_mb > 100) {
      optimizations.push(
        'Implement memory pooling or streaming for large data operations'
      );
    }

    if (benchmarks.async_operations?.duration_ms > 750) {
      optimizations.push(
        'Optimize async _operationpatterns And reduce Promise overhead'
      );
    }

    if (benchmarks.file_operations?.duration_ms > 1200) {
      optimizations.push('Consider batch file operations or streaming I/O');
    }

    return optimizations;
  }

  /**
   * Generate version-specific recommendations
   */
  generateRecommendations() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.match(/v(\d+)/)[1]);

    if (majorVersion < 18) {
      this.results.recommendations.push(
        '⚠️ Node.js version below minimum requirement (18.x)'
      );
    } else if (majorVersion === 18) {
      this.results.recommendations.push(
        '✅ Node.js 18.x - Good for production stability'
      );
    } else if (majorVersion === 20) {
      this.results.recommendations.push(
        '🚀 Node.js 20.x LTS - Recommended for production'
      );
    } else if (majorVersion >= 22) {
      this.results.recommendations.push(
        '⚡ Node.js 22.x+ - Latest features And performance'
      );
    }

    const score = this.results.performance_analysis.performance_score;
    if (score >= 90) {
      this.results.recommendations.push(
        '🏆 Excellent performance - optimal for production'
      );
    } else if (score >= 75) {
      this.results.recommendations.push(
        '✅ Good performance - suitable for production'
      );
    } else if (score >= 60) {
      this.results.recommendations.push(
        '⚠️ Fair performance - consider optimizations'
      );
    } else {
      this.results.recommendations.push(
        '❌ Poor performance - requires investigation'
      );
    }
  }

  /**
   * Save results to files
   */
  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(
      this.outputDir,
      `node-performance-${timestamp}.json`
    );
    const latestFile = path.join(
      this.outputDir,
      'latest-node-performance.json'
    );

    // Save detailed results
    fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
    fs.writeFileSync(latestFile, JSON.stringify(this.results, null, 2));

    // Save human-readable report
    const reportFile = path.join(this.outputDir, 'node-performance-report.md');
    const report = this.generateMarkdownReport();
    fs.writeFileSync(reportFile, report);

    loggers.stopHook.log(`📄 Results saved to: ${resultsFile}`);
    loggers.stopHook.log(`📄 Latest results: ${latestFile}`);
    loggers.stopHook.log(`📄 Report: ${reportFile}`);
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport() {
    const env = this.results.environment;
    const analysis = this.results.performance_analysis;

    return `# Node.js Performance Benchmark Report

## Environment
- **Node.js Version**: ${env.node_version}
- **Platform**: ${env.platform} (${env.arch})
- **CPU Cores**: ${env.cpu_count}
- **Total Memory**: ${env.total_memory}
- **Timestamp**: ${env.timestamp}

## Performance Score: ${analysis.performance_score}/100

## Benchmark Results

### CPU-Intensive Operations
- **Duration**: ${this.results.benchmarks.cpu_intensive?.duration_ms?.toFixed(2)}ms
- **Operations/sec**: ${this.results.benchmarks.cpu_intensive?.operations_per_second?.toLocaleString()}

### Memory Operations
- **Duration**: ${this.results.benchmarks.memory_operations?.duration_ms?.toFixed(2)}ms
- **Memory Delta**: ${this.results.benchmarks.memory_operations?.memory_delta_mb}MB
- **Arrays Created**: ${this.results.benchmarks.memory_operations?.arrays_created}

### Async Operations
- **Duration**: ${this.results.benchmarks.async_operations?.duration_ms?.toFixed(2)}ms
- **Total Operations**: ${this.results.benchmarks.async_operations?.total_operations}

### File Operations
- **Duration**: ${this.results.benchmarks.file_operations?.duration_ms?.toFixed(2)}ms
- **Files Processed**: ${this.results.benchmarks.file_operations?.total_file_operations}

### Native Modules
- **Status**: ${this.results.benchmarks.native_modules?.status}
- **Duration**: ${this.results.benchmarks.native_modules?.duration_ms?.toFixed(2)}ms

## Performance Analysis

### Bottlenecks
${analysis.bottlenecks?.map((b) => `- **${b.category}** (${b.severity}): ${b.message}`).join('\n') || 'None identified'}

### Optimization Opportunities
${analysis.optimization_opportunities?.map((o) => `- ${o}`).join('\n') || 'None identified'}

## Recommendations
${this.results.recommendations?.map((r) => `- ${r}`).join('\n')}

---
*Generated by Node.js Performance Benchmark v2.0.0*
`;
  }

  /**
   * Display results summary
   */
  displaySummary() {
    loggers.stopHook.log('\n📊 Performance Benchmark Summary');
    loggers.stopHook.log('================================');
    loggers.stopHook.log(
      `Node.js Version: ${this.results.environment.node_version}`
    );
    loggers.stopHook.log(`Platform: ${this.results.environment.platform}`);
    console.log(
      `Performance Score: ${this.results.performance_analysis.performance_score}/100`
    );

    loggers.stopHook.log('\n🏃 Benchmark Results:');
    Object.entries(this.results.benchmarks).forEach(([name, data]) => {
      if (data.duration_ms) {
        loggers.stopHook.log(`  ${name}: ${data.duration_ms.toFixed(2)}ms`);
      }
    });

    loggers.stopHook.log('\n💡 Recommendations:');
    this.results.recommendations.forEach((rec) => {
      loggers.stopHook.log(`  ${rec}`);
    });
  }

  /**
   * Run complete benchmark suite
   */
  async run() {
    loggers.stopHook.log(
      '🚀 Starting Node.js Performance Benchmark Suite...\n'
    );

    try {
      this.benchmarkCPUIntensive();
      this.benchmarkMemoryOperations();
      await this.benchmarkAsyncOperations();
      await this.benchmarkFileOperations();
      this.benchmarkNativeModules();

      this.analyzePerformance();
      this.saveResults();
      this.displaySummary();

      loggers.stopHook.log('\n✅ Benchmark suite completed successfully!');
    } catch (error) {
      loggers.stopHook.error('❌ Benchmark suite failed:', error.message);
      throw new Error(`Benchmark suite failed: ${error.message}`);
    }
  }
}

// Run benchmark if called directly
if (require.main === module) {
  const benchmark = new NodeVersionPerformanceBenchmark();
  benchmark.run().catch(console.error);
}

module.exports = NodeVersionPerformanceBenchmark;
