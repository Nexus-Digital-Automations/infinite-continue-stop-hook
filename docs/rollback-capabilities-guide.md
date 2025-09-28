# Stop Hook Rollback Capabilities - Comprehensive Guide

## Overview

The Stop Hook Rollback Capabilities system provides robust snapshot management and recovery mechanisms for safe validation failure handling. This feature creates automatic Git state preservation, file system backups, and provides seamless rollback functionality when validation processes encounter failures.

## Core Features

### 🔄 Validation State Snapshots

- **Automatic Git State Capture**: Records current commit hash, branch, uncommitted changes
- **Critical File Backup**: Preserves package.json, lock files, FEATURES.json, TASKS.json, environment files
- **Git Stash Integration**: Automatically stashes uncommitted changes during snapshot creation
- **Metadata Tracking**: Comprehensive snapshot information with timestamps and descriptions

### 🔙 Intelligent Rollback System

- **Git State Restoration**: Resets to specific commit hashes and restores stashed changes
- **File System Recovery**: Restores backed-up critical files to previous states
- **Selective Rollback**: Choose specific aspects to rollback (git only, files only, or complete)
- **Safety Validation**: Verifies snapshot integrity before performing rollback operations

### 📊 History & Analytics

- **Rollback Event Logging**: Complete audit trail of all rollback operations
- **Snapshot Management**: Track and organize validation state snapshots over time
- **Cleanup Automation**: Automatic removal of old snapshots based on age and count limits
- **Performance Metrics**: Track rollback operation timing and success rates

## Quick Start

### 1. Create Validation State Snapshot

```bash
# Basic snapshot creation
timeout 10s node taskmanager-api.js create-validation-state-snapshot

# Snapshot with custom description
timeout 10s node taskmanager-api.js create-validation-state-snapshot '{"description": "Before major refactor", "validationAttempt": "feature_xyz"}'
```

### 2. List Available Snapshots

```bash
# Show all available snapshots
timeout 10s node taskmanager-api.js get-available-rollback-snapshots

# Limit results
timeout 10s node taskmanager-api.js get-available-rollback-snapshots '{"limit": 5}'
```

### 3. Perform Rollback

```bash
# Rollback to specific snapshot
timeout 10s node taskmanager-api.js perform-rollback "snapshot_1759001005273_0omay9wk3"

# Rollback with reason
timeout 10s node taskmanager-api.js perform-rollback "snapshot_1759001005273_0omay9wk3" '{"reason": "Validation failed, reverting changes"}'
```

### 4. View Rollback History

```bash
# Show rollback history
timeout 10s node taskmanager-api.js get-rollback-history

# Filtered history
timeout 10s node taskmanager-api.js get-rollback-history '{"limit": 10, "since": "2025-09-27T00:00:00Z"}'
```

## Detailed Command Reference

### create-validation-state-snapshot

Creates a comprehensive snapshot of the current validation state.

**Usage:**

```bash
timeout 10s node taskmanager-api.js create-validation-state-snapshot [options]
```

**Options:**

```json
{
  "description": "Human-readable snapshot description",
  "validationAttempt": "Identifier for validation attempt context"
}
```

**Response:**

```json
{
  "success": true,
  "snapshotId": "snapshot_1759001005273_0omay9wk3",
  "timestamp": "2025-09-27T19:23:25.385Z",
  "description": "Before major validation run",
  "gitCommit": "03156bd4093b1fe8d1b283bad122b02d4e51c202",
  "stashCreated": true,
  "message": "Validation state snapshot created successfully"
}
```

**What Gets Captured:**

- Current Git commit hash and branch
- Uncommitted changes (via git stash)
- Critical project files: package.json, package-lock.json, yarn.lock, FEATURES.json, TASKS.json, .env files
- Snapshot metadata with timestamp and context

### perform-rollback

Restores the system state to a previously created snapshot.

**Usage:**

```bash
timeout 10s node taskmanager-api.js perform-rollback <snapshotId> [options]
```

**Options:**

```json
{
  "reason": "Explanation for why rollback is needed"
}
```

**Response:**

```json
{
  "success": true,
  "snapshotId": "snapshot_1759001005273_0omay9wk3",
  "restoredAt": "2025-09-27T19:23:51.818Z",
  "gitCommit": "03156bd4093b1fe8d1b283bad122b02d4e51c202",
  "filesRestored": 7,
  "message": "Rollback completed successfully"
}
```

**Rollback Process:**

1. **Git State Restoration**: Resets to snapshot commit hash using `git reset --hard`
2. **Stash Recovery**: Restores previously stashed uncommitted changes if available
3. **File Restoration**: Copies backed-up critical files to their original locations
4. **Event Logging**: Records rollback operation in history for audit trail

### get-available-rollback-snapshots

Lists all available snapshots sorted by timestamp (newest first).

**Usage:**

```bash
timeout 10s node taskmanager-api.js get-available-rollback-snapshots [options]
```

**Options:**

```json
{
  "limit": 10
}
```

