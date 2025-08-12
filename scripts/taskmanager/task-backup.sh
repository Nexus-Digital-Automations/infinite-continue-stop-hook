#!/bin/bash

# Task Backup Management Script
# Usage: ./task-backup.sh [--list] [--create] [--restore] [--cleanup]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

# Default action
ACTION="list"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --list)
            ACTION="list"
            shift
            ;;
        --create)
            ACTION="create"
            shift
            ;;
        --restore)
            ACTION="restore"
            shift
            ;;
        --cleanup)
            ACTION="cleanup"
            shift
            ;;
        --help)
            echo "Usage: $0 [action]"
            echo ""
            echo "Actions:"
            echo "  --list     List available backups (default)"
            echo "  --create   Create a new backup"
            echo "  --restore  Restore from latest backup"
            echo "  --cleanup  Clean up legacy backups"
            echo ""
            echo "Examples:"
            echo "  $0             # List backups"
            echo "  $0 --create    # Create new backup"
            echo "  $0 --restore   # Restore from backup"
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
        echo "📦 Listing available backups..."
        node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.listBackups()
  .then(backups => {
    if (backups.length === 0) {
      console.log('ℹ️ No backups found');
      process.exit(0);
    }
    
    console.log(\`Found \${backups.length} backup(s):\n\`);
    backups.forEach((backup, index) => {
      console.log(\`\${index + 1}. \${backup.filename}\`);
      console.log(\`   Created: \${backup.created}\`);
      console.log(\`   Size: \${backup.size} bytes\`);
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
    "create")
        echo "🔄 Creating new backup..."
        node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.createBackup()
  .then(result => {
    if (result.success) {
      console.log('✅ Backup created successfully');
      console.log('Filename:', result.filename);
      console.log('Path:', result.path);
    } else {
      console.log('❌ Failed to create backup:', result.error);
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
    "restore")
        echo "🔄 Restoring from latest backup..."
        echo "⚠️ This will overwrite the current TODO.json file"
        echo "Are you sure you want to continue? (y/N)"
        read -r RESPONSE
        
        case "$RESPONSE" in
            [yY]|[yY][eE][sS])
                node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.restoreFromBackup()
  .then(result => {
    if (result.success) {
      console.log('✅ Restore completed successfully');
      console.log('Restored from:', result.backupFile);
      console.log('Tasks restored:', result.taskCount);
    } else {
      console.log('❌ Failed to restore:', result.error);
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
            *)
                echo "❌ Operation cancelled"
                exit 0
                ;;
        esac
        ;;
    "cleanup")
        echo "🧹 Cleaning up legacy backups..."
        node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

taskManager.cleanupLegacyBackups()
  .then(result => {
    console.log('✅ Cleanup completed');
    console.log('Files removed:', result.removedCount);
    console.log('Files kept:', result.keptCount);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"
        ;;
esac