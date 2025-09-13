# Success Criteria API Specification

**Document**: Success Criteria Endpoints API Specification  
**Version**: 1.0.0  
**Date**: 2025-09-13  
**Author**: Quality Management Systems Research Agent  

## Overview

This specification defines the comprehensive API endpoints for success criteria management within the TaskManager system. The API provides endpoints for task-specific criteria management, project-wide inheritance, validation workflows, and reporting dashboard integration.

## Base URL and Authentication

```
Base URL: /api/success-criteria
Authentication: Agent-based authentication via TaskManager system
Content-Type: application/json
```

## Endpoint Categories

### 1. Success Criteria Management

#### 1.1 Set Task-Specific Success Criteria

**Endpoint**: `POST /api/success-criteria/task/:taskId`

**Purpose**: Define or update success criteria for a specific task

**Parameters**:
- `taskId` (path): Unique task identifier

**Request Body**:
```json
{
  "custom_criteria": [
    {
      "category": "functional|performance|security|usability|compatibility|compliance",
      "criterion": "User can successfully login with valid credentials",
      "validation_method": "automated|manual|hybrid",
      "priority": "critical|important|optional",
      "evidence_required": true,
      "timeout_seconds": 300
    }
  ],
  "inherited_criteria": ["project_security_baseline", "performance_standards"],
  "override_standard": false,
  "validation_config": {
    "auto_validate": true,
    "require_evidence": true,
    "allow_manual_override": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "task_id": "feature_12345_abcdef",
  "criteria_applied": {
    "standard_criteria": 25,
    "custom_criteria": 2,
    "inherited_criteria": 8,
    "total_criteria": 35
  },
  "validation_workflow_id": "validation_67890_xyz",
  "estimated_validation_time": 600
}
```

#### 1.2 Get Task Success Criteria

**Endpoint**: `GET /api/success-criteria/:taskId`

**Purpose**: Retrieve all success criteria for a specific task

**Parameters**:
- `taskId` (path): Unique task identifier
- `include_evidence` (query): Include validation evidence (true/false)
- `category_filter` (query): Filter by criteria category
- `status_filter` (query): Filter by validation status

**Response**:
```json
{
  "success": true,
  "task_id": "feature_12345_abcdef",
  "criteria_summary": {
    "total_criteria": 35,
    "validated": 30,
    "pending": 3,
    "failed": 2,
    "overridden": 0
  },
  "criteria_details": {
    "standard_25_point": {
      "template": "25_point_standard_v1",
      "criteria": [
        {
          "id": 1,
          "name": "Linter Perfection",
          "category": "quality",
          "status": "passed",
          "automated": true,
          "evidence": {
            "type": "command_output",
            "data": "eslint: 0 errors, 0 warnings",
            "timestamp": "2025-09-13T16:44:15Z"
          }
        }
      ]
    },
    "custom_criteria": [...],
    "inherited_criteria": [...]
  }
}
```

#### 1.3 Configure Project-Wide Success Criteria

**Endpoint**: `POST /api/success-criteria/project-wide`

**Purpose**: Set global success criteria that apply to all tasks in the project

**Request Body**:
```json
{
  "criteria_sets": {
    "security_baseline": {
      "description": "Minimum security requirements for all features",
      "criteria": [
        "Input validation implemented",
        "Output sanitization applied",
        "Authentication required where appropriate",
        "Audit logging enabled"
      ],
      "applies_to": ["feature", "subtask"],
      "mandatory": true,
      "priority": "critical"
    },
    "performance_baseline": {
      "description": "Performance standards for all features",
      "criteria": [
        "Response time < 2 seconds",
        "Memory usage < 100MB increase",
        "No performance regressions"
      ],
      "applies_to": ["feature"],
      "mandatory": false,
      "priority": "important"
    }
  },
  "inheritance_rules": {
    "cascade_to_subtasks": true,
    "allow_task_overrides": true,
    "require_approval_for_overrides": false,
    "audit_all_changes": true
  },
  "validation_settings": {
    "auto_validate_on_completion": true,
    "require_evidence_collection": true,
    "enable_dashboard_reporting": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "criteria_sets_applied": 2,
  "affected_tasks": [
    "feature_12345_abcdef",
    "feature_67890_xyz"
  ],
  "inheritance_configuration": {
    "total_tasks_affected": 15,
    "cascaded_to_subtasks": 8,
    "overrides_preserved": 3
  }
}
```

### 2. Validation Workflow Endpoints

#### 2.1 Initiate Validation Workflow

**Endpoint**: `POST /api/success-criteria/validate/:taskId`

**Purpose**: Start validation process for all success criteria of a task

