/**
 * Advanced Logging System for ML Recommendation Engine
 * 
 * Provides comprehensive logging capabilities with multiple output formats,
 * log levels, structured data support, and performance monitoring integration.
 * 
 * Features:
 * - Multiple log levels (debug, info, warn, error, fatal)
 * - Console and file output support
 * - Structured logging with metadata
 * - Performance timing and metrics
 * - Log rotation and archiving
 * - Integration with ML model events
 * 
 * Dependencies: winston, winston-daily-rotate-file
 * Usage: import { Logger } from './utils/logger.js'
 * 
 * @author Claude Code ML Engine
 * @version 1.0.0
 */

import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { performance } from 'perf_hooks'
import path from 'path'
import fs from 'fs'

/**
 * Advanced Logger class with ML-specific features
 * 
 * Provides structured logging with performance metrics, model event tracking,
 * and comprehensive error reporting for machine learning applications.
 */
export class Logger {
  /**
   * Initialize the Logger instance
   * 
   * @param {string} context - Logger context name (e.g., 'NeuralEngine', 'API')
   * @param {Object} options - Logger configuration options
   * @param {string} options.level - Log level (default: 'info')
   * @param {boolean} options.enableConsole - Enable console output (default: true)
   * @param {boolean} options.enableFile - Enable file output (default: true)
   * @param {string} options.logDir - Directory for log files (default: 'logs')
   * @param {boolean} options.enableMetrics - Enable performance metrics (default: true)
   */
  constructor (context, options = {}) {
    this.context = context
    this.options = {
      level: process.env.LOG_LEVEL || 'info',
      enableConsole: true,
      enableFile: true,
      logDir: 'logs',
      enableMetrics: true,
      maxFiles: '14d',
      maxSize: '20m',
      ...options
    }
    
    // Performance tracking for logger operations
    this.performanceMetrics = {
      totalLogs: 0,
      logsByLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        fatal: 0
      },
      averageLogTime: 0,
      lastLogTime: null
    }
    
    // Initialize Winston logger
    this._initializeWinston()
    
