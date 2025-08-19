#!/usr/bin/env node

// Simple test to isolate the issue
const AgentRegistry = require('./lib/agentRegistry');
const agentRegistry = new AgentRegistry('./agent-registry.json');

console.log('Testing AgentRegistry instance:');
console.log('Type of getAllAgents:', typeof agentRegistry.getAllAgents);
console.log('Type of listAgents:', typeof agentRegistry.listAgents);

console.log('\nCalling getAllAgents():');
try {
  const result = agentRegistry.getAllAgents();
  console.log('✅ Success:', result);
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('\nTesting if listAgents exists:');
if (agentRegistry.listAgents) {
  console.log('❌ listAgents method exists (should not!)');
} else {
  console.log('✅ listAgents method does not exist (correct)');
}

// Now test the problematic line from the API server
console.log('\nTesting the exact line from API server:');
try {
  const agents = agentRegistry.getAllAgents();
  console.log('✅ agentRegistry.getAllAgents() works, returned', agents.length, 'agents');
} catch (error) {
  console.error('❌ agentRegistry.getAllAgents() failed:', error.message);
}