#!/bin/bash

# Linter Feedback Clear Script
# Usage: ./linter-clear.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

if [ ! -f "$TODO_PATH" ]; then
    echo "Error: TODO.json not found at $TODO_PATH"
    exit 1
fi

echo "🧹 Clearing linter feedback..."

cd "$PROJECT_ROOT"
node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.clearLinterFeedback()
  .then(result => {
    if (result.success) {
      console.log('✅ Linter feedback cleared');
      console.log('Task:', result.clearedTask);
      console.log('Cleared at:', result.clearedAt);
      console.log('');
      console.log('💡 You can now proceed to the next task.');
    } else {
      console.log('ℹ️ No pending linter feedback found');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"