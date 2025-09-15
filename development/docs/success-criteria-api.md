# Success Criteria API Reference

**Version**: 1.0.0  
**Date**: 2025-09-15  
**Author**: Documentation Agent #5  

## Overview

The Success Criteria API provides comprehensive endpoints for managing quality gates, validation workflows, and compliance tracking within the TaskManager system. This API enables automated and manual validation of task completion criteria, ensuring consistent quality across all project deliverables.

## Base Configuration

### API Base URL
```
/api/success-criteria
```

### Authentication
All endpoints use the existing TaskManager authentication system with agent-based authorization.

### Timeout Settings
All API calls enforce a 10-second timeout as per project standards.

### Response Format
```json
{
  "success": true|false,
  "data": {...},
  "error": "Error message if applicable",
  "timestamp": "ISO 8601 timestamp",
  "requestId": "unique-request-identifier"
}
```

## Core Endpoints

### 1. Get Success Criteria

**Endpoint**: `GET /api/success-criteria/:taskId`

**Description**: Retrieves all success criteria assigned to a specific task, including standard template criteria, custom criteria, and inherited project-wide criteria.

**Parameters**:
- `taskId` (path): Unique task identifier (e.g., `feature_1757908790990_7cq3kgg1pv2`)

**Query Parameters**:
- `include` (optional): Comma-separated list of sections to include
  - Values: `template`, `custom`, `inherited`, `validation_status`
  - Default: All sections included
- `format` (optional): Response format
  - Values: `full`, `summary`, `checklist`
  - Default: `full`

**Request Example**:
```bash
GET /api/success-criteria/feature_1757908790990_7cq3kgg1pv2?include=template,custom&format=summary
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "task_id": "feature_1757908790990_7cq3kgg1pv2",
    "criteria_summary": {
      "total_criteria": 28,
      "template_criteria": 25,
      "custom_criteria": 2,
      "inherited_criteria": 1
    },
    "template": {
      "id": "25_point_standard",
      "version": "1.0.0",
      "criteria": [
        {
          "id": 1,
          "category": "core_quality",
          "title": "Linter Perfection",
          "description": "All linting rules pass with zero violations",
          "requirements": [
            "No warnings or errors from static code analysis",
            "Code style consistency maintained"
          ],
          "evidence_required": "Clean linter output screenshot",
          "validation_method": "automated",
          "priority": "critical"
        }
      ]
    },
    "custom_criteria": [
      {
        "id": "custom_1",
        "category": "functional",
        "title": "User Authentication Integration",
        "description": "Successfully integrate with existing authentication system",
        "requirements": [
          "Login workflow functional",
          "Session management working",
          "Logout process complete"
        ],
        "evidence_required": "Integration test results",
        "validation_method": "manual",
        "priority": "critical"
      }
    ],
    "inherited_criteria": [
      {
        "id": "project_security_baseline",
        "source": "project_wide_criteria",
        "category": "security",
        "title": "Security Baseline Compliance",
        "description": "Meet minimum security requirements for all features"
      }
    ],
    "validation_status": {
      "overall_status": "pending",
      "last_validated": null,
      "completed_criteria": 0,
      "pending_criteria": 28,
      "failed_criteria": 0
    }
  },
  "timestamp": "2025-09-15T04:00:47.534Z",
  "requestId": "req_1757908790990_docs_001"
}
```

**Error Responses**:
```json
// Task not found
{
  "success": false,
  "error": "Task not found: feature_invalid_id",
  "errorCode": "TASK_NOT_FOUND",
  "timestamp": "2025-09-15T04:00:47.534Z"
}

// Invalid query parameters
{
  "success": false,
  "error": "Invalid include parameter: invalid_section",
  "errorCode": "INVALID_QUERY_PARAM",
  "timestamp": "2025-09-15T04:00:47.534Z"
}
```

### 2. Set Task-Specific Success Criteria

**Endpoint**: `POST /api/success-criteria/task/:taskId`

**Description**: Assigns or updates custom success criteria for a specific task. This endpoint allows adding task-specific requirements beyond the standard template criteria.

**Parameters**:
- `taskId` (path): Unique task identifier

