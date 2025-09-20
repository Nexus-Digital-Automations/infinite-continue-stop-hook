# RAG Operations API Documentation

## Overview

The RAG (Retrieval-Augmented Generation) Operations API provides semantic search capabilities for lessons learned and error resolutions. This system enables intelligent storage, retrieval, and analysis of knowledge gained from task completion and error resolution.

## Core Features

- **Semantic Search**: Vector-based similarity matching for contextual retrieval
- **Auto-Embedding Generation**: Automatic embedding creation for stored content
- **Project-Specific Storage**: Support for both project-specific and global knowledge
- **Analytics Tracking**: Usage patterns and effectiveness metrics
- **Integration with TaskManager**: Seamless workflow integration

## API Endpoints

### Store Lesson

Store a new lesson with automatic embedding generation for semantic search.

**Command**: `store-lesson`
**Usage**: `timeout 10s node taskmanager-api.js store-lesson '<lessonData>'`

**Required Fields**:
- `title` (string): Brief title describing the lesson
- `content` (string): Detailed lesson content

**Optional Fields**:
- `category` (string): Lesson category (default: "general")
- `tags` (array): Array of tags for categorization
- `projectId` (string): Project identifier (default: "global")
- `taskId` (string): Associated task ID
- `difficulty` (string): Difficulty level ("easy", "medium", "hard")
- `effectiveness` (string): Effectiveness rating
- `source` (string): Source of the lesson (default: "manual")
- `context` (object): Additional context information
- `files_modified` (array): Files affected by this lesson
- `related_technologies` (array): Technologies involved

**Example**:
```bash
timeout 10s node taskmanager-api.js store-lesson '{
  "title": "API Error Handling Best Practices",
  "content": "Always use try-catch blocks around async operations and provide meaningful error messages to users. Log errors with context for debugging.",
  "category": "best-practices",
  "tags": ["error-handling", "api", "async"],
  "difficulty": "medium",
  "related_technologies": ["javascript", "node.js"]
}'
```

**Response**:
```json
{
  "success": true,
  "lessonId": "lesson_1642345678901_abc123",
  "lesson": {
    "id": "lesson_1642345678901_abc123",
    "title": "API Error Handling Best Practices",
    "content": "Always use try-catch blocks...",
    "category": "best-practices",
    "tags": ["error-handling", "api", "async"],
    "created_at": "2024-01-16T10:30:00.000Z",
    "embedding": [0.123, 0.456, ...],
    "metadata": {...}
  },
  "message": "Lesson stored successfully with semantic embedding"
}
```

### Store Error Resolution

Store an error with its resolution details for future reference.

**Command**: `store-error`
**Usage**: `timeout 10s node taskmanager-api.js store-error '<errorData>'`

**Required Fields**:
- `error_description` (string): Description of the error
- `resolution` (string): How the error was resolved

**Optional Fields**:
- `error_type` (string): Type of error (default: "general")
- `severity` (string): Error severity ("low", "medium", "high", "critical")
- `resolution_steps` (array): Step-by-step resolution process
- `projectId` (string): Project identifier (default: "global")
- `taskId` (string): Associated task ID
- `effectiveness_rating` (number): Resolution effectiveness (0-10)
- `source` (string): Source of the error (default: "manual")
- `context` (object): Additional context information
- `files_affected` (array): Files involved in the error
- `technologies` (array): Technologies involved
- `tools_used` (array): Tools used for resolution

**Example**:
```bash
timeout 10s node taskmanager-api.js store-error '{
  "error_description": "Cannot read property of undefined when accessing user.name",
  "error_type": "runtime",
  "severity": "medium",
  "resolution": "Added null check before accessing user.name property",
  "resolution_steps": [
    "Identified the undefined user object",
    "Added conditional check: if (user && user.name)",
    "Provided fallback value for undefined cases"
  ],
  "effectiveness_rating": 9,
  "technologies": ["javascript"],
  "files_affected": ["src/components/UserProfile.js"]
}'
```

**Response**:
```json
{
  "success": true,
  "errorId": "error_1642345678901_def456",
  "error": {
    "id": "error_1642345678901_def456",
    "error_description": "Cannot read property of undefined...",
    "resolution": "Added null check...",
    "error_type": "runtime",
    "severity": "medium",
    "created_at": "2024-01-16T10:30:00.000Z",
    "embedding": [0.789, 0.012, ...],
    "metadata": {...}
  },
  "message": "Error resolution stored successfully with semantic embedding"
}
```

