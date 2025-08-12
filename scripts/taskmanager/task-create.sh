#!/bin/bash

# Task Creation Script
# Usage: ./task-create.sh --title "Title" --description "Description" --mode "MODE" [options]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

# Default values
TITLE=""
DESCRIPTION=""
MODE=""
PRIORITY="medium"
STATUS="pending"
ESTIMATE=""
REQUIRES_RESEARCH="false"
DEPENDENCIES=""
IMPORTANT_FILES=""
SUCCESS_CRITERIA=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --title)
            TITLE="$2"
            shift 2
            ;;
        --description)
            DESCRIPTION="$2"
            shift 2
            ;;
        --mode)
            MODE="$2"
            shift 2
            ;;
        --priority)
            PRIORITY="$2"
            shift 2
            ;;
        --status)
            STATUS="$2"
            shift 2
            ;;
        --estimate)
            ESTIMATE="$2"
            shift 2
            ;;
        --requires-research)
            REQUIRES_RESEARCH="true"
            shift
            ;;
        --dependencies)
            DEPENDENCIES="$2"
            shift 2
            ;;
        --important-files)
            IMPORTANT_FILES="$2"
            shift 2
            ;;
        --success-criteria)
            SUCCESS_CRITERIA="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 --title \"Title\" --description \"Description\" --mode \"MODE\" [options]"
            echo ""
            echo "Required:"
            echo "  --title           Task title"
            echo "  --description     Task description"
            echo "  --mode            Task mode (DEVELOPMENT, TESTING, RESEARCH, etc.)"
            echo ""
            echo "Optional:"
            echo "  --priority        Task priority (low, medium, high) [default: medium]"
            echo "  --status          Task status (pending, in_progress, completed, blocked) [default: pending]"
            echo "  --estimate        Time estimate"
            echo "  --requires-research   Mark task as requiring research"
            echo "  --dependencies    Comma-separated list of dependency task IDs"
            echo "  --important-files Comma-separated list of important file paths"
            echo "  --success-criteria Comma-separated list of success criteria"
            echo ""
            echo "Example:"
            echo "  $0 --title \"Fix bug\" --description \"Fix login issue\" --mode \"DEVELOPMENT\" --priority \"high\""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$TITLE" ]; then
    echo "Error: --title is required"
    exit 1
fi

if [ -z "$DESCRIPTION" ]; then
    echo "Error: --description is required"
    exit 1
fi

if [ -z "$MODE" ]; then
    echo "Error: --mode is required"
    exit 1
fi

# Validate priority
case "$PRIORITY" in
    low|medium|high)
        ;;
    *)
        echo "Error: Invalid priority '$PRIORITY'. Valid values: low, medium, high"
        exit 1
        ;;
esac

# Validate status
case "$STATUS" in
    pending|in_progress|completed|blocked)
        ;;
    *)
        echo "Error: Invalid status '$STATUS'. Valid values: pending, in_progress, completed, blocked"
        exit 1
        ;;
esac

if [ ! -f "$TODO_PATH" ]; then
    echo "Error: TODO.json not found at $TODO_PATH"
    exit 1
fi

echo "🔄 Creating new task..."

cd "$PROJECT_ROOT"
node -e "
const TaskManager = require('./lib/taskManager');
const taskManager = new TaskManager('./TODO.json');

const taskData = {
  title: '$TITLE',
  description: '$DESCRIPTION',
  mode: '$MODE',
  priority: '$PRIORITY',
  status: '$STATUS'
};

if ('$ESTIMATE') taskData.estimate = '$ESTIMATE';
if ('$REQUIRES_RESEARCH' === 'true') taskData.requires_research = true;

// Parse comma-separated lists
if ('$DEPENDENCIES') {
  taskData.dependencies = '$DEPENDENCIES'.split(',').map(s => s.trim());
}
if ('$IMPORTANT_FILES') {
  taskData.important_files = '$IMPORTANT_FILES'.split(',').map(s => s.trim());
}
if ('$SUCCESS_CRITERIA') {
  taskData.success_criteria = '$SUCCESS_CRITERIA'.split(',').map(s => s.trim());
}

taskManager.createTask(taskData)
  .then(taskId => {
    console.log('✅ Task created with ID:', taskId);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"