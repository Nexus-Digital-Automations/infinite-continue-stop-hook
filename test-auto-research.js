#!/usr/bin/env node

/**
 * Test Auto-Research Task Creation System
 * 
 * Tests the enhanced TaskManager's ability to automatically create research
 * dependencies for complex implementation tasks.
 */

const TaskManager = require('./lib/taskManager');

class AutoResearchTester {
  constructor() {
    this.taskManager = new TaskManager('./TODO.json');
    this.testResults = [];
  }

  async runTest(testName, testFn) {
    console.log(`🧪 Testing: ${testName}`);
    
    try {
      const startTime = Date.now();
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'PASS',
        duration,
        result
      });
      
      console.log(`   ✅ PASS (${duration}ms)`);
      return result;
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'FAIL',
        error: error.message
      });
      
      console.log(`   ❌ FAIL: ${error.message}`);
      return null;
    }
  }

  /**
   * Test 1: Simple task should NOT trigger auto-research
   */
  async testSimpleTask() {
    return this.runTest('Simple task - no auto-research', async () => {
      const taskData = {
        title: 'Fix typo in documentation',
        description: 'Update the README file to fix spelling errors',
        category: 'documentation',
        priority: 'low'
      };
      
      const taskId = await this.taskManager.createTask(taskData);
      const todoData = await this.taskManager.readTodo();
      const task = todoData.tasks.find(t => t.id === taskId);
      
      if (task.auto_research_created) {
        throw new Error('Simple documentation task should not trigger auto-research');
      }
      
      if (task.dependencies.length > 0) {
        throw new Error('Simple task should not have research dependencies');
      }
      
      console.log(`     ✓ Task created without auto-research: ${taskId}`);
      return { taskId, autoResearch: false };
    });
  }

  /**
   * Test 2: Complex API integration should trigger auto-research
   */
  async testComplexApiTask() {
    return this.runTest('Complex API task - auto-research created', async () => {
      const taskData = {
        title: 'Implement OAuth 2.0 authentication with external API',
        description: 'Create integration with third-party API using OAuth 2.0 for secure authentication and data exchange',
        category: 'missing-feature',
        priority: 'high'
      };
      
      const taskId = await this.taskManager.createTask(taskData);
      const todoData = await this.taskManager.readTodo();
      const task = todoData.tasks.find(t => t.id === taskId);
      
      if (!task.auto_research_created) {
        throw new Error('Complex API task should trigger auto-research');
      }
      
      if (task.dependencies.length === 0) {
        throw new Error('Complex task should have research dependency');
      }
      
      // Find the research task
      const researchTaskId = task.dependencies[0];
      const researchTask = todoData.tasks.find(t => t.id === researchTaskId);
      
      if (!researchTask) {
        throw new Error('Research dependency task not found');
      }
      
      if (researchTask.category !== 'research') {
        throw new Error('Dependency should be a research task');
      }
      
      if (!researchTask.title.includes('Research:')) {
        throw new Error('Research task should have "Research:" prefix');
      }
      
      console.log(`     ✓ Implementation task: ${taskId}`);
      console.log(`     ✓ Research dependency: ${researchTaskId}`);
      console.log(`     ✓ Research title: ${researchTask.title}`);
      
      return { 
        implementationTaskId: taskId, 
        researchTaskId: researchTaskId,
        autoResearch: true 
      };
    });
  }

  /**
   * Test 3: Database schema task should trigger auto-research
   */
  async testDatabaseTask() {
    return this.runTest('Database schema task - auto-research created', async () => {
      const taskData = {
        title: 'Design and implement user database schema',
        description: 'Create PostgreSQL database schema for user management with proper indexing and relationships',
        category: 'missing-feature',
        priority: 'medium'
      };
      
      const taskId = await this.taskManager.createTask(taskData);
      const todoData = await this.taskManager.readTodo();
      const task = todoData.tasks.find(t => t.id === taskId);
      
      if (!task.auto_research_created) {
        throw new Error('Database schema task should trigger auto-research');
      }
      
      if (task.dependencies.length === 0) {
        throw new Error('Database task should have research dependency');
      }
      
      const researchTask = todoData.tasks.find(t => t.id === task.dependencies[0]);
      
      // Check priority boost for research
      if (researchTask.priority !== 'high') {
        throw new Error('Research task should have boosted priority (medium -> high)');
      }
      
      console.log(`     ✓ Database task: ${taskId} (priority: ${task.priority})`);
      console.log(`     ✓ Research task: ${researchTask.id} (priority: ${researchTask.priority})`);
      
      return { 
        implementationTaskId: taskId, 
        researchTaskId: researchTask.id,
        priorityBoosted: true 
      };
    });
  }

  /**
   * Test 4: Task with skip_auto_research should NOT trigger auto-research
   */
  async testSkipAutoResearch() {
    return this.runTest('Skip auto-research flag respected', async () => {
      const taskData = {
        title: 'Implement machine learning recommendation engine',
        description: 'Build ML-based recommendation system using neural networks',
        category: 'missing-feature',
        priority: 'high',
        skip_auto_research: true // Explicitly skip
      };
      
      const taskId = await this.taskManager.createTask(taskData);
      const todoData = await this.taskManager.readTodo();
      const task = todoData.tasks.find(t => t.id === taskId);
      
      if (task.auto_research_created) {
        throw new Error('Task with skip_auto_research should not trigger auto-research');
      }
      
      if (task.dependencies.length > 0) {
        throw new Error('Skipped task should not have research dependencies');
      }
      
      console.log(`     ✓ Complex task skipped auto-research: ${taskId}`);
      return { taskId, autoResearch: false, skipped: true };
    });
  }

  /**
   * Test 5: Research task should NOT trigger recursive research
   */
  async testResearchTaskNoRecursion() {
    return this.runTest('Research task - no recursive auto-research', async () => {
      const taskData = {
        title: 'Research: API integration best practices',
        description: 'Research OAuth 2.0 implementation patterns and security considerations',
        category: 'research',
        mode: 'RESEARCH',
        priority: 'high'
      };
      
      const taskId = await this.taskManager.createTask(taskData);
      const todoData = await this.taskManager.readTodo();
      const task = todoData.tasks.find(t => t.id === taskId);
      
      if (task.auto_research_created) {
        throw new Error('Research task should not trigger auto-research (recursive)');
      }
      
      if (task.dependencies.length > 0) {
        throw new Error('Research task should not have dependencies');
      }
      
      console.log(`     ✓ Research task created without recursion: ${taskId}`);
      return { taskId, autoResearch: false, isResearch: true };
    });
  }

  /**
   * Display test summary
   */
  displaySummary() {
    console.log('\n📊 Auto-Research Test Summary');
    console.log('==============================');
    
    const passed = this.testResults.filter(t => t.status === 'PASS').length;
    const failed = this.testResults.filter(t => t.status === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(t => t.status === 'FAIL')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n⚡ Performance:');
    const avgDuration = this.testResults
      .filter(t => t.duration)
      .reduce((sum, t) => sum + t.duration, 0) / passed;
    
    console.log(`   Average test duration: ${avgDuration.toFixed(0)}ms`);
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Auto-Research Task Creation Test Suite');
    console.log('==========================================\n');
    
    await this.testSimpleTask();
    await this.testComplexApiTask();
    await this.testDatabaseTask();
    await this.testSkipAutoResearch();
    await this.testResearchTaskNoRecursion();
    
    this.displaySummary();
    
    return {
      passed: this.testResults.filter(t => t.status === 'PASS').length,
      failed: this.testResults.filter(t => t.status === 'FAIL').length,
      total: this.testResults.length
    };
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new AutoResearchTester();
  
  tester.runAllTests()
    .then(summary => {
      if (summary.failed > 0) {
        console.log('\n💥 Some tests failed!');
        process.exit(1);
      } else {
        console.log('\n🎉 All auto-research tests passed!');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = AutoResearchTester;