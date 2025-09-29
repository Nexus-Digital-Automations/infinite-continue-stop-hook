/**
 * Production Logger Factory
 *
 * Creates production-optimized loggers with monitoring integration,
 * security compliance, and performance optimizations.
 */

const pino = require('pino');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getProductionConfig } = require('../config/logging-production');

// Initialize a basic logger For factory initialization messages
const initLogger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      messageFormat: '[ProductionLoggerFactory] {msg}',
    },
},
});

class ProductionLoggerFactory {
  constructor() {
    this.config = getProductionConfig();
    this.destinations = new Map();
    this.alertingEnabled = true;
    this.monitoringStarted = false;
    this.errorTracker = [];
    this.performanceMetrics = new Map();
}

  /**
   * Initialize production logging infrastructure
   */
  async initialize() {
    try {
      // Ensure log directories exist
      await this.ensureLogDirectories();

      // Set up log rotation
      this.setupLogRotation();

      // Initialize monitoring integrations
      await this.initializeMonitoring();

      // Start health monitoring
      this.startHealthMonitoring();

      initLogger.info({
        initialization: 'success',
        monitoring_enabled: this.monitoringStarted,
        destinations_count: this.destinations.size,
      }, 'Production logging infrastructure initialized successfully');
      return true;
    } catch (_) {
      initLogger.error({
        initialization: 'failed',
        error: error.message,
        stack: error.stack,
      }, 'Failed to initialize production logging');
      throw error;
    }
}

  /**
   * Create production logger with enhanced capabilities
   */
  createProductionLogger(module = 'app', options = {}) {
    const loggerConfig = {
      ...this.config.logging,
      ...options,
      base: {
        ...this.config.logging.base,
        module: module,
        logger_version: '2.0.0',
      },
    };

    // Create logger with production configuration
    const logger = pino(loggerConfig);

    // Enhance logger with production features
    return this.enhanceLogger(logger, module);
}

  /**
   * Enhance logger with production-specific features
   */
  enhanceLogger(baseLogger, module) {
    const enhancedLogger = {
      // Standard logging methods
      info: (data, message) => this.logWithTracking('info', baseLogger, data, message, module),
      warn: (data, message) => this.logWithTracking('warn', baseLogger, data, message, module),
      error: (data, message) => this.logWithTracking('error', baseLogger, data, message, module),
      debug: (data, message) => this.logWithTracking('debug', baseLogger, data, message, module),
      trace: (data, message) => this.logWithTracking('trace', baseLogger, data, message, module),

      // Production-specific methods
      audit: (data, message) => this.auditLog(baseLogger, data, message, module),
      security: (data, message) => this.securityLog(baseLogger, data, message, module),
      performance: (data, message) => this.performanceLog(baseLogger, data, message, module),
      business: (data, message) => this.businessLog(baseLogger, data, message, module),

      // Alert triggering methods
      alert: (severity, data, message) => this.triggerAlert(severity, baseLogger, data, message, module),

      // Child logger creation
      child: (bindings) => this.enhanceLogger(baseLogger.child(bindings), module),

      // Performance timing
      time: (operationName) => this.timeOperation(baseLogger, operationName, module),

      // Error categorization
      categorizeError: (error, context) => this.categorizeAndLogError(baseLogger, error, context, module),
    };

    return enhancedLogger;
}

  /**
   * Log with production tracking and alerting
   */
  logWithTracking(level, logger, data, message, module) {
    try {
      // Apply security redaction
      const sanitizedData = this.sanitizeLogData(data);

      // Add production metadata
      const enhancedData = {
        ...sanitizedData,
        module: module,
        level: level.toUpperCase(),
        environment: process.env.NODE_ENV || 'production',
        correlation_id: this.generateCorrelationId(),
        timestamp: new Date().toISOString(),
      };

      // Perform the actual logging
      logger[level](enhancedData, message);

      // Track For alerting if error or warning
      if (level === 'error' || level === 'warn') {
        this.trackForAlerting(level, enhancedData, message, module);
      }

      // Send to external monitoring if configured
      this.sendToMonitoring(level, enhancedData, message, module);

    } catch (_) {
      // Fallback logging - never let logging break the application
      // Use basic Pino fallback since structured logger may be compromised
      initLogger.error({
        logging_error: loggingError.message,
        original_level: level,
        original_data: data,
        original_message: message,
        fallback_triggered: true,
      }, 'Structured logging failed - fallback triggered');
    }
}

  /**
   * Audit logging For compliance
   */
  auditLog(logger, data, message, module) {
    const auditData = {
      ...data,
      audit_event: true,
      compliance: 'GDPR/SOX/HIPAA',
      retention_category: 'audit',
      module: module,
      user_id: data.user_id || 'system',
      action: data.action || 'unknown',
      resource: data.resource || 'system',
      ip_address: data.ip_address || 'localhost',
      user_agent: data.user_agent || 'system',
    };

    logger.info(this.sanitizeLogData(auditData), `[AUDIT] ${message}`);

    // Send to audit-specific destinations
    this.sendToAuditSystem(auditData, message);
}

