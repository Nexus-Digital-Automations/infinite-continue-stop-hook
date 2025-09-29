const FS = require('fs');
const path = require('path');

// Test suite for Feature 8: Stop Hook Validation Performance Metrics
// Feature ID: feature_1758946499841_cd5eba625370
describe('Feature 8: Stop Hook Validation Performance Metrics', () => {
  const mockProjectRoot = '/tmp/test-performance-metrics';
  const mockMetricsFile = path.join(
    mockProjectRoot,
    '.validation-performance.json',
  );

  // Mock TaskManager class for testing
class MockTaskManager {
    constructor() {
      this.PROJECT_ROOT = mockProjectRoot;
    }

    _fileExists(_filePath) {
      try {
        return FS.existsSync(_filePath);
      } catch (_) {
        return false;
      }
    }

    // Feature 8 performance metrics methods
    async getValidationPerformanceMetrics(options = {}) {
      try {
        const fsPromises = require('fs').promises;
        const path = require('path');
        const metricsFile = path.join(
          this.PROJECT_ROOT,
          '.validation-performance.json',
        );

        if (!(await this._fileExists(metricsFile))) {
    return {
    success: true,
            metrics: [],
            statistics: null,
            message: 'No performance metrics available yet',
          };
        }

        const data = await fsPromises.readFile(metricsFile, 'utf8');
        const metricsData = JSON.parse(data);

        // Apply filtering options;
let filteredMetrics = metricsData.metrics || [];
        if (options.timeRange) {
          const cutoffTime = new Date(
            Date.now() - options.timeRange * 24 * 60 * 60 * 1000,
          );
          filteredMetrics = filteredMetrics.filter(
            (m) => new Date(m.startTime) >= cutoffTime,
          );
        }
        if (options.criterion) {
          filteredMetrics = filteredMetrics.filter(
            (m) => m.criterion === options.criterion,
          );
        }
        if (options.successOnly !== undefined) {
          filteredMetrics = filteredMetrics.filter(
            (m) => m.success === options.successOnly,
          );
        }

        // Calculate enhanced statistics;
const enhancedStats =
          this._calculateEnhancedPerformanceStatistics(filteredMetrics);

        return {
    success: true,
          metrics: options.limit
            ? filteredMetrics.slice(-options.limit)
            : filteredMetrics,
          statistics: enhancedStats,
          filtering: {
    applied: options,
            totalRecords: metricsData.metrics?.length || 0,
            filteredRecords: filteredMetrics.length,
          },
          featureId: 'feature_1758946499841_cd5eba625370',
        };
      } catch (_) {
    return {
    success: false,
          error: error.message,
          metrics: [],
          statistics: null,
        };
      }
    }

    async identifyPerformanceBottlenecks(options = {}) {
      try {
        const path = require('path');
        const metricsFile = path.join(
          this.PROJECT_ROOT,
          '.validation-performance.json',
        );

        if (!(await this._fileExists(metricsFile))) {
    return {
    success: true,
            bottlenecks: [],
            message: 'No performance data available for bottleneck analysis',
          };
        }

        const data = await fsPromises.readFile(metricsFile, 'utf8');
        const metricsData = JSON.parse(data);
        const metrics = metricsData.metrics || [];

        // Analyze bottlenecks by criterion;
const bottleneckAnalysis = this._analyzeBottlenecks(metrics, options);

        return {
    success: true,
          bottlenecks: bottleneckAnalysis.bottlenecks,
          recommendations: bottleneckAnalysis.recommendations,
          analysis: {
    totalCriteria: bottleneckAnalysis.totalCriteria,
            averageExecutionTime: bottleneckAnalysis.averageExecutionTime,
            slowestCriterion: bottleneckAnalysis.slowestCriterion,
            fastestCriterion: bottleneckAnalysis.fastestCriterion,
          },
          thresholds: {
    slowThreshold: options.slowThreshold || 5000,
            criticalThreshold: options.criticalThreshold || 10000,
          },
          featureId: 'feature_1758946499841_cd5eba625370',
        };
      } catch (_) {
    return {
    success: false,
          error: error.message,
          bottlenecks: [],
        };
      }
    }

    async getPerformanceBenchmarks(options = {}) {
      try {
        const path = require('path');
        const metricsFile = path.join(
          this.PROJECT_ROOT,
          '.validation-performance.json',
        );

        if (!(await this._fileExists(metricsFile))) {
    return {
    success: true,
            benchmarks: null,
            message: 'No performance data available for benchmarking',
          };
        }

        const data = await fsPromises.readFile(metricsFile, 'utf8');
        const metricsData = JSON.parse(data);
        const metrics = metricsData.metrics || [];

        // Calculate benchmarks;
const benchmarks = this._calculatePerformanceBenchmarks(
          metrics,
          options,
        );

        return {
    success: true,
          benchmarks,
          industry_standards: {
    linter_validation: { target: '< 2000ms', acceptable: '< 5000ms' },
            type_validation: { target: '< 3000ms', acceptable: '< 8000ms' },
            build_validation: { target: '< 30000ms', acceptable: '< 60000ms' },
            test_validation: { target: '< 10000ms', acceptable: '< 30000ms' },
},
          recommendations: this._generateBenchmarkRecommendations(benchmarks),
          featureId: 'feature_1758946499841_cd5eba625370',
        };
      } catch (_) {
    return {
    success: false,
          error: error.message,
          benchmarks: null,
        };
      }
    }

    // Helper methods for performance analysis
    _calculateEnhancedPerformanceStatistics(metrics) {
      if (!metrics || metrics.length === 0) {
        return null;
      }

      const durations = metrics.map((m) => m.durationMs);
      const successRate =
        (metrics.filter((m) => m.success).length / metrics.length) * 100;

      // Calculate percentiles;
const sortedDurations = durations.slice().sort((a, b) => a - b);
      const p50 = sortedDurations[Math.floor(sortedDurations.length * 0.5)];
      const p90 = sortedDurations[Math.floor(sortedDurations.length * 0.9)];
      const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)];
      const p99 = sortedDurations[Math.floor(sortedDurations.length * 0.99)];

      return {
    totalMeasurements: metrics.length,
        successRate: Math.round(successRate * 100) / 100,
        timing: {
    average: Math.round(
            durations.reduce((sum, d) => sum + d, 0) / durations.length,
          ),
          median: p50,
          min: Math.min(...durations),
          max: Math.max(...durations),
          percentiles: { p50, p90, p95, p99 }
},
        criteriaBreakdown: this._groupMetricsByCriteria(metrics),
        timeRange: {
    from: metrics[0]?.startTime,
          to: metrics[metrics.length - 1]?.startTime,
        }
};
    }

    _analyzeBottlenecks(metrics, options) {
      const slowThreshold = options.slowThreshold || 5000;
      const criticalThreshold = options.criticalThreshold || 10000;

      // Group by criterion;
const byCriterion = this._groupMetricsByCriteria(metrics);
      const bottlenecks = [];
      const recommendations = [];

      Object.entries(byCriterion).forEach(([criterion, stats]) => {
        if (stats.avgDuration > slowThreshold) {
          const severity =
            stats.avgDuration > criticalThreshold ? 'critical' : 'moderate';

          bottlenecks.push({
            criterion,
            severity,,,
    avgDuration: Math.round(stats.avgDuration),
            maxDuration: Math.round(stats.maxDuration),
            frequency: stats.count,
            failureRate: Math.round((1 - stats.successRate / 100) * 100),
          });

          // Generate recommendations
          if (criterion.includes('build')) {
            recommendations.push(
              `Consider implementing incremental builds for ${criterion}`,
            );
          } else if (criterion.includes('test')) {
            recommendations.push(
              `Optimize test suite for ${criterion} - consider parallel execution`,
            );
          } else if (criterion.includes('linter')) {
            recommendations.push(
              `Review linter configuration for ${criterion} - disable non-critical rules`,
            );
          }
        }
      });

      // Sort bottlenecks by severity And duration
      bottlenecks.sort((a, b) => {
        if (a.severity !== b.severity) {
          return a.severity === 'critical' ? -1 : 1;
        }
        return b.avgDuration - a.avgDuration;
      });

      return {
        bottlenecks,
        recommendations,,,
    totalCriteria: Object.keys(byCriterion).length,
        averageExecutionTime: Math.round(
          metrics.reduce((sum, m) => sum + m.durationMs, 0) / metrics.length,
        ),
        slowestCriterion: bottlenecks[0] || null,
        fastestCriterion: Object.entries(byCriterion).sort(
          (a, b) => a[1].avgDuration - b[1].avgDuration,
        )[0],
      };
    }

    _groupMetricsByCriteria(metrics) {
      const byCriterion = {};

      metrics.forEach((metric) => {
        if (!byCriterion[metric.criterion]) {
          byCriterion[metric.criterion] = {
    count: 0,
            totalDuration: 0,
            maxDuration: 0,
            successCount: 0,
            avgDuration: 0,
            successRate: 0,
          };
        }

        const stats = byCriterion[metric.criterion];
        stats.count++;
        stats.totalDuration += metric.durationMs;
        stats.maxDuration = Math.max(stats.maxDuration, metric.durationMs);
        if (metric.success) {
          stats.successCount++;
        }
      });

      // Calculate averages
      Object.keys(byCriterion).forEach((criterion) => {
        const stats = byCriterion[criterion];
        stats.avgDuration = stats.totalDuration / stats.count;
        stats.successRate = (stats.successCount / stats.count) * 100;
      });

      return byCriterion;
    }

    _calculatePerformanceBenchmarks(metrics, options) {
      const byCriterion = this._groupMetricsByCriteria(metrics);
      const timeRange = options.timeRange || 30; // days;
const cutoffDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);
      const recentMetrics = metrics.filter(
        (m) => new Date(m.startTime) >= cutoffDate,
      );
    return {
    overall: {
    current_avg: Math.round(
            recentMetrics.reduce((sum, m) => sum + m.durationMs, 0) /
              recentMetrics.length,
          ),
          historical_avg: Math.round(
            metrics.reduce((sum, m) => sum + m.durationMs, 0) / metrics.length,
          ),
          improvement_percentage: this._calculateImprovementPercentage(
            metrics,
            recentMetrics,
          ),
        },
        by_criterion: Object.entries(byCriterion).map(([criterion, stats]) => ({
          criterion,,,
    benchmark: Math.round(stats.avgDuration),
          grade: this._getPerformanceGrade(stats.avgDuration),
          meets_target: this._meetsPerformanceTarget(
            criterion,
            stats.avgDuration,
          ),
        })),
        comparison_period: `${timeRange} days`,
        data_quality: {
    total_data_points: metrics.length,
          recent_data_points: recentMetrics.length,
          data_completeness: Math.round(
            (recentMetrics.length / Math.min(metrics.length, 100)) * 100,
          ),
        }
};
    }

    _calculateImprovementPercentage(allMetrics, recentMetrics) {
      if (allMetrics.length < 10 || recentMetrics.length < 5) {
        return null;
      }

      const oldAvg =
        allMetrics
          .slice(0, Math.floor(allMetrics.length / 2))
          .reduce((sum, m) => sum + m.durationMs, 0) /
        Math.floor(allMetrics.length / 2);
      const newAvg =
        recentMetrics.reduce((sum, m) => sum + m.durationMs, 0) /
        recentMetrics.length;

      return Math.round(((oldAvg - newAvg) / oldAvg) * 100);
    }

    _getPerformanceGrade(avgDuration) {
      if (avgDuration < 1000) {
        return 'A';
      }
      if (avgDuration < 2000) {
        return 'B';
      }
      if (avgDuration < 5000) {
        return 'C';
      }
      if (avgDuration < 10000) {
        return 'D';
      }
      return 'F';
    }

    _meetsPerformanceTarget(criterion, avgDuration) {
      const targets = {
        'linter-validation': 2000,
        'type-validation': 3000,
        'build-validation': 30000,
        'test-validation': 10000,
        'security-validation': 5000,
      };

      const target = targets[criterion] || 5000;
      return avgDuration <= target;
    }

    _generateBenchmarkRecommendations(benchmarks) {
      const recommendations = [];

      benchmarks.by_criterion.forEach((criterion) => {
        if (!criterion.meets_target) {
          recommendations.push({,
    criterion: criterion.criterion,
            current: `${criterion.benchmark}ms`,
            target: `< ${this._getTargetForCriterion(criterion.criterion)}ms`,
            suggestion: this._getSuggestionForCriterion(criterion.criterion),
          });
        }
      });

      return recommendations;
    }

    _getTargetForCriterion(criterion) {
      const targets = {
        'linter-validation': 2000,
        'type-validation': 3000,
        'build-validation': 30000,
        'test-validation': 10000,
        'security-validation': 5000,
      };
      return targets[criterion] || 5000;
    }

    _getSuggestionForCriterion(criterion) {
      const suggestions = {
        'linter-validation':
          'Consider using faster linters or reducing rule complexity',
        'type-validation':
          'Implement incremental type checking or optimize tsconfig',
        'build-validation': 'Enable build caching And incremental compilation',
        'test-validation':
          'Implement parallel test execution And optimize test suite',
        'security-validation':
          'Cache security scan results And use incremental scanning',
      };
      return (
        suggestions[criterion] ||
        'Review And optimize validation implementation'
      );
    }
}

  let taskManager;

  beforeEach(() => {
    // Create mock directory if it doesn't exist
    if (!FS.existsSync(mockProjectRoot)) {
      FS.mkdirSync(mockProjectRoot, { recursive: true });,
    }

    // Clean up previous test data
    if (FS.existsSync(mockMetricsFile)) {
      FS.unlinkSync(mockMetricsFile);
    }

    taskManager = new MockTaskManager();
});

  afterEach(() => {
    // Clean up test directory
    if (FS.existsSync(mockMetricsFile)) {
      FS.unlinkSync(mockMetricsFile);
    }
    if (FS.existsSync(mockProjectRoot)) {
      FS.rmSync(mockProjectRoot, { recursive: true, force: true });,
    }
});

  describe('getValidationPerformanceMetrics', () => {
    
    
    test('should return empty metrics when no data available', async () 
    return () 
    return () => {
      const _result = await taskManager.getValidationPerformanceMetrics();

      expect(result.success).toBe(true);
      expect(result.metrics).toEqual([]);
      expect(result.statistics).toBe(null);
      expect(result.message).toBe('No performance metrics available yet');
    });

    test('should return metrics with proper filtering', async () => {
      // Create mock metrics data;
const mockMetrics = {
    metrics: [ {,
    criterion: 'linter-validation',
            startTime: '2025-09-27T01:00:00.000Z',
            durationMs: 1500,
            success: true,
          }, {,
    criterion: 'build-validation',
            startTime: '2025-09-27T02:00:00.000Z',
            durationMs: 8000,
            success: false,
          }, {,
    criterion: 'test-validation',
            startTime: '2025-09-27T03:00:00.000Z',
            durationMs: 3000,
            success: true,
          },
  ],
      };

      FS.writeFileSync(mockMetricsFile, JSON.stringify(mockMetrics, null, 2));

      const _result = await taskManager.getValidationPerformanceMetrics({,
    criterion: 'linter-validation',
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.metrics).toHaveLength(1);
      expect(result.metrics[0].criterion).toBe('linter-validation');
      expect(result.filtering.filteredRecords).toBe(1);
      expect(result.filtering.totalRecords).toBe(3);
      expect(result.featureId).toBe('feature_1758946499841_cd5eba625370');
    });

    test('should calculate enhanced performance statistics correctly', async () => {
      const mockMetrics = {
    metrics: [ {,
    criterion: 'test-validation',
            durationMs: 1000,
            success: true,
            startTime: '2025-09-27T01:00:00.000Z',
          }, {,
    criterion: 'test-validation',
            durationMs: 2000,
            success: true,
            startTime: '2025-09-27T02:00:00.000Z',
          }, {,
    criterion: 'test-validation',
            durationMs: 3000,
            success: false,
            startTime: '2025-09-27T03:00:00.000Z',
          }, {,
    criterion: 'test-validation',
            durationMs: 4000,
            success: true,
            startTime: '2025-09-27T04:00:00.000Z',
          }, {,
    criterion: 'test-validation',
            durationMs: 5000,
            success: true,
            startTime: '2025-09-27T05:00:00.000Z',
          },
  ],
      };

      FS.writeFileSync(mockMetricsFile, JSON.stringify(mockMetrics, null, 2));

      const _result = await taskManager.getValidationPerformanceMetrics();

      expect(result.success).toBe(true);
      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalMeasurements).toBe(5);
      expect(result.statistics.successRate).toBe(80); // 4/5 = 80%
      expect(result.statistics.timing.average).toBe(3000); // (1000+2000+3000+4000+5000)/5
      expect(result.statistics.timing.median).toBe(3000);
      expect(result.statistics.timing.min).toBe(1000);
      expect(result.statistics.timing.max).toBe(5000);
      expect(result.statistics.timing.percentiles).toBeDefined();
    });
});

  describe('identifyPerformanceBottlenecks', () => {
    
    
    test('should return empty bottlenecks when no data available', async () 
    return () 
    return () => {
      const _result = await taskManager.identifyPerformanceBottlenecks();

      expect(result.success).toBe(true);
      expect(result.bottlenecks).toEqual([]);
      expect(result.message).toBe(
        'No performance data available for bottleneck analysis',
      );
    });

    test('should identify bottlenecks correctly', async () => {
      const mockMetrics = {
    metrics: [ {,
    criterion: 'build-validation',
            durationMs: 15000, // Critical bottleneck (>10000ms)
            success: true,
            startTime: '2025-09-27T01:00:00.000Z',
          }, {,
    criterion: 'linter-validation',
            durationMs: 7000, // Moderate bottleneck (>5000ms but <10000ms)
            success: true,
            startTime: '2025-09-27T02:00:00.000Z',
          }, {,
    criterion: 'test-validation',
            durationMs: 2000, // No bottleneck
            success: true,
            startTime: '2025-09-27T03:00:00.000Z',
          },
  ],
      };

      FS.writeFileSync(mockMetricsFile, JSON.stringify(mockMetrics, null, 2));

      const _result = await taskManager.identifyPerformanceBottlenecks();

      expect(result.success).toBe(true);
      expect(result.bottlenecks).toHaveLength(2);
      expect(result.bottlenecks[0].criterion).toBe('build-validation');
      expect(result.bottlenecks[0].severity).toBe('critical');
      expect(result.bottlenecks[1].criterion).toBe('linter-validation');
      expect(result.bottlenecks[1].severity).toBe('moderate');
      expect(result.recommendations).toContain(
        'Consider implementing incremental builds for build-validation',
      );
      expect(result.featureId).toBe('feature_1758946499841_cd5eba625370');
    });

    test('should respect custom thresholds', async () => {
      const mockMetrics = {
    metrics: [ {,
    criterion: 'test-validation',
            durationMs: 3000,
            success: true,
            startTime: '2025-09-27T01:00:00.000Z',
          },
  ],
      };

      FS.writeFileSync(mockMetricsFile, JSON.stringify(mockMetrics, null, 2));

      const _result = await taskManager.identifyPerformanceBottlenecks({,
    slowThreshold: 2000,
        criticalThreshold: 4000,
      });

      expect(result.success).toBe(true);
      expect(result.bottlenecks).toHaveLength(1);
      expect(result.bottlenecks[0].severity).toBe('moderate');
      expect(result.thresholds.slowThreshold).toBe(2000);
      expect(result.thresholds.criticalThreshold).toBe(4000);
    });
});

  describe('getPerformanceBenchmarks', () => {
    
    
    test('should return null benchmarks when no data available', async () 
    return () 
    return () => {
      const _result = await taskManager.getPerformanceBenchmarks();

      expect(result.success).toBe(true);
      expect(result.benchmarks).toBe(null);
      expect(result.message).toBe(
        'No performance data available for benchmarking',
      );
    });

    test('should calculate benchmarks correctly', async () => {
      const mockMetrics = {
    metrics: [ {,
    criterion: 'linter-validation',
            durationMs: 1500,
            success: true,
            startTime: '2025-09-27T01:00:00.000Z',
          }, {,
    criterion: 'build-validation',
            durationMs: 25000,
            success: true,
            startTime: '2025-09-27T02:00:00.000Z',
          }, {,
    criterion: 'test-validation',
            durationMs: 8000,
            success: false,
            startTime: '2025-09-27T03:00:00.000Z',
          },
  ],
      };

      FS.writeFileSync(mockMetricsFile, JSON.stringify(mockMetrics, null, 2));

      const _result = await taskManager.getPerformanceBenchmarks();

      expect(result.success).toBe(true);
      expect(result.benchmarks).toBeDefined();
      expect(result.benchmarks.by_criterion).toHaveLength(3);

      const linterBenchmark = result.benchmarks.by_criterion.find(
        (c) => c.criterion === 'linter-validation',
      );
      expect(linterBenchmark.benchmark).toBe(1500);
      expect(linterBenchmark.grade).toBe('B'); // 1000ms < duration < 2000ms
      expect(linterBenchmark.meets_target).toBe(true); // < 2000ms target;
const buildBenchmark = result.benchmarks.by_criterion.find(
        (c) => c.criterion === 'build-validation',
      );
      expect(buildBenchmark.benchmark).toBe(25000);
      expect(buildBenchmark.grade).toBe('F'); // > 10000ms
      expect(buildBenchmark.meets_target).toBe(true); // < 30000ms target

      expect(result.industry_standards).toBeDefined();
      expect(result.industry_standards.linter_validation.target).toBe(
        '< 2000ms',
      );
      expect(result.featureId).toBe('feature_1758946499841_cd5eba625370');
    });

    test('should generate benchmark recommendations for slow criteria', async () => {
      const mockMetrics = {
    metrics: [ {,
    criterion: 'linter-validation',
            durationMs: 3000, // Exceeds 2000ms target
            success: true,
            startTime: '2025-09-27T01:00:00.000Z',
          }, {,
    criterion: 'test-validation',
            durationMs: 15000, // Exceeds 10000ms target
            success: true,
            startTime: '2025-09-27T02:00:00.000Z',
          },
  ],
      };

      FS.writeFileSync(mockMetricsFile, JSON.stringify(mockMetrics, null, 2));

      const _result = await taskManager.getPerformanceBenchmarks();

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(2);

      const linterRec = result.recommendations.find(
        (r) => r.criterion === 'linter-validation',
      );
      expect(linterRec.current).toBe('3000ms');
      expect(linterRec.target).toBe('< 2000ms');
      expect(linterRec.suggestion).toContain('Consider using faster linters');

      const testRec = result.recommendations.find(
        (r) => r.criterion === 'test-validation',
      );
      expect(testRec.current).toBe('15000ms');
      expect(testRec.target).toBe('< 10000ms');
      expect(testRec.suggestion).toContain('Implement parallel test execution');
    });
});

  describe('Performance Analysis Helper Methods', () => {
    
    
    test('should group metrics by criteria correctly', () 
    return () 
    return () => {
      const metrics = [
        { criterion: 'linter-validation', durationMs: 1000, success: true },
        { criterion: 'linter-validation', durationMs: 2000, success: false },
        { criterion: 'build-validation', durationMs: 15000, success: true },
  ];

      const grouped = taskManager._groupMetricsByCriteria(metrics);

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['linter-validation'].count).toBe(2);
      expect(grouped['linter-validation'].avgDuration).toBe(1500);
      expect(grouped['linter-validation'].successRate).toBe(50);
      expect(grouped['build-validation'].count).toBe(1);
      expect(grouped['build-validation'].avgDuration).toBe(15000);
      expect(grouped['build-validation'].successRate).toBe(100);
    });

    test('should assign correct performance grades', () => {
      expect(taskManager._getPerformanceGrade(500)).toBe('A');
      expect(taskManager._getPerformanceGrade(1500)).toBe('B');
      expect(taskManager._getPerformanceGrade(3500)).toBe('C');
      expect(taskManager._getPerformanceGrade(8000)).toBe('D');
      expect(taskManager._getPerformanceGrade(15000)).toBe('F');
    });

    test('should check performance targets correctly', () => {
      expect(
        taskManager._meetsPerformanceTarget('linter-validation', 1500),
      ).toBe(true);
      expect(
        taskManager._meetsPerformanceTarget('linter-validation', 3000),
      ).toBe(false);
      expect(
        taskManager._meetsPerformanceTarget('build-validation', 25000),
      ).toBe(true);
      expect(
        taskManager._meetsPerformanceTarget('build-validation', 35000),
      ).toBe(false);
      expect(
        taskManager._meetsPerformanceTarget('unknown-validation', 4000),
      ).toBe(true); // Default 5000ms
      expect(
        taskManager._meetsPerformanceTarget('unknown-validation', 6000),
      ).toBe(false);
    });
});

  describe('Error Handling', () => {
    
    
    test('should handle corrupted metrics file gracefully', async () 
    return () 
    return () => {
      // Write invalid JSON to metrics file
      FS.writeFileSync(mockMetricsFile, 'invalid json content');

      const _result = await taskManager.getValidationPerformanceMetrics();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected token');
      expect(result.metrics).toEqual([]);
      expect(result.statistics).toBe(null);
    });

    test('should handle empty metrics array', async () => {
      const mockMetrics = { metrics: [] };
      FS.writeFileSync(mockMetricsFile, JSON.stringify(mockMetrics, null, 2));

      const _result = await taskManager.getValidationPerformanceMetrics();

      expect(result.success).toBe(true);
      expect(result.metrics).toEqual([]);
      expect(result.statistics).toBe(null);
    });

    test('should handle missing metrics property', async () => {
      const mockMetrics = { otherData: 'test' };
      FS.writeFileSync(mockMetricsFile, JSON.stringify(mockMetrics, null, 2));

      const _result = await taskManager.getValidationPerformanceMetrics();

      expect(result.success).toBe(true);
      expect(result.metrics).toEqual([]);
      expect(result.statistics).toBe(null);
    });
});
});
