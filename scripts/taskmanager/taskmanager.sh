#!/bin/bash

# TaskManager Master Script
# Usage: ./taskmanager.sh <command> [args...]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Show help if no arguments provided
if [ $# -eq 0 ]; then
    echo "TaskManager CLI - Master Script"
    echo "==============================="
    echo ""
    echo "Usage: $0 <command> [args...]"
    echo ""
    echo "Task Management Commands:"
    echo "  current [agent_id]                    Get current task"
    echo "  create --title \"Title\" --description \"Desc\" --mode \"MODE\" [options]"
    echo "  complete <task_id>                    Mark task as completed"
    echo "  status <task_id> <new_status>         Update task status"
    echo "  info <task_id>                        Show task details"
    echo "  list [--status status] [--mode mode] [options]"
    echo "  remove <task_id> [--confirm]          Remove task"
    echo ""
    echo "Task Organization Commands:"
    echo "  move-top <task_id>                    Move task to top priority"
    echo "  move-bottom <task_id>                 Move task to bottom"
    echo "  move-up <task_id>                     Move task up one position"
    echo "  move-down <task_id>                   Move task down one position"
    echo ""
    echo "Task File Management:"
    echo "  add-file <task_id> <file_path>        Add important file to task"
    echo "  remove-file <task_id> <file_path>     Remove file from task"
    echo ""
    echo "Dependencies:"
    echo "  dependencies [--graph] [--executable] [--task task_id]"
    echo ""
    echo "Agent Management Commands:"
    echo "  init [config_json]                    Initialize agent (auto-assigns ID)"
    echo "  agent-register --role \"role\" --session \"session\" [options]"
    echo "  agent-claim <agent_id> <task_id> [priority]"
    echo "  agent-status <agent_id>               Show agent status"
    echo "  agent-list [--active] [--format fmt]  List agents"
    echo ""
    echo "Linter Feedback Commands:"
    echo "  linter-check                          Check for pending linter feedback"
    echo "  linter-clear                          Clear pending linter feedback"
    echo ""
    echo "Backup & Archive Commands:"
    echo "  backup [--list|--create|--restore|--cleanup]"
    echo "  archive [--list|--stats|--restore task_id|--migrate]"
    echo ""
    echo "Examples:"
    echo "  $0 init                               # Initialize new agent"
    echo "  $0 current                            # Get current task"
    echo "  $0 list --status pending              # List pending tasks"
    echo "  $0 complete task_123                  # Mark task as completed"
    echo "  $0 create --title \"Fix bug\" --description \"Login issue\" --mode \"DEVELOPMENT\""
    echo "  $0 agent-register --role \"development\" --session \"session_123\""
    echo ""
    echo "For detailed help on any command:"
    echo "  $0 <command> --help"
    exit 0
fi

COMMAND="$1"
shift

case "$COMMAND" in
    "current")
        exec "$SCRIPT_DIR/current-task.sh" "$@"
        ;;
    "create")
        exec "$SCRIPT_DIR/task-create.sh" "$@"
        ;;
    "complete")
        exec "$SCRIPT_DIR/task-complete.sh" "$@"
        ;;
    "status")
        exec "$SCRIPT_DIR/task-status.sh" "$@"
        ;;
    "info")
        exec "$SCRIPT_DIR/task-info.sh" "$@"
        ;;
    "list")
        exec "$SCRIPT_DIR/task-list.sh" "$@"
        ;;
    "remove")
        exec "$SCRIPT_DIR/task-remove.sh" "$@"
        ;;
    "move-top")
        exec "$SCRIPT_DIR/task-move-top.sh" "$@"
        ;;
    "move-bottom")
        exec "$SCRIPT_DIR/task-move-bottom.sh" "$@"
        ;;
    "move-up")
        exec "$SCRIPT_DIR/task-move-up.sh" "$@"
        ;;
    "move-down")
        exec "$SCRIPT_DIR/task-move-down.sh" "$@"
        ;;
    "add-file")
        exec "$SCRIPT_DIR/task-add-file.sh" "$@"
        ;;
    "remove-file")
        exec "$SCRIPT_DIR/task-remove-file.sh" "$@"
        ;;
    "dependencies")
        exec "$SCRIPT_DIR/task-dependencies.sh" "$@"
        ;;
    "init")
        exec "$SCRIPT_DIR/agent-init.sh" "$@"
        ;;
    "agent-register")
        exec "$SCRIPT_DIR/agent-register.sh" "$@"
        ;;
    "agent-claim")
        exec "$SCRIPT_DIR/agent-claim-task.sh" "$@"
        ;;
    "agent-status")
        exec "$SCRIPT_DIR/agent-status.sh" "$@"
        ;;
    "agent-list")
        exec "$SCRIPT_DIR/agent-list.sh" "$@"
        ;;
    "backup")
        exec "$SCRIPT_DIR/task-backup.sh" "$@"
        ;;
    "archive")
        exec "$SCRIPT_DIR/task-archive.sh" "$@"
        ;;
    "linter-check")
        exec "$SCRIPT_DIR/linter-check.sh" "$@"
        ;;
    "linter-clear")
        exec "$SCRIPT_DIR/linter-clear.sh" "$@"
        ;;
    *)
        echo "Unknown command: $COMMAND"
        echo "Use '$0' (without arguments) to see available commands"
        exit 1
        ;;
esac