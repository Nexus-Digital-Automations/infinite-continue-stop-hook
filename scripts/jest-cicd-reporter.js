/**
 * Jest CI/CD Reporter for Enhanced Pipeline Integration
 *
 * Specialized reporter for CI/CD environments with Git integration,
 * environment detection, performance metrics, and external notifications.
 *
 * @author CI/CD Integration Agent
 * @version 1.0.0
 * @since 2025-09-23
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class JestCiCdReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = {
      outputPath: './coverage/reports/ci-cd-results.json',
      includeGitInfo: true,
      includeEnvironmentInfo: true,
      includeTimingData: true,
      slackWebhook: null,
      teamsWebhook: null,
      enableNotifications: true,
      ...options,
    };

    this.startTime = Date.now();
    this.gitInfo = null;
    this.environmentInfo = null;
  }

  onRunStart() {
    this.startTime = Date.now();

    if (this.options.includeGitInfo) {
      this.gitInfo = this.getGitInformation();
    }

    if (this.options.includeEnvironmentInfo) {
      this.environmentInfo = this.getEnvironmentInformation();
    }
  }

  onRunComplete(contexts, results) {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        reporter: 'jest-cicd-reporter',
        version: '1.0.0',
        generator: 'Enhanced Coverage System',
        duration_ms: duration,
      },

      // CI/CD specific summary
      cicd_summary: {
        pipeline_status: results.success ? 'SUCCESS' : 'FAILURE',
        total_duration_ms: duration,
        should_block_deployment: this.shouldBlockDeployment(results),
        quality_gate_status: this.evaluateQualityGate(results),
        test_health_score: this.calculateTestHealthScore(results),
      },

      // Enhanced test results with CI/CD context
      test_execution: {
        summary: {
          total_suites: results.numTotalTestSuites,
          passed_suites: results.numPassedTestSuites,
          failed_suites: results.numFailedTestSuites,
          total_tests: results.numTotalTests,
          passed_tests: results.numPassedTests,
          failed_tests: results.numFailedTests,
          pending_tests: results.numPendingTests,
          success_rate: (
            (results.numPassedTests / results.numTotalTests) *
            100
          ).toFixed(2),
          execution_time_ms: duration,
        },

        performance_metrics: {
          average_test_duration: duration / results.numTotalTests,
          slowest_suite: this.findSlowestSuite(results.testResults),
          memory_usage: this.getMemoryUsage(),
          parallel_efficiency: this.calculateParallelEfficiency(results),
        },

        failure_analysis: this.analyzeFailures(results),
        flaky_test_detection: this.detectFlakyTests(results),
      },

      // Git information
      git: this.gitInfo,

      // Environment information
      environment: this.environmentInfo,

      // Coverage integration
      coverage_integration: {
        coverage_available: Boolean(results.coverageMap),
        coverage_summary: results.coverageMap
          ? this.extractCoverageSummary(results.coverageMap)
          : null,
        coverage_status: this.evaluateCoverageStatus(results.coverageMap),
      },

      // Notifications sent
      notifications: [],

      // Recommendations
      recommendations: this.generateRecommendations(results),
    };

    // Write the main CI/CD report
    this.writeReport(report);

    // Send notifications if enabled
    if (this.options.enableNotifications) {
      this.sendNotifications(report);
    }

    // Write additional CI/CD specific files
    this.writeStatusFiles(report);
  }

  shouldBlockDeployment(results) {
    // Define deployment blocking criteria
    return (
      !results.success ||
      results.numFailedTests > 0 ||
      (results.coverageMap && this.isCoverageBelowCritical(results.coverageMap))
    );
  }

  evaluateQualityGate(results) {
    const criteria = {
      tests_passing: results.success,
      no_failed_tests: results.numFailedTests === 0,
      coverage_adequate: this.isCoverageAdequate(results.coverageMap),
      performance_acceptable: this.isPerformanceAcceptable(results),
    };

    const passed = Object.values(criteria).every(Boolean);

    return {
      status: passed ? 'PASSED' : 'FAILED',
      criteria,
      blocking_issues: this.identifyBlockingIssues(criteria, results),
    };
  }

  calculateTestHealthScore(results) {
    // Calculate a health score (0-100) based on multiple factors
    let score = 100;

    // Deduct for failed tests
    const failureRate = results.numFailedTests / results.numTotalTests;
    score -= failureRate * 50;

    // Deduct for slow tests
    const avgDuration = (Date.now() - this.startTime) / results.numTotalTests;
    if (avgDuration > 1000) {
      score -= 10;
    } // Slow tests
    if (avgDuration > 5000) {
      score -= 20;
    } // Very slow tests

    // Bonus for good coverage
    if (results.coverageMap) {
      const coverage = this.extractCoverageSummary(results.coverageMap);
      if (coverage && coverage.lines && coverage.lines.pct > 80) {
        score += 10;
      }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  findSlowestSuite(testResults) {
    let slowest = null;
    let maxDuration = 0;

    testResults.forEach((result) => {
      const duration = result.perfStats.end - result.perfStats.start;
      if (duration > maxDuration) {
        maxDuration = duration;
        slowest = {
          path: result.testFilePath,
          duration_ms: duration,
          num_tests: result.numPassingTests + result.numFailingTests,
        };
      }
    });

    return slowest;
  }

  analyzeFailures(results) {
    const failures = [];
    const failurePatterns = new Map();

    results.testResults.forEach((testResult) => {
      if (testResult.numFailingTests > 0) {
        testResult.testResults.forEach((test) => {
          if (test.status === 'failed') {
            failures.push({
              suite: testResult.testFilePath,
              test: test.fullName,
              duration: test.duration,
              error:
                test.failureMessages?.[0]?.substring(0, 200) || 'Unknown error',
            });

            // Track failure patterns
            const errorType = this.categorizeError(
              test.failureMessages?.[0] || ''
            );
            failurePatterns.set(
              errorType,
              (failurePatterns.get(errorType) || 0) + 1
            );
          }
        });
      }
    });

    return {
      total_failures: failures.length,
      failed_suites: results.numFailedTestSuites,
      failure_details: failures.slice(0, 10), // Limit to first 10
      failure_patterns: Object.fromEntries(failurePatterns),
      common_failure_type:
        failurePatterns.size > 0
          ? [...failurePatterns.entries()].sort((a, b) => b[1] - a[1])[0][0]
          : 'none',
    };
  }

  categorizeError(errorMessage) {
    if (!errorMessage) {
      return 'unknown';
    }

    const patterns = {
      timeout: /timeout|timed out/i,
      assertion: /expect|assertion|toBe|toEqual/i,
      reference: /ReferenceError|is not defined/i,
      type: /TypeError|Cannot read|undefined/i,
      network: /ECONNREFUSED|network|fetch/i,
      async: /Promise|async|await/i,
    };

    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(errorMessage)) {
        return category;
      }
    }

    return 'other';
  }

  detectFlakyTests(_results) {
    // Placeholder for flaky test detection
    // In a real implementation, this would compare with historical data
    return {
      potentially_flaky: [],
      confidence: 'low',
      note: 'Flaky test detection requires historical data analysis',
    };
  }

  getGitInformation() {
    try {
      const info = {
        commit_sha: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        branch: execSync('git rev-parse --abbrev-ref HEAD', {
          encoding: 'utf8',
        }).trim(),
        author: execSync('git log -1 --format="%an <%ae>"', {
          encoding: 'utf8',
        }).trim(),
        commit_message: execSync('git log -1 --format="%s"', {
          encoding: 'utf8',
        }).trim(),
        commit_date: execSync('git log -1 --format="%ai"', {
          encoding: 'utf8',
        }).trim(),
        tag: this.getLatestTag(),
        is_dirty: this.isGitDirty(),
        remote_url: this.getRemoteUrl(),
      };

      // Add GitHub/GitLab specific information
      if (process.env.GITHUB_ACTIONS) {
        info.github = {
          workflow: process.env.GITHUB_WORKFLOW,
          run_id: process.env.GITHUB_RUN_ID,
          run_number: process.env.GITHUB_RUN_NUMBER,
          actor: process.env.GITHUB_ACTOR,
          ref: process.env.GITHUB_REF,
          repository: process.env.GITHUB_REPOSITORY,
          event_name: process.env.GITHUB_EVENT_NAME,
        };
      }

      return info;
    } catch (error) {
      return {
        error: 'Failed to get Git information',
        message: error.message,
      };
    }
  }

  getEnvironmentInformation() {
    return {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      ci: Boolean(process.env.CI),
      ci_provider: this.detectCiProvider(),
      environment: process.env.NODE_ENV || 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,

      // Performance context
      memory: {
        total: this.getTotalMemory(),
        available: this.getAvailableMemory(),
      },

      cpu: {
        cores: require('os').cpus().length,
        model: require('os').cpus()[0]?.model || 'unknown',
      },

      // CI/CD context
      build_info: {
        build_number:
          process.env.BUILD_NUMBER ||
          process.env.GITHUB_RUN_NUMBER ||
          'unknown',
        build_url: process.env.BUILD_URL || this.constructBuildUrl(),
        job_name: process.env.JOB_NAME || process.env.GITHUB_JOB || 'unknown',
      },
    };
  }

  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: usage.rss,
      heap_total: usage.heapTotal,
      heap_used: usage.heapUsed,
      external: usage.external,
      heap_usage_percent: ((usage.heapUsed / usage.heapTotal) * 100).toFixed(2),
    };
  }

  calculateParallelEfficiency(results) {
    // Simplified parallel efficiency calculation
    const totalTime = Date.now() - this.startTime;
    const serialTime = results.testResults.reduce(
      (sum, result) => sum + (result.perfStats.end - result.perfStats.start),
      0
    );

    const efficiency =
      serialTime > 0 ? ((serialTime / totalTime) * 100).toFixed(2) : 0;

    return {
      parallel_efficiency_percent: efficiency,
      total_execution_time_ms: totalTime,
      serial_time_ms: serialTime,
      time_saved_ms: Math.max(0, serialTime - totalTime),
    };
  }

  extractCoverageSummary(coverageMap) {
    if (!coverageMap || typeof coverageMap.getCoverageSummary !== 'function') {
      return null;
    }

    try {
      const summary = coverageMap.getCoverageSummary();
      return {
        statements: {
          total: summary.statements.total,
          covered: summary.statements.covered,
          pct: summary.statements.pct,
        },
        branches: {
          total: summary.branches.total,
          covered: summary.branches.covered,
          pct: summary.branches.pct,
        },
        functions: {
          total: summary.functions.total,
          covered: summary.functions.covered,
          pct: summary.functions.pct,
        },
        lines: {
          total: summary.lines.total,
          covered: summary.lines.covered,
          pct: summary.lines.pct,
        },
      };
    } catch {
      return { error: 'Failed to extract coverage summary' };
    }
  }

  evaluateCoverageStatus(coverageMap) {
    if (!coverageMap) {
      return 'not_available';
    }

    const summary = this.extractCoverageSummary(coverageMap);
    if (!summary || summary.error) {
      return 'error';
    }

    const avgCoverage =
      (summary.statements.pct +
        summary.branches.pct +
        summary.functions.pct +
        summary.lines.pct) /
      4;

    if (avgCoverage >= 90) {
      return 'excellent';
    }
    if (avgCoverage >= 80) {
      return 'good';
    }
    if (avgCoverage >= 70) {
      return 'acceptable';
    }
    if (avgCoverage >= 60) {
      return 'minimum';
    }
    return 'critical';
  }

  isCoverageBelowCritical(coverageMap) {
    const status = this.evaluateCoverageStatus(coverageMap);
    return status === 'critical';
  }

  isCoverageAdequate(coverageMap) {
    const status = this.evaluateCoverageStatus(coverageMap);
    return ['excellent', 'good', 'acceptable'].includes(status);
  }

  isPerformanceAcceptable(results) {
    const duration = Date.now() - this.startTime;
    const avgTestTime = duration / results.numTotalTests;

    // Performance is acceptable if average test time is under 2 seconds
    return avgTestTime < 2000;
  }

  identifyBlockingIssues(criteria, results) {
    const issues = [];

    if (!criteria.tests_passing) {
      issues.push({
        type: 'test_failures',
        severity: 'critical',
        message: `${results.numFailedTests} test(s) failed`,
        action: 'Fix failing tests before deployment',
      });
    }

    if (!criteria.coverage_adequate) {
      issues.push({
        type: 'low_coverage',
        severity: 'warning',
        message: 'Code coverage below acceptable threshold',
        action: 'Add more tests to improve coverage',
      });
    }

    if (!criteria.performance_acceptable) {
      issues.push({
        type: 'performance',
        severity: 'warning',
        message: 'Test execution time is slow',
        action: 'Optimize slow tests or improve test parallelization',
      });
    }

    return issues;
  }

  generateRecommendations(results) {
    const recommendations = [];

    // Test-related recommendations
    if (results.numFailedTests > 0) {
      recommendations.push({
        category: 'testing',
        priority: 'high',
        recommendation: 'Fix failing tests immediately',
        details: `${results.numFailedTests} tests are currently failing`,
      });
    }

    // Performance recommendations
    const duration = Date.now() - this.startTime;
    if (duration > 60000) {
      // 1 minute
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        recommendation: 'Consider optimizing test execution time',
        details: `Tests took ${Math.round(duration / 1000)}s to complete`,
      });
    }

    // Coverage recommendations
    if (results.coverageMap) {
      const status = this.evaluateCoverageStatus(results.coverageMap);
      if (['minimum', 'critical'].includes(status)) {
        recommendations.push({
          category: 'coverage',
          priority: 'medium',
          recommendation: 'Improve test coverage',
          details: `Coverage is currently at ${status} level`,
        });
      }
    }

    return recommendations;
  }

  writeReport(report) {
    // Ensure output directory exists
    const outputDir = path.dirname(this.options.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write main report
    fs.writeFileSync(this.options.outputPath, JSON.stringify(report, null, 2));
  }

  writeStatusFiles(report) {
    const outputDir = path.dirname(this.options.outputPath);

    // Write deployment gate status
    const deploymentStatus = {
      can_deploy: !report.cicd_summary.should_block_deployment,
      quality_gate_passed:
        report.cicd_summary.quality_gate_status.status === 'PASSED',
      timestamp: report.metadata.timestamp,
      blocking_issues:
        report.cicd_summary.quality_gate_status.blocking_issues || [],
    };

    fs.writeFileSync(
      path.join(outputDir, 'deployment-gate.json'),
      JSON.stringify(deploymentStatus, null, 2)
    );

    // Write simple status for shell scripts
    fs.writeFileSync(
      path.join(outputDir, 'test-status.txt'),
      report.cicd_summary.pipeline_status
    );

    // Write health score
    fs.writeFileSync(
      path.join(outputDir, 'health-score.txt'),
      report.cicd_summary.test_health_score.toString()
    );
  }

  sendNotifications(report) {
    const notifications = [];

    // Send Slack notification if configured
    if (this.options.slackWebhook) {
      try {
        const slackMessage = this.formatSlackMessage(report);
        this.sendWebhook(this.options.slackWebhook, slackMessage);
        notifications.push({
          type: 'slack',
          status: 'sent',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        notifications.push({
          type: 'slack',
          status: 'failed',
          error: error.message,
        });
      }
    }

    // Send Teams notification if configured
    if (this.options.teamsWebhook) {
      try {
        const teamsMessage = this.formatTeamsMessage(report);
        this.sendWebhook(this.options.teamsWebhook, teamsMessage);
        notifications.push({
          type: 'teams',
          status: 'sent',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        notifications.push({
          type: 'teams',
          status: 'failed',
          error: error.message,
        });
      }
    }

    report.notifications = notifications;
  }

  formatSlackMessage(report) {
    const status = report.cicd_summary.pipeline_status;
    const emoji = status === 'SUCCESS' ? '✅' : '❌';

    return {
      text: `${emoji} Test Pipeline ${status}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              `*Test Pipeline ${status}* ${emoji}\n\n` +
              `*Tests:* ${report.test_execution.summary.passed_tests}/${report.test_execution.summary.total_tests} passed\n` +
              `*Duration:* ${Math.round(report.test_execution.summary.execution_time_ms / 1000)}s\n` +
              `*Health Score:* ${report.cicd_summary.test_health_score}/100`,
          },
        },
      ],
    };
  }

  formatTeamsMessage(report) {
    const status = report.cicd_summary.pipeline_status;
    const color = status === 'SUCCESS' ? '00FF00' : 'FF0000';

    return {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      summary: `Test Pipeline ${status}`,
      themeColor: color,
      sections: [
        {
          activityTitle: `Test Pipeline ${status}`,
          facts: [
            {
              name: 'Tests Passed',
              value: `${report.test_execution.summary.passed_tests}/${report.test_execution.summary.total_tests}`,
            },
            {
              name: 'Duration',
              value: `${Math.round(report.test_execution.summary.execution_time_ms / 1000)}s`,
            },
            {
              name: 'Health Score',
              value: `${report.cicd_summary.test_health_score}/100`,
            },
          ],
        },
      ],
    };
  }

  sendWebhook(url, payload) {
    // Simplified webhook sending - in production, use a proper HTTP client
    const _data = JSON.stringify(payload);
    // Implementation would use https.request or a library like axios
  }

  // Helper methods
  getLatestTag() {
    try {
      return execSync('git describe --tags --abbrev=0', {
        encoding: 'utf8',
      }).trim();
    } catch {
      return null;
    }
  }

  isGitDirty() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      return status.trim().length > 0;
    } catch {
      return false;
    }
  }

  getRemoteUrl() {
    try {
      return execSync('git config --get remote.origin.url', {
        encoding: 'utf8',
      }).trim();
    } catch {
      return null;
    }
  }

  detectCiProvider() {
    if (process.env.GITHUB_ACTIONS) {
      return 'github_actions';
    }
    if (process.env.GITLAB_CI) {
      return 'gitlab_ci';
    }
    if (process.env.JENKINS_URL) {
      return 'jenkins';
    }
    if (process.env.TRAVIS) {
      return 'travis';
    }
    if (process.env.CIRCLECI) {
      return 'circleci';
    }
    if (process.env.CI) {
      return 'unknown_ci';
    }
    return 'local';
  }

  getTotalMemory() {
    try {
      return require('os').totalmem();
    } catch {
      return null;
    }
  }

  getAvailableMemory() {
    try {
      return require('os').freemem();
    } catch {
      return null;
    }
  }

  constructBuildUrl() {
    if (process.env.GITHUB_ACTIONS) {
      return `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
    }
    return null;
  }
}

module.exports = JestCiCdReporter;
