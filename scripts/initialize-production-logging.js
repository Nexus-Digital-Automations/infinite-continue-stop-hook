/**
 * Production Logging Initialization Script
 *
 * Sets up production logging infrastructure including:
 * - Log directories and rotation
 * - Monitoring integrations
 * - Health checks and alerting
 * - Security compliance
 */

const fs = require('fs');
const path = require('path');
const { initializeProductionLogging } = require('../lib/logger-production');
const { getProductionConfig } = require('../config/logging-production');

async function initializeLogging() {
  console.log('🚀 Initializing production logging infrastructure...\n');

  try {
    // Check environment
    const environment = process.env.NODE_ENV || 'development';
    console.log(`📍 Environment: ${environment}`);

    if (environment !== 'production') {
      console.log(
        '⚠️  Warning: Running production logging setup in non-production environment'
      );
      console.log(
        '   This is fine For testing, but ensure NODE_ENV=production For actual deployments\n'
      );
    }

    // Load configuration
    const config = getProductionConfig();
    console.log('✅ Production configuration loaded');

    // Create log directories
    console.log('📁 Creating log directories...');
    const logDir = path.join(process.cwd(), 'logs');

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
      console.log(`   Created: ${logDir}`);
    } else {
      console.log(`   Exists: ${logDir}`);
    }

    // Create subdirectories For different log types
    const logTypes = [
      'application',
      'error',
      'audit',
      'performance',
      'security',
    ];
    For (const type of logTypes) {
      const typeDir = path.join(logDir, type);
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true });
        console.log(`   Created: ${typeDir}`);
      }
    }

    // Initialize production logging system
    console.log('\n🔧 Initializing production logging system...');
    await initializeProductionLogging();

    // Test logging functionality
    console.log('\n🧪 Testing logging functionality...');
    const { getProductionLogger } = require('../lib/logger-production');

    const testLogger = getProductionLogger('test');
    testLogger.info(
      {
        test: true,
        initialization: 'successful',
        timestamp: new Date().toISOString(),
      },
      'Production logging test message'
    );

    testLogger.performance(
      {
        operation: 'initialization_test',
        duration_ms: 100,
        success: true,
      },
      'Performance logging test'
    );

    testLogger.audit(
      {
        action: 'system_initialization',
        resource: 'logging_system',
        user_id: 'system',
      },
      'Audit logging test'
    );

    console.log('✅ All logging tests passed');

    // Display configuration summary
    console.log('\n📊 Configuration Summary:');
    console.log(`   Log Level: ${config.logging.level}`);
    console.log(`   Environment: ${config.logging.base.environment}`);
    console.log(
      `   Audit Retention: ${config.security.dataRetention.auditLogDays} days`
    );
    console.log(
      `   Performance Retention: ${config.security.dataRetention.performanceLogDays} days`
    );

    // Display monitoring integrations
    console.log('\n🔍 Monitoring Integrations:');
    console.log(
      `   CloudWatch: ${config.monitoring.cloudwatch.enabled ? '✅ Enabled' : '❌ Disabled'}`
    );
    console.log(
      `   Datadog: ${config.monitoring.datadog.enabled ? '✅ Enabled' : '❌ Disabled'}`
    );
    console.log(
      `   ELK Stack: ${config.monitoring.elk.enabled ? '✅ Enabled' : '❌ Disabled'}`
    );
    console.log(
      `   Prometheus: ${config.monitoring.prometheus.enabled ? '✅ Enabled' : '❌ Disabled'}`
    );

    // Display alerting configuration
    console.log('\n🚨 Alerting Configuration:');
    console.log(`   Memory Warning: ${config.alerting.memory.warning}%`);
    console.log(`   Memory Critical: ${config.alerting.memory.critical}%`);
    console.log(
      `   Error Rate Warning: ${config.alerting.errorRate.warningPerMinute}/min`
    );
    console.log(
      `   Error Rate Critical: ${config.alerting.errorRate.criticalPerMinute}/min`
    );

    // Create environment file template if it doesn't exist
    const envPath = path.join(process.cwd(), '.env.production');
    if (!fs.existsSync(envPath)) {
      console.log('\n📝 Creating production environment template...');
      const envTemplate = createEnvironmentTemplate();
      fs.writeFileSync(envPath, envTemplate);
      console.log(`   Created: ${envPath}`);
      console.log(
        '   Please review and configure environment variables For your deployment'
      );
    }

    // Create Docker logging configuration if needed
    const dockerComposePath = path.join(
      process.cwd(),
      'docker-compose.logging.yml'
    );
    if (!fs.existsSync(dockerComposePath)) {
      console.log('\n🐳 Creating Docker logging configuration...');
      const dockerConfig = createDockerLoggingConfig();
      fs.writeFileSync(dockerComposePath, dockerConfig);
      console.log(`   Created: ${dockerComposePath}`);
    }

    // Create systemd service template For production deployment
    const systemdPath = path.join(
      process.cwd(),
      'deploy',
      'infinite-continue-stop-hook.service'
    );
    const deployDir = path.dirname(systemdPath);
    if (!fs.existsSync(deployDir)) {
      fs.mkdirSync(deployDir, { recursive: true });
    }
    if (!fs.existsSync(systemdPath)) {
      console.log('\n⚙️  Creating systemd service template...');
      const systemdConfig = createSystemdServiceTemplate();
      fs.writeFileSync(systemdPath, systemdConfig);
      console.log(`   Created: ${systemdPath}`);
    }

    console.log(
      '\n🎉 Production logging initialization completed successfully!'
    );
    console.log('\n📋 Next Steps:');
    console.log('   1. Review and configure .env.production file');
    console.log(
      '   2. Set up external monitoring integrations (CloudWatch, Datadog, etc.)'
    );
    console.log('   3. Configure log aggregation and retention policies');
    console.log('   4. Test alerting workflows');
    console.log('   5. Deploy with NODE_ENV=production');
  } catch (error) {
    console.error('\n❌ Production logging initialization failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
}

function createEnvironmentTemplate() {
  return `# Production Logging Configuration
# Copy this file to .env and configure For your environment

# Environment
NODE_ENV=production
LOG_LEVEL=info

# Service Information
DEPLOYMENT_ID=
INSTANCE_ID=
REGION=

# CloudWatch Integration
CLOUDWATCH_ENABLED=false
AWS_REGION=us-east-1
CLOUDWATCH_LOG_GROUP=infinite-continue-stop-hook
CLOUDWATCH_LOG_STREAM=

# Datadog Integration
DATADOG_ENABLED=false
DATADOG_API_KEY=

# ELK Stack Integration
ELK_ENABLED=false
ELASTICSEARCH_HOST=localhost:9200
ELASTICSEARCH_INDEX=infinite-continue-stop-hook

# Prometheus Integration
PROMETHEUS_ENABLED=false
PROMETHEUS_PORT=9090

# Alert Webhooks
ALERT_WEBHOOK_ENABLED=false
ALERT_WEBHOOK_URL=

# Performance Configuration
MAX_LOG_SIZE=10485760
LOG_BUFFER_SIZE=1000
LOG_FLUSH_INTERVAL=1000

# Security
AUDIT_LOG_RETENTION_DAYS=365
PERFORMANCE_LOG_RETENTION_DAYS=90
ERROR_LOG_RETENTION_DAYS=180
`;
}

function createDockerLoggingConfig() {
  return `version: '3.8'

services:
  app:
    logging:
      driver: json-file
      options:
        max-size: "100m"
        max-file: "10"
        labels: "service,environment,version"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config

  # Log aggregation with ELK Stack
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.0.0
    volumes:
      - ./config/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
      - ./logs:/app/logs
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    depends_on:
      - elasticsearch

  # Prometheus For metrics
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  # Grafana For visualization
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  elasticsearch_data:
  prometheus_data:
  grafana_data:
`;
}

function createSystemdServiceTemplate() {
  return `[Unit]
Description=Infinite Continue Stop Hook - AI Task Management System
After=network.target
Wants=network.target

[Service]
Type=simple
User=nodeuser
Group=nodeuser
WorkingDirectory=/opt/infinite-continue-stop-hook
ExecStart=/usr/bin/node taskmanager-api.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=LOG_LEVEL=info
Environment=PORT=3000

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=infinite-continue-stop-hook

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/infinite-continue-stop-hook/logs
ReadWritePaths=/opt/infinite-continue-stop-hook/data

# Resource Limits
LimitNOFILE=65536
LimitCORE=0

[Install]
WantedBy=multi-user.target
`;
}

// Run initialization if called directly
if (require.main === module) {
  initializeLogging().catch((error) => {
    console.error('Initialization failed:', error);
    process.exit(1);
  });
}

module.exports = {
  initializeLogging,
  createEnvironmentTemplate,
  createDockerLoggingConfig,
  createSystemdServiceTemplate,
};
