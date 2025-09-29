

/**
 * Historical Trend Analysis And Performance Tracking For Stop Hook Validation Performance Metrics
 *
 * This module provides comprehensive historical trend analysis capabilities to track
 * validation performance changes over time, identify patterns, predict future performance,
 * And provide actionable insights For continuous improvement.
 *
 * Features:
 * - Time-series performance analysis
 * - Statistical trend detection
 * - Seasonal pattern recognition
 * - Performance forecasting
 * - Anomaly detection over time
 * - Regression analysis
 * - Performance baseline tracking
 * - Comparative period analysis
 * - Trend visualization data
 * - Performance health scoring
 */

const FS = require('fs').promises;
const { loggers } = require('../lib/logger');
const path = require('path');


class TrendAnalyzer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.metricsFile = path.join(projectRoot, '.validation-performance-enhanced.json');
    this.legacyMetricsFile = path.join(projectRoot, '.validation-performance.json');
    this.trendsFile = path.join(projectRoot, '.validation-trends.json');

    // Analysis configuration
    this.config = {
      // Time periods For analysis
      periods: {
        hourly: 1 * 60 * 60 * 1000,      // 1 hour
        daily: 24 * 60 * 60 * 1000,      // 1 day
        weekly: 7 * 24 * 60 * 60 * 1000, // 1 week
        monthly: 30 * 24 * 60 * 60 * 1000, // 30 days
      },

      // Trend detection parameters
      minDataPoints: 5,              // Minimum data points For trend analysis
      significanceThreshold: 0.05,   // Statistical significance threshold
      volatilityThreshold: 0.3,      // Threshold For high volatility detection
      trendStrengthThreshold: 0.7,   // Threshold For strong trend identification

      // Forecasting parameters
      forecastWindow: 7,             // Days to forecast ahead
      confidenceInterval: 0.95,     // Confidence interval For forecasts

      // Anomaly detection
      anomalyZScore: 2.5,           // Z-score threshold For anomalies
      anomalyWindowSize: 20,        // Rolling window For anomaly detection

      // Performance health scoring
      healthMetrics: {
        performance: 0.4,           // Weight For execution time
        reliability: 0.3,          // Weight For success rate
        stability: 0.2,            // Weight For consistency
        efficiency: 0.1,           // Weight For resource usage
      },
    };

    // Trend analysis cache
    this.cache = {
      lastAnalysis: null,
      trendData: new Map(),
      baselines: new Map(),
    };
}

  /**
   * Perform comprehensive historical trend analysis
   */
  async analyzeTrends(options = {}) {
    try {
      const timeRange = options.timeRange || 90; // 90 days default;
      const granularity = options.granularity || 'daily';
      const includeForecast = options.includeForecast !== false;
      const includeBaselines = options.includeBaselines !== false;

      // Load historical metrics data;
      const metricsData = await this._loadMetricsData();
      const filteredMetrics = this._filterMetricsByTimeRange(metricsData, timeRange);

      if (filteredMetrics.length < this.config.minDataPoints) {
        return {
          success: true,
          analysis: {
            summary: 'Insufficient historical data For trend analysis',
            totalMetrics: filteredMetrics.length,
            minimumRequired: this.config.minDataPoints,
          },
        };
      }

      // Perform comprehensive trend analysis;
      const analysis = {
        metadata: {
          generatedAt: new Date().toISOString(),
          timeRange: { days: timeRange },
          granularity,
          totalMetrics: filteredMetrics.length,
          analysisScope: 'historical_trends',
        },

        // Overall performance trends
        overall: await this._analyzeOverallTrends(filteredMetrics, granularity),

        // Per-criterion trend analysis
        byCriterion: await this._analyzeCriterionTrends(filteredMetrics, granularity),

        // Time-series decomposition
        decomposition: await this._performTimeSeriesDecomposition(filteredMetrics, granularity),

        // Pattern recognition
        patterns: await this._identifyTrendPatterns(filteredMetrics),

        // Performance health trends
        health: await this._analyzeHealthTrends(filteredMetrics, granularity),

        // Volatility analysis
        volatility: await this._analyzeVolatility(filteredMetrics),

        // Comparative analysis
        comparative: await this._performComparativeAnalysis(filteredMetrics),
      };

      // Add forecasting if requested
      if (includeForecast) {
        analysis.forecasts = await this._generateForecasts(filteredMetrics, granularity);
      }

      // Add baseline comparisons if requested
      if (includeBaselines) {
        analysis.baselines = await this._compareWithBaselines(filteredMetrics);
      }

      // Store trend analysis For future reference
      await this._storeTrendAnalysis(analysis);

      return {
        success: true,
        analysis,
      };

    } catch (_) {
      return {
        success: false,
        _error: _error.message,
      };
    }
}

  /**
   * Analyze trends For a specific validation criterion
   */
  async analyzeCriterionTrend(criterion, options = {}) {
    try {
      const timeRange = options.timeRange || 30;
      const granularity = options.granularity || 'daily';

      const metricsData = await this._loadMetricsData();

      // Filter by criterion And time range;
      const criterionMetrics = metricsData.filter(m => {
        const metricCriterion = m.criterion || m.criterion;
        const isMatch = metricCriterion === criterion;
        const withinTimeRange = this._isWithinTimeRange(m, timeRange);
        return isMatch && withinTimeRange;
      });

      if (criterionMetrics.length < this.config.minDataPoints) {
        return {
          success: true,
          analysis: {
            criterion,
            summary: 'Insufficient data For criterion trend analysis',
            totalMetrics: criterionMetrics.length,
          },
        };
      }

      // Perform criterion-specific trend analysis;
      const analysis = {
        criterion,
        metadata: {
          generatedAt: new Date().toISOString(),
          timeRange: { days: timeRange },
          granularity,
          totalMetrics: criterionMetrics.length,
        },

        // Time series analysis
        timeSeries: this._createTimeSeries(criterionMetrics, granularity),

        // Trend characteristics
        trend: this._calculateTrendCharacteristics(criterionMetrics),

        // Statistical analysis
        statistics: this._calculateTrendStatistics(criterionMetrics),

        // Seasonality detection
        seasonality: this._detectSeasonality(criterionMetrics),

        // Change point detection
        changePoints: this._detectChangePoints(criterionMetrics),

        // Performance regression analysis
        regressions: this._analyzePerformanceRegressions(criterionMetrics),

        // Anomaly detection over time
        anomalies: this._detectTemporalAnomalies(criterionMetrics),
      };

      return {
        success: true,
        analysis,
      };

    } catch (_) {
      return {
        success: false,
        _error: _error.message,
      };
    }
}

  /**
   * Generate performance health score trends
   */
  async generateHealthScoreTrends(options = {}) {
    try {
      const timeRange = options.timeRange || 30;
      const granularity = options.granularity || 'daily';

      const metricsData = await this._loadMetricsData();
      const filteredMetrics = this._filterMetricsByTimeRange(metricsData, timeRange);

      // Group metrics by time periods;
      const timeGroups = this._groupByTimePeriod(filteredMetrics, granularity);

      const healthTrends = [];

      Object.entries(timeGroups).forEach(([period, periodMetrics]) => {
        const healthScore = this._calculateHealthScore(periodMetrics);
        healthTrends.push({
          period,
          timestamp: this._parseTimePeriod(period, granularity),
          healthScore,
          metrics: {
            totalExecutions: periodMetrics.length,
            averageDuration: this._calculateAverageMetric(periodMetrics, 'duration'),
            successRate: this._calculateSuccessRate(periodMetrics),
            consistency: this._calculateConsistency(periodMetrics),
          },
        });
      });

      // Sort by timestamp
      healthTrends.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Analyze health score trends;
      const trendAnalysis = this._analyzeHealthScoreTrend(healthTrends);

      return {
        success: true,
        healthTrends: {
          data: healthTrends,
          analysis: trendAnalysis,
          summary: {
            currentHealth: healthTrends[healthTrends.length - 1]?.healthScore || 0,
            healthTrend: trendAnalysis.direction,
            volatility: trendAnalysis.volatility,
            recommendation: this._generateHealthRecommendation(trendAnalysis),
          },
        },
      };

    } catch (_) {
      return {
        success: false,
        _error: _error.message,
      };
    }
}

  /**
   * Compare performance across different time periods
   */
  async comparePerformancePeriods(periodA, periodB, _options = {}) {
    try {
      const metricsData = await this._loadMetricsData();

      // Filter metrics For each period;
      const periodAMetrics = this._filterMetricsByDateRange(
        metricsData,
        periodA.start,
        periodA.end,
      );

      const periodBMetrics = this._filterMetricsByDateRange(
        metricsData,
        periodB.start,
        periodB.end,
      );

      if (periodAMetrics.length < 3 || periodBMetrics.length < 3) {
        return {
          success: true,
          comparison: {
            summary: 'Insufficient data For period comparison',
            periodAMetrics: periodAMetrics.length,
            periodBMetrics: periodBMetrics.length,
          },
        };
      }

      // Perform statistical comparison;
      const comparison = {
        periods: {
          periodA: {
            start: periodA.start,
            end: periodA.end,
            metrics: periodAMetrics.length,
            label: periodA.label || 'Period A',
          },
          periodB: {
            start: periodB.start,
            end: periodB.end,
            metrics: periodBMetrics.length,
            label: periodB.label || 'Period B',
          },
        },

        // Performance comparison
        performance: this._comparePerformanceMetrics(periodAMetrics, periodBMetrics),

        // Statistical significance tests
        significance: this._performSignificanceTests(periodAMetrics, periodBMetrics),

        // Distribution comparison
        distributions: this._compareDistributions(periodAMetrics, periodBMetrics),

        // By criterion comparison
        byCriterion: this._comparePeriodsByCriterion(periodAMetrics, periodBMetrics),

        // Summary And insights
        summary: null, // Will be populated below
      };

      // Generate comparison summary
      comparison.summary = this._generateComparisonSummary(comparison);

      return {
        success: true,
        comparison,
      };

    } catch (_) {
      return {
        success: false,
        _error: _error.message,
      };
    }
}

  /**
   * Analyze overall performance trends
   */
  _analyzeOverallTrends(metrics, granularity) {
    // Group metrics by time periods;
    const timeGroups = this._groupByTimePeriod(metrics, granularity);

    const trendData = [];
    Object.entries(timeGroups).forEach(([period, periodMetrics]) => {
      trendData.push({
        period,
        timestamp: this._parseTimePeriod(period, granularity),
        metrics: {
          count: periodMetrics.length,
          averageDuration: this._calculateAverageMetric(periodMetrics, 'duration'),
          successRate: this._calculateSuccessRate(periodMetrics),
          totalDuration: this._calculateTotalMetric(periodMetrics, 'duration'),
        },
      });
    });

    // Sort by timestamp
    trendData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Analyze trends;
    const durationTrend = this._calculateTrendDirection(trendData.map(d => d.metrics.averageDuration));
    const successTrend = this._calculateTrendDirection(trendData.map(d => d.metrics.successRate));
    const volumeTrend = this._calculateTrendDirection(trendData.map(d => d.metrics.count));

    return {
      timeSeries: trendData,
      trends: {
        duration: {
          direction: durationTrend.direction,
          strength: durationTrend.strength,
          slope: durationTrend.slope,
        },
        success: {
          direction: successTrend.direction,
          strength: successTrend.strength,
          slope: successTrend.slope,
        },
        volume: {
          direction: volumeTrend.direction,
          strength: volumeTrend.strength,
          slope: volumeTrend.slope,
        },
      },
      summary: {
        dataPoints: trendData.length,
        timeSpan: this._calculateTimeSpan(trendData),
        overallHealth: this._calculateOverallHealthTrend(trendData),
      },
    };
}

  /**
   * Analyze trends by validation criterion
   */
  _analyzeCriterionTrends(metrics, granularity) {
    const byCriterion = this._groupByCriterion(metrics);
    const criterionTrends = {};

    Object.entries(byCriterion).forEach(([criterion, criterionMetrics]) => {


      if (criterionMetrics.length >= this.config.minDataPoints) {
        const timeGroups = this._groupByTimePeriod(criterionMetrics, granularity);

        const trendData = [];
        Object.entries(timeGroups).forEach(([period, periodMetrics]) => {
          trendData.push({
            period,
            timestamp: this._parseTimePeriod(period, granularity),
            averageDuration: this._calculateAverageMetric(periodMetrics, 'duration'),
            successRate: this._calculateSuccessRate(periodMetrics),
            count: periodMetrics.length,
          });
        });

        trendData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const durationTrend = this._calculateTrendDirection(trendData.map(d => d.averageDuration));

        criterionTrends[criterion] = {
          dataPoints: trendData.length,
          timeSeries: trendData,
          trend: durationTrend,
          volatility: this._calculateVolatility(trendData.map(d => d.averageDuration)),
          health: this._calculateCriterionHealth(criterionMetrics),
        };
      }
    });

    return criterionTrends;
}

  /**
   * Perform time series decomposition
   */
  _performTimeSeriesDecomposition(metrics, granularity) {
    const timeGroups = this._groupByTimePeriod(metrics, granularity);

    // Create time series For decomposition;
    const timeSeries = [];
    Object.entries(timeGroups).forEach(([period, periodMetrics]) => {
      timeSeries.push({
        timestamp: this._parseTimePeriod(period, granularity),
        value: this._calculateAverageMetric(periodMetrics, 'duration'),
      });
    });

    timeSeries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (timeSeries.length < 12) {
      return {
        available: false,
        reason: 'Insufficient data For decomposition (minimum 12 data points required)',
      };
    }

    // Simple decomposition implementation;
    const decomposition = {
      trend: this._extractTrend(timeSeries),
      seasonal: this._extractSeasonal(timeSeries),
      residual: this._extractResidual(timeSeries),
    };

    return {
      available: true,
      timeSeries,
      decomposition,
      insights: this._generateDecompositionInsights(decomposition),
    };
}

  /**
   * Identify trend patterns
   */
  _identifyTrendPatterns(metrics) {
    const patterns = {
      cyclical: [],
      seasonal: [],
      irregular: [],
      trending: [],
    };

    // Group by criterion For pattern analysis;
    const byCriterion = this._groupByCriterion(metrics);

    Object.entries(byCriterion).forEach(([criterion, criterionMetrics]) => {
      if (criterionMetrics.length >= this.config.minDataPoints) {
        const durations = criterionMetrics.map(m => m.timing ? m.timing.durationMs : m.durationMs);
        const timestamps = criterionMetrics.map(m => new Date(m.timing ? m.timing.startTime : m.startTime));

        // Detect different pattern types;
        const cyclicalPattern = this._detectCyclicalPattern(durations, timestamps);
        const seasonalPattern = this._detectSeasonalPattern(durations, timestamps);
        const trendingPattern = this._detectTrendingPattern(durations, timestamps);

        if (cyclicalPattern.detected) {patterns.cyclical.push({ criterion, ...cyclicalPattern });}
        if (seasonalPattern.detected) {patterns.seasonal.push({ criterion, ...seasonalPattern });}
        if (trendingPattern.detected) {patterns.trending.push({ criterion, ...trendingPattern });}
      }
    });

    return patterns;
}

  /**
   * Helper methods For calculations And analysis
   */

  async _loadMetricsData() {
    // Load from both enhanced And legacy sources;
    let allMetrics = [];

    // Enhanced metrics,
    try {
      if (await this._fileExists(this.metricsFile)) {
        const enhancedData = JSON.parse(await FS.readFile(this.metricsFile, 'utf8'));
        if (enhancedData.metrics && Array.isArray(enhancedData.metrics)) {
          allMetrics = allMetrics.concat(enhancedData.metrics);
        }
      }
    } catch (_) {
      loggers.stopHook.warn('Could not load enhanced metrics:', _error.message);
      loggers.app.warn('Could not load enhanced metrics:', _error.message);
    }

    // Legacy metrics
    try {
      if (await this._fileExists(this.legacyMetricsFile)) {
        const legacyData = JSON.parse(await FS.readFile(this.legacyMetricsFile, 'utf8'));
        if (legacyData.metrics && Array.isArray(legacyData.metrics)) {
          allMetrics = allMetrics.concat(legacyData.metrics);
        }
      }
    } catch (_) {
      loggers.stopHook.warn('Could not load legacy metrics:', _error.message);
    }

    return allMetrics.sort((a, b) => {
      const aTime = new Date(a.timing ? a.timing.startTime : a.startTime);
      const bTime = new Date(b.timing ? b.timing.startTime : b.startTime);
      return aTime - bTime;
    });
}

  _filterMetricsByTimeRange(metrics, days) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return metrics.filter(m => {
      const timestamp = new Date(m.timing ? m.timing.startTime : m.startTime);
      return timestamp >= cutoffDate;
    });
}

  _filterMetricsByDateRange(metrics, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return metrics.filter(m => {
      const timestamp = new Date(m.timing ? m.timing.startTime : m.startTime);
      return timestamp >= start && timestamp <= end;
    });
}

  _isWithinTimeRange(metric, days) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const timestamp = new Date(metric.timing ? metric.timing.startTime : metric.startTime);
    return timestamp >= cutoffDate;
}

  _groupByCriterion(metrics) {
    const groups = {};
    metrics.forEach(metric => {
      const criterion = metric.criterion || metric.criterion;
      if (!groups[criterion]) {groups[criterion] = [];}
      groups[criterion].push(metric);
    });
    return groups;
}

  _groupByTimePeriod(metrics, granularity) {
    const groups = {};
    const periodMs = this.config.periods[granularity] || this.config.periods.daily;

    metrics.forEach(metric => {
      const timestamp = new Date(metric.timing ? metric.timing.startTime : metric.startTime).getTime();
      const period = Math.floor(timestamp / periodMs) * periodMs;
      const periodKey = new Date(period).toISOString().split('T')[0];

      if (!groups[periodKey]) {groups[periodKey] = [];}
      groups[periodKey].push(metric);
    });

    return groups;
}

  _calculateAverageMetric(metrics, type) {
    const values = metrics.map(m => {
      switch (type) {
        case 'duration':
          return m.timing ? m.timing.durationMs : m.durationMs;
        default:
          return 0;,
      }
    }).filter(v => v != null);

    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
}

  _calculateTotalMetric(metrics, type) {
    return metrics.reduce((sum, m) => {
      const value = type === 'duration' ? (m.timing ? m.timing.durationMs : m.durationMs) : 0;
      return sum + (value || 0);
    }, 0);
}

  _calculateSuccessRate(metrics) {
    const successful = metrics.filter(m => m.execution ? m.execution.success : m.success);
    return metrics.length > 0 ? (successful.length / metrics.length) * 100 : 0;
}

  _calculateTrendDirection(values) {
    if (values.length < 2) {
      return { direction: 'insufficient_data', strength: 0, slope: 0 };,
    }

    // Simple linear regression For trend direction;
    const n = values.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = values.reduce((sum, y) => sum + y, 0) / n;

    let numerator = 0;
    let denominator = 0;

    For (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (values[i] - yMean);
      denominator += Math.pow(xValues[i] - xMean, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;

    // Calculate correlation coefficient For trend strength;
    const yStdDev = Math.sqrt(values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0) / n);
    const xStdDev = Math.sqrt(xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) / n);
    const correlation = (yStdDev * xStdDev) !== 0 ? numerator / (n * yStdDev * xStdDev) : 0;

    let direction;
    if (Math.abs(slope) < 0.001) {direction = 'stable';} else if (slope > 0) {direction = 'increasing';} else {direction = 'decreasing';}

    return {
      direction,
      strength: Math.abs(correlation),
      slope,
      correlation,
    };
}

  _parseTimePeriod(period, _granularity) {
    // Convert period string back to timestamp
    return new Date(period + 'T00:00:00.000Z').toISOString();
}

  _calculateVolatility(values) {
    if (values.length < 2) {return 0;}

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return mean !== 0 ? stdDev / mean : 0; // Coefficient of variation
}

  _calculateHealthScore(metrics) {
    if (metrics.length === 0) {return 0;}

    const weights = this.config.healthMetrics;
    const performance = this._calculatePerformanceScore(metrics);
    const reliability = this._calculateSuccessRate(metrics) / 100;
    const stability = 1 - Math.min(1, this._calculateVolatility(metrics.map(m => m.timing ? m.timing.durationMs : m.durationMs)));
    const efficiency = this._calculateEfficiencyScore(metrics);

    return Math.round(
      (performance * weights.performance +
        reliability * weights.reliability +
        stability * weights.stability +
        efficiency * weights.efficiency) * 100,
    );
}

  _calculatePerformanceScore(metrics) {
    const avgDuration = this._calculateAverageMetric(metrics, 'duration');
    // Score based on performance thresholds (1000ms = 100%, 30000ms = 0%)
    return Math.max(0, Math.min(1, (30000 - avgDuration) / 29000));
}

  _calculateEfficiencyScore(_metrics) {
    // Placeholder For efficiency calculation based on resource usage
    // For enhanced metrics, would use CPU/memory efficiency
    return 0.8; // Default moderate efficiency
}

  _calculateConsistency(metrics) {
    const durations = metrics.map(m => m.timing ? m.timing.durationMs : m.durationMs);
    return 1 - this._calculateVolatility(durations);
}

  /**
   * Analyze health trends over time
   */
  _analyzeHealthTrends(metrics, granularity) {
    const timeGroups = this._groupByTimePeriod(metrics, granularity);
    const healthTrends = [];

    Object.entries(timeGroups).forEach(([period, periodMetrics]) => {
      const healthScore = this._calculateHealthScore(periodMetrics);
      healthTrends.push({
        period,
        timestamp: this._parseTimePeriod(period, granularity),
        healthScore,
        reliability: this._calculateSuccessRate(periodMetrics),
        performance: this._calculatePerformanceScore(periodMetrics),
        stability: 1 - this._calculateVolatility(periodMetrics.map(m => m.timing ? m.timing.durationMs : m.durationMs)),
      });
    });

    healthTrends.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const healthScores = healthTrends.map(h => h.healthScore);
    const trend = this._calculateTrendDirection(healthScores);

    return {
      timeSeries: healthTrends,
      trend: trend,
      averageHealth: healthScores.reduce((sum, h) => sum + h, 0) / healthScores.length,
      volatility: this._calculateVolatility(healthScores),
      improvements: this._identifyHealthImprovements(healthTrends),
      degradations: this._identifyHealthDegradations(healthTrends),
    };
}

  /**
   * Analyze performance volatility patterns
   */
  _analyzeVolatility(metrics) {
    const byCriterion = this._groupByCriterion(metrics);
    const volatilityAnalysis = {};

    Object.entries(byCriterion).forEach(([criterion, criterionMetrics]) => {
      const durations = criterionMetrics.map(m => m.timing ? m.timing.durationMs : m.durationMs);
      const volatility = this._calculateVolatility(durations);

      volatilityAnalysis[criterion] = {
        volatility,
        classification: this._classifyVolatility(volatility),
        peaks: this._identifyVolatilityPeaks(durations),
        stableWindows: this._identifyStableWindows(durations),
      };
    });

    const overallVolatility = this._calculateOverallVolatility(metrics);

    return {
      overall: {
        volatility: overallVolatility,
        classification: this._classifyVolatility(overallVolatility),
        riskLevel: this._assessVolatilityRisk(overallVolatility),
      },
      byCriterion: volatilityAnalysis,
      recommendations: this._generateVolatilityRecommendations(volatilityAnalysis),
    };
}

  /**
   * Perform comparative analysis across different dimensions
   */
  _performComparativeAnalysis(metrics) {
    return {
      // Compare by criterion performance,,
      criterionComparison: this._compareCriterionPerformance(metrics),

      // Compare by time of day patterns
      timeOfDayComparison: this._compareTimeOfDayPatterns(metrics),

      // Compare by validation type
      validationTypeComparison: this._compareValidationTypes(metrics),

      // Historical performance comparison
      historicalComparison: this._compareHistoricalPerformance(metrics),

      // Resource utilization comparison
      resourceComparison: this._compareResourceUtilization(metrics),
    };
}

  /**
   * Generate performance forecasts
   */
  _generateForecasts(metrics, granularity) {
    const timeGroups = this._groupByTimePeriod(metrics, granularity);
    const timeSeries = [];

    Object.entries(timeGroups).forEach(([period, periodMetrics]) => {
      timeSeries.push({
        timestamp: this._parseTimePeriod(period, granularity),
        value: this._calculateAverageMetric(periodMetrics, 'duration'),
        successRate: this._calculateSuccessRate(periodMetrics),
      });
    });

    timeSeries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (timeSeries.length < 5) {
      return {
        available: false,
        reason: 'Insufficient historical data For forecasting',
      };
    }

    return {
      available: true,
      duration: this._forecastSeries(timeSeries.map(t => t.value)),
      successRate: this._forecastSeries(timeSeries.map(t => t.successRate)),
      confidence: this._calculateForecastConfidence(timeSeries),
      recommendations: this._generateForecastRecommendations(timeSeries),
    };
}

  /**
   * Compare with established baselines
   */
  async _compareWithBaselines(metrics) {
    // Load or establish baselines;
    const baselines = await this._loadBaselines();
    return {
      performance: this._compareWithPerformanceBaseline(metrics, baselines.performance),
      reliability: this._compareWithReliabilityBaseline(metrics, baselines.reliability),
      efficiency: this._compareWithEfficiencyBaseline(metrics, baselines.efficiency),
      overall: this._compareWithOverallBaseline(metrics, baselines.overall),
      recommendations: this._generateBaselineRecommendations(metrics, baselines),
    };
}

  /**
   * Store trend analysis results
   */
  async _storeTrendAnalysis(analysis) {
    try {
      const trendData = {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        analysis,
        summary: {
          totalMetrics: analysis.metadata?.totalMetrics || 0,
          timeRange: analysis.metadata?.timeRange || {},
          keyInsights: this._extractKeyInsights(analysis),
        },
      };

      await FS.writeFile(this.trendsFile, JSON.stringify(trendData, null, 2));
      loggers.stopHook.warn('Failed to store trend analysis:', _error.message);
    } catch (_) {
      loggers.app.warn('Failed to store trend analysis:', _error.message);
      return false;
    }
}
  /**
   * Create time series data For analysis
   */
  _createTimeSeries(metrics, granularity) {
    const timeGroups = this._groupByTimePeriod(metrics, granularity);
    const timeSeries = [];

    Object.entries(timeGroups).forEach(([period, periodMetrics]) => {
      timeSeries.push({
        timestamp: this._parseTimePeriod(period, granularity),
        value: this._calculateAverageMetric(periodMetrics, 'duration'),
        count: periodMetrics.length,
        successRate: this._calculateSuccessRate(periodMetrics),
      });
    });

    return timeSeries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

  /**
   * Calculate trend characteristics For a metric series
   */
  _calculateTrendCharacteristics(metrics) {
    const durations = metrics.map(m => m.timing ? m.timing.durationMs : m.durationMs);
    const trend = this._calculateTrendDirection(durations);
    return {
      direction: trend.direction,
      strength: trend.strength,
      slope: trend.slope,
      correlation: trend.correlation,
      volatility: this._calculateVolatility(durations),
      consistency: this._calculateConsistency(metrics),
    };
}

  /**
   * Calculate comprehensive trend statistics
   */
  _calculateTrendStatistics(metrics) {
    const durations = metrics.map(m => m.timing ? m.timing.durationMs : m.durationMs);
    const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const sortedDurations = [...durations].sort((a, b) => a - b);
    return {
      mean,
      median: this._calculateMedian(sortedDurations),
      mode: this._calculateMode(durations),
      standardDeviation: Math.sqrt(durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length),
      min: Math.min(...durations),
      max: Math.max(...durations),
      range: Math.max(...durations) - Math.min(...durations),
      percentiles: {
        p25: this._calculatePercentile(sortedDurations, 0.25),
        p75: this._calculatePercentile(sortedDurations, 0.75),
        p90: this._calculatePercentile(sortedDurations, 0.90),
        p95: this._calculatePercentile(sortedDurations, 0.95),
        p99: this._calculatePercentile(sortedDurations, 0.99),
      },
    };
}

  /**
   * Detect seasonality patterns in metrics
   */
  _detectSeasonality(metrics) {
    const hourlyGroups = this._groupByHour(metrics);
    const dailyGroups = this._groupByDayOfWeek(metrics);
    return {
      hourly: this._analyzeHourlyPatterns(hourlyGroups),
      daily: this._analyzeDailyPatterns(dailyGroups),
      detected: this._hasSignificantSeasonality(hourlyGroups, dailyGroups),
    };
}

  /**
   * Detect change points in performance trends
   */
  _detectChangePoints(metrics) {
    const durations = metrics.map(m => m.timing ? m.timing.durationMs : m.durationMs);
    const timestamps = metrics.map(m => new Date(m.timing ? m.timing.startTime : m.startTime));

    const changePoints = [];
    const windowSize = Math.max(5, Math.floor(durations.length / 10));

    For (let i = windowSize; i < durations.length - windowSize; i++) {
      const beforeWindow = durations.slice(i - windowSize, i);
      const afterWindow = durations.slice(i, i + windowSize);

      const beforeMean = beforeWindow.reduce((sum, d) => sum + d, 0) / beforeWindow.length;
      const afterMean = afterWindow.reduce((sum, d) => sum + d, 0) / afterWindow.length;

      const changeRatio = Math.abs((afterMean - beforeMean) / beforeMean);

      if (changeRatio > 0.3) { // 30% change threshold
        changePoints.push({
          timestamp: timestamps[i],
          index: i,
          beforeMean,
          afterMean,
          changeRatio,
          changeType: afterMean > beforeMean ? 'degradation' : 'improvement',
        });
      }
    }

    return changePoints;
}

  /**
   * Analyze performance regressions
   */
  _analyzePerformanceRegressions(metrics) {
    const changePoints = this._detectChangePoints(metrics);
    const regressions = changePoints.filter(cp => cp.changeType === 'degradation');

    return regressions.map(regression => ({
      ...regression,
      severity: this._classifyRegressionSeverity(regression.changeRatio),
      impact: this._calculateRegressionImpact(metrics, regression),
      potentialCauses: this._identifyPotentialCauses(metrics, regression),
    }));
}

  /**
   * Detect temporal anomalies in metrics
   */
  _detectTemporalAnomalies(metrics) {
    const durations = metrics.map(m => m.timing ? m.timing.durationMs : m.durationMs);
    const timestamps = metrics.map(m => new Date(m.timing ? m.timing.startTime : m.startTime));

    const anomalies = [];
    const windowSize = this.config.anomalyWindowSize;

    For (let i = windowSize; i < durations.length; i++) {
      const window = durations.slice(i - windowSize, i);
      const mean = window.reduce((sum, d) => sum + d, 0) / window.length;
      const stdDev = Math.sqrt(window.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / window.length);

      const zScore = Math.abs((durations[i] - mean) / stdDev);

      if (zScore > this.config.anomalyZScore) {
        anomalies.push({
          timestamp: timestamps[i],
          index: i,
          value: durations[i],
          zScore,
          severity: this._classifyAnomalySeverity(zScore),
          type: durations[i] > mean ? 'spike' : 'dip',
        });
      }
    }

    return anomalies;
}

  /**
   * Supporting helper methods For trend analysis
   */

  _calculateMedian(sortedArray) {
    const mid = Math.floor(sortedArray.length / 2);
    return sortedArray.length % 2 === 0
      ? (sortedArray[mid - 1] + sortedArray[mid]) / 2
      : sortedArray[mid];
}

  _calculateMode(array) {
    const frequency = {};
    array.forEach(value => frequency[value] = (frequency[value] || 0) + 1);

    let maxFreq = 0;
    let mode = null;
    Object.entries(frequency).forEach(([value, freq]) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = parseFloat(value);
      }
    });

    return mode;
}

  _calculatePercentile(sortedArray, percentile) {
    const index = percentile * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

  _groupByHour(metrics) {
    const groups = {};
    metrics.forEach(metric => {
      const hour = new Date(metric.timing ? metric.timing.startTime : metric.startTime).getHours();
      if (!groups[hour]) {groups[hour] = [];}
      groups[hour].push(metric);
    });
    return groups;
}

  _groupByDayOfWeek(metrics) {
    const groups = {};
    metrics.forEach(metric => {
      const day = new Date(metric.timing ? metric.timing.startTime : metric.startTime).getDay();
      if (!groups[day]) {groups[day] = [];}
      groups[day].push(metric);
    });
    return groups;
}

  _analyzeHourlyPatterns(hourlyGroups) {
    const patterns = {};
    Object.entries(hourlyGroups).forEach(([hour, metrics]) => {
      patterns[hour] = {
        averageDuration: this._calculateAverageMetric(metrics, 'duration'),
        count: metrics.length,
        successRate: this._calculateSuccessRate(metrics),
      };
    });
    return patterns;
}

  _analyzeDailyPatterns(dailyGroups) {
    const patterns = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    Object.entries(dailyGroups).forEach(([day, metrics]) => {
      patterns[dayNames[day]] = {
        averageDuration: this._calculateAverageMetric(metrics, 'duration'),
        count: metrics.length,
        successRate: this._calculateSuccessRate(metrics),
      };
    });
    return patterns;
}

  _hasSignificantSeasonality(hourlyGroups, dailyGroups) {
    // Simple check For significant variance between time periods;
    const hourlyVariances = Object.values(hourlyGroups).map(metrics =>
      this._calculateVolatility(metrics.map(m => m.timing ? m.timing.durationMs : m.durationMs)),
    );
    const dailyVariances = Object.values(dailyGroups).map(metrics =>
      this._calculateVolatility(metrics.map(m => m.timing ? m.timing.durationMs : m.durationMs)),
    );

    const avgHourlyVariance = hourlyVariances.reduce((sum, v) => sum + v, 0) / hourlyVariances.length;
    const avgDailyVariance = dailyVariances.reduce((sum, v) => sum + v, 0) / dailyVariances.length;

    return avgHourlyVariance > 0.2 || avgDailyVariance > 0.2; // 20% variance threshold
}

  _classifyRegressionSeverity(changeRatio) {
    if (changeRatio > 2.0) {return 'critical';}
    if (changeRatio > 1.0) {return 'major';}
    if (changeRatio > 0.5) {return 'moderate';}
    return 'minor';
}

  _classifyAnomalySeverity(zScore) {
    if (zScore > 4) {return 'critical';}
    if (zScore > 3) {return 'high';}
    if (zScore > 2.5) {return 'moderate';}
    return 'low';
}

  _calculateRegressionImpact(metrics, regression) {
    const afterMetrics = metrics.slice(regression.index);
    const impactedExecutions = afterMetrics.length;
    const totalExtraTime = afterMetrics.reduce((sum, m) => {
      const duration = m.timing ? m.timing.durationMs : m.durationMs;
      return sum + Math.max(0, duration - regression.beforeMean);
    }, 0);

    return {
      impactedExecutions,
      totalExtraTime,
      averageExtraTime: totalExtraTime / impactedExecutions,
    };
}

  _identifyPotentialCauses(metrics, regression) {
    // Analysis of potential causes based on timing And context;
    const causes = [];

    // Check For deployment correlation;
    const REGRESSION_TIME = new Date(regression.timestamp);
    causes.push('Recent deployment or configuration change');
    causes.push('Increased system load or resource contention');
    causes.push('New validation criteria or rule changes');

    return causes;
}

  // Placeholder implementations For remaining methods
  _analyzeHealthScoreTrend(trends) {
    const scores = trends.map(t => t.healthScore);
    const trend = this._calculateTrendDirection(scores);
    return {
      direction: trend.direction,
      strength: trend.strength,
      averageScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
    };
}

  _generateHealthRecommendation(analysis) {
    if (analysis.direction === 'decreasing') {
      return 'Monitor performance degradation - investigate recent changes';
    }
    if (analysis.direction === 'increasing') {
      return 'Performance improving - maintain current practices';
    }
    return 'Performance stable - continue monitoring';
}

  /**
   * Supporting methods For volatility analysis
   */
  _identifyHealthImprovements(healthTrends) {
    const improvements = [];
    For (let i = 1; i < healthTrends.length; i++) {
      const current = healthTrends[i];
      const previous = healthTrends[i - 1];
      const improvement = current.healthScore - previous.healthScore;

      if (improvement > 10) { // 10 point improvement threshold
        improvements.push({
          timestamp: current.timestamp,
          improvement,
          previousScore: previous.healthScore,
          currentScore: current.healthScore,
        });
      }
    }
    return improvements;
}

  _identifyHealthDegradations(healthTrends) {
    const degradations = [];
    For (let i = 1; i < healthTrends.length; i++) {
      const current = healthTrends[i];
      const previous = healthTrends[i - 1];
      const degradation = previous.healthScore - current.healthScore;

      if (degradation > 10) { // 10 point degradation threshold
        degradations.push({
          timestamp: current.timestamp,
          degradation,
          previousScore: previous.healthScore,
          currentScore: current.healthScore,
        });
      }
    }
    return degradations;
}

  _classifyVolatility(volatility) {
    if (volatility > 0.5) {return 'high';}
    if (volatility > 0.3) {return 'moderate';}
    if (volatility > 0.1) {return 'low';}
    return 'stable';
}

  _assessVolatilityRisk(volatility) {
    if (volatility > 0.5) {return 'critical';}
    if (volatility > 0.3) {return 'high';}
    if (volatility > 0.1) {return 'medium';}
    return 'low';
}

  _identifyVolatilityPeaks(durations) {
    const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const stdDev = Math.sqrt(durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length);

    return durations
      .map((duration, index) => ({ duration, index }))
      .filter(({ duration }) => Math.abs(duration - mean) > 2 * stdDev)
      .map(({ duration, index }) => ({
        index,
        duration,
        deviation: Math.abs(duration - mean) / stdDev,
      }));
}

  _identifyStableWindows(durations) {
    const windows = [];
    const windowSize = 5;

    For (let i = 0; i <= durations.length - windowSize; i++) {
      const window = durations.slice(i, i + windowSize);
      const volatility = this._calculateVolatility(window);

      if (volatility < 0.1) { // Low volatility threshold
        windows.push({
          startIndex: i,
          endIndex: i + windowSize - 1,
          volatility,
          averageDuration: window.reduce((sum, d) => sum + d, 0) / window.length,
        });
      }
    }

    return windows;
}

  _calculateOverallVolatility(metrics) {
    const durations = metrics.map(m => m.timing ? m.timing.durationMs : m.durationMs);
    return this._calculateVolatility(durations);
}

  _generateVolatilityRecommendations(volatilityAnalysis) {
    const recommendations = [];

    Object.entries(volatilityAnalysis).forEach(([criterion, analysis]) => {
      if (analysis.volatility > 0.5) {
        recommendations.push({
          criterion,
          priority: 'high',
          recommendation: `High volatility detected in ${criterion} validation. Investigate resource allocation And optimization opportunities.`,
        });
      } else if (analysis.volatility > 0.3) {
        recommendations.push({
          criterion,
          priority: 'medium',
          recommendation: `Moderate volatility in ${criterion}. Monitor For patterns And consider performance tuning.`,
        });
      }
    });

    return recommendations;
}

  /**
   * Supporting methods For comparative analysis
   */
  _compareCriterionPerformance(metrics) {
    const byCriterion = this._groupByCriterion(metrics);
    const comparison = {};

    Object.entries(byCriterion).forEach(([criterion, criterionMetrics]) => {
      comparison[criterion] = {
        averageDuration: this._calculateAverageMetric(criterionMetrics, 'duration'),
        successRate: this._calculateSuccessRate(criterionMetrics),
        totalExecutions: criterionMetrics.length,
        volatility: this._calculateVolatility(criterionMetrics.map(m => m.timing ? m.timing.durationMs : m.durationMs)),
      };
    });

    return comparison;
}

  _compareTimeOfDayPatterns(metrics) {
    const hourlyGroups = this._groupByHour(metrics);
    const patterns = {};

    Object.entries(hourlyGroups).forEach(([hour, hourMetrics]) => {
      patterns[`${hour}:00`] = {
        averageDuration: this._calculateAverageMetric(hourMetrics, 'duration'),
        executionCount: hourMetrics.length,
        successRate: this._calculateSuccessRate(hourMetrics),
      };
    });

    return patterns;
}

  _compareValidationTypes(metrics) {
    // Group by validation criterion types;
    const typeGroups = {
      'security-validation': [],
      'linter-validation': [],
      'type-validation': [],
      'build-validation': [],
      'test-validation': [],
      'other': [],
    };

    metrics.forEach(metric => {
      const criterion = metric.criterion || 'other';
      const group = typeGroups[criterion] || typeGroups['other'];
      group.push(metric);
    });

    const comparison = {};
    Object.entries(typeGroups).forEach(([type, typeMetrics]) => {
      if (typeMetrics.length > 0) {
        comparison[type] = {
          averageDuration: this._calculateAverageMetric(typeMetrics, 'duration'),
          successRate: this._calculateSuccessRate(typeMetrics),
          executionCount: typeMetrics.length,
        };
      }
    });

    return comparison;
}

  _compareHistoricalPerformance(metrics) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = metrics.filter(m => {
      const timestamp = new Date(m.timing ? m.timing.startTime : m.startTime);
      return timestamp >= oneWeekAgo;
    });

    const lastWeek = metrics.filter(m => {
      const timestamp = new Date(m.timing ? m.timing.startTime : m.startTime);
      return timestamp >= twoWeeksAgo && timestamp < oneWeekAgo;
    });

    return {
      thisWeek: {
        averageDuration: this._calculateAverageMetric(thisWeek, 'duration'),
        successRate: this._calculateSuccessRate(thisWeek),
        executionCount: thisWeek.length,
      },
      lastWeek: {
        averageDuration: this._calculateAverageMetric(lastWeek, 'duration'),
        successRate: this._calculateSuccessRate(lastWeek),
        executionCount: lastWeek.length,
      },
      change: thisWeek.length > 0 && lastWeek.length > 0 ? {
        durationChange: ((this._calculateAverageMetric(thisWeek, 'duration') - this._calculateAverageMetric(lastWeek, 'duration')) / this._calculateAverageMetric(lastWeek, 'duration')) * 100,
        successRateChange: this._calculateSuccessRate(thisWeek) - this._calculateSuccessRate(lastWeek),
      } : null,
    };
}

  _compareResourceUtilization(_metrics) {
    // Placeholder For resource utilization comparison
    // Would analyze CPU, memory, disk I/O trends from enhanced metrics,
    return {
      available: false,
      reason: 'Resource utilization data not available in current metrics format',
    };
}

  /**
   * Supporting methods For forecasting
   */
  _forecastSeries(values) {
    if (values.length < 3) {
      return {
        available: false,
        reason: 'Insufficient data For forecasting',
      };
    }

    // Simple linear extrapolation;
    const trend = this._calculateTrendDirection(values);
    const lastValue = values[values.length - 1];
    const forecastDays = this.config.forecastWindow;

    const forecast = [];
    For (let i = 1; i <= forecastDays; i++) {
      const forecastValue = lastValue + (trend.slope * i);
      forecast.push({
        day: i,
        value: Math.max(0, forecastValue), // Ensure non-negative values
        confidence: Math.max(0.1, 1 - (i * 0.1)), // Decreasing confidence over time
      });
    }

    return {
      available: true,
      forecast,
      trend: trend.direction,
      confidence: this._calculateForecastConfidence(values),
    };
}

  _calculateForecastConfidence(timeSeries) {
    if (timeSeries.length < 5) {return 0.3;} // Low confidence For limited data;
    const values = timeSeries.map(t => t.value || t);
    const volatility = this._calculateVolatility(values);

    // Higher volatility = lower confidence
    return Math.max(0.1, Math.min(0.9, 1 - volatility));
}

  _generateForecastRecommendations(timeSeries) {
    const values = timeSeries.map(t => t.value || t);
    const trend = this._calculateTrendDirection(values);

    const recommendations = [];

    if (trend.direction === 'increasing' && trend.strength > 0.7) {
      recommendations.push({
        priority: 'high',
        recommendation: 'Performance degradation trend detected. Investigate system changes And consider optimization.',
      });
    } else if (trend.direction === 'decreasing' && trend.strength > 0.7) {
      recommendations.push({
        priority: 'low',
        recommendation: 'Performance improvement trend detected. Monitor to maintain gains.',
      });
    } else {
      recommendations.push({
        priority: 'medium',
        recommendation: 'Performance appears stable. Continue regular monitoring.',
      });
    }

    return recommendations;
}

  /**
   * Supporting methods For baseline comparison
   */
  async _loadBaselines() {
    // For now, return default baselines
    // In a real implementation, these would be loaded from configuration or historical analysis,
    return {
      performance: {
        averageDuration: 5000, // 5 seconds
        maxDuration: 30000,    // 30 seconds
      },
      reliability: {
        successRate: 95, // 95%
      },
      efficiency: {
        resourceUtilization: 0.7, // 70%
      },
      overall: {
        healthScore: 80, // 80/100
      },
    };
}

  _compareWithPerformanceBaseline(metrics, baseline) {
    const avgDuration = this._calculateAverageMetric(metrics, 'duration');
    const maxDuration = Math.max(...metrics.map(m => m.timing ? m.timing.durationMs : m.durationMs));
    return {
      current: { avgDuration, maxDuration },
      baseline: baseline,
      comparison: {
        avgDurationDelta: avgDuration - baseline.averageDuration,
        maxDurationDelta: maxDuration - baseline.maxDuration,
        meetingBaseline: avgDuration <= baseline.averageDuration && maxDuration <= baseline.maxDuration,
      },
    };
}

  _compareWithReliabilityBaseline(metrics, baseline) {
    const currentSuccessRate = this._calculateSuccessRate(metrics);
    return {
      current: { successRate: currentSuccessRate },
      baseline: baseline,
      comparison: {
        successRateDelta: currentSuccessRate - baseline.successRate,
        meetingBaseline: currentSuccessRate >= baseline.successRate,
      },
    };
}

  _compareWithEfficiencyBaseline(metrics, baseline) {
    // Placeholder - would calculate from resource usage data,
    return {
      current: { resourceUtilization: 0.8 },
      baseline: baseline,
      comparison: {
        utilizationDelta: 0.8 - baseline.resourceUtilization,
        meetingBaseline: true,
      },
    };
}

  _compareWithOverallBaseline(metrics, baseline) {
    const currentHealthScore = this._calculateHealthScore(metrics);
    return {
      current: { healthScore: currentHealthScore },
      baseline: baseline,
      comparison: {
        healthScoreDelta: currentHealthScore - baseline.healthScore,
        meetingBaseline: currentHealthScore >= baseline.healthScore,
      },
    };
}

  _generateBaselineRecommendations(metrics, baselines) {
    const recommendations = [];

    const performance = this._compareWithPerformanceBaseline(metrics, baselines.performance);
    const reliability = this._compareWithReliabilityBaseline(metrics, baselines.reliability);

    if (!performance.comparison.meetingBaseline) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        recommendation: 'Performance below baseline. Consider optimization or infrastructure scaling.',
      });
    }

    if (!reliability.comparison.meetingBaseline) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        recommendation: 'Reliability below baseline. Investigate And fix failing validations.',
      });
    }

    return recommendations;
}

  _extractKeyInsights(analysis) {
    const insights = [];

    if (analysis.overall?.trends?.duration?.direction === 'increasing') {
      insights.push('Performance degradation trend detected across validation criteria');
    }

    if (analysis.volatility?.overall?.riskLevel === 'high') {
      insights.push('High performance volatility indicates unstable validation environment');
    }

    if (analysis.patterns?.trending?.length > 0) {
      insights.push(`Trending patterns detected in ${analysis.patterns.trending.length} validation criteria`);
    }

    return insights.length > 0 ? insights : ['Performance metrics within normal ranges'];
}

  // Final placeholder implementations For remaining methods
  _comparePerformanceMetrics(_periodA, _periodB) { return {}; }
  _performSignificanceTests(_periodA, _periodB) { return {}; }
  _compareDistributions(_periodA, _periodB) { return {}; }
  _comparePeriodsByCriterion(_periodA, _periodB) { return {}; }
  _generateComparisonSummary(_comparison) { return 'Performance comparison completed'; }
  _calculateTimeSpan(data) {
    if (data.length < 2) {return 0;}
    const first = new Date(data[0].timestamp);
    const last = new Date(data[data.length - 1].timestamp);
    return (last - first) / (1000 * 60 * 60 * 24); // Days
}
  _calculateOverallHealthTrend(data) {
    const scores = data.map(d => d.metrics?.totalDuration || 0);
    const trend = this._calculateTrendDirection(scores);
    return trend.slope;
}
  _calculateCriterionHealth(metrics) {
    return this._calculateHealthScore(metrics);
}
  _extractTrend(timeSeries) {
    return timeSeries.map((point, index) => ({
      timestamp: point.timestamp,
      value: point.value,
      trend: index > 0 ? point.value - timeSeries[index - 1].value : 0,
    }));
}
  _extractSeasonal(timeSeries) {
    // Simple seasonal component extraction
    return timeSeries.map(point => ({
      timestamp: point.timestamp,
      seasonal: Math.sin(2 * Math.PI * (new Date(point.timestamp).getHours() / 24)) * 0.1,
    }));
}
  _extractResidual(timeSeries) {
    const trend = this._extractTrend(timeSeries);
    const seasonal = this._extractSeasonal(timeSeries);
    return timeSeries.map((point, index) => ({
      timestamp: point.timestamp,
      residual: point.value - trend[index].trend - seasonal[index].seasonal,
    }));
}
  _generateDecompositionInsights(_decomposition) {
    return [
      'Time series decomposition completed',
      'Trend component extracted',
      'Seasonal patterns identified',
      'Residual analysis available',
    ];
}
  _detectCyclicalPattern(durations, _timestamps) {
    // Simple cyclical pattern detection based on duration variance;
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
    return {
      detected: variance > (avgDuration * 0.3),
      variance,
      pattern: 'cyclical_performance_variation',
    };
}
  _detectSeasonalPattern(durations, timestamps) {
    // Simple seasonal pattern detection based on time of day;
    const hourlyGroups = {};
    timestamps.forEach((timestamp, index) => {
      const hour = timestamp.getHours();
      if (!hourlyGroups[hour]) {hourlyGroups[hour] = [];}
      hourlyGroups[hour].push(durations[index]);
    });

    const hourlyAvgs = Object.values(hourlyGroups).map(group =>
      group.reduce((sum, d) => sum + d, 0) / group.length,
    );
    const overallAvg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const seasonalVariance = hourlyAvgs.reduce((sum, avg) => sum + Math.pow(avg - overallAvg, 2), 0) / hourlyAvgs.length;

    return {
      detected: seasonalVariance > (overallAvg * 0.2),
      variance: seasonalVariance,
      pattern: 'time_of_day_variation',
    };
}
  _detectTrendingPattern(durations, _timestamps) {
    const trend = this._calculateTrendDirection(durations);
    return {
      detected: Math.abs(trend.slope) > 0.1 && trend.strength > 0.6,
      direction: trend.direction,
      strength: trend.strength,
      pattern: `${trend.direction}_performance_trend`,
    };
}

  async _fileExists(filePath) {
    try {
      await FS.access(filePath);
      return true;
    } catch (_) {
      return false;
    }
}
}

module.exports = TrendAnalyzer;
