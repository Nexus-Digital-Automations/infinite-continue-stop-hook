#!/bin/bash

# TaskManager Wrapper Script
# Simple wrapper for the Node.js TaskManager API

API_SCRIPT="/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/taskmanager-api.js"

# Function to run API commands with timeout
run_api() {
    timeout 10 node "$API_SCRIPT" "$@"
}

case "$1" in
    "init")
        echo "Initializing new agent..."
        INIT_RESULT=$(run_api init "$2")
        echo "$INIT_RESULT"
        
        # Extract agent ID for display
        AGENT_ID=$(echo "$INIT_RESULT" | grep -o '"agentId": *"[^"]*' | cut -d'"' -f4)
        
        if [ -n "$AGENT_ID" ]; then
            echo ""
            echo "🤖 Your Agent ID: $AGENT_ID"
            echo ""
            
            # Get current task
            echo "📋 Getting your current task..."
            CURRENT_TASK=$(run_api current "$AGENT_ID")
            echo "$CURRENT_TASK"
            
            # If no current task, show available tasks
            if echo "$CURRENT_TASK" | grep -q '"task": null'; then
                echo ""
                echo "📝 Available tasks:"
                run_api list '{"status": "pending"}'
            fi
            
            # Display API guide
            echo ""
            echo "════════════════════════════════════════════════════════════════"
            echo "🚀 TASKMANAGER NODE.JS API GUIDE"
            echo "════════════════════════════════════════════════════════════════"
            echo ""
            echo "🎯 Your commands (works from ANY directory):"
            echo ""
            echo "BASIC OPERATIONS:"
            echo "  bash \"/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm\" current $AGENT_ID"
            echo "  bash \"/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm\" list"
            echo "  bash \"/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm\" complete task_id"
            echo "  bash \"/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm\" create '{\"title\":\"Task\",\"mode\":\"DEVELOPMENT\"}'"
            echo ""
            echo "TASK ORGANIZATION:"
            echo "  bash \"/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm\" move-top task_id"
            echo "  bash \"/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm\" move-up task_id"
            echo "  bash \"/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm\" move-down task_id"
            echo ""
            echo "AGENT STATUS:"
            echo "  bash \"/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm\" status $AGENT_ID"
            echo "  bash \"/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm\" stats"
            echo ""
            echo "LINTER OPERATIONS:"
            echo "  bash \"/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm\" linter-check"
            echo "  bash \"/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm\" linter-clear"
            echo ""
            echo "📖 Complete API Guide:"
            echo "    /Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/guides/taskmanager-api-guide.md"
            echo ""
            echo "════════════════════════════════════════════════════════════════"
            echo ""
        fi
        ;;
    "current")
        echo "Getting current task..."
        run_api current "$2"
        ;;
    "list")
        echo "Listing tasks..."
        run_api list "$2"
        ;;
    "create")
        echo "Creating new task..."
        run_api create "$2"
        ;;
    "claim")
        echo "Claiming task..."
        run_api claim "$2" "$3" "$4"
        ;;
    "complete")
        echo "Completing task..."
        run_api complete "$2" "$3"
        ;;
    "status")
        echo "Getting agent status..."
        run_api status "$2"
        ;;
    "stats")
        echo "Getting statistics..."
        run_api stats
        ;;
    "linter-check")
        echo "Checking linter..."
        run_api linter-check
        ;;
    "linter-clear")
        echo "Clearing linter feedback..."
        run_api linter-clear
        ;;
    "move-top")
        echo "Moving task to top..."
        run_api move-top "$2"
        ;;
    "move-up")
        echo "Moving task up..."
        run_api move-up "$2"
        ;;
    "move-down")
        echo "Moving task down..."
        run_api move-down "$2"
        ;;
    "move-bottom")
        echo "Moving task to bottom..."
        run_api move-bottom "$2"
        ;;
    *)
        echo "TaskManager Wrapper - Usage:"
        echo ""
        echo "  ./tm init [config]                 - Initialize agent"
        echo "  ./tm current [agentId]             - Get current task"
        echo "  ./tm list [filter]                 - List tasks"
        echo "  ./tm create <taskData>             - Create task"
        echo "  ./tm claim <taskId> [agentId] [priority] - Claim task"
        echo "  ./tm complete <taskId> [data]      - Complete task"
        echo "  ./tm status [agentId]              - Get agent status"
        echo "  ./tm stats                         - Get statistics"
        echo "  ./tm linter-check                  - Run linter check"
        echo "  ./tm linter-clear                  - Clear linter feedback"
        echo "  ./tm move-top <taskId>             - Move task to top"
        echo "  ./tm move-up <taskId>              - Move task up"
        echo "  ./tm move-down <taskId>            - Move task down"
        echo "  ./tm move-bottom <taskId>          - Move task to bottom"
        echo ""
        echo "Examples:"
        echo "  ./tm init"
        echo "  ./tm current"
        echo "  ./tm create '{\"title\":\"Fix bug\",\"mode\":\"DEVELOPMENT\"}'"
        echo "  ./tm list '{\"status\":\"pending\"}'"
        echo "  ./tm move-top task_123"
        ;;
esac