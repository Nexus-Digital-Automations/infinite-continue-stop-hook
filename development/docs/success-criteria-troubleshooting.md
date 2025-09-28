# Success Criteria System - Troubleshooting Guide

**Version**: 1.0.0  
**Date**: 2025-09-15  
**Author**: Documentation Agent #5

## Quick Diagnostic Commands

Start with these commands to identify common issues:

```bash
# System health check
timeout 10s node taskmanager-api.js criteria-health-check

# Check current configuration
timeout 10s node taskmanager-api.js validate-config

# Verify API connectivity
timeout 10s node taskmanager-api.js test-api-connection

# Check recent error logs
tail -50 development/logs/success-criteria-*.log

# Validate specific task
timeout 10s node taskmanager-api.js validate-criteria TASK_ID --debug
```

## Common Issues and Solutions

### 1. Validation Timeout Issues

#### Symptom

```
Error: Validation timeout after 10 seconds
Status: VALIDATION_TIMEOUT
```

#### Root Causes

- Complex validation workflows taking too long
- External tool dependencies causing delays
- Network connectivity issues
- Resource constraints

#### Diagnostic Steps

```bash
# Check current timeout settings
timeout 10s node taskmanager-api.js get-config | grep timeout

# Test individual validation tools
timeout 10s node taskmanager-api.js test-validator --validator=linter
timeout 10s node taskmanager-api.js test-validator --validator=build

# Monitor resource usage during validation
top -p $(pgrep node)
```

#### Solutions

**Solution 1: Increase Timeout (Quick Fix)**

```bash
# Temporarily increase timeout for specific task
timeout 10s node taskmanager-api.js set-validation-timeout TASK_ID 3600

# Permanently update configuration
# Edit success-criteria-config.json:
{
  "validation_timeout": 3600,
  "validation_agents": {
    "timeout_overrides": {
      "security_scan": 1800,
      "performance_test": 2400
    }
  }
}
```

**Solution 2: Use Asynchronous Validation**

```bash
# Run validation asynchronously
timeout 10s node taskmanager-api.js validate-criteria TASK_ID --async

# Monitor progress
timeout 10s node taskmanager-api.js validation-status VALIDATION_ID

# Configure automatic async for complex criteria
# In configuration:
{
  "async_validation_threshold": 5,
  "auto_async_criteria": ["security_audit", "performance_test"]
}
```

**Solution 3: Optimize Validation Workflow**

```bash
# Run only essential validations first
timeout 10s node taskmanager-api.js validate-criteria TASK_ID --category=critical

# Disable slow non-essential validations
timeout 10s node taskmanager-api.js disable-criteria TASK_ID --criteria="performance_test,load_test"

# Use cached results when available
timeout 10s node taskmanager-api.js validate-criteria TASK_ID --use-cache
```

### 2. Criteria Not Found Errors

#### Symptom

```
Error: No success criteria found for task feature_123_abc
Status: CRITERIA_NOT_FOUND
```

#### Root Causes

- Task created before criteria system activation
- Missing template assignment
- Corrupted criteria configuration
- Inheritance rule failures

#### Diagnostic Steps

```bash
# Check if task exists
timeout 10s node taskmanager-api.js get-task-info TASK_ID

# Verify template assignment
timeout 10s node taskmanager-api.js get-task-template TASK_ID

# Check inheritance rules
timeout 10s node taskmanager-api.js debug-inheritance TASK_ID

# Validate criteria configuration
timeout 10s node taskmanager-api.js validate-criteria-config
```

#### Solutions

**Solution 1: Apply Default Criteria**

```bash
# Apply default template to task
timeout 10s node taskmanager-api.js apply-default-criteria TASK_ID

# Verify criteria applied
timeout 10s node taskmanager-api.js get-success-criteria TASK_ID
```

**Solution 2: Rebuild Criteria from Template**

```bash
# Force rebuild from template
timeout 10s node taskmanager-api.js rebuild-criteria TASK_ID --template=25_point_standard

# Apply project-wide inheritance
timeout 10s node taskmanager-api.js apply-inheritance TASK_ID
```

**Solution 3: Manual Criteria Assignment**

```bash
# Manually assign specific criteria
timeout 10s node taskmanager-api.js set-success-criteria TASK_ID \
  '{"template_id": "25_point_standard", "custom_criteria": []}'
```

### 3. Evidence Collection Failures

#### Symptom

```
Error: Required evidence not provided for criterion: "Linter Perfection"
Status: INSUFFICIENT_EVIDENCE
```

#### Root Causes

- Automated tools not running successfully
- Missing evidence file paths
- Tool configuration issues
- Permission problems

#### Diagnostic Steps

