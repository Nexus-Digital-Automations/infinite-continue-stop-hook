#!/bin/bash

# Get Current Task Script
# Usage: ./current-task.sh [agent_id]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

AGENT_ID="${1:-}"

if [ ! -f "$TODO_PATH" ]; then
    echo "Error: TODO.json not found at $TODO_PATH"
    exit 1
fi

echo "🔍 Getting current task..."

cd "$PROJECT_ROOT"
if [ -n "$AGENT_ID" ]; then
    node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.getCurrentTask('$AGENT_ID')
  .then(task => {
    if (task) {
      console.log('📋 Current task for agent $AGENT_ID:');
      console.log('ID:', task.id);
      console.log('Title:', task.title);
      console.log('Status:', task.status);
      console.log('Priority:', task.priority);
      console.log('Mode:', task.mode);
      if (task.description) {
        console.log('Description:', task.description);
      }
    } else {
      console.log('ℹ️ No current task for agent $AGENT_ID');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"
else
    node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.getCurrentTask()
  .then(task => {
    if (task) {
      console.log('📋 Current task:');
      console.log('ID:', task.id);
      console.log('Title:', task.title);
      console.log('Status:', task.status);
      console.log('Priority:', task.priority);
      console.log('Mode:', task.mode);
      if (task.description) {
        console.log('Description:', task.description);
      }
    } else {
      console.log('ℹ️ No current task');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"
fi