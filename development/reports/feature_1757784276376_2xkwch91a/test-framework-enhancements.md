# Test Framework Enhancement Recommendations

**Task ID**: feature_1757784276376_2xkwch91a  
**Document**: Test Framework Technical Specifications  
**Date**: 2025-09-13  

## Current Issues Analysis

### EPIPE Error Resolution
**Problem**: Tests failing with `Error: write EPIPE` during execution  
**Root Cause**: Jest reporter stream handling issues with timeout commands  

**Solution Strategy**:
```javascript
// Enhanced jest.config.js
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  maxWorkers: 1, // Prevent concurrent stream conflicts
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: './test-results' }]
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup-enhanced.js']
};
```

## Enhanced Test Utilities

### 1. Robust API Execution Wrapper
```javascript
// test/utils/enhanced-api-exec.js
const { spawn } = require('child_process');
const path = require('path');

class EnhancedAPIExecutor {
  constructor(projectRoot = null) {
    this.projectRoot = projectRoot || path.join(__dirname, '..', 'test-project');
    this.apiPath = path.join(__dirname, '..', '..', 'taskmanager-api.js');
    this.defaultTimeout = 15000;
  }

  async execCommand(command, args = [], options = {}) {
    const timeout = options.timeout || this.defaultTimeout;
    const includeStderr = options.includeStderr || false;
    
    return new Promise((resolve, reject) => {
      const allArgs = [
        this.apiPath,
        command,
        ...args,
        '--project-root',
        this.projectRoot
      ];

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const child = spawn('node', allArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), 1000);
      }, timeout);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        
        if (timedOut) {
          reject(new Error(`Command timed out after ${timeout}ms: ${command} ${args.join(' ')}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          if (includeStderr && stderr) {
            result._stderr = stderr;
          }
          resolve(result);
        } catch (parseError) {
          if (code === 0 && stdout.trim()) {
            resolve({ success: true, output: stdout.trim() });
          } else {
            reject(new Error(`Command failed (exit code ${code}): ${stderr || stdout || 'No output'}`));
          }
        }
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(new Error(`Spawn error: ${error.message}`));
      });
    });
  }

  // Specialized methods for common operations
  async initAgent(config = {}) {
    return this.execCommand('init', [JSON.stringify(config)]);
  }

  async createTask(taskData) {
    return this.execCommand('create', [JSON.stringify(taskData)]);
  }

  async claimTask(taskId, agentId) {
    return this.execCommand('claim', [taskId, agentId]);
  }

  async completeTask(taskId, message = '') {
    const args = message ? [taskId, JSON.stringify(message)] : [taskId];
    return this.execCommand('complete', args);
  }

  async listTasks(filter = {}) {
    return this.execCommand('list', [JSON.stringify(filter)]);
  }
}

module.exports = { EnhancedAPIExecutor };
```

### 2. Test Data Factory System
```javascript
// test/utils/test-data-factory.js
const crypto = require('crypto');

