#!/usr/bin/env node

const AgentRegistry = require('./lib/agentRegistry');

console.log('🧪 Testing AgentRegistry methods...');

const agentRegistry = new AgentRegistry('./agent-registry.json');

console.log('Available methods:');
console.log('- getAllAgents:', typeof agentRegistry.getAllAgents);
console.log('- getActiveAgents:', typeof agentRegistry.getActiveAgents);
console.log('- listAgents:', typeof agentRegistry.listAgents);

try {
  const allAgents = agentRegistry.getAllAgents();
  console.log('✅ getAllAgents() works, returned:', allAgents.length, 'agents');
  
  const activeAgents = agentRegistry.getActiveAgents();
  console.log('✅ getActiveAgents() works, returned:', activeAgents.length, 'active agents');
} catch (error) {
  console.error('❌ Error:', error.message);
}