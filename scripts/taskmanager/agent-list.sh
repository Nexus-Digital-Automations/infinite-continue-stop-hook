#!/bin/bash

# Agent List Script
# Usage: ./agent-list.sh [--active] [--format format]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

# Default values
ACTIVE_ONLY="false"
FORMAT="summary"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --active)
            ACTIVE_ONLY="true"
            shift
            ;;
        --format)
            FORMAT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --active      Show only active agents"
            echo "  --format      Output format (summary, detailed, json) [default: summary]"
            echo ""
            echo "Examples:"
            echo "  $0                    # List all agents"
            echo "  $0 --active           # List only active agents"
            echo "  $0 --format detailed  # Show detailed agent information"
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

echo "👥 Listing agents..."

cd "$PROJECT_ROOT"
node -e "
const AgentManager = require('./lib/agentManager');
const agentManager = new AgentManager('./TODO.json');

agentManager.readTodo()
  .then(data => {
    const agents = Object.values(data.agents || {});
    
    if (agents.length === 0) {
      console.log('ℹ️ No agents found');
      process.exit(0);
    }
    
    let filteredAgents = agents;
    if ('$ACTIVE_ONLY' === 'true') {
      filteredAgents = agents.filter(agent => agent.status === 'active');
    }
    
    if (filteredAgents.length === 0) {
      console.log('ℹ️ No agents found matching the criteria');
      process.exit(0);
    }
    
    console.log(\`Found \${filteredAgents.length} agent(s):\n\`);
    
    if ('$FORMAT' === 'json') {
      console.log(JSON.stringify(filteredAgents, null, 2));
    } else if ('$FORMAT' === 'detailed') {
      filteredAgents.forEach((agent, index) => {
        console.log(\`\${index + 1}. \${agent.id}\`);
        console.log(\`   Role: \${agent.role}\`);
        console.log(\`   Status: \${agent.status}\`);
        console.log(\`   Workload: \${agent.workload || 0}\`);
        console.log(\`   Last Activity: \${agent.lastActivity ? new Date(agent.lastActivity).toLocaleString() : 'Never'}\`);
        console.log(\`   Total Requests: \${agent.totalRequests || 0}\`);
        if (agent.specialization && agent.specialization.length > 0) {
          console.log(\`   Specializations: \${agent.specialization.join(', ')}\`);
        }
        console.log('');
      });
    } else {
      // Summary format
      filteredAgents.forEach((agent, index) => {
        const statusIcon = agent.status === 'active' ? '🟢' : '🔴';
        const workload = agent.workload || 0;
        const workloadIcon = workload === 0 ? '💤' : workload < 3 ? '📝' : '🔥';
        
        console.log(\`\${index + 1}. \${statusIcon} \${workloadIcon} \${agent.id} [\${agent.role}] (Workload: \${workload})\`);
      });
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
"