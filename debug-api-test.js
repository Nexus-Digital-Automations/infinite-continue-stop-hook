#!/usr/bin/env node

const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const { URL } = require('url');
    const url = new URL('http://localhost:3000/api' + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body, headers: res.headers });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function debugAPI() {
  console.log('🔍 Debugging API endpoints that return 500 errors\n');

  try {
    // Test the failing endpoints with detailed error info
    console.log('Testing /api/status...');
    const status = await makeRequest('GET', '/status');
    console.log(`Status: ${status.status}`);
    console.log(`Body: ${status.body}`);
    console.log('');

    console.log('Testing /api/agents...');
    const agents = await makeRequest('GET', '/agents');
    console.log(`Status: ${agents.status}`);
    console.log(`Body: ${agents.body}`);
    console.log('');

  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
}

// Start server and debug
const { spawn } = require('child_process');

console.log('🚀 Starting API server for debugging...');
const server = spawn('node', ['api-server.js'], { 
  stdio: ['pipe', 'pipe', 'pipe'],
  detached: false
});

// Capture server logs
server.stdout.on('data', (data) => {
  console.log('[SERVER]', data.toString().trim());
});

server.stderr.on('data', (data) => {
  console.error('[SERVER ERROR]', data.toString().trim());
});

// Wait for server to start and then debug
setTimeout(async () => {
  await debugAPI();
  
  console.log('🛑 Stopping server...');
  server.kill('SIGTERM');
  process.exit(0);
}, 3000);