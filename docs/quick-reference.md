# TaskManager API Quick Reference

## Essential Commands

### Agent Lifecycle
```bash
# Initialize agent
node taskmanager-api.js init

# Get status
node taskmanager-api.js status

# Reinitialize
node taskmanager-api.js reinitialize <agentId>
```

### Task Operations
```bash
# Create task (REQUIRED: category parameter)
node taskmanager-api.js create '{"title":"Task name","description":"Details","category":"error|feature|subtask|test"}'

# List tasks
node taskmanager-api.js list '{"status":"pending"}'

# Claim task
node taskmanager-api.js claim <taskId>

# Complete task
node taskmanager-api.js complete <taskId>

# Get current task
node taskmanager-api.js current
```

## Task Categories (Priority Order)

1. **`error`** - Linter violations, build failures, runtime bugs (HIGHEST)
2. **`feature`** - New functionality, enhancements, refactoring (HIGH)  
3. **`subtask`** - Feature implementation components (MEDIUM)
4. **`test`** - Test coverage, test creation (LOWEST - only after errors/features)

## Task Object Schema

```javascript
{
  id: "category_timestamp_randomSuffix", // Auto-generated
  title: "Required task title",
  description: "Required detailed description",
  category: "error|feature|subtask|test", // Required
  priority: "low|medium|high|critical", // Optional
  status: "pending|in_progress|completed|failed|blocked",
  assigned_agent: "agentId", // Auto-assigned on claim
  dependencies: ["taskId1", "taskId2"], // Optional
  important_files: ["file1.js", "file2.js"], // Optional
  created_at: "ISO date string",
  // ... additional fields
}
```

## Common Patterns

### Error Task Creation
```bash
node taskmanager-api.js create '{
  "title": "Fix ESLint violations in auth.js",
  "description": "Resolve linting errors and style issues", 
  "category": "error",
  "important_files": ["src/auth.js"]
}'
```

### Feature Task Creation
```bash
node taskmanager-api.js create '{
  "title": "Add dark mode toggle",
  "description": "Implement theme switching functionality",
  "category": "feature", 
  "priority": "medium"
}'
```

### Task Filtering
```bash
# Pending tasks only
node taskmanager-api.js list '{"status":"pending"}'

# Error tasks only  
node taskmanager-api.js list '{"category":"error"}'

# High priority tasks
node taskmanager-api.js list '{"priority":"high"}'

# Agent's tasks
node taskmanager-api.js list '{"assigned_agent":"agentId"}'
```

## API Methods (JavaScript)

```javascript
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');

// Core operations
await tm.createTask(taskData);
await tm.claimTask(taskId, agentId, 'normal');
await tm.updateTaskStatus(taskId, 'completed', message);
await tm.getCurrentTask(agentId);
await tm.queryTasks(filter, options);

// Agent management
await tm.agentRegistry.registerAgent(agentId, config);
await tm.agentRegistry.updateHeartbeat(agentId);
await tm.cleanupStaleAgents();

// Data operations
const todoData = await tm.readTodo();
await tm.writeTodo(todoData);
await tm.autoFixer.autoFix('./TODO.json');
```

## Error Codes

- `E001` - Invalid task category
- `E002` - Missing required field  
- `E101` - TODO.json corrupted
- `E201` - Security violation
- `E301` - Concurrency conflict
- `E401` - Task order violation

## Hook System

```bash
# Authorize stop (single-use)
node -e "const tm = require('./lib/taskManager'); tm.authorizeStopHook('agentId', 'reason')"

# Setup project
node setup-infinite-hook.js /path/to/project --single
```

## Development Workflow

1. **Initialize**: `node taskmanager-api.js init`
2. **Create Tasks**: Start with `error` category for critical issues
3. **Claim Work**: `node taskmanager-api.js claim <taskId>`
4. **Complete**: `node taskmanager-api.js complete <taskId>`
5. **Status Check**: `node taskmanager-api.js status`

## Best Practices

- ✅ Always include `category` parameter in task creation
- ✅ Process `error` tasks first (highest priority)
- ✅ Use descriptive titles and detailed descriptions
- ✅ Include relevant files in `important_files` array
- ✅ Complete tasks with evidence/validation data
- ❌ Never skip task categorization
- ❌ Don't claim tasks without checking current workload