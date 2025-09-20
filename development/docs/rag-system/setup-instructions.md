# RAG System Setup Instructions

## 🎯 Overview

This document provides step-by-step instructions for setting up the RAG (Retrieval-Augmented Generation) system for lessons and error database management. Follow these instructions to install, configure, and initialize the system.

## 🛠️ Prerequisites

### System Requirements

- **Operating System**: macOS, Linux, or Windows with WSL2
- **Node.js**: Version 18.0 or higher
- **Database**: MySQL 8.0+ or PostgreSQL 12+ with vector extension support
- **Memory**: Minimum 4GB RAM, recommended 8GB+
- **Storage**: Minimum 10GB free space for database and embeddings

### Required Services

- **OpenAI API Access**: For embedding generation
- **Database Server**: MySQL or PostgreSQL with vector search capability
- **Node.js Environment**: For TaskManager API integration

### Account Setup

```bash
# Verify Node.js version
node --version  # Should be 18.0+

# Verify npm version
npm --version

# Check available memory
free -h  # Linux
vm_stat | head -5  # macOS
```

## 📦 Installation

### Step 1: Database Setup

#### MySQL Setup (Recommended)

```bash
# Install MySQL 8.0+ with vector support
# macOS with Homebrew
brew install mysql

# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server-8.0

# Start MySQL service
sudo systemctl start mysql  # Linux
brew services start mysql   # macOS

# Create RAG database
mysql -u root -p << EOF
CREATE DATABASE rag_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'rag_user'@'localhost' IDENTIFIED BY 'secure_password_change_this';
GRANT ALL PRIVILEGES ON rag_database.* TO 'rag_user'@'localhost';
FLUSH PRIVILEGES;

-- Test connection
USE rag_database;
SELECT 'Database setup successful' as status;
EOF
```

#### PostgreSQL Setup (Alternative)

```bash
# Install PostgreSQL with vector extension
# macOS with Homebrew
brew install postgresql pgvector

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
git clone https://github.com/pgvector/pgvector.git
cd pgvector && make && sudo make install

# Create database
sudo -u postgres psql << EOF
CREATE DATABASE rag_database;
CREATE USER rag_user WITH ENCRYPTED PASSWORD 'secure_password_change_this';
GRANT ALL PRIVILEGES ON DATABASE rag_database TO rag_user;

-- Enable vector extension
\c rag_database
CREATE EXTENSION vector;
EOF
```

### Step 2: Environment Configuration

```bash
# Navigate to project root
cd /Users/jeremyparker/infinite-continue-stop-hook

# Create or update .env file
cat >> .env << EOF

# === RAG System Configuration ===
RAG_ENABLED=true
RAG_DATABASE_TYPE=mysql
RAG_DATABASE_URL=mysql://rag_user:secure_password_change_this@localhost:3306/rag_database

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
RAG_EMBEDDING_MODEL=text-embedding-3-small
RAG_EMBEDDING_DIMENSIONS=1536

# Performance Settings
RAG_BATCH_SIZE=100
RAG_MAX_CONCURRENT=5
RAG_TIMEOUT=10000
RAG_CACHE_TTL=3600

# Search Configuration
RAG_DEFAULT_SIMILARITY_THRESHOLD=0.75
RAG_MAX_SEARCH_RESULTS=20
RAG_ENABLE_FUZZY_SEARCH=true

# Security Settings
RAG_RATE_LIMIT_PER_MINUTE=100
RAG_ENABLE_AUDIT_LOG=true
RAG_LOG_LEVEL=info

EOF

# Secure the environment file
chmod 600 .env
```

### Step 3: Install Dependencies

```bash
# Install required Node.js packages
npm install --save @openai/openai mysql2 pg pgvector

# Install additional utilities
npm install --save dotenv crypto uuid

# Install development dependencies (optional)
npm install --save-dev jest supertest

# Verify installation
node -e "console.log('Dependencies installed successfully')"
```

### Step 4: Database Schema Creation

```bash
# Create schema directory
mkdir -p development/docs/rag-system/sql

# Download and run schema setup
curl -o development/docs/rag-system/sql/schema.sql https://raw.githubusercontent.com/your-repo/rag-schema/main/schema.sql

# Apply schema to database
mysql -u rag_user -p rag_database < development/docs/rag-system/sql/schema.sql

# Verify schema creation
mysql -u rag_user -p rag_database -e "
SHOW TABLES;
DESCRIBE lessons;
DESCRIBE lesson_embeddings;
"
```

## 🔧 Configuration

### Step 1: OpenAI API Setup

```bash
# Test OpenAI API connectivity
node -e "
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Test embedding generation'
}).then(response => {
  console.log('OpenAI API working:', response.data[0].embedding.length, 'dimensions');
}).catch(error => {
  console.error('OpenAI API error:', error.message);
});
"
```

### Step 2: Database Connection Verification

```bash
# Test database connectivity
node -e "
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection(process.env.RAG_DATABASE_URL);
    const [rows] = await connection.execute('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?', ['rag_database']);
    console.log('Database connected successfully. Tables found:', rows[0].table_count);
    await connection.end();
  } catch (error) {
    console.error('Database connection error:', error.message);
  }
}

testConnection();
"
```

