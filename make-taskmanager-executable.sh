#!/bin/bash

# Make TaskManager scripts executable
# Usage: ./make-taskmanager-executable.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TASKMANAGER_DIR="$SCRIPT_DIR/scripts/taskmanager"

echo "Making all TaskManager scripts executable..."

# Find all .sh files in the taskmanager directory and make them executable
find "$TASKMANAGER_DIR" -name "*.sh" -type f -exec chmod +x {} \;

echo "✅ All TaskManager scripts are now executable:"
ls -la "$TASKMANAGER_DIR"/*.sh | awk '{print "  " $1 " " $9}'

echo ""
echo "You can now run scripts like:"
echo "  ./scripts/taskmanager/taskmanager.sh"
echo "  ./scripts/taskmanager/linter-check.sh"
echo "  ./scripts/taskmanager/linter-clear.sh"