### Search Lessons

Search for relevant lessons using semantic similarity.

**Command**: `search-lessons`
**Usage**: `timeout 10s node taskmanager-api.js search-lessons '<query>' '[options]'`

**Parameters**:
- `query` (string): Search query for finding relevant lessons
- `options` (object, optional): Search filtering options

**Options**:
- `projectId` (string): Filter by project ID
- `category` (string): Filter by lesson category
- `limit` (number): Maximum number of results (default: 10)
- `similarity_threshold` (number): Minimum similarity score (0-1)

**Example**:
```bash
timeout 10s node taskmanager-api.js search-lessons "error handling best practices" '{
  "category": "best-practices",
  "limit": 5,
  "similarity_threshold": 0.3
}'
```

**Response**:
```json
{
  "success": true,
  "query": "error handling best practices",
  "lessons": [
    {
      "id": "lesson_1642345678901_abc123",
      "title": "API Error Handling Best Practices",
      "content": "Always use try-catch blocks...",
      "similarity": 0.89,
      "category": "best-practices",
      "access_count": 3,
      "last_accessed": "2024-01-16T10:30:00.000Z"
    }
  ],
  "count": 1,
  "options": {...}
}
```

### Find Similar Errors

Find similar resolved errors using semantic similarity.

**Command**: `find-similar-errors`
**Usage**: `timeout 10s node taskmanager-api.js find-similar-errors '<errorDescription>' '[options]'`

**Parameters**:
- `errorDescription` (string): Description of the current error
- `options` (object, optional): Search filtering options

**Options**:
- `projectId` (string): Filter by project ID
- `error_type` (string): Filter by error type
- `limit` (number): Maximum number of results (default: 5)
- `similarity_threshold` (number): Minimum similarity score (0-1)

**Example**:
```bash
timeout 10s node taskmanager-api.js find-similar-errors "Cannot read property of undefined" '{
  "error_type": "runtime",
  "limit": 3
}'
```

**Response**:
```json
{
  "success": true,
  "query": "Cannot read property of undefined",
  "similar_errors": [
    {
      "id": "error_1642345678901_def456",
      "error_description": "Cannot read property of undefined when accessing user.name",
      "resolution": "Added null check before accessing user.name property",
      "similarity": 0.95,
      "error_type": "runtime",
      "severity": "medium",
      "access_count": 2,
      "effectiveness_rating": 9
    }
  ],
  "count": 1,
  "options": {...}
}
```

### Get Relevant Lessons

Get contextually relevant lessons for a specific task context.

**Command**: `get-relevant-lessons`
**Usage**: `timeout 10s node taskmanager-api.js get-relevant-lessons '<taskContext>' '[options]'`

**Parameters**:
- `taskContext` (string): Context description of the current task
- `options` (object, optional): Context filtering options

**Options**:
- `projectId` (string): Filter by project ID
- `category` (string): Filter by lesson category
- `technologies` (array): Filter by technologies involved
- `limit` (number): Maximum number of results (default: 5)
- `similarity_threshold` (number): Minimum similarity score (default: 0.3)

**Example**:
```bash
timeout 10s node taskmanager-api.js get-relevant-lessons "implementing user authentication API" '{
  "category": "implementation",
  "technologies": ["node.js", "express"],
  "limit": 3
}'
```

**Response**:
```json
{
  "success": true,
  "task_context": "implementing user authentication API",
  "relevant_lessons": [
    {
      "id": "lesson_1642345678901_ghi789",
      "title": "JWT Authentication Implementation",
      "content": "Use bcrypt for password hashing and JWT for session management...",
      "similarity": 0.78,
      "category": "implementation",
      "access_count": 5
    }
  ],
  "count": 1,
  "options": {...}
}
```

### RAG Analytics

Get usage patterns and effectiveness metrics for the knowledge base.

**Command**: `rag-analytics`
**Usage**: `timeout 10s node taskmanager-api.js rag-analytics '[options]'`

