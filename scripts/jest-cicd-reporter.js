/**
 * Jest CI/CD Reporter for Enhanced Pipeline Integration
 *
 * Advanced Jest reporter that generates CI/CD-optimized reports with
 * environment context, git information, and webhook notifications.
 *
 * @author CI/CD Integration Agent
 * @version 2.0.0
 * @since 2025-09-23
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class JestCiCdReporter {
  constructor(globalConfig, options = {}) {
    this.globalConfig = globalConfig;
    this.options = {
      outputPath: options.outputPath || './coverage/reports/ci-cd-results.json',
      includeGitInfo: options.includeGitInfo !== false,
      includeEnvironmentInfo: options.includeEnvironmentInfo !== false,
      includeTimingData: options.includeTimingData !== false,
      slackWebhook: options.slackWebhook,
      teamsWebhook: options.teamsWebhook,
      ...options,
    };

    this.startTime = Date.now();
  }

  onRunStart() {
    this.startTime = Date.now();
  }

  onRunComplete(contexts, results) {
    const report = this.generateCiCdReport(results);
    this.writeReport(report);
    this.sendNotifications(report);
  }

  generateCiCdReport(results) {
    const endTime = Date.now();
    const report = {
      pipeline: {
        id: process.env.GITHUB_RUN_ID || process.env.BUILD_ID || 'local',
        number: process.env.GITHUB_RUN_NUMBER || process.env.BUILD_NUMBER || '0',
        url: this.buildPipelineUrl(),
        trigger: this.determineTrigger(),
        actor: process.env.GITHUB_ACTOR || process.env.BUILD_USER || 'unknown',
      },
      results: {
        success: results.success,
        summary: this.buildResultSummary(results),
        timing: {
          start: this.startTime,
          end: endTime,
          duration: endTime - this.startTime,
          testRuntime: results.startTime ? (endTime - results.startTime) : 0,
        },
        quality: this.assessQuality(results),
      },
      environment: this.options.includeEnvironmentInfo ? this.gatherEnvironmentInfo() : null,
      git: this.options.includeGitInfo ? this.gatherGitInfo() : null,
      coverage: this.processCoverageForCiCd(results.coverageMap),
      artifacts: this.identifyArtifacts(),
      metadata: {
        generator: 'Jest CI/CD Reporter v2.0.0',
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
      },
    };

    return report;
  }

  buildResultSummary(results) {
    return {
      total: {
        testSuites: results.numTotalTestSuites,
        tests: results.numTotalTests,
      },
      passed: {
        testSuites: results.numPassedTestSuites,
        tests: results.numPassedTests,
      },
      failed: {
        testSuites: results.numFailedTestSuites,
        tests: results.numFailedTests,
      },
      pending: {
        testSuites: results.numPendingTestSuites,
        tests: results.numPendingTests,
      },
      todo: {
        tests: results.numTodoTests || 0,
      },
      success_rate: {
        testSuites: results.numTotalTestSuites > 0 ?
          Math.round((results.numPassedTestSuites / results.numTotalTestSuites) * 100) : 0,
        tests: results.numTotalTests > 0 ?
          Math.round((results.numPassedTests / results.numTotalTests) * 100) : 0,
      },
    };
  }

  buildPipelineUrl() {
    if (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID) {
      return `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
    }

    if (process.env.CI_PIPELINE_URL) {
      return process.env.CI_PIPELINE_URL;
    }

    return null;
  }

  determineTrigger() {
    if (process.env.GITHUB_EVENT_NAME) {
      return {
        type: process.env.GITHUB_EVENT_NAME,
        ref: process.env.GITHUB_REF,
        ref_name: process.env.GITHUB_REF_NAME,
        head_ref: process.env.GITHUB_HEAD_REF,
      };
    }

    return {
      type: process.env.CI ? 'ci' : 'local',
      ref: null,
      ref_name: null,
      head_ref: null,
    };
  }

  assessQuality(results) {
    const quality = {
      status: 'unknown',
      score: 0,
      factors: {},
    };

    // Test success factor (40% weight)
    const testSuccessRate = results.numTotalTests > 0 ?
      (results.numPassedTests / results.numTotalTests) : 0;
    quality.factors.test_success = {
      rate: testSuccessRate,
      weight: 0.4,
      score: testSuccessRate * 100,
    };

    // Coverage factor (30% weight) - will be 0 if no coverage
    let coverageRate = 0;
    if (results.coverageMap && typeof results.coverageMap.getCoverageSummary === 'function') {
      const summary = results.coverageMap.getCoverageSummary();
      coverageRate = summary.lines.pct / 100;
    }
    quality.factors.coverage = {
      rate: coverageRate,
      weight: 0.3,
      score: coverageRate * 100,
    };

    // Performance factor (20% weight)
    const avgTestTime = results.numTotalTests > 0 ?
      (Date.now() - results.startTime) / results.numTotalTests : 0;
    const performanceScore = Math.max(0, Math.min(100, 100 - (avgTestTime / 10))); // Penalize if >1s per test
    quality.factors.performance = {
      avg_test_time_ms: avgTestTime,
      weight: 0.2,
      score: performanceScore,
    };

    // Stability factor (10% weight)
    const stabilityRate = results.numFailedTests === 0 ? 1 : 0.5; // Binary for now
    quality.factors.stability = {
      rate: stabilityRate,
      weight: 0.1,
      score: stabilityRate * 100,
    };

    // Calculate overall score
    quality.score = Math.round(
      (quality.factors.test_success.score * quality.factors.test_success.weight) +
      (quality.factors.coverage.score * quality.factors.coverage.weight) +
      (quality.factors.performance.score * quality.factors.performance.weight) +
      (quality.factors.stability.score * quality.factors.stability.weight),
    );

    // Determine status
    if (quality.score >= 90) {quality.status = 'excellent';} else if (quality.score >= 75) {quality.status = 'good';} else if (quality.score >= 60) {quality.status = 'fair';} else {quality.status = 'poor';}

    return quality;
  }

  gatherEnvironmentInfo() {
    return {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          heap_used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heap_total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
      },
      system: {
        hostname: require('os').hostname(),
        cpu_count: require('os').cpus().length,
        total_memory_gb: Math.round(require('os').totalmem() / 1024 / 1024 / 1024),
        load_average: require('os').loadavg(),
        uptime: require('os').uptime(),
      },
      ci: {
        is_ci: process.env.CI === 'true',
        provider: this.detectCiProvider(),
        runner: process.env.RUNNER_OS || process.env.CI_RUNNER_DESCRIPTION || 'unknown',
      },
      environment_variables: this.filterEnvironmentVariables(),
    };
  }

  detectCiProvider() {
    if (process.env.GITHUB_ACTIONS) {return 'github_actions';}
    if (process.env.GITLAB_CI) {return 'gitlab_ci';}
    if (process.env.CIRCLECI) {return 'circle_ci';}
    if (process.env.TRAVIS) {return 'travis_ci';}
    if (process.env.JENKINS_URL) {return 'jenkins';}
    if (process.env.BUILDKITE) {return 'buildkite';}
    return 'unknown';
  }

  filterEnvironmentVariables() {
    const sensitivePatterns = ['token', 'secret', 'key', 'password', 'credential'];
    const relevant = {};

    Object.keys(process.env).forEach(key => {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitivePatterns.some(pattern => lowerKey.includes(pattern));

      if (!isSensitive && (
        lowerKey.startsWith('github_') ||
        lowerKey.startsWith('ci_') ||
        lowerKey.startsWith('npm_') ||
        lowerKey.startsWith('node_') ||
        ['CI', 'RUNNER_OS', 'BUILD_NUMBER'].includes(key)
      )) {
        relevant[key] = process.env[key];
      }
    });

    return relevant;
  }

  gatherGitInfo() {
    try {
      return {
        commit: {
          sha: this.getGitValue('rev-parse HEAD'),
          short_sha: this.getGitValue('rev-parse --short HEAD'),
          message: this.getGitValue('log -1 --pretty=format:%s'),
          author: this.getGitValue('log -1 --pretty=format:%an'),
          author_email: this.getGitValue('log -1 --pretty=format:%ae'),
          date: this.getGitValue('log -1 --pretty=format:%ai'),
        },
        branch: {
          current: this.getGitValue('rev-parse --abbrev-ref HEAD'),
          remote: this.getGitValue('rev-parse --abbrev-ref @{upstream}').split('/'),
        },
        repository: {
          remote_url: this.getGitValue('config --get remote.origin.url'),
          is_dirty: this.getGitValue('status --porcelain').length > 0,
          tag: this.getGitValue('describe --tags --exact-match 2>/dev/null', true),
        },
      };
    } catch (error) {
      console.warn('⚠️ Could not gather git information:', error.message);
      return null;
    }
  }

  getGitValue(command, allowError = false) {
    try {
      return execSync(`git ${command}`, { encoding: 'utf8' }).trim();
    } catch (error) {
      if (allowError) {return null;}
      throw error;
    }
  }

  processCoverageForCiCd(coverageMap) {
    if (!coverageMap || typeof coverageMap.getCoverageSummary !== 'function') {
      return null;
    }

    const summary = coverageMap.getCoverageSummary();
    return {
      summary: {
        lines: {
          total: summary.lines.total,
          covered: summary.lines.covered,
          percentage: Math.round(summary.lines.pct * 100) / 100,
        },
        statements: {
          total: summary.statements.total,
          covered: summary.statements.covered,
          percentage: Math.round(summary.statements.pct * 100) / 100,
        },
        functions: {
          total: summary.functions.total,
          covered: summary.functions.covered,
          percentage: Math.round(summary.functions.pct * 100) / 100,
        },
        branches: {
          total: summary.branches.total,
          covered: summary.branches.covered,
          percentage: Math.round(summary.branches.pct * 100) / 100,
        },
      },
      threshold_met: this.checkCoverageThresholds(summary),
      trend: this.analyzeCoverageTrend(),
    };
  }

  checkCoverageThresholds(summary) {
    // Default thresholds - should match jest.config.js
    const thresholds = {
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 75,
    };

    return {
      lines: summary.lines.pct >= thresholds.lines,
      statements: summary.statements.pct >= thresholds.statements,
      functions: summary.functions.pct >= thresholds.functions,
      branches: summary.branches.pct >= thresholds.branches,
      overall: summary.lines.pct >= thresholds.lines &&
               summary.statements.pct >= thresholds.statements &&
               summary.functions.pct >= thresholds.functions &&
               summary.branches.pct >= thresholds.branches,
    };
  }

  analyzeCoverageTrend() {
    // Placeholder for coverage trend analysis
    // Could read historical coverage data and compare
    return {
      direction: 'stable',
      change_percent: 0,
      historical_data_available: false,
    };
  }

  identifyArtifacts() {
    const artifacts = [];

    // Coverage artifacts
    if (fs.existsSync('./coverage')) {
      artifacts.push({
        type: 'coverage',
        path: './coverage',
        description: 'Test coverage reports (HTML, LCOV, JSON)',
      });
    }

    // Test result artifacts
    if (fs.existsSync('./coverage/reports')) {
      artifacts.push({
        type: 'test_results',
        path: './coverage/reports',
        description: 'Test execution reports (JUnit, JSON)',
      });
    }

    // Performance artifacts
    if (fs.existsSync('./test-performance')) {
      artifacts.push({
        type: 'performance',
        path: './test-performance',
        description: 'Performance test results and analysis',
      });
    }

    return artifacts;
  }

  writeReport(report) {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(this.options.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write full CI/CD report
      fs.writeFileSync(this.options.outputPath, JSON.stringify(report, null, 2));

      // Write pipeline summary for quick access
      const summaryPath = this.options.outputPath.replace('.json', '-pipeline-summary.json');
      const summary = {
        pipeline: report.pipeline,
        success: report.results.success,
        quality: report.results.quality,
        timing: report.results.timing,
        coverage: report.coverage?.summary || null,
      };
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

      console.log(`🚀 CI/CD test report written to: ${this.options.outputPath}`);

    } catch (error) {
      console.error('❌ Failed to write CI/CD test report:', error.message);
    }
  }

  async sendNotifications(report) {
    if (this.options.slackWebhook) {
      await this.sendSlackNotification(report);
    }

    if (this.options.teamsWebhook) {
      await this.sendTeamsNotification(report);
    }
  }

  async sendSlackNotification(report) {
    try {
      const payload = {
        text: `Test Results: ${report.results.success ? '✅ PASSED' : '❌ FAILED'}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Test Results*: ${report.results.success ? '✅ PASSED' : '❌ FAILED'}\n*Quality Score*: ${report.results.quality.score}/100 (${report.results.quality.status})`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Tests*: ${report.results.summary.passed.tests}/${report.results.summary.total.tests} passed`,
              },
              {
                type: 'mrkdwn',
                text: `*Duration*: ${Math.round(report.results.timing.duration / 1000)}s`,
              },
            ],
          },
        ],
      };

      // Send webhook (implementation would depend on HTTP client availability)
      console.log('📤 Slack notification prepared (webhook sending would require HTTP client)');

    } catch (error) {
      console.warn('⚠️ Failed to send Slack notification:', error.message);
    }
  }

  async sendTeamsNotification(report) {
    try {
      const payload = {
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
              type: 'AdaptiveCard',
              body: [
                {
                  type: 'TextBlock',
                  size: 'Medium',
                  weight: 'Bolder',
                  text: `Test Results: ${report.results.success ? '✅ PASSED' : '❌ FAILED'}`,
                },
                {
                  type: 'FactSet',
                  facts: [
                    {
                      title: 'Quality Score',
                      value: `${report.results.quality.score}/100 (${report.results.quality.status})`,
                    },
                    {
                      title: 'Tests Passed',
                      value: `${report.results.summary.passed.tests}/${report.results.summary.total.tests}`,
                    },
                    {
                      title: 'Duration',
                      value: `${Math.round(report.results.timing.duration / 1000)}s`,
                    },
                  ],
                },
              ],
            },
          },
        ],
      };

      // Send webhook (implementation would depend on HTTP client availability)
      console.log('📤 Teams notification prepared (webhook sending would require HTTP client)');

    } catch (error) {
      console.warn('⚠️ Failed to send Teams notification:', error.message);
    }
  }
}

module.exports = JestCiCdReporter;
