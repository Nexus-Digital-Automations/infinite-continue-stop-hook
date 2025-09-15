# Success Criteria Configuration Manual

**Version**: 1.0.0  
**Date**: 2025-09-15  
**Author**: Documentation Agent #5  

## Overview

This manual provides comprehensive guidance for configuring the Success Criteria System, including template customization, inheritance rules, validation workflows, and performance optimization. Use this guide to tailor the system to your project's specific requirements.

## Configuration Files

### Primary Configuration

#### success-criteria-config.json
Location: `project-root/success-criteria-config.json`

```json
{
  "version": "1.0.0",
  "default_template": "25_point_standard",
  "validation_timeout": 1800,
  "evidence_storage": "development/evidence/",
  "report_storage": "development/reports/success-criteria/",
  "auto_inheritance": true,
  "mandatory_validation": true,
  "performance_optimization": {
    "cache_ttl": {
      "templates": 3600,
      "validation_results": 86400,
      "project_criteria": 14400
    },
    "async_validation_threshold": 10,
    "max_concurrent_validations": 5
  },
  "validation_agents": {
    "automated": ["linter", "build", "test", "security_scan"],
    "manual": ["documentation_review", "architecture_review", "security_review"],
    "hybrid": ["performance_test", "integration_test"]
  },
  "notification_settings": {
    "enabled": true,
    "channels": ["webhook", "agent_notification"],
    "webhook_url": "https://api.project.com/webhooks/criteria",
    "alert_thresholds": {
      "validation_failure_rate": 0.1,
      "validation_timeout_rate": 0.05,
      "criteria_conflict_rate": 0.02
    }
  },
  "security_settings": {
    "evidence_encryption": true,
    "audit_logging": true,
    "access_control": "agent_based",
    "retention_policy": {
      "evidence_files": "90_days",
      "validation_results": "1_year",
      "audit_logs": "3_years"
    }
  }
}
```

### Template Configuration

#### Template Definition Structure
Location: `development/essentials/success-criteria.md` or custom template files

```markdown
# Custom Template: Enhanced Security Template

## Template Metadata
- **ID**: enhanced_security_v2
- **Version**: 2.1.0
- **Description**: Enhanced security requirements for sensitive features
- **Applicable Categories**: feature, subtask
- **Effective Date**: 2025-09-15
- **Review Schedule**: quarterly

## Core Criteria (Points 1-15)

### 1. **Security Input Validation**
- [ ] All user inputs validated server-side
- [ ] Input sanitization implemented
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- **Evidence**: Security test results and code review
- **Validation Method**: automated + manual
- **Priority**: critical
- **Estimated Effort**: 2-4 hours

### 2. **Authentication Security**
- [ ] Strong password requirements enforced
- [ ] Multi-factor authentication supported
- [ ] Session management secure
- [ ] Password storage uses proper hashing
- **Evidence**: Authentication flow testing
- **Validation Method**: manual
- **Priority**: critical
- **Estimated Effort**: 1-2 hours
```

#### Template Inheritance Configuration

```json
{
  "template_inheritance": {
    "base_template": "25_point_standard",
    "inheritance_strategy": "append|override|merge",
    "custom_additions": [
      {
        "position": "after_criterion_5",
        "criteria": [
          {
            "id": "custom_security_1",
            "category": "security",
            "title": "Custom Security Requirement"
          }
        ]
      }
    ],
    "modifications": [
      {
        "criterion_id": 11,
        "modifications": {
          "priority": "critical",
          "acceptance_threshold": "100% compliance required"
        }
      }
    ],
    "disabled_criteria": [22, 23, 24]
  }
}
```

### Project-Wide Criteria Configuration

#### Global Criteria Sets
Location: `project-criteria-config.json`

