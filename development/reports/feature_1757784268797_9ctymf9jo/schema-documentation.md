# Enhanced Schema Documentation and Examples
## Comprehensive Guide to Embedded Subtasks and Success Criteria

**Task ID:** feature_1757784268797_9ctymf9jo  
**Agent:** development_session_1757784244665_1_general_b1a69681  
**Date:** 2025-09-13  
**Documentation Focus:** Complete schema specification with practical examples and implementation guidelines

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Core Data Structures](#core-data-structures)
3. [Enhanced Task Schema](#enhanced-task-schema)
4. [Embedded Subtasks Schema](#embedded-subtasks-schema)
5. [Success Criteria Schema](#success-criteria-schema)
6. [Research Configuration Schema](#research-configuration-schema)
7. [Audit Configuration Schema](#audit-configuration-schema)
8. [Validation Rules](#validation-rules)
9. [Practical Examples](#practical-examples)
10. [Migration Examples](#migration-examples)
11. [API Integration](#api-integration)
12. [Best Practices](#best-practices)

---

## Schema Overview

The enhanced TaskManager schema provides a sophisticated, scalable approach to managing embedded subtasks and success criteria while maintaining backward compatibility with existing implementations.

### Key Design Principles

1. **Backward Compatibility**: All existing TODO.json files remain valid
2. **Progressive Enhancement**: New features are optional and additive
3. **Type Safety**: Comprehensive validation ensures data integrity
4. **Performance Optimization**: Efficient indexing and query patterns
5. **Extensibility**: Clear patterns for future enhancements

### Schema Versioning

```json
{
  "schema_version": "2.0.0",
  "compatibility_version": "1.0.0",
  "migration_support": true,
  "backward_compatible": true
}
```

---

## Core Data Structures

### Root TODO.json Structure

```json
{
  "project": "string",
  "schema_version": "2.0.0",
  "tasks": [
    {
      // Enhanced Task Object (see below)
    }
  ],
  "agents": {
    // Agent management (existing structure)
  },
  "features": [
    // Feature management (existing structure)
  ],
  "metadata": {
    "created_at": "2025-09-13T17:00:00.000Z",
    "last_modified": "2025-09-13T17:30:00.000Z",
    "total_tasks": 0,
    "total_subtasks": 0,
    "performance_metrics": {
      "avg_validation_time": 0,
      "last_integrity_check": "2025-09-13T17:30:00.000Z"
    }
  }
}
```

---

## Enhanced Task Schema

### Basic Task Structure (Backward Compatible)

```json
{
  "id": "feature_1757784268797_9ctymf9jo",
  "title": "Implement user authentication system",
  "description": "Create comprehensive authentication with JWT tokens, refresh mechanisms, and role-based access control",
  "category": "feature",
  "priority": "high",
  "status": "pending",
  "created_at": "2025-09-13T17:00:00.000Z",
  "updated_at": "2025-09-13T17:00:00.000Z",
  "dependencies": [],
  "important_files": [],
  "success_criteria": [],
  "estimate": "8-12 hours",
  "requires_research": true,
  "subtasks": []
}
```

### Enhanced Task Structure (New Features)

```json
{
  "id": "feature_1757784268797_9ctymf9jo",
  "title": "Implement user authentication system",
  "description": "Create comprehensive authentication with JWT tokens, refresh mechanisms, and role-based access control",
  "category": "feature",
  "priority": "high",
  "status": "pending",
  "created_at": "2025-09-13T17:00:00.000Z",
  "updated_at": "2025-09-13T17:00:00.000Z",
  
  // Enhanced metadata
  "metadata": {
    "complexity_score": 8,
    "business_value": "high",
    "technical_risk": "medium",
    "estimated_effort": "large",
    "completion_percentage": 0,
    "last_activity": "2025-09-13T17:00:00.000Z",
    "created_by": "agent_id",
    "tags": ["authentication", "security", "jwt"],
    "external_references": [
      {
        "type": "documentation",
        "url": "https://example.com/auth-docs",
        "title": "Authentication Requirements"
      }
    ]
  },
  
  // Enhanced timeline tracking
  "timeline": {
    "created_at": "2025-09-13T17:00:00.000Z",
    "updated_at": "2025-09-13T17:00:00.000Z",
    "started_at": null,
    "completed_at": null,
    "blocked_at": null,
    "blocked_duration": 0,
    "milestones": [
      {
        "name": "Research Complete",
        "target_date": "2025-09-14T12:00:00.000Z",
        "completed_at": null
      }
    ]
  },
  
  // Enhanced relationships
  "relationships": {
    "parent_tasks": [],
    "child_tasks": [],
    "related_tasks": ["feature_1757784268798_auth_ui"],
    "blocks": [],
    "blocked_by": [],
    "depends_on": ["feature_1757784268799_user_model"]
  },
  
  // Performance tracking
  "performance": {
    "creation_time": 1234567890,
    "last_update_time": 1234567890,
    "access_count": 0,
    "modification_count": 0,
    "cache_key": "task_feature_1757784268797_9ctymf9jo"
  },
  
  // Enhanced arrays (backward compatible)
  "dependencies": ["feature_1757784268799_user_model"],
  "important_files": [
    {
      "path": "/src/auth/jwt.js",
      "type": "implementation",
      "critical": true,
      "last_modified": "2025-09-13T16:00:00.000Z"
    }
  ],
  "success_criteria": [
    // Enhanced success criteria (see below)
  ],
  "subtasks": [
    // Enhanced subtasks (see below)
  ]
}
```

### Task Field Specifications

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Unique task identifier | `"feature_1757784268797_9ctymf9jo"` |
| `title` | string | ✅ | Task title (1-200 chars) | `"Implement user authentication"` |
| `description` | string | ⚠️ | Detailed description (max 5000 chars) | `"Create comprehensive auth..."` |
| `category` | enum | ✅ | Task category | `"feature"`, `"error"`, `"test"`, `"audit"` |
| `priority` | enum | ⚠️ | Task priority | `"critical"`, `"high"`, `"medium"`, `"low"` |
| `status` | enum | ✅ | Current status | `"pending"`, `"in_progress"`, `"completed"` |
| `created_at` | ISO8601 | ✅ | Creation timestamp | `"2025-09-13T17:00:00.000Z"` |
| `metadata` | object | ❌ | Enhanced metadata | See enhanced structure above |
| `timeline` | object | ❌ | Timeline tracking | See enhanced structure above |
| `relationships` | object | ❌ | Task relationships | See enhanced structure above |

---

## Embedded Subtasks Schema

### Basic Subtask Structure

```json
{
  "id": "research_1757784268798_a1b2c3d4",
  "type": "research",
  "title": "Research JWT implementation patterns",
  "description": "Analyze JWT token management, refresh strategies, and security best practices",
  "status": "pending",
  "estimated_hours": 2,
  "created_at": "2025-09-13T17:00:00.000Z",
  "parent_task_id": "feature_1757784268797_9ctymf9jo"
}
```

### Enhanced Subtask Structure

```json
{
  "id": "research_1757784268798_a1b2c3d4",
  "type": "research",
  "title": "Research JWT implementation patterns",
  "description": "Analyze JWT token management, refresh strategies, and security best practices",
  "status": "pending",
  "priority": "high",
  "estimated_hours": 2,
  "actual_hours": 0,
  
  // Core timestamps
  "created_at": "2025-09-13T17:00:00.000Z",
  "updated_at": "2025-09-13T17:00:00.000Z",
  "started_at": null,
  "completed_at": null,
  
  // Relationships
  "parent_task_id": "feature_1757784268797_9ctymf9jo",
  "depends_on": [],
  "blocks": ["impl_1757784268799_implementation"],
  
  // Enhanced metadata
  "metadata": {
    "complexity_score": 3,
    "automation_level": "semi",
    "validation_required": true,
    "assigned_agent": null,
    "specialization_required": ["research", "security"],
    "evidence_requirements": ["analysis_report", "best_practices_doc"],
    "quality_gates": {
      "peer_review_required": false,
      "expert_validation": true,
      "evidence_validation": true
    }
  },
  
  // Type-specific configuration
  "research_config": {
    // See Research Configuration Schema below
  },
  
  // Success criteria
  "success_criteria": [
    // Enhanced success criteria for subtasks
  ],
  
  // Results tracking
  "results": {
    "deliverables_completed": 0,
    "evidence_collected": [],
    "confidence_score": 0,
    "validation_status": "pending",
    "output_summary": null
  }
}
```

### Subtask Types and Specifications

#### Research Subtasks

```json
{
  "type": "research",
  "research_config": {
    "research_type": "technical_analysis",
    "locations": [
      {
        "type": "codebase",
        "paths": ["/src/auth", "/lib/jwt"],
        "focus": "Existing authentication patterns",
        "depth": "deep",
        "file_patterns": ["*.js", "*.ts"],
        "exclude_patterns": ["*.test.js"]
      },
      {
        "type": "internet",
        "keywords": ["JWT implementation", "token security", "refresh patterns"],
        "focus": "Industry best practices and security considerations",
        "sources": ["official_docs", "security_guides", "technical_blogs"],
        "quality_threshold": "high"
      },
      {
        "type": "documentation",
        "sources": ["README.md", "docs/authentication.md", "API_GUIDE.md"],
        "focus": "Project-specific requirements and constraints"
      }
    ],
    "deliverables": {
      "reports": ["technical_analysis", "security_assessment", "implementation_recommendations"],
      "artifacts": ["comparison_matrix", "security_checklist"],
      "evidence": ["code_examples", "benchmark_results"],
      "format": "markdown"
    },
    "quality_gates": {
      "min_sources": 5,
      "min_evidence_pieces": 10,
      "confidence_threshold": 0.8,
      "peer_review_required": false,
      "expert_validation_required": true,
      "validation_timeout": 3600
    },
    "automation": {
      "automated_analysis": true,
      "code_scanning": true,
      "link_validation": true,
      "output_formatting": true
    }
  }
}
```

#### Audit Subtasks

```json
{
  "type": "audit",
  "audit_config": {
    "audit_type": "embedded_quality_gate",
    "scope": "feature_completion",
    "objectivity_controls": {
      "prevents_self_review": true,
      "requires_external_agent": false,
      "conflict_of_interest_check": true,
      "minimum_separation_time": 3600,
      "original_implementer": "agent_development_session_123"
    },
    "validation_framework": {
      "success_criteria_template": "25_point_standard",
      "custom_criteria": [
        {
          "id": "auth_security_validation",
          "title": "Authentication Security Validation",
          "description": "Validate security measures in authentication implementation",
          "validation_method": "manual_security_review"
        }
      ],
      "evidence_requirements": [
        {
          "type": "security_scan_results",
          "description": "Automated security scan results",
          "required": true
        },
        {
          "type": "penetration_test_report",
          "description": "Manual security testing results",
          "required": false
        }
      ],
      "automated_checks": [
        {
          "name": "linter_validation",
          "command": "npm run lint",
          "success_condition": "exit_code === 0"
        },
        {
          "name": "security_scan",
          "command": "npm audit",
          "success_condition": "vulnerabilities.high === 0"
        }
      ]
    },
    "approval_workflow": {
      "requires_approval": true,
      "approval_criteria": {
        "minimum_pass_rate": 0.9,
        "critical_criteria_pass_rate": 1.0,
        "evidence_completeness": 1.0
      },
      "escalation_rules": {
        "failed_criteria_threshold": 3,
        "escalation_timeout": 7200,
        "escalation_contacts": ["lead_developer", "security_team"]
      }
    }
  }
}
```

#### Implementation Subtasks

```json
{
  "type": "implementation",
  "implementation_config": {
    "implementation_type": "feature_component",
    "scope": {
      "files_to_create": ["/src/auth/jwt-service.js", "/src/auth/middleware.js"],
      "files_to_modify": ["/src/app.js", "/src/routes/auth.js"],
      "tests_required": true,
      "documentation_required": true
    },
    "dependencies": {
      "research_dependencies": ["research_1757784268798_a1b2c3d4"],
      "implementation_dependencies": [],
      "blocks_completion": false
    },
    "quality_requirements": {
      "test_coverage_minimum": 0.8,
      "code_review_required": true,
      "security_review_required": true,
      "performance_validation_required": true
    },
    "rollback_plan": {
      "backup_strategy": "git_branch",
      "rollback_triggers": ["test_failures", "security_violations"],
      "rollback_procedure": "automated"
    }
  }
}
```

---

## Success Criteria Schema

### Simple Success Criteria (Backward Compatible)

```json
{
  "success_criteria": [
    "Linter Perfection",
    "Build Success", 
    "Runtime Success",
    "Test Integrity"
  ]
}
```

### Enhanced Success Criteria

```json
{
  "success_criteria": [
    {
      "id": "criteria_1757784268800_linter",
      "title": "Linter Perfection",
      "description": "All linting rules pass with zero violations across all modified files",
      "category": "code_quality",
      "priority": "mandatory",
      "weight": 1.0,
      
      "validation": {
        "type": "automated",
        "timeout": 300,
        "retry_count": 3,
        "validation_command": "npm run lint",
        "success_condition": "exit_code === 0 && violations === 0",
        "failure_condition": "exit_code !== 0 || violations > 0",
        "validation_script": null,
        "environment_setup": null
      },
      
      "evidence_requirements": {
        "type": "command_output",
        "storage_path": "development/evidence/linter/",
        "filename_pattern": "lint-results-{timestamp}.txt",
        "retention_days": 90,
        "required_fields": ["exit_code", "violations_count", "output"],
        "validation_schema": {
          "exit_code": "number",
          "violations_count": "number", 
          "output": "string"
        }
      },
      
      "status": "pending",
      "validation_results": {
        "last_validated": null,
        "validation_count": 0,
        "pass_count": 0,
        "fail_count": 0,
        "pass_rate": 0,
        "average_validation_time": 0,
        "evidence_path": null,
        "failure_reason": null,
        "last_evidence": null
      },
      
      "inheritance": {
        "inherited_from": "project_quality_baseline",
        "can_override": false,
        "override_reason": null,
        "override_approved_by": null
      },
      
      "metadata": {
        "created_at": "2025-09-13T17:00:00.000Z",
        "updated_at": "2025-09-13T17:00:00.000Z",
        "created_by": "system",
        "last_modified_by": "system",
        "version": "1.0.0"
      }
    },
    
    {
      "id": "criteria_1757784268801_security",
      "title": "Security Validation",
      "description": "Authentication implementation passes all security validations and vulnerability scans",
      "category": "security",
      "priority": "mandatory",
      "weight": 2.0,
      
      "validation": {
        "type": "hybrid",
        "timeout": 1800,
        "retry_count": 1,
        "validation_command": "npm run security-scan",
        "success_condition": "vulnerabilities.critical === 0 && vulnerabilities.high === 0",
        "manual_validation_required": true,
        "manual_validation_checklist": [
          "JWT token expiration configured correctly",
          "Refresh token rotation implemented",
          "Secure cookie configuration verified",
          "Password hashing uses secure algorithm",
          "Rate limiting implemented for auth endpoints"
        ]
      },
      
      "evidence_requirements": {
        "type": "mixed",
        "automated_evidence": {
          "storage_path": "development/evidence/security/",
          "filename_pattern": "security-scan-{timestamp}.json"
        },
        "manual_evidence": {
          "storage_path": "development/evidence/security/manual/",
          "required_artifacts": ["security_checklist", "penetration_test_summary"]
        }
      }
    }
  ]
}
```

### Success Criteria Categories

| Category | Description | Typical Priority | Validation Type |
|----------|-------------|------------------|-----------------|
| `code_quality` | Code style, linting, formatting | Mandatory | Automated |
| `functionality` | Feature behavior, business logic | Mandatory | Hybrid |
| `performance` | Speed, memory, scalability | Recommended | Automated |
| `security` | Vulnerabilities, auth, data protection | Mandatory | Hybrid |
| `documentation` | Code docs, API docs, guides | Recommended | Manual |
| `testing` | Test coverage, test quality | Mandatory | Automated |
| `compatibility` | Browser, API, backward compatibility | Recommended | Automated |
| `compliance` | Regulatory, legal, policy compliance | Mandatory | Manual |

---

## Research Configuration Schema

### Research Location Types

#### Codebase Research

```json
{
  "type": "codebase",
  "paths": ["/src/auth", "/lib/security", "/tests/auth"],
  "focus": "Existing authentication patterns and security implementations",
  "depth": "deep",
  "analysis_type": "pattern_extraction",
  "file_patterns": ["*.js", "*.ts", "*.json"],
  "exclude_patterns": ["*.test.js", "*.spec.ts", "node_modules/**"],
  "search_terms": ["auth", "jwt", "token", "security"],
  "context_lines": 5,
  "max_files": 100,
  "follow_imports": true,
  "extract_patterns": {
    "functions": true,
    "classes": true,
    "constants": true,
    "types": true,
    "comments": true
  }
}
```

#### Internet Research

```json
{
  "type": "internet",
  "keywords": ["JWT implementation Node.js", "authentication security best practices"],
  "focus": "Industry standards and security recommendations for JWT authentication",
  "sources": ["official_documentation", "security_guides", "technical_blogs", "academic_papers"],
  "quality_threshold": "high",
  "max_sources": 20,
  "language_preference": "english",
  "date_range": {
    "from": "2023-01-01",
    "to": "2025-12-31"
  },
  "domain_preferences": [
    "auth0.com",
    "owasp.org", 
    "nodejs.org",
    "jwt.io",
    "developer.mozilla.org"
  ],
  "exclude_domains": ["stackoverflow.com"],
  "content_types": ["documentation", "tutorials", "best_practices", "security_advisories"],
  "verification_required": true
}
```

#### Documentation Research

```json
{
  "type": "documentation",
  "sources": [
    "README.md",
    "docs/authentication.md",
    "API_REFERENCE.md",
    "SECURITY.md",
    "package.json"
  ],
  "focus": "Project-specific requirements, constraints, and existing documentation",
  "analysis_depth": "comprehensive",
  "extract_requirements": true,
  "identify_gaps": true,
  "cross_reference": true,
  "update_recommendations": true
}
```

#### Database Research

```json
{
  "type": "database",
  "connection_config": {
    "type": "postgresql",
    "schema_analysis": true,
    "data_analysis": false,
    "performance_analysis": true
  },
  "focus": "User authentication schema and related database structures",
  "analysis_scope": {
    "tables": ["users", "sessions", "tokens", "roles"],
    "relationships": true,
    "indexes": true,
    "constraints": true,
    "performance_metrics": true
  },
  "security_considerations": {
    "pii_detection": true,
    "encryption_analysis": true,
    "access_patterns": true
  }
}
```

### Research Deliverables Configuration

```json
{
  "deliverables": {
    "reports": [
      {
        "type": "technical_analysis",
        "title": "JWT Implementation Analysis Report",
        "sections": [
          "executive_summary",
          "current_state_analysis", 
          "best_practices_review",
          "implementation_recommendations",
          "security_considerations",
          "performance_implications",
          "testing_strategy"
        ],
        "format": "markdown",
        "min_length": 2000,
        "include_code_examples": true,
        "include_diagrams": true
      },
      {
        "type": "security_assessment",
        "title": "Authentication Security Assessment",
        "focus": "security_vulnerabilities_and_mitigations",
        "format": "structured_json",
        "include_threat_model": true,
        "include_mitigation_strategies": true
      }
    ],
    "artifacts": [
      {
        "type": "comparison_matrix",
        "title": "JWT Library Comparison",
        "format": "table",
        "criteria": ["security", "performance", "maintenance", "documentation"],
        "options": ["jsonwebtoken", "jose", "fast-jwt", "node-jsonwebtoken"]
      },
      {
        "type": "implementation_checklist", 
        "title": "JWT Implementation Checklist",
        "format": "markdown_checklist",
        "categories": ["security", "performance", "testing", "documentation"]
      }
    ],
    "evidence": [
      {
        "type": "code_examples",
        "description": "Working code examples demonstrating recommended patterns",
        "format": "javascript",
        "min_examples": 5,
        "include_tests": true,
        "include_documentation": true
      },
      {
        "type": "benchmark_results",
        "description": "Performance benchmarks of different JWT implementations",
        "format": "json",
        "metrics": ["throughput", "latency", "memory_usage"],
        "test_scenarios": ["token_generation", "token_validation", "concurrent_operations"]
      }
    ]
  }
}
```

---

## Validation Rules

### Schema Validation Rules

```javascript
const VALIDATION_RULES = {
  task: {
    required_fields: ['id', 'title', 'category', 'status', 'created_at'],
    optional_fields: ['description', 'priority', 'updated_at', 'metadata', 'timeline'],
    field_constraints: {
      id: {
        pattern: /^(feature|error|test|subtask|audit)_\d+_[a-z0-9]+$/,
        unique: true
      },
      title: {
        min_length: 1,
        max_length: 200,
        pattern: /^[^<>{}]*$/ // No HTML/XML tags
      },
      category: {
        enum: ['feature', 'error', 'subtask', 'test', 'audit']
      },
      status: {
        enum: ['pending', 'in_progress', 'completed', 'blocked', 'cancelled']
      },
      priority: {
        enum: ['critical', 'high', 'medium', 'low']
      },
      created_at: {
        format: 'iso8601',
        not_future: true
      }
    }
  },
  
  subtask: {
    required_fields: ['id', 'type', 'title', 'status', 'created_at'],
    optional_fields: ['description', 'priority', 'estimated_hours', 'metadata'],
    field_constraints: {
      id: {
        pattern: /^(research|audit|impl)_\d+_[a-z0-9]+$/,
        unique: true
      },
      type: {
        enum: ['research', 'audit', 'implementation']
      },
      estimated_hours: {
        type: 'number',
        min: 0.1,
        max: 40
      },
      parent_task_id: {
        required: true,
        reference: 'task.id'
      }
    },
    conditional_validation: {
      research_subtasks: {
        required_when: { type: 'research' },
        fields: ['research_config'],
        validation: 'research_config.locations.length > 0'
      },
      audit_subtasks: {
        required_when: { type: 'audit' },
        fields: ['audit_config'],
        validation: 'audit_config.validation_framework !== null'
      }
    }
  },
  
  success_criteria: {
    simple_format: {
      type: 'string',
      min_length: 5,
      max_length: 100
    },
    enhanced_format: {
      required_fields: ['id', 'title', 'category', 'validation'],
      field_constraints: {
        category: {
          enum: ['code_quality', 'functionality', 'performance', 'security', 'documentation', 'testing', 'compatibility', 'compliance']
        },
        priority: {
          enum: ['mandatory', 'recommended', 'optional']
        },
        validation: {
          type: 'object',
          required_fields: ['type', 'timeout'],
          constraints: {
            type: { enum: ['automated', 'manual', 'hybrid'] },
            timeout: { type: 'number', min: 1, max: 7200 }
          }
        }
      }
    }
  }
};
```

### Business Logic Validation

```javascript
const BUSINESS_RULES = {
  task_workflow: {
    status_transitions: {
      pending: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'blocked', 'cancelled'],
      blocked: ['in_progress', 'cancelled'],
      completed: [], // Terminal state
      cancelled: [] // Terminal state
    },
    category_constraints: {
      error: {
        priority_minimum: 'high',
        max_estimated_hours: 8,
        requires_immediate_attention: true
      },
      feature: {
        requires_success_criteria: true,
        min_success_criteria_count: 3,
        requires_audit_subtask: true
      }
    }
  },
  
  subtask_workflow: {
    research_rules: {
      prevents_implementation: true,
      required_deliverables: ['technical_analysis'],
      max_duration_hours: 8
    },
    audit_rules: {
      prevents_completion: true,
      prevents_self_review: true,
      min_success_criteria: 5,
      requires_evidence: true
    },
    dependency_rules: {
      research_before_implementation: true,
      audit_after_implementation: true,
      no_circular_dependencies: true
    }
  },
  
  success_criteria_rules: {
    mandatory_criteria: {
      feature_tasks: ['linter_perfection', 'build_success', 'test_integrity'],
      error_tasks: ['linter_perfection', 'build_success'],
      audit_tasks: ['comprehensive_validation', 'evidence_collection']
    },
    validation_requirements: {
      automated_criteria: {
        requires_command: true,
        requires_success_condition: true,
        max_timeout: 3600
      },
      manual_criteria: {
        requires_checklist: true,
        requires_evidence_documentation: true
      }
    }
  }
};
```

---

## Practical Examples

### Example 1: Complete Feature Task with Embedded Subtasks

```json
{
  "id": "feature_1757784300000_auth_system",
  "title": "Implement JWT Authentication System",
  "description": "Create a comprehensive JWT-based authentication system with token refresh, role-based access control, and security monitoring.",
  "category": "feature",
  "priority": "high",
  "status": "pending",
  "created_at": "2025-09-13T17:00:00.000Z",
  "updated_at": "2025-09-13T17:00:00.000Z",
  
  "metadata": {
    "complexity_score": 8,
    "business_value": "high",
    "technical_risk": "medium",
    "estimated_effort": "large",
    "tags": ["authentication", "security", "jwt", "rbac"],
    "external_references": [
      {
        "type": "requirements_doc",
        "url": "https://company.com/auth-requirements",
        "title": "Authentication System Requirements"
      }
    ]
  },
  
  "dependencies": ["feature_1757784299999_user_model"],
  "important_files": [
    {
      "path": "/src/auth/jwt-service.js",
      "type": "implementation",
      "critical": true
    },
    {
      "path": "/src/middleware/auth.js", 
      "type": "implementation",
      "critical": true
    },
    {
      "path": "/tests/auth/jwt.test.js",
      "type": "test",
      "critical": false
    }
  ],
  
  "success_criteria": [
    {
      "id": "criteria_auth_linter",
      "title": "Linter Perfection",
      "description": "All authentication code passes linting with zero violations",
      "category": "code_quality",
      "priority": "mandatory",
      "validation": {
        "type": "automated",
        "timeout": 60,
        "validation_command": "npm run lint src/auth/ src/middleware/auth.js",
        "success_condition": "exit_code === 0"
      }
    },
    {
      "id": "criteria_auth_security",
      "title": "Security Validation",
      "description": "JWT implementation passes security audit and vulnerability scanning",
      "category": "security",
      "priority": "mandatory",
      "validation": {
        "type": "hybrid",
        "timeout": 300,
        "validation_command": "npm run security-scan",
        "manual_validation_required": true,
        "manual_validation_checklist": [
          "JWT secret is cryptographically secure",
          "Token expiration is appropriately configured",
          "Refresh token rotation is implemented",
          "Rate limiting is applied to auth endpoints"
        ]
      }
    },
    {
      "id": "criteria_auth_performance",
      "title": "Performance Requirements",
      "description": "Authentication operations meet performance benchmarks",
      "category": "performance",
      "priority": "recommended",
      "validation": {
        "type": "automated",
        "timeout": 180,
        "validation_command": "npm run perf-test auth",
        "success_condition": "avg_response_time < 100 && max_response_time < 500"
      }
    }
  ],
  
  "subtasks": [
    {
      "id": "research_1757784300001_jwt_analysis",
      "type": "research",
      "title": "Research JWT Implementation Best Practices",
      "description": "Comprehensive analysis of JWT libraries, security patterns, and performance considerations for Node.js applications",
      "status": "pending",
      "priority": "high",
      "estimated_hours": 3,
      "created_at": "2025-09-13T17:00:00.000Z",
      "parent_task_id": "feature_1757784300000_auth_system",
      "blocks": ["impl_1757784300002_jwt_service"],
      
      "metadata": {
        "complexity_score": 4,
        "automation_level": "semi",
        "specialization_required": ["security", "research"]
      },
      
      "research_config": {
        "research_type": "technical_analysis",
        "locations": [
          {
            "type": "codebase",
            "paths": ["/src", "/lib"],
            "focus": "Existing authentication patterns",
            "depth": "medium",
            "file_patterns": ["*.js", "*.ts"]
          },
          {
            "type": "internet",
            "keywords": ["JWT Node.js security", "token refresh strategies", "RBAC implementation"],
            "focus": "Security best practices and implementation patterns",
            "sources": ["official_docs", "security_guides"],
            "quality_threshold": "high"
          }
        ],
        "deliverables": {
          "reports": ["technical_analysis", "security_assessment"],
          "artifacts": ["library_comparison", "implementation_checklist"],
          "evidence": ["code_examples", "security_benchmarks"]
        },
        "quality_gates": {
          "min_sources": 8,
          "min_evidence_pieces": 15,
          "confidence_threshold": 0.85
        }
      },
      
      "success_criteria": [
        {
          "id": "criteria_research_completeness",
          "title": "Research Completeness",
          "description": "All required research deliverables completed with sufficient depth",
          "category": "functionality",
          "priority": "mandatory",
          "validation": {
            "type": "manual",
            "manual_validation_checklist": [
              "Technical analysis report completed",
              "Security assessment completed",
              "Library comparison matrix created",
              "Implementation recommendations documented",
              "Code examples collected and validated"
            ]
          }
        }
      ]
    },
    
    {
      "id": "impl_1757784300002_jwt_service",
      "type": "implementation",
      "title": "Implement JWT Service Module",
      "description": "Create core JWT service with token generation, validation, and refresh functionality",
      "status": "pending",
      "priority": "high",
      "estimated_hours": 6,
      "created_at": "2025-09-13T17:00:00.000Z",
      "parent_task_id": "feature_1757784300000_auth_system",
      "depends_on": ["research_1757784300001_jwt_analysis"],
      "blocks": ["audit_1757784300003_auth_audit"],
      
      "metadata": {
        "complexity_score": 7,
        "automation_level": "manual",
        "specialization_required": ["backend", "security"]
      },
      
      "implementation_config": {
        "scope": {
          "files_to_create": [
            "/src/auth/jwt-service.js",
            "/src/auth/token-manager.js", 
            "/src/middleware/auth.js"
          ],
          "files_to_modify": [
            "/src/app.js",
            "/src/routes/auth.js"
          ],
          "tests_required": true,
          "documentation_required": true
        },
        "quality_requirements": {
          "test_coverage_minimum": 0.9,
          "security_review_required": true,
          "performance_validation_required": true
        }
      },
      
      "success_criteria": [
        {
          "id": "criteria_impl_functionality",
          "title": "Core Functionality Complete",
          "description": "All JWT service functionality implemented and tested",
          "category": "functionality",
          "priority": "mandatory",
          "validation": {
            "type": "automated",
            "timeout": 120,
            "validation_command": "npm test src/auth/",
            "success_condition": "tests_passed === tests_total && coverage >= 0.9"
          }
        }
      ]
    },
    
    {
      "id": "audit_1757784300003_auth_audit",
      "type": "audit",
      "title": "Authentication System Quality Audit",
      "description": "Comprehensive quality audit of the implemented JWT authentication system",
      "status": "pending",
      "priority": "high",
      "estimated_hours": 2,
      "created_at": "2025-09-13T17:00:00.000Z",
      "parent_task_id": "feature_1757784300000_auth_system",
      "depends_on": ["impl_1757784300002_jwt_service"],
      
      "metadata": {
        "complexity_score": 5,
        "automation_level": "hybrid",
        "specialization_required": ["quality_assurance", "security"]
      },
      
      "audit_config": {
        "audit_type": "embedded_quality_gate",
        "objectivity_controls": {
          "prevents_self_review": true,
          "requires_external_agent": false,
          "original_implementer": null
        },
        "validation_framework": {
          "success_criteria_template": "25_point_standard",
          "custom_criteria": [
            {
              "id": "auth_security_audit",
              "title": "Authentication Security Audit",
              "description": "Comprehensive security review of JWT implementation"
            }
          ],
          "automated_checks": [
            {
              "name": "security_scan",
              "command": "npm audit && npm run security-test",
              "success_condition": "vulnerabilities.high === 0"
            }
          ]
        }
      },
      
      "success_criteria": [
        {
          "id": "criteria_audit_completion",
          "title": "Audit Standards Met",
          "description": "All audit criteria met with appropriate evidence",
          "category": "compliance",
          "priority": "mandatory",
          "validation": {
            "type": "manual",
            "manual_validation_checklist": [
              "All automated checks passed",
              "Security review completed",
              "Performance validation completed",
              "Documentation review completed",
              "Evidence collected and validated"
            ]
          }
        }
      ]
    }
  ],
  
  "estimate": "12-15 hours",
  "requires_research": true
}
```

### Example 2: Error Task with Minimal Schema

```json
{
  "id": "error_1757784400000_linter_fixes",
  "title": "Fix ESLint violations in authentication module",
  "description": "Resolve 15 ESLint violations in src/auth/ directory including unused imports, missing semicolons, and indentation issues",
  "category": "error",
  "priority": "high",
  "status": "pending",
  "created_at": "2025-09-13T18:00:00.000Z",
  "dependencies": [],
  "important_files": [
    "/src/auth/jwt-service.js",
    "/src/auth/middleware.js"
  ],
  "success_criteria": [
    "Linter Perfection",
    "Build Success"
  ],
  "subtasks": [],
  "estimate": "1 hour",
  "requires_research": false
}
```

### Example 3: Research Task with Comprehensive Configuration

```json
{
  "id": "research_1757784500000_perf_analysis",
  "title": "Performance Analysis: Database Query Optimization",
  "description": "Comprehensive performance analysis of database queries in the user management system with optimization recommendations",
  "category": "feature",
  "priority": "medium",
  "status": "pending",
  "created_at": "2025-09-13T19:00:00.000Z",
  
  "subtasks": [
    {
      "id": "research_1757784500001_db_analysis",
      "type": "research",
      "title": "Database Performance Research",
      "description": "Analyze current database performance and identify optimization opportunities",
      "status": "pending",
      "estimated_hours": 4,
      "parent_task_id": "research_1757784500000_perf_analysis",
      
      "research_config": {
        "locations": [
          {
            "type": "codebase",
            "paths": ["/src/models", "/src/database", "/migrations"],
            "focus": "Database query patterns and ORM usage",
            "analysis_type": "performance_analysis",
            "extract_patterns": {
              "queries": true,
              "indexes": true,
              "relationships": true
            }
          },
          {
            "type": "database",
            "connection_config": {
              "type": "postgresql",
              "performance_analysis": true,
              "query_analysis": true
            },
            "analysis_scope": {
              "slow_queries": true,
              "index_usage": true,
              "table_statistics": true
            }
          },
          {
            "type": "internet",
            "keywords": ["PostgreSQL optimization", "Node.js ORM performance", "database indexing strategies"],
            "focus": "Database optimization best practices",
            "sources": ["official_docs", "performance_guides"]
          }
        ],
        "deliverables": {
          "reports": [
            {
              "type": "performance_analysis",
              "title": "Database Performance Analysis Report",
              "sections": [
                "current_performance_baseline",
                "bottleneck_identification",
                "optimization_opportunities",
                "implementation_recommendations",
                "expected_performance_gains"
              ]
            }
          ],
          "artifacts": [
            {
              "type": "query_optimization_plan",
              "title": "Query Optimization Implementation Plan",
              "format": "structured_markdown"
            }
          ],
          "evidence": [
            {
              "type": "performance_benchmarks",
              "description": "Before/after performance measurements",
              "format": "json"
            }
          ]
        }
      }
    }
  ]
}
```

---

## Migration Examples

### Example 1: Migrating Simple Task to Enhanced Schema

**Before (Original Schema):**
```json
{
  "id": "feature_123_simple",
  "title": "Add user profile page",
  "category": "feature",
  "status": "pending",
  "created_at": "2025-09-13T17:00:00.000Z",
  "subtasks": [
    {
      "id": "research_124",
      "type": "research",
      "title": "Research profile layouts",
      "status": "pending",
      "estimated_hours": 1
    }
  ]
}
```

**After (Enhanced Schema):**
```json
{
  "id": "feature_123_simple",
  "title": "Add user profile page",
  "category": "feature",
  "status": "pending",
  "created_at": "2025-09-13T17:00:00.000Z",
  
  // Added during migration
  "metadata": {
    "complexity_score": 3,
    "migration_applied": true,
    "migrated_at": "2025-09-13T18:00:00.000Z",
    "schema_version": "2.0.0"
  },
  
  "subtasks": [
    {
      "id": "research_124",
      "type": "research", 
      "title": "Research profile layouts",
      "status": "pending",
      "estimated_hours": 1,
      
      // Added during migration
      "parent_task_id": "feature_123_simple",
      "created_at": "2025-09-13T17:00:00.000Z",
      "metadata": {
        "complexity_score": 2,
        "automation_level": "manual",
        "migrated_from": "simple_format"
      }
    }
  ]
}
```

### Example 2: Migrating Success Criteria

**Before:**
```json
{
  "success_criteria": [
    "Linter Perfection",
    "Build Success",
    "All tests pass"
  ]
}
```

**After:**
```json
{
  "success_criteria": [
    {
      "id": "criteria_migrated_linter",
      "title": "Linter Perfection",
      "description": "All linting rules pass with zero violations",
      "category": "code_quality",
      "priority": "mandatory",
      "validation": {
        "type": "automated",
        "timeout": 60,
        "validation_command": "npm run lint",
        "success_condition": "exit_code === 0"
      },
      "migration_metadata": {
        "original_value": "Linter Perfection",
        "migrated_at": "2025-09-13T18:00:00.000Z"
      }
    },
    {
      "id": "criteria_migrated_build",
      "title": "Build Success",
      "description": "Project builds successfully without errors",
      "category": "functionality",
      "priority": "mandatory",
      "validation": {
        "type": "automated",
        "timeout": 300,
        "validation_command": "npm run build",
        "success_condition": "exit_code === 0"
      },
      "migration_metadata": {
        "original_value": "Build Success", 
        "migrated_at": "2025-09-13T18:00:00.000Z"
      }
    },
    {
      "id": "criteria_migrated_tests",
      "title": "All tests pass",
      "description": "All existing tests continue to pass",
      "category": "testing",
      "priority": "mandatory",
      "validation": {
        "type": "automated",
        "timeout": 600,
        "validation_command": "npm test",
        "success_condition": "tests_passed === tests_total"
      },
      "migration_metadata": {
        "original_value": "All tests pass",
        "migrated_at": "2025-09-13T18:00:00.000Z"
      }
    }
  ]
}
```

---

## API Integration

### TaskManager API Extensions

#### Create Enhanced Task

```javascript
// POST /api/tasks
{
  "title": "Implement caching system",
  "description": "Add Redis-based caching for API responses",
  "category": "feature",
  "priority": "medium",
  "metadata": {
    "complexity_score": 6,
    "business_value": "high",
    "tags": ["performance", "caching", "redis"]
  },
  "success_criteria": [
    {
      "title": "Performance Improvement",
      "category": "performance",
      "validation": {
        "type": "automated",
        "validation_command": "npm run perf-test",
        "success_condition": "improvement_percentage > 0.3"
      }
    }
  ],
  "auto_generate_subtasks": true,
  "research_config": {
    "complexity_threshold": 5,
    "research_locations": ["codebase", "internet"]
  }
}
```

#### Create Subtask

```javascript
// POST /api/tasks/:taskId/subtasks
{
  "type": "research",
  "title": "Research Redis caching patterns",
  "estimated_hours": 2,
  "research_config": {
    "locations": [
      {
        "type": "internet",
        "keywords": ["Redis Node.js patterns", "API caching strategies"],
        "focus": "Implementation patterns and best practices"
      }
    ],
    "deliverables": {
      "reports": ["technical_analysis"],
      "artifacts": ["implementation_guide"]
    }
  }
}
```

#### Update Success Criteria

```javascript
// PUT /api/tasks/:taskId/success-criteria/:criteriaId
{
  "validation": {
    "timeout": 120,
    "validation_command": "npm run test:performance",
    "success_condition": "cache_hit_ratio > 0.8 && response_time_improvement > 0.4"
  },
  "evidence_requirements": {
    "type": "performance_report",
    "required_fields": ["cache_hit_ratio", "response_times", "memory_usage"]
  }
}
```

#### Get Enhanced Task Data

```javascript
// GET /api/tasks/:taskId?include=subtasks,success_criteria,metadata
{
  "id": "feature_1757784268797_caching",
  "title": "Implement caching system",
  "category": "feature",
  "status": "in_progress",
  "metadata": {
    "complexity_score": 6,
    "completion_percentage": 45,
    "performance_metrics": {
      "avg_subtask_completion_time": 3.2,
      "estimated_completion": "2025-09-15T14:00:00.000Z"
    }
  },
  "subtasks": [
    {
      "id": "research_1757784268798_redis",
      "type": "research",
      "status": "completed",
      "completion_percentage": 100,
      "results": {
        "deliverables_completed": 2,
        "confidence_score": 0.9,
        "key_findings": ["Redis Cluster recommended", "Bull Queue for job processing"]
      }
    }
  ],
  "success_criteria": [
    {
      "id": "criteria_performance",
      "status": "pending",
      "validation_results": {
        "last_validated": null,
        "pass_rate": 0
      }
    }
  ]
}
```

### Validation Endpoints

```javascript
// POST /api/tasks/:taskId/validate
{
  "validation_level": "comprehensive", // basic, standard, comprehensive
  "include_performance_check": true,
  "auto_repair": true
}

// Response
{
  "valid": true,
  "validation_id": "validation_1757784268800",
  "summary": {
    "errors": 0,
    "warnings": 2,
    "performance_score": 85,
    "validation_time": 1250
  },
  "details": {
    "schema_validation": { "valid": true },
    "reference_validation": { "valid": true },
    "business_rules": { 
      "valid": true,
      "warnings": ["Subtask workflow could be optimized"]
    }
  },
  "recommendations": [
    {
      "type": "optimization",
      "message": "Consider parallel execution of independent subtasks"
    }
  ]
}
```

### Bulk Operations

```javascript
// POST /api/tasks/bulk-update
{
  "operations": [
    {
      "type": "update_subtask",
      "task_id": "feature_123",
      "subtask_id": "research_124",
      "data": { "status": "completed" }
    },
    {
      "type": "validate_success_criteria",
      "task_id": "feature_123",
      "criteria_id": "criteria_performance"
    }
  ],
  "atomic": true,
  "validate_before_apply": true
}
```

---

## Best Practices

### Schema Design Best Practices

1. **Start Simple, Enhance Gradually**
   ```json
   // Good: Start with required fields, add optional enhancements
   {
     "id": "task_123",
     "title": "Basic task",
     "category": "feature",
     "status": "pending",
     // Optional enhancements can be added later
     "metadata": { "added_later": true }
   }
   ```

2. **Use Consistent ID Patterns**
   ```javascript
   // Task IDs: {category}_{timestamp}_{random}
   "feature_1757784268797_9ctymf9jo"
   
   // Subtask IDs: {type}_{timestamp}_{random}
   "research_1757784268798_a1b2c3d4"
   "audit_1757784268799_b2c3d4e5"
   
   // Criteria IDs: criteria_{timestamp}_{random}
   "criteria_1757784268800_c3d4e5f6"
   ```

3. **Design for Query Efficiency**
   ```json
   {
     // Include index-friendly fields
     "status": "pending",
     "priority": "high", 
     "category": "feature",
     "assigned_agent": "agent_123",
     
     // Group related data
     "metadata": {
       "performance_data": {},
       "business_data": {},
       "technical_data": {}
     }
   }
   ```

### Validation Best Practices

1. **Implement Progressive Validation**
   ```javascript
   // Basic validation for all environments
   const basicRules = ['required_fields', 'type_validation'];
   
   // Enhanced validation for development
   const enhancedRules = [...basicRules, 'business_rules', 'performance_checks'];
   
   // Comprehensive validation for production
   const productionRules = [...enhancedRules, 'security_validation', 'compliance_checks'];
   ```

2. **Use Validation Caching**
   ```javascript
   // Cache validation results for performance
   const validationCache = new Map();
   
   function getCacheKey(taskData) {
     return crypto.createHash('sha256')
       .update(JSON.stringify(taskData))
       .digest('hex');
   }
   ```

3. **Implement Graceful Degradation**
   ```javascript
   // Handle validation failures gracefully
   if (validationResult.errors.length > 0) {
     if (strictMode) {
       throw new ValidationError(validationResult.errors);
     } else {
       console.warn('Validation warnings:', validationResult.warnings);
       // Continue with warnings logged
     }
   }
   ```

### Performance Best Practices

1. **Use Efficient Data Structures**
   ```javascript
   // Index frequently queried fields
   const taskIndex = {
     byId: new Map(),
     byStatus: new Map(),
     byCategory: new Map(),
     byAgent: new Map()
   };
   ```

2. **Implement Lazy Loading**
   ```javascript
   // Load heavy data only when needed
   class Task {
     get metadata() {
       if (!this._metadata) {
         this._metadata = this._loadMetadata();
       }
       return this._metadata;
     }
   }
   ```

3. **Batch Operations**
   ```javascript
   // Batch multiple updates into single operation
   async function batchUpdateSubtasks(updates) {
     const todoData = await readTodo();
     
     for (const update of updates) {
       // Apply all updates in memory
       applyUpdate(todoData, update);
     }
     
     // Single write operation
     await writeTodo(todoData);
   }
   ```

### Security Best Practices

1. **Validate All Inputs**
   ```javascript
   function validateTaskInput(taskData) {
     // Sanitize string fields
     if (taskData.title) {
       taskData.title = sanitizeHtml(taskData.title);
     }
     
     // Validate against schema
     const validation = validateSchema(taskData, TASK_SCHEMA);
     if (!validation.valid) {
       throw new Error('Invalid task data');
     }
     
     return taskData;
   }
   ```

2. **Implement Access Controls**
   ```javascript
   function canModifyTask(task, agent) {
     // Check agent permissions
     if (task.assigned_agent && task.assigned_agent !== agent.id) {
       return false;
     }
     
     // Check task-specific rules
     if (task.status === 'completed' && !agent.canModifyCompleted) {
       return false;
     }
     
     return true;
   }
   ```

3. **Audit All Changes**
   ```javascript
   function auditTaskChange(taskId, changes, agent) {
     const auditEntry = {
       timestamp: new Date().toISOString(),
       taskId,
       agentId: agent.id,
       changes: sanitizeAuditData(changes),
       operation: 'task_update'
     };
     
     writeAuditLog(auditEntry);
   }
   ```

### Documentation Best Practices

1. **Document Schema Changes**
   ```markdown
   ## Schema Version 2.1.0
   
   ### Added
   - `metadata.performance_tracking` for task performance metrics
   - `subtasks[].automation_config` for automation settings
   
   ### Changed
   - `success_criteria` now supports both string and object formats
   
   ### Deprecated
   - `legacy_field` will be removed in version 3.0.0
   ```

2. **Provide Migration Examples**
   ```javascript
   // Example migration from v1.0 to v2.0
   function migrateTaskSchema(task) {
     // Add required fields
     if (!task.metadata) {
       task.metadata = {
         schema_version: '2.0.0',
         migrated_at: new Date().toISOString()
       };
     }
     
     // Migrate subtasks
     if (task.subtasks) {
       task.subtasks.forEach(subtask => {
         if (!subtask.parent_task_id) {
           subtask.parent_task_id = task.id;
         }
       });
     }
     
     return task;
   }
   ```

3. **Include Practical Examples**
   ```javascript
   // Real-world usage example
   const authTask = {
     title: "Implement OAuth2 authentication",
     category: "feature",
     priority: "high",
     research_config: {
       keywords: ["OAuth2 Node.js", "JWT security"],
       min_sources: 5
     }
   };
   
   const taskId = await taskManager.createTask(authTask);
   ```

---

## Conclusion

This comprehensive schema documentation provides a complete guide to implementing and using the enhanced embedded subtasks and success criteria system. The schema is designed to be:

- **Backward Compatible**: Existing TODO.json files continue to work
- **Progressively Enhanced**: New features can be adopted gradually
- **Performance Optimized**: Efficient data structures and query patterns
- **Thoroughly Validated**: Comprehensive validation and integrity checking
- **Well Documented**: Clear examples and best practices

### Implementation Checklist

- [ ] Review schema documentation thoroughly
- [ ] Plan migration strategy for existing data
- [ ] Implement enhanced TaskManager API endpoints
- [ ] Set up validation framework
- [ ] Create comprehensive test suite
- [ ] Document API changes and migration procedures
- [ ] Train development team on new schema features
- [ ] Deploy enhanced system with monitoring

### Next Steps

1. **Pilot Implementation**: Test enhanced schema with small subset of tasks
2. **Performance Validation**: Benchmark new system against current implementation
3. **Migration Testing**: Validate migration procedures with production data copies
4. **Documentation Completion**: Finalize API documentation and user guides
5. **Production Deployment**: Roll out enhanced system with monitoring and rollback capabilities

The enhanced schema provides a solid foundation for scalable, maintainable task management with embedded subtasks and comprehensive success criteria validation.