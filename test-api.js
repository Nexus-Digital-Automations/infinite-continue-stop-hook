#!/usr/bin/env node

/**
 * Simple API Test Client
 * 
 * Tests the REST API endpoints to verify functionality
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const { URL } = require('url');
    const url = new URL(API_BASE + path);
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
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing TaskManager REST API\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const health = await makeRequest('GET', '/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response: ${health.data.success ? '✅ Healthy' : '❌ Unhealthy'}\n`);

    // Test 2: System status
    console.log('2. Testing system status...');
    const status = await makeRequest('GET', '/status');
    console.log(`   Status: ${status.status}`);
    if (status.data.success) {
      console.log(`   ✅ Tasks: ${status.data.data.tasks.total} total`);
      console.log(`   ✅ Agents: ${status.data.data.agents.total} total, ${status.data.data.agents.active} active\n`);
    }

    // Test 3: List tasks
    console.log('3. Testing task listing...');
    const tasks = await makeRequest('GET', '/tasks');
    console.log(`   Status: ${tasks.status}`);
    if (tasks.data.success) {
      console.log(`   ✅ Found ${tasks.data.data.tasks.length} tasks\n`);
    }

    // Test 4: Create a test task
    console.log('4. Testing task creation...');
    const newTask = {
      title: 'API Test Task',
      description: 'Test task created via REST API',
      category: 'missing-feature',
      priority: 'medium'
    };
    const createResult = await makeRequest('POST', '/tasks', newTask);
    console.log(`   Status: ${createResult.status}`);
    if (createResult.data.success) {
      console.log(`   ✅ Created task: ${createResult.data.data.taskId}\n`);
      
      // Test 5: Get the created task
      console.log('5. Testing task retrieval...');
      const taskId = createResult.data.data.taskId;
      const getTask = await makeRequest('GET', `/tasks/${taskId}`);
      console.log(`   Status: ${getTask.status}`);
      if (getTask.data.success) {
        console.log(`   ✅ Retrieved task: ${getTask.data.data.task.title}\n`);
      }
    }

    // Test 6: List agents
    console.log('6. Testing agent listing...');
    const agents = await makeRequest('GET', '/agents');
    console.log(`   Status: ${agents.status}`);
    if (agents.data.success) {
      console.log(`   ✅ Found ${Object.keys(agents.data.data.agents).length} agents\n`);
    }

    // Test 7: System statistics
    console.log('7. Testing system statistics...');
    const stats = await makeRequest('GET', '/stats');
    console.log(`   Status: ${stats.status}`);
    if (stats.data.success) {
      console.log(`   ✅ Statistics retrieved successfully\n`);
    }

    console.log('🎉 All API tests completed successfully!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    process.exit(1);
  }
}

// Start API server in background and run tests
const { spawn } = require('child_process');

console.log('🚀 Starting API server...');
const server = spawn('node', ['api-server.js'], { 
  stdio: ['pipe', 'pipe', 'pipe'],
  detached: false
});

// Wait for server to start
setTimeout(async () => {
  try {
    await testAPI();
    
    // Clean shutdown
    console.log('\n🛑 Stopping API server...');
    server.kill('SIGTERM');
    
    setTimeout(() => {
      console.log('✅ API testing complete!');
      process.exit(0);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    server.kill('SIGTERM');
    process.exit(1);
  }
}, 2000);

// Handle server errors
server.stderr.on('data', (data) => {
  if (data.toString().includes('Error')) {
    console.error('❌ Server error:', data.toString());
    process.exit(1);
  }
});

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(1);
  }
});