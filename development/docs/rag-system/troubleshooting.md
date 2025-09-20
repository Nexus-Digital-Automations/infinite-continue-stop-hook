# RAG System Troubleshooting Guide

## 🔍 Overview

This comprehensive troubleshooting guide helps diagnose and resolve common issues with the RAG (Retrieval-Augmented Generation) system. Use this guide to quickly identify problems and implement solutions.

## 🚨 Emergency Diagnostic Commands

### Quick Health Check

```bash
# Comprehensive system status
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-health --verbose

# Database connectivity test
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-db-test

# OpenAI API connectivity test
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-openai-test

# Performance baseline test
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-perf-test
```

### System Information

```bash
# Environment variables check
env | grep RAG_ | sort

# Node.js and dependency versions
node --version && npm list --depth=0 | grep -E "(openai|mysql2|pg)"

# Database status
systemctl status mysql || brew services list | grep mysql

# Disk space and memory
df -h && free -h
```

## 🔧 Common Issues and Solutions

### 1. Database Connection Issues

#### Symptom: "Database connection failed" or "ECONNREFUSED"

**Diagnosis Commands:**
```bash
# Test database connectivity directly
mysql -u rag_user -p rag_database -e "SELECT 1 as test;"

# Check database service status
systemctl status mysql  # Linux
brew services status mysql  # macOS

# Verify connection string
echo $RAG_DATABASE_URL | grep -o "mysql://[^:]*:[^@]*@[^/]*"
```

**Common Causes and Solutions:**

1. **Database service not running**
   ```bash
   # Start database service
   sudo systemctl start mysql  # Linux
   brew services start mysql   # macOS
   ```

2. **Incorrect credentials**
   ```bash
   # Reset database password
   mysql -u root -p << EOF
   ALTER USER 'rag_user'@'localhost' IDENTIFIED BY 'new_password';
   FLUSH PRIVILEGES;
   EOF

   # Update .env file
   sed -i 's/RAG_DATABASE_URL=.*/RAG_DATABASE_URL=mysql:\/\/rag_user:new_password@localhost:3306\/rag_database/' .env
   ```

3. **Database doesn't exist**
   ```bash
   # Create database
   mysql -u root -p << EOF
   CREATE DATABASE IF NOT EXISTS rag_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EOF
   ```

4. **Port conflicts**
   ```bash
   # Check what's using port 3306
   sudo lsof -i :3306

   # Use alternative port
   mysql --port=3307 -u rag_user -p rag_database
   ```

### 2. OpenAI API Issues

#### Symptom: "OpenAI API error" or "Embedding generation failed"

**Diagnosis Commands:**
```bash
# Test API key validity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models | jq '.data[0].id'

# Check API quota
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/usage

# Test embedding generation
timeout 10s node -e "
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'test'
}).then(r => console.log('Success:', r.data[0].embedding.length))
.catch(e => console.error('Error:', e.message));
"
```

**Common Causes and Solutions:**

1. **Invalid or missing API key**
   ```bash
   # Check if API key is set
   echo "API Key: ${OPENAI_API_KEY:0:10}..."

   # Set API key in .env
   echo "OPENAI_API_KEY=sk-proj-your-key-here" >> .env
   ```

2. **Rate limiting**
   ```bash
   # Implement exponential backoff in code
   # Reduce RAG_BATCH_SIZE in .env
   sed -i 's/RAG_BATCH_SIZE=.*/RAG_BATCH_SIZE=10/' .env
   ```

3. **Quota exceeded**
   ```bash
   # Check billing and usage at https://platform.openai.com/usage
   # Implement request throttling
   echo "RAG_RATE_LIMIT_PER_MINUTE=20" >> .env
   ```

4. **Network connectivity issues**
   ```bash
   # Test internet connectivity
   ping -c 3 api.openai.com

   # Check proxy settings
   echo $HTTP_PROXY $HTTPS_PROXY
   ```

### 3. Search Performance Issues

#### Symptom: Slow search responses or timeouts

**Diagnosis Commands:**
```bash
# Performance profiling
time timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "test query"

# Database query analysis
mysql -u rag_user -p rag_database << EOF
SET profiling = 1;
SELECT COUNT(*) FROM lessons;
SELECT COUNT(*) FROM lesson_embeddings;
SHOW PROFILES;
EOF

# Index usage check
mysql -u rag_user -p rag_database << EOF
EXPLAIN SELECT * FROM lessons WHERE category = 'errors' LIMIT 10;
EXPLAIN SELECT * FROM lesson_embeddings WHERE lesson_id = 'test_id';
EOF
```