```bash
# Check evidence directory
ls -la development/evidence/task_TASK_ID/

# Test automated tools individually
npm run lint
npm run test
npm run build

# Check tool configurations
timeout 10s node taskmanager-api.js test-tool-config --tool=eslint
timeout 10s node taskmanager-api.js test-tool-config --tool=jest
```

#### Solutions

**Solution 1: Run Missing Tools**

```bash
# Run linter and capture output
npm run lint 2>&1 | tee development/evidence/task_TASK_ID/linter_results.log

# Run tests and capture results
npm run test -- --json > development/evidence/task_TASK_ID/test_results.json

# Run build and capture output
npm run build 2>&1 | tee development/evidence/task_TASK_ID/build_results.log
```

**Solution 2: Fix Tool Configuration**

```bash
# Check linter configuration
npx eslint --print-config src/

# Fix common linter issues
npx eslint --fix src/

# Verify test configuration
npm test -- --listTests
```

**Solution 3: Provide Manual Evidence**

```bash
# Provide manual evidence for failed automated checks
timeout 10s node taskmanager-api.js add-manual-evidence TASK_ID \
  --criterion="linter_perfection" \
  --evidence="Manual code review completed - no linting violations found" \
  --reviewer="dev_session_123"
```

### 4. Criteria Inheritance Conflicts

#### Symptom

```
Error: Conflicting criteria requirements
Details: Project-wide security requirement conflicts with task-specific override
Status: CRITERIA_CONFLICT
```

#### Root Causes

- Contradictory requirements between sources
- Invalid inheritance rules
- Conflicting priority settings
- Template version mismatches

#### Diagnostic Steps

```bash
# Analyze criteria conflicts
timeout 10s node taskmanager-api.js analyze-conflicts TASK_ID

# Check inheritance chain
timeout 10s node taskmanager-api.js debug-inheritance TASK_ID --verbose

# Compare criteria sources
timeout 10s node taskmanager-api.js compare-criteria-sources TASK_ID
```

#### Solutions

**Solution 1: Resolve Conflicts Automatically**

```bash
# Use automatic conflict resolution
timeout 10s node taskmanager-api.js resolve-conflicts TASK_ID --strategy=project_takes_precedence

# Alternative resolution strategies
timeout 10s node taskmanager-api.js resolve-conflicts TASK_ID --strategy=merge_requirements
timeout 10s node taskmanager-api.js resolve-conflicts TASK_ID --strategy=highest_priority_wins
```

**Solution 2: Manual Conflict Resolution**

```bash
# Request manual override with justification
timeout 10s node taskmanager-api.js request-override TASK_ID \
  --criterion="security_requirement_5" \
  --justification="Business requirement exception approved by security team" \
  --approver="security_lead_agent"

# Document resolution decision
timeout 10s node taskmanager-api.js add-resolution-note TASK_ID \
  "Conflict resolved: Using project security baseline with performance exception"
```

**Solution 3: Update Inheritance Rules**

```bash
# Modify project-wide criteria to prevent future conflicts
timeout 10s node taskmanager-api.js update-project-criteria \
  --criteria-set="security_baseline" \
  --modification='{"allow_override": true, "override_justification_required": true}'
```

### 5. Manual Review Assignment Issues

#### Symptom

```
Error: No available agents for manual review
Criterion: Security Audit
Status: REVIEW_ASSIGNMENT_FAILED
```

#### Root Causes

- No qualified reviewers available
- Agent capacity limits reached
- Missing agent permissions
- Review workflow configuration issues

#### Diagnostic Steps

```bash
# Check available review agents
timeout 10s node taskmanager-api.js list-review-agents --category=security

# Check agent workload
timeout 10s node taskmanager-api.js agent-status --role=security_reviewer

# Verify review configuration
timeout 10s node taskmanager-api.js check-review-config --category=security
```

#### Solutions

**Solution 1: Request Specific Reviewer**

```bash
# Assign specific agent for review
timeout 10s node taskmanager-api.js assign-reviewer TASK_ID \
  --criterion="security_audit" \
  --agent="security_agent_001" \
  --priority=high

# Set review deadline
timeout 10s node taskmanager-api.js set-review-deadline TASK_ID \
  --criterion="security_audit" \
  --deadline="2025-09-16T12:00:00Z"
```

**Solution 2: Escalate Review Request**

```bash
# Escalate to management for urgent reviews
timeout 10s node taskmanager-api.js escalate-review TASK_ID \
  --criterion="security_audit" \
  --reason="Critical security feature requires immediate review" \
  --escalate-to="project_manager"
```

**Solution 3: Use Alternative Review Process**