**Options**:
- `projectId` (string): Filter analytics by project
- `date_range` (object): Filter by date range
- `category` (string): Filter by lesson category

**Example**:
```bash
timeout 10s node taskmanager-api.js rag-analytics '{
  "projectId": "current"
}'
```

**Response**:
```json
{
  "success": true,
  "analytics": {
    "total_lessons": 25,
    "total_errors": 15,
    "lessons_by_category": {
      "best-practices": 10,
      "implementation": 8,
      "debugging": 7
    },
    "errors_by_type": {
      "runtime": 8,
      "build": 4,
      "linter": 3
    },
    "most_accessed_lessons": [
      {
        "id": "lesson_1642345678901_abc123",
        "title": "API Error Handling Best Practices",
        "access_count": 12,
        "category": "best-practices"
      }
    ],
    "most_accessed_errors": [
      {
        "id": "error_1642345678901_def456",
        "error_description": "Cannot read property of undefined...",
        "access_count": 8,
        "error_type": "runtime"
      }
    ],
    "usage_patterns": {
      "2024-01-15": {
        "lesson_accessed": 5,
        "error_accessed": 3,
        "lesson_created": 2
      }
    },
    "last_updated": "2024-01-16T10:30:00.000Z"
  }
}
```

## Data Storage

### Storage Structure

The RAG system stores data in the following directory structure:

```
development/rag-database/
├── lessons/           # Individual lesson files
│   ├── lesson_[timestamp]_[id].json
│   └── ...
├── errors/            # Individual error resolution files
│   ├── error_[timestamp]_[id].json
│   └── ...
└── analytics/         # Analytics and usage tracking
    └── usage_analytics.json
```

### File Format

**Lesson File Structure**:
```json
{
  "id": "lesson_1642345678901_abc123",
  "title": "Lesson Title",
  "content": "Lesson content...",
  "category": "best-practices",
  "tags": ["tag1", "tag2"],
  "projectId": "global",
  "taskId": "task_123",
  "difficulty": "medium",
  "effectiveness": "high",
  "created_at": "2024-01-16T10:30:00.000Z",
  "last_accessed": "2024-01-16T10:30:00.000Z",
  "access_count": 3,
  "embedding": [0.123, 0.456, ...],
  "metadata": {
    "source": "manual",
    "context": {},
    "files_modified": ["src/file.js"],
    "related_technologies": ["javascript"]
  }
}
```

**Error File Structure**:
```json
{
  "id": "error_1642345678901_def456",
  "error_description": "Error description...",
  "error_type": "runtime",
  "severity": "medium",
  "resolution": "Resolution steps...",
  "resolution_steps": ["step1", "step2"],
  "projectId": "global",
  "taskId": "task_456",
  "created_at": "2024-01-16T10:30:00.000Z",
  "last_accessed": "2024-01-16T10:30:00.000Z",
  "access_count": 2,
  "effectiveness_rating": 9,
  "embedding": [0.789, 0.012, ...],
  "metadata": {
    "source": "manual",
    "context": {},
    "files_affected": ["src/component.js"],
    "technologies": ["javascript"],
    "tools_used": ["eslint", "debugger"]
  }
}
```

## Integration with TaskManager

### Automatic Knowledge Capture

The RAG system can be integrated with the TaskManager workflow to automatically capture lessons and error resolutions:

1. **Task Completion**: Automatically extract lessons from task completion data
2. **Error Resolution**: Store error resolutions when error tasks are completed
3. **Context Enrichment**: Use task context to enhance storage and retrieval

### Workflow Integration

```bash
# Example workflow: Complete task and store lesson
timeout 10s node taskmanager-api.js complete task_123 '{
  "message": "Task completed successfully",
  "lessons_learned": {
    "title": "Efficient API Testing",
    "content": "Use Jest for unit testing and Postman for integration testing"
  }
}'

# Automatically store the lesson
timeout 10s node taskmanager-api.js store-lesson '{
  "title": "Efficient API Testing",
  "content": "Use Jest for unit testing and Postman for integration testing",
  "taskId": "task_123",
  "category": "testing"
}'
```

## Error Handling

All RAG endpoints include comprehensive error handling:

- **Validation Errors**: Missing required fields, invalid data types
- **Storage Errors**: File system issues, permission problems
- **Search Errors**: Invalid queries, embedding generation failures
- **Timeout Handling**: 10-second timeout for all operations

