# Multi-Agent System API Documentation

## Overview

The Multi-Agent System extends the TaskManager with sophisticated agent coordination, distributed locking, and intelligent task orchestration capabilities. This system enables multiple Claude Code agents to work collaboratively on complex projects while preventing conflicts and ensuring data consistency.

## Architecture Components

### Core Components

1. **AgentManager** (`lib/agentManager.js`) - Agent lifecycle and capability management
2. **TaskManager** (`lib/taskManager.js`) - Enhanced with multi-agent task assignment
3. **DistributedLockManager** (`lib/distributedLockManager.js`) - File access coordination
4. **MultiAgentOrchestrator** (`lib/multiAgentOrchestrator.js`) - High-level orchestration

### Data Schema Extensions

#### TODO.json Multi-Agent Fields

```javascript
{
  "project": "project-name",
  "tasks": [
    {
      "id": "task_id",
      "title": "Task Title",
      "description": "Task Description",
      "mode": "DEVELOPMENT",
      
      // Multi-agent fields
      "assigned_agent": "agent_id",
      "agent_assignment_history": [
        {
          "agentId": "agent_id",
          "role": "primary",
          "assignedAt": "2025-01-01T00:00:00Z",
          "reassignReason": null,
          "claimPriority": "high"
        }
      ],
      "parallel_execution": {
        "canParallelize": true,
        "parallelWith": ["task_id_2", "task_id_3"],
        "coordinatorTask": "coordinator_agent_id",
        "role": "master",
        "syncPoints": ["checkpoint_1"],
        "createdAt": "2025-01-01T00:00:00Z"
      }
    }
  ],
  
  // Agent registry
  "agents": {
    "agent_id": {
      "name": "Development Agent 001",
      "role": "development",
      "specialization": ["build-fixes", "testing"],
      "status": "active",
      "assignedTasks": ["task_1", "task_2"],
      "lastHeartbeat": "2025-01-01T00:00:00Z",
      "parentAgentId": null,
      "capabilities": ["linting", "testing", "file-operations"],
      "workload": 2,
      "maxConcurrentTasks": 5,
      "createdAt": "2025-01-01T00:00:00Z",
      "sessionId": "session_123",
      "metadata": {}
    }
  }
}
```

## API Reference

### AgentManager

#### Core Methods

```bash
# Register a new agent
node -e "
const AgentManager = require('./lib/agentManager');
const am = new AgentManager('./TODO.json');
am.registerAgent({
  role: 'development',
  specialization: ['build-fixes', 'testing'],
  sessionId: 'session_123',
  maxConcurrentTasks: 3
}).then(agentId => console.log('Agent ID:', agentId));
"

# Get active agents
node -e "
const AgentManager = require('./lib/agentManager');
const am = new AgentManager('./TODO.json');
am.getActiveAgents({role: 'development'}).then(agents => 
  console.log(JSON.stringify(agents, null, 2))
);
"

# Find best agent for task
node -e "
const AgentManager = require('./lib/agentManager');
const am = new AgentManager('./TODO.json');
const task = {mode: 'DEVELOPMENT', priority: 'high', specialization: 'build-fixes'};
am.findBestAgentForTask(task).then(agentId => console.log('Best agent:', agentId));
"

# Update agent workload
node -e "
const AgentManager = require('./lib/agentManager');
const am = new AgentManager('./TODO.json');
am.updateAgentWorkload('agent_id', 1).then(success => console.log('Updated:', success));
"

# Unregister agent
node -e "
const AgentManager = require('./lib/agentManager');
const am = new AgentManager('./TODO.json');
am.unregisterAgent('agent_id').then(success => console.log('Unregistered:', success));
"
```

#### Agent Capabilities by Role

- **development**: `['file-operations', 'linting', 'testing', 'build-fixes', 'refactoring']`
- **testing**: `['test-creation', 'test-execution', 'coverage-analysis', 'test-debugging']`
- **review**: `['code-review', 'quality-assessment', 'documentation-review', 'security-audit']`
- **research**: `['codebase-analysis', 'architecture-research', 'dependency-analysis', 'pattern-investigation']`
- **coordination**: `['multi-agent-orchestration', 'conflict-resolution', 'task-distribution', 'synchronization']`
- **deployment**: `['ci-cd', 'deployment-scripts', 'environment-setup', 'monitoring-setup']`
- **security**: `['vulnerability-scanning', 'auth-implementation', 'secure-coding', 'compliance-checks']`
- **performance**: `['profiling', 'optimization', 'load-testing', 'memory-analysis']`

