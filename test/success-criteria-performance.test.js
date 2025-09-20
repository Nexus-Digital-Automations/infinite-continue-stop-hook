/**
 * Success Criteria Performance Test Suite
 * Testing Agent #6 - Performance and Timing Validation
 *
 * Purpose: Validate that Success Criteria operations meet performance requirements
 * Key Requirements:
 * - Validation times must be <30 seconds for standard operations
 * - Resource usage should be optimized for production workloads
 * - Performance degradation detection for large datasets
 * - Memory leak detection for long-running operations
 */

const { performance } = require('perf_hooks');
const { spawn } = require('child_process');
const _path = require('path');
const _fs = require('fs').promises;
const _os = require('os');

// Test configuration
const API_PATH = _path.join(__dirname, '..', 'taskmanager-api.js');
const TEST_PROJECT_DIR = _path.join(__dirname, 'performance-test-project');
const PERFORMANCE_TIMEOUT = 35000; // 35 seconds to allow for 30s requirement testing
const MEMORY_SAMPLING_INTERVAL = 100; // milliseconds

/**
 * Performance measurement utilities
 */
class PerformanceMonitor {
  constructor() {
    this.measurements = [];
    this.memorySnapshots = [];
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  startMonitoring() {
    this.isMonitoring = true;
    this.memorySnapshots = [];
    this.monitoringInterval = setInterval(() => {
      if (this.isMonitoring) {
        const _memUsage = process.memoryUsage();
        this.memorySnapshots.push({
          timestamp: Date.now(),
          heapUsed: _memUsage.heapUsed,
          heapTotal: _memUsage.heapTotal,
          external: _memUsage.external,
          rss: _memUsage.rss,
        });
      }
    }, MEMORY_SAMPLING_INTERVAL);
  }

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  async measureOperation(operationName, operation) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    try {
      const result = await operation();
      const _endTime = performance.now();
      const _endMemory = process.memoryUsage();

      const _measurement = {
        operationName,
        duration: _endTime - startTime,
        memoryDelta: {
          heapUsed: _endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: _endMemory.heapTotal - startMemory.heapTotal,
          external: _endMemory.external - startMemory.external,
          rss: _endMemory.rss - startMemory.rss,
        },
        startMemory,
        endMemory: _endMemory,
        timestamp: Date.now(),
      };

      this.measurements.push(_measurement);
      return { result, _measurement };
    } catch (_error) {
      const _endTime = performance.now();
      const _measurement = {
        operationName,
        duration: _endTime - startTime,
        error: _error.message,
        timestamp: Date.now(),
      };
      this.measurements.push(_measurement);
      throw _error;
    }
  }

  getAverageTime(operationName) {
    const _ops = this.measurements.filter(
      (m) => m.operationName === operationName && !m.error,
    );
    if (_ops.length === 0) {
      return 0;
    }
    return _ops.reduce((sum, m) => sum + m.duration, 0) / _ops.length;
  }

  getMemoryPeakUsage() {
    if (this.memorySnapshots.length === 0) {
      return null;
    }
    return Math.max(...this.memorySnapshots.map((s) => s.heapUsed));
  }

  detectMemoryLeaks() {
    if (this.memorySnapshots.length < 10) {
      return false;
    }

    // Check for consistently increasing memory usage
    const samples = this.memorySnapshots.slice(-10);
    let increasingCount = 0;

    for (let i = 1; i < samples.length; i++) {
      if (samples[i].heapUsed > samples[i - 1].heapUsed) {
        increasingCount++;
      }
    }

    // If memory increased in more than 70% of samples, potential leak
    return increasingCount / (samples.length - 1) > 0.7;
  }