**Error Response Format**:
```json
{
  "success": false,
  "error": "Error message description",
  "guide": {
    "message": "TaskManager API Guide - rag-operations",
    "helpText": "For complete API usage guidance, run the guide command"
  }
}
```

## Performance Considerations

### Embedding Generation

- **Hash-based**: Current implementation uses hash-based embeddings for demonstration
- **Production**: Replace with actual embedding models (OpenAI, Sentence Transformers)
- **Caching**: Embeddings are generated once and stored for reuse

### Search Performance

- **In-Memory**: Current implementation loads all data for search
- **Scalability**: For large datasets, consider vector databases (Pinecone, Weaviate)
- **Indexing**: Future versions should implement proper indexing

### Storage Optimization

- **File-based**: Current implementation uses JSON files
- **Database**: Consider SQLite or PostgreSQL for better performance
- **Compression**: Implement compression for large datasets

## Security Considerations

### Data Privacy

- **Sensitive Information**: Avoid storing sensitive data in lessons or error descriptions
- **Access Control**: Implement project-based access control
- **Audit Trail**: Track who accesses what information

### Validation

- **Input Sanitization**: All inputs are validated and sanitized
- **XSS Prevention**: JSON data is properly escaped
- **File Path Security**: Storage paths are validated

## Future Enhancements

### Advanced Features

1. **Real Vector Embeddings**: Integration with OpenAI or other embedding services
2. **Advanced Search**: Support for multi-modal search (text + code)
3. **Recommendation Engine**: Proactive lesson suggestions based on current task
4. **Collaborative Filtering**: Learn from multiple users' interactions
5. **Version Control**: Track changes to lessons and error resolutions

### Integration Improvements

1. **IDE Integration**: Direct integration with popular IDEs
2. **Git Hooks**: Automatic knowledge capture from commit messages
3. **CI/CD Integration**: Capture lessons from build failures and successes
4. **Slack/Teams Bots**: Interactive knowledge retrieval in team chats

### Performance Optimizations

1. **Vector Database**: Migration to dedicated vector database
2. **Caching Layer**: Redis-based caching for frequent searches
3. **Async Processing**: Background processing for embedding generation
4. **Distributed Storage**: Support for distributed deployment

## Examples and Use Cases

### Learning from Error Resolution

```bash
# Store error resolution
timeout 10s node taskmanager-api.js store-error '{
  "error_description": "Module not found error when importing React component",
  "error_type": "build",
  "resolution": "Fixed import path by adding file extension .jsx",
  "severity": "medium",
  "technologies": ["react", "webpack"],
  "files_affected": ["src/components/Header.jsx"]
}'

# Later, find similar errors
timeout 10s node taskmanager-api.js find-similar-errors "Module not found React" '{
  "error_type": "build",
  "limit": 3
}'
```

### Capturing Implementation Lessons

```bash
# Store implementation lesson
timeout 10s node taskmanager-api.js store-lesson '{
  "title": "React State Management Best Practices",
  "content": "Use React Context for global state, useState for local component state, and useReducer for complex state logic",
  "category": "best-practices",
  "tags": ["react", "state-management", "hooks"],
  "difficulty": "intermediate",
  "related_technologies": ["react", "javascript"]
}'

# Search for relevant lessons when starting new task
timeout 10s node taskmanager-api.js search-lessons "React state management" '{
  "category": "best-practices",
  "limit": 5
}'
```

### Project-Specific Knowledge Base

```bash
# Store project-specific lesson
timeout 10s node taskmanager-api.js store-lesson '{
  "title": "Project API Authentication Flow",
  "content": "This project uses JWT tokens with refresh token rotation. Always check token expiration before API calls.",
  "category": "project-specific",
  "projectId": "my-app-v2",
  "tags": ["authentication", "jwt", "api"]
}'

# Get project-specific lessons
timeout 10s node taskmanager-api.js search-lessons "authentication" '{
  "projectId": "my-app-v2",
  "limit": 10
}'
```

This documentation provides comprehensive coverage of the RAG Operations API, including usage examples, data structures, and integration patterns. The system enables intelligent knowledge management and retrieval for development teams using the TaskManager system.