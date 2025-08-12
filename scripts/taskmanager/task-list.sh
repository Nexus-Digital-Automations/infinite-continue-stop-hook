#!/bin/bash

# Task List Script
# Usage: ./task-list.sh [--status status] [--mode mode] [--priority priority] [--format format]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

# Default values
STATUS_FILTER=""
MODE_FILTER=""
PRIORITY_FILTER=""
FORMAT="summary"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --status)
            STATUS_FILTER="$2"
            shift 2
            ;;
        --mode)
            MODE_FILTER="$2"
            shift 2
            ;;
        --priority)
            PRIORITY_FILTER="$2"
            shift 2
            ;;
        --format)
            FORMAT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --status      Filter by status (pending, in_progress, completed, blocked)"
            echo "  --mode        Filter by mode (DEVELOPMENT, TESTING, RESEARCH, etc.)"
            echo "  --priority    Filter by priority (low, medium, high)"
            echo "  --format      Output format (summary, detailed, json) [default: summary]"
            echo ""
            echo "Examples:"
            echo "  $0                                    # List all tasks"
            echo "  $0 --status pending                   # List pending tasks"
            echo "  $0 --mode DEVELOPMENT --priority high # List high priority development tasks"
            echo "  $0 --format detailed                  # Show detailed task information"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

if [ ! -f "$TODO_PATH" ]; then
    echo "Error: TODO.json not found at $TODO_PATH"
    exit 1
fi

echo "📋 Listing tasks..."

cd "$PROJECT_ROOT"
node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.readTodo()
  .then(data => {
    let tasks = data.tasks || [];
    
    // Apply filters
    if ('$STATUS_FILTER') {
      tasks = tasks.filter(t => t.status === '$STATUS_FILTER');
    }
    if ('$MODE_FILTER') {
      tasks = tasks.filter(t => t.mode === '$MODE_FILTER');
    }
    if ('$PRIORITY_FILTER') {
      tasks = tasks.filter(t => t.priority === '$PRIORITY_FILTER');
    }
    
    if (tasks.length === 0) {
      console.log('ℹ️ No tasks found matching the criteria');
      process.exit(0);
    }
    
    console.log(\`Found \${tasks.length} task(s):\n\`);
    
    if ('$FORMAT' === 'json') {
      console.log(JSON.stringify(tasks, null, 2));
    } else if ('$FORMAT' === 'detailed') {
      tasks.forEach((task, index) => {
        console.log(\`\${index + 1}. \${task.title} (ID: \${task.id})\`);
        console.log(\`   Status: \${task.status}\`);
        console.log(\`   Priority: \${task.priority}\`);
        console.log(\`   Mode: \${task.mode}\`);
        if (task.description) {
          console.log(\`   Description: \${task.description}\`);
        }
        if (task.estimate) {
          console.log(\`   Estimate: \${task.estimate}\`);
        }
        if (task.dependencies && task.dependencies.length > 0) {
          console.log(\`   Dependencies: \${task.dependencies.join(', ')}\`);
        }
        if (task.important_files && task.important_files.length > 0) {
          console.log(\`   Files: \${task.important_files.join(', ')}\`);
        }
        console.log('');
      });
    } else {
      // Summary format
      tasks.forEach((task, index) => {
        const statusIcon = {
          'pending': '⏸️',
          'in_progress': '🔄',
          'completed': '✅',
          'blocked': '🚫'
        }[task.status] || '❓';
        
        const priorityIcon = {
          'low': '🟢',
          'medium': '🟡',
          'high': '🔴'
        }[task.priority] || '⚪';
        
        console.log(\`\${index + 1}. \${statusIcon} \${priorityIcon} \${task.title} [\${task.mode}] (ID: \${task.id})\`);
      });
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"