**Common Causes and Solutions:**

1. **Missing or inefficient indexes**
   ```sql
   -- Check existing indexes
   SHOW INDEX FROM lessons;
   SHOW INDEX FROM lesson_embeddings;

   -- Create missing indexes
   CREATE INDEX idx_lessons_category_created ON lessons(category, created_at);
   CREATE INDEX idx_lessons_content_length ON lessons((LENGTH(content)));
   ```

2. **Large dataset without optimization**
   ```sql
   -- Optimize tables
   OPTIMIZE TABLE lessons;
   OPTIMIZE TABLE lesson_embeddings;

   -- Update table statistics
   ANALYZE TABLE lessons;
   ANALYZE TABLE lesson_embeddings;
   ```

3. **Inefficient similarity threshold**
   ```bash
   # Test different thresholds
   for threshold in 0.5 0.6 0.7 0.8 0.9; do
     echo "Testing threshold: $threshold"
     time timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "test" --threshold $threshold
   done
   ```

4. **Memory constraints**
   ```bash
   # Check memory usage
   mysql -u rag_user -p rag_database << EOF
   SELECT
     table_name,
     ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
   FROM information_schema.tables
   WHERE table_schema = 'rag_database'
   ORDER BY (data_length + index_length) DESC;
   EOF

   # Increase MySQL memory limits
   sudo mysql -e "SET GLOBAL innodb_buffer_pool_size = 1073741824;" # 1GB
   ```

### 4. Search Quality Issues

#### Symptom: Irrelevant search results or no results found

**Diagnosis Commands:**
```bash
# Test embedding similarity
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-debug-similarity "query text"

# Check lesson distribution
mysql -u rag_user -p rag_database << EOF
SELECT category, COUNT(*) as count FROM lessons GROUP BY category;
SELECT COUNT(*) as total_lessons FROM lessons;
SELECT COUNT(*) as lessons_with_embeddings FROM lesson_embeddings;
EOF

# Analyze search patterns
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search-debug "problematic query"
```

**Common Causes and Solutions:**

1. **Similarity threshold too high**
   ```bash
   # Lower threshold for broader results
   timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "query" --threshold 0.5

   # Update default threshold
   sed -i 's/RAG_DEFAULT_SIMILARITY_THRESHOLD=.*/RAG_DEFAULT_SIMILARITY_THRESHOLD=0.65/' .env
   ```

2. **Missing embeddings**
   ```sql
   -- Find lessons without embeddings
   SELECT l.lesson_id, l.title
   FROM lessons l
   LEFT JOIN lesson_embeddings le ON l.lesson_id = le.lesson_id
   WHERE le.lesson_id IS NULL;

   -- Regenerate missing embeddings
   ```

3. **Poor lesson content quality**
   ```sql
   -- Check content length distribution
   SELECT
     CASE
       WHEN LENGTH(content) < 100 THEN 'Very Short'
       WHEN LENGTH(content) < 500 THEN 'Short'
       WHEN LENGTH(content) < 1000 THEN 'Medium'
       ELSE 'Long'
     END as content_length,
     COUNT(*) as count
   FROM lessons
   GROUP BY 1;
   ```

4. **Incorrect embedding model**
   ```bash
   # Verify embedding model
   echo "Current model: $RAG_EMBEDDING_MODEL"

   # Test with different model
   timeout 10s node -e "
   const OpenAI = require('openai');
   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   ['text-embedding-3-small', 'text-embedding-3-large'].forEach(async model => {
     try {
       const result = await openai.embeddings.create({ model, input: 'test' });
       console.log(\`\${model}: \${result.data[0].embedding.length} dimensions\`);
     } catch (e) {
       console.error(\`\${model}: Error - \${e.message}\`);
     }
   });
   "
   ```

### 5. Storage and Migration Issues

#### Symptom: Failed to store lessons or migration errors

**Diagnosis Commands:**
```bash
# Check disk space
df -h

# Test lesson storage
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-store-test

# Check migration status
mysql -u rag_user -p rag_database << EOF
SELECT
  JSON_EXTRACT(metadata, '$.migrated') as migrated,
  COUNT(*) as count
FROM lessons
GROUP BY 1;
EOF
```

