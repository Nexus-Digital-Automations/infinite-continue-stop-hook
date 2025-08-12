#!/bin/bash

# Agent Claim Task Script
# Usage: ./agent-claim-task.sh <agent_id> <task_id> [priority]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

if [ $# -lt 2 ]; then
    echo "Usage: $0 <agent_id> <task_id> [priority]"
    echo "Priority: normal, high, urgent (default: normal)"
    echo "Example: $0 agent_123 task_1234567890_abcdef high"
    exit 1
fi

AGENT_ID="$1"
TASK_ID="$2"
PRIORITY="${3:-normal}"

# Validate priority
case "$PRIORITY" in
    normal|high|urgent)
        ;;
    *)
        echo "Error: Invalid priority '$PRIORITY'. Valid values: normal, high, urgent"
        exit 1
        ;;
esac

if [ ! -f "$TODO_PATH" ]; then
    echo "Error: TODO.json not found at $TODO_PATH"
    exit 1
fi

echo "🔄 Agent $AGENT_ID claiming task $TASK_ID with priority $PRIORITY..."

cd "$PROJECT_ROOT"
node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.claimTask('$TASK_ID', '$AGENT_ID', '$PRIORITY')
  .then(result => {
    if (result.success) {
      console.log('✅ Task $TASK_ID claimed successfully by agent $AGENT_ID');
      console.log('Priority:', result.priority);
      if (result.task) {
        console.log('Task:', result.task.title);
      }
    } else {
      console.log('❌ Failed to claim task:', result.reason);
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"