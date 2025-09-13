# TaskManager API - Embedded Subtasks Quick Start Guide

## Quick Start

This guide helps you get started with the embedded subtasks system in 5 minutes.

### Prerequisites

1. Node.js 14+ installed
2. TaskManager API project setup
3. `development/essentials/audit-criteria.md` file exists

### Step 1: Basic Task Creation

Create a feature task that automatically generates embedded subtasks:

```bash
# Initialize agent
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" init

# Create feature task with embedded subtasks
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create '{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication with security features",
  "category": "feature"
}'
```

### Step 2: View Generated Subtasks

List tasks to see the generated embedded subtasks:

```bash
# List all pending tasks
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"status": "pending"}'

# View specific task with subtasks
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"id": "feature_123_abc"}'
```

### Step 3: Work with Research Subtasks

If a research subtask was generated, claim and complete it:

```bash
# Claim research subtask (different agent)
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" claim research_123_def research_agent_001

# Complete research with findings
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete research_123_def '{
  "research_completed": true,
  "recommendations": ["Use bcrypt for password hashing", "Implement rate limiting"],
  "report_location": "development/research-reports/auth_research.md"
}'
```

### Step 4: Implement Main Feature

Claim and work on the main feature task:

```bash
# Claim main feature (implementation agent)
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" claim feature_123_abc implementation_agent_002

# Work on implementation... 
# (Your actual implementation work here)

# Complete the feature
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete feature_123_abc '{
  "implementation_complete": true,
  "files_modified": ["auth/jwt.js", "middleware/auth.js", "routes/auth.js"]
}'
```

### Step 5: Independent Audit

The audit subtask requires a different agent for independent validation:

```bash
# Claim audit subtask (different agent from implementer)
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" claim audit_123_ghi audit_agent_003

# Execute automated quality gates
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" execute-quality-gates audit_123_ghi

# Complete audit after validation
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" complete audit_123_ghi '{
  "audit_passed": true,
  "quality_gates_results": "all_passed",
  "validation_timestamp": "2025-09-13T16:00:00Z"
}'
```

## Common Patterns

### 1. Skip Embedded Subtasks

For simple tasks that don't need research or audit:

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create '{
  "title": "Fix typo in README",
  "category": "feature",
  "skip_embedded_subtasks": true
}'
```

### 2. Force Research Generation

For complex tasks that definitely need research:

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create '{
  "title": "Simple UI update",
  "category": "feature", 
  "requires_research": true
}'
```

### 3. Custom Success Criteria

Add task-specific success criteria beyond the standard set:

```bash
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create '{
  "title": "Database migration",
  "category": "feature",
  "success_criteria": [
    "Migration runs without data loss",
    "Performance tests pass with < 2s response time",
    "Rollback procedure documented and tested"
  ]
}'
```

### 4. Multi-Agent Workflow

Coordinate multiple specialized agents:

```javascript
// JavaScript example for multi-agent coordination
const agents = {
  research: 'research_specialist_001',
  backend: 'backend_developer_002', 
  frontend: 'frontend_developer_003',
  audit: 'quality_assurance_004'
};

// Research phase
await claimAndComplete(researchSubtaskId, agents.research);

// Implementation phase (parallel)
await Promise.all([
  claimAndComplete(backendTaskId, agents.backend),
  claimAndComplete(frontendTaskId, agents.frontend)
]);

// Audit phase (after implementation)
await claimAndComplete(auditSubtaskId, agents.audit);
```

## Troubleshooting

### Issue: Subtasks Not Generated

**Check:** Task category and configuration

```bash
# Verify task is 'feature' category
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"id": "your_task_id"}'

# Check if subtasks were explicitly disabled
grep -i skip_embedded TODO.json
```

### Issue: Research Not Generated

**Check:** Task complexity keywords

```bash
# Look for research trigger keywords
echo "api integration database security authentication" | grep -i "your_task_keywords"

# Force research generation
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" create '{
  "title": "Your task",
  "category": "feature",
  "requires_research": true
}'
```

### Issue: Audit Agent Same as Implementer

**Solution:** Use different agent IDs

```bash
# Check current agent assignments
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" list '{"status": "in_progress"}'

# Reassign to different agent
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" reassign audit_task_123 different_agent_456
```

### Issue: Quality Gates Failing

**Solution:** Fix underlying issues

```bash
# Check what's failing
npm run lint
npm run build
npm test

# Fix issues then retry
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" execute-quality-gates task_123
```

## Best Practices

### 1. Agent Specialization
- Use different agents for research, implementation, and audit
- Maintain agent expertise areas (frontend, backend, security, etc.)
- Rotate assignments to prevent bias

### 2. Task Naming
- Use descriptive titles that include key functionality
- Include technology stack or domain in description
- Add complexity indicators for research triggering

### 3. Research Quality
- Provide specific research locations and focus areas
- Include both technical and business requirements
- Document assumptions and constraints clearly

### 4. Audit Standards
- Regularly update audit criteria based on project evolution
- Include project-specific validation requirements
- Monitor audit success rates and adjust standards

### 5. Workflow Optimization
- Batch similar tasks for efficiency
- Use parallel processing where appropriate
- Cache research findings for related tasks

## Next Steps

1. **Advanced Configuration**: Set up project-specific audit criteria and research guidelines
2. **Integration**: Integrate with CI/CD pipelines for automated quality gates
3. **Monitoring**: Set up dashboards for task success rates and quality metrics
4. **Scaling**: Configure agent pools and load balancing for larger teams

## Support

- **Documentation**: Full API documentation in `embedded-subtasks-api-documentation.md`
- **Configuration**: See configuration files in `development/essentials/`
- **Troubleshooting**: Detailed troubleshooting guide in main documentation
- **Examples**: Integration examples and advanced patterns available

This quick start guide gets you productive with embedded subtasks immediately while providing pathways to advanced usage.