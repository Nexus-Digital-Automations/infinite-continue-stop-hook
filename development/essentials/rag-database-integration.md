# RAG Database Integration Guide

## Overview

The RAG (Retrieval-Augmented Generation) Database Architecture provides a comprehensive system for storing, retrieving, and learning from agent experiences, errors, and solutions. This system enables agents to build and access a knowledge base that improves over time.

## Architecture Components

### 1. Database Schema (`lib/database/schema.sql`)
- **Projects**: Track different codebases/projects
- **Agents**: Agent instances and capabilities
- **Tasks**: Enhanced task tracking with metadata
- **Lessons**: Successful patterns and learnings
- **Errors**: Comprehensive error tracking and analysis
- **Embeddings**: Vector representations for semantic search
- **Analytics**: Usage tracking and performance metrics

### 2. Database Manager (`lib/database/DatabaseManager.js`)
- SQLite database initialization and configuration
- Schema migration and versioning
- Connection pooling and transaction management
- Performance optimization (WAL mode, indexes, caching)
- Backup and recovery functionality

### 3. Vector Embedding Manager (`lib/database/VectorEmbeddingManager.js`)
- Text-to-vector conversion using Transformers.js
- FAISS-based vector indexing for fast similarity search
- Embedding cache management
- Cosine similarity calculations

### 4. RAG Operations (`lib/api-modules/rag/ragOperations.js`)
- High-level API for lesson and error storage
- Semantic search functionality
- TaskManager integration
- Analytics and reporting

## Installation & Setup

### 1. Install Dependencies
```bash
npm install sqlite3 @xenova/transformers faiss-node natural
```

### 2. Initialize Database
```bash
# Automatic setup with sample data
node lib/database/setup.js

# Setup without sample data
node lib/database/setup.js --no-sample-data

# Force reset (WARNING: destroys existing data)
node lib/database/setup.js --force-reset
```

### 3. Verify Installation
The setup script will:
- Create database schema with all tables and indexes
- Initialize vector embedding system
- Insert sample lessons and errors (if requested)
- Apply performance optimizations
- Run health checks
- Create initial backup

## TaskManager API Integration

### New RAG Endpoints

The TaskManager API now includes RAG operations:

```javascript
// Store a lesson
await api.storeLesson({
  title: "Error Resolution Pattern",
  category: "error_resolution",
  content: "Detailed solution steps...",
  context: "When encountering this specific error...",
  tags: ["linter", "eslint", "javascript"],
  confidence_score: 0.9
});

// Search for lessons
const lessons = await api.searchLessons("linter error fix", {
  limit: 5,
  threshold: 0.7,
  category: "error_resolution"
});

// Find similar errors
const similarErrors = await api.findSimilarErrors("Cannot read property of undefined", {
  limit: 3,
  error_type: "runtime"
});

// Get relevant lessons for a task
const relevantLessons = await api.getRelevantLessons(taskId, {
  limit: 5,
  threshold: 0.65
});

// Get RAG analytics
const analytics = await api.getRagAnalytics();
```

### CLI Commands

```bash
# Store lesson
timeout 10s node taskmanager-api.js store-lesson '{"title":"...", "category":"error_resolution", "content":"..."}'

# Search lessons
timeout 10s node taskmanager-api.js search-lessons "query text" '{"limit":5}'

# Get analytics
timeout 10s node taskmanager-api.js rag-analytics
```

## Usage Patterns

### 1. Storing Lessons After Task Completion

```javascript
// When completing a task successfully
await api.completeTask(taskId, {
  message: "Task completed successfully",
  // Automatically store lesson
  store_lesson: {
    title: "Implementing User Authentication",
    category: "feature_implementation",
    content: "Step-by-step implementation details...",
    code_patterns: ["jwt.sign()", "bcrypt.hash()"],
    confidence_score: 0.8
  }
});
```

### 2. Learning from Errors

```javascript
// When encountering an error
await api.storeError({
  title: "ESLint no-unused-vars Error",
  error_type: "linter",
  error_code: "no-unused-vars",
  message: "'variable' is defined but never used",
  file_path: "src/utils.js",
  line_number: 42,
  resolution_method: "Remove unused variable",
  prevention_strategy: "Use ESLint pre-commit hooks"
});
```

### 3. Getting Contextual Help

```javascript
// Before starting a task, get relevant lessons
const help = await api.getRelevantLessons(taskId);
if (help.relevant_lessons.length > 0) {
  console.log("Found relevant lessons:");
  help.relevant_lessons.forEach(lesson => {
    console.log(`- ${lesson.title}: ${lesson.content}`);
  });
}
```

## Database Performance Optimization

### Indexing Strategy
- **B-tree indexes** on frequently queried columns (category, status, created_at)
- **Composite indexes** for multi-column queries
- **Full-text search indexes** for content search
- **Vector indexes** (FAISS) for semantic similarity

### Caching Layers
1. **Query result caching** (5-minute TTL)
2. **Embedding caching** (7-day TTL on disk)
3. **FAISS index caching** (persistent to disk)
4. **SQLite page caching** (10,000 pages in memory)

### Performance Monitoring
```javascript
// Get performance statistics
const stats = await dbManager.getStatistics();
console.log(`Database size: ${stats.database_size_bytes} bytes`);
console.log(`Recent lessons: ${stats.recent_lessons_7days}`);

// Get embedding statistics
const embeddingStats = await vectorManager.getStatistics();
console.log(`Cached embeddings: ${embeddingStats.cache_files}`);
```

