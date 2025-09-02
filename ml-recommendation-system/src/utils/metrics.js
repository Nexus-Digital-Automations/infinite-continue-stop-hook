/**
 * Comprehensive Metrics Collection System for ML Recommendation Engine
 * 
 * Provides detailed performance monitoring, statistical analysis, and metrics
 * collection for machine learning operations. Features include:
 * - Real-time performance tracking
 * - Statistical analysis and aggregation
 * - Memory usage monitoring
 * - Model performance metrics
 * - System resource utilization
 * 
 * Dependencies: Built-in Node.js modules only for minimal overhead
 * Usage: import { MetricsCollector } from './utils/metrics.js'
 * 
 * @author Claude Code ML Engine
 * @version 1.0.0
 */

import { performance } from 'perf_hooks'
import { EventEmitter } from 'events'
import os from 'os'

/**
 * Comprehensive Metrics Collector class
 * 
 * Collects, aggregates, and analyzes performance metrics for ML operations
 * with real-time monitoring and statistical analysis capabilities.
 */
export class MetricsCollector extends EventEmitter {
  /**
   * Initialize the Metrics Collector
   * 
   * @param {string} namespace - Metrics namespace for organization
   * @param {Object} options - Configuration options
   * @param {number} options.historySize - Number of historical data points to keep (default: 1000)
   * @param {number} options.aggregationInterval - Interval for metric aggregation in ms (default: 60000)
   * @param {boolean} options.enableSystemMetrics - Enable system resource monitoring (default: true)
   * @param {boolean} options.enableAutoFlush - Enable automatic metric flushing (default: true)
   */
  constructor (namespace, options = {}) {
    super()
    
    this.namespace = namespace
    this.options = {
      historySize: 1000,
      aggregationInterval: 60000, // 1 minute
      enableSystemMetrics: true,
      enableAutoFlush: true,
      enableDetailedMemoryTracking: true,
      ...options
    }
    
    // Core metrics storage
    this.metrics = {
      counters: new Map(), // Simple counters
      gauges: new Map(), // Current value metrics
      histograms: new Map(), // Distribution metrics
      timers: new Map(), // Timing metrics
      rates: new Map() // Rate-based metrics
    }
    
    // Performance tracking for metrics system itself
    this.systemMetrics = {
      startTime: Date.now(),
      totalOperations: 0,
      metricsCollected: 0,
      lastFlushTime: Date.now(),
      memoryUsage: process.memoryUsage()
    }
    
    // Historical data storage with circular buffer
    this.history = {
      inference: [],
      training: [],
      system: [],
      errors: []
    }
    
    // Aggregated statistics cache
    this.aggregatedStats = {
      lastUpdate: Date.now(),
      inference: null,
      training: null,
      system: null
    }
    
    // Initialize system monitoring
    if (this.options.enableSystemMetrics) {
      this._startSystemMonitoring()
    }
    
    // Initialize automatic aggregation
    if (this.options.enableAutoFlush) {
      this._startAutoAggregation()
    }
    
    this.emit('initialized', {
      namespace: this.namespace,
      options: this.options,
      timestamp: new Date().toISOString()
    })
  }
  
  /**
   * Record inference operation metrics
   * 
   * Tracks timing, throughput, and quality metrics for ML inference operations.
   * 
   * @param {number} duration - Inference duration in milliseconds
   * @param {number} resultCount - Number of results generated
   * @param {Object} additional - Additional metrics data
   * @param {number} additional.confidence - Average confidence score
   * @param {number} additional.inputSize - Size of input data
   * @param {number} additional.memoryUsed - Memory usage during inference
   */
  recordInference (duration, resultCount, additional = {}) {
    const timestamp = Date.now()
    
    // Update counters
    this._incrementCounter('inference_total')
    this._incrementCounter('inference_results_total', resultCount)
    
    // Update timing metrics
    this._recordTimer('inference_duration', duration)
    
    // Update gauges
    this._setGauge('last_inference_duration', duration)
    this._setGauge('last_inference_results', resultCount)
    
    // Calculate throughput (results per second)
    const throughput = resultCount / (duration / 1000)
    this._recordHistogram('inference_throughput', throughput)
    
    // Record detailed metrics
    const detailedMetrics = {
      timestamp,
      duration,
      resultCount,
      throughput,
      confidence: additional.confidence || 0,
      inputSize: additional.inputSize || 0,
      memoryUsed: additional.memoryUsed || 0,
      namespace: this.namespace
    }
    
    // Add to history with size management
    this._addToHistory('inference', detailedMetrics)
    
    // Update system counters
    this.systemMetrics.totalOperations++
    this.systemMetrics.metricsCollected++
    
    // Emit event for real-time monitoring
    this.emit('inferenceRecorded', detailedMetrics)
  }
  
