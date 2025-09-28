# RAG System API Reference

## 📋 Overview

The RAG System API provides comprehensive endpoints for storing, retrieving, and managing lessons and errors with semantic search capabilities. All endpoints follow RESTful principles and integrate seamlessly with the existing TaskManager system.

## 🔗 Base Configuration

**Base URL**: `http://localhost:3000/api/rag`
**Authentication**: Bearer token (inherited from TaskManager session)
**Content-Type**: `application/json`
**Timeout**: 10 seconds (as per CLAUDE.md requirements)

## 📖 Lessons API

### Store Lesson

Store a new lesson with automatic embedding generation and categorization.

```http
POST /api/rag/lessons
```

**Request Body**:

```json
{
  "title": "Fix authentication bug in user login",
  "content": "When users can't log in, check for expired JWT tokens. The solution is to implement proper token refresh logic in the auth middleware.",
  "category": "errors|features|optimization|decisions|patterns",
  "tags": ["authentication", "jwt", "middleware"],
  "context": {
    "taskId": "error_1758223935863_kquonzbspt",
    "projectPath": "/Users/username/project",
    "agentId": "dev_session_123_agent_456",
    "files": ["src/auth/middleware.js", "src/auth/jwt.js"],
    "errorType": "authentication_failure",
    "solution": "implement_token_refresh"
  },
  "metadata": {
    "difficulty": "medium",
    "timeToResolve": "2h",
    "successfulSolution": true,
    "relatedErrors": ["auth_timeout", "session_expired"]
  }
}
```

**Response**:

```json
{
  "success": true,
  "lessonId": "lesson_1758332956001_auth_fix",
  "embedding": {
    "generated": true,
    "dimensions": 1536,
    "model": "text-embedding-3-small"
  },
  "categorization": {
    "primary": "errors",
    "confidence": 0.92,
    "subcategories": ["authentication", "jwt", "security"]
  },
  "message": "Lesson stored successfully with semantic embeddings"
}
```

**Error Responses**:

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Title and content are required",
  "details": {
    "missingFields": ["title", "content"]
  }
}
```

### Retrieve Lessons

Search for relevant lessons using semantic similarity or filters.

```http
GET /api/rag/lessons/search
```

**Query Parameters**:

```
query              - Natural language search query (optional)
category           - Filter by category (optional)
tags               - Comma-separated tags (optional)
limit              - Number of results (default: 10, max: 100)
offset             - Pagination offset (default: 0)
similarityThreshold - Minimum similarity score (default: 0.7)
projectPath        - Filter by project (optional)
timeRange          - Date range filter: "7d", "30d", "90d", "all" (default: "all")
```

**Example Request**:

```bash
curl -X GET "http://localhost:3000/api/rag/lessons/search?query=authentication%20login%20problems&limit=5&category=errors" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Response**:

```json
{
  "success": true,
  "results": [
    {
      "lessonId": "lesson_1758332956001_auth_fix",
      "title": "Fix authentication bug in user login",
      "content": "When users can't log in, check for expired JWT tokens...",
      "category": "errors",
      "tags": ["authentication", "jwt", "middleware"],
      "similarity": 0.94,
      "relevance": "high",
      "context": {
        "taskId": "error_1758223935863_kquonzbspt",
        "files": ["src/auth/middleware.js"],
        "timeToResolve": "2h"
      },
      "createdAt": "2025-09-20T01:49:16.001Z",
      "updatedAt": "2025-09-20T01:49:16.001Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 5,
    "offset": 0,
    "hasMore": false
  },
  "queryInfo": {
    "semanticSearch": true,
    "embeddingModel": "text-embedding-3-small",
    "processingTime": "127ms"
  }
}
```

### Get Lesson by ID

Retrieve a specific lesson with full details.

```http
GET /api/rag/lessons/{lessonId}
```

**Response**:

