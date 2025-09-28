# Stop Hook Custom Project Validation Rules Guide

## Overview

The Stop Hook Custom Project Validation Rules system provides flexible, project-specific validation criteria that can be configured for different technology stacks and project requirements. This system enables **intelligent project detection** and **conditional validation** based on project type, with support for multiple validation rule types.

## 🚀 Key Features

### ✅ **Multiple Validation Rule Types**

- **Command Rules**: Execute shell commands with configurable timeouts
- **File Existence Rules**: Verify required files are present
- **File Content Rules**: Pattern matching within files using regex
- **Conditional Rules**: Execute rules based on project conditions
- **Composite Rules**: Combine multiple rules with AND/OR logic

### ✅ **Intelligent Project Detection**

- **Technology Stack Detection**: Automatically detects nodejs, python, go, rust, java, docker, and more
- **Project Type Inference**: Determines project characteristics from file patterns
- **Conditional Execution**: Rules only run when applicable to the detected technology stack

### ✅ **Flexible Configuration Management**

- **JSON-based Configuration**: Simple `.validation-rules.json` configuration file
- **Per-Rule Settings**: Individual timeouts, severity levels, and failure handling
- **Global Settings**: Project-wide validation behavior and execution parameters

## 🔧 Core Commands

### **Load Custom Validation Rules**

```bash
timeout 10s node "taskmanager-api.js" load-custom-validation-rules
```

Loads and validates custom rules configuration with project detection.

### **Execute Single Rule**

```bash
timeout 10s node "taskmanager-api.js" execute-custom-validation-rule <rule_id>
```

Executes a specific validation rule by ID.

### **Execute All Rules**

```bash
timeout 10s node "taskmanager-api.js" execute-all-custom-validation-rules
```

Executes all enabled custom validation rules for the detected project type.

### **Get Custom Rules Configuration**

```bash
timeout 10s node "taskmanager-api.js" get-custom-validation-rules
```

Returns current custom validation rules configuration and status.

### **Generate Configuration Template**

```bash
timeout 10s node "taskmanager-api.js" generate-custom-validation-config <project_type>
```

Generates configuration template for specific project types.

### **Get Custom Validation Analytics**

```bash
timeout 10s node "taskmanager-api.js" get-custom-validation-analytics
```

Returns execution statistics and performance metrics for custom rules.

## 📋 Configuration Schema

### **Configuration File Structure**

```json
{
  "project_type": "nodejs",
  "global_settings": {
    "strict_mode": true,
    "timeout_ms": 30000,
    "parallel_execution": true
  },
  "custom_rules": {
    "rule_id": {
      "type": "command|file_exists|file_content|conditional|composite",
      "description": "Human-readable description",
      "enabled": true,
      "technology_stack": ["nodejs", "python"],
      "severity": "error|warning|info",
      "config": {
        /* rule-specific configuration */
      }
    }
  }
}
```

### **Global Settings**

- **strict_mode**: Fail fast on first rule failure
- **timeout_ms**: Default timeout for all rules
- **parallel_execution**: Enable parallel rule execution when possible

## 📝 Rule Type Specifications

### **Command Rules**

Execute shell commands with validation based on exit codes and output.

```json
{
  "type": "command",
  "description": "Run npm security audit",
  "command": "npm audit --audit-level moderate",
  "enabled": true,
  "technology_stack": ["nodejs"],
  "severity": "warning",
  "timeout": 15000,
  "allow_failure": false,
  "working_directory": ".",
  "environment": {
    "NODE_ENV": "production"
  }
}
```

**Properties:**

- **command**: Shell command to execute
- **timeout**: Command-specific timeout in milliseconds
- **allow_failure**: Allow command to fail without stopping validation
- **working_directory**: Directory to execute command in
- **environment**: Additional environment variables

### **File Existence Rules**

Verify that required files exist in the project.

```json
{
  "type": "file_exists",
  "description": "Verify Docker configuration exists",
  "files": ["Dockerfile", "docker-compose.yml"],
  "required": true,
  "technology_stack": ["docker"],
  "severity": "error"
}
```

**Properties:**

- **files**: Array of file paths to check (relative to project root)
- **required**: Whether all files must exist
- **allow_failure**: Continue if files are missing

### **File Content Rules**

Pattern matching within files using regular expressions.

```json
{
  "type": "file_content",
  "description": "Validate package.json has required fields",
  "file": "package.json",
  "pattern": "\"name\":",
  "enabled": true,
  "technology_stack": ["nodejs"],
  "severity": "error",
  "case_sensitive": true,
  "multiline": false
}
```