  /**
   * Record model training metrics
   * 
   * Tracks training progress, loss, accuracy, and convergence metrics.
   * 
   * @param {number} epoch - Current training epoch
   * @param {Object} metrics - Training metrics
   * @param {number} metrics.loss - Current loss value
   * @param {number} metrics.accuracy - Current accuracy
   * @param {number} metrics.valLoss - Validation loss
   * @param {number} metrics.valAccuracy - Validation accuracy
   * @param {number} duration - Epoch duration in milliseconds
   */
  recordTraining (epoch, metrics, duration) {
    const timestamp = Date.now()
    
    // Update training counters
    this._incrementCounter('training_epochs_total')
    this._setGauge('current_epoch', epoch)
    
    // Update training metrics
    this._setGauge('training_loss', metrics.loss)
    this._setGauge('training_accuracy', metrics.accuracy)
    this._setGauge('validation_loss', metrics.valLoss)
    this._setGauge('validation_accuracy', metrics.valAccuracy)
    
    // Record epoch duration
    this._recordTimer('epoch_duration', duration)
    
    // Calculate training rate (epochs per hour)
    const epochsPerHour = 3600000 / duration
    this._recordHistogram('training_rate', epochsPerHour)
    
    // Detailed training metrics
    const detailedMetrics = {
      timestamp,
      epoch,
      duration,
      epochsPerHour,
      ...metrics,
      namespace: this.namespace
    }
    
    // Add to history
    this._addToHistory('training', detailedMetrics)
    
    // Update system metrics
    this.systemMetrics.totalOperations++
    this.systemMetrics.metricsCollected++
    
    // Emit training event
    this.emit('trainingRecorded', detailedMetrics)
  }
  
  /**
   * Record error occurrence with categorization
   * 
   * Tracks error rates, types, and patterns for system reliability monitoring.
   * 
   * @param {string} errorType - Type/category of error
   * @param {Error} error - Error object with details
   * @param {Object} context - Additional context about the error
   */
  recordError (errorType, error, context = {}) {
    const timestamp = Date.now()
    
    // Update error counters
    this._incrementCounter('errors_total')
    this._incrementCounter(`errors_by_type_${errorType}`)
    
    // Track error rate
    this._recordRate('error_rate', 1)
    
    // Detailed error information
    const errorMetrics = {
      timestamp,
      errorType,
      message: error.message,
      stack: error.stack,
      context,
      namespace: this.namespace
    }
    
    // Add to error history
    this._addToHistory('errors', errorMetrics)
    
    // Update system metrics
    this.systemMetrics.totalOperations++
    this.systemMetrics.metricsCollected++
    
    // Emit error event
    this.emit('errorRecorded', errorMetrics)
  }
  
  /**
   * Record system resource utilization
   * 
   * Captures CPU, memory, and other system metrics for performance monitoring.
   * 
   * @param {Object} resources - System resource data
   * @param {number} resources.cpuUsage - CPU usage percentage
   * @param {number} resources.memoryUsage - Memory usage in bytes
   * @param {number} resources.heapUsed - Heap memory used in bytes
   * @param {number} resources.heapTotal - Total heap memory in bytes
   */
  recordSystemResources (resources = {}) {
    const timestamp = Date.now()
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()
    
    // Default system metrics if not provided
    const systemResources = {
      timestamp,
      cpuUsage: resources.cpuUsage || 0,
      memoryUsage: resources.memoryUsage || memUsage.rss,
      heapUsed: resources.heapUsed || memUsage.heapUsed,
      heapTotal: resources.heapTotal || memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      cpuUserTime: cpuUsage.user,
      cpuSystemTime: cpuUsage.system,
      loadAverage: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      uptime: process.uptime(),
      namespace: this.namespace
    }
    
    // Update system gauges
    this._setGauge('cpu_usage', systemResources.cpuUsage)
    this._setGauge('memory_usage', systemResources.memoryUsage)
    this._setGauge('heap_used', systemResources.heapUsed)
    this._setGauge('heap_total', systemResources.heapTotal)
    this._setGauge('free_memory', systemResources.freeMemory)
    
    // Add to system history
    this._addToHistory('system', systemResources)
    
    // Update internal system metrics
    this.systemMetrics.memoryUsage = memUsage
    this.systemMetrics.metricsCollected++
    
    // Emit system metrics event
    this.emit('systemMetricsRecorded', systemResources)
  }
  
