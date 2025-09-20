# RAG System Migration Guide

## 📋 Overview

This guide provides comprehensive instructions for migrating from the current file-based lesson system to the new RAG-based database system. The migration process preserves all existing knowledge while adding powerful semantic search capabilities.

## 🎯 Migration Strategy

### Phase 1: Preparation and Assessment
### Phase 2: Database Setup and Schema Creation
### Phase 3: Data Migration and Transformation
### Phase 4: Integration and Testing
### Phase 5: Rollout and Cleanup

## 📊 Pre-Migration Assessment

### Current System Analysis

```bash
# Analyze existing lesson structure
find development/lessons/ -type f -name "*.md" | wc -l
echo "Total lesson files found"

# Check file sizes and complexity
find development/lessons/ -name "*.md" -exec wc -l {} + | sort -n

# Identify lesson categories
ls -la development/lessons/

# Sample lesson structure analysis
head -20 development/lessons/errors/*.md
head -20 development/lessons/features/*.md
```

### Migration Requirements Checklist

- [ ] Database system available (MySQL 8.0+ or PostgreSQL 12+)
- [ ] Vector extension enabled (for similarity search)
- [ ] OpenAI API access (for embedding generation)
- [ ] Sufficient storage space (estimate: current files × 3)
- [ ] Backup of existing lesson files created
- [ ] TaskManager API updated with RAG modules

## 🛠️ Phase 1: Preparation

### 1.1 Backup Existing Data

```bash
# Create comprehensive backup
mkdir -p migration_backup/$(date +%Y%m%d_%H%M%S)
cp -r development/lessons/ migration_backup/$(date +%Y%m%d_%H%M%S)/
cp -r development/errors/ migration_backup/$(date +%Y%m%d_%H%M%S)/
tar -czf migration_backup/lessons_backup_$(date +%Y%m%d_%H%M%S).tar.gz development/lessons/

echo "Backup created successfully"
```

### 1.2 Environment Setup

```bash
# Install required dependencies
npm install @openai/openai mysql2 pg vector-database

# Configure environment variables
cat >> .env << EOF
# RAG System Configuration
RAG_ENABLED=true
RAG_DATABASE_URL=mysql://user:password@localhost/rag_database
OPENAI_API_KEY=your_openai_api_key_here
RAG_EMBEDDING_MODEL=text-embedding-3-small
RAG_BATCH_SIZE=100
RAG_MAX_RETRIES=3

# Migration-specific settings
MIGRATION_BATCH_SIZE=50
MIGRATION_PARALLEL_WORKERS=3
MIGRATION_BACKUP_ENABLED=true
EOF
```

### 1.3 Database Preparation

```sql
-- Create RAG database
CREATE DATABASE rag_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated migration user
CREATE USER 'rag_migrator'@'localhost' IDENTIFIED BY 'secure_migration_password';
GRANT ALL PRIVILEGES ON rag_database.* TO 'rag_migrator'@'localhost';
FLUSH PRIVILEGES;
```

## 🗄️ Phase 2: Database Setup

### 2.1 Schema Creation

```bash
# Create RAG schema
mysql -u rag_migrator -p rag_database < development/docs/rag-system/sql/schema.sql

# Verify schema creation
mysql -u rag_migrator -p rag_database -e "SHOW TABLES;"

# Expected output:
# lessons
# lesson_embeddings
# errors
# error_embeddings
# error_patterns
# lesson_tags
# similarity_cache
# learning_analytics
```

### 2.2 Index Optimization for Migration

```sql
-- Temporary indexes for faster migration
CREATE INDEX temp_migration_idx_content_hash ON lessons(MD5(content));
CREATE INDEX temp_migration_idx_file_path ON lessons(JSON_EXTRACT(context, '$.originalFile'));

-- Vector search preparation
CREATE VECTOR INDEX idx_lesson_embeddings_migration
ON lesson_embeddings(embedding)
USING HNSW WITH (M = 16, efConstruction = 200);
```

## 🔄 Phase 3: Data Migration

### 3.1 Migration Script Setup

Create the main migration script:

```javascript
// migration/migrate-lessons.js
const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const OpenAI = require('openai');

class LessonMigrator {
  constructor() {
    this.db = null;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.batchSize = parseInt(process.env.MIGRATION_BATCH_SIZE) || 50;
    this.maxRetries = parseInt(process.env.RAG_MAX_RETRIES) || 3;
  }

  async connect() {
    this.db = await mysql.createConnection(process.env.RAG_DATABASE_URL);
    console.log('Connected to RAG database');
  }

  async migrateDirectory(directoryPath) {
    const files = await this.findLessonFiles(directoryPath);
    console.log(`Found ${files.length} lesson files to migrate`);

    const batches = this.createBatches(files, this.batchSize);

    for (let i = 0; i < batches.length; i++) {
      console.log(`Processing batch ${i + 1}/${batches.length}`);
      await this.processBatch(batches[i]);
    }
  }

  async findLessonFiles(dirPath) {
    const files = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.findLessonFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  async processBatch(filePaths) {
    const lessons = [];

    for (const filePath of filePaths) {
      try {
        const lesson = await this.parseLesson(filePath);
        if (lesson) {
          lessons.push(lesson);
        }
      } catch (error) {
        console.error(`Failed to parse ${filePath}: ${error.message}`);
      }
    }

    if (lessons.length > 0) {
      await this.storeLessons(lessons);
    }
  }

  async parseLesson(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const relativePath = path.relative('development/lessons/', filePath);
    const pathParts = relativePath.split('/');
    const category = pathParts[0] || 'general';

    // Extract title from filename or first line
    const title = this.extractTitle(content, path.basename(filePath, '.md'));

    // Extract tags from content and path
    const tags = this.extractTags(content, pathParts);

    // Create lesson object
    return {
      lesson_id: this.generateLessonId(filePath),
      title: title,
      content: content,
      category: this.mapCategory(category),
      context: {
        originalFile: filePath,
        migrationDate: new Date().toISOString(),
        fileSize: (await fs.stat(filePath)).size
      },
      metadata: {
        migrated: true,
        source: 'file_migration'
      },
      tags: tags
    };
  }

  async storeLessons(lessons) {
    const transaction = await this.db.beginTransaction();

    try {
      for (const lesson of lessons) {
        // Store lesson
        await this.db.execute(
          `INSERT INTO lessons (lesson_id, title, content, category, context, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            lesson.lesson_id,
            lesson.title,
            lesson.content,
            lesson.category,
            JSON.stringify(lesson.context),
            JSON.stringify(lesson.metadata)
          ]
        );

        // Generate and store embedding
        const embedding = await this.generateEmbedding(lesson.content);
        await this.db.execute(
          `INSERT INTO lesson_embeddings (lesson_id, embedding, model_version)
           VALUES (?, ?, ?)`,
          [lesson.lesson_id, JSON.stringify(embedding), 'text-embedding-3-small']
        );

        // Store tags
        for (const tag of lesson.tags) {
          await this.db.execute(
            `INSERT INTO lesson_tags (lesson_id, tag, auto_generated)
             VALUES (?, ?, ?)`,
            [lesson.lesson_id, tag, true]
          );
        }
      }

      await transaction.commit();
      console.log(`Successfully migrated ${lessons.length} lessons`);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async generateEmbedding(text) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text.substring(0, 8000) // Limit for token constraints
        });
        return response.data[0].embedding;
      } catch (error) {
        console.warn(`Embedding attempt ${attempt} failed: ${error.message}`);
        if (attempt === this.maxRetries) throw error;
        await this.sleep(1000 * attempt); // Exponential backoff
      }
    }
  }

  // Helper methods
  extractTitle(content, filename) {
    const firstLine = content.split('\n')[0];
    if (firstLine.startsWith('#')) {
      return firstLine.replace(/^#+\s*/, '').trim();
    }
    return filename.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  extractTags(content, pathParts) {
    const tags = [...pathParts];

    // Extract tags from content
    const tagMatches = content.match(/(?:tags?:|#)\s*([a-zA-Z0-9,\s]+)/gi);
    if (tagMatches) {
      tagMatches.forEach(match => {
        const extracted = match.replace(/(?:tags?:|#)\s*/i, '').split(',');
        tags.push(...extracted.map(tag => tag.trim().toLowerCase()));
      });
    }

    return [...new Set(tags.filter(tag => tag && tag.length > 0))];
  }

  mapCategory(fileCategory) {
    const categoryMap = {
      'errors': 'errors',
      'features': 'features',
      'optimization': 'optimization',
      'decisions': 'decisions',
      'patterns': 'patterns'
    };
    return categoryMap[fileCategory] || 'general';
  }

  generateLessonId(filePath) {
    const timestamp = Date.now();
    const hash = require('crypto')
      .createHash('md5')
      .update(filePath)
      .digest('hex')
      .substring(0, 8);
    return `lesson_${timestamp}_${hash}`;
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.db) {
      await this.db.end();
    }
  }
}

module.exports = LessonMigrator;
```

### 3.2 Execute Migration

```bash
# Run the migration
node migration/migrate-lessons.js development/lessons/

# Monitor migration progress
tail -f migration.log

# Check migration results
mysql -u rag_migrator -p rag_database -e "
SELECT
  category,
  COUNT(*) as lesson_count,
  AVG(LENGTH(content)) as avg_content_length
FROM lessons
WHERE JSON_EXTRACT(metadata, '$.migrated') = true
GROUP BY category;
"
```

### 3.3 Error Migration

```bash
# Migrate error-related lessons separately
node migration/migrate-errors.js development/errors/

# Verify error migration
mysql -u rag_migrator -p rag_database -e "
SELECT COUNT(*) as error_count FROM errors;
SELECT COUNT(*) as error_pattern_count FROM error_patterns;
"
```

## 🧪 Phase 4: Integration and Testing

### 4.1 Integration Testing

```bash
# Test RAG system health
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-health

# Test lesson retrieval
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "authentication"

# Test similarity search
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-similar-errors "linter error"

# Compare results with file-based search
grep -r "authentication" development/lessons/ | wc -l
```

### 4.2 Data Integrity Verification

```sql
-- Check for missing embeddings
SELECT l.lesson_id, l.title
FROM lessons l
LEFT JOIN lesson_embeddings le ON l.lesson_id = le.lesson_id
WHERE le.lesson_id IS NULL;

-- Verify tag distribution
SELECT tag, COUNT(*) as usage_count
FROM lesson_tags
GROUP BY tag
ORDER BY usage_count DESC
LIMIT 20;

-- Check content quality
SELECT
  AVG(LENGTH(content)) as avg_content_length,
  MIN(LENGTH(content)) as min_content_length,
  MAX(LENGTH(content)) as max_content_length
FROM lessons;
```

### 4.3 Performance Testing

```bash
# Test search performance
time timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "complex query with multiple terms"

# Test batch operations
time timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-batch-search "query1,query2,query3"

# Load testing
for i in {1..10}; do
  timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "test query $i" &
done
wait
```

## 🚀 Phase 5: Rollout and Cleanup

### 5.1 Agent Workflow Updates

Update CLAUDE.md to include RAG workflows:

```markdown
### 🧠 RAG-ENHANCED PRE-TASK PREPARATION
**MANDATORY RAG INTEGRATION IN ALL WORKFLOWS**

**PREPARATION STEPS:**
1. **RAG HEALTH CHECK**: `timeout 10s node taskmanager-api.js rag-health`
2. **RELEVANT LESSONS**: `timeout 10s node taskmanager-api.js rag-get-relevant "$TASK_DESCRIPTION"`
3. **ERROR PATTERNS**: `timeout 10s node taskmanager-api.js rag-similar-errors "$ERROR_DESCRIPTION"` (for error tasks)
4. **CONTEXT ENHANCEMENT**: Apply retrieved lessons to task strategy

**DURING TASK EXECUTION:**
- **STORE INSIGHTS**: Automatically store solutions and discoveries
- **REFERENCE PATTERNS**: Apply retrieved lesson patterns to current work
- **DOCUMENT APPROACH**: Store approach reasoning for future reference

**POST-TASK COMPLETION:**
- **STORE COMPLETION LESSON**: Document successful completion approach
- **UPDATE EFFECTIVENESS**: Mark used lessons as effective/ineffective
- **CROSS-REFERENCE**: Link new lessons to related existing ones
```

### 5.2 File System Cleanup

```bash
# Create archive of original files
mkdir -p development/legacy_lessons_archive
mv development/lessons/* development/legacy_lessons_archive/
mv development/errors/* development/legacy_lessons_archive/

# Update directory structure
mkdir -p development/rag_migration_reports
mv migration.log development/rag_migration_reports/
mv migration_backup/* development/rag_migration_reports/

# Clean up temporary migration files
rm -rf migration/temp/
```

### 5.3 Performance Optimization

```sql
-- Optimize database after migration
OPTIMIZE TABLE lessons;
OPTIMIZE TABLE lesson_embeddings;
OPTIMIZE TABLE errors;

-- Update statistics
ANALYZE TABLE lessons;
ANALYZE TABLE lesson_embeddings;

-- Remove temporary migration indexes
DROP INDEX temp_migration_idx_content_hash ON lessons;
DROP INDEX temp_migration_idx_file_path ON lessons;
```

## 📊 Migration Validation

### Validation Checklist

```bash
# Create validation report
cat > migration_validation.sh << 'EOF'
#!/bin/bash

echo "=== RAG Migration Validation Report ==="
echo "Generated: $(date)"
echo

echo "1. Database Statistics:"
mysql -u rag_migrator -p rag_database -e "
SELECT
  'Lessons' as type, COUNT(*) as count
FROM lessons
UNION ALL
SELECT
  'Embeddings' as type, COUNT(*) as count
FROM lesson_embeddings
UNION ALL
SELECT
  'Tags' as type, COUNT(*) as count
FROM lesson_tags
UNION ALL
SELECT
  'Errors' as type, COUNT(*) as count
FROM errors;
"

echo
echo "2. Search Performance Test:"
time timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "authentication" > /dev/null

echo
echo "3. Health Check:"
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-health

echo
echo "4. Sample Search Results:"
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "linting errors" --limit 3

echo
echo "=== Validation Complete ==="
EOF

chmod +x migration_validation.sh
./migration_validation.sh > migration_validation_report.txt
```

### Quality Assurance Tests

```javascript
// qa/migration-qa.js
const QATestSuite = {
  async runFullValidation() {
    const results = {};

    // Test 1: Data Completeness
    results.completeness = await this.testDataCompleteness();

    // Test 2: Search Accuracy
    results.searchAccuracy = await this.testSearchAccuracy();

    // Test 3: Performance
    results.performance = await this.testPerformance();

    // Test 4: Integration
    results.integration = await this.testIntegration();

    return results;
  },

  async testDataCompleteness() {
    // Verify all original lessons have corresponding database entries
    // Check embedding generation completeness
    // Validate tag extraction accuracy
  },

  async testSearchAccuracy() {
    // Compare RAG search results with file-based search
    // Test similarity threshold effectiveness
    // Validate semantic understanding
  },

  async testPerformance() {
    // Measure average query response time
    // Test concurrent user scenarios
    // Validate memory usage
  },

  async testIntegration() {
    // Test TaskManager API integration
    // Verify agent workflow compatibility
    // Check error handling
  }
};
```

## 🔧 Troubleshooting Common Issues

### Issue 1: Missing Embeddings

```sql
-- Find lessons without embeddings
SELECT l.lesson_id, l.title
FROM lessons l
LEFT JOIN lesson_embeddings le ON l.lesson_id = le.lesson_id
WHERE le.lesson_id IS NULL;

-- Regenerate missing embeddings
-- Use the regenerate-embeddings.js script
```

### Issue 2: Poor Search Results

```bash
# Check similarity thresholds
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "test query" --threshold 0.5

# Verify embedding quality
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-validate-embeddings
```

### Issue 3: Performance Issues

```sql
-- Check index usage
EXPLAIN SELECT * FROM lessons WHERE category = 'errors';

-- Monitor query performance
SET profiling = 1;
SELECT /* query */ ;
SHOW PROFILES;
```

## 📈 Post-Migration Optimization

### 1. Continuous Improvement

```bash
# Set up regular optimization tasks
cat > optimize_rag.sh << 'EOF'
#!/bin/bash
# Daily RAG optimization

# Update lesson effectiveness scores
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-update-effectiveness

# Clean up low-quality lessons
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-cleanup-low-quality

# Update search analytics
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-update-analytics
EOF

# Schedule in cron
echo "0 2 * * * /path/to/optimize_rag.sh" | crontab -
```

### 2. Monitoring Setup

```bash
# Create monitoring dashboard
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-create-dashboard

# Set up alerts for system health
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-setup-alerts
```

## ✅ Migration Success Criteria

- [ ] All original lessons successfully migrated to database
- [ ] Embeddings generated for all lessons and errors
- [ ] Search functionality returns relevant results
- [ ] Performance meets or exceeds file-based system
- [ ] Agent workflows successfully updated
- [ ] Integration tests pass
- [ ] Backup and rollback procedures tested
- [ ] Documentation updated
- [ ] Team training completed

## 🎯 Next Steps

1. **Monitor Usage Patterns**: Track how agents use the new system
2. **Gather Feedback**: Collect agent and user feedback for improvements
3. **Optimize Performance**: Fine-tune based on actual usage patterns
4. **Expand Features**: Add advanced analytics and cross-project learning
5. **Scale Infrastructure**: Plan for growth in lesson and error data

---

*This migration guide ensures a smooth transition from file-based lessons to the powerful RAG database system while preserving all existing knowledge and enhancing discoverability.*