class TestDataFactory {
  static generateTaskId(prefix = 'task') {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${prefix}_${timestamp}_${random}`;
  }

  static createTaskData(overrides = {}) {
    return {
      title: `Test Task ${Date.now()}`,
      description: 'Auto-generated test task',
      category: 'feature',
      priority: 'medium',
      status: 'pending',
      dependencies: [],
      important_files: [],
      success_criteria: [],
      estimate: '2h',
      requires_research: false,
      ...overrides
    };
  }

  static createSubtaskData(taskId, type = 'research', overrides = {}) {
    return {
      type,
      title: `Test ${type} subtask for ${taskId}`,
      description: `Auto-generated ${type} subtask`,
      status: 'pending',
      estimated_hours: type === 'research' ? 1 : 0.5,
      taskId,
      ...overrides
    };
  }

  static createAgentConfig(role = 'development', overrides = {}) {
    return {
      role,
      sessionId: `test_session_${Date.now()}`,
      specialization: [],
      capabilities: ['task_management', 'code_analysis'],
      ...overrides
    };
  }

  static createSuccessCriteria(type = 'task', overrides = {}) {
    const baseCriteria = [
      'Implementation completed',
      'Code quality validated',
      'Tests passing',
      'Documentation updated'
    ];

    return {
      type,
      criteria: baseCriteria,
      validation_method: 'automated',
      created_at: new Date().toISOString(),
      ...overrides
    };
  }
}

module.exports = { TestDataFactory };
```

### 3. Test Environment Manager
```javascript
// test/utils/test-environment.js
const fs = require('fs');
const path = require('path');
const { TestDataFactory } = require('./test-data-factory');

class TestEnvironmentManager {
  constructor(testName) {
    this.testName = testName;
    this.testDir = path.join(__dirname, '..', 'environments', testName);
    this.todoPath = path.join(this.testDir, 'TODO.json');
    this.donePath = path.join(this.testDir, 'DONE.json');
  }

  async setup() {
    // Create test directory
    await fs.promises.mkdir(this.testDir, { recursive: true });

    // Initialize TODO.json with test structure
    const initialTodoData = {
      version: '2.0',
      tasks: [],
      agents: {},
      features: [],
      metadata: {
        created: new Date().toISOString(),
        test_environment: true
      }
    };

    await fs.promises.writeFile(
      this.todoPath,
      JSON.stringify(initialTodoData, null, 2)
    );

    // Initialize DONE.json
    const initialDoneData = {
      completed_tasks: [],
      archived_features: [],
      metadata: {
        created: new Date().toISOString(),
        test_environment: true
      }
    };

    await fs.promises.writeFile(
      this.donePath,
      JSON.stringify(initialDoneData, null, 2)
    );

    return this.testDir;
  }

  async cleanup() {
    try {
      await fs.promises.rm(this.testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors in test environment
      console.warn(`Cleanup warning for ${this.testDir}:`, error.message);
    }
  }

  async addTestTask(taskData = {}) {
    const task = TestDataFactory.createTaskData(taskData);
    const todoData = JSON.parse(await fs.promises.readFile(this.todoPath, 'utf8'));
    
    todoData.tasks.push(task);
    
    await fs.promises.writeFile(
      this.todoPath,
      JSON.stringify(todoData, null, 2)
    );

    return task;
  }

  async getTodoData() {
    return JSON.parse(await fs.promises.readFile(this.todoPath, 'utf8'));
  }
}

module.exports = { TestEnvironmentManager };
```

## Integration Test Templates

### 1. Subtask Endpoint Testing
```javascript
// test/integration/subtask-endpoints.test.js
const { EnhancedAPIExecutor } = require('../utils/enhanced-api-exec');
const { TestEnvironmentManager } = require('../utils/test-environment');
const { TestDataFactory } = require('../utils/test-data-factory');

describe('Subtask Endpoints Integration', () => {
  let apiExec;
  let testEnv;
  let agentId;

  beforeAll(async () => {
    testEnv = new TestEnvironmentManager('subtask-endpoints');
    const testDir = await testEnv.setup();
    apiExec = new EnhancedAPIExecutor(testDir);
    
    // Initialize test agent
    const agentResult = await apiExec.initAgent();
    agentId = agentResult.agentId;
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('POST /api/subtasks/create', () => {
    test('should create research subtask with metadata', async () => {
      // Create parent task
      const taskData = TestDataFactory.createTaskData({
        requires_research: true
      });
      const taskResult = await apiExec.createTask(taskData);
      expect(taskResult.success).toBe(true);

      // Create research subtask
      const subtaskData = TestDataFactory.createSubtaskData(
        taskResult.taskId,
        'research'
      );
      const result = await apiExec.execCommand('create-subtask', [
        JSON.stringify(subtaskData)
      ]);

      expect(result.success).toBe(true);
      expect(result.subtask.type).toBe('research');
      expect(result.subtask.taskId).toBe(taskResult.taskId);
    });

    test('should validate subtask data structure', async () => {
      const invalidSubtask = {
        type: 'invalid_type',
        title: '', // Empty title should fail
        taskId: 'nonexistent_task'
      };

      await expect(
        apiExec.execCommand('create-subtask', [JSON.stringify(invalidSubtask)])
      ).rejects.toThrow();
    });
  });

  describe('GET /api/subtasks/:taskId', () => {
    test('should retrieve subtasks for task', async () => {
      // Setup task with subtasks
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      // Add research subtask
      const researchSubtask = TestDataFactory.createSubtaskData(
        taskResult.taskId,
        'research'
      );
      await apiExec.execCommand('create-subtask', [
        JSON.stringify(researchSubtask)
      ]);

      // Retrieve subtasks
      const result = await apiExec.execCommand('get-subtasks', [
        taskResult.taskId
      ]);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.subtasks)).toBe(true);
      expect(result.subtasks.length).toBeGreaterThan(0);
    });
  });
});
```

### 2. Performance Testing Framework
```javascript
// test/performance/load-testing.test.js
const { EnhancedAPIExecutor } = require('../utils/enhanced-api-exec');
const { TestEnvironmentManager } = require('../utils/test-environment');
const { TestDataFactory } = require('../utils/test-data-factory');

describe('Performance Load Testing', () => {
  let apiExec;
  let testEnv;
  const PERFORMANCE_THRESHOLDS = {
    singleOperation: 500, // ms
    batchOperation: 5000, // ms
    concurrentAgents: 10
  };

  beforeAll(async () => {
    testEnv = new TestEnvironmentManager('performance-testing');
    const testDir = await testEnv.setup();
    apiExec = new EnhancedAPIExecutor(testDir);
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('Task Creation Performance', () => {
    test('single task creation under threshold', async () => {
      const taskData = TestDataFactory.createTaskData();
      const startTime = Date.now();
      
      const result = await apiExec.createTask(taskData);
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.singleOperation);
    });

    test('batch task creation performance', async () => {
      const batchSize = 50;
      const tasks = Array.from({ length: batchSize }, () =>
        TestDataFactory.createTaskData()
      );
      
      const startTime = Date.now();
      const results = await Promise.all(
        tasks.map(task => apiExec.createTask(task))
      );
      const duration = Date.now() - startTime;
      
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.batchOperation);
      
      // Calculate operations per second
      const opsPerSecond = (batchSize / duration) * 1000;
      console.log(`Task creation rate: ${opsPerSecond.toFixed(2)} ops/sec`);
    });
  });

  describe('Concurrent Agent Performance', () => {
    test('multiple agents task claiming', async () => {
      // Create tasks for agents to claim
      const taskPromises = Array.from({ length: 20 }, () =>
        apiExec.createTask(TestDataFactory.createTaskData())
      );
      const createdTasks = await Promise.all(taskPromises);
      
      // Initialize multiple agents
      const agentPromises = Array.from({ length: 10 }, () =>
        apiExec.initAgent()
      );
      const agents = await Promise.all(agentPromises);
      
      // Concurrent task claiming
      const startTime = Date.now();
      const claimPromises = agents.slice(0, 10).map((agent, index) =>
        apiExec.claimTask(createdTasks[index].taskId, agent.agentId)
      );
      
      const claimResults = await Promise.all(claimPromises);
      const duration = Date.now() - startTime;
      
      expect(claimResults.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.batchOperation);
    });
  });
});
```

## CI/CD Integration Configuration

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/enhanced-testing.yml
name: Enhanced TaskManager Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-matrix:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
        test-suite: [unit, integration, performance, security]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run ${{ matrix.test-suite }} tests
        run: npm run test:${{ matrix.test-suite }}
        env:
          NODE_ENV: test
          JEST_WORKERS: 1
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results-${{ matrix.node-version }}-${{ matrix.test-suite }}
          path: |
            test-results/
            coverage/
  
  quality-gates:
    needs: test-matrix
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Download all test results
        uses: actions/download-artifact@v3
      
      - name: Aggregate test results
        run: |
          npm run test:aggregate-results
          npm run test:quality-check
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('test-results/summary.json'));
            