```json
{
  "project_wide_criteria": {
    "security_baseline_v3": {
      "description": "Enhanced security requirements for Q4 2025",
      "version": "3.0.0",
      "effective_date": "2025-09-15T00:00:00Z",
      "review_date": "2025-12-15T00:00:00Z",
      "applies_to": {
        "task_categories": ["feature", "subtask"],
        "task_patterns": ["auth_*", "*_security_*", "*_payment_*"],
        "exclude_categories": ["test", "documentation"],
        "exclude_patterns": ["test_*", "demo_*"]
      },
      "criteria": [
        {
          "id": "security_scan_requirement",
          "category": "security",
          "title": "Automated Security Scanning",
          "description": "All code must pass automated security scans",
          "requirements": [
            "SAST scan completed with no critical issues",
            "Dependency scan shows no known vulnerabilities",
            "Container security scan passed (if applicable)",
            "Secrets detection scan clean"
          ],
          "evidence_required": "Security scan reports",
          "validation_method": "automated",
          "priority": "critical",
          "acceptance_threshold": "100% pass rate",
          "estimated_effort": "15-30 minutes"
        }
      ],
      "inheritance_rules": {
        "mandatory": true,
        "allow_override": false,
        "merge_strategy": "append",
        "conflict_resolution": "project_wide_takes_precedence",
        "notification_required": true
      }
    },
    "performance_baseline_v2": {
      "description": "Performance standards for all user-facing features",
      "applies_to": {
        "task_categories": ["feature"],
        "has_tags": ["user_facing", "api_endpoint", "ui_component"]
      },
      "criteria": [
        {
          "id": "response_time_requirement",
          "category": "performance",
          "title": "Response Time Standards",
          "requirements": [
            "API endpoints respond within 500ms (95th percentile)",
            "UI components render within 200ms",
            "Database queries complete within 100ms",
            "No performance regressions from baseline"
          ],
          "validation_method": "automated",
          "acceptance_threshold": "All timing requirements met"
        }
      ],
      "inheritance_rules": {
        "mandatory": false,
        "allow_override": true,
        "override_justification_required": true
      }
    }
  }
}
```

## Validation Workflow Configuration

### Automated Validation Setup

#### Validation Tool Configuration
```json
{
  "automated_validation_tools": {
    "linter": {
      "tools": [
        {
          "name": "eslint",
          "command": "npx eslint {files}",
          "config_file": ".eslintrc.json",
          "success_exit_codes": [0],
          "timeout": 120,
          "retry_count": 2
        },
        {
          "name": "ruff",
          "command": "ruff check {files}",
          "file_patterns": ["*.py"],
          "success_exit_codes": [0],
          "timeout": 60
        }
      ],
      "evidence_collection": {
        "capture_stdout": true,
        "capture_stderr": true,
        "save_to_file": true,
        "file_format": "json"
      }
    },
    "build": {
      "tools": [
        {
          "name": "npm_build",
          "command": "npm run build",
          "working_directory": "project_root",
          "environment_variables": {
            "NODE_ENV": "production"
          },
          "success_exit_codes": [0],
          "timeout": 300
        }
      ]
    },
    "test": {
      "tools": [
        {
          "name": "jest",
          "command": "npm test",
          "coverage_requirement": 80,
          "timeout": 600,
          "parallel_execution": true
        }
      ]
    },
    "security": {
      "tools": [
        {
          "name": "npm_audit",
          "command": "npm audit --audit-level=high",
          "success_exit_codes": [0],
          "timeout": 120
        },
        {
          "name": "snyk",
          "command": "snyk test",
          "api_key_env": "SNYK_TOKEN",
          "timeout": 180
        }
      ]
    }
  }
}
```

### Manual Review Workflow Configuration

#### Review Assignment Rules
```json
{
  "manual_review_configuration": {
    "review_assignment_rules": [
      {
        "criteria_category": "security",
        "required_agent_roles": ["security_agent", "senior_developer"],
        "minimum_reviewers": 1,
        "review_timeout": 7200,
        "escalation_rules": {
          "timeout_escalation": "project_manager",
          "conflict_escalation": "technical_lead"
        }
      },
      {
        "criteria_category": "architecture",
        "required_agent_roles": ["architect", "technical_lead"],
        "minimum_reviewers": 1,
        "review_timeout": 3600
      },
      {
        "criteria_category": "documentation",
        "required_agent_roles": ["documentation_agent", "senior_developer"],
        "minimum_reviewers": 1,
        "review_timeout": 1800
      }
    ],
    "review_workflow": {
      "assignment_strategy": "round_robin|least_loaded|expertise_based",
      "notification_channels": ["agent_notification", "email"],
      "review_templates": {
        "security_review": "development/templates/security_review_template.md",
        "architecture_review": "development/templates/architecture_review_template.md"
      }
    }
  }
}
```

#### Review Templates
Location: `development/templates/security_review_template.md`

```markdown
# Security Review Template

## Task Information
- **Task ID**: {task_id}
- **Task Title**: {task_title}
- **Review Requested**: {review_date}
- **Reviewer**: {reviewer_agent_id}

## Security Criteria Checklist

### Input Validation
- [ ] All user inputs properly validated
- [ ] Input sanitization implemented
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

**Evidence Review**:
- Security test results: {evidence_link}
- Code review findings: {code_review_link}

**Comments**:
```

## Performance Optimization Configuration

### Caching Configuration

