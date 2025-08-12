#!/bin/bash

# Task Dependencies Script
# Usage: ./task-dependencies.sh [--graph] [--executable] [--task task_id]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

# Default values
SHOW_GRAPH="false"
SHOW_EXECUTABLE="false"
SPECIFIC_TASK=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --graph)
            SHOW_GRAPH="true"
            shift
            ;;
        --executable)
            SHOW_EXECUTABLE="true"
            shift
            ;;
        --task)
            SPECIFIC_TASK="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --graph       Show dependency graph visualization"
            echo "  --executable  Show only executable tasks (no unmet dependencies)"
            echo "  --task        Show dependencies for specific task ID"
            echo ""
            echo "Examples:"
            echo "  $0                             # Show basic dependency info"
            echo "  $0 --graph                     # Show dependency graph"
            echo "  $0 --executable                # Show executable tasks"
            echo "  $0 --task task_1234567890_abc  # Show dependencies for specific task"
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

echo "🔗 Analyzing task dependencies..."

cd "$PROJECT_ROOT"
if [ "$SHOW_GRAPH" = "true" ]; then
    node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.buildDependencyGraph()
  .then(graph => {
    console.log('📊 Dependency Graph:');
    console.log('===================');
    console.log(graph.tree);
    
    if (graph.cycles && graph.cycles.length > 0) {
      console.log('\\n⚠️ Circular Dependencies Detected:');
      graph.cycles.forEach(cycle => {
        console.log('  -', cycle.join(' → '));
      });
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"
elif [ "$SHOW_EXECUTABLE" = "true" ]; then
    node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.getExecutableTasks()
  .then(tasks => {
    if (tasks.length === 0) {
      console.log('ℹ️ No executable tasks found');
      process.exit(0);
    }
    
    console.log(\`🚀 Executable Tasks (\${tasks.length}):\`);
    console.log('==========================================');
    
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
      
      console.log(\`\${index + 1}. \${statusIcon} \${priorityIcon} \${task.title} [\${task.mode}]\`);
      console.log(\`   ID: \${task.id}\`);
      console.log('');
    });
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"
elif [ -n "$SPECIFIC_TASK" ]; then
    node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.readTodo()
  .then(data => {
    const task = data.tasks.find(t => t.id === '$SPECIFIC_TASK');
    
    if (!task) {
      console.log('❌ Task not found: $SPECIFIC_TASK');
      process.exit(1);
    }
    
    console.log(\`🔗 Dependencies for: \${task.title}\`);
    console.log('===============================================');
    
    if (!task.dependencies || task.dependencies.length === 0) {
      console.log('ℹ️ No dependencies');
      process.exit(0);
    }
    
    console.log(\`Dependencies (\${task.dependencies.length}):\`);
    task.dependencies.forEach((depId, index) => {
      const depTask = data.tasks.find(t => t.id === depId);
      if (depTask) {
        const statusIcon = {
          'pending': '⏸️',
          'in_progress': '🔄',
          'completed': '✅',
          'blocked': '🚫'
        }[depTask.status] || '❓';
        
        console.log(\`\${index + 1}. \${statusIcon} \${depTask.title} [\${depTask.status}]\`);
        console.log(\`   ID: \${depId}\`);
      } else {
        console.log(\`\${index + 1}. ❓ Unknown task (ID: \${depId})\`);
      }
    });
    
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

taskManager.generateDependencyReport()
  .then(report => {
    console.log('📋 Dependency Report:');
    console.log('====================');
    console.log(report);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"
fi