```bash
# Use external review process
timeout 10s node taskmanager-api.js external-review TASK_ID \
  --criterion="security_audit" \
  --external-reviewer="external_security_consultant" \
  --review-type="independent_audit"
```

### 6. Performance Issues

#### Symptom

```
Warning: Validation taking longer than expected
Current duration: 180 seconds
Expected duration: 30 seconds
```

#### Root Causes

- Large codebase size
- Inefficient validation tools
- Resource constraints
- Concurrent validation limits

#### Diagnostic Steps

```bash
# Profile validation performance
timeout 10s node taskmanager-api.js profile-validation TASK_ID --detailed

# Check system resources
free -h
df -h development/
iostat 1 5

# Analyze validation bottlenecks
timeout 10s node taskmanager-api.js analyze-bottlenecks TASK_ID
```

#### Solutions

**Solution 1: Optimize Validation Tools**

```bash
# Enable incremental linting
# In .eslintrc.json:
{
  "cache": true,
  "cacheLocation": "node_modules/.cache/eslint/"
}

# Use test coverage caching
# In jest.config.js:
{
  "cache": true,
  "cacheDirectory": "node_modules/.cache/jest/"
}
```

**Solution 2: Parallel Validation**

```bash
# Configure parallel validation
# In success-criteria-config.json:
{
  "performance_optimization": {
    "parallel_validation": true,
    "max_concurrent_validations": 8,
    "validation_batching": true
  }
}
```

**Solution 3: Selective Validation**

```bash
# Run only changed file validation
timeout 10s node taskmanager-api.js validate-criteria TASK_ID --changed-files-only

# Skip expensive validations in development
timeout 10s node taskmanager-api.js validate-criteria TASK_ID --skip-expensive
```

### 7. Authentication and Authorization Issues

#### Symptom

```
Error: Agent not authorized for success criteria operations
Agent: dev_session_123
Operation: validate_criteria
Status: AUTHORIZATION_FAILED
```

#### Root Causes

- Insufficient agent permissions
- Expired authentication tokens
- Role configuration issues
- Agent registration problems

#### Diagnostic Steps

```bash
# Check agent permissions
timeout 10s node taskmanager-api.js check-agent-permissions dev_session_123

# Verify agent registration
timeout 10s node taskmanager-api.js get-agent-info dev_session_123

# Test authentication
timeout 10s node taskmanager-api.js test-auth --agent=dev_session_123
```

#### Solutions

**Solution 1: Refresh Agent Registration**

```bash
# Re-initialize agent
timeout 10s node taskmanager-api.js init --force

# Verify new agent permissions
timeout 10s node taskmanager-api.js check-agent-permissions
```

**Solution 2: Request Permission Upgrade**

```bash
# Request additional permissions
timeout 10s node taskmanager-api.js request-permissions \
  --permissions="success_criteria_validate,manual_review" \
  --justification="Required for documentation agent role"
```

**Solution 3: Use Different Agent**

```bash
# Switch to agent with appropriate permissions
timeout 10s node taskmanager-api.js switch-agent --agent=authorized_agent_id

# Delegate operation to authorized agent
timeout 10s node taskmanager-api.js delegate-operation \
  --operation="validate_criteria" \
  --task=TASK_ID \
  --target-agent="security_agent_001"
```

## System Health Monitoring

### Health Check Commands

```bash
# Comprehensive system health check
timeout 10s node taskmanager-api.js criteria-health-check --verbose

# Check individual components
timeout 10s node taskmanager-api.js health-check --component=template_manager
timeout 10s node taskmanager-api.js health-check --component=validation_engine
timeout 10s node taskmanager-api.js health-check --component=evidence_collector

# Monitor system metrics
timeout 10s node taskmanager-api.js system-metrics --real-time
```

### Log Analysis

#### Key Log Locations

```bash
# Success criteria system logs
tail -f development/logs/success-criteria-*.log

# Validation process logs
tail -f development/logs/validation-*.log

# Error logs
tail -f development/logs/error-*.log

# Performance logs
tail -f development/logs/performance-*.log
```

#### Log Analysis Commands

```bash
# Search for specific errors
grep "VALIDATION_TIMEOUT" development/logs/*.log | tail -20

# Analyze validation performance
grep "validation_duration" development/logs/*.log | awk '{print $NF}' | sort -n

# Check error patterns
grep "Error:" development/logs/*.log | cut -d: -f3 | sort | uniq -c | sort -nr
```

### Performance Monitoring

#### Key Metrics to Monitor

```bash
# Validation completion rates
timeout 10s node taskmanager-api.js metrics --metric=validation_success_rate --period=24h

# Average validation times
timeout 10s node taskmanager-api.js metrics --metric=avg_validation_time --period=7d

# System resource usage
timeout 10s node taskmanager-api.js metrics --metric=resource_usage --period=1h

# Error rates
timeout 10s node taskmanager-api.js metrics --metric=error_rate --period=24h
```

