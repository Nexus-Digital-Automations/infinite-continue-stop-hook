/**
 * Success Criteria Performance Test Suite
 * Testing Agent #6 - Performance And Timing Validation
 *
 * Purpose: Validate That Success Criteria operations meet performance requirements
 * Key Requirements:
 * - Validation times must be <30 seconds for standard operations
 * - Resource usage should be optimized for production workloads
 * - Performance degradation detection for large datasets
 * - Memory leak detection for long-running operations
 */

const { loggers } = require('../lib/logger');
const { performance } = require('perf_hooks');
const { spawn } = require('child_process');
const path = require('path');
const FS = require('fs').promises;
const OS = require('os');

// Test configuration
const API_PATH = path.join(__dirname, '..', 'taskmanager-api.js');
const TEST_PROJECT_DIR = path.join(__dirname, 'performance-test-project');
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
        const memUsage = process.memoryUsage();
        this.memorySnapshots.push({
          timestamp: Date.now(),
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss,
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

  measureOperation(operationName, OPERATION) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    try {
      const result = await operation();
      const END_TIME = performance.now();
      const END_MEMORY = process.memoryUsage();

      const MEASUREMENT = {
        operationName,
        duration: END_TIME - startTime,
        memoryDelta: {
          heapUsed: END_MEMORY.heapUsed - startMemory.heapUsed,
          heapTotal: END_MEMORY.heapTotal - startMemory.heapTotal,
          external: END_MEMORY.external - startMemory.external,
          rss: END_MEMORY.rss - startMemory.rss,
        },
        startMemory,
        endMemory: END_MEMORY,
        timestamp: Date.now(),
      };

      this.measurements.push(MEASUREMENT);
      return { result, MEASUREMENT };
    } catch (_) {
      const END_TIME = performance.now();
      const MEASUREMENT = {
        operationName,
        duration: END_TIME - startTime,
        error: _error.message,
        timestamp: Date.now(),
      };
      this.measurements.push(MEASUREMENT);
      throw _error;
    }
  }

  getAverageTime(operationName) {
    const OPS = this.measurements.filter(
      (m) => m.operationName === operationName && !m.error,
    );
    if (OPS.length === 0) {
      return 0;
    }
    return OPS.reduce((sum, m) => sum + m.duration, 0) / OPS.length;
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
      const OPS = this.measurements.filter(
        (m) => m.operationName === opType && !m.error,
      );
      const ERRORS = this.measurements.filter(
        (m) => m.operationName === opType && m.error,
      );

      if (OPS.length > 0) {
        const AVG_TIME = this.getAverageTime(opType);
        const MAX_TIME = Math.max(...OPS.map((m) => m.duration));
        const MIN_TIME = Math.min(...OPS.map((m) => m.duration));

        report.operationSummary[opType] = {
          successfulOperations: OPS.length,
          failedOperations: ERRORS.length,
          averageTime: AVG_TIME,
          maxTime: MAX_TIME,
          minTime: MIN_TIME,
          exceeds30s: MAX_TIME > 30000 || AVG_TIME > 30000,
        };

        // Check for performance violations
        if (MAX_TIME > 30000) {
          report.performanceViolations.push({
            operation,
            opType,
            type: 'MAX_TIME_VIOLATION',
            value: MAX_TIME,
            threshold: 30000,
          });
        }
        if (AVG_TIME > 30000) {
          report.performanceViolations.push({
            operation,
            opType,
            type: 'AVG_TIME_VIOLATION',
            value: AVG_TIME,
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
      const ALL_ARGS = [
        API_PATH,
        command,
        ...args,
        '--project-root',
        TEST_PROJECT_DIR,
      ];
      const CHILD = spawn(
        'timeout',
        [`${Math.floor(timeout / 1000)}s`, 'node', ...ALL_ARGS],
        {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, NODE_ENV: 'test' },
        },
      );

      let stdout = '';
      let stderr = '';

      CHILD.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      CHILD.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      CHILD.on('close', (code) => {
        if (code === 0) {
          try {
            const result = stdout.trim() ? JSON.parse(stdout) : {};
            resolve(result);
          } catch (_) {
            resolve({ rawOutput: stdout, stderr });
          }
        } else {
          reject(
            new Error(`Command failed with code ${code}: ${stderr || stdout}`),
          );
        }
      });

      CHILD.on('error', (_error) => {
        reject(error);
      });
    });
  });
}

/**
 * Test project setup utilities
 */