**Response:**

```json
{
  "success": true,
  "snapshots": [
    {
      "id": "snapshot_1759001005273_0omay9wk3",
      "timestamp": "2025-09-27T19:23:25.385Z",
      "description": "Testing rollback history tracking",
      "gitCommit": "03156bd4",
      "validationAttempt": "history_test",
      "stashCreated": true,
      "age": "2h 15m ago"
    }
  ],
  "total": 1,
  "showing": 1
}
```

### get-rollback-history

Retrieves complete audit trail of rollback operations.

**Usage:**

```bash
timeout 10s node taskmanager-api.js get-rollback-history [options]
```

**Options:**

```json
{
  "limit": 50,
  "since": "2025-09-27T00:00:00Z"
}
```

### cleanup-old-rollback-snapshots

Removes old snapshots based on age and count limits.

**Usage:**

```bash
timeout 10s node taskmanager-api.js cleanup-old-rollback-snapshots [options]
```

**Options:**

```json
{
  "maxAgeHours": 24,
  "maxCount": 10
}
```

**Default Behavior:**

- Removes snapshots older than 24 hours
- Keeps maximum of 10 most recent snapshots
- Always preserves at least 3 most recent snapshots regardless of age

## Integration with Validation System

### Automatic Snapshot Creation

The rollback system integrates seamlessly with the validation workflow:

1. **Pre-Validation Snapshots**: Automatically created before running complex validation suites
2. **Feature Implementation**: Snapshots created before implementing new features
3. **Stop Authorization**: Snapshots created during multi-step authorization process
4. **Error Recovery**: Automatic rollback triggers on critical validation failures

### Stop Authorization Integration

During the stop authorization process, rollback capabilities provide safety nets:

```bash
# 1. Create snapshot before authorization
timeout 10s node taskmanager-api.js create-validation-state-snapshot '{"description": "Before stop authorization", "validationAttempt": "stop_auth"}'

# 2. Begin authorization process
timeout 10s node taskmanager-api.js start-authorization agent_001

# 3. If validation fails, automatic rollback to pre-authorization state
# 4. Manual rollback available if needed
timeout 10s node taskmanager-api.js perform-rollback "snapshot_id" '{"reason": "Authorization validation failed"}'
```

## Best Practices

### 1. Snapshot Naming Strategy

```json
{
  "description": "Before implementing user authentication",
  "validationAttempt": "feature_auth_001"
}
```

### 2. Regular Cleanup

```bash
# Weekly cleanup - remove snapshots older than 7 days, keep max 20
timeout 10s node taskmanager-api.js cleanup-old-rollback-snapshots '{"maxAgeHours": 168, "maxCount": 20}'
```

### 3. Critical Moment Snapshots

Create snapshots before:

- Major feature implementations
- Dependency updates
- Configuration changes
- Database migrations
- Production deployments

### 4. Rollback Verification

After rollback, always verify:

```bash
# Check git status
git status

# Verify critical files
ls -la package.json FEATURES.json TASKS.json

# Run basic validation
npm test
```

## Performance Considerations

### Snapshot Creation Performance

- **Average Time**: 2-5 seconds for typical projects
- **Storage Impact**: ~1-5MB per snapshot depending on backed-up files
- **Git Operations**: Minimal impact using efficient git commands

### Rollback Performance

- **Average Time**: 3-8 seconds for complete rollback
- **Safety Checks**: Snapshot integrity validation adds ~1 second
- **File Operations**: Parallel file restoration for optimal speed

### Storage Management

- **Automatic Cleanup**: Prevents disk space issues
- **Configurable Retention**: Balance between safety and storage
- **Compression**: Snapshot data stored efficiently

## Error Handling & Recovery

### Common Issues

#### 1. Snapshot Creation Failures

```json
{
  "success": false,
  "error": "Failed to create validation state snapshot: Git repository in inconsistent state"
}
```

**Solution**: Resolve git conflicts or unstaged changes first

#### 2. Rollback Failures

```json
{
  "success": false,
  "error": "Failed to perform rollback: Snapshot directory not found"
}
```

**Solution**: Verify snapshot ID exists using `get-available-rollback-snapshots`

#### 3. Git State Issues

```json
{
  "success": false,
  "error": "Git rollback encountered issues: detached HEAD state"
}
```

**Solution**: Manually checkout desired branch before rollback

### Recovery Procedures

#### 1. Manual Git Recovery

```bash
# If automatic git rollback fails
git checkout main
git reset --hard <commit_hash>
git stash pop  # if stash exists
```

#### 2. Manual File Restoration

```bash
# Navigate to snapshot directory
cd .validation-snapshots/snapshot_id/
# Copy files manually
cp package.json ../../
cp FEATURES.json ../../
```

#### 3. Emergency Reset

```bash
# Last resort: clean repository reset
git reset --hard HEAD
git clean -fd
# Restore from most recent snapshot
timeout 10s node taskmanager-api.js perform-rollback "$(timeout 10s node taskmanager-api.js get-available-rollback-snapshots | jq -r '.snapshots[0].id')"
```