    // Log logger initialization
    this.info('Logger initialized', {
      context: this.context,
      level: this.options.level,
      consoleEnabled: this.options.enableConsole,
      fileEnabled: this.options.enableFile,
      metricsEnabled: this.options.enableMetrics
    })
  }
  
  /**
   * Initialize Winston logger with transports and formatters
   * 
   * Sets up console and file transports with custom formatting,
   * log rotation, and error handling.
   * 
   * @private
   */
  _initializeWinston () {
    // Create logs directory if it doesn't exist
    if (this.options.enableFile) {
      const logDir = path.resolve(this.options.logDir)
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
    }
    
    // Define custom log format with metadata
    const customFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        // Create structured log entry
        const logEntry = {
          timestamp,
          level: level.toUpperCase(),
          context: context || this.context,
          message,
          ...meta
        }
        
        return JSON.stringify(logEntry, null, 0)
      })
    )
    
    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss.SSS'
      }),
      winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        const ctx = context || this.context
        const metaStr = Object.keys(meta).length > 0 ? `\\n${JSON.stringify(meta, null, 2)}` : ''
        return `[${timestamp}] ${level} [${ctx}]: ${message}${metaStr}`
      })
    )
    
    // Configure transports
    const transports = []
    
    // Console transport for development and debugging
    if (this.options.enableConsole) {
      transports.push(new winston.transports.Console({
        level: this.options.level,
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true
      }))
    }
    
    // File transports for production logging
    if (this.options.enableFile) {
      // General application logs with rotation
      transports.push(new DailyRotateFile({
        filename: path.join(this.options.logDir, `${this.context.toLowerCase()}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        maxSize: this.options.maxSize,
        maxFiles: this.options.maxFiles,
        format: customFormat,
        level: this.options.level
      }))
      
      // Error-specific logs
      transports.push(new DailyRotateFile({
        filename: path.join(this.options.logDir, `${this.context.toLowerCase()}-errors-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        maxSize: this.options.maxSize,
        maxFiles: this.options.maxFiles,
        format: customFormat,
        level: 'error'
      }))
      
      // Performance metrics logs (if enabled)
      if (this.options.enableMetrics) {
        transports.push(new DailyRotateFile({
          filename: path.join(this.options.logDir, `${this.context.toLowerCase()}-metrics-%DATE%.log`),
          datePattern: 'YYYY-MM-DD',
          maxSize: this.options.maxSize,
          maxFiles: this.options.maxFiles,
          format: customFormat,
          level: 'info'
        }))
      }
    }
    
    // Create Winston logger instance
    this.winston = winston.createLogger({
      level: this.options.level,
      format: customFormat,
      transports,
      exitOnError: false,
      handleExceptions: true,
      handleRejections: true
    })
    
    // Handle transport errors
    this.winston.on('error', (error) => {
      console.error('Logger error:', error)
    })
  }
  
  /**
   * Log debug message with optional metadata
   * 
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug (message, meta = {}) {
    this._log('debug', message, meta)
  }
  
  /**
   * Log info message with optional metadata
   * 
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info (message, meta = {}) {
    this._log('info', message, meta)
  }
  
  /**
   * Log warning message with optional metadata
   * 
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn (message, meta = {}) {
    this._log('warn', message, meta)
  }
  
  /**
   * Log error message with optional metadata
   * 
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata including error details
   */
  error (message, meta = {}) {
    this._log('error', message, meta)
  }
  
  /**
   * Log fatal error message with optional metadata
   * 
   * @param {string} message - Fatal error message
   * @param {Object} meta - Additional metadata including error details
   */
  fatal (message, meta = {}) {
    this._log('fatal', message, meta)
  }
  
  /**
   * Internal logging method with performance tracking
   * 
   * Handles the actual logging operation while tracking performance metrics
   * and adding contextual information.
   * 
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Metadata object
   * @private
   */
  _log (level, message, meta = {}) {
    const startTime = performance.now()
    
    // Add performance and context metadata
    const enrichedMeta = {
      ...meta,
      context: this.context,
      timestamp: new Date().toISOString(),
      processId: process.pid,
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    }
    
    // Add performance timing for expensive operations
    if (meta.operationTime || meta.duration) {
      enrichedMeta.performanceTiming = {
        operationTime: meta.operationTime,
        duration: meta.duration,
        timestamp: Date.now()
      }
    }
    
    // Log to Winston
    this.winston.log(level, message, enrichedMeta)
    
    // Update performance metrics
    if (this.options.enableMetrics) {
      this._updateMetrics(level, performance.now() - startTime)
    }
  }
  
  /**
   * Update internal performance metrics
   * 
   * Tracks logging performance and statistics for monitoring purposes.
   * 
   * @param {string} level - Log level
   * @param {number} logTime - Time taken to log message
   * @private
   */
  _updateMetrics (level, logTime) {
    this.performanceMetrics.totalLogs++
    this.performanceMetrics.logsByLevel[level] = (this.performanceMetrics.logsByLevel[level] || 0) + 1
    
    // Calculate rolling average log time
    const totalLogs = this.performanceMetrics.totalLogs
    this.performanceMetrics.averageLogTime = 
      (this.performanceMetrics.averageLogTime * (totalLogs - 1) + logTime) / totalLogs
    
    this.performanceMetrics.lastLogTime = Date.now()
  }
  
  /**
   * Log ML model training event with metrics
   * 
   * Specialized logging method for machine learning training events
   * including loss, accuracy, and training progress.
   * 
   * @param {string} event - Training event name
   * @param {Object} metrics - Training metrics
   * @param {number} epoch - Current epoch number
   * @param {Object} meta - Additional metadata
   */
  logTrainingEvent (event, metrics, epoch, meta = {}) {
    this.info(`Training Event: ${event}`, {
      ...meta,
      event,
      epoch,
      metrics,
      category: 'ML_TRAINING',
      timestamp: new Date().toISOString()
    })
  }
  
  /**
   * Log ML model inference event with performance metrics
   * 
   * Specialized logging method for inference operations including
   * timing, input/output sizes, and prediction confidence.
   * 
   * @param {Object} inferenceData - Inference operation data
   * @param {number} inferenceData.inferenceTime - Time taken for inference
   * @param {number} inferenceData.inputSize - Size of input data
   * @param {number} inferenceData.outputSize - Size of output data
   * @param {number} inferenceData.confidence - Prediction confidence
   * @param {Object} meta - Additional metadata
   */
  logInferenceEvent (inferenceData, meta = {}) {
    this.info('Model Inference Completed', {
      ...meta,
      ...inferenceData,
      category: 'ML_INFERENCE',
      timestamp: new Date().toISOString()
    })
  }
  
  /**
   * Log system performance metrics
   * 
   * Records system resource utilization including memory, CPU,
   * and other performance indicators.
   * 
   * @param {Object} systemMetrics - System performance data
   * @param {Object} meta - Additional metadata
   */
  logSystemMetrics (systemMetrics, meta = {}) {
    this.info('System Performance Metrics', {
      ...meta,
      ...systemMetrics,
      category: 'SYSTEM_METRICS',
      timestamp: new Date().toISOString()
    })
  }
  
  /**
   * Create timing decorator for function performance measurement
   * 
   * Returns a decorator function that automatically logs execution time
   * for methods or functions.
   * 
   * @param {string} operationName - Name of the operation being timed
   * @returns {Function} Decorator function
   */
  createTimer (operationName) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value
      
      descriptor.value = async function (...args) {
        const startTime = performance.now()
        
        try {
          const result = await originalMethod.apply(this, args)
          const duration = performance.now() - startTime
          
          this.logger.debug(`${operationName} completed`, {
            operationName,
            duration: `${duration.toFixed(2)}ms`,
            success: true,
            category: 'PERFORMANCE'
          })
          
          return result
        } catch (error) {
          const duration = performance.now() - startTime
          
          this.logger.error(`${operationName} failed`, {
            operationName,
            duration: `${duration.toFixed(2)}ms`,
            error: error.message,
            stack: error.stack,
            success: false,
            category: 'PERFORMANCE'
          })
          
          throw error
        }
      }
      
      return descriptor
    }
  }
  
  /**
   * Get logger performance statistics
   * 
   * Returns comprehensive statistics about logger performance
   * and usage patterns.
   * 
   * @returns {Object} Logger performance metrics
   */
  getPerformanceStats () {
    return {
      ...this.performanceMetrics,
      uptime: Date.now() - (this.performanceMetrics.lastLogTime || Date.now()),
      context: this.context,
      options: this.options,
      timestamp: new Date().toISOString()
    }
  }
  
  /**
   * Flush all log transports and close files
   * 
   * Ensures all pending log entries are written and resources are cleaned up.
   * Should be called during application shutdown.
   */
  async close () {
    return new Promise((resolve) => {
      this.winston.end(() => {
        this.info('Logger closed successfully')
        resolve()
      })
    })
  }
}

/**
 * Create logger instance with default configuration
 * 
 * Factory function for creating logger instances with common settings.
 * 
 * @param {string} context - Logger context name
 * @param {Object} options - Logger options
 * @returns {Logger} Configured logger instance
 */
export function createLogger (context, options = {}) {
  return new Logger(context, options)
}

/**
 * Global logger instance for application-wide logging
 * 
 * Provides a default logger that can be used throughout the application
 * without needing to create individual instances.
 */
export const globalLogger = new Logger('ML_SYSTEM', {
  level: process.env.LOG_LEVEL || 'info',
  enableConsole: process.env.NODE_ENV !== 'production',
  enableFile: true,
  enableMetrics: true
})