**Request Body**:
```json
{
  "custom_criteria": [
    {
      "category": "functional|performance|security|usability|compatibility|compliance",
      "title": "Criterion title",
      "description": "Detailed description of the requirement",
      "requirements": ["List", "of", "specific", "requirements"],
      "evidence_required": "Type of evidence needed for validation",
      "validation_method": "automated|manual|hybrid",
      "priority": "critical|important|nice_to_have",
      "acceptance_threshold": "Specific threshold for pass/fail"
    }
  ],
  "inherited_criteria": [
    "project_security_baseline",
    "project_performance_baseline"
  ],
  "template_overrides": {
    "disable_criteria": [1, 5, 10],
    "modify_criteria": {
      "3": {
        "priority": "important",
        "acceptance_threshold": "Custom threshold"
      }
    }
  },
  "validation_schedule": {
    "auto_validate": true,
    "validation_triggers": ["task_completion", "code_commit", "manual_request"],
    "validation_timeout": 1800
  }
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "task_id": "feature_1757908790990_7cq3kgg1pv2",
    "criteria_updated": {
      "timestamp": "2025-09-15T04:00:47.534Z",
      "total_criteria": 30,
      "changes": {
        "added_custom": 3,
        "added_inherited": 2,
        "disabled_template": 3,
        "modified_template": 1
      }
    },
    "validation_status": {
      "status": "criteria_updated",
      "next_validation": "automatic_on_completion",
      "estimated_validation_time": "15-30 minutes"
    }
  },
  "timestamp": "2025-09-15T04:00:47.534Z",
  "requestId": "req_1757908790990_docs_002"
}
```

### 3. Set Project-Wide Success Criteria

**Endpoint**: `POST /api/success-criteria/project-wide`

**Description**: Defines success criteria that automatically apply to all tasks of specified types within the project. These criteria are inherited by individual tasks and enforced across the project.

**Request Body**:
```json
{
  "criteria_set_id": "project_security_v2",
  "description": "Enhanced security requirements for all project features",
  "applies_to": {
    "task_categories": ["feature", "subtask"],
    "task_patterns": ["auth_*", "*_security_*"],
    "exclude_categories": ["test", "documentation"]
  },
  "criteria": [
    {
      "category": "security",
      "title": "Input Validation",
      "description": "All user inputs must be properly validated and sanitized",
      "requirements": [
        "Server-side validation implemented",
        "Client-side validation as additional layer",
        "SQL injection prevention",
        "XSS protection enabled"
      ],
      "evidence_required": "Security test results and code review",
      "validation_method": "automated",
      "priority": "critical"
    }
  ],
  "inheritance_rules": {
    "mandatory": true,
    "allow_override": false,
    "merge_strategy": "append",
    "conflict_resolution": "project_wide_takes_precedence"
  },
  "effective_date": "2025-09-15T04:00:00.000Z",
  "review_schedule": {
    "review_frequency": "quarterly",
    "next_review": "2025-12-15T00:00:00.000Z",
    "review_owners": ["security_team", "architecture_team"]
  }
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "criteria_set_id": "project_security_v2",
    "status": "active",
    "affected_tasks": {
      "existing_tasks": 45,
      "future_tasks": "all_matching",
      "inheritance_applied": true
    },
    "validation_summary": {
      "criteria_conflicts": 0,
      "override_warnings": 2,
      "compatibility_check": "passed"
    },
    "rollback_token": "rollback_1757908790990_security_v2"
  },
  "timestamp": "2025-09-15T04:00:47.534Z",
  "requestId": "req_1757908790990_docs_003"
}
```

### 4. Validate Task Against Success Criteria

**Endpoint**: `POST /api/success-criteria/validate/:taskId`

**Description**: Executes validation workflow for a specific task against all assigned success criteria. Supports both automated and manual validation processes.

**Parameters**:
- `taskId` (path): Unique task identifier