### TaskManager Multi-Agent Extensions

#### Task Assignment

```bash
# Assign task to agent
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json', {enableMultiAgent: true});
tm.assignTaskToAgent('task_id', 'agent_id', 'primary').then(success => 
  console.log('Assigned:', success)
);
"

# Get tasks for agent
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.getTasksForAgent('agent_id', true).then(tasks => 
  console.log('Agent tasks:', tasks.length)
);
"

# Claim task (with distributed locking)
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json', {enableMultiAgent: true});
tm.claimTask('task_id', 'agent_id', 'high').then(result => 
  console.log(JSON.stringify(result, null, 2))
);
"

# Reassign task
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.reassignTask('task_id', 'old_agent_id', 'new_agent_id', 'agent_failure').then(success => 
  console.log('Reassigned:', success)
);
"

# Release task from agent
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.releaseTaskFromAgent('task_id', 'agent_id').then(success => 
  console.log('Released:', success)
);
"
```

#### Parallel Execution

```bash
# Get available tasks for multiple agents
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.getAvailableTasksForAgents(3, [['linting', 'testing'], ['code-review']]).then(tasks => 
  console.log('Available tasks:', tasks.length)
);
"

# Get parallelizable tasks
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.getParallelizableTasks(3).then(groups => 
  console.log('Parallel groups:', groups.length)
);
"

# Create coordinated execution
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.createCoordinatedExecution('master_task_id', ['worker_task_1', 'worker_task_2'], 'coordinator_agent_id')
  .then(result => console.log(JSON.stringify(result, null, 2)));
"

# Create parallel execution
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.createParallelExecution(['task_1', 'task_2', 'task_3'], ['agent_1', 'agent_2', 'agent_3'], ['sync_point_1'])
  .then(result => console.log(JSON.stringify(result, null, 2)));
"
```

#### Statistics

```bash
# Get multi-agent statistics
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.getMultiAgentStatistics().then(stats => 
  console.log(JSON.stringify(stats, null, 2))
);
"
```

### DistributedLockManager

#### Lock Operations

```bash
# Acquire lock with timeout
node -e "
const DistributedLockManager = require('./lib/distributedLockManager');
const dlm = new DistributedLockManager({lockTimeout: 30000});
dlm.acquireLock('./TODO.json', 'agent_id', 5000).then(result => 
  console.log(JSON.stringify(result, null, 2))
);
"

# Release lock
node -e "
const DistributedLockManager = require('./lib/distributedLockManager');
const dlm = new DistributedLockManager();
dlm.releaseLock('./TODO.json', 'agent_id').then(result => 
  console.log(JSON.stringify(result, null, 2))
);
"

# Detect conflicts
node -e "
const DistributedLockManager = require('./lib/distributedLockManager');
const dlm = new DistributedLockManager();
dlm.detectConflicts('./TODO.json', 'agent_id', 'write').then(conflicts => 
  console.log(JSON.stringify(conflicts, null, 2))
);
"

# Get lock statistics
node -e "
const DistributedLockManager = require('./lib/distributedLockManager');
const dlm = new DistributedLockManager();
console.log(JSON.stringify(dlm.getStatistics(), null, 2));
"
```

#### Lock Configuration Options

```javascript
{
  lockTimeout: 30000,        // Lock timeout in milliseconds
  lockRetryInterval: 100,    // Retry interval in milliseconds
  maxRetries: 50,           // Maximum retry attempts
  lockDirectory: './.locks', // Directory for lock files
  enableDeadlockDetection: true // Enable deadlock detection
}
```

### MultiAgentOrchestrator

#### Session Management

```bash
# Initialize multi-agent session
node -e "
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');
const orchestrator = new MultiAgentOrchestrator('./TODO.json');
const agentConfigs = [
  {role: 'development', specialization: ['build-fixes']},
  {role: 'testing', specialization: ['unit-tests']},
  {role: 'review', specialization: ['code-review']}
];
orchestrator.initializeSession(agentConfigs).then(result => 
  console.log(JSON.stringify(result, null, 2))
);
"
```

#### Task Distribution

