#!/usr/bin/env node

const express = require('express');
const AgentRegistry = require('./lib/agentRegistry');

const app = express();
const PORT = 3001; // Different port

// Initialize AgentRegistry
const agentRegistry = new AgentRegistry('./agent-registry.json');

console.log('AgentRegistry methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(agentRegistry)).filter(name => name !== 'constructor'));

// Test endpoint
app.get('/test-agents', async (req, res) => {
  try {
    console.log('Type of getAllAgents:', typeof agentRegistry.getAllAgents);
    console.log('Type of listAgents:', typeof agentRegistry.listAgents);
    
    const agents = agentRegistry.getAllAgents();
    res.json({ 
      success: true, 
      agents: agents,
      count: agents.length 
    });
  } catch (error) {
    console.error('Error in test-agents endpoint:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Test endpoint: http://localhost:3001/test-agents');
});