**Common Causes and Solutions:**

1. **Disk space full**
   ```bash
   # Clean up old logs
   find development/logs/ -name "*.log" -mtime +30 -delete

   # Clean up old backups
   find /backup/rag-system/ -name "*.sql.gz" -mtime +60 -delete

   # Compress large tables
   mysql -u rag_user -p rag_database << EOF
   ALTER TABLE lessons ROW_FORMAT=COMPRESSED;
   ALTER TABLE lesson_embeddings ROW_FORMAT=COMPRESSED;
   EOF
   ```

2. **Lesson ID conflicts**
   ```sql
   -- Check for duplicate IDs
   SELECT lesson_id, COUNT(*) as count
   FROM lessons
   GROUP BY lesson_id
   HAVING count > 1;

   -- Fix duplicates
   UPDATE lessons SET lesson_id = CONCAT(lesson_id, '_dup_', id) WHERE id IN (
     SELECT id FROM (
       SELECT id, ROW_NUMBER() OVER (PARTITION BY lesson_id ORDER BY created_at) as rn
       FROM lessons
     ) t WHERE rn > 1
   );
   ```

3. **JSON parsing errors**
   ```bash
   # Test JSON validation
   timeout 10s node -e "
   const testData = {
     title: 'Test',
     content: 'Test content',
     context: { test: true }
   };
   console.log('JSON valid:', JSON.stringify(testData));
   "

   # Check for special characters
   mysql -u rag_user -p rag_database << EOF
   SELECT lesson_id, LENGTH(content), content
   FROM lessons
   WHERE content REGEXP '[[:cntrl:]]'
   LIMIT 5;
   EOF
   ```

### 6. Memory and Performance Issues

#### Symptom: High memory usage or system slowdown

**Diagnosis Commands:**
```bash
# Memory usage analysis
ps aux | grep -E "(node|mysql)" | head -10

# Database memory usage
mysql -u rag_user -p rag_database << EOF
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_pages_%';
SHOW GLOBAL VARIABLES LIKE 'innodb_buffer_pool_size';
EOF

# Node.js memory profiling
node --max-old-space-size=4096 /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-memory-test
```

**Common Causes and Solutions:**

1. **Insufficient database memory**
   ```sql
   -- Increase buffer pool size
   SET GLOBAL innodb_buffer_pool_size = 2147483648; -- 2GB

   -- Optimize query cache
   SET GLOBAL query_cache_size = 268435456; -- 256MB
   SET GLOBAL query_cache_type = ON;
   ```

2. **Memory leaks in Node.js**
   ```bash
   # Run with memory profiling
   node --inspect /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-health

   # Monitor memory usage
   watch -n 5 'ps aux | grep node | grep -v grep'
   ```

3. **Large embedding cache**
   ```bash
   # Clear embedding cache
   timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-clear-cache

   # Reduce cache size
   echo "RAG_CACHE_TTL=1800" >> .env  # 30 minutes
   echo "RAG_MAX_CACHE_SIZE=1000" >> .env
   ```

## 🛠️ Advanced Diagnostics

### Database Health Check Script