**Request Body**:
```json
{
  "validation_type": "full|partial|automated_only|manual_only",
  "criteria_filter": {
    "categories": ["security", "performance"],
    "priorities": ["critical", "important"],
    "statuses": ["pending", "failed"]
  },
  "evidence_collection": {
    "capture_screenshots": true,
    "collect_logs": true,
    "run_performance_tests": true,
    "generate_security_reports": true
  },
  "workflow_options": {
    "parallel_execution": true,
    "timeout_minutes": 30,
    "retry_failed": true,
    "notify_on_completion": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "workflow_id": "validation_workflow_12345",
  "task_id": "feature_12345_abcdef",
  "validation_plan": {
    "total_criteria": 35,
    "automated_checks": 25,
    "manual_reviews": 10,
    "estimated_completion_time": "2025-09-13T17:30:00Z"
  },
  "execution_stages": [
    {
      "stage": "automated_validation",
      "criteria_count": 25,
      "status": "running",
      "estimated_duration": 900
    },
    {
      "stage": "manual_review",
      "criteria_count": 10,
      "status": "pending",
      "estimated_duration": 1800
    }
  ]
}
```

#### 2.2 Get Validation Status

**Endpoint**: `GET /api/validation/status/:workflowId`

**Purpose**: Check the progress and results of a validation workflow

**Response**:
```json
{
  "success": true,
  "workflow_id": "validation_workflow_12345",
  "task_id": "feature_12345_abcdef",
  "status": "running|completed|failed|partial",
  "progress": {
    "completed_criteria": 28,
    "total_criteria": 35,
    "percentage": 80,
    "current_stage": "manual_review"
  },
  "results": {
    "passed": 25,
    "failed": 3,
    "pending": 7,
    "overridden": 0
  },
  "detailed_results": [
    {
      "criterion_id": "linter_perfection",
      "status": "passed",
      "validation_method": "automated",
      "evidence": {
        "type": "command_output",
        "data": "eslint: 0 errors, 0 warnings",
        "timestamp": "2025-09-13T16:44:15Z"
      },
      "validator": "automated_linter_check"
    }
  ],
  "next_steps": ["manual_review_architecture", "performance_validation"],
  "estimated_completion": "2025-09-13T17:15:00Z"
}
```

#### 2.3 Manual Validation Override

**Endpoint**: `POST /api/validation/override/:taskId`

**Purpose**: Provide manual override for failed automated validations

**Request Body**:
```json
{
  "criteria_ids": ["performance_benchmark", "security_scan"],
  "override_reason": "Performance acceptable for MVP, security issue is false positive",
  "approver": {
    "agent_id": "review_agent_789",
    "role": "senior_developer",
    "justification": "Detailed analysis shows acceptable performance trade-offs"
  },
  "override_type": "permanent|temporary|conditional",
  "conditions": "Override valid until next major release",
  "audit_trail": {
    "document_evidence": true,
    "require_secondary_approval": false,
    "notify_stakeholders": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "task_id": "feature_12345_abcdef",
  "overrides_applied": 2,
  "audit_record_id": "audit_override_98765",
  "updated_validation_status": {
    "passed": 27,
    "failed": 1,
    "pending": 5,
    "overridden": 2
  },
  "notification_sent": ["project_manager", "security_team"]
}
```

### 3. Reporting and Dashboard Endpoints

#### 3.1 Generate Validation Report

**Endpoint**: `GET /api/success-criteria/report/:taskId`

**Purpose**: Generate comprehensive validation report for dashboard consumption

**Parameters**:
- `format` (query): Report format (json|pdf|html)
- `include_evidence` (query): Include all validation evidence
- `detail_level` (query): summary|detailed|comprehensive

**Response**:
```json
{
  "success": true,
  "report": {
    "task_id": "feature_12345_abcdef",
    "task_title": "Implement user authentication",
    "validation_timestamp": "2025-09-13T16:45:00Z",
    "overall_status": "passed_with_overrides",
    "criteria_summary": {
      "total_criteria": 35,
      "passed": 30,
      "failed": 1,
      "pending": 2,
      "overridden": 2,
      "success_rate": 94.3
    },
    "category_breakdown": {
      "standard_25_point": {
        "total": 25,
        "passed": 25,
        "failed": 0,
        "success_rate": 100
      },
      "custom_functional": {
        "total": 5,
        "passed": 4,
        "failed": 1,
        "success_rate": 80
      },
      "inherited_security": {
        "total": 5,
        "passed": 3,
        "failed": 0,
        "pending": 2,
        "success_rate": "pending"
      }
    },
    "performance_metrics": {
      "validation_duration": 1247,
      "automated_checks_duration": 456,
      "manual_review_duration": 791,
      "evidence_collection_size_mb": 15.7
    },
    "risk_assessment": {
      "overall_risk": "low",
      "security_risk": "low",
      "performance_risk": "medium",
      "compliance_risk": "low"
    }
  },
  "dashboard_data": {
    "widgets": [
      {
        "type": "success_rate_gauge",
        "value": 94.3,
        "target": 95,
        "status": "warning"
      },
      {
        "type": "criteria_breakdown_chart",
        "data": { /* chart data */ }
      }
    ]
  }
}
```

#### 3.2 Get Project Success Metrics

**Endpoint**: `GET /api/success-criteria/metrics`

**Purpose**: Retrieve project-wide success criteria metrics for dashboard

