#!/bin/bash

# Task Move to Top Script
# Usage: ./task-move-top.sh <task_id>

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

echo "🔄 Moving task $TASK_ID to top priority..."

cd "$PROJECT_ROOT"
node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.moveTaskToTop('$TASK_ID')
  .then(moved => {
    if (moved) {
      console.log('✅ Task $TASK_ID moved to top of the list');
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