**Request Body**:
```json
{
  "validation_type": "full|partial|automated_only|manual_only",
  "validation_scope": {
    "include_categories": ["core_quality", "security", "performance"],
    "exclude_criteria": [15, 22],
    "force_revalidation": false
  },
  "evidence": {
    "automated_evidence": {
      "linter_results": {
        "tool": "eslint",
        "version": "8.45.0",
        "exit_code": 0,
        "output": "No problems found",
        "timestamp": "2025-09-15T03:58:30.000Z"
      },
      "build_results": {
        "tool": "npm",
        "command": "run build",
        "exit_code": 0,
        "duration": 45.2,
        "timestamp": "2025-09-15T03:59:15.000Z"
      },
      "test_results": {
        "tool": "jest",
        "total_tests": 127,
        "passed": 127,
        "failed": 0,
        "coverage": 94.2,
        "timestamp": "2025-09-15T04:00:00.000Z"
      }
    },
    "manual_evidence": {
      "documentation_review": {
        "reviewer": "dev_session_1757908772749_1_general_b421ae4f",
        "completeness_score": 95,
        "quality_rating": "excellent",
        "notes": "All functions properly documented with examples",
        "timestamp": "2025-09-15T04:00:30.000Z"
      },
      "security_review": {
        "reviewer": "security_agent_001",
        "scan_results": "clean",
        "manual_review": "passed",
        "findings": [],
        "timestamp": "2025-09-15T04:00:45.000Z"
      }
    }
  },
  "validation_options": {
    "async_validation": true,
    "notification_webhook": "https://api.project.com/webhooks/validation",
    "timeout": 1800,
    "retry_policy": {
      "max_retries": 3,
      "retry_delay": 60
    }
  }
}
```

**Response Example (Synchronous)**:
```json
{
  "success": true,
  "data": {
    "task_id": "feature_1757908790990_7cq3kgg1pv2",
    "validation_id": "validation_1757908790990_001",
    "overall_status": "passed",
    "validation_summary": {
      "total_criteria": 28,
      "passed": 27,
      "failed": 0,
      "pending": 1,
      "skipped": 0,
      "success_rate": 96.4
    },
    "category_breakdown": {
      "core_quality": {"passed": 10, "failed": 0, "pending": 0},
      "security": {"passed": 9, "failed": 0, "pending": 1},
      "compliance": {"passed": 8, "failed": 0, "pending": 0}
    },
    "detailed_results": [
      {
        "criterion_id": 1,
        "title": "Linter Perfection",
        "status": "passed",
        "evidence": {
          "type": "automated",
          "tool": "eslint",
          "result": "0 errors, 0 warnings",
          "timestamp": "2025-09-15T03:58:30.000Z"
        },
        "validation_notes": "All linting rules satisfied"
      },
      {
        "criterion_id": 15,
        "title": "Security Audit",
        "status": "pending",
        "evidence": null,
        "validation_notes": "Awaiting security team review",
        "estimated_completion": "2025-09-15T06:00:00.000Z"
      }
    ],
    "next_steps": [
      {
        "action": "await_manual_review",
        "criterion": "Security Audit",
        "assigned_to": "security_team",
        "deadline": "2025-09-15T06:00:00.000Z"
      }
    ]
  },
  "timestamp": "2025-09-15T04:00:47.534Z",
  "requestId": "req_1757908790990_docs_004"
}
```

**Response Example (Asynchronous)**:
```json
{
  "success": true,
  "data": {
    "task_id": "feature_1757908790990_7cq3kgg1pv2",
    "validation_id": "validation_1757908790990_001",
    "status": "validation_started",
    "estimated_completion": "2025-09-15T04:15:47.534Z",
    "tracking": {
      "status_endpoint": "/api/success-criteria/validation-status/validation_1757908790990_001",
      "webhook_configured": true,
      "progress_updates": "realtime"
    }
  },
  "timestamp": "2025-09-15T04:00:47.534Z",
  "requestId": "req_1757908790990_docs_004"
}
```

### 5. Get Validation Report

**Endpoint**: `GET /api/success-criteria/report/:taskId`

**Description**: Retrieves comprehensive validation report for a task, including historical validation data, trend analysis, and compliance tracking.

**Parameters**:
- `taskId` (path): Unique task identifier

**Query Parameters**:
- `format` (optional): Report format
  - Values: `detailed`, `summary`, `executive`, `compliance`
  - Default: `detailed`
- `include_history` (optional): Include historical validation data
  - Values: `true`, `false`
  - Default: `false`
- `time_range` (optional): Time range for historical data
  - Values: `7d`, `30d`, `90d`, `all`
  - Default: `30d`

