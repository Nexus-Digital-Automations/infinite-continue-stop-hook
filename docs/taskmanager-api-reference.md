# TaskManager API Reference

## Overview

The TaskManager API provides comprehensive task management capabilities for agent-driven development workflows. This reference covers all API endpoints, parameters, and advanced features including task priority override capabilities.

## Core Concepts

### Task Priority System

The TaskManager enforces a logical hierarchical task sorting system:

1. **Dependency Resolution** - Tasks that other tasks depend on are prioritized first (blocking tasks must be completed before dependent tasks can proceed)
2. **Category Classification** - Within same dependency status, tasks are sorted by category rank:
   - `linter-error` (rank 1) - Code style violations blocking build
   - `build-error` (rank 2) - Compilation failures blocking deployment
   - `start-error` (rank 3) - Application startup failures
   - `error` (rank 4) - Runtime bugs, security vulnerabilities
   - `enhancement` (rank 6) - New functionality, refactoring
   - `research` (rank 10) - Investigation and exploration tasks
   - `test` (rank 17) - Test coverage, unit tests, integration tests
3. **Priority Level** - Within same category, tasks sorted by priority value (critical > high > medium > low)
4. **Phase Ordering** - Within same category/priority, phase-based tasks sorted numerically
5. **Creation Time** - Within all other equal criteria, newer tasks prioritized first

**Logical Flow Examples:**

- Task A depends on Task B → Task B prioritized regardless of categories
- Both tasks are `linter-error` → Higher priority task comes first
- Same category and priority → Newer task comes first

### Task Order Override

Agents can override the normal task priority order when necessary using the `allowOutOfOrder` option. This is useful when:

- Working on urgent fixes that can't wait for normal order
- Implementing features that are independent of order
- Debugging issues that require out-of-sequence work

## API Endpoints

### Task Claiming

#### `claim` - Claim Task for Agent

Claims a task for an agent with comprehensive validation and order enforcement.

**Syntax:**

```bash
timeout 10s node taskmanager-api.js claim <taskId> [agentId] [priority]
```

**Parameters:**

- `taskId` (required) - Unique identifier of task to claim
- `agentId` (optional) - Agent ID to claim for (uses current session agent if not provided)
- `priority` (optional) - Priority level: `normal` (default), `high`, `low`

**Normal Flow Example:**

```bash
# Claim task following normal priority order
timeout 10s node taskmanager-api.js claim task_123
```

**Order Override Example:**
When task claiming fails due to order violations, agents can override:

```bash
# First attempt - may fail with order violation
timeout 10s node taskmanager-api.js claim task_456
```

**Response for order violation:**

```json
{
  "success": false,
  "reason": "Task order violation: must complete tasks in sequence",
  "nextTaskId": "task_123",
  "nextTaskTitle": "Previous task",
  "suggestion": "Complete task \"Previous task\" first, or use allowOutOfOrder: true"
}
```

**Agent Override (when justified):**

```javascript
// Use TaskManager directly with allowOutOfOrder option
const api = new TaskManagerAPI();
const result = await api.taskManager.claimTask('task_456', agentId, 'normal', {
  allowOutOfOrder: true,
});
```

### Task Creation

#### `create` - Create New Task

Creates a new task with validation and automatic categorization.

**Syntax:**

```bash
timeout 10s node taskmanager-api.js create '<json_task_data>'
```

**Required Fields:**

```json
{
  "title": "Task description",
  "description": "Detailed task information",
  "category": "error|feature|subtask|test"
}
```

**Optional Fields:**

```json
{
  "category": "linter-error|build-error|missing-feature|etc",
  "priority": "low|medium|high|critical",
  "dependencies": ["task_id_1", "task_id_2"],
  "important_files": ["file1.js", "file2.js"],
  "requires_research": false
}
```

**Example:**

```bash
timeout 10s node taskmanager-api.js create '{"title":"Fix linter errors in auth.js", "description":"Resolve ESLint violations: unused imports, missing semicolons", "category":"linter-error"}'
```

### Agent Management

#### `init` - Initialize Agent

Initializes a new agent session for task management.

**Syntax:**

```bash
timeout 10s node taskmanager-api.js init [--project-root /path/to/project]
```

**Response:**

```json
{
  "success": true,
  "agentId": "development_session_123_agent_abc",
  "config": {
    "role": "development",
    "initialized": true,
    "heartbeatInterval": 300000
  }
}
```

