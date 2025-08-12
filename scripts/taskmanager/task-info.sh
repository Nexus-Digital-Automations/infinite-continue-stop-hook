#!/bin/bash

# Task Info Script
# Usage: ./task-info.sh <task_id>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

if [ $# -ne 1 ]; then
    echo "Usage: $0 <task_id>"
    echo "Example: $0 task_1234567890_abcdef"
    exit 1
fi

TASK_ID="$1"

if [ ! -f "$TODO_PATH" ]; then
    echo "Error: TODO.json not found at $TODO_PATH"
    exit 1
fi

echo "🔍 Getting task information..."

cd "$PROJECT_ROOT"
node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.readTodo()
  .then(data => {
    const task = data.tasks.find(t => t.id === '$TASK_ID');
    
    if (!task) {
      console.log('❌ Task not found: $TASK_ID');
      process.exit(1);
    }
    
    console.log('📋 Task Details:');
    console.log('================');
    console.log('ID:', task.id);
    console.log('Title:', task.title);
    console.log('Status:', task.status);
    console.log('Priority:', task.priority);
    console.log('Mode:', task.mode);
    console.log('Created:', task.created_at);
    
    if (task.description) {
      console.log('\\nDescription:');
      console.log(task.description);
    }
    
    if (task.estimate) {
      console.log('\\nEstimate:', task.estimate);
    }
    
    if (task.requires_research) {
      console.log('\\n⚠️ Requires Research: Yes');
    }
    
    if (task.dependencies && task.dependencies.length > 0) {
      console.log('\\n📎 Dependencies:');
      task.dependencies.forEach(dep => console.log('  -', dep));
    }
    
    if (task.important_files && task.important_files.length > 0) {
      console.log('\\n📁 Important Files:');
      task.important_files.forEach(file => console.log('  -', file));
    }
    
    if (task.success_criteria && task.success_criteria.length > 0) {
      console.log('\\n🎯 Success Criteria:');
      task.success_criteria.forEach(criteria => console.log('  -', criteria));
    }
    
    if (task.subtasks && task.subtasks.length > 0) {
      console.log('\\n📝 Subtasks:');
      task.subtasks.forEach((subtask, index) => {
        const status = subtask.completed ? '✅' : '⏸️';
        console.log(\`  \${index + 1}. \${status} \${subtask.title}\`);
      });
    }
    
    if (task.assigned_agent) {
      console.log('\\n👤 Assigned Agent:', task.assigned_agent);
    }
    
    if (task.agent_assignment_history && task.agent_assignment_history.length > 0) {
      console.log('\\n📚 Assignment History:');
      task.agent_assignment_history.forEach(history => {
        console.log(\`  - \${history.agentId} (\${history.role}) at \${history.assignedAt}\`);
        if (history.reassignReason) {
          console.log(\`    Reason: \${history.reassignReason}\`);
        }
      });
    }
    
    if (task.errors && task.errors.length > 0) {
      console.log('\\n❌ Errors:');
      task.errors.forEach(error => {
        console.log(\`  - \${error.type}: \${error.message}\`);
        if (error.blocking) console.log('    (BLOCKING)');
      });
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"