const fs = require('fs');
const path = require('path');
const TrendAnalyzer = require('../../lib/trend-analyzer');

describe('TrendAnalyzer - Historical Performance Trend Analysis', () => {
  const mockProjectRoot = '/tmp/test-trend-analyzer';
  const mockEnhancedMetricsFile = path.join(
    mockProjectRoot,
    '.validation-performance-enhanced.json',
  );
  const mockLegacyMetricsFile = path.join(
    mockProjectRoot,
    '.validation-performance.json',
  );
  const mockTrendsFile = path.join(mockProjectRoot, '.validation-trends.json');

  let trendAnalyzer;

  beforeEach(() => {
    // Create mock directory
    if (!fs.existsSync(mockProjectRoot)) {
      fs.mkdirSync(mockProjectRoot, { recursive: true });
    }

    // Clean up previous test data
    [mockEnhancedMetricsFile, mockLegacyMetricsFile, mockTrendsFile].forEach(
      (file) => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      },
    );

    trendAnalyzer = new TrendAnalyzer(mockProjectRoot);
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(mockProjectRoot)) {
      fs.rmSync(mockProjectRoot, { recursive: true, force: true });
    }
  });

  function createMockMetricsData(daysBack = 30) {
    const now = Date.now();
    const metrics = [];

    // Generate test data over specified days
    for (let day = 0; day < daysBack; day++) {
      const dayTimestamp = now - day * 24 * 60 * 60 * 1000;

      // Add metrics for each validation criterion per day
      const criteria = [
        'linter-validation',
        'type-validation',
        'build-validation',
        'test-validation',
        'security-validation',
      ];

      criteria.forEach((criterion, index) => {
        // Add some variation And trends
        const baseDuration = {
          'linter-validation': 1500,
          'type-validation': 2500,
          'build-validation': 20000,
          'test-validation': 8000,
          'security-validation': 4000,
        }[criterion];

        // Add trend: performance degradation over time for some criteria
        const trendFactor =
          criterion === 'build-validation' ? 1 + day * 0.02 : 1;
        const randomVariation = 0.8 + Math.random() * 0.4; // ±20% variation
        const duration = Math.round(
          baseDuration * trendFactor * randomVariation,
        );

        metrics.push({
          criterion,
          timing: {
            startTime: new Date(
              dayTimestamp + index * 60 * 60 * 1000,
            ).toISOString(),
            endTime: new Date(
              dayTimestamp + index * 60 * 60 * 1000 + duration,
            ).toISOString(),
            durationMs: duration,
          },
          execution: {
            success: Math.random() > 0.1, // 90% success rate
          },
          resources: {
            memoryUsageBefore: { rss: 50000000, heapUsed: 30000000 },
            memoryUsageAfter: {
              rss: 52000000 + duration / 10,
              heapUsed: 31000000 + duration / 20,
            },
          },
        });
      });
    }

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

  describe('analyzeTrends', () => {
    test('should return insufficient data message when not enough metrics', async () => {
      const RESULT = await trendAnalyzer.analyzeTrends();

      expect(result.success).toBe(true);
      expect(result.analysis.summary).toContain('Insufficient historical data');
    });

    test('should analyze comprehensive trends with sufficient data', async () => {
      createMockMetricsData(30);

      const RESULT = await trendAnalyzer.analyzeTrends({
        timeRange: 30,
        granularity: 'daily',
      });

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.metadata).toBeDefined();
      expect(result.analysis.metadata.totalMetrics).toBeGreaterThan(0);
      expect(result.analysis.overall).toBeDefined();
      expect(result.analysis.byCriterion).toBeDefined();
      expect(result.analysis.decomposition).toBeDefined();
      expect(result.analysis.patterns).toBeDefined();
      expect(result.analysis.health).toBeDefined();
      expect(result.analysis.volatility).toBeDefined();
      expect(result.analysis.comparative).toBeDefined();
    });

    test('should include forecasts when requested', async () => {
      createMockMetricsData(30);

      const RESULT = await trendAnalyzer.analyzeTrends({
        timeRange: 30,
        includeForecast: true,
      });

      expect(result.success).toBe(true);
      expect(result.analysis.forecasts).toBeDefined();
    });

    test('should include baseline comparisons when requested', async () => {
      createMockMetricsData(30);

      const RESULT = await trendAnalyzer.analyzeTrends({
        timeRange: 30,
        includeBaselines: true,
      });

      expect(result.success).toBe(true);
      expect(result.analysis.baselines).toBeDefined();
    });

    test('should handle different granularities', async () => {
      createMockMetricsData(7);

      const hourlyResult = await trendAnalyzer.analyzeTrends({
        timeRange: 7,
        granularity: 'hourly',
      });

      const dailyResult = await trendAnalyzer.analyzeTrends({
        timeRange: 7,
        granularity: 'daily',
      });

      expect(hourlyResult.success).toBe(true);
      expect(dailyResult.success).toBe(true);
      expect(hourlyResult.analysis.metadata.granularity).toBe('hourly');
      expect(dailyResult.analysis.metadata.granularity).toBe('daily');
    });
  });

  describe('analyzeCriterionTrend', () => {
    test('should return insufficient data for single criterion', async () => {
      const result =
        await trendAnalyzer.analyzeCriterionTrend('linter-validation');

      expect(result.success).toBe(true);
      expect(result.analysis.summary).toContain('Insufficient data');
    });

    test('should analyze specific criterion trends', async () => {
      createMockMetricsData(15);

      const RESULT = await trendAnalyzer.analyzeCriterionTrend(
        'build-validation',
        {
          timeRange: 15,
          granularity: 'daily',
        },
      );

      expect(result.success).toBe(true);
      expect(result.analysis.criterion).toBe('build-validation');
      expect(result.analysis.metadata).toBeDefined();
      expect(result.analysis.timeSeries).toBeDefined();
      expect(result.analysis.trend).toBeDefined();
      expect(result.analysis.statistics).toBeDefined();
      expect(result.analysis.seasonality).toBeDefined();
      expect(result.analysis.changePoints).toBeDefined();
      expect(result.analysis.regressions).toBeDefined();
      expect(result.analysis.anomalies).toBeDefined();
    });

    test('should calculate trend characteristics correctly', async () => {
      createMockMetricsData(20);

      const result =
        await trendAnalyzer.analyzeCriterionTrend('build-validation');

      expect(result.success).toBe(true);
      expect(result.analysis.trend).toBeDefined();
      expect(result.analysis.trend.direction).toMatch(
        /increasing|decreasing|stable/,
      );
      expect(result.analysis.trend.strength).toBeGreaterThanOrEqual(0);
      expect(result.analysis.trend.strength).toBeLessThanOrEqual(1);
      expect(typeof result.analysis.trend.slope).toBe('number');
    });
  });

  describe('generateHealthScoreTrends', () => {
    test('should generate health score trends over time', async () => {
      createMockMetricsData(20);

      const RESULT = await trendAnalyzer.generateHealthScoreTrends({
        timeRange: 20,
        granularity: 'daily',
      });

      expect(result.success).toBe(true);
      expect(result.healthTrends).toBeDefined();
      expect(result.healthTrends.data).toBeDefined();
      expect(Array.isArray(result.healthTrends.data)).toBe(true);
      expect(result.healthTrends.analysis).toBeDefined();
      expect(result.healthTrends.summary).toBeDefined();
      expect(result.healthTrends.summary.currentHealth).toBeGreaterThanOrEqual(
        0,
      );
      expect(result.healthTrends.summary.currentHealth).toBeLessThanOrEqual(
        100,
      );
    });

    test('should calculate health trend direction', async () => {
      createMockMetricsData(15);

      const RESULT = await trendAnalyzer.generateHealthScoreTrends();

      expect(result.success).toBe(true);
      expect(result.healthTrends.summary.healthTrend).toMatch(
        /increasing|decreasing|stable/,
      );
      expect(typeof result.healthTrends.summary.volatility).toBe('number');
      expect(result.healthTrends.summary.recommendation).toBeDefined();
    });
  });

  describe('comparePerformancePeriods', () => {
    test('should return insufficient data for small periods', async () => {
      createMockMetricsData(5);

      const periodA = {
        start: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        label: 'Last Week',
      };

      const periodB = {
        start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        label: 'This Week',
      };

      const RESULT = await trendAnalyzer.comparePerformancePeriods(
        periodA,
        periodB,
      );

      expect(result.success).toBe(true);
      expect(result.comparison.summary).toContain('Insufficient data');
    });

    test('should compare two performance periods', async () => {
      createMockMetricsData(30);

      const periodA = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        label: 'Two Weeks Ago',
      };

      const periodB = {
        start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        label: 'Last Two Weeks',
      };

      const RESULT = await trendAnalyzer.comparePerformancePeriods(
        periodA,
        periodB,
      );

      expect(result.success).toBe(true);
      expect(result.comparison).toBeDefined();
      expect(result.comparison.periods).toBeDefined();
      expect(result.comparison.periods.periodA.label).toBe('Two Weeks Ago');
      expect(result.comparison.periods.periodB.label).toBe('Last Two Weeks');
      expect(result.comparison.performance).toBeDefined();
      expect(result.comparison.significance).toBeDefined();
      expect(result.comparison.distributions).toBeDefined();
      expect(result.comparison.byCriterion).toBeDefined();
      expect(result.comparison.summary).toBeDefined();
    });
  });

  describe('Helper Methods', () => {
    test('should load metrics from both enhanced And legacy files', async () => {
      // Create both enhanced And legacy data
      const enhancedData = {
        metrics: [
          {
            criterion: 'test1',
            timing: { startTime: '2025-09-27T01:00:00.000Z', durationMs: 1000 },
          },
        ],
      };
      const legacyData = {
        metrics: [
          {
            criterion: 'test2',
            startTime: '2025-09-27T02:00:00.000Z',
            durationMs: 2000,
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

      const metrics = await trendAnalyzer._loadMetricsData();

      expect(metrics).toHaveLength(2);
      expect(metrics.some((m) => m.criterion === 'test1')).toBe(true);
      expect(metrics.some((m) => m.criterion === 'test2')).toBe(true);
    });

    test('should filter metrics by time range correctly', () => {
      const now = Date.now();
      const metrics = [
        {
          timing: {
            startTime: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
          },
        }, // 10 days ago
        {
          timing: {
            startTime: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
        }, // 5 days ago
        {
          timing: {
            startTime: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
        }, // 1 day ago
      ];

      const filtered = trendAnalyzer._filterMetricsByTimeRange(metrics, 7);
      expect(filtered).toHaveLength(2); // Only metrics within 7 days
    });

    test('should group metrics by criterion', () => {
      const metrics = [
        { criterion: 'linter-validation' },
        { criterion: 'build-validation' },
        { criterion: 'linter-validation' },
      ];

      const grouped = trendAnalyzer._groupByCriterion(metrics);

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['linter-validation']).toHaveLength(2);
      expect(grouped['build-validation']).toHaveLength(1);
    });

    test('should calculate trend direction correctly', () => {
      // Increasing trend
      const increasingValues = [1, 2, 3, 4, 5];
      const increasingTrend =
        trendAnalyzer._calculateTrendDirection(increasingValues);
      expect(increasingTrend.direction).toBe('increasing');
      expect(increasingTrend.slope).toBeGreaterThan(0);

      // Decreasing trend
      const decreasingValues = [5, 4, 3, 2, 1];
      const decreasingTrend =
        trendAnalyzer._calculateTrendDirection(decreasingValues);
      expect(decreasingTrend.direction).toBe('decreasing');
      expect(decreasingTrend.slope).toBeLessThan(0);

      // Stable trend
      const stableValues = [3, 3, 3, 3, 3];
      const stableTrend = trendAnalyzer._calculateTrendDirection(stableValues);
      expect(stableTrend.direction).toBe('stable');
      expect(Math.abs(stableTrend.slope)).toBeLessThan(0.001);
    });

    test('should calculate volatility correctly', () => {
      const lowVolatilityValues = [10, 11, 9, 10, 11];
      const highVolatilityValues = [10, 50, 5, 40, 15];

      const lowVolatility =
        trendAnalyzer._calculateVolatility(lowVolatilityValues);
      const highVolatility =
        trendAnalyzer._calculateVolatility(highVolatilityValues);

      expect(lowVolatility).toBeLessThan(highVolatility);
      expect(lowVolatility).toBeGreaterThanOrEqual(0);
      expect(highVolatility).toBeGreaterThanOrEqual(0);
    });

    test('should calculate health score', () => {
      const goodMetrics = [
        { timing: { durationMs: 1000 }, execution: { success: true } },
        { timing: { durationMs: 1200 }, execution: { success: true } },
        { timing: { durationMs: 900 }, execution: { success: true } },
      ];

      const poorMetrics = [
        { timing: { durationMs: 25000 }, execution: { success: false } },
        { timing: { durationMs: 30000 }, execution: { success: false } },
        { timing: { durationMs: 28000 }, execution: { success: true } },
      ];

      const goodScore = trendAnalyzer._calculateHealthScore(goodMetrics);
      const poorScore = trendAnalyzer._calculateHealthScore(poorMetrics);

      expect(goodScore).toBeGreaterThan(poorScore);
      expect(goodScore).toBeGreaterThanOrEqual(0);
      expect(goodScore).toBeLessThanOrEqual(100);
      expect(poorScore).toBeGreaterThanOrEqual(0);
      expect(poorScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Statistical Analysis', () => {
    test('should calculate median correctly', () => {
      expect(trendAnalyzer._calculateMedian([1, 2, 3, 4, 5])).toBe(3);
      expect(trendAnalyzer._calculateMedian([1, 2, 3, 4])).toBe(2.5);
      expect(trendAnalyzer._calculateMedian([5])).toBe(5);
    });

    test('should calculate mode correctly', () => {
      expect(trendAnalyzer._calculateMode([1, 2, 2, 3, 3, 3])).toBe(3);
      expect(trendAnalyzer._calculateMode([1, 1, 2, 2])).toBe(1); // First encountered
    });

    test('should calculate percentiles correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(trendAnalyzer._calculatePercentile(values, 0.5)).toBe(5.5); // 50th percentile (median)
      expect(trendAnalyzer._calculatePercentile(values, 0.9)).toBe(9.1); // 90th percentile
      expect(trendAnalyzer._calculatePercentile(values, 0.0)).toBe(1); // 0th percentile (min)
      expect(trendAnalyzer._calculatePercentile(values, 1.0)).toBe(10); // 100th percentile (max)
    });
  });

  describe('Pattern Detection', () => {
    test('should detect cyclical patterns', () => {
      const durations = [10, 20, 15, 25, 12, 22, 14, 24]; // High variance
      const timestamps = durations.map(
        (_, i) => new Date(Date.now() + i * 60 * 60 * 1000),
      );

      const pattern = trendAnalyzer._detectCyclicalPattern(
        durations,
        timestamps,
      );

      expect(pattern.detected).toBe(true);
      expect(pattern.variance).toBeGreaterThan(0);
      expect(pattern.pattern).toBe('cyclical_performance_variation');
    });

    test('should detect seasonal patterns', () => {
      const durations = [10, 15, 20, 25, 30, 25, 20, 15]; // Variation throughout day
      const timestamps = durations.map((_, i) => {
        const date = new Date();
        date.setHours(i * 3); // Every 3 hours
        return date;
      });

      const pattern = trendAnalyzer._detectSeasonalPattern(
        durations,
        timestamps,
      );

      expect(pattern.detected).toBeDefined();
      expect(pattern.variance).toBeGreaterThanOrEqual(0);
      expect(pattern.pattern).toBe('time_of_day_variation');
    });

    test('should detect trending patterns', () => {
      const increasingDurations = [10, 12, 14, 16, 18, 20, 22, 24];
      const timestamps = increasingDurations.map(
        (_, i) => new Date(Date.now() + i * 60 * 60 * 1000),
      );

      const pattern = trendAnalyzer._detectTrendingPattern(
        increasingDurations,
        timestamps,
      );

      expect(pattern.detected).toBe(true);
      expect(pattern.direction).toBe('increasing');
      expect(pattern.strength).toBeGreaterThan(0.6);
      expect(pattern.pattern).toBe('increasing_performance_trend');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing metrics files gracefully', async () => {
      const RESULT = await trendAnalyzer.analyzeTrends();

      expect(result.success).toBe(true);
      expect(result.analysis.summary).toContain('Insufficient historical data');
    });

    test('should handle corrupted metrics files', async () => {
      fs.writeFileSync(mockEnhancedMetricsFile, 'invalid json');

      const RESULT = await trendAnalyzer.analyzeTrends();

      // Should still succeed by gracefully handling the error
      expect(result.success).toBe(true);
    });

    test('should handle empty metrics arrays', async () => {
      const emptyData = { metrics: [] };
      fs.writeFileSync(
        mockEnhancedMetricsFile,
        JSON.stringify(emptyData, null, 2),
      );

      const RESULT = await trendAnalyzer.analyzeTrends();

      expect(result.success).toBe(true);
      expect(result.analysis.summary).toContain('Insufficient historical data');
    });

    test('should handle invalid time ranges', () => {
      const metrics = [{ timing: { startTime: 'invalid-date' } }];
      const filtered = trendAnalyzer._filterMetricsByTimeRange(metrics, 7);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('Storage And Persistence', () => {
    test('should store trend analysis results', async () => {
      createMockMetricsData(10);

      const RESULT = await trendAnalyzer.analyzeTrends();
      expect(result.success).toBe(true);

      // Check if trends file was created
      const trendsFileExists = await trendAnalyzer._fileExists(mockTrendsFile);
      expect(trendsFileExists).toBe(true);

      // Verify stored content
      const storedData = JSON.parse(fs.readFileSync(mockTrendsFile, 'utf8'));
      expect(storedData.generatedAt).toBeDefined();
      expect(storedData.version).toBe('1.0.0');
      expect(storedData.analysis).toBeDefined();
      expect(storedData.summary).toBeDefined();
    });
  });
});