**Response Example**:
```json
{
  "success": true,
  "data": {
    "task_id": "feature_1757908790990_7cq3kgg1pv2",
    "report_generated": "2025-09-15T04:00:47.534Z",
    "report_type": "detailed",
    "current_status": {
      "overall_compliance": 96.4,
      "last_validation": "2025-09-15T04:00:47.534Z",
      "validation_trend": "improving",
      "risk_level": "low"
    },
    "criteria_compliance": {
      "core_quality": {
        "compliance_rate": 100,
        "critical_issues": 0,
        "trend": "stable"
      },
      "security": {
        "compliance_rate": 90,
        "critical_issues": 0,
        "pending_reviews": 1,
        "trend": "improving"
      },
      "performance": {
        "compliance_rate": 100,
        "benchmark_results": {
          "response_time": "285ms (target: <500ms)",
          "memory_usage": "45MB (target: <100MB)",
          "throughput": "150 req/s (target: >100 req/s)"
        },
        "trend": "stable"
      }
    },
    "validation_history": [
      {
        "validation_date": "2025-09-15T04:00:47.534Z",
        "overall_score": 96.4,
        "changes_from_previous": "+2.1%",
        "key_improvements": ["Documentation completeness", "Test coverage"]
      }
    ],
    "recommendations": [
      {
        "priority": "medium",
        "category": "security",
        "recommendation": "Complete pending security audit review",
        "impact": "Achieve 100% security compliance",
        "effort": "1-2 hours"
      }
    ],
    "compliance_summary": {
      "regulatory_requirements": "satisfied",
      "project_standards": "satisfied",
      "quality_gates": "passed",
      "ready_for_production": true
    }
  },
  "timestamp": "2025-09-15T04:00:47.534Z",
  "requestId": "req_1757908790990_docs_005"
}
```

## Management Endpoints

### 6. List Project Criteria Templates

**Endpoint**: `GET /api/success-criteria/templates`

**Description**: Retrieves all available success criteria templates for the project.

**Query Parameters**:
- `category` (optional): Filter by category
- `version` (optional): Specific template version
- `active_only` (optional): Show only active templates (default: true)

**Response Example**:
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "25_point_standard",
        "name": "25-Point Standard Template",
        "version": "1.0.0",
        "description": "Comprehensive quality gates for all feature tasks",
        "category": "standard",
        "criteria_count": 25,
        "last_updated": "2025-09-13T16:45:00Z",
        "usage_count": 127,
        "status": "active"
      },
      {
        "id": "security_focused",
        "name": "Security-Focused Template", 
        "version": "2.1.0",
        "description": "Enhanced security requirements for sensitive features",
        "category": "security",
        "criteria_count": 18,
        "last_updated": "2025-09-10T14:30:00Z",
        "usage_count": 23,
        "status": "active"
      }
    ]
  }
}
```

### 7. Validation Status Tracking

**Endpoint**: `GET /api/success-criteria/validation-status/:validationId`

**Description**: Tracks the status of asynchronous validation processes.

**Response Example**:
```json
{
  "success": true,
  "data": {
    "validation_id": "validation_1757908790990_001",
    "task_id": "feature_1757908790990_7cq3kgg1pv2",
    "status": "in_progress",
    "progress": {
      "completed_criteria": 18,
      "total_criteria": 28,
      "percentage": 64.3,
      "estimated_completion": "2025-09-15T04:10:00.000Z"
    },
    "current_step": {
      "step": "manual_security_review",
      "description": "Awaiting security team manual review",
      "assigned_to": "security_agent_001",
      "started_at": "2025-09-15T04:05:00.000Z"
    }
  }
}
```

## Error Handling

### Error Codes

| Code | Description | Typical Causes |
|------|-------------|----------------|
| `TASK_NOT_FOUND` | Task ID does not exist | Invalid task ID, deleted task |
| `INVALID_CRITERIA` | Malformed criteria data | Invalid JSON, missing required fields |
| `VALIDATION_TIMEOUT` | Validation process timed out | Large task, slow validation tools |
| `INSUFFICIENT_EVIDENCE` | Required evidence not provided | Missing automated results, incomplete manual reviews |
| `CRITERIA_CONFLICT` | Conflicting criteria definitions | Overlapping requirements, contradictory rules |
| `AUTHORIZATION_FAILED` | Agent lacks required permissions | Insufficient role, expired token |
| `TEMPLATE_NOT_FOUND` | Referenced template does not exist | Invalid template ID, deprecated template |
| `INHERITANCE_ERROR` | Project-wide criteria inheritance failed | Circular dependencies, malformed rules |

### Error Response Format

```json
{
  "success": false,
  "error": "Human-readable error message",
  "errorCode": "MACHINE_READABLE_CODE", 
  "details": {
    "field": "specific field with error",
    "provided": "value that was provided",
    "expected": "description of expected value"
  },
  "suggestions": [
    "Check task ID format",
    "Verify criteria schema",
    "Contact system administrator"
  ],
  "timestamp": "2025-09-15T04:00:47.534Z",
  "requestId": "req_1757908790990_docs_error"
}
```

## Performance Considerations

### Response Time Targets
- **GET requests**: < 500ms for 95th percentile
- **POST requests**: < 2s for validation operations
- **Async validation**: < 30s for complete workflow

### Rate Limiting
- **Standard requests**: 100 requests per minute per agent
- **Validation requests**: 10 concurrent validations per agent
- **Project-wide updates**: 5 requests per minute per project

### Caching Strategy
- **Template data**: Cached for 1 hour
- **Validation results**: Cached for 24 hours
- **Project criteria**: Cached for 4 hours

## Integration Examples

### Basic Task Validation
```javascript
// Example: Validate a completed feature task
const response = await fetch('/api/success-criteria/validate/feature_123_abc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    validation_type: 'full',
    evidence: {
      automated_evidence: {
        linter_results: { /* linter output */ },
        build_results: { /* build output */ },
        test_results: { /* test output */ }
      }
    }
  })
});

