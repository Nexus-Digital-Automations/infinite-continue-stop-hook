# Success Criteria System - Quick Start Guide

**Version**: 1.0.0  
**Date**: 2025-09-15  
**Author**: Documentation Agent #5

## Introduction

The Success Criteria System ensures consistent quality across all tasks by providing automated validation, manual review processes, and comprehensive compliance tracking. This guide will get you up and running in 10 minutes.

## Prerequisites

- TaskManager API access
- Valid agent credentials
- Basic understanding of the project's task workflow

## Quick Setup (5 minutes)

### Step 1: Verify System Access

```bash
# Test your API access
timeout 10s node /Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js init

# Check if success criteria endpoints are available
curl -H "Authorization: Bearer YOUR_TOKEN" \
  /api/success-criteria/templates
```

### Step 2: Understanding Your Task's Criteria

Every task automatically receives success criteria based on:

- **Standard Template**: 25-point quality checklist
- **Project-wide Rules**: Organization-specific requirements
- **Task-specific Additions**: Custom criteria for your specific task

```bash
# View criteria for your current task
timeout 10s node taskmanager-api.js get-success-criteria TASK_ID
```

### Step 3: Basic Validation Workflow

```bash
# Run automated validation
timeout 10s node taskmanager-api.js validate-criteria TASK_ID

# Check validation status
timeout 10s node taskmanager-api.js criteria-report TASK_ID
```

## Common Use Cases

### Use Case 1: Feature Development with Standard Criteria

**Scenario**: You're implementing a new user registration feature.

**Workflow**:

```bash
# 1. Check your assigned criteria
timeout 10s node taskmanager-api.js get-success-criteria feature_123_registration

# 2. Implement your feature
# ... your development work ...

# 3. Run validation before completion
timeout 10s node taskmanager-api.js validate-criteria feature_123_registration

# 4. Review results
timeout 10s node taskmanager-api.js criteria-report feature_123_registration
```

**Expected Criteria** (automatically applied):

- ✅ Code lints without errors
- ✅ All tests pass
- ✅ Build completes successfully
- ✅ Functions are documented
- ✅ Security scan passes
- ✅ Performance benchmarks met

### Use Case 2: Adding Custom Performance Requirements

**Scenario**: Your API endpoints need sub-200ms response times.

**Implementation**:

```javascript
// Add custom performance criteria
const response = await fetch(`/api/success-criteria/task/${taskId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    custom_criteria: [
      {
        category: 'performance',
        title: 'API Response Time',
        description: 'All endpoints must respond within 200ms',
        requirements: ['Average response time < 200ms', '95th percentile < 300ms', 'No timeouts under normal load'],
        evidence_required: 'Load testing results',
        validation_method: 'automated',
        priority: 'critical',
      },
    ],
  }),
});
```

**Validation**:

```bash
# The system will automatically run performance tests
# and verify your custom criteria during validation
timeout 10s node taskmanager-api.js validate-criteria feature_123_api
```

### Use Case 3: Security-Critical Feature

**Scenario**: You're working on payment processing functionality.

**Automatic Enhancement**: The system detects security-sensitive keywords and automatically applies enhanced security criteria:

```json
{
  "auto_applied_criteria": [
    {
      "title": "PCI DSS Compliance Check",
      "requirements": [
        "No credit card data in logs",
        "Encrypted data transmission",
        "Input validation on all payment fields",
        "SQL injection prevention verified"
      ]
    },
    {
      "title": "Security Audit Required",
      "requirements": ["Manual security team review", "Penetration testing completed", "Vulnerability scan clean"]
    }
  ]
}
```

### Use Case 4: Documentation-Heavy Task

**Scenario**: You're creating API documentation that needs review.

**Custom Criteria Setup**:

```bash
# Add documentation-specific criteria
timeout 10s node taskmanager-api.js set-success-criteria feature_123_docs \
  '{"custom_criteria": [
    {
      "category": "documentation",
      "title": "API Documentation Completeness",
      "requirements": [
        "All endpoints documented with examples",
        "Error codes explained",
        "Integration guide provided",
        "Code samples tested"
      ],
      "validation_method": "manual",
      "priority": "critical"
    }
  ]}'
