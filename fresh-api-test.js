#!/usr/bin/env node

// Clear require cache to ensure fresh module loading
delete require.cache[require.resolve('./lib/agentRegistry')];
delete require.cache[require.resolve('./lib/taskManager')];
delete require.cache[require.resolve('./api-server')];

const http = require('http');

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api' + path,
      method: method,
      headers: { 'Accept': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });

    req.on('error', reject);
    req.end();
  });
}

async function testFixedEndpoints() {
  console.log('🧪 Testing fixed API endpoints...\n');

  // Test /api/status
  console.log('Testing /api/status...');
  const status = await makeRequest('GET', '/status');
  console.log(`Status: ${status.status}`);
  if (status.status === 200) {
    const data = JSON.parse(status.body);
    console.log(`✅ Success! Agents: ${data.data.agents.total} total, ${data.data.agents.active} active`);
  } else {
    console.log(`❌ Error: ${status.body}`);
  }

  // Test /api/agents
  console.log('\nTesting /api/agents...');
  const agents = await makeRequest('GET', '/agents');
  console.log(`Status: ${agents.status}`);
  if (agents.status === 200) {
    const data = JSON.parse(agents.body);
    console.log(`✅ Success! Found ${data.data.agents.length} agents`);
  } else {
    console.log(`❌ Error: ${agents.body}`);
  }
}

// Start fresh server and test
const { spawn } = require('child_process');

console.log('🚀 Starting fresh API server...');
const server = spawn('node', ['api-server.js'], { 
  stdio: ['ignore', 'pipe', 'pipe']
});

server.stderr.on('data', (data) => {
  console.error('[ERROR]', data.toString().trim());
});

setTimeout(async () => {
  try {
    await testFixedEndpoints();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  server.kill('SIGTERM');
  process.exit(0);
}, 3000);