            const comment = `## Test Results
            - **Coverage**: ${results.coverage}%
            - **Tests Passed**: ${results.passed}/${results.total}
            - **Performance**: ${results.performance.status}
            - **Security**: ${results.security.status}`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### 2. NPM Scripts Enhancement
```json
{
  "scripts": {
    "test": "jest --passWithNoTests",
    "test:unit": "jest test/unit --coverage",
    "test:integration": "jest test/integration --runInBand",
    "test:performance": "jest test/performance --runInBand --detectOpenHandles",
    "test:security": "jest test/security --runInBand",
    "test:e2e": "jest test/e2e --runInBand --detectOpenHandles",
    "test:watch": "jest --watch --passWithNoTests",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:aggregate-results": "node scripts/aggregate-test-results.js",
    "test:quality-check": "node scripts/quality-gates-check.js",
    "test:setup": "node scripts/setup-test-environment.js",
    "test:cleanup": "node scripts/cleanup-test-environment.js"
  }
}
```

## Quality Monitoring Dashboard

### Test Analytics Collector
```javascript
// scripts/test-analytics.js
const fs = require('fs');
const path = require('path');

class TestAnalytics {
  constructor() {
    this.metricsFile = path.join(__dirname, '..', 'test-results', 'metrics.json');
    this.trends = this.loadTrends();
  }

  loadTrends() {
    try {
      return JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
    } catch {
      return { history: [], summary: {} };
    }
  }

  recordTestRun(results) {
    const timestamp = new Date().toISOString();
    const record = {
      timestamp,
      coverage: results.coverage,
      duration: results.duration,
      passed: results.numPassedTests,
      failed: results.numFailedTests,
      total: results.numTotalTests,
      performance: results.performance || {}
    };

    this.trends.history.push(record);
    this.updateSummary();
    this.saveTrends();
  }

  updateSummary() {
    const recent = this.trends.history.slice(-10);
    this.trends.summary = {
      averageCoverage: recent.reduce((a, r) => a + r.coverage, 0) / recent.length,
      averageDuration: recent.reduce((a, r) => a + r.duration, 0) / recent.length,
      successRate: recent.reduce((a, r) => a + (r.failed === 0 ? 1 : 0), 0) / recent.length,
      lastUpdated: new Date().toISOString()
    };
  }

  saveTrends() {
    fs.mkdirSync(path.dirname(this.metricsFile), { recursive: true });
    fs.writeFileSync(this.metricsFile, JSON.stringify(this.trends, null, 2));
  }
}

module.exports = { TestAnalytics };
```

This enhanced test framework addresses the current EPIPE issues while providing robust infrastructure for comprehensive testing of TaskManager API enhancements. The framework includes proper error handling, test isolation, performance monitoring, and CI/CD integration capabilities.