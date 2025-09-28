# Custom Project Validation Rules System

## Overview

The Custom Project Validation Rules system allows projects to define project-specific validation criteria beyond the standard stop-hook validation (linter, build, test). This powerful system supports custom commands, file checks, and conditional validation rules based on project type and technology stack.

## Features

- **Flexible Rule Types**: Command execution, file existence, file content validation, conditional rules, and composite rules
- **Technology Stack Detection**: Automatic detection of project technologies (Node.js, Python, Go, Rust, Docker, etc.)
- **Project Type Inference**: Automatic classification (frontend, backend, infrastructure, generic)
- **Conditional Execution**: Rules that execute based on project state or environment
- **Parallel Execution**: Optimize validation performance with intelligent parallel execution
- **Analytics and Monitoring**: Track rule execution performance and success rates
- **Integration**: Seamless integration with existing stop-hook validation system

## Configuration File: `.validation-rules.json`

Place this file in your project root to define custom validation rules:

```json
{
  "project_type": "backend",
  "global_settings": {
    "timeout_default": 30000,
    "allow_failures": false,
    "parallel_execution": true
  },
  "custom_rules": {
    "security_audit": {
      "type": "command",
      "description": "Run comprehensive security audit",
      "command": "npm audit --audit-level=high",
      "priority": "high",
      "requires_tech_stack": "nodejs",
      "category": "security"
    },
    "documentation_check": {
      "type": "file_exists",
      "description": "Ensure required documentation exists",
      "files": ["README.md", "CHANGELOG.md", "docs/api.md"],
      "priority": "normal"
    },
    "no_debug_code": {
      "type": "file_content",
      "description": "Ensure no debug statements in production code",
      "file": "src/**/*.js",
      "pattern": "(console\\.log|debugger;)",
      "should_match": false
    },
    "environment_specific": {
      "type": "conditional",
      "description": "Run additional checks for production environment",
      "condition": {
        "type": "environment_var",
        "variable": "NODE_ENV",
        "value": "production"
      },
      "rules": [
        {
          "type": "command",
          "command": "npm audit --production --audit-level=high"
        }
      ]
    },
    "comprehensive_checks": {
      "type": "composite",
      "description": "Run multiple code quality checks",
      "operator": "and",
      "rules": [
        {
          "type": "command",
          "command": "npm run lint"
        },
        {
          "type": "command",
          "command": "npm run test:coverage"
        }
      ]
    }
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

### Load and Manage Custom Rules

```bash
# Load custom validation rules from configuration
timeout 10s node "/path/to/taskmanager-api.js" load-custom-validation-rules

# Get all custom validation rules with status
timeout 10s node "/path/to/taskmanager-api.js" get-custom-validation-rules

# Execute specific custom validation rule
timeout 10s node "/path/to/taskmanager-api.js" execute-custom-validation-rule <ruleId>

# Execute all enabled custom validation rules
timeout 10s node "/path/to/taskmanager-api.js" execute-all-custom-validation-rules

# Generate example configuration file
timeout 10s node "/path/to/taskmanager-api.js" generate-custom-validation-config

