/**
 * Production Logging Configuration
 *
 * Optimized configuration For production monitoring and observability.
 * Designed For integration with log aggregation systems like ELK, Splunk,
 * or cloud-native logging services.
 */

const path = require('path');
const os = require('os');

/**
 * Production logging configuration optimized For monitoring systems
 */
const productionLogConfig = {
  level: process.env.LOG_LEVEL || 'info',

  // Production format - structured JSON without pretty printing
  transport: undefined, // No transport = raw JSON output For log aggregators

  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
    log: (object) => {
      // Enhanced metadata For production monitoring
      return {
        ...object,
        hostname: os.hostname(),
        pid: process.pid,
        service: 'infinite-continue-stop-hook',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        deployment_id: process.env.DEPLOYMENT_ID || `deploy_${Date.now()}`,
        instance_id: process.env.INSTANCE_ID || `instance_${process.pid}`,
        region: process.env.AWS_REGION || process.env.REGION || 'unknown',
        // Add correlation IDs For distributed tracing
        trace_id: object.trace_id || null,
        span_id: object.span_id || null,
      };
    },
  },

  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

  // Base configuration For all production loggers
  base: {
    service: 'infinite-continue-stop-hook',
    environment: process.env.NODE_ENV || 'production',
  },

  // Performance optimizations For production
  serializers: {
    err: (err) => {
      return {
        type: err.constructor.name,
        message: err.message,
        stack: err.stack,
        code: err.code,
        errno: err.errno,
        syscall: err.syscall,
        path: err.path,
      };
    },
    req: (req) => {
      return {
        method: req.method,
        url: req.url,
        headers: {
          // Only safe headers For production logs
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
          'accept': req.headers['accept'],
          // Never log Authorization, Cookie, or other sensitive headers
        },
        remoteAddress: req.connection?.remoteAddress,
        remotePort: req.connection?.remotePort,
      };
    },
  },
};

/**
 * Log rotation configuration For production
 */
const logRotationConfig = {
  // Log file locations For production
  paths: {
    application: path.join(process.cwd(), 'logs', 'application.log'),
    error: path.join(process.cwd(), 'logs', 'error.log'),
    audit: path.join(process.cwd(), 'logs', 'audit.log'),
    performance: path.join(process.cwd(), 'logs', 'performance.log'),
    security: path.join(process.cwd(), 'logs', 'security.log'),
  },

  // Rotation settings
  rotation: {
    maxSize: '100MB',
    maxFiles: 10,
    maxAge: '30d',
    compress: true,
    datePattern: 'YYYY-MM-DD',
  },
};

/**
 * Production alerting configuration
 */
const productionAlertConfig = {
  // Memory usage thresholds
  memory: {
    warning: 70, // 70% heap usage
    critical: 85, // 85% heap usage
    emergency: 95, // 95% heap usage
  },

  // Error rate thresholds
  errorRate: {
    warningPerMinute: 5,
    criticalPerMinute: 10,
    emergencyPerMinute: 20,
  },

  // Performance thresholds
  performance: {
    slowOperationMs: 5000, // 5 seconds
    verySlowOperationMs: 15000, // 15 seconds
    taskTimeoutMs: 300000, // 5 minutes
  },

  // Health check intervals
  healthCheck: {
    intervalMs: 30000, // 30 seconds
    timeoutMs: 5000, // 5 seconds
    retries: 3,
  },
};

/**
 * Security and compliance configuration
 */
const securityConfig = {
  // Fields to redact in production logs
  redactFields: [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'authorization',
    'cookie',
    'session',
    'api_key',
    'private_key',
    'access_token',
    'refresh_token',
    'jwt',
    'bearer',
    'credentials',
  ],

  // Audit logging requirements
  auditEvents: [
    'authentication',
    'authorization',
    'data_access',
    'data_modification',
    'system_configuration',
    'security_events',
    'privilege_escalation',
    'agent_initialization',
    'task_creation',
    'validation_override',
  ],

  // GDPR/Compliance settings
  dataRetention: {
    personalDataDays: 30,
    auditLogDays: 365,
    performanceLogDays: 90,
    errorLogDays: 180,
  },
};

/**
 * Monitoring system integration configuration
 */
const monitoringIntegration = {
  // Prometheus metrics export
  prometheus: {
    enabled: process.env.PROMETHEUS_ENABLED === 'true',
    port: process.env.PROMETHEUS_PORT || 9090,
    path: '/metrics',
  },

  // CloudWatch integration (AWS)
  cloudwatch: {
    enabled: process.env.CLOUDWATCH_ENABLED === 'true',
    region: process.env.AWS_REGION || 'us-east-1',
    logGroup: process.env.CLOUDWATCH_LOG_GROUP || 'infinite-continue-stop-hook',
    logStream: process.env.CLOUDWATCH_LOG_STREAM || `instance-${process.pid}`,
  },

  // Datadog integration
  datadog: {
    enabled: process.env.DATADOG_ENABLED === 'true',
    apiKey: process.env.DATADOG_API_KEY,
    service: 'infinite-continue-stop-hook',
    env: process.env.NODE_ENV || 'production',
  },

  // ELK Stack integration
  elk: {
    enabled: process.env.ELK_ENABLED === 'true',
    elasticsearch: {
      host: process.env.ELASTICSEARCH_HOST || 'localhost:9200',
      index: process.env.ELASTICSEARCH_INDEX || 'infinite-continue-stop-hook',
    },
  },

  // Custom webhook For critical alerts
  webhook: {
    enabled: process.env.ALERT_WEBHOOK_ENABLED === 'true',
    url: process.env.ALERT_WEBHOOK_URL,
    timeout: 5000,
    retries: 3,
  },
};

/**
 * Production performance optimization settings
 */
const performanceConfig = {
  // Async logging For better performance
  async: true,

  // Buffer settings For high-throughput scenarios
  buffer: {
    size: 1000, // Buffer up to 1000 log entries
    flushInterval: 1000, // Flush every 1 second
  },

  // Sampling For high-volume debug logs
  sampling: {
    debug: 0.1, // Sample 10% of debug logs
    trace: 0.01, // Sample 1% of trace logs
  },

  // Resource limits
  limits: {
    maxLogSize: 10 * 1024 * 1024, // 10MB max per log entry
    maxStackDepth: 50, // Maximum stack trace depth
    maxObjectDepth: 10, // Maximum object nesting depth
  },
};

module.exports = {
  productionLogConfig,
  logRotationConfig,
  productionAlertConfig,
  securityConfig,
  monitoringIntegration,
  performanceConfig,

  // Helper function to get complete production configuration
  getProductionConfig: () => ({
    logging: productionLogConfig,
    rotation: logRotationConfig,
    alerting: productionAlertConfig,
    security: securityConfig,
    monitoring: monitoringIntegration,
    performance: performanceConfig,
  }),
};