**Properties:**

- **file**: Target file path (relative to project root)
- **pattern**: Regular expression pattern to search for
- **case_sensitive**: Whether pattern matching is case sensitive
- **multiline**: Enable multiline pattern matching

### **Conditional Rules**

Execute rules only when specific conditions are met.

```json
{
  "type": "conditional",
  "description": "Run tests only if test directory exists",
  "condition": {
    "files_exist": ["test/", "tests/"],
    "has_script": "test",
    "project_type": "nodejs"
  },
  "rules": [
    {
      "type": "command",
      "command": "npm test",
      "timeout": 30000
    }
  ]
}
```

**Condition Types:**

- **files_exist**: Files/directories that must exist
- **has_script**: Package.json script that must be present
- **project_type**: Required project type
- **technology_stack**: Required technology stack elements

### **Composite Rules**

Combine multiple rules with logical operators.

```json
{
  "type": "composite",
  "description": "Docker security validation",
  "operator": "and",
  "rules": [
    {
      "type": "file_exists",
      "files": ["Dockerfile"],
      "required": true
    },
    {
      "type": "file_content",
      "file": "Dockerfile",
      "pattern": "USER ",
      "description": "Dockerfile should use non-root user"
    }
  ]
}
```

**Properties:**

- **operator**: "and" (all must pass) or "or" (any can pass)
- **rules**: Array of sub-rules to execute
- **allow_failure**: Continue if composite rule fails

## 🔍 Technology Stack Detection

### **Supported Technology Stacks**

The system automatically detects project technology stacks based on file patterns:

#### **Node.js Detection**

- Files: `package.json`, `node_modules/`, `*.js`, `*.ts`
- Scripts: npm scripts in package.json
- Dependencies: package.json dependencies

#### **Python Detection**

- Files: `requirements.txt`, `setup.py`, `pyproject.toml`, `*.py`
- Virtual environments: `venv/`, `.venv/`, `env/`
- Package managers: pip, conda, poetry

#### **Go Detection**

- Files: `go.mod`, `go.sum`, `*.go`
- Build files: `Makefile`, build scripts
- Vendor directory: `vendor/`

#### **Rust Detection**

- Files: `Cargo.toml`, `Cargo.lock`, `*.rs`
- Target directory: `target/`
- Workspace files: `Cargo.workspace`

#### **Java Detection**

- Files: `pom.xml`, `build.gradle`, `*.java`
- Build directories: `target/`, `build/`
- Maven/Gradle wrapper scripts

#### **Docker Detection**