```json
{
  "success": true,
  "lesson": {
    "lessonId": "lesson_1758332956001_auth_fix",
    "title": "Fix authentication bug in user login",
    "content": "Detailed lesson content...",
    "category": "errors",
    "tags": ["authentication", "jwt", "middleware"],
    "context": {
      /* full context object */
    },
    "metadata": {
      /* full metadata object */
    },
    "relatedLessons": [
      {
        "lessonId": "lesson_xyz",
        "title": "JWT token management best practices",
        "similarity": 0.87
      }
    ],
    "analytics": {
      "timesAccessed": 15,
      "effectiveness": 0.89,
      "lastAccessed": "2025-09-20T01:45:00.000Z"
    },
    "createdAt": "2025-09-20T01:49:16.001Z",
    "updatedAt": "2025-09-20T01:49:16.001Z"
  }
}
```

### Update Lesson

Update an existing lesson and regenerate embeddings if content changed.

```http
PUT /api/rag/lessons/{lessonId}
```

**Request Body**:

```json
{
  "title": "Updated title",
  "content": "Updated content with new insights...",
  "tags": ["updated", "tags"],
  "metadata": {
    "effectiveness": 0.95,
    "additionalNotes": "Solution confirmed effective in production"
  }
}
```

### Delete Lesson

Remove a lesson from the database.

```http
DELETE /api/rag/lessons/{lessonId}
```

**Response**:

```json
{
  "success": true,
  "message": "Lesson deleted successfully",
  "lessonId": "lesson_1758332956001_auth_fix"
}
```

## 🚨 Errors API

### Store Error

Store error information with context and solution tracking.

```http
POST /api/rag/errors
```

**Request Body**:

```json
{
  "title": "ESLint violation: unused variable in auth.js",
  "description": "Variable 'tempToken' declared but never used in authentication middleware",
  "errorType": "linter_error",
  "severity": "warning",
  "category": "code_quality",
  "context": {
    "file": "src/auth/middleware.js",
    "line": 45,
    "column": 8,
    "rule": "no-unused-vars",
    "linter": "eslint",
    "project": "/Users/username/project"
  },
  "solution": {
    "description": "Remove unused variable declaration",
    "action": "delete_line",
    "preventionStrategy": "Use ESLint auto-fix or configure proper variable usage"
  },
  "metadata": {
    "resolvedIn": "30s",
    "frequency": "common",
    "impact": "low"
  }
}
```

**Response**:

```json
{
  "success": true,
  "errorId": "error_1758332956002_eslint_unused",
  "patternId": "pattern_unused_variables_auth",
  "embedding": {
    "generated": true,
    "model": "text-embedding-3-small"
  },
  "relatedErrors": [
    {
      "errorId": "error_abc123",
      "similarity": 0.91,
      "pattern": "unused_variables"
    }
  ]
}
```

### Search Errors

Find similar errors and their solutions.

```http
GET /api/rag/errors/search
```

**Query Parameters**: Similar to lessons search with additional error-specific filters:

```
errorType    - Filter by error type
severity     - Filter by severity level
resolved     - Filter by resolution status (true/false)
pattern      - Filter by error pattern ID
```

### Get Error Patterns

Retrieve common error patterns and their solutions.

```http
GET /api/rag/errors/patterns
```

**Response**:

```json
{
  "success": true,
  "patterns": [
    {
      "patternId": "pattern_unused_variables_auth",
      "name": "Unused Variables in Authentication",
      "description": "Common pattern of declaring but not using variables in auth code",
      "frequency": 47,
      "avgResolutionTime": "45s",
      "commonSolutions": ["Remove unused declarations", "Implement proper variable usage", "Configure ESLint auto-fix"],
      "prevention": ["Enable ESLint warnings", "Use TypeScript strict mode", "Implement pre-commit hooks"]
    }
  ]
}
```

## 🔍 Analytics API

### Get Learning Analytics

Retrieve analytics about lesson effectiveness and usage patterns.

```http
GET /api/rag/analytics/lessons
```

**Query Parameters**:

```
timeRange    - Analysis time range: "7d", "30d", "90d", "all"
category     - Filter by lesson category
agentId      - Filter by specific agent
projectPath  - Filter by project
```

**Response**:

```json
{
  "success": true,
  "analytics": {
    "totalLessons": 1247,
    "totalAccesses": 8934,
    "averageEffectiveness": 0.87,
    "topCategories": [
      { "category": "errors", "count": 523, "effectiveness": 0.91 },
      { "category": "features", "count": 412, "effectiveness": 0.84 }
    ],
    "trendingTopics": [
      { "topic": "authentication", "mentions": 89, "growth": "+23%" },
      { "topic": "performance", "mentions": 67, "growth": "+15%" }
    ],
    "agentActivity": [{ "agentId": "dev_session_123", "lessons": 45, "effectiveness": 0.92 }]
  }
}
```

### Get Error Analytics

Retrieve error pattern analysis and resolution metrics.

```http
GET /api/rag/analytics/errors
```

**Response**:

```json
{
  "success": true,
  "analytics": {
    "totalErrors": 2891,
    "resolvedErrors": 2756,
    "resolutionRate": 0.95,
    "avgResolutionTime": "2m 34s",
    "topErrorTypes": [
      { "type": "linter_error", "count": 1234, "avgResolution": "45s" },
      { "type": "build_error", "count": 567, "avgResolution": "3m 12s" }
    ],
    "patterns": {
      "recurring": 34,
      "newThisWeek": 7,
      "resolved": 89
    }
  }
}
```

## 🔄 Migration API

### Import Legacy Lessons

Import lessons from existing file-based structure.

```http
POST /api/rag/migration/import-lessons
```

**Request Body**:

```json
{
  "source": "file_system",
  "path": "/Users/username/project/development/lessons",
  "options": {
    "preserveFileStructure": true,
    "generateEmbeddings": true,
    "categorizeAutomatically": true,
    "backup": true
  }
}
```

**Response**:

```json
{
  "success": true,
  "migrationId": "migration_1758332956003",
  "summary": {
    "filesProcessed": 156,
    "lessonsImported": 142,
    "errors": 3,
    "warnings": 11
  },
  "status": "completed",
  "duration": "45s"
}
```

### Migration Status

Check the status of ongoing migration.

```http
GET /api/rag/migration/{migrationId}/status
```

## 🔧 System API

### Health Check

Check system health and component status.

```http
GET /api/rag/health
```

**Response**:

```json
{
  "success": true,
  "status": "healthy",
  "components": {
    "database": "connected",
    "embedding_service": "operational",
    "vector_search": "operational",
    "cache": "healthy"
  },
  "metrics": {
    "avgResponseTime": "127ms",
    "embeddingQueueSize": 0,
    "cacheHitRate": 0.89
  }
}
```

### Generate Embeddings

Manually trigger embedding generation for specific content.

```http
POST /api/rag/embeddings/generate
```

**Request Body**:

```json
{
  "content": "Text content to generate embeddings for",
  "type": "lesson|error|general",
  "options": {
    "model": "text-embedding-3-small",
    "normalize": true
  }
}
```

## 📊 Rate Limits

- **Standard endpoints**: 100 requests/minute per agent
- **Search endpoints**: 500 requests/minute per agent
- **Analytics endpoints**: 50 requests/minute per agent
- **Migration endpoints**: 10 requests/minute per agent

## 🔐 Authentication

All endpoints require authentication via Bearer token obtained from TaskManager session:

```http
Authorization: Bearer <taskmanager_session_token>
```

## 📝 Error Codes

| Code               | Description                 |
| ------------------ | --------------------------- |
| `VALIDATION_ERROR` | Request validation failed   |
| `NOT_FOUND`        | Resource not found          |
| `RATE_LIMITED`     | Too many requests           |
| `EMBEDDING_ERROR`  | Embedding generation failed |
| `SEARCH_ERROR`     | Search operation failed     |
| `DATABASE_ERROR`   | Database operation failed   |

## 🎯 Best Practices

1. **Batch Operations**: Use batch endpoints for multiple operations
2. **Caching**: Cache frequently accessed lessons locally
3. **Error Handling**: Always handle embedding failures gracefully
4. **Rate Limiting**: Implement client-side rate limiting
5. **Timeouts**: Use 10-second timeouts as per CLAUDE.md requirements

---

_This API reference provides complete documentation for integrating with the RAG-based lessons and error database system._
