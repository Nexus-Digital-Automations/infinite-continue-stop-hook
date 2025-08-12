# Agent Registry Commands

This document provides bash-compatible commands for the Agent Registry system that manages agent initialization and number assignment with automatic reuse of inactive slots.

## Core Agent Management

### Initialize New Agent
```bash
# Basic agent initialization (auto-assigns agent_1, agent_2, etc.)
node initialize-agent.js init

# Initialize with specific role and specialization
node initialize-agent.js init '{"role": "testing", "specialization": ["unit-tests", "integration"], "sessionId": "my_session_123"}'

# Initialize with metadata
node initialize-agent.js init '{"role": "development", "metadata": {"version": "v1.0", "environment": "production"}}'
```

### Update Agent Activity
```bash
# Update agent activity timestamp (call this periodically to stay active)
node initialize-agent.js update agent_1

# Update multiple agents
for agent in agent_1 agent_2 agent_3; do
  node initialize-agent.js update $agent
done
```

### Get Agent Information
```bash
# Get detailed agent information
node initialize-agent.js info agent_1

# Check if agent is active
node initialize-agent.js info agent_2 | grep -q '"isActive": true' && echo "Agent is active" || echo "Agent is inactive"
```

### Registry Statistics
```bash
# Get overall registry statistics
node initialize-agent.js stats

# Get active agents count
node initialize-agent.js active | jq '.count'

# List all active agents
node initialize-agent.js active | jq '.activeAgents[].agentId'
```

## Integration with Stop Hook

### Using Environment Variables
```bash
# Set agent ID for consistent usage
export CLAUDE_AGENT_ID="agent_1"

# Set session ID for agent initialization
export CLAUDE_SESSION_ID="my_persistent_session"

# Set agent role and specialization
export CLAUDE_AGENT_ROLE="development"
export CLAUDE_AGENT_SPECIALIZATION="testing,linting,build-fixes"

# Run stop hook (will use existing agent or initialize new one)
node stop-hook-simple.js
```

### Auto-Initialization Workflow
```bash
# Clear agent ID to force new initialization
unset CLAUDE_AGENT_ID

# Run stop hook - it will auto-initialize a new agent
node stop-hook-simple.js

# The agent ID will be displayed and can be used for subsequent calls
```

## Advanced Agent Operations

### Find Reusable Slots
```bash
# Check registry stats to see inactive agents available for reuse
node initialize-agent.js stats | jq '.inactiveAgents'

# List all agents with activity times
node -e "
const AgentRegistry = require('./lib/agentRegistry');
const registry = new AgentRegistry();
const data = registry.readRegistry();
Object.values(data.agents).forEach(agent => {
  const inactive = (Date.now() - agent.lastActivity) / (1000 * 60 * 60);
  console.log(\`\${agent.agentId}: \${inactive.toFixed(1)}h inactive\`);
});
"
```

### Manual Agent Creation with Specific Numbers
```bash
# Initialize multiple agents in sequence
for i in {1..5}; do
  node initialize-agent.js init "{\"role\": \"worker_$i\", \"sessionId\": \"batch_session_$i\"}"
done
```

### Batch Agent Management
```bash
# Initialize multiple specialized agents
agents=(
  '{"role": "development", "specialization": ["frontend"], "sessionId": "frontend_dev"}'
  '{"role": "testing", "specialization": ["unit-tests"], "sessionId": "test_runner"}'
  '{"role": "review", "specialization": ["code-review"], "sessionId": "reviewer"}'
)

for agent_config in "${agents[@]}"; do
  result=$(node initialize-agent.js init "$agent_config")
  agent_id=$(echo "$result" | jq -r '.agentId')
  echo "Initialized: $agent_id"
done
```

## Monitoring and Maintenance

### Activity Monitoring
```bash
# Monitor agent activity in real-time
watch -n 30 'node initialize-agent.js active | jq ".activeAgents[] | {agentId, lastActivity: (.lastActivity | strftime(\"%Y-%m-%d %H:%M:%S\")), totalRequests}"'

# Check for agents about to become inactive (within 30 minutes of 2-hour timeout)
node -e "
const AgentRegistry = require('./lib/agentRegistry');
const registry = new AgentRegistry();
const data = registry.readRegistry();
const threshold = 2 * 60 * 60 * 1000 - 30 * 60 * 1000; // 1.5 hours
Object.values(data.agents).forEach(agent => {
  const timeSinceActivity = Date.now() - agent.lastActivity;
  if (timeSinceActivity > threshold && timeSinceActivity < 2 * 60 * 60 * 1000) {
    console.log(\`Warning: \${agent.agentId} will become inactive in \${Math.round((2 * 60 * 60 * 1000 - timeSinceActivity) / (1000 * 60))} minutes\`);
  }
});
"
```

