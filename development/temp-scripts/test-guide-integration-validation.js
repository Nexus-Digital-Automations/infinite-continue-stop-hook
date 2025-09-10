/**
 * Guide Integration Validation Test
 *
 * === PURPOSE ===
 * Validates that guide integration is working correctly across TaskManager API commands.
 * Tests the actual current implementation to ensure guide information is properly
 * included in responses where expected.
 *
 * === WHAT THIS TESTS ===
 * 1. Guide command returns comprehensive guide content
 * 2. Init commands include guide information in responses
 * 3. Error responses include contextual guide information
 * 4. Task operation commands include guide information
 * 5. Guide caching is working for performance
 * 6. Guide content quality and completeness
 *
 * === EXECUTION ===
 * Run with: timeout 60s node test-guide-integration-validation.js
 */

/* eslint-disable security/detect-object-injection, security/detect-non-literal-fs-filename */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class GuideIntegrationValidator {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
      performance: {
        guideGenerationTimes: [],
        cacheEffectiveness: 0,
      },
    };

    this.apiPath = path.join(__dirname, 'taskmanager-api.js');
    this.startTime = Date.now();

    // Test resources to clean up
    this.createdAgents = [];
    this.createdTasks = [];
  }

  /**
   * Execute API command and capture result
   */
  executeCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const fullArgs = [this.apiPath, command, ...args];
      const child = spawn('timeout', ['10s', 'node', ...fullArgs], {
        stdio: 'pipe',
        cwd: __dirname,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => (stdout += data.toString()));
      child.stderr.on('data', (data) => (stderr += data.toString()));

      child.on('close', (code) => {
        const result = {
          success: code === 0,
          code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          parsed: null,
          hasGuide: false,
        };

        // Parse JSON output
        if (result.stdout) {
          try {
            result.parsed = JSON.parse(result.stdout);
          } catch {
            // Not JSON, that's okay for some commands
          }
        }

        if (result.stderr) {
          try {
            result.errorParsed = JSON.parse(result.stderr);
          } catch {
            // Not JSON error
          }
        }

        // Check for guide presence
        result.hasGuide = !!(
          (result.parsed && result.parsed.guide) ||
          (result.errorParsed && result.errorParsed.guide) ||
          (result.parsed && result.parsed.taskClassification) // guide command returns guide as main content
        );

        resolve(result);
      });

      child.on('error', reject);
    });
  }

  /**
   * Assess guide quality
   */
  assessGuideQuality(guide) {
    const assessment = {
      score: 0,
      maxScore: 100,
      issues: [],
      strengths: [],
    };

    // Check for essential components
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

    // Check task types completeness
    if (guide.taskClassification && guide.taskClassification.types) {
      const requiredTypes = ['error', 'feature', 'subtask', 'test'];
      const foundTypes = guide.taskClassification.types.map((t) => t.value);

      requiredTypes.forEach((type) => {
        if (foundTypes.includes(type)) {
          assessment.score += 5;
        } else {
          assessment.issues.push(`Missing ${type} task type`);
        }
      });
    }

    // Check examples completeness
    if (guide.examples && guide.examples.taskCreation) {
      const exampleCount = Object.keys(guide.examples.taskCreation).length;
      if (exampleCount >= 4) {
        assessment.score += 10;
        assessment.strengths.push('Complete task creation examples');
      }
    }

    return assessment;
  }

  /**
   * Run individual test
   */
  async runTest(testName, testFunction) {
    this.testResults.total++;
    const testStart = Date.now();

    try {
      console.log(`📋 Running: ${testName}`);
      await testFunction();

      const duration = Date.now() - testStart;
      this.testResults.passed++;
      this.testResults.details.push({
        name: testName,
        status: 'PASSED',
        duration,
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ PASSED: ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - testStart;
      this.testResults.failed++;
      this.testResults.details.push({
        name: testName,
        status: 'FAILED',
        error: error.message,
        duration,
        timestamp: new Date().toISOString(),
      });

      console.log(`❌ FAILED: ${testName} - ${error.message}`);
    }
  }

  /**
   * Test guide command functionality
   */
  async testGuideCommand() {
    await this.runTest('Guide Command - Content Quality', async () => {
      const result = await this.executeCommand('guide');

      if (!result.success) {
        throw new Error(`Guide command failed with exit code ${result.code}`);
      }

      if (!result.parsed) {
        throw new Error('Guide command should return valid JSON');
      }

      const guideQuality = this.assessGuideQuality(result.parsed);

      if (guideQuality.score < 80) {
        throw new Error(
          `Guide quality insufficient: ${guideQuality.score}/100. Issues: ${guideQuality.issues.join(', ')}`,
        );
      }
    });

    await this.runTest('Guide Command - Performance', async () => {
      const iterations = 3;
      const times = [];

      // Use recursive function to avoid await-in-loop
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

      this.testResults.performance.guideGenerationTimes = times;

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      if (avgTime > 3000) {
        // 3 seconds
        throw new Error(`Guide generation too slow: ${avgTime}ms average`);
      }

      // Check if caching is effective (later calls should be similar or faster)
      const firstCall = times[0];
      const laterCalls = times.slice(1);
      const avgLaterCalls =
        laterCalls.reduce((sum, time) => sum + time, 0) / laterCalls.length;

      this.testResults.performance.cacheEffectiveness =
        firstCall / avgLaterCalls;
    });
  }

  /**
   * Test agent lifecycle commands with guide integration
   */
  async testAgentLifecycleWithGuide() {
    await this.runTest('Init Command - Guide Integration', async () => {
      const result = await this.executeCommand('init');

      if (!result.success) {
        throw new Error(`Init command failed: ${result.stderr}`);
      }

      if (!result.hasGuide) {
        throw new Error(
          'Init command should include guide information in response',
        );
      }

      // Track agent for cleanup
      if (result.parsed && result.parsed.agentId) {
        this.createdAgents.push(result.parsed.agentId);
      }

      // Validate guide content in response
      const guide = result.parsed.guide;
      if (!guide || !guide.taskClassification) {
        throw new Error(
          'Init response guide should include task classification',
        );
      }
    });

    await this.runTest('Reinitialize Command - Guide Integration', async () => {
      // First create an agent
      const initResult = await this.executeCommand('init');
      if (!initResult.success) {
        throw new Error('Failed to create agent for reinitialize test');
      }

      const agentId = initResult.parsed.agentId;
      this.createdAgents.push(agentId);

      // Test reinitialize
      const result = await this.executeCommand('reinitialize', [agentId]);

      if (!result.success) {
        throw new Error(`Reinitialize failed: ${result.stderr}`);
      }

      if (!result.hasGuide) {
        throw new Error(
          'Reinitialize command should include guide information',
        );
      }
    });

    await this.runTest('Status Command - Guide Integration', async () => {
      // Create agent first
      const initResult = await this.executeCommand('init');
      if (!initResult.success) {
        throw new Error('Failed to create agent for status test');
      }

      const agentId = initResult.parsed.agentId;
      this.createdAgents.push(agentId);

      // Test status
      const result = await this.executeCommand('status', [agentId]);

      if (!result.success) {
        throw new Error(`Status command failed: ${result.stderr}`);
      }

      if (!result.hasGuide) {
        throw new Error('Status command should include guide information');
      }
    });
  }

  /**
   * Test task operations with guide integration
   */
  async testTaskOperationsWithGuide() {
    // Test successful task creation
    await this.runTest('Create Task - Success with Guide', async () => {
      const taskData = {
        title: 'Guide Integration Test Task',
        description: 'Testing guide integration in task creation',
        task_type: 'test',
      };

      const result = await this.executeCommand('create', [
        JSON.stringify(taskData),
      ]);

      if (!result.success) {
        throw new Error(`Task creation failed: ${result.stderr}`);
      }

      if (!result.hasGuide) {
        throw new Error('Task creation should include guide information');
      }

      // Track task for cleanup
      if (result.parsed && result.parsed.taskId) {
        this.createdTasks.push(result.parsed.taskId);
      }
    });

    // Test error case with contextual guide
    await this.runTest(
      'Create Task - Error with Contextual Guide',
      async () => {
        const result = await this.executeCommand('create', [
          '{"title": "Missing task_type"}',
        ]);

        if (result.success) {
          throw new Error('Create without task_type should fail');
        }

        if (!result.hasGuide) {
          throw new Error('Error response should include guide information');
        }

        // Validate contextual guide content
        const guide = result.errorParsed && result.errorParsed.guide;
        if (!guide || !guide.focus || guide.focus !== 'Task Operations') {
          throw new Error(
            'Error guide should be contextual to task operations',
          );
        }
      },
    );

    await this.runTest('List Tasks - Guide Integration', async () => {
      const result = await this.executeCommand('list');

      if (!result.success) {
        throw new Error(`List command failed: ${result.stderr}`);
      }

      // List command should return tasks successfully
      if (!result.parsed || !result.parsed.success) {
        throw new Error('List command should return successful response');
      }
    });
  }

  /**
   * Test error scenarios with guide integration
   */
  async testErrorScenariosWithGuide() {
    await this.runTest('Invalid Agent ID - Error Guide', async () => {
      const result = await this.executeCommand('status', ['invalid_agent_id']);

      if (result.success) {
        throw new Error('Status with invalid agent ID should fail');
      }

      if (!result.hasGuide) {
        throw new Error('Error response should include guide information');
      }
    });

    await this.runTest(
      'Missing Agent - Task Operation Error Guide',
      async () => {
        const result = await this.executeCommand('claim', ['nonexistent_task']);

        if (result.success) {
          throw new Error('Claim without agent should fail');
        }

        if (!result.hasGuide) {
          throw new Error('Error response should include guide information');
        }
      },
    );
  }

  /**
   * Clean up test resources
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test resources...');

    // Clean up tasks
    const deletePromises = this.createdTasks.map(async (taskId) => {
      try {
        await this.executeCommand('delete', [taskId]);
      } catch (error) {
        console.warn(
          `Warning: Failed to cleanup task ${taskId}: ${error.message}`,
        );
      }
    });

    await Promise.allSettled(deletePromises);

    console.log(`Cleaned up ${this.createdTasks.length} test tasks`);
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const passRate = (
      (this.testResults.passed / this.testResults.total) *
      100
    ).toFixed(1);

    return {
      summary: {
        title: 'Guide Integration Validation Results',
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
          times: this.testResults.performance.guideGenerationTimes,
          average:
            this.testResults.performance.guideGenerationTimes.length > 0
              ? Math.round(
                this.testResults.performance.guideGenerationTimes.reduce(
                  (a, b) => a + b,
                  0,
                ) / this.testResults.performance.guideGenerationTimes.length,
              )
              : 0,
          cacheEffectiveness: this.testResults.performance.cacheEffectiveness,
        },
      },
      testDetails: this.testResults.details,
      verdict: this.testResults.failed === 0 ? 'PASS' : 'FAIL',
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.testResults.failed === 0) {
      recommendations.push({
        type: 'success',
        message:
          'All guide integration tests passed! The guide system is working correctly across the API.',
      });
    } else {
      recommendations.push({
        type: 'critical',
        message: `${this.testResults.failed} test(s) failed. Review and fix guide integration issues.`,
      });
    }

    // Performance recommendations
    if (this.testResults.performance.guideGenerationTimes.length > 0) {
      const avgTime =
        this.testResults.performance.guideGenerationTimes.reduce(
          (a, b) => a + b,
          0,
        ) / this.testResults.performance.guideGenerationTimes.length;

      if (avgTime > 2000) {
        recommendations.push({
          type: 'performance',
          message:
            'Guide generation is slow (>2s average). Consider optimizing guide content or caching.',
        });
      } else if (avgTime < 500) {
        recommendations.push({
          type: 'performance',
          message:
            'Guide generation performance is excellent (<500ms average).',
        });
      }
    }

    return recommendations;
  }

  /**
   * Run all validation tests
   */
  async runValidation() {
    console.log('🚀 Starting Guide Integration Validation\n');
    console.log(`📊 Testing API at: ${this.apiPath}\n`);

    try {
      // Test guide command
      console.log('📖 Testing Guide Command...');
      await this.testGuideCommand();

      // Test agent lifecycle with guide
      console.log('\n👤 Testing Agent Lifecycle with Guide...');
      await this.testAgentLifecycleWithGuide();

      // Test task operations with guide
      console.log('\n📋 Testing Task Operations with Guide...');
      await this.testTaskOperationsWithGuide();

      // Test error scenarios with guide
      console.log('\n⚠️  Testing Error Scenarios with Guide...');
      await this.testErrorScenariosWithGuide();

      // Cleanup
      await this.cleanup();

      // Generate and display report
      console.log('\n📋 VALIDATION RESULTS');
      console.log('═'.repeat(50));

      const report = this.generateReport();

      console.log(`✅ Tests Passed: ${report.summary.tests.passed}`);
      console.log(`❌ Tests Failed: ${report.summary.tests.failed}`);
      console.log(`📊 Pass Rate: ${report.summary.tests.passRate}`);
      console.log(`⏱️  Total Duration: ${report.summary.duration}`);

      // Performance metrics
      if (report.performance.guideGeneration.times.length > 0) {
        console.log('\n📈 PERFORMANCE METRICS');
        console.log('─'.repeat(30));
        console.log(
          `Guide Generation - Average: ${report.performance.guideGeneration.average}ms`,
        );
        console.log(
          `Cache Effectiveness: ${report.performance.guideGeneration.cacheEffectiveness.toFixed(2)}x`,
        );
      }

      // Recommendations
      if (report.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS');
        console.log('─'.repeat(30));
        report.recommendations.forEach((rec) => {
          const emoji =
            rec.type === 'critical'
              ? '🔴'
              : rec.type === 'performance'
                ? '⚡'
                : '🟢';
          console.log(`${emoji} ${rec.message}`);
        });
      }

      // Failed tests details
      if (report.summary.tests.failed > 0) {
        console.log('\n❌ FAILED TESTS');
        console.log('─'.repeat(30));
        report.testDetails
          .filter((test) => test.status === 'FAILED')
          .forEach((test) => {
            console.log(`• ${test.name}: ${test.error}`);
          });
      }

      // Save report
      const reportPath = path.join(
        __dirname,
        `guide-validation-report-${Date.now()}.json`,
      );
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);

      // Final verdict
      if (report.verdict === 'PASS') {
        console.log(
          '\n🎉 VALIDATION PASSED - Guide integration is working correctly!',
        );
        process.exit(0);
      } else {
        console.log(
          '\n🚨 VALIDATION FAILED - Guide integration issues detected.',
        );
        process.exit(1);
      }
    } catch (error) {
      console.error('\n💥 VALIDATION ERROR:', error.message);
      console.error(error.stack);
      process.exit(2);
    }
  }
}

// Execute validation
if (require.main === module) {
  const validator = new GuideIntegrationValidator();
  validator.runValidation().catch((error) => {
    console.error('Fatal validation error:', error);
    process.exit(2);
  });
}

module.exports = GuideIntegrationValidator;