## Data Models

### Lesson Data Structure
```javascript
{
  title: "String - Descriptive title",
  category: "error_resolution|feature_implementation|optimization|decision|pattern",
  subcategory: "String - Optional specific type",
  content: "String - Detailed lesson content (markdown supported)",
  context: "String - When/where this lesson applies",
  task_id: "String - Reference to originating task",
  confidence_score: "Float 0-1 - How confident in this lesson",
  effectiveness_score: "Float 0-1 - How effective this lesson is",
  tags: "Array - Searchable tags",
  code_patterns: "Array - Associated code patterns",
  file_patterns: "Array - File patterns where lesson applies",
  dependencies: "Array - Technologies/frameworks",
  related_errors: "Array - Error types this lesson helps solve"
}
```

### Error Data Structure
```javascript
{
  title: "String - Error title",
  error_type: "linter|build|runtime|integration|security",
  error_code: "String - Specific error code if available",
  message: "String - Error message",
  stack_trace: "String - Full stack trace",
  file_path: "String - File where error occurred",
  line_number: "Integer - Line number",
  column_number: "Integer - Column number",
  context: "String - Code context",
  severity: "low|medium|high|critical",
  resolution_method: "String - How error was resolved",
  prevention_strategy: "String - How to prevent in future",
  environment_info: "Object - System/environment details"
}
```

## Vector Embedding Strategy

### Model Configuration
- **Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Dimension**: 384
- **Quantized**: Yes (for performance)
- **Cache**: Disk-based with 7-day TTL

### Similarity Thresholds
- **High similarity**: 0.85+ (very related content)
- **Medium similarity**: 0.70+ (somewhat related)
- **Low similarity**: 0.55+ (potentially useful)

### Search Strategy
1. **Primary**: Semantic search using vector embeddings
2. **Fallback**: Full-text search using SQLite FTS5
3. **Hybrid**: Combine results from both methods

## Analytics and Insights

### Usage Analytics
- Track how often lessons/errors are accessed
- Measure effectiveness of lessons over time
- Identify knowledge gaps and patterns
- Monitor agent learning progress

### Performance Metrics
```javascript
{
  database_stats: {
    lessons_count: 150,
    errors_count: 75,
    embeddings_count: 225,
    database_size_bytes: 10485760
  },
  embedding_stats: {
    lesson_embeddings: 150,
    error_embeddings: 75,
    cache_files: 45
  },
  top_lessons: [...], // Most accessed lessons
  common_errors: [...], // Most frequent error types
  lesson_effectiveness: [...] // Effectiveness by category
}
```

## Integration with Agent Workflows

### 1. Pre-Task Research
```javascript
// Before claiming a task
const relevantLessons = await api.getRelevantLessons(taskId);
// Review lessons and apply learned patterns
```

### 2. During Task Execution
```javascript
// When encountering similar errors
const similarErrors = await api.findSimilarErrors(errorMessage);
// Apply known resolutions
```

### 3. Post-Task Learning
```javascript
// After completing task
await api.storeLesson({
  title: "Task completion lesson",
  content: "What was learned during this task",
  task_id: taskId
});
```

## Backup and Recovery

### Automatic Backups
```javascript
// Create backup
const backupPath = `./backups/rag_${timestamp}.db`;
await dbManager.backup(backupPath);

// Restore from backup
// Stop application, replace database file, restart
```

### Data Export/Import
```javascript
// Export lessons to JSON
const lessons = await dbManager.all('SELECT * FROM lessons');
fs.writeFileSync('lessons_export.json', JSON.stringify(lessons, null, 2));

// Bulk import lessons
for (const lesson of importedLessons) {
  await api.storeLesson(lesson);
}
```

## Troubleshooting

### Common Issues

1. **Database locked**: Check for long-running transactions
2. **Embedding model loading fails**: Ensure sufficient memory
3. **FAISS index corruption**: Rebuild indexes using `vectorManager.rebuildIndexes()`
4. **Slow queries**: Run `ANALYZE` and check index usage

### Health Checks
```javascript
// Database health
const dbHealth = await dbManager.healthCheck();

// Vector system health
const vectorStats = await vectorManager.getStatistics();

// Full system test
const testResults = await api.searchLessons("test query");
```

## Security Considerations

### Data Privacy
- No personally identifiable information in lessons/errors
- Sanitize code examples before storage
- Use project-specific isolation where needed

### Access Control
- Agents can only access lessons from their project scope
- No cross-project data leakage
- Audit trail for all data access

## Future Enhancements

### Planned Features
1. **Cross-project learning**: Share lessons across related projects
2. **Lesson ranking**: ML-based effectiveness scoring
3. **Automated lesson extraction**: Extract lessons from successful tasks
4. **Integration with code analysis**: Automatic error pattern detection
5. **Real-time recommendations**: Context-aware lesson suggestions

### Scalability Improvements
1. **Distributed vector search**: Scale to larger datasets
2. **Hierarchical clustering**: Organize lessons by similarity
3. **Incremental learning**: Update embeddings as content changes
4. **Performance monitoring**: Real-time query optimization

## API Reference

See the complete API documentation in the TaskManager guide:
```bash
timeout 10s node taskmanager-api.js guide
```

---

This RAG database system provides the foundation for continuous agent learning and knowledge accumulation, enabling increasingly sophisticated and context-aware task completion over time.