  /**
   * Increment a counter metric
   * 
   * @param {string} name - Counter name
   * @param {number} value - Value to add (default: 1)
   * @private
   */
  _incrementCounter (name, value = 1) {
    const current = this.metrics.counters.get(name) || 0
    this.metrics.counters.set(name, current + value)
  }
  
  /**
   * Set a gauge metric value
   * 
   * @param {string} name - Gauge name
   * @param {number} value - Current value
   * @private
   */
  _setGauge (name, value) {
    this.metrics.gauges.set(name, {
      value,
      timestamp: Date.now()
    })
  }
  
  /**
   * Record a timer metric
   * 
   * @param {string} name - Timer name
   * @param {number} duration - Duration in milliseconds
   * @private
   */
  _recordTimer (name, duration) {
    if (!this.metrics.timers.has(name)) {
      this.metrics.timers.set(name, [])
    }
    
    const timings = this.metrics.timers.get(name)
    timings.push({
      duration,
      timestamp: Date.now()
    })
    
    // Keep only recent timings
    if (timings.length > this.options.historySize) {
      timings.shift()
    }
  }
  
  /**
   * Record a histogram metric
   * 
   * @param {string} name - Histogram name
   * @param {number} value - Value to record
   * @private
   */
  _recordHistogram (name, value) {
    if (!this.metrics.histograms.has(name)) {
      this.metrics.histograms.set(name, [])
    }
    
    const values = this.metrics.histograms.get(name)
    values.push({
      value,
      timestamp: Date.now()
    })
    
    // Keep only recent values
    if (values.length > this.options.historySize) {
      values.shift()
    }
  }
  
  /**
   * Record a rate metric
   * 
   * @param {string} name - Rate name
   * @param {number} value - Value to record
   * @private
   */
  _recordRate (name, value) {
    if (!this.metrics.rates.has(name)) {
      this.metrics.rates.set(name, [])
    }
    
    const rates = this.metrics.rates.get(name)
    rates.push({
      value,
      timestamp: Date.now()
    })
    
    // Keep only recent rates for calculation
    const oneHourAgo = Date.now() - 3600000
    const recentRates = rates.filter(r => r.timestamp > oneHourAgo)
    this.metrics.rates.set(name, recentRates)
  }
  
  /**
   * Add data to historical storage with size management
   * 
   * @param {string} type - History type (inference, training, system, errors)
   * @param {Object} data - Data to store
   * @private
   */
  _addToHistory (type, data) {
    if (!this.history[type]) {
      this.history[type] = []
    }
    
    this.history[type].push(data)
    
    // Maintain history size limit
    if (this.history[type].length > this.options.historySize) {
      this.history[type].shift()
    }
  }
  
  /**
   * Start automatic system monitoring
   * 
   * Periodically collects system resource metrics for continuous monitoring.
   * 
   * @private
   */
  _startSystemMonitoring () {
    const monitoringInterval = Math.min(this.options.aggregationInterval / 4, 15000) // Every 15 seconds max
    
    this.systemMonitoringTimer = setInterval(() => {
      try {
        this.recordSystemResources()
      } catch (error) {
        this.emit('monitoringError', {
          error: error.message,
          type: 'system_monitoring'
        })
      }
    }, monitoringInterval)
  }
  
  /**
   * Start automatic metrics aggregation
   * 
   * Periodically calculates and caches aggregated statistics.
   * 
   * @private
   */
  _startAutoAggregation () {
    this.aggregationTimer = setInterval(() => {
      try {
        this._updateAggregatedStats()
      } catch (error) {
        this.emit('aggregationError', {
          error: error.message,
          type: 'metrics_aggregation'
        })
      }
    }, this.options.aggregationInterval)
  }
  
  /**
   * Update cached aggregated statistics
   * 
   * Calculates comprehensive statistics from historical data for performance.
   * 
   * @private
   */
  _updateAggregatedStats () {
    const updateTime = Date.now()
    
    // Aggregate inference statistics
    this.aggregatedStats.inference = this._calculateInferenceStats()
    
    // Aggregate training statistics
    this.aggregatedStats.training = this._calculateTrainingStats()
    
    // Aggregate system statistics
    this.aggregatedStats.system = this._calculateSystemStats()
    
    this.aggregatedStats.lastUpdate = updateTime
    
    // Emit aggregation complete event
    this.emit('statsAggregated', {
      timestamp: updateTime,
      namespace: this.namespace
    })
  }
  