```json
{
  "cache_configuration": {
    "cache_backend": "redis|memory|file",
    "cache_settings": {
      "redis": {
        "host": "localhost",
        "port": 6379,
        "database": 0,
        "password": "${REDIS_PASSWORD}",
        "key_prefix": "success_criteria:"
      }
    },
    "cache_policies": {
      "templates": {
        "ttl": 3600,
        "max_size": "10MB",
        "eviction_policy": "LRU"
      },
      "validation_results": {
        "ttl": 86400,
        "max_size": "100MB",
        "compression": true
      },
      "project_criteria": {
        "ttl": 14400,
        "invalidation_triggers": ["project_config_change"]
      }
    }
  }
}
```

### Asynchronous Processing Configuration

```json
{
  "async_processing": {
    "queue_backend": "redis|memory|database",
    "worker_configuration": {
      "max_concurrent_jobs": 10,
      "job_timeout": 3600,
      "retry_policy": {
        "max_retries": 3,
        "retry_delay": 60,
        "exponential_backoff": true
      }
    },
    "job_prioritization": {
      "critical_criteria": 1,
      "important_criteria": 2,
      "nice_to_have_criteria": 3
    },
    "notification_settings": {
      "job_completion": true,
      "job_failure": true,
      "queue_status": true
    }
  }
}
```

## Advanced Configuration Options

### Custom Validation Methods

#### Plugin System Configuration
```json
{
  "validation_plugins": {
    "custom_performance_validator": {
      "plugin_path": "lib/validation-plugins/performance-validator.js",
      "configuration": {
        "benchmark_endpoints": ["/api/health", "/api/status"],
        "load_test_duration": 60,
        "concurrent_users": 100
      },
      "criteria_mappings": ["performance.*response_time", "performance.*throughput"]
    },
    "custom_accessibility_validator": {
      "plugin_path": "lib/validation-plugins/accessibility-validator.js",
      "configuration": {
        "wcag_level": "AA",
        "automated_tools": ["axe-core", "lighthouse"],
        "manual_checklist": true
      }
    }
  }
}
```

#### Custom Validator Implementation Example
```javascript
// lib/validation-plugins/performance-validator.js
class CustomPerformanceValidator {
  constructor(config) {
    this.config = config;
    this.benchmarkEndpoints = config.benchmark_endpoints;
    this.loadTestDuration = config.load_test_duration;
  }

  async validate(criterion, evidence) {
    const results = {
      criterion_id: criterion.id,
      status: 'pending',
      evidence: {},
      validation_notes: []
    };

    try {
      // Run performance benchmarks
      const benchmarkResults = await this.runBenchmarks();
      results.evidence.benchmarks = benchmarkResults;

      // Evaluate against criteria requirements
      const evaluation = this.evaluatePerformance(criterion, benchmarkResults);
      results.status = evaluation.passed ? 'passed' : 'failed';
      results.validation_notes = evaluation.notes;

      return results;
    } catch (error) {
      results.status = 'failed';
      results.validation_notes.push(`Validation failed: ${error.message}`);
      return results;
    }
  }

  async runBenchmarks() {
    // Implementation details for running performance benchmarks
    // Return structured performance data
  }

  evaluatePerformance(criterion, benchmarkResults) {
    // Implementation details for evaluating results against criteria
    // Return pass/fail decision with detailed notes
  }
}

module.exports = CustomPerformanceValidator;
```

### Integration Configuration

#### External Tool Integration
```json
{
  "external_integrations": {
    "sonarqube": {
      "enabled": true,
      "base_url": "https://sonarqube.company.com",
      "project_key": "${PROJECT_KEY}",
      "authentication": {
        "type": "token",
        "token_env": "SONARQUBE_TOKEN"
      },
      "quality_gates": {
        "reliability_rating": "A",
        "security_rating": "A",
        "maintainability_rating": "A",
        "coverage": 80
      }
    },
    "jira": {
      "enabled": true,
      "base_url": "https://company.atlassian.net",
      "authentication": {
        "type": "oauth",
        "client_id_env": "JIRA_CLIENT_ID",
        "client_secret_env": "JIRA_CLIENT_SECRET"
      },
      "issue_tracking": {
        "create_issues_for_failures": true,
        "issue_type": "Bug",
        "project_key": "PROJ"
      }
    },
    "slack": {
      "enabled": true,
      "webhook_url_env": "SLACK_WEBHOOK_URL",
      "notification_triggers": [
        "validation_failure",
        "criteria_conflict",
        "manual_review_required"
      ],
      "channels": {
        "general_notifications": "#dev-notifications",
        "security_alerts": "#security-alerts",
        "critical_failures": "#critical-alerts"
      }
    }
  }
}
```

