# Task Repetition Detection and Anti-Stuck System

This system automatically detects when agents get stuck repeating the same tasks and provides intervention guidance to help them progress.

## Problem Solved

Sometimes agents get caught in loops where they repeatedly access the same quality improvement task without actually completing it. This system:

1. **Detects repetitive patterns** - Tracks when tasks are accessed multiple times without progress
2. **Provides intervention guidance** - Gives specific instructions on how to complete stuck tasks
3. **Offers completion commands** - Shows exact commands agents can use to mark tasks as completed
4. **Prevents infinite loops** - Breaks the cycle of repetitive task access

## How It Works

### Automatic Detection

The system automatically tracks:
- Task access frequency by agent
- Status changes over time
- Intervention events

When a task is accessed 3+ times within an hour without status changes, it's flagged as "stuck."

### Intervention Response

When a stuck task is detected, agents receive:
- **Clear completion guidance** with specific options
- **Exact completion commands** to copy/paste
- **Task breakdown suggestions** for complex tasks
- **Progress tracking tips** to avoid future repetition

## Usage

### For Agents

The system works automatically when using `getTaskContinuationGuidance()`. When repetition is detected, you'll see:

```
🚨 STUCK TASK INTERVENTION DETECTED 🚨

Task: Your task title
Repetition Count: 4 times in the last hour

## 🔄 TASK REPETITION DETECTED

This task has been accessed 4 times recently without completion...
```

**Key Actions:**
1. **Complete the task** if work is actually done
2. **Break it down** if too complex  
3. **Move on** if blocked

### For Monitoring

#### Check repetition statistics:
```bash
node check-repetition.js stats
```

#### Check specific task:
```bash
node check-repetition.js check task_123 agent_1
```

#### Get completion help:
```bash
node task-completion-helper.js guide task_123
```

#### Quick completion:
```bash
node task-completion-helper.js complete task_123 "Work finished"
```

## Available Scripts

### 1. `check-repetition.js`
Monitor and analyze task repetition patterns.

**Commands:**
- `stats` - Show overall repetition statistics
- `check <task_id> [agent_id]` - Check specific task for repetition
- `cleanup [days]` - Clean up old tracking data

### 2. `monitor-stuck-tasks.js`
Integration script for hook systems to detect stuck tasks.

**Exit codes:**
- `0` - Normal operation
- `1` - No tasks available
- `2` - Stuck task detected (intervention needed)
- `3` - Error occurred

### 3. `task-completion-helper.js`
Interactive helper for completing stuck tasks.

**Commands:**
- `guide <task_id>` - Interactive completion guidance
- `complete <task_id> [reason]` - Mark task as completed
- `breakdown <task_id>` - Help break down complex tasks

### 4. `test-repetition-system.js`
Test script to verify the system works correctly.

## Integration with Hook System

To integrate with your hook system, add to your hook configuration:

```bash
# Check for stuck tasks before agent actions
node monitor-stuck-tasks.js $(pwd) $AGENT_ID
```

This will:
- Exit code 0: Continue normally
- Exit code 2: Show intervention message and require user action

## TaskManager API Changes

### New Methods

#### `trackTaskAccess(taskId, agentId)`
Tracks when an agent accesses a task for repetition detection.

#### `checkTaskRepetition(taskId, agentId)`
Returns repetition analysis:
```javascript
{
  isStuck: boolean,
  count: number,
  reason: string,
  lastAccess: string,
  timeSpan: number
}
```

#### `getTaskContinuationGuidance(agentId)`
Enhanced to return stuck task interventions:
```javascript
{
  action: 'stuck_task_intervention',
  task: taskObject,
  repetitionCount: number,
  instructions: string,
  completionCommand: string
}
```

#### `generateStuckTaskInstructions(task, repetitionInfo)`
Generates detailed intervention instructions for stuck tasks.

#### `recordTaskIntervention(taskId, agentId, type)`
Records intervention events for analytics.

#### `getRepetitionStatistics()`
Returns comprehensive statistics about task repetitions and interventions.

#### `cleanupTrackingData(daysToKeep = 7)`
Cleans up old tracking data to prevent file bloat.

### Enhanced Methods

#### `updateTaskStatus(taskId, status, options)`
Now tracks status changes in access history for better repetition detection.

#### `getTaskContinuationGuidance(agentId)`
Automatically checks for repetition and provides intervention when needed.

## Data Structure

Tasks now include:

```javascript
{
  // ... existing task fields ...
  
  "access_history": [
    {
      "agentId": "agent_1",
      "timestamp": "2025-08-15T01:23:45.678Z",
      "action": "accessed" | "status_change" | "intervention_*",
      "details": { /* additional context */ }
    }
  ],
  
  "interventions": [
    {
      "agentId": "agent_1", 
      "type": "stuck_task_detected",
      "timestamp": "2025-08-15T01:23:45.678Z",
      "details": {
        "taskStatus": "in_progress",
        "accessCount": 5
      }
    }
  ]
}
```

## Configuration

The system uses these default thresholds:
- **Repetition threshold**: 3 accesses in 1 hour
- **Access history limit**: 20 records per task
- **Cleanup retention**: 7 days (14 days for interventions)

These can be adjusted in the TaskManager implementation as needed.

## Benefits

1. **Prevents infinite loops** - Automatically breaks repetitive patterns
2. **Improves productivity** - Helps agents move forward when stuck  
3. **Provides guidance** - Clear instructions for completion
4. **Maintains code quality** - Still encourages proper task completion
5. **Self-monitoring** - Tracks its own effectiveness over time

## Example Scenarios

### Scenario 1: Stuck Quality Task
Agent keeps accessing "Review Strike 2: Verify no lint errors" but doesn't run linting commands.

**System Response:**
- Detects 3+ accesses without status change
- Provides specific linting commands
- Shows exact completion command
- Guides towards either fixing errors or marking as done

### Scenario 2: Complex Feature Task  
Agent accesses "Implement user authentication" multiple times but task is too broad.

**System Response:**
- Suggests breaking into subtasks
- Provides task creation commands
- Guides completion of original task after breakdown

### Scenario 3: Blocked Dependency
Agent repeatedly accesses task waiting for external dependency.

**System Response:**
- Recognizes blocking pattern
- Suggests documenting blocker
- Provides options to move to other tasks
- Records intervention for later follow-up

## Testing

Run the test suite:
```bash
node test-repetition-system.js
```

This validates:
- Basic access tracking
- Repetition detection accuracy
- Intervention guidance generation
- Status change tracking
- Cleanup functionality
- Statistics generation

The system is designed to be robust, helpful, and non-intrusive while effectively preventing agents from getting stuck in repetitive loops.