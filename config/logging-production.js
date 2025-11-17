/**
 * Production Logging Configuration
 */

function getProductionConfig() {
  return {
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      base: {
        env: process.env.NODE_ENV || 'production',
        hostname: require('os').hostname(),
        pid: process.pid,
      },
    },
    rotation: {
      paths: {
        application: './logs/application.log',
      },
    },
    security: {
      redactFields: [
        'password',
        'token',
        'secret',
        'apiKey',
        'api_key',
        'authorization',
        'cookie',
        'sessionId',
        'session_id',
      ],
    },
    alerting: {
      performance: {
        slowOperationMs: 5000,
      },
      memory: {
        warning: 75,
        critical: 90,
      },
      errorRate: {
        warningPerMinute: 10,
        criticalPerMinute: 50,
        emergencyPerMinute: 100,
      },
      healthCheck: {
        intervalMs: 60000,
      },
    },
    monitoring: {
      cloudwatch: {
        enabled: false,
      },
      datadog: {
        enabled: false,
      },
      elk: {
        enabled: false,
      },
    },
  };
}

module.exports = { getProductionConfig };
