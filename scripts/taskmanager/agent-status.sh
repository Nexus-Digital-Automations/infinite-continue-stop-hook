#!/bin/bash

# Agent Status Script
# Usage: ./agent-status.sh <agent_id>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TODO_PATH="$PROJECT_ROOT/TODO.json"

if [ $# -ne 1 ]; then
    echo "Usage: $0 <agent_id>"
    echo "Example: $0 agent_123"
    exit 1
fi

AGENT_ID="$1"

if [ ! -f "$TODO_PATH" ]; then
    echo "Error: TODO.json not found at $TODO_PATH"
    exit 1
fi

echo "🔍 Getting agent status..."

cd "$PROJECT_ROOT"
node -e "
const AgentManager = require('./lib/agentManager');
const TaskManager = require('./lib/taskManager');

const agentManager = new AgentManager('./TODO.json');
const taskManager = new TaskManager('./TODO.json');

Promise.all([
  agentManager.getAgent('$AGENT_ID'),
  taskManager.getTasksForAgent('$AGENT_ID')
]).then(([agent, tasks]) => {
  if (!agent) {
    console.log('❌ Agent not found: $AGENT_ID');
    process.exit(1);
  }
  
  console.log('👤 Agent Status:');
  console.log('================');
  console.log('ID:', agent.id);
  console.log('Role:', agent.role);
  console.log('Status:', agent.status);
  console.log('Workload:', agent.workload || 0);
  console.log('Last Activity:', agent.lastActivity ? new Date(agent.lastActivity).toLocaleString() : 'Never');
  console.log('Total Requests:', agent.totalRequests || 0);
  
  if (agent.specialization && agent.specialization.length > 0) {
    console.log('\\n🔧 Specializations:');
    agent.specialization.forEach(spec => console.log('  -', spec));
  }
  
  if (tasks && tasks.length > 0) {
    console.log('\\n📋 Assigned Tasks (' + tasks.length + '):');
    tasks.forEach((task, index) => {
      const statusIcon = {
        'pending': '⏸️',
        'in_progress': '🔄',
        'completed': '✅',
        'blocked': '🚫'
      }[task.status] || '❓';
      
      console.log(\`  \${index + 1}. \${statusIcon} \${task.title} [\${task.status}]\`);
    });
  } else {
    console.log('\\n📋 No assigned tasks');
  }
  
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
"