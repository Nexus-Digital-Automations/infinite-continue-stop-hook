#!/bin/bash

# Task Status Update Script
# Usage: ./task-status.sh <task_id> <new_status>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

if [ $# -ne 2 ]; then
    echo "Usage: $0 <task_id> <new_status>"
    echo "Valid statuses: pending, in_progress, completed, blocked"
    echo "Example: $0 task_1234567890_abcdef in_progress"
    exit 1
fi

TASK_ID="$1"
NEW_STATUS="$2"

# Validate status
case "$NEW_STATUS" in
    pending|in_progress|completed|blocked)
        ;;
    *)
        echo "Error: Invalid status '$NEW_STATUS'"
        echo "Valid statuses: pending, in_progress, completed, blocked"
        exit 1
        ;;
esac

if [ ! -f "$TODO_PATH" ]; then
    echo "Error: TODO.json not found at $TODO_PATH"
    exit 1
fi

echo "🔄 Updating task $TASK_ID status to $NEW_STATUS..."

cd "$PROJECT_ROOT"
node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.updateTaskStatus('$TASK_ID', '$NEW_STATUS')
  .then(() => {
    console.log('✅ Task $TASK_ID status updated to $NEW_STATUS');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"