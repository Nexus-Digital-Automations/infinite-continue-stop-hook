# TaskManager API - Embedded Subtasks Reference Sheet

## Core Commands

### Agent Management
```bash
# Initialize agent
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" init

# Reinitialize existing agent
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reinitialize [agentId]

# Get agent status
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" status [agentId]

# List all agents
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list-agents
```

### Task Operations
```bash
# Create feature task (auto-generates embedded subtasks)
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create '{
  "title": "Task title", 
  "description": "Description",
  "category": "feature"
}'

# List tasks with filters
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"status": "pending"}'
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"category": "feature"}'
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"type": "research"}'
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"type": "audit"}'

# Claim task
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" claim taskId agentId

# Complete task
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete taskId '{"status": "completed"}'

# Get current task for agent
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" current [agentId]
```

### Embedded Subtasks
```bash
# Create task without embedded subtasks
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create '{
  "title": "Simple task",
  "category": "feature",
  "skip_embedded_subtasks": true
}'

# Create task without research
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create '{
  "title": "Implementation task",
  "category": "feature", 
  "skip_research": true
}'

# Force research generation
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create '{
  "title": "Simple task",
  "category": "feature",
  "requires_research": true
}'
```

### Quality Gates & Success Criteria
```bash
# Execute quality gates for task
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" execute-quality-gates taskId

# Add success criteria to task
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" add-success-criteria taskId "Criteria description"

# Get quality gate results
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-quality-results taskId
```

### Task Management
```bash
# Move task priority
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" move-top taskId
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" move-up taskId
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" move-down taskId
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" move-bottom taskId

# Delete task
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" delete taskId

# Get task statistics
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" stats
```

## Task Structure Examples

### Basic Feature Task
```json
{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication system",
  "category": "feature",
  "priority": "high",
  "success_criteria": [
    "All tests pass",
    "Security audit passes",
    "Performance within 500ms"
  ]
}
```

### Research Subtask Structure  
```json
{
  "id": "research_1234567890_abcd1234",
  "type": "research",
  "title": "Research: Implement user authentication",
  "description": "Comprehensive research for authentication implementation",
  "status": "pending",
  "estimated_hours": 1,
  "research_locations": [
    {
      "type": "codebase",
      "paths": ["/auth", "/middleware", "/security"],
      "focus": "Existing authentication patterns"
    },
    {
      "type": "internet",
      "keywords": ["jwt", "authentication", "node.js", "security"],
      "focus": "Best practices and security standards"
    }
  ],
  "deliverables": [
    "Technical analysis report",
    "Implementation recommendations",
    "Risk assessment"
  ],
  "prevents_implementation": true
}
```

### Audit Subtask Structure
```json
{
  "id": "audit_1234567890_abcd1234", 
  "type": "audit",
  "title": "Audit: Implement user authentication",
  "description": "Quality audit of authentication implementation",
  "status": "pending",
  "estimated_hours": 0.5,
  "success_criteria": [
    "Linter Perfection",
    "Build Success", 
    "Runtime Success",
    "Test Integrity",
    "Security Review"
  ],
  "prevents_completion": true,
  "prevents_self_review": true,
  "audit_type": "embedded_quality_gate"
}
```

## Filter Examples

### Common Filters
```bash
# Get all pending tasks
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"status": "pending"}'

# Get tasks by category
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"category": "error"}'
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"category": "feature"}'

# Get subtasks by type
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"type": "research"}'
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"type": "audit"}'

# Get tasks by agent
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"assigned_agent": "agent_123"}'

# Get tasks by priority
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"priority": "high"}'

# Complex filter combinations
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{
  "status": "pending",
  "category": "feature",
  "priority": "high"
}'
```

## Error Handling

### Common Error Responses
```json
// Task not found
{
  "success": false,
  "error": "Task not found",
  "taskId": "invalid_task_123"
}

// Agent not initialized  
{
  "success": false,
  "error": "Agent not initialized. Please run init command first."
}

// Invalid category
{
  "success": false,
  "error": "Invalid category. Must be one of: error, feature, subtask, test"
}

// Self-review prevention
{
  "success": false,
  "error": "Cannot assign audit task to implementation agent",
  "prevents_self_review": true
}
```

## Success Criteria Reference

### Standard 25-Point Criteria
1. **Linter Perfection** - Zero linting warnings/errors
2. **Build Success** - Clean build without errors
3. **Runtime Success** - Application starts successfully  
4. **Test Integrity** - All existing tests pass
5. **Function Documentation** - All functions documented
6. **API Documentation** - Public interfaces documented
7. **Architecture Documentation** - Design decisions documented
8. **Decision Rationale** - Technical decisions explained
9. **Error Handling** - Comprehensive error handling
10. **Performance Metrics** - Performance benchmarks met
11. **Security Review** - No security vulnerabilities
12. **Architectural Consistency** - Follows project patterns
13. **Dependency Validation** - Dependencies secure and updated
14. **Version Compatibility** - Compatible with project versions
15. **Security Audit** - Security scan passes
16. **Cross-Platform** - Works on supported platforms
17. **Environment Variables** - Environment config documented
18. **Configuration** - Configuration properly managed
19. **No Credential Exposure** - No secrets in code/logs
20. **Input Validation** - Proper input validation
21. **Output Encoding** - Prevents injection attacks
22. **Authentication/Authorization** - Security controls implemented
23. **License Compliance** - Compatible with project license
24. **Data Privacy** - Privacy requirements met
25. **Regulatory Compliance** - Regulatory requirements met

## Agent Assignment Rules

### Research Agents
- Claim research subtasks only
- Cannot implement or audit
- Focus on information gathering and analysis

### Implementation Agents  
- Claim main feature tasks
- Cannot audit their own implementations
- Focus on code development and implementation

### Audit Agents
- Claim audit subtasks only
- Must be different from implementation agent
- Focus on quality validation and compliance

### Agent ID Patterns
```
research_agent_001
implementation_agent_002  
audit_agent_003
frontend_specialist_004
backend_specialist_005
security_specialist_006
```

## Quick Validation Commands

### Manual Quality Gates
```bash
# Check linting
npm run lint

# Check build
npm run build

# Check tests  
npm test

# Check runtime (start server)
npm start
```

### Project Structure Validation
```bash
# Check required directories
ls -la development/essentials/
ls -la development/reports/
ls -la development/research-reports/

# Check configuration files
ls -la development/essentials/audit-criteria.md
ls -la development/essentials/task-requirements.md
```

## Configuration Files Location

### Required Files
- `development/essentials/audit-criteria.md` - Standard audit criteria
- `development/essentials/task-requirements.md` - Task completion requirements  
- `development/essentials/research-guidelines.md` - Research configuration
- `TODO.json` - Task data storage

### Generated Files
- `development/reports/feature_*/` - Task-specific reports
- `development/research-reports/` - Research output
- `development/debug-logs/` - Debug information

This reference sheet provides quick access to all essential commands and patterns for working with the embedded subtasks system.