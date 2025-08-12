#!/bin/bash

# Task Completion Script
# Usage: ./task-complete.sh <task_id>

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

echo "🔄 Marking task $TASK_ID as completed..."

cd "$PROJECT_ROOT"
node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.updateTaskStatus('$TASK_ID', 'completed')
  .then(() => {
    console.log('✅ Task $TASK_ID marked as completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"