```

## Essential Commands Reference

### Information Commands

```bash
# View available templates
timeout 10s node taskmanager-api.js list-criteria-templates

# Get task criteria details
timeout 10s node taskmanager-api.js get-success-criteria TASK_ID

# Check validation status
timeout 10s node taskmanager-api.js validation-status VALIDATION_ID

# Generate compliance report
timeout 10s node taskmanager-api.js criteria-report TASK_ID --format=summary
```

### Configuration Commands

```bash
# Set custom criteria for a task
timeout 10s node taskmanager-api.js set-success-criteria TASK_ID CRITERIA_JSON

# Apply project-wide criteria
timeout 10s node taskmanager-api.js set-project-criteria PROJECT_CRITERIA_JSON

# Override specific criteria
timeout 10s node taskmanager-api.js override-criteria TASK_ID CRITERION_ID OVERRIDE_CONFIG
```

### Validation Commands

```bash
# Run full validation
timeout 10s node taskmanager-api.js validate-criteria TASK_ID

# Run specific category validation
timeout 10s node taskmanager-api.js validate-criteria TASK_ID --category=security

# Run async validation for large tasks
timeout 10s node taskmanager-api.js validate-criteria TASK_ID --async

# Force re-validation
timeout 10s node taskmanager-api.js validate-criteria TASK_ID --force
```

## Best Practices

### 1. Early Validation Strategy

**Do This** ✅:

```bash
# Run validation early and often
timeout 10s node taskmanager-api.js validate-criteria TASK_ID --category=automated

# Fix issues immediately
timeout 10s node taskmanager-api.js criteria-report TASK_ID --failed-only
```

**Avoid This** ❌:

- Waiting until task completion to run validation
- Ignoring failed criteria and hoping they resolve
- Skipping intermediate validation checks

### 2. Evidence Collection

**Do This** ✅:

```bash
# Collect evidence as you work
npm run lint > evidence/linter_results.log
npm run test > evidence/test_results.log
npm run build > evidence/build_results.log

# Include evidence in validation
timeout 10s node taskmanager-api.js validate-criteria TASK_ID \
  --evidence-dir=evidence/
```

**Avoid This** ❌:

- Manual validation without supporting evidence
- Relying solely on "it works on my machine"
- Missing documentation of validation steps

### 3. Custom Criteria Design

**Good Criteria** ✅:

```json
{
  "title": "Database Migration Safety",
  "requirements": [
    "Migration is reversible with rollback script",
    "No data loss in migration process",
    "Migration tested on staging data",
    "Performance impact under 10% during migration"
  ],
  "evidence_required": "Migration test results and rollback verification",
  "acceptance_threshold": "All requirements must pass"
}
```

**Poor Criteria** ❌:

```json
{
  "title": "Code Quality",
  "requirements": ["Code should be good"],
  "evidence_required": "Manual review",
  "acceptance_threshold": "Looks fine"
}
```

### 4. Handling Failed Validations

**Systematic Approach** ✅:

```bash
# 1. Identify specific failures
timeout 10s node taskmanager-api.js criteria-report TASK_ID --failed-only

# 2. Address root causes
# Fix the underlying issues, not just symptoms

# 3. Re-validate incrementally
timeout 10s node taskmanager-api.js validate-criteria TASK_ID --category=fixed_category

# 4. Document resolution
# Add evidence showing how issues were resolved
```

## Common Scenarios and Solutions

### Scenario: Validation Timeout

**Problem**: Complex validation takes too long and times out.

**Solution**:

```bash
# Use async validation for long-running checks
timeout 10s node taskmanager-api.js validate-criteria TASK_ID --async

# Monitor progress
timeout 10s node taskmanager-api.js validation-status VALIDATION_ID

# Configure longer timeouts for specific criteria
timeout 10s node taskmanager-api.js set-validation-timeout TASK_ID 3600
```

### Scenario: Conflicting Criteria

**Problem**: Project-wide criteria conflicts with task-specific needs.

**Solution**:

```bash
# Review conflicting criteria
timeout 10s node taskmanager-api.js criteria-conflicts TASK_ID

