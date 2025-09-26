# TASKS.json Schema Design Document

## Migration Overview: FEATURES.json → TASKS.json

### Core Changes
1. **File Rename**: `FEATURES.json` → `TASKS.json`
2. **Enhanced Task Types**: Support for `error`, `feature`, `test`, `audit` task types
3. **Auto-Generation**: Automatic test and audit task creation for features
4. **Parent-Child Relationships**: Task dependency and linking system
5. **CLAUDE.md Compliance**: Mandatory test gates and security validation

## Enhanced TASKS.json Schema

```json
{
  "project": "project-name",
  "schema_version": "2.0.0",
  "migrated_from": "FEATURES.json",
  "migration_date": "2025-09-26T21:06:30.825Z",

  "tasks": [
    {
      "id": "task_[timestamp]_[hash]",
      "type": "error|feature|test|audit",
      "parent_id": null,
      "linked_tasks": ["task_id1", "task_id2"],
      "title": "Descriptive task title",
      "description": "Detailed implementation description",
      "business_value": "Clear business justification",
      "category": "enhancement|bug-fix|new-feature|performance|security|documentation",
      "status": "suggested|approved|in-progress|completed|blocked|rejected",
      "priority": "critical|high|normal|low",
      "auto_generated": false,
      "auto_generation_rules": {
        "generate_test_task": true,
        "generate_audit_task": true,
        "test_coverage_requirement": 80
      },
      "dependencies": ["task_id1", "task_id2"],
      "estimated_effort": 1-10,
      "required_capabilities": ["testing", "security", "frontend", "backend", "analysis"],
      "created_at": "ISO_timestamp",
      "updated_at": "ISO_timestamp",
      "created_by": "user|system|agent_id",
      "assigned_to": null,
      "assigned_at": null,
      "completed_at": null,
      "validation_requirements": {
        "security_scan": false,
        "test_coverage": false,
        "linter_pass": false,
        "type_check": false,
        "build_success": false
      },
      "metadata": {}
    }
  ],

  "completed_tasks": [
    {
      "task_id": "task_id",
      "completed_at": "timestamp",
      "assigned_to": "agent_id",
      "parent_id": "parent_task_id",
      "type": "task_type",
      "result": {}
    }
  ],

  "task_relationships": {
    "feature_task_id": {
      "auto_generated_test": "test_task_id",
      "auto_generated_audit": "audit_task_id",
      "dependencies": ["task_id1"],
      "dependents": ["task_id2"]
    }
  },

  "workflow_config": {
    "require_approval": true,
    "auto_reject_timeout_hours": 168,
    "allowed_statuses": ["suggested", "approved", "in-progress", "completed", "blocked", "rejected"],
    "allowed_task_types": ["error", "feature", "test", "audit"],
    "required_fields": ["title", "description", "business_value", "category", "type"],
    "auto_generation_enabled": true,
    "mandatory_test_gate": true,
    "security_validation_required": true
  },

  "auto_generation_config": {
    "test_task_template": {
      "title_pattern": "Implement comprehensive tests for {feature_title}",
      "description_pattern": "Create unit tests, integration tests, and E2E tests to achieve >{coverage}% coverage for {feature_title}. Must validate all functionality, edge cases, and error conditions.",
      "priority": "high",
      "required_capabilities": ["testing"],
      "validation_requirements": {
        "test_coverage": true,
        "linter_pass": true
      }
    },
    "audit_task_template": {
      "title_pattern": "Security and quality audit for {feature_title}",
      "description_pattern": "Run semgrep security scan, dependency vulnerability check, code quality analysis, and compliance validation for {feature_title}. Zero tolerance for security vulnerabilities.",
      "priority": "high",
      "required_capabilities": ["security", "analysis"],
      "validation_requirements": {
        "security_scan": true,
        "linter_pass": true,
        "type_check": true
      }
    }
  },

  "priority_system": {
    "order": ["USER_REQUESTS", "ERROR", "AUDIT", "FEATURE", "TEST"],
    "error_priorities": {
      "critical": ["build-breaking", "security-vulnerability", "production-down"],
      "high": ["linter-errors", "type-errors", "test-failures"],
      "normal": ["warnings", "optimization-opportunities"],
      "low": ["documentation-improvements", "code-style"]
    }
  },

  "metadata": {
    "version": "2.0.0",
    "created": "timestamp",
    "updated": "timestamp",
    "total_tasks": 0,
    "tasks_by_type": {
      "error": 0,
      "feature": 0,
      "test": 0,
      "audit": 0
    },
    "approval_history": [],
    "migration_stats": {
      "features_migrated": 0,
      "tasks_created": 0,
      "auto_generated_tasks": 0
    }
  },

  "agents": {
    "agent_id": {
      "lastHeartbeat": "timestamp",
      "status": "active|inactive",
      "assignedTasks": ["task_id1"],
      "capabilities": ["testing", "security"],
      "sessionId": "session_id"
    }
  }
}
```

