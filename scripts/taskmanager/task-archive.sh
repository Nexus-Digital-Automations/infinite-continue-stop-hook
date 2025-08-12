#!/bin/bash

# Task Archive Management Script (DONE.json)
# Usage: ./task-archive.sh [--list] [--stats] [--restore task_id] [--migrate]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

# Default action
ACTION="list"
RESTORE_TASK=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --list)
            ACTION="list"
            shift
            ;;
        --stats)
            ACTION="stats"
            shift
            ;;
        --restore)
            ACTION="restore"
            RESTORE_TASK="$2"
            shift 2
            ;;
        --migrate)
            ACTION="migrate"
            shift
            ;;
        --help)
            echo "Usage: $0 [action]"
            echo ""
            echo "Actions:"
            echo "  --list              List archived tasks (default)"
            echo "  --stats             Show completion statistics"
            echo "  --restore task_id   Restore archived task back to TODO.json"
            echo "  --migrate           Migrate completed tasks from TODO.json to DONE.json"
            echo ""
            echo "Examples:"
            echo "  $0                                    # List archived tasks"
            echo "  $0 --stats                            # Show statistics"
            echo "  $0 --restore task_1234567890_abc     # Restore specific task"
            echo "  $0 --migrate                          # Migrate completed tasks"
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

cd "$PROJECT_ROOT"

case "$ACTION" in
    "list")
        echo "📚 Listing archived tasks..."
        node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.getCompletedTasks({ limit: 20 })
  .then(tasks => {
    if (tasks.length === 0) {
      console.log('ℹ️ No archived tasks found');
      process.exit(0);
    }
    
    console.log(\`📋 Recent Completed Tasks (\${tasks.length}):\n\`);
    
    tasks.forEach((task, index) => {
      const completedDate = new Date(task.completed_at).toLocaleDateString();
      console.log(\`\${index + 1}. ✅ \${task.title}\`);
      console.log(\`   ID: \${task.id}\`);
      console.log(\`   Mode: \${task.mode}\`);
      console.log(\`   Completed: \${completedDate}\`);
      if (task.description) {
        const shortDesc = task.description.length > 80 
          ? task.description.substring(0, 80) + '...' 
          : task.description;
        console.log(\`   Description: \${shortDesc}\`);
      }
      console.log('');
    });
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"
        ;;
    "stats")
        echo "📊 Getting completion statistics..."
        node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.getCompletionStats()
  .then(stats => {
    console.log('📈 Completion Statistics:');
    console.log('========================');
    console.log('Total Completed:', stats.totalCompleted);
    console.log('Last Completion:', stats.lastCompletion ? new Date(stats.lastCompletion).toLocaleString() : 'None');
    console.log('Archive Created:', stats.archiveCreated ? new Date(stats.archiveCreated).toLocaleString() : 'None');
    
    if (stats.completionsByMode) {
      console.log('\\n📋 Completions by Mode:');
      Object.entries(stats.completionsByMode).forEach(([mode, count]) => {
        console.log(\`  \${mode}: \${count}\`);
      });
    }
    
    if (stats.completionsByPriority) {
      console.log('\\n🎯 Completions by Priority:');
      Object.entries(stats.completionsByPriority).forEach(([priority, count]) => {
        const icon = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}[priority] || '⚪';
        console.log(\`  \${icon} \${priority}: \${count}\`);
      });
    }
    
    if (stats.avgCompletionTime) {
      console.log(\`\\n⏱️ Average Completion Time: \${stats.avgCompletionTime}\`);
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"
        ;;
    "restore")
        if [ -z "$RESTORE_TASK" ]; then
            echo "Error: Task ID required for restore operation"
            echo "Usage: $0 --restore <task_id>"
            exit 1
        fi
        
        echo "🔄 Restoring task $RESTORE_TASK from archive..."
        node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.restoreCompletedTask('$RESTORE_TASK')
  .then(restored => {
    if (restored) {
      console.log('✅ Task $RESTORE_TASK restored to TODO.json');
      console.log('ℹ️ Task status has been reset to pending');
    } else {
      console.log('❌ Task $RESTORE_TASK not found in archive');
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"
        ;;
    "migrate")
        echo "🔄 Migrating completed tasks to archive..."
        node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.migrateCompletedTasks()
  .then(result => {
    console.log('✅ Migration completed');
    console.log('Tasks migrated:', result.migratedCount);
    console.log('Tasks already archived:', result.alreadyArchivedCount);
    console.log('Archive file:', result.archiveFile);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"
        ;;
esac