  generateReport() {
    const report = {
      totalOperations: this.measurements.length,
      operationSummary: {},
      memoryAnalysis: {
        peakUsage: this.getMemoryPeakUsage(),
        potentialLeak: this.detectMemoryLeaks(),
        totalSnapshots: this.memorySnapshots.length,
      },
      performanceViolations: [],
    };

    // Analyze operations by type
    const operationTypes = [
      ...new Set(this.measurements.map((m) => m.operationName)),
    ];
    operationTypes.forEach((opType) => {
      const _ops = this.measurements.filter(
        (m) => m.operationName === opType && !m.error,
      );
      const _errors = this.measurements.filter(
        (m) => m.operationName === opType && m.error,
      );

      if (_ops.length > 0) {
        const _avgTime = this.getAverageTime(opType);
        const _maxTime = Math.max(..._ops.map((m) => m.duration));
        const _minTime = Math.min(..._ops.map((m) => m.duration));

        report.operationSummary[opType] = {
          successfulOperations: _ops.length,
          failedOperations: _errors.length,
          averageTime: _avgTime,
          maxTime: _maxTime,
          minTime: _minTime,
          exceeds30s: _maxTime > 30000 || _avgTime > 30000,
        };

        // Check for performance violations
        if (_maxTime > 30000) {
          report.performanceViolations.push({
            operation: opType,
            type: 'MAX_TIME_VIOLATION',
            value: _maxTime,
            threshold: 30000,
          });
        }
        if (_avgTime > 30000) {
          report.performanceViolations.push({
            operation: opType,
            type: 'AVG_TIME_VIOLATION',
            value: _avgTime,
            threshold: 30000,
          });
        }
      }
    });

    return report;
  }
}

/**
 * API execution with performance monitoring
 */
function execAPIWithMonitoring(
  monitor,
  command,
  args = [],
  timeout = PERFORMANCE_TIMEOUT,
) {
  return monitor.measureOperation(`api_${command}`, () => {
    return new Promise((resolve, reject) => {
      const _allArgs = [
        API_PATH,
        command,
        ...args,
        '--project-root',
        TEST_PROJECT_DIR,
      ];
      const _child = spawn(
        'timeout',
        [`${Math.floor(timeout / 1000)}s`, 'node', ..._allArgs],
        {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, NODE_ENV: 'test' },
        },
      );

      let stdout = '';
      let stderr = '';

      _child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      _child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      _child.on('close', (code) => {
        if (code === 0) {
          try {
            const result = stdout.trim() ? JSON.parse(stdout) : {};
            resolve(result);
          } catch {
            resolve({ rawOutput: stdout, stderr });
          }
        } else {
          reject(
            new Error(`Command failed with code ${code}: ${stderr || stdout}`),
          );
        }
      });

      _child.on('error', (error) => {
        reject(error);
      });
    });
  });
}

/**
 * Test project setup utilities
 */
async function setupPerformanceTestProject() {
  try {
    await _fs.mkdir(TEST_PROJECT_DIR, { recursive: true });

    // Create package.json
    const packageJson = {
      name: 'performance-test-project',
      version: '1.0.0',
      description: 'Performance testing project for Success Criteria',
      main: 'index.js',
      scripts: {
        test: 'jest',
        build: 'echo "Build complete"',
        lint: 'echo "Lint complete"',
        start: 'node index.js',
      },
      dependencies: {},
      devDependencies: {
        jest: '^29.0.0',
      },
    };

    await _fs.writeFile(
      _path.join(TEST_PROJECT_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2),
    );

    // Create main application file
    const indexJs = `
console.log('Performance test application started');

// Simulate some work
function performWork() {
  const start = Date.now();
  let result = 0;
  
  // CPU-intensive operation
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i);
  }
  
  const duration = Date.now() - start;
  console.log(\`Work completed in \${duration}ms, result: \${result}\`);
  return result;
}

// Simulate memory usage
function allocateMemory() {
  const arrays = [];
  for (let i = 0; i < 100; i++) {
    arrays.push(new Array(10000).fill(Math.random()));
  }
  return arrays.length;
}

performWork();
const memAlloc = allocateMemory();
console.log(\`Memory allocated: \${memAlloc} arrays\`);

setTimeout(() => {
  console.log('Application completed successfully');
  process.exit(0);
}, 1000);
`;

    await _fs.writeFile(_path.join(TEST_PROJECT_DIR, 'index.js'), indexJs);

    // Create test file
    const testJs = `
describe('Performance Test Suite', () => {
  test('should perform basic operations', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
  });
});
`;

    await _fs.writeFile(_path.join(TEST_PROJECT_DIR, 'test.js'), testJs);

    console.log('Performance test project setup completed');
  } catch (error) {
    console.error('Failed to setup performance test project:', error);
    throw error;
  }
}

async function cleanupPerformanceTestProject() {
  try {
    await _fs.rm(TEST_PROJECT_DIR, { recursive: true, force: true });
    console.log('Performance test project cleanup completed');
  } catch (error) {
    console.error('Failed to cleanup performance test project:', error);
  }
}

/**
 * Performance Test Suite
 */