### Step 3: TaskManager Integration

```bash
# Verify TaskManager API recognizes RAG module
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js methods | grep -i rag

# Expected output should include RAG-related methods:
# storeLesson
# searchLessons
# storeError
# findSimilarErrors
# getRelevantLessons
# getRagAnalytics
```

## 🚀 Initialization

### Step 1: Initial Data Setup

```bash
# Create initial error patterns
mysql -u rag_user -p rag_database << EOF
INSERT INTO error_patterns (pattern_id, name, description, category) VALUES
('pattern_eslint_unused', 'ESLint Unused Variables', 'Variables declared but never used', 'code_quality'),
('pattern_build_missing_dep', 'Missing Dependencies', 'Required modules not found during build', 'functionality'),
('pattern_syntax_error', 'JavaScript Syntax Errors', 'Invalid JavaScript syntax causing parse errors', 'code_quality'),
('pattern_type_error', 'TypeScript Type Errors', 'Type mismatches and TypeScript compilation errors', 'code_quality'),
('pattern_auth_jwt', 'JWT Authentication Issues', 'JWT token related authentication problems', 'security'),
('pattern_cors_error', 'CORS Configuration Issues', 'Cross-origin resource sharing configuration problems', 'security');
EOF

echo "Initial error patterns created"
```

### Step 2: System Health Check

```bash
# Comprehensive system health check
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-health

# Expected output:
# {
#   "success": true,
#   "status": "healthy",
#   "components": {
#     "database": "connected",
#     "embedding_service": "operational",
#     "vector_search": "operational",
#     "cache": "healthy"
#   },
#   "metrics": {
#     "avgResponseTime": "127ms",
#     "embeddingQueueSize": 0,
#     "cacheHitRate": 0.0
#   }
# }
```

### Step 3: Test Basic Operations

```bash
# Test lesson storage
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-store-lesson '{
  "title": "Test lesson for system verification",
  "content": "This is a test lesson to verify the RAG system is working correctly.",
  "category": "general",
  "tags": ["test", "verification"],
  "context": {"setup": "initial_test"}
}'

# Test lesson search
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "test lesson verification"

# Test error storage
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-store-error '{
  "title": "Test error for system verification",
  "description": "This is a test error to verify error storage functionality",
  "errorType": "test_error",
  "solution": {"description": "Test solution"}
}'
```

## 📊 Monitoring Setup

### Step 1: Logging Configuration

```bash
# Create logging directory
mkdir -p development/logs/rag-system

# Configure log rotation
cat > /etc/logrotate.d/rag-system << EOF
/Users/jeremyparker/infinite-continue-stop-hook/development/logs/rag-system/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 rag_user rag_user
}
EOF
```

### Step 2: Performance Monitoring

```bash
# Create monitoring script
cat > scripts/monitor-rag.sh << 'EOF'
#!/bin/bash
# RAG System Monitoring Script

LOG_FILE="development/logs/rag-system/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting RAG system monitoring" >> $LOG_FILE

# Check system health
HEALTH=$(timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-health 2>/dev/null)
echo "[$DATE] Health check: $HEALTH" >> $LOG_FILE

# Check database size
DB_SIZE=$(mysql -u rag_user -p rag_database -e "
  SELECT
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
  FROM information_schema.tables
  WHERE table_schema = 'rag_database'
  ORDER BY (data_length + index_length) DESC;
" 2>/dev/null)
echo "[$DATE] Database size: $DB_SIZE" >> $LOG_FILE

# Check query performance
PERF_TEST=$(time timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "performance test" 2>&1)
echo "[$DATE] Performance test: $PERF_TEST" >> $LOG_FILE

echo "[$DATE] Monitoring complete" >> $LOG_FILE
EOF

chmod +x scripts/monitor-rag.sh

# Schedule monitoring (run every hour)
echo "0 * * * * /Users/jeremyparker/infinite-continue-stop-hook/scripts/monitor-rag.sh" | crontab -
```

## 🔐 Security Configuration

### Step 1: Database Security

```sql
-- Create read-only user for agents
CREATE USER 'rag_agent'@'localhost' IDENTIFIED BY 'agent_password_change_this';
GRANT SELECT ON rag_database.lessons TO 'rag_agent'@'localhost';
GRANT SELECT ON rag_database.lesson_embeddings TO 'rag_agent'@'localhost';
GRANT SELECT ON rag_database.errors TO 'rag_agent'@'localhost';
GRANT SELECT ON rag_database.error_patterns TO 'rag_agent'@'localhost';

-- Create admin user for management
CREATE USER 'rag_admin'@'localhost' IDENTIFIED BY 'admin_password_change_this';
GRANT ALL PRIVILEGES ON rag_database.* TO 'rag_admin'@'localhost';

FLUSH PRIVILEGES;
```

### Step 2: API Security