#### `status` - Check Agent Status

Checks current agent status and active tasks.

**Syntax:**

```bash
timeout 10s node taskmanager-api.js status [agentId]
```

### Task Operations

#### `list` - List Tasks

Lists tasks with optional filtering.

**Syntax:**

```bash
timeout 10s node taskmanager-api.js list [filter_json]
```

**Filter Examples:**

```bash
# List pending tasks
timeout 10s node taskmanager-api.js list '{"status":"pending"}'

# List error tasks
timeout 10s node taskmanager-api.js list '{"category":"linter-error"}'

# List tasks by agent
timeout 10s node taskmanager-api.js list '{"assignedTo":"agent_123"}'
```

#### `complete` - Complete Task

Marks a task as completed with optional completion data.

**Syntax:**

```bash
timeout 10s node taskmanager-api.js complete <taskId> [completion_data]
```

**Example:**

```bash
timeout 10s node taskmanager-api.js complete task_123 '{"summary":"Fixed all linter errors", "files_modified":["auth.js", "utils.js"]}'
```

### Information Commands

#### `guide` - Get Comprehensive API Guide

Returns complete API documentation and usage examples.

**Syntax:**

```bash
timeout 10s node taskmanager-api.js guide
```

#### `methods` - List Available Methods

Lists all available API endpoints and their usage.

**Syntax:**

```bash
timeout 10s node taskmanager-api.js methods
```

## Advanced Features

### Dependency Management

The API automatically handles task dependencies:

- **Dependency Detection** - Identifies incomplete dependencies before task claiming
- **Guidance Provision** - Provides specific steps to resolve dependencies
- **Order Enforcement** - Ensures dependencies are completed in correct order

**Example Dependency Response:**

```json
{
  "success": false,
  "blockedByDependencies": true,
  "dependencyInstructions": {
    "message": "🚨 DEPENDENCIES REQUIRED",
    "dependencies": [
      {
        "id": "task_setup_env",
        "title": "Setup development environment",
        "status": "pending"
      }
    ]
  }
}
```

### Research Workflow Integration

Tasks marked for research receive automatic workflow setup:

```bash
timeout 10s node taskmanager-api.js create '{"title":"API Integration Research", "description":"Research OAuth implementation patterns", "category":"feature", "requires_research":true}'
```

**Research Task Response:**

```json
{
  "success": true,
  "taskId": "task_456",
  "researchInstructions": {
    "message": "🔬 RESEARCH TASK DETECTED - RESEARCH REQUIRED FIRST",
    "reportTemplate": {
      "filename": "research-api-integration-research-1693847293.md",
      "content": "# Research Report: API Integration Research\n\n## Objective\n...\n\n## Findings\n...\n\n## Recommendations\n..."
    }
  }
}
```

### Error Recovery and Guide Integration

All error responses include contextual guidance:

```json
{
  "success": false,
  "error": "Agent not initialized",
  "guide": {
    "focus": "Agent Initialization Required",
    "immediate_action": "Run: timeout 10s node taskmanager-api.js init",
    "next_steps": ["Initialize agent with init command", "Verify with status command", "Retry task claiming"]
  }
}
```

## Task Order Override Guidelines

### When to Use allowOutOfOrder

**ALWAYS Override For:**

- **USER REQUESTS** - When user explicitly asks for a specific task, ALWAYS override order - user intent takes absolute precedence over system order

**Other Appropriate Use Cases:**

- **Urgent bug fixes** that can't wait for normal order
- **Independent features** that don't affect other work
- **Research tasks** that inform other work
- **Setup tasks** needed for other development

**Inappropriate Use Cases (for autonomous work only):**

- **Convenience** - avoiding dependencies without good reason
- **Impatience** - bypassing order just to work faster
- **Dependencies exist** - when tasks genuinely depend on others

### How to Override Order

1. **Attempt normal claim** to get order violation details
2. **Evaluate justification** for override based on project needs
3. **Use TaskManager directly** with `allowOutOfOrder: true` option
4. **Document reasoning** in task completion notes

**Code Example:**

```javascript
// Attempt normal claim
const normalResult = await api.claimTask('task_456');

if (!normalResult.success && normalResult.reason.includes('order violation')) {
  // Evaluate if override is justified
  const isUrgent = checkIfTaskIsUrgent('task_456');
  const isIndependent = checkIfTaskIsIndependent('task_456');

  if (isUrgent || isIndependent) {
    // Override with justification
    const overrideResult = await api.taskManager.claimTask('task_456', agentId, 'normal', {
      allowOutOfOrder: true,
      overrideReason: 'Urgent bug fix for production issue',
    });
  }
}
```