#### Webhook Configuration
```json
{
  "webhook_configuration": {
    "endpoints": [
      {
        "name": "validation_completed",
        "url": "https://api.project.com/webhooks/validation-completed",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer ${WEBHOOK_TOKEN}",
          "Content-Type": "application/json"
        },
        "payload_template": {
          "task_id": "{task_id}",
          "validation_status": "{overall_status}",
          "completion_time": "{completion_timestamp}",
          "criteria_summary": "{criteria_summary}"
        },
        "retry_policy": {
          "max_retries": 3,
          "retry_delay": 30
        }
      }
    ]
  }
}
```

## Environment-Specific Configuration

### Development Environment
```json
{
  "environment": "development",
  "configuration_overrides": {
    "validation_timeout": 300,
    "mandatory_validation": false,
    "debug_logging": true,
    "cache_ttl": {
      "templates": 60,
      "validation_results": 300
    },
    "notification_settings": {
      "enabled": false
    },
    "external_integrations": {
      "sonarqube": {"enabled": false},
      "jira": {"enabled": false}
    }
  }
}
```

### Staging Environment
```json
{
  "environment": "staging",
  "configuration_overrides": {
    "validation_timeout": 900,
    "mandatory_validation": true,
    "external_integrations": {
      "sonarqube": {"enabled": true},
      "jira": {"enabled": false}
    },
    "notification_settings": {
      "channels": ["webhook"]
    }
  }
}
```

### Production Environment
```json
{
  "environment": "production",
  "configuration_overrides": {
    "validation_timeout": 1800,
    "mandatory_validation": true,
    "performance_optimization": {
      "max_concurrent_validations": 10,
      "cache_ttl": {
        "templates": 7200,
        "validation_results": 172800
      }
    },
    "security_settings": {
      "evidence_encryption": true,
      "audit_logging": true,
      "retention_policy": {
        "evidence_files": "365_days",
        "validation_results": "3_years"
      }
    }
  }
}
```

## Configuration Management

### Configuration Validation

```bash
# Validate configuration files
timeout 10s node taskmanager-api.js validate-config --config-file=success-criteria-config.json

# Test configuration with dry run
timeout 10s node taskmanager-api.js test-config --dry-run --verbose

# Export current configuration
timeout 10s node taskmanager-api.js export-config --format=json --output=current-config.json
```

### Configuration Migration

```bash
# Migrate from older configuration version
timeout 10s node taskmanager-api.js migrate-config --from-version=1.0.0 --to-version=1.1.0

# Backup current configuration
timeout 10s node taskmanager-api.js backup-config --output=config-backup-$(date +%Y%m%d).json

# Restore configuration from backup
timeout 10s node taskmanager-api.js restore-config --backup-file=config-backup-20250915.json
```

### Environment Variable Reference

```bash
# Core Configuration
export SUCCESS_CRITERIA_CONFIG_PATH="/path/to/success-criteria-config.json"
export SUCCESS_CRITERIA_LOG_LEVEL="info"
export SUCCESS_CRITERIA_CACHE_BACKEND="redis"

# Database Configuration
export SUCCESS_CRITERIA_DB_URL="postgresql://user:pass@localhost/criteria_db"
export SUCCESS_CRITERIA_EVIDENCE_STORAGE="/path/to/evidence/storage"

# External Service Configuration
export SONARQUBE_TOKEN="your_sonarqube_token"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/your_webhook"
export JIRA_CLIENT_ID="your_jira_client_id"
export JIRA_CLIENT_SECRET="your_jira_client_secret"

# Security Configuration
export SUCCESS_CRITERIA_ENCRYPTION_KEY="your_encryption_key"
export SUCCESS_CRITERIA_JWT_SECRET="your_jwt_secret"
```

## Troubleshooting Configuration Issues

### Common Configuration Problems

1. **Invalid JSON Syntax**
   ```bash
   # Validate JSON syntax
   timeout 10s node taskmanager-api.js validate-json --file=success-criteria-config.json
   ```

2. **Missing Required Fields**
   ```bash
   # Check for required configuration fields
   timeout 10s node taskmanager-api.js check-required-config
   ```

3. **Environment Variable Issues**
   ```bash
   # Test environment variable resolution
   timeout 10s node taskmanager-api.js test-env-vars
   ```

4. **Permission Issues**
   ```bash
   # Check file permissions
   ls -la success-criteria-config.json
   
   # Fix permissions if needed
   chmod 644 success-criteria-config.json
   ```

### Configuration Debugging

```bash
# Enable debug logging
export SUCCESS_CRITERIA_LOG_LEVEL="debug"

# Check configuration loading
timeout 10s node taskmanager-api.js debug-config --verbose

# Test specific configuration sections
timeout 10s node taskmanager-api.js test-config-section --section=validation_tools
timeout 10s node taskmanager-api.js test-config-section --section=external_integrations
```

---

*Configuration Manual v1.0.0*  
*Generated by: Documentation Agent #5*  
*Last Updated: 2025-09-15*