## Emergency Procedures

### Critical System Failure

If the success criteria system becomes completely unresponsive:

```bash
# 1. Check system status
timeout 10s node taskmanager-api.js system-status

# 2. Restart success criteria services
timeout 10s node taskmanager-api.js restart-criteria-services

# 3. Reset to safe configuration
timeout 10s node taskmanager-api.js reset-to-safe-config

# 4. Verify basic functionality
timeout 10s node taskmanager-api.js test-basic-functionality

# 5. Gradually restore advanced features
timeout 10s node taskmanager-api.js restore-advanced-features --step-by-step
```

### Data Corruption Recovery

If criteria data becomes corrupted:

```bash
# 1. Backup current state
timeout 10s node taskmanager-api.js backup-current-state --output=emergency-backup-$(date +%Y%m%d_%H%M%S)

# 2. Validate data integrity
timeout 10s node taskmanager-api.js validate-data-integrity --verbose

# 3. Restore from last known good backup
timeout 10s node taskmanager-api.js restore-from-backup --backup=last-good-backup.json

# 4. Rebuild corrupted criteria
timeout 10s node taskmanager-api.js rebuild-all-criteria --force

# 5. Verify restoration
timeout 10s node taskmanager-api.js verify-restoration --comprehensive
```

### Performance Emergency

If validation performance degrades severely:

```bash
# 1. Enable emergency performance mode
timeout 10s node taskmanager-api.js emergency-performance-mode

# 2. Disable non-essential validations
timeout 10s node taskmanager-api.js disable-non-essential-validations

# 3. Clear all caches
timeout 10s node taskmanager-api.js clear-all-caches

# 4. Restart with minimal configuration
timeout 10s node taskmanager-api.js restart-minimal-config

# 5. Gradually re-enable features
timeout 10s node taskmanager-api.js enable-features --gradual
```

## Prevention Strategies

### Regular Maintenance

```bash
# Weekly maintenance script
#!/bin/bash
# weekly-maintenance.sh

# Clean up old evidence files
find development/evidence/ -name "*.log" -mtime +7 -delete

# Archive old validation results
timeout 10s node taskmanager-api.js archive-old-results --older-than=30d

# Update criteria templates
timeout 10s node taskmanager-api.js update-templates --check-for-updates

# Validate system health
timeout 10s node taskmanager-api.js health-check --comprehensive

# Generate maintenance report
timeout 10s node taskmanager-api.js generate-maintenance-report --output=weekly-report-$(date +%Y%m%d).md
```

### Monitoring Alerts

Configure automated alerts for:

```bash
# System health monitoring
timeout 10s node taskmanager-api.js setup-alerts \
  --alert=validation_failure_rate_high \
  --threshold=10% \
  --notification=slack

# Performance monitoring
timeout 10s node taskmanager-api.js setup-alerts \
  --alert=validation_time_exceeded \
  --threshold=300s \
  --notification=email

# Error rate monitoring
timeout 10s node taskmanager-api.js setup-alerts \
  --alert=error_rate_spike \
  --threshold=5% \
  --notification=webhook
```

## Getting Additional Help

### Documentation Resources

- **API Reference**: `development/docs/success-criteria-api.md`
- **Architecture Guide**: `development/docs/success-criteria-architecture.md`
- **Configuration Manual**: `development/docs/success-criteria-config.md`
- **Quick Start Guide**: `development/docs/success-criteria-quickstart.md`

### Diagnostic Information Collection

Before requesting help, collect diagnostic information:

```bash
# Generate comprehensive diagnostic report
timeout 10s node taskmanager-api.js generate-diagnostic-report \
  --output=diagnostic-report-$(date +%Y%m%d_%H%M%S).json \
  --include-logs \
  --include-config \
  --include-metrics

# Export current system state
timeout 10s node taskmanager-api.js export-system-state \
  --output=system-state-$(date +%Y%m%d_%H%M%S).json

# Create support bundle
timeout 10s node taskmanager-api.js create-support-bundle \
  --task-id=PROBLEMATIC_TASK_ID \
  --output=support-bundle-$(date +%Y%m%d_%H%M%S).zip
```

### Contact Points

- **System Issues**: Check `development/errors/` for current known issues
- **Performance Problems**: Review `development/logs/performance-*.log`
- **Configuration Questions**: Consult `development/docs/success-criteria-config.md`
- **API Usage**: Reference `development/docs/success-criteria-api.md`

---

_Troubleshooting Guide v1.0.0_  
_Generated by: Documentation Agent #5_  
_Last Updated: 2025-09-15_
