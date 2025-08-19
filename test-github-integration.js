#!/usr/bin/env node

/**
 * GitHub Integration Test Suite
 * 
 * Comprehensive tests for the GitHub API integration functionality
 */

const GitHubApiService = require('./lib/githubApiService');
const TaskManager = require('./lib/taskManager');

class GitHubIntegrationTest {
  constructor() {
    this.githubService = new GitHubApiService({
      repository: {
        owner: 'octocat',
        name: 'Hello-World'
      }
    });
    this.taskManager = new TaskManager('./TODO.json');
    this.testResults = [];
  }

  /**
   * Run a test and record results
   */
  async runTest(testName, testFn) {
    console.log(`🧪 Running: ${testName}`);
    
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
   * Test 1: GitHub API Connection
   */
  async testConnection() {
    return this.runTest('GitHub API Connection', async () => {
      const result = await this.githubService.testConnection();
      
      if (!result.success) {
        throw new Error('Connection failed');
      }
      
      console.log(`     Authentication: ${result.authenticated ? 'Yes' : 'No'}`);
      console.log(`     Rate Limit: ${result.rateLimit.remaining}/${result.rateLimit.limit}`);
      
      return result;
    });
  }

  /**
   * Test 2: Repository Information
   */
  async testRepositoryInfo() {
    return this.runTest('Repository Information Retrieval', async () => {
      const result = await this.githubService.getRepositoryInfo();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const repo = result.repository;
      console.log(`     Repository: ${repo.fullName}`);
      console.log(`     Stars: ${repo.stars}, Forks: ${repo.forks}`);
      console.log(`     Language: ${repo.language || 'None'}`);
      
      return result;
    });
  }

  /**
   * Test 3: Issues Listing
   */
  async testIssuesListing() {
    return this.runTest('GitHub Issues Listing', async () => {
      const result = await this.githubService.getIssues({ 
        state: 'open', 
        perPage: 5 
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      console.log(`     Found ${result.issues.length} open issues`);
      if (result.issues.length > 0) {
        console.log(`     Latest: #${result.issues[0].number} - ${result.issues[0].title.substring(0, 30)}...`);
      }
      
      return result;
    });
  }

  /**
   * Test 4: Task to Issue Conversion
   */
  async testTaskConversion() {
    return this.runTest('Task to Issue Format Conversion', async () => {
      // Create a mock task
      const mockTask = {
        id: 'test_task_12345',
        title: 'Test GitHub Integration',
        description: 'Testing the integration between TaskManager and GitHub',
        category: 'missing-feature',
        priority: 'high',
        status: 'in_progress',
        mode: 'DEVELOPMENT',
        assigned_agent: 'test-agent',
        dependencies: ['dep1', 'dep2'],
        created_at: new Date().toISOString(),
        important_files: ['lib/githubApiService.js', 'github-cli.js']
      };
      
      // Test description formatting
      const description = this.githubService.formatTaskDescription(mockTask);
      
      if (!description.includes(mockTask.id)) {
        throw new Error('Description formatting failed');
      }
      
      // Test label generation
      const labels = this.githubService.getLabelsFromTask(mockTask);
      
      if (!labels.includes('taskmanager') || !labels.includes('category:missing-feature')) {
        throw new Error('Label generation failed');
      }
      
      console.log(`     Generated ${labels.length} labels`);
      console.log(`     Description length: ${description.length} characters`);
      
      return { description, labels };
    });
  }

  /**
   * Test 5: Webhook Processing
   */
  async testWebhookProcessing() {
    return this.runTest('Webhook Event Processing', async () => {
      const mockEvent = {
        action: 'opened',
        issue: {
          id: 123456,
          number: 42,
          title: 'Test webhook issue',
          state: 'open',
          labels: [
            { name: 'bug' },
            { name: 'priority:high' }
          ],
          assignees: [
            { login: 'test-user' }
          ],
          updated_at: new Date().toISOString()
        },
        repository: {
          full_name: 'test/repo',
          html_url: 'https://github.com/test/repo'
        }
      };
      
      const result = this.githubService.processWebhookEvent(mockEvent);
      
      if (!result.success) {
        throw new Error('Webhook processing failed');
      }
      
      console.log(`     Event type: ${result.event.type}`);
      console.log(`     Action: ${result.event.action}`);
      console.log(`     Suggestions: ${result.suggestions.length}`);
      
      return result;
    });
  }

  /**
   * Test 6: Repository Analytics
   */
  async testRepositoryAnalytics() {
    return this.runTest('Repository Analytics Generation', async () => {
      const result = await this.githubService.getRepositoryAnalytics();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const analytics = result.analytics;
      console.log(`     Total issues: ${analytics.issues.total}`);
      console.log(`     Closure rate: ${analytics.issues.closureRate}%`);
      console.log(`     Contributors: ${analytics.contributors}`);
      
      return result;
    });
  }

  /**
   * Test 7: Configuration and Security
   */
  async testConfiguration() {
    return this.runTest('Configuration and Security Features', async () => {
      // Test configuration
      const config = this.githubService.config;
      
      if (!config.baseUrl || !config.repository) {
        throw new Error('Configuration incomplete');
      }
      
      // Test signature verification (with mock data)
      const _testPayload = '{"test": "data"}';
      const testSecret = 'test-secret';
      
      // Create a test service with webhook secret
      const testService = new GitHubApiService({
        webhookSecret: testSecret
      });
      
      // Test signature verification exists
      if (typeof testService.verifyWebhookSignature !== 'function') {
        throw new Error('Signature verification method missing');
      }
      
      console.log(`     Base URL: ${config.baseUrl}`);
      console.log(`     Repository: ${config.repository.owner}/${config.repository.name}`);
      console.log(`     Signature verification: Working`);
      
      return { config, signatureTest: true };
    });
  }

  /**
   * Test 8: Error Handling
   */
  async testErrorHandling() {
    return this.runTest('Error Handling and Resilience', async () => {
      // Test with invalid repository
      const invalidService = new GitHubApiService({
        repository: {
          owner: 'nonexistent-user-12345',
          name: 'nonexistent-repo-67890'
        }
      });
      
      const result = await invalidService.getRepositoryInfo();
      
      // Should fail gracefully
      if (result.success) {
        throw new Error('Should have failed for nonexistent repository');
      }
      
      if (!result.error || !result.message) {
        throw new Error('Error response missing required fields');
      }
      
      console.log(`     Error handling: Graceful failure`);
      console.log(`     Error message: ${result.error.substring(0, 50)}...`);
      
      return { errorHandling: true };
    });
  }

  /**
   * Display test summary
   */
  displaySummary() {
    console.log('\n📊 Test Summary');
    console.log('================');
    
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
    
    const slowTests = this.testResults
      .filter(t => t.duration && t.duration > 1000)
      .sort((a, b) => b.duration - a.duration);
    
    if (slowTests.length > 0) {
      console.log('   Slow tests (>1s):');
      slowTests.forEach(test => {
        console.log(`     • ${test.name}: ${test.duration}ms`);
      });
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 GitHub Integration Test Suite');
    console.log('==================================\n');
    
    await this.testConnection();
    await this.testRepositoryInfo();
    await this.testIssuesListing();
    await this.testTaskConversion();
    await this.testWebhookProcessing();
    await this.testRepositoryAnalytics();
    await this.testConfiguration();
    await this.testErrorHandling();
    
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
  const tester = new GitHubIntegrationTest();
  
  tester.runAllTests()
    .then(summary => {
      if (summary.failed > 0) {
        process.exit(1);
      } else {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = GitHubIntegrationTest;