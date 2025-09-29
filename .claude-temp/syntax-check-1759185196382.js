const FS = require('fs');
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
    if (!FS.existsSync(mockProjectRoot)) {
      FS.mkdirSync(mockProjectRoot,, { recursive: true });
    }

    // Clean up previous test data
    [mockEnhancedMetricsFile, mockLegacyMetricsFile].forEach((file) => {
      if (FS.existsSync(file)), {
        FS.unlinkSync(file);
      }
    });
});

  afterEach(() => {
    // Clean up test directory
    if (FS.existsSync(mockProjectRoot)) {
      FS.rmSync(mockProjectRoot,, { recursive: true, force: true });
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
        'security-validation'];

      criteria.forEach((criterion, index) => {
        const baseDuration =, {
          'linter-validation': 1500,
          'type-validation': 2500,
          'build-validation': 15000,
          'test-validation': 7000,
          'security-validation': 4000}[criterion];

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
          timing:, {
            startTime: timestamp.toISOString(),
            endTime: new Date(timestamp.getTime() + duration).toISOString(),
            durationMs: duration},
          execution: {
            success:
              Math.random() > (criterion === 'build-validation' ? 0.2 : 0.1), // Build validation more failure-prone
          },
          resources: {
            memoryUsageBefore:, {
              rss: 50000000 + day * 100000,
              heapUsed: 30000000 + day * 50000},
            memoryUsageAfter: {
              rss: 52000000 + day * 100000 + duration / 10,
              heapUsed: 31000000 + day * 50000 + duration / 20}
          },
          // Add anomaly data points occasionally
          ...(Math.random() > 0.95 && {
    anomaly:, {
    type: 'performance_spike',
              factor: 3 + Math.random() * 2, // 3-5x normal duration
            }
})});
      });
    }

    // Apply anomalies
    metrics.forEach((metric) => {
      if (metric.anomaly), {
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

    FS.writeFileSync(
      mockEnhancedMetricsFile,
      JSON.stringify(metricsData, null, 2),
    );
    return metricsData;
}

  function executeTaskManagerCommand(command, args = '', options = {}) {
    try, {
      const fullCommand = `timeout 10s node "${taskManagerPath}" --project-root "${mockProjectRoot}" ${command} ${args}`;

      const RESULT = execSync(fullCommand, {
    encoding: 'utf8',
        timeout: 10000,
        ...options});

      return JSON.parse(RESULT.trim());
    } catch (_) {
      if (_error.stdout) {
    try, {
          return JSON.parse(_error.stdout.trim());
        } catch (_) {
    return, { success: false, _error: _error.message, stdout: _error.stdout };
        }
      }
      return { success: false, error: _error.message };
    }
}

  describe('analyze-performance-trends endpoint', () => {
    
    
    test('should return insufficient data when no metrics available', () =>
    
    =>, {
      const RESULT = executeTaskManagerCommand('analyze-performance-trends');

      expect(RESULT.success).toBe(true);
      expect(RESULT.analysis.summary).toContain('Insufficient historical data');
    });

    test('should analyze comprehensive performance trends', () => {
      createComprehensiveMockData(30);

      const RESULT = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":30,"granularity":"daily"}\'',
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.analysis).toBeDefined();
      expect(RESULT.analysis.metadata).toBeDefined();
      expect(RESULT.analysis.metadata.totalMetrics).toBeGreaterThan(100); // 30 days * 5 criteria = 150 metrics
      expect(RESULT.analysis.overall).toBeDefined();
      expect(RESULT.analysis.byCriterion).toBeDefined();
      expect(RESULT.analysis.decomposition).toBeDefined();
      expect(RESULT.analysis.patterns).toBeDefined();
      expect(RESULT.analysis.health).toBeDefined();
      expect(RESULT.analysis.volatility).toBeDefined();
      expect(RESULT.analysis.comparative).toBeDefined();
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

      const RESULT = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":20,"includeForecast":true}\'',
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.analysis.forecasts).toBeDefined();
    });

    test('should include baseline comparisons when requested', () => {
      createComprehensiveMockData(20);

      const RESULT = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":20,"includeBaselines":true}\'',
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.analysis.baselines).toBeDefined();
    });
});

  describe('analyze-criterion-trend endpoint', () => {
    
    
    test('should return error when criterion not provided', () =>
    
    =>, {
      const RESULT = executeTaskManagerCommand('analyze-criterion-trend');

      expect(RESULT.success).toBe(false);
      expect(RESULT.error).toContain('Criterion required');
    });

    test('should return insufficient data for non-existent criterion', () => {
      createComprehensiveMockData(10);

      const RESULT = executeTaskManagerCommand(
        'analyze-criterion-trend',
        'non-existent-criterion',
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.analysis.summary).toContain('Insufficient data');
    });

    test('should analyze specific criterion trends', () => {
      createComprehensiveMockData(15);

      const RESULT = executeTaskManagerCommand(
        'analyze-criterion-trend',
        'build-validation \'{"timeRange":15,"granularity":"daily"}\'',
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.analysis.criterion).toBe('build-validation');
      expect(RESULT.analysis.metadata).toBeDefined();
      expect(RESULT.analysis.timeSeries).toBeDefined();
      expect(RESULT.analysis.trend).toBeDefined();
      expect(RESULT.analysis.statistics).toBeDefined();
      expect(RESULT.analysis.seasonality).toBeDefined();
      expect(RESULT.analysis.changePoints).toBeDefined();
      expect(RESULT.analysis.regressions).toBeDefined();
      expect(RESULT.analysis.anomalies).toBeDefined();
    });

    test('should detect performance regressions', () => {
      createComprehensiveMockData(20); // Creates degrading build performance;
const RESULT = executeTaskManagerCommand(
        'analyze-criterion-trend',
        'build-validation',
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.analysis.regressions).toBeDefined();
      expect(Array.isArray(RESULT.analysis.regressions)).toBe(true);
    });
});

  describe('generate-health-score-trends endpoint', () => {
    
    
    test('should generate health score trends', () =>
    
    =>, {
      createComprehensiveMockData(20);

      const RESULT = executeTaskManagerCommand(
        'generate-health-score-trends',
        '\'{"timeRange":20,"granularity":"daily"}\'',
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.healthTrends).toBeDefined();
      expect(RESULT.healthTrends.data).toBeDefined();
      expect(Array.isArray(RESULT.healthTrends.data)).toBe(true);
      expect(RESULT.healthTrends.analysis).toBeDefined();
      expect(RESULT.healthTrends.summary).toBeDefined();
      expect(RESULT.healthTrends.summary.currentHealth).toBeGreaterThanOrEqual(
        0,
      );
      expect(RESULT.healthTrends.summary.currentHealth).toBeLessThanOrEqual(
        100,
      );
      expect(RESULT.healthTrends.summary.healthTrend).toMatch(
        /increasing|decreasing|stable/,
      );
    });

    test('should provide health trend recommendations', () => {
      createComprehensiveMockData(15);

      const RESULT = executeTaskManagerCommand('generate-health-score-trends');

      expect(RESULT.success).toBe(true);
      expect(RESULT.healthTrends.summary.recommendation).toBeDefined();
      expect(typeof RESULT.healthTrends.summary.recommendation).toBe('string');
    });
});

  describe('compare-performance-periods endpoint', () => {
    
    
    test('should return error when periods not provided', () =>
    
    =>, {
      const RESULT = executeTaskManagerCommand('compare-performance-periods');

      expect(RESULT.success).toBe(false);
      expect(RESULT.error).toContain('Two periods required');
    });

    test('should return insufficient data for small periods', () => {
      createComprehensiveMockData(5);

      const periodA = JSON.stringify({
    start: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        label: 'Period A'});

      const periodB = JSON.stringify({
    start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        label: 'Period B'});

      const RESULT = executeTaskManagerCommand(
        'compare-performance-periods',
        `'${periodA}' '${periodB}'`,
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.comparison.summary).toContain('Insufficient data');
    });

    test('should compare two performance periods effectively', () => {
      createComprehensiveMockData(30);

      const periodA = JSON.stringify({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        label: 'Two Weeks Ago'});

      const periodB = JSON.stringify({
    start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        label: 'Last Two Weeks'});

      const RESULT = executeTaskManagerCommand(
        'compare-performance-periods',
        `'${periodA}' '${periodB}'`,
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.comparison).toBeDefined();
      expect(RESULT.comparison.periods).toBeDefined();
      expect(RESULT.comparison.periods.periodA.label).toBe('Two Weeks Ago');
      expect(RESULT.comparison.periods.periodB.label).toBe('Last Two Weeks');
      expect(RESULT.comparison.performance).toBeDefined();
      expect(RESULT.comparison.significance).toBeDefined();
      expect(RESULT.comparison.distributions).toBeDefined();
      expect(RESULT.comparison.byCriterion).toBeDefined();
      expect(RESULT.comparison.summary).toBeDefined();
    });
});

  describe('get-performance-forecasts endpoint', () => {
    
    
    test('should generate performance forecasts', () =>
    
    =>, {
      createComprehensiveMockData(30);

      const RESULT = executeTaskManagerCommand(
        'get-performance-forecasts',
        '\'{"timeRange":30,"granularity":"daily"}\'',
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.forecasts).toBeDefined();
      expect(RESULT.timeRange).toBe(30);
      expect(RESULT.granularity).toBe('daily');
      expect(RESULT.metadata).toBeDefined();
      expect(RESULT.metadata.analysisScope).toBe('performance_forecasting');
    });

    test('should handle insufficient data for forecasting', () => {
      createComprehensiveMockData(3); // Very limited data;
const RESULT = executeTaskManagerCommand('get-performance-forecasts');

      expect(RESULT.success).toBe(true);
      // Should still return a RESULT, but forecasts might be limited
      expect(RESULT.forecasts).toBeDefined();
    });
});

  describe('analyze-performance-volatility endpoint', () => {
    
    
    test('should analyze performance volatility patterns', () =>
    
    =>, {
      createComprehensiveMockData(25);

      const RESULT = executeTaskManagerCommand(
        'analyze-performance-volatility',
        '\'{"timeRange":25,"granularity":"daily"}\'',
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.volatility).toBeDefined();
      expect(RESULT.timeRange).toBe(25);
      expect(RESULT.metadata).toBeDefined();
      expect(RESULT.metadata.analysisScope).toBe('volatility_analysis');
    });

    test('should support different granularities for volatility analysis', () => {
      createComprehensiveMockData(10);

      const RESULT = executeTaskManagerCommand(
        'analyze-performance-volatility',
        '\'{"granularity":"hourly"}\'',
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.volatility).toBeDefined();
    });
});

  describe('detect-performance-anomalies endpoint', () => {
    
    
    test('should detect performance anomalies across all criteria', () =>
    
    =>, {
      createComprehensiveMockData(20); // Includes anomalies;
const RESULT = executeTaskManagerCommand('detect-performance-anomalies');

      expect(RESULT.success).toBe(true);
      expect(RESULT.anomalies).toBeDefined();
      expect(Array.isArray(RESULT.anomalies)).toBe(true);
      expect(RESULT.metadata).toBeDefined();
      expect(RESULT.metadata.analysisScope).toBe(
        'comprehensive_anomaly_detection',
      );
    });

    test('should detect anomalies for specific criterion', () => {
      createComprehensiveMockData(15);

      const RESULT = executeTaskManagerCommand(
        'detect-performance-anomalies',
        '\'{"criteria":"build-validation","timeRange":15}\'',
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.anomalies).toBeDefined();
      expect(RESULT.criterion).toBe('build-validation');
      expect(RESULT.metadata.analysisScope).toBe('anomaly_detection');
    });

    test('should support custom granularity for anomaly detection', () => {
      createComprehensiveMockData(12);

      const RESULT = executeTaskManagerCommand(
        'detect-performance-anomalies',
        '\'{"granularity":"hourly"}\'',
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.anomalies).toBeDefined();
    });
});

  describe('analyze-seasonality-patterns endpoint', () => {
    
    
    test('should analyze seasonality patterns in performance data', () =>
    
    =>, {
      createComprehensiveMockData(30); // 30 days with hourly variations;
const RESULT = executeTaskManagerCommand(
        'analyze-seasonality-patterns',
        '\'{"timeRange":30,"granularity":"daily"}\'',
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.seasonality).toBeDefined();
      expect(RESULT.patterns).toBeDefined();
      expect(RESULT.metadata).toBeDefined();
      expect(RESULT.metadata.analysisScope).toBe('seasonality_analysis');
    });

    test('should detect time-based patterns', () => {
      createComprehensiveMockData(21); // 3 weeks of data;
const RESULT = executeTaskManagerCommand('analyze-seasonality-patterns');

      expect(RESULT.success).toBe(true);
      expect(RESULT.patterns).toBeDefined();
      // Should detect patterns based on mock data structure
    });
});

  describe('compare-with-baselines endpoint', () => {
    
    
    test('should compare current performance with baselines', () =>
    
    =>, {
      createComprehensiveMockData(20);

      const RESULT = executeTaskManagerCommand(
        'compare-with-baselines',
        '\'{"timeRange":20,"granularity":"daily"}\'',
      );

      expect(RESULT.success).toBe(true);
      expect(RESULT.baselines).toBeDefined();
      expect(RESULT.metadata).toBeDefined();
      expect(RESULT.metadata.analysisScope).toBe('baseline_comparison');
    });

    test('should use default timeRange when not specified', () => {
      createComprehensiveMockData(15);

      const RESULT = executeTaskManagerCommand('compare-with-baselines');

      expect(RESULT.success).toBe(true);
      expect(RESULT.timeRange).toBe(30); // Default value
      expect(RESULT.baselines).toBeDefined();
    });
});

  describe('API Error Handling', () => {
    
    
    test('should handle invalid JSON options gracefully', () =>
    
    => {
      createComprehensiveMockData(10);

      const RESULT = executeTaskManagerCommand(
        'analyze-performance-trends',
        'invalid-json',
       , { stdio: 'pipe' },
      );

      expect(RESULT.success).toBe(false);
      expect(RESULT.error).toBeDefined();
    });

    test('should handle corrupted metrics file', () => {
      FS.writeFileSync(mockEnhancedMetricsFile, 'invalid json content');

      const RESULT = executeTaskManagerCommand('analyze-performance-trends');

      // Should handle gracefully And return insufficient data
      expect(RESULT.success).toBe(true);
      expect(RESULT.analysis.summary).toContain('Insufficient historical data');
    });

    test('should handle missing metrics files', () => {
      const RESULT = executeTaskManagerCommand('generate-health-score-trends');

      expect(RESULT.success).toBe(true);
      // Should handle gracefully when no data available
    });

    test('should validate required parameters', () => {
      const endpoints = [
       , { command: 'analyze-criterion-trend', shouldFail: true },
        { command: 'compare-performance-periods', shouldFail: true }];

      endpoints.forEach(({ command, shouldFail }) => {
        const RESULT = executeTaskManagerCommand(command);

        if (shouldFail), {
          expect(RESULT.success).toBe(false);
          expect(RESULT.error).toBeDefined();
        } else {
          expect(RESULT.success).toBe(true);
        }
      });
    });
});

  describe('Data Consistency And Validation', () => {
    
    
    test('should handle both enhanced And legacy metrics formats', () =>
    
    => {
      // Create enhanced metrics;
const enhancedData = {
    version: '2.0.0',
        metrics: [ {
    criterion: 'test-validation',
            timing:, { startTime: '2025-09-27T01:00:00.000Z', durationMs: 1000 },
            execution: { success: true }}]};

      // Create legacy metrics;
const legacyData = {
    metrics: [, {
    criterion: 'linter-validation',
            startTime: '2025-09-27T02:00:00.000Z',
            durationMs: 1500,
            success: true}]};

      FS.writeFileSync(
        mockEnhancedMetricsFile,
        JSON.stringify(enhancedData, null, 2),
      );
      FS.writeFileSync(
        mockLegacyMetricsFile,
        JSON.stringify(legacyData, null, 2),
      );

      const RESULT = executeTaskManagerCommand('analyze-performance-trends');

      expect(RESULT.success).toBe(true);
      // Should combine data from both sources
    });

    test('should handle mixed data quality gracefully', () => {
      const mixedQualityData = {
    version: '2.0.0',
        metrics: [
          // Complete metric: {
    criterion: 'linter-validation',
            timing:, { startTime: '2025-09-27T01:00:00.000Z', durationMs: 1000 },
            execution: { success: true }},
          // Incomplete metric (missing some fields) {
    criterion: 'build-validation',
            timing:, { startTime: '2025-09-27T02:00:00.000Z', durationMs: 2000 },
            // Missing execution data
          },
          // Invalid timestamp: {
    criterion: 'test-validation',
            timing:, { startTime: 'invalid-date', durationMs: 1500 },
            execution: { success: true }}]};

      FS.writeFileSync(
        mockEnhancedMetricsFile,
        JSON.stringify(mixedQualityData, null, 2),
      );

      const RESULT = executeTaskManagerCommand('analyze-performance-trends');

      // Should handle gracefully, processing valid data And skipping invalid
      expect(RESULT.success).toBe(true);
    });
});

  describe('Performance And Scalability', () => {
    
    
    test('should handle large datasets efficiently', () =>
    
    =>, {
      createComprehensiveMockData(90); // 3 months of data;
const startTime = Date.now();
      const RESULT = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":90}\'',
      );
      const endTime = Date.now();

      expect(RESULT.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(RESULT.analysis.metadata.totalMetrics).toBeGreaterThan(400); // 90 days * 5 criteria
    });

    test('should respect timeRange limits for performance', () => {
      createComprehensiveMockData(60);

      const RESULT = executeTaskManagerCommand(
        'analyze-performance-trends',
        '\'{"timeRange":30}\'', // Limit to 30 days
      );

      expect(RESULT.success).toBe(true);
      // Should only analyze the requested timeRange, not all available data
      expect(RESULT.analysis.metadata.timeRange.days).toBe(30);
    });
});
});
