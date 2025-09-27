# Stop Hook Custom Project Validation Rules

## Overview

Feature 2 enables projects to define custom validation rules through configuration files, extending beyond standard validation criteria (linter, build, test). This provides flexibility for diverse project types and specific validation requirements.

## Configuration File: `.claude-validation.json`

Place this file in your project root to define custom validation rules:

```json
{
  "version": "1.0.0",
  "projectType": "web-application",
  "customValidationRules": [
    {
      "id": "docker-security-scan",
      "name": "Docker Security Scan",
      "description": "Scan Docker images for vulnerabilities",
      "command": "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image my-app:latest",
      "enabled": true,
      "timeout": 60000,
      "category": "security",
      "conditions": {
        "fileExists": ["Dockerfile", "docker-compose.yml"],
        "envVars": ["DOCKER_SCAN_ENABLED"],
        "projectType": ["web-application", "microservice"]
      },
      "successCriteria": {
        "exitCode": 0,
        "outputContains": ["No vulnerabilities found"],
        "outputNotContains": ["CRITICAL", "HIGH"]
      },
      "failureHandling": {
        "retryCount": 2,
        "retryDelay": 5000,
        "continueOnFailure": false
      }
    },
    {
      "id": "api-documentation-check",
      "name": "API Documentation Validation",
      "description": "Ensure all API endpoints are documented",
      "command": "npm run docs:validate",
      "enabled": true,
      "timeout": 30000,
      "category": "documentation",
      "conditions": {
        "fileExists": ["package.json"],
        "scriptExists": ["docs:validate"],
        "directoryExists": ["src/api", "routes"]
      },
      "successCriteria": {
        "exitCode": 0,
        "outputContains": ["All endpoints documented"]
      }
    },
    {
      "id": "performance-benchmarks",
      "name": "Performance Benchmark Tests",
      "description": "Run performance tests and validate benchmarks",
      "command": "npm run test:performance",
      "enabled": true,
      "timeout": 120000,
      "category": "performance",
      "conditions": {
        "environmentVar": "RUN_PERFORMANCE_TESTS",
        "fileExists": ["performance/benchmarks.js"]
      },
      "successCriteria": {
        "exitCode": 0,
        "outputMatches": ["Response time: \\d+ms < 500ms"]
      }
    },
    {
      "id": "license-compliance",
      "name": "License Compliance Check",
      "description": "Verify all dependencies have compatible licenses",
      "command": "npx license-checker --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause'",
      "enabled": true,
      "timeout": 45000,
      "category": "compliance",
      "conditions": {
        "fileExists": ["package.json"]
      },
      "successCriteria": {
        "exitCode": 0
      }
    }
  ],
  "validationGroups": [
    {
      "name": "Security Validation",
      "rules": ["docker-security-scan", "license-compliance"],
      "runInParallel": true,
      "description": "Security-related validation rules"
    },
    {
      "name": "Quality Assurance",
      "rules": ["api-documentation-check", "performance-benchmarks"],
      "runInParallel": false,
      "description": "Quality and performance validation rules"
    }
  ],
  "globalSettings": {
    "maxConcurrentRules": 3,
    "defaultTimeout": 60000,
    "enableCaching": true,
    "cacheExpiryMinutes": 30,
    "logLevel": "info"
  }
}
```

## Rule Schema

### Basic Rule Structure

```json
{
  "id": "unique-rule-identifier",
  "name": "Human-readable rule name",
  "description": "Detailed description of what this rule validates",
  "command": "shell command to execute",
  "enabled": true,
  "timeout": 60000,
  "category": "security|performance|compliance|documentation|quality"
}
```

### Conditional Execution

Rules can be conditionally executed based on project state:

```json
{
  "conditions": {
    "fileExists": ["Dockerfile", "package.json"],
    "directoryExists": ["src", "tests"],
    "scriptExists": ["test", "build"],
    "envVars": ["NODE_ENV", "API_KEY"],
    "environmentVar": "RUN_CUSTOM_TESTS",
    "projectType": ["web-application", "library", "microservice"],
    "gitBranch": ["main", "production"],
    "fileContains": {
      "package.json": ["\"type\": \"module\""],
      "README.md": ["## API Documentation"]
    }
  }
}
```

### Success Criteria

Define what constitutes a successful validation:

```json
{
  "successCriteria": {
    "exitCode": 0,
    "outputContains": ["All tests passed", "Build successful"],
    "outputNotContains": ["ERROR", "FAIL", "CRITICAL"],
    "outputMatches": ["Coverage: \\d+%", "Response time: \\d+ms"],
    "fileExists": ["dist/bundle.js", "coverage/lcov.info"],
    "fileContains": {
      "coverage/coverage-summary.json": ["\"total\":{\"lines\":{\"pct\":8"]
    }
  }
}
```

### Failure Handling

Configure retry behavior and failure handling:

```json
{
  "failureHandling": {
    "retryCount": 3,
    "retryDelay": 5000,
    "continueOnFailure": false,
    "escalationCommand": "npm run fix:lint",
    "notificationWebhook": "https://slack.com/webhook/...",
    "logFailureDetails": true
  }
}
```

## Project Types

Predefined project types for conditional rule execution:

- `web-application`: Frontend web applications
- `api-server`: Backend API servers
- `microservice`: Microservice applications
- `library`: Reusable libraries/packages
- `mobile-app`: Mobile applications
- `desktop-app`: Desktop applications
- `cli-tool`: Command-line tools
- `documentation`: Documentation projects

## CLI Commands

### Manage Custom Validation Rules

```bash
# List all custom validation rules
timeout 10s node taskmanager-api.js list-custom-rules

# Get specific custom rule details
timeout 10s node taskmanager-api.js get-custom-rule <ruleId>

# Test custom rule execution
timeout 10s node taskmanager-api.js test-custom-rule <ruleId>

# Validate custom rules configuration
timeout 10s node taskmanager-api.js validate-custom-config

# Run all custom rules
timeout 10s node taskmanager-api.js run-custom-rules

# Run specific custom rule group
timeout 10s node taskmanager-api.js run-custom-group <groupName>
```

### Integration with Stop Hook Validation

Custom rules are automatically integrated into the stop hook validation process:

```bash
# Custom rules are included in standard validation
timeout 10s node taskmanager-api.js validate-criterion <authKey> custom-validation

# Or run custom rules as part of parallel validation
timeout 10s node taskmanager-api.js validate-criteria-parallel <authKey>
```

## Examples

### Frontend React Application

```json
{
  "projectType": "web-application",
  "customValidationRules": [
    {
      "id": "bundle-size-check",
      "name": "Bundle Size Validation",
      "command": "npm run analyze:bundle",
      "conditions": {
        "fileExists": ["webpack.config.js", "package.json"]
      },
      "successCriteria": {
        "outputMatches": ["Bundle size: \\d+KB < 500KB"]
      }
    },
    {
      "id": "accessibility-audit",
      "name": "Accessibility Compliance",
      "command": "npm run test:a11y",
      "conditions": {
        "scriptExists": ["test:a11y"]
      },
      "successCriteria": {
        "exitCode": 0,
        "outputContains": ["0 accessibility violations"]
      }
    }
  ]
}
```

### Backend API Server

```json
{
  "projectType": "api-server",
  "customValidationRules": [
    {
      "id": "api-health-check",
      "name": "API Health Validation",
      "command": "curl -f http://localhost:3000/health",
      "conditions": {
        "envVars": ["PORT"]
      },
      "successCriteria": {
        "exitCode": 0,
        "outputContains": ["\"status\":\"healthy\""]
      }
    },
    {
      "id": "database-migration-check",
      "name": "Database Migration Validation",
      "command": "npm run db:validate",
      "conditions": {
        "fileExists": ["migrations/", "knexfile.js"]
      },
      "successCriteria": {
        "exitCode": 0,
        "outputContains": ["All migrations applied"]
      }
    }
  ]
}
```

## Integration with Validation Dependency System

Custom rules integrate with Feature 1's dependency management:

- Custom rules can declare dependencies on standard validation criteria
- Custom rules can be grouped and executed in parallel where appropriate
- Resource conflict detection prevents resource-intensive custom rules from running simultaneously

## Security Considerations

- Commands are executed in sandboxed environment
- Environment variable access is controlled
- File system access is limited to project directory
- Network access can be restricted via configuration
- All command execution is logged for audit purposes

## Performance Optimization

- Rule execution is cached based on file changes
- Conditional execution prevents unnecessary rule runs
- Parallel execution groups optimize total validation time
- Resource usage monitoring prevents system overload

## Error Handling and Debugging

- Detailed logging of rule execution
- Failure reason categorization
- Retry mechanisms for transient failures
- Integration with validation audit trail (Feature 5)
- Performance metrics tracking (Feature 3)

This comprehensive custom validation system provides the flexibility needed for diverse project types while maintaining security and performance standards.