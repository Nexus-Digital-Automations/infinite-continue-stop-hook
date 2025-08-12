#!/bin/bash

# Linter Feedback Check Script
# Usage: ./linter-check.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

if [ ! -f "$TODO_PATH" ]; then
    echo "Error: TODO.json not found at $TODO_PATH"
    exit 1
fi

echo "🔍 Checking for pending linter feedback..."

cd "$PROJECT_ROOT"
node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.getPendingLinterFeedback()
  .then(feedback => {
    if (feedback) {
      console.log('⚠️ Pending Linter Feedback Found');
      console.log('====================================');
      console.log('Task ID:', feedback.taskId);
      console.log('Task Title:', feedback.taskTitle);
      console.log('Requires Linter Check:', feedback.requiresLinterCheck);
      console.log('Feedback Created:', new Date(feedback.timestamp).toLocaleString());
      console.log('');
      console.log('🧹 To clear this feedback and proceed to next task:');
      console.log('   ./scripts/taskmanager/linter-clear.sh');
      console.log('');
      console.log('💡 Recommended actions:');
      console.log('   1. Run: npm run lint');
      console.log('   2. Fix any linting errors');
      console.log('   3. Clear feedback to continue');
    } else {
      console.log('✅ No pending linter feedback');
      console.log('You can proceed with task operations normally.');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"