```bash
# Create comprehensive health check
cat > scripts/rag-health-check.sh << 'EOF'
#!/bin/bash

echo "=== RAG System Health Check ==="
echo "Time: $(date)"
echo

# 1. Database connectivity
echo "1. Database Connectivity:"
if mysql -u rag_user -p rag_database -e "SELECT 1;" 2>/dev/null; then
  echo "   ✓ Database connection successful"
else
  echo "   ✗ Database connection failed"
fi

# 2. Table integrity
echo
echo "2. Table Integrity:"
mysql -u rag_user -p rag_database << 'SQL'
SELECT
  table_name,
  table_rows,
  ROUND((data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'rag_database'
ORDER BY table_rows DESC;
SQL

# 3. Embedding completeness
echo
echo "3. Embedding Completeness:"
mysql -u rag_user -p rag_database << 'SQL'
SELECT
  'Total Lessons' as metric,
  COUNT(*) as value
FROM lessons
UNION ALL
SELECT
  'Lessons with Embeddings' as metric,
  COUNT(*) as value
FROM lesson_embeddings
UNION ALL
SELECT
  'Missing Embeddings' as metric,
  COUNT(*) as value
FROM lessons l
LEFT JOIN lesson_embeddings le ON l.lesson_id = le.lesson_id
WHERE le.lesson_id IS NULL;
SQL

# 4. OpenAI API test
echo
echo "4. OpenAI API Test:"
if timeout 10s node -e "
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'health check test'
}).then(() => console.log('   ✓ OpenAI API working'))
.catch(e => console.log('   ✗ OpenAI API error:', e.message));
" 2>/dev/null; then
  echo "   ✓ API test completed"
else
  echo "   ✗ API test failed"
fi

# 5. Performance test
echo
echo "5. Performance Test:"
start_time=$(date +%s%N)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "health check" > /dev/null 2>&1
end_time=$(date +%s%N)
duration=$((($end_time - $start_time) / 1000000))

if [ $duration -lt 2000 ]; then
  echo "   ✓ Search completed in ${duration}ms"
else
  echo "   ⚠ Search took ${duration}ms (>2000ms threshold)"
fi

echo
echo "=== Health Check Complete ==="
EOF

chmod +x scripts/rag-health-check.sh
./scripts/rag-health-check.sh
```

### Performance Profiling Script

```bash
# Create performance profiling script
cat > scripts/rag-performance-profile.sh << 'EOF'
#!/bin/bash

echo "=== RAG Performance Profiling ==="

# Test different query types and measure performance
queries=(
  "authentication error"
  "linting problems"
  "database connection"
  "performance optimization"
  "testing strategies"
)

thresholds=(0.5 0.7 0.9)

for threshold in "${thresholds[@]}"; do
  echo
  echo "Testing with threshold: $threshold"

  for query in "${queries[@]}"; do
    echo -n "  Query '$query': "

    start_time=$(date +%s%N)
    result=$(timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "$query" --threshold $threshold 2>/dev/null)
    end_time=$(date +%s%N)

    duration=$((($end_time - $start_time) / 1000000))
    result_count=$(echo "$result" | jq -r '.results | length' 2>/dev/null || echo "error")

    echo "${duration}ms (${result_count} results)"
  done
done

echo
echo "=== Profiling Complete ==="
EOF

chmod +x scripts/rag-performance-profile.sh
```

## 🔄 Maintenance and Recovery

### Regular Maintenance Tasks

```bash
# Create maintenance script
cat > scripts/rag-maintenance.sh << 'EOF'
#!/bin/bash
# RAG System Maintenance Script

echo "Starting RAG maintenance: $(date)"

# 1. Optimize database tables
echo "Optimizing database tables..."
mysql -u rag_user -p rag_database << 'SQL'
OPTIMIZE TABLE lessons;
OPTIMIZE TABLE lesson_embeddings;
OPTIMIZE TABLE errors;
ANALYZE TABLE lessons;
ANALYZE TABLE lesson_embeddings;
SQL

# 2. Clean up old cache entries
echo "Cleaning cache..."
mysql -u rag_user -p rag_database << 'SQL'
DELETE FROM similarity_cache WHERE cache_valid_until < NOW();
SQL

# 3. Update effectiveness scores
echo "Updating effectiveness scores..."
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-update-effectiveness

# 4. Generate analytics
echo "Generating analytics..."
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-generate-analytics

# 5. Backup database
echo "Creating backup..."
mysqldump -u rag_user -p rag_database | gzip > "/backup/rag-system/maintenance_backup_$(date +%Y%m%d).sql.gz"

echo "Maintenance complete: $(date)"
EOF

chmod +x scripts/rag-maintenance.sh

# Schedule weekly maintenance
echo "0 3 * * 0 /Users/jeremyparker/infinite-continue-stop-hook/scripts/rag-maintenance.sh" | crontab -
```

### Emergency Recovery Procedures