# Request criteria override with justification
timeout 10s node taskmanager-api.js request-override TASK_ID CRITERION_ID \
  --justification="Business requirement exception approved by PM"

# Document exception in task notes
timeout 10s node taskmanager-api.js add-task-note TASK_ID \
  "Criteria override approved for performance optimization"
```

### Scenario: Missing Evidence

**Problem**: Manual review criteria need human validation but no reviewer assigned.

**Solution**:

```bash
# Check review assignment status
timeout 10s node taskmanager-api.js review-status TASK_ID

# Request manual review assignment
timeout 10s node taskmanager-api.js request-review TASK_ID \
  --reviewer-type=security --priority=high

# Provide context for reviewers
timeout 10s node taskmanager-api.js add-review-context TASK_ID \
  "Focus on authentication flow and session management"
```

### Scenario: New Project Setup

**Problem**: Setting up success criteria for a new project.

**Solution**:

```bash
# Start with standard template
timeout 10s node taskmanager-api.js apply-template PROJECT_ID 25_point_standard

# Add project-specific requirements
timeout 10s node taskmanager-api.js set-project-criteria PROJECT_ID \
  '{"security_baseline": {...}, "performance_baseline": {...}}'

# Test with a sample task
timeout 10s node taskmanager-api.js create-sample-task PROJECT_ID
timeout 10s node taskmanager-api.js validate-criteria SAMPLE_TASK_ID
```

## Troubleshooting

### Common Issues

1. **"Criteria not found for task"**
   - **Cause**: Task created before criteria system activation
   - **Fix**: `timeout 10s node taskmanager-api.js apply-default-criteria TASK_ID`

2. **"Validation failed: insufficient evidence"**
   - **Cause**: Missing automated test results or manual reviews
   - **Fix**: Run missing validations and collect evidence

3. **"Template version mismatch"**
   - **Cause**: Project using outdated criteria template
   - **Fix**: `timeout 10s node taskmanager-api.js update-template PROJECT_ID latest`

4. **"Agent not authorized for manual review"**
   - **Cause**: Agent lacks review permissions
   - **Fix**: Request review assignment or escalate to authorized agent

### Debug Commands

```bash
# Check system health
timeout 10s node taskmanager-api.js criteria-health-check

# Validate criteria configuration
timeout 10s node taskmanager-api.js validate-config TASK_ID

# Reset criteria to defaults
timeout 10s node taskmanager-api.js reset-criteria TASK_ID --confirm

# Export criteria for debugging
timeout 10s node taskmanager-api.js export-criteria TASK_ID --format=json
```

### Getting Help

1. **Documentation**: Check `/development/docs/` for detailed guides
2. **System Status**: `timeout 10s node taskmanager-api.js system-status`
3. **Log Analysis**: Check `development/logs/` for detailed error logs
4. **Agent Support**: Contact specialized agents for complex issues

## Next Steps

Once you're comfortable with the basics:

1. **Read the Configuration Manual** - Learn advanced customization options
2. **Review Architecture Guide** - Understand system design and integration points
3. **Explore Advanced Features** - Custom templates, advanced reporting, automation
4. **Join Training Sessions** - Regular workshops on best practices and new features

## Quick Reference Card

### Essential URLs

- API Base: `/api/success-criteria`
- Templates: `/api/success-criteria/templates`
- Validation: `/api/success-criteria/validate/:taskId`
- Reports: `/api/success-criteria/report/:taskId`

### Key File Locations

- Templates: `development/essentials/success-criteria.md`
- Evidence: `development/evidence/`
- Reports: `development/reports/success-criteria/`
- Config: `success-criteria-config.json`

### Emergency Contacts

- System Issues: Check `development/errors/` for current issues
- Criteria Conflicts: Review `development/reports/` for conflict resolution
- Performance Problems: Monitor `development/logs/` for system health

---

_Quick Start Guide v1.0.0_  
_Generated by: Documentation Agent #5_  
_Last Updated: 2025-09-15_
