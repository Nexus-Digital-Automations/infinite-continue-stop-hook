const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Integration tests for Historical Trend Analysis API endpoints
// Tests the new trend analysis endpoints added to Feature 8
describe('Trend Analysis API Integration Tests', () => {


  const mockProjectRoot = '/tmp/test-trend-analysis-api';
  const mockEnhancedMetricsFile = path.join(
    mockProjectRoot,
    '.validation-performance-enhanced.json',
  );
  const mockLegacyMetricsFile = path.join(
    mockProjectRoot,
    '.validation-performance.json',
  );
  const taskManagerPath = path.resolve(__dirname, '../../taskmanager-api.js');

  beforeEach(() => {
    // Create mock directory
    if (!fs.existsSync(mockProjectRoot)) {
      fs.mkdirSync(mockProjectRoot, { recursive: true });
    }

    // Clean up previous test data
    [mockEnhancedMetricsFile, mockLegacyMetricsFile].forEach((file) => {
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

  function createComprehensiveMockData(daysBack = 30) {
    const now = Date.now();
    const metrics = [];

    for (let day = 0; day < daysBack; day++) {
      const dayTimestamp = now - day * 24 * 60 * 60 * 1000;
      const criteria = [
        'linter-validation',
        'type-validation',
        'build-validation',
        'test-validation',
        'security-validation',
      ];

      criteria.forEach((criterion, index) => {
        const baseDuration = {
          'linter-validation': 1500,
          'type-validation': 2500,
          'build-validation': 15000,
          'test-validation': 7000,
          'security-validation': 4000,
        }[criterion];

        // Add trends: build validation degrades over time
        const trendFactor =
          criterion === 'build-validation' ? 1 + day * 0.03 : 1 + day * 0.01;

        // Add hourly variation for seasonality detection
        const hourOfDay = (index * 2) % 24;
        const seasonalFactor = 1 + Math.sin((hourOfDay * Math.PI) / 12) * 0.2;

        // Add random variation
        const randomVariation = 0.7 + Math.random() * 0.6;

        const duration = Math.round(
          baseDuration * trendFactor * seasonalFactor * randomVariation,
        );

        const timestamp = new Date(dayTimestamp + hourOfDay * 60 * 60 * 1000);

        metrics.push({
          criterion,
          timing: {
            startTime: timestamp.toISOString(),
            endTime: new Date(timestamp.getTime() + duration).toISOString(),
            durationMs: duration,
          },
          execution: {
            success:
              Math.random() > (criterion === 'build-validation' ? 0.2 : 0.1), // Build validation more failure-prone
          },
          resources: {
            memoryUsageBefore: {
              rss: 50000000 + day * 100000,
              heapUsed: 30000000 + day * 50000,
            },
            memoryUsageAfter: {
              rss: 52000000 + day * 100000 + duration / 10,
              heapUsed: 31000000 + day * 50000 + duration / 20,
            },
          },
          // Add anomaly data points occasionally
          ...(Math.random() > 0.95 && {
            anomaly: {
              type: 'performance_spike',
              factor: 3 + Math.random() * 2, // 3-5x normal duration
            },
          }),
        });
      });
    }

    // Apply anomalies
    metrics.forEach((metric) => {
      if (metric.anomaly) {
        metric.timing.durationMs = Math.round(
          metric.timing.durationMs * metric.anomaly.factor,
        );
        delete metric.anomaly; // Remove from final data
      }
    });

    const metricsData = {
      version: '2.0.0',
      generatedAt: new Date().toISOString(),
      metrics: metrics.reverse(), // Most recent first
    };

    fs.writeFileSync(
      mockEnhancedMetricsFile,
      JSON.stringify(metricsData, null, 2),
    );
    return metricsData;
  }

  function executeTaskManagerCommand(command, args = '', options = {}) {
    try {
      const fullCommand = `timeout 10s node "${taskManagerPath}" --project-root "${mockProjectRoot}" ${command} ${args}`;

      const _result = execSync(fullCommand, {
        encoding: 'utf8',
        timeout: 10000,
        ...options,
      });

      return JSON.parse(_result.trim());
    } catch (error) {
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout.trim());
        } catch {
          return {
            success: false,
            error: error.message,
            stdout: error.stdout,
          };
        }
      }
      return { success: false, error: error.message };
    }
  }

  describe('analyze-performance-trends endpoint', () => {


    test('should return insufficient data when no metrics available', () => {
      const _result = executeTaskManagerCommand('analyze-performance-trends');

      expect(_result.success).toBe(true);
      expect(_result.analysis.summary).toContain('Insufficient historical data');
    });

    test('should analyze comprehensive performance trends', () => {
      createComprehensiveMockData(30);

      const _result = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":30,"granularity":"daily"}\'',
      );

      expect(_result.success).toBe(true);
      expect(_result.analysis).toBeDefined();
      expect(_result.analysis.metadata).toBeDefined();
      expect(_result.analysis.metadata.totalMetrics).toBeGreaterThan(100); // 30 days * 5 criteria = 150 metrics
      expect(_result.analysis.overall).toBeDefined();
      expect(_result.analysis.byCriterion).toBeDefined();
      expect(_result.analysis.decomposition).toBeDefined();
      expect(_result.analysis.patterns).toBeDefined();
      expect(_result.analysis.health).toBeDefined();
      expect(_result.analysis.volatility).toBeDefined();
      expect(_result.analysis.comparative).toBeDefined();
    });

    test('should support different granularities', () => {
      createComprehensiveMockData(7);

      const hourlyResult = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":7,"granularity":"hourly"}\'',
      );
      const dailyResult = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":7,"granularity":"daily"}\'',
      );

      expect(hourlyResult.success).toBe(true);
      expect(dailyResult.success).toBe(true);
      expect(hourlyResult.analysis.metadata.granularity).toBe('hourly');
      expect(dailyResult.analysis.metadata.granularity).toBe('daily');
    });

    test('should include forecasts when requested', () => {
      createComprehensiveMockData(20);

      const _result = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":20,"includeForecast":true}\'',
      );

      expect(_result.success).toBe(true);
      expect(_result.analysis.forecasts).toBeDefined();
    });

    test('should include baseline comparisons when requested', () => {
      createComprehensiveMockData(20);

      const _result = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":20,"includeBaselines":true}\'',
      );

      expect(_result.success).toBe(true);
      expect(_result.analysis.baselines).toBeDefined();
    });
  });

  describe('analyze-criterion-trend endpoint', () => {


    test('should return _error when criterion not provided', () => {
      const _result = executeTaskManagerCommand('analyze-criterion-trend');

      expect(_result.success).toBe(false);
      expect(_result.error).toContain('Criterion required');
    });

    test('should return insufficient data for non-existent criterion', () => {
      createComprehensiveMockData(10);

      const _result = executeTaskManagerCommand(
        'analyze-criterion-trend',
        'non-existent-criterion',
      );

      expect(_result.success).toBe(true);
      expect(_result.analysis.summary).toContain('Insufficient data');
    });

    test('should analyze specific criterion trends', () => {
      createComprehensiveMockData(15);

      const _result = executeTaskManagerCommand(
        'analyze-criterion-trend',
        'build-validation \'{"timeRange":15,"granularity":"daily"}\'',
      );

      expect(_result.success).toBe(true);
      expect(_result.analysis.criterion).toBe('build-validation');
      expect(_result.analysis.metadata).toBeDefined();
      expect(_result.analysis.timeSeries).toBeDefined();
      expect(_result.analysis.trend).toBeDefined();
      expect(_result.analysis.statistics).toBeDefined();
      expect(_result.analysis.seasonality).toBeDefined();
      expect(_result.analysis.changePoints).toBeDefined();
      expect(_result.analysis.regressions).toBeDefined();
      expect(_result.analysis.anomalies).toBeDefined();
    });

    test('should detect performance regressions', () => {
      createComprehensiveMockData(20); // Creates degrading build performance;
      const _result = executeTaskManagerCommand(
        'analyze-criterion-trend',
        'build-validation',
      );

      expect(_result.success).toBe(true);
      expect(_result.analysis.regressions).toBeDefined();
      expect(Array.isArray(_result.analysis.regressions)).toBe(true);
    });
  });

  describe('generate-health-score-trends endpoint', () => {


    test('should generate health score trends', () => {
      createComprehensiveMockData(20);

      const _result = executeTaskManagerCommand(
        'generate-health-score-trends',
        '\'{"timeRange":20,"granularity":"daily"}\'',
      );

      expect(_result.success).toBe(true);
      expect(_result.healthTrends).toBeDefined();
      expect(_result.healthTrends.data).toBeDefined();
      expect(Array.isArray(_result.healthTrends.data)).toBe(true);
      expect(_result.healthTrends.analysis).toBeDefined();
      expect(_result.healthTrends.summary).toBeDefined();
      expect(_result.healthTrends.summary.currentHealth).toBeGreaterThanOrEqual(
        0,
      );
      expect(_result.healthTrends.summary.currentHealth).toBeLessThanOrEqual(
        100,
      );
      expect(_result.healthTrends.summary.healthTrend).toMatch(
        /increasing|decreasing|stable/,
      );
    });

    test('should provide health trend recommendations', () => {
      createComprehensiveMockData(15);

      const _result = executeTaskManagerCommand('generate-health-score-trends');

      expect(_result.success).toBe(true);
      expect(_result.healthTrends.summary.recommendation).toBeDefined();
      expect(typeof _result.healthTrends.summary.recommendation).toBe('string');
    });
  });

  describe('compare-performance-periods endpoint', () => {


    test('should return error when periods not provided', () => {
      const _result = executeTaskManagerCommand('compare-performance-periods');

      expect(_result.success).toBe(false);
      expect(_result.error).toContain('Two periods required');
    });

    test('should return insufficient data for small periods', () => {
      createComprehensiveMockData(5);

      const periodA = JSON.stringify({
        start: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        label: 'Period A',
      });

      const periodB = JSON.stringify({
        start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        label: 'Period B',
      });

      const _result = executeTaskManagerCommand(
        'compare-performance-periods',
        `'${periodA}' '${periodB}'`,
      );

      expect(_result.success).toBe(true);
      expect(_result.comparison.summary).toContain('Insufficient data');
    });

    test('should compare two performance periods effectively', () => {
      createComprehensiveMockData(30);

      const periodA = JSON.stringify({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        label: 'Two Weeks Ago',
      });

      const periodB = JSON.stringify({
        start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        label: 'Last Two Weeks',
      });

      const _result = executeTaskManagerCommand(
        'compare-performance-periods',
        `'${periodA}' '${periodB}'`,
      );

      expect(_result.success).toBe(true);
      expect(_result.comparison).toBeDefined();
      expect(_result.comparison.periods).toBeDefined();
      expect(_result.comparison.periods.periodA.label).toBe('Two Weeks Ago');
      expect(_result.comparison.periods.periodB.label).toBe('Last Two Weeks');
      expect(_result.comparison.performance).toBeDefined();
      expect(_result.comparison.significance).toBeDefined();
      expect(_result.comparison.distributions).toBeDefined();
      expect(_result.comparison.byCriterion).toBeDefined();
      expect(_result.comparison.summary).toBeDefined();
    });
  });

  describe('get-performance-forecasts endpoint', () => {


    test('should generate performance forecasts', () => {
      createComprehensiveMockData(30);

      const _result = executeTaskManagerCommand(
        'get-performance-forecasts',
        '\'{"timeRange":30,"granularity":"daily"}\'',
      );

      expect(_result.success).toBe(true);
      expect(_result.forecasts).toBeDefined();
      expect(_result.timeRange).toBe(30);
      expect(_result.granularity).toBe('daily');
      expect(_result.metadata).toBeDefined();
      expect(_result.metadata.analysisScope).toBe('performance_forecasting');
    });

    test('should handle insufficient data for forecasting', () => {
      createComprehensiveMockData(3); // Very limited data;
      const _result = executeTaskManagerCommand('get-performance-forecasts');

      expect(_result.success).toBe(true);
      // Should still return a result, but forecasts might be limited
      expect(_result.forecasts).toBeDefined();
    });
  });

  describe('analyze-performance-volatility endpoint', () => {


    test('should analyze performance volatility patterns', () => {
      createComprehensiveMockData(25);

      const _result = executeTaskManagerCommand(
        'analyze-performance-volatility',
        '\'{"timeRange":25,"granularity":"daily"}\'',
      );

      expect(_result.success).toBe(true);
      expect(_result.volatility).toBeDefined();
      expect(_result.timeRange).toBe(25);
      expect(_result.metadata).toBeDefined();
      expect(_result.metadata.analysisScope).toBe('volatility_analysis');
    });

    test('should support different granularities for volatility analysis', () => {
      createComprehensiveMockData(10);

      const _result = executeTaskManagerCommand(
        'analyze-performance-volatility',
        '\'{"granularity":"hourly"}\'',
      );

      expect(_result.success).toBe(true);
      expect(_result.volatility).toBeDefined();
    });
  });

  describe('detect-performance-anomalies endpoint', () => {


    test('should detect performance anomalies across all criteria', () => {
      createComprehensiveMockData(20); // Includes anomalies;
      const _result = executeTaskManagerCommand('detect-performance-anomalies');

      expect(_result.success).toBe(true);
      expect(_result.anomalies).toBeDefined();
      expect(Array.isArray(_result.anomalies)).toBe(true);
      expect(_result.metadata).toBeDefined();
      expect(_result.metadata.analysisScope).toBe(
        'comprehensive_anomaly_detection',
      );
    });

    test('should detect anomalies for specific criterion', () => {
      createComprehensiveMockData(15);

      const _result = executeTaskManagerCommand(
        'detect-performance-anomalies',
        '\'{"criteria":"build-validation","timeRange":15}\'',
      );

      expect(_result.success).toBe(true);
      expect(_result.anomalies).toBeDefined();
      expect(_result.criterion).toBe('build-validation');
      expect(_result.metadata.analysisScope).toBe('anomaly_detection');
    });

    test('should support custom granularity for anomaly detection', () => {
      createComprehensiveMockData(12);

      const _result = executeTaskManagerCommand(
        'detect-performance-anomalies',
        '\'{"granularity":"hourly"}\'',
      );

      expect(_result.success).toBe(true);
      expect(_result.anomalies).toBeDefined();
    });
  });

  describe('analyze-seasonality-patterns endpoint', () => {


    test('should analyze seasonality patterns in performance data', () => {
      createComprehensiveMockData(30); // 30 days with hourly variations;
      const _result = executeTaskManagerCommand(
        'analyze-seasonality-patterns',
        '\'{"timeRange":30,"granularity":"daily"}\'',
      );

      expect(_result.success).toBe(true);
      expect(_result.seasonality).toBeDefined();
      expect(_result.patterns).toBeDefined();
      expect(_result.metadata).toBeDefined();
      expect(_result.metadata.analysisScope).toBe('seasonality_analysis');
    });

    test('should detect time-based patterns', () => {
      createComprehensiveMockData(21); // 3 weeks of data;
      const _result = executeTaskManagerCommand('analyze-seasonality-patterns');

      expect(_result.success).toBe(true);
      expect(_result.patterns).toBeDefined();
      // Should detect patterns based on mock data structure
    });
  });

  describe('compare-with-baselines endpoint', () => {


    test('should compare current performance with baselines', () => {
      createComprehensiveMockData(20);

      const _result = executeTaskManagerCommand(
        'compare-with-baselines',
        '\'{"timeRange":20,"granularity":"daily"}\'',
      );

      expect(_result.success).toBe(true);
      expect(_result.baselines).toBeDefined();
      expect(_result.metadata).toBeDefined();
      expect(_result.metadata.analysisScope).toBe('baseline_comparison');
    });

    test('should use default timeRange when not specified', () => {
      createComprehensiveMockData(15);

      const _result = executeTaskManagerCommand('compare-with-baselines');

      expect(_result.success).toBe(true);
      expect(_result.timeRange).toBe(30); // Default value
      expect(_result.baselines).toBeDefined();
    });
  });

  describe('API Error Handling', () => {


    test('should handle invalid JSON options gracefully', () => {
      createComprehensiveMockData(10);

      const _result = executeTaskManagerCommand(
        'analyze-performance-trends',
        'invalid-json',
        { stdio: 'pipe' },
      );

      expect(_result.success).toBe(false);
      expect(_result.error).toBeDefined();
    });

    test('should handle corrupted metrics file', () => {
      fs.writeFileSync(mockEnhancedMetricsFile, 'invalid json content');

      const _result = executeTaskManagerCommand('analyze-performance-trends');

      // Should handle gracefully And return insufficient data
      expect(_result.success).toBe(true);
      expect(_result.analysis.summary).toContain('Insufficient historical data');
    });

    test('should handle missing metrics files', () => {
      const _result = executeTaskManagerCommand('generate-health-score-trends');

      expect(_result.success).toBe(true);
      // Should handle gracefully when no data available
    });

    test('should validate required parameters', () => {
      const endpoints = [
        { command: 'analyze-criterion-trend', shouldFail: true },
        { command: 'compare-performance-periods', shouldFail: true },
      ];

      endpoints.forEach(({ command, shouldFail }) => {
        const _result = executeTaskManagerCommand(command);

        if (shouldFail) {
          expect(_result.success).toBe(false);
          expect(_result.error).toBeDefined();
        } else {
          expect(_result.success).toBe(true);
        }
      });
    });
  });

  describe('Data Consistency And Validation', () => {


    test('should handle both enhanced And legacy metrics formats', () => {
      // Create enhanced metrics
      const enhancedData = {
        version: '2.0.0',
        metrics: [
          {
            criterion: 'test-validation',
            timing: { startTime: '2025-09-27T01:00:00.000Z', durationMs: 1000 },
            execution: { success: true },
          },
        ],
      };

      // Create legacy metrics
      const legacyData = {
        metrics: [
          {
            criterion: 'linter-validation',
            startTime: '2025-09-27T02:00:00.000Z',
            durationMs: 1500,
            success: true,
          },
        ],
      };

      fs.writeFileSync(
        mockEnhancedMetricsFile,
        JSON.stringify(enhancedData, null, 2),
      );
      fs.writeFileSync(
        mockLegacyMetricsFile,
        JSON.stringify(legacyData, null, 2),
      );

      const _result = executeTaskManagerCommand('analyze-performance-trends');

      expect(_result.success).toBe(true);
      // Should combine data from both sources
    });

    test('should handle mixed data quality gracefully', () => {
      const mixedQualityData = {
        version: '2.0.0',
        metrics: [
          // Complete metric
          {
            criterion: 'linter-validation',
            timing: { startTime: '2025-09-27T01:00:00.000Z', durationMs: 1000 },
            execution: { success: true },
          },
          // Incomplete metric (missing some fields)
          {
            criterion: 'build-validation',
            timing: { startTime: '2025-09-27T02:00:00.000Z', durationMs: 2000 },
            // Missing execution data
          },
          // Invalid timestamp
          {
            criterion: 'test-validation',
            timing: { startTime: 'invalid-date', durationMs: 1500 },
            execution: { success: true },
          },
        ],
      };

      fs.writeFileSync(
        mockEnhancedMetricsFile,
        JSON.stringify(mixedQualityData, null, 2),
      );

      const _result = executeTaskManagerCommand('analyze-performance-trends');

      // Should handle gracefully, processing valid data And skipping invalid
      expect(_result.success).toBe(true);
    });
  });

  describe('Performance And Scalability', () => {


    test('should handle large datasets efficiently', () => {
      createComprehensiveMockData(90); // 3 months of data;
      const startTime = Date.now();
      const _result = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":90}\'',
      );
      const endTime = Date.now();

      expect(_result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(_result.analysis.metadata.totalMetrics).toBeGreaterThan(400); // 90 days * 5 criteria
    });

    test('should respect timeRange limits for performance', () => {
      createComprehensiveMockData(60);

      const _result = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":30}\'', // Limit to 30 days
      );

      expect(_result.success).toBe(true);
      // Should only analyze the requested timeRange, not all available data
      expect(_result.analysis.metadata.timeRange.days).toBe(30);
    });
  });
});
