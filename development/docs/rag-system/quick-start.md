# RAG System Quick Start Guide

## 🚀 Getting Started

This guide will get you up and running with the RAG-based lessons and error database system in under 10 minutes.

## ⚡ Prerequisites

- Existing TaskManager API setup
- Node.js environment
- Database access (MySQL/PostgreSQL with vector support)
- OpenAI API key for embedding generation

## 🛠️ Setup Steps

### 1. Database Setup

```bash
# Create RAG database schema
mysql -u root -p < development/docs/rag-system/sql/schema.sql

# Insert initial data
mysql -u root -p rag_database < development/docs/rag-system/sql/initial_data.sql
```

### 2. Environment Configuration

```bash
# Add to your .env file
echo "RAG_ENABLED=true" >> .env
echo "RAG_DATABASE_URL=mysql://user:password@localhost/rag_database" >> .env
echo "OPENAI_API_KEY=your_openai_api_key_here" >> .env
echo "RAG_EMBEDDING_MODEL=text-embedding-3-small" >> .env
```

### 3. Verify Installation

```bash
# Check RAG system health
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-health

# Expected output:
# {
#   "success": true,
#   "status": "healthy",
#   "components": {
#     "database": "connected",
#     "embedding_service": "operational"
#   }
# }
```

## 🎯 Basic Usage

### Store Your First Lesson

```bash
# Store a lesson via CLI
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-store-lesson '{
  "title": "Fix ESLint unused variable errors",
  "content": "When ESLint reports unused variables, either use the variable or remove the declaration. For function parameters that must exist but are unused, prefix with underscore (_param).",
  "category": "errors",
  "tags": ["eslint", "linting", "javascript"],
  "context": {
    "errorType": "no-unused-vars",
    "solution": "remove_or_underscore_prefix"
  }
}'
```

### Search for Lessons

```bash
# Search for relevant lessons
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "eslint unused variable problems"

# Expected output:
# {
#   "success": true,
#   "results": [
#     {
#       "lessonId": "lesson_1758332956001_eslint_fix",
#       "title": "Fix ESLint unused variable errors",
#       "similarity": 0.94,
#       "content": "When ESLint reports unused variables..."
#     }
#   ]
# }
```

### Store an Error with Solution

```bash
# Store error information
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-store-error '{
  "title": "Build failed: Module not found",
  "description": "Cannot resolve module '@/components/Button' from src/pages/Home.js",
  "errorType": "build_error",
  "context": {
    "file": "src/pages/Home.js",
    "missingModule": "@/components/Button"
  },
  "solution": {
    "description": "Check import path and verify component exists",
    "action": "fix_import_path"
  }
}'
```

## 🔄 Agent Workflow Integration

### Updated Pre-Task Protocol

Replace your existing lesson scanning with RAG queries:

```bash
# Old way (file-based)
find development/lessons/ -name "*.md" | head -10

# New way (RAG-based)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-get-relevant "$(echo $TASK_DESCRIPTION)"
```

### During Task Execution

Automatically store insights as you work:

```bash
# When you solve a problem, store it immediately
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-store-lesson '{
  "title": "Solution for '"'"'$PROBLEM_DESCRIPTION'"'"'",
  "content": "'"'"'$SOLUTION_DETAILS'"'"'",
  "category": "'"'"'$TASK_CATEGORY'"'"'",
  "context": {"taskId": "'"'"'$CURRENT_TASK_ID'"'"'"}
}'
```

## 📊 Common Use Cases

### 1. Error Resolution Workflow

```bash
# 1. Encounter an error
ERROR_MSG="TypeError: Cannot read property 'map' of undefined"

# 2. Search for similar errors
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-similar-errors "$ERROR_MSG"

# 3. If no solutions found, solve and store
# After solving...
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-store-error '{
  "title": "TypeError: Cannot read property map of undefined",
  "description": "Attempting to call .map() on undefined array",
  "errorType": "runtime_error",
  "solution": {
    "description": "Add null check before calling .map()",
    "code": "array?.map(() => {}) || []"
  }
}'
```

### 2. Feature Implementation Learning

```bash
# Before implementing a feature, search for similar patterns
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "authentication implementation patterns"

# After successful implementation, store the approach
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-store-lesson '{
  "title": "JWT Authentication Implementation",
  "content": "Implemented JWT auth using middleware pattern...",
  "category": "features",
  "tags": ["authentication", "jwt", "middleware"],
  "metadata": {
    "timeToImplement": "2h",
    "difficulty": "medium"
  }
}'
```

### 3. Performance Optimization Tracking

```bash
# Store optimization discoveries
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-store-lesson '{
  "title": "Bundle size optimization with dynamic imports",
  "content": "Reduced bundle size by 40% using React.lazy and dynamic imports for route components",
  "category": "optimization",
  "tags": ["performance", "bundling", "react"],
  "metadata": {
    "impact": "40% bundle size reduction",
    "technique": "code_splitting"
  }
}'
```

## 🎛️ Configuration Options

### Adjust Search Sensitivity

```bash
# High precision (fewer, more relevant results)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "query" --threshold 0.9

# High recall (more results, some less relevant)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "query" --threshold 0.6

# Balanced (default)
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "query" --threshold 0.75
```

### Filter by Categories

```bash
# Search only error-related lessons
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "authentication" --category errors

# Search only patterns and best practices
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "optimization" --category patterns
```

## 🔍 Troubleshooting

### Common Issues

#### 1. No Results Found

```bash
# Check if RAG system is properly initialized
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-health

# Check lesson count
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-analytics

# Try broader search
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "broader query" --threshold 0.5
```

#### 2. Slow Response Times

```bash
# Check system performance
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-analytics --metrics performance

# Clear embedding cache if needed
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-clear-cache
```

#### 3. Connection Issues

```bash
# Verify database connectivity
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-health --verbose

# Check environment variables
env | grep RAG_
```

## 📈 Migration from File-Based Lessons

### Automatic Migration

```bash
# Migrate existing lessons to RAG database
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-migrate development/lessons/

# Check migration status
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-migration-status
```

### Manual Migration for Special Cases

```bash
# Convert specific lesson file
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-convert-file "development/lessons/errors/auth_fix.md"

# Verify migration
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-search "authentication fix"
```

## 🎯 Next Steps

### 1. Explore Advanced Features

```bash
# Get analytics dashboard
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-analytics --dashboard

# View error patterns
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-error-patterns

# Cross-project insights
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js rag-cross-project-insights
```

### 2. Integrate with Existing Workflows

- Update your CLAUDE.md protocols to include RAG queries
- Modify agent initialization scripts to include RAG health checks
- Add RAG storage to your task completion procedures

### 3. Optimize Performance

- Review lesson effectiveness scores regularly
- Clean up low-quality or outdated lessons
- Monitor query performance and adjust thresholds

## 📚 Additional Resources

- **[API Reference](./api-reference.md)** - Complete endpoint documentation
- **[Agent Integration Guide](./agent-integration.md)** - Advanced integration patterns
- **[Database Architecture](./database-architecture.md)** - Technical implementation details
- **[Troubleshooting Guide](./troubleshooting.md)** - Detailed problem resolution

## ✅ Quick Verification Checklist

- [ ] Database schema created successfully
- [ ] Environment variables configured
- [ ] RAG health check passes
- [ ] Can store and retrieve lessons
- [ ] Search functionality working
- [ ] Migration completed (if applicable)
- [ ] Agent workflows updated

---

*You're now ready to leverage the power of RAG-based learning in your development workflow! The system will continuously improve as you store more lessons and errors.*