## Task Type Definitions

### ERROR Tasks
- **Purpose**: Bug fixes, linter errors, build failures, runtime errors
- **Priority**: Auto-assigned based on severity (critical for build-breaking)
- **Auto-Generation**: None (errors are identified, not generated)
- **Validation**: Must pass linter, type check, and build
- **Examples**: "Fix ESLint violations in auth.js", "Resolve TypeScript errors in UserService"

### FEATURE Tasks
- **Purpose**: New functionality implementation
- **Priority**: Normal (unless user-specified)
- **Auto-Generation**: Always generates linked TEST and AUDIT tasks
- **Validation**: Must pass all validation requirements + linked tasks must complete
- **Examples**: "Add dark mode toggle", "Implement user authentication"

### TEST Tasks
- **Purpose**: Unit, integration, E2E test implementation
- **Priority**: High (linked to features), Normal (standalone improvements)
- **Auto-Generation**: Generated for every approved FEATURE task
- **Validation**: Must achieve >80% coverage, pass linter
- **Examples**: "Unit tests for UserService.authenticate()", "E2E tests for checkout flow"

### AUDIT Tasks
- **Purpose**: Security scans, code quality, compliance validation
- **Priority**: High (linked to features), Critical (security-sensitive)
- **Auto-Generation**: Generated for every approved FEATURE task
- **Validation**: Security scan must pass, zero vulnerabilities tolerated
- **Examples**: "Security audit for payment processing", "Code quality analysis for API endpoints"

## Auto-Generation Rules

### When FEATURE Task Approved:
1. **Generate TEST Task**:
   ```json
   {
     "type": "test",
     "parent_id": "feature_task_id",
     "title": "Implement comprehensive tests for [feature_title]",
     "auto_generated": true,
     "priority": "high"
   }
   ```

2. **Generate AUDIT Task**:
   ```json
   {
     "type": "audit",
     "parent_id": "feature_task_id",
     "title": "Security and quality audit for [feature_title]",
     "auto_generated": true,
     "priority": "high"
   }
   ```

### Dependency Rules:
- FEATURE cannot be marked complete until linked TEST and AUDIT tasks are completed
- TEST tasks must achieve defined coverage requirements (>80%)
- AUDIT tasks must pass security scans with zero vulnerabilities

## Priority System (CLAUDE.md Compliant)

```
1. USER_REQUESTS (immediate override of all other work)
2. ERROR (critical → high → normal → low)
   - critical: build-breaking, security vulnerabilities, production down
   - high: linter errors, type errors, test failures
   - normal: warnings, optimization opportunities
   - low: documentation, code style
3. AUDIT (security-critical features first)
4. FEATURE (approved only, sequential processing - one at a time)
5. TEST (linked to completed features)
```

## Migration Strategy

### Phase 1: File Rename & Schema Update
1. Backup existing FEATURES.json
2. Migrate schema while preserving existing data
3. Update file path references in taskmanager-api.js

### Phase 2: Auto-Generation Implementation
1. Add auto-generation logic for feature approval
2. Create parent-child relationship management
3. Implement dependency validation

### Phase 3: Priority System Enhancement
1. Update task queuing with new priority rules
2. Add task type filtering and sorting
3. Ensure CLAUDE.md compliance (one feature at a time)

### Phase 4: Validation & Testing
1. Test migration with existing data
2. Validate auto-generation works correctly
3. Confirm CLAUDE.md mandatory test gates function

## Backward Compatibility

- Existing `features` array preserved during migration
- Current `tasks` migrated to new schema with `type: "feature"`
- API endpoints maintain existing behavior with enhanced filtering
- Agent assignments and progress tracking preserved

## CLAUDE.md Compliance Features

1. **Mandatory Test Gate**: Features cannot advance without completed test tasks
2. **Security Validation**: Auto-generated audit tasks for all features
3. **One Feature At A Time**: Priority system enforces sequential feature processing
4. **Quality Gates**: Integration with linter, type checker, build validation
5. **Zero Tolerance**: Security vulnerabilities block feature completion