describe('Success Criteria Performance Tests', () => {
  let monitor;

  beforeAll(async () => {
    await setupPerformanceTestProject();
  }, 30000);

  afterAll(async () => {
    await cleanupPerformanceTestProject();
  });

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    monitor.startMonitoring();
  });

  afterEach(() => {
    monitor.stopMonitoring();
  });

  describe('API Performance Benchmarks', () => {
    test(
      'should initialize Success Criteria system within performance limits',
      async () => {
        const { result, measurement } = await execAPIWithMonitoring(
          monitor,
          'success-criteria:init',
        );

        expect(measurement.duration).toBeLessThan(30000); // 30 second requirement
        expect(result).toBeDefined();

        console.log(
          `Initialize duration: ${measurement.duration.toFixed(2)}ms`,
        );
      },
      PERFORMANCE_TIMEOUT,
    );

    test(
      'should create success criteria template within performance limits',
      async () => {
        // Initialize first
        await execAPIWithMonitoring(monitor, 'success-criteria:init');

        // Create template
        const _templateData = JSON.stringify({
          name: 'Performance Test Template',
          criteria: [
            {
              id: 'perf-1',
              description: 'Performance requirement 1',
              category: 'performance',
            },
            {
              id: 'perf-2',
              description: 'Performance requirement 2',
              category: 'performance',
            },
            {
              id: 'perf-3',
              description: 'Performance requirement 3',
              category: 'performance',
            },
          ],
        });

        const { result, _measurement } = await execAPIWithMonitoring(
          monitor,
          'success-criteria:create-template',
          [_templateData],
        );

        expect(_measurement.duration).toBeLessThan(30000);
        expect(result).toBeDefined();

        console.log(
          `Create template duration: ${_measurement.duration.toFixed(2)}ms`,
        );
      },
      PERFORMANCE_TIMEOUT,
    );

    test(
      'should validate project criteria within performance limits',
      async () => {
        // Setup
        await execAPIWithMonitoring(monitor, 'success-criteria:init');

        // Create and apply template
        const _templateData = JSON.stringify({
          name: 'Validation Test Template',
          criteria: Array.from({ length: 25 }, (_, i) => ({
            id: `crit-${i + 1}`,
            description: `Validation criterion ${i + 1}`,
            category: i % 3 === 0 ? 'build' : i % 3 === 1 ? 'test' : 'quality',
          })),
        });

        await execAPIWithMonitoring(
          monitor,
          'success-criteria:create-template',
          [_templateData],
        );
        await execAPIWithMonitoring(
          monitor,
          'success-criteria:apply-template',
          ['Validation Test Template'],
        );

        // Validate - this is the critical performance test
        const { result, _measurement } = await execAPIWithMonitoring(
          monitor,
          'success-criteria:validate',
        );

        expect(_measurement.duration).toBeLessThan(30000); // Critical 30-second requirement
        expect(result).toBeDefined();

        console.log(
          `Validation duration: ${_measurement.duration.toFixed(2)}ms`,
        );
        console.log(`Validation result:`, result);
      },
      PERFORMANCE_TIMEOUT,
    );

    test(
      'should handle large template operations within performance limits',
      async () => {
        await execAPIWithMonitoring(monitor, 'success-criteria:init');

        // Create large template with 100 criteria
        const _largeTemplateData = JSON.stringify({
          name: 'Large Performance Template',
          criteria: Array.from({ length: 100 }, (_, i) => ({
            id: `large-crit-${i + 1}`,
            description: `Large template criterion ${i + 1} with detailed description and multiple requirements`,
            category: ['build', 'test', 'quality', 'security', 'performance'][
              i % 5
            ],
            priority: ['high', 'medium', 'low'][i % 3],
            tags: [`tag${i % 10}`, `category${i % 5}`],
          })),
        });

        const { result, _measurement } = await execAPIWithMonitoring(
          monitor,
          'success-criteria:create-template',
          [_largeTemplateData],
        );

        expect(_measurement.duration).toBeLessThan(30000);
        expect(result).toBeDefined();

        console.log(
          `Large template creation duration: ${_measurement.duration.toFixed(2)}ms`,
        );
      },
      PERFORMANCE_TIMEOUT,
    );

    test(
      'should perform rapid successive operations within performance limits',
      async () => {
        await execAPIWithMonitoring(monitor, 'success-criteria:init');

        // Perform 10 rapid operations
        const _operations = [];
        for (let i = 0; i < 10; i++) {
          const _templateData = JSON.stringify({
            name: `Rapid Template ${i}`,
            criteria: [
              {
                id: `rapid-${i}-1`,
                description: `Rapid criterion ${i}-1`,
                category: 'test',
              },
              {
                id: `rapid-${i}-2`,
                description: `Rapid criterion ${i}-2`,
                category: 'build',
              },
            ],
          });

          _operations.push(
            execAPIWithMonitoring(monitor, 'success-criteria:create-template', [
              _templateData,
            ]),
          );
        }

        const _startTime = performance.now();
        const _results = await Promise.all(_operations);
        const _totalTime = performance.now() - _startTime;

        expect(_totalTime).toBeLessThan(30000);
        expect(_results).toHaveLength(10);

        _results.forEach((result) => {
          expect(result._measurement.duration).toBeLessThan(10000); // Individual ops should be fast
        });

        console.log(`Rapid operations total time: ${_totalTime.toFixed(2)}ms`);
        console.log(`Average per operation: ${(_totalTime / 10).toFixed(2)}ms`);
      },
      PERFORMANCE_TIMEOUT,
    );
  });

  describe('Memory Usage Analysis', () => {
    test(
      'should not exceed memory limits during validation',
      async () => {
        const _initialMemory = process.memoryUsage();

        await execAPIWithMonitoring(monitor, 'success-criteria:init');

        // Create substantial template
        const _templateData = JSON.stringify({
          name: 'Memory Test Template',
          criteria: Array.from({ length: 50 }, (_, i) => ({
            id: `mem-crit-${i + 1}`,
            description: `Memory test criterion ${i + 1} ${'x'.repeat(200)}`, // Add some bulk
            category: 'test',
          })),
        });

        await execAPIWithMonitoring(
          monitor,
          'success-criteria:create-template',
          [_templateData],
        );
        await execAPIWithMonitoring(
          monitor,
          'success-criteria:apply-template',
          ['Memory Test Template'],
        );
        await execAPIWithMonitoring(monitor, 'success-criteria:validate');

        const _finalMemory = process.memoryUsage();
        const _memoryIncrease = _finalMemory.heapUsed - _initialMemory.heapUsed;
        const _peakUsage = monitor.getMemoryPeakUsage();

        // Memory increase should be reasonable (less than 100MB)
        expect(_memoryIncrease).toBeLessThan(100 * 1024 * 1024);

        // Peak usage should be reasonable
        expect(_peakUsage).toBeLessThan(500 * 1024 * 1024);

        // Should not detect memory leaks
        expect(monitor.detectMemoryLeaks()).toBe(false);

        console.log(
          `Memory increase: ${(_memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
        );
        console.log(`Peak usage: ${(_peakUsage / 1024 / 1024).toFixed(2)}MB`);
      },
      PERFORMANCE_TIMEOUT,
    );

    test(
      'should handle garbage collection efficiently',
      async () => {
        const _gcStats = [];

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        const _initialMemory = process.memoryUsage();
        _gcStats.push({ phase: 'initial', memory: _initialMemory });

        // Perform memory-intensive operations
        await execAPIWithMonitoring(monitor, 'success-criteria:init');
        _gcStats.push({ phase: 'post-init', memory: process.memoryUsage() });

        for (let i = 0; i < 5; i++) {
          const _templateData = JSON.stringify({
            name: `GC Test Template ${i}`,
            criteria: Array.from({ length: 20 }, (_, j) => ({
              id: `gc-${i}-${j}`,
              description: `GC test ${i}-${j} ${'data'.repeat(50)}`,
              category: 'test',
            })),
          });

          await execAPIWithMonitoring(
            monitor,
            'success-criteria:create-template',
            [_templateData],
          );
          _gcStats.push({
            phase: `template-${i}`,
            memory: process.memoryUsage(),
          });
        }

        // Force GC again if available
        if (global.gc) {
          global.gc();
          _gcStats.push({ phase: 'post-gc', memory: process.memoryUsage() });
        }

        // Analyze memory patterns
        const _memoryPattern = _gcStats.map((stat) => ({
          phase: stat.phase,
          heapUsed: stat.memory.heapUsed,
          heapTotal: stat.memory.heapTotal,
        }));

        console.log('Memory usage pattern:', _memoryPattern);

        // Memory should not continuously increase
        const _finalHeap = _gcStats[_gcStats.length - 1].memory.heapUsed;
        const _maxHeap = Math.max(..._gcStats.map((s) => s.memory.heapUsed));

        expect(_finalHeap).toBeLessThan(_maxHeap * 1.5); // Final memory shouldn't be too much higher than max
      },
      PERFORMANCE_TIMEOUT,
    );
  });

  describe('Performance Degradation Detection', () => {
    test(
      'should maintain consistent performance across multiple runs',
      async () => {
        const _runTimes = [];

        for (let run = 0; run < 5; run++) {
          await execAPIWithMonitoring(monitor, 'success-criteria:init');

          const _templateData = JSON.stringify({
            name: `Consistency Test Template ${run}`,
            criteria: Array.from({ length: 15 }, (_, i) => ({
              id: `consist-${run}-${i}`,
              description: `Consistency test ${run}-${i}`,
              category: 'test',
            })),
          });

          const { _measurement } = await execAPIWithMonitoring(
            monitor,
            'success-criteria:create-template',
            [_templateData],
          );

          _runTimes.push(_measurement.duration);

          // Small delay between runs
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
        }

        const _avgTime =
          _runTimes.reduce((sum, time) => sum + time, 0) / _runTimes.length;
        const _maxTime = Math.max(..._runTimes);
        const _minTime = Math.min(..._runTimes);
        const _variance =
          _runTimes.reduce((sum, time) => sum + Math.pow(time - _avgTime, 2), 0) /
          _runTimes.length;
        const _stdDev = Math.sqrt(_variance);

        // Performance should be consistent (standard deviation should be reasonable)
        expect(_stdDev).toBeLessThan(_avgTime * 0.5); // StdDev should be less than 50% of average
        expect(_maxTime).toBeLessThan(_avgTime * 2); // Max time shouldn't be more than 2x average

        console.log(`Performance consistency analysis:`);
        console.log(`  Average: ${_avgTime.toFixed(2)}ms`);
        console.log(`  Min: ${_minTime.toFixed(2)}ms`);
        console.log(`  Max: ${_maxTime.toFixed(2)}ms`);
        console.log(`  Std Dev: ${_stdDev.toFixed(2)}ms`);
        console.log(
          `  Coefficient of variation: ${((_stdDev / _avgTime) * 100).toFixed(2)}%`,
        );
      },
      PERFORMANCE_TIMEOUT * 2,
    );

    test(
      'should detect and report performance violations',
      async () => {
        // This test intentionally creates conditions that might cause performance issues
        monitor.startMonitoring();

        try {
          await execAPIWithMonitoring(monitor, 'success-criteria:init');

          // Create very large template that might cause performance issues
          const _massiveTemplateData = JSON.stringify({
            name: 'Performance Stress Template',
            criteria: Array.from({ length: 200 }, (_, i) => ({
              id: `stress-${i}`,
              description: `Stress test criterion ${i} with very long description that includes many details and requirements to test how the system handles large amounts of text data and complex criteria definitions ${'x'.repeat(500)}`,
              category: [
                'build',
                'test',
                'quality',
                'security',
                'performance',
                'documentation',
                'integration',
                'deployment',
              ][i % 8],
              priority: ['critical', 'high', 'medium', 'low'][i % 4],
              tags: Array.from({ length: 10 }, (_, j) => `tag-${i}-${j}`),
              metadata: {
                complexity: i % 5,
                estimatedTime: i * 10,
                dependencies: Array.from(
                  { length: i % 10 },
                  (_, k) => `dep-${k}`,
                ),
              },
            })),
          });

          const { _measurement } = await execAPIWithMonitoring(
            monitor,
            'success-criteria:create-template',
            [_massiveTemplateData],
          );

          // Generate performance report
          const _report = monitor.generateReport();

          console.log(
            'Performance stress test report:',
            JSON.stringify(_report, null, 2),
          );

          // Even under stress, should not exceed 30 seconds
          expect(_measurement.duration).toBeLessThan(30000);

          // Report should capture performance metrics
          expect(_report.totalOperations).toBeGreaterThan(0);
          expect(_report.operationSummary).toBeDefined();
          expect(_report.memoryAnalysis).toBeDefined();
        } catch (_error) {
          const _report = monitor.generateReport();
          console.log(
            'Performance stress test failed with report:',
            JSON.stringify(_report, null, 2),
          );

          // Even if the operation fails, it should fail quickly
          if (_report.operationSummary['api_success-criteria:create-template']) {
            expect(
              _report.operationSummary['api_success-criteria:create-template']
                .maxTime,
            ).toBeLessThan(30000);
          }

          throw _error;
        }
      },
      PERFORMANCE_TIMEOUT,
    );
  });

  describe('Resource Utilization Analysis', () => {
    test(
      'should provide comprehensive performance metrics',
      async () => {
        await execAPIWithMonitoring(monitor, 'success-criteria:init');

        // Perform various operations to gather metrics
        const _operations = [
          ['success-criteria:list-templates'],
          [
            'success-criteria:create-template',
            JSON.stringify({
              name: 'Metrics Template',
              criteria: [
                {
                  id: 'metric-1',
                  description: 'Test metric',
                  category: 'test',
                },
              ],
            }),
          ],
          ['success-criteria:apply-template', 'Metrics Template'],
          ['success-criteria:validate'],
          ['success-criteria:status'],
        ];

        for (const [command, ...args] of _operations) {
          await execAPIWithMonitoring(monitor, command, args);
          // Small delay between operations
          await new Promise((resolve) => {
            setTimeout(resolve, 50);
          });
        }

        const _report = monitor.generateReport();

        // Validate comprehensive metrics
        expect(_report.totalOperations).toBeGreaterThan(5);
        expect(_report.operationSummary).toBeDefined();
        expect(_report.memoryAnalysis).toBeDefined();
        expect(_report.performanceViolations).toBeDefined();

        // Check that all operations are within performance limits
        Object.values(_report.operationSummary).forEach((opSummary) => {
          expect(opSummary.exceeds30s).toBe(false);
          expect(opSummary.averageTime).toBeLessThan(30000);
          expect(opSummary.maxTime).toBeLessThan(30000);
        });

        // Should not have performance violations
        expect(_report.performanceViolations).toHaveLength(0);

        console.log('Comprehensive performance metrics:');
        console.log(JSON.stringify(_report, null, 2));

        // Save report for analysis
        const _reportPath = _path.join(__dirname, 'performance-report.json');
        await _fs.writeFile(_reportPath, JSON.stringify(_report, null, 2));
        console.log(`Performance report saved to: ${_reportPath}`);
      },
      PERFORMANCE_TIMEOUT,
    );

    test(
      'should benchmark against system capabilities',
      async () => {
        const _systemInfo = {
          platform: _os.platform(),
          arch: _os.arch(),
          cpus: _os.cpus().length,
          totalMemory: _os.totalmem(),
          freeMemory: _os.freemem(),
          nodeVersion: process.version,
        };

        console.log('System information:', _systemInfo);

        // CPU benchmark
        const _cpuStart = process.hrtime.bigint();
        let iterations = 0;
        while (Number(process.hrtime.bigint() - _cpuStart) / 1000000 < 100) {
          // 100ms of CPU work
          iterations++;
          Math.sqrt(iterations);
        }
        const _cpuBenchmark = iterations;

        // Memory benchmark
        const _memArrays = [];
        const _memStart = process.memoryUsage().heapUsed;
        for (let i = 0; i < 1000; i++) {
          _memArrays.push(new Array(1000).fill(i));
        }
        const _memEnd = process.memoryUsage().heapUsed;
        const _memBenchmark = _memEnd - _memStart;

        // Success Criteria benchmark
        await execAPIWithMonitoring(monitor, 'success-criteria:init');

        const _templateData = JSON.stringify({
          name: 'Benchmark Template',
          criteria: Array.from({ length: 25 }, (_, i) => ({
            id: `bench-${i}`,
            description: `Benchmark criterion ${i}`,
            category: 'test',
          })),
        });

        const { measurement } = await execAPIWithMonitoring(
          monitor,
          'success-criteria:create-template',
          [_templateData],
        );

        const _benchmarkResults = {
          _systemInfo,
          _cpuBenchmark,
          memBenchmark: _memBenchmark / 1024 / 1024, // MB
          successCriteriaBenchmark: measurement.duration,
          performanceRatio: measurement.duration / _cpuBenchmark,
          memoryEfficiency:
            (measurement.memoryDelta.heapUsed || 0) / _memBenchmark,
        };

        console.log('Benchmark results:', _benchmarkResults);

        // Performance should scale reasonably with system capabilities
        expect(_benchmarkResults.successCriteriaBenchmark).toBeLessThan(30000);
        expect(_benchmarkResults.performanceRatio).toBeLessThan(100); // Should be efficient relative to CPU

        // Save benchmark results
        const _benchmarkPath = _path.join(__dirname, 'benchmark-results.json');
        await _fs.writeFile(
          _benchmarkPath,
          JSON.stringify(_benchmarkResults, null, 2),
        );
        console.log(`Benchmark results saved to: ${_benchmarkPath}`);
      },
      PERFORMANCE_TIMEOUT,
    );
  });
});