  /**
   * Calculate inference statistics from historical data
   * 
   * @returns {Object} Inference statistics
   * @private
   */
  _calculateInferenceStats () {
    const inferenceData = this.history.inference
    if (inferenceData.length === 0) return null
    
    const durations = inferenceData.map(d => d.duration)
    const throughputs = inferenceData.map(d => d.throughput)
    const confidences = inferenceData.map(d => d.confidence).filter(c => c > 0)
    
    return {
      totalInferences: inferenceData.length,
      averageDuration: this._calculateMean(durations),
      medianDuration: this._calculateMedian(durations),
      p95Duration: this._calculatePercentile(durations, 95),
      p99Duration: this._calculatePercentile(durations, 99),
      averageThroughput: this._calculateMean(throughputs),
      averageConfidence: confidences.length > 0 ? this._calculateMean(confidences) : 0,
      standardDeviation: this._calculateStandardDeviation(durations),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations)
    }
  }
  
  /**
   * Calculate training statistics from historical data
   * 
   * @returns {Object} Training statistics
   * @private
   */
  _calculateTrainingStats () {
    const trainingData = this.history.training
    if (trainingData.length === 0) return null
    
    const losses = trainingData.map(d => d.loss).filter(l => l !== undefined)
    const accuracies = trainingData.map(d => d.accuracy).filter(a => a !== undefined)
    const durations = trainingData.map(d => d.duration)
    
    return {
      totalEpochs: trainingData.length,
      currentLoss: losses.length > 0 ? losses[losses.length - 1] : 0,
      currentAccuracy: accuracies.length > 0 ? accuracies[accuracies.length - 1] : 0,
      averageEpochDuration: this._calculateMean(durations),
      lossImprovement: losses.length > 1 ? losses[0] - losses[losses.length - 1] : 0,
      accuracyImprovement: accuracies.length > 1 ? accuracies[accuracies.length - 1] - accuracies[0] : 0,
      trainingStability: losses.length > 1 ? this._calculateStandardDeviation(losses.slice(-10)) : 0
    }
  }
  
  /**
   * Calculate system statistics from historical data
   * 
   * @returns {Object} System statistics
   * @private
   */
  _calculateSystemStats () {
    const systemData = this.history.system
    if (systemData.length === 0) return null
    
    const memoryUsages = systemData.map(d => d.memoryUsage)
    const cpuUsages = systemData.map(d => d.cpuUsage)
    
    return {
      currentMemoryUsage: memoryUsages[memoryUsages.length - 1],
      averageMemoryUsage: this._calculateMean(memoryUsages),
      peakMemoryUsage: Math.max(...memoryUsages),
      currentCpuUsage: cpuUsages[cpuUsages.length - 1],
      averageCpuUsage: this._calculateMean(cpuUsages),
      peakCpuUsage: Math.max(...cpuUsages),
      systemUptime: process.uptime()
    }
  }
  
  /**
   * Calculate mean of array values
   * 
   * @param {Array} values - Array of numbers
   * @returns {number} Mean value
   * @private
   */
  _calculateMean (values) {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }
  
  /**
   * Calculate median of array values
   * 
   * @param {Array} values - Array of numbers
   * @returns {number} Median value
   * @private
   */
  _calculateMedian (values) {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  }
  
  /**
   * Calculate percentile of array values
   * 
   * @param {Array} values - Array of numbers
   * @param {number} percentile - Percentile (0-100)
   * @returns {number} Percentile value
   * @private
   */
  _calculatePercentile (values, percentile) {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }
  
  /**
   * Calculate standard deviation of array values
   * 
   * @param {Array} values - Array of numbers
   * @returns {number} Standard deviation
   * @private
   */
  _calculateStandardDeviation (values) {
    if (values.length === 0) return 0
    const mean = this._calculateMean(values)
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return Math.sqrt(this._calculateMean(squaredDiffs))
  }
  
  /**
   * Get current metrics snapshot
   * 
   * Returns comprehensive current metrics including counters, gauges,
   * histograms, and aggregated statistics.
   * 
   * @returns {Object} Current metrics snapshot
   */
  getCurrentMetrics () {
    return {
      namespace: this.namespace,
      timestamp: new Date().toISOString(),
      counters: Object.fromEntries(this.metrics.counters),
      gauges: Object.fromEntries(this.metrics.gauges),
      timers: this._summarizeTimers(),
      histograms: this._summarizeHistograms(),
      rates: this._summarizeRates(),
      aggregatedStats: this.aggregatedStats,
      systemMetrics: this.systemMetrics
    }
  }
  
  /**
   * Summarize timer metrics
   * 
   * @returns {Object} Timer summaries
   * @private
   */
  _summarizeTimers () {
    const summaries = {}
    
    for (const [name, timings] of this.metrics.timers) {
      const durations = timings.map(t => t.duration)
      summaries[name] = {
        count: durations.length,
        average: this._calculateMean(durations),
        median: this._calculateMedian(durations),
        min: Math.min(...durations),
        max: Math.max(...durations),
        p95: this._calculatePercentile(durations, 95)
      }
    }
    
    return summaries
  }
  
  /**
   * Summarize histogram metrics
   * 
   * @returns {Object} Histogram summaries
   * @private
   */
  _summarizeHistograms () {
    const summaries = {}
    
    for (const [name, entries] of this.metrics.histograms) {
      const values = entries.map(e => e.value)
      summaries[name] = {
        count: values.length,
        average: this._calculateMean(values),
        median: this._calculateMedian(values),
        min: Math.min(...values),
        max: Math.max(...values),
        stdDev: this._calculateStandardDeviation(values)
      }
    }
    
    return summaries
  }
  
  /**
   * Summarize rate metrics
   * 
   * @returns {Object} Rate summaries
   * @private
   */
  _summarizeRates () {
    const summaries = {}
    
    for (const [name, entries] of this.metrics.rates) {
      const now = Date.now()
      const oneMinuteAgo = now - 60000
      const oneHourAgo = now - 3600000
      
      const lastMinute = entries.filter(e => e.timestamp > oneMinuteAgo)
      const lastHour = entries.filter(e => e.timestamp > oneHourAgo)
      
      summaries[name] = {
        current: entries.length > 0 ? entries[entries.length - 1].value : 0,
        perMinute: lastMinute.reduce((sum, e) => sum + e.value, 0),
        perHour: lastHour.reduce((sum, e) => sum + e.value, 0),
        total: entries.reduce((sum, e) => sum + e.value, 0)
      }
    }
    
    return summaries
  }
  
  /**
   * Get cache hit rate for predictions
   * 
   * @returns {number} Cache hit rate percentage
   */
  getCacheHitRate () {
    const cacheHits = this.metrics.counters.get('cache_hits') || 0
    const cacheMisses = this.metrics.counters.get('cache_misses') || 0
    const total = cacheHits + cacheMisses
    
    return total > 0 ? (cacheHits / total) * 100 : 0
  }
  
  /**
   * Reset all metrics and history
   * 
   * Clears all collected metrics and historical data. Use with caution.
   */
  reset () {
    // Clear all metrics
    this.metrics.counters.clear()
    this.metrics.gauges.clear()
    this.metrics.histograms.clear()
    this.metrics.timers.clear()
    this.metrics.rates.clear()
    
    // Clear history
    Object.keys(this.history).forEach(key => {
      this.history[key] = []
    })
    
    // Reset system metrics
    this.systemMetrics = {
      startTime: Date.now(),
      totalOperations: 0,
      metricsCollected: 0,
      lastFlushTime: Date.now(),
      memoryUsage: process.memoryUsage()
    }
    
    // Clear aggregated stats
    this.aggregatedStats = {
      lastUpdate: Date.now(),
      inference: null,
      training: null,
      system: null
    }
    
    this.emit('metricsReset', {
      timestamp: new Date().toISOString(),
      namespace: this.namespace
    })
  }
  
  /**
   * Cleanup and stop all monitoring
   * 
   * Stops timers and cleans up resources. Call during application shutdown.
   */
  cleanup () {
    if (this.systemMonitoringTimer) {
      clearInterval(this.systemMonitoringTimer)
    }
    
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer)
    }
    
    this.emit('cleanup', {
      timestamp: new Date().toISOString(),
      namespace: this.namespace
    })
  }
}

/**
 * Create metrics collector with default configuration
 * 
 * @param {string} namespace - Metrics namespace
 * @param {Object} options - Configuration options
 * @returns {MetricsCollector} Configured metrics collector
 */
export function createMetricsCollector (namespace, options = {}) {
  return new MetricsCollector(namespace, options)
}

/**
 * Global metrics collector for application-wide metrics
 */
export const globalMetrics = new MetricsCollector('ML_SYSTEM', {
  historySize: 2000,
  aggregationInterval: 30000, // 30 seconds
  enableSystemMetrics: true,
  enableAutoFlush: true
})