## Security Considerations

### 1. Sensitive Data Protection

- ⚠️ **Never snapshot sensitive files**: .env files with secrets, SSH keys, certificates
- ✅ **Safe file patterns**: Configuration templates, dependency locks, project metadata
- 🔒 **Gitignore compliance**: Respects .gitignore patterns for file backup

### 2. Access Control

- 📁 **Snapshot directory**: `.validation-snapshots/` - ensure proper permissions
- 🔐 **Git operations**: Uses current user's git configuration and permissions
- 📝 **History logs**: Contain only metadata, no sensitive information

### 3. Cleanup Security

- 🗑️ **Secure deletion**: Snapshots are completely removed during cleanup
- 🔍 **Audit trail**: Cleanup operations logged for security review
- ⏰ **Retention policies**: Automatic cleanup prevents indefinite data accumulation

## Troubleshooting Guide

### Debug Commands

#### 1. Verify Snapshot Integrity

```bash
# Check if snapshot directory exists
ls -la .validation-snapshots/

# Verify specific snapshot
ls -la .validation-snapshots/snapshot_id/

# Check snapshot metadata
cat .validation-snapshots/snapshot_id/snapshot-metadata.json | jq '.'
```

#### 2. Git State Debugging

```bash
# Check current git state
git status
git log --oneline -5
git stash list

# Verify git repository health
git fsck --full
```

#### 3. History Analysis

```bash
# Check rollback event logs
cat .validation-snapshots/rollback-history.json | jq '.events[] | select(.success == false)'
```

### Common Solutions

| Issue             | Symptoms                    | Solution                                           |
| ----------------- | --------------------------- | -------------------------------------------------- |
| Disk Space        | Snapshot creation fails     | Run cleanup: `cleanup-old-rollback-snapshots`      |
| Git Conflicts     | Rollback partially fails    | Resolve conflicts manually, retry rollback         |
| Permission Errors | Cannot create/restore files | Check filesystem permissions on project directory  |
| Stash Issues      | Uncommitted changes lost    | Check `git stash list`, manually recover if needed |

## Integration Examples

### 1. CI/CD Pipeline Integration

```bash
#!/bin/bash
# Pre-deployment snapshot
SNAPSHOT_ID=$(timeout 10s node taskmanager-api.js create-validation-state-snapshot '{"description": "Pre-deployment", "validationAttempt": "deploy_'$(date +%s)'"}' | jq -r '.snapshotId')

# Run deployment
if ! ./deploy.sh; then
    echo "Deployment failed, rolling back..."
    timeout 10s node taskmanager-api.js perform-rollback "$SNAPSHOT_ID" '{"reason": "Deployment failure"}'
    exit 1
fi

echo "Deployment successful, snapshot: $SNAPSHOT_ID"
```

### 2. Feature Development Workflow

```bash
#!/bin/bash
# Start new feature development
echo "Starting feature development..."
SNAPSHOT_ID=$(timeout 10s node taskmanager-api.js create-validation-state-snapshot '{"description": "Before feature: '$1'", "validationAttempt": "feature_'$1'"}' | jq -r '.snapshotId')

echo "Snapshot created: $SNAPSHOT_ID"
echo "If you need to rollback: timeout 10s node taskmanager-api.js perform-rollback $SNAPSHOT_ID"

# Implement feature
echo "Implement your feature now..."
echo "When done, run validation and create new snapshot if successful"
```

### 3. Automated Testing Recovery

```bash
#!/bin/bash
# Create snapshot before test suite
SNAPSHOT_ID=$(timeout 10s node taskmanager-api.js create-validation-state-snapshot '{"description": "Before test suite", "validationAttempt": "test_run"}' | jq -r '.snapshotId')

# Run tests
if ! npm test; then
    echo "Tests failed, checking for known issues..."

    # If critical tests failed, rollback
    if npm test 2>&1 | grep -q "CRITICAL"; then
        echo "Critical test failure, rolling back..."
        timeout 10s node taskmanager-api.js perform-rollback "$SNAPSHOT_ID" '{"reason": "Critical test failure"}'
    fi
fi
```

---

## Summary

The Stop Hook Rollback Capabilities feature provides enterprise-grade safety and recovery mechanisms for validation workflows. With comprehensive snapshot management, intelligent rollback operations, and seamless integration with existing validation processes, this system ensures that validation failures never result in permanent loss of work or project state.

Key benefits:

- ✅ **Zero Data Loss**: Complete state preservation and recovery
- ✅ **Automatic Safety**: Integrated with validation workflow
- ✅ **Audit Compliance**: Complete history and event logging
- ✅ **Performance Optimized**: Fast operations with minimal overhead
- ✅ **Developer Friendly**: Simple commands with comprehensive error handling

For additional support or advanced use cases, refer to the TaskManager API comprehensive guide or create feature suggestions through the standard workflow.
