# Infinite Continue Stop Hook - API Reference

> **Version**: 2.0.0  
> **Description**: Universal TaskManager API for agent-driven development workflows

## Table of Contents

- [Overview](#overview)
- [TaskManager API](#taskmanager-api)
- [CLI Interface](#cli-interface)
- [Hook System API](#hook-system-api)
- [Data Schemas](#data-schemas)
- [Error Handling](#error-handling)
- [Integration Patterns](#integration-patterns)

## Overview

The Infinite Continue Stop Hook system provides a comprehensive API for managing tasks, agents, and workflows in development environments. It consists of three main components:

1. **TaskManager Class**: Core business logic and data operations
2. **CLI Interface**: Command-line interface through `taskmanager-api.js`
3. **Hook System**: Stop hook management and agent lifecycle

## TaskManager API

### Constructor

```javascript
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager(todoPath, options);
```

#### Parameters

- `todoPath` (string): Path to TODO.json file
- `options` (object, optional):
  - `projectRoot` (string): Project root directory for security validation
  - `enableAutoFix` (boolean): Enable automatic corruption fixing (default: true)
  - `validateOnRead` (boolean): Validate data structure on read (default: false)

### Core Methods

#### Task Management

##### `createTask(taskData, options)`

Creates a new task with comprehensive validation and automatic ID generation.

```javascript
const task = await taskManager.createTask({
  title: 'Fix ESLint violations in auth.js',
  description: 'Resolve linting errors and style issues',
  category: 'error', // Required: error|feature|subtask|test
  priority: 'high', // Optional: low|medium|high|critical
  dependencies: [], // Optional: array of task IDs
  important_files: ['src/auth.js', 'eslint.config.js'], // Optional
  requires_research: false, // Optional
});
```

**Returns**: Promise resolving to created task object

**Task Categories (Priority Order)**:

1. `error` - System errors, linter violations, build failures (Priority 1)
2. `feature` - New functionality, enhancements, refactoring (Priority 2)
3. `subtask` - Feature implementation components (Priority 3)
4. `test` - Test coverage, test creation (Priority 4)

##### `claimTask(taskId, agentId, priority, options)`

Claims a task for an agent with priority validation and order enforcement.

```javascript
const result = await taskManager.claimTask(
  'feature_1234567890_abc123',
  'agent_development_001',
  'normal', // normal|urgent
  {
    allowOutOfOrder: false, // Override priority order
    reason: 'User request', // Reason for override
  }
);
```

**Returns**: Promise resolving to claim result with success status

##### `updateTaskStatus(taskId, status, message, options)`

Updates task status with validation and history tracking.

```javascript
await taskManager.updateTaskStatus('feature_1234567890_abc123', 'completed', 'Task completed successfully', {
  agentId: 'agent_development_001',
  evidence: {
    lintPassed: true,
    testsRun: 15,
    buildSuccessful: true,
  },
});
```

**Valid Statuses**: `pending`, `in_progress`, `completed`, `failed`, `blocked`

##### `getCurrentTask(agentId)`

Retrieves the currently assigned task for an agent.

```javascript
const currentTask = await taskManager.getCurrentTask('agent_development_001');
```

**Returns**: Promise resolving to task object or null

##### `queryTasks(filter, options)`

Advanced task querying with filtering and sorting capabilities.

```javascript
const tasks = await taskManager.queryTasks(
  {
    status: 'pending',
    category: 'error',
    priority: 'high',
  },
  {
    sort: 'created_at',
    limit: 10,
    includeHistory: true,
  }
);
```

**Filter Options**:

- `status`: Task status
- `category`: Task category
- `priority`: Task priority
- `assigned_agent`: Agent ID
- `created_after`: ISO date string
- `has_dependencies`: Boolean

#### Agent Management

##### `agentRegistry.registerAgent(agentId, config)`

Registers a new agent in the system.

```javascript
const agent = await taskManager.agentRegistry.registerAgent('development_session_123_general_abc', {
  role: 'development', // development|testing|research|coordination
  sessionId: 'session_123',
  specialization: ['javascript', 'react'],
  capabilities: {
    concurrent_tasks: 3,
    complexity_rating: 'high',
  },
});
```

**Agent Roles**:

- `development`: General development tasks
- `testing`: Test creation and validation
- `research`: Research and analysis tasks
- `coordination`: Multi-agent coordination

##### `agentRegistry.updateHeartbeat(agentId)`

Updates agent heartbeat to maintain active status.

```javascript
await taskManager.agentRegistry.updateHeartbeat('agent_development_001');
```

**Note**: Agents become stale after 15 minutes of inactivity

##### `cleanupStaleAgents()`

Removes inactive agents and unassigns their tasks.

```javascript
const cleanup = await taskManager.cleanupStaleAgents();
// Returns: { removed: 2, tasksUnassigned: 5 }
```

#### Data Operations

##### `readTodo()`

Reads and validates TODO.json with automatic corruption fixing.

```javascript
const todoData = await taskManager.readTodo();
```

**Returns**: Promise resolving to validated TODO.json structure

##### `writeTodo(todoData)`

Writes TODO.json with validation and backup creation.

```javascript
await taskManager.writeTodo(todoData);
```

##### `autoFixer.autoFix(filePath)`

Automatically fixes common TODO.json corruption issues.

```javascript
const fixResult = await taskManager.autoFixer.autoFix('./TODO.json');
```

**Returns**:

```javascript
{
  fixed: boolean,
  fixesApplied: string[],
  backupCreated: string,
  errors: string[]
}
```

#### Feature Management

##### `createFeature(featureData)`

Creates a feature in the TODO.json features array.

```javascript
const feature = await taskManager.createFeature({
  title: 'User Authentication System',
  description: 'Complete authentication with login, signup, and session management',
  category: 'security',
  status: 'planned', // planned|approved|in_progress|implemented|rejected
  priority: 'high',
  subtasks: [
    {
      title: 'Implement login form',
      description: 'Create React login component',
      estimated_hours: 4,
    },
  ],
});
```

##### `approveFeature(featureId)`

Approves a feature for implementation.

```javascript
const result = await taskManager.approveFeature('feature_123_auth');
```

##### `suggestFeature(suggestion)`

Creates a feature suggestion for user approval.

```javascript
const suggestion = await taskManager.suggestFeature({
  title: 'Dark Mode Theme',
  description: 'Add dark/light theme toggle to improve user experience',
  rationale: 'Many users prefer dark themes for reduced eye strain',
  implementation_estimate: '2-3 hours',
});
```

### Advanced Methods

#### Multi-Agent Coordination

##### `createCoordinatedExecution(taskIds, options)`

Sets up coordinated multi-agent task execution.

```javascript
const coordination = await taskManager.createCoordinatedExecution(['task_1', 'task_2', 'task_3'], {
  coordinatorRequired: true,
  maxConcurrent: 3,
  dependencies: {
    task_2: ['task_1'],
    task_3: ['task_1', 'task_2'],
  },
});
```

##### `distributeTasksToAgents(taskIds, availableAgents)`

Intelligently distributes tasks to available agents.

```javascript
const distribution = await taskManager.distributeTasksToAgents(['task_1', 'task_2', 'task_3'], ['agent_1', 'agent_2']);
```

#### Quality Gates

##### `executeQualityGates(taskId)`

Runs quality validation for task completion.

```javascript
const validation = await taskManager.executeQualityGates('task_123');
```

**Returns**:

```javascript
{
  passed: boolean,
  gates: {
    linting: { passed: true, errors: [] },
    testing: { passed: true, coverage: 95 },
    building: { passed: true, warnings: [] }
  }
}
```

##### `addQualityGate(taskId, gateConfig)`

Adds custom quality gates to a task.

```javascript
await taskManager.addQualityGate('task_123', {
  name: 'security_scan',
  command: 'npm run security-audit',
  required: true,
  timeout: 30000,
});
```

## CLI Interface

The CLI interface is provided through `taskmanager-api.js` and offers all core functionality through command-line operations.

### Basic Usage

```bash
node taskmanager-api.js <command> [arguments] [options]
```

### Commands

#### Agent Lifecycle

##### `init`

Initialize a new agent session.

```bash
# Basic initialization
node taskmanager-api.js init

# With configuration
node taskmanager-api.js init '{"role":"development","specialization":["react","node"]}'
```

**Returns**: Agent ID and registration confirmation

##### `reinitialize <agentId>`

Refresh agent registration and renew heartbeat.

```bash
node taskmanager-api.js reinitialize development_session_123_general_abc
```

##### `status [agentId]`

Get agent status and current tasks.

```bash
# Current agent status
node taskmanager-api.js status

# Specific agent status
node taskmanager-api.js status development_session_123_general_abc
```

#### Task Operations

##### `create <taskData>`

Create a new task with required categorization.

```bash
# Error task (highest priority)
node taskmanager-api.js create '{"title":"Fix ESLint violations","description":"Resolve linting errors in auth.js","category":"error"}'

# Feature task
node taskmanager-api.js create '{"title":"Add dark mode","description":"Implement theme switching","category":"feature","priority":"high"}'

# With dependencies and files
node taskmanager-api.js create '{"title":"Implement login","description":"Create login form","category":"subtask","dependencies":["task_123"],"important_files":["src/auth.js","src/login.js"]}'
```

**Required Fields**:

- `title`: Task title
- `description`: Detailed description
- `category`: Task category (error|feature|subtask|test)

**Optional Fields**:

- `priority`: Priority level (low|medium|high|critical)
- `dependencies`: Array of task IDs
- `important_files`: Array of file paths
- `requires_research`: Boolean

##### `claim <taskId> [agentId]`

Claim a task for execution.

```bash
# Claim task for current agent
node taskmanager-api.js claim feature_1234567890_abc123

# Claim task for specific agent
node taskmanager-api.js claim feature_1234567890_abc123 development_session_123_general_abc

# Override priority order
node taskmanager-api.js claim test_1234567890_xyz789 --allow-out-of-order --reason "User request"
```

##### `complete <taskId> [completionData]`

Mark a task as completed.

```bash
# Basic completion
node taskmanager-api.js complete feature_1234567890_abc123

# With completion data
node taskmanager-api.js complete feature_1234567890_abc123 '{"message":"Task completed successfully","lintPassed":true,"testsRun":15}'
```

##### `list [filter]`

List tasks with optional filtering.

```bash
# List all pending tasks
node taskmanager-api.js list '{"status":"pending"}'

# List error tasks
node taskmanager-api.js list '{"category":"error"}'

# List tasks for specific agent
node taskmanager-api.js list '{"assigned_agent":"development_session_123_general_abc"}'

# Complex filtering
node taskmanager-api.js list '{"status":"pending","category":"error","priority":"high"}'
```

##### `current [agentId]`

Get current task for agent.

```bash
# Current agent's task
node taskmanager-api.js current

# Specific agent's task
node taskmanager-api.js current development_session_123_general_abc
```

#### Task Management

##### `delete <taskId>`

Delete a task.

```bash
node taskmanager-api.js delete feature_1234567890_abc123
```

##### `move-up <taskId>`, `move-down <taskId>`, `move-top <taskId>`, `move-bottom <taskId>`

Reorder tasks in the queue.

```bash
# Move task up in priority
node taskmanager-api.js move-up feature_1234567890_abc123

# Move to top priority
node taskmanager-api.js move-top feature_1234567890_abc123
```

#### Feature Management

##### `suggest-feature <suggestion>`

Suggest a new feature for approval.

```bash
node taskmanager-api.js suggest-feature '{"title":"Dark Mode","description":"Add theme switching","rationale":"Better user experience"}'
```

##### `approve-feature <featureId>`

Approve a suggested feature.

```bash
node taskmanager-api.js approve-feature feature_suggestion_123
```

##### `list-features [filter]`

List features with filtering.

```bash
# List all features
node taskmanager-api.js list-features

# List approved features
node taskmanager-api.js list-features '{"status":"approved"}'
```

#### Information Commands

##### `guide`

Get comprehensive API guide and documentation.

```bash
node taskmanager-api.js guide
```

##### `methods`

List all available API methods.

```bash
node taskmanager-api.js methods
```

##### `stats`

Get system statistics.

```bash
node taskmanager-api.js stats
```

### Command Options

Most commands support additional options:

- `--timeout <ms>`: Set command timeout (default: 10000ms)
- `--allow-out-of-order`: Override task priority order
- `--reason <string>`: Reason for override actions
- `--verbose`: Enable verbose output
- `--json`: Output in JSON format

### Examples

#### Complete Workflow Example

```bash
# 1. Initialize agent
node taskmanager-api.js init

# 2. Create an error task (highest priority)
node taskmanager-api.js create '{"title":"Fix build errors","description":"Resolve compilation issues","category":"error"}'

# 3. List pending tasks to see prioritization
node taskmanager-api.js list '{"status":"pending"}'

# 4. Claim the highest priority task
node taskmanager-api.js claim error_1234567890_abc123

# 5. Check current task
node taskmanager-api.js current

# 6. Complete the task
node taskmanager-api.js complete error_1234567890_abc123 '{"message":"Build errors resolved","lintPassed":true}'

# 7. Get agent status
node taskmanager-api.js status
```

#### Multi-Agent Coordination

```bash
# Agent 1: Initialize as development agent
node taskmanager-api.js init '{"role":"development","specialization":["frontend"]}'

# Agent 2: Initialize as testing agent
node taskmanager-api.js init '{"role":"testing","specialization":["e2e","unit"]}'

# Create coordinated tasks
node taskmanager-api.js create '{"title":"Implement login form","description":"Frontend login component","category":"feature"}'
node taskmanager-api.js create '{"title":"Test login functionality","description":"E2E and unit tests","category":"test","dependencies":["feature_login_123"]}'

# Agents claim appropriate tasks based on specialization
```

## Hook System API

The hook system manages the infinite continue behavior and stop authorization.

### Stop Hook Functions

#### `checkStopAllowed(workingDir)`

Checks if stop is authorized via endpoint trigger.

```javascript
const fs = require('fs');
const path = require('path');

function checkStopAllowed(workingDir = process.cwd()) {
  const stopFlagPath = path.join(workingDir, '.stop-allowed');

  if (fs.existsSync(stopFlagPath)) {
    try {
      const flagData = JSON.parse(fs.readFileSync(stopFlagPath, 'utf8'));
      fs.unlinkSync(stopFlagPath); // Single-use flag
      return flagData.stop_allowed === true;
    } catch {
      fs.unlinkSync(stopFlagPath);
      return false;
    }
  }
  return false; // Default: never allow stops
}
```

#### `authorizeStopHook(agentId, reason)`

Authorizes a single stop through TaskManager API.

```javascript
const result = await taskManager.authorizeStopHook(
  'development_session_123_general_abc',
  'All tasks completed successfully'
);
```

**Creates**: `.stop-allowed` file with single-use authorization

#### Hook Integration

The hook system integrates with Claude Code's stop hook mechanism:

```javascript
// In stop-hook.js
process.stdin.on('end', async () => {
  const stopAllowed = checkStopAllowed(workingDir);

  if (stopAllowed) {
    // Allow single stop
    process.exit(0);
  } else {
    // Continue infinitely
    console.error('🔄 INFINITE CONTINUE MODE ACTIVE');
    process.exit(2);
  }
});
```

### Setup Functions

#### Project Setup

```bash
# Setup infinite hook for current project
node setup-infinite-hook.js

# Setup with specific project path
node setup-infinite-hook.js /path/to/project --single

# Batch setup with no interaction
node setup-infinite-hook.js --batch --no-interactive
```

#### Configuration Options

- `--batch`: Non-interactive mode
- `--single`: Process single project only
- `--project-name <name>`: Override project name
- `--task <description>`: Set initial task
- `--mode <mode>`: Set task mode (DEVELOPMENT|TESTING|RESEARCH)

## Data Schemas

### TODO.json Schema

The main data structure for tasks and project state.

```typescript
interface TodoData {
  project: string;
  tasks: Task[];
  agents: Record<string, Agent>;
  features: Feature[];
  current_mode: string;
  execution_count: number;
  settings: {
    id_based_classification: boolean;
    auto_sort_enabled: boolean;
    sort_criteria: {
      primary: string;
      secondary: string;
    };
    id_priority_order: Record<string, number>;
  };
  schema_version: string;
  last_updated: string;
}
```

### Task Object Schema

```typescript
interface Task {
  id: string; // Format: {category}_{timestamp}_{randomSuffix}
  title: string;
  description: string;
  category: 'error' | 'feature' | 'subtask' | 'test';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';

  // Assignment
  assigned_agent?: string;
  claimed_by?: string;
  started_at?: string; // ISO date

  // Dependencies and files
  dependencies: string[]; // Task IDs
  important_files: string[]; // File paths

  // Metadata
  created_at: string; // ISO date
  completed_at?: string; // ISO date
  estimate?: string;
  requires_research: boolean;
  auto_research_created: boolean;

  // Subtasks
  subtasks: Subtask[];

  // History and tracking
  agent_assignment_history: AssignmentHistory[];
  status_history?: StatusHistory[];

  // Quality gates
  quality_gates?: QualityGate[];
  completion_evidence?: Record<string, any>;
}
```

### Agent Object Schema

```typescript
interface Agent {
  id: string;
  role: 'development' | 'testing' | 'research' | 'coordination';
  sessionId: string;
  specialization: string[];

  // Status
  status: 'active' | 'inactive' | 'busy';
  lastHeartbeat: string; // ISO date
  last_heartbeat: string; // Legacy compatibility

  // Capabilities
  capabilities: {
    concurrent_tasks: number;
    complexity_rating: 'low' | 'medium' | 'high';
    max_workload: number;
  };

  // Current state
  workload: number;
  current_tasks: string[]; // Task IDs

  // Statistics
  tasks_completed: number;
  tasks_failed: number;
  average_completion_time?: number;

  // Registration
  registered_at: string; // ISO date
  config: Record<string, any>;
}
```

### Feature Object Schema

```typescript
interface Feature {
  id: string;
  title: string;
  description: string;
  status: 'suggested' | 'planned' | 'approved' | 'in_progress' | 'implemented' | 'rejected';
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Implementation
  subtasks: FeatureSubtask[];
  task_ids: string[]; // Generated task IDs

  // Metadata
  created_at: string;
  approved_at?: string;
  completed_at?: string;
  completion_percentage: number;

  // Requirements
  estimated_hours?: number;
  requirements: string[];
  acceptance_criteria: string[];

  // Tracking
  suggestion_history?: FeatureSuggestion[];
}
```

### DONE.json Schema

Archive structure for completed tasks.

```typescript
interface DoneData {
  project: string;
  completed_tasks: Task[];
  archived_at: string;
  total_tasks: number;
  completion_stats: {
    by_category: Record<string, number>;
    by_agent: Record<string, number>;
    average_completion_time: number;
    total_time_spent: number;
  };
}
```

### Subtask Schema

```typescript
interface Subtask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_agent?: string;
  estimated_hours?: number;
  completed_at?: string;
}
```

### Assignment History Schema

```typescript
interface AssignmentHistory {
  agentId: string;
  role: 'primary' | 'secondary' | 'coordinator';
  assignedAt: string; // ISO date
  unassignedAt?: string; // ISO date
  reassignReason?: string;
  claimPriority: 'normal' | 'urgent' | 'override';
  action?: 'assign' | 'unassign' | 'auto_unassign_stale' | 'auto_reset_stale';
  timestamp?: string;
  reason?: string;
}
```

### Quality Gate Schema

```typescript
interface QualityGate {
  name: string;
  command: string;
  required: boolean;
  timeout: number; // milliseconds
  passed?: boolean;
  output?: string;
  error?: string;
  executed_at?: string;
}
```

## Error Handling

### Error Categories

The system defines specific error categories with standardized handling:

#### 1. Validation Errors

```typescript
class ValidationError extends Error {
  constructor(message: string, field?: string, value?: any) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}
```

**Examples**:

- Missing required fields in task creation
- Invalid task category values
- Malformed agent IDs

#### 2. Corruption Errors

```typescript
class CorruptionError extends Error {
  constructor(message: string, filePath: string, fixes?: string[]) {
    super(message);
    this.name = 'CorruptionError';
    this.filePath = filePath;
    this.fixes = fixes || [];
  }
}
```

**Auto-Fix Capable**:

- JSON syntax errors
- Missing required fields
- Invalid data structures
- Double-encoded JSON strings

#### 3. Security Errors

```typescript
class SecurityError extends Error {
  constructor(message: string, attemptedPath?: string) {
    super(message);
    this.name = 'SecurityError';
    this.attemptedPath = attemptedPath;
  }
}
```

**Triggers**:

- Path traversal attempts
- Access outside project boundaries
- Invalid agent IDs with suspicious patterns

#### 4. Concurrency Errors

```typescript
class ConcurrencyError extends Error {
  constructor(message: string, resource: string) {
    super(message);
    this.name = 'ConcurrencyError';
    this.resource = resource;
  }
}
```

**Scenarios**:

- Multiple agents claiming same task
- Concurrent TODO.json modifications
- Lock acquisition failures

### Error Codes

Standard error codes for API responses:

```typescript
const ERROR_CODES = {
  // Validation
  INVALID_TASK_CATEGORY: 'E001',
  MISSING_REQUIRED_FIELD: 'E002',
  INVALID_AGENT_ID: 'E003',

  // Data
  TODO_CORRUPTED: 'E101',
  TODO_NOT_FOUND: 'E102',
  AUTO_FIX_FAILED: 'E103',

  // Security
  PATH_TRAVERSAL: 'E201',
  UNAUTHORIZED_ACCESS: 'E202',
  SUSPICIOUS_AGENT_ID: 'E203',

  // Concurrency
  TASK_ALREADY_CLAIMED: 'E301',
  AGENT_COLLISION: 'E302',
  LOCK_TIMEOUT: 'E303',

  // Business Logic
  TASK_ORDER_VIOLATION: 'E401',
  AGENT_WORKLOAD_EXCEEDED: 'E402',
  QUALITY_GATE_FAILED: 'E403',
};
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string; // Development only
    fixes?: string[]; // For auto-fixable errors
    timestamp: string;
  };
  context?: {
    taskId?: string;
    agentId?: string;
    operation?: string;
  };
}
```

### Error Handling Patterns

#### 1. Graceful Degradation

```javascript
try {
  const tasks = await taskManager.queryTasks(filter);
  return { success: true, tasks };
} catch (error) {
  if (error instanceof ValidationError) {
    // Return empty result with warning
    return {
      success: true,
      tasks: [],
      warning: 'Filter validation failed, returning all tasks',
    };
  }
  throw error; // Re-throw critical errors
}
```

#### 2. Auto-Recovery

```javascript
try {
  const todoData = await taskManager.readTodo();
  return todoData;
} catch (error) {
  if (error instanceof CorruptionError) {
    // Attempt auto-fix
    const fixResult = await taskManager.autoFixer.autoFix(todoPath);
    if (fixResult.fixed) {
      return await taskManager.readTodo();
    }
  }
  throw error;
}
```

#### 3. Retry Logic

```javascript
async function withRetry(operation, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) throw error;

      if (error instanceof ConcurrencyError) {
        // Exponential backoff for concurrency errors
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }

      throw error; // Don't retry non-recoverable errors
    }
  }
}
```

### CLI Error Handling

CLI commands return standardized error responses:

```bash
# Success response
{
  "success": true,
  "data": { ... }
}

# Error response
{
  "success": false,
  "error": {
    "code": "E001",
    "message": "Invalid task category 'invalid'",
    "details": {
      "validCategories": ["error", "feature", "subtask", "test"]
    }
  }
}
```

## Integration Patterns

### 1. Basic TaskManager Integration

```javascript
const TaskManager = require('./lib/taskManager');
const path = require('path');

class MyTaskService {
  constructor(projectRoot) {
    this.taskManager = new TaskManager(path.join(projectRoot, 'TODO.json'), {
      projectRoot,
      enableAutoFix: true,
    });
  }

  async createErrorTask(title, description, files = []) {
    return await this.taskManager.createTask({
      title,
      description,
      category: 'error',
      priority: 'high',
      important_files: files,
    });
  }

  async getAgentCurrentTask(agentId) {
    return await this.taskManager.getCurrentTask(agentId);
  }
}
```

### 2. CLI Wrapper Integration

```javascript
const { spawn } = require('child_process');
const path = require('path');

class TaskManagerCLI {
  constructor(apiPath) {
    this.apiPath = apiPath || './taskmanager-api.js';
  }

  async executeCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const process = spawn('node', [this.apiPath, command, ...args], {
        timeout: 10000,
      });

      let output = '';
      process.stdout.on('data', (data) => (output += data));

      process.on('close', (code) => {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (error) {
          reject(new Error(`Parse error: ${output}`));
        }
      });
    });
  }

  async initAgent(config = {}) {
    return await this.executeCommand('init', [JSON.stringify(config)]);
  }

  async createTask(taskData) {
    return await this.executeCommand('create', [JSON.stringify(taskData)]);
  }
}
```

### 3. Multi-Agent Orchestration

```javascript
class MultiAgentTaskSystem {
  constructor(todoPath) {
    this.taskManager = new TaskManager(todoPath);
    this.agents = new Map();
  }

  async registerAgent(role, specialization = []) {
    const agent = await this.taskManager.agentRegistry.registerAgent(this.generateAgentId(role), {
      role,
      specialization,
    });

    this.agents.set(agent.id, agent);
    return agent;
  }

  async distributeWork() {
    const availableAgents = Array.from(this.agents.values()).filter((agent) => agent.status === 'active');

    const pendingTasks = await this.taskManager.queryTasks({
      status: 'pending',
    });

    // Distribute based on agent capabilities and task requirements
    const assignments = await this.taskManager.distributeTasksToAgents(
      pendingTasks.map((t) => t.id),
      availableAgents.map((a) => a.id)
    );

    return assignments;
  }

  generateAgentId(role) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `${role}_session_${timestamp}_general_${random}`;
  }
}
```

### 4. Express.js API Integration

```javascript
const express = require('express');
const TaskManager = require('./lib/taskManager');

const app = express();
app.use(express.json());

const taskManager = new TaskManager('./TODO.json');

// Task endpoints
app.post('/api/tasks', async (req, res) => {
  try {
    const task = await taskManager.createTask(req.body);
    res.json({ success: true, task });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await taskManager.queryTasks(req.query);
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/agents/:agentId/claim/:taskId', async (req, res) => {
  try {
    const result = await taskManager.claimTask(req.params.taskId, req.params.agentId, 'normal');
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Stop hook endpoint
app.post('/api/stop-hook/authorize', async (req, res) => {
  try {
    const { agentId, reason } = req.body;
    const result = await taskManager.authorizeStopHook(agentId, reason);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
```

### 5. React Frontend Integration

```javascript
class TaskManagerService {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
  }

  async createTask(taskData) {
    const response = await fetch(`${this.baseURL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    return response.json();
  }

  async getTasks(filter = {}) {
    const params = new URLSearchParams(filter);
    const response = await fetch(`${this.baseURL}/tasks?${params}`);
    return response.json();
  }

  async claimTask(taskId, agentId) {
    const response = await fetch(`${this.baseURL}/agents/${agentId}/claim/${taskId}`, { method: 'POST' });
    return response.json();
  }
}

// React hook for task management
function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const service = new TaskManagerService();

  const loadTasks = useCallback(async (filter = {}) => {
    setLoading(true);
    try {
      const result = await service.getTasks(filter);
      setTasks(result.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(
    async (taskData) => {
      const result = await service.createTask(taskData);
      if (result.success) {
        await loadTasks(); // Reload tasks
      }
      return result;
    },
    [loadTasks]
  );

  return { tasks, loading, loadTasks, createTask };
}
```

### 6. Testing Integration

```javascript
const TaskManager = require('./lib/taskManager');
const fs = require('fs');
const path = require('path');

describe('TaskManager Integration', () => {
  let taskManager;
  let testTodoPath;

  beforeEach(() => {
    // Create temporary TODO.json for testing
    testTodoPath = path.join(__dirname, 'test-todo.json');
    const testData = {
      project: 'test-project',
      tasks: [],
      agents: {},
      features: [],
      current_mode: 'DEVELOPMENT',
      execution_count: 0,
      settings: {},
      schema_version: '2.0.0',
      last_updated: new Date().toISOString(),
    };
    fs.writeFileSync(testTodoPath, JSON.stringify(testData, null, 2));

    taskManager = new TaskManager(testTodoPath);
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testTodoPath)) {
      fs.unlinkSync(testTodoPath);
    }
  });

  test('creates task with proper categorization', async () => {
    const task = await taskManager.createTask({
      title: 'Test task',
      description: 'Test description',
      category: 'feature',
    });

    expect(task.id).toMatch(/^feature_\d+_[a-z0-9]+$/);
    expect(task.category).toBe('feature');
    expect(task.status).toBe('pending');
  });

  test('enforces task priority order', async () => {
    // Create tasks in reverse priority order
    const testTask = await taskManager.createTask({
      title: 'Test task',
      description: 'Test',
      category: 'test',
    });

    const featureTask = await taskManager.createTask({
      title: 'Feature task',
      description: 'Feature',
      category: 'feature',
    });

    const errorTask = await taskManager.createTask({
      title: 'Error task',
      description: 'Error',
      category: 'error',
    });

    const tasks = await taskManager.queryTasks({ status: 'pending' });

    // Tasks should be ordered by priority
    expect(tasks[0].category).toBe('error');
    expect(tasks[1].category).toBe('feature');
    expect(tasks[2].category).toBe('test');
  });
});
```

### 7. CI/CD Integration

```yaml
# .github/workflows/taskmanager.yml
name: TaskManager Integration

on: [push, pull_request]

jobs:
  taskmanager:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Initialize TaskManager
        run: |
          node setup-infinite-hook.js . --batch --no-interactive \
            --project-name "${{ github.repository }}" \
            --task "CI/CD integration test" \
            --mode "TESTING"

      - name: Create CI tasks
        run: |
          # Create linting task
          node taskmanager-api.js init
          node taskmanager-api.js create '{
            "title": "Run ESLint checks",
            "description": "Validate code style and quality",
            "category": "error",
            "important_files": ["eslint.config.js", "src/"]
          }'

          # Create test task
          node taskmanager-api.js create '{
            "title": "Run test suite",
            "description": "Execute all unit and integration tests",
            "category": "test",
            "important_files": ["test/", "package.json"]
          }'

      - name: Execute tasks
        run: |
          # Get current agent
          AGENT_ID=$(node taskmanager-api.js status | jq -r '.agentId')

          # Process error tasks first (linting)
          ERROR_TASK=$(node taskmanager-api.js list '{"category":"error","status":"pending"}' | jq -r '.tasks[0].id')
          if [ "$ERROR_TASK" != "null" ]; then
            node taskmanager-api.js claim "$ERROR_TASK"
            npm run lint
            node taskmanager-api.js complete "$ERROR_TASK" '{"lintPassed": true}'
          fi

          # Process test tasks after errors are resolved
          TEST_TASK=$(node taskmanager-api.js list '{"category":"test","status":"pending"}' | jq -r '.tasks[0].id')
          if [ "$TEST_TASK" != "null" ]; then
            node taskmanager-api.js claim "$TEST_TASK"
            npm test
            node taskmanager-api.js complete "$TEST_TASK" '{"testsRun": true}'
          fi

      - name: Generate task report
        run: |
          node taskmanager-api.js stats > task-report.json
          cat task-report.json

      - name: Archive TaskManager logs
        uses: actions/upload-artifact@v2
        if: always()
        with:
          name: taskmanager-logs
          path: |
            TODO.json
            DONE.json
            task-report.json
            infinite-continue-hook.log
```

This comprehensive API reference provides complete documentation for integrating and using the infinite-continue-stop-hook system. The examples demonstrate real-world usage patterns and best practices for different integration scenarios.
