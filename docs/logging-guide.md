# Structured Logging Guide

## Overview

This guide covers the comprehensive structured logging system implemented across the infinite-continue-stop-hook project. The system uses Pino for high-performance JSON logging with production-ready observability features.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Logger Types](#logger-types)
- [Context and Tracing](#context-and-tracing)
- [Production Configuration](#production-configuration)
- [Monitoring Integration](#monitoring-integration)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Basic Usage

```javascript
const { loggers } = require('./lib/logger');

// Simple logging
loggers.app.info('Application started');
loggers.app.error('Something went wrong');

// Logging with context
loggers.app.info('User action completed', {
  userId: 'user123',
  action: 'login',
  duration: 250
});
```

### Enhanced Context Logging

```javascript
const { createAgentLogger, logWithContext } = require('./lib/logging-utilities');

// Create context-aware logger
const agentLogger = createAgentLogger('agent_001', 'task_456');
agentLogger.info('Agent started processing task');

// Automatic context injection
logWithContext('info', 'Operation completed', {
  operationType: 'validation',
  result: 'success'
});
```

## Core Concepts

### Structured Logging Fields

All log entries include standard fields for consistency:

```json
{
  "timestamp": "2025-09-28T12:34:56.789Z",
  "level": "INFO",
  "msg": "Operation completed",
  "agentId": "agent_001",
  "taskId": "task_456",
  "operationId": "op_789",
  "module": "taskManager",
  "service": "infinite-continue-stop-hook",
  "hostname": "server01",
  "pid": 12345,
  "environment": "production"
}
```

### Log Levels

- **trace (10)**: Detailed debugging information
- **debug (20)**: General debugging information
- **business (20)**: Business logic events
- **info (30)**: General information
- **audit (25)**: Audit trail events
- **security (35)**: Security-related events
- **warn (40)**: Warning conditions
- **error (50)**: Error conditions
- **fatal (60)**: Critical errors requiring immediate attention

## Logger Types

### Application Loggers

```javascript
const { loggers } = require('./lib/logger');

// Core application logger
loggers.app.info('General application events');

// Task management logger
loggers.taskManager.info('Task created', { taskId: 'task_123' });

// Agent operations logger
loggers.agent.info('Agent initialized', { agentId: 'agent_001' });

// Validation system logger
loggers.validation.info('Validation completed', {
  criterion: 'security-check',
  result: 'passed'
});

// Performance metrics logger
loggers.performance.info('Operation timing', {
  operation: 'database-query',
  durationMs: 45
});

// Security events logger
loggers.security.warn('Suspicious activity detected', {
  ip: '192.168.1.100',
  action: 'failed-login-attempt'
});
```

### Context-Aware Loggers

```javascript
const {
  createAgentLogger,
  createTaskLogger,
  createOperationLogger
} = require('./lib/logging-utilities');

// Agent-specific logger
const agentLogger = createAgentLogger('agent_001', 'task_456');
agentLogger.info('Agent processing started');

// Task-specific logger
const taskLogger = createTaskLogger('task_456', 'agent_001');
taskLogger.debug('Task validation step completed');

// Operation-specific logger
const opLogger = createOperationLogger('user-authentication');
opLogger.info('Authentication successful');
```

## Context and Tracing

### Automatic Context Injection

The system automatically injects context from environment variables:

```bash
export AGENT_ID="agent_001"
export TASK_ID="task_456"
export SERVICE_NAME="infinite-continue-stop-hook"
export SERVICE_VERSION="1.0.0"
```

### Request Tracing

```javascript
const { loggers } = require('./lib/logger');
const crypto = require('crypto');

function processRequest(request) {
  const requestId = crypto.randomUUID();

  loggers.api.info('Request started', {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent']
  });

  try {
    const result = handleRequest(request);

    loggers.api.info('Request completed', {
      requestId,
      statusCode: 200,
      responseTime: Date.now() - startTime
    });

    return result;
  } catch (error) {
    loggers.api.error('Request failed', {
      requestId,
      error: error.message,
      statusCode: 500
    });
    throw error;
  }
}
```

### Performance Tracking

```javascript
const { logPerformance, timeOperation } = require('./lib/logging-utilities');
const { loggers } = require('./lib/logger');

// Method 1: Manual timing
const startTime = Date.now();
await performOperation();
const duration = Date.now() - startTime;
logPerformance('database-query', duration, 'agent_001', 'task_456');

// Method 2: Automatic timing
const endTiming = timeOperation(loggers.performance, 'user-validation');
await validateUser(userId);
endTiming({ userId, result: 'valid' });
```

## Production Configuration

### Environment Variables

```bash
# Core configuration
NODE_ENV=production
LOG_LEVEL=info
SERVICE_NAME=infinite-continue-stop-hook
SERVICE_VERSION=1.0.0

# Monitoring platform integration
DD_SERVICE=taskmanager
DD_ENV=production
DD_VERSION=1.0.0
DD_API_KEY=your_datadog_api_key

NEW_RELIC_LICENSE_KEY=your_newrelic_key

# Alert configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/your/webhook
PAGERDUTY_ROUTING_KEY=your_pagerduty_key

# Performance monitoring
LOG_INCLUDE_HEADERS=false
LOG_INCLUDE_BODY=false
LOG_DATABASE_QUERIES=true
SLOW_QUERY_THRESHOLD=1000
LOG_SYSTEM_METRICS=true
METRICS_INTERVAL=60000

# Log retention
LOG_ARCHIVE_ENABLED=true
LOG_ARCHIVE_PROVIDER=s3
LOG_ARCHIVE_BUCKET=company-logs
LOG_ARCHIVE_RETENTION=7y
```

### Docker Configuration

```dockerfile
# Dockerfile example
FROM node:18-alpine

# Set logging environment
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV SERVICE_NAME=infinite-continue-stop-hook

# Copy application
COPY . /app
WORKDIR /app

# Install dependencies
RUN npm ci --only=production

# Run application
CMD ["node", "taskmanager-api.js"]
```

### Kubernetes Configuration

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: taskmanager
spec:
  template:
    spec:
      containers:
      - name: taskmanager
        image: taskmanager:latest
        env:
        - name: NODE_ENV
          value: "production"
        - name: LOG_LEVEL
          value: "info"
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
```

## Monitoring Integration

### Datadog Integration

The logging system automatically sends logs to Datadog when configured:

```javascript
// Automatic Datadog integration
process.env.DD_API_KEY = 'your_api_key';
process.env.DD_SERVICE = 'taskmanager';
process.env.DD_ENV = 'production';

loggers.app.error('Critical error', {
  error: new Error('Database connection failed'),
  userId: 'user123'
});
// Automatically sent to Datadog
```

### Custom Dashboards

Create dashboards using these standard fields:

- **Service Health**: `service`, `environment`, `level`
- **Request Tracing**: `requestId`, `operationId`, `agentId`
- **Performance Monitoring**: `durationMs`, `operation`, `performance`
- **Error Tracking**: `error.type`, `error.message`, `statusCode`

### Alerts

Set up alerts based on log patterns:

```javascript
// High error rate alert
{
  "query": "service:taskmanager level:ERROR",
  "threshold": 10,
  "timeframe": "5m"
}

// Slow operation alert
{
  "query": "service:taskmanager durationMs:>5000",
  "threshold": 5,
  "timeframe": "1m"
}

// Security event alert
{
  "query": "service:taskmanager security:true level:WARN",
  "threshold": 1,
  "timeframe": "1m"
}
```

## Best Practices

### 1. Use Appropriate Log Levels

```javascript
// Good: Use appropriate levels
loggers.app.debug('Processing item', { itemId });
loggers.app.info('User logged in', { userId });
loggers.app.warn('Retry attempt', { attempt: 3 });
loggers.app.error('Operation failed', { error });

// Bad: Wrong log levels
loggers.app.error('User logged in'); // Too high
loggers.app.debug('System crashed'); // Too low
```

### 2. Include Context

```javascript
// Good: Rich context
loggers.app.info('Payment processed', {
  userId: 'user123',
  paymentId: 'pay_456',
  amount: 99.99,
  currency: 'USD',
  gateway: 'stripe'
});

// Bad: No context
loggers.app.info('Payment processed');
```

### 3. Handle Errors Properly

```javascript
// Good: Structured error logging
try {
  await processPayment(paymentData);
} catch (error) {
  loggers.app.error('Payment processing failed', {
    error: {
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    paymentId: paymentData.id,
    userId: paymentData.userId,
    retryable: error.retryable
  });
  throw error;
}

// Bad: Minimal error info
try {
  await processPayment(paymentData);
} catch (error) {
  loggers.app.error('Error: ' + error.message);
}
```

### 4. Use Performance Logging

```javascript
// Good: Track performance
const { logPerformance } = require('./lib/logging-utilities');

const startTime = Date.now();
const result = await databaseQuery(sql, params);
const duration = Date.now() - startTime;

logPerformance('database-query', duration, agentId, taskId);

// For slow operations, add warning
if (duration > 1000) {
  loggers.performance.warn('Slow database query detected', {
    sql: sql.substring(0, 100),
    duration,
    threshold: 1000
  });
}
```

### 5. Security Logging

```javascript
// Security events
loggers.security.warn('Failed authentication attempt', {
  userId: 'user123',
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  timestamp: new Date().toISOString()
});

// Audit trail
loggers.audit.info('User permission changed', {
  adminUserId: 'admin456',
  targetUserId: 'user123',
  previousRole: 'user',
  newRole: 'admin',
  reason: 'Promotion approved'
});
```

## Examples

### Agent Lifecycle Logging

```javascript
const { createAgentLogger } = require('./lib/logging-utilities');

class Agent {
  constructor(agentId, taskId) {
    this.agentId = agentId;
    this.taskId = taskId;
    this.logger = createAgentLogger(agentId, taskId);
  }

  async start() {
    this.logger.info('Agent starting', {
      configuration: this.config,
      resources: this.getResourceStatus()
    });

    try {
      await this.initialize();
      this.logger.info('Agent started successfully');
    } catch (error) {
      this.logger.error('Agent start failed', { error });
      throw error;
    }
  }

  async processTask() {
    this.logger.info('Task processing started');

    const startTime = Date.now();
    try {
      const result = await this.executeTask();
      const duration = Date.now() - startTime;

      this.logger.info('Task completed successfully', {
        result,
        durationMs: duration
      });

      return result;
    } catch (error) {
      this.logger.error('Task failed', {
        error,
        durationMs: Date.now() - startTime
      });
      throw error;
    }
  }
}
```

### API Request Logging

```javascript
const { loggers } = require('./lib/logger');

function requestLogger(req, res, next) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  req.requestId = requestId;

  loggers.api.info('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    loggers.api.info('Request completed', {
      requestId,
      statusCode: res.statusCode,
      durationMs: duration,
      responseSize: res.get('content-length')
    });

    // Performance warning for slow requests
    if (duration > 5000) {
      loggers.performance.warn('Slow request detected', {
        requestId,
        method: req.method,
        url: req.url,
        durationMs: duration
      });
    }
  });

  next();
}
```

### Database Operation Logging

```javascript
const { loggers } = require('./lib/logger');

class DatabaseManager {
  async query(sql, params = []) {
    const queryId = crypto.randomUUID();
    const startTime = Date.now();

    loggers.database.debug('Query started', {
      queryId,
      sql: sql.substring(0, 100) + '...',
      paramCount: params.length
    });

    try {
      const result = await this.connection.query(sql, params);
      const duration = Date.now() - startTime;

      loggers.database.info('Query completed', {
        queryId,
        durationMs: duration,
        rowCount: result.rowCount
      });

      // Log slow queries
      if (duration > 1000) {
        loggers.performance.warn('Slow query detected', {
          queryId,
          sql: sql.substring(0, 200),
          durationMs: duration,
          threshold: 1000
        });
      }

      return result;
    } catch (error) {
      loggers.database.error('Query failed', {
        queryId,
        error: error.message,
        sql: sql.substring(0, 100),
        durationMs: Date.now() - startTime
      });
      throw error;
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Missing Context**: Ensure environment variables are set
2. **Performance Impact**: Use appropriate log levels in production
3. **Log Volume**: Monitor log volume and adjust levels as needed
4. **Sensitive Data**: Ensure sensitive information is sanitized

### Debug Mode

Enable debug logging for troubleshooting:

```bash
LOG_LEVEL=debug node taskmanager-api.js
```

### Log Analysis

Use structured fields for effective log analysis:

```bash
# Find all errors for a specific agent
jq 'select(.level == "ERROR" and .agentId == "agent_001")' logs.json

# Calculate average response times
jq 'select(.durationMs) | .durationMs' logs.json | jq -s 'add/length'

# Find slow operations
jq 'select(.durationMs > 1000)' logs.json
```

## Migration from Console.log

If migrating existing code:

1. Replace `console.log` with `loggers.app.info`
2. Replace `console.error` with `loggers.app.error`
3. Add context objects for better observability
4. Use appropriate loggers for different modules

```javascript
// Before
console.log('User logged in:', userId);
console.error('Error:', error);

// After
loggers.app.info('User logged in', { userId });
loggers.app.error('Operation failed', {
  error: error.message,
  userId,
  operationId
});
```

## Support

For questions or issues with the logging system:

1. Check this documentation
2. Review existing log patterns in the codebase
3. Test logging in development environment
4. Monitor logs in staging before production deployment

---

*This logging guide is part of the infinite-continue-stop-hook project's observability infrastructure.*