```bash
# Add security configuration to .env
cat >> .env << EOF

# === Security Configuration ===
RAG_JWT_SECRET=your_jwt_secret_here_change_this
RAG_ENABLE_RATE_LIMITING=true
RAG_MAX_REQUESTS_PER_MINUTE=100
RAG_ENABLE_IP_WHITELIST=false
RAG_TRUSTED_IPS=127.0.0.1,localhost

# Audit and Compliance
RAG_ENABLE_AUDIT_LOG=true
RAG_AUDIT_LOG_RETENTION_DAYS=90
RAG_LOG_SENSITIVE_DATA=false

EOF
```

### Step 3: Backup Configuration

```bash
# Create backup script
cat > scripts/backup-rag.sh << 'EOF'
#!/bin/bash
# RAG System Backup Script

BACKUP_DIR="/backup/rag-system"
DATE=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/rag_backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
mysqldump -u rag_admin -p rag_database \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --hex-blob > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

chmod +x scripts/backup-rag.sh

# Schedule daily backups at 2 AM
echo "0 2 * * * /Users/jeremyparker/infinite-continue-stop-hook/scripts/backup-rag.sh" | crontab -
```

## 🧪 Testing and Validation

### Step 1: Comprehensive Testing

```bash
# Create test suite
cat > tests/rag-system.test.js << 'EOF'
const TaskManagerAPI = require('../taskmanager-api.js');

describe('RAG System Integration', () => {
  let api;

  beforeAll(async () => {
    api = new TaskManagerAPI();
  });

  test('Health check passes', async () => {
    const health = await api.ragHealth();
    expect(health.success).toBe(true);
    expect(health.status).toBe('healthy');
  });

  test('Can store and retrieve lessons', async () => {
    const lesson = {
      title: 'Test lesson',
      content: 'Test content for integration testing',
      category: 'test',
      tags: ['integration', 'test']
    };

    const stored = await api.storeLesson(lesson);
    expect(stored.success).toBe(true);

    const results = await api.searchLessons('test content integration');
    expect(results.success).toBe(true);
    expect(results.results.length).toBeGreaterThan(0);
  });

  test('Search performance is acceptable', async () => {
    const start = Date.now();
    await api.searchLessons('performance test');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
  });

  afterAll(async () => {
    await api.cleanup();
  });
});
EOF

# Run tests
npm test -- tests/rag-system.test.js
```

### Step 2: Load Testing

```bash
# Create load testing script
cat > scripts/load-test-rag.sh << 'EOF'
#!/bin/bash
# RAG System Load Testing

echo "Starting RAG system load test..."

# Test concurrent search operations
for i in {1..20}; do
  timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "load test query $i" &
done

wait

echo "Load test completed. Check logs for performance metrics."
EOF

chmod +x scripts/load-test-rag.sh
./scripts/load-test-rag.sh
```

## 📋 Setup Verification Checklist

### Core Components
- [ ] Database server installed and running
- [ ] RAG database and tables created
- [ ] Environment variables configured
- [ ] OpenAI API key configured and tested
- [ ] Node.js dependencies installed

### Database Setup
- [ ] Database connection successful
- [ ] All required tables exist
- [ ] Vector indexes created
- [ ] Initial error patterns inserted
- [ ] User permissions configured

### API Integration
- [ ] TaskManager API recognizes RAG methods
- [ ] Health check returns success
- [ ] Can store lessons successfully
- [ ] Can search lessons successfully
- [ ] Can store errors successfully

### Security and Monitoring
- [ ] Database users created with appropriate permissions
- [ ] Backup script configured and scheduled
- [ ] Monitoring script configured
- [ ] Log rotation configured
- [ ] Security settings applied

### Performance and Testing
- [ ] Search performance under 2 seconds
- [ ] Load testing completed successfully
- [ ] Integration tests pass
- [ ] Memory usage within acceptable limits

## 🚨 Troubleshooting

### Common Setup Issues

#### Issue: Database Connection Failed
```bash
# Check database service status
systemctl status mysql  # Linux
brew services list | grep mysql  # macOS

# Test connection manually
mysql -u rag_user -p rag_database -e "SELECT 1;"

# Check firewall settings
sudo ufw status  # Linux
```

#### Issue: OpenAI API Errors
```bash
# Verify API key
echo $OPENAI_API_KEY | cut -c1-10  # Should show: sk-proj-...

# Test API access
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models | jq '.data[0].id'
```

#### Issue: Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18.0+
```

## 📞 Support and Next Steps

### Getting Help
1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Review logs in `development/logs/rag-system/`
3. Run health checks and diagnostics
4. Consult the [API Reference](./api-reference.md)

### Next Steps
1. **Complete Migration**: Follow the [Migration Guide](./migration-guide.md)
2. **Agent Integration**: Review [Agent Integration Guide](./agent-integration.md)
3. **Performance Tuning**: See [Performance Tuning Guide](./performance-tuning.md)
4. **Monitor Usage**: Set up regular monitoring and optimization

---

*Your RAG system is now set up and ready for use! Proceed to the migration guide to import existing lessons, or start using the system immediately for new development tasks.*