- Files: `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- Multi-stage builds and container configurations

## 📊 Rule Execution and Analytics

### **Execution Flow**

1. **Load Configuration**: Parse `.validation-rules.json`
2. **Detect Technology Stack**: Analyze project files and structure
3. **Filter Rules**: Enable only rules matching detected technology stack
4. **Execute Rules**: Run enabled rules according to type and configuration
5. **Collect Results**: Aggregate success/failure status and execution metrics
6. **Generate Report**: Provide detailed execution summary and analytics

### **Performance Metrics**

- **Execution Duration**: Time taken for each rule and overall validation
- **Success Rate**: Percentage of rules passing vs. failing
- **Technology Stack Accuracy**: Correctness of project detection
- **Resource Utilization**: CPU, memory, and I/O usage during validation

### **Example Analytics Output**

```json
{
  "success": true,
  "executed_rules": 3,
  "passed_rules": 2,
  "failed_rules": 1,
  "total_duration": 1250,
  "technology_stack": ["nodejs"],
  "project_type": "nodejs",
  "performance_metrics": {
    "fastest_rule": "package_json_validation (6ms)",
    "slowest_rule": "npm_security_audit (668ms)",
    "average_duration": 416
  }
}
```

## 🔧 Configuration Examples

### **Node.js Project Configuration**

```json
{
  "project_type": "nodejs",
  "global_settings": {
    "strict_mode": true,
    "timeout_ms": 30000,
    "parallel_execution": true
  },
  "custom_rules": {
    "package_json_validation": {
      "type": "file_content",
      "description": "Validate package.json has required fields",
      "file": "package.json",
      "pattern": "\"name\":",
      "enabled": true,
      "technology_stack": ["nodejs"],
      "severity": "error"
    },
    "npm_security_audit": {
      "type": "command",
      "description": "Run npm audit for security vulnerabilities",
      "command": "npm audit --audit-level moderate",
      "enabled": true,
      "technology_stack": ["nodejs"],
      "severity": "warning",
      "timeout": 15000
    },
    "test_coverage_check": {
      "type": "command",
      "description": "Ensure test coverage meets minimum threshold",
      "command": "npm run coverage:check",
      "enabled": true,
      "technology_stack": ["nodejs"],
      "severity": "error",
      "conditions": {
        "files_exist": ["package.json"],
        "has_script": "coverage:check"
      }
    }
  }
}
```

### **Python Project Configuration**

```json
{
  "project_type": "python",
  "global_settings": {
    "strict_mode": false,
    "timeout_ms": 45000,
    "parallel_execution": true
  },
  "custom_rules": {
    "requirements_check": {
      "type": "file_exists",
      "description": "Verify requirements file exists",
      "files": ["requirements.txt", "pyproject.toml"],
      "required": false,
      "technology_stack": ["python"],
      "severity": "warning"
    },
    "python_lint": {
      "type": "command",
      "description": "Run Python linting with flake8",
      "command": "flake8 . --max-line-length=88",
      "enabled": true,
      "technology_stack": ["python"],
      "severity": "error",
      "timeout": 20000,
      "conditions": {
        "files_exist": [".flake8", "setup.cfg"]
      }
    },
    "security_scan": {
      "type": "command",
      "description": "Run Python security scan with bandit",
      "command": "bandit -r . -f json",
      "enabled": true,
      "technology_stack": ["python"],
      "severity": "warning",
      "allow_failure": true
    }
  }
}
```

### **Multi-Technology Project Configuration**

```json
{
  "project_type": "fullstack",
  "global_settings": {
    "strict_mode": true,
    "timeout_ms": 60000,
    "parallel_execution": true
  },
  "custom_rules": {
    "frontend_dependencies": {
      "type": "file_content",
      "description": "Validate frontend dependencies",
      "file": "frontend/package.json",
      "pattern": "\"react\":",
      "enabled": true,
      "technology_stack": ["nodejs"],
      "severity": "error"
    },
    "backend_requirements": {
      "type": "file_exists",
      "description": "Verify backend requirements",
      "files": ["backend/requirements.txt"],
      "required": true,
      "technology_stack": ["python"],
      "severity": "error"
    },
    "docker_compose_validation": {
      "type": "composite",
      "description": "Validate Docker Compose setup",
      "operator": "and",
      "technology_stack": ["docker"],
      "rules": [
        {
          "type": "file_exists",
          "files": ["docker-compose.yml"],
          "required": true
        },
        {
          "type": "file_content",
          "file": "docker-compose.yml",
          "pattern": "version:",
          "description": "Docker Compose should specify version"
        }
      ]
    }
  }
}
```

## 🔄 Integration with Validation Workflow

### **Standalone Execution**

Custom validation rules can be executed independently for project-specific validation:

```bash
# Load and execute all custom rules
timeout 10s node "taskmanager-api.js" load-custom-validation-rules
timeout 10s node "taskmanager-api.js" execute-all-custom-validation-rules
```

### **Integration with Standard Validation**

While custom rules run separately from the standard 7-criteria authorization workflow, they can be used as supplementary validation:

**Standard Authorization Flow:**

1. start-authorization
2. validate-criterion (focused-codebase, security-validation, linter-validation, type-validation, build-validation, start-validation, test-validation)
3. complete-authorization

**Custom Rules as Additional Validation:**

```bash
# Run custom validation before or after standard workflow
timeout 10s node "taskmanager-api.js" execute-all-custom-validation-rules