**Parameters**:
- `time_range` (query): Time range for metrics (1d|7d|30d|90d)
- `task_categories` (query): Filter by task categories
- `group_by` (query): Group metrics by (day|week|category|agent)

**Response**:
```json
{
  "success": true,
  "metrics": {
    "time_range": "30d",
    "generated_at": "2025-09-13T17:00:00Z",
    "project_overview": {
      "total_tasks_validated": 127,
      "overall_success_rate": 92.1,
      "average_validation_time": 945,
      "most_common_failures": ["performance", "documentation"]
    },
    "trend_analysis": {
      "success_rate_trend": [
        { "date": "2025-09-01", "rate": 89.2 },
        { "date": "2025-09-07", "rate": 91.5 },
        { "date": "2025-09-13", "rate": 92.1 }
      ],
      "validation_time_trend": [
        { "date": "2025-09-01", "avg_time": 1120 },
        { "date": "2025-09-07", "avg_time": 1050 },
        { "date": "2025-09-13", "avg_time": 945 }
      ]
    },
    "category_performance": {
      "error_tasks": { "count": 15, "success_rate": 96.7 },
      "feature_tasks": { "count": 87, "success_rate": 91.2 },
      "subtask_tasks": { "count": 23, "success_rate": 95.8 },
      "test_tasks": { "count": 2, "success_rate": 100 }
    },
    "agent_performance": {
      "top_performers": [
        { "agent_id": "dev_agent_123", "success_rate": 97.3, "task_count": 23 }
      ],
      "improvement_needed": [
        { "agent_id": "dev_agent_456", "success_rate": 84.2, "task_count": 19 }
      ]
    }
  }
}
```

### 4. Configuration and Admin Endpoints

#### 4.1 Update Success Criteria Templates

**Endpoint**: `PUT /api/success-criteria/templates/:templateId`

**Purpose**: Update success criteria templates

**Request Body**:
```json
{
  "template_id": "25_point_standard_v2",
  "template_name": "25-Point Quality Standard v2",
  "version": "2.0.0",
  "criteria": [
    {
      "id": 1,
      "name": "Linter Perfection",
      "category": "quality",
      "automated": true,
      "validation_command": "npm run lint",
      "success_pattern": "0 errors, 0 warnings",
      "evidence_type": "command_output"
    }
  ],
  "inheritance_rules": {
    "mandatory_for_categories": ["feature", "error"],
    "optional_for_categories": ["subtask", "test"],
    "allow_customization": true
  }
}
```

#### 4.2 Get Available Templates

**Endpoint**: `GET /api/success-criteria/templates`

**Purpose**: List all available success criteria templates

**Response**:
```json
{
  "success": true,
  "templates": [
    {
      "template_id": "25_point_standard",
      "name": "25-Point Quality Standard",
      "version": "1.0.0",
      "criteria_count": 25,
      "usage_count": 145,
      "last_updated": "2025-09-13T10:00:00Z"
    }
  ]
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Task validation failed: 3 criteria not met",
    "details": {
      "failed_criteria": ["performance_test", "security_scan", "documentation"],
      "task_id": "feature_12345_abcdef"
    },
    "suggestions": [
      "Run performance optimization",
      "Address security scan findings", 
      "Complete API documentation"
    ]
  }
}
```

### Common Error Codes

- `TASK_NOT_FOUND`: Task ID does not exist
- `VALIDATION_IN_PROGRESS`: Validation already running for this task
- `INSUFFICIENT_PERMISSIONS`: Agent lacks required permissions
- `INVALID_CRITERIA_CONFIG`: Malformed criteria configuration
- `TEMPLATE_NOT_FOUND`: Referenced template does not exist
- `VALIDATION_TIMEOUT`: Validation process timed out
- `EVIDENCE_COLLECTION_FAILED`: Could not collect required evidence

## Rate Limiting

- General endpoints: 100 requests per minute per agent
- Validation endpoints: 10 requests per minute per agent (due to resource intensity)
- Report generation: 5 requests per minute per agent
- Bulk operations: 2 requests per minute per agent

## Integration Examples

### Example 1: Task Completion with Validation

```javascript
// Complete task with automatic validation
const completionResult = await fetch('/api/success-criteria/validate/feature_123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    validation_type: 'full',
    evidence_collection: {
      capture_screenshots: true,
      collect_logs: true
    }
  })
});
```

### Example 2: Dashboard Integration

```javascript
// Get metrics for dashboard widget
const metrics = await fetch('/api/success-criteria/metrics?time_range=7d&group_by=day');
const data = await metrics.json();

// Update dashboard widget
updateSuccessRateWidget(data.metrics.trend_analysis.success_rate_trend);
```

## Versioning

- API Version: v1
- Backward compatibility maintained for v1
- Deprecation notices provided 6 months before breaking changes
- Version specified in Accept header: `Accept: application/vnd.taskmanager.v1+json`

---

*API Specification v1.0.0*  
*Last Updated: 2025-09-13*  
*Next Review: 2025-12-13*