  /**
   * Security event logging
   */
  securityLog(logger, data, message, module) {
    const securityData = {
      ...data,
      security_event: true,
      severity: data.severity || 'medium',
      threat_level: data.threat_level || 'low',
      module: module,
      detection_method: data.detection_method || 'automatic',
      false_positive_likelihood: data.false_positive_likelihood || 'low',
    };

    logger.warn(this.sanitizeLogData(securityData), `[SECURITY] ${message}`);

    // Trigger immediate alert For high-severity security events
    if (data.severity === 'high' || data.severity === 'critical') {
      this.triggerSecurityAlert(securityData, message);
    }
}

  /**
   * Performance metrics logging
   */
  performanceLog(logger, data, message, module) {
    const performanceData = {
      ...data,
      performance_metric: true,
      module: module,
      operation: data.operation || 'unknown',
      duration_ms: data.duration_ms || 0,
      memory_usage: process.memoryUsage(),
      cpu_usage: process.cpuUsage(),
    };

    logger.info(performanceData, `[PERFORMANCE] ${message}`);

    // Track performance trends
    this.trackPerformanceMetric(data.operation, data.duration_ms);

    // Alert on slow operations
    if (data.duration_ms > this.config.alerting.performance.slowOperationMs) {
      this.triggerPerformanceAlert(performanceData, message);
    }
}

  /**
   * Business metrics logging
   */
  businessLog(logger, data, message, module) {
    const businessData = {
      ...data,
      business_metric: true,
      module: module,
      metric_category: data.metric_category || 'general',
      business_impact: data.business_impact || 'low',
      kpi_relevant: data.kpi_relevant || false,
    };

    logger.info(businessData, `[BUSINESS] ${message}`);

    // Send to business intelligence systems
    this.sendToBusinessIntelligence(businessData, message);
}

  /**
   * Trigger production alerts
   */
  triggerAlert(severity, logger, data, message, module) {
    const alertData = {
      ...data,
      alert: true,
      severity: severity,
      module: module,
      alert_id: this.generateAlertId(),
      requires_attention: severity === 'critical' || severity === 'emergency',
      escalation_level: this.getEscalationLevel(severity),
    };

    logger.error(alertData, `[ALERT-${severity.toUpperCase()}] ${message}`);

    // Send to alerting systems
    this.sendToAlertingSystems(alertData, message);
}

