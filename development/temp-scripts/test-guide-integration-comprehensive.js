/**
 * Comprehensive Integration Testing Framework for Guide Integration
 *
 * === PURPOSE ===
 * Validates that guide integration works correctly across ALL TaskManager API commands
 * and error scenarios. Tests guide content accuracy, caching performance, and
 * consistency across the entire API surface.
 *
 * === TEST COVERAGE ===
 * 1. ALL API Commands - Success and error scenarios
 * 2. Guide Content Validation - Completeness and accuracy
 * 3. Caching Performance - Speed and memory efficiency
 * 4. Error Handling - Context-specific guide delivery
 * 5. Concurrent Operations - Multi-agent guide access
 * 6. Regression Testing - Existing functionality preservation
 *
 * === EXECUTION ===
 * Run with: timeout 30s node test-guide-integration-comprehensive.js
 *
 * @author Integration Testing & Validation Specialist
 * @version 1.0.0
 */

/* eslint-disable security/detect-object-injection, security/detect-non-literal-fs-filename */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ComprehensiveGuideIntegrationTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
      performance: {
        guideGenerationTime: [],
        cacheHitRatio: 0,
        memoryUsage: [],
      },
    };

    this.apiPath = path.join(__dirname, 'taskmanager-api.js');
    this.startTime = Date.now();

    // Test configuration
    this.config = {
      timeout: 10000, // 10 second timeout per test
      maxRetries: 2,
      performanceThresholds: {
        guideGeneration: 2000, // 2 seconds max
        cacheRetrieval: 100, // 100ms max
        memoryIncrease: 50 * 1024 * 1024, // 50MB max increase
      },
    };

    // Track agent IDs for cleanup
    this.createdAgents = [];
    this.createdTasks = [];
  }

  /**
   * Execute TaskManager API command with timeout and capture output
   * @param {string} command - API command to execute
   * @param {Array} args - Command arguments
   * @returns {Promise<Object>} Command result with stdout, stderr, success
   */
  executeCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const fullArgs = [this.apiPath, command, ...args];
      const child = spawn(
        'timeout',
        [`${this.config.timeout / 1000}s`, 'node', ...fullArgs],
        {
          stdio: 'pipe',
          cwd: __dirname,
        },
      );

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        try {
          const result = {
            success: code === 0,
            code,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            parsed: null,
            hasGuide: false,
            guideQuality: null,
          };

          // Try to parse JSON output
          if (result.stdout) {
            try {
              result.parsed = JSON.parse(result.stdout);
              result.hasGuide = !!(result.parsed && result.parsed.guide);

              if (result.hasGuide) {
                result.guideQuality = this.assessGuideQuality(
                  result.parsed.guide,
                );
              }
            } catch {
              // Not JSON output, that's okay for some commands
            }
          }

          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Assess the quality and completeness of guide information
   * @param {Object} guide - Guide object to assess
   * @returns {Object} Quality assessment
   */
  assessGuideQuality(guide) {
    const assessment = {
      score: 0,
      maxScore: 100,
      issues: [],
      strengths: [],
    };

    // Check for essential guide components
    const essentialComponents = [
      'taskClassification',
      'coreCommands',
      'workflows',
      'examples',
      'requirements',
    ];

    essentialComponents.forEach((component) => {
      if (guide[component]) {
        assessment.score += 15;
        assessment.strengths.push(`Has ${component} section`);
      } else {
        assessment.issues.push(`Missing ${component} section`);
      }
    });

    // Check task classification completeness
    if (guide.taskClassification && guide.taskClassification.types) {
      const requiredTypes = ['error', 'feature', 'subtask', 'test'];
      const foundTypes = guide.taskClassification.types.map((t) => t.value);

      requiredTypes.forEach((type) => {
        if (foundTypes.includes(type)) {
          assessment.score += 5;
          assessment.strengths.push(`Includes ${type} task type`);
        } else {
          assessment.issues.push(`Missing ${type} task type`);
        }
      });
    }

    // Check examples completeness
    if (guide.examples && guide.examples.taskCreation) {
      const exampleTypes = Object.keys(guide.examples.taskCreation);
      if (exampleTypes.length >= 4) {
        assessment.score += 10;
        assessment.strengths.push('Complete task creation examples');
      }
    }

    return assessment;
  }

  /**
   * Run a single test with proper error handling and reporting
   * @param {string} testName - Name of the test
   * @param {Function} testFunction - Test function to execute
   */
  async runTest(testName, testFunction) {
    this.testResults.total++;

    const testStart = Date.now();
    const memStart = process.memoryUsage();

    try {
      console.log(`📋 Running: ${testName}`);
      await testFunction();

      const duration = Date.now() - testStart;
      const memEnd = process.memoryUsage();
      const memDelta = memEnd.heapUsed - memStart.heapUsed;

      this.testResults.passed++;
      this.testResults.details.push({
        name: testName,
        status: 'PASSED',
        duration,
        memoryDelta: memDelta,
        timestamp: new Date().toISOString(),
      });

      this.testResults.performance.memoryUsage.push(memDelta);

      console.log(
        `✅ PASSED: ${testName} (${duration}ms, ${Math.round(memDelta / 1024)}KB)`,
      );
    } catch (error) {
      const duration = Date.now() - testStart;

      this.testResults.failed++;
      this.testResults.details.push({
        name: testName,
        status: 'FAILED',
        error: error.message,
        stack: error.stack,
        duration,
        timestamp: new Date().toISOString(),
      });

      console.log(`❌ FAILED: ${testName} - ${error.message}`);
    }
  }

  /**
   * Test all core API commands for guide integration
   */
  async testCoreCommandGuideIntegration() {
    // Test guide command itself
    await this.runTest('Guide Command - Direct Access', async () => {
      const result = await this.executeCommand('guide');

      if (!result.success) {
        throw new Error(`Guide command failed: ${result.stderr}`);
      }

      if (!result.hasGuide) {
        throw new Error('Guide command should return guide information');
      }

      if (result.guideQuality.score < 80) {
        throw new Error(
          `Guide quality too low: ${result.guideQuality.score}/100`,
        );
      }
    });

    // Test methods command
    await this.runTest('Methods Command - Guide Integration', async () => {
      const result = await this.executeCommand('methods');

      if (!result.success) {
        throw new Error(`Methods command failed: ${result.stderr}`);
      }

      // Methods command should have basic API information
      if (!result.parsed || !result.parsed.success) {
        throw new Error('Methods command should return successful response');
      }
    });

    // Test init command guide integration
    await this.runTest('Init Command - Success Guide Integration', async () => {
      const result = await this.executeCommand('init', [
        '{"role": "test-agent"}',
      ]);

      if (!result.success) {
        throw new Error(`Init command failed: ${result.stderr}`);
      }

      if (!result.hasGuide) {
        throw new Error('Init command should include guide information');
      }

      // Track created agent for cleanup
      if (result.parsed && result.parsed.agentId) {
        this.createdAgents.push(result.parsed.agentId);
      }
    });

    // Test init command error guide integration
    await this.runTest('Init Command - Error Guide Integration', async () => {
      // Pass invalid JSON to trigger error
      const result = await this.executeCommand('init', ['{invalid-json}']);

      if (result.success) {
        throw new Error('Init with invalid JSON should fail');
      }

      if (!result.stderr) {
        throw new Error('Error response should be in stderr');
      }

      // Parse error response from stderr
      let errorResponse;
      try {
        errorResponse = JSON.parse(result.stderr);
      } catch {
        throw new Error('Error response should be valid JSON');
      }

      if (!errorResponse.guide) {
        throw new Error('Error response should include guide information');
      }
    });

    // Test reinitialize command guide integration
    await this.runTest('Reinitialize Command - Guide Integration', async () => {
      // First create an agent
      const initResult = await this.executeCommand('init');
      if (!initResult.success || !initResult.parsed.agentId) {
        throw new Error('Failed to create agent for reinitialize test');
      }

      const agentId = initResult.parsed.agentId;
      this.createdAgents.push(agentId);

      // Test reinitialize with guide
      const result = await this.executeCommand('reinitialize', [agentId]);

      if (!result.success) {
        throw new Error(`Reinitialize command failed: ${result.stderr}`);
      }

      if (!result.hasGuide) {
        throw new Error(
          'Reinitialize command should include guide information',
        );
      }
    });

    // Test create command guide integration (error case)
    await this.runTest('Create Command - Error Guide Integration', async () => {
      // Missing required category parameter should trigger guide
      const result = await this.executeCommand('create', ['{"title": "Test"}']);

      if (result.success) {
        throw new Error('Create without category should fail');
      }

      // Check that error response includes guide
      let errorResponse;
      try {
        if (result.stderr) {
          errorResponse = JSON.parse(result.stderr);
        } else {
          throw new Error('No error response provided');
        }
      } catch {
        throw new Error('Error response should be valid JSON');
      }

      if (!errorResponse.guide) {
        throw new Error('Error response should include guide information');
      }
    });

    // Test successful create command
    await this.runTest('Create Command - Success Case', async () => {
      const taskData = {
        title: 'Test Guide Integration Task',
        description: 'Testing guide integration in create command',
        task_type: 'test',
      };

      const result = await this.executeCommand('create', [
        JSON.stringify(taskData),
      ]);

      if (!result.success) {
        throw new Error(`Create command failed: ${result.stderr}`);
      }

      // Track created task for cleanup
      if (result.parsed && result.parsed.taskId) {
        this.createdTasks.push(result.parsed.taskId);
      }
    });

    // Test list command
    await this.runTest('List Command - Basic Functionality', async () => {
      const result = await this.executeCommand('list');

      if (!result.success) {
        throw new Error(`List command failed: ${result.stderr}`);
      }

      if (!result.parsed || !result.parsed.success) {
        throw new Error('List command should return successful response');
      }
    });

    // Test status command guide integration (error case)
    await this.runTest('Status Command - Error Guide Integration', async () => {
      // Test with non-existent agent ID
      const result = await this.executeCommand('status', ['nonexistent_agent']);

      if (result.success) {
        throw new Error('Status with invalid agent should fail');
      }

      // Should include guide in error response
      let errorResponse;
      try {
        if (result.stderr) {
          errorResponse = JSON.parse(result.stderr);
        } else {
          throw new Error('No error response provided');
        }
      } catch {
        throw new Error('Error response should be valid JSON');
      }

      if (!errorResponse.guide) {
        throw new Error('Error response should include guide information');
      }
    });
  }

  /**
   * Test guide caching and performance
   */
  async testGuideCachingPerformance() {
    await this.runTest('Guide Caching - Performance Test', async () => {
      const iterations = 5;
      const times = [];

      // Use recursive async function to avoid await-in-loop
      const measureIteration = async (iteration) => {
        if (iteration >= iterations) {
          return;
        }

        const start = Date.now();
        const result = await this.executeCommand('guide');
        const duration = Date.now() - start;

        if (!result.success) {
          throw new Error(`Guide command failed on iteration ${iteration + 1}`);
        }

        times.push(duration);
        return measureIteration(iteration + 1);
      };

      await measureIteration(0);

      // Store performance data
      this.testResults.performance.guideGenerationTime = times;

      // Check that later calls are faster (indicating caching)
      const firstCallTime = times[0];
      const avgLaterCalls =
        times.slice(1).reduce((sum, time) => sum + time, 0) /
        (times.length - 1);

      if (avgLaterCalls > firstCallTime * 1.2) {
        console.warn(
          `Warning: Later guide calls not significantly faster (${avgLaterCalls}ms vs ${firstCallTime}ms)`,
        );
      }

      // Check performance thresholds
      const maxTime = Math.max(...times);
      if (maxTime > this.config.performanceThresholds.guideGeneration) {
        throw new Error(
          `Guide generation too slow: ${maxTime}ms > ${this.config.performanceThresholds.guideGeneration}ms`,
        );
      }
    });
  }

  /**
   * Test concurrent guide access scenarios
   */
  async testConcurrentGuideAccess() {
    await this.runTest('Concurrent Guide Access', async () => {
      const concurrentCalls = 3;
      const promises = [];

      for (let i = 0; i < concurrentCalls; i++) {
        promises.push(this.executeCommand('guide'));
      }

      const results = await Promise.all(promises);

      // All calls should succeed
      for (let i = 0; i < results.length; i++) {
        if (!results[i].success) {
          throw new Error(`Concurrent guide call ${i + 1} failed`);
        }

        if (!results[i].hasGuide) {
          throw new Error(`Concurrent guide call ${i + 1} missing guide`);
        }
      }

      // Guide content should be consistent across all calls
      const firstGuide = results[0].parsed.guide;
      for (let i = 1; i < results.length; i++) {
        const currentGuide = results[i].parsed.guide;
        if (JSON.stringify(firstGuide) !== JSON.stringify(currentGuide)) {
          throw new Error(
            `Guide content inconsistent between concurrent calls`,
          );
        }
      }
    });
  }

  /**
   * Test error scenario guide context appropriateness
   */
  async testErrorContextualGuide() {
    await this.runTest(
      'Error Contextual Guide - Agent Init Context',
      async () => {
        // Test that agent initialization errors get appropriate contextual guide
        const result = await this.executeCommand('claim', ['test_task_id']); // No agent initialized

        if (result.success) {
          throw new Error('Claim without agent should fail');
        }

        let errorResponse;
        try {
          errorResponse = JSON.parse(result.stderr);
        } catch {
          throw new Error('Error response should be valid JSON');
        }

        if (!errorResponse.guide) {
          throw new Error('Error response should include guide');
        }

        // Check that guide has context-appropriate information
        if (
          errorResponse.errorContext !== 'agent-init' &&
          errorResponse.errorContext !== 'task-operations'
        ) {
          console.warn(
            `Warning: Error context may not be optimal: ${errorResponse.errorContext}`,
          );
        }
      },
    );

    await this.runTest(
      'Error Contextual Guide - Task Operations Context',
      async () => {
        // First create an agent
        const initResult = await this.executeCommand('init');
        if (!initResult.success) {
          throw new Error('Failed to create agent for context test');
        }

        this.createdAgents.push(initResult.parsed.agentId);

        // Test task operation error with proper agent
        const result = await this.executeCommand('create', ['{invalid}']);

        if (result.success) {
          throw new Error('Invalid task data should fail');
        }

        let errorResponse;
        try {
          errorResponse = JSON.parse(result.stderr);
        } catch {
          throw new Error('Error response should be valid JSON');
        }

        if (!errorResponse.guide) {
          throw new Error('Error response should include guide');
        }
      },
    );
  }

  /**
   * Test regression - ensure existing functionality still works
   */
  async testRegressionFunctionality() {
    await this.runTest('Regression - Basic Workflow Still Works', async () => {
      // Test complete basic workflow still works

      // 1. Initialize agent
      const initResult = await this.executeCommand('init');
      if (!initResult.success) {
        throw new Error('Agent initialization failed');
      }

      const agentId = initResult.parsed.agentId;
      this.createdAgents.push(agentId);

      // 2. Create task
      const taskData = {
        title: 'Regression Test Task',
        description: 'Testing that basic functionality still works',
        task_type: 'test',
      };

      const createResult = await this.executeCommand('create', [
        JSON.stringify(taskData),
      ]);
      if (!createResult.success) {
        throw new Error('Task creation failed');
      }

      const taskId = createResult.parsed.taskId;
      this.createdTasks.push(taskId);

      // 3. List tasks
      const listResult = await this.executeCommand('list');
      if (!listResult.success) {
        throw new Error('Task listing failed');
      }

      // 4. Check agent status
      const statusResult = await this.executeCommand('status', [agentId]);
      if (!statusResult.success) {
        throw new Error('Status check failed');
      }
    });
  }

  /**
   * Clean up created test resources
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test resources...');

    // Clean up created tasks
    const deletePromises = this.createdTasks.map(async (taskId) => {
      try {
        await this.executeCommand('delete', [taskId]);
      } catch (error) {
        console.warn(
          `Warning: Failed to delete task ${taskId}: ${error.message}`,
        );
      }
    });

    await Promise.allSettled(deletePromises);

    console.log(`Cleaned up ${this.createdTasks.length} test tasks`);
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const passRate = (
      (this.testResults.passed / this.testResults.total) *
      100
    ).toFixed(1);

    const report = {
      summary: {
        title: 'Comprehensive Guide Integration Test Results',
        timestamp: new Date().toISOString(),
        duration: `${totalTime}ms`,
        tests: {
          total: this.testResults.total,
          passed: this.testResults.passed,
          failed: this.testResults.failed,
          passRate: `${passRate}%`,
        },
      },
      performance: {
        guideGeneration: {
          times: this.testResults.performance.guideGenerationTime,
          average:
            this.testResults.performance.guideGenerationTime.length > 0
              ? Math.round(
                this.testResults.performance.guideGenerationTime.reduce(
                  (a, b) => a + b,
                  0,
                ) / this.testResults.performance.guideGenerationTime.length,
              )
              : 0,
          max: Math.max(...this.testResults.performance.guideGenerationTime),
          min: Math.min(...this.testResults.performance.guideGenerationTime),
        },
        memory: {
          usage: this.testResults.performance.memoryUsage,
          totalIncrease: this.testResults.performance.memoryUsage.reduce(
            (a, b) => a + b,
            0,
          ),
          averagePerTest:
            this.testResults.performance.memoryUsage.length > 0
              ? Math.round(
                this.testResults.performance.memoryUsage.reduce(
                  (a, b) => a + b,
                  0,
                ) / this.testResults.performance.memoryUsage.length,
              )
              : 0,
        },
      },
      testDetails: this.testResults.details,
      recommendations: this.generateRecommendations(),
    };

    return report;
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];

    // Performance recommendations
    if (this.testResults.performance.guideGenerationTime.length > 0) {
      const avgTime =
        this.testResults.performance.guideGenerationTime.reduce(
          (a, b) => a + b,
          0,
        ) / this.testResults.performance.guideGenerationTime.length;

      if (avgTime > 1000) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message:
            'Guide generation time is over 1 second on average. Consider optimizing guide content or caching strategy.',
        });
      }
    }

    // Memory recommendations
    const totalMemoryIncrease = this.testResults.performance.memoryUsage.reduce(
      (a, b) => a + b,
      0,
    );
    if (totalMemoryIncrease > 100 * 1024 * 1024) {
      // 100MB
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message:
          'High memory usage detected during testing. Review guide caching implementation for memory leaks.',
      });
    }

    // Test failure recommendations
    if (this.testResults.failed > 0) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: `${this.testResults.failed} test(s) failed. Review failed tests and fix integration issues before deployment.`,
      });
    }

    // Success recommendations
    if (this.testResults.failed === 0) {
      recommendations.push({
        type: 'quality',
        priority: 'info',
        message:
          'All tests passed! Guide integration appears to be working correctly across all API commands.',
      });
    }

    return recommendations;
  }

  /**
   * Run all comprehensive tests
   */
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Guide Integration Testing\n');
    console.log('📊 Test Configuration:');
    console.log(`   • Timeout per test: ${this.config.timeout}ms`);
    console.log(
      `   • Performance thresholds: Guide generation <${this.config.performanceThresholds.guideGeneration}ms`,
    );
    console.log(`   • API path: ${this.apiPath}\n`);

    try {
      // Core API command tests
      console.log('🔄 Testing Core API Command Guide Integration...');
      await this.testCoreCommandGuideIntegration();

      // Performance tests
      console.log('\n⚡ Testing Guide Caching and Performance...');
      await this.testGuideCachingPerformance();

      // Concurrent access tests
      console.log('\n🔀 Testing Concurrent Guide Access...');
      await this.testConcurrentGuideAccess();

      // Error context tests
      console.log('\n🎯 Testing Error Contextual Guide...');
      await this.testErrorContextualGuide();

      // Regression tests
      console.log('\n🔍 Testing Regression Functionality...');
      await this.testRegressionFunctionality();

      // Cleanup
      await this.cleanup();

      // Generate and display report
      console.log('\n📋 TEST RESULTS');
      console.log('═'.repeat(50));

      const report = this.generateReport();

      // Display summary
      console.log(`✅ Tests Passed: ${report.summary.tests.passed}`);
      console.log(`❌ Tests Failed: ${report.summary.tests.failed}`);
      console.log(`📊 Pass Rate: ${report.summary.tests.passRate}`);
      console.log(`⏱️  Total Duration: ${report.summary.duration}`);

      // Display performance metrics
      console.log('\n📈 PERFORMANCE METRICS');
      console.log('─'.repeat(30));
      if (report.performance.guideGeneration.times.length > 0) {
        console.log(
          `Guide Generation - Avg: ${report.performance.guideGeneration.average}ms`,
        );
        console.log(
          `Guide Generation - Range: ${report.performance.guideGeneration.min}ms - ${report.performance.guideGeneration.max}ms`,
        );
      }
      console.log(
        `Memory Usage - Average per test: ${Math.round(report.performance.memory.averagePerTest / 1024)}KB`,
      );

      // Display recommendations
      if (report.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS');
        console.log('─'.repeat(30));
        report.recommendations.forEach((rec, _index) => {
          const emoji =
            rec.priority === 'high'
              ? '🔴'
              : rec.priority === 'medium'
                ? '🟡'
                : '🟢';
          console.log(`${emoji} ${rec.type.toUpperCase()}: ${rec.message}`);
        });
      }

      // Display failed tests details
      if (report.summary.tests.failed > 0) {
        console.log('\n❌ FAILED TESTS DETAILS');
        console.log('─'.repeat(30));
        report.testDetails
          .filter((test) => test.status === 'FAILED')
          .forEach((test) => {
            console.log(`• ${test.name}: ${test.error}`);
          });
      }

      // Save detailed report to file
      const reportPath = path.join(
        __dirname,
        `guide-integration-test-report-${Date.now()}.json`,
      );
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);

      // Exit with appropriate code
      if (report.summary.tests.failed === 0) {
        console.log(
          '\n🎉 ALL TESTS PASSED! Guide integration is working correctly.',
        );
        process.exit(0);
      } else {
        console.log(
          `\n🚨 ${report.summary.tests.failed} TEST(S) FAILED. Review and fix issues before deployment.`,
        );
        process.exit(1);
      }
    } catch (error) {
      console.error('\n💥 FATAL TEST ERROR:', error.message);
      console.error(error.stack);
      process.exit(2);
    }
  }
}

// Execute comprehensive testing
if (require.main === module) {
  const tester = new ComprehensiveGuideIntegrationTester();
  tester.runAllTests().catch((error) => {
    console.error('Fatal error during testing:', error);
    process.exit(2);
  });
}

module.exports = ComprehensiveGuideIntegrationTester;
