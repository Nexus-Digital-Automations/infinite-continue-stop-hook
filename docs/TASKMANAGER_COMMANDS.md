# TaskManager API Commands for Stop Hook Integration

This document provides bash-compatible commands for the new TaskManager API that supports agent-specific task management and stop hook integration.

## Core Workflow Commands

### Get Task Continuation Guidance
```bash
# Get guidance for current agent (auto-generates agent ID)
node -e "
const TaskManager = require('./lib/taskManager');
const agentId = process.env.CLAUDE_AGENT_ID || 'claude_agent_' + Date.now();
const tm = new TaskManager('./TODO.json');
tm.getTaskContinuationGuidance(agentId).then(guidance => {
  console.log('Action:', guidance.action);
  console.log('Instructions:');
  console.log(guidance.instructions || guidance.message);
  if (guidance.completionCommand) console.log('Completion Command:', guidance.completionCommand);
  if (guidance.nextTaskCommand) console.log('Next Task Command:', guidance.nextTaskCommand);
}).catch(err => console.error('Error:', err.message));
"
```

### Get Current Task for Agent
```bash
# Get current task for specific agent
node -e "
const TaskManager = require('./lib/taskManager');
const agentId = 'your_agent_id';
const tm = new TaskManager('./TODO.json');
tm.getCurrentTask(agentId).then(task => {
  if (task) {
    console.log('Current Task:', task.title);
    console.log('Status:', task.status);
    console.log('Description:', task.description);
  } else {
    console.log('No current task for this agent');
  }
}).catch(err => console.error('Error:', err.message));
"
```

### Get Next Available Task
```bash
# Get next task when current task is completed
node -e "
const TaskManager = require('./lib/taskManager');
const agentId = 'your_agent_id';
const completedTaskId = 'completed_task_id'; // Optional
const tm = new TaskManager('./TODO.json');
tm.getNextTask(agentId, completedTaskId).then(task => {
  if (task) {
    console.log('Next Task:', task.title);
    console.log('Mode:', task.mode);
    console.log('Priority:', task.priority);
  } else {
    console.log('No tasks available');
  }
}).catch(err => console.error('Error:', err.message));
"
```

## Task Status Management

### Mark Task as In Progress
```bash
# Start working on a task
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.updateTaskStatus('task_id_here', 'in_progress').then(() => {
  console.log('Task marked as in_progress');
}).catch(err => console.error('Error:', err.message));
"
```

### Mark Task as Completed
```bash
# Complete a task
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.updateTaskStatus('task_id_here', 'completed').then(() => {
  console.log('Task marked as completed');
}).catch(err => console.error('Error:', err.message));
"
```

## Agent Assignment Commands

### Assign Task to Agent
```bash
# Assign task to specific agent
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.assignTaskToAgent('task_id', 'agent_id', 'primary').then(success => {
  console.log('Task assigned:', success);
}).catch(err => console.error('Error:', err.message));
"
```

### Get Tasks for Agent
```bash
# Get all tasks assigned to an agent
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.getTasksForAgent('agent_id').then(tasks => {
  console.log('Agent tasks:', tasks.length);
  tasks.forEach(task => {
    console.log('-', task.title, '(' + task.status + ')');
  });
}).catch(err => console.error('Error:', err.message));
"
```

## Stop Hook Integration

### Run Simplified Stop Hook
```bash
# Run the new simplified stop hook
node stop-hook-simple.js
```

### Set Agent ID Environment Variable
```bash
# Set agent ID for consistent tracking
export CLAUDE_AGENT_ID="claude_dev_agent_$(date +%s)"
```

## Collaborative Task Management

### Check Collaborative Tasks
```bash
# Find tasks that allow collaboration
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.getExecutableTasks().then(tasks => {
  const collaborative = tasks.filter(task => 
    task.allows_collaboration !== false && 
    task.status === 'pending'
  );
  console.log('Collaborative tasks available:', collaborative.length);
  collaborative.forEach(task => {
    console.log('-', task.title, 'Agents:', task.assigned_agents?.length || 0);
  });
}).catch(err => console.error('Error:', err.message));
"
```

### Join Collaborative Task
```bash
# Add agent to collaborative task
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.assignTaskToAgent('task_id', 'agent_id', 'collaborative').then(success => {
  console.log('Joined collaborative task:', success);
}).catch(err => console.error('Error:', err.message));
"
```

## Task Information Commands

### Get Task Details
```bash
# Get detailed task information
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.readTodo().then(data => {
  const task = data.tasks.find(t => t.id === 'task_id_here');
  if (task) {
    console.log('Title:', task.title);
    console.log('Description:', task.description);
    console.log('Mode:', task.mode);
    console.log('Status:', task.status);
    console.log('Priority:', task.priority);
    if (task.success_criteria) console.log('Success Criteria:', task.success_criteria);
    if (task.assigned_agent) console.log('Assigned Agent:', task.assigned_agent);
    if (task.assigned_agents) console.log('Assigned Agents:', task.assigned_agents);
  }
}).catch(err => console.error('Error:', err.message));
"
```

### List All Tasks by Status
```bash
# List tasks by status
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.readTodo().then(data => {
  const statuses = ['pending', 'in_progress', 'completed', 'blocked'];
  statuses.forEach(status => {
    const tasks = data.tasks.filter(t => t.status === status);
    console.log(status.toUpperCase() + ':', tasks.length);
    tasks.forEach(task => console.log('  -', task.title));
  });
}).catch(err => console.error('Error:', err.message));
"
```

## Quick Status Check
```bash
# Quick project status
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.readTodo().then(data => {
  const total = data.tasks.length;
  const pending = data.tasks.filter(t => t.status === 'pending').length;
  const inProgress = data.tasks.filter(t => t.status === 'in_progress').length;
  const completed = data.tasks.filter(t => t.status === 'completed').length;
  
  console.log('📊 Project Status:');
  console.log('Total tasks:', total);
  console.log('Pending:', pending);
  console.log('In Progress:', inProgress);
  console.log('Completed:', completed);
  console.log('Progress:', Math.round((completed/total)*100) + '%');
}).catch(err => console.error('Error:', err.message));
"
```

## Example Workflows

### 1. Start Working on a Project
```bash
# Set agent ID
export CLAUDE_AGENT_ID="claude_dev_$(date +%s)"

# Get task guidance
node stop-hook-simple.js

# Follow the instructions provided
```

### 2. Complete Current Task and Get Next
```bash
# Mark current task complete
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getCurrentTask(process.env.CLAUDE_AGENT_ID).then(task => { if(task) tm.updateTaskStatus(task.id, 'completed').then(() => console.log('Completed:', task.title)); });"

# Get next task
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getNextTask(process.env.CLAUDE_AGENT_ID).then(task => { if(task) console.log('Next:', task.title); else console.log('No more tasks'); });"
```

### 3. Join Collaborative Work
```bash
# Find collaborative tasks
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.getExecutableTasks().then(tasks => tasks.filter(t => t.allows_collaboration !== false && t.status === 'pending').forEach(t => console.log(t.id, t.title)));"

# Join a task
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.assignTaskToAgent('TASK_ID', process.env.CLAUDE_AGENT_ID, 'collaborative');"
```