### Registry Maintenance
```bash
# Force cleanup of inactive agents
node -e "
const AgentRegistry = require('./lib/agentRegistry');
const registry = new AgentRegistry();
registry.withFileLock(async () => {
  const data = registry.readRegistry();
  await registry.cleanupInactiveAgents(data);
  registry.writeRegistry(data);
  console.log('Cleanup completed');
});
"

# Backup registry file
cp agent-registry.json "agent-registry-backup-$(date +%Y%m%d_%H%M%S).json"

# View registry file directly
cat agent-registry.json | jq '.'
```

## Integration with TaskManager

### Complete Workflow Example
```bash
#!/bin/bash
# Complete agent and task workflow

# 1. Initialize agent
echo "🚀 Initializing agent..."
AGENT_RESULT=$(node initialize-agent.js init '{"role": "development", "sessionId": "workflow_demo"}')
AGENT_ID=$(echo "$AGENT_RESULT" | jq -r '.agentId')
echo "Agent ID: $AGENT_ID"

# 2. Set environment variable
export CLAUDE_AGENT_ID="$AGENT_ID"

# 3. Get task guidance
echo "📋 Getting task guidance..."
node stop-hook-simple.js

# 4. Update activity periodically (example background process)
update_activity() {
  while true; do
    sleep 300  # 5 minutes
    node initialize-agent.js update "$AGENT_ID" > /dev/null
    echo "Updated activity for $AGENT_ID at $(date)"
  done
}

# Start activity updater in background
update_activity &
UPDATER_PID=$!

# 5. Work on tasks...
echo "Working on tasks... (Ctrl+C to stop)"

# 6. Cleanup on exit
trap "kill $UPDATER_PID 2>/dev/null; exit" INT TERM
wait
```

### Multi-Agent Collaboration
```bash
# Initialize multiple collaborative agents
echo "🤖 Setting up multi-agent collaboration..."

# Agent 1: Frontend developer
FRONTEND_AGENT=$(node initialize-agent.js init '{"role": "development", "specialization": ["frontend", "react"], "sessionId": "frontend_dev"}' | jq -r '.agentId')

# Agent 2: Backend developer  
BACKEND_AGENT=$(node initialize-agent.js init '{"role": "development", "specialization": ["backend", "api"], "sessionId": "backend_dev"}' | jq -r '.agentId')

# Agent 3: Tester
TEST_AGENT=$(node initialize-agent.js init '{"role": "testing", "specialization": ["integration", "e2e"], "sessionId": "test_runner"}' | jq -r '.agentId')

echo "Agents initialized:"
echo "  Frontend: $FRONTEND_AGENT"
echo "  Backend: $BACKEND_AGENT"
echo "  Testing: $TEST_AGENT"

# Each agent can now work on their assigned tasks
# They will automatically reuse slots when restarted after inactivity
```

## Environment Variable Reference

```bash
# Agent identification
export CLAUDE_AGENT_ID="agent_1"              # Specific agent ID (if known)
export CLAUDE_SESSION_ID="my_session"         # Session identifier for agent grouping
export CLAUDE_AGENT_ROLE="development"        # Agent role (development, testing, review, etc.)
export CLAUDE_AGENT_SPECIALIZATION="testing,linting"  # Comma-separated specializations

# Registry configuration
export AGENT_REGISTRY_PATH="./agent-registry.json"     # Custom registry file location
export AGENT_INACTIVITY_TIMEOUT="7200000"              # Custom timeout (2 hours in ms)
```

## Error Handling and Troubleshooting

### Common Commands for Debugging
```bash
# Check if registry file exists and is valid
test -f agent-registry.json && echo "Registry exists" || echo "Registry missing"
cat agent-registry.json | jq empty && echo "Valid JSON" || echo "Invalid JSON"

# Reset registry (⚠️ Use with caution)
rm -f agent-registry.json agent-registry.json.lock
node initialize-agent.js stats  # This will recreate the registry

# Check for lock files (if experiencing timeout issues)
ls -la agent-registry.json.lock 2>/dev/null && echo "Lock file exists" || echo "No lock file"

# Force remove stuck lock (⚠️ Only if sure no other process is using it)
rm -f agent-registry.json.lock
```

### Validation Commands
```bash
# Validate agent registry structure
node -e "
const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('agent-registry.json', 'utf8'));
  console.log('✅ Registry structure valid');
  console.log('Agents:', Object.keys(data.agents).length);
  console.log('Next number:', data.nextAgentNumber);
} catch (e) {
  console.log('❌ Registry invalid:', e.message);
}
"

# Test agent initialization
node initialize-agent.js init '{"role": "test", "sessionId": "validation_test"}' | jq '.success'
```

This system provides robust agent management with automatic number assignment and efficient reuse of inactive slots, perfect for your multi-agent task orchestration needs!