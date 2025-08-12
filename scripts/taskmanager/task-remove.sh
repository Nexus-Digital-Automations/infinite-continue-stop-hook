#!/bin/bash

# Task Remove Script
# Usage: ./task-remove.sh <task_id> [--confirm]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

if [ $# -lt 1 ]; then
    echo "Usage: $0 <task_id> [--confirm]"
    echo "Example: $0 task_1234567890_abcdef --confirm"
    echo ""
    echo "⚠️ WARNING: This permanently removes the task from TODO.json"
    echo "Use --confirm to skip the confirmation prompt"
    exit 1
fi

TASK_ID="$1"
CONFIRM="false"

if [ "$2" = "--confirm" ]; then
    CONFIRM="true"
fi

if [ ! -f "$TODO_PATH" ]; then
    echo "Error: TODO.json not found at $TODO_PATH"
    exit 1
fi

# Get task info first
echo "🔍 Getting task information..."

cd "$PROJECT_ROOT"
TASK_INFO=$(node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.readTodo()
  .then(data => {
    const task = data.tasks.find(t => t.id === '$TASK_ID');
    
    if (!task) {
      console.log('NOT_FOUND');
      process.exit(0);
    }
    
    console.log(\`\${task.title} [\${task.status}] [\${task.mode}]\`);
    process.exit(0);
  })
  .catch(error => {
    console.log('ERROR');
    process.exit(1);
  });
")

if [ "$TASK_INFO" = "NOT_FOUND" ]; then
    echo "❌ Task not found: $TASK_ID"
    exit 1
fi

if [ "$TASK_INFO" = "ERROR" ]; then
    echo "❌ Error reading task information"
    exit 1
fi

echo "📋 Task to remove: $TASK_INFO"

if [ "$CONFIRM" != "true" ]; then
    echo ""
    echo "⚠️ WARNING: This will permanently remove the task from TODO.json"
    echo "Are you sure you want to continue? (y/N)"
    read -r RESPONSE
    
    case "$RESPONSE" in
        [yY]|[yY][eE][sS])
            ;;
        *)
            echo "❌ Operation cancelled"
            exit 0
            ;;
    esac
fi

echo "🗑️ Removing task..."

node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.removeTask('$TASK_ID')
  .then(removed => {
    if (removed) {
      console.log('✅ Task $TASK_ID removed successfully');
    } else {
      console.log('❌ Task $TASK_ID not found');
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"