### Best Practices

1. **USER REQUESTS OVERRIDE ALL** - When user asks for specific task, immediately override without attempting normal claim first
2. **For autonomous work**: Always attempt normal claim first to understand order requirements
3. **Document override reasons** for future reference
4. **USER AUTHORITY PRINCIPLE**: User intent always takes precedence over system workflow order
5. **Consider impact** on other agents and workflow (except for user requests)
6. **Review dependencies** to ensure no hidden requirements (user requests may skip this)

## Error Codes and Recovery

### Common Error Scenarios

#### Agent Not Initialized

```json
{
  "success": false,
  "error": "Agent not initialized",
  "recovery": "timeout 10s node taskmanager-api.js init"
}
```

#### Task Order Violation

```json
{
  "success": false,
  "reason": "Task order violation: must complete tasks in sequence",
  "nextTaskId": "task_123",
  "suggestion": "Complete task \"Setup environment\" first, or use allowOutOfOrder: true"
}
```

#### Dependency Blocking

```json
{
  "success": false,
  "blockedByDependencies": true,
  "nextDependency": {
    "id": "task_setup",
    "title": "Setup development environment"
  }
}
```

## Performance Considerations

### Timeout Configuration

All API calls should use 10-second timeouts:

```bash
timeout 10s node taskmanager-api.js <command>
```

### Caching

The API includes intelligent caching:

- **Guide information** cached for 15 minutes
- **Task lists** cached for 1 minute
- **Agent status** cached for 30 seconds

### Concurrent Operations

The API handles concurrent operations safely:

- **Distributed locking** prevents race conditions
- **Atomic operations** ensure data consistency
- **Conflict resolution** handles concurrent claims

## Integration Examples

### Basic Agent Workflow

```bash
# 1. Initialize agent
timeout 10s node taskmanager-api.js init

# 2. Check status
timeout 10s node taskmanager-api.js status

# 3. List available tasks
timeout 10s node taskmanager-api.js list '{"status":"pending"}'

# 4. Claim next task
timeout 10s node taskmanager-api.js claim task_123

# 5. Complete task
timeout 10s node taskmanager-api.js complete task_123 '{"summary":"Task completed successfully"}'
```

### Error-First Workflow

```bash
# 1. List error tasks first
timeout 10s node taskmanager-api.js list '{"category":"error"}'

# 2. Claim highest priority error
timeout 10s node taskmanager-api.js claim task_error_1

# 3. After fixing, claim next task
timeout 10s node taskmanager-api.js list '{"status":"pending"}'
```

### Research Workflow

```bash
# 1. Create research task
timeout 10s node taskmanager-api.js create '{"title":"Research OAuth patterns", "description":"Research OAuth 2.0 implementation", "category":"feature", "requires_research":true}'

# 2. Claim research task
timeout 10s node taskmanager-api.js claim task_research_1

# 3. Complete research with findings
timeout 10s node taskmanager-api.js complete task_research_1 '{"summary":"Research completed", "research_file":"development/reports/oauth-research.md"}'
```

## Troubleshooting

### Common Issues

#### "No agent ID provided and no agent initialized"

**Solution:** Initialize agent first

```bash
timeout 10s node taskmanager-api.js init
```

#### "Task order violation"

**Solution:** Complete previous tasks or use override

```bash
# Check what task should be done first
timeout 10s node taskmanager-api.js list '{"status":"pending"}' | jq '.tasks[0]'

# Either complete that task first, or override if justified
```

#### "Task not found"

**Solution:** Check task ID and status

```bash
timeout 10s node taskmanager-api.js list | grep task_123
```

### Debug Commands

```bash
# Check API methods
timeout 10s node taskmanager-api.js methods

# Get comprehensive guide
timeout 10s node taskmanager-api.js guide

# Check agent status
timeout 10s node taskmanager-api.js status

# Validate TODO.json structure
node -e "console.log(JSON.parse(require('fs').readFileSync('TODO.json', 'utf8')).tasks.length + ' tasks found')"
```

---

**Document Information**

- **Version**: 1.0.0
- **Last Updated**: 2025-09-08
- **Component**: TaskManager API Reference
- **Status**: Production Ready
