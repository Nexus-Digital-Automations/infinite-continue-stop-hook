#!/bin/bash

# Task Add Important File Script
# Usage: ./task-add-file.sh <task_id> <file_path>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

if [ $# -ne 2 ]; then
    echo "Usage: $0 <task_id> <file_path>"
    echo "Example: $0 task_1234567890_abcdef ./src/component.js"
    exit 1
fi

TASK_ID="$1"
FILE_PATH="$2"

if [ ! -f "$TODO_PATH" ]; then
    echo "Error: TODO.json not found at $TODO_PATH"
    exit 1
fi

echo "🔄 Adding important file to task $TASK_ID..."

cd "$PROJECT_ROOT"
node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.addImportantFile('$TASK_ID', '$FILE_PATH')
  .then(added => {
    if (added) {
      console.log('✅ File added to task $TASK_ID: $FILE_PATH');
    } else {
      console.log('ℹ️ File already exists or task not found');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"