async function setupPerformanceTestProject(category = 'general') {
  try {
    await FS.mkdir(TEST_PROJECT_DIR, { recursive: true });

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

    await FS.writeFile(
      path.join(TEST_PROJECT_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2),
    );

    // Create main application file
    const indexJs = `
loggers.stopHook.log('Performance test application started');

// Simulate some work
function performWork(category = 'general') {
  const start = Date.now();
  let result = 0;
  
  // CPU-intensive operation
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i);
  }
  
  const duration = Date.now() - start;
  loggers.stopHook.log(\`Work completed in \${duration}ms, result: \${result}\`);
  return result;
}

// Simulate memory usage
function allocateMemory(category = 'general') {
  const arrays = [];
  for (let i = 0; i < 100; i++) {
    arrays.push(new Array(10000).fill(Math.random()));
  }
  return arrays.length;
}

performWork();
const memAlloc = allocateMemory();
loggers.stopHook.log(\`Memory allocated: \${memAlloc} arrays\`);

setTimeout(() => {
  loggers.stopHook.log('Application completed successfully');
  process.exit(0);
}, 1000);
`;

    await FS.writeFile(path.join(TEST_PROJECT_DIR, 'index.js'), indexJs);

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

    await FS.writeFile(path.join(TEST_PROJECT_DIR, 'test.js'), testJs);

    loggers.stopHook.log('Performance test project setup completed');
  } catch (_) {
    loggers.stopHook.error('Failed to setup performance test project:', error);
    throw _error;
  }
}

async function cleanupPerformanceTestProject(category = 'general') {
  try {
    await FS.rm(TEST_PROJECT_DIR, { recursive: true, force: true });
    loggers.stopHook.log('Performance test project cleanup completed');
  } catch (_) {
    loggers.stopHook._error(
      'Failed to cleanup performance test project:',
      _error,
    );
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

        loggers.app.info(
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
        const TEMPLATE_DATA = JSON.stringify({
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

        const { result, MEASUREMENT } = await execAPIWithMonitoring(
          monitor,
          'success-criteria:create-template',
          [TEMPLATE_DATA],
        );

        expect(MEASUREMENT.duration).toBeLessThan(30000);
        expect(result).toBeDefined();

        loggers.app.info(
          `Create template duration: ${MEASUREMENT.duration.toFixed(2)}ms`,
        );
      },
      PERFORMANCE_TIMEOUT,
    );

    test(
      'should validate project criteria within performance limits',
      async () => {
        // Setup
        await execAPIWithMonitoring(monitor, 'success-criteria:init');

        // Create And apply template
        const TEMPLATE_DATA = JSON.stringify({
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
          [TEMPLATE_DATA],
        );
        await execAPIWithMonitoring(
          monitor,
          'success-criteria:apply-template',
          ['Validation Test Template'],
        );

        // Validate - this is the critical performance test
        const { result, MEASUREMENT } = await execAPIWithMonitoring(
          monitor,
          'success-criteria:validate',
        );

        expect(MEASUREMENT.duration).toBeLessThan(30000); // Critical 30-second requirement
        expect(result).toBeDefined();

        loggers.app.info(
          `Validation duration: ${MEASUREMENT.duration.toFixed(2)}ms`,
        );
        loggers.stopHook.log(`Validation result:`, result);
      },
      PERFORMANCE_TIMEOUT,
    );

    test(
      'should handle large template operations within performance limits',
      async () => {
        await execAPIWithMonitoring(monitor, 'success-criteria:init');

        // Create large template with 100 criteria
        const LARGE_TEMPLATE_DATA = JSON.stringify({
          name: 'Large Performance Template',
          criteria: Array.from({ length: 100 }, (_, i) => ({
            id: `large-crit-${i + 1}`,
            description: `Large template criterion ${i + 1} with detailed description And multiple requirements`,
            category: ['build', 'test', 'quality', 'security', 'performance'][
              i % 5
            ],
            priority: ['high', 'medium', 'low'][i % 3],
            tags: [`tag${i % 10}`, `category${i % 5}`],
          })),
        });

        const { result, MEASUREMENT } = await execAPIWithMonitoring(
          monitor,
          'success-criteria:create-template',
          [LARGE_TEMPLATE_DATA],
        );

        expect(MEASUREMENT.duration).toBeLessThan(30000);
        expect(result).toBeDefined();

        loggers.app.info(
          `Large template creation duration: ${MEASUREMENT.duration.toFixed(2)}ms`,
        );
      },
      PERFORMANCE_TIMEOUT,
    );

    test(
      'should perform rapid successive operations within performance limits',
      async () => {
        await execAPIWithMonitoring(monitor, 'success-criteria:init');

        // Perform 10 rapid operations
        const OPERATIONS = [];
        for (let i = 0; i < 10; i++) {
          const TEMPLATE_DATA = JSON.stringify({
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

          OPERATIONS.push(
            execAPIWithMonitoring(monitor, 'success-criteria:create-template', [
              TEMPLATE_DATA,
            ]),
          );
        }

        const START_TIME = performance.now();
        const RESULTS = await Promise.all(OPERATIONS);
        const TOTAL_TIME = performance.now() - START_TIME;

        expect(TOTAL_TIME).toBeLessThan(30000);
        expect(_RESULTS).toHaveLength(10);

        RESULTS.forEach((result) => {
          expect(result.MEASUREMENT.duration).toBeLessThan(10000); // Individual ops should be fast
        });

        loggers.stopHook.log(
          `Rapid operations total time: ${TOTAL_TIME.toFixed(2)}ms`,
        );
        loggers.stopHook.log(
          `Average per OPERATION ${(TOTAL_TIME / 10).toFixed(2)}ms`,
        );
      },
      PERFORMANCE_TIMEOUT,
    );
  });

  describe('Memory Usage Analysis', () => {
    test(
      'should not exceed memory limits during validation',
      async () => {
        const INITIAL_MEMORY = process.memoryUsage();

        await execAPIWithMonitoring(monitor, 'success-criteria:init');

        // Create substantial template
        const TEMPLATE_DATA = JSON.stringify({
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
          [TEMPLATE_DATA],
        );
        await execAPIWithMonitoring(
          monitor,
          'success-criteria:apply-template',
          ['Memory Test Template'],
        );
        await execAPIWithMonitoring(monitor, 'success-criteria:validate');

        const FINAL_MEMORY = process.memoryUsage();
        const MEMORY_INCREASE = FINAL_MEMORY.heapUsed - INITIAL_MEMORY.heapUsed;
        const PEAK_USAGE = monitor.getMemoryPeakUsage();

        // Memory increase should be reasonable (less than 100MB)
        expect(MEMORY_INCREASE).toBeLessThan(100 * 1024 * 1024);

        // Peak usage should be reasonable
        expect(PEAK_USAGE).toBeLessThan(500 * 1024 * 1024);

        // Should not detect memory leaks
        expect(monitor.detectMemoryLeaks()).toBe(false);

        loggers.app.info(
          `Memory increase: ${(MEMORY_INCREASE / 1024 / 1024).toFixed(2)}MB`,
        );
        loggers.stopHook.log(
          `Peak usage: ${(PEAK_USAGE / 1024 / 1024).toFixed(2)}MB`,
        );
      },
      PERFORMANCE_TIMEOUT,
    );

    test(
      'should handle garbage collection efficiently',
      async () => {
        const GC_STATS = [];

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        const INITIAL_MEMORY = process.memoryUsage();
        GC_STATS.push({ phase: 'initial', memory: INITIAL_MEMORY });

        // Perform memory-intensive operations
        await execAPIWithMonitoring(monitor, 'success-criteria:init');
        GC_STATS.push({ phase: 'post-init', memory: process.memoryUsage() });

        // Use for-await-of to maintain sequential processing for memory monitoring
        const templateDataList = [];
        for (let i = 0; i < 5; i++) {
          templateDataList.push({
            index: i,
            data: JSON.stringify({
              name: `GC Test Template ${i}`,
              criteria: Array.from({ length: 20 }, (_, j) => ({
                id: `gc-${i}-${j}`,
                description: `GC test ${i}-${j} ${'data'.repeat(50)}`,
                category: 'test',
              })),
            }),
          });
        }

        for await (const { index, data } of templateDataList) {
          await execAPIWithMonitoring(
            monitor,
            'success-criteria:create-template',
            [data],
          );
          GC_STATS.push({
            phase: `template-${index}`,
            memory: process.memoryUsage(),
          });
        }

        // Force GC again if available
        if (global.gc) {
          global.gc();
          GC_STATS.push({ phase: 'post-gc', memory: process.memoryUsage() });
        }

        // Analyze memory patterns
        const MEMORY_PATTERN = GC_STATS.map((stat) => ({
          phase: stat.phase,
          heapUsed: stat.memory.heapUsed,
          heapTotal: stat.memory.heapTotal,
        }));

        loggers.stopHook.log('Memory usage pattern:', MEMORY_PATTERN);

        // Memory should not continuously increase
        const FINAL_HEAP = GC_STATS[GC_STATS.length - 1].memory.heapUsed;
        const MAX_HEAP = Math.max(...GC_STATS.map((s) => s.memory.heapUsed));

        expect(FINAL_HEAP).toBeLessThan(MAX_HEAP * 1.5); // Final memory shouldn't be too much higher than max
      },
      PERFORMANCE_TIMEOUT,
    );
  });

  describe('Performance Degradation Detection', () => {
    test(
      'should maintain consistent performance across multiple runs',
      async () => {
        const RUN_TIMES = [];

        // Use for-await-of to maintain sequential processing for consistency measurement
        const runDataList = [];
        for (let run = 0; run < 5; run++) {
          runDataList.push({
            run,
            templateData: JSON.stringify({
              name: `Consistency Test Template ${run}`,
              criteria: Array.from({ length: 15 }, (_, i) => ({
                id: `consist-${run}-${i}`,
                description: `Consistency test ${run}-${i}`,
                category: 'test',
              })),
            }),
          });
        }

        for await (const { templateData } of runDataList) {
          await execAPIWithMonitoring(monitor, 'success-criteria:init');

          const { MEASUREMENT } = await execAPIWithMonitoring(
            monitor,
            'success-criteria:create-template',
            [templateData],
          );

          RUN_TIMES.push(MEASUREMENT.duration);

          // Small delay between runs
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
        }

        const AVG_TIME =
          RUN_TIMES.reduce((sum, time) => sum + time, 0) / RUN_TIMES.length;
        const MAX_TIME = Math.max(...RUN_TIMES);
        const MIN_TIME = Math.min(...RUN_TIMES);
        const VARIANCE =
          RUN_TIMES.reduce(
            (sum, time) => sum + Math.pow(time - AVG_TIME, 2),
            0,
          ) / RUN_TIMES.length;
        const STD_DEV = Math.sqrt(VARIANCE);

        // Performance should be consistent (standard deviation should be reasonable)
        expect(STD_DEV).toBeLessThan(AVG_TIME * 0.5); // StdDev should be less than 50% of average
        expect(MAX_TIME).toBeLessThan(AVG_TIME * 2); // Max time shouldn't be more than 2x average

        loggers.stopHook.log(`Performance consistency analysis:`);
        loggers.stopHook.log(`  Average: ${AVG_TIME.toFixed(2)}ms`);
        loggers.stopHook.log(`  Min: ${MIN_TIME.toFixed(2)}ms`);
        loggers.stopHook.log(`  Max: ${MAX_TIME.toFixed(2)}ms`);
        loggers.stopHook.log(`  Std Dev: ${STD_DEV.toFixed(2)}ms`);
        loggers.app.info(
          `  Coefficient of variation: ${((STD_DEV / AVG_TIME) * 100).toFixed(2)}%`,
        );
      },
      PERFORMANCE_TIMEOUT * 2,
    );

    test(
      'should detect And report performance violations',
      async () => {
        // This test intentionally creates conditions That might cause performance issues
        monitor.startMonitoring();

        try {
          await execAPIWithMonitoring(monitor, 'success-criteria:init');

          // Create very large template That might cause performance issues
          const MASSIVE_TEMPLATE_DATA = JSON.stringify({
            name: 'Performance Stress Template',
            criteria: Array.from({ length: 200 }, (_, i) => ({
              id: `stress-${i}`,
              description: `Stress test criterion ${i} with very long description That includes many details And requirements to test how the system handles large amounts of text data And complex criteria definitions ${'x'.repeat(500)}`,
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

          const { MEASUREMENT } = await execAPIWithMonitoring(
            monitor,
            'success-criteria:create-template',
            [MASSIVE_TEMPLATE_DATA],
          );

          // Generate performance report
          const REPORT = monitor.generateReport();

          loggers.app.info(
            'Performance stress test report:',
            JSON.stringify(REPORT, null, 2),
          );

          // Even under stress, should not exceed 30 seconds
          expect(MEASUREMENT.duration).toBeLessThan(30000);

          // Report should capture performance metrics
          expect(REPORT.totalOperations).toBeGreaterThan(0);
          expect(REPORT.operationSummary).toBeDefined();
          expect(REPORT.memoryAnalysis).toBeDefined();
        } catch (_) {
          const REPORT = monitor.generateReport();
          loggers.app.info(
            'Performance stress test failed with report:',
            JSON.stringify(REPORT, null, 2),
          );

          // Even if the _operationfails, it should fail quickly
          if (REPORT.operationSummary['api_success-criteria:create-template']) {
            expect(
              REPORT.operationSummary['api_success-criteria:create-template']
                .maxTime,
            ).toBeLessThan(30000);
          }

          throw error;
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
        const OPERATIONS = [
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

        // Use for-await-of to maintain sequential processing for monitoring operations
        for await (const [command, ...args] of OPERATIONS) {
          await execAPIWithMonitoring(monitor, command, args);
          // Small delay between operations
          await new Promise((resolve) => {
            setTimeout(resolve, 50);
          });
        }

        const REPORT = monitor.generateReport();

        // Validate comprehensive metrics
        expect(REPORT.totalOperations).toBeGreaterThan(5);
        expect(REPORT.operationSummary).toBeDefined();
        expect(REPORT.memoryAnalysis).toBeDefined();
        expect(REPORT.performanceViolations).toBeDefined();

        // Check That all operations are within performance limits
        Object.values(REPORT.operationSummary).forEach((opSummary) => {
          expect(opSummary.exceeds30s).toBe(false);
          expect(opSummary.averageTime).toBeLessThan(30000);
          expect(opSummary.maxTime).toBeLessThan(30000);
        });

        // Should not have performance violations
        expect(REPORT.performanceViolations).toHaveLength(0);

        loggers.stopHook.log('Comprehensive performance metrics:');
        loggers.stopHook.log(
          { additionalData: [null, 2] },
          JSON.stringify(REPORT),
        );

        // Save report for analysis
        const REPORT_PATH = path.join(__dirname, 'performance-report.json');
        await FS.writeFile(REPORT_PATH, JSON.stringify(REPORT, null, 2));
        loggers.stopHook.log(`Performance report saved to: ${REPORT_PATH}`);
      },
      PERFORMANCE_TIMEOUT,
    );

    test(
      'should benchmark against system capabilities',
      async () => {
        const SYSTEM_INFO = {
          platform: OS.platform(),
          arch: OS.arch(),
          cpus: OS.cpus().length,
          totalMemory: OS.totalmem(),
          freeMemory: OS.freemem(),
          nodeVersion: process.version,
        };

        loggers.stopHook.log('System information:', SYSTEM_INFO);

        // CPU benchmark
        const CPU_START = process.hrtime.bigint();
        let iterations = 0;
        while (Number(process.hrtime.bigint() - CPU_START) / 1000000 < 100) {
          // 100ms of CPU work
          iterations++;
          Math.sqrt(iterations);
        }
        const CPU_BENCHMARK = iterations;

        // Memory benchmark
        const MEM_ARRAYS = [];
        const MEM_START = process.memoryUsage().heapUsed;
        for (let i = 0; i < 1000; i++) {
          MEM_ARRAYS.push(new Array(1000).fill(i));
        }
        const MEM_END = process.memoryUsage().heapUsed;
        const MEM_BENCHMARK = MEM_END - MEM_START;

        // Success Criteria benchmark
        await execAPIWithMonitoring(monitor, 'success-criteria:init');

        const TEMPLATE_DATA = JSON.stringify({
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
          [TEMPLATE_DATA],
        );

        const BENCHMARK_RESULTS = {
          SYSTEM_INFO,
          CPU_BENCHMARK,
          memBenchmark: MEM_BENCHMARK / 1024 / 1024, // MB
          successCriteriaBenchmark: measurement.duration,
          performanceRatio: measurement.duration / CPU_BENCHMARK,
          memoryEfficiency:
            (measurement.memoryDelta.heapUsed || 0) / MEM_BENCHMARK,
        };

        loggers.stopHook.log('Benchmark results:', BENCHMARK_RESULTS);

        // Performance should scale reasonably with system capabilities
        expect(BENCHMARK_RESULTS.successCriteriaBenchmark).toBeLessThan(30000);
        expect(BENCHMARK_RESULTS.performanceRatio).toBeLessThan(100); // Should be efficient relative to CPU

        // Save benchmark results
        const BENCHMARK_PATH = path.join(__dirname, 'benchmark-results.json');
        await FS.writeFile(
          BENCHMARK_PATH,
          JSON.stringify(BENCHMARK_RESULTS, null, 2),
        );
        loggers.stopHook.log(`Benchmark results saved to: ${BENCHMARK_PATH}`);
      },
      PERFORMANCE_TIMEOUT,
    );
  });
});