# Then proceed with standard authorization
timeout 10s node "taskmanager-api.js" start-authorization agent_001
# ... standard validation criteria ...
timeout 10s node "taskmanager-api.js" complete-authorization <auth-key>
```

### **Conditional Integration**

Custom rules can be designed to complement standard validation:

```json
{
  "pre_authorization_checks": {
    "type": "conditional",
    "description": "Pre-authorization custom validation",
    "condition": {
      "project_type": "nodejs"
    },
    "rules": [
      {
        "type": "command",
        "command": "npm run lint",
        "description": "Ensure linting passes before authorization"
      }
    ]
  }
}
```

## 📈 Best Practices

### **Rule Design**

1. **Technology-Specific Rules**: Target rules to specific technology stacks
2. **Meaningful Descriptions**: Provide clear, actionable descriptions
3. **Appropriate Timeouts**: Set realistic timeouts based on command complexity
4. **Severity Levels**: Use appropriate severity (error/warning/info) for different issues
5. **Failure Handling**: Consider when rules should block vs. warn

### **Configuration Management**

1. **Version Control**: Include `.validation-rules.json` in version control
2. **Environment-Specific Rules**: Use conditional rules for different environments
3. **Team Collaboration**: Document custom rules for team understanding
4. **Regular Review**: Periodically review and update rule configurations

### **Performance Optimization**

1. **Parallel Execution**: Enable parallel execution for independent rules
2. **Conditional Rules**: Use conditions to avoid unnecessary rule execution
3. **Timeout Management**: Set appropriate timeouts to prevent hanging
4. **Resource Awareness**: Consider CPU/memory impact of validation commands

### **Security Considerations**

1. **Command Injection**: Validate and sanitize any dynamic command content
2. **File Access**: Ensure file paths are within project boundaries
3. **Environment Variables**: Be cautious with environment variable exposure
4. **Audit Trail**: Log custom rule execution for security auditing

## 🛠️ Troubleshooting

### **Common Issues**

#### **Rule Configuration Errors**

```bash
# Error: "Rule X: file and pattern are required for file_content type"
# Solution: Ensure file_content rules have both 'file' and 'pattern' properties
```

#### **Technology Stack Detection Issues**

```bash
# Error: Rules not executing for detected stack
# Solution: Check technology_stack array matches detected project type
```

#### **Command Execution Failures**

```bash
# Error: Command timeouts or failures
# Solution: Increase timeout, check command validity, enable allow_failure if appropriate
```

#### **File Path Issues**

```bash
# Error: File not found errors
# Solution: Use paths relative to project root, verify file existence
```

### **Debugging Commands**

#### **Check Configuration Loading**

```bash
timeout 10s node "taskmanager-api.js" get-custom-validation-rules
```

#### **Test Individual Rules**

```bash
timeout 10s node "taskmanager-api.js" execute-custom-validation-rule <rule_id>
```

#### **Review Execution Analytics**

```bash
timeout 10s node "taskmanager-api.js" get-custom-validation-analytics
```

## 📋 Complete Example Workflow

### **1. Create Configuration**

Create `.validation-rules.json` in project root:

```json
{
  "project_type": "nodejs",
  "global_settings": {
    "strict_mode": true,
    "timeout_ms": 30000,
    "parallel_execution": true
  },
  "custom_rules": {
    "package_validation": {
      "type": "file_content",
      "description": "Validate package.json structure",
      "file": "package.json",
      "pattern": "\"name\":",
      "enabled": true,
      "technology_stack": ["nodejs"],
      "severity": "error"
    }
  }
}
```

### **2. Load and Execute**

```bash
# Load configuration
timeout 10s node "taskmanager-api.js" load-custom-validation-rules

# Execute all rules
timeout 10s node "taskmanager-api.js" execute-all-custom-validation-rules

# Review results
timeout 10s node "taskmanager-api.js" get-custom-validation-analytics
```

### **3. Integration with Workflow**

```bash
# Custom validation as pre-check
timeout 10s node "taskmanager-api.js" execute-all-custom-validation-rules

# Standard authorization workflow
timeout 10s node "taskmanager-api.js" start-authorization agent_001
timeout 10s node "taskmanager-api.js" validate-criterion <auth-key> focused-codebase
# ... continue with standard validation criteria ...
timeout 10s node "taskmanager-api.js" complete-authorization <auth-key>
```

## 🚀 Future Enhancements

### **Dynamic Rule Generation**

- Automatically generate rules based on project analysis
- Machine learning-based rule recommendations
- Adaptive rule configuration based on project evolution

### **Advanced Integration**

- Direct integration with standard validation criteria
- Custom criteria in authorization workflow
- Dependency relationships between custom and standard rules

### **Enhanced Analytics**

- Historical trend analysis for custom rule performance
- Comparative analytics across projects
- Automated optimization recommendations

### **Cross-Project Rule Sharing**

- Rule templates for common project types
- Community rule marketplace
- Organization-wide rule standardization

---

## Summary

The Stop Hook Custom Project Validation Rules system provides a powerful, flexible framework for project-specific validation that complements the standard validation workflow. With support for multiple rule types, intelligent project detection, and comprehensive configuration management, it enables teams to implement validation criteria tailored to their specific technology stacks and project requirements.

**Key Benefits:**

- 🎯 **Technology-Aware**: Automatically detects and validates appropriate technology stacks
- 🔧 **Flexible Configuration**: JSON-based rules with multiple validation types
- ⚡ **Performance-Optimized**: Parallel execution and conditional rule evaluation
- 📊 **Comprehensive Analytics**: Detailed execution metrics and success tracking
- 🔄 **Workflow Integration**: Seamless integration with existing validation processes

_Last Updated: 2025-09-27 by Stop Hook Custom Project Validation Rules Implementation_