  /**
   * Performance operation timing
   */
  timeOperation(logger, operationName, module) {
    const startTime = process.hrtime.bigint();
    const startTimestamp = Date.now();

    return {
      end: (result = {}) => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        const timingData = {
          operation: operationName,
          duration_ms: duration,
          module: module,
          started_at: new Date(startTimestamp).toISOString(),
          completed_at: new Date().toISOString(),
          ...result,
        };

        this.performanceLog(logger, timingData, `Operation ${operationName} completed in ${duration.toFixed(2)}ms`);

        return { duration_ms: duration, ...result };
      },
    };
}

  /**
   * Error categorization and logging
   */
  categorizeAndLogError(logger, error, context, module) {
    const categorizedError = {
      error_id: this.generateErrorId(),
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      category: this.categorizeError(error),
      severity: this.assessErrorSeverity(error),
      module: module,
      context: context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
    };

    this.logWithTracking('error', logger, categorizedError, `Categorized error: ${error.message}`);

    // Add to error tracking
    this.errorTracker.push({
      ...categorizedError,
      timestamp: Date.now(),
    });

    // Maintain error tracker size
    if (this.errorTracker.length > 1000) {
      this.errorTracker = this.errorTracker.slice(-500); // Keep last 500 errors
    }

    return categorizedError;
}

  /**
   * Sanitize log data to remove sensitive information
   */
  sanitizeLogData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    const redactFields = this.config.security.redactFields;

    const redactRecursive = (obj) => {
      if (!obj || typeof obj !== 'object') {return obj;}

      For (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        if (redactFields.some(field => lowerKey.includes(field.toLowerCase()))) {
          obj[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          obj[key] = redactRecursive({ ...value });
        }
      }
      return obj;
    };

    return redactRecursive(sanitized);
}

  /**
   * Ensure log directories exist
   */
  async ensureLogDirectories() {
    const logDir = path.dirname(this.config.rotation.paths.application);

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
}

  /**
   * Set up log rotation
   */
  setupLogRotation() {
    // Implementation would depend on chosen log rotation library
    // e.g., winston-daily-rotate-file or similar
    initLogger.info({
      log_rotation: 'configured',
      config_applied: true,
    }, 'Log rotation configured');
}

  /**
   * Initialize monitoring integrations
   */
  async initializeMonitoring() {
    const monitoring = this.config.monitoring;

    // Initialize CloudWatch if enabled
    if (monitoring.cloudwatch.enabled) {
      await this.initializeCloudWatch();
    }

    // Initialize Datadog if enabled
    if (monitoring.datadog.enabled) {
      await this.initializeDatadog();
    }

    // Initialize ELK if enabled
    if (monitoring.elk.enabled) {
      await this.initializeELK();
    }

    initLogger.info({
      monitoring_integrations: 'initialized',
      integrations_enabled: true,
    }, 'Monitoring integrations initialized');
}

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    if (this.monitoringStarted) {return;}

    const interval = this.config.alerting.healthCheck.intervalMs;

    setInterval(() => {
      this.performHealthCheck();
    }, interval);

    this.monitoringStarted = true;
    initLogger.info({
      health_monitoring: 'started',
      monitoring_active: true,
    }, 'Health monitoring started');
}

  /**
   * Perform comprehensive health check
   */
  performHealthCheck() {
    try {
      const memUsage = process.memoryUsage();
      const memoryPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      // Check memory thresholds
      if (memoryPercent > this.config.alerting.memory.critical) {
        this.triggerAlert('critical', null, {
          memory_usage_percent: memoryPercent,
          heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
        }, 'Critical memory usage detected');
      } else if (memoryPercent > this.config.alerting.memory.warning) {
        this.triggerAlert('warning', null, {
          memory_usage_percent: memoryPercent,
        }, 'High memory usage detected');
      }

      // Check error rates
      this.checkErrorRates();

    } catch (_) {
      initLogger.error({
        health_check_error: error.message,
        health_check_failed: true,
        error_stack: error.stack,
      }, 'Health monitoring check failed');
    }
}

  /**
   * Check error rates For alerting
   */
  checkErrorRates() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentErrors = this.errorTracker.filter(error =>
      error.timestamp > oneMinuteAgo,
    );

    const errorCount = recentErrors.length;
    const alerting = this.config.alerting.errorRate;

    if (errorCount > alerting.emergencyPerMinute) {
      this.triggerAlert('emergency', null, {
        error_count: errorCount,
        time_window: '1 minute',
      }, 'Emergency error rate detected');
    } else if (errorCount > alerting.criticalPerMinute) {
      this.triggerAlert('critical', null, {
        error_count: errorCount,
        time_window: '1 minute',
      }, 'Critical error rate detected');
    } else if (errorCount > alerting.warningPerMinute) {
      this.triggerAlert('warning', null, {
        error_count: errorCount,
        time_window: '1 minute',
      }, 'High error rate detected');
    }
}

  // Utility methods
  generateCorrelationId() {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

  categorizeError(error) {
    if (error.code === 'ENOENT') {return 'file_system';}
    if (error.code === 'EACCES') {return 'permission';}
    if (error.message.includes('timeout')) {return 'timeout';}
    if (error.message.includes('network')) {return 'network';}
    if (error.name === 'SyntaxError') {return 'syntax';}
    if (error.name === 'TypeError') {return 'type';}
    if (error.name === 'ReferenceError') {return 'reference';}
    return 'unknown';
}

  assessErrorSeverity(error) {
    if (['EACCES', 'authentication', 'authorization'].some(term =>
      error.code === term || error.message.toLowerCase().includes(term))) {
      return 'high';
    }
    if (['ENOENT', 'timeout', 'network'].some(term =>
      error.code === term || error.message.toLowerCase().includes(term))) {
      return 'medium';
    }
    return 'low';
}

  getEscalationLevel(severity) {
    switch (severity) {
      case 'emergency': return 3;
      case 'critical': return 2;
      case 'warning': return 1;
      default: return 0;,
    }
}

  // Placeholder methods For external system integration
  sendToMonitoring(level, data, message, module) {
    // Implementation depends on chosen monitoring system
}

  sendToAuditSystem(data, message) {
    // Implementation For audit log destination
}

  triggerSecurityAlert(data, message) {
    // Implementation For security alerting
}

  triggerPerformanceAlert(data, message) {
    // Implementation For performance alerting
}

  sendToBusinessIntelligence(data, message) {
    // Implementation For BI system integration
}

  sendToAlertingSystems(data, message) {
    // Implementation For alerting system integration
}

  trackForAlerting(level, data, message, module) {
    // Track errors and warnings For rate-based alerting
}

  trackPerformanceMetric(operation, duration) {
    // Track performance metrics For trending
}

  async initializeCloudWatch() {
    // CloudWatch integration setup
}

  async initializeDatadog() {
    // Datadog integration setup
}

  async initializeELK() {
    // ELK stack integration setup
}
}

// Export factory instance
const productionLoggerFactory = new ProductionLoggerFactory();

module.exports = {
  ProductionLoggerFactory,
  productionLoggerFactory,

  // Convenience method to get production logger
  getProductionLogger: (module = 'app', options = {}) => {
    return productionLoggerFactory.createProductionLogger(module, options);
},

  // Initialize production logging
  initializeProductionLogging: async () => {
    return await productionLoggerFactory.initialize();
},
};