const validation = await response.json();
if (validation.success && validation.data.overall_status === 'passed') {
  console.log('Task meets all success criteria');
}
```

### Custom Criteria Assignment
```javascript
// Example: Add custom performance requirements
const criteriaResponse = await fetch('/api/success-criteria/task/feature_123_abc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    custom_criteria: [
      {
        category: 'performance',
        title: 'API Response Time',
        description: 'All API endpoints must respond within 200ms',
        requirements: [
          'Average response time < 200ms',
          '95th percentile < 400ms',
          'No timeouts during load testing'
        ],
        evidence_required: 'Performance test results',
        validation_method: 'automated',
        priority: 'critical'
      }
    ]
  })
});
```

### Project-Wide Security Policy
```javascript
// Example: Implement organization-wide security requirements
const policyResponse = await fetch('/api/success-criteria/project-wide', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    criteria_set_id: 'security_policy_v3',
    description: 'Updated security policy for Q4 2025',
    applies_to: {
      task_categories: ['feature', 'subtask'],
      exclude_categories: ['documentation', 'test']
    },
    criteria: [
      {
        category: 'security',
        title: 'Dependency Vulnerability Scan',
        description: 'All dependencies must be scanned for known vulnerabilities',
        requirements: [
          'No critical vulnerabilities',
          'High vulnerabilities must be justified',
          'All dependencies up to date within 6 months'
        ],
        evidence_required: 'Vulnerability scan report',
        validation_method: 'automated',
        priority: 'critical'
      }
    ],
    inheritance_rules: {
      mandatory: true,
      allow_override: false
    }
  })
});
```

## Troubleshooting

### Common Issues

1. **Validation Timeouts**
   - **Symptom**: Validation requests timing out after 10 seconds
   - **Solution**: Use async validation for complex criteria
   - **Prevention**: Monitor validation performance, optimize criteria

2. **Evidence Upload Failures**
   - **Symptom**: Large evidence files failing to upload
   - **Solution**: Use file upload endpoint, reference files by URL
   - **Prevention**: Implement evidence size limits, compression

3. **Criteria Inheritance Conflicts**
   - **Symptom**: Project-wide criteria conflicting with task-specific criteria
   - **Solution**: Review inheritance rules, use conflict resolution strategies
   - **Prevention**: Design criteria hierarchies carefully, test inheritance

### Debugging Tools

```bash
# Check validation status
curl -X GET "/api/success-criteria/validation-status/validation_123"

# Test criteria inheritance
curl -X GET "/api/success-criteria/feature_123_abc?include=inherited&format=summary"

# Validate specific criteria category
curl -X POST "/api/success-criteria/validate/feature_123_abc" \
  -d '{"validation_scope": {"include_categories": ["security"]}}'
```

---

*API Reference v1.0.0*  
*Generated by: Documentation Agent #5*  
*Last Updated: 2025-09-15*