# TaskManager API & Hooks System - Essential Guide

## Quick Start

### Environment Detection
```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" methods
# Success = TaskManager available | Timeout = Not available
```

---

## 📋 TaskManager API Reference

### Core Feature Management

#### List Features
```bash
timeout 10s node taskmanager-api.js list-features
timeout 10s node taskmanager-api.js list-features '{"category":"enhancement"}'
```

#### Suggest Feature
```bash
timeout 10s node taskmanager-api.js suggest-feature '{
  "title": "Feature title",
  "description": "Detailed description",
  "business_value": "Why this matters",
  "category": "enhancement|bug-fix|performance|security"
}'
```

#### Approve/Reject Features
```bash
timeout 10s node taskmanager-api.js approve-feature '<feature_id>'
timeout 10s node taskmanager-api.js reject-feature '<feature_id>' '{"reason":"Why rejected"}'
```

#### Feature Statistics
```bash
timeout 10s node taskmanager-api.js feature-stats
```

### RAG Learning System

#### Store Lessons
```bash
timeout 10s node taskmanager-api.js store-lesson '{
  "title": "Lesson title",
  "category": "architecture|testing|debugging|optimization",
  "content": "Detailed explanation",
  "context": "When this applies",
  "confidence_score": 0.8
}'
```

#### Search Lessons
```bash
timeout 10s node taskmanager-api.js search-lessons "keyword query"
timeout 10s node taskmanager-api.js search-lessons '{"query":"keywords","category":"testing"}'
```

#### Store Errors
```bash
timeout 10s node taskmanager-api.js store-error '{
  "title": "Error description",
  "error_type": "linter|build|runtime|integration",
  "message": "Full error message",
  "resolution_method": "How it was fixed",
  "prevention_strategy": "How to prevent"
}'
```

#### Find Similar Errors
```bash
timeout 10s node taskmanager-api.js find-similar-errors "error message"
```

#### Get Relevant Lessons
```bash
timeout 10s node taskmanager-api.js get-relevant-lessons '<task_context>'
```

### RAG Analytics & Management

```bash
# Analytics
timeout 10s node taskmanager-api.js rag-analytics

# Lesson versioning
timeout 10s node taskmanager-api.js lesson-version-history '<lesson_id>'
timeout 10s node taskmanager-api.js compare-lesson-versions '<lesson_id>' '<version1>' '<version2>'

# Quality scoring
timeout 10s node taskmanager-api.js get-lesson-quality-score '<lesson_id>'
timeout 10s node taskmanager-api.js get-quality-analytics

# Pattern detection
timeout 10s node taskmanager-api.js detect-patterns
timeout 10s node taskmanager-api.js get-pattern-analytics
```

### Stop Authorization System

#### Verify Readiness
```bash
timeout 10s node taskmanager-api.js verify-stop-readiness '<agent_id>'
```

#### Start Authorization
```bash
timeout 10s node taskmanager-api.js start-authorization '<agent_id>'
```

#### Validate Criteria (run sequentially)
```bash
AUTH_KEY="<from_start_authorization>"

timeout 10s node taskmanager-api.js validate-criterion $AUTH_KEY focused-codebase
timeout 10s node taskmanager-api.js validate-criterion $AUTH_KEY security-validation
timeout 10s node taskmanager-api.js validate-criterion $AUTH_KEY linter-validation
timeout 10s node taskmanager-api.js validate-criterion $AUTH_KEY type-validation
timeout 10s node taskmanager-api.js validate-criterion $AUTH_KEY build-validation
timeout 10s node taskmanager-api.js validate-criterion $AUTH_KEY start-validation
timeout 10s node taskmanager-api.js validate-criterion $AUTH_KEY test-validation
```

#### Complete Authorization
```bash
timeout 10s node taskmanager-api.js complete-authorization $AUTH_KEY
```

#### Emergency Stop (only when stop hook triggers 2+ times)
```bash
timeout 10s node taskmanager-api.js emergency-stop '<agent_id>' "reason"
```

### Audit Trail

```bash
# Start audit session
timeout 10s node taskmanager-api.js start-audit-session '<agent_id>'

# Track validation steps
timeout 10s node taskmanager-api.js track-validation-step '<session_id>' '{
  "step_name": "linting",
  "status": "passed",
  "details": {...}
}'

# Complete audit
timeout 10s node taskmanager-api.js complete-audit-session '<session_id>'

# Search audit trail
timeout 10s node taskmanager-api.js search-audit-trail '{
  "agent_id": "agent-123",
  "date_range": {"start": "2024-01-01", "end": "2024-12-31"}
}'

# Generate compliance report
timeout 10s node taskmanager-api.js generate-compliance-report '<agent_id>'
```

---

## 🎣 Hooks System

### Available Hooks

**UserPromptSubmit** - Runs when user submits a prompt
- Task creation enforcement
- Security check for .gitignore

**SessionStart** - Runs at session start
- Environment setup
- Health checks

**PreToolUse** - Runs before tool execution
- Prevents violations
- Validates scope

**PostToolUse** - Runs after tool execution
- Multi-method validation (10+ checks)
- Evidence collection

**Stop** - Runs when attempting to stop
- Autonomous continuation protocol
- Quality gate validation

**SessionEnd** - Runs at session end
- Lesson storage
- Session summary

**PreCompact** - Runs before context compaction
- Context preservation

**SubagentStop** - Runs when subagent stops
- Subagent validation

### Hook Configuration

Hooks are configured in `stop-hook.js` and automatically enforce:
- Task management protocols
- Security requirements
- Quality gates
- Evidence collection

**Setup:**
```bash
node setup-infinite-hook.js
```

**Manual trigger:**
```bash
node stop-hook.js
```

---

## 🎯 Common Workflows

### Starting a Task
```bash
# Check for approved features
timeout 10s node taskmanager-api.js list-features '{"status":"approved"}'

# Search for relevant lessons
timeout 10s node taskmanager-api.js search-lessons "feature context"

# Do the work...

# Store new lessons learned
timeout 10s node taskmanager-api.js store-lesson '{...}'
```

### Debugging
```bash
# Find similar errors
timeout 10s node taskmanager-api.js find-similar-errors "error message"

# Get relevant lessons
timeout 10s node taskmanager-api.js get-relevant-lessons "debugging context"

# Store error resolution
timeout 10s node taskmanager-api.js store-error '{...}'
```

### Stop Authorization
```bash
# Verify project is ready
timeout 10s node taskmanager-api.js verify-stop-readiness '<agent_id>'

# If ready, start authorization
timeout 10s node taskmanager-api.js start-authorization '<agent_id>'

# Validate all criteria (use returned AUTH_KEY)
# ... run all validate-criterion commands ...

# Complete authorization
timeout 10s node taskmanager-api.js complete-authorization $AUTH_KEY
```

---

## 📚 API Help

```bash
# Full API documentation
timeout 10s node taskmanager-api.js guide

# List all methods
timeout 10s node taskmanager-api.js methods
```

---

**Version:** 3.0 (Essential Core)
**Focus:** TaskManager API + Hooks System
**Last Updated:** 2024