```bash
# Intelligent task distribution
node -e "
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');
const orchestrator = new MultiAgentOrchestrator('./TODO.json');
orchestrator.orchestrateTaskDistribution({
  strategy: 'intelligent',
  maxTasks: 3,
  agentFilters: {role: 'development'}
}).then(result => console.log(JSON.stringify(result, null, 2)));
"

# Round-robin distribution
node -e "
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');
const orchestrator = new MultiAgentOrchestrator('./TODO.json');
orchestrator.orchestrateTaskDistribution({
  strategy: 'round_robin',
  maxTasks: 5
}).then(result => console.log(JSON.stringify(result, null, 2)));
"

# Capability-based distribution
node -e "
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');
const orchestrator = new MultiAgentOrchestrator('./TODO.json');
orchestrator.orchestrateTaskDistribution({
  strategy: 'capability_based',
  maxTasks: 3
}).then(result => console.log(JSON.stringify(result, null, 2)));
"

# Load-balanced distribution
node -e "
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');
const orchestrator = new MultiAgentOrchestrator('./TODO.json');
orchestrator.orchestrateTaskDistribution({
  strategy: 'load_balanced',
  maxTasks: 4
}).then(result => console.log(JSON.stringify(result, null, 2)));
"
```

#### Parallel Execution Management

```bash
# Create parallel execution
node -e "
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');
const orchestrator = new MultiAgentOrchestrator('./TODO.json');
orchestrator.createParallelExecution(['task_1', 'task_2', 'task_3'], {
  coordinatorRequired: false,
  syncPoints: ['checkpoint_1'],
  timeout: 60000
}).then(result => console.log(JSON.stringify(result, null, 2)));
"

# Create coordinated execution
node -e "
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');
const orchestrator = new MultiAgentOrchestrator('./TODO.json');
orchestrator.createParallelExecution(['master_task', 'worker_1', 'worker_2'], {
  coordinatorRequired: true,
  timeout: 90000
}).then(result => console.log(JSON.stringify(result, null, 2)));
"

# Monitor coordinations
node -e "
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');
const orchestrator = new MultiAgentOrchestrator('./TODO.json');
orchestrator.monitorCoordinations().then(status => 
  console.log(JSON.stringify(status, null, 2))
);
"
```

#### Statistics and Monitoring

```bash
# Get orchestration statistics
node -e "
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');
const orchestrator = new MultiAgentOrchestrator('./TODO.json');
orchestrator.getOrchestrationStatistics().then(stats => 
  console.log(JSON.stringify(stats, null, 2))
);
"
```

## Configuration Options

### TaskManager Multi-Agent Options

```javascript
{
  enableMultiAgent: true,           // Enable multi-agent features
  lockTimeout: 30000,              // Lock timeout for task claiming
  enableDeadlockDetection: true,   // Enable deadlock detection
  lockManager: {                   // DistributedLockManager options
    lockDirectory: './.locks',
    maxRetries: 50
  }
}
```

### AgentManager Options

```javascript
{
  maxConcurrentTasks: 5,           // Default max tasks per agent
  agentTimeout: 300000,            // Agent heartbeat timeout (5 minutes)
  heartbeatInterval: 30000,        // Heartbeat check interval (30 seconds)
  enableDistributedMode: true      // Enable distributed coordination
}
```

### MultiAgentOrchestrator Options

```javascript
{
  maxParallelAgents: 3,            // Maximum parallel agents
  coordinationTimeout: 60000,      // Coordination timeout (1 minute)
  enableLoadBalancing: true,       // Enable load balancing
  enableIntelligentAssignment: true, // Enable intelligent task assignment
  retryFailedTasks: true          // Retry failed tasks
}
```

## Usage Patterns

### Basic Multi-Agent Setup

```bash
# 1. Initialize components
node -e "
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');
const orchestrator = new MultiAgentOrchestrator('./TODO.json', {
  maxParallelAgents: 3,
  coordinationTimeout: 60000
});

// 2. Register agents
const agentConfigs = [
  {role: 'development', specialization: ['build-fixes']},
  {role: 'testing', specialization: ['unit-tests']},
  {role: 'review', specialization: ['code-review']}
];

orchestrator.initializeSession(agentConfigs).then(session => {
  console.log('Session initialized:', session.sessionId);
  console.log('Registered agents:', session.totalRegistered);
});
"
```

### Task Distribution Workflow

```bash
# 1. Create tasks
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json', {enableMultiAgent: true});

// Create multiple tasks
Promise.all([
  tm.createTask({title: 'Build Fix', mode: 'DEVELOPMENT', priority: 'high'}),
  tm.createTask({title: 'Unit Tests', mode: 'TESTING', priority: 'medium'}),
  tm.createTask({title: 'Code Review', mode: 'REVIEW', priority: 'low'})
]).then(taskIds => {
  console.log('Created tasks:', taskIds);
});
"

# 2. Distribute tasks
node -e "
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');
const orchestrator = new MultiAgentOrchestrator('./TODO.json');

orchestrator.orchestrateTaskDistribution({
  strategy: 'intelligent',
  maxTasks: 3
}).then(result => {
  console.log('Distribution completed:', result.success);
  console.log('Tasks assigned:', result.distribution.totalAssigned);
});
"
```