# Get execution analytics and performance metrics
timeout 10s node "/path/to/taskmanager-api.js" get-custom-validation-analytics
```

### Integration with Stop Hook Validation

Custom rules integrate seamlessly with the existing stop-hook validation system and can be executed alongside standard validation criteria.

## Examples

### Frontend React Application

```json
{
  "project_type": "frontend",
  "custom_rules": {
    "bundle_size_check": {
      "type": "command",
      "description": "Validate bundle size is under limit",
      "command": "npm run analyze:bundle",
      "requires_tech_stack": ["nodejs", "frontend"],
      "category": "performance"
    },
    "accessibility_audit": {
      "type": "command",
      "description": "Run accessibility compliance tests",
      "command": "npm run test:a11y",
      "requires_tech_stack": "nodejs",
      "category": "quality"
    },
    "webpack_config_check": {
      "type": "file_exists",
      "description": "Ensure webpack configuration exists",
      "files": ["webpack.config.js", "src/index.js"],
      "requires_tech_stack": "frontend"
    }
  }
}
```

### Backend API Server

```json
{
  "project_type": "backend",
  "custom_rules": {
    "security_audit": {
      "type": "command",
      "description": "Run security audit on dependencies",
      "command": "npm audit --audit-level=high",
      "requires_tech_stack": "nodejs",
      "category": "security"
    },
    "database_migration_check": {
      "type": "command",
      "description": "Validate database migrations",
      "command": "npm run db:validate",
      "requires_tech_stack": "nodejs"
    },
    "api_documentation": {
      "type": "file_exists",
      "description": "Ensure API documentation exists",
      "files": ["docs/api.md", "swagger.json"],
      "category": "documentation"
    },
    "production_config": {
      "type": "conditional",
      "description": "Production-specific validations",
      "condition": {
        "type": "environment_var",
        "variable": "NODE_ENV",
        "value": "production"
      },
      "rules": [
        {
          "type": "file_exists",
          "files": [".env.production"]
        },
        {
          "type": "command",
          "command": "npm run build"
        }
      ]
    }
  }
}
```

## Rule Types Reference

### 1. Command Rules (`type: "command"`)

Execute shell commands and validate their success.

**Options:**

- `command`: Shell command to execute
- `working_directory`: Directory to execute command in
- `environment`: Additional environment variables
- `allow_failure`: Whether to continue if command fails

### 2. File Existence Rules (`type: "file_exists"`)

Validate that required files exist.

**Options:**

- `files`: Array of file paths (supports glob patterns)
- `allow_failure`: Whether to continue if files are missing

### 3. File Content Rules (`type: "file_content"`)

Validate file contents against patterns.

**Options:**

- `file`: File path to check
- `pattern`: Regular expression pattern
- `should_match`: Whether pattern should be found (true) or absent (false)
- `flags`: Regex flags (i, g, m, etc.)

### 4. Conditional Rules (`type: "conditional"`)

Execute rules based on conditions.

**Condition Types:**

- `tech_stack`: Check if technology is detected
- `project_type`: Check project type
- `file_exists`: Check if file exists
- `environment_var`: Check environment variable
- `command_succeeds`: Check if command succeeds

### 5. Composite Rules (`type: "composite"`)

Combine multiple rules with logical operators.

**Options:**

- `operator`: "and" (all must pass) or "or" (any can pass)
- `rules`: Array of sub-rules to execute

## Technology Stack Detection

The system automatically detects technologies based on file patterns:

| Technology | Detection Files                                    |
| ---------- | -------------------------------------------------- |
| Node.js    | `package.json`, `npm-shrinkwrap.json`, `yarn.lock` |
| Python     | `requirements.txt`, `setup.py`, `pyproject.toml`   |
| Go         | `go.mod`, `go.sum`                                 |
| Rust       | `Cargo.toml`, `Cargo.lock`                         |
| Docker     | `Dockerfile`, `docker-compose.yml`                 |
| Frontend   | `webpack.config.js`, `vite.config.js`              |

## Integration with Existing System

The Custom Validation Rules system integrates seamlessly with the existing stop-hook validation infrastructure:

- **CLI Integration**: All commands available through TaskManager API
- **Dependency Management**: Works with existing ValidationDependencyManager
- **Parallel Execution**: Supports intelligent parallel execution planning
- **Analytics**: Comprehensive execution tracking and performance metrics
- **Error Handling**: Consistent error reporting and logging

## Best Practices

1. **Use Technology Stack Requirements**: Ensure rules only run on appropriate projects
2. **Set Reasonable Timeouts**: Balance thoroughness with performance
3. **Enable Parallelization**: Mark independent rules as parallelizable
4. **Provide Clear Descriptions**: Help developers understand rule purposes
5. **Test Rule Configurations**: Validate rules work in different environments

## Troubleshooting

### Common Issues

1. **Rules Not Loading**: Check JSON syntax and file permissions
2. **Rules Not Executing**: Verify technology stack and project type requirements
3. **Command Failures**: Check command syntax and system permissions
4. **Performance Issues**: Enable parallelization and optimize command execution

This comprehensive custom validation system provides the flexibility needed for diverse project types while maintaining security and performance standards.