```bash
# Create recovery script
cat > scripts/rag-emergency-recovery.sh << 'EOF'
#!/bin/bash
# RAG Emergency Recovery Script

echo "=== RAG Emergency Recovery ==="

# 1. Stop all RAG operations
echo "1. Stopping RAG operations..."
pkill -f "taskmanager-api.js rag"

# 2. Check database integrity
echo "2. Checking database integrity..."
mysql -u rag_user -p rag_database << 'SQL'
CHECK TABLE lessons;
CHECK TABLE lesson_embeddings;
REPAIR TABLE lessons;
REPAIR TABLE lesson_embeddings;
SQL

# 3. Restore from latest backup if needed
if [ "$1" = "--restore-backup" ]; then
  echo "3. Restoring from backup..."
  latest_backup=$(ls -t /backup/rag-system/*.sql.gz | head -1)
  if [ -n "$latest_backup" ]; then
    echo "Restoring from: $latest_backup"
    zcat "$latest_backup" | mysql -u rag_user -p rag_database
  else
    echo "No backup found!"
  fi
fi

# 4. Regenerate critical indexes
echo "4. Regenerating indexes..."
mysql -u rag_user -p rag_database << 'SQL'
ALTER TABLE lessons DROP INDEX IF EXISTS idx_lessons_category;
ALTER TABLE lessons ADD INDEX idx_lessons_category (category);

ALTER TABLE lesson_embeddings DROP INDEX IF EXISTS idx_embedding_model;
ALTER TABLE lesson_embeddings ADD INDEX idx_embedding_model (model_version);
SQL

# 5. Test system health
echo "5. Testing system health..."
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-health

echo "=== Recovery Complete ==="
EOF

chmod +x scripts/rag-emergency-recovery.sh
```

## 📊 Monitoring and Alerting

### Log Analysis Commands

```bash
# Monitor error patterns
tail -f development/logs/rag-system/*.log | grep -i error

# Search performance analysis
grep "search.*ms" development/logs/rag-system/*.log | awk '{print $NF}' | sort -n

# Database query analysis
mysql -u rag_user -p rag_database << 'SQL'
SELECT
  sql_text,
  count_star,
  avg_timer_wait / 1000000000 as avg_seconds
FROM performance_schema.events_statements_summary_by_digest
WHERE schema_name = 'rag_database'
ORDER BY avg_timer_wait DESC
LIMIT 10;
SQL
```

### Health Monitoring Script

```bash
# Create monitoring daemon
cat > scripts/rag-monitor-daemon.sh << 'EOF'
#!/bin/bash
# RAG Monitoring Daemon

ALERT_EMAIL="admin@example.com"
CHECK_INTERVAL=300  # 5 minutes

while true; do
  # Check system health
  health=$(timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-health 2>/dev/null)

  if [ $? -ne 0 ]; then
    echo "ALERT: RAG system health check failed at $(date)" | mail -s "RAG System Alert" $ALERT_EMAIL
  fi

  # Check database size
  db_size=$(mysql -u rag_user -p rag_database -e "
    SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
    FROM information_schema.tables
    WHERE table_schema = 'rag_database';
  " | tail -1)

  if [ $(echo "$db_size > 10000" | bc) -eq 1 ]; then
    echo "ALERT: RAG database size exceeds 10GB ($db_size MB) at $(date)" | mail -s "RAG Database Size Alert" $ALERT_EMAIL
  fi

  sleep $CHECK_INTERVAL
done
EOF

chmod +x scripts/rag-monitor-daemon.sh

# Run as background service
nohup ./scripts/rag-monitor-daemon.sh > development/logs/rag-system/monitor.log 2>&1 &
```

## 🆘 When to Escalate

### Critical Issues Requiring Immediate Attention

1. **Database corruption**: Run emergency recovery script
2. **OpenAI API quota exceeded**: Implement temporary caching
3. **System memory exhaustion**: Restart services and investigate
4. **Complete search failure**: Check all components systematically

### Emergency Contacts and Procedures

```bash
# Create emergency runbook
cat > emergency-runbook.md << 'EOF'
# RAG System Emergency Runbook

## Immediate Response (0-5 minutes)
1. Run health check: `./scripts/rag-health-check.sh`
2. Check system resources: `top`, `df -h`, `free -h`
3. Review latest logs: `tail -100 development/logs/rag-system/*.log`

## Short-term Response (5-30 minutes)
1. Identify root cause using diagnostic commands
2. Apply appropriate solution from troubleshooting guide
3. Test fix with health check
4. Document incident

## Long-term Response (30+ minutes)
1. Implement preventive measures
2. Update monitoring and alerting
3. Review and update procedures
4. Conduct post-incident review
EOF
```

---

*This troubleshooting guide provides comprehensive coverage of common RAG system issues. Keep this document updated as new issues are discovered and resolved.*