### Parallel Execution Workflow

```bash
# 1. Create parallelizable tasks
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');

Promise.all([
  tm.createTask({title: 'Frontend Tests', mode: 'TESTING'}),
  tm.createTask({title: 'Backend Tests', mode: 'TESTING'}),
  tm.createTask({title: 'Integration Tests', mode: 'TESTING'})
]).then(async taskIds => {
  // 2. Create parallel execution
  const result = await tm.createParallelExecution(
    taskIds,
    ['test_agent_1', 'test_agent_2', 'test_agent_3'],
    ['test_completion_sync']
  );
  console.log('Parallel execution created:', result.success);
});
"
```

### Error Handling and Recovery

```bash
# Handle agent failures
node -e "
const AgentManager = require('./lib/agentManager');
const TaskManager = require('./lib/taskManager');

const am = new AgentManager('./TODO.json');
const tm = new TaskManager('./TODO.json');

// Simulate agent failure by unregistering
am.unregisterAgent('failed_agent_id').then(async (removed) => {
  if (removed) {
    console.log('Agent removed due to failure');
    
    // Tasks are automatically released
    const stats = await tm.getMultiAgentStatistics();
    console.log('Unassigned tasks:', stats.unassignedTasks);
  }
});
"
```

## Best Practices

### Agent Naming Convention

```
Format: {role}_{sessionId}_{instance}_{specialization}_{hash}

Examples:
- dev_session_123_001_build_a1b2c3d4
- test_session_123_002_unit_e5f6g7h8
- review_session_123_001_code_i9j0k1l2
```

### Task Assignment Strategy

1. **Capability Matching**: Assign tasks to agents with matching capabilities
2. **Load Balancing**: Distribute workload evenly across agents
3. **Priority Handling**: High-priority tasks get preference in assignment
4. **Dependency Management**: Ensure dependencies are resolved before assignment

### Conflict Resolution

1. **File Locking**: Use distributed locks for TODO.json modifications
2. **Deadlock Detection**: Monitor and resolve circular dependencies
3. **Graceful Degradation**: Fall back to single-agent mode on coordination failures
4. **Retry Logic**: Implement exponential backoff for transient failures

### Performance Optimization

1. **Parallel Execution**: Maximize concurrent task execution
2. **Intelligent Queuing**: Optimize task order for dependency resolution
3. **Resource Management**: Monitor and balance agent workloads
4. **Timeout Handling**: Set appropriate timeouts for coordination operations

## Troubleshooting

### Common Issues

1. **Lock Timeout**: Increase `lockTimeout` for slow operations
2. **Agent Heartbeat Failure**: Check network connectivity and agent health
3. **Task Assignment Conflicts**: Verify agent capabilities match task requirements
4. **Coordination Timeout**: Increase `coordinationTimeout` for complex workflows

### Debugging Commands

```bash
# Check agent status
node -e "
const AgentManager = require('./lib/agentManager');
const am = new AgentManager('./TODO.json');
am.getAgentStatistics().then(stats => console.log(JSON.stringify(stats, null, 2)));
"

# Check lock status
node -e "
const DistributedLockManager = require('./lib/distributedLockManager');
const dlm = new DistributedLockManager();
console.log('Lock stats:', JSON.stringify(dlm.getStatistics(), null, 2));
"

# Check coordination status
node -e "
const MultiAgentOrchestrator = require('./lib/multiAgentOrchestrator');
const orchestrator = new MultiAgentOrchestrator('./TODO.json');
orchestrator.monitorCoordinations().then(status => 
  console.log('Coordinations:', JSON.stringify(status, null, 2))
);
"
```

## Integration with Claude Code

The Multi-Agent System integrates seamlessly with the existing Claude Code hook system:

1. **Automatic Agent Registration**: Agents can be registered automatically based on session context
2. **Task Distribution**: Tasks are distributed intelligently based on agent capabilities
3. **Conflict Prevention**: Distributed locking prevents concurrent modification conflicts
4. **Performance Monitoring**: Real-time monitoring of agent performance and coordination status

For complete integration examples, see the test suite in `test/multiAgent.test.js`.