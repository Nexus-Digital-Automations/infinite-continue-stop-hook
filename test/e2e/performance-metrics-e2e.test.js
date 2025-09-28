const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// End-to-End tests for complete Performance Metrics system workflow
// Tests the full lifecycle: metrics collection → storage → analysis → trend analysis
describe('Performance Metrics System E2E Tests', () => {
  const mockProjectRoot = '/tmp/test-performance-e2e';
  const taskManagerPath = path.resolve(__dirname, '../../taskmanager-api.js');
  const mockMetricsFile = path.join(
    mockProjectRoot,
    '.validation-performance-enhanced.json',
  );
  const mockTrendsFile = path.join(mockProjectRoot, '.validation-trends.json');

  beforeEach(() => {
    // Create mock directory
    if (!fs.existsSync(mockProjectRoot)) {
      fs.mkdirSync(mockProjectRoot, { recursive: true });
    }

    // Clean up previous test data
    [mockMetricsFile, mockTrendsFile].forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(mockProjectRoot)) {
      fs.rmSync(mockProjectRoot, { recursive: true, force: true });
    }
  });

  function executeTaskManagerCommand(command, args = '', options = {}) {
    try {
      const fullCommand = `timeout 10s node "${taskManagerPath}" --project-root "${mockProjectRoot}" ${command} ${args}`;

      const RESULT = execSync(fullCommand, {
        encoding: 'utf8',
        timeout: 10000,
        ...options,
      });

      return JSON.parse(result.trim());
    } catch {
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout.trim());
        } catch {
          return { success: false, error: error.message, stdout: error.stdout };
        }
      }
      return { success: false, error: error.message };
    }
  }

  function simulateValidationExecutions() {
    const metricsData = {
      version: '2.0.0',
      generatedAt: new Date().toISOString(),
      metrics: [],
    };

    const now = Date.now();
    const criteria = [
      'linter-validation',
      'type-validation',
      'build-validation',
      'test-validation',
      'security-validation',
    ];

    // Simulate 3 weeks of validation executions with realistic patterns
    for (let week = 0; week < 3; week++) {
      for (let day = 0; day < 7; day++) {
        for (let validation = 0; validation < 3; validation++) {
          const timestamp =
            now -
            (week * 7 + day) * 24 * 60 * 60 * 1000 +
            validation * 2 * 60 * 60 * 1000;

          criteria.forEach((criterion) => {
            const baseDuration = {
              'linter-validation': 1200,
              'type-validation': 2800,
              'build-validation': 18000,
              'test-validation': 9500,
              'security-validation': 4200,
            }[criterion];

            // Simulate performance degradation over time for build validation
            const degradationFactor =
              criterion === 'build-validation' ? 1 + week * 0.15 : 1;

            // Add day-of-week patterns (slower on Mondays, faster on Fridays)
            const dayOfWeekFactor = {
              0: 1.0, // Sunday
              1: 1.3, // Monday (slower)
              2: 1.1, // Tuesday
              3: 1.0, // Wednesday
              4: 0.9, // Thursday
              5: 0.8, // Friday (faster)
              6: 0.95, // Saturday
            }[day];

            // Add time-of-day patterns
            const timeOfDayFactor =
              validation === 0 ? 1.2 : validation === 1 ? 1.0 : 0.9;

            // Random variation
            const randomFactor = 0.8 + Math.random() * 0.4;

            const duration = Math.round(
              baseDuration *
                degradationFactor *
                dayOfWeekFactor *
                timeOfDayFactor *
                randomFactor,
            );

            // Simulate occasional anomalies
            const isAnomaly = Math.random() > 0.97;
            const anomalyDuration = isAnomaly
              ? duration * (2 + Math.random() * 3)
              : duration;

            // Simulate success rates (build validation more prone to failures)
            const successRate = {
              'linter-validation': 0.95,
              'type-validation': 0.92,
              'build-validation': 0.85,
              'test-validation': 0.88,
              'security-validation': 0.93,
            }[criterion];

            const success = Math.random() < successRate;

            metricsData.metrics.push({
              criterion,
              timing: {
                startTime: new Date(timestamp).toISOString(),
                endTime: new Date(timestamp + anomalyDuration).toISOString(),
                durationMs: anomalyDuration,
              },
              execution: {
                success,
                exitCode: success ? 0 : 1,
              },
              resources: {
                memoryUsageBefore: {
                  rss: 45000000 + week * 1000000,
                  heapUsed: 28000000 + week * 500000,
                },
                memoryUsageAfter: {
                  rss: 48000000 + week * 1000000 + anomalyDuration / 100,
                  heapUsed: 30000000 + week * 500000 + anomalyDuration / 200,
                },
                cpuUsage: {
                  user: Math.round(anomalyDuration * 800),
                  system: Math.round(anomalyDuration * 200),
                },
              },
              environment: {
                nodeVersion: '18.17.0',
                platform: 'darwin',
                cpuCount: 8,
              },
              ...(isAnomaly && {
                tags: ['anomaly', 'performance_spike'],
              }),
            });
          });
        }
      }
    }

    // Sort by timestamp (most recent first)
    metricsData.metrics.sort(
      (a, b) => new Date(b.timing.startTime) - new Date(a.timing.startTime),
    );

    fs.writeFileSync(mockMetricsFile, JSON.stringify(metricsData, null, 2));
    return metricsData;
  }

  describe('Complete Performance Metrics Workflow', () => {
    test('should handle full workflow from empty state to comprehensive analysis', () => {
      // 1. Initial state - no metrics
      let result = executeTaskManagerCommand(
        'get-validation-performance-metrics',
      );
      expect(result.success).toBe(true);
      expect(result.metrics).toHaveLength(0);
      expect(result.message).toBe('No performance metrics available yet');

      // 2. Simulate metrics collection
      const metricsData = simulateValidationExecutions();
      expect(metricsData.metrics.length).toBeGreaterThan(300); // 3 weeks * 7 days * 3 validations * 5 criteria

      // 3. Basic metrics retrieval
      result = executeTaskManagerCommand('get-validation-performance-metrics');
      expect(result.success).toBe(true);
      expect(result.metrics.length).toBeGreaterThan(300);
      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalMeasurements).toBeGreaterThan(300);

      // 4. Performance bottleneck identification
      result = executeTaskManagerCommand('identify-performance-bottlenecks');
      expect(result.success).toBe(true);
      expect(result.bottlenecks.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);

      // 5. Detailed timing analysis
      result = executeTaskManagerCommand('get-detailed-timing-report');
      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
      expect(result.report.summary.totalValidations).toBeGreaterThan(300);

      // 6. Resource usage analysis
      result = executeTaskManagerCommand('analyze-resource-usage');
      expect(result.success).toBe(true);
      expect(result.resourceAnalysis).toBeDefined();
      expect(result.resourceAnalysis.memory.available).toBe(true);

      // 7. Performance benchmarks
      result = executeTaskManagerCommand('get-performance-benchmarks');
      expect(result.success).toBe(true);
      expect(result.benchmarks).toBeDefined();
      expect(result.benchmarks.by_criterion.length).toBe(5);

      // 8. Comprehensive trend analysis
      result = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":21}\'',
      );
      expect(result.success).toBe(true);
      expect(result.analysis.metadata.totalMetrics).toBeGreaterThan(300);
      expect(result.analysis.overall).toBeDefined();
      expect(result.analysis.byCriterion).toBeDefined();

      // 9. Specific criterion analysis (build validation should show degradation)
      result = executeTaskManagerCommand(
        'analyze-criterion-trend',
        'build-validation',
      );
      expect(result.success).toBe(true);
      expect(result.analysis.criterion).toBe('build-validation');
      expect(result.analysis.trend.direction).toBe('increasing'); // Performance degrading

      // 10. Health score trends
      result = executeTaskManagerCommand('generate-health-score-trends');
      expect(result.success).toBe(true);
      expect(result.healthTrends.data.length).toBeGreaterThan(0);

      // 11. Anomaly detection
      result = executeTaskManagerCommand('detect-performance-anomalies');
      expect(result.success).toBe(true);
      expect(result.anomalies.length).toBeGreaterThan(0); // Should detect the simulated anomalies

      // 12. Seasonality analysis
      result = executeTaskManagerCommand('analyze-seasonality-patterns');
      expect(result.success).toBe(true);
      expect(result.patterns).toBeDefined();
    });

    test('should maintain data consistency across all endpoints', () => {
      simulateValidationExecutions();

      // Get basic metrics count
      const basicMetrics = executeTaskManagerCommand(
        'get-validation-performance-metrics',
      );
      const totalMetrics = basicMetrics.metrics.length;

      // Check That all endpoints see consistent data
      const endpoints = [
        'identify-performance-bottlenecks',
        'get-detailed-timing-report',
        'analyze-resource-usage',
        'get-performance-benchmarks',
      ];

      endpoints.forEach((endpoint) => {
        const RESULT = executeTaskManagerCommand(endpoint);
        expect(result.success).toBe(true);

        // Each endpoint should be working with the same dataset
        if (result.totalDataPoints) {
          expect(result.totalDataPoints).toBe(totalMetrics);
        }
      });
    });

    test('should handle filtering And time ranges consistently', () => {
      simulateValidationExecutions();

      // Test filtering by criterion
      const linterMetrics = executeTaskManagerCommand(
        'get-validation-performance-metrics',
        '\'{"criterion":"linter-validation"}\'',
      );
      expect(linterMetrics.success).toBe(true);
      expect(
        linterMetrics.metrics.every((m) => m.criterion === 'linter-validation'),
      ).toBe(true);

      // Test time range filtering
      const recentMetrics = executeTaskManagerCommand(
        'get-validation-performance-metrics',
        '\'{"timeRange":7}\'', // Last 7 days
      );
      expect(recentMetrics.success).toBe(true);
      expect(recentMetrics.metrics.length).toBeLessThan(
        linterMetrics.metrics.length,
      );

      // Test trend analysis with same time range
      const trendAnalysis = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":7}\'',
      );
      expect(trendAnalysis.success).toBe(true);
      expect(trendAnalysis.analysis.metadata.timeRange.days).toBe(7);
    });
  });

  describe('Performance Under Load', () => {
    test('should handle large datasets efficiently', () => {
      // Create a larger dataset (simulate 2 months of data)
      const largeMetricsData = {
        version: '2.0.0',
        generatedAt: new Date().toISOString(),
        metrics: [],
      };

      const now = Date.now();
      const criteria = [
        'linter-validation',
        'type-validation',
        'build-validation',
        'test-validation',
        'security-validation',
      ];

      // Generate 60 days * 5 criteria * 5 executions per day = 1500 metrics
      for (let day = 0; day < 60; day++) {
        for (let exec = 0; exec < 5; exec++) {
          const timestamp =
            now - day * 24 * 60 * 60 * 1000 + exec * 4 * 60 * 60 * 1000;

          criteria.forEach((criterion) => {
            largeMetricsData.metrics.push({
              criterion,
              timing: {
                startTime: new Date(timestamp).toISOString(),
                endTime: new Date(timestamp + 2000).toISOString(),
                durationMs: 1500 + Math.random() * 1000,
              },
              execution: { success: Math.random() > 0.1 },
              resources: {
                memoryUsageBefore: { rss: 50000000, heapUsed: 30000000 },
                memoryUsageAfter: { rss: 52000000, heapUsed: 31000000 },
              },
            });
          });
        }
      }

      fs.writeFileSync(
        mockMetricsFile,
        JSON.stringify(largeMetricsData, null, 2),
      );

      // Test That analysis completes within reasonable time
      const startTime = Date.now();
      const RESULT = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":60}\'',
      );
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.analysis.metadata.totalMetrics).toBe(1500);
    });

    test('should gracefully handle concurrent access patterns', () => {
      simulateValidationExecutions();

      // Simulate multiple concurrent requests (limited by test environment)
      const commands = [
        'get-validation-performance-metrics',
        'identify-performance-bottlenecks',
        'analyze-performance-trends',
        'generate-health-score-trends',
      ];

      const results = commands.map((command) => {
        return executeTaskManagerCommand(command);
      });

      // All requests should succeed
      results.forEach((result, _index) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Data Quality And Validation', () => {
    test('should handle mixed data quality gracefully', () => {
      // Create dataset with various data quality issues
      const mixedQualityData = {
        version: '2.0.0',
        generatedAt: new Date().toISOString(),
        metrics: [
          // Perfect metric
          {
            criterion: 'linter-validation',
            timing: {
              startTime: '2025-09-27T10:00:00.000Z',
              endTime: '2025-09-27T10:00:01.500Z',
              durationMs: 1500,
            },
            execution: { success: true },
            resources: {
              memoryUsageBefore: { rss: 50000000, heapUsed: 30000000 },
              memoryUsageAfter: { rss: 52000000, heapUsed: 31000000 },
            },
          },
          // Missing end time
          {
            criterion: 'type-validation',
            timing: {
              startTime: '2025-09-27T10:05:00.000Z',
              durationMs: 2500,
            },
            execution: { success: true },
          },
          // Invalid timestamp
          {
            criterion: 'build-validation',
            timing: {
              startTime: 'invalid-timestamp',
              durationMs: 15000,
            },
            execution: { success: false },
          },
          // Missing execution data
          {
            criterion: 'test-validation',
            timing: {
              startTime: '2025-09-27T10:15:00.000Z',
              durationMs: 8000,
            },
          },
          // Negative duration (impossible)
          {
            criterion: 'security-validation',
            timing: {
              startTime: '2025-09-27T10:20:00.000Z',
              durationMs: -1000, // Invalid
            },
            execution: { success: true },
          },
        ],
      };

      fs.writeFileSync(
        mockMetricsFile,
        JSON.stringify(mixedQualityData, null, 2),
      );

      // System should handle gracefully And process valid data
      const RESULT = executeTaskManagerCommand(
        'get-validation-performance-metrics',
      );
      expect(result.success).toBe(true);
      // Should have filtered out invalid metrics
      expect(result.metrics.length).toBeLessThan(5);
    });

    test('should validate feature IDs consistently', () => {
      simulateValidationExecutions();

      const endpointsWithFeatureId = [
        'get-validation-performance-metrics',
        'identify-performance-bottlenecks',
        'get-performance-trends',
        'get-detailed-timing-report',
        'analyze-resource-usage',
        'get-performance-benchmarks',
      ];

      endpointsWithFeatureId.forEach((endpoint) => {
        const RESULT = executeTaskManagerCommand(endpoint);
        expect(result.success).toBe(true);
        expect(result.featureId).toBe('feature_1758946499841_cd5eba625370');
      });
    });
  });

  describe('Progressive Enhancement', () => {
    test('should work with minimal data And improve with more data', () => {
      // Start with minimal data
      const minimalData = {
        version: '2.0.0',
        metrics: [
          {
            criterion: 'linter-validation',
            timing: { startTime: '2025-09-27T10:00:00.000Z', durationMs: 1500 },
            execution: { success: true },
          },
        ],
      };

      fs.writeFileSync(mockMetricsFile, JSON.stringify(minimalData, null, 2));

      // Basic analysis should work
      let result = executeTaskManagerCommand(
        'get-validation-performance-metrics',
      );
      expect(result.success).toBe(true);
      expect(result.metrics.length).toBe(1);

      // Trend analysis should indicate insufficient data
      result = executeTaskManagerCommand('analyze-performance-trends');
      expect(result.success).toBe(true);
      expect(result.analysis.summary).toContain('Insufficient historical data');

      // Add more comprehensive data
      simulateValidationExecutions();

      // Now trend analysis should work fully
      result = executeTaskManagerCommand('analyze-performance-trends');
      expect(result.success).toBe(true);
      expect(result.analysis.metadata.totalMetrics).toBeGreaterThan(300);
      expect(result.analysis.overall).toBeDefined();
    });

    test('should provide increasingly detailed insights with more data', () => {
      // Test with 1 week of data
      const weekData = { version: '2.0.0', metrics: [] };
      const now = Date.now();

      for (let day = 0; day < 7; day++) {
        weekData.metrics.push({
          criterion: 'build-validation',
          timing: {
            startTime: new Date(now - day * 24 * 60 * 60 * 1000).toISOString(),
            durationMs: 15000 + day * 1000, // Linear increase
          },
          execution: { success: true },
        });
      }

      fs.writeFileSync(mockMetricsFile, JSON.stringify(weekData, null, 2));

      let result = executeTaskManagerCommand(
        'analyze-criterion-trend',
        'build-validation',
      );
      expect(result.success).toBe(true);

      const _weeklyTrendStrength = result.analysis.trend.strength;

      // Test with 3 weeks of data (more data points)
      simulateValidationExecutions(); // Creates 3 weeks of data

      result = executeTaskManagerCommand(
        'analyze-criterion-trend',
        'build-validation',
      );
      expect(result.success).toBe(true);

      const _monthlyTrendStrength = result.analysis.trend.strength;

      // More data should generally provide more reliable trend detection
      expect(result.analysis.metadata.totalMetrics).toBeGreaterThan(
        weekData.metrics.length,
      );
    });
  });

  describe('Integration with External Systems', () => {
    test('should maintain compatibility with legacy metrics format', () => {
      // Create legacy format metrics
      const legacyData = {
        metrics: [
          {
            criterion: 'linter-validation',
            startTime: '2025-09-27T10:00:00.000Z',
            endTime: '2025-09-27T10:00:01.500Z',
            durationMs: 1500,
            success: true,
            memoryUsageBefore: { rss: 50000000, heapUsed: 30000000 },
            memoryUsageAfter: { rss: 52000000, heapUsed: 31000000 },
          },
        ],
      };

      const legacyFile = path.join(
        mockProjectRoot,
        '.validation-performance.json',
      );
      fs.writeFileSync(legacyFile, JSON.stringify(legacyData, null, 2));

      // Should work with legacy format
      const RESULT = executeTaskManagerCommand(
        'get-validation-performance-metrics',
      );
      expect(result.success).toBe(true);
      expect(result.metrics.length).toBe(1);
      expect(result.metrics[0].criterion).toBe('linter-validation');
    });

    test('should handle version migration scenarios', () => {
      // Test mixing enhanced And legacy formats
      const enhancedData = {
        version: '2.0.0',
        metrics: [
          {
            criterion: 'type-validation',
            timing: { startTime: '2025-09-27T11:00:00.000Z', durationMs: 2500 },
            execution: { success: true },
          },
        ],
      };

      const legacyData = {
        metrics: [
          {
            criterion: 'build-validation',
            startTime: '2025-09-27T12:00:00.000Z',
            durationMs: 15000,
            success: false,
          },
        ],
      };

      fs.writeFileSync(mockMetricsFile, JSON.stringify(enhancedData, null, 2));
      fs.writeFileSync(
        path.join(mockProjectRoot, '.validation-performance.json'),
        JSON.stringify(legacyData, null, 2),
      );

      const RESULT = executeTaskManagerCommand(
        'get-validation-performance-metrics',
      );
      expect(result.success).toBe(true);
      expect(result.metrics.length).